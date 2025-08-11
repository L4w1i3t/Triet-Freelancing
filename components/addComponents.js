// adds the header and footer dynamically to each page without hardcoding

document.addEventListener("DOMContentLoaded", function () {
  // Determine if we're in a subdirectory and handle both development and production paths
  const path = window.location.pathname;
  const isInSubdirectory =
    path.includes("/pages/") || path.includes("\\pages\\");
  const componentPath = isInSubdirectory ? "/components/" : "./components/";

  // Load header
  const headerPlaceholder = document.getElementById("header-placeholder");
  if (headerPlaceholder) {
    fetch(componentPath + "header.html")
      .then((response) => response.text())
      .then((data) => {
        headerPlaceholder.innerHTML = data;

        // Initialize mobile menu after header is loaded
        initMobileMenu();

        // Fix navigation links
        fixNavigationLinks();

        // Fix logo link when in subdirectory
        fixLogoLink();

        // Highlight active nav link
        highlightCurrentPage();
      })
      .catch((error) => console.error("Error loading header:", error));
  } // Load footer
  const footerPlaceholder = document.getElementById("footer-placeholder");
  if (footerPlaceholder) {
    fetch(componentPath + "footer.html")
      .then((response) => response.text())
      .then((data) => {
        footerPlaceholder.innerHTML = data;

        // Set copyright year
        const copyrightYearElement = document.getElementById("copyright-year");
        if (copyrightYearElement) {
          copyrightYearElement.textContent = new Date().getFullYear();
        }

        // Initialize back to top button
        initBackToTopButton();
      })
      .catch((error) => console.error("Error loading footer:", error));
  }
});

// Function to handle hamburger menu toggle
function initMobileMenu() {
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const menuIndicator = document.getElementById("menu-indicator");

  if (menuToggle && mainNav) {
    // Show menu indicator briefly to help users discover the menu
    setTimeout(() => {
      if (menuIndicator) {
        menuIndicator.classList.add("active");

        // Hide menu indicator after a delay
        setTimeout(() => {
          menuIndicator.classList.remove("active");
        }, 5000);
      }
    }, 2000);

    // Remove pulse animation after some time
    setTimeout(() => {
      menuToggle.style.animation = "none";
    }, 6000);

    // Toggle menu on hamburger click
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation(); // Prevent document click from firing

      const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", !isExpanded);

      mainNav.classList.toggle("active");
      menuToggle.classList.toggle("active");

      // Hide the indicator permanently once user interacts with menu
      if (menuIndicator) {
        menuIndicator.classList.add("menu-indicator-hidden");
      }

      // Add animation to menu items when opening
      if (mainNav.classList.contains("active")) {
        const menuItems = mainNav.querySelectorAll("li");
        menuItems.forEach((item, index) => {
          item.style.opacity = "1";
          item.style.animationDelay = `${0.1 * index}s`;
          item.style.animation = "fadeInRight 0.5s forwards";
        });
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      const isClickInsideMenu = mainNav.contains(event.target);
      const isClickOnMenuToggle = menuToggle.contains(event.target);

      if (
        !isClickInsideMenu &&
        !isClickOnMenuToggle &&
        mainNav.classList.contains("active")
      ) {
        mainNav.classList.remove("active");
        menuToggle.classList.remove("active");
      }
    });

    // Close menu when ESC key is pressed
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mainNav.classList.contains("active")) {
        mainNav.classList.remove("active");
        menuToggle.classList.remove("active");
      }
    });
  }
}

// Function to fix navigation links when in subdirectory
function fixNavigationLinks() {
  const path = window.location.pathname;
  const isInSubdirectory =
    path.includes("/pages/") || path.includes("\\pages\\");

  if (isInSubdirectory) {
    // Use the correct selector for navigation links (.nav-menu instead of .nav-links)
    const navLinks = document.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      // Fix links that point to pages directory
      if (href.startsWith("pages/")) {
        link.setAttribute("href", "../" + href);
      } else if (href === "index.html") {
        link.setAttribute("href", "../index.html");
      }
    });
  }
}

// Function to fix the logo link when in subdirectory
function fixLogoLink() {
  const path = window.location.pathname;
  const isInSubdirectory =
    path.includes("/pages/") || path.includes("\\pages\\");

  if (isInSubdirectory) {
    const logoLink = document.getElementById("logo-link");
    if (logoLink && logoLink.getAttribute("href") === "index.html") {
      logoLink.setAttribute("href", "../index.html");
    }
  }
}

// Function to highlight current page in navigation
function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-menu a");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    const pageName = currentPath.split("/").pop();

    // Check if current page matches the link's href
    if (
      pageName === linkPath.split("/").pop() ||
      (currentPath.endsWith("/") && linkPath === "index.html") ||
      (currentPath.endsWith("/index.html") && linkPath === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}

// Function to initialize back to top button
function initBackToTopButton() {
  const backToTopBtn = document.getElementById("back-to-top");

  if (backToTopBtn) {
    // Show button when user scrolls down 300px
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.opacity = "1";
      } else {
        backToTopBtn.style.opacity = "0";
      }
    });

    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}
