// Secure Storage Manager - Replaces direct localStorage usage
class SecureStorage {
  constructor() {
    this.prefix = "triet_";
    this.sensitiveKeys = [
      "payment",
      "stripe",
      "paypal",
      "card",
      "cvv",
      "billing",
      "personal",
      "email",
      "phone",
    ];
  }

  // Check if a key contains sensitive data
  isSensitive(key) {
    const lowerKey = key.toLowerCase();
    return this.sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));
  }

  // Sanitize data before storing
  sanitizeData(data) {
    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };

      // Remove sensitive fields
      const sensitiveFields = [
        "cvv",
        "cardNumber",
        "expiryDate",
        "billingAddress",
        "fullCardNumber",
        "cardDetails",
        "paymentMethod",
      ];

      sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });

      return sanitized;
    }
    return data;
  }

  // Safe localStorage setItem
  setItem(key, value, options = {}) {
    try {
      const fullKey = this.prefix + key;
      let dataToStore = value;

      // Check if this is sensitive data
      if (this.isSensitive(key) && !options.allowSensitive) {
        console.warn(
          `Attempt to store sensitive data with key: ${key}. Data will be sanitized.`,
        );
        dataToStore = this.sanitizeData(value);
      }

      // Use sessionStorage for sensitive data instead of localStorage
      if (this.isSensitive(key) || options.sessionOnly) {
        sessionStorage.setItem(
          fullKey,
          typeof dataToStore === "object"
            ? JSON.stringify(dataToStore)
            : dataToStore,
        );
      } else {
        localStorage.setItem(
          fullKey,
          typeof dataToStore === "object"
            ? JSON.stringify(dataToStore)
            : dataToStore,
        );
      }
    } catch (error) {
      console.error("Failed to store data:", error);
    }
  }

  // Safe localStorage getItem
  getItem(key, fromSession = false) {
    try {
      const fullKey = this.prefix + key;
      const storage =
        fromSession || this.isSensitive(key) ? sessionStorage : localStorage;
      const item = storage.getItem(fullKey);

      if (!item) return null;

      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error("Failed to retrieve data:", error);
      return null;
    }
  }

  // Remove item
  removeItem(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      sessionStorage.removeItem(fullKey);
    } catch (error) {
      console.error("Failed to remove data:", error);
    }
  }

  // Clear all app data
  clearAll() {
    try {
      // Clear localStorage items with our prefix
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage items with our prefix
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  // Get sanitized cart data (remove sensitive info)
  getSanitizedCart() {
    const cart = this.getItem("serviceCart");
    if (!cart) return [];

    return cart.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      category: item.category,
      // Remove any sensitive customization data
      customization: item.customization
        ? {
            description: item.customization.description
              ? item.customization.description.substring(0, 100) + "..."
              : undefined,
          }
        : undefined,
    }));
  }
}

// Create global instance
window.secureStorage = new SecureStorage();

// Provide compatibility methods
window.secureStorage.localStorage = {
  setItem: (key, value) => window.secureStorage.setItem(key, value),
  getItem: (key) => window.secureStorage.getItem(key),
  removeItem: (key) => window.secureStorage.removeItem(key),
};
