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

// Authentication middleware
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

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Apply IP whitelist check
  const clientIP = ipWhitelist.getClientIP(req);
  if (!ipWhitelist.isIPAllowed(clientIP)) {
    await auditLogger.logAction(
      { ip: clientIP, user: "unknown" },
      "blocked_access",
      { reason: "IP not whitelisted", endpoint: "/api/admin/services" }
    );
    return res.status(403).json({ error: "Access denied" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      // Get services data
      const servicesData = await readJsonFile("services.json");
      res.json(servicesData);
    } else if (req.method === "POST") {
      // Save/update service item
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
    }
  } catch (error) {
    console.error("Error handling services request:", error);
    res.status(500).json({ error: "Failed to handle services request" });
  }
}
