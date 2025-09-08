const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const auditLogger = require("../../utils/audit-logger");
const IPWhitelist = require("../../middleware/ip-whitelist");

// Initialize IP whitelist
const ipWhitelist = IPWhitelist.create();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";

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

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Apply IP whitelist check
  const clientIP = ipWhitelist.getClientIP(req);
  if (!ipWhitelist.isIPAllowed(clientIP)) {
    await auditLogger.logAction(
      { ip: clientIP, user: "unknown" },
      "blocked_access",
      { reason: "IP not whitelisted", endpoint: "/api/admin/login" }
    );
    return res.status(403).json({ error: "Access denied" });
  }

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
