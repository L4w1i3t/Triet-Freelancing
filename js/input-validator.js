// =======================================================
// INPUT VALIDATOR - Advanced Input Validation & Sanitization
// =======================================================

class InputValidator {
  constructor() {
    this.patterns = {
      email:
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      name: /^[a-zA-Z\s\-\'\.]+$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      creditCard:
        /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
      cvv: /^[0-9]{3,4}$/,
      postalCode: /^[A-Za-z0-9\s\-]{3,10}$/,
    };

    this.dangerousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,
      /<link[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /window\./gi,
      /document\./gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi,
    ];

    this.profanityList = [];
    this.loadProfanityList();
  }

  async loadProfanityList() {
    try {
      const response = await fetch("/data/profanity.json");
      const data = await response.json();
      this.profanityList = data.words || [];
      console.log(" Profanity filter loaded");
    } catch (error) {
      console.warn("Could not load profanity list:", error);
      // Fallback basic profanity list
      this.profanityList = ["spam", "scam", "fake", "bot"];
    }
  }

  // ===============================================
  // BASIC VALIDATION METHODS
  // ===============================================

  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    return this.patterns.email.test(email.trim()) && email.length <= 254;
  }

  isValidPhone(phone) {
    if (!phone || typeof phone !== "string") return false;
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    return (
      this.patterns.phone.test(cleaned) &&
      cleaned.length >= 7 &&
      cleaned.length <= 15
    );
  }

  isValidName(name) {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();
    return (
      this.patterns.name.test(trimmed) &&
      trimmed.length >= 2 &&
      trimmed.length <= 50 &&
      !this.containsProfanity(trimmed)
    );
  }

  isValidURL(url) {
    if (!url || typeof url !== "string") return false;
    return this.patterns.url.test(url.trim());
  }

  isValidCreditCard(cardNumber) {
    if (!cardNumber || typeof cardNumber !== "string") return false;
    const cleaned = cardNumber.replace(/[\s\-]/g, "");
    return this.patterns.creditCard.test(cleaned) && this.luhnCheck(cleaned);
  }

  isValidCVV(cvv) {
    if (!cvv || typeof cvv !== "string") return false;
    return this.patterns.cvv.test(cvv.trim());
  }

  isValidPostalCode(code) {
    if (!code || typeof code !== "string") return false;
    return this.patterns.postalCode.test(code.trim());
  }

  // ===============================================
  // ADVANCED VALIDATION METHODS
  // ===============================================

  luhnCheck(cardNumber) {
    let sum = 0;
    let alternate = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }

