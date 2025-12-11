const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const csrfProtection = require("./middleware/csrf");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Import Stripe with secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Middleware
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://trietdev.com",
    "https://www.trietdev.com",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// Import IP whitelist middleware
const IPWhitelist = require("./middleware/ip-whitelist");
const ipWhitelist = IPWhitelist.create();

// Protect admin directory with IP whitelist
app.use("/admin", ipWhitelist.middleware());

// Serve static files
app.use(express.static("."));

// Rate limiting configuration
// Rate limiting configuration with IP whitelist bypass
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs
      const clientIP = ipWhitelist.getClientIP(req);
      const isWhitelisted = ipWhitelist.isIPAllowed(clientIP);

      if (isWhitelisted) {
        console.log(`[Rate Limit] Bypassed for whitelisted IP: ${clientIP}`);
      }

      return isWhitelisted;
    },
  });
};

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // max requests
  "Too many requests from this IP, please try again later.",
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  30, // max requests
  "Too many API requests from this IP, please try again later.",
);

const paymentLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // max requests
  "Too many payment requests from this IP, please try again later.",
);

// Apply rate limiting
app.use(generalLimiter);
app.use("/api/", apiLimiter);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Consider removing this and using nonce
          "https://cdn.jsdelivr.net",
          "https://js.stripe.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://api.emailjs.com",
          "https://api.stripe.com",
        ],
        frameSrc: ["https://js.stripe.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Serve static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Environment configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || "",
    EMAILJS_TEMPLATE_ID_ADMIN: process.env.EMAILJS_TEMPLATE_ID_ADMIN || "",
    EMAILJS_TEMPLATE_ID_CUSTOMER:
      process.env.EMAILJS_TEMPLATE_ID_CUSTOMER || "",
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || "",
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  });
});

// CSRF token endpoint
app.get("/api/csrf-token", csrfProtection.getTokenEndpoint());

// Admin routes
const adminRoutes = require("./api/admin");
app.use("/api/admin", adminRoutes);

// Create Payment Intent endpoint
app.post(
  "/api/create-payment-intent",
  paymentLimiter,
  csrfProtection.middleware(),
  async (req, res) => {
    try {
      const { amount, currency = "usd", orderData } = req.body;

      // Enhanced validation
      if (
        !amount ||
        typeof amount !== "number" ||
        amount <= 0 ||
        amount > 50000
      ) {
        return res
          .status(400)
          .json({ error: "Invalid amount. Must be between $0.01 and $50,000" });
      }

      if (
        !currency ||
        typeof currency !== "string" ||
        !/^[a-z]{3}$/i.test(currency)
      ) {
        return res.status(400).json({ error: "Invalid currency code" });
      }

      if (!orderData || typeof orderData !== "object") {
        return res.status(400).json({ error: "Order data is required" });
      }

      if (
        !orderData.customerInfo ||
        typeof orderData.customerInfo !== "object"
      ) {
        return res
          .status(400)
          .json({ error: "Customer information is required" });
      }

      // Validate customer info
      const { name, email } = orderData.customerInfo;
      if (
        !name ||
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 50
      ) {
        return res
          .status(400)
          .json({ error: "Valid customer name is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        !email ||
        typeof email !== "string" ||
        !emailRegex.test(email) ||
        email.length > 254
      ) {
        return res
          .status(400)
          .json({ error: "Valid email address is required" });
      }

      console.log("Creating Payment Intent:", {
        amount: amount,
        currency: currency,
        customer: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
      });

      // Create the Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          customer_name: orderData.customerInfo.name || "",
          customer_email: orderData.customerInfo.email || "",
          order_id: `order_${Date.now()}`,
          services: JSON.stringify(orderData.services || []),
          total_items: (orderData.services || []).length.toString(),
        },
        receipt_email: orderData.customerInfo.email || null,
      });

      console.log("Payment Intent created successfully:", paymentIntent.id);

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Payment Intent creation error:", error);
      // Don't expose internal error details to client
      res.status(500).json({
        error: "Unable to process payment request. Please try again later.",
      });
    }
  },
);

// Retrieve Payment endpoint
app.post(
  "/api/retrieve-payment",
  paymentLimiter,
  csrfProtection.middleware(),
  async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment Intent ID is required" });
      }

      console.log("Retrieving Payment Intent:", paymentIntentId);

      // Retrieve the Payment Intent to get its current status
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      console.log("Payment Intent retrieved:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      });

      // Return the payment details
      res.status(200).json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          metadata: paymentIntent.metadata,
          receipt_email: paymentIntent.receipt_email,
          charges:
            paymentIntent.charges.data.length > 0
              ? {
                  id: paymentIntent.charges.data[0].id,
                  receipt_url: paymentIntent.charges.data[0].receipt_url,
                  billing_details:
                    paymentIntent.charges.data[0].billing_details,
                }
              : null,
        },
      });
    } catch (error) {
      console.error("Payment Intent retrieval error:", error);
      // Don't expose internal error details to client
      res.status(500).json({
        error:
          "Unable to retrieve payment information. Please try again later.",
      });
    }
  },
);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(
    `Stripe configured with key: ${process.env.STRIPE_SECRET_KEY ? "sk_live_***" : "NOT SET"}`,
  );

  // Show IP whitelist status
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS || "127.0.0.1,::1";
  console.log(` Admin IP Whitelist: ${allowedIPs}`);
  console.log(`  Admin protected at: http://localhost:${port}/admin`);
  console.log(` Rate limiting bypassed for whitelisted IPs`);
});

module.exports = app;
