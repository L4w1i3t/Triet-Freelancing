// Vercel serverless function for environment configuration
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Return client-safe environment variables as JSON
    const config = {
      EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || "",
      EMAILJS_TEMPLATE_ID_ADMIN: process.env.EMAILJS_TEMPLATE_ID_ADMIN || "",
      EMAILJS_TEMPLATE_ID_CUSTOMER:
        process.env.EMAILJS_TEMPLATE_ID_CUSTOMER || "",
      EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || "",
      PP_CLIENT_ID: process.env.PP_CLIENT_ID || "",
      PP_API_BASE: process.env.PP_API_BASE || "https://api.paypal.com",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
    };

    res.status(200).json(config);
  } catch (error) {
    console.error("Config API error:", error);
    res.status(500).json({
      error: "Failed to load configuration",
      details: error.message,
    });
  }
}
