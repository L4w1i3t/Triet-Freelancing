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
      console.log('Environment configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('Failed to load environment configuration:', error);
      // Fallback to static env-config.js if server is not available
      return this._loadFallback();
    } finally {
      this.loadPromise = null;
    }
  }

  async _fetchConfig() {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    return response.json();
  }

  async _loadFallback() {
    try {
      // Try to load the static env-config.js as fallback
      const script = document.createElement('script');
      script.src = '/js/env-config.js';
      document.head.appendChild(script);
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          if (window.ENV_CONFIG) {
            console.log('Loaded fallback environment configuration');
            this.config = window.ENV_CONFIG;
            this.isLoaded = true;
            resolve(this.config);
          } else {
            reject(new Error('Fallback env-config.js not found'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load fallback configuration'));
      });
    } catch (error) {
      console.error('Fallback configuration failed:', error);
      // Return empty config as last resort
      return {};
    }
  }

  // Getter methods for easy access
  get(key) {
    if (!this.isLoaded || !this.config) {
      console.warn('Environment configuration not loaded. Call EnvConfig.load() first.');
      return '';
    }
    return this.config[key] || '';
  }

  getAll() {
    if (!this.isLoaded || !this.config) {
      console.warn('Environment configuration not loaded. Call EnvConfig.load() first.');
      return {};
    }
    return { ...this.config };
  }
}

// Create global instance
window.envConfig = new EnvConfig();

// For backward compatibility, also expose as ENV_CONFIG after loading
window.envConfig.load().then(config => {
  window.ENV_CONFIG = config;
}).catch(error => {
  console.error('Failed to initialize environment configuration:', error);
});
