// Enhanced Service Template JavaScript - Flexible Pricing Calculator
class EnhancedServiceCalculator {
  constructor() {
    this.selectedAddons = new Map(); // Map<addonId, quantity>
    this.featureAdjustments = new Map(); // Map<featureId, value>
    this.basePrice = 200; // Default base price
    this.featureAdjustmentsPrice = 0;
    this.addonsPrice = 0;
    this.totalPrice = 0;

    this.init();
  }

  init() {
    this.extractBasePrice();
    this.setupEventListeners();
    this.setupProjectDescription();
    this.calculateTotal();
  }

  extractBasePrice() {
    // Extract base price from the base service item
    const basePriceElement = document.querySelector(
      ".base-item-header .item-price",
    );
    if (basePriceElement) {
      const priceText = basePriceElement.textContent;
      const match = priceText.match(/\$(\d+)/);
      // Keep the base price as stated - included features are part of this price
      this.basePrice = match ? parseInt(match[1]) : 80;
    }

    // Update base price display
    const basePriceDisplay = document.getElementById("basePrice");
    if (basePriceDisplay) {
      basePriceDisplay.textContent = `$${this.basePrice}`;
    }
  }

  setupEventListeners() {
    this.setupFlexibleFeatureListeners();
    this.setupToggleFeatureListeners();
    this.setupAddonListeners();
    this.setupQuantityControls();
    this.setupAddToCartListener();
  }

