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

    // Handle both new API (latest_charge) and legacy API (charges.data)
    let chargeData = null;
    if (paymentIntent.latest_charge) {
      chargeData = await stripe.charges.retrieve(paymentIntent.latest_charge);
    } else if (paymentIntent.charges?.data?.[0]) {
      chargeData = paymentIntent.charges.data[0];
    }

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
        charges: chargeData
          ? {
              id: chargeData.id,
              receipt_url: chargeData.receipt_url,
              billing_details: chargeData.billing_details,
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
