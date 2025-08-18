const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
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
        charges: paymentIntent.charges.data.length > 0 ? {
          id: paymentIntent.charges.data[0].id,
          receipt_url: paymentIntent.charges.data[0].receipt_url,
          billing_details: paymentIntent.charges.data[0].billing_details,
        } : null,
      },
    });

  } catch (error) {
    console.error('Payment Intent retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve payment intent',
      details: error.message 
    });
  }
}
