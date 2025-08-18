const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Import Stripe with secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Environment configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || "",
    EMAILJS_TEMPLATE_ID_ADMIN: process.env.EMAILJS_TEMPLATE_ID_ADMIN || "",
    EMAILJS_TEMPLATE_ID_CUSTOMER: process.env.EMAILJS_TEMPLATE_ID_CUSTOMER || "",
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || "",
    PP_CLIENT_ID: process.env.PP_CLIENT_ID || "",
    PP_API_BASE: process.env.PP_API_BASE || "https://api.paypal.com",
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  });
});

// Create Payment Intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', orderData } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!orderData || !orderData.customerInfo) {
      return res.status(400).json({ error: 'Customer information is required' });
    }

    console.log('Creating Payment Intent:', {
      amount: amount,
      currency: currency,
      customer: orderData.customerInfo.name,
      email: orderData.customerInfo.email
    });

    // Create the Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        customer_name: orderData.customerInfo.name || '',
        customer_email: orderData.customerInfo.email || '',
        order_id: `order_${Date.now()}`,
        services: JSON.stringify(orderData.services || []),
        total_items: (orderData.services || []).length.toString(),
      },
      receipt_email: orderData.customerInfo.email || null,
    });

    console.log('Payment Intent created successfully:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Payment Intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Retrieve Payment endpoint
app.post('/api/retrieve-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    console.log('Retrieving Payment Intent:', paymentIntentId);

    // Retrieve the Payment Intent to get its current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('Payment Intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
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
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📧 Stripe configured with key: ${process.env.STRIPE_SECRET_KEY ? 'sk_live_***' : 'NOT SET'}`);
});

module.exports = app;
