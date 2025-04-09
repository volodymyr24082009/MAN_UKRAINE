// Theme Toggle
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

// Check for saved theme preference
if (localStorage.getItem("theme") === "light") {
  htmlElement.classList.remove("dark");
  htmlElement.classList.add("light");
  themeToggle.checked = true;
}

// Toggle theme when switch is clicked
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

// Password visibility toggle
document.querySelectorAll(".password-toggle").forEach((toggle) => {
  toggle.addEventListener("click", function () {
    const passwordField = this.previousElementSibling;
    const type =
      passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });
});

// Form switching
document.getElementById("showLoginForm").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("loginForm").style.animation =
    "fadeIn 0.5s ease-out forwards";
});

document.getElementById("showRegisterForm").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.getElementById("registerForm").style.animation =
    "fadeIn 0.5s ease-out forwards";
});

// Password strength meter
const passwordInput = document.getElementById("regPassword");
const strengthMeter = document.getElementById("passwordStrengthMeter");
const strengthText = document.getElementById("passwordStrengthText");

passwordInput.addEventListener("input", function () {
  const password = this.value;
  let strength = 0;
  let feedback = "";

  // Length check
  if (password.length >= 8) {
    strength += 1;
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    strength += 1;
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    strength += 1;
  }

  // Contains number
  if (/[0-9]/.test(password)) {
    strength += 1;
  }

  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 1;
  }

  // Update UI based on strength
  strengthMeter.className = "password-strength-meter";

  if (password.length === 0) {
    strengthMeter.style.width = "0";
    strengthText.textContent = "";
  } else if (strength < 2) {
    strengthMeter.classList.add("strength-weak");
    feedback = "Слабкий";
  } else if (strength < 3) {
    strengthMeter.classList.add("strength-medium");
    feedback = "Середній";
  } else if (strength < 5) {
    strengthMeter.classList.add("strength-good");
    feedback = "Хороший";
  } else {
    strengthMeter.classList.add("strength-strong");
    feedback = "Сильний";
  }

  strengthText.textContent = feedback;
});

// Modal notification system
function showModal(message, type = "success") {
  const modalOverlay = document.getElementById("modalOverlay");
  const modalContent = document.getElementById("modalContent");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalClose = document.querySelector(".modal-close");
  const modalOkButton = document.getElementById("modalOkButton");

  // Set modal content
  modalMessage.textContent = message;

  // Set title and class based on type
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

  // Show modal
  modalOverlay.style.display = "flex";
  modalOverlay.classList.add("active");

  // Close modal when clicking the close button
  modalClose.onclick = () => {
    modalOverlay.classList.remove("active");
    setTimeout(() => {
      modalOverlay.style.display = "none";
    }, 300);
  };

  // Close modal when clicking the OK button
  modalOkButton.onclick = () => {
    modalOverlay.classList.remove("active");
    setTimeout(() => {
      modalOverlay.style.display = "none";
    }, 300);
  };

  // Close modal when clicking outside the modal
  modalOverlay.onclick = (event) => {
    if (event.target === modalOverlay) {
      modalOverlay.classList.remove("active");
      setTimeout(() => {
        modalOverlay.style.display = "none";
      }, 300);
    }
  };
}

// Form validation
function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Form handling
async function handleFormSubmit(
  endpoint,
  username,
  password,
  confirmPassword = null
) {
  try {
    // Basic validation
    if (!username || !password) {
      showModal("Усі поля повинні бути заповнені!", "error");
      return;
    }

    // Registration specific validation
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
    }

    // Email validation if username looks like an email
    if (username.includes("@") && !validateEmail(username)) {
      showModal("Введіть коректний email!", "error");
      return;
    }

    // Show loading state
    const submitButton = document.querySelector(
      `form[id="${
        endpoint === "/register" ? "registerForm" : "loginForm"
      }"] button[type="submit"]`
    );
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Зачекайте...';
    submitButton.disabled = true;

    // Add email to request body if username looks like an email
    const requestBody = { username, password };
    if (username.includes("@") && validateEmail(username)) {
      requestBody.email = username;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;

    if (response.ok) {
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("token", data.token);
        localStorage.setItem("authType", "local");

        // Store username
        if (
          document.getElementById("rememberMe") &&
          document.getElementById("rememberMe").checked
        ) {
          localStorage.setItem("username", username);
        } else {
          sessionStorage.setItem("username", username);
        }
      }

      showModal(data.message, "success");

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        window.location.href = data.redirect || "index.html";
      }, 1500);
    } else {
      showModal(data.message || "Помилка авторизації", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showModal(
      "Помилка з'єднання з сервером. Перевірте підключення до бази даних.",
      "error"
    );
  }
}

