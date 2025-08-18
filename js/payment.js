// Payment Processing System
class PaymentManager {
  constructor() {
    this.orderData = null;
    this.currentPaymentMethod = "manual";

    // Use configuration from payment-config.js - will be loaded async
    this.config = null;
    this.configLoaded = false;

    // PayPal Configuration - will be set after config loads
    this.paypalClientId = null;
    this.paypalEnvironment = null;
    this.paypalCurrency = null;

    // Stripe Configuration - will be set after config loads
    this.stripePublishableKey = null;
    this.stripeCurrency = null;

    this.bitcoinWalletAddress = null;
    this.bitcoinApiKey = null;

    this.paypal = null;
    this.stripe = null;
    this.stripeElements = null;
    this.stripeCardElement = null;
    this.stripeFormInitialized = false;
    this.card = null;
    this.emailService = null;
    this.paymentMode = null; // Will be set after config loads

    // Security integration
    this.securityManager = window.securityManager;
    this.inputValidator = window.inputValidator;
    this.analytics = window.privacyAnalytics;

    // Initialize asynchronously
    this.init();
  }

  async loadConfig() {
    if (this.configLoaded) return;

    try {
      // Wait for payment configuration to be available
      if (typeof window.initializePaymentConfig === "function") {
        await window.initializePaymentConfig();
      }

      this.config = window.PAYMENT_CONFIG || {
        mode: "manual",
        manualMethods: [{ name: "PayPal", icon: "fas fa-check" }],
      };

      // Set configuration properties
      this.paypalClientId =
        this.config.paypal?.clientId || "your-paypal-client-id";
      this.paypalEnvironment = this.config.paypal?.environment || "sandbox";
      this.paypalCurrency = this.config.paypal?.currency || "USD";

      // Stripe Configuration
      this.stripePublishableKey =
        this.config.stripe?.publishableKey || "your-stripe-publishable-key";
      this.stripeCurrency = this.config.stripe?.currency || "usd";

      // Bitcoin Configuration
      this.bitcoinWalletAddress =
        this.config.bitcoin?.walletAddress || "your-bitcoin-wallet-address";
      this.bitcoinApiKey =
        this.config.bitcoin?.apiKey || "your-bitcoin-api-key";

      this.paymentMode = this.config.mode;
      this.configLoaded = true;

      console.log(
        "Payment configuration loaded successfully:",
        this.paymentMode,
      );
    } catch (error) {
      console.error("Failed to load payment configuration:", error);
      // Set fallback values
      this.paymentMode = "manual";
      this.config = { mode: "manual" };
    }
  }

  async init() {
    try {
      // Wait for configuration to load
      await this.loadConfig();

      this.loadOrderData();
      await this.initializeEmailService();
      this.setupEventListeners();
      this.displayOrderSummary();
      this.displayCustomerInfo();

      // Setup security for payment forms
      this.setupPaymentSecurity();

      // Delay payment mode initialization to ensure DOM is ready
      setTimeout(() => {
        this.initializePaymentMode();
      }, 100);

      // Debug: Log order data structure and payment mode
      console.log("Order Data:", this.orderData);
      console.log("Payment Mode:", this.paymentMode);
    } catch (error) {
      console.error("Failed to initialize PaymentManager:", error);
    }
  }

  async initializeEmailService() {
    try {
      this.emailService = new EmailService();
      console.log("Email service initialized");
    } catch (error) {
      console.error("Failed to initialize email service:", error);
    }
  }

  setupPaymentSecurity() {
    // Setup security measures for payment forms
    if (this.securityManager) {
      // Protect payment forms with CSRF tokens
      const forms = document.querySelectorAll("form");
      forms.forEach((form) => {
        this.securityManager.protectForm(form);
      });

      // Securely store order data
      if (this.orderData) {
        this.securityManager.secureStoreOrderData(this.orderData);
      }
    }

    // Setup input validation for payment fields
    if (this.inputValidator) {
      const forms = document.querySelectorAll("form");
      forms.forEach((form) => {
        this.inputValidator.setupRealTimeValidation(form);
      });
    }

    // Track payment analytics securely
    if (this.analytics) {
      this.analytics.trackOrderStarted(this.orderData);
    }

    console.log(" Payment security measures activated");
  }

  getOrderTotal() {
    // Helper function to safely get order total
    if (!this.orderData) {
      console.warn("No order data available, using default amount");
      return 10.0; // Default fallback amount ($10)
    }

    let total = 0;

    // Try different possible total fields
    if (this.orderData.total && !isNaN(this.orderData.total)) {
      total = parseFloat(this.orderData.total);
    } else if (
      this.orderData.summary &&
      this.orderData.summary.total &&
      !isNaN(this.orderData.summary.total)
    ) {
      total = parseFloat(this.orderData.summary.total);
    } else if (this.orderData.grandTotal && !isNaN(this.orderData.grandTotal)) {
      total = parseFloat(this.orderData.grandTotal);
    } else {
      console.warn("Could not find valid total in order data:", this.orderData);
      total = 10.0; // Default fallback amount
    }

    // Ensure total is positive
    if (total <= 0) {
      console.warn("Invalid total amount:", total, "using default");
      total = 10.0;
    }

    console.log("Order total calculated as:", total);
    return total;
  }

  initializePaymentMode() {
    // Initialize payment system based on the configured mode
    console.log(`Initializing payment system in ${this.paymentMode} mode`);

    if (this.paymentMode === "manual") {
      this.updateUIForManualPayment();
    } else if (this.paymentMode === "paypal") {
      this.initializePayPal();
      this.setupPaymentMethodSwitcher();
      this.updateUIForAutomatedPayment();
      this.currentPaymentMethod = "paypal";
    } else if (this.paymentMode === "stripe") {
      this.initializeStripe();
      this.setupPaymentMethodSwitcher();
      this.updateUIForAutomatedPayment();
      this.currentPaymentMethod = "stripe";
    } else {
      // Default to manual if mode is not recognized
      this.updateUIForManualPayment();
    }

    // Add a small indicator in the console for developers
    if (this.paymentMode !== "manual") {
      console.log(
        " Automated payment processing active - PayPal integration enabled",
      );
    } else {
      console.log(
        " Manual payment coordination active - Order confirmation only",
      );
    }
  }

