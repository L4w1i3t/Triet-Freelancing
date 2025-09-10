// Payment Configuration
// Toggle between 'manual' and 'stripe' payment processing
//
// 'manual' - Shows manual payment coordination UI
// 'stripe' - Shows Stripe payment processing

// Function to create payment config with environment variables
const createPaymentConfig = async () => {
  // Wait for environment configuration to load
  const envConfig = await window.envConfig.load();

  // Auto-detect environment based on hostname and protocol
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isHTTPS = window.location.protocol === "https:";
  const isDevelopment = isLocalhost || !isHTTPS;

  // Determine Stripe environment
  const stripeEnvironment = isDevelopment ? "test" : "production";

  console.log(
    `Auto-detected environment: ${stripeEnvironment} (localhost: ${isLocalhost}, https: ${isHTTPS})`,
  );

  return {
    // CHANGE THIS VALUE TO SWITCH PAYMENT MODES
    mode: "stripe", // Options: 'manual' or 'stripe'

    // Stripe Configuration (for stripe payments)
    stripe: {
      publishableKey: envConfig.STRIPE_PUBLISHABLE_KEY, // Loaded from .env
      environment: stripeEnvironment, // Auto-detected based on hostname and protocol
      currency: "usd",

      // Digital Products Configuration
      digitalProducts: true, // Indicates this is for digital goods/services
      automaticPaymentMethods: {
        enabled: true,
      },
    },

    // Manual Payment Methods (shown when mode is 'manual')
    manualMethods: [
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
let configInitialized = false;
const initializePaymentConfig = async () => {
  // Prevent multiple initializations
  if (configInitialized) {
    console.log(
      "Payment configuration already initialized, returning existing config",
    );
    return window.PAYMENT_CONFIG;
  }

  try {
    const config = await createPaymentConfig();
    window.PAYMENT_CONFIG = config;

    // Configuration validation
    if (config.mode === "stripe" && config.stripe) {
      // Validate Stripe configuration
      if (
        config.stripe.publishableKey === "your-stripe-publishable-key" ||
        !config.stripe.publishableKey
      ) {
        console.warn(
          " Stripe Publishable Key not configured. Please update environment variables",
        );
      }
    }

    // For backward compatibility, set the global PAYMENT_MODE variable
    window.PAYMENT_MODE = config.mode;

    configInitialized = true;
    console.log(`Payment system initialized in ${config.mode} mode`);
    return config;
  } catch (error) {
    console.error("Failed to initialize payment configuration:", error);

    // Fallback configuration
    window.PAYMENT_CONFIG = {
      mode: "manual",
      manualMethods: [
        { name: "Venmo", icon: "fas fa-check" },
        { name: "Zelle", icon: "fas fa-check" },
      ],
    };

    window.PAYMENT_MODE = "manual";
    configInitialized = true;
    return window.PAYMENT_CONFIG;
  }
};

// Auto-initialize when the script loads (only once)
(function () {
  // Prevent multiple auto-initializations
  if (window.paymentConfigAutoInitialized) {
    console.log("Payment config auto-initialization already completed");
    return;
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initializePaymentConfig();
        window.paymentConfigAutoInitialized = true;
      });
    } else {
      initializePaymentConfig();
      window.paymentConfigAutoInitialized = true;
    }
  } catch (error) {
    console.error("Failed to auto-initialize payment config:", error);
  }
})();

// Export for manual initialization if needed
window.initializePaymentConfig = initializePaymentConfig;
