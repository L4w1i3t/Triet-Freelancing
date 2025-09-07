const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
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
  
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency = "usd", orderData } = req.body;

    // Enhanced validation
    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 50000) {
      return res.status(400).json({ error: "Invalid amount. Must be between $0.01 and $50,000" });
    }

    if (!currency || typeof currency !== 'string' || !/^[a-z]{3}$/i.test(currency)) {
      return res.status(400).json({ error: "Invalid currency code" });
    }

    if (!orderData || typeof orderData !== 'object') {
      return res.status(400).json({ error: "Order data is required" });
    }

    if (!orderData.customerInfo || typeof orderData.customerInfo !== 'object') {
      return res.status(400).json({ error: "Customer information is required" });
    }

    // Validate customer info
    const { name, email } = orderData.customerInfo;
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ error: "Valid customer name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Valid email address is required" });
    }

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

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment Intent creation error:", error);
    // Don't expose internal error details to client
    res.status(500).json({
      error: "Unable to process payment request. Please try again later."
    });
  }
}