  updateUIForAutomatedPayment() {
    // Update section title
    const titleElement = document.getElementById("paymentSectionTitle");
    if (titleElement) {
      titleElement.textContent = "Payment";
      console.log(' Updated section title to "Payment"');
    }

    // Update hero description based on payment mode
    const heroDescription = document.querySelector(".payment-description");
    if (heroDescription) {
      if (this.paymentMode === "paypal") {
        heroDescription.textContent =
          "Review your order details and complete your payment securely with PayPal";
      } else if (this.paymentMode === "stripe") {
        heroDescription.textContent =
          "Review your order details and complete your payment securely with Stripe";
      } else {
        heroDescription.textContent =
          "Review your order details and complete your payment securely";
      }
    }

    // Show payment selector and hide manual elements
    const paymentSelector = document.querySelector(".payment-method-selector");
    if (paymentSelector) {
      paymentSelector.style.display = "block";
      console.log(" Showing payment method selector");

      // Hide all payment options first
      const allOptions = paymentSelector.querySelectorAll(".payment-option");
      allOptions.forEach((option) => {
        option.style.display = "none";
      });

      // Show only the relevant payment option based on mode
      const relevantOption = paymentSelector.querySelector(
        `[data-method="${this.paymentMode}"]`,
      );
      if (relevantOption) {
        relevantOption.style.display = "block";
        console.log(` Showing ${this.paymentMode} payment option`);
      }
    }

    // Hide manual payment elements
    const manualNotice = document.getElementById("manualPaymentNotice");
    const confirmContainer = document.getElementById(
      "orderConfirmationContainer",
    );

    if (manualNotice) {
      manualNotice.style.display = "none";
      console.log(" Hidden manual payment notice");
    }
    if (confirmContainer) {
      confirmContainer.style.display = "none";
      console.log(" Hidden order confirmation container");
    }
  }

  updateUIForManualPayment() {
    // Update section title
    const titleElement = document.getElementById("paymentSectionTitle");
    if (titleElement) {
      titleElement.textContent = "Order Confirmation";
      console.log(' Updated section title to "Order Confirmation"');
    } else {
      console.error(" Could not find paymentSectionTitle element");
    }

    // Update hero description
    const heroDescription = document.querySelector(".payment-description");
    if (heroDescription) {
      heroDescription.textContent =
        "Review your order details and confirm to proceed.";
    }

    // Handle payment method selector for manual mode
    const paymentSelector = document.querySelector(".payment-method-selector");
    if (paymentSelector) {
      // In manual mode, hide the entire payment selector since we're showing dedicated manual UI
      paymentSelector.style.display = "none";
      console.log(" Hidden payment method selector (manual mode uses dedicated UI)");
    }

    // Hide automated payment forms
    const paypalForm = document.getElementById("paypalPaymentForm");
    const stripeForm = document.getElementById("stripePaymentForm");

    if (paypalForm) {
      paypalForm.style.display = "none";
      console.log(" Hidden PayPal payment form");
    }

    if (stripeForm) {
      stripeForm.style.display = "none";
      console.log(" Hidden Stripe payment form");
    }

    // Show manual payment elements
    const manualNotice = document.getElementById("manualPaymentNotice");
    const confirmContainer = document.getElementById(
      "orderConfirmationContainer",
    );

    if (manualNotice) {
      manualNotice.style.display = "block";
      console.log(" Showing manual payment notice");
    } else {
      console.error(" Could not find manualPaymentNotice element");
    }

    if (confirmContainer) {
      confirmContainer.style.display = "block";
      console.log(" Showing order confirmation container");
    } else {
      console.error(" Could not find orderConfirmationContainer element");
    }
  }

  fallbackToManualMode() {
    // Fallback method when payment SDKs fail to load
    console.warn(
      "Payment SDK failed to load. Switching to manual payment mode.",
    );

    // Update the payment mode to manual
    this.paymentMode = "manual";
    this.config.mode = "manual";

    // Update the UI to show manual payment mode
    this.updateUIForManualPayment();

    // Show a user-friendly message
    const paymentContainer =
      document.querySelector("#paypalPaymentForm") ||
      document.querySelector("#stripePaymentForm");
    if (paymentContainer) {
      paymentContainer.innerHTML = `
        <div class="payment-fallback-notice">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <strong>Payment Method Update:</strong> 
            I'm experiencing technical difficulties with the automated payment system. 
            Please use the manual payment coordination below to complete your order.
          </div>
        </div>
      `;
      paymentContainer.style.display = "block";
    }
  }

  initializeEmailService() {
    // Initialize email service if available
    if (typeof EmailService !== "undefined") {
      this.emailService = new EmailService();
      console.log("Email service initialized for payment confirmations");
    } else {
      console.warn(
        "EmailService not available. Payment confirmation emails will not be sent.",
      );
    }
  }

  loadOrderData() {
    // Get order data from sessionStorage (passed from cart)
    const savedOrderData = sessionStorage.getItem("orderData");
    if (savedOrderData) {
      this.orderData = JSON.parse(savedOrderData);
      console.group("Order Data Debug");
      console.log("Raw order data:", this.orderData);
      console.log("Order data keys:", Object.keys(this.orderData));
      if (this.orderData.summary) {
        console.log("Summary data:", this.orderData.summary);
      }
      console.log("Detected total:", this.getOrderTotal());
      console.groupEnd();
    } else {
      // Redirect back to cart if no order data
      window.location.href = "/pages/cart.html";
      return;
    }
  }

  setupEventListeners() {
    // Always set up manual payment button (may be hidden based on mode)
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener("click", () =>
        this.handleOrderConfirmation(),
      );
    }

