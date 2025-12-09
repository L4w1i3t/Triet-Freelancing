// Enhanced Animation system for Liquid Glass / Interstellar Theme

document.addEventListener("DOMContentLoaded", function () {
  // Initialize lightweight animation systems only
  initOptimizedScrollAnimations();
  initBackgroundEffects();
  init3DInteractions();
  initGlassShimmer();
  // Removed: initCosmicParticles() - too performance intensive

  // Parallax and smooth scrolling
  initParallaxEffects();

  // Header scroll effect
  initHeaderScroll();

  // Initialize mobile menu
  initMobileMenu();

  // Removed: initMagneticButtons() - too performance intensive for average GPUs
});

// Enhanced scroll animations with intersection observer
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (
        entry.isIntersecting &&
        !entry.target.classList.contains("animated")
      ) {
        const element = entry.target;
        const delay = element.getAttribute("data-delay") || 0;
        const animation = element.getAttribute("data-animation") || "fadeIn";

        setTimeout(() => {
          element.classList.add("animated", animation);
        }, delay);
      }
    });
  }, observerOptions);

  animatedElements.forEach((element) => {
    observer.observe(element);
  });
}

// Dynamic background effects
function initBackgroundEffects() {
  // Skip the columnized starfield on the homepage
  const isHomepage =
    document.documentElement.classList.contains("homepage") ||
    document.body.classList.contains("homepage");

  if (!isHomepage) {
    createStarField();
  }
}

// Create animated star field
function createStarField() {
  const mount = () => {
    const starField = document.createElement("div");
    starField.className = "cosmic-starfield";
    starField.style.opacity = "0";
    starField.style.transition = "opacity 400ms ease";
    document.body.appendChild(starField);
    requestAnimationFrame(() => (starField.style.opacity = "1"));
  };

  const schedule = () => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(mount, { timeout: 1000 });
    } else {
      setTimeout(mount, 150);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }
}

// Enhanced 3D interactions
function init3DInteractions() {
  const cards3D = document.querySelectorAll(".service-card, .card");

  cards3D.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateZ(20px)
            `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
    });
  });
}

// Mouse follower effect
function initMouseFollower() {
  const follower = document.createElement("div");
  follower.className = "mouse-follower";
  follower.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, var(--accent-aurora-cyan), transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.6;
        transition: transform 0.1s ease;
        mix-blend-mode: screen;
    `;

  document.body.appendChild(follower);

  document.addEventListener("mousemove", (e) => {
    follower.style.left = e.clientX - 10 + "px";
    follower.style.top = e.clientY - 10 + "px";
  });

  // Enhance follower on interactive elements
  const interactiveElements = document.querySelectorAll("a, button, .btn");
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      follower.style.transform = "scale(2)";
      follower.style.opacity = "0.8";
    });

    el.addEventListener("mouseleave", () => {
      follower.style.transform = "scale(1)";
      follower.style.opacity = "0.6";
    });
  });
}

// Glass shimmer effect
function initGlassShimmer() {
  const glassElements = document.querySelectorAll(
    ".glass, .btn, .service-card",
  );

  glassElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      if (!element.classList.contains("glass-shimmer")) {
        element.classList.add("glass-shimmer");

        setTimeout(() => {
          element.classList.remove("glass-shimmer");
        }, 3000);
      }
    });
  });
}

// Cosmic particles system
function initCosmicParticles() {
  const particleContainer = document.createElement("div");
  particleContainer.className = "particle-field";

  // Create particles
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    // Random starting position and timing
    particle.style.cssText = `
            left: ${Math.random() * 100}%;
            top: 100%;
            animation-delay: ${Math.random() * 15}s;
            animation-duration: ${15 + Math.random() * 10}s;
        `;

    particleContainer.appendChild(particle);
  }

  document.body.appendChild(particleContainer);
}

// Parallax effects
function initParallaxEffects() {
  const parallaxElements = document.querySelectorAll(".hero-image");

  let ticking = false;

  function updateParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    parallaxElements.forEach((element, index) => {
      const speed = (index + 1) * 0.3;
      element.style.transform = `translateY(${rate * speed}px)`;
    });

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });
}

// Header scroll effect
function initHeaderScroll() {
  const header = document.querySelector(".site-header");

  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// Mobile menu toggle with enhanced animation
function initMobileMenu() {
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const navigation = document.querySelector(".main-nav");

  if (!menuToggle || !navigation) return;

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", !isExpanded);
    navigation.classList.toggle("active");

    // Add body scroll lock when menu is open
    if (!isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navigation.contains(e.target)) {
      menuToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// Performance optimization for mobile devices
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth <= 768
  );
}

function isTabletDevice() {
  return (
    window.innerWidth > 768 &&
    window.innerWidth <= 1024 &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
}

// Optimized scroll animations for mobile
function initOptimizedScrollAnimations() {
  if (isMobileDevice() || isTabletDevice()) {
    // Disable heavy scroll animations on mobile/tablet
    const animatedElements = document.querySelectorAll(".animate-on-scroll");
    animatedElements.forEach((element) => {
      element.classList.remove("animate-on-scroll");
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    return;
  }

  // Regular scroll animations for desktop
  initScrollAnimations();
}

function throttle(func, delay) {
  let inProgress = false;
  return function (...args) {
    if (inProgress) return;
    inProgress = true;
    setTimeout(() => {
      func.apply(this, args);
      inProgress = false;
    }, delay);
  };
}

// Add magnetic effect to buttons
function initMagneticButtons() {
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach((button) => {
    button.addEventListener("mousemove", (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translate(0, 0)";
    });
  });
}
