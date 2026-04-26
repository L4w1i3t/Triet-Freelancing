class StoreManager {
  constructor() {
    this.products = [];
    this.cartKey = "serviceCart";
    this.init();
  }

  async init() {
    try {
      await this.loadProducts();
      this.renderProducts();
      this.updateCartAwareButtons();
    } catch (error) {
      console.error("Error initializing store:", error);
      this.showErrorState();
    }
  }

  async loadProducts() {
    const response = await fetch("../data/store.json");
    if (!response.ok) {
      throw new Error("Failed to load store products");
    }

    const data = await response.json();
    this.products = Array.isArray(data.products) ? data.products : [];
  }

  renderProducts() {
    const grid = document.getElementById("storeProducts");
    const loading = document.getElementById("storeLoading");
    if (!grid) return;

    if (loading) {
      loading.hidden = true;
    }

    if (this.products.length === 0) {
      grid.innerHTML = `
        <div class="store-empty">
          <i class="fas fa-box-open"></i>
          <h2>No products yet</h2>
          <p>Ready-made downloads will appear here soon.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.products
      .map((product) => this.createProductCard(product))
      .join("");

    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add-product]");
      if (!button) return;

      const product = this.products.find(
        (item) => item.id === button.dataset.addProduct,
      );
      if (product) {
        this.addProductToCart(product, button);
      }
    });
  }

  createProductCard(product) {
    const files = Array.isArray(product.files) ? product.files : [];
    const price = Number(product.price || 0);
    const isExternalDownload =
      product.purchaseMode === "external" || price <= 0;
    const priceLabel = price > 0 ? `$${price.toFixed(2)}` : "Free";

    return `
      <article class="store-product-card" data-product-id="${this.escapeAttribute(product.id)}">
        <div class="product-topline">
          <span class="product-icon" aria-hidden="true">
            ${this.createProductIcon(product)}
          </span>
          <span class="product-badge">${this.escapeHTML(product.badge || "Download")}</span>
        </div>

        <div class="product-body">
          <h2>${this.escapeHTML(product.title)}</h2>
          <p>${this.escapeHTML(product.summary)}</p>
        </div>

        <ul class="product-file-list">
          ${files.map((file) => `<li>${this.escapeHTML(file)}</li>`).join("")}
        </ul>

        <div class="product-footer">
          <div>
            <span class="product-price">${priceLabel}</span>
            <span class="product-delivery">${this.escapeHTML(product.delivery || "Instant download")}</span>
          </div>
          ${this.createProductAction(product, isExternalDownload)}
        </div>
      </article>
    `;
  }

  createProductIcon(product) {
    if (product.image) {
      return `<img src="${this.escapeAttribute(product.image)}" alt="${this.escapeAttribute(product.imageAlt || "")}" loading="lazy" />`;
    }

    return `<i class="fas ${this.escapeAttribute(product.icon || "fa-box")}"></i>`;
  }

  createProductAction(product, isExternalDownload) {
    if (isExternalDownload && product.downloadUrl) {
      return `
        <a class="store-add-button store-download-link" href="${this.escapeAttribute(product.downloadUrl)}" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-arrow-up-right-from-square"></i>
          <span>${this.escapeHTML(product.ctaLabel || "Download")}</span>
        </a>
      `;
    }

    return `
      <button class="store-add-button" type="button" data-add-product="${this.escapeAttribute(product.id)}">
        <i class="fas fa-cart-plus"></i>
        <span>${this.escapeHTML(product.ctaLabel || "Add")}</span>
      </button>
    `;
  }

  addProductToCart(product, button) {
    const cart = this.getCart();
    const alreadyInCart = cart.some(
      (item) => item.itemType === "product" && item.product?.id === product.id,
    );

    if (alreadyInCart) {
      this.showNotification("That download is already in your cart", "info");
      return;
    }

    const price = Number(product.price);
    const cartItem = {
      itemType: "product",
      service: {
        name: product.title,
        basePrice: price,
        description: product.summary,
      },
      product: {
        id: product.id,
        title: product.title,
        summary: product.summary,
        delivery: product.delivery,
        downloadUrl: product.downloadUrl,
        license: product.license,
        files: product.files || [],
      },
      projectDescription: product.summary,
      featureAdjustments: (product.files || []).map((file, index) => ({
        id: `${product.id}-file-${index + 1}`,
        name: file,
        type: "required",
        removed: false,
        adjustment: 0,
      })),
      addons: [],
      pricing: {
        basePrice: price,
        featureAdjustmentsPrice: 0,
        addonsPrice: 0,
        totalPrice: price,
      },
      timestamp: new Date().toISOString(),
    };

    cart.push(cartItem);
    localStorage.setItem(this.cartKey, JSON.stringify(cart));

    if (window.CartManager) {
      CartManager.updateCartCount();
    }

    this.markButtonAdded(button);
    this.showNotification(`${product.title} added to cart`, "success");
  }

  updateCartAwareButtons() {
    const cart = this.getCart();
    const productIds = new Set(
      cart
        .filter((item) => item.itemType === "product" && item.product?.id)
        .map((item) => item.product.id),
    );

    document.querySelectorAll("[data-add-product]").forEach((button) => {
      if (productIds.has(button.dataset.addProduct)) {
        button.classList.add("is-added");
        button.innerHTML = '<i class="fas fa-check"></i><span>Added</span>';
      }
    });
  }

  markButtonAdded(button) {
    if (!button) return;
    button.classList.add("is-added");
    button.innerHTML = '<i class="fas fa-check"></i><span>Added</span>';
  }

  getCart() {
    try {
      return JSON.parse(localStorage.getItem(this.cartKey) || "[]");
    } catch (error) {
      console.error("Unable to parse cart:", error);
      return [];
    }
  }

  showErrorState() {
    const loading = document.getElementById("storeLoading");
    const grid = document.getElementById("storeProducts");

    if (loading) {
      loading.hidden = true;
    }

    if (grid) {
      grid.innerHTML = `
        <div class="store-empty">
          <i class="fas fa-triangle-exclamation"></i>
          <h2>Store products could not load</h2>
          <p>Refresh the page or try again later.</p>
        </div>
      `;
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === "success" ? "check" : "info-circle"}"></i>
      <span>${this.escapeHTML(message)}</span>
      <button class="notification-close" type="button" aria-label="Dismiss notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => notification.remove());

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  escapeAttribute(value) {
    return this.escapeHTML(value).replace(/`/g, "&#096;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new StoreManager();
});
