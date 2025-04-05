// Check if user is logged in
function checkUserLoggedIn() {
  const userId = localStorage.getItem("userId");
  return !!userId; // Convert to boolean
}

// Show/hide elements based on login status
function updateUIForLoginStatus() {
  const isLoggedIn = checkUserLoggedIn();
  const orderSection = document.getElementById("order");
  const orderLink = document.getElementById("orderLink");
  const profileLink = document.getElementById("profileLink");
  const profileFooterLink = document.getElementById("profileFooterLink");
  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const reviewSection = document.getElementById("review-form");

  if (isLoggedIn) {
    // User is logged in
    if (orderSection) orderSection.style.display = "block";
    if (orderLink) orderLink.style.display = "block";
    if (profileLink) profileLink.style.display = "block";
    if (profileFooterLink) profileFooterLink.style.display = "block";
    if (reviewSection) reviewSection.style.display = "block";
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти';
      loginBtn.removeEventListener("click", redirectToAuth);
      loginBtn.addEventListener("click", logoutUser);
    }
  } else {
    // User is not logged in
    if (orderSection) orderSection.style.display = "none";
    if (orderLink) orderLink.style.display = "none";
    if (profileLink) profileLink.style.display = "none";
    if (profileFooterLink) profileFooterLink.style.display = "none";
    if (reviewSection) reviewSection.style.display = "none";
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Увійти';
      loginBtn.removeEventListener("click", logoutUser);
      loginBtn.addEventListener("click", redirectToAuth);
    }

    // Show login modal for new users
    if (loginModal && !localStorage.getItem("modalShown")) {
      setTimeout(() => {
        loginModal.classList.add("active");
        localStorage.setItem("modalShown", "true");
      }, 1500);
    }
  }
}

// Redirect to auth page
function redirectToAuth() {
  window.location.href = "auth.html";
}

// Logout user
function logoutUser() {
  localStorage.removeItem("userId");
  localStorage.removeItem("modalShown");
  updateUIForLoginStatus();
  alert("Ви успішно вийшли з системи");
  window.location.reload();
}

