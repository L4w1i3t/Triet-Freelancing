// Services Page JavaScript
class ServicesManager {
  constructor() {
    this.services = [];
    this.currentTier = "budget"; // Start with budget tier
    this.servicesPerPage = 6;
    this.currentPages = new Map();

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
        if (!this.currentPages.has(this.currentTier)) {
          this.currentPages.set(this.currentTier, 1);
        }
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
      const currentPage = this.getCurrentPage(tier.id, tier.services.length);
      const paginatedServices = this.getPaginatedServices(tier, currentPage);

      servicesContent = `<div class="services-grid">
         ${paginatedServices.map((service) => this.createServiceHTML(service, tier.id)).join("")}
       </div>
       ${this.createPaginationHTML(tier, currentPage)}`;
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

  getCurrentPage(tierId, serviceCount) {
    const totalPages = this.getTotalPages(serviceCount);
    const requestedPage = this.currentPages.get(tierId) || 1;
    const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

    this.currentPages.set(tierId, currentPage);

    return currentPage;
  }

  getTotalPages(serviceCount) {
    return Math.max(1, Math.ceil(serviceCount / this.servicesPerPage));
  }

  getPaginatedServices(tier, currentPage) {
    const startIndex = (currentPage - 1) * this.servicesPerPage;
    const endIndex = startIndex + this.servicesPerPage;

    return tier.services.slice(startIndex, endIndex);
  }

  createPaginationHTML(tier, currentPage) {
    const totalServices = tier.services.length;
    const totalPages = this.getTotalPages(totalServices);

    if (totalPages <= 1) {
      return "";
    }

    const startItem = (currentPage - 1) * this.servicesPerPage + 1;
    const endItem = Math.min(currentPage * this.servicesPerPage, totalServices);
    const pageButtons = Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      const isActive = page === currentPage;

      return `
        <button
          class="pagination-btn pagination-page${isActive ? " active" : ""}"
          type="button"
          data-page="${page}"
          aria-label="Go to page ${page}"
          aria-current="${isActive ? "page" : "false"}"
        >
          ${page}
        </button>
      `;
    }).join("");

    return `
      <nav class="services-pagination" aria-label="${tier.name} services pagination">
        <p class="pagination-status">Showing ${startItem}-${endItem} of ${totalServices}</p>
        <div class="pagination-controls">
          <button
            class="pagination-btn pagination-prev"
            type="button"
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? "disabled" : ""}
            aria-label="Previous services page"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          ${pageButtons}
          <button
            class="pagination-btn pagination-next"
            type="button"
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? "disabled" : ""}
            aria-label="Next services page"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </nav>
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

    document.querySelectorAll(".pagination-btn").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

        this.currentPages.set(this.currentTier, Number(button.dataset.page));
        this.renderCurrentTier();
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