    // Set up automated payment listeners based on mode
    if (this.paymentMode === "automated") {
      // Payment method radio buttons
      const paymentRadios = document.querySelectorAll(
        'input[name="paymentMethod"]',
      );
      paymentRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          this.currentPaymentMethod = e.target.value;
          this.showPaymentForm(this.currentPaymentMethod);
        });
      });

      // Bitcoin payment buttons (if you decide to re-enable bitcoin)
      const bitcoinSentBtn = document.getElementById("bitcoinSentBtn");
      const refreshBitcoinBtn = document.getElementById("refreshBitcoinBtn");
      const copyAddressBtn = document.getElementById("copyAddressBtn");

      if (bitcoinSentBtn) {
        bitcoinSentBtn.addEventListener("click", () =>
          this.handleBitcoinPaymentSent(),
        );
      }

      if (refreshBitcoinBtn) {
        refreshBitcoinBtn.addEventListener("click", () =>
          this.refreshBitcoinStatus(),
        );
      }

      if (copyAddressBtn) {
        copyAddressBtn.addEventListener("click", () =>
          this.copyBitcoinAddress(),
        );
      }
    }
  }

  async initializePayPal() {
    try {
      console.log("Initializing PayPal integration...");

      // Wait for PayPal SDK to be available with timeout
      const waitForPayPal = (timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now();

          const checkPayPal = () => {
            if (typeof paypal !== "undefined") {
              console.log(" PayPal SDK loaded successfully");
              resolve();
            } else if (Date.now() - startTime > timeout) {
              reject(new Error("PayPal SDK failed to load within timeout"));
            } else {
              setTimeout(checkPayPal, 100);
            }
          };

          checkPayPal();
        });
      };

      await waitForPayPal();
      await this.renderPayPalButtons();
      console.log(` PayPal initialized in ${this.paypalEnvironment} mode`);
    } catch (error) {
      console.error("Failed to initialize PayPal:", error);
      console.log("Falling back to manual payment mode...");
      this.fallbackToManualMode();
    }
  }

  async renderPayPalButtons() {
    try {
      console.log("Rendering PayPal payment buttons...");

      const buttonContainer = document.getElementById(
        "paypal-button-container",
      );
      if (!buttonContainer) {
        console.error("PayPal button container not found");
        return;
      }

      // Clear any existing buttons
      buttonContainer.innerHTML = "";

      // Add troubleshooting info for developers
      console.group("PayPal Integration Debug Info");
      console.log("Environment:", this.paypalEnvironment);
      console.log(
        "Client ID:",
        this.paypalClientId
          ? this.paypalClientId.substring(0, 20) + "..."
          : "Not configured",
      );
      console.log("Currency:", this.paypalCurrency);
      console.groupEnd();

      // Render PayPal buttons
      paypal
        .Buttons({
          funding: {
            disallowed: [paypal.FUNDING.CREDIT, paypal.FUNDING.PAYLATER],
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay", // Changed from 'paypal' to 'pay' for better digital product experience
            tagline: false, // Remove "The safer, easier way to pay" tagline
          },

          createOrder: (data, actions) => {
            if (!this.orderData || !this.orderData.summary) {
              console.error("No order data available for PayPal payment");
              return;
            }

            // Prepare items list for PayPal
            const items = this.orderData.items.map((item) => ({
              name: item.service?.name || item.serviceName || "Digital Service",
              description: item.projectDescription
                ? item.projectDescription.length > 100
                  ? item.projectDescription.substring(0, 100) + "..."
                  : item.projectDescription
                : "Custom digital commission/service",
              quantity: "1",
              unit_amount: {
                currency_code: this.paypalCurrency,
                value: item.pricing?.totalPrice?.toFixed(2) || "0.00",
              },
              category: "DIGITAL_GOODS", // Explicitly mark as digital goods
            }));

            return actions.order.create({
              intent: "CAPTURE",
              application_context: {
                shipping_preference: "NO_SHIPPING", // Disable shipping for digital products
                user_action: "PAY_NOW", // Skip review step, go straight to payment
                brand_name: "Triet - Digital Services", // Your brand name
                landing_page: "NO_PREFERENCE", // Let PayPal decide the best experience
              },
              purchase_units: [
                {
                  amount: {
                    value: this.orderData.summary.total.toFixed(2),
                    currency_code: this.paypalCurrency,
                    breakdown: {
                      item_total: {
                        currency_code: this.paypalCurrency,
                        value: this.orderData.summary.subtotal.toFixed(2),
                      },
                      tax_total: {
                        currency_code: this.paypalCurrency,
                        value: this.orderData.summary.tax.toFixed(2),
                      },
                    },
                  },
                  items: items,
                  description: `Digital Commission Order - ${this.orderData.orderId || "N/A"}`,
                  custom_id: this.orderData.orderId || `ORDER-${Date.now()}`,
                  soft_descriptor: "TRIET DIGITAL", // What appears on the customer's bank statement
                },
              ],
            });
          },

          onApprove: async (data, actions) => {
            try {
              const order = await actions.order.capture();
              console.log("PayPal payment completed:", order);
              await this.handlePayPalPaymentSuccess(order);
            } catch (error) {
              console.error("PayPal payment capture error:", error);
              this.showError("Payment capture failed. Please try again.");
            }
          },

          onError: (err) => {
            console.error("PayPal payment error:", err);
            this.showError("Payment failed. Please try again.");
          },

          onCancel: (data) => {
            console.log("PayPal payment cancelled:", data);
            this.showInfo("Payment was cancelled.");
          },
        })
        .render("#paypal-button-container");
    } catch (error) {
      console.error("Failed to render PayPal buttons:", error);
    }
  }

  async handlePayPalPaymentSuccess(paypalOrder) {
    try {
      // Create payment result object
      const paymentResult = {
        transactionId: paypalOrder.id,
        paymentMethod: "paypal",
        amount: paypalOrder.purchase_units[0].amount.value,
        currency: paypalOrder.purchase_units[0].amount.currency_code,
        status: paypalOrder.status,
        payerInfo: paypalOrder.payer,
        timestamp: new Date().toISOString(),
      };

      console.log("Processing PayPal payment success:", paymentResult);

      // Handle successful payment
      this.handlePaymentSuccess(paymentResult);
    } catch (error) {
      console.error("Error handling PayPal payment success:", error);
      this.showError(
        "Payment completed but there was an error processing your order. Please contact support.",
      );
    }
  }

  async initializeStripe() {
    try {
      console.log("Initializing Stripe integration...");

      // Check if Stripe is already initialized
      if (this.stripe && this.stripeElements && this.stripeCardElement) {
        console.log("Stripe already fully initialized, skipping re-initialization");
        return;
      }

      // Wait for Stripe SDK to be available with timeout
      const waitForStripe = (timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now();

          const checkStripe = () => {
            if (typeof Stripe !== "undefined") {
              console.log(" Stripe SDK loaded successfully");
              resolve();
            } else if (Date.now() - startTime > timeout) {
              reject(new Error("Stripe SDK failed to load within timeout"));
            } else {
              setTimeout(checkStripe, 100);
            }
          };

          checkStripe();
        });
      };

      await waitForStripe();

      // Initialize Stripe instance only if not already done
      if (!this.stripe) {
        this.stripe = Stripe(this.stripePublishableKey);
      }

      // Get order total safely
      const orderTotal = this.getOrderTotal();
      const amountInCents = Math.round(orderTotal * 100);

      console.log(
        `Initializing Stripe with amount: $${orderTotal} (${amountInCents} cents)`,
      );

      // Create Elements instance only if not already created
      if (!this.stripeElements) {
        this.stripeElements = this.stripe.elements();
      }

      // Create individual card element only if not already created
      if (!this.stripeCardElement) {
        this.stripeCardElement = this.stripeElements.create("card", {
          style: {
            base: {
              fontSize: "16px",
              color: "#ffffff",
              fontFamily: "Inter, sans-serif",
              "::placeholder": {
                color: "#aab7c4",
              },
            },
            invalid: {
              color: "#fa755a",
              iconColor: "#fa755a",
            },
          },
        });

        // Mount the card element
        this.stripeCardElement.mount("#stripe-payment-element");
      }

      // Set up form submission only if not already done
      if (!this.stripeFormInitialized) {
        this.setupStripeForm();
      }

      console.log(
        ` Stripe initialized in ${this.config.stripe?.environment || "test"} mode`,
      );
      
      // Log environment warning if running test mode on production domain
      if (this.config.stripe?.environment === "test" && window.location.hostname !== "localhost") {
        console.warn(" Note: Stripe is in test mode. Switch to production for live payments.");
      }
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      
      // Check if it's an HTTPS error
      if (error.message && error.message.includes("HTTPS")) {
        console.error(" HTTPS Error: Stripe requires HTTPS for production mode. Either:");
        console.error(" 1. Switch to test mode for local development, or");
        console.error(" 2. Use HTTPS for production deployment");
      }
      
      console.log("Falling back to manual payment mode...");
      this.fallbackToManualMode();
    }
  }

  async initializeStripeOnDemand() {
    try {
      console.log("Initializing Stripe on demand...");

      // Check if Stripe is already initialized
      if (this.stripe && this.stripeElements) {
        console.log("Stripe already initialized, skipping re-initialization");
        return;
      }

      // Wait for Stripe SDK to be available with timeout
      const waitForStripe = (timeout = 15000) => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now();

          const checkStripe = () => {
            if (typeof Stripe !== "undefined") {
              console.log(" Stripe SDK loaded successfully");
              resolve();
            } else if (Date.now() - startTime > timeout) {
              reject(new Error("Stripe SDK failed to load within timeout"));
            } else {
              setTimeout(checkStripe, 100);
            }
          };

          checkStripe();
        });
      };

      // Wait for Stripe SDK to be loaded by the HTML page (it loads asynchronously)
      console.log("Waiting for Stripe SDK to be available...");
      await waitForStripe();

      // Initialize Stripe instance only if not already done
      if (!this.stripe) {
        this.stripe = Stripe(this.stripePublishableKey);
      }

      // Clear any existing elements from the container
      const paymentElementContainer = document.getElementById(
        "stripe-payment-element",
      );
      if (paymentElementContainer) {
        paymentElementContainer.innerHTML = "";
        console.log("Cleared existing Stripe payment element container");
      } else {
        console.error("Stripe payment element container not found!");
        throw new Error("Stripe payment element container not found");
      }

      // Get order total safely
      const orderTotal = this.getOrderTotal();
      const amountInCents = Math.round(orderTotal * 100);

      console.log(
        `Initializing Stripe on demand with amount: $${orderTotal} (${amountInCents} cents)`,
      );

      // Create Elements instance (without payment mode)
      this.stripeElements = this.stripe.elements();

      // Create individual card element instead of payment element
      this.stripeCardElement = this.stripeElements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            "::placeholder": {
              color: "#aab7c4",
            },
          },
          invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
          },
        },
      });

      console.log("Created Stripe card element, attempting to mount...");

      // Mount the card element with error handling
      try {
        this.stripeCardElement.mount("#stripe-payment-element");
        console.log("Stripe card element mounted successfully");

        // Listen for changes to the Card Element
        this.stripeCardElement.on("change", (event) => {
          if (event.error) {
            this.showStripeError(event.error.message);
          } else {
            // Clear any previous error messages
            const messagesElement = document.getElementById(
              "stripe-payment-messages",
            );
            messagesElement.textContent = "";
          }
        });
      } catch (mountError) {
        console.error("Failed to mount Stripe card element:", mountError);
        throw mountError;
      }

      // Set up form submission if not already set up
      if (!this.stripeFormInitialized) {
        this.setupStripeForm();
        this.stripeFormInitialized = true;
      }

      console.log(
        ` Stripe initialized on demand in ${this.config.stripe?.environment || "test"} mode`,
      );
    } catch (error) {
      console.error("Failed to initialize Stripe on demand:", error);
      
      // Check if it's an HTTPS error and provide helpful message
      if (error.message && error.message.includes("HTTPS")) {
        console.error(" HTTPS Error: Stripe requires HTTPS for production mode");
        this.showStripeError(
          "Payment system requires HTTPS for security. Please contact support or try again later."
        );
      } else {
        // Show a user-friendly error message for other errors
        this.showStripeError(
          "Unable to load Stripe payment form. Please refresh the page or contact support if the issue persists."
        );
      }
      
      // Only fall back to manual mode if it's a persistent issue
      setTimeout(() => {
        if (!this.stripe || !this.stripeElements) {
          console.warn("Stripe still not available after timeout, falling back to manual mode");
          this.fallbackToManualMode();
        }
      }, 3000);
    }
  }

  setupStripeForm() {
    const form = document.getElementById("stripe-payment-form");
    const submitButton = document.getElementById("stripe-submit-button");
    const buttonText = submitButton.querySelector(".button-text");
    const loadingSpinner = submitButton.querySelector(".loading-spinner");

    // Check if event listener is already attached to prevent duplicates
    if (form.hasAttribute("data-stripe-setup")) {
      console.log("Stripe form already set up, skipping...");
      return;
    }

    // Mark form as set up
    form.setAttribute("data-stripe-setup", "true");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Disable submit button and show loading
      submitButton.disabled = true;
      buttonText.style.display = "none";
      loadingSpinner.style.display = "inline";

      try {
        // First, create a Payment Intent on the server
        const orderTotal = this.getOrderTotal();
        console.log("Creating Payment Intent for amount:", orderTotal);

        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: orderTotal,
            currency: this.stripeCurrency || "usd",
            orderData: this.orderData,
          }),
        });

        const { success, clientSecret, paymentIntentId, error } =
          await response.json();

        if (!success || !clientSecret) {
          throw new Error(error || "Failed to create payment intent");
        }

        console.log("Payment Intent created successfully:", paymentIntentId);

        // Confirm the payment with the client secret
        const { error: confirmError, paymentIntent } =
          await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: this.stripeCardElement,
              billing_details: {
                name: this.orderData.customerInfo?.name || "Customer",
                email: this.orderData.customerInfo?.email || "",
              },
            },
          });

        if (confirmError) {
          console.error("Stripe payment confirmation error:", confirmError);
          this.showStripeError(confirmError.message);
        } else if (paymentIntent.status === "succeeded") {
          console.log("Payment succeeded!", paymentIntent);

          // Retrieve full payment details from server
          const detailsResponse = await fetch("/api/retrieve-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          });

          const paymentDetails = await detailsResponse.json();
          console.log("Payment details retrieved:", paymentDetails);

          await this.handleStripePaymentSuccess(
            paymentIntent,
            paymentDetails.paymentIntent,
          );
        } else {
          throw new Error("Payment was not completed successfully");
        }
      } catch (error) {
        console.error("Stripe payment processing error:", error);
        this.showStripeError("Payment processing failed. Please try again.");
      } finally {
        // Re-enable submit button and hide loading
        submitButton.disabled = false;
        buttonText.style.display = "inline";
        loadingSpinner.style.display = "none";
      }
    });
  }

  async handleStripePaymentSuccess(paymentIntent, paymentDetails = null) {
    try {
      // Create payment result object with detailed information
      const paymentResult = {
        transactionId: paymentIntent.id,
        chargeId: paymentDetails?.charges?.id || null,
        receiptUrl: paymentDetails?.charges?.receipt_url || null,
        paymentMethod: "stripe",
        amount: (paymentIntent.amount / 100).toFixed(2),
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        paymentMethodId: paymentIntent.payment_method,
        timestamp: new Date().toISOString(),
        customerInfo: {
          name:
            paymentDetails?.charges?.billing_details?.name ||
            this.orderData.customerInfo?.name ||
            "Customer",
          email:
            paymentDetails?.metadata?.customer_email ||
            this.orderData.customerInfo?.email ||
            "",
        },
        orderInfo: {
          orderId: paymentDetails?.metadata?.order_id || `order_${Date.now()}`,
          services: paymentDetails?.metadata?.services
            ? JSON.parse(paymentDetails.metadata.services)
            : this.orderData.services || [],
          totalItems:
            paymentDetails?.metadata?.total_items ||
            (this.orderData.services || []).length,
        },
        receiptEmail:
          paymentDetails?.receipt_email || this.orderData.customerInfo?.email,
      };

      console.log(
        "Processing Stripe payment success with detailed data:",
        paymentResult,
      );

      // Store payment details for potential future reference
      localStorage.setItem("lastStripePayment", JSON.stringify(paymentResult));

      // Handle successful payment
      this.handlePaymentSuccess(paymentResult);

      // Show success message with receipt information
      if (paymentResult.receiptUrl) {
        this.showSuccessWithReceipt(paymentResult);
      }
    } catch (error) {
      console.error("Error handling Stripe payment success:", error);
      this.showError(
        "Payment completed but there was an error processing your order. Please contact support with transaction ID: " +
          paymentIntent.id,
      );
    }
  }

  showStripeError(message) {
    const messagesElement = document.getElementById("stripe-payment-messages");
    messagesElement.textContent = message;
    messagesElement.classList.add("error");
    setTimeout(() => {
      messagesElement.textContent = "";
      messagesElement.classList.remove("error");
    }, 5000);
  }

  showSuccessWithReceipt(paymentResult) {
    // Create a success message with receipt link
    const messagesElement = document.getElementById("stripe-payment-messages");
    const successHTML = `
      <div class="payment-success">
        <p><strong>Payment Successful!</strong></p>
        <p>Transaction ID: ${paymentResult.transactionId}</p>
        <p>Amount: $${paymentResult.amount} ${paymentResult.currency}</p>
        ${paymentResult.receiptUrl ? `<p><a href="${paymentResult.receiptUrl}" target="_blank" class="receipt-link">View Receipt</a></p>` : ""}
        ${paymentResult.receiptEmail ? `<p>Receipt sent to: ${paymentResult.receiptEmail}</p>` : ""}
      </div>
    `;

    messagesElement.innerHTML = successHTML;
    messagesElement.classList.add("success");

    // Keep success message longer than error messages
    setTimeout(() => {
      messagesElement.innerHTML = "";
      messagesElement.classList.remove("success");
    }, 10000);
  }

  setupPaymentMethodSwitcher() {
    const paymentOptions = document.querySelectorAll(".payment-option");
    paymentOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const method = option.dataset.method;
        const radio = option.querySelector('input[type="radio"]');

        // Update radio selection
        radio.checked = true;

        // Update current method and show form
        this.currentPaymentMethod = method;
        this.showPaymentForm(method);

        // Update visual selection
        paymentOptions.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
      });
    });

    // Initialize first payment method based on payment mode
    let defaultMethod = "manual";
    if (this.paymentMode === "paypal") {
      defaultMethod = "paypal";
    } else if (this.paymentMode === "stripe") {
      defaultMethod = "stripe";
    }

    this.showPaymentForm(defaultMethod);
    const defaultOption = document.querySelector(
      `.payment-option[data-method="${defaultMethod}"]`,
    );
    if (defaultOption) {
      defaultOption.classList.add("selected");
      const radio = defaultOption.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
  }

  showPaymentForm(method) {
    const paypalForm = document.getElementById("paypalPaymentForm");
    const stripeForm = document.getElementById("stripePaymentForm");
    const bitcoinForm = document.getElementById("bitcoinPaymentForm");

    // Hide all forms first
    if (paypalForm) paypalForm.style.display = "none";
    if (stripeForm) stripeForm.style.display = "none";
    if (bitcoinForm) bitcoinForm.style.display = "none";

    // Show the selected form
    if (method === "paypal") {
      if (paypalForm) {
        paypalForm.style.display = "block";
        console.log(" Showing PayPal payment form");
      }
    } else if (method === "stripe") {
      if (stripeForm) {
        stripeForm.style.display = "block";
        console.log(" Showing Stripe payment form");

        // Initialize Stripe if not already initialized - but give the SDK time to load
        if (!this.stripe || !this.stripeElements) {
          // Add a small delay to allow SDK to finish loading
          setTimeout(() => {
            this.initializeStripeOnDemand();
          }, 500);
        }
      }
    } else if (method === "bitcoin") {
      if (bitcoinForm) {
        bitcoinForm.style.display = "block";
        this.initializeBitcoinPayment();
        console.log(" Showing Bitcoin payment form");
      }
    } else if (method === "manual") {
      // For manual payment, hide all automated forms and show manual payment UI
      console.log(" Manual payment selected - hiding automated payment forms");
    }
  }

  displayOrderSummary() {
    if (!this.orderData) {
      console.error("No order data available");
      return;
    }

    const orderItemsContainer = document.getElementById("orderItems");
    const subtotalElement = document.getElementById("orderSubtotal");
    const taxElement = document.getElementById("orderTax");
    const totalElement = document.getElementById("orderTotal");

    // Display order items
    if (orderItemsContainer && this.orderData.items) {
      orderItemsContainer.innerHTML = "";
      this.orderData.items.forEach((item) => {
        const itemElement = document.createElement("div");
        itemElement.className = "order-item";
        itemElement.innerHTML = `
          <div class="item-info">
            <h4>${item.service?.name || "Unknown Service"}</h4>
            <p>${item.projectDescription || item.service?.description || "Custom service package"}</p>
          </div>
          <div class="item-price">$${(item.pricing?.totalPrice || 0).toFixed(2)}</div>
        `;
        orderItemsContainer.appendChild(itemElement);
      });
    }

    // Display totals
    if (subtotalElement && this.orderData.summary) {
      subtotalElement.textContent = `$${(this.orderData.summary.subtotal || 0).toFixed(2)}`;
    }
    if (taxElement && this.orderData.summary) {
      taxElement.textContent = `$${(this.orderData.summary.tax || 0).toFixed(2)}`;
    }
    if (totalElement && this.orderData.summary) {
      totalElement.textContent = `$${(this.orderData.summary.total || 0).toFixed(2)}`;
    }
  }

  displayCustomerInfo() {
    if (!this.orderData || !this.orderData.customerInfo) {
      console.error("No customer info available");
      return;
    }

    const customerDetailsContainer = document.getElementById("customerDetails");
    if (customerDetailsContainer) {
      const info = this.orderData.customerInfo;
      customerDetailsContainer.innerHTML = `
        <div class="customer-field">
          <strong>Name:</strong> ${info.name || "Not provided"}
        </div>
        <div class="customer-field">
          <strong>Email:</strong> ${info.email || "Not provided"}
        </div>
        <div class="customer-field">
          <strong>Phone:</strong> ${info.phone || "Not provided"}
        </div>
        <div class="customer-field">
          <strong>Preferred Contact:</strong> ${info.preferredContact || "Email"}
        </div>
      `;
    }
  }

  async handleOrderConfirmation() {
    const confirmBtn = document.getElementById("confirmOrderBtn");
    const buttonText = confirmBtn.querySelector(".button-text");
    const buttonLoading = confirmBtn.querySelector(".button-loading");

    try {
      // Show loading state
      buttonText.style.display = "none";
      buttonLoading.style.display = "inline-flex";
      confirmBtn.disabled = true;

      // Create order completion data
      const orderCompletionData = {
        ...this.orderData,
        paymentInfo: {
          paymentMethod: "manual",
          status: "pending",
          paidAt: null,
          transactionId: "MANUAL-" + Date.now(),
          note: "Manual payment coordination required",
        },
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
      };

      // Send confirmation emails
      await this.sendOrderConfirmationEmail(orderCompletionData);

      // Save completed order to localStorage
      this.saveCompletedOrder(orderCompletionData);

      // Clear cart and order data
      this.clearOrderData();

      // Show success
      this.showPaymentSuccess(orderCompletionData.orderId);
    } catch (error) {
      console.error("Order confirmation error:", error);
      this.showError("Failed to confirm order. Please try again.");
    } finally {
      // Reset button state
      buttonText.style.display = "inline";
      buttonLoading.style.display = "none";
      confirmBtn.disabled = false;
    }
  }

  initializeBitcoinPayment() {
    // Display Bitcoin address
    const bitcoinAddressElement = document.getElementById("bitcoinAddress");
    if (bitcoinAddressElement) {
      bitcoinAddressElement.textContent = this.bitcoinWalletAddress;
    }

    // Calculate Bitcoin amount (you would typically get this from a Bitcoin API)
    this.updateBitcoinAmount();

    // Generate QR code
    this.generateBitcoinQR();
  }

  async updateBitcoinAmount() {
    try {
      // In a real implementation, you would fetch the current Bitcoin price from an API
      // For demo purposes, we'll use a simulated rate
      const btcPrice = 45000; // Simulated Bitcoin price in USD
      const usdAmount = this.orderData?.summary?.total || 0;
      const btcAmount = (usdAmount / btcPrice).toFixed(8);

      const bitcoinAmountElement = document.getElementById("bitcoinAmount");
      const usdAmountElement = document.getElementById("usdAmount");

      if (bitcoinAmountElement) bitcoinAmountElement.textContent = btcAmount;
      if (usdAmountElement) usdAmountElement.textContent = usdAmount.toFixed(2);
    } catch (error) {
      console.error("Error updating Bitcoin amount:", error);
    }
  }

  generateBitcoinQR() {
    // Generate Bitcoin QR code
    const qrContainer = document.getElementById("bitcoinQrCode");
    if (qrContainer) {
      const bitcoinAmountElement = document.getElementById("bitcoinAmount");
      const bitcoinAmount = bitcoinAmountElement
        ? bitcoinAmountElement.textContent
        : "0";
      const orderId = this.orderData?.orderId || "Unknown";
      const bitcoinUri = `bitcoin:${this.bitcoinWalletAddress}?amount=${bitcoinAmount}&label=Triet%20Order%20${orderId}`;

      // For demo purposes, we'll show a placeholder
      qrContainer.innerHTML = `
        <div class="qr-placeholder">
          <i class="fas fa-qrcode"></i>
          <p>QR Code would appear here</p>
          <small>Use a QR code library like qrcode.js in production</small>
        </div>
      `;

      // In production, you would use a QR code library:
      // QRCode.toCanvas(qrContainer, bitcoinUri, function (error) {
      //   if (error) console.error(error)
      // })
    }
  }

  copyBitcoinAddress() {
    const bitcoinAddress =
      document.getElementById("bitcoinAddress").textContent;
    navigator.clipboard
      .writeText(bitcoinAddress)
      .then(() => {
        const copyBtn = document.getElementById("copyAddressBtn");
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.classList.add("copied");

        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove("copied");
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy address:", err);
      });
  }

  handleBitcoinPaymentSent() {
    // In a real implementation, you would verify the Bitcoin transaction
    // For demo purposes, we'll simulate verification

    const bitcoinSentBtn = document.getElementById("bitcoinSentBtn");
    bitcoinSentBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    bitcoinSentBtn.disabled = true;

    // Simulate verification delay
    setTimeout(() => {
      // Simulate successful verification
      const paymentResult = {
        success: true,
        transactionId:
          "btc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        paymentMethod: "bitcoin",
      };

      this.handlePaymentSuccess(paymentResult);
    }, 3000);
  }

  refreshBitcoinStatus() {
    // In a real implementation, you would check the Bitcoin network for the transaction
    const refreshBtn = document.getElementById("refreshBitcoinBtn");
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    refreshBtn.disabled = true;

    setTimeout(() => {
      refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh Status';
      refreshBtn.disabled = false;

      // Show a message
      this.showInfo(
        "No confirmed payments found. Please ensure you've sent the exact amount.",
      );
    }, 2000);
  }

  handlePaymentSuccess(paymentResult) {
    // Validate payment data for security
    if (this.inputValidator) {
      const validationResult = this.inputValidator.validateForm({
        transactionId: paymentResult.transactionId,
        paymentMethod: paymentResult.paymentMethod,
      });

      if (!validationResult.isValid) {
        console.error(
          " Payment data validation failed:",
          validationResult.errors,
        );
        this.handlePaymentError({ message: "Payment validation failed" });
        return;
      }
    }

    // Update order data with payment information
    this.orderData.paymentInfo = {
      transactionId: paymentResult.transactionId,
      paymentMethod: paymentResult.paymentMethod,
      paidAt: new Date().toISOString(),
    };

    // Track successful payment analytics
    if (this.analytics) {
      this.analytics.trackOrderCompleted(this.orderData);
    }

    // Save completed order to localStorage for reference
    const completedOrders = JSON.parse(
      localStorage.getItem("completedOrders") || "[]",
    );
    completedOrders.push(this.orderData);
    localStorage.setItem("completedOrders", JSON.stringify(completedOrders));

    // Send order confirmation email after a brief delay to ensure data is properly set
    setTimeout(() => {
      this.sendOrderConfirmationEmail();
    }, 500);

    // Clear cart and order data securely
    localStorage.removeItem("serviceCart");
    sessionStorage.removeItem("orderData");

    // Clear sensitive data from security manager
    if (this.securityManager) {
      this.securityManager.clearSensitiveData();
    }

    // Show success modal
    this.showPaymentSuccess();
  }

  saveCompletedOrder(orderData) {
    try {
      // Save completed order to localStorage for reference
      const completedOrders = JSON.parse(
        localStorage.getItem("completedOrders") || "[]",
      );
      completedOrders.push(orderData);
      localStorage.setItem("completedOrders", JSON.stringify(completedOrders));
      console.log("Order saved to completed orders:", orderData.orderId);
    } catch (error) {
      console.error("Failed to save completed order:", error);
    }
  }

  clearOrderData() {
    try {
      // Clear cart and order data
      localStorage.removeItem("serviceCart");
      sessionStorage.removeItem("orderData");
      console.log("Cart and order data cleared");
    } catch (error) {
      console.error("Failed to clear order data:", error);
    }
  }

  async sendOrderConfirmationEmail(orderData = null) {
    if (!this.emailService) {
      console.warn("Email service not available for order confirmation");
      return;
    }

    try {
      console.log("Sending order confirmation emails...");

      // Use passed orderData or fall back to this.orderData
      const dataToSend = orderData || this.orderData;

      console.log(
        " Starting email notifications for order:",
        dataToSend?.orderId,
      );

      // Send admin notification (detailed order info)
      console.log(" Sending admin notification...");
      const adminResult =
        await this.emailService.sendOrderNotification(dataToSend);
      console.log(" Admin result:", adminResult);

      // Send customer confirmation (using customer template)
      console.log(" Sending customer confirmation...");
      const customerResult =
        await this.emailService.sendCustomerConfirmation(dataToSend);
      console.log(" Customer result:", customerResult);

      if (adminResult.success && customerResult.success) {
        console.log(" Both admin and customer emails sent successfully");
        this.showInfo("Order confirmation emails sent successfully!");
      } else if (adminResult.success || customerResult.success) {
        console.log(" One email sent successfully, one failed");
        console.log(
          "Admin success:",
          adminResult.success,
          "Customer success:",
          customerResult.success,
        );
        this.showInfo("Order confirmation email sent (partial success).");
      } else {
        console.error(" Both emails failed to send");
        console.error("Admin error:", adminResult.error);
        console.error("Customer error:", customerResult.error);
        this.showInfo(
          "Payment successful! Note: Confirmation emails could not be sent.",
        );
      }
    } catch (error) {
      console.error("Error sending order confirmation emails:", error);
      // Don't block the payment success flow
      this.showInfo(
        "Payment successful! Note: Confirmation emails could not be sent.",
      );
    }
  }

  showPaymentSuccess(orderId = null) {
    const modal = document.getElementById("paymentSuccessModal");
    const orderNumberElement = document.getElementById("finalOrderNumber");

    if (modal && orderNumberElement) {
      orderNumberElement.textContent =
        orderId || this.orderData?.orderId || "N/A";
      modal.style.display = "flex";

      // Add fade-in animation
      setTimeout(() => {
        modal.classList.add("show");
      }, 10);
    }
  }

  showError(message) {
    // Remove any existing error messages first
    const existingErrors = document.querySelectorAll(".payment-error");
    existingErrors.forEach((error) => error.remove());

    // Create and show error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "payment-error";
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(errorDiv);

    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  showInfo(message) {
    // Remove any existing info messages first
    const existingInfos = document.querySelectorAll(".payment-info-message");
    existingInfos.forEach((info) => info.remove());

    // Create and show info message
    const infoDiv = document.createElement("div");
    infoDiv.className = "payment-info-message";
    infoDiv.innerHTML = `
      <div class="info-content">
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(infoDiv);

    // Remove after 5 seconds
    setTimeout(() => {
      if (infoDiv.parentElement) {
        infoDiv.remove();
      }
    }, 5000);
  }

  // Test method for developers to test email functionality
  async testEmailService() {
    if (!this.emailService) {
      console.error("Email service not available for testing");
      return;
    }

    // Create test order data
    const testOrderData = {
      orderId: "TEST-" + Date.now(),
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: "Test Customer",
        email: "triet_processor@proton.me", // Test email
        phone: "555-0123",
        preferredContact: "email",
      },
      items: [
        {
          service: { name: "Test Service" },
          pricing: { basePrice: 100, totalPrice: 120 },
          projectDescription: "Test payment email service",
        },
      ],
      summary: {
        subtotal: 120,
        tax: 10.5,
        total: 130.5,
      },
      notes: "Test order for email verification",
      paymentInfo: {
        transactionId: "TEST-" + Math.random().toString(36).substr(2, 9),
        paymentMethod: "paypal",
        paidAt: new Date().toISOString(),
      },
    };

    console.log("Testing email service with test order data...");
    try {
      const result =
        await this.emailService.sendOrderNotification(testOrderData);
      if (result.success) {
        console.log("Test email sent successfully!");
        this.showInfo("Test email sent successfully!");
      } else {
        console.error("Test email failed:", result.error);
        this.showError("Test email failed: " + result.error);
      }
    } catch (error) {
      console.error("Test email error:", error);
      this.showError("Test email error: " + error.message);
    }
  }
}

// Initialize payment manager when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const paymentManager = new PaymentManager();

    // Make it globally available for testing
    window.paymentManager = paymentManager;

    // Add global test function for email
    window.testPaymentEmail = () => {
      if (window.paymentManager) {
        window.paymentManager.testEmailService();
      } else {
        console.error("Payment manager not available");
      }
    };

    // Add function to test payment mode switching
    window.togglePaymentMode = (mode) => {
      if (window.paymentManager) {
        window.paymentManager.paymentMode = mode;
        window.paymentManager.initializePaymentMode();
        console.log(`Switched to ${mode} mode`);
      } else {
        console.error("Payment manager not available");
      }
    };

    // Add function to check element visibility
    window.checkPaymentElements = () => {
      console.log("=== Payment Elements Status ===");
      const elements = [
        "manualPaymentNotice",
        "orderConfirmationContainer",
        "paypalPaymentForm",
        "paymentSectionTitle",
      ];

      elements.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          console.log(
            `${id}: Found, display = ${element.style.display || "default"}`,
          );
        } else {
          console.log(`${id}: NOT FOUND`);
        }
      });

      const paymentSelector = document.querySelector(
        ".payment-method-selector",
      );
      console.log(
        `payment-method-selector: ${paymentSelector ? "Found" : "NOT FOUND"}, display = ${paymentSelector?.style.display || "default"}`,
      );
    };
  } catch (error) {
    console.error("Failed to initialize payment system:", error);
  }
});

// Global navigation function for the home page button
window.navigateToHome = () => {
  try {
    // Check if we're in a subdirectory (like /pages/)
    const currentPath = window.location.pathname;
    let homePath = "/";

    // If we're in the pages directory, go up one level
    if (currentPath.includes("/pages/")) {
      homePath = "../index.html";
    }

    console.log("Navigating to home page:", homePath);
    window.location.href = homePath;
  } catch (error) {
    console.error("Navigation error:", error);
    // Fallback navigation
    window.location.href = "/";
  }
};
