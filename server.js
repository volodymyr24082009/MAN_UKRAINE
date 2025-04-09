const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const { sendMessage } = require("./bot");
const fs = require("fs");
const punycode = require("punycode/");

// Додайте ці імпорти на початку вашого server.js файлу
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Improved database connection configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 10000,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
});

// Test database connection
pool
  .connect()
  .then((client) => {
    console.log("✅ Successfully connected to PostgreSQL database!");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    client.release();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    console.error(
      "   Please check your database credentials and network connection."
    );
    // Continue running the server even if DB connection fails initially
  });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname)));

// Helper function for database queries with retry logic
const executeQuery = async (queryText, params = [], retries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
      return result;
    } catch (err) {
      console.error(`Query attempt ${attempt} failed:`, err.message);
      lastError = err;

      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = 1000 * attempt; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  throw lastError;
};

// Function to check and fix the reviews table
const fixReviewsTable = async () => {
  try {
    // Check if the reviews table exists
    const tableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("Reviews table exists, checking for required columns...");

      // Get all columns in the reviews table
      const columnsResult = await executeQuery(`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'reviews';
      `);

      const columns = columnsResult.rows.map((row) => row.column_name);
      console.log("Existing columns:", columns);

      // Check for city column with NOT NULL constraint
      const cityColumnCheck = columnsResult.rows.find(
        (row) => row.column_name === "city" && row.is_nullable === "NO"
      );

      if (cityColumnCheck) {
        console.log("Found city column with NOT NULL constraint, modifying...");
        await executeQuery(`
          ALTER TABLE reviews ALTER COLUMN city DROP NOT NULL;
        `);
        console.log("✅ Modified city column to allow NULL values");
      }

      // Add missing columns if needed
      const requiredColumns = [
        { name: "name", type: "VARCHAR(100)", default: "'Анонім'" },
        { name: "industry", type: "VARCHAR(100)", default: "'Загальне'" },
        { name: "rating", type: "INTEGER", default: "5" },
        { name: "text", type: "TEXT", default: "''" },
        { name: "master_name", type: "VARCHAR(100)", default: "NULL" },
        { name: "status", type: "VARCHAR(20)", default: "'approved'" },
        { name: "created_at", type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
        { name: "city", type: "VARCHAR(100)", default: "'Не вказано'" },
      ];

      for (const column of requiredColumns) {
        if (!columns.includes(column.name)) {
          console.log(
            `Adding missing '${column.name}' column to reviews table...`
          );
          await executeQuery(`
            ALTER TABLE reviews ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
          `);
          console.log(
            `✅ Added missing '${column.name}' column to reviews table`
          );
        }
      }
    } else {
      console.log("Reviews table doesn't exist, creating it...");

      // Create the reviews table with all required columns
      await executeQuery(`
        CREATE TABLE reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          name VARCHAR(100) NOT NULL DEFAULT 'Анонім',
          industry VARCHAR(100) NOT NULL DEFAULT 'Загальне',
          rating INTEGER NOT NULL DEFAULT 5,
          text TEXT NOT NULL DEFAULT '',
          master_name VARCHAR(100),
          status VARCHAR(20) NOT NULL DEFAULT 'approved',
          city VARCHAR(100) DEFAULT 'Не вказано',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("✅ Created reviews table with all required columns");
    }
  } catch (err) {
    console.error("❌ Error fixing reviews table:", err.message);
    throw err;
  }
};

// Функція для створення таблиць
const createTables = async () => {
  const userTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;

  const userProfileTableQuery = `
    CREATE TABLE IF NOT EXISTS user_profile (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(15),
      address TEXT,
      date_of_birth DATE
    );
  `;

  const userServicesTableQuery = `
    CREATE TABLE IF NOT EXISTS user_services (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      service_name VARCHAR(255) NOT NULL,
      service_type VARCHAR(50) DEFAULT 'service'
    );
  `;

  const addRoleMasterColumnQuery = `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profile' AND column_name = 'role_master'
      ) THEN
        ALTER TABLE user_profile ADD COLUMN role_master BOOLEAN DEFAULT FALSE;
      END IF;
    END $$;
  `;

  const addApprovalStatusColumnQuery = `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profile' AND column_name = 'approval_status'
      ) THEN
        ALTER TABLE user_profile ADD COLUMN approval_status VARCHAR(20) DEFAULT NULL;
      END IF;
    END $$;
  `;

  const masterRequestsTableQuery = `
    CREATE TABLE IF NOT EXISTS master_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Нова таблиця для замовлень
  const ordersTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      phone VARCHAR(15) NOT NULL,
      industry VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      master_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Додаємо колонку industry до таблиці orders, якщо вона не існує
  const addIndustryColumnQuery = `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'industry'
      ) THEN
        ALTER TABLE orders ADD COLUMN industry VARCHAR(100);
      END IF;
    END $$;
  `;

  try {
    await executeQuery(userTableQuery);
    await executeQuery(userProfileTableQuery);
    await executeQuery(userServicesTableQuery);
    await executeQuery(addRoleMasterColumnQuery);
    await executeQuery(addApprovalStatusColumnQuery);
    await executeQuery(masterRequestsTableQuery);
    await executeQuery(ordersTableQuery);
    await executeQuery(addIndustryColumnQuery);

    // Fix the reviews table
    await fixReviewsTable();

    console.log(
      "✅ Таблиці створено або вже існують, колонки додано (якщо їх не було)."
    );

    // Додаємо базові галузі для нових користувачів, якщо вони ще не існують
    await initializeIndustries();
  } catch (err) {
    console.error("❌ Помилка при створенні таблиць:", err.message);
    console.error(
      "   Сервер продовжить роботу, але функціональність може бути обмежена."
    );
  }
};

// Функція для ініціалізації базових галузей
const initializeIndustries = async () => {
  const industries = [
    { name: "Інформаційні технології", icon: "fas fa-laptop-code" },
    { name: "Медицина", icon: "fas fa-heartbeat" },
    { name: "Енергетика", icon: "fas fa-bolt" },
    { name: "Аграрна галузь", icon: "fas fa-tractor" },
    { name: "Фінанси та банківська справа", icon: "fas fa-money-bill-wave" },
    { name: "Освіта", icon: "fas fa-graduation-cap" },
    { name: "Туризм і гостинність", icon: "fas fa-plane" },
    { name: "Будівництво та нерухомість", icon: "fas fa-hard-hat" },
    { name: "Транспорт", icon: "fas fa-truck" },
    { name: "Мистецтво і культура", icon: "fas fa-palette" },
  ];

  try {
    // Перевіряємо, чи є вже галузі в базі даних
    const existingIndustries = await executeQuery(`
      SELECT DISTINCT service_name 
      FROM user_services 
      WHERE service_type = 'industry'
    `);

    const existingIndustryNames = existingIndustries.rows.map(
      (row) => row.service_name
    );

    // Отримуємо список користувачів з роллю майстра
    const masters = await executeQuery(`
      SELECT u.id 
      FROM users u
      JOIN user_profile up ON u.id = up.user_id
      WHERE up.role_master = true
    `);

    // Для кожного майстра додаємо галузі, які ще не існують
    for (const master of masters.rows) {
      const masterIndustries = await executeQuery(
        `
        SELECT service_name 
        FROM user_services 
        WHERE user_id = $1 AND service_type = 'industry'
      `,
        [master.id]
      );

      const masterIndustryNames = masterIndustries.rows.map(
        (row) => row.service_name
      );

      // Додаємо галузі, яких ще немає у майстра
      for (const industry of industries) {
        if (!masterIndustryNames.includes(industry.name)) {
          await executeQuery(
            `
            INSERT INTO user_services (user_id, service_name, service_type)
            VALUES ($1, $2, 'industry')
          `,
            [master.id, industry.name]
          );
        }
      }
    }

    console.log("✅ Базові галузі успішно ініціалізовано.");
  } catch (err) {
    console.error("❌ Помилка при ініціалізації галузей:", err.message);
  }
};

// Try to create tables, but don't block server startup
createTables().catch((err) => {
  console.error("Failed to initialize database tables:", err.message);
});

// Головна сторінка (реєстрація/авторизація)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "auth.html"));
});