// Modal close button
document.addEventListener("DOMContentLoaded", function () {
  const modalClose = document.getElementById("modalClose");
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      document.getElementById("loginModal").classList.remove("active");
    });
  }

  // Modal login button
  const modalLoginBtn = document.getElementById("modalLoginBtn");
  if (modalLoginBtn) {
    modalLoginBtn.addEventListener("click", redirectToAuth);
  }

  // Modal register button
  const modalRegisterBtn = document.getElementById("modalRegisterBtn");
  if (modalRegisterBtn) {
    modalRegisterBtn.addEventListener("click", () => {
      window.location.href = "auth.html?register=true";
    });
  }

  // Order Now button
  const orderNowBtn = document.getElementById("orderNowBtn");
  if (orderNowBtn) {
    orderNowBtn.addEventListener("click", () => {
      if (checkUserLoggedIn()) {
        document.getElementById("order").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        document.getElementById("loginModal").classList.add("active");
      }
    });
  }

  // Find Master button
  const findMasterBtn = document.getElementById("findMasterBtn");
  if (findMasterBtn) {
    findMasterBtn.addEventListener("click", () => {
      document.getElementById("industries").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  // Fetch statistics data
  fetchStatistics();

  // Render industries
  renderIndustries();
  renderIndustriesDropdown();

  // Load testimonials
  loadTestimonials();

  // Setup animations
  setupAnimations();
  setupTypingAnimation();

  // Initialize star rating
  initStarRating();

  // Back to top button
  initBackToTop();
});

// Fetch statistics data
async function fetchStatistics() {
  try {
    // Fetch user and master count with growth data
    const userMasterResponse = await fetch("/api/user-master-count").catch(
      () => null
    );
    let userMasterData = {
      users: 0,
      masters: 0,
      usersGrowth: 0,
      mastersGrowth: 0,
    };

    if (userMasterResponse && userMasterResponse.ok) {
      userMasterData = await userMasterResponse.json();
    } else {
      // Fallback data
      userMasterData = {
        users: Math.floor(Math.random() * 500) + 500,
        masters: Math.floor(Math.random() * 100) + 100,
        usersGrowth: Math.floor(Math.random() * 20) + 10,
        mastersGrowth: Math.floor(Math.random() * 10) + 5,
      };
    }

    // Update user and master counts
    document.getElementById("usersCount").textContent = userMasterData.users;
    document.getElementById("mastersCount").textContent =
      userMasterData.masters;

    // Update growth rates
    document.getElementById(
      "usersGrowth"
    ).textContent = `+${userMasterData.usersGrowth}`;
    document.getElementById(
      "mastersGrowth"
    ).textContent = `+${userMasterData.mastersGrowth}`;

    // Fetch orders data
    const ordersResponse = await fetch("/api/orders-count").catch(() => null);
    let ordersData = { completed: 0, weeklyGrowth: 0 };

    if (ordersResponse && ordersResponse.ok) {
      ordersData = await ordersResponse.json();
    } else {
      // Fallback data
      ordersData = {
        completed: Math.floor(Math.random() * 1000) + 1000,
        weeklyGrowth: Math.floor(Math.random() * 30) + 20,
      };
    }

    // Update orders count
    document.getElementById("ordersCount").textContent = ordersData.completed;
    document.getElementById(
      "ordersGrowth"
    ).textContent = `+${ordersData.weeklyGrowth}`;

    // Create charts with real or fallback data
    createFallbackCharts();
  } catch (error) {
    console.error("Error fetching statistics:", error);
    // Set fallback data in case of error
    document.getElementById("usersCount").textContent = "500";
    document.getElementById("mastersCount").textContent = "100";
    document.getElementById("ordersCount").textContent = "1000";
    document.getElementById("usersGrowth").textContent = "+15";
    document.getElementById("mastersGrowth").textContent = "+8";
    document.getElementById("ordersGrowth").textContent = "+25";

    // Create fallback charts
    createFallbackCharts();
  }
}

// Create fallback charts with simulated data
function createFallbackCharts() {
  const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер"];

  // Generate random data with upward trend
  const generateData = (baseValue, increment) => {
    return months.map(
      (_, index) =>
        baseValue + increment * index + Math.floor(Math.random() * 10)
    );
  };

  // Users Chart
  const usersCtx = document.getElementById("usersChart");
  if (usersCtx) {
    new Chart(usersCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Користувачі",
            data: generateData(80, 10),
            borderColor: "#3498db",
            backgroundColor: "rgba(52, 152, 219, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: getChartOptions(),
    });
  }

  // Masters Chart
  const mastersCtx = document.getElementById("mastersChart");
  if (mastersCtx) {
    new Chart(mastersCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Майстри",
            data: generateData(20, 5),
            borderColor: "#2980b9",
            backgroundColor: "rgba(41, 128, 185, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: getChartOptions(),
    });
  }

  // Orders Chart
  const ordersCtx = document.getElementById("ordersChart");
  if (ordersCtx) {
    new Chart(ordersCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Проекти",
            data: generateData(150, 20),
            borderColor: "#2ecc71",
            backgroundColor: "rgba(46, 204, 113, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: getChartOptions(),
    });
  }
}

// Chart options
function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(52, 152, 219, 0.3)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
      },
    },
  };
}

// Theme Toggle
document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  // Check for saved theme preference
  if (localStorage.getItem("theme") === "light") {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  }

  // Toggle theme when switch is clicked
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
});

// Mobile Menu Toggle
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      navMenu.classList.toggle("active");

      // Change icon based on menu state
      const icon = this.querySelector("i");
      if (navMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
        icon.style.animation = "rotate 0.5s ease forwards";
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
        icon.style.animation = "rotate-back 0.5s ease forwards";
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !navMenu.contains(event.target) &&
        !mobileMenuBtn.contains(event.target) &&
        navMenu.classList.contains("active")
      ) {
        navMenu.classList.remove("active");
        const icon = mobileMenuBtn.querySelector("i");
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
        icon.style.animation = "rotate-back 0.5s ease forwards";
      }
    });
  }
});

