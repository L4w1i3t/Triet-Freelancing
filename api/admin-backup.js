const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const auditLogger = require("../utils/audit-logger");
const IPWhitelist = require("../middleware/ip-whitelist");

// Initialize IP whitelist
const ipWhitelist = IPWhitelist.create();

// Configuration
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || "$2b$10$examples.hash.here"; // You'll need to generate this
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
const DATA_DIR = path.join(__dirname, "../data");
const BACKUP_DIR = path.join(__dirname, "../data/backup");

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch (error) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Authentication middleware (modified for serverless)
async function authenticateToken(req, res) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return user;
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
    return null;
  }
}

// Helper function to read JSON files
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
}

// Helper function to write JSON files
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Main serverless function handler
export default async function handler(req, res) {
  // Set CORS headers for specific domains only
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080", 
    "https://trietdev.com",
    "https://www.trietdev.com",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Apply IP whitelist check
  const clientIP = ipWhitelist.getClientIP(req);
  if (!ipWhitelist.isIPAllowed(clientIP)) {
    await auditLogger.logAction(
      { ip: clientIP, user: "unknown" },
      "blocked_access",
      { reason: "IP not whitelisted", endpoint: req.url }
    );
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // Route based on the endpoint path
    const endpoint = req.url.split('?')[0]; // Remove query parameters
    
    // Remove /api/admin prefix if present (for development compatibility)
    const cleanEndpoint = endpoint.replace(/^\/api\/admin/, '') || '/';
    
    switch (cleanEndpoint) {
      case '/login':
        if (req.method === 'POST') {
          return await handleLogin(req, res);
        }
        break;
      case '/verify':
        if (req.method === 'GET') {
          return await handleVerify(req, res);
        }
        break;
      case '/portfolio':
        if (req.method === 'GET') {
          return await handleGetPortfolio(req, res);
        } else if (req.method === 'POST') {
          return await handleSavePortfolio(req, res);
        }
        break;
      case '/services':
        if (req.method === 'GET') {
          return await handleGetServices(req, res);
        } else if (req.method === 'POST') {
          return await handleSaveService(req, res);
        }
        break;
      case '/export':
        if (req.method === 'GET') {
          return await handleExport(req, res);
        }
        break;
      case '/backup':
        if (req.method === 'POST') {
          return await handleCreateBackup(req, res);
        }
        break;
      case '/backups':
        if (req.method === 'GET') {
          return await handleListBackups(req, res);
        }
        break;
      case '/audit-log':
        if (req.method === 'GET') {
          return await handleGetAuditLog(req, res);
        }
        break;
      case '/export/audit-logs/json':
        if (req.method === 'GET') {
          return await handleExportAuditLogsJSON(req, res);
        }
        break;
      case '/export/audit-logs/csv':
        if (req.method === 'GET') {
          return await handleExportAuditLogsCSV(req, res);
        }
        break;
      case '/export/security-alerts/json':
        if (req.method === 'GET') {
          return await handleExportSecurityAlerts(req, res);
        }
        break;
      case '/logout':
        if (req.method === 'POST') {
          return await handleLogout(req, res);
        }
        break;
      case '/ip-status':
        if (req.method === 'GET') {
          return await handleIPStatus(req, res);
        }
        break;
      default:
        // Handle dynamic routes
        if (cleanEndpoint.startsWith('/portfolio/') && req.method === 'DELETE') {
          const id = cleanEndpoint.split('/')[2];
          return await handleDeletePortfolio(req, res, id);
        }
        if (cleanEndpoint.startsWith('/services/') && req.method === 'DELETE') {
          const parts = cleanEndpoint.split('/');
          const tierId = parts[2];
          const serviceId = parts[3];
          return await handleDeleteService(req, res, tierId, serviceId);
        }
        if (cleanEndpoint.startsWith('/backups/')) {
          const filename = cleanEndpoint.split('/')[2];
          if (req.method === 'GET') {
            return await handleDownloadBackup(req, res, filename);
          } else if (req.method === 'DELETE') {
            return await handleDeleteBackup(req, res, filename);
          }
        }
        
        return res.status(404).json({ error: "Endpoint not found" });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
// Handler functions
async function handleLogin(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      await auditLogger.logLogin(req, false, "No password provided");
      return res.status(400).json({ error: "Password required" });
    }

    // For development, you can use a simple password check
    // In production, use bcrypt.compare with a hashed password
    const isValidPassword =
      password === process.env.ADMIN_PASSWORD || password === "admin123"; // Change this!

    if (!isValidPassword) {
      await auditLogger.logLogin(req, false, "Invalid password");
      return res.status(401).json({ error: "Invalid password" });
    }

    const sessionId =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    const token = jwt.sign(
      { userId: "admin", role: "admin", sessionId: sessionId },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Log successful login
    await auditLogger.logLogin(req, true);

    res.json({
      token,
      user: { id: "admin", role: "admin" },
    });
  } catch (error) {
    console.error("Login error:", error);
    await auditLogger.logLogin(req, false, "Server error during login");
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleVerify(req, res) {
  const user = await authenticateToken(req, res);
  if (user) {
    res.json({ user });
  }
}

async function handleGetPortfolio(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;
  
  try {
    const portfolioData = await readJsonFile("portfolio.json");
    res.json(portfolioData);
  } catch (error) {
    res.status(500).json({ error: "Failed to load portfolio data" });
  }
}

// Save/update portfolio item
router.post("/portfolio", authenticateToken, async (req, res) => {
  try {
    const newProject = req.body;
    const portfolioData = await readJsonFile("portfolio.json");

    // Validate required fields
    if (!newProject.title || !newProject.category || !newProject.year) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if project exists
    const existingIndex = portfolioData.projects.findIndex(
      (p) => p.id === newProject.id,
    );
    const isUpdate = existingIndex >= 0;

    if (isUpdate) {
      // Update existing project
      portfolioData.projects[existingIndex] = newProject;
    } else {
      // Add new project
      portfolioData.projects.push(newProject);
    }

    await writeJsonFile("portfolio.json", portfolioData);

    // Log the action
    await auditLogger.logAction(
      req,
      isUpdate ? "update_portfolio" : "create_portfolio",
      {
        projectId: newProject.id,
        title: newProject.title,
        category: newProject.category,
      },
    );

    res.json({ success: true, project: newProject });
  } catch (error) {
    console.error("Error saving portfolio item:", error);
    res.status(500).json({ error: "Failed to save portfolio item" });
  }
});

// Delete portfolio item
router.delete("/portfolio/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const portfolioData = await readJsonFile("portfolio.json");

    // Find the project being deleted for logging
    const deletedProject = portfolioData.projects.find((p) => p.id === id);

    portfolioData.projects = portfolioData.projects.filter((p) => p.id !== id);

    await writeJsonFile("portfolio.json", portfolioData);

    // Log the deletion
    await auditLogger.logAction(req, "delete_portfolio", {
      projectId: id,
      title: deletedProject?.title || "Unknown",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio item:", error);
    res.status(500).json({ error: "Failed to delete portfolio item" });
  }
});

// Get services data
router.get("/services", authenticateToken, async (req, res) => {
  try {
    const servicesData = await readJsonFile("services.json");
    res.json(servicesData);
  } catch (error) {
    res.status(500).json({ error: "Failed to load services data" });
  }
});

// Save/update service item
router.post("/services", authenticateToken, async (req, res) => {
  try {
    const newService = req.body;
    const servicesData = await readJsonFile("services.json");

    // Validate required fields
    if (!newService.title || !newService.price || !newService.tierId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the tier
    const tier = servicesData.serviceTiers.find(
      (t) => t.id === newService.tierId,
    );
    if (!tier) {
      return res.status(400).json({ error: "Invalid service tier" });
    }

    if (!tier.services) {
      tier.services = [];
    }

    // Check if service exists
    const existingIndex = tier.services.findIndex(
      (s) => s.id === newService.id,
    );

    const serviceData = {
      id: newService.id,
      title: newService.title,
      price: newService.price,
      duration: newService.duration,
      description: newService.description,
    };

    if (existingIndex >= 0) {
      // Update existing service
      tier.services[existingIndex] = serviceData;
    } else {
      // Add new service
      tier.services.push(serviceData);
    }

    await writeJsonFile("services.json", servicesData);
    res.json({ success: true, service: serviceData });
  } catch (error) {
    console.error("Error saving service item:", error);
    res.status(500).json({ error: "Failed to save service item" });
  }
});

// Delete service item
router.delete(
  "/services/:tierId/:serviceId",
  authenticateToken,
  async (req, res) => {
    try {
      const { tierId, serviceId } = req.params;
      const servicesData = await readJsonFile("services.json");

      const tier = servicesData.serviceTiers.find((t) => t.id === tierId);
      if (!tier || !tier.services) {
        return res.status(404).json({ error: "Service not found" });
      }

      tier.services = tier.services.filter((s) => s.id !== serviceId);

      await writeJsonFile("services.json", servicesData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service item:", error);
      res.status(500).json({ error: "Failed to delete service item" });
    }
  },
);

// Export all data
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const portfolioData = await readJsonFile("portfolio.json");
    const servicesData = await readJsonFile("services.json");

    const exportData = {
      portfolio: portfolioData,
      services: servicesData,
      exportDate: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="trietdev-data-${new Date().toISOString().split("T")[0]}.json"`,
    );
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Create backup
router.post("/backup", authenticateToken, async (req, res) => {
  try {
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
    const backupPath = path.join(BACKUP_DIR, filename);

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), "utf8");

    // Log backup creation
    await auditLogger.logAction(req, "create_backup", {
      filename: filename,
      size: JSON.stringify(backupData).length,
    });

    res.json({ success: true, filename });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({ error: "Failed to create backup" });
  }
});

// List available backup files
router.get("/backups", authenticateToken, async (req, res) => {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(
      (file) => file.startsWith("backup-") && file.endsWith(".json"),
    );

    const backupsWithInfo = await Promise.all(
      backupFiles.map(async (filename) => {
        try {
          const filePath = path.join(BACKUP_DIR, filename);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf8");
          const data = JSON.parse(content);

          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            backupDate: data.backupDate || stats.birthtime,
            portfolioCount: data.portfolio?.projects?.length || 0,
            servicesCount: (data.services?.serviceTiers || []).reduce(
              (acc, tier) => acc + (tier.services?.length || 0),
              0,
            ),
          };
        } catch (error) {
          console.error(`Error reading backup file ${filename}:`, error);
          return null;
        }
      }),
    );

    // Filter out null entries and sort by date (newest first)
    const validBackups = backupsWithInfo
      .filter((backup) => backup !== null)
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    await auditLogger.logAction(req, "list_backups", {
      count: validBackups.length,
    });

    res.json(validBackups);
  } catch (error) {
    console.error("Error listing backups:", error);
    res.status(500).json({ error: "Failed to list backups" });
  }
});

// Download specific backup file
router.get("/backups/:filename", authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;

    // Validate filename to prevent directory traversal
    if (!filename.match(/^backup-[\w\-]+\.json$/)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    await auditLogger.logAction(req, "download_backup", {
      filename: filename,
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(backupPath);
  } catch (error) {
    console.error("Error downloading backup:", error);
    res.status(500).json({ error: "Failed to download backup" });
  }
});

// Delete specific backup file
router.delete("/backups/:filename", authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;

    // Validate filename to prevent directory traversal
    if (!filename.match(/^backup-[\w\-]+\.json$/)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    await fs.unlink(backupPath);

    await auditLogger.logAction(req, "delete_backup", {
      filename: filename,
    });

    res.json({ success: true, message: "Backup deleted successfully" });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).json({ error: "Failed to delete backup" });
  }
});

// Get audit log
router.get("/audit-log", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const auditData = await auditLogger.getAuditLog(limit);
    res.json(auditData);
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// Export audit logs as JSON
router.get("/export/audit-logs/json", authenticateToken, async (req, res) => {
  try {
    const logs = await auditLogger.getAuditLog();
    await auditLogger.logAction(req.user.username, "audit_export", {
      format: "json",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(logs);
  } catch (error) {
    console.error("Failed to export audit log:", error);
    res.status(500).json({ error: "Failed to export audit log" });
  }
});

// Export audit logs as CSV
router.get("/export/audit-logs/csv", authenticateToken, async (req, res) => {
  try {
    const logs = await auditLogger.getAuditLog();
    await auditLogger.logAction(req.user.username, "audit_export", {
      format: "csv",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    // Convert JSON to CSV
    let csv = "Timestamp,Action,User,IP,Details\n";
    logs.forEach((log) => {
      const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
      csv += `"${log.timestamp}","${log.action}","${log.user}","${log.ip}","${details}"\n`;
    });

    const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Failed to export audit log as CSV:", error);
    res.status(500).json({ error: "Failed to export audit log as CSV" });
  }
});

// Export security alerts summary
router.get(
  "/export/security-alerts/json",
  authenticateToken,
  async (req, res) => {
    try {
      const logs = await auditLogger.getAuditLog();
      const securityAlerts = logs.filter(
        (log) =>
          log.action === "login_failed" ||
          log.action === "blocked_access" ||
          log.action === "suspicious_activity",
      );

      await auditLogger.logAction(req.user.username, "security_export", {
        format: "json",
        alertsCount: securityAlerts.length,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });

      const filename = `security-alerts-${new Date().toISOString().split("T")[0]}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.json(securityAlerts);
    } catch (error) {
      console.error("Failed to export security alerts:", error);
      res.status(500).json({ error: "Failed to export security alerts" });
    }
  },
);

// Logout endpoint (for audit logging)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    await auditLogger.logLogout(req);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Logout error" });
  }
});

// IP Whitelist status endpoint
router.get("/ip-status", authenticateToken, async (req, res) => {
  try {
    const clientIP = ipWhitelist.getClientIP(req);
    const status = ipWhitelist.getStatus();

    res.json({
      ...status,
      currentIP: clientIP,
      isCurrentIPAllowed: ipWhitelist.isIPAllowed(clientIP),
    });
  } catch (error) {
    console.error("Error getting IP status:", error);
    res.status(500).json({ error: "Failed to get IP status" });
  }
});

module.exports = router;
