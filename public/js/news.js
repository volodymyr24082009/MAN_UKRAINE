document.addEventListener("DOMContentLoaded", function () {
  // Theme toggle functionality
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  // Check for saved theme preference
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Toggle theme when button is clicked
  themeToggle.addEventListener("click", function () {
    body.classList.toggle("light");

    if (body.classList.contains("light")) {
      localStorage.setItem("theme", "light");
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      localStorage.setItem("theme", "dark");
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });

  // User menu toggle
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userMenuDropdown = document.getElementById("userMenuDropdown");

  userMenuBtn.addEventListener("click", function () {
    userMenuDropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !userMenuBtn.contains(event.target) &&
      !userMenuDropdown.contains(event.target)
    ) {
      userMenuDropdown.classList.remove("show");
    }
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mainNav = document.querySelector(".main-nav");

  mobileMenuToggle.addEventListener("click", function () {
    mainNav.classList.toggle("show");

    if (mainNav.classList.contains("show")) {
      mobileMenuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
      mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });

  // Check if user is logged in
  function checkUserAuth() {
    const token = localStorage.getItem("token");
    const userMenuName = document.getElementById("userMenuName");
    const userMenuDropdown = document.getElementById("userMenuDropdown");

    if (token) {
      // User is logged in
      fetch("/user-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            userMenuName.textContent = data.username;

            // Update dropdown content for logged in user
            userMenuDropdown.innerHTML = `
            <a href="profile.html"><i class="fas fa-user"></i> Профіль</a>
            <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Панель керування</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Вихід</a>
          `;

            // Add logout functionality
            document
              .getElementById("logoutBtn")
              .addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                window.location.href = "index.html";
              });
          } else {
            setupGuestMenu();
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setupGuestMenu();
        });
    } else {
      // User is not logged in
      setupGuestMenu();
    }
  }

  // Setup menu for guest users
  function setupGuestMenu() {
    const userMenuName = document.getElementById("userMenuName");
    const userMenuDropdown = document.getElementById("userMenuDropdown");

    userMenuName.textContent = "Увійти";
    userMenuDropdown.innerHTML = `
      <a href="auth.html?action=login"><i class="fas fa-sign-in-alt"></i> Вхід</a>
      <a href="auth.html?action=register"><i class="fas fa-user-plus"></i> Реєстрація</a>
    `;
  }

  // Call auth check
  checkUserAuth();

  // News functionality
  let currentPage = 1;
  const itemsPerPage = 9;
  let currentCategory = "all";
  let searchQuery = "";
  let allNews = [];

  // Load news from server
  function loadNews() {
    const newsContainer = document.getElementById("newsContainer");
    newsContainer.innerHTML = `
      <div class="news-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Завантаження новин...</p>
      </div>
    `;

    fetch("/api/news")
      .then((response) => response.json())
      .then((data) => {
        allNews = data.news;
        renderNews();
      })
      .catch((error) => {
        console.error("Error loading news:", error);
        newsContainer.innerHTML = `
          <div class="news-loading">
            <i class="fas fa-exclamation-circle"></i>
            <p>Помилка при завантаженні новин. Спробуйте пізніше.</p>
          </div>
        `;
      });
  }

  // Filter news based on category and search query
  function filterNews() {
    let filtered = [...allNews];

    // Filter by category
    if (currentCategory !== "all") {
      filtered = filtered.filter((news) => news.category === currentCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (news) =>
          news.title.toLowerCase().includes(query) ||
          news.short_description.toLowerCase().includes(query) ||
          news.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  // Render news cards
  function renderNews() {
    const newsContainer = document.getElementById("newsContainer");
    const filteredNews = filterNews();

    // Calculate pagination
    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentNews = filteredNews.slice(startIndex, endIndex);

    if (filteredNews.length === 0) {
      newsContainer.innerHTML = `
        <div class="news-loading">
          <i class="fas fa-search"></i>
          <p>Новини не знайдено. Спробуйте змінити параметри пошуку.</p>
        </div>
      `;
      document.getElementById("newsPagination").innerHTML = "";
      return;
    }

    // Create news cards
    let newsHTML = "";

    currentNews.forEach((news) => {
      const date = new Date(news.created_at).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      newsHTML += `
        <div class="news-card" data-id="${news.id}">
          <div class="news-image">
            <img src="${
              news.main_image || "/placeholder.svg?height=200&width=400"
            }" alt="${news.title}">
          </div>
          <div class="news-content">
            <div class="news-date">
              <i class="far fa-calendar-alt"></i>
              <span>${date}</span>
            </div>
            <h3 class="news-title">${news.title}</h3>
            <p class="news-excerpt">${news.short_description}</p>
            <div class="news-footer">
              <button class="read-more-btn" data-id="${news.id}">
                Читати далі <i class="fas fa-arrow-right"></i>
              </button>
              <div class="news-stats">
                <div class="news-views">
                  <i class="fas fa-eye"></i>
                  <span>${news.views || 0}</span>
                </div>
                <div class="news-likes">
                  <i class="fas fa-heart"></i>
                  <span>${news.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    newsContainer.innerHTML = newsHTML;

    // Add event listeners to read more buttons
    document.querySelectorAll(".read-more-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const newsId = this.getAttribute("data-id");
        openNewsModal(newsId);
      });
    });

    // Create pagination
    renderPagination(totalPages);
  }

  // Render pagination
  function renderPagination(totalPages) {
    const pagination = document.getElementById("newsPagination");

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let paginationHTML = "";

    // Previous button
    paginationHTML += `
      <button ${currentPage === 1 ? "disabled" : ""} data-page="${
      currentPage - 1
    }">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <button class="${
          i === currentPage ? "active" : ""
        }" data-page="${i}">${i}</button>
      `;
    }

    // Next button
    paginationHTML += `
      <button ${currentPage === totalPages ? "disabled" : ""} data-page="${
      currentPage + 1
    }">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    pagination.innerHTML = paginationHTML;

    // Add event listeners to pagination buttons
    document.querySelectorAll("#newsPagination button").forEach((button) => {
      button.addEventListener("click", function () {
        if (!this.disabled) {
          currentPage = parseInt(this.getAttribute("data-page"));
          renderNews();
          // Scroll to top of news section
          document
            .querySelector(".news-grid")
            .scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  // Open news modal
  function openNewsModal(newsId) {
    const news = allNews.find((item) => item.id == newsId);

    if (!news) {
      console.error("News not found:", newsId);
      return;
    }

    const modal = document.getElementById("newsModal");
    const modalTitle = document.getElementById("newsModalTitle");
    const modalBody = document.getElementById("newsModalBody");
    const viewCount = document.getElementById("newsViewCount");
    const likeCount = document.getElementById("newsLikeCount");
    const likeBtn = document.getElementById("newsLikeBtn");

    // Update modal content
    modalTitle.textContent = news.title;

    const date = new Date(news.created_at).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let galleryHTML = "";
    if (news.additional_images && news.additional_images.length > 0) {
      galleryHTML = `
        <div class="news-modal-gallery">
          ${news.additional_images
            .map(
              (image) => `
            <div class="gallery-item">
              <img src="${image}" alt="${news.title}">
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    let linksHTML = "";
    if (news.external_links && news.external_links.length > 0) {
      linksHTML = `
        <div class="news-modal-links">
          <h4>Корисні посилання:</h4>
          ${news.external_links
            .map(
              (link) => `
            <a href="${link}" target="_blank" rel="noopener noreferrer">
              <i class="fas fa-external-link-alt"></i>
              ${link}
            </a>
          `
            )
            .join("")}
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div class="news-modal-content">
        <div class="news-date">
          <i class="far fa-calendar-alt"></i>
          <span>${date}</span>
        </div>
        <div class="news-modal-image">
          <img src="${
            news.main_image || "/placeholder.svg?height=300&width=800"
          }" alt="${news.title}">
        </div>
        <div class="news-modal-text">
          ${news.content}
        </div>
        ${galleryHTML}
        ${linksHTML}
      </div>
    `;

    // Update view and like counts
    viewCount.textContent = news.views || 0;
    likeCount.textContent = news.likes || 0;

    // Check if user has liked this news
    const likedNews = JSON.parse(localStorage.getItem("likedNews") || "[]");
    if (likedNews.includes(parseInt(newsId))) {
      likeBtn.classList.add("active");
      likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
      likeBtn.classList.remove("active");
      likeBtn.innerHTML = '<i class="far fa-heart"></i>';
    }

    // Show modal
    modal.classList.add("show");

    // Increment view count
    incrementViewCount(newsId);

    // Add event listeners to gallery items
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", function () {
        const imgSrc = this.querySelector("img").src;
        const mainImage = document.querySelector(".news-modal-image img");
        mainImage.src = imgSrc;
      });
    });
  }

  // Close news modal
  function closeNewsModal() {
    const modal = document.getElementById("newsModal");
    modal.classList.remove("show");
  }

  // Increment view count
  function incrementViewCount(newsId) {
    fetch(`/api/news/${newsId}/view`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update view count in modal
          document.getElementById("newsViewCount").textContent = data.views;

          // Update view count in news card
          const newsCard = document.querySelector(
            `.news-card[data-id="${newsId}"]`
          );
          if (newsCard) {
            const viewsElement = newsCard.querySelector(".news-views span");
            viewsElement.textContent = data.views;
          }

          // Update view count in allNews array
          const newsIndex = allNews.findIndex((news) => news.id == newsId);
          if (newsIndex !== -1) {
            allNews[newsIndex].views = data.views;
          }
        }
      })
      .catch((error) => console.error("Error incrementing view count:", error));
  }

  // Toggle like
  function toggleLike(newsId) {
    fetch(`/api/news/${newsId}/like`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update like count in modal
          document.getElementById("newsLikeCount").textContent = data.likes;

          // Update like count in news card
          const newsCard = document.querySelector(
            `.news-card[data-id="${newsId}"]`
          );
          if (newsCard) {
            const likesElement = newsCard.querySelector(".news-likes span");
            likesElement.textContent = data.likes;
          }

          // Update like count in allNews array
          const newsIndex = allNews.findIndex((news) => news.id == newsId);
          if (newsIndex !== -1) {
            allNews[newsIndex].likes = data.likes;
          }

          // Update liked status in localStorage
          const likedNews = JSON.parse(
            localStorage.getItem("likedNews") || "[]"
          );
          const likeBtn = document.getElementById("newsLikeBtn");

          if (data.liked) {
            if (!likedNews.includes(parseInt(newsId))) {
              likedNews.push(parseInt(newsId));
            }
            likeBtn.classList.add("active");
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
          } else {
            const index = likedNews.indexOf(parseInt(newsId));
            if (index !== -1) {
              likedNews.splice(index, 1);
            }
            likeBtn.classList.remove("active");
            likeBtn.innerHTML = '<i class="far fa-heart"></i>';
          }

          localStorage.setItem("likedNews", JSON.stringify(likedNews));
        }
      })
      .catch((error) => console.error("Error toggling like:", error));
  }

  // Share news
  function shareNews(platform, newsId) {
    const news = allNews.find((item) => item.id == newsId);

    if (!news) {
      console.error("News not found:", newsId);
      return;
    }

    const url = `${window.location.origin}/news.html?id=${newsId}`;
    const title = news.title;

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      default:
        console.error("Unknown platform:", platform);
        return;
    }

    window.open(shareUrl, "_blank");
  }

  // Event Listeners

  // Close modal when clicking on close button or outside the modal
  document
    .getElementById("closeNewsModal")
    .addEventListener("click", closeNewsModal);
  document
    .getElementById("newsModal")
    .addEventListener("click", function (event) {
      if (event.target === this) {
        closeNewsModal();
      }
    });

  // Like button
  document.getElementById("newsLikeBtn").addEventListener("click", function () {
    const newsId = allNews.find(
      (news) =>
        news.title === document.getElementById("newsModalTitle").textContent
    ).id;
    toggleLike(newsId);
  });

  // Share buttons
  document.querySelectorAll(".share-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const platform = this.getAttribute("data-platform");
      const newsId = allNews.find(
        (news) =>
          news.title === document.getElementById("newsModalTitle").textContent
      ).id;
      shareNews(platform, newsId);
    });
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      currentCategory = this.getAttribute("data-category");
      currentPage = 1;
      renderNews();
    });
  });

  // Search input
  document.getElementById("newsSearch").addEventListener("input", function () {
    searchQuery = this.value.trim();
    currentPage = 1;
    renderNews();
  });

  // Check for news ID in URL
  function checkNewsIdInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get("id");

    if (newsId) {
      // If we have a news ID in the URL, open that news in the modal
      // But first wait for news to load
      const checkNewsLoaded = setInterval(() => {
        if (allNews.length > 0) {
          clearInterval(checkNewsLoaded);
          openNewsModal(newsId);
        }
      }, 100);
    }
  }

  // Load news on page load
  loadNews();

  // Check for news ID in URL
  checkNewsIdInUrl();
});
