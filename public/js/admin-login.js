document.addEventListener("DOMContentLoaded", function () {
  // Theme toggle functionality
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  // Check for saved theme preference
  if (localStorage.getItem("theme") === "light") {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  }

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

  // Form submission
  const form = document.getElementById("adminLoginForm");
  const passwordInput = document.getElementById("adminPassword");
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.style.display = "none";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const enteredPassword = passwordInput.value.trim();

    if (enteredPassword === "319560") {
      sessionStorage.setItem("isAdmin", "true");
      window.location.href = "admin.html";
    } else {
      errorMessage.textContent = "Пароль введено неправильно.";
      errorMessage.style.display = "block";

      // Gentle shake animation for error
      errorMessage.style.animation = "shake 0.4s ease-in-out";
      setTimeout(() => {
        errorMessage.style.animation = "";
      }, 400);
    }
  });
});
