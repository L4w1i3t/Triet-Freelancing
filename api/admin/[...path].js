// Vercel catch-all API route for admin endpoints
// This mounts the existing Express admin router so paths like
// /api/admin/login, /api/admin/verify, etc. work in production.

const express = require("express");
const adminRouter = require("../admin.js");

// Create an isolated app per invocation
const app = express();

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Mount the admin router under the same base path
app.use("/api/admin", adminRouter);

// Basic 404 handler to mirror Express defaults
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default function handler(req, res) {
  // Delegate handling to the Express app
  return app(req, res);
}

