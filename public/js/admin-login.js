document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("adminLoginForm");
  const passwordInput = document.getElementById("adminPassword");
  const errorMessage = document.getElementById("errorMessage");

  // Сховати повідомлення про помилку спочатку
  errorMessage.style.display = "none";

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Щоб не перезавантажувалась сторінка

    const enteredPassword = passwordInput.value;

    if (enteredPassword === "319560") {
      window.location.href = "admin.html"; // Перехід на сторінку адмінки
    } else {
      errorMessage.textContent = "Пароль введено неправильно.";
      errorMessage.style.display = "block";
    }
  });
});
