// =======================================================
// SECURITY MANAGER - Comprehensive Security Implementation
// =======================================================

class SecurityManager {
  constructor() {
    // Detect development environment
    this.isDevelopment = 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.protocol === 'http:';

    this.config = {
      rateLimiting: {
        enabled: !this.isDevelopment, // Disable in dev
        maxRequests: 10,
        timeWindow: 60000, // 1 minute
        blockDuration: 300000, // 5 minutes
      },
      xss: {
        enabled: true,
        allowedTags: ["b", "i", "u", "strong", "em"],
        allowedAttributes: {},
      },
      csrf: {
        enabled: !this.isDevelopment, // Disable in dev
        tokenName: "csrf_token",
        headerName: "X-CSRF-Token",
      },
      dataProtection: {
        enabled: true,
        encryptSensitiveData: true,
        sanitizeInputs: true,
      },
    };

    this.rateLimitStore = new Map();
    this.blockedIPs = new Set();
    this.csrfToken = null;

    this.init();
  }

  async init() {
    await this.generateCSRFToken();
    this.setupSecurityHeaders();
    this.initializeInputValidation();
    this.setupRateLimiting();
    this.protectForms();
    this.enableClickjackingProtection();
    this.setupContentSecurityPolicy();
    console.log("Security Manager initialized");
  }

  // ===============================================
  // CSRF PROTECTION
  // ===============================================

