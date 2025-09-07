// CSRF Protection Middleware
const crypto = require("crypto");

class CSRFProtection {
  constructor() {
    this.tokens = new Map(); // In production, use Redis or database
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  generateToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const timestamp = Date.now();

    this.tokens.set(token, timestamp);
    return token;
  }

  validateToken(token) {
    if (!token || !this.tokens.has(token)) {
      return false;
    }

    const timestamp = this.tokens.get(token);
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (Date.now() - timestamp > maxAge) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  consumeToken(token) {
    if (this.validateToken(token)) {
      this.tokens.delete(token);
      return true;
    }
    return false;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [token, timestamp] of this.tokens.entries()) {
      if (now - timestamp > maxAge) {
        this.tokens.delete(token);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Skip CSRF for GET requests and OPTIONS
      if (req.method === "GET" || req.method === "OPTIONS") {
        return next();
      }

      const token = req.headers["x-csrf-token"] || req.body._csrf;

      if (!this.consumeToken(token)) {
        return res.status(403).json({
          error: "Invalid or missing CSRF token",
        });
      }

      next();
    };
  }

  // Endpoint to get a new CSRF token
  getTokenEndpoint() {
    return (req, res) => {
      const token = this.generateToken();
      res.json({ csrfToken: token });
    };
  }
}

const csrfProtection = new CSRFProtection();

module.exports = csrfProtection;
