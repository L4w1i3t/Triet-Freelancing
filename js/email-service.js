// Email Service for Order Notifications
class EmailService {
  constructor() {
    // EmailJS configuration - will be loaded asynchronously
    this.config = {
      serviceId: '', // Will be loaded from .env
      templateId: '', // Will be loaded from .env
      customerTemplateId: '', // Will be loaded from .env
      publicKey: '', // Will be loaded from .env
    };

    this.initialized = false;
    this.configLoaded = false;

    // Security integration
    this.inputValidator = window.inputValidator;
    this.securityManager = window.securityManager;

    this.init();
  }

  async loadConfig() {
    if (this.configLoaded) return;
    
    try {
      const envConfig = await window.envConfig.load();
      this.config = {
        serviceId: envConfig.EMAILJS_SERVICE_ID,
        templateId: envConfig.EMAILJS_TEMPLATE_ID_ADMIN,
        customerTemplateId: envConfig.EMAILJS_TEMPLATE_ID_CUSTOMER,
        publicKey: envConfig.EMAILJS_PUBLIC_KEY,
      };
      this.configLoaded = true;
      console.log('Email service configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load email service configuration:', error);
      throw error;
    }
  }

  async init() {
    try {
      await this.loadConfig();
      await this.initializeEmailJS();
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async initializeEmailJS() {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded');
    }
    
    if (typeof emailjs !== "undefined") {
      emailjs.init(this.config.publicKey);
      this.initialized = true;
      console.log("EmailJS initialized successfully");
    } else {
      console.warn("EmailJS not loaded. Email functionality will be disabled.");
    }
  }

  async sendOrderNotification(orderData) {
    if (!this.initialized) {
      console.warn("EmailJS not initialized. Cannot send email.");
      return { success: false, error: "Email service not available" };
    }

    // Use more lenient validation for admin notifications
    if (!this.validateOrderDataForAdmin(orderData)) {
      return {
        success: false,
        error: "Invalid order data for admin notification",
      };
    }

    try {
      // Format the order data for the email template
      const emailParams = this.formatOrderForEmail(orderData);

      console.log(" Sending ADMIN notification with params:", {
        serviceId: this.config.serviceId,
        templateId: this.config.templateId,
        recipient: emailParams.customer_email,
        orderId: emailParams.order_id,
      });

      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        emailParams,
      );

      console.log(" Admin order notification sent successfully:", response);
      return { success: true, response };
    } catch (error) {
      console.error(" Failed to send admin order notification:", error);
      console.error("Template ID used:", this.config.templateId);
      console.error("Service ID used:", this.config.serviceId);
      return { success: false, error: error.message || error };
    }
  }

