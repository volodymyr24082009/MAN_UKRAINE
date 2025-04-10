// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Set up UI elements and event listeners
    setupThemeToggle();
    setupMobileMenu();
    setupNavigation();
    setupBackToTop();
    setupModal();
    setupMessageFilters();

    // Initialize data
    await loadMessages();
    await loadStatistics();

    // Initialize Socket.io for real-time updates
    initializeSocketIO();
  } catch (err) {
    console.error("Error initializing page:", err);
    showError("Failed to initialize the page. Please refresh and try again.");
  }
});

// Theme toggle functionality
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  // Check for saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  }

  // Theme toggle event handler
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  });
}

// Mobile menu functionality
function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");

  mobileMenuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    mobileMenuBtn.innerHTML = navMenu.classList.contains("active")
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  });

  // Close menu when clicking a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

// Navigation between views
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link[data-view]");
  const views = document.querySelectorAll(".view");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all links and views
      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      views.forEach((view) => view.classList.remove("active"));

      // Add active class to clicked link and corresponding view
      link.classList.add("active");
      const viewId = link.dataset.view + "View";
      document.getElementById(viewId).classList.add("active");
    });
  });
}

// Back to top button
function setupBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// Modal functionality
function setupModal() {
  const modal = document.getElementById("messageModal");
  const closeBtn = modal.querySelector(".close-btn");

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Message filtering and search
function setupMessageFilters() {
  const typeFilter = document.getElementById("messageTypeFilter");
  const searchInput = document.getElementById("searchMessages");
  const searchBtn = document.getElementById("searchBtn");

  typeFilter.addEventListener("change", async () => {
    await loadMessages();
  });

  searchBtn.addEventListener("click", async () => {
    await loadMessages();
  });

  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await loadMessages();
    }
  });
}

// Pagination variables
let currentPage = 1;
let totalPages = 1;
let messagesPerPage = 10;

// Load messages from the server
async function loadMessages() {
  const messagesContainer = document.getElementById("messagesContainer");
  const typeFilter = document.getElementById("messageTypeFilter").value;
  const searchQuery = document.getElementById("searchMessages").value.trim();

  // Show loading state
  messagesContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading messages...</span>
        </div>
    `;

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: messagesPerPage,
    });

    if (typeFilter !== "all") {
      params.append("type", typeFilter);
    }

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    // Fetch messages from server
    const response = await fetch(`/api/messages?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to load messages");
    }

    const data = await response.json();
    const messages = data.messages;
    totalPages = data.totalPages || 1;

    // Update pagination controls
    updatePagination();

    // If no messages, show empty state
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No messages found</p>
                </div>
            `;
      return;
    }

    // Render messages
    messagesContainer.innerHTML = "";
    messages.forEach((message) => {
      const messageCard = createMessageCard(message);
      messagesContainer.appendChild(messageCard);
    });
  } catch (err) {
    console.error("Error loading messages:", err);
    messagesContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load messages. Please try again.</p>
            </div>
        `;
  }
}

// Create message card element
function createMessageCard(message) {
  const card = document.createElement("div");
  card.className = "message-card";
  card.dataset.id = message.id;

  // Format date
  const date = new Date(message.timestamp);
  const formattedDate =
    date.toLocaleDateString() + " " + date.toLocaleTimeString();

  // Get initials for avatar
  const initials = message.username.charAt(0).toUpperCase();

  // Create message preview text
  let preview = "";
  if (message.messageType === "text") {
    preview =
      message.content.length > 100
        ? message.content.substring(0, 100) + "..."
        : message.content;
  } else if (message.messageType === "voice") {
    preview = "Voice message";
  } else if (message.messageType === "video") {
    preview = "Video message";
  }

  // Set type badge class
  const typeBadgeClass = `type-badge ${message.messageType}`;

  card.innerHTML = `
        <div class="message-header">
            <div class="user-info">
                <div class="user-avatar">${initials}</div>
                <div>
                    <div class="user-name">${message.username}</div>
                    <div class="user-email">${message.email}</div>
                </div>
            </div>
            <div class="message-type">
                <span class="${typeBadgeClass}">${message.messageType}</span>
            </div>
        </div>
        <div class="message-preview">${preview}</div>
        <div class="message-footer">
            <span>${formattedDate}</span>
            <span><i class="fas fa-eye"></i> View details</span>
        </div>
    `;

  // Add click event to open modal with message details
  card.addEventListener("click", () => {
    openMessageModal(message);
  });

  return card;
}

