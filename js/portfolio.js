// Portfolio functionality
class PortfolioManager {
  constructor() {
    this.portfolioData = null;
    this.currentFilter = "all";
    this.filteredProjects = [];
    this.currentPage = 1;
    this.itemsPerPage = 6;
    this.totalPages = 1;

    this.init();
  }

  async init() {
    try {
      await this.loadPortfolioData();
      this.renderFilterTabs();
      this.renderPortfolioGrid();
      this.hideLoading();
      this.setupEventListeners();
      this.initScrollAnimations();
    } catch (error) {
      console.error("Error initializing portfolio:", error);
      this.showError();
    }
  }

  async loadPortfolioData() {
    try {
      const response = await fetch("../data/portfolio.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.portfolioData = await response.json();
      this.filteredProjects = this.portfolioData.projects;
    } catch (error) {
      console.error("Error loading portfolio data:", error);
      throw error;
    }
  }

  renderFilterTabs() {
    const filterTabs = document.getElementById("filterTabs");
    if (!filterTabs || !this.portfolioData) return;

    const tabsHTML = this.portfolioData.categories
      .map(
        (category) => `
      <button 
        class="filter-tab ${category.id === this.currentFilter ? "active" : ""}" 
        data-filter="${category.id}"
        aria-label="Filter by ${category.label}"
      >
        <i class="${category.icon}"></i>
        <span>${category.label}</span>
      </button>
    `,
      )
      .join("");

    filterTabs.innerHTML = tabsHTML;
  }

  renderPortfolioGrid() {
    const grid = document.getElementById("portfolioGrid");
    const emptyState = document.getElementById("emptyState");

    if (!grid || !this.filteredProjects) return;

    if (this.filteredProjects.length === 0) {
      grid.innerHTML = "";
      emptyState.style.display = "flex";
      this.hidePagination();
      return;
    }

    emptyState.style.display = "none";

    // Calculate pagination
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const projectsToShow = this.filteredProjects.slice(startIndex, endIndex);

    const gridHTML = projectsToShow
      .map(
        (project, index) => `
      <article class="portfolio-item" data-category="${project.category}" style="animation-delay: ${index * 0.1}s">
        <div class="portfolio-card">
          <div class="card-header">
            <div class="project-icon">
              <i class="${project.icon}"></i>
            </div>
            <div class="project-meta">
              <span class="project-year">${project.year}</span>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            
            <div class="project-technologies">
              ${project.technologies
                .map(
                  (tech) => `
                <span class="tech-tag">${tech}</span>
              `,
                )
                .join("")}
            </div>
          </div>
          
          <div class="card-footer">
            <div class="project-links">
              ${
                project.links.live
                  ? `
                <a href="${project.links.live}" target="_blank" rel="noopener noreferrer" class="project-link live-link">
                  <i class="fas fa-external-link-alt"></i>
                  <span>Live Site</span>
                </a>
              `
                  : ""
              }
              ${
                project.links.github
                  ? `
                <a href="${project.links.github}" target="_blank" rel="noopener noreferrer" class="project-link github-link">
                  <i class="fab fa-github"></i>
                  <span>GitHub</span>
                </a>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </article>
    `,
      )
      .join("");

    grid.innerHTML = gridHTML;

    // Update pagination controls
    this.updatePagination();

    // Trigger enter animations
    setTimeout(() => {
      const items = grid.querySelectorAll(".portfolio-item");
      items.forEach((item) => item.classList.add("animate-in"));
    }, 100);
  }

  filterProjects(categoryId) {
    if (categoryId === "all") {
      this.filteredProjects = this.portfolioData.projects;
    } else {
      this.filteredProjects = this.portfolioData.projects.filter(
        (project) => project.category === categoryId,
      );
    }

    this.currentFilter = categoryId;
    this.currentPage = 1; // Reset to page 1 when filtering
    this.updateActiveTab();
    this.renderPortfolioGrid();
  }

  updateActiveTab() {
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach((tab) => {
      if (tab.dataset.filter === this.currentFilter) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
  }

  updatePagination() {
    const paginationControls = document.getElementById("paginationControls");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageNumbers = document.getElementById("pageNumbers");

    if (!paginationControls || !prevBtn || !nextBtn || !pageNumbers) return;

    // Show/hide pagination based on total pages
    if (this.totalPages <= 1) {
      this.hidePagination();
      return;
    }

    paginationControls.style.display = "flex";

    // Update button states
    prevBtn.disabled = this.currentPage === 1;
    nextBtn.disabled = this.currentPage === this.totalPages;

    // Update page numbers
    pageNumbers.innerHTML = this.renderPageNumbers();
  }

  renderPageNumbers() {
    let html = "";
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      html += `<button class="page-number" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="page-ellipsis">...</span>`;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-number ${i === this.currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }

    // Last page
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        html += `<span class="page-ellipsis">...</span>`;
      }
      html += `<button class="page-number" data-page="${this.totalPages}">${this.totalPages}</button>`;
    }

    return html;
  }

  hidePagination() {
    const paginationControls = document.getElementById("paginationControls");
    if (paginationControls) {
      paginationControls.style.display = "none";
    }
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.renderPortfolioGrid();
  }

  setupEventListeners() {
    // Filter tab clicks
    document.addEventListener("click", (e) => {
      if (e.target.closest(".filter-tab")) {
        const tab = e.target.closest(".filter-tab");
        const filter = tab.dataset.filter;
        this.filterProjects(filter);
      }

      // Pagination clicks
      if (e.target.closest("#prevBtn")) {
        this.goToPage(this.currentPage - 1);
      } else if (e.target.closest("#nextBtn")) {
        this.goToPage(this.currentPage + 1);
      } else if (e.target.closest(".page-number")) {
        const page = parseInt(e.target.closest(".page-number").dataset.page);
        this.goToPage(page);
      }
    });

    // Keyboard navigation for filter tabs
    document.addEventListener("keydown", (e) => {
      if (e.target.classList.contains("filter-tab")) {
        const tabs = Array.from(document.querySelectorAll(".filter-tab"));
        const currentIndex = tabs.indexOf(e.target);

        let newIndex;
        if (e.key === "ArrowLeft") {
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else if (e.key === "ArrowRight") {
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.target.click();
          return;
        }

        if (newIndex !== undefined) {
          e.preventDefault();
          tabs[newIndex].focus();
        }
      }
    });
  }

  initScrollAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    }, observerOptions);

    // Observe portfolio items
    const portfolioItems = document.querySelectorAll(".portfolio-item");
    portfolioItems.forEach((item) => observer.observe(item));

    // Observe hero content
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) observer.observe(heroContent);

    // Observe filter tabs
    const filterTabs = document.querySelector(".portfolio-filters");
    if (filterTabs) observer.observe(filterTabs);
  }

  hideLoading() {
    const loadingState = document.getElementById("loadingState");
    if (loadingState) {
      loadingState.style.display = "none";
    }
  }

  showError() {
    const grid = document.getElementById("portfolioGrid");
    const loadingState = document.getElementById("loadingState");

    if (loadingState) loadingState.style.display = "none";

    if (grid) {
      grid.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Failed to load portfolio</h3>
          <p>There was an error loading the portfolio data. Please try refreshing the page.</p>
          <button class="retry-button" onclick="location.reload()">
            <i class="fas fa-redo"></i>
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Initialize portfolio when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PortfolioManager();
});

// Smooth scroll for any internal links
document.addEventListener("click", (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
});
