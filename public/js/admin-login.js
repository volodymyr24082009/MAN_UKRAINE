
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
    