// Open modal with message details
function openMessageModal(message) {
  const modal = document.getElementById("messageModal");
  const modalBody = modal.querySelector(".modal-body");

  // Format date
  const date = new Date(message.timestamp);
  const formattedDate =
    date.toLocaleDateString() + " " + date.toLocaleTimeString();

  // Prepare content based on message type
  let contentHtml = "";

  if (message.messageType === "text") {
    contentHtml = `
            <div class="message-content-container">
                <div class="message-text">${message.content}</div>
            </div>
        `;
  } else if (message.messageType === "voice") {
    contentHtml = `
            <div class="message-content-container">
                <div class="media-container">
                    <audio controls src="${message.mediaUrl}"></audio>
                </div>
            </div>
        `;
  } else if (message.messageType === "video") {
    contentHtml = `
            <div class="message-content-container">
                <div class="media-container">
                    <video controls src="${message.mediaUrl}"></video>
                </div>
            </div>
        `;
  }

  modalBody.innerHTML = `
        <div class="message-detail-header">
            <div class="user-detail">
                <div class="user-name">${message.username}</div>
                <div class="user-email">${message.email}</div>
            </div>
            <div class="message-timestamp">
                <i class="far fa-clock"></i> ${formattedDate}
            </div>
        </div>
        ${contentHtml}
    `;

  modal.style.display = "block";
}

// Update pagination controls
function updatePagination() {
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;

  prevPageBtn.onclick = async () => {
    if (currentPage > 1) {
      currentPage--;
      await loadMessages();
      window.scrollTo(0, 0);
    }
  };

  nextPageBtn.onclick = async () => {
    if (currentPage < totalPages) {
      currentPage++;
      await loadMessages();
      window.scrollTo(0, 0);
    }
  };
}

// Load statistics for the dashboard
async function loadStatistics() {
  try {
    const response = await fetch("/api/message-stats");

    if (!response.ok) {
      throw new Error("Failed to load statistics");
    }

    const stats = await response.json();

    // Update stats cards
    document.getElementById("totalMessages").textContent = stats.total;
    document.getElementById("textMessages").textContent = stats.textCount;
    document.getElementById("voiceMessages").textContent = stats.voiceCount;
    document.getElementById("videoMessages").textContent = stats.videoCount;

    // Create charts
    createMessageTypeChart(stats);
    createTimeSeriesChart(stats.timeData);
  } catch (err) {
    console.error("Error loading statistics:", err);
    showError("Failed to load statistics. Please try again later.");
  }
}

// Create pie chart for message types
function createMessageTypeChart(stats) {
  const ctx = document.getElementById("messageTypeChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Text", "Voice", "Video"],
      datasets: [
        {
          data: [stats.textCount, stats.voiceCount, stats.videoCount],
          backgroundColor: ["#0ea5e9", "#22c55e", "#f59e0b"],
          borderColor: "#1f2937",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: document.documentElement.classList.contains("light")
              ? "#111827"
              : "#f9fafb",
          },
        },
      },
    },
  });
}

// Create line chart for messages over time
function createTimeSeriesChart(timeData) {
  const ctx = document.getElementById("messagesTimeChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: timeData.map((item) => item.date),
      datasets: [
        {
          label: "Messages",
          data: timeData.map((item) => item.count),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(75, 85, 99, 0.2)",
          },
          ticks: {
            color: document.documentElement.classList.contains("light")
              ? "#6b7280"
              : "#9ca3af",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(75, 85, 99, 0.2)",
          },
          ticks: {
            color: document.documentElement.classList.contains("light")
              ? "#6b7280"
              : "#9ca3af",
          },
        },
      },
    },
  });
}

// Initialize Socket.io for real-time updates
function initializeSocketIO() {
  try {
    // Check if io is already defined
    if (typeof io === "undefined") {
      console.error(
        "Socket.io library not found. Make sure it is included in your HTML."
      );
      return;
    }

    const socket = io();

    // Handle new message event
    socket.on("new-message", (message) => {
      // Reload messages if on first page
      if (currentPage === 1) {
        loadMessages();
      }

      // Show notification
      showNotification(
        `New ${message.messageType} message from ${message.username}`
      );

      // Update statistics
      loadStatistics();
    });

    // Handle connection error
    socket.on("connect_error", (error) => {
      console.error("Socket.io connection error:", error);
    });
  } catch (err) {
    console.error("Error initializing Socket.io:", err);
  }
}

// Show notification
function showNotification(message) {
  // Check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications");
    return;
  }

  // Check notification permission
  if (Notification.permission === "granted") {
    new Notification("Message Center", {
      body: message,
      icon: "/favicon.ico",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Message Center", {
          body: message,
          icon: "/favicon.ico",
        });
      }
    });
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-notification";
  errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error"><i class="fas fa-times"></i></button>
    `;

  document.body.appendChild(errorDiv);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(errorDiv)) {
      document.body.removeChild(errorDiv);
    }
  }, 5000);

  // Close button
  errorDiv.querySelector(".close-error").addEventListener("click", () => {
    if (document.body.contains(errorDiv)) {
      document.body.removeChild(errorDiv);
    }
  });
}
