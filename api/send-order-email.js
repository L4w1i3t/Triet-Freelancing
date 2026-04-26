const { sendOrderEmails, validateOrderData } = require("../lib/order-email");

export default async function handler(req, res) {
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const orderData = req.body?.orderData;
    const validationError = validateOrderData(orderData);

    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const result = await sendOrderEmails(orderData);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Order email API error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: "Unable to send order emails. Please try again later.",
    });
  }
}