// Communication Panel Toggle
document.addEventListener("DOMContentLoaded", function () {
  const commToggleBtn = document.getElementById("commToggleBtn");
  const commMenu = document.getElementById("commMenu");

  if (commToggleBtn && commMenu) {
    commToggleBtn.addEventListener("click", function () {
      commMenu.classList.toggle("active");
      this.classList.toggle("active");

      // Change icon based on menu state
      const icon = this.querySelector("i");
      if (commMenu.classList.contains("active")) {
        icon.classList.remove("fa-comments");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-comments");
      }
    });

    // Close communication menu when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !commMenu.contains(event.target) &&
        !commToggleBtn.contains(event.target) &&
        commMenu.classList.contains("active")
      ) {
        commMenu.classList.remove("active");
        commToggleBtn.classList.remove("active");
        const icon = commToggleBtn.querySelector("i");
        icon.classList.remove("fa-times");
        icon.classList.add("fa-comments");
      }
    });

    // Communication buttons with animations
    const commButtons = ["messageBtn", "chatBtn", "voiceBtn", "videoBtn"];
    commButtons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", function (event) {
          animateButton(this);
          setTimeout(() => {
            if (checkUserLoggedIn()) {
              alert(
                `Відкриття ${this.querySelector(".comm-text").textContent}`
              );
            } else {
              document.getElementById("loginModal").classList.add("active");
            }
          }, 300);
        });
      }
    });
  }
});

function animateButton(button) {
  button.style.animation = "jello 0.8s";
  button.addEventListener("animationend", () => {
    button.style.animation = "";
  });
}

// Industry data with icons and descriptions
const industryData = [
  {
    name: "Інформаційні технології",
    icon: "fas fa-laptop-code",
    description:
      "Розробка програмного забезпечення, веб-сайтів, мобільних додатків та IT-консультації",
  },
  {
    name: "Медицина",
    icon: "fas fa-heartbeat",
    description:
      "Медичні консультації, догляд за пацієнтами та медичне обладнання",
  },
  {
    name: "Енергетика",
    icon: "fas fa-bolt",
    description:
      "Енергетичні рішення, відновлювані джерела енергії та енергоефективність",
  },
  {
    name: "Аграрна галузь",
    icon: "fas fa-tractor",
    description: "Сільськогосподарські послуги, агрономія та тваринництво",
  },
  {
    name: "Фінанси та банківська справа",
    icon: "fas fa-money-bill-wave",
    description: "Фінансові консультації, бухгалтерія та інвестиційні поради",
  },
  {
    name: "Освіта",
    icon: "fas fa-graduation-cap",
    description: "Навчання, тренінги та освітні програми",
  },
  {
    name: "Туризм і гостинність",
    icon: "fas fa-plane",
    description:
      "Туристичні послуги, організація подорожей та готельний бізнес",
  },
  {
    name: "Будівництво та нерухомість",
    icon: "fas fa-hard-hat",
    description: "Будівельні роботи, ремонт та консультації з нерухомості",
  },
  {
    name: "Транспорт",
    icon: "fas fa-truck",
    description: "Транспортні послуги, логістика та доставка",
  },
  {
    name: "Мистецтво і культура",
    icon: "fas fa-palette",
    description: "Творчі послуги, дизайн та організація культурних заходів",
  },
];

