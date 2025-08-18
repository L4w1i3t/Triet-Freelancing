// Payment Configuration
// Toggle between 'manual', 'paypal', and 'stripe' payment processing
//
// 'manual' - Shows manual payment coordination UI
// 'paypal' - Shows PayPal payment processing
// 'stripe' - Shows Stripe payment processing

// Function to create payment config with environment variables
const createPaymentConfig = async () => {
  // Wait for environment configuration to load
  const envConfig = await window.envConfig.load();
  
  return {
    // CHANGE THIS VALUE TO SWITCH PAYMENT MODES
    mode: "manual", // Options: 'manual', 'paypal', or 'stripe'

    // Stripe Configuration (for stripe payments)
    stripe: {
      publishableKey: envConfig.STRIPE_PUBLISHABLE_KEY, // Loaded from .env
      environment: "production", // 'test' or 'production'
      currency: "usd",
      
      // Digital Products Configuration
      digitalProducts: true, // Indicates this is for digital goods/services
      automaticPaymentMethods: {
        enabled: true,
      },
    },

    // PayPal Configuration (for paypal payments)
    paypal: {
      clientId: envConfig.PP_CLIENT_ID, // Loaded from .env
      environment: "sandbox", // 'sandbox' or 'production'
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
};

// Initialize payment configuration
const initializePaymentConfig = async () => {
  try {
    const config = await createPaymentConfig();
    window.PAYMENT_CONFIG = config;

    // Configuration validation
    if (config.mode === "paypal" && config.paypal) {
      // Validate PayPal configuration
      if (config.paypal.clientId === "your-paypal-client-id" || !config.paypal.clientId) {
        console.warn("⚠️ PayPal Client ID not configured. Please update environment variables");
      }
    } else if (config.mode === "stripe" && config.stripe) {
      // Validate Stripe configuration
      if (config.stripe.publishableKey === "your-stripe-publishable-key" || !config.stripe.publishableKey) {
        console.warn("⚠️ Stripe Publishable Key not configured. Please update environment variables");
      }
    }

    // For backward compatibility, set the global PAYMENT_MODE variable
    window.PAYMENT_MODE = config.mode;

    console.log(`Payment system initialized in ${config.mode} mode`);
    return config;
    
  } catch (error) {
    console.error('Failed to initialize payment configuration:', error);
    
    // Fallback configuration
    window.PAYMENT_CONFIG = {
      mode: "manual",
      manualMethods: [
        { name: "PayPal", icon: "fas fa-check" },
        { name: "Venmo", icon: "fas fa-check" },
        { name: "Zelle", icon: "fas fa-check" },
      ],
    };
    
    window.PAYMENT_MODE = "manual";
    return window.PAYMENT_CONFIG;
  }
};

// Auto-initialize when the script loads
(function() {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializePaymentConfig);
    } else {
      initializePaymentConfig();
    }
  } catch (error) {
    console.error('Failed to auto-initialize payment config:', error);
  }
})();

// Export for manual initialization if needed
window.initializePaymentConfig = initializePaymentConfig;
