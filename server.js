const express = require("express")
const bodyParser = require("body-parser")
const { Pool } = require("pg")
const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
dotenv.config()

const app = express()
const port = process.env.PORT || 3003

// Обслуговування статичних файлів з директорії 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до бази даних
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
})

// Функція для створення таблиць
const createTables = async () => {
  const userTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `

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
  `

  const userServicesTableQuery = `
    CREATE TABLE IF NOT EXISTS user_services (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      service_name VARCHAR(255) NOT NULL,
      service_type VARCHAR(50) DEFAULT 'service'
    );
  `

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
  `

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
  `

  const masterRequestsTableQuery = `
    CREATE TABLE IF NOT EXISTS master_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Нова таблиця для замовлень
  const ordersTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      phone VARCHAR(15) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      master_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  try {
    await pool.query(userTableQuery)
    await pool.query(userProfileTableQuery)
    await pool.query(userServicesTableQuery)
    await pool.query(addRoleMasterColumnQuery)
    await pool.query(addApprovalStatusColumnQuery)
    await pool.query(masterRequestsTableQuery)
    await pool.query(ordersTableQuery)
    console.log("Таблиці створено або вже існують, колонки додано (якщо їх не було).")
  } catch (err) {
    console.error("Помилка при створенні таблиць:", err)
  
  }
  
}

createTables()

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)))

// Головна сторінка (реєстрація/авторизація)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "auth.html"))
})

// Допоміжна функція для виконання запитів до бази даних
const query = (text, params) => pool.query(text, params)

// Middleware для JWT аутентифікації
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

let isProcessing = false

// Реєстрація користувача
app.post("/register", async (req, res) => {
  if (isProcessing) {
    return res.status(400).json({ message: "Запит вже обробляється!" })
  }
  isProcessing = true

  const { username, password } = req.body

  if (!username || !password) {
    isProcessing = false
    return res.status(400).json({ message: "Усі поля повинні бути заповнені!" })
  }

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username])
    if (existingUser.rows.length > 0) {
      isProcessing = false
      return res.status(400).json({ message: "Користувач з таким іменем вже існує!" })
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const newUser = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", [
      username,
      hashedPassword,
    ])

    await pool.query("INSERT INTO user_profile (user_id) VALUES ($1)", [newUser.rows[0].id])

    console.log(`Користувач ${username} успішно зареєстрований.`)

    res.status(200).json({
      success: true,
      message: "Реєстрація успішна",
      userId: newUser.rows[0].id,
      redirect: "/index.html",
    })
  } catch (err) {
    console.error("Помилка при реєстрації:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  } finally {
    isProcessing = false
  }
})

// Логін користувача
app.post("/login", async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "Усі поля повинні бути заповнені!" })
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username])
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Невірне ім'я користувача або пароль!" })
    }

    const user = result.rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Невірне ім'я користувача або пароль!" })
    }

    console.log(`${username} успішно увійшов в систему!`)

    res.status(200).json({
      success: true,
      message: "Вхід успішний",
      userId: user.id,
      redirect: "/index.html",
    })
  } catch (err) {
    console.error("Помилка при вході:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання профілю користувача
app.get("/profile/:userId", async (req, res) => {
  const userId = req.params.userId

  try {
    const profileResult = await pool.query("SELECT * FROM user_profile WHERE user_id = $1", [userId])

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Профіль не знайдено" })
    }

    res.status(200).json({ profile: profileResult.rows[0] })
  } catch (err) {
    console.error("Помилка при отриманні профілю:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Оновлення профілю користувача
app.put("/profile/:userId", async (req, res) => {
  const userId = req.params.userId
  const { first_name, last_name, email, phone, address, date_of_birth, role_master, approval_status } = req.body

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" })
    }

    await pool.query(
      `UPDATE user_profile 
       SET first_name = $1, last_name = $2, email = $3, phone = $4, 
           address = $5, date_of_birth = $6, role_master = $7, approval_status = $8
       WHERE user_id = $9`,
      [first_name, last_name, email, phone, address, date_of_birth, role_master, approval_status, userId],
    )

    console.log(`Профіль користувача з ID ${userId} успішно оновлено.`)
    res.status(200).json({ success: true, message: "Профіль успішно оновлено" })
  } catch (err) {
    console.error("Помилка при оновленні профілю:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Додавання послуги для користувача
app.post("/services/:userId", async (req, res) => {
  const userId = req.params.userId
  const { service_name, service_type = "service" } = req.body

  if (!service_name) {
    return res.status(400).json({ message: "Назва послуги обов'язкова" })
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" })
    }

    await pool.query("INSERT INTO user_services (user_id, service_name, service_type) VALUES ($1, $2, $3)", [
      userId,
      service_name,
      service_type,
    ])

    console.log(`Послугу "${service_name}" типу "${service_type}" додано для користувача з ID ${userId}.`)
    res.status(201).json({ success: true, message: "Послугу успішно додано" })
  } catch (err) {
    console.error("Помилка при додаванні послуги:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання послуг користувача
app.get("/services/:userId", async (req, res) => {
  const userId = req.params.userId

  try {
    const servicesResult = await pool.query("SELECT * FROM user_services WHERE user_id = $1", [userId])

    res.status(200).json({ services: servicesResult.rows })
  } catch (err) {
    console.error("Помилка при отриманні послуг:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Видалення послуги
app.delete("/services/:serviceId", async (req, res) => {
  const serviceId = req.params.serviceId

  try {
    const result = await pool.query("DELETE FROM user_services WHERE id = $1 RETURNING *", [serviceId])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Послугу не знайдено" })
    }

    console.log(`Послугу з ID ${serviceId} успішно видалено.`)
    res.status(200).json({ success: true, message: "Послугу успішно видалено" })
  } catch (err) {
    console.error("Помилка при видаленні послуги:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Створення запиту на роль майстра
app.post("/master-requests", async (req, res) => {
  const { user_id, status = "pending" } = req.body

  if (!user_id) {
    return res.status(400).json({ message: "ID користувача обов'язковий" })
  }

  try {
    // Перевірка чи існує користувач
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [user_id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" })
    }

    // Перевірка чи вже існує запит
    const existingRequest = await pool.query(
      "SELECT * FROM master_requests WHERE user_id = $1 AND status = 'pending'",
      [user_id],
    )
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ message: "Запит на роль майстра вже існує" })
    }

    // Створення нового запиту
    await pool.query("INSERT INTO master_requests (user_id, status) VALUES ($1, $2)", [user_id, status])

    console.log(`Запит на роль майстра для користувача з ID ${user_id} успішно створено.`)
    res.status(201).json({ success: true, message: "Запит на роль майстра успішно створено" })
  } catch (err) {
    console.error("Помилка при створенні запиту на роль майстра:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання всіх запитів на роль майстра
app.get("/master-requests", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mr.id, mr.user_id, mr.status, mr.created_at, mr.updated_at,
             u.username, up.first_name, up.last_name, up.email
      FROM master_requests mr
      JOIN users u ON mr.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      ORDER BY mr.created_at DESC
    `)

    res.status(200).json({ requests: result.rows })
  } catch (err) {
    console.error("Помилка при отриманні запитів на роль майстра:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Оновлення статусу запиту на роль майстра
app.put("/master-requests/:requestId", async (req, res) => {
  const requestId = req.params.requestId
  const { status } = req.body

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Невірний статус" })
  }

  try {
    // Отримання запиту
    const requestResult = await pool.query("SELECT * FROM master_requests WHERE id = $1", [requestId])
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Запит не знайдено" })
    }

    const userId = requestResult.rows[0].user_id

    // Оновлення статусу запиту
    await pool.query("UPDATE master_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      status,
      requestId,
    ])

    // Оновлення статусу в профілі користувача
    await pool.query("UPDATE user_profile SET approval_status = $1 WHERE user_id = $2", [status, userId])

    // Якщо запит відхилено, змінюємо роль майстра на false
    if (status === "rejected") {
      await pool.query("UPDATE user_profile SET role_master = false WHERE user_id = $1", [userId])
    }

    console.log(`Статус запиту на роль майстра з ID ${requestId} змінено на ${status}.`)
    res.status(200).json({ success: true, message: `Статус запиту змінено на ${status}` })
  } catch (err) {
    console.error("Помилка при оновленні статусу запиту:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання списку всіх користувачів та майстрів
app.get("/admin/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, up.role_master, up.first_name, up.last_name, up.email, up.approval_status
      FROM users u
      LEFT JOIN user_profile up ON u.id = up.user_id
    `)
    res.json(result.rows)
  } catch (err) {
    console.error("Помилка при отриманні списку користувачів:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Видалення користувача
app.delete("/admin/users/:userId", async (req, res) => {
  const userId = req.params.userId
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [userId])
    res.json({ message: "Користувача успішно видалено" })
  } catch (err) {
    console.error("Помилка при видаленні користувача:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання списку всіх користувачів з їхніми послугами
app.get("/admin/users-with-services", async (req, res) => {
  try {
    const usersResult = await pool.query(`
      SELECT u.id, u.username, up.role_master, up.first_name, up.last_name, up.email, up.approval_status
      FROM users u
      LEFT JOIN user_profile up ON u.id = up.user_id
    `)

    const users = usersResult.rows

    // Отримуємо всі послуги для всіх користувачів
    const servicesResult = await pool.query(`
      SELECT user_id, service_name, service_type, id
      FROM user_services
    `)

    // Групуємо послуги за user_id
    const servicesMap = {}
    servicesResult.rows.forEach((service) => {
      if (!servicesMap[service.user_id]) {
        servicesMap[service.user_id] = []
      }
      servicesMap[service.user_id].push(service)
    })

    // Додаємо послуги до користувачів
    const usersWithServices = users.map((user) => ({
      ...user,
      services: servicesMap[user.id] || [],
    }))

    res.json(usersWithServices)
  } catch (err) {
    console.error("Помилка при отриманні списку користувачів з послугами:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Новий ендпоінт для отримання вікової статистики
app.get("/api/age-demographics", async (req, res) => {
  try {
    console.log("Отримано запит на /api/age-demographics")

    const result = await pool.query(`
      SELECT date_of_birth 
      FROM user_profile 
      WHERE date_of_birth IS NOT NULL
    `)

    console.log(`Отримано ${result.rows.length} записів з бази даних`)

    const ageCategories = [
      { name: "13-17", min: 13, max: 17 },
      { name: "18-24", min: 18, max: 24 },
      { name: "25-34", min: 25, max: 34 },
      { name: "35-44", min: 35, max: 44 },
      { name: "45-54", min: 45, max: 54 },
      { name: "55-64", min: 55, max: 64 },
      { name: "65+", min: 65, max: 150 },
    ]

    const currentDate = new Date()
    const ages = result.rows.map((user) => {
      const birthDate = new Date(user.date_of_birth)
      let age = currentDate.getFullYear() - birthDate.getFullYear()
      const currentMonth = currentDate.getMonth()
      const birthMonth = birthDate.getMonth()

      if (birthMonth > currentMonth || (birthMonth === currentMonth && birthDate.getDate() > currentDate.getDate())) {
        age--
      }

      return age
    })

    const categoryCounts = ageCategories.map((category) => {
      const count = ages.filter((age) => age >= category.min && age <= category.max).length
      return {
        category: category.name,
        count,
      }
    })

    const totalUsers = ages.length
    const agePercentages = categoryCounts.map((category) => ({
      category: category.category,
      percentage: totalUsers > 0 ? (category.count / totalUsers) * 100 : 0,
    }))

    console.log("Відправлення даних:", agePercentages)
    res.json(agePercentages)
  } catch (error) {
    console.error("Помилка при отриманні вікової статистики:", error)
    res.status(500).json({ message: "Помилка сервера", error: error.message })
  }
})

// Новий ендпоінт для отримання кількості користувачів та майстрів
app.get("/api/user-master-count", async (req, res) => {
  try {
    console.log("Отримано запит на /api/user-master-count")

    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE role_master = false OR role_master IS NULL) as users_count,
        COUNT(*) FILTER (WHERE role_master = true) as masters_count
      FROM user_profile
    `)

    console.log("Отримано дані про кількість користувачів та майстрів:", result.rows[0])

    res.json({
      users: Number.parseInt(result.rows[0].users_count),
      masters: Number.parseInt(result.rows[0].masters_count),
    })
  } catch (error) {
    console.error("Помилка при отриманні кількості користувачів та майстрів:", error)
    res.status(500).json({ message: "Помилка сервера", error: error.message })
  }
})

