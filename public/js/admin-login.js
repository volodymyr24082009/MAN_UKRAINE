document.addEventListener("DOMContentLoaded", function () {
  // Check if already authenticated
  if (localStorage.getItem("adminAuthenticated") === "true") {
    window.location.href = "admin.html";
  }

  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Check credentials
    if (username === "24g_chvv" && password === "319560") {
      // Set authentication in localStorage
      localStorage.setItem("adminAuthenticated", "true");

      // Redirect to admin panel
      window.location.href = "admin.html";
    } else {
      // Show error message
      errorMessage.classList.add("show");

      // Clear password field
      document.getElementById("password").value = "";
    }
  });
});