// Render industries with animations
function renderIndustries() {
  const industriesContainer = document.getElementById("industriesContainer");
  if (!industriesContainer) return;

  industriesContainer.innerHTML = "";

  industryData.forEach((industry, index) => {
    const industryCard = document.createElement("div");
    industryCard.className = "industry-card";
    industryCard.style.opacity = "0";
    industryCard.style.transform = "translateY(20px)";

    industryCard.innerHTML = `
      <i class="${industry.icon} industry-icon"></i>
      <div class="industry-name">${industry.name}</div>
      <div class="industry-description">${industry.description}</div>
    `;

    industriesContainer.appendChild(industryCard);

    // Staggered animation
    setTimeout(() => {
      industryCard.style.opacity = "1";
      industryCard.style.transform = "translateY(0)";
      industryCard.style.transition =
        "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }, 100 * index);
  });
}

// Render industries for dropdown
function renderIndustriesDropdown() {
  const industrySelect = document.getElementById("industrySelect");
  const reviewIndustry = document.getElementById("reviewIndustry");

  if (!industrySelect && !reviewIndustry) return;

  // Clear existing options except the first one for industrySelect
  if (industrySelect) {
    while (industrySelect.options.length > 1) {
      industrySelect.remove(1);
    }
  }

  // Clear existing options except the first one for reviewIndustry
  if (reviewIndustry) {
    while (reviewIndustry.options.length > 1) {
      reviewIndustry.remove(1);
    }
  }

  // Add industry options
  industryData.forEach((industry) => {
    if (industrySelect) {
      const option = document.createElement("option");
      option.value = industry.name;
      option.textContent = industry.name;
      industrySelect.appendChild(option);
    }

    if (reviewIndustry) {
      const option = document.createElement("option");
      option.value = industry.name;
      option.textContent = industry.name;
      reviewIndustry.appendChild(option);
    }
  });
}

// Initialize star rating
function initStarRating() {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingInput = document.getElementById("reviewRating");

  if (!stars.length || !ratingInput) return;

  stars.forEach((star) => {
    star.addEventListener("mouseover", () => {
      const currentRating = star.getAttribute("data-rating");
      stars.forEach((s) => {
        s.classList.remove("hovered");
        if (s.getAttribute("data-rating") <= currentRating) {
          s.classList.add("hovered");
        }
      });
    });

    star.addEventListener("mouseout", () => {
      stars.forEach((s) => s.classList.remove("hovered"));
    });

    star.addEventListener("click", () => {
      const selectedRating = star.getAttribute("data-rating");
      ratingInput.value = selectedRating;
      stars.forEach((s) => {
        s.classList.remove("selected");
        if (s.getAttribute("data-rating") <= selectedRating) {
          s.classList.add("selected");
        }
      });
    });
  });
}

// Order Form Submission
document.addEventListener("DOMContentLoaded", function () {
  const orderForm = document.getElementById("orderForm");
  const orderFormMessage = document.getElementById("orderFormMessage");

  if (orderForm) {
    // Phone number validation
    const phoneInput = document.getElementById("orderPhone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        let phoneNumber = this.value.replace(/\D/g, "");

        if (phoneNumber.startsWith("380")) {
          phoneNumber = "+" + phoneNumber;
        } else if (phoneNumber.startsWith("0")) {
          phoneNumber = "+38" + phoneNumber;
        }

        // Format the phone number
        if (phoneNumber.length > 12) {
          phoneNumber = phoneNumber.substring(0, 13);
        }

        this.value = phoneNumber;
      });
    }

    orderForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitOrderBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

      const title = document.getElementById("orderTitle").value;
      const industry = document.getElementById("industrySelect").value;
      const description = document.getElementById("orderDescription").value;
      const phone = document.getElementById("orderPhone").value;

      // Validate phone number
      const phoneRegex = /^\+380\d{9}$/;
      if (!phoneRegex.test(phone)) {
        orderFormMessage.textContent =
          "Введіть коректний номер телефону у форматі +380XXXXXXXXX";
        orderFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

        // Shake the phone input
        phoneInput.style.animation = "shake 0.5s";
        phoneInput.addEventListener("animationend", () => {
          phoneInput.style.animation = "";
        });

        return;
      }

      // Check if user is logged in
      const userId = localStorage.getItem("userId");
      if (!userId) {
        orderFormMessage.textContent =
          "Будь ласка, авторизуйтесь для відправки заявки";
        orderFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

        // Show login modal
        document.getElementById("loginModal").classList.add("active");
        return;
      }

      try {
        // Simulate successful order submission
        setTimeout(() => {
          // Success response
          orderFormMessage.textContent =
            "Заявку успішно відправлено! Наші майстри зв'яжуться з вами найближчим часом.";
          orderFormMessage.className = "form-message success";
          orderForm.reset();

          // Success animation
          const formContainer = document.querySelector(".order-form-container");
          formContainer.style.animation = "pulse 1s";
          formContainer.addEventListener("animationend", () => {
            formContainer.style.animation = "";
          });

          // Add link to view orders
          const viewOrdersLink = document.createElement("a");
          viewOrdersLink.href = "order.html";
          viewOrdersLink.className = "view-orders-link";
          viewOrdersLink.innerHTML =
            '<i class="fas fa-list"></i> Переглянути мої заявки';
          orderFormMessage.appendChild(document.createElement("br"));
          orderFormMessage.appendChild(viewOrdersLink);

          submitBtn.disabled = false;
          submitBtn.innerHTML =
            '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

          // Hide message after 10 seconds with fade out
          setTimeout(() => {
            orderFormMessage.style.animation = "fadeOut 1s forwards";
            orderFormMessage.addEventListener("animationend", () => {
              orderFormMessage.style.display = "none";
              orderFormMessage.style.animation = "";
              setTimeout(() => {
                orderFormMessage.style.display = "block";
                orderFormMessage.textContent = "";
                orderFormMessage.className = "form-message";
              }, 500);
            });
          }, 10000);
        }, 1500);
      } catch (error) {
        console.error("Помилка:", error);
        orderFormMessage.textContent = "Помилка з'єднання з сервером";
        orderFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';
      }
    });
  }
});