// Ендпоінт для отримання даних про кількість користувачів та майстрів з часом
app.get("/api/user-master-timeline", async (req, res) => {
  try {
    console.log("Отримано запит на /api/user-master-timeline")

    // Оскільки в базі даних може не бути точної дати реєстрації,
    // створимо симуляцію даних за останні 6 місяців
    const months = []
    const currentDate = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(currentDate.getMonth() - i)
      months.push({
        month: date.toLocaleString("uk-UA", { month: "long", year: "numeric" }),
        timestamp: date.getTime(),
      })
    }

    // Отримуємо загальну кількість користувачів та майстрів
    const countResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE role_master = false OR role_master IS NULL) as users_count,
        COUNT(*) FILTER (WHERE role_master = true) as masters_count
      FROM user_profile
    `)

    const totalUsers = Number.parseInt(countResult.rows[0].users_count)
    const totalMasters = Number.parseInt(countResult.rows[0].masters_count)

    // Створюємо симуляцію зростання кількості користувачів та майстрів
    // Припускаємо, що кількість зростала поступово
    const timeline = months.map((month, index) => {
      const factor = (index + 1) / months.length
      return {
        month: month.month,
        timestamp: month.timestamp,
        users: Math.round(totalUsers * (0.5 + factor * 0.5)), // Починаємо з 50% від поточної кількості
        masters: Math.round(totalMasters * (0.4 + factor * 0.6)), // Починаємо з 40% від поточної кількості
      }
    })

    console.log("Відправлення даних часової шкали:", timeline)
    res.json(timeline)
  } catch (error) {
    console.error("Помилка при отриманні даних часової шкали:", error)
    res.status(500).json({ message: "Помилка сервера", error: error.message })
  }
})

// Add this new endpoint after your other API endpoints
// Endpoint for getting average user age
app.get("/api/average-age", async (req, res) => {
  try {
    console.log("Отримано запит на /api/average-age")

    const result = await pool.query(`
      SELECT AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))) as average_age
      FROM user_profile 
      WHERE date_of_birth IS NOT NULL
    `)

    const averageAge = result.rows[0].average_age ? parseFloat(result.rows[0].average_age).toFixed(1) : 'N/A'
    
    console.log("Середній вік користувачів:", averageAge)
    res.json({ averageAge })
  } catch (error) {
    console.error("Помилка при обчисленні середнього віку:", error)
    res.status(500).json({ message: "Помилка сервера", error: error.message })
  }
})

// НОВІ ЕНДПОІНТИ ДЛЯ ЗАМОВЛЕНЬ

// Створення нового замовлення
app.post("/orders", async (req, res) => {
  const { user_id, title, description, phone } = req.body

  if (!user_id || !title || !phone) {
    return res.status(400).json({ message: "Усі обов'язкові поля повинні бути заповнені" })
  }

  try {
    // Перевірка чи існує користувач
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [user_id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" })
    }

    // Створення нового замовлення
    const newOrder = await pool.query(
      "INSERT INTO orders (user_id, title, description, phone, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING id",
      [user_id, title, description, phone]
    )

    console.log(`Нове замовлення з ID ${newOrder.rows[0].id} успішно створено.`)
    res.status(201).json({ 
      success: true, 
      message: "Замовлення успішно створено", 
      orderId: newOrder.rows[0].id 
    })
  } catch (err) {
    console.error("Помилка при створенні замовлення:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання всіх замовлень
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.master_id, o.created_at, o.updated_at,
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
    `)

    res.status(200).json({ orders: result.rows })
  } catch (err) {
    console.error("Помилка при отриманні замовлень:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання замовлень користувача
app.get("/orders/user/:userId", async (req, res) => {
  const userId = req.params.userId

  try {
    const result = await pool.query(`
      SELECT o.id, o.title, o.description, o.phone, o.status, 
             o.master_id, o.created_at, o.updated_at,
             m.username as master_username,
             mp.first_name as master_first_name,
             mp.last_name as master_last_name
      FROM orders o
      LEFT JOIN users m ON o.master_id = m.id
      LEFT JOIN user_profile mp ON m.id = mp.user_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId])

    res.status(200).json({ orders: result.rows })
  } catch (err) {
    console.error("Помилка при отриманні замовлень користувача:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Отримання замовлень, оброблених майстром
app.get("/orders/master/:masterId", async (req, res) => {
  const masterId = req.params.masterId

  try {
    const result = await pool.query(`
      SELECT o.id, o.user_id, o.title, o.description, o.phone, o.status, 
             o.created_at, o.updated_at,
             u.username as user_username, 
             up.first_name as user_first_name, 
             up.last_name as user_last_name,
             up.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profile up ON u.id = up.user_id
      WHERE o.master_id = $1
      ORDER BY o.updated_at DESC
    `, [masterId])

    res.status(200).json({ orders: result.rows })
  } catch (err) {
    console.error("Помилка при отриманні замовлень майстра:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Оновлення статусу замовлення
app.put("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId
  const { status, master_id } = req.body

  if (!status || !["pending", "approved", "rejected", "completed"].includes(status)) {
    return res.status(400).json({ message: "Невірний статус" })
  }

  try {
    // Перевірка чи існує замовлення
    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId])
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Замовлення не знайдено" })
    }

    // Перевірка чи користувач є майстром
    if (master_id) {
      const masterResult = await pool.query(`
        SELECT * FROM user_profile 
        WHERE user_id = $1 AND role_master = true AND approval_status = 'approved'
      `, [master_id])
      
      if (masterResult.rows.length === 0) {
        return res.status(403).json({ message: "Тільки затверджені майстри можуть обробляти замовлення" })
      }
    }

    // Оновлення статусу замовлення
    await pool.query(`
      UPDATE orders 
      SET status = $1, master_id = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [status, master_id, orderId])

    console.log(`Статус замовлення з ID ${orderId} змінено на ${status}.`)
    res.status(200).json({ success: true, message: `Статус замовлення змінено на ${status}` })
  } catch (err) {
    console.error("Помилка при оновленні статусу замовлення:", err)
    res.status(500).json({ message: "Помилка сервера", error: err.message })
  }
})

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на http://localhost:${port}`)
})