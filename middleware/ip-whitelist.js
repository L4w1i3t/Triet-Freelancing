const auditLogger = require("../utils/audit-logger");

class IPWhitelist {
  constructor() {
    this.allowedIPs = this.parseAllowedIPs();
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }

  parseAllowedIPs() {
    const ipString = process.env.ADMIN_ALLOWED_IPS || "127.0.0.1,::1";
    return ipString
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
  }

  getClientIP(req) {
    // Check multiple headers for the real IP
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      // Take the first IP from x-forwarded-for (client IP)
      return forwardedFor.split(",")[0].trim();
    }

    return (
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown"
    );
  }

  normalizeIP(ip) {
    // Handle IPv4-mapped IPv6 addresses
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7);
    }

    // Handle localhost variations
    if (ip === "::1") return "::1"; // IPv6 localhost
    if (ip === "127.0.0.1") return "127.0.0.1"; // IPv4 localhost

    return ip;
  }

  isIPAllowed(ip) {
    const normalizedIP = this.normalizeIP(ip);

    // Temporary bypass for production testing (REMOVE IN PRODUCTION!)
    if (process.env.DISABLE_IP_WHITELIST === "true") {
      console.log(`[IP Whitelist] BYPASS ENABLED - Allowing IP: ${normalizedIP}`);
      return true;
    }

    // In development, always allow localhost
    if (this.isDevelopment) {
      if (
        normalizedIP === "127.0.0.1" ||
        normalizedIP === "::1" ||
        normalizedIP === "localhost"
      ) {
        return true;
      }
    }

    // Check against whitelist
    return this.allowedIPs.some((allowedIP) => {
      const normalizedAllowed = this.normalizeIP(allowedIP);

      // Exact match
      if (normalizedIP === normalizedAllowed) {
        return true;
      }

      // CIDR range support (basic)
      if (allowedIP.includes("/")) {
        return this.isIPInCIDR(normalizedIP, allowedIP);
      }

      return false;
    });
  }

  isIPInCIDR(ip, cidr) {
    // Basic CIDR support for IPv4
    if (!cidr.includes("/") || ip.includes(":")) {
      return false; // Skip complex IPv6 for now
    }

    const [network, prefixLength] = cidr.split("/");
    const mask = (-1 << (32 - parseInt(prefixLength))) >>> 0;

    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);

    return (ipNum & mask) === (networkNum & mask);
  }

  ipToNumber(ip) {
    return (
      ip.split(".").reduce((num, octet) => (num << 8) + parseInt(octet), 0) >>>
      0
    );
  }

  // Middleware function
  middleware() {
    return async (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const isAllowed = this.isIPAllowed(clientIP);

      // Log the access attempt
      console.log(
        `[IP Whitelist] ${clientIP} -> ${isAllowed ? "ALLOWED" : "BLOCKED"}`,
      );

      if (!isAllowed) {
        // Log blocked attempt
        await auditLogger.logLogin(req, false, `Blocked IP: ${clientIP}`);

        // Security alert for blocked admin access
        const alertEntry = {
          timestamp: new Date().toISOString(),
          event: "security_alert",
          alerts: [
            {
              type: "blocked_ip_access",
              ip: clientIP,
              message: `Blocked admin access attempt from unauthorized IP: ${clientIP}`,
              severity: "high",
            },
          ],
          triggerEntry: {
            ip: clientIP,
            userAgent: req.headers["user-agent"] || "Unknown",
            url: req.originalUrl,
          },
        };

        await auditLogger.writeLogEntry(alertEntry);

        return res.status(403).json({
          error:
            "Access denied. Your IP address is not authorized to access this resource.",
          code: "IP_NOT_WHITELISTED",
          timestamp: new Date().toISOString(),
        });
      }

      next();
    };
  }

  // Static method for easy import
  static create() {
    return new IPWhitelist();
  }

  // Convenience method for rate limiting bypass
  shouldBypassRateLimit(req) {
    const clientIP = this.getClientIP(req);
    return this.isIPAllowed(clientIP);
  }

  // Method to add IP to whitelist (for dynamic updates)
  addIP(ip) {
    if (!this.allowedIPs.includes(ip)) {
      this.allowedIPs.push(ip);
      console.log(`[IP Whitelist] Added IP: ${ip}`);
    }
  }

  // Method to remove IP from whitelist
  removeIP(ip) {
    this.allowedIPs = this.allowedIPs.filter((allowedIP) => allowedIP !== ip);
    console.log(`[IP Whitelist] Removed IP: ${ip}`);
  }

  // Get current whitelist status
  getStatus() {
    return {
      allowedIPs: this.allowedIPs,
      isDevelopment: this.isDevelopment,
      totalAllowed: this.allowedIPs.length,
    };
  }
}

module.exports = IPWhitelist;
