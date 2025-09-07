const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    const { paymentIntentId } = req.body;

    // Enhanced validation
    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return res
        .status(400)
        .json({ error: "Valid Payment Intent ID is required" });
    }

    // Validate the format of the payment intent ID (Stripe format: pi_xxxx)
    if (!/^pi_[a-zA-Z0-9]{24,}$/.test(paymentIntentId)) {
      return res
        .status(400)
        .json({ error: "Invalid Payment Intent ID format" });
    }

    // Retrieve the Payment Intent to get its current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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
                billing_details: paymentIntent.charges.data[0].billing_details,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("Payment Intent retrieval error:", error);
    // Don't expose internal error details to client
    res.status(500).json({
      error: "Unable to retrieve payment information. Please try again later.",
    });
  }
}
