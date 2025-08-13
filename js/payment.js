// Payment Processing System
class PaymentManager {
  constructor() {
    this.orderData = null;
    this.currentPaymentMethod = "paypal";

    // Use configuration from payment-config.js
    this.config = window.PAYMENT_CONFIG || {
      mode: "automated",
      paypal: {
        clientId: "your-paypal-client-id",
        environment: "sandbox",
        currency: "USD",
      },
    };

    // PayPal Configuration
    this.paypalClientId =
      this.config.paypal?.clientId || "your-paypal-client-id";
    this.paypalEnvironment = this.config.paypal?.environment || "sandbox";
    this.paypalCurrency = this.config.paypal?.currency || "USD";

    this.bitcoinWalletAddress =
      this.config.bitcoin?.walletAddress || "your-bitcoin-wallet-address";
    this.bitcoinApiKey = this.config.bitcoin?.apiKey || "your-bitcoin-api-key";

    this.paypal = null;
    this.card = null;
    this.emailService = null;
    this.paymentMode = this.config.mode;

    // Security integration
    this.securityManager = window.securityManager;
    this.inputValidator = window.inputValidator;
    this.analytics = window.privacyAnalytics;

    this.init();
  }

  init() {
    this.loadOrderData();
    this.initializeEmailService();
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

    // Debug: Log PayPal configuration for troubleshooting
    console.group("PayPal Configuration Debug");
    console.log("Config loaded:", this.config);
    console.log(
      "PayPal Client ID:",
      this.paypalClientId
        ? this.paypalClientId.substring(0, 20) + "..."
        : "Not configured",
    );
    console.log(
      "PayPal Environment (from config):",
      this.config.paypal?.environment,
    );
    console.log("PayPal Environment (parsed):", this.paypalEnvironment);
    console.log("PayPal Currency:", this.paypalCurrency);
    console.groupEnd();

    // PayPal Integration Troubleshooting Guide
    if (this.paymentMode === "automated") {
      console.group(" PayPal Integration Troubleshooting");
      console.log('If you see "ERR_BLOCKED_BY_CLIENT" errors:');
      console.log("1. Disable ad blockers (uBlock Origin, Adblock Plus, etc.)");
      console.log("2. Disable privacy-focused browser extensions");
      console.log("3. Try in an incognito/private window");
      console.log(
        "4. Check if your antivirus/firewall is blocking PayPal domains",
      );
      console.log(
        "5. These errors typically don't affect payment functionality",
      );
      console.groupEnd();
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

  initializePaymentMode() {
    // Initialize payment system based on the configured mode
    console.log(`Initializing payment system in ${this.paymentMode} mode`);

    if (this.paymentMode === "automated") {
      this.initializePayPal();
      this.setupPaymentMethodSwitcher();
      this.updateUIForAutomatedPayment();
    } else {
      this.updateUIForManualPayment();
    }

    // Add a small indicator in the console for developers
    if (this.paymentMode === "automated") {
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

    // Update hero description
    const heroDescription = document.querySelector(".payment-description");
    if (heroDescription) {
      heroDescription.textContent =
        "Review your order details and complete your payment securely with PayPal";
    }

    // Show automated payment elements
    const paymentSelector = document.querySelector(".payment-method-selector");
    const paypalForm = document.getElementById("paypalPaymentForm");

    if (paymentSelector) {
      paymentSelector.style.display = "block";
      console.log(" Showing payment method selector");
    }
    if (paypalForm) {
      paypalForm.style.display = "block";
      console.log(" Showing PayPal payment form");
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
        "Review your order details and confirm to proceed with manual payment coordination";
    }

    // Hide automated payment elements
    const paymentSelector = document.querySelector(".payment-method-selector");
    const paypalForm = document.getElementById("paypalPaymentForm");

    if (paymentSelector) {
      paymentSelector.style.display = "none";
      console.log(" Hidden payment method selector");
    } else {
      console.log(" Payment method selector not found");
    }

    if (paypalForm) {
      paypalForm.style.display = "none";
      console.log(" Hidden PayPal payment form");
    } else {
      console.log(" PayPal payment form not found");
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
    // Fallback method when PayPal SDK fails to load
    console.warn(
      "PayPal SDK failed to load. Switching to manual payment mode.",
    );

    // Update the payment mode to manual
    this.paymentMode = "manual";
    this.config.mode = "manual";

    // Update the UI to show manual payment mode
    this.updateUIForManualPayment();

    // Show a user-friendly message
    const paymentContainer = document.querySelector("#paypalPaymentForm");
    if (paymentContainer) {
      paymentContainer.innerHTML = `
        <div class="payment-fallback-notice">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <strong>Payment Method Update:</strong> 
            We're experiencing connectivity issues with our automated payment system. 
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

    // Initialize first payment method
    this.showPaymentForm("paypal");
    const paypalOption = document.querySelector(
      '.payment-option[data-method="paypal"]',
    );
    if (paypalOption) {
      paypalOption.classList.add("selected");
    }
  }

  showPaymentForm(method) {
    const paypalForm = document.getElementById("paypalPaymentForm");
    const bitcoinForm = document.getElementById("bitcoinPaymentForm");

    // Hide all forms first
    if (paypalForm) paypalForm.style.display = "none";
    if (bitcoinForm) bitcoinForm.style.display = "none";

    // Show the selected form
    if (method === "paypal") {
      if (paypalForm) {
        paypalForm.style.display = "block";
        console.log(" Showing PayPal payment form");
      }
    } else if (method === "bitcoin") {
      if (bitcoinForm) {
        bitcoinForm.style.display = "block";
        this.initializeBitcoinPayment();
        console.log(" Showing Bitcoin payment form");
      }
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
document.addEventListener("DOMContentLoaded", () => {
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

    const paymentSelector = document.querySelector(".payment-method-selector");
    console.log(
      `payment-method-selector: ${paymentSelector ? "Found" : "NOT FOUND"}, display = ${paymentSelector?.style.display || "default"}`,
    );
  };
});
