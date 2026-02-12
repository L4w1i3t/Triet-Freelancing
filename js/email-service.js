// Email Service for Order Notifications
class EmailService {
  constructor() {
    // EmailJS configuration - will be loaded asynchronously
    this.config = {
      serviceId: "", // Will be loaded from .env
      templateId: "", // Will be loaded from .env
      customerTemplateId: "", // Will be loaded from .env
      publicKey: "", // Will be loaded from .env
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
      console.log("Email service configuration loaded successfully");
    } catch (error) {
      console.error("Failed to load email service configuration:", error);
      throw error;
    }
  }

  async init() {
    try {
      await this.loadConfig();
      await this.initializeEmailJS();
    } catch (error) {
      console.error("Failed to initialize email service:", error);
    }
  }

  async initializeEmailJS() {
    if (!this.configLoaded) {
      throw new Error("Configuration not loaded");
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

  // Validation for admin notifications
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
        orderData.paymentInfo?.paymentMethod === "stripe"
          ? "Stripe"
          : orderData.paymentInfo?.paymentMethod === "bitcoin"
            ? "Bitcoin"
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

}

// Export for use in other scripts
window.EmailService = EmailService;