// Review Form Submission
document.addEventListener("DOMContentLoaded", function () {
  const reviewForm = document.getElementById("reviewForm");
  const reviewFormMessage = document.getElementById("reviewFormMessage");
  const addReviewBtn = document.getElementById("addReviewBtn");
  const reviewSection = document.getElementById("review-form");

  // Show/hide review form when "Add Review" button is clicked
  if (addReviewBtn && reviewSection) {
    addReviewBtn.addEventListener("click", () => {
      if (checkUserLoggedIn()) {
        reviewSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        document.getElementById("loginModal").classList.add("active");
      }
    });
  }

  // Handle review form submission
  if (reviewForm) {
    reviewForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitReviewBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

      const name = document.getElementById("reviewName").value;
      const industry = document.getElementById("reviewIndustry").value;
      const rating = document.getElementById("reviewRating").value;
      const text = document.getElementById("reviewText").value;
      const master = document.getElementById("reviewMaster").value;

      // Validate rating
      if (!rating) {
        reviewFormMessage.textContent = "Будь ласка, виберіть оцінку";
        reviewFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';
        return;
      }

      // Check if user is logged in
      const userId = localStorage.getItem("userId");
      if (!userId) {
        reviewFormMessage.textContent =
          "Будь ласка, авторизуйтесь для відправки відгуку";
        reviewFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';

        // Show login modal
        document.getElementById("loginModal").classList.add("active");
        return;
      }

      try {
        // Simulate successful review submission
        setTimeout(() => {
          // Success response
          reviewFormMessage.textContent =
            "Відгук успішно відправлено! Дякуємо за ваш відгук.";
          reviewFormMessage.className = "form-message success";
          reviewForm.reset();

          // Reset star rating
          const stars = document.querySelectorAll(".star-rating i");
          stars.forEach((star) => star.classList.remove("selected", "active"));
          document.getElementById("reviewRating").value = "";

          // Success animation
          const formContainer = document.querySelector(
            ".review-form-container"
          );
          formContainer.style.animation = "pulse 1s";
          formContainer.addEventListener("animationend", () => {
            formContainer.style.animation = "";
          });

          // Add new review to testimonials
          addNewTestimonial({
            name,
            industry,
            rating: parseInt(rating),
            text,
            master_name: master,
            created_at: new Date().toISOString(),
          });

          submitBtn.disabled = false;
          submitBtn.innerHTML =
            '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';

          // Hide message after 10 seconds with fade out
          setTimeout(() => {
            reviewFormMessage.style.animation = "fadeOut 1s forwards";
            reviewFormMessage.addEventListener("animationend", () => {
              reviewFormMessage.style.display = "none";
              reviewFormMessage.style.animation = "";
              setTimeout(() => {
                reviewFormMessage.style.display = "block";
                reviewFormMessage.textContent = "";
                reviewFormMessage.className = "form-message";
              }, 500);
            });
          }, 10000);
        }, 1500);
      } catch (error) {
        console.error("Помилка:", error);
        reviewFormMessage.textContent = "Помилка з'єднання з сервером";
        reviewFormMessage.className = "form-message error";
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';
      }
    });
  }
});

// Add new testimonial to the slider
function addNewTestimonial(review) {
  const testimonialsTrack = document.getElementById("testimonialsTrack");
  if (!testimonialsTrack) return;

  // Create stars string
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const date = new Date(review.created_at).toLocaleDateString("uk-UA");

  // Create new testimonial card
  const testimonialCard = document.createElement("div");
  testimonialCard.className = "testimonial-card";
  testimonialCard.innerHTML = `
    <div class="testimonial-rating">${stars}</div>
    <div class="testimonial-industry">${review.industry}</div>
    <div class="testimonial-quote">${review.text}</div>
    <div class="testimonial-author">${review.name}</div>
    ${
      review.master_name
        ? `<div class="testimonial-role">Майстер: ${review.master_name}</div>`
        : ""
    }
    <div class="testimonial-date">${date}</div>
  `;

  // Add to the beginning of the track
  if (testimonialsTrack.firstChild) {
    testimonialsTrack.insertBefore(
      testimonialCard,
      testimonialsTrack.firstChild
    );
  } else {
    testimonialsTrack.appendChild(testimonialCard);
  }

  // Reinitialize testimonial slider
  initTestimonialSlider();
}

