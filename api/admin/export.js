const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const auditLogger = require("../../utils/audit-logger");
const IPWhitelist = require("../../middleware/ip-whitelist");

// Initialize IP whitelist
const ipWhitelist = IPWhitelist.create();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
const DATA_DIR = path.join(__dirname, "../../data");

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
      { reason: "IP not whitelisted", endpoint: "/api/admin/export" }
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
}
