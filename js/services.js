// Services Page JavaScript
class ServicesManager {
  constructor() {
    this.services = [];
    this.currentTier = "budget"; // Start with budget tier

    this.init();
  }

  async init() {
    try {
      await this.loadServices();
      this.setupTierNavigation();
      this.renderCurrentTier();
      this.hideLoadingState();
    } catch (error) {
      console.error("Error initializing services:", error);
      this.showErrorState();
    }
  }

  async loadServices() {
    try {
      const response = await fetch("../data/services.json");
      if (!response.ok) {
        throw new Error("Failed to load services data");
      }
      const data = await response.json();
      this.services = data.serviceTiers || [];
    } catch (error) {
      console.error("Error loading services:", error);
      throw error;
    }
  }

  setupTierNavigation() {
    const tierNav = document.getElementById("tierNav");
    if (!tierNav) return;

    const tabs = tierNav.querySelectorAll(".tier-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
        tabs.forEach((t) => t.classList.remove("active"));

        // Add active class to clicked tab
        tab.classList.add("active");

        // Update current tier and render
        this.currentTier = tab.dataset.tier;
        this.renderCurrentTier();
      });
    });
  }

  renderCurrentTier() {
    const container = document.getElementById("serviceTiers");
    if (!container) return;

    const tier = this.services.find((t) => t.id === this.currentTier);
    if (!tier) return;

    container.innerHTML = this.createTierHTML(tier);

    // Add event listeners for service cards
    this.addEventListeners();
  }

  createTierHTML(tier) {
    let servicesContent;

    if (tier.id === "custom") {
      servicesContent = `<div class="custom-services-message">
         <i class="fas fa-cogs"></i>
         <h4>Custom Quotes Available</h4>
         <p>Don't see exactly what you need listed? I specialize in creating solutions tailored to your specific requirements.</p>
         <p>It doesn't matter what your idea may be; let's discuss your project and see if it's something I can help bring to life.</p>
         <div class="custom-cta">
           <a href="../pages/contact.html" class="contact-button">
             <i class="fas fa-envelope"></i>
             Contact Me for Custom Quote
           </a>
         </div>
       </div>`;
    } else if (tier.services && tier.services.length > 0) {
      servicesContent = `<div class="services-grid">
         ${tier.services.map((service) => this.createServiceHTML(service, tier.id)).join("")}
       </div>`;
    } else {
      servicesContent = `<div class="no-services-message">
         <i class="fas fa-tools"></i>
         <h4>No services currently available</h4>
         <p>I am working on adding new services to this tier. Please check back soon or contact me for custom quotes.</p>
       </div>`;
    }

    return `
      <div class="service-tier active" data-tier="${tier.id}">
        <div class="tier-header">
          <h2 class="tier-name">${tier.name}</h2>
          <div class="tier-price">${tier.priceRange}</div>
          <p class="tier-description">${tier.description}</p>
        </div>
        
        <div class="tier-services">
          <h3>${tier.id === "custom" ? "" : "Available Services"}</h3>
          ${servicesContent}
        </div>
      </div>
    `;
  }

  createServiceHTML(service, tierId) {
    return `
      <div class="service-card" data-service="${service.id}" data-tier="${tierId}">
        <div class="service-content">
          <h4 class="service-title">${service.title}</h4>
          <div class="service-price">${service.price}</div>
          <div class="service-duration">
            <i class="fas fa-clock"></i>
            ${service.duration}
          </div>
          <p class="service-description">${service.description}</p>
          <button class="service-cta" data-service-title="${service.title}">
            Get Started
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    // Add click handlers for CTA buttons only
    document.querySelectorAll(".service-cta").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleCTAClick(button);
      });
    });
  }

  handleCTAClick(button) {
    const serviceCard = button.closest(".service-card");
    const serviceId = serviceCard.dataset.service;

    // Redirect to template page for right now
    window.location.href = `services/${serviceId}.html`;
  }

  hideLoadingState() {
    const loadingState = document.getElementById("loadingState");
    if (loadingState) {
      loadingState.style.display = "none";
    }
  }

  showErrorState() {
    const container = document.getElementById("serviceTiers");
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Unable to load services</h3>
          <p>Please try refreshing the page or contact us directly.</p>
          <button onclick="location.reload()" class="retry-button">
            <i class="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      `;
    }
    this.hideLoadingState();
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ServicesManager();
});

// Add smooth scrolling for anchor links
document.addEventListener("click", (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }
});
