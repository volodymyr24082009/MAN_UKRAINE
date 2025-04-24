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

  // Connect to Socket.io server with connection optimization options
  const socket = io({
    transports: ["websocket"], // Use WebSocket transport only for better performance
    upgrade: false, // Disable transport upgrades
    reconnectionAttempts: 5, // Limit reconnection attempts
    timeout: 10000, // Connection timeout
  });

  // User data
  let currentUser = {
    username: "",
    type: "",
    userId: null,
  };

  // Chat history cache
  let chatHistory = [];
  const MAX_DISPLAYED_MESSAGES = 50; // Limit displayed messages for performance

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
    // Add message to history
    chatHistory.push(message);
    displayMessage(message, message.username === currentUser.username);
  });

  // Listen for chat history when joining
  socket.on("chat-history", (history) => {
    chatHistory = history;

    // Clear existing messages before displaying history
    messagesContainer.innerHTML = "";

    // Display only the last MAX_DISPLAYED_MESSAGES messages for performance
    const messagesToDisplay = history.slice(-MAX_DISPLAYED_MESSAGES);

    // Display each message from history
    messagesToDisplay.forEach((message) => {
      displayMessage(message, message.username === currentUser.username);
    });

    // Add a system message indicating there are more messages if needed
    if (history.length > MAX_DISPLAYED_MESSAGES) {
      const systemMessage = {
        username: "Система",
        type: "system",
        text: `Показано останні ${MAX_DISPLAYED_MESSAGES} повідомлень з ${history.length}`,
        timestamp: new Date().toISOString(),
      };
      displayMessage(systemMessage, false, true);
    }
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
      // Show loading spinner
      loginContainer.innerHTML = `
        <div class="login-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Завантаження даних користувача...</p>
        </div>
      `;

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

      // Join the chat and request chat history
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

  // Optimized message display function with debouncing for better performance
  const displayMessage = (() => {
    const pendingMessages = [];
    let isProcessing = false;

    // Process messages in batches for better performance
    function processPendingMessages() {
      if (pendingMessages.length === 0) {
        isProcessing = false;
        return;
      }

      isProcessing = true;
      const fragment = document.createDocumentFragment();

      // Process up to 10 messages at once
      const messagesToProcess = pendingMessages.splice(0, 10);

      messagesToProcess.forEach(({ message, isSent, isSystem }) => {
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

        fragment.appendChild(messageElement);
      });

      messagesContainer.appendChild(fragment);

      // Scroll to bottom only after all messages are added
      if (pendingMessages.length === 0) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      // Continue processing remaining messages if any
      if (pendingMessages.length > 0) {
        setTimeout(processPendingMessages, 10); // Small delay to prevent UI blocking
      } else {
        isProcessing = false;
      }
    }

    // Return the actual function that will be called
    return (message, isSent, isSystem = false) => {
      pendingMessages.push({ message, isSent, isSystem });

      if (!isProcessing) {
        processPendingMessages();
      }
    };
  })();

  // Limit the number of messages in the container for performance
  function pruneOldMessages() {
    while (messagesContainer.children.length > MAX_DISPLAYED_MESSAGES) {
      messagesContainer.removeChild(messagesContainer.firstChild);
    }
  }

  // Periodically prune old messages to maintain performance
  setInterval(pruneOldMessages, 60000); // Check every minute

  // Load user data when page loads
  loadUserData();
});
