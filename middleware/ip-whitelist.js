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
    // Prefer provider-specific headers first
    const headers = req.headers || {};
    const candidates = [];

    // 1) CDN/Proxy specific
    if (headers["cf-connecting-ip"]) candidates.push(headers["cf-connecting-ip"]);
    if (headers["true-client-ip"]) candidates.push(headers["true-client-ip"]);
    if (headers["x-client-ip"]) candidates.push(headers["x-client-ip"]);
    if (headers["fastly-client-ip"]) candidates.push(headers["fastly-client-ip"]);
    if (headers["fly-client-ip"]) candidates.push(headers["fly-client-ip"]);
    if (headers["x-real-ip"]) candidates.push(headers["x-real-ip"]);

    // 2) Vercel / general forwarded-for chains
    if (headers["x-vercel-forwarded-for"]) candidates.push(headers["x-vercel-forwarded-for"]);
    if (headers["x-forwarded-for"]) candidates.push(headers["x-forwarded-for"]);

    // 3) Connection-derived
    if (req.connection?.remoteAddress) candidates.push(req.connection.remoteAddress);
    if (req.socket?.remoteAddress) candidates.push(req.socket.remoteAddress);
    if (req.ip) candidates.push(req.ip);

    // From the gathered candidates, pick the first valid public IP
    for (const value of candidates) {
      if (!value) continue;
      // Some headers may contain a comma-separated chain
      const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
      for (let raw of parts) {
        const ip = this.normalizeIP(raw);
        if (ip && !this.isPrivateIP(ip)) return ip;
      }
    }

    // Fallback to first non-empty candidate (may be private)
    for (const value of candidates) {
      if (!value) continue;
      const first = value.split(",")[0].trim();
      if (first) return this.normalizeIP(first);
    }

    return "unknown";
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

  // Identify private/reserved ranges to avoid picking proxy hops
  isPrivateIP(ip) {
    // IPv4 checks
    if (!ip.includes(":")) {
      if (ip.startsWith("10.")) return true; // 10.0.0.0/8
      const firstTwo = ip.split(".").slice(0, 2).join(".");
      // 172.16.0.0 - 172.31.255.255
      const first = parseInt(ip.split(".")[0], 10);
      const second = parseInt(ip.split(".")[1] || "0", 10);
      if (first === 172 && second >= 16 && second <= 31) return true;
      if (ip.startsWith("192.168.")) return true; // 192.168.0.0/16
      if (first === 127) return true; // loopback
      if (ip.startsWith("169.254.")) return true; // link-local
      return false;
    }

    // IPv6 checks (basic)
    const v6 = ip.toLowerCase();
    if (v6 === "::1") return true; // loopback
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // unique local
    if (v6.startsWith("fe80")) return true; // link-local
    return false;
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
          detectedIP: clientIP,
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
