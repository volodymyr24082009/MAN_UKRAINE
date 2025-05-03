document.addEventListener("DOMContentLoaded", () => {
  // Animate elements when they come into view
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
      ".section-title, .about-content, .mission-content, .feature-card, .tech-card, .team-card, .contact-info, .contact-form-container"
    );

    animatedElements.forEach((element) => {
      element.classList.add("to-animate");
      observer.observe(element);
    });
  }

  setupAnimations();

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Contact form submission
  const contactForm = document.getElementById("contactForm");
  const contactFormMessage = document.getElementById("contactFormMessage");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submitContactBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

      const name = document.getElementById("contactName").value;
      const email = document.getElementById("contactEmail").value;
      const subject = document.getElementById("contactSubject").value;
      const message = document.getElementById("contactMessage").value;

      try {
        // Simulate API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Success response
        contactFormMessage.textContent =
          "Повідомлення успішно відправлено! Ми зв'яжемося з вами найближчим часом.";
        contactFormMessage.className = "form-message success";
        contactForm.reset();

        // Success animation
        const formContainer = document.querySelector(".contact-form-container");
        formContainer.style.animation = "pulse 1s";
        formContainer.addEventListener("animationend", () => {
          formContainer.style.animation = "";
        });
      } catch (error) {
        console.error("Помилка:", error);
        contactFormMessage.textContent =
          "Помилка при відправці повідомлення. Спробуйте пізніше.";
        contactFormMessage.className = "form-message error";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Надіслати повідомлення</span><i class="fas fa-paper-plane"></i>';

        // Hide message after 5 seconds with fade out
        setTimeout(() => {
          contactFormMessage.style.animation = "fadeOut 1s forwards";
          contactFormMessage.addEventListener("animationend", () => {
            contactFormMessage.style.display = "none";
            contactFormMessage.style.animation = "";
            setTimeout(() => {
              contactFormMessage.style.display = "block";
              contactFormMessage.textContent = "";
              contactFormMessage.className = "form-message";
            }, 500);
          });
        }, 5000);
      }
    });
  }

  // Add parallax effect to hero section
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;
    const hero = document.querySelector(".about-hero");
    const heroContent = document.querySelector(".about-hero-content");

    if (hero && heroContent && scrollPosition < 600) {
      hero.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
      heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
    }
  });

  console.log("About page script loaded successfully!");
});
