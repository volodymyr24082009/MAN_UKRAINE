// Original code from the first file
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

  if (isLoggedIn) {
    // User is logged in
    if (orderSection) orderSection.style.display = "block";
    if (orderLink) orderLink.style.display = "block";
    if (profileLink) profileLink.style.display = "block";
    if (profileFooterLink) profileFooterLink.style.display = "block";
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

// Fetch statistics data
async function fetchStatistics() {
  try {
    // Fetch user and master count with growth data
    const userMasterResponse = await fetch("/api/user-master-count");
    const userMasterData = await userMasterResponse.json();

    // Update user and master counts
    document.getElementById("usersCount").textContent =
      userMasterData.users || 0;
    document.getElementById("mastersCount").textContent =
      userMasterData.masters || 0;

    // Update growth rates
    document.getElementById("usersGrowth").textContent = `+${
      userMasterData.usersGrowth || 0
    }`;
    document.getElementById("mastersGrowth").textContent = `+${
      userMasterData.mastersGrowth || 0
    }`;

    // Fetch orders data
    const ordersResponse = await fetch("/api/orders-count");
    const ordersData = await ordersResponse.json();

    // Update orders count
    document.getElementById("ordersCount").textContent =
      ordersData.completed || 0;
    document.getElementById("ordersGrowth").textContent = `+${
      ordersData.weeklyGrowth || 0
    }`;

    // Fetch timeline data for charts
    const timelineResponse = await fetch("/api/user-master-timeline");
    const timelineData = await timelineResponse.json();

    // Create charts with real data
    createCharts(timelineData);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    // Set fallback data in case of error
    document.getElementById("usersCount").textContent = "0";
    document.getElementById("mastersCount").textContent = "0";
    document.getElementById("ordersCount").textContent = "0";
    document.getElementById("usersGrowth").textContent = "+0";
    document.getElementById("mastersGrowth").textContent = "+0";
    document.getElementById("ordersGrowth").textContent = "+0";

    // Create fallback charts
    createFallbackCharts();
  }
}

// Create charts with real data
function createCharts(timelineData) {
  if (!timelineData || timelineData.length === 0) {
    createFallbackCharts();
    return;
  }

  const labels = timelineData.map((item) => {
    const date = new Date(item.timestamp);
    return date.toLocaleDateString("uk-UA", { month: "short" });
  });

  const usersData = timelineData.map((item) => item.users);
  const mastersData = timelineData.map((item) => item.masters);
  const ordersData = timelineData.map((item) => item.orders || 0);

  // Users Chart
  const usersCtx = document.getElementById("usersChart").getContext("2d");
  new Chart(usersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Користувачі",
          data: usersData,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Masters Chart
  const mastersCtx = document.getElementById("mastersChart").getContext("2d");
  new Chart(mastersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Майстри",
          data: mastersData,
          borderColor: "#2980b9",
          backgroundColor: "rgba(41, 128, 185, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Orders Chart
  const ordersCtx = document.getElementById("ordersChart").getContext("2d");
  new Chart(ordersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Проекти",
          data: ordersData,
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
  const usersCtx = document.getElementById("usersChart").getContext("2d");
  new Chart(usersCtx, {
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

  // Masters Chart
  const mastersCtx = document.getElementById("mastersChart").getContext("2d");
  new Chart(mastersCtx, {
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

  // Orders Chart
  const ordersCtx = document.getElementById("ordersChart").getContext("2d");
  new Chart(ordersCtx, {
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

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navMenu = document.getElementById("navMenu");

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

// Communication Panel Toggle
const commToggleBtn = document.getElementById("commToggleBtn");
const commMenu = document.getElementById("commMenu");

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
document.getElementById("messageBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      alert("Відкриття повідомлень");
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("chatBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      alert("Відкриття чату");
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("voiceBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      alert("Голосовий виклик");
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("videoBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      alert("Відео виклик");
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

function animateButton(button) {
  button.style.animation = "jello 0.8s";
  button.addEventListener("animationend", () => {
    button.style.animation = "";
  });
}

// Find Master button
document.getElementById("findMasterBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  document.getElementById("industries").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

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
  if (!industrySelect) return;

  // Clear existing options except the first one
  while (industrySelect.options.length > 1) {
    industrySelect.remove(1);
  }

  // Add industry options
  industryData.forEach((industry) => {
    const option = document.createElement("option");
    option.value = industry.name;
    option.textContent = industry.name;
    industrySelect.appendChild(option);
  });
}

// UPDATED: Order Form Submission with validation and animations
const orderForm = document.getElementById("orderForm");
const orderFormMessage = document.getElementById("orderFormMessage");

if (orderForm) {
  // Phone number validation
  const phoneInput = document.getElementById("orderPhone");
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
      // Create order data
      const orderData = {
        user_id: userId,
        title,
        industry,
        description,
        phone,
      };

      // Send order to server
      const response = await fetch("/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
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
      } else {
        // Error response
        orderFormMessage.textContent =
          data.message || "Помилка при відправці заявки";
        orderFormMessage.className = "form-message error";
      }
    } catch (error) {
      console.error("Помилка:", error);
      orderFormMessage.textContent = "Помилка з'єднання з сервером";
      orderFormMessage.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

      // Hide message after 5 seconds with fade out
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
    }
  });
}

// Parallax effect for hero section
window.addEventListener("scroll", function () {
  const scrollPosition = window.scrollY;
  const hero = document.querySelector(".hero");
  const heroContent = document.querySelector(".hero-content");

  if (scrollPosition < 600) {
    hero.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
    heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
  }
});

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
    ".section-title, .order-form-container, .footer-section, .stats-card"
  );

  animatedElements.forEach((element) => {
    element.classList.add("to-animate");
    observer.observe(element);
  });
}

// Add CSS for intersection observer animations
const style = document.createElement("style");
style.textContent = `
.to-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.animate {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); }
}

@keyframes rotate-back {
  from { transform: rotate(90deg); }
  to { transform: rotate(0deg); }
}

@keyframes jello {
  0%, 11.1%, 100% {
    transform: none;
  }
  22.2% {
    transform: skewX(-12.5deg) skewY(-12.5deg);
  }
  33.3% {
    transform: skewX(6.25deg) skewY(6.25deg);
  }
  44.4% {
    transform: skewX(-3.125deg) skewY(-3.125deg);
  }
  55.5% {
    transform: skewX(1.5625deg) skewY(1.5625deg);
  }
  66.6% {
    transform: skewX(-0.78125deg) skewY(-0.78125deg);
  }
  77.7% {
    transform: skewX(0.390625deg) skewY(0.390625deg);
  }
  88.8% {
    transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
  }
}

.view-orders-link {
  display: inline-block;
  margin-top: 10px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-orders-link:hover {
  color: var(--primary-dark);
  transform: translateX(5px);
}

.view-orders-link i {
  margin-right: 5px;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;
document.head.appendChild(style);

// Typing animation for hero title
function setupTypingAnimation() {
  const heroTitle = document.querySelector(".hero-title");
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

// Particle background effect
function setupParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "particles";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 50;

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      color: `rgba(52, 152, 219, ${Math.random() * 0.2 + 0.1})`,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 1 - 0.5,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if dark mode is active
    const isDarkMode = !document.documentElement.classList.contains("light");

    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = isDarkMode
        ? particle.color
        : `rgba(52, 152, 219, ${Math.random() * 0.1 + 0.05})`;
      ctx.fill();

      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.speedX = -particle.speedX;
      }

      if (particle.y < 0 || particle.y > canvas.height) {
        particle.speedY = -particle.speedY;
      }
    });

    requestAnimationFrame(drawParticles);
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  drawParticles();
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Update UI based on login status
  updateUIForLoginStatus();

  // Fetch statistics data
  fetchStatistics();

  // Render industries
  renderIndustries();
  renderIndustriesDropdown();

  // Setup animations
  setupAnimations();
  setupTypingAnimation();
  setupParticles();

  // Add hover effects to buttons
  const buttons = document.querySelectorAll(
    ".hero-btn, .nav-button, .submit-btn, .modal-btn"
  );
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-5px)";
      button.style.boxShadow = "0 10px 20px rgba(52, 152, 219, 0.4)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
      button.style.boxShadow = "";
    });
  });

  // Add a link to the order page in the header
  const navMenu = document.getElementById("navMenu");

  if (navMenu) {
    // Check if the orders link already exists
    const ordersLink = Array.from(navMenu.querySelectorAll(".nav-link")).find(
      (link) =>
        link.textContent.trim() === "Заявки" || link.href.includes("order.html")
    );

    if (!ordersLink) {
      // Create the orders link
      const orderLink = document.createElement("a");
      orderLink.href = "order.html";
      orderLink.className = "nav-link";
      orderLink.id = "ordersLink";
      orderLink.textContent = "Заявки";

      // Insert it before the profile link
      const profileLink = document.getElementById("profileLink");
      if (profileLink) {
        navMenu.insertBefore(orderLink, profileLink);
      } else {
        // If profile link doesn't exist, append to the end
        navMenu.appendChild(orderLink);
      }
    }
  }
});

// Service Worker Registration for offline functionality
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      console.log(
        "Service Worker зареєстровано з обсягом:",
        registration.scope
      );
    })
    .catch((error) => {
      console.log("Реєстрація Service Worker не вдалася:", error);
    });
}

// Create manifest.json file for PWA support
const manifestContent = {
  name: "ProFix Network Hub",
  short_name: "ProFix",
  description: "Платформа, що з'єднує клієнтів з професійними майстрами",
  start_url: "/",
  display: "standalone",
  background_color: "#1a2238",
  theme_color: "#3498db",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

// Create a blob and download link for manifest.json
const manifestBlob = new Blob([JSON.stringify(manifestContent, null, 2)], {
  type: "application/json",
});
const manifestURL = URL.createObjectURL(manifestBlob);

// Update manifest link
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  manifestLink.href = manifestURL;
}

// Add real-time notification for new orders (for admins and masters)
async function checkForNewOrders() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    // Get user profile to check role
    const profileResponse = await fetch(`/profile/${userId}`);
    const profileData = await profileResponse.json();

    if (!profileData.profile) return;

    const isAdmin = userId === "1"; // For demo purposes
    const isMaster = profileData.profile.role_master;

    if (!isAdmin && !isMaster) return;

    // Get last check time
    const lastCheckTime = localStorage.getItem("lastOrderCheckTime") || 0;
    const currentTime = new Date().getTime();

    // Fetch new orders
    const response = await fetch("/orders");
    const data = await response.json();

    if (!data.orders || data.orders.length === 0) return;

    // Filter for new orders since last check
    const newOrders = data.orders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();
      return orderTime > lastCheckTime && order.status === "pending";
    });

    // Show notification if there are new orders
    if (newOrders.length > 0) {
      showOrderNotification(newOrders.length);
    }

    // Update last check time
    localStorage.setItem("lastOrderCheckTime", currentTime);
  } catch (error) {
    console.error("Error checking for new orders:", error);
  }
}

// Show notification for new orders
function showOrderNotification(count) {
  // Create notification if it doesn't exist
  let notification = document.querySelector(".order-notification");

  if (!notification) {
    notification = document.createElement("div");
    notification.className = "order-notification";
    document.body.appendChild(notification);

    // Add CSS for notification
    const style = document.createElement("style");
    style.textContent = `
      .order-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .order-notification.active {
        transform: translateY(0);
        opacity: 1;
      }
      
      .order-notification:hover {
        background-color: var(--primary-dark);
      }
    `;
    document.head.appendChild(style);
  }

  // Set notification content
  notification.innerHTML = `
    <i class="fas fa-bell"></i> 
    У вас ${count} ${
    count === 1 ? "нова заявка" : count < 5 ? "нові заявки" : "нових заявок"
  }!
  `;

  // Show notification
  notification.classList.add("active");

  // Add click event to redirect to orders page
  notification.addEventListener("click", () => {
    window.location.href = "order.html";
  });

  // Hide notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove("active");
  }, 5000);
}

// Check for new orders every minute
setInterval(checkForNewOrders, 60000);

// Initial check for new orders
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(checkForNewOrders, 5000); // Check after 5 seconds
});

console.log("ProFix Network Hub script loaded successfully!");
