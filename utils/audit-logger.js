const fs = require("fs").promises;
const path = require("path");

class AuditLogger {
  constructor() {
    this.logFile = path.join(__dirname, "../data/audit-log.json");
    this.maxEntries = 1000;
    this.retentionDays = 90;
  }

  async logLogin(req, success = true, reason = null) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        event: "admin_login",
        success: success,
        ip: this.getClientIP(req),
        userAgent: req?.headers?.["user-agent"] || "Unknown",
        country: this.getCountryFromIP(req),
        reason: reason, // For failed attempts
        sessionId: this.generateSessionId(),
        fingerprint: this.generateFingerprint(req),
      };

      await this.writeLogEntry(entry);

      // Check for suspicious activity
      if (success) {
        await this.checkSuspiciousActivity(entry);
      }

      return entry;
    } catch (error) {
      console.error("Audit log error:", error);
      return null;
    }
  }

  async logAction(req, action, details = {}) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        event: "admin_action",
        action: action, // 'create_portfolio', 'delete_service', etc.
        success: true,
        ip: this.getClientIP(req),
        userAgent: req?.headers?.["user-agent"] || "Unknown",
        details: details,
        sessionId: this.getSessionId(req),
      };

      await this.writeLogEntry(entry);
      return entry;
    } catch (error) {
      console.error("Audit log error:", error);
      return null;
    }
  }

  async logLogout(req) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        event: "admin_logout",
        success: true,
        ip: this.getClientIP(req),
        sessionId: this.getSessionId(req),
      };

      await this.writeLogEntry(entry);
      return entry;
    } catch (error) {
      console.error("Audit log error:", error);
      return null;
    }
  }

  async writeLogEntry(entry) {
    try {
      // Read current log
      let logData;
      try {
        const data = await fs.readFile(this.logFile, "utf8");
        logData = JSON.parse(data);
      } catch (error) {
        // If file doesn't exist or is corrupt, create new structure
        logData = {
          auditLog: {
            created: new Date().toISOString(),
            version: "1.0",
            description: "Admin login audit log for Triet Dev",
            entries: [],
          },
          settings: {
            maxEntries: this.maxEntries,
            alertOnSuspiciousActivity: true,
            retentionDays: this.retentionDays,
          },
        };
      }

      // Add new entry
      logData.auditLog.entries.unshift(entry); // Add to beginning

      // Clean old entries
      await this.cleanOldEntries(logData);

      // Write back to file
      await fs.writeFile(
        this.logFile,
        JSON.stringify(logData, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
      throw error;
    }
  }

  async cleanOldEntries(logData) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    // Remove entries older than retention period
    logData.auditLog.entries = logData.auditLog.entries.filter((entry) => {
      return new Date(entry.timestamp) > cutoffDate;
    });

    // Limit total entries
    if (logData.auditLog.entries.length > this.maxEntries) {
      logData.auditLog.entries = logData.auditLog.entries.slice(
        0,
        this.maxEntries,
      );
    }
  }

  async getAuditLog(limit = 100) {
    try {
      const data = await fs.readFile(this.logFile, "utf8");
      const logData = JSON.parse(data);

      return {
        entries: logData.auditLog.entries.slice(0, limit),
        total: logData.auditLog.entries.length,
        lastLogin: this.getLastSuccessfulLogin(logData.auditLog.entries),
        failedAttempts: this.getRecentFailedAttempts(logData.auditLog.entries),
        stats: this.generateStats(logData.auditLog.entries),
      };
    } catch (error) {
      console.error("Failed to read audit log:", error);
      return {
        entries: [],
        total: 0,
        lastLogin: null,
        failedAttempts: [],
        stats: {},
      };
    }
  }

  async checkSuspiciousActivity(entry) {
    try {
      const data = await fs.readFile(this.logFile, "utf8");
      const logData = JSON.parse(data);
      const recentEntries = logData.auditLog.entries.slice(0, 20); // Last 20 entries

      const alerts = [];

      // Check for multiple failed attempts
      const recentFailed = recentEntries.filter(
        (e) =>
          e.event === "admin_login" &&
          !e.success &&
          this.isRecent(e.timestamp, 60), // Last hour
      );

      if (recentFailed.length >= 3) {
        alerts.push({
          type: "multiple_failed_attempts",
          count: recentFailed.length,
          message: `${recentFailed.length} failed login attempts in the last hour`,
        });
      }

      // Check for new IP address
      const recentSuccessful = recentEntries.filter(
        (e) => e.event === "admin_login" && e.success && e.ip !== entry.ip,
      );

      if (
        recentSuccessful.length > 0 &&
        !recentSuccessful.some((e) => e.ip === entry.ip)
      ) {
        alerts.push({
          type: "new_ip_address",
          ip: entry.ip,
          message: `Login from new IP address: ${entry.ip}`,
        });
      }

      // Check for unusual times (outside 6 AM - 11 PM)
      const hour = new Date(entry.timestamp).getHours();
      if (hour < 6 || hour > 23) {
        alerts.push({
          type: "unusual_time",
          hour: hour,
          message: `Login at unusual time: ${hour}:00`,
        });
      }

      if (alerts.length > 0) {
        await this.sendSecurityAlert(entry, alerts);
      }
    } catch (error) {
      console.error("Error checking suspicious activity:", error);
    }
  }

  async sendSecurityAlert(entry, alerts) {
    // Log the security alert
    const alertEntry = {
      timestamp: new Date().toISOString(),
      event: "security_alert",
      alerts: alerts,
      triggerEntry: entry,
      severity: this.calculateSeverity(alerts),
    };

    await this.writeLogEntry(alertEntry);

    // In a real implementation, you'd send email/SMS here
    console.warn("🚨 SECURITY ALERT:", alerts);
  }

  calculateSeverity(alerts) {
    if (alerts.some((a) => a.type === "multiple_failed_attempts"))
      return "high";
    if (alerts.some((a) => a.type === "new_ip_address")) return "medium";
    return "low";
  }

  getClientIP(req) {
    const r = req && typeof req === "object" ? req : { headers: {} };
    const headers = r.headers || {};
    return (
      headers["x-forwarded-for"] ||
      headers["x-real-ip"] ||
      r.connection?.remoteAddress ||
      r.socket?.remoteAddress ||
      r.ip ||
      "unknown"
    );
  }

  getCountryFromIP(req) {
    // In a real implementation, you'd use a GeoIP service
    // For now, just check if it's localhost
    const ip = this.getClientIP(req);
    if (
      ip.includes("127.0.0.1") ||
      ip.includes("localhost") ||
      ip.includes("::1")
    ) {
      return "Local";
    }
    return "Unknown";
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  generateFingerprint(req) {
    // Simple fingerprint based on User-Agent and accept headers
    const ua = req?.headers?.["user-agent"] || "";
    const accept = req?.headers?.["accept"] || "";
    return Buffer.from(ua + accept)
      .toString("base64")
      .substring(0, 16);
  }

  getSessionId(req) {
    // Extract session ID from JWT if available
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString(),
        );
        return payload.sessionId || "unknown";
      } catch (error) {
        return "unknown";
      }
    }
    return "unknown";
  }

  getLastSuccessfulLogin(entries) {
    const lastLogin = entries.find(
      (e) => e.event === "admin_login" && e.success,
    );
    return lastLogin ? lastLogin.timestamp : null;
  }

  getRecentFailedAttempts(entries) {
    return entries.filter(
      (e) =>
        e.event === "admin_login" &&
        !e.success &&
        this.isRecent(e.timestamp, 1440), // Last 24 hours
    );
  }

  generateStats(entries) {
    const loginEntries = entries.filter((e) => e.event === "admin_login");
    const successfulLogins = loginEntries.filter((e) => e.success);
    const failedLogins = loginEntries.filter((e) => !e.success);

    return {
      totalLogins: loginEntries.length,
      successfulLogins: successfulLogins.length,
      failedLogins: failedLogins.length,
      successRate:
        loginEntries.length > 0
          ? ((successfulLogins.length / loginEntries.length) * 100).toFixed(1)
          : 0,
      uniqueIPs: [...new Set(loginEntries.map((e) => e.ip))].length,
      lastWeekLogins: loginEntries.filter((e) =>
        this.isRecent(e.timestamp, 10080),
      ).length, // 7 days
    };
  }

  isRecent(timestamp, minutes) {
    const then = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - then) / (1000 * 60);
    return diffMinutes <= minutes;
  }
}

module.exports = new AuditLogger();