  setupFlexibleFeatureListeners() {
    // Handle flexible features with quantity controls (like pages)
    document.querySelectorAll(".flexible-feature").forEach((item) => {
      const featureId = item.dataset.featureId;
      const quantityField = item.querySelector(".quantity-field");
      const minQuantity = parseInt(item.dataset.minQuantity) || 1;
      const defaultQuantity = parseInt(item.dataset.defaultQuantity) || 1;
      const pricePerUnit = parseInt(item.dataset.pricePerUnit) || 0;
      const maxQuantity = parseInt(quantityField?.getAttribute("max")) || 20;

      // Initialize with default quantity
      this.featureAdjustments.set(featureId, defaultQuantity);

      // Update quantity helper function
      const updateQuantity = (newValue) => {
        const clampedValue = Math.max(
          minQuantity,
          Math.min(newValue, maxQuantity),
        );
        quantityField.value = clampedValue;
        this.featureAdjustments.set(featureId, clampedValue);
        this.updateFeatureTotal(featureId, clampedValue, pricePerUnit);
        this.calculateTotal();
        return clampedValue;
      };

      // Set up custom quantity controls
      const plusBtn = item.querySelector(".quantity-btn.plus");
      const minusBtn = item.querySelector(".quantity-btn.minus");

      if (plusBtn) {
        plusBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentValue = parseInt(quantityField.value) || defaultQuantity;
          updateQuantity(currentValue + 1);
        });
      }

      if (minusBtn) {
        minusBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentValue = parseInt(quantityField.value) || defaultQuantity;
          updateQuantity(currentValue - 1);
        });
      }

      // Handle direct input and native spin buttons
      if (quantityField) {
        quantityField.addEventListener("input", (e) => {
          const value = parseInt(e.target.value) || defaultQuantity;
          updateQuantity(value);
        });

        quantityField.addEventListener("change", (e) => {
          const value = parseInt(e.target.value) || defaultQuantity;
          updateQuantity(value);
        });
      }

      // Initialize display
      this.updateFeatureTotal(featureId, defaultQuantity, pricePerUnit);
    });
  }

  updateFeatureTotal(featureId, quantity, pricePerUnit) {
    const totalElement = document.getElementById(`${featureId}-total`);
    if (totalElement) {
      totalElement.textContent = (quantity * pricePerUnit).toString();
    }
  }

  setupToggleFeatureListeners() {
    // Handle toggle features (can be included or excluded)
    document.querySelectorAll(".toggle-feature").forEach((item) => {
      if (item.dataset.required === "true") return; // Skip required features

      item.addEventListener("click", () => {
        const featureId = item.dataset.featureId;
        const price = parseInt(item.dataset.price) || 0;

        if (this.featureAdjustments.has(featureId)) {
          // Feature is currently removed, so include it back
          this.featureAdjustments.delete(featureId);
          item.classList.remove("removed");
          item.querySelector(".feature-checkbox").className =
            "fas fa-check-square feature-checkbox checked";
        } else {
          // Feature is currently included, so remove it
          // For zero-price features, we still track removal with 0 adjustment
          // For paid features, we track removal with negative adjustment
          this.featureAdjustments.set(featureId, -price);
          item.classList.add("removed");
          item.querySelector(".feature-checkbox").className =
            "fas fa-square feature-checkbox";
        }

        this.calculateTotal();
      });
    });
  }

  setupAddonListeners() {
    document.querySelectorAll(".addon-item").forEach((item) => {
      const header = item.querySelector(".addon-header");
      if (!header) return;

      header.addEventListener("click", () => {
        const addonId = item.dataset.addonId;
        const maxQuantity = parseInt(item.dataset.maxQuantity) || 1;

        if (this.selectedAddons.has(addonId)) {
          // Remove addon
          this.selectedAddons.delete(addonId);
          item.classList.remove("selected");
          item.querySelector(".addon-checkbox").className =
            "fas fa-square addon-checkbox";

          // Hide quantity controls
          const quantityControls = item.querySelector(".quantity-controls");
          if (quantityControls) {
            quantityControls.style.display = "none";
          }
        } else {
          // Add addon
          this.selectedAddons.set(addonId, 1);
          item.classList.add("selected");
          item.querySelector(".addon-checkbox").className =
            "fas fa-check-square addon-checkbox";

          // Show quantity controls if max quantity > 1
          const quantityControls = item.querySelector(".quantity-controls");
          if (quantityControls && maxQuantity > 1) {
            quantityControls.style.display = "block";
            const quantityField =
              quantityControls.querySelector(".quantity-field");
            if (quantityField) {
              quantityField.value = 1;
            }
          }
        }

        this.calculateTotal();
      });
    });
  }

  setupQuantityControls() {
    // Plus and minus buttons - only for addon items
    document.querySelectorAll(".addon-item .quantity-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent addon toggle

        const targetId = btn.dataset.target;
        const quantityField = document.getElementById(targetId);
        if (!quantityField) return;

        const addonItem = btn.closest(".addon-item");
        const addonId = addonItem?.dataset.addonId;
        const maxQuantity = parseInt(addonItem?.dataset.maxQuantity) || 1;

        let currentValue = parseInt(quantityField.value) || 1;

        if (btn.classList.contains("plus")) {
          if (currentValue < maxQuantity) {
            currentValue++;
          }
        } else if (btn.classList.contains("minus")) {
          if (currentValue > 1) {
            currentValue--;
          }
        }

        quantityField.value = currentValue;

        if (addonId && this.selectedAddons.has(addonId)) {
          this.selectedAddons.set(addonId, currentValue);
          this.calculateTotal();
        }
      });
    });

    // Direct input - only for addon items
    document
      .querySelectorAll(".addon-item .quantity-field")
      .forEach((field) => {
        field.addEventListener("change", (e) => {
          const addonItem = field.closest(".addon-item");
          const addonId = addonItem?.dataset.addonId;
          const maxQuantity = parseInt(addonItem?.dataset.maxQuantity) || 1;

          let value = parseInt(field.value) || 1;
          value = Math.max(1, Math.min(value, maxQuantity));
          field.value = value;

          if (addonId && this.selectedAddons.has(addonId)) {
            this.selectedAddons.set(addonId, value);
            this.calculateTotal();
          }
        });
      });
  }

  setupAddToCartListener() {
    const addToCartBtn = document.getElementById("addToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        this.handleAddToCart();
      });
    }
  }

  calculateTotal() {
    // Calculate feature adjustments (flexible features and removed toggle features)
    this.featureAdjustmentsPrice = 0;
    this.featureAdjustments.forEach((value, featureId) => {
      const featureElement = document.querySelector(
        `[data-feature-id="${featureId}"]`,
      );
      if (featureElement) {
        if (featureElement.classList.contains("flexible-feature")) {
          // For flexible features, calculate based on quantity vs default
          const defaultQuantity =
            parseInt(featureElement.dataset.defaultQuantity) || 1;
          const pricePerUnit =
            parseInt(featureElement.dataset.pricePerUnit) || 0;
          const adjustment = (value - defaultQuantity) * pricePerUnit;
          this.featureAdjustmentsPrice += adjustment;
        } else {
          // For toggle features, use the value directly (negative for removed)
          this.featureAdjustmentsPrice += value;
        }
      }
    });

    // Calculate addons total
    this.addonsPrice = 0;
    this.selectedAddons.forEach((quantity, addonId) => {
      const addonElement = document.querySelector(
        `[data-addon-id="${addonId}"]`,
      );
      if (addonElement) {
        const price = parseInt(addonElement.dataset.price);
        this.addonsPrice += price * quantity;
      }
    });

    // Calculate final total
    this.totalPrice =
      this.basePrice + this.featureAdjustmentsPrice + this.addonsPrice;

    this.updatePriceDisplay();
    this.updatePackageDisplay();
  }

  updatePriceDisplay() {
    // Update feature adjustments display
    const adjustedFeaturesLine = document.getElementById(
      "adjustedFeaturesLine",
    );
    const adjustedFeaturesPrice = document.getElementById(
      "adjustedFeaturesPrice",
    );

    if (this.featureAdjustmentsPrice !== 0) {
      adjustedFeaturesLine.style.display = "flex";
      const sign = this.featureAdjustmentsPrice > 0 ? "+" : "";
      adjustedFeaturesPrice.textContent = `${sign}$${this.featureAdjustmentsPrice}`;
    } else {
      adjustedFeaturesLine.style.display = "none";
    }

    // Update addons display
    const addonsLine = document.getElementById("addonsLine");
    const addonsPrice = document.getElementById("addonsPrice");

    if (this.addonsPrice > 0) {
      addonsLine.style.display = "flex";
      addonsPrice.textContent = `+$${this.addonsPrice}`;
    } else {
      addonsLine.style.display = "none";
    }

    // Update total
    const totalPriceElement = document.getElementById("totalPrice");
    if (totalPriceElement) {
      totalPriceElement.textContent = `$${this.totalPrice}`;
    }
  }

  updatePackageDisplay() {
    const packageItems = document.getElementById("packageItems");
    if (!packageItems) return;

    packageItems.innerHTML = "";

    // Add flexible features (with quantity adjustments)
    document.querySelectorAll(".flexible-feature").forEach((element) => {
      const featureId = element.dataset.featureId;
      const featureName =
        element.querySelector(".feature-name")?.textContent ||
        "Unknown Feature";
      const defaultQuantity = parseInt(element.dataset.defaultQuantity) || 1;
      const currentQuantity =
        this.featureAdjustments.get(featureId) || defaultQuantity;

      const li = document.createElement("li");
      li.textContent = `${currentQuantity} ${featureName}`;
      packageItems.appendChild(li);
    });

    // Add toggle features (show all - included and removed)
    document.querySelectorAll(".toggle-feature").forEach((element) => {
      const featureId = element.dataset.featureId;
      const featureName =
        element.querySelector(".feature-name")?.textContent ||
        "Unknown Feature";
      const isRemoved = this.featureAdjustments.has(featureId);

      const li = document.createElement("li");
      if (isRemoved) {
        li.className = "removed-feature";
        li.textContent = `${featureName} (removed)`;
      } else {
        li.textContent = featureName;
      }
      packageItems.appendChild(li);
    });

    // Add required features
    document.querySelectorAll(".required-feature").forEach((element) => {
      const featureName =
        element.querySelector(".feature-name")?.textContent ||
        "Unknown Feature";
      const li = document.createElement("li");
      li.textContent = featureName;
      packageItems.appendChild(li);
    });

    // Add selected addons
    this.selectedAddons.forEach((quantity, addonId) => {
      const addonElement = document.querySelector(
        `[data-addon-id="${addonId}"]`,
      );
      if (addonElement) {
        const addonName =
          addonElement.querySelector(".addon-name")?.textContent ||
          "Unknown Addon";
        const li = document.createElement("li");
        li.textContent = `${addonName}${quantity > 1 ? ` (×${quantity})` : ""}`;
        packageItems.appendChild(li);
      }
    });
  }

  setupProjectDescription() {
    const descriptionField = document.getElementById("projectDescription");
    const descriptionCount = document.getElementById("descriptionCount");

    if (descriptionField && descriptionCount) {
      // Set character limit
      descriptionField.setAttribute("maxlength", "65535");

      // Load saved description
      const savedDescription = localStorage.getItem("projectDescription");
      if (savedDescription) {
        descriptionField.value = savedDescription;
        this.updateDescriptionCount();
      }

      // Update character count and save description
      descriptionField.addEventListener("input", () => {
        this.updateDescriptionCount();
        this.saveProjectDescription();
      });

      // Initial count update
      this.updateDescriptionCount();
    }
  }

  updateDescriptionCount() {
    const descriptionField = document.getElementById("projectDescription");
    const descriptionCount = document.getElementById("descriptionCount");
    const encouragement = document.querySelector(".description-encouragement");

    if (descriptionField && descriptionCount) {
      const count = descriptionField.value.length;
      const maxLength = 65535;

      // Update count display
      descriptionCount.innerHTML = `${count}<span class="char-separator">/</span><span class="max-chars">${maxLength}</span>`;

      // Update encouragement based on description length
      if (encouragement) {
        if (count === 0) {
          encouragement.textContent = "• Please describe your project";
          encouragement.style.color = "#ef4444";
        } else if (count < 100) {
          encouragement.textContent =
            "• More details help me serve you better!";
          encouragement.style.color = "#f59e0b";
        } else if (count < 300) {
          encouragement.textContent = "• Great! Feel free to add more details";
          encouragement.style.color = "#3b82f6";
        } else if (count > 60000) {
          encouragement.textContent = "• Approaching character limit";
          encouragement.style.color = "#f59e0b";
        } else {
          encouragement.textContent =
            "• Perfect! This will help us create exactly what you need";
          encouragement.style.color = "#10b981";
        }
      }
    }
  }

  saveProjectDescription() {
    const descriptionField = document.getElementById("projectDescription");
    if (descriptionField) {
      localStorage.setItem("projectDescription", descriptionField.value);
    }
  }

  getProjectDescription() {
    return localStorage.getItem("projectDescription") || "";
  }

  generateFeatureAdjustments() {
    const allFeatures = [];

    // Process flexible features (with quantity)
    document.querySelectorAll(".flexible-feature").forEach((element) => {
      const featureId = element.dataset.featureId;
      const featureName =
        element.querySelector(".feature-name")?.textContent || "";
      const defaultQuantity = parseInt(element.dataset.defaultQuantity) || 1;
      const pricePerUnit = parseInt(element.dataset.pricePerUnit) || 0;

      const currentQuantity =
        this.featureAdjustments.get(featureId) || defaultQuantity;
      const adjustment = (currentQuantity - defaultQuantity) * pricePerUnit;

      allFeatures.push({
        id: featureId,
        name: featureName,
        type: "flexible",
        quantity: currentQuantity,
        defaultQuantity: defaultQuantity,
        pricePerUnit: pricePerUnit,
        adjustment: adjustment,
      });
    });

    // Process toggle features (included by default, can be removed)
    document.querySelectorAll(".toggle-feature").forEach((element) => {
      const featureId = element.dataset.featureId;
      const featureName =
        element.querySelector(".feature-name")?.textContent || "";
      const price = parseInt(element.dataset.price) || 0;

      const isRemoved = this.featureAdjustments.has(featureId);
      const adjustment = isRemoved ? this.featureAdjustments.get(featureId) : 0;

      allFeatures.push({
        id: featureId,
        name: featureName,
        type: "toggle",
        removed: isRemoved,
        adjustment: adjustment,
        price: price,
      });
    });

    // Process required features (always included)
    document.querySelectorAll(".required-feature").forEach((element) => {
      const featureId = element.dataset.featureId;
      const featureName =
        element.querySelector(".feature-name")?.textContent || "";

      allFeatures.push({
        id: featureId,
        name: featureName,
        type: "required",
        removed: false,
        adjustment: 0,
      });
    });

    return allFeatures;
  }

  handleAddToCart() {
    const serviceName =
      document.querySelector(".service-title")?.textContent ||
      "Static Website Development";

    const projectDescription = this.getProjectDescription();

    // Validate that project description is provided
    if (!projectDescription.trim()) {
      this.showNotification(
        "Please describe your project before adding to cart",
        "warning",
      );
      document.getElementById("projectDescription")?.focus();
      return;
    }

    const cartData = {
      service: {
        name: serviceName,
        basePrice: this.basePrice,
      },
      projectDescription: projectDescription,
      featureAdjustments: this.generateFeatureAdjustments(),
      addons: Array.from(this.selectedAddons.entries()).map(
        ([addonId, quantity]) => {
          const element = document.querySelector(
            `[data-addon-id="${addonId}"]`,
          );
          return {
            id: addonId,
            name: element?.querySelector(".addon-name")?.textContent || "",
            price: parseInt(element?.dataset.price || 0),
            quantity: quantity,
          };
        },
      ),
      pricing: {
        basePrice: this.basePrice,
        featureAdjustmentsPrice: this.featureAdjustmentsPrice,
        addonsPrice: this.addonsPrice,
        totalPrice: this.totalPrice,
      },
      timestamp: new Date().toISOString(),
    };

    // Store in localStorage for now (can be replaced with actual cart system)
    const cart = JSON.parse(localStorage.getItem("serviceCart") || "[]");
    cart.push(cartData);
    localStorage.setItem("serviceCart", JSON.stringify(cart));

    // Clear the project description after adding to cart
    localStorage.removeItem("projectDescription");
    const descriptionField = document.getElementById("projectDescription");
    if (descriptionField) {
      descriptionField.value = "";
      this.updateDescriptionCount();
    }

    // Show success message
    this.showAddToCartSuccess();
  }

  showAddToCartSuccess() {
    const button = document.getElementById("addToCartBtn");
    if (!button) return;

    const originalText = button.innerHTML;

    button.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
    button.style.background = "linear-gradient(135deg, #00ff88, #00cc66)";
    button.disabled = true;

    // Update cart count if CartManager is available
    if (window.CartManager) {
      CartManager.updateCartCount();
    }

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = "";
      button.disabled = false;
    }, 2000);
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === "success" ? "check" : type === "warning" ? "exclamation-triangle" : "info-circle"}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize the calculator when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new EnhancedServiceCalculator();
});
