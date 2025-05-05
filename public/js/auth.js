// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showLoginFormBtn = document.getElementById("showLoginForm");
  const showRegisterFormBtn = document.getElementById("showRegisterForm");
  const passwordInput = document.getElementById("regPassword");
  const passwordConfirmInput = document.getElementById("regPasswordConfirm");
  const strengthMeter = document.getElementById("passwordStrengthMeter");
  const strengthText = document.getElementById("passwordStrengthText");
  const backToTopButton = document.getElementById("backToTop");

  // Анімація елементів при прокрутці
  function animateOnScroll() {
    const elements = document.querySelectorAll(
      ".animate-fade-in, .animate-slide-up, .animate-slide-down, .animate-slide-left, .animate-slide-right, .animate-scale-in"
    );

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;

      if (elementPosition < screenPosition) {
        element.style.animationPlayState = "running";
      }
    });
  }

  // Ініціалізація анімацій
  function initAnimations() {
    const elements = document.querySelectorAll(
      ".animate-fade-in, .animate-slide-up, .animate-slide-down, .animate-slide-left, .animate-slide-right, .animate-scale-in"
    );

    elements.forEach((element) => {
      // Призупинити анімацію до прокрутки
      element.style.animationPlayState = "paused";
    });

    // Запустити анімацію для елементів, які вже видно
    animateOnScroll();
  }

  // Перевірка теми
  if (localStorage.getItem("theme") === "light") {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  }

  // Перемикання теми
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.remove("light");
      htmlElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  });

  // Мобільне меню
  mobileMenuBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");
    this.classList.toggle("active");

    // Зміна іконки
    const icon = this.querySelector("i");
    if (icon.classList.contains("fa-bars")) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-times");
    } else {
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  // Перемикання вкладок
  loginTab.addEventListener("click", function () {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    // Анімація зміни форм
    registerForm.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => {
      registerForm.classList.remove("active");
      loginForm.classList.add("active");
      loginForm.style.animation = "fadeIn 0.5s forwards";
    }, 300);
  });

  registerTab.addEventListener("click", function () {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    // Анімація зміни форм
    loginForm.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => {
      loginForm.classList.remove("active");
      registerForm.classList.add("active");
      registerForm.style.animation = "fadeIn 0.5s forwards";
    }, 300);
  });

  // Перемикання між формами через посилання
  showLoginFormBtn.addEventListener("click", function (e) {
    e.preventDefault();
    loginTab.click();
  });

  showRegisterFormBtn.addEventListener("click", function (e) {
    e.preventDefault();
    registerTab.click();
  });

  // Перемикання видимості пароля
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const passwordField = this.previousElementSibling;
      const type =
        passwordField.getAttribute("type") === "password" ? "text" : "password";
      passwordField.setAttribute("type", type);

      // Анімація іконки
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
      this.style.animation = "pulse 0.5s";
      setTimeout(() => {
        this.style.animation = "";
      }, 500);
    });
  });

  // Перевірка сили пароля та вимог
  if (passwordInput) {
    const lengthCheck = document.getElementById("length-check");
    const uppercaseCheck = document.getElementById("uppercase-check");
    const lowercaseCheck = document.getElementById("lowercase-check");
    const numberCheck = document.getElementById("number-check");

    passwordInput.addEventListener("input", function () {
      const password = this.value;
      let strength = 0;
      let feedback = "";

      // Перевірка вимог
      const hasLength = password.length >= 8;
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      // Оновлення індикаторів вимог з анімацією
      toggleRequirementClass(lengthCheck, hasLength);
      toggleRequirementClass(lowercaseCheck, hasLowercase);
      toggleRequirementClass(uppercaseCheck, hasUppercase);
      toggleRequirementClass(numberCheck, hasNumber);

      // Розрахунок сили
      if (hasLength) strength += 1;
      if (hasLowercase) strength += 1;
      if (hasUppercase) strength += 1;
      if (hasNumber) strength += 1;
      if (hasSpecial) strength += 1;

      // Оновлення UI на основі сили
      strengthMeter.className = "password-strength-meter";

      if (password.length === 0) {
        strengthMeter.style.width = "0";
        strengthText.textContent = "";
      } else if (strength < 2) {
        strengthMeter.classList.add("strength-weak");
        strengthMeter.style.width = "25%";
        feedback = "Слабкий";
      } else if (strength < 3) {
        strengthMeter.classList.add("strength-medium");
        strengthMeter.style.width = "50%";
        feedback = "Середній";
      } else if (strength < 5) {
        strengthMeter.classList.add("strength-good");
        strengthMeter.style.width = "75%";
        feedback = "Хороший";
      } else {
        strengthMeter.classList.add("strength-strong");
        strengthMeter.style.width = "100%";
        feedback = "Сильний";
      }

      // Анімація зміни тексту
      strengthText.style.animation = "fadeIn 0.3s";
      strengthText.textContent = feedback;
      setTimeout(() => {
        strengthText.style.animation = "";
      }, 300);

      // Перевірка співпадіння паролів
      if (passwordConfirmInput.value) {
        checkPasswordMatch();
      }
    });

    // Перевірка співпадіння паролів
    function checkPasswordMatch() {
      if (passwordConfirmInput.value === passwordInput.value) {
        passwordConfirmInput.style.borderColor = "var(--success-color)";
        passwordConfirmInput.style.boxShadow =
          "0 0 0 2px rgba(46, 204, 113, 0.3)";
      } else {
        passwordConfirmInput.style.borderColor = "var(--danger-color)";
        passwordConfirmInput.style.boxShadow =
          "0 0 0 2px rgba(231, 76, 60, 0.3)";
      }
    }

    passwordConfirmInput.addEventListener("input", checkPasswordMatch);
  }

  // Функція для оновлення класів вимог пароля
  function toggleRequirementClass(element, isValid) {
    if (isValid) {
      if (!element.classList.contains("valid")) {
        element.classList.add("valid");
        element.querySelector("i").classList.remove("fa-circle");
        element.querySelector("i").classList.add("fa-check-circle");
        element.style.animation = "slideLeft 0.3s";
        setTimeout(() => {
          element.style.animation = "";
        }, 300);
      }
    } else {
      if (element.classList.contains("valid")) {
        element.classList.remove("valid");
        element.querySelector("i").classList.remove("fa-check-circle");
        element.querySelector("i").classList.add("fa-circle");
        element.style.animation = "slideRight 0.3s";
        setTimeout(() => {
          element.style.animation = "";
        }, 300);
      }
    }
  }

  // Система сповіщень
  window.showModal = function (message, type = "success") {
    const modalOverlay = document.getElementById("modalOverlay");
    const modalContent = document.getElementById("modalContent");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalClose = document.querySelector(".modal-close");
    const modalOkButton = document.getElementById("modalOkButton");

    // Встановлення вмісту модального вікна
    modalMessage.textContent = message;

    // Встановлення заголовка та класу на основі типу
    modalContent.className = "modal-content";
    modalContent.classList.add("modal-" + type);

    switch (type) {
      case "success":
        modalTitle.textContent = "Успіх";
        break;
      case "error":
        modalTitle.textContent = "Помилка";
        break;
      case "warning":
        modalTitle.textContent = "Попередження";
        break;
      case "info":
        modalTitle.textContent = "Інформація";
        break;
    }

    // Показ модального вікна з анімацією
    modalOverlay.style.display = "flex";
    setTimeout(() => {
      modalOverlay.classList.add("active");
    }, 10);

    // Закриття модального вікна при натисканні на кнопку закриття
    modalClose.onclick = () => {
      modalOverlay.classList.remove("active");
      setTimeout(() => {
        modalOverlay.style.display = "none";
      }, 300);
    };

    // Закриття модального вікна при натисканні на кнопку OK
    modalOkButton.onclick = () => {
      modalOverlay.classList.remove("active");
      setTimeout(() => {
        modalOverlay.style.display = "none";
      }, 300);
    };

    // Закриття модального вікна при натисканні поза ним
    modalOverlay.onclick = (event) => {
      if (event.target === modalOverlay) {
        modalOverlay.classList.remove("active");
        setTimeout(() => {
          modalOverlay.style.display = "none";
        }, 300);
      }
    };
  };

  // Валідація форми
  function validatePassword(password) {
    // Мінімум 8 символів, 1 велика літера, 1 мала літера, 1 цифра
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Обробка відправки форми
  async function handleFormSubmit(
    endpoint,
    username,
    password,
    confirmPassword = null
  ) {
    try {
      // Базова валідація
      if (!username || !password) {
        showModal("Усі поля повинні бути заповнені!", "error");
        return;
      }

      // Валідація для реєстрації
      if (endpoint === "/register") {
        if (password !== confirmPassword) {
          showModal("Паролі не співпадають!", "error");
          return;
        }

        if (!validatePassword(password)) {
          showModal(
            "Пароль повинен містити мінімум 8 символів, 1 велику літеру, 1 малу літеру та 1 цифру",
            "warning"
          );
          return;
        }

        // Перевірка згоди з умовами
        const termsAgreement = document.getElementById("termsAgreement");
        if (!termsAgreement.checked) {
          showModal(
            "Ви повинні погодитись з умовами використання та політикою конфіденційності",
            "warning"
          );
          return;
        }
      }

      // Валідація email
      if (username.includes("@") && !validateEmail(username)) {
        showModal("Введіть коректний email!", "error");
        return;
      }

      // Показ стану завантаження
      const submitButton = document.querySelector(
        `form[id="${
          endpoint === "/register" ? "registerForm" : "loginForm"
        }"] button[type="submit"]`
      );
      const originalContent =
        submitButton.querySelector(".button-content").innerHTML;
      submitButton.querySelector(".button-content").innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Зачекайте...';
      submitButton.disabled = true;

      // Додавання email до тіла запиту, якщо username схожий на email
      const requestBody = { username, password };
      if (username.includes("@") && validateEmail(username)) {
        requestBody.email = username;
      }

      // Імітація API-запиту (замініть на реальний API-запит у продакшені)
      setTimeout(() => {
        // Скидання стану кнопки
        submitButton.querySelector(".button-content").innerHTML =
          originalContent;
        submitButton.disabled = false;

        if (endpoint === "/login") {
          // Імітація успішного входу
          localStorage.setItem("userId", "user123");
          localStorage.setItem("token", "sample-token-123");

          // Збереження імені користувача, якщо вибрано "Запам'ятати мене"
          if (
            document.getElementById("rememberMe") &&
            document.getElementById("rememberMe").checked
          ) {
            localStorage.setItem("username", username);
          } else {
            sessionStorage.setItem("username", username);
          }

          showModal("Вхід успішний! Перенаправлення...", "success");

          // Перенаправлення після короткої затримки
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        } else {
          // Імітація успішної реєстрації
          showModal("Реєстрація успішна! Тепер ви можете увійти.", "success");

          // Перемикання на форму входу після реєстрації
          setTimeout(() => {
            loginTab.click();
          }, 1500);
        }
      }, 1500);

      /* 
      // Розкоментуйте для реальної API-реалізації
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Скидання стану кнопки
      submitButton.querySelector('.button-content').innerHTML = originalContent;
      submitButton.disabled = false;

      if (response.ok) {
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("token", data.token);

          // Збереження імені користувача
          if (document.getElementById("rememberMe") && document.getElementById("rememberMe").checked) {
            localStorage.setItem("username", username);
          } else {
            sessionStorage.setItem("username", username);
          }
        }

        showModal(data.message, "success");

        // Перенаправлення після короткої затримки для показу повідомлення про успіх
        setTimeout(() => {
          window.location.href = data.redirect || "index.html";
        }, 1500);
      } else {
        showModal(data.message || "Помилка авторизації", "error");
      }
      */
    } catch (error) {
      console.error("Помилка:", error);
      showModal(
        "Помилка з'єднання з сервером. Перевірте підключення до бази даних.",
        "error"
      );
    }
  }

  // Обробка відправки форми
  if (document.getElementById("registerForm")) {
    document
      .getElementById("registerForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("regUsername").value;
        const password = document.getElementById("regPassword").value;
        const confirmPassword =
          document.getElementById("regPasswordConfirm").value;
        await handleFormSubmit(
          "/register",
          username,
          password,
          confirmPassword
        );
      });
  }

  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        await handleFormSubmit("/login", username, password);
      });
  }

  // Перевірка збереженого імені користувача
  const rememberedUsername = localStorage.getItem("username");
  if (rememberedUsername && document.getElementById("loginUsername")) {
    document.getElementById("loginUsername").value = rememberedUsername;
    if (document.getElementById("rememberMe")) {
      document.getElementById("rememberMe").checked = true;
    }
  }

  // Перевірка, чи користувач вже увійшов у систему
  const userId = localStorage.getItem("userId");
  if (userId) {
    showModal("Ви вже увійшли в систему. Перенаправлення...", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }

  // Кнопка "Вгору"
  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.add("visible");
      } else {
        backToTopButton.classList.remove("visible");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Ініціалізація іконок перемикання пароля
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.classList.add("fa-eye");
  });

  // Плавна прокрутка для всіх посилань
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      if (this.getAttribute("href") !== "#") {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
          });
        }
      }
    });
  });

  // Додавання підтримки сенсорного екрану для кращого мобільного досвіду
  let touchStartY;

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.changedTouches[0].screenY;
    },
    false
  );

  document.addEventListener(
    "touchend",
    (e) => {
      const touchEndY = e.changedTouches[0].screenY;
      const touchDiff = touchStartY - touchEndY;

      // Якщо користувач проводить пальцем вгору значно внизу сторінки, показати кнопку "Вгору"
      if (touchDiff > 100 && window.scrollY > window.innerHeight) {
        if (backToTopButton) {
          backToTopButton.classList.add("visible");

          // Приховати через 3 секунди, якщо не використовується
          setTimeout(() => {
            if (!backToTopButton.classList.contains("clicked")) {
              backToTopButton.classList.remove("visible");
            }
          }, 3000);
        }
      }
    },
    false
  );

  // Позначити кнопку "Вгору" як натиснуту при використанні
  if (backToTopButton) {
    backToTopButton.addEventListener("click", function () {
      this.classList.add("clicked");
      setTimeout(() => {
        this.classList.remove("clicked");
      }, 1000);
    });
  }

  // Анімація частинок фону
  function createParticles() {
    const particles = document.querySelectorAll(".particle");
    particles.forEach((particle) => {
      // Випадкові початкові позиції
      const randomX = Math.random() * window.innerWidth;
      const randomY = Math.random() * window.innerHeight;
      particle.style.left = `${randomX}px`;
      particle.style.top = `${randomY}px`;
    });
  }

  // Анімація елементів при прокрутці
  window.addEventListener("scroll", animateOnScroll);

  // Ініціалізація анімацій
  initAnimations();

  // Ініціалізація частинок фону
  createParticles();

  // Додавання анімації для соціальних кнопок
  const socialButtons = document.querySelectorAll(".social-button");
  socialButtons.forEach((button, index) => {
    button.style.animationDelay = `${index * 0.1}s`;
  });

  // Додавання анімації для елементів форми
  const formElements = document.querySelectorAll(
    ".input-group, .auth-options, .auth-button, .form-footer"
  );
  formElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.1}s`;
  });

  // Додавання анімації для елементів футера
  const footerElements = document.querySelectorAll(".footer-section");
  footerElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.2}s`;
  });

  // Додавання анімації для елементів хедера
  const headerElements = document.querySelectorAll(".nav-link");
  headerElements.forEach((element, index) => {
    element.classList.add("animate-fade-in");
    element.style.animationDelay = `${index * 0.1}s`;
  });

  // Додавання ефекту хвилі для кнопок при натисканні
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Створення ефекту хвилі
      const ripple = document.createElement("span");
      ripple.classList.add("ripple-effect");

      // Позиціонування ефекту хвилі
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      // Видалення ефекту хвилі після анімації
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
});

// Додавання CSS для ефекту хвилі
document.addEventListener("DOMContentLoaded", function () {
  const style = document.createElement("style");
  style.textContent = `
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
});
