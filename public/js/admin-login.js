
        // Theme Toggle
        const themeToggle = document.getElementById("themeToggle");
        const htmlElement = document.documentElement;
        const themeIcon = themeToggle.querySelector("i");

        // Check for saved theme preference
        if (localStorage.getItem("theme") === "light") {
            htmlElement.classList.remove("dark");
            htmlElement.classList.add("light");
            themeIcon.classList.remove("fa-moon");
            themeIcon.classList.add("fa-sun");
        }

        // Toggle theme when button is clicked
        themeToggle.addEventListener("click", function() {
            if (htmlElement.classList.contains("dark")) {
                htmlElement.classList.remove("dark");
                htmlElement.classList.add("light");
                themeIcon.classList.remove("fa-moon");
                themeIcon.classList.add("fa-sun");
                localStorage.setItem("theme", "light");
            } else {
                htmlElement.classList.remove("light");
                htmlElement.classList.add("dark");
                themeIcon.classList.remove("fa-sun");
                themeIcon.classList.add("fa-moon");
                localStorage.setItem("theme", "dark");
            }
        });

        // Password Toggle
        const passwordToggle = document.getElementById("passwordToggle");
        const passwordInput = document.getElementById("password");

        passwordToggle.addEventListener("click", function() {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            
            // Toggle icon
            const icon = this.querySelector("i");
            if (type === "text") {
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });

        // Check password function
        function checkPassword(event) {
            // Prevent default form submission
            event.preventDefault();
            
            const loginMessage = document.getElementById("loginMessage");
            const password = passwordInput.value;
            const correctPassword = "319560";
            
            if (password === correctPassword) {
                // Success - show message
                loginMessage.textContent = "Пароль вірний. Перенаправлення...";
                loginMessage.className = "form-message success";
                
                // Set a flag in localStorage to indicate successful login
                localStorage.setItem("adminAuthenticated", "true");
                
                // Redirect to admin.html
                window.location.href = "admin.html";
                
                // Return false to prevent form submission
                return false;
            } else {
                // Error - show message and shake effect
                loginMessage.textContent = "Пароль введено неправильно";
                loginMessage.className = "form-message error";
                
                // Add shake animation
                const loginCard = document.querySelector(".login-card");
                loginCard.classList.add("shake");
                
                // Remove shake class after animation completes
                loginCard.addEventListener("animationend", function() {
                    this.classList.remove("shake");
                });
                
                // Clear password field
                passwordInput.value = "";
                passwordInput.focus();
                
                // Return false to prevent form submission
                return false;
            }
        }
    //role.js
function updateUIForLoginStatus() {
    const isLoggedIn = checkUserLoggedIn()
    const orderSection = document.getElementById("order")
    const orderLink = document.getElementById("orderLink")
    const profileLink = document.getElementById("profileLink")
    const profileFooterLink = document.getElementById("profileFooterLink")
    const loginBtn = document.getElementById("loginBtn")
    const loginModal = document.getElementById("loginModal")
    const reviewSection = document.getElementById("review-form")
  
    if (isLoggedIn) {
      // User is logged in
      if (orderSection) orderSection.style.display = "block"
      if (orderLink) orderLink.style.display = "block"
      if (profileLink) profileLink.style.display = "block"
      if (profileFooterLink) profileFooterLink.style.display = "block"
      if (reviewSection) reviewSection.style.display = "block"
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти'
        loginBtn.removeEventListener("click", redirectToAuth)
        loginBtn.addEventListener("click", logoutUser)
      }
  
      // Check user role and update UI accordingly
      const userId = localStorage.getItem("userId")
      if (userId && window.RoleSystem) {
        window.RoleSystem.checkUserRole(userId)
      } else {
        // If RoleSystem is not available, hide master elements by default
        const infoLink = document.getElementById("info")
        if (infoLink) infoLink.style.display = "none"
      }
    } else {
      // User is not logged in
      if (orderSection) orderSection.style.display = "none"
      if (orderLink) orderLink.style.display = "none"
      if (profileLink) profileLink.style.display = "none"
      if (profileFooterLink) profileFooterLink.style.display = "none"
      if (reviewSection) reviewSection.style.display = "none"
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Увійти'
        loginBtn.removeEventListener("click", logoutUser)
        loginBtn.addEventListener("click", redirectToAuth)
      }
  
      // Show login modal for new users
      if (loginModal && !localStorage.getItem("modalShown")) {
        setTimeout(() => {
          loginModal.classList.add("active")
          localStorage.setItem("modalShown", "true")
        }, 1500)
      }
  
      // Hide master elements for non-logged in users
      const infoLink = document.getElementById("info")
      if (infoLink) infoLink.style.display = "none"
    }
  }
  
  // Mock functions to resolve undeclared variable errors.  These should be replaced with actual implementations.
  function checkUserLoggedIn() {
    // Replace with actual implementation
    return localStorage.getItem("token") !== null
  }
  
  function redirectToAuth() {
    // Replace with actual implementation
    window.location.href = "/auth" // Or wherever your auth endpoint is
  }
  
  function logoutUser() {
    // Replace with actual implementation
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    updateUIForLoginStatus() // Refresh the UI
  }
  