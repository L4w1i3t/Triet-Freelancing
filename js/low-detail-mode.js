// ==================================================
// LOW DETAIL MODE TOGGLE
// ==================================================

class LowDetailMode {
  constructor() {
    this.isActive = false;
    this.toggle = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupToggle());
    } else {
      this.setupToggle();
    }
  }

  setupToggle() {
    // Check if device is tablet and automatically enable low detail mode
    if (this.isTabletDevice()) {
      this.isActive = true;
      this.enableLowDetailMode();
      // Don't load preference for tablets - always force low detail mode
      return;
    }

    this.toggle = document.getElementById("low-detail-toggle");

    if (!this.toggle) {
      console.warn("Low detail toggle button not found");
      return;
    }

    // Initially hide button and only show on desktop
    this.toggle.style.display = "none";
    this.toggle.style.visibility = "hidden";
    this.toggle.style.opacity = "0";

    // Show button only on desktop (xl and above)
    if (window.innerWidth >= 1200) {
      this.toggle.style.display = "flex";
      this.toggle.style.visibility = "visible";
      this.toggle.style.opacity = "1";
    }

    // Check for saved preference
    this.loadPreference();

    // Add event listener
    this.toggle.addEventListener("click", () => this.toggleMode());

    // Update button state
    this.updateButtonState();

    // Add resize listener to handle button visibility
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    if (!this.toggle) return;

    // Hide button on mobile/tablet, show on desktop
    if (window.innerWidth >= 1200) {
      this.toggle.style.display = "flex";
      this.toggle.style.visibility = "visible";
      this.toggle.style.opacity = "1";
    } else {
      this.toggle.style.display = "none";
      this.toggle.style.visibility = "hidden";
      this.toggle.style.opacity = "0";
    }
  }

  toggleMode() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.enableLowDetailMode();
    } else {
      this.disableLowDetailMode();
    }

    // Save preference
    this.savePreference();

    // Update button state
    this.updateButtonState();
  }

  enableLowDetailMode() {
    document.body.classList.add("low-detail-mode");

    // Hide supernova starfield if it exists
    const supernovaStarfield = document.getElementById("supernova-starfield");
    if (supernovaStarfield) {
      supernovaStarfield.style.display = "none";
    }

    // Hide cosmic canvas if it exists
    const cosmicCanvas = document.getElementById("cosmic-canvas");
    if (cosmicCanvas) {
      cosmicCanvas.style.display = "none";
    }

    // Stop any cosmic background animations
    if (
      window.cosmicBackground &&
      typeof window.cosmicBackground.pause === "function"
    ) {
      window.cosmicBackground.pause();
    }

    // Hide all JS-created particles and stars
    const jsStars = document.querySelectorAll(".js-star");
    jsStars.forEach((star) => (star.style.display = "none"));

    const particles = document.querySelectorAll(
      ".particle, .cosmic-particle, .floating-orb, .bubble-effect",
    );
    particles.forEach((particle) => (particle.style.display = "none"));

    // Announce to screen readers
    this.announce("Low detail mode enabled");
  }

  disableLowDetailMode() {
    document.body.classList.remove("low-detail-mode");

    // Show supernova starfield if it exists
    const supernovaStarfield = document.getElementById("supernova-starfield");
    if (supernovaStarfield) {
      supernovaStarfield.style.display = "";
    }

    // Show cosmic canvas if it exists
    const cosmicCanvas = document.getElementById("cosmic-canvas");
    if (cosmicCanvas) {
      cosmicCanvas.style.display = "";
    }

    // Resume cosmic background animations
    if (
      window.cosmicBackground &&
      typeof window.cosmicBackground.resume === "function"
    ) {
      window.cosmicBackground.resume();
    }

    // Show all JS-created particles and stars
    const jsStars = document.querySelectorAll(".js-star");
    jsStars.forEach((star) => (star.style.display = ""));

    const particles = document.querySelectorAll(
      ".particle, .cosmic-particle, .floating-orb, .bubble-effect",
    );
    particles.forEach((particle) => (particle.style.display = ""));

    // Announce to screen readers
    this.announce("Low detail mode disabled");
  }

  updateButtonState() {
    if (!this.toggle) return;

    if (this.isActive) {
      this.toggle.classList.add("active");
      this.toggle.setAttribute("aria-pressed", "true");
      this.toggle.querySelector("span").textContent = "High Detail Mode";
      this.toggle.querySelector("i").className = "fas fa-desktop";
    } else {
      this.toggle.classList.remove("active");
      this.toggle.setAttribute("aria-pressed", "false");
      this.toggle.querySelector("span").textContent = "Low Detail Mode";
      this.toggle.querySelector("i").className = "fas fa-mobile-alt";
    }
  }

  savePreference() {
    try {
      localStorage.setItem("lowDetailMode", this.isActive.toString());
    } catch (e) {
      console.warn("Could not save low detail mode preference:", e);
    }
  }

  loadPreference() {
    try {
      const saved = localStorage.getItem("lowDetailMode");
      if (saved !== null) {
        this.isActive = saved === "true";

        if (this.isActive) {
          this.enableLowDetailMode();
        }
      }
    } catch (e) {
      console.warn("Could not load low detail mode preference:", e);
    }
  }

  announce(message) {
    // Create a temporary element for screen reader announcements
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.overflow = "hidden";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Public method to check if low detail mode is active
  isLowDetailActive() {
    return this.isActive;
  }

  // Public method to programmatically set low detail mode
  setLowDetailMode(enable) {
    if (enable !== this.isActive) {
      this.toggleMode();
    }
  }

  isTabletDevice() {
    return (
      window.innerWidth >= 768 &&
      window.innerWidth < 1200 &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }
}

// Initialize when script loads
const lowDetailMode = new LowDetailMode();

// Add animation for the pulse effect
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;
document.head.appendChild(style);

// Export for potential use by other scripts
window.LowDetailMode = lowDetailMode;