// Google Authentication Handler
function handleGoogleAuth() {
  // Show loading state in the Google button
  const googleButton = document.getElementById("googleAuthButton");
  if (googleButton) {
    const originalText = googleButton.innerHTML;
    googleButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Зачекайте...';
    googleButton.disabled = true;

    // Redirect to Google auth endpoint
    window.location.href = "/auth/google";
  }
}

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regPasswordConfirm").value;
    await handleFormSubmit("/register", username, password, confirmPassword);
  });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  await handleFormSubmit("/login", username, password);
});

// Add event listener for Google auth button
document.addEventListener("DOMContentLoaded", () => {
  const googleAuthButton = document.getElementById("googleAuthButton");
  if (googleAuthButton) {
    googleAuthButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleGoogleAuth();
    });
  }

  const googleRegAuthButton = document.getElementById("googleRegAuthButton");
  if (googleRegAuthButton) {
    googleRegAuthButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleGoogleAuth();
    });
  }
});

// Check for remembered username
window.addEventListener("DOMContentLoaded", () => {
  const rememberedUsername = localStorage.getItem("username");
  if (rememberedUsername) {
    document.getElementById("loginUsername").value = rememberedUsername;
    document.getElementById("rememberMe").checked = true;
  }

  // Check for authentication errors in URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  if (error) {
    if (error === "authentication_failed") {
      showModal(
        "Помилка автентифікації через Google. Спробуйте ще раз або використайте інший метод входу.",
        "error"
      );
    }
  }
});

// Initialize UI state
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const userId = localStorage.getItem("userId");
  if (userId) {
    showModal("Ви вже увійшли в систему. Перенаправлення...", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }

  // Back to top button functionality
  const backToTopButton = document.getElementById("backToTop");
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

  // Initialize password toggle icons
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.classList.add("fa-eye");
  });

  // Add this function to better handle responsive behavior
  function handleResponsiveLayout() {
    const windowWidth = window.innerWidth;

    // Adjust form layout based on screen size
    if (windowWidth <= 576) {
      // For very small screens, simplify some elements
      document.querySelectorAll("form button").forEach((button) => {
        // Simplify button text on small screens
        const icon = button.querySelector("i");
        const text = button.textContent.trim();

        if (button.dataset.originalText === undefined) {
          button.dataset.originalText = text;
        }

        if (text.includes("ЗАРЕЄСТРУВАТИСЯ")) {
          button.innerHTML = "";
          button.appendChild(icon);
          button.appendChild(document.createTextNode(" РЕЄСТРАЦІЯ"));
        } else if (text.includes("УВІЙТИ")) {
          button.innerHTML = "";
          button.appendChild(icon);
          button.appendChild(document.createTextNode(" ВХІД"));
        }
      });
    } else {
      // Restore original button text on larger screens
      document.querySelectorAll("form button").forEach((button) => {
        if (button.dataset.originalText) {
          const icon = button.querySelector("i");
          button.innerHTML = "";
          button.appendChild(icon);
          button.appendChild(
            document.createTextNode(" " + button.dataset.originalText)
          );
        }
      });
    }
  }

  // Handle responsive layout
  handleResponsiveLayout();
  window.addEventListener("resize", handleResponsiveLayout);

  // Add smooth scrolling for all links
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

  // Add touch support for better mobile experience
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

      // If user swipes up significantly at the bottom of the page, show back-to-top button
      if (touchDiff > 100 && window.scrollY > window.innerHeight) {
        const backToTopButtonElement = document.getElementById("backToTop");
        if (backToTopButtonElement) {
          backToTopButtonElement.classList.add("visible");

          // Hide after 3 seconds if not used
          setTimeout(() => {
            if (!backToTopButtonElement.classList.contains("clicked")) {
              backToTopButtonElement.classList.remove("visible");
            }
          }, 3000);
        }
      }
    },
    false
  );

  // Mark back-to-top button as clicked when used
  const backToTopButtonElement = document.getElementById("backToTop");
  if (backToTopButtonElement) {
    backToTopButtonElement.addEventListener("click", function () {
      this.classList.add("clicked");
      setTimeout(() => {
        this.classList.remove("clicked");
      }, 1000);
    });
  }

  // Optimize form transitions
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("transitionend", function (e) {
      if (e.propertyName === "transform" && this.style.display === "none") {
        this.style.transform = "";
      }
    });
  });
});