  async sendCustomerConfirmation(orderData) {
    if (!this.initialized) {
      console.warn(
        "EmailJS not initialized. Cannot send customer confirmation.",
      );
      return { success: false, error: "Email service not available" };
    }

    try {
      // Format the order data for customer confirmation using the same format as admin
      const emailParams = this.formatOrderForEmail(orderData);

      console.log(" Sending CUSTOMER confirmation with params:", {
        serviceId: this.config.serviceId,
        templateId: this.config.customerTemplateId,
        recipient: emailParams.customer_email,
        orderId: emailParams.order_id,
      });

      // Use the customer-specific template
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.customerTemplateId, // Use customer template ID
        emailParams,
      );

      console.log(" Customer confirmation sent successfully:", response);
      return { success: true, response };
    } catch (error) {
      console.error(" Failed to send customer confirmation:", error);
      console.error(
        "Customer template ID used:",
        this.config.customerTemplateId,
      );
      console.error("Service ID used:", this.config.serviceId);
      return { success: false, error: error.message || error };
    }
  }

  validateOrderData(orderData) {
    if (!orderData) {
      console.error(" No order data provided to email service");
      return false;
    }

    // Validate customer information - but be more lenient for admin notifications
    if (orderData.customerInfo) {
      const customerValidation = this.inputValidator?.validateForm(
        orderData.customerInfo,
      );
      if (customerValidation && !customerValidation.isValid) {
        console.warn(
          " Customer validation warnings (proceeding anyway):",
          customerValidation.errors,
        );
        // Don't block admin emails for minor validation issues
        // return false;
      }
    }

    // Check for required fields
    const requiredFields = ["items", "summary"];
    for (let field of requiredFields) {
      if (!orderData[field]) {
        console.error(` Missing required field in order data: ${field}`);
        return false;
      }
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error(" Order must contain at least one item");
      return false;
    }

    // Validate each item
    for (let item of orderData.items) {
      if (!item.service || !item.pricing) {
        console.error(" Invalid item structure in order");
        return false;
      }
    }

    return true;
  }

  // More lenient validation for admin notifications
  validateOrderDataForAdmin(orderData) {
    if (!orderData) {
      console.error(" No order data provided to email service");
      return false;
    }

    // Don't validate customer info for admin emails - just check required fields
    const requiredFields = ["items", "summary"];
    for (let field of requiredFields) {
      if (!orderData[field]) {
        console.error(` Missing required field in order data: ${field}`);
        return false;
      }
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error(" Order must contain at least one item");
      return false;
    }

    // Basic item validation
    for (let item of orderData.items) {
      if (!item.pricing) {
        console.error(" Invalid item structure in order - missing pricing");
        return false;
      }
    }

    return true;
  }

  formatOrderForEmail(orderData) {
    // Format cart items into simple text for email
    const itemsList = orderData.items
      .map((item, index) => {
        let itemText = `Service ${index + 1}: ${item.service?.name || item.serviceName || "Unknown Service"}
- Base Price: $${item.pricing.basePrice}
- Total: $${item.pricing.totalPrice}`;

        // Add project description if exists
        if (item.projectDescription) {
          itemText += `\n- Description: ${item.projectDescription}`;
        }

        // Add feature adjustments
        if (item.featureAdjustments && item.featureAdjustments.length > 0) {
          const requiredFeatures = item.featureAdjustments.filter(
            (f) => f.type === "required" && !f.removed,
          );
          const removedFeatures = item.featureAdjustments.filter(
            (f) => f.removed,
          );
          const flexibleFeatures = item.featureAdjustments.filter(
            (f) => f.type === "flexible",
          );

          if (requiredFeatures.length > 0) {
            itemText += `\n- INCLUDED Features: ${requiredFeatures.map((f) => f.name).join(", ")}`;
          }

          if (flexibleFeatures.length > 0) {
            itemText += `\n- Customizable Features: ${flexibleFeatures.map((f) => `${f.name} (${f.quantity || f.defaultQuantity})`).join(", ")}`;
          }

          if (removedFeatures.length > 0) {
            itemText += `\n- REMOVED Features: ${removedFeatures.map((f) => f.name).join(", ")}`;
          }
        }

        // Add packages
        if (item.packages && item.packages.length > 0) {
          itemText += `\n- Package Upgrades: ${item.packages.map((pkg) => `${pkg.name} (+$${pkg.price})`).join(", ")}`;
        }

        // Add add-ons
        if (item.addons && item.addons.length > 0) {
          itemText += `\n- Add-ons: ${item.addons.map((addon) => `${addon.name} (+$${addon.price})`).join(", ")}`;
        }

        return itemText;
      })
      .join("\n\n");

    // Format the complete email parameters with sanitization
    const sanitizedData = {
      order_id: this.sanitizeText(orderData.orderId),
      order_date: new Date(orderData.timestamp).toLocaleString(),
      customer_name: this.sanitizeText(
        orderData.customerInfo?.name || "Not provided",
      ),
      customer_email: this.sanitizeEmail(
        orderData.customerInfo?.email || "Not provided",
      ),
      customer_phone: this.sanitizeText(
        orderData.customerInfo?.phone || "Not provided",
      ),
      customer_preferred_contact: this.sanitizeText(
        orderData.customerInfo?.preferredContact || "Email",
      ),
      items_list: this.sanitizeText(itemsList),
      order_notes: this.sanitizeText(orderData.notes || "No additional notes", {
        maxLength: 500,
      }),
      subtotal: `$${orderData.summary.subtotal.toFixed(2)}`,
      tax: `$${orderData.summary.tax.toFixed(2)}`,
      total: `$${orderData.summary.total.toFixed(2)}`,
      payment_method: this.sanitizeText(
        orderData.paymentInfo?.paymentMethod === "paypal"
          ? "PayPal"
          : orderData.paymentInfo?.paymentMethod === "bitcoin"
            ? "Bitcoin"
            : orderData.paymentInfo?.paymentMethod === "manual"
              ? "Manual Payment (To be arranged)"
              : "Manual Payment (To be arranged)",
      ),
      transaction_id: this.sanitizeText(
        orderData.paymentInfo?.transactionId || "Not available",
      ),
      payment_date: orderData.paymentInfo?.paidAt
        ? new Date(orderData.paymentInfo.paidAt).toLocaleString()
        : "Not available",
      order_data_json: JSON.stringify(
        this.sanitizeOrderDataForEmail(orderData),
        null,
        2,
      ),
    };

    return sanitizedData;
  }

  sanitizeText(text, options = {}) {
    if (this.inputValidator) {
      return this.inputValidator.sanitizeText(text, {
        allowHTML: false,
        allowLineBreaks: true,
        maxLength: options.maxLength || 1000,
        trimWhitespace: true,
        removeProfanity: true,
        ...options,
      });
    }
    // Fallback basic sanitization
    return String(text)
      .replace(/[<>\"'&]/g, "")
      .substring(0, options.maxLength || 1000);
  }

  sanitizeEmail(email) {
    if (this.inputValidator) {
      return this.inputValidator.sanitizeEmail(email);
    }
    // Fallback basic email sanitization
    return String(email).toLowerCase().trim();
  }

  sanitizeOrderDataForEmail(orderData) {
    // Create a clean copy of order data for JSON export (removing sensitive fields)
    const cleanData = { ...orderData };

    // Remove potentially sensitive information
    if (cleanData.customerInfo && cleanData.customerInfo.phone) {
      cleanData.customerInfo.phone = cleanData.customerInfo.phone.replace(
        /\d/g,
        "*",
      );
    }

    return cleanData;
  }

  // Test email functionality
  async testEmail() {
    const testOrder = {
      orderId: "TEST-" + Date.now(),
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: "Test Customer",
        email: "test@example.com",
        phone: "555-0123",
        preferredContact: "email",
      },
      items: [
        {
          service: {
            name: "Test Service",
            basePrice: 100,
          },
          pricing: {
            basePrice: 100,
            totalPrice: 120,
          },
          packages: [{ name: "Test Package", price: 20 }],
          addons: [],
          projectDescription: "This is a test order",
        },
      ],
      notes: "Test order notes",
      summary: {
        subtotal: 120,
        tax: 10.5,
        total: 130.5,
      },
    };

    return await this.sendOrderNotification(testOrder);
  }

  // Test admin email specifically
  async testAdminEmail() {
    console.log(" Testing admin email notification...");
    return await this.testEmail();
  }

  // Test customer email specifically
  async testCustomerEmail() {
    console.log(" Testing customer email confirmation...");
    const testOrder = {
      orderId: "TEST-CUSTOMER-" + Date.now(),
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: "Test Customer",
        email: "test@example.com",
        phone: "555-0123",
        preferredContact: "email",
      },
      items: [
        {
          service: {
            name: "Test Service",
            basePrice: 100,
          },
          pricing: {
            basePrice: 100,
            totalPrice: 120,
          },
          packages: [{ name: "Test Package", price: 20 }],
          addons: [],
          projectDescription: "This is a test order",
        },
      ],
      notes: "Test order notes",
      summary: {
        subtotal: 120,
        tax: 10.5,
        total: 130.5,
      },
    };

    return await this.sendCustomerConfirmation(testOrder);
  }

  // Add a global function to test email from browser console
  static async runEmailTest() {
    console.log("Running email test...");
    const emailService = new EmailService();

    // Wait a moment for initialization
    setTimeout(async () => {
      const result = await emailService.testEmail();
      if (result.success) {
        console.log(" Test email sent successfully!");
        alert(
          "Test email sent successfully! Check your inbox at triet_processor@proton.me",
        );
      } else {
        console.error(" Test email failed:", result.error);
        alert("Test email failed. Check console for details.");
      }
    }, 1000);
  }
}

