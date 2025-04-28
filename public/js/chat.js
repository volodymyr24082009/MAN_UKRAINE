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
  const loadMoreBtn = document.createElement("button");

  // Set up load more button
  loadMoreBtn.id = "load-more-btn";
  loadMoreBtn.className = "load-more-btn";
  loadMoreBtn.innerHTML = "Завантажити більше повідомлень";
  loadMoreBtn.style.display = "none";

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
  let displayedHistoryCount = 0;
  const INITIAL_MESSAGES_TO_LOAD = 30; // Initial number of messages to load
  const MESSAGES_PER_LOAD = 20; // Number of messages to load when clicking "Load more"
  const MAX_MESSAGES_PER_BATCH = 5; // Process messages in smaller batches

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

  // Load more button event listener
  loadMoreBtn.addEventListener("click", () => {
    loadMoreMessages();
  });

  // Fix for chat container scrolling
  function setupChatContainer() {
    // Make sure the messages container has a fixed height and proper overflow
    const chatContentHeight = chatContent.clientHeight;
    const inputAreaHeight =
      document.querySelector(".chat-input-area").clientHeight;
    const headerHeight = document.querySelector(".chat-header").clientHeight;

    // Set a fixed height for the messages container
    messagesContainer.style.height = `${
      chatContentHeight - inputAreaHeight - headerHeight - 20
    }px`;
    messagesContainer.style.overflowY = "auto";
    messagesContainer.style.display = "flex";
    messagesContainer.style.flexDirection = "column";

    // Add padding to the bottom to ensure messages don't get hidden behind the input
    messagesContainer.style.paddingBottom = "10px";

    // Make sure the input area stays at the bottom
    document.querySelector(".chat-input-area").style.position = "sticky";
    document.querySelector(".chat-input-area").style.bottom = "0";
    document.querySelector(".chat-input-area").style.backgroundColor =
      "var(--bg-color)";
    document.querySelector(".chat-input-area").style.zIndex = "10";

    // Ensure the chat content has proper layout
    chatContent.style.display = "flex";
    chatContent.style.flexDirection = "column";
    chatContent.style.height = "100%";
  }

  // Socket event listeners
  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("message", (message) => {
    // Add message to history
    chatHistory.push(message);

    // Display the new message
    displayMessage(message, message.username === currentUser.username);

    // Scroll to bottom after adding a new message
    scrollToBottom();
  });

  // Listen for chat history when joining
  socket.on("chat-history", (history) => {
    // Store the full chat history
    chatHistory = history;
    displayedHistoryCount = 0;

    // Clear existing messages before displaying history
    messagesContainer.innerHTML = "";

    // Add the "load more" button at the top if there are more than INITIAL_MESSAGES_TO_LOAD messages
    if (history.length > INITIAL_MESSAGES_TO_LOAD) {
      messagesContainer.prepend(loadMoreBtn);
      loadMoreBtn.style.display = "block";
    }

    // Display initial batch of messages
    const startIndex = Math.max(0, history.length - INITIAL_MESSAGES_TO_LOAD);
    const initialMessages = history.slice(startIndex);
    displayedHistoryCount = initialMessages.length;

    // Display messages in batches
    displayMessageBatch(initialMessages, 0, false);

    // Add a system message indicating there are more messages if needed
    if (history.length > INITIAL_MESSAGES_TO_LOAD) {
      const systemMessage = {
        username: "Система",
        type: "system",
        text: `Показано останні ${INITIAL_MESSAGES_TO_LOAD} повідомлень з ${history.length}. Натисніть "Завантажити більше" для перегляду старіших повідомлень.`,
        timestamp: new Date().toISOString(),
      };

      // Insert the system message after the load more button
      const systemElement = createMessageElement(systemMessage, false, true);
      if (messagesContainer.firstChild === loadMoreBtn) {
        messagesContainer.insertBefore(systemElement, loadMoreBtn.nextSibling);
      } else {
        messagesContainer.prepend(systemElement);
      }
    }
  });

  // Load more messages when the button is clicked
  function loadMoreMessages() {
    // Calculate how many messages we've already displayed
    const remainingMessages = chatHistory.length - displayedHistoryCount;

    if (remainingMessages <= 0) {
      loadMoreBtn.style.display = "none";
      return;
    }

    // Calculate the start index for the next batch
    const startIndex = Math.max(
      0,
      chatHistory.length - displayedHistoryCount - MESSAGES_PER_LOAD
    );
    const messagesToLoad = Math.min(MESSAGES_PER_LOAD, remainingMessages);

    // Get the messages to load
    const messages = chatHistory.slice(startIndex, startIndex + messagesToLoad);
    displayedHistoryCount += messages.length;

    // Remember the current scroll position
    const scrollPos =
      messagesContainer.scrollHeight - messagesContainer.scrollTop;

    // Create a document fragment to hold the new messages
    const fragment = document.createDocumentFragment();

    // Create elements for each message
    messages.forEach((message) => {
      const messageElement = createMessageElement(
        message,
        message.username === currentUser.username,
        message.type === "system"
      );
      fragment.appendChild(messageElement);
    });

    // Insert the new messages after the load more button
    if (messagesContainer.firstChild === loadMoreBtn) {
      messagesContainer.insertBefore(fragment, loadMoreBtn.nextSibling);
    } else {
      messagesContainer.prepend(fragment);
    }

    // Update the load more button visibility
    if (displayedHistoryCount >= chatHistory.length) {
      loadMoreBtn.style.display = "none";

      // Add a system message indicating all messages are loaded
      const systemMessage = {
        username: "Система",
        type: "system",
        text: `Завантажено всю історію повідомлень.`,
        timestamp: new Date().toISOString(),
      };

      const systemElement = createMessageElement(systemMessage, false, true);
      messagesContainer.prepend(systemElement);
    }

    // Maintain the scroll position
    messagesContainer.scrollTop = messagesContainer.scrollHeight - scrollPos;
  }

  // Display messages in batches to prevent UI freezing
  function displayMessageBatch(messages, startIndex, isNewMessages = true) {
    const endIndex = Math.min(
      startIndex + MAX_MESSAGES_PER_BATCH,
      messages.length
    );
    const batch = messages.slice(startIndex, endIndex);

    // Create a document fragment to minimize DOM operations
    const fragment = document.createDocumentFragment();

    batch.forEach((message) => {
      const messageElement = createMessageElement(
        message,
        message.username === currentUser.username,
        message.type === "system"
      );
      fragment.appendChild(messageElement);
    });

    // Append or prepend based on whether these are new or old messages
    if (isNewMessages) {
      messagesContainer.appendChild(fragment);
    } else {
      // If the load more button exists, insert after it
      if (messagesContainer.contains(loadMoreBtn)) {
        messagesContainer.insertBefore(fragment, loadMoreBtn.nextSibling);
      } else {
        messagesContainer.appendChild(fragment);
      }
    }

    // If there are more messages to process, schedule the next batch
    if (endIndex < messages.length) {
      setTimeout(() => {
        displayMessageBatch(messages, endIndex, isNewMessages);
      }, 0);
    } else if (isNewMessages) {
      // When all new messages are displayed, scroll to bottom
      scrollToBottom();
    }
  }

  // Create a message element
  function createMessageElement(message, isSent, isSystem = false) {
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
      userTypeSpan.classList.add(message.type || "user");
      userTypeSpan.textContent =
        message.type === "master" ? "Майстер" : "Користувач";

      // Add timestamp to message
      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("message-time");

      // Format the timestamp
      let messageTime;
      try {
        const messageDate = new Date(message.timestamp);
        messageTime = messageDate.toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        messageTime = ""; // In case of invalid timestamp
      }

      timestampSpan.textContent = messageTime;

      messageInfo.textContent = message.username + " ";
      messageInfo.appendChild(userTypeSpan);
      messageInfo.appendChild(timestampSpan);

      const messageText = document.createElement("div");
      messageText.classList.add("message-text");
      messageText.textContent = message.text;

      messageElement.appendChild(messageInfo);
      messageElement.appendChild(messageText);
    }

    return messageElement;
  }

  socket.on("user-joined", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} приєднався до чату`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);
    scrollToBottom();
  });

  socket.on("user-left", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} покинув чат`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);
    scrollToBottom();
  });

  // Scroll to bottom of messages container
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

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

      // Set up the chat container layout
      setupChatContainer();

      // Join the chat and request chat history
      socket.emit("join", currentUser);

      // Update login button in header
      if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Вийти`;
        loginBtn.addEventListener("click", handleLogout);
      }

      // Add window resize listener to adjust chat container
      window.addEventListener("resize", setupChatContainer);
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

    // Limit message length for performance
    const truncatedText =
      text.length > 1000 ? text.substring(0, 1000) + "..." : text;

    const message = {
      username: currentUser.username,
      type: currentUser.type,
      text: truncatedText,
      timestamp: new Date().toISOString(),
    };

    // Send message to server
    socket.emit("message", message);

    // Clear input
    messageInput.value = "";

    // Focus back on input for better UX
    messageInput.focus();
  }

  // Display a single message
  function displayMessage(message, isSent, isSystem = false) {
    const messageElement = createMessageElement(message, isSent, isSystem);
    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    scrollToBottom();
  }

  // Add CSS to fix chat container styling
  function addChatStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .chat-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 80vh;
      }
      
      .chat-header {
        padding: 10px;
        border-bottom: 1px solid var(--border-color);
      }
      
      #messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }
      
      .chat-input-area {
        padding: 10px;
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 10px;
        position: sticky;
        bottom: 0;
        background-color: var(--bg-color);
        z-index: 10;
      }
      
      #message-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
      }
      
      .message {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        word-break: break-word;
      }
      
      .message.sent {
        align-self: flex-end;
        background-color: var(--primary-color);
        color: white;
      }
      
      .message.received {
        align-self: flex-start;
        background-color: var(--bg-secondary);
      }
      
      .message.system {
        align-self: center;
        background-color: var(--bg-tertiary);
        font-style: italic;
        padding: 4px 12px;
        font-size: 0.9em;
      }
      
      .message-info {
        display: flex;
        align-items: center;
        font-size: 0.85em;
        margin-bottom: 4px;
      }
      
      .user-type {
        margin-left: 5px;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.8em;
      }
      
      .user-type.master {
        background-color: #ffcc00;
        color: #333;
      }
      
      .user-type.user {
        background-color: #6c757d;
        color: white;
      }
      
      .message-time {
        margin-left: auto;
        font-size: 0.8em;
        opacity: 0.7;
      }
      
      .message-text {
        line-height: 1.4;
      }
      
      .load-more-btn {
        align-self: center;
        margin: 10px 0;
        padding: 5px 15px;
        background-color: var(--bg-secondary);
        border: none;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s;
      }
      
      .load-more-btn:hover {
        background-color: var(--bg-tertiary);
      }
    `;
    document.head.appendChild(style);
  }

  // Add the CSS styles
  addChatStyles();

  // Load user data when page loads
  loadUserData();
});
