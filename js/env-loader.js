// Dynamic Environment Configuration Loader
// This replaces the static env-config.js file

class EnvConfig {
  constructor() {
    this.config = null;
    this.isLoaded = false;
    this.loadPromise = null;
  }

  async load() {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Return cached config if already loaded
    if (this.isLoaded && this.config) {
      return this.config;
    }

    // Create new load promise
    this.loadPromise = this._fetchConfig();

    try {
      this.config = await this.loadPromise;
      this.isLoaded = true;
      console.log("Environment configuration loaded successfully");
      return this.config;
    } catch (error) {
      console.error("Failed to load environment configuration:", error);
      // Fallback to static env-config.js if server is not available
      return this._loadFallback();
    } finally {
      this.loadPromise = null;
    }
  }

  async _fetchConfig() {
    try {
      console.log("Fetching configuration from /api/config...");
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
      const config = await response.json();
      console.log("Configuration fetched successfully:", Object.keys(config));
      return config;
    } catch (error) {
      console.error("API config not available.");
      throw error; // This will trigger the fallback
    }
  }

  async _loadFallback() {
    console.warn(
      "API config not available, using empty fallback configuration",
    );
    // Return empty config as fallback since env-config.js is removed
    return {
      EMAILJS_SERVICE_ID: "",
      EMAILJS_TEMPLATE_ID_ADMIN: "",
      EMAILJS_TEMPLATE_ID_CUSTOMER: "",
      EMAILJS_PUBLIC_KEY: "",
      STRIPE_PUBLISHABLE_KEY: "",
    };
  }
}

// Create global instance
window.envConfig = new EnvConfig();

// Initialize environment configuration
window.envConfig
  .load()
  .then((config) => {
    console.log("Environment configuration initialized successfully");
  })
  .catch((error) => {
    console.error("Failed to initialize environment configuration:", error);
  });
