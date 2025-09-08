class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.portfolioData = [];
    this.servicesData = [];
    this.technologies = [];

    this.initEventListeners();
    this.checkAuth();
  }

  initEventListeners() {
    // Auth form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.login();
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout();
    });

    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.switchSection(btn.dataset.section);
      });
    });

    // Portfolio form
    document.getElementById("portfolioForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.savePortfolioItem();
    });

    // Service form
    document.getElementById("serviceForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveServiceItem();
    });

    // Technology input
    document.getElementById("techInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addTechnology();
      }
    });
  }

  async login() {
    const password = document.getElementById("adminPassword").value;
    const errorEl = document.getElementById("loginError");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (response.ok) {
        this.currentUser = result.user;
        localStorage.setItem("adminToken", result.token);
        this.showDashboard();
        this.loadData();
      } else {
        errorEl.textContent = result.error || "Invalid password";
        errorEl.style.display = "block";
      }
    } catch (error) {
      errorEl.textContent = "Login failed. Please try again.";
      errorEl.style.display = "block";
    }
  }

  async logout() {
    try {
      // Call logout API for audit logging
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    this.currentUser = null;
    localStorage.removeItem("adminToken");
    this.showAuth();
  }

  checkAuth() {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Verify token with server
      this.verifyToken(token);
    } else {
      this.showAuth();
    }
  }

  async verifyToken(token) {
    try {
      const response = await fetch("/api/admin/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        this.currentUser = result.user;
        this.showDashboard();
        this.loadData();
      } else {
        this.showAuth();
      }
    } catch (error) {
      this.showAuth();
    }
  }

  showAuth() {
    document.getElementById("authContainer").style.display = "block";
    document.getElementById("adminContainer").style.display = "none";
  }

  showDashboard() {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("adminContainer").style.display = "block";
  }

  switchSection(section) {
    // Update nav buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-section="${section}"]`)
      .classList.add("active");

    // Update sections
    document.querySelectorAll(".admin-section").forEach((sec) => {
      sec.classList.remove("active");
    });
    document.getElementById(section).classList.add("active");

    // Load section-specific data
    if (section === "settings") {
      this.loadBackups();
    }
  }

  async loadData() {
    try {
      // Load portfolio data
      const portfolioResponse = await fetch("/api/admin/portfolio", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      this.portfolioData = await portfolioResponse.json();
      this.renderPortfolioTable();

      // Load services data
      const servicesResponse = await fetch("/api/admin/services", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      this.servicesData = await servicesResponse.json();
      this.renderServicesTable();

      // Load audit log data
      await this.loadAuditLog();

      // Load backup data if on settings page
      if (document.getElementById("settings").classList.contains("active")) {
        await this.loadBackups();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  renderPortfolioTable() {
    const tableContainer = document.getElementById("portfolioTable");

    if (
      !this.portfolioData.projects ||
      this.portfolioData.projects.length === 0
    ) {
      tableContainer.innerHTML = "<p>No portfolio items found.</p>";
      return;
    }

    const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Year</th>
                        <th>Technologies</th>
                        <th>Links</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.portfolioData.projects
                      .map(
                        (project) => `
                        <tr>
                            <td style="text-align: center; font-size: 1.2rem;"><i class="${project.icon || 'fas fa-question'}"></i></td>
                            <td><strong>${project.title}</strong></td>
                            <td><span style="text-transform: capitalize;">${project.category}</span></td>
                            <td>${project.year}</td>
                            <td>${project.technologies ? project.technologies.slice(0, 2).join(", ") + (project.technologies.length > 2 ? "..." : "") : ""}</td>
                            <td>
                                ${project.links?.live ? '<i class="fas fa-external-link-alt" style="color: #4CAF50;" title="Live site"></i>' : ''}
                                ${project.links?.github ? '<i class="fab fa-github" style="color: #ccc;" title="GitHub"></i>' : ''}
                                ${!project.links?.live && !project.links?.github ? '<span style="color: #666;">None</span>' : ''}
                            </td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn-small btn-edit" onclick="admin.editPortfolioItem('${project.id}')">Edit</button>
                                    <button class="btn-small btn-delete" onclick="admin.deletePortfolioItem('${project.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;

    tableContainer.innerHTML = table;
  }

  renderServicesTable() {
    const tableContainer = document.getElementById("servicesTable");

    if (
      !this.servicesData.serviceTiers ||
      this.servicesData.serviceTiers.length === 0
    ) {
      tableContainer.innerHTML = "<p>No services found.</p>";
      return;
    }

    let allServices = [];
    this.servicesData.serviceTiers.forEach((tier) => {
      if (tier.services) {
        tier.services.forEach((service) => {
          allServices.push({
            ...service,
            tierName: tier.name,
            tierId: tier.id,
          });
        });
      }
    });

    const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Tier</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allServices
                      .map(
                        (service) => `
                        <tr>
                            <td>${service.title}</td>
                            <td>${service.tierName}</td>
                            <td>${service.price}</td>
                            <td>${service.duration}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn-small btn-edit" onclick="admin.editServiceItem('${service.tierId}', '${service.id}')">Edit</button>
                                    <button class="btn-small btn-delete" onclick="admin.deleteServiceItem('${service.tierId}', '${service.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;

    tableContainer.innerHTML = table;
  }

  editPortfolioItem(projectId) {
    const project = this.portfolioData.projects.find((p) => p.id === projectId);
    if (!project) return;

    // Populate form
    document.getElementById("portfolioId").value = project.id;
    document.getElementById("projectTitle").value = project.title;
    document.getElementById("projectCategory").value = project.category;
    document.getElementById("projectYear").value = project.year;
    document.getElementById("projectDescription").value = project.description;
    document.getElementById("projectLiveLink").value =
      project.links?.live || "";
    document.getElementById("projectGithubLink").value =
      project.links?.github || "";
    document.getElementById("projectIcon").value = project.icon || "";

    // Set technologies
    this.technologies = project.technologies || [];
    this.renderTechnologies();

    document.getElementById("portfolioModalTitle").textContent = "Edit Project";
    this.openModal("portfolioModal");
  }

  editServiceItem(tierId, serviceId) {
    const tier = this.servicesData.serviceTiers.find((t) => t.id === tierId);
    const service = tier?.services?.find((s) => s.id === serviceId);
    if (!service) return;

    // Populate form
    document.getElementById("serviceId").value = service.id;
    document.getElementById("serviceTierId").value = tierId;
    document.getElementById("serviceTier").value = tierId;
    document.getElementById("serviceTitle").value = service.title;
    document.getElementById("servicePrice").value = service.price;
    document.getElementById("serviceDuration").value = service.duration;
    document.getElementById("serviceDescription").value = service.description;

    document.getElementById("serviceModalTitle").textContent = "Edit Service";
    this.openModal("serviceModal");
  }

  async savePortfolioItem() {
    const formData = {
      id: document.getElementById("portfolioId").value || this.generateId(),
      title: document.getElementById("projectTitle").value,
      category: document.getElementById("projectCategory").value,
      year: document.getElementById("projectYear").value,
      description: document.getElementById("projectDescription").value,
      technologies: this.technologies,
      links: {
        live: document.getElementById("projectLiveLink").value || null,
        github: document.getElementById("projectGithubLink").value || null,
      },
      icon: document.getElementById("projectIcon").value,
    };

    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        this.closeModal("portfolioModal");
        this.loadData();
        this.resetPortfolioForm();
      } else {
        const error = await response.json();
        alert("Error saving project: " + error.message);
      }
    } catch (error) {
      alert("Error saving project: " + error.message);
    }
  }

  async saveServiceItem() {
    const formData = {
      id: document.getElementById("serviceId").value || this.generateId(),
      tierId: document.getElementById("serviceTier").value,
      title: document.getElementById("serviceTitle").value,
      price: document.getElementById("servicePrice").value,
      duration: document.getElementById("serviceDuration").value,
      description: document.getElementById("serviceDescription").value,
    };

    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        this.closeModal("serviceModal");
        this.loadData();
        this.resetServiceForm();
      } else {
        const error = await response.json();
        alert("Error saving service: " + error.message);
      }
    } catch (error) {
      alert("Error saving service: " + error.message);
    }
  }

  async deletePortfolioItem(projectId) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/admin/portfolio/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        this.loadData();
      } else {
        const error = await response.json();
        alert("Error deleting project: " + error.message);
      }
    } catch (error) {
      alert("Error deleting project: " + error.message);
    }
  }

  async deleteServiceItem(tierId, serviceId) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(
        `/api/admin/services/${tierId}/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        },
      );

      if (response.ok) {
        this.loadData();
      } else {
        const error = await response.json();
        alert("Error deleting service: " + error.message);
      }
    } catch (error) {
      alert("Error deleting service: " + error.message);
    }
  }

  addTechnology() {
    const input = document.getElementById("techInput");
    const tech = input.value.trim();

    if (tech && !this.technologies.includes(tech)) {
      this.technologies.push(tech);
      this.renderTechnologies();
      input.value = "";
    }
  }

  removeTechnology(tech) {
    this.technologies = this.technologies.filter((t) => t !== tech);
    this.renderTechnologies();
  }

  renderTechnologies() {
    const container = document.getElementById("technologiesList");
    container.innerHTML = this.technologies
      .map(
        (tech) => `
            <div class="tech-tag">
                ${tech}
                <button type="button" onclick="admin.removeTechnology('${tech}')">&times;</button>
            </div>
        `,
      )
      .join("");
  }

  openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }

  resetPortfolioForm() {
    document.getElementById("portfolioForm").reset();
    document.getElementById("portfolioId").value = "";
    this.technologies = [];
    this.renderTechnologies();
    document.getElementById("portfolioModalTitle").textContent =
      "Add New Project";
  }

  resetServiceForm() {
    document.getElementById("serviceForm").reset();
    document.getElementById("serviceId").value = "";
    document.getElementById("serviceTierId").value = "";
    document.getElementById("serviceModalTitle").textContent =
      "Add New Service";
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async exportData() {
    try {
      // Show loading state
      const button = document.querySelector('button[onclick="exportData()"]');
      const originalText = button.textContent;
      button.textContent = "⏳ Updating Website Data...";
      button.disabled = true;

      const response = await fetch("/api/admin/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.blob();
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trietdev-data-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification(
          "✅ Live website data updated successfully! Your portfolio and services are now live.",
          "success",
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      this.showNotification(
        "❌ Error updating website data: " + error.message,
        "error",
      );
    } finally {
      // Restore button state
      const button = document.querySelector('button[onclick="exportData()"]');
      if (button) {
        button.textContent = "📝 Update Live Website Data";
        button.disabled = false;
      }
    }
  }

  async createBackup() {
    try {
      // Show loading state
      const button = document.querySelector('button[onclick="backupData()"]');
      const originalText = button.textContent;
      button.textContent = "⏳ Creating Backup...";
      button.disabled = true;

      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        this.showNotification(
          `💾 Backup created successfully: ${result.filename}`,
          "success",
        );
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create backup");
      }
    } catch (error) {
      console.error("Backup error:", error);
      this.showNotification(
        "❌ Error creating backup: " + error.message,
        "error",
      );
    } finally {
      // Restore button state
      const button = document.querySelector('button[onclick="backupData()"]');
      if (button) {
        button.textContent = "💾 Create Data Backup";
        button.disabled = false;
      }
    }
  }

  async loadAuditLog() {
    try {
      const limit = document.getElementById("auditLimit")?.value || 100;
      const response = await fetch(`/api/admin/audit-log?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        this.auditData = await response.json();
        this.renderAuditStats();
        this.renderAuditTable();
      }
    } catch (error) {
      console.error("Failed to load audit log:", error);
    }
  }

  renderAuditStats() {
    if (!this.auditData) return;

    const stats = this.auditData.stats;

    document.getElementById("successRate").textContent =
      `${stats.successRate}%`;
    document.getElementById("failedAttempts").textContent =
      this.auditData.failedAttempts.length;
    document.getElementById("uniqueIPs").textContent = stats.uniqueIPs;

    if (this.auditData.lastLogin) {
      const lastLogin = new Date(this.auditData.lastLogin).toLocaleString();
      document.getElementById("lastLogin").textContent = lastLogin;
    }
  }

  renderAuditTable() {
    const tableContainer = document.getElementById("auditTable");

    if (!this.auditData || this.auditData.entries.length === 0) {
      tableContainer.innerHTML = "<p>No audit entries found.</p>";
      return;
    }

    const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.auditData.entries
                      .map(
                        (entry) => `
                        <tr style="${!entry.success ? "background: rgba(244, 67, 54, 0.1);" : ""}">
                            <td>${new Date(entry.timestamp).toLocaleString()}</td>
                            <td>${this.formatEventType(entry.event)}</td>
                            <td>
                                <span style="color: ${entry.success ? "#4CAF50" : "#f44336"};">
                                    ${entry.success ? "✅ Success" : "❌ Failed"}
                                </span>
                            </td>
                            <td>${entry.ip || "Unknown"}</td>
                            <td>${this.formatEventDetails(entry)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;

    tableContainer.innerHTML = table;
  }

  formatEventType(event) {
    const eventMap = {
      admin_login: "🔐 Login",
      admin_logout: "🚪 Logout",
      admin_action: "⚙️ Action",
      security_alert: "🚨 Alert",
    };
    return eventMap[event] || event;
  }

  formatEventDetails(entry) {
    if (entry.event === "admin_login" && !entry.success) {
      return entry.reason || "Login failed";
    }
    if (entry.event === "admin_action") {
      return entry.action || "Unknown action";
    }
    if (entry.event === "security_alert") {
      return entry.alerts?.map((a) => a.message).join(", ") || "Security alert";
    }
    if (entry.userAgent) {
      const ua = entry.userAgent;
      if (ua.includes("Chrome")) return "🌐 Chrome";
      if (ua.includes("Firefox")) return "🦊 Firefox";
      if (ua.includes("Safari")) return "🍎 Safari";
      if (ua.includes("Edge")) return "📘 Edge";
      return "🌐 Browser";
    }
    return "-";
  }

  async refreshAuditLog() {
    await this.loadAuditLog();
  }

  async exportAuditLog(format = "json") {
    try {
      // Close the dropdown
      const dropdown = document.getElementById("exportDropdown");
      if (dropdown) dropdown.style.display = "none";

      const endpoint =
        format === "csv"
          ? "/api/admin/export/audit-logs/csv"
          : "/api/admin/export/audit-logs/json";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header or create default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="(.+)"/);
          if (matches) filename = matches[1];
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification(
          `Audit log exported as ${format.toUpperCase()}`,
          "success",
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      this.showNotification(
        "Error exporting audit log: " + error.message,
        "error",
      );
    }
  }

  async exportSecurityAlerts() {
    try {
      // Close the dropdown
      const dropdown = document.getElementById("exportDropdown");
      if (dropdown) dropdown.style.display = "none";

      const response = await fetch("/api/admin/export/security-alerts/json", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `security-alerts-${new Date().toISOString().split("T")[0]}.json`;
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="(.+)"/);
          if (matches) filename = matches[1];
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification(
          "Security alerts exported successfully",
          "success",
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      this.showNotification(
        "Error exporting security alerts: " + error.message,
        "error",
      );
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === "success" ? "rgba(34, 197, 94, 0.9)" : type === "error" ? "rgba(239, 68, 68, 0.9)" : "rgba(59, 130, 246, 0.9)"};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;

    // Add animation keyframes if not already added
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  async loadBackups() {
    try {
      const response = await fetch("/api/admin/backups", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        this.backups = await response.json();
        this.renderBackupsTable();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to load backups:", error);
      document.getElementById("backupsTable").innerHTML =
        '<p style="color: #f44336;">Failed to load backups</p>';
    }
  }

  renderBackupsTable() {
    const tableContainer = document.getElementById("backupsTable");

    if (!this.backups || this.backups.length === 0) {
      tableContainer.innerHTML =
        '<p style="color: #ccc;">No backups found.</p>';
      return;
    }

    const table = `
            <table class="data-table" style="font-size: 0.9rem;">
                <thead>
                    <tr>
                        <th>Date Created</th>
                        <th>Size</th>
                        <th>Portfolio Items</th>
                        <th>Services</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.backups
                      .map(
                        (backup) => `
                        <tr>
                            <td>
                                <div style="line-height: 1.2;">
                                    <strong>${new Date(backup.created).toLocaleDateString()}</strong><br>
                                    <small style="color: #ccc;">${new Date(backup.created).toLocaleTimeString()}</small>
                                </div>
                            </td>
                            <td>${this.formatFileSize(backup.size)}</td>
                            <td style="text-align: center;">${backup.portfolioCount}</td>
                            <td style="text-align: center;">${backup.servicesCount}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn-small btn-edit" onclick="admin.downloadBackup('${backup.filename}')" title="Download backup">💾 Download</button>
                                    <button class="btn-small btn-delete" onclick="admin.deleteBackup('${backup.filename}')" title="Delete backup">🗑️ Delete</button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;

    tableContainer.innerHTML = table;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  async downloadBackup(filename) {
    try {
      const response = await fetch(`/api/admin/backups/${filename}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification(`📥 Backup downloaded: ${filename}`, "success");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      this.showNotification(
        "❌ Error downloading backup: " + error.message,
        "error",
      );
    }
  }

  async deleteBackup(filename) {
    if (
      !confirm(
        `Are you sure you want to delete backup "${filename}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backups/${filename}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        this.showNotification(`🗑️ Backup deleted: ${filename}`, "success");
        await this.loadBackups(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Delete error:", error);
      this.showNotification(
        "❌ Error deleting backup: " + error.message,
        "error",
      );
    }
  }
}

// Global variable for easy access
let admin;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  admin = new AdminDashboard();
});

// Global functions for onclick handlers
window.openModal = (modalId) => admin.openModal(modalId);
window.closeModal = (modalId) => admin.closeModal(modalId);
window.exportData = () => admin.exportData();
window.backupData = () => admin.createBackup();

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("form-modal")) {
    e.target.style.display = "none";
  }
});