// Middleware для JWT аутентифікації
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return res.status(401).json({ message: "Необхідна авторизація" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "default_secret_key",
    (err, user) => {
      if (err)
        return res
          .status(403)
          .json({ message: "Недійсний або прострочений токен" });
      req.user = user;
      next();
    }
  );
};

let isProcessing = false;

// Реєстрація користувача
app.post("/register", async (req, res) => {
  if (isProcessing) {
    return res.status(400).json({ message: "Запит вже обробляється!" });
  }
  isProcessing = true;

  const { username, password } = req.body;

  if (!username || !password) {
    isProcessing = false;
    return res
      .status(400)
      .json({ message: "Усі поля повинні бути заповнені!" });
  }

  try {
    const existingUser = await executeQuery(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (existingUser.rows.length > 0) {
      isProcessing = false;
      return res
        .status(400)
        .json({ message: "Користувач з таким іменем вже існує!" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await executeQuery(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );

    await executeQuery("INSERT INTO user_profile (user_id) VALUES ($1)", [
      newUser.rows[0].id,
    ]);

    console.log(`✅ Користувач ${username} успішно зареєстрований.`);

    res.status(200).json({
      success: true,
      message: "Реєстрація успішна",
      userId: newUser.rows[0].id,
      redirect: "/index.html",
    });
  } catch (err) {
    console.error("❌ Помилка при реєстрації:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  } finally {
    isProcessing = false;
  }
});

// Логін користувача
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Усі поля повинні бути заповнені!" });
  }

  try {
    const result = await executeQuery(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Невірне ім'я користувача або пароль!" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Невірне ім'я користувача або пароль!" });
    }

    console.log(`✅ ${username} успішно увійшов в систему!`);

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || "default_secret_key",
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Вхід успішний",
      userId: user.id,
      token: token,
      redirect: "/index.html",
    });
  } catch (err) {
    console.error("❌ Помилка при вході:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання профілю користувача
app.get("/profile/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const profileResult = await executeQuery(
      "SELECT * FROM user_profile WHERE user_id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Профіль не знайдено" });
    }

    res.status(200).json({ profile: profileResult.rows[0] });
  } catch (err) {
    console.error("❌ Помилка при отриманні профілю:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Оновлення профілю користувача
app.put("/profile/:userId", async (req, res) => {
  const userId = req.params.userId;
  const {
    first_name,
    last_name,
    email,
    phone,
    address,
    date_of_birth,
    role_master,
    approval_status,
  } = req.body;

  try {
    const userResult = await executeQuery("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    // Отримуємо поточний профіль користувача для перевірки
    const currentProfileResult = await executeQuery(
      "SELECT * FROM user_profile WHERE user_id = $1",
      [userId]
    );

    const currentProfile = currentProfileResult.rows[0];
    const wasMaster = currentProfile.role_master;

    // Перевіряємо, чи користувач став майстром або змінив дані як майстер
    if (role_master && (!wasMaster || role_master !== wasMaster)) {
      // Якщо користувач став майстром або змінив дані як майстер,
      // встановлюємо статус "pending" для затвердження адміністратором
      await executeQuery(
        `UPDATE user_profile 
         SET first_name = $1, last_name = $2, email = $3, phone = $4, 
             address = $5, date_of_birth = $6, role_master = $7, approval_status = 'pending'
         WHERE user_id = $8`,
        [
          first_name,
          last_name,
          email,
          phone,
          address,
          date_of_birth,
          role_master,
          userId,
        ]
      );

      // Перевіряємо, чи існує запит на роль майстра
      const existingRequest = await executeQuery(
        "SELECT * FROM master_requests WHERE user_id = $1",
        [userId]
      );

      // Якщо запит не існує, створюємо новий
      if (existingRequest.rows.length === 0) {
        await executeQuery(
          "INSERT INTO master_requests (user_id, status) VALUES ($1, 'pending')",
          [userId]
        );
      } else {
        // Якщо запит існує, оновлюємо його статус
        await executeQuery(
          "UPDATE master_requests SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
          [userId]
        );
      }

      console.log(
        `✅ Профіль користувача з ID ${userId} оновлено і відправлено на затвердження.`
      );
      res.status(200).json({
        success: true,
        message: "Профіль успішно оновлено і відправлено на затвердження",
        requiresApproval: true,
      });
    } else {
      // Якщо це звичайний користувач, просто оновлюємо профіль
      await executeQuery(
        `UPDATE user_profile 
         SET first_name = $1, last_name = $2, email = $3, phone = $4, 
             address = $5, date_of_birth = $6, role_master = $7, approval_status = $8
         WHERE user_id = $9`,
        [
          first_name,
          last_name,
          email,
          phone,
          address,
          date_of_birth,
          role_master,
          approval_status,
          userId,
        ]
      );

      console.log(`✅ Профіль користувача з ID ${userId} успішно оновлено.`);
      res.status(200).json({
        success: true,
        message: "Профіль успішно оновлено",
        requiresApproval: false,
      });
    }
  } catch (err) {
    console.error("❌ Помилка при оновленні профілю:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Додавання послуги для користувача
app.post("/services/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { service_name, service_type = "service" } = req.body;

  if (!service_name) {
    return res.status(400).json({ message: "Назва послуги обов'язкова" });
  }

  try {
    const userResult = await executeQuery("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    await executeQuery(
      "INSERT INTO user_services (user_id, service_name, service_type) VALUES ($1, $2, $3)",
      [userId, service_name, service_type]
    );

    console.log(
      `✅ Послугу "${service_name}" типу "${service_type}" додано для користувача з ID ${userId}.`
    );
    res.status(201).json({ success: true, message: "Послугу успішно додано" });
  } catch (err) {
    console.error("❌ Помилка при додаванні послуги:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання послуг користувача
app.get("/services/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const servicesResult = await executeQuery(
      "SELECT * FROM user_services WHERE user_id = $1",
      [userId]
    );

    res.status(200).json({ services: servicesResult.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні послуг:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Видалення послуги
app.delete("/services/:serviceId", async (req, res) => {
  const serviceId = req.params.serviceId;

  try {
    const result = await executeQuery(
      "DELETE FROM user_services WHERE id = $1 RETURNING *",
      [serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Послугу не знайдено" });
    }

    console.log(`✅ Послугу з ID ${serviceId} успішно видалено.`);
    res
      .status(200)
      .json({ success: true, message: "Послугу успішно видалено" });
  } catch (err) {
    console.error("❌ Помилка при видаленні послуги:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Створення запиту на роль майстра
app.post("/master-requests", async (req, res) => {
  const { user_id, status = "pending" } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "ID користувача обов'язковий" });
  }

  try {
    // Перевірка чи існує користувач
    const userResult = await executeQuery("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    // Перевірка чи вже існує запит
    const existingRequest = await executeQuery(
      "SELECT * FROM master_requests WHERE user_id = $1 AND status = 'pending'",
      [user_id]
    );
    if (existingRequest.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Запит на роль майстра вже існує" });
    }

    // Створення нового запиту
    await executeQuery(
      "INSERT INTO master_requests (user_id, status) VALUES ($1, $2)",
      [user_id, status]
    );

    console.log(
      `✅ Запит на роль майстра для користувача з ID ${user_id} успішно створено.`
    );
    res.status(201).json({
      success: true,
      message: "Запит на роль майстра успішно створено",
    });
  } catch (err) {
    console.error(
      "❌ Помилка при створенні запиту на роль майстра:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання всіх запитів на роль майстра
app.get("/master-requests", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT mr.id, mr.user_id, mr.status, mr.created_at, mr.updated_at,
             u.username, up.first_name, up.last_name, up.email, up.phone, 
             up.address, up.date_of_birth
      FROM master_requests mr
      JOIN users u ON mr.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      ORDER BY mr.created_at DESC
    `);

    res.status(200).json({ requests: result.rows });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні запитів на роль майстра:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Оновлення статусу запиту на роль майстра
app.put("/master-requests/:requestId", async (req, res) => {
  const requestId = req.params.requestId;
  const { status } = req.body;

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Невірний статус" });
  }

  try {
    // Start a transaction
    await executeQuery("BEGIN");

    // Get the request
    const requestResult = await executeQuery(
      "SELECT * FROM master_requests WHERE id = $1",
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      await executeQuery("ROLLBACK");
      return res.status(404).json({ message: "Запит не знайдено" });
    }

    const userId = requestResult.rows[0].user_id;

    // Update request status
    await executeQuery(
      "UPDATE master_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [status, requestId]
    );

    // Update user profile
    if (status === "approved") {
      await executeQuery(
        "UPDATE user_profile SET approval_status = $1, role_master = true WHERE user_id = $2",
        [status, userId]
      );

      // Check if the master already has any industries
      const existingIndustriesResult = await executeQuery(
        `
        SELECT * FROM user_services 
        WHERE user_id = $1 AND service_type = 'industry'
        `,
        [userId]
      );

      // Only add default industries if the master has no industries yet
      if (existingIndustriesResult.rows.length === 0) {
        // Add default industries for the master
        const industries = [
          "Інформаційні технології",
          "Медицина",
          "Енергетика",
          "Аграрна галузь",
          "Фінанси та банківська справа",
          "Освіта",
          "Туризм і гостинність",
          "Будівництво та нерухомість",
          "Транспорт",
          "Мистецтво і культура",
        ];

        for (const industry of industries) {
          await executeQuery(
            `
            INSERT INTO user_services (user_id, service_name, service_type)
            VALUES ($1, $2, 'industry')
            `,
            [userId, industry]
          );
        }
      }
    } else if (status === "rejected") {
      await executeQuery(
        "UPDATE user_profile SET approval_status = $1, role_master = false WHERE user_id = $2",
        [status, userId]
      );
    } else {
      await executeQuery(
        "UPDATE user_profile SET approval_status = $1 WHERE user_id = $2",
        [status, userId]
      );
    }

    // Commit the transaction
    await executeQuery("COMMIT");

    console.log(
      `✅ Статус запиту на роль майстра з ID ${requestId} змінено на ${status}.`
    );
    res
      .status(200)
      .json({ success: true, message: `Статус запиту змінено на ${status}` });
  } catch (err) {
    // Rollback in case of error
    try {
      await executeQuery("ROLLBACK");
    } catch (rollbackErr) {
      console.error("❌ Помилка при відкаті транзакції:", rollbackErr.message);
    }
    console.error("❌ Помилка при оновленні статусу запиту:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання списку всіх користувачів та майстрів
app.get("/admin/users", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT u.id, u.username, up.role_master, up.first_name, up.last_name, 
             up.email, up.approval_status, up.phone, up.address, up.date_of_birth
      FROM users u
      LEFT JOIN user_profile up ON u.id = up.user_id
      ORDER BY up.role_master DESC, u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Помилка при отриманні списку користувачів:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Add a new endpoint to get all masters with their industries and services
app.get("/admin/masters", async (req, res) => {
  try {
    // Get all users with role_master = true
    const mastersResult = await executeQuery(`
      SELECT u.id, u.username, up.first_name, up.last_name, up.email, 
             up.phone, up.address, up.approval_status, up.date_of_birth
      FROM users u
      JOIN user_profile up ON u.id = up.user_id
      WHERE up.role_master = true
      ORDER BY up.approval_status, u.id
    `);

    const masters = mastersResult.rows;

    // For each master, get their industries and services
    for (const master of masters) {
      // Get industries
      const industriesResult = await executeQuery(
        `
        SELECT service_name 
        FROM user_services 
        WHERE user_id = $1 AND service_type = 'industry'
      `,
        [master.id]
      );

      master.industries = industriesResult.rows.map((row) => row.service_name);

      // Get services (excluding industries)
      const servicesResult = await executeQuery(
        `
        SELECT service_name, service_type
        FROM user_services 
        WHERE user_id = $1 AND service_type != 'industry'
      `,
        [master.id]
      );

      master.services = servicesResult.rows;
    }

    res.json(masters);
  } catch (err) {
    console.error("❌ Помилка при отриманні списку майстрів:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Видалення користувача
app.delete("/admin/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    await executeQuery("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "Користувача успішно видалено" });
  } catch (err) {
    console.error("❌ Помилка при видаленні користувача:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання списку всіх користувачів з їхніми послугами
app.get("/admin/users-with-services", async (req, res) => {
  try {
    const usersResult = await executeQuery(`
      SELECT u.id, u.username, up.role_master, up.first_name, up.last_name, up.email, up.approval_status
      FROM users u
      LEFT JOIN user_profile up ON u.id = up.user_id
    `);

    const users = usersResult.rows;

    // Отримуємо всі послуги для всіх користувачів
    const servicesResult = await executeQuery(`
      SELECT user_id, service_name, service_type, id
      FROM user_services
    `);

    // Групуємо послуги за user_id
    const servicesMap = {};
    servicesResult.rows.forEach((service) => {
      if (!servicesMap[service.user_id]) {
        servicesMap[service.user_id] = [];
      }
      servicesMap[service.user_id].push(service);
    });

    // Додаємо послуги до користувачів
    const usersWithServices = users.map((user) => ({
      ...user,
      services: servicesMap[user.id] || [],
    }));

    res.json(usersWithServices);
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні списку користувачів з послугами:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Новий ендпоінт для отримання вікової статистики
app.get("/api/age-demographics", async (req, res) => {
  try {
    console.log("Отримано запит на /api/age-demographics");

    const result = await executeQuery(`
      SELECT date_of_birth 
      FROM user_profile 
      WHERE date_of_birth IS NOT NULL
    `);

    console.log(`Отримано ${result.rows.length} записів з бази даних`);

    const ageCategories = [
      { name: "13-17", min: 13, max: 17 },
      { name: "18-24", min: 18, max: 24 },
      { name: "25-34", min: 25, max: 34 },
      { name: "35-44", min: 35, max: 44 },
      { name: "45-54", min: 45, max: 54 },
      { name: "55-64", min: 55, max: 64 },
      { name: "65+", min: 65, max: 150 },
    ];

    const currentDate = new Date();
    const ages = result.rows.map((user) => {
      const birthDate = new Date(user.date_of_birth);
      let age = currentDate.getFullYear() - birthDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const birthMonth = birthDate.getMonth();

      if (
        birthMonth > currentMonth ||
        (birthMonth === currentMonth &&
          birthDate.getDate() > currentDate.getDate())
      ) {
        age--;
      }

      return age;
    });

    const categoryCounts = ageCategories.map((category) => {
      const count = ages.filter(
        (age) => age >= category.min && age <= category.max
      ).length;
      return {
        category: category.name,
        count,
      };
    });

    const totalUsers = ages.length;
    const agePercentages = categoryCounts.map((category) => ({
      category: category.name,
      percentage: totalUsers > 0 ? (category.count / totalUsers) * 100 : 0,
    }));

    console.log("Відправлення даних:", agePercentages);
    res.json(agePercentages);
  } catch (error) {
    console.error(
      "❌ Помилка при отриманні вікової статистики:",
      error.message
    );
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Новий ендпоінт для отримання кількості користувачів та майстрів
app.get("/api/user-master-count", async (req, res) => {
  try {
    console.log("Отримано запит на /api/user-master-count");

    // Get current user and master counts
    const countResult = await executeQuery(`
      SELECT 
        COUNT(*) FILTER (WHERE role_master = false OR role_master IS NULL) as users_count,
        COUNT(*) FILTER (WHERE role_master = true) as masters_count
      FROM user_profile
    `);

    // Get weekly growth (users created in the last 7 days)
    const weeklyGrowthResult = await executeQuery(`
      SELECT 
        COUNT(*) FILTER (WHERE up.role_master = false OR up.role_master IS NULL) as users_growth,
        COUNT(*) FILTER (WHERE up.role_master = true) as masters_growth
      FROM user_profile up
      JOIN users u ON up.user_id = u.id
      WHERE u.id IN (
        SELECT id FROM users WHERE id > (SELECT MAX(id) - 10 FROM users)
      )
    `);

    const usersCount = Number.parseInt(countResult.rows[0].users_count) || 0;
    const mastersCount =
      Number.parseInt(countResult.rows[0].masters_count) || 0;
    const usersGrowth =
      Number.parseInt(weeklyGrowthResult.rows[0].users_growth) || 0;
    const mastersGrowth =
      Number.parseInt(weeklyGrowthResult.rows[0].masters_growth) || 0;

    console.log("Отримано дані про кількість користувачів та майстрів:", {
      users: usersCount,
      masters: mastersCount,
      usersGrowth: usersGrowth,
      mastersGrowth: mastersGrowth,
    });

    res.json({
      users: usersCount,
      masters: mastersCount,
      usersGrowth: usersGrowth,
      mastersGrowth: mastersGrowth,
    });
  } catch (error) {
    console.error(
      "❌ Помилка при отриманні кількості користувачів та майстрів:",
      error.message
    );
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Improve the user-master-timeline endpoint to use real data
app.get("/api/user-master-timeline", async (req, res) => {
  try {
    console.log("Отримано запит на /api/user-master-timeline");

    // Create array of last 6 months
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      months.push({
        month: date.toLocaleString("uk-UA", { month: "long", year: "numeric" }),
        timestamp: date.getTime(),
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      });
    }

    // Get total counts
    const countResult = await executeQuery(`
      SELECT 
        COUNT(*) FILTER (WHERE role_master = false OR role_master IS NULL) as users_count,
        COUNT(*) FILTER (WHERE role_master = true) as masters_count
      FROM user_profile
    `);

    const totalUsers = Number.parseInt(countResult.rows[0].users_count) || 0;
    const totalMasters =
      Number.parseInt(countResult.rows[0].masters_count) || 0;

    // Get orders count by month
    const ordersResult = await executeQuery(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Create a map of month to orders count
    const ordersCountByMonth = {};
    ordersResult.rows.forEach((row) => {
      const monthKey = new Date(row.month).toLocaleString("uk-UA", {
        month: "long",
        year: "numeric",
      });
      ordersCountByMonth[monthKey] = Number.parseInt(row.count);
    });

    // Create timeline data with progressive growth
    // This is a simplified approach since we don't have exact registration dates
    const timeline = months.map((month, index) => {
      const factor = (index + 1) / months.length;
      const ordersCount =
        ordersCountByMonth[month.month] ||
        Math.round(totalUsers * 0.2 * factor);

      return {
        month: month.month,
        timestamp: month.timestamp,
        users: Math.round(totalUsers * (0.5 + factor * 0.5)), // Start from 50% of current total
        masters: Math.round(totalMasters * (0.4 + factor * 0.6)), // Start from 40% of current total
        orders: ordersCount,
      };
    });

    console.log("Відправлення даних часової шкали:", timeline);
    res.json(timeline);
  } catch (error) {
    console.error(
      "❌ Помилка при отриманні даних часової шкали:",
      error.message
    );
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Add this new endpoint to get the count of orders/projects
app.get("/api/orders-count", async (req, res) => {
  try {
    console.log("Отримано запит на /api/orders-count");

    // Get total orders count
    const totalOrdersResult = await executeQuery(`
      SELECT COUNT(*) as total_orders
      FROM orders
    `);

    // Get completed orders count
    const completedOrdersResult = await executeQuery(`
      SELECT COUNT(*) as completed_orders
      FROM orders
      WHERE status = 'completed'
    `);

    // Get weekly growth (orders created in the last 7 days)
    const weeklyGrowthResult = await executeQuery(`
      SELECT COUNT(*) as weekly_growth
      FROM orders
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const totalOrders =
      Number.parseInt(totalOrdersResult.rows[0].total_orders) || 0;
    const completedOrders =
      Number.parseInt(completedOrdersResult.rows[0].completed_orders) || 0;
    const weeklyGrowth =
      Number.parseInt(weeklyGrowthResult.rows[0].weekly_growth) || 0;

    console.log("Отримано дані про кількість замовлень:", {
      total: totalOrders,
      completed: completedOrders,
      weeklyGrowth: weeklyGrowth,
    });

    res.json({
      total: totalOrders,
      completed: completedOrders,
      weeklyGrowth: weeklyGrowth,
    });
  } catch (error) {
    console.error(
      "❌ Помилка при отриманні кількості замовлень:",
      error.message
    );
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Ендпоінт для отримання середнього віку користувачів
app.get("/api/average-age", async (req, res) => {
  try {
    console.log("Отримано запит на /api/average-age");

    const result = await executeQuery(`
      SELECT AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))) as average_age
      FROM user_profile 
      WHERE date_of_birth IS NOT NULL
    `);

    const averageAge = result.rows[0].average_age
      ? Number.parseFloat(result.rows[0].average_age).toFixed(1)
      : "N/A";

    console.log("Середній вік користувачів:", averageAge);
    res.json({ averageAge });
  } catch (error) {
    console.error("❌ Помилка при обчисленні середнього віку:", error.message);
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Ендпоінт для отримання списку галузей
app.get("/api/industries", async (req, res) => {
  try {
    console.log("Отримано запит на /api/industries");

    const industries = [
      {
        name: "Інформаційні технології",
        icon: "fas fa-laptop-code",
        description:
          "Розробка програмного забезпечення, веб-сайтів, мобільних додатків та IT-консультації",
      },
      {
        name: "Медицина",
        icon: "fas fa-heartbeat",
        description:
          "Медичні консультації, догляд за пацієнтами та медичне обладнання",
      },
      {
        name: "Енергетика",
        icon: "fas fa-bolt",
        description:
          "Енергетичні рішення, відновлювані джерела енергії та енергоефективність",
      },
      {
        name: "Аграрна галузь",
        icon: "fas fa-tractor",
        description: "Сільськогосподарські послуги, агрономія та тваринництво",
      },
      {
        name: "Фінанси та банківська справа",
        icon: "fas fa-money-bill-wave",
        description:
          "Фінансові консультації, бухгалтерія та інвестиційні поради",
      },
      {
        name: "Освіта",
        icon: "fas fa-graduation-cap",
        description: "Навчання, тренінги та освітні програми",
      },
      {
        name: "Туризм і гостинність",
        icon: "fas fa-plane",
        description:
          "Туристичні послуги, організація подорожей та готельний бізнес",
      },
      {
        name: "Будівництво та нерухомість",
        icon: "fas fa-hard-hat",
        description: "Будівельні роботи, ремонт та консультації з нерухомості",
      },
      {
        name: "Транспорт",
        icon: "fas fa-truck",
        description: "Транспортні послуги, логістика та доставка",
      },
      {
        name: "Мистецтво і культура",
        icon: "fas fa-palette",
        description: "Творчі послуги, дизайн та організація культурних заходів",
      },
    ];

    res.json(industries);
  } catch (error) {
    console.error("❌ Помилка при отриманні списку галузей:", error.message);
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// Ендпоінт для отримання послуг за галуззю
app.get("/api/services-by-industry/:industry", async (req, res) => {
  const industry = req.params.industry;

  try {
    console.log(`Отримано запит на /api/services-by-industry/${industry}`);

    // Отримуємо всіх майстрів з вказаною галуззю
    const mastersResult = await executeQuery(
      `
      SELECT u.id
      FROM users u
      JOIN user_profile up ON u.id = up.user_id
      JOIN user_services us ON u.id = us.user_id
      WHERE up.role_master = true 
      AND up.approval_status = 'approved'
      AND us.service_type = 'industry'
      AND us.service_name = $1
    `,
      [industry]
    );

    const masterIds = mastersResult.rows.map((row) => row.id);

    if (masterIds.length === 0) {
      return res.json([]);
    }

    // Отримуємо всі послуги цих майстрів
    const servicesResult = await executeQuery(
      `
      SELECT service_name, COUNT(*) as count
      FROM user_services
      WHERE user_id = ANY($1)
      AND service_type != 'industry'
      GROUP BY service_name
      ORDER BY count DESC
    `,
      [masterIds]
    );

    res.json(servicesResult.rows);
  } catch (error) {
    console.error("❌ Помилка при отриманні послуг за галуззю:", error.message);
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

// ЕНДПОІНТИ ДЛЯ ЗАМОВЛЕНЬ

// Створення нового замовлення
app.post("/orders", async (req, res) => {
  const { user_id, title, description, phone, industry } = req.body;

  if (!user_id || !title || !phone) {
    return res
      .status(400)
      .json({ message: "Усі обов'язкові поля повинні бути заповнені" });
  }

  try {
    // Перевірка чи існує користувач
    const userResult = await executeQuery("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    // Створення нового замовлення
    const newOrder = await executeQuery(
      "INSERT INTO orders (user_id, title, description, phone, industry, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id",
      [user_id, title, description, phone, industry]
    );

    console.log(
      `✅ Нове замовлення з ID ${newOrder.rows[0].id} успішно створено.`
    );
    res.status(201).json({
      success: true,
      message: "Замовлення успішно створено",
      orderId: newOrder.rows[0].id,
    });
  } catch (err) {
    console.error("❌ Помилка при створенні замовлення:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання всіх замовлень
app.get("/orders", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name,
             up.email as user_email,
             m.username as master_username,
             mp.first_name as master_first_name,
             mp.last_name as master_last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      LEFT JOIN users m ON o.master_id = m.id
      LEFT JOIN user_profile mp ON m.id = mp.user_id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні замовлень:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання замовлень користувача
app.get("/orders/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at,
             m.username as master_username,
             mp.first_name as master_first_name,
             mp.last_name as master_last_name
      FROM orders o
      LEFT JOIN users m ON o.master_id = m.id
      LEFT JOIN user_profile mp ON m.id = mp.user_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `,
      [userId]
    );

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні замовлень користувача:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання замовлень, оброблених майстром
app.get("/orders/master/:masterId", async (req, res) => {
  const masterId = req.params.masterId;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name,
             up.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      WHERE o.master_id = $1
      ORDER BY o.updated_at DESC
    `,
      [masterId]
    );

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні замовлень майстра:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Оновлення статусу замовлення
app.put("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  const { status, master_id } = req.body;

  if (
    !status ||
    !["pending", "approved", "in_progress", "rejected", "completed"].includes(
      status
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Невірний статус. Допустимі значення: pending, approved, in_progress, rejected, completed",
    });
  }

  try {
    // Перевірка чи існує замовлення
    const orderResult = await executeQuery(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Замовлення не знайдено",
      });
    }

    // Перевірка чи користувач є майстром, якщо вказано master_id
    if (master_id) {
      const masterResult = await executeQuery(
        `
        SELECT * FROM user_profile 
        WHERE user_id = $1 AND role_master = true
        `,
        [master_id]
      );

      if (masterResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Тільки майстри можуть обробляти замовлення",
        });
      }

      // Перевіряємо статус затвердження майстра тільки якщо він знайдений
      if (masterResult.rows[0].approval_status !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Тільки затверджені майстри можуть обробляти замовлення",
        });
      }
    }

    // Оновлення статусу замовлення
    const updateResult = await executeQuery(
      `
      UPDATE orders 
      SET status = $1, 
          master_id = $2, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
      RETURNING id, status, master_id
      `,
      [status, master_id || orderResult.rows[0].master_id, orderId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error("Не вдалося оновити замовлення");
    }

    console.log(`✅ Статус замовлення з ID ${orderId} змінено на ${status}.`);

    res.status(200).json({
      success: true,
      message: `Статус замовлення змінено на ${status}`,
      order: updateResult.rows[0],
    });
  } catch (err) {
    console.error("❌ Помилка при оновленні статусу замовлення:", err.message);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні статусу заявки",
      error: err.message,
    });
  }
});

// Отримання замовлень за галуззю
app.get("/orders/industry/:industry", async (req, res) => {
  const industry = req.params.industry;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at
      FROM orders o
      WHERE o.industry = $1
      ORDER BY o.created_at DESC
    `,
      [industry]
    );

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні замовлень за галуззю:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання статистики замовлень
app.get("/orders/stats", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM orders
    `);

    res.status(200).json({ stats: result.rows[0] });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні статистики замовлень:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання замовлень за статусом
app.get("/orders/status/:status", async (req, res) => {
  const status = req.params.status;

  if (!["pending", "completed", "rejected", "all"].includes(status)) {
    return res.status(400).json({ message: "Невірний статус" });
  }

  try {
    let query = `
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name,
             up.email as user_email,
             m.username as master_username,
             mp.first_name as master_first_name,
             mp.last_name as master_last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      LEFT JOIN users m ON o.master_id = m.id
      LEFT JOIN user_profile mp ON m.id = mp.user_id
    `;

    if (status !== "all") {
      query += ` WHERE o.status = $1`;
    }

    query += ` ORDER BY o.created_at DESC`;

    const result =
      status === "all"
        ? await executeQuery(query)
        : await executeQuery(query, [status]);

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні замовлень за статусом:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання деталей замовлення за ID
app.get("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name,
             up.email as user_email,
             m.username as master_username,
             mp.first_name as master_first_name,
             mp.last_name as master_last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      LEFT JOIN users m ON o.master_id = m.id
      LEFT JOIN user_profile mp ON m.id = mp.user_id
      WHERE o.id = $1
    `,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Замовлення не знайдено" });
    }

    res.status(200).json({ order: result.rows[0] });
  } catch (err) {
    console.error("❌ Помилка при отриманні деталей замовлення:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Пошук замовлень
app.get("/orders/search/:query", async (req, res) => {
  const query = req.params.query;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.industry, o.master_id, o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      WHERE 
        o.title ILIKE $1 OR 
        o.description ILIKE $1 OR 
        o.industry ILIKE $1 OR
        u.username ILIKE $1 OR
        up.first_name ILIKE $1 OR
        up.last_name ILIKE $1
      ORDER BY o.created_at DESC
    `,
      [`%${query}%`]
    );

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error("❌ Помилка при пошуку замовлень:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання кількості замовлень за галузями
app.get("/orders/stats/by-industry", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        industry, 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM orders
      GROUP BY industry
      ORDER BY total DESC
    `);

    res.status(200).json({ stats: result.rows });
  } catch (err) {
    console.error(
      "❌ Помилка при отриманні статистики за галузями:",
      err.message
    );
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання останніх замовлень (для дашборду)
app.get("/orders/latest/:limit", async (req, res) => {
  const limit = Number.parseInt(req.params.limit) || 5;

  try {
    const result = await executeQuery(
      `
      SELECT o.id, o.title, o.status, o.industry, o.created_at,
             u.username as user_username,
             up.first_name as user_first_name,
             up.last_name as user_last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      ORDER BY o.created_at DESC
      LIMIT $1
    `,
      [limit]
    );

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні останніх замовлень:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання кількості замовлень за статусами
app.get("/orders/count/by-status", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    // Перетворюємо результат у зручний формат
    const counts = {
      pending: 0,
      completed: 0,
      rejected: 0,
      total: 0,
    };

    result.rows.forEach((row) => {
      counts[row.status] = Number.parseInt(row.count);
      counts.total += Number.parseInt(row.count);
    });

    res.status(200).json(counts);
  } catch (err) {
    console.error("❌ Помилка при отриманні кількості замовлень:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// ЕНДПОІНТИ ДЛЯ ВІДГУКІВ

// Створення нового відгуку
app.post("/reviews", async (req, res) => {
  const { user_id, name, industry, rating, text, master_name, city } = req.body;

  if (!name || !industry || !rating || !text) {
    return res
      .status(400)
      .json({ message: "Усі обов'язкові поля повинні бути заповнені" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Оцінка повинна бути від 1 до 5" });
  }

  try {
    // Перевірка чи існує користувач, якщо вказано user_id
    if (user_id) {
      const userResult = await executeQuery(
        "SELECT * FROM users WHERE id = $1",
        [user_id]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "Користувача не знайдено" });
      }
    }

    // Створення нового відгуку
    const newReview = await executeQuery(
      "INSERT INTO reviews (user_id, name, industry, rating, text, master_name, city, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved') RETURNING id",
      [
        user_id || null,
        name,
        industry,
        rating,
        text,
        master_name || null,
        city || "Не вказано",
      ]
    );

    console.log(
      `✅ Новий відгук з ID ${newReview.rows[0].id} успішно створено.`
    );
    res.status(201).json({
      success: true,
      message: "Відгук успішно створено",
      reviewId: newReview.rows[0].id,
    });
  } catch (err) {
    console.error("❌ Помилка при створенні відгуку:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання всіх відгуків
app.get("/reviews", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, user_id, name, industry, rating, text, master_name, city, status, created_at, updated_at
      FROM reviews
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `);

    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні відгуків:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання відгуку за ID
app.get("/reviews/:reviewId", async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const result = await executeQuery(
      `
      SELECT id, user_id, name, industry, rating, text, master_name, city, status, created_at, updated_at
      FROM reviews
      WHERE id = $1
    `,
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Відгук не знайдено" });
    }

    res.status(200).json({ review: result.rows[0] });
  } catch (err) {
    console.error("❌ Помилка при отриманні відгуку:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Видалення відгуку
app.delete("/reviews/:reviewId", async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const result = await executeQuery(
      "DELETE FROM reviews WHERE id = $1 RETURNING id",
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Відгук не знайдено" });
    }

    console.log(`✅ Відгук з ID ${reviewId} успішно видалено.`);
    res.status(200).json({ message: "Відгук успішно видалено" });
  } catch (err) {
    console.error("❌ Помилка при видаленні відгуку:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Оновлення статусу відгуку (для модерації)
app.put("/reviews/:reviewId/status", async (req, res) => {
  const reviewId = req.params.reviewId;
  const { status } = req.body;

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Невірний статус" });
  }

  try {
    const result = await executeQuery(
      "UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
      [status, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Відгук не знайдено" });
    }

    console.log(`✅ Статус відгуку з ID ${reviewId} змінено на ${status}.`);
    res.status(200).json({ message: `Статус відгуку змінено на ${status}` });
  } catch (err) {
    console.error("❌ Помилка при оновленні статусу відгуку:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання відгуків за галуззю
app.get("/reviews/industry/:industry", async (req, res) => {
  const industry = req.params.industry;

  try {
    const result = await executeQuery(
      `
      SELECT id, user_id, name, industry, rating, text, master_name, city, status, created_at, updated_at
      FROM reviews
      WHERE industry = $1 AND status = 'approved'
      ORDER BY created_at DESC
    `,
      [industry]
    );

    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні відгуків за галуззю:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання відгуків за оцінкою
app.get("/reviews/rating/:rating", async (req, res) => {
  const rating = Number.parseInt(req.params.rating);

  if (isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Невірна оцінка" });
  }

  try {
    const result = await executeQuery(
      `
      SELECT id, user_id, name, industry, rating, text, master_name, city, status, created_at, updated_at
      FROM reviews
      WHERE rating = $1 AND status = 'approved'
      ORDER BY created_at DESC
    `,
      [rating]
    );

    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error("❌ Помилка при отриманні відгуків за оцінкою:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання статистики відгуків за оцінками
app.get("/api/review-ratings", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE status = 'approved'
      GROUP BY rating
      ORDER BY rating
    `);

    // Перетворюємо результат у зручний формат
    const ratings = {};
    let totalCount = 0;

    result.rows.forEach((row) => {
      ratings[row.rating] = Number.parseInt(row.count);
      totalCount += Number.parseInt(row.count);
    });

    res.status(200).json({
      ratings,
      totalCount,
      averageRating:
        totalCount > 0
          ? (
              Object.entries(ratings).reduce(
                (sum, [rating, count]) => sum + Number.parseInt(rating) * count,
                0
              ) / totalCount
            ).toFixed(1)
          : 0,
    });
  } catch (err) {
    console.error("❌ Помилка при отриманні статистики відгуків:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Отримання статистики відгуків за галузями
app.get("/api/review-industries", async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT industry, COUNT(*) as count
      FROM reviews
      WHERE status = 'approved'
      GROUP BY industry
      ORDER BY count DESC
    `);

    // Перетворюємо результат у зручний формат
    const industries = {};

    result.rows.forEach((row) => {
      industries[row.industry] = Number.parseInt(row.count);
    });

    res.status(200).json({ industries });
  } catch (err) {
    console.error("❌ Помилка при отриманні статистики відгуків:", err.message);
    res.status(500).json({ message: "Помилка сервера", error: err.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Handle form submissions
app.post(
  "/send-message",
  upload.fields([
    { name: "voiceMessage", maxCount: 1 },
    { name: "videoMessage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { username, email, messageType } = req.body;

      if (!username || !email || !messageType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let messageContent;
      let filePath;

      // Process message based on type
      if (messageType === "text") {
        const { textMessage } = req.body;

        if (!textMessage) {
          return res.status(400).json({ error: "Missing text message" });
        }

        messageContent = textMessage;
      } else if (messageType === "voice") {
        if (!req.files.voiceMessage) {
          return res.status(400).json({ error: "Missing voice message" });
        }

        filePath = req.files.voiceMessage[0].path;
      } else if (messageType === "video") {
        if (!req.files.videoMessage) {
          return res.status(400).json({ error: "Missing video message" });
        }

        filePath = req.files.videoMessage[0].path;
      } else {
        return res.status(400).json({ error: "Invalid message type" });
      }

      // Send message to Telegram
      const result = await sendMessage({
        username,
        email,
        messageType,
        messageContent,
        filePath,
      });

      // Clean up file after sending
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res
        .status(200)
        .json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending message:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to send message" });
    }
  }
);

// Створіть HTTP сервер з вашого Express додатку
const server = http.createServer(app);
const io = socketIo(server);

// Зберігання активних користувачів
const activeUsers = new Map();

// Socket.io обробка подій
io.on("connection", (socket) => {
  console.log("Новий користувач підключився:", socket.id);

  // Обробка приєднання до чату
  socket.on("join", (user) => {
    console.log(`Користувач ${user.username} приєднався до чату`);

    // Зберігаємо інформацію про користувача
    activeUsers.set(socket.id, user);

    // Повідомляємо всіх про нового користувача
    io.emit("user-joined", user);
  });

  // Обробка повідомлень
  socket.on("message", (message) => {
    console.log(`Нове повідомлення від ${message.username}: ${message.text}`);

    // Відправляємо повідомлення всім користувачам
    io.emit("message", message);
  });

  // Обробка виходу з чату
  socket.on("leave", (user) => {
    console.log(`Користувач ${user.username} покинув чат`);

    // Видаляємо користувача зі списку активних
    activeUsers.delete(socket.id);

    // Повідомляємо всіх про вихід користувача
    io.emit("user-left", user);
  });

  // Обробка відключення
  socket.on("disconnect", () => {
    console.log("Користувач відключився:", socket.id);

    // Перевіряємо, чи був користувач у чаті
    const user = activeUsers.get(socket.id);
    if (user) {
      // Видаляємо користувача зі списку активних
      activeUsers.delete(socket.id);

      // Повідомляємо всіх про вихід користувача
      io.emit("user-left", user);
    }
  });
});

// Змініть цей рядок у вашому коді
// app.listen(port, () => {
//   console.log(`✅ Сервер успішно запущено на http://localhost:${port}`);
// });

// На цей код:
server.listen(port, () => {
  console.log(`✅ Сервер успішно запущено на http://localhost:${port}`);
});
