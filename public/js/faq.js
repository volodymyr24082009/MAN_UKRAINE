document.addEventListener("DOMContentLoaded", function () {
  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  } else if (savedTheme === "dark") {
    htmlElement.classList.remove("light");
    themeToggle.checked = false;
  } else {
    // Use preferred color scheme if no saved preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      htmlElement.classList.add("light");
      themeToggle.checked = true;
    }
  }

  // Theme toggle event listener
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  });

  // FAQ accordion functionality
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains("active");

      // Close all other FAQ items
      document.querySelectorAll(".faq-item.active").forEach((item) => {
        if (item !== faqItem) {
          item.classList.remove("active");
        }
      });

      // Toggle current FAQ item
      faqItem.classList.toggle("active");
    });
  });

  // Back to top button functionality
  const backToTopBtn = document.getElementById("backToTopBtn");

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
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

  // Mobile menu functionality
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");

  mobileMenuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");

    // Toggle menu icon
    const menuIcon = mobileMenuBtn.querySelector("i");
    if (navMenu.classList.contains("active")) {
      menuIcon.classList.remove("fa-bars");
      menuIcon.classList.add("fa-times");
    } else {
      menuIcon.classList.remove("fa-times");
      menuIcon.classList.add("fa-bars");
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !navMenu.contains(event.target) &&
      !mobileMenuBtn.contains(event.target) &&
      navMenu.classList.contains("active")
    ) {
      navMenu.classList.remove("active");
      const menuIcon = mobileMenuBtn.querySelector("i");
      menuIcon.classList.remove("fa-times");
      menuIcon.classList.add("fa-bars");
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Close mobile menu if open
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          const menuIcon = mobileMenuBtn.querySelector("i");
          menuIcon.classList.remove("fa-times");
          menuIcon.classList.add("fa-bars");
        }

        // Scroll to target
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Print functionality
  window.printFAQ = function () {
    window.print();
  };

  // Add direct event listener to print button
  const printButton = document.querySelector(".print-button");
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }

  // Expand all FAQ items before printing and collapse after
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.add("active");
    });
  });

  window.addEventListener("afterprint", function () {
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("active");
    });
  });
});