// Load testimonials
function loadTestimonials() {
  const testimonialsTrack = document.getElementById("testimonialsTrack");
  if (!testimonialsTrack) return;

  // Sample testimonials data
  const sampleTestimonials = [
    {
      name: "Олександр Петренко",
      industry: "Інформаційні технології",
      rating: 5,
      text: "Дуже задоволений роботою майстра. Швидко та якісно налаштував мою комп'ютерну мережу. Рекомендую!",
      master_name: "Іван Коваленко",
      created_at: "2024-03-15T10:30:00Z",
    },
    {
      name: "Марія Іванова",
      industry: "Будівництво та нерухомість",
      rating: 4,
      text: "Майстер виконав ремонт вчасно та професійно. Єдиний мінус - трохи перевищив бюджет, але результат того вартий.",
      master_name: "Петро Сидоренко",
      created_at: "2024-03-10T14:20:00Z",
    },
    {
      name: "Андрій Ковальчук",
      industry: "Енергетика",
      rating: 5,
      text: "Встановлення сонячних панелей пройшло ідеально. Тепер маю власне джерело енергії і значно менші рахунки за електроенергію.",
      master_name: "Микола Шевченко",
      created_at: "2024-03-05T09:15:00Z",
    },
  ];

  testimonialsTrack.innerHTML = "";

  sampleTestimonials.forEach((review) => {
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString("uk-UA");

    const testimonialCard = document.createElement("div");
    testimonialCard.className = "testimonial-card";
    testimonialCard.innerHTML = `
      <div class="testimonial-rating">${stars}</div>
      <div class="testimonial-industry">${review.industry}</div>
      <div class="testimonial-quote">${review.text}</div>
      <div class="testimonial-author">${review.name}</div>
      ${
        review.master_name
          ? `<div class="testimonial-role">Майстер: ${review.master_name}</div>`
          : ""
      }
      <div class="testimonial-date">${date}</div>
    `;

    testimonialsTrack.appendChild(testimonialCard);
  });

  // Initialize testimonial slider
  initTestimonialSlider();
}

// Initialize testimonial slider
function initTestimonialSlider() {
  const track = document.getElementById("testimonialsTrack");
  const prevBtn = document.getElementById("testimonialPrev");
  const nextBtn = document.getElementById("testimonialNext");

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const testimonials = track.querySelectorAll(".testimonial-card");

  if (testimonials.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  prevBtn.addEventListener("click", () => {
    currentIndex =
      (currentIndex - 1 + testimonials.length) % testimonials.length;
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateSlider();
  });

  // Auto-slide every 5 seconds
  let slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateSlider();
  }, 5000);

  // Pause auto-slide on hover
  track.parentElement.addEventListener("mouseenter", () => {
    clearInterval(slideInterval);
  });

  // Resume auto-slide when mouse leaves
  track.parentElement.addEventListener("mouseleave", () => {
    slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      updateSlider();
    }, 5000);
  });
}

// Parallax effect for hero section
window.addEventListener("scroll", function () {
  const scrollPosition = window.scrollY;
  const hero = document.querySelector(".hero");
  const heroContent = document.querySelector(".hero-content");

  if (hero && heroContent && scrollPosition < 600) {
    hero.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
    heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
  }
});

// Back to top button
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

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

// Scroll Animation with Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.1,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements with animation classes
function setupAnimations() {
  const animatedElements = document.querySelectorAll(
    ".section-title, .order-form-container, .review-form-container, .footer-section, .stats-card"
  );

  animatedElements.forEach((element) => {
    element.classList.add("to-animate");
    observer.observe(element);
  });
}

// Typing animation for hero title
function setupTypingAnimation() {
  const heroTitle = document.querySelector(".hero-title");
  if (!heroTitle) return;

  const originalText = heroTitle.textContent;
  heroTitle.textContent = "";

  let i = 0;
  const typingSpeed = 50; // milliseconds per character

  function typeWriter() {
    if (i < originalText.length) {
      heroTitle.textContent += originalText.charAt(i);
      i++;
      setTimeout(typeWriter, typingSpeed);
    }
  }

  // Start typing after a short delay
  setTimeout(typeWriter, 500);
}

console.log("ProFix Network Hub script loaded successfully!");
