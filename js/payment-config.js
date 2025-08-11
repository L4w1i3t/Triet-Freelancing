// Payment Configuration
// Toggle between 'manual' and 'automated' payment processing
//
// 'manual' - Shows manual payment coordination UI
// 'automated' - Shows PayPal payment processing

window.PAYMENT_CONFIG = {
  // CHANGE THIS VALUE TO SWITCH PAYMENT MODES
  mode: "automated", // Options: 'manual' or 'automated'

  // PayPal Configuration (for automated payments)
  paypal: {
    clientId:
      PP_CLIENT_ID, // Loaded from .env
    environment: "production", // 'sandbox' or 'production'
    currency: "USD",
    intent: "capture", // 'capture' for immediate payment, 'authorize' for authorization only

    // Digital Products Configuration
    digitalProducts: true, // Indicates this is for digital goods/services
    noShipping: true, // Disable shipping options
    experienceProfile: {
      no_shipping: 1, // 0=show shipping, 1=hide shipping, 2=use account preference
      address_override: 0, // Don't override address
      landing_page_type: "billing", // Go directly to payment methods
    },
  },

  // Manual Payment Methods (shown when mode is 'manual')
  manualMethods: [
    { name: "PayPal", icon: "fas fa-check" },
    { name: "Venmo", icon: "fas fa-check" },
    { name: "Zelle", icon: "fas fa-check" },
  ],

  // Bitcoin Configuration (optional, not currently active)
  bitcoin: {
    walletAddress: "",
    apiKey: "your-bitcoin-api-key",
  },
};

// Configuration validation
if (
  window.PAYMENT_CONFIG.mode === "automated" &&
  window.PAYMENT_CONFIG.paypal
) {
  const config = window.PAYMENT_CONFIG.paypal;

  // Validate PayPal configuration
  if (config.clientId === "your-paypal-client-id") {
    console.warn(
      " PayPal Client ID not configured. Please update payment-config.js",
    );
  }
}

// For backward compatibility, set the global PAYMENT_MODE variable
window.PAYMENT_MODE = window.PAYMENT_CONFIG.mode;

console.log(`Payment system initialized in ${window.PAYMENT_CONFIG.mode} mode`);
