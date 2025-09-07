// Vercel serverless function for environment configuration
export default function handler(req, res) {
  // Set CORS headers for specific domains only
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://trietdev.com', 
    'https://www.trietdev.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

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
    // Don't expose internal error details to client
    res.status(500).json({
      error: "Unable to load configuration. Please try again later."
    });
  }
}
