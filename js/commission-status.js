// ==================================================
// COMMISSION STATUS LIGHT FUNCTIONALITY
// ==================================================

class CommissionStatus {
  constructor() {
    this.statusMessages = {
      green: "I am actively accepting commissions with quick turnaround times!",
      yellow:
        "I am accepting commissions but have a busy queue. Expect longer delivery times.",
      red: "I am currently not accepting new commissions. Please check back later!",
    };

    this.init();
  }

  init() {
    this.statusLight = document.getElementById("statusLight");
    this.heroSubtitle = document.getElementById("heroSubtitle");

    if (!this.statusLight || !this.heroSubtitle) {
      console.warn("Commission status elements not found on this page");
      return;
    }

    // Read status from HTML data attribute
    this.currentStatus = this.loadStatusFromHTML();

    // Set initial display
    this.updateDisplay();
  }

  loadStatusFromHTML() {
    const statusFromHTML = this.statusLight.getAttribute("data-status");
    return ["green", "yellow", "red"].includes(statusFromHTML)
      ? statusFromHTML
      : "green";
  }

  updateDisplay() {
    // Update the light color (in case it was changed)
    this.statusLight.setAttribute("data-status", this.currentStatus);

    // Update the subtitle text
    this.heroSubtitle.textContent = this.statusMessages[this.currentStatus];
  }

  // Public method to get current status (for potential API integration)
  getStatus() {
    return {
      status: this.currentStatus,
      message: this.statusMessages[this.currentStatus],
      timestamp: new Date().toISOString(),
    };
  }
}

// Initialize commission status when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize on homepage
  if (document.body.classList.contains("homepage")) {
    window.commissionStatus = new CommissionStatus();
  }
});

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = CommissionStatus;
}
