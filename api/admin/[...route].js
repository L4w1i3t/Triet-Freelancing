// Serverless catch-all handler for admin endpoints on Vercel
// Mirrors the functionality of the Express router for /api/admin/*

const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const auditLogger = require("../../utils/audit-logger");
const bcrypt = require("bcrypt");
const IPWhitelist = require("../../middleware/ip-whitelist");

const ipWhitelist = IPWhitelist.create();

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
const DATA_DIR = path.join(__dirname, "../../data");
const BACKUP_DIR = path.join(__dirname, "../../data/backup");

async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

async function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

async function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function parsePath(req) {
  // Extract segments after /api/admin
  const url = new URL(req.url, "http://localhost");
  const base = "/api/admin";
  let p = url.pathname;
  if (p.startsWith(base)) p = p.slice(base.length);
  if (p.startsWith("/")) p = p.slice(1);
  const segments = p.length ? p.split("/") : [];
  return { segments, query: Object.fromEntries(url.searchParams) };
}

function getAuthUser(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

function text(res, status, body, contentType = "text/plain") {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.end(body);
}

async function listBackups() {
  try {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const stats = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (filename) => {
          const full = path.join(BACKUP_DIR, filename);
          const st = await fs.stat(full);
          const data = JSON.parse(await fs.readFile(full, "utf8"));
          return {
            filename,
            size: st.size,
            created: st.birthtimeMs || st.mtimeMs,
            portfolioCount: data?.portfolio?.projects?.length || 0,
            servicesCount:
              data?.services?.serviceTiers?.reduce(
                (acc, t) => acc + (t.services ? t.services.length : 0),
                0,
              ) || 0,
          };
        }),
    );
    // Sort newest first
    stats.sort((a, b) => b.created - a.created);
    return stats;
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  // IP whitelist enforcement
  const clientIP = ipWhitelist.getClientIP(req);
  if (!ipWhitelist.isIPAllowed(clientIP)) {
    await auditLogger.logLogin(req, false, `Blocked IP: ${clientIP}`);
    return json(res, 403, {
      error: "Access denied. Your IP address is not authorized to access this resource.",
      code: "IP_NOT_WHITELISTED",
      timestamp: new Date().toISOString(),
    });
  }

  const { segments, query } = parsePath(req);
  const method = req.method || "GET";

  try {
    // LOGIN (no auth)
    if (segments[0] === "login" && method === "POST") {
      const { password } = req.body || {};
      if (!password) {
        await auditLogger.logLogin(req, false, "No password provided");
        return json(res, 400, { error: "Password required" });
      }
      // Prefer hashed password if provided, else fallback to plain env password
      let isValidPassword = false;
      try {
        if (process.env.ADMIN_PASSWORD_HASH) {
          isValidPassword = await bcrypt.compare(
            password,
            process.env.ADMIN_PASSWORD_HASH,
          );
        } else if (process.env.ADMIN_PASSWORD) {
          isValidPassword = password === process.env.ADMIN_PASSWORD;
        }
      } catch (e) {
        isValidPassword = false;
      }
      if (!isValidPassword) {
        await auditLogger.logLogin(req, false, "Invalid password");
        return json(res, 401, { error: "Invalid password" });
      }
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const token = jwt.sign(
        { userId: "admin", role: "admin", sessionId },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
      await auditLogger.logLogin(req, true);
      return json(res, 200, { token, user: { id: "admin", role: "admin" } });
    }

    // All other routes require JWT auth
    const user = getAuthUser(req);
    if (!user) {
      return json(res, 401, { error: "Access token required or invalid" });
    }

    // VERIFY
    if (segments[0] === "verify" && method === "GET") {
      return json(res, 200, { user });
    }

    // PORTFOLIO
    if (segments[0] === "portfolio") {
      if (method === "GET") {
        const portfolioData = await readJsonFile("portfolio.json");
        return json(res, 200, portfolioData);
      }
      if (method === "POST") {
        const newProject = req.body || {};
        if (!newProject.title || !newProject.category || !newProject.year) {
          return json(res, 400, { error: "Missing required fields" });
        }
        const portfolioData = await readJsonFile("portfolio.json");
        const idx = portfolioData.projects.findIndex((p) => p.id === newProject.id);
        const isUpdate = idx >= 0;
        if (isUpdate) portfolioData.projects[idx] = newProject;
        else portfolioData.projects.push(newProject);
        await writeJsonFile("portfolio.json", portfolioData);
        await auditLogger.logAction(req, isUpdate ? "update_portfolio" : "create_portfolio", {
          projectId: newProject.id,
          title: newProject.title,
          category: newProject.category,
        });
        return json(res, 200, { success: true, project: newProject });
      }
      if (method === "DELETE" && segments[1]) {
        const id = segments[1];
        const portfolioData = await readJsonFile("portfolio.json");
        const deletedProject = portfolioData.projects.find((p) => p.id === id);
        portfolioData.projects = portfolioData.projects.filter((p) => p.id !== id);
        await writeJsonFile("portfolio.json", portfolioData);
        await auditLogger.logAction(req, "delete_portfolio", {
          projectId: id,
          title: deletedProject?.title || "Unknown",
        });
        return json(res, 200, { success: true });
      }
    }

    // SERVICES
    if (segments[0] === "services") {
      if (method === "GET") {
        const servicesData = await readJsonFile("services.json");
        return json(res, 200, servicesData);
      }
      if (method === "POST") {
        const newService = req.body || {};
        if (!newService.title || !newService.price || !newService.tierId) {
          return json(res, 400, { error: "Missing required fields" });
        }
        const servicesData = await readJsonFile("services.json");
        const tier = servicesData.serviceTiers.find((t) => t.id === newService.tierId);
        if (!tier) return json(res, 400, { error: "Invalid service tier" });
        if (!tier.services) tier.services = [];
        const idx = tier.services.findIndex((s) => s.id === newService.id);
        const serviceData = {
          id: newService.id,
          title: newService.title,
          price: newService.price,
          duration: newService.duration,
          description: newService.description,
        };
        if (idx >= 0) tier.services[idx] = serviceData;
        else tier.services.push(serviceData);
        await writeJsonFile("services.json", servicesData);
        return json(res, 200, { success: true, service: serviceData });
      }
      if (method === "DELETE" && segments[1] && segments[2]) {
        const [_, tierId, serviceId] = segments;
        const servicesData = await readJsonFile("services.json");
        const tier = servicesData.serviceTiers.find((t) => t.id === tierId);
        if (!tier || !tier.services)
          return json(res, 404, { error: "Service not found" });
        tier.services = tier.services.filter((s) => s.id !== serviceId);
        await writeJsonFile("services.json", servicesData);
        return json(res, 200, { success: true });
      }
    }

    // EXPORT
    if (segments[0] === "export") {
      if (segments[1] === "audit-logs" && segments[2] === "json") {
        const logs = await auditLogger.getAuditLog();
        await auditLogger.logAction(req, "audit_export", {
          format: "json",
          ip: clientIP,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
        });
        res.setHeader("Content-Type", "application/json");
        const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.end(JSON.stringify(logs));
      }
      if (segments[1] === "audit-logs" && segments[2] === "csv") {
        const logs = await auditLogger.getAuditLog();
        await auditLogger.logAction(req, "audit_export", {
          format: "csv",
          ip: clientIP,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
        });
        let csv = "Timestamp,Action,User,IP,Details\n";
        logs.forEach((log) => {
          const details = JSON.stringify(log.details || {}).replace(/\"/g, '""');
          csv += `"${log.timestamp}","${log.action}","${log.user}","${log.ip}","${details}"\n`;
        });
        const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.end(csv);
      }
      if (segments[1] === "security-alerts" && segments[2] === "json") {
        const logs = await auditLogger.getAuditLog();
        const securityAlerts = logs.filter(
          (log) =>
            log.action === "login_failed" ||
            log.action === "blocked_access" ||
            log.action === "suspicious_activity",
        );
        await auditLogger.logAction(req, "security_export", {
          format: "json",
          alertsCount: securityAlerts.length,
          ip: clientIP,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
        });
        const filename = `security-alerts-${new Date().toISOString().split("T")[0]}.json`;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.end(JSON.stringify(securityAlerts));
      }
      // Default export (data snapshot)
      if (method === "GET") {
        const portfolioData = await readJsonFile("portfolio.json");
        const servicesData = await readJsonFile("services.json");
        return json(res, 200, {
          portfolio: portfolioData,
          services: servicesData,
          exportDate: new Date().toISOString(),
        });
      }
    }

    // BACKUP create/list/download/delete
    if (segments[0] === "backup" && method === "POST") {
      await ensureBackupDir();
      const portfolioData = await readJsonFile("portfolio.json");
      const servicesData = await readJsonFile("services.json");
      const backupData = {
        portfolio: portfolioData,
        services: servicesData,
        backupDate: new Date().toISOString(),
      };
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.json`;
      await fs.writeFile(
        path.join(BACKUP_DIR, filename),
        JSON.stringify(backupData, null, 2),
        "utf8",
      );
      return json(res, 200, { success: true, filename });
    }

    if (segments[0] === "backups") {
      if (method === "GET" && !segments[1]) {
        const backups = await listBackups();
        return json(res, 200, backups);
      }
      if (method === "GET" && segments[1]) {
        // download
        const filePath = path.join(BACKUP_DIR, segments[1]);
        try {
          const data = await fs.readFile(filePath);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${segments[1]}"`,
          );
          return res.end(data);
        } catch (e) {
          return json(res, 404, { error: "Backup not found" });
        }
      }
      if (method === "DELETE" && segments[1]) {
        try {
          await fs.unlink(path.join(BACKUP_DIR, segments[1]));
          return json(res, 200, { success: true });
        } catch (e) {
          return json(res, 404, { error: "Backup not found" });
        }
      }
    }

    // AUDIT LOG
    if (segments[0] === "audit-log" && method === "GET") {
      const limit = parseInt(query.limit || "100", 10);
      const data = await auditLogger.getAuditLog(limit);
      return json(res, 200, data);
    }

    // LOGOUT
    if (segments[0] === "logout" && method === "POST") {
      await auditLogger.logLogout(req);
      return json(res, 200, { success: true, message: "Logged out successfully" });
    }

    // IP STATUS
    if (segments[0] === "ip-status" && method === "GET") {
      const status = ipWhitelist.getStatus();
      return json(res, 200, {
        ...status,
        currentIP: clientIP,
        isCurrentIPAllowed: ipWhitelist.isIPAllowed(clientIP),
      });
    }

    return json(res, 404, { error: "Not found" });
  } catch (error) {
    console.error("Admin serverless error:", error);
    return json(res, 500, { error: "Internal server error" });
  }
}