// Export for use in other scripts
window.EmailService = EmailService;

// Add global test functions for debugging
window.testAdminEmail = async function () {
  console.log(" Running admin email test...");
  const emailService = new EmailService();

  // Wait for initialization
  setTimeout(async () => {
    const result = await emailService.testAdminEmail();
    if (result.success) {
      console.log(" Admin test email sent successfully!");
      alert("Admin test email sent successfully! Check your admin inbox.");
    } else {
      console.error(" Admin test email failed:", result.error);
      alert("Admin test email failed. Check console for details.");
    }
  }, 1000);
};

window.testCustomerEmail = async function () {
  console.log(" Running customer email test...");
  const emailService = new EmailService();

  // Wait for initialization
  setTimeout(async () => {
    const result = await emailService.testCustomerEmail();
    if (result.success) {
      console.log(" Customer test email sent successfully!");
      alert(
        "Customer test email sent successfully! Check your customer inbox.",
      );
    } else {
      console.error(" Customer test email failed:", result.error);
      alert("Customer test email failed. Check console for details.");
    }
  }, 1000);
};

window.testBothEmails = async function () {
  console.log(" Running both email tests...");
  const emailService = new EmailService();

  // Wait for initialization
  setTimeout(async () => {
    console.log("Testing admin email...");
    const adminResult = await emailService.testAdminEmail();

    console.log("Testing customer email...");
    const customerResult = await emailService.testCustomerEmail();

    console.log("Results:");
    console.log(
      "Admin:",
      adminResult.success ? " Success" : " Failed",
      adminResult.error || "",
    );
    console.log(
      "Customer:",
      customerResult.success ? " Success" : " Failed",
      customerResult.error || "",
    );

    if (adminResult.success && customerResult.success) {
      alert("Both test emails sent successfully!");
    } else {
      alert(
        `Email test results:\nAdmin: ${adminResult.success ? "Success" : "Failed"}\nCustomer: ${customerResult.success ? "Success" : "Failed"}\n\nCheck console for details.`,
      );
    }
  }, 1000);
};
