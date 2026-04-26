class EmailService {
  constructor() {
    this.endpoint = "/api/send-order-email";
  }

  async sendOrderEmails(orderData) {
    try {
      const csrfToken = window.securityManager?.getCSRFToken?.() || "";
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ orderData }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || "Order email request failed",
          response: result,
        };
      }

      return { success: true, response: result };
    } catch (error) {
      return { success: false, error: error.message || error };
    }
  }

  async sendOrderNotification(orderData) {
    return this.sendOrderEmails(orderData);
  }

  async sendCustomerConfirmation(orderData) {
    return this.sendOrderEmails(orderData);
  }
}

// Export for use in other scripts
window.EmailService = EmailService;
