// Cart Management System
class CartManager {
  constructor() {
    this.cart = [];
    this.taxRate = 0.06; // 6% tax rate (adjust as needed)
    this.init();
  }

  init() {
    this.loadCart();
    this.updateCartCount();
    this.setupEventListeners();
    this.renderCart();
  }

  loadCart() {
    const savedCart = localStorage.getItem("serviceCart");
    this.cart = savedCart ? JSON.parse(savedCart) : [];
  }

  saveCart() {
    localStorage.setItem("serviceCart", JSON.stringify(this.cart));
    this.updateCartCount();
  }

  updateCartCount() {
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      const count = this.cart.length;
      cartCountElement.textContent = count;
      cartCountElement.style.display = count > 0 ? "block" : "none";

      // Store count in localStorage for persistence
      localStorage.setItem("cartCount", count.toString());
    }
  }

  setupEventListeners() {
    // Clear cart button
    const clearCartBtn = document.getElementById("clearCartBtn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        this.clearCart();
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.handleCheckout();
      });
    }

    // Order notes
    const orderNotes = document.getElementById("orderNotes");
    if (orderNotes) {
      orderNotes.addEventListener("input", (e) => {
        this.updateOrderNotes(e.target.value);
      });
    }
  }

  renderCart() {
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const emptyCart = document.getElementById("emptyCart");

    if (!cartItemsContainer || !emptyCart) return;

    if (this.cart.length === 0) {
      emptyCart.style.display = "block";
      cartItemsContainer.style.display = "none";
      this.updateSummary();
      return;
    }

    emptyCart.style.display = "none";
    cartItemsContainer.style.display = "block";

    cartItemsContainer.innerHTML = "";

    this.cart.forEach((item, index) => {
      const cartItem = this.createCartItemElement(item, index);
      cartItemsContainer.appendChild(cartItem);
    });

    this.updateSummary();
  }

  createCartItemElement(item, index) {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.dataset.index = index;

    const isProduct = this.isProductItem(item);
    const itemName = this.getItemName(item);
    const basePrice = this.getBasePrice(item);
    const totalPrice = this.getTotalPrice(item);
    const timestamp = new Date(item.timestamp).toLocaleDateString();
    const detailTitle = isProduct ? "Delivery:" : "Project Description:";
    const detailContent = isProduct
      ? this.getProductDeliveryText(item)
      : item.projectDescription;
    const packageTitle = isProduct ? "Files Included:" : "Package Includes:";

    cartItem.innerHTML = `
      <div class="cart-item-header">
        <h3 class="service-name">${this.escapeHTML(itemName)}</h3>
        <div class="cart-item-actions">
          <button class="remove-item-btn" data-index="${index}">
            <i class="fas fa-trash"></i>
            Remove
          </button>
        </div>
      </div>

      <div class="cart-item-details">
        <div class="pricing-breakdown">
          <div class="price-line">
            <span>${isProduct ? "Price:" : "Base Service:"}</span>
            <span>$${basePrice.toFixed(2)}</span>
          </div>
          
          ${
            !isProduct &&
            Number(item.pricing?.featureAdjustmentsPrice || 0) !== 0
              ? `
            <div class="price-line">
              <span>Feature Adjustments:</span>
              <span>${item.pricing.featureAdjustmentsPrice > 0 ? "+" : ""}$${item.pricing.featureAdjustmentsPrice.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          ${
            !isProduct && Number(item.pricing?.addonsPrice || 0) > 0
              ? `
            <div class="price-line">
              <span>Add-ons:</span>
              <span>+$${item.pricing.addonsPrice.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <div class="price-line total">
            <span>Total:</span>
            <span>$${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div class="project-description">
          <h4>${detailTitle}</h4>
          <div class="description-content">
            ${detailContent ? `<p>${this.escapeHTML(detailContent)}</p>` : '<p class="no-description">No details provided</p>'}
          </div>
        </div>

        <div class="package-details">
          <h4>${packageTitle}</h4>
          <ul class="package-list">
            ${this.generatePackageList(item)}
          </ul>
        </div>

        <div class="cart-item-meta">
          <span class="added-date">Added: ${timestamp}</span>
        </div>
      </div>
    `;

    // Add event listener for the remove button
    const removeBtn = cartItem.querySelector(".remove-item-btn");

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        this.removeCartItem(index);
      });
    }

    return cartItem;
  }

  isProductItem(item) {
    return item?.itemType === "product" || Boolean(item?.product);
  }

  getItemName(item) {
    return item?.product?.title || item?.service?.name || "Cart Item";
  }

  getBasePrice(item) {
    return Number(item?.service?.basePrice || item?.pricing?.basePrice || 0);
  }

  getTotalPrice(item) {
    return Number(item?.pricing?.totalPrice || this.getBasePrice(item));
  }

  getProductDeliveryText(item) {
    const delivery =
      item?.product?.delivery || "Instant download after checkout";
    const license = item?.product?.license
      ? ` License: ${item.product.license}.`
      : "";
    return `${delivery}.${license}`;
  }

  escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  generatePackageList(item) {
    if (this.isProductItem(item)) {
      const files = Array.isArray(item?.product?.files)
        ? item.product.files
        : [];
      const packageItems =
        files.length > 0 ? [...files] : ["Digital download file"];
      const customizationItems = this.getProductCustomizationItems(item);

      return [...packageItems, ...customizationItems]
        .map((file) => `<li>${this.escapeHTML(file)}</li>`)
        .join("");
    }

    let packageItems = [];
    const featureAdjustments = Array.isArray(item.featureAdjustments)
      ? item.featureAdjustments
      : [];
    const addons = Array.isArray(item.addons) ? item.addons : [];

    // Add all features from featureAdjustments
    featureAdjustments.forEach((feature) => {
      if (feature.type === "flexible") {
        packageItems.push(`${feature.quantity} ${feature.name}`);
      } else if (feature.type === "toggle") {
        if (feature.removed) {
          packageItems.push(
            `<span class="removed-feature">${feature.name} (removed)</span>`,
          );
        } else {
          packageItems.push(feature.name);
        }
      } else if (feature.type === "required") {
        packageItems.push(feature.name);
      }
    });

    // Add selected addons
    addons.forEach((addon) => {
      const quantityText = addon.quantity > 1 ? ` (x${addon.quantity})` : "";
      packageItems.push(`${addon.name}${quantityText}`);
    });

    return packageItems.map((item) => `<li>${item}</li>`).join("");
  }

  getProductCustomizationItems(item) {
    const customization = item?.product?.customization;
    if (!customization) return [];

    const details = [];
    if (customization.styleLabel) {
      details.push(`Style: ${customization.styleLabel}`);
    }
    if (customization.layoutLabel) {
      details.push(`Format: ${customization.layoutLabel}`);
    }
    if (customization.textLayoutLabel) {
      details.push(`Text layout: ${customization.textLayoutLabel}`);
    }
    if (customization.recipient) {
      details.push(`Recipient: ${customization.recipient}`);
    }
    if (customization.message) {
      details.push(`Message: ${customization.message}`);
    }
    if (customization.signature) {
      details.push(`Signature: ${customization.signature}`);
    }

    return details;
  }

  removeCartItem(index) {
    this.showConfirmDialog(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      "Remove Item",
      () => {
        this.cart.splice(index, 1);
        this.saveCart();
        this.renderCart();
        this.showNotification("Item removed from cart", "success");
      },
    );
  }

  clearCart() {
    if (this.cart.length === 0) return;

    this.showConfirmDialog(
      "Clear Cart",
      "Are you sure you want to clear your entire cart? This action cannot be undone.",
      "Clear Cart",
      () => {
        this.cart = [];
        this.saveCart();
        this.renderCart();
        this.showNotification("Cart cleared successfully", "success");
      },
    );
  }

  updateSummary() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + this.getTotalPrice(item),
      0,
    );
    const tax = Math.round(subtotal * this.taxRate * 100) / 100;
    const total = subtotal + tax;

    const subtotalElement = document.getElementById("cartSubtotal");
    const taxElement = document.getElementById("cartTax");
    const totalElement = document.getElementById("cartTotal");

    if (subtotalElement)
      subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;

    // Update checkout button state
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.disabled = this.cart.length === 0;
    }
  }

  updateOrderNotes(notes) {
    localStorage.setItem("orderNotes", notes);
  }

  getOrderNotes() {
    return localStorage.getItem("orderNotes") || "";
  }

  handleCheckout() {
    if (this.cart.length === 0) {
      this.showNotification("Your cart is empty", "warning");
      return;
    }

    // Show customer info form before proceeding with checkout
    this.showCustomerInfoForm();
  }

  showCustomerInfoForm() {
    const modal = document.createElement("div");
    modal.className = "customer-info-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Contact Information</h3>
          <p>Please provide your contact details to complete your order</p>
        </div>
        
        <form id="customerInfoForm" class="customer-info-form">
          <div class="form-group">
            <label for="customerName">Full Name *</label>
            <input type="text" id="customerName" name="name" required 
                   placeholder="Your full name">
          </div>
          
          <div class="form-group">
            <label for="customerEmail">Email Address *</label>
            <input type="email" id="customerEmail" name="email" required 
                   placeholder="your.email@example.com">
          </div>
          
          <div class="form-group">
            <label for="customerPhone">Phone Number (Optional)</label>
            <input type="tel" id="customerPhone" name="phone" 
                   placeholder="Your phone number">
          </div>
          
          <div class="form-group">
            <label for="preferredContact">Preferred Contact Method</label>
            <select id="preferredContact" name="preferredContact">
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="either">Either</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.customer-info-modal').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Complete Order
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = modal.querySelector("#customerInfoForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const customerInfo = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || "Not provided",
        preferredContact: formData.get("preferredContact"),
      };

      // Remove the modal
      modal.remove();

      // Proceed with checkout
      this.processCheckout(customerInfo);
    });
  }

  processCheckout(customerInfo) {
    const digitalProducts = this.cart
      .filter((item) => this.isProductItem(item))
      .map((item) => ({
        id: item.product?.id,
        title: item.product?.title || item.service?.name,
        downloadUrl: item.product?.downloadUrl,
        downloadLabel: item.product?.downloadLabel,
        deliveryMode: item.product?.deliveryMode,
        files: item.product?.files || [],
        license: item.product?.license,
        customization: item.product?.customization || null,
      }));

    const orderData = {
      items: this.cart,
      customerInfo: customerInfo,
      notes: this.getOrderNotes(),
      fulfillment: {
        hasDigitalProducts: digitalProducts.length > 0,
        digitalProducts: digitalProducts,
      },
      summary: {
        subtotal: this.cart.reduce(
          (sum, item) => sum + this.getTotalPrice(item),
          0,
        ),
        tax:
          Math.round(
            this.cart.reduce((sum, item) => sum + this.getTotalPrice(item), 0) *
              this.taxRate *
              100,
          ) / 100,
        total:
          this.cart.reduce((sum, item) => sum + this.getTotalPrice(item), 0) +
          Math.round(
            this.cart.reduce((sum, item) => sum + this.getTotalPrice(item), 0) *
              this.taxRate *
              100,
          ) /
            100,
      },
      orderId:
        "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };

    // Store order data in sessionStorage for payment page
    sessionStorage.setItem("orderData", JSON.stringify(orderData));

    // Redirect to payment page
    window.location.href = "/pages/payment.html";
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

  showConfirmDialog(title, message, confirmText, onConfirm) {
    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog-overlay";
    dialog.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-header">
          <h3>${title}</h3>
        </div>
        <div class="confirm-dialog-content">
          <p>${message}</p>
        </div>
        <div class="confirm-dialog-actions">
          <button class="btn btn-glass cancel-btn">Cancel</button>
          <button class="btn btn-danger confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    const cancelBtn = dialog.querySelector(".cancel-btn");
    const confirmBtn = dialog.querySelector(".confirm-btn");

    const closeDialog = () => {
      dialog.remove();
    };

    cancelBtn.addEventListener("click", closeDialog);

    confirmBtn.addEventListener("click", () => {
      onConfirm();
      closeDialog();
    });

    // Close on overlay click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  // Static method to update cart count from any page
  static updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("serviceCart") || "[]");
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      const count = cart.length;
      cartCountElement.textContent = count;
      cartCountElement.style.display = count > 0 ? "block" : "none";

      // Store count in localStorage for persistence
      localStorage.setItem("cartCount", count.toString());
    }
  }

  // Static method to initialize cart count on page load
  static initializeCartCount() {
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      // First try to get from localStorage
      const storedCount = localStorage.getItem("cartCount");
      if (storedCount !== null) {
        const count = parseInt(storedCount);
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? "block" : "none";
      } else {
        // Fallback to calculating from cart data
        CartManager.updateCartCount();
      }
    }
  }
}

// Initialize cart manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize cart count as soon as possible
  CartManager.initializeCartCount();

  // Only initialize full cart manager on cart page
  if (document.body.classList.contains("cart")) {
    new CartManager();
  } else {
    // On other pages, update the cart count after initialization
    setTimeout(() => {
      CartManager.updateCartCount();
    }, 100);
  }

  // Load order notes if on cart page
  const orderNotes = document.getElementById("orderNotes");
  if (orderNotes) {
    orderNotes.value = localStorage.getItem("orderNotes") || "";
  }
});

// Export for use in other scripts
window.CartManager = CartManager;
