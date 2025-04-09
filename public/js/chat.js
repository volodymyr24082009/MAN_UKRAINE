document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginContainer = document.getElementById("login-container");
  const chatContent = document.getElementById("chat-content");
  const logoutBtn = document.getElementById("logout-btn");
  const currentUserDisplay = document.getElementById("current-user");
  const messagesContainer = document.getElementById("messages-container");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const loginBtn = document.getElementById("loginBtn");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  // Connect to Socket.io server
  const socket = io();

  // User data
  let currentUser = {
    username: "",
    type: "",
    userId: null,
  };

  // Mobile menu toggle
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-bars");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-times");
    });
  }

  // Check if user is logged in (token in localStorage)
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    // Show login error
    loginContainer.innerHTML = `
        <div class="login-error">
          <i class="fas fa-exclamation-circle"></i>
          <p>Для використання чату необхідно <a href="auth.html">увійти в систему</a>.</p>
        </div>
      `;

    // Update login button
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        window.location.href = "auth.html";
      });
    }

    return;
  }

  // Event Listeners
  logoutBtn.addEventListener("click", handleLogout);
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Socket event listeners
  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("message", (message) => {
    displayMessage(message, message.username === currentUser.username);
  });

  socket.on("user-joined", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} приєднався до чату`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);
  });

  socket.on("user-left", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} покинув чат`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);
  });

  // Functions
  async function loadUserData() {
    try {
      // Fetch user profile data
      const profileResponse = await fetch(`/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const profileData = await profileResponse.json();

      // Fetch user data
      const userResponse = await fetch(`/admin/users-with-services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const usersData = await userResponse.json();
      const userData = usersData.find((user) => user.id == userId);

      if (!userData) {
        throw new Error("User not found");
      }

      // Set current user data
      currentUser = {
        username: userData.username,
        type: userData.role_master ? "master" : "user",
        userId: userId,
      };

      // Update UI
      currentUserDisplay.textContent = `${currentUser.username} (${
        currentUser.type === "master" ? "Майстер" : "Користувач"
      })`;
      loginContainer.classList.add("hidden");
      chatContent.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");

      // Join the chat
      socket.emit("join", currentUser);

      // Update login button in header
      if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Вийти`;
        loginBtn.addEventListener("click", handleLogout);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Show error message
      loginContainer.innerHTML = `
          <div class="login-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Помилка завантаження даних користувача. <a href="auth.html">Увійдіть знову</a>.</p>
          </div>
        `;
    }
  }

  function handleLogout() {
    // Leave the chat
    socket.emit("leave", currentUser);

    // Clear user data
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    // Redirect to login page
    window.location.href = "auth.html";
  }

  function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) return;

    const message = {
      username: currentUser.username,
      type: currentUser.type,
      text,
      timestamp: new Date().toISOString(),
    };

    // Send message to server
    socket.emit("message", message);

    // Clear input
    messageInput.value = "";
  }

  function displayMessage(message, isSent, isSystem = false) {
    const messageElement = document.createElement("div");

    if (isSystem) {
      messageElement.classList.add("message", "system");
      messageElement.textContent = message.text;
    } else {
      messageElement.classList.add("message");
      messageElement.classList.add(isSent ? "sent" : "received");

      const messageInfo = document.createElement("div");
      messageInfo.classList.add("message-info");

      const userTypeSpan = document.createElement("span");
      userTypeSpan.classList.add("user-type");
      userTypeSpan.classList.add(message.type);
      userTypeSpan.textContent =
        message.type === "master" ? "Майстер" : "Користувач";

      messageInfo.textContent = message.username;
      messageInfo.appendChild(userTypeSpan);

      const messageText = document.createElement("div");
      messageText.textContent = message.text;

      messageElement.appendChild(messageInfo);
      messageElement.appendChild(messageText);
    }

    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Load user data when page loads
  loadUserData();
});