      sum += n;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }

  containsProfanity(text) {
    if (!text || typeof text !== "string") return false;
    const lowerText = text.toLowerCase();
    return this.profanityList.some((word) =>
      lowerText.includes(word.toLowerCase()),
    );
  }

  containsDangerousContent(input) {
    if (!input || typeof input !== "string") return false;
    return this.dangerousPatterns.some((pattern) => pattern.test(input));
  }

  // ===============================================
  // SANITIZATION METHODS
  // ===============================================

  sanitizeText(input, options = {}) {
    if (!input || typeof input !== "string") return "";

    const config = {
      allowHTML: false,
      allowLineBreaks: true,
      maxLength: 1000,
      trimWhitespace: true,
      removeProfanity: true,
      ...options,
    };

    let sanitized = input;

    // Trim whitespace if requested
    if (config.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Limit length
    if (config.maxLength && sanitized.length > config.maxLength) {
      sanitized = sanitized.substring(0, config.maxLength);
    }

    // Remove dangerous content
    if (this.containsDangerousContent(sanitized)) {
      sanitized = this.removeDangerousContent(sanitized);
    }

    // Handle HTML
    if (!config.allowHTML) {
      sanitized = this.escapeHTML(sanitized);
    }

    // Handle line breaks
    if (!config.allowLineBreaks) {
      sanitized = sanitized.replace(/[\r\n]/g, " ");
    }

    // Remove profanity if requested
    if (config.removeProfanity) {
      sanitized = this.removeProfanity(sanitized);
    }

    return sanitized;
  }

  escapeHTML(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
  }

  removeDangerousContent(input) {
    let cleaned = input;
    this.dangerousPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, "");
    });
    return cleaned;
  }

  removeProfanity(input) {
    let cleaned = input;
    this.profanityList.forEach((word) => {
      const regex = new RegExp(word, "gi");
      cleaned = cleaned.replace(regex, "*".repeat(word.length));
    });
    return cleaned;
  }

  sanitizeEmail(email) {
    if (!email || typeof email !== "string") return "";
    return email.trim().toLowerCase();
  }

  sanitizePhone(phone) {
    if (!phone || typeof phone !== "string") return "";
    // Keep only digits, spaces, hyphens, parentheses, and plus sign
    return phone.replace(/[^0-9\s\-\(\)\+\.]/g, "");
  }

  sanitizeName(name) {
    if (!name || typeof name !== "string") return "";
    // Keep only letters, spaces, hyphens, apostrophes, and dots
    let sanitized = name.replace(/[^a-zA-Z\s\-\'\.]/g, "");
    // Remove profanity
    sanitized = this.removeProfanity(sanitized);
    return sanitized.trim();
  }

  // ===============================================
  // FORM VALIDATION
  // ===============================================

  validateForm(formData) {
    const errors = [];
    const warnings = [];

    // Validate each field
    Object.keys(formData).forEach((field) => {
      const value = formData[field];
      const validation = this.validateField(field, value);

      if (!validation.isValid) {
        errors.push({
          field,
          message: validation.message,
          code: validation.code,
        });
      }

      if (validation.warnings && validation.warnings.length > 0) {
        warnings.push({
          field,
          warnings: validation.warnings,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: this.sanitizeFormData(formData),
    };
  }

  validateField(fieldName, value) {
    switch (fieldName.toLowerCase()) {
      case "email":
        return this.validateEmailField(value);
      case "phone":
        return this.validatePhoneField(value);
      case "name":
      case "firstname":
      case "lastname":
        return this.validateNameField(value);
      case "message":
      case "description":
        return this.validateTextAreaField(value);
      case "website":
      case "url":
        return this.validateURLField(value);
      case "cardnumber":
        return this.validateCreditCardField(value);
      case "cvv":
        return this.validateCVVField(value);
      case "postalcode":
      case "zipcode":
        return this.validatePostalCodeField(value);
      default:
        return this.validateGenericField(value);
    }
  }

  validateEmailField(email) {
    const warnings = [];

    if (!email) {
      return {
        isValid: false,
        message: "Email is required",
        code: "EMAIL_REQUIRED",
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        isValid: false,
        message: "Please enter a valid email address",
        code: "EMAIL_INVALID",
      };
    }

    // Check for suspicious patterns
    if (this.containsDangerousContent(email)) {
      return {
        isValid: false,
        message: "Email contains invalid characters",
        code: "EMAIL_DANGEROUS",
      };
    }

    // Check for disposable email domains (basic check)
    const disposableDomains = [
      "tempmail.org",
      "10minutemail.com",
      "guerrillamail.com",
    ];
    const domain = email.split("@")[1];
    if (disposableDomains.includes(domain)) {
      warnings.push("Disposable email detected");
    }

    return { isValid: true, warnings };
  }

  validatePhoneField(phone) {
    if (!phone) {
      return {
        isValid: false,
        message: "Phone number is required",
        code: "PHONE_REQUIRED",
      };
    }

    if (!this.isValidPhone(phone)) {
      return {
        isValid: false,
        message: "Please enter a valid phone number",
        code: "PHONE_INVALID",
      };
    }

    return { isValid: true };
  }

  validateNameField(name) {
    const warnings = [];

    if (!name) {
      return {
        isValid: false,
        message: "Name is required",
        code: "NAME_REQUIRED",
      };
    }

    if (!this.isValidName(name)) {
      return {
        isValid: false,
        message: "Please enter a valid name (letters only)",
        code: "NAME_INVALID",
      };
    }

    if (this.containsProfanity(name)) {
      return {
        isValid: false,
        message: "Name contains inappropriate content",
        code: "NAME_PROFANITY",
      };
    }

    // Check for suspicious patterns
    if (this.containsDangerousContent(name)) {
      return {
        isValid: false,
        message: "Name contains invalid characters",
        code: "NAME_DANGEROUS",
      };
    }

    return { isValid: true, warnings };
  }

  validateTextAreaField(text) {
    const warnings = [];

    if (!text) {
      return {
        isValid: false,
        message: "This field is required",
        code: "TEXT_REQUIRED",
      };
    }

    if (text.length < 10) {
      return {
        isValid: false,
        message: "Please provide more details (minimum 10 characters)",
        code: "TEXT_TOO_SHORT",
      };
    }

    if (text.length > 5000) {
      return {
        isValid: false,
        message: "Text is too long (maximum 5000 characters)",
        code: "TEXT_TOO_LONG",
      };
    }

    if (this.containsDangerousContent(text)) {
      return {
        isValid: false,
        message: "Text contains invalid content",
        code: "TEXT_DANGEROUS",
      };
    }

    if (this.containsProfanity(text)) {
      warnings.push("Text contains potentially inappropriate content");
    }

    return { isValid: true, warnings };
  }

  validateURLField(url) {
    if (!url) {
      return { isValid: true }; // URL fields are usually optional
    }

    if (!this.isValidURL(url)) {
      return {
        isValid: false,
        message: "Please enter a valid URL",
        code: "URL_INVALID",
      };
    }

    return { isValid: true };
  }

  validateCreditCardField(cardNumber) {
    if (!cardNumber) {
      return {
        isValid: false,
        message: "Card number is required",
        code: "CARD_REQUIRED",
      };
    }

    if (!this.isValidCreditCard(cardNumber)) {
      return {
        isValid: false,
        message: "Please enter a valid card number",
        code: "CARD_INVALID",
      };
    }

    return { isValid: true };
  }

  validateCVVField(cvv) {
    if (!cvv) {
      return {
        isValid: false,
        message: "CVV is required",
        code: "CVV_REQUIRED",
      };
    }

    if (!this.isValidCVV(cvv)) {
      return {
        isValid: false,
        message: "Please enter a valid CVV",
        code: "CVV_INVALID",
      };
    }

    return { isValid: true };
  }

  validatePostalCodeField(code) {
    if (!code) {
      return {
        isValid: false,
        message: "Postal code is required",
        code: "POSTAL_REQUIRED",
      };
    }

    if (!this.isValidPostalCode(code)) {
      return {
        isValid: false,
        message: "Please enter a valid postal code",
        code: "POSTAL_INVALID",
      };
    }

    return { isValid: true };
  }

  validateGenericField(value) {
    if (!value) {
      return {
        isValid: false,
        message: "This field is required",
        code: "FIELD_REQUIRED",
      };
    }

    if (this.containsDangerousContent(value)) {
      return {
        isValid: false,
        message: "Field contains invalid content",
        code: "FIELD_DANGEROUS",
      };
    }

    return { isValid: true };
  }

  // ===============================================
  // SANITIZATION HELPERS
  // ===============================================

  sanitizeFormData(formData) {
    const sanitized = {};

    Object.keys(formData).forEach((field) => {
      const value = formData[field];

      switch (field.toLowerCase()) {
        case "email":
          sanitized[field] = this.sanitizeEmail(value);
          break;
        case "phone":
          sanitized[field] = this.sanitizePhone(value);
          break;
        case "name":
        case "firstname":
        case "lastname":
          sanitized[field] = this.sanitizeName(value);
          break;
        case "message":
        case "description":
          sanitized[field] = this.sanitizeText(value, {
            allowLineBreaks: true,
            maxLength: 5000,
            removeProfanity: true,
          });
          break;
        default:
          sanitized[field] = this.sanitizeText(value);
      }
    });

    return sanitized;
  }

  // ===============================================
  // REAL-TIME VALIDATION
  // ===============================================

  setupRealTimeValidation(form) {
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      // Add validation on blur
      input.addEventListener("blur", (e) => {
        this.validateAndDisplayErrors(e.target);
      });

      // Add sanitization on input
      input.addEventListener("input", (e) => {
        this.sanitizeInputValue(e.target);
      });

      // Prevent dangerous content on paste
      input.addEventListener("paste", (e) => {
        setTimeout(() => {
          this.sanitizeInputValue(e.target);
          this.validateAndDisplayErrors(e.target);
        }, 0);
      });
    });
  }

  validateAndDisplayErrors(input) {
    const fieldName = input.name || input.id;
    const value = input.value;
    const validation = this.validateField(fieldName, value);

    // Remove existing error messages
    this.removeErrorMessage(input);

    if (!validation.isValid) {
      this.showFieldError(input, validation.message);
      input.classList.add("invalid");
    } else {
      input.classList.remove("invalid");
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          this.showFieldWarning(input, warning);
        });
      }
    }
  }

  sanitizeInputValue(input) {
    const fieldName = input.name || input.id;
    const originalValue = input.value;
    let sanitizedValue;

    switch (fieldName.toLowerCase()) {
      case "email":
        sanitizedValue = this.sanitizeEmail(originalValue);
        break;
      case "phone":
        sanitizedValue = this.sanitizePhone(originalValue);
        break;
      case "name":
      case "firstname":
      case "lastname":
        sanitizedValue = this.sanitizeName(originalValue);
        break;
      default:
        sanitizedValue = this.sanitizeText(originalValue, {
          allowHTML: false,
          maxLength: parseInt(input.maxLength) || 1000,
        });
    }

    if (originalValue !== sanitizedValue) {
      input.value = sanitizedValue;
      this.showSanitizationWarning(input);
    }
  }

  showFieldError(input, message) {
    const error = document.createElement("div");
    error.className = "field-error";
    error.textContent = message;
    error.style.cssText = `
      color: #ff4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    `;

    input.parentNode.appendChild(error);
  }

  showFieldWarning(input, message) {
    const warning = document.createElement("div");
    warning.className = "field-warning";
    warning.textContent = ` ${message}`;
    warning.style.cssText = `
      color: #ffaa00;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    `;

    input.parentNode.appendChild(warning);
  }

  showSanitizationWarning(input) {
    // Brief visual feedback that content was sanitized
    input.style.borderColor = "#ffaa00";
    setTimeout(() => {
      input.style.borderColor = "";
    }, 1000);
  }

  removeErrorMessage(input) {
    const existing = input.parentNode.querySelectorAll(
      ".field-error, .field-warning",
    );
    existing.forEach((el) => el.remove());
  }
}

// Initialize Input Validator
window.InputValidator = InputValidator;

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.inputValidator = new InputValidator();
  });
} else {
  window.inputValidator = new InputValidator();
}
