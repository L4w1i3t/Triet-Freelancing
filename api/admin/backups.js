const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const auditLogger = require("../../utils/audit-logger");
const IPWhitelist = require("../../middleware/ip-whitelist");

// Initialize IP whitelist
const ipWhitelist = IPWhitelist.create();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
const BACKUP_DIR = path.join(__dirname, "../../data/backup");

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch (error) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

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

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Apply IP whitelist check
  const clientIP = ipWhitelist.getClientIP(req);
  if (!ipWhitelist.isIPAllowed(clientIP)) {
    await auditLogger.logAction(
      { ip: clientIP, user: "unknown" },
      "blocked_access",
      { reason: "IP not whitelisted", endpoint: "/api/admin/backups" }
    );
    return res.status(403).json({ error: "Access denied" });
  }

  // Authentication check
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

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
}