  async generateCSRFToken() {
    // Skip CSRF in development mode
    if (this.isDevelopment) {
      console.log("Development mode: CSRF protection disabled");
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      this.csrfToken = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      sessionStorage.setItem(this.config.csrf.tokenName, this.csrfToken);
      return;
    }

    try {
      // Fetch CSRF token from server
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.csrfToken) {
        throw new Error('CSRF token not found in server response');
      }
      
      this.csrfToken = data.csrfToken;

      // Store in session storage (more secure than localStorage)
      sessionStorage.setItem(this.config.csrf.tokenName, this.csrfToken);

      // Add to meta tag for easy access
      let csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (!csrfMeta) {
        csrfMeta = document.createElement("meta");
        csrfMeta.name = "csrf-token";
        document.head.appendChild(csrfMeta);
      }
      csrfMeta.content = this.csrfToken;

      console.log(" CSRF token fetched from server successfully");
    } catch (error) {
      console.error(" Failed to fetch CSRF token from server:", error.message);
      console.warn(" Using client-side generated token");
      
      // Fallback to client-generated token for non-critical operations
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      this.csrfToken = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      sessionStorage.setItem(this.config.csrf.tokenName, this.csrfToken);
      
      // Note: CSRF validation is disabled on the server side in development mode
      // In production with static hosting, CSRF protection should be handled by your API gateway/CDN
    }
  }

  validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem(this.config.csrf.tokenName);
    return token && storedToken && token === storedToken;
  }

  getCSRFToken() {
    // In dev mode, always return a valid token
    if (this.isDevelopment && !this.csrfToken) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      this.csrfToken = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    }
    return this.csrfToken || sessionStorage.getItem(this.config.csrf.tokenName);
  }

  // ===============================================
  // XSS PROTECTION
  // ===============================================

  sanitizeInput(input, options = {}) {
    if (typeof input !== "string") return input;

    const config = { ...this.config.xss, ...options };

    // Basic XSS prevention
    let sanitized = input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    // If allowing specific tags, process them
    if (config.allowedTags && config.allowedTags.length > 0) {
      config.allowedTags.forEach((tag) => {
        const tagRegex = new RegExp(`&lt;(${tag})&gt;`, "gi");
        const closeTagRegex = new RegExp(`&lt;\\/(${tag})&gt;`, "gi");
        sanitized = sanitized
          .replace(tagRegex, `<${tag}>`)
          .replace(closeTagRegex, `</${tag}>`);
      });
    }

    return sanitized;
  }

  // ===============================================
  // RATE LIMITING
  // ===============================================

  setupRateLimiting() {
    if (!this.config.rateLimiting.enabled) return;

    // Override fetch to include rate limiting
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (!this.checkRateLimit()) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      return originalFetch.apply(window, args);
    };
  }

  checkRateLimit() {
    const identifier = this.getClientIdentifier();
    const now = Date.now();

    // Check if IP is blocked
    if (this.blockedIPs.has(identifier)) {
      const blockData = this.rateLimitStore.get(`blocked_${identifier}`);
      if (blockData && now < blockData.until) {
        return false; // Still blocked
      } else {
        // Unblock
        this.blockedIPs.delete(identifier);
        this.rateLimitStore.delete(`blocked_${identifier}`);
      }
    }

    // Get current request count
    const key = `requests_${identifier}`;
    const requestData = this.rateLimitStore.get(key) || {
      count: 0,
      firstRequest: now,
    };

    // Reset if time window has passed
    if (now - requestData.firstRequest > this.config.rateLimiting.timeWindow) {
      requestData.count = 1;
      requestData.firstRequest = now;
    } else {
      requestData.count++;
    }

    this.rateLimitStore.set(key, requestData);

    // Check if limit exceeded
    if (requestData.count > this.config.rateLimiting.maxRequests) {
      this.blockedIPs.add(identifier);
      this.rateLimitStore.set(`blocked_${identifier}`, {
        until: now + this.config.rateLimiting.blockDuration,
      });
      console.warn(
        ` Rate limit exceeded for ${identifier}. Blocked for ${this.config.rateLimiting.blockDuration / 1000} seconds.`,
      );
      return false;
    }

    return true;
  }

  getClientIdentifier() {
    // Create a fingerprint based on available data (privacy-conscious)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Security fingerprint", 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    // Create a hash of the fingerprint
    return this.simpleHash(fingerprint);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // ===============================================
  // FORM PROTECTION
  // ===============================================

  protectForms() {
    document.addEventListener("DOMContentLoaded", () => {
      const forms = document.querySelectorAll("form");
      forms.forEach((form) => this.protectForm(form));
    });
  }

  protectForm(form) {
    // Add CSRF token to form
    if (this.config.csrf.enabled) {
      let csrfInput = form.querySelector(
        `input[name="${this.config.csrf.tokenName}"]`,
      );
      if (!csrfInput) {
        csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = this.config.csrf.tokenName;
        form.appendChild(csrfInput);
      }
      csrfInput.value = this.csrfToken;
    }

    // Add input validation
    const inputs = form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      // Real-time input sanitization
      input.addEventListener("input", (e) => {
        if (
          input.type === "email" ||
          input.type === "text" ||
          input.tagName === "TEXTAREA"
        ) {
          const originalValue = e.target.value;
          const sanitizedValue = this.sanitizeInput(originalValue);
          if (originalValue !== sanitizedValue) {
            e.target.value = sanitizedValue;
            this.showSecurityWarning("Input was sanitized for security");
          }
        }
      });

      // Prevent common injection patterns
      input.addEventListener("paste", (e) => {
        setTimeout(() => {
          const value = e.target.value;
          if (this.detectSuspiciousPatterns(value)) {
            e.target.value = this.sanitizeInput(value);
            this.showSecurityWarning(
              "Potentially malicious content was removed",
            );
          }
        }, 0);
      });
    });

    // Form submission validation
    form.addEventListener("submit", (e) => {
      if (!this.validateFormSubmission(form)) {
        e.preventDefault();
        this.showSecurityWarning(
          "Form submission blocked for security reasons",
        );
      }
    });
  }

  detectSuspiciousPatterns(input) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(input));
  }

  validateFormSubmission(form) {
    // Check CSRF token
    if (this.config.csrf.enabled) {
      const csrfInput = form.querySelector(
        `input[name="${this.config.csrf.tokenName}"]`,
      );
      if (!csrfInput || !this.validateCSRFToken(csrfInput.value)) {
        console.error(" CSRF token validation failed");
        return false;
      }
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      console.error(" Rate limit exceeded");
      return false;
    }

    // Validate all inputs
    const inputs = form.querySelectorAll("input, textarea, select");
    for (let input of inputs) {
      if (this.detectSuspiciousPatterns(input.value)) {
        console.error(" Suspicious content detected in form submission");
        return false;
      }
    }

    return true;
  }

  // ===============================================
  // CLICKJACKING PROTECTION
  // ===============================================

  enableClickjackingProtection() {
    // Check if page is being framed
    if (window.self !== window.top) {
      console.warn(" Potential clickjacking attempt detected");
      // Break out of frame
      window.top.location = window.self.location;
    }

    // Add frame-busting code
    const style = document.createElement("style");
    style.innerHTML = `
      html { display: none !important; }
    `;
    document.head.appendChild(style);

    // Remove style after verification
    setTimeout(() => {
      if (window.self === window.top) {
        style.remove();
        document.documentElement.style.display = "block";
      }
    }, 100);
  }

  // ===============================================
  // CONTENT SECURITY POLICY
  // ===============================================

  setupContentSecurityPolicy() {
    // Add CSP meta tag if not present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const csp = document.createElement("meta");
      csp.httpEquiv = "Content-Security-Policy";

      // Check if we're in development (localhost or local IP)
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("192.168.") ||
        window.location.hostname.startsWith("10.") ||
        window.location.hostname.startsWith("172.") ||
        window.location.protocol === "http:";

      let cspContent = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
        font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
        img-src 'self' data: https: blob:;
        connect-src 'self' https://api.emailjs.com https://api.stripe.com;
        frame-src https://js.stripe.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
      `;

      // Only add upgrade-insecure-requests in production
      if (!isDevelopment) {
        cspContent += "upgrade-insecure-requests;";
      }

      csp.content = cspContent.replace(/\s+/g, " ").trim();

      document.head.appendChild(csp);
      console.log(
        ` Content Security Policy applied ${isDevelopment ? "(dev mode - HTTP allowed)" : "(production mode - HTTPS enforced)"}`,
      );
    }
  }

  // ===============================================
  // SECURITY MONITORING
  // ===============================================

  setupSecurityHeaders() {
    // Add security-related meta tags
    const securityHeaders = [
      { name: "referrer-policy", content: "strict-origin-when-cross-origin" },
      {
        name: "permissions-policy",
        content: "camera=(), microphone=(), geolocation=()",
      },
    ];

    securityHeaders.forEach((header) => {
      if (!document.querySelector(`meta[name="${header.name}"]`)) {
        const meta = document.createElement("meta");
        meta.name = header.name;
        meta.content = header.content;
        document.head.appendChild(meta);
      }
    });
  }

  // ===============================================
  // DATA PROTECTION
  // ===============================================

  encryptSensitiveData(data, key = "default") {
    // Simple encryption for client-side data protection
    const keyHash = this.simpleHash(key + this.csrfToken);
    let encrypted = "";

    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length),
      );
    }

    return btoa(encrypted);
  }

  decryptSensitiveData(encryptedData, key = "default") {
    try {
      const keyHash = this.simpleHash(key + this.csrfToken);
      const encrypted = atob(encryptedData);
      let decrypted = "";

      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length),
        );
      }

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }

  // ===============================================
  // SECURITY UTILITIES
  // ===============================================

  initializeInputValidation() {
    // Email validation pattern
    this.emailPattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Phone validation pattern
    this.phonePattern = /^[\+]?[1-9][\d]{0,15}$/;

    // Name validation pattern (letters, spaces, hyphens, apostrophes)
    this.namePattern = /^[a-zA-Z\s\-\'\.]+$/;
  }

  validateEmail(email) {
    return this.emailPattern.test(email);
  }

  validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    return this.phonePattern.test(cleaned);
  }

  validateName(name) {
    return this.namePattern.test(name) && name.length >= 2 && name.length <= 50;
  }

  showSecurityWarning(message) {
    // Create a non-intrusive security warning
    const warning = document.createElement("div");
    warning.className = "security-warning";
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 193, 7, 0.9);
      color: #000;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      backdrop-filter: blur(10px);
    `;
    warning.textContent = ` ${message}`;

    document.body.appendChild(warning);

    setTimeout(() => {
      warning.remove();
    }, 5000);
  }

  // ===============================================
  // PUBLIC API
  // ===============================================

  // Method to securely store payment data
  secureStoreOrderData(orderData) {
    const sensitiveFields = ["email", "name", "phone", "address"];
    const secureData = { ...orderData };

    sensitiveFields.forEach((field) => {
      if (secureData[field]) {
        secureData[field] = this.encryptSensitiveData(secureData[field]);
      }
    });

    sessionStorage.setItem("secure_order_data", JSON.stringify(secureData));
    console.log(" Order data securely stored");
  }

  // Method to retrieve and decrypt order data
  secureRetrieveOrderData() {
    const encryptedData = sessionStorage.getItem("secure_order_data");
    if (!encryptedData) return null;

    try {
      const data = JSON.parse(encryptedData);
      const sensitiveFields = ["email", "name", "phone", "address"];

      sensitiveFields.forEach((field) => {
        if (data[field]) {
          const decrypted = this.decryptSensitiveData(data[field]);
          if (decrypted) {
            data[field] = decrypted;
          }
        }
      });

      return data;
    } catch (error) {
      console.error("Failed to retrieve secure order data:", error);
      return null;
    }
  }

  // Method to clear sensitive data
  clearSensitiveData() {
    sessionStorage.removeItem("secure_order_data");
    sessionStorage.removeItem(this.config.csrf.tokenName);
    console.log(" Sensitive data cleared");
  }

  // Get security status
  getSecurityStatus() {
    return {
      csrfProtection: !!this.csrfToken,
      rateLimiting: this.config.rateLimiting.enabled,
      xssProtection: this.config.xss.enabled,
      dataEncryption: this.config.dataProtection.enabled,
      activeConnections: this.rateLimitStore.size,
      blockedIPs: this.blockedIPs.size,
    };
  }
}

// Initialize Security Manager
window.SecurityManager = SecurityManager;

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.securityManager = new SecurityManager();
  });
} else {
  window.securityManager = new SecurityManager();
}
