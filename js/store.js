class StoreManager {
  constructor() {
    this.products = [];
    this.cartKey = "serviceCart";
    this.activeCustomizerCleanup = null;
    this.init();
  }

  async init() {
    try {
      await this.loadProducts();
      this.renderProducts();
      this.setupProductActions();
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
    const loading = document.getElementById("storeLoading");
    const seasonalSection = document.getElementById("seasonalSection");
    const seasonalGrid = document.getElementById("seasonalProducts");
    const catalogGrid = document.getElementById("storeProducts");
    const seasonalProducts = this.products.filter((product) =>
      this.isActiveSeasonalProduct(product),
    );
    const catalogProducts = this.products.filter(
      (product) => !this.isActiveSeasonalProduct(product),
    );

    if (loading) {
      loading.hidden = true;
    }

    if (seasonalSection) {
      seasonalSection.hidden = seasonalProducts.length === 0;
    }

    this.renderProductGrid(seasonalGrid, seasonalProducts, {
      emptyTitle: "No seasonal products",
      emptyMessage: "Seasonal items will appear here during active rotations.",
      showEmpty: false,
    });

    this.renderProductGrid(catalogGrid, catalogProducts, {
      emptyTitle: "No products yet",
      emptyMessage: "Ready-made downloads will appear here soon.",
      showEmpty: true,
    });
  }

  renderProductGrid(grid, products, emptyState) {
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = emptyState.showEmpty
        ? `
          <div class="store-empty">
            <i class="fas fa-box-open"></i>
            <h2>${this.escapeHTML(emptyState.emptyTitle)}</h2>
            <p>${this.escapeHTML(emptyState.emptyMessage)}</p>
          </div>
        `
        : "";
      return;
    }

    grid.innerHTML = products
      .map((product) => this.createProductCard(product))
      .join("");
  }

  setupProductActions() {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-product]");
      const customizeButton = event.target.closest("[data-customize-product]");

      if (customizeButton) {
        const product = this.findProduct(
          customizeButton.dataset.customizeProduct,
        );
        if (product) {
          this.openCardCustomizer(product);
        }
        return;
      }

      if (!addButton) return;

      const product = this.findProduct(addButton.dataset.addProduct);
      if (product) {
        this.addProductToCart(product, addButton);
      }
    });
  }

  findProduct(productId) {
    return this.products.find((item) => item.id === productId);
  }

  isActiveSeasonalProduct(product) {
    return Boolean(product?.seasonal?.active);
  }

  createProductCard(product) {
    const files = Array.isArray(product.files) ? product.files : [];

    return `
      <article class="store-product-card${this.isActiveSeasonalProduct(product) ? " is-seasonal" : ""}" data-product-id="${this.escapeAttribute(product.id)}">
        <div class="product-topline">
          <span class="product-icon" aria-hidden="true">
            ${this.createProductIcon(product)}
          </span>
          <span class="product-badge">${this.escapeHTML(product.badge || "Download")}</span>
        </div>

        <div class="product-body">
          ${this.createSeasonalLabel(product)}
          <h2>${this.escapeHTML(product.title)}</h2>
          <p>${this.escapeHTML(product.summary)}</p>
        </div>

        <ul class="product-file-list">
          ${files.map((file) => `<li>${this.escapeHTML(file)}</li>`).join("")}
        </ul>

        ${this.createCustomizerSummary(product)}

        <div class="product-footer">
          <div>
            <span class="product-price">${this.getProductPriceLabel(product)}</span>
            <span class="product-delivery">${this.escapeHTML(product.delivery || "Instant download")}</span>
          </div>
          ${this.createProductAction(product)}
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

  createSeasonalLabel(product) {
    if (!this.isActiveSeasonalProduct(product)) return "";

    return `
      <span class="product-seasonal-label">
        <i class="fas fa-calendar-day" aria-hidden="true"></i>
        ${this.escapeHTML(product.seasonal.label || product.seasonal.section || "Seasonal")}
      </span>
    `;
  }

  createCustomizerSummary(product) {
    if (product.customizer?.type !== "mothers-day-card") return "";

    return `
      <dl class="product-option-list">
        <div>
          <dt>Styles</dt>
          <dd>21 visual styles</dd>
        </div>
        <div>
          <dt>Formats</dt>
          <dd>Portrait, landscape, square, story, wide</dd>
        </div>
        <div>
          <dt>Text layouts</dt>
          <dd>8 message arrangements</dd>
        </div>
        <div>
          <dt>Photo</dt>
          <dd>Optional image upload</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>PNG link after payment</dd>
        </div>
      </dl>
    `;
  }

  createProductAction(product) {
    const price = Number(product.price || 0);
    const isExternalDownload =
      product.purchaseMode === "external" || price <= 0;

    if (product.customizer?.type === "mothers-day-card") {
      return `
        <button class="store-add-button" type="button" data-customize-product="${this.escapeAttribute(product.id)}">
          <i class="fas fa-wand-magic-sparkles"></i>
          <span>${this.escapeHTML(product.ctaLabel || "Customize")}</span>
        </button>
      `;
    }

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

  getProductPriceLabel(product) {
    if (product.customizer?.type === "mothers-day-card") {
      return "$5.00";
    }

    const price = Number(product.price || 0);
    return price > 0 ? `$${price.toFixed(2)}` : "Free";
  }

  openCardCustomizer(product) {
    const renderer = window.MothersDayCardRenderer;
    if (!renderer) {
      this.showNotification("The card customizer could not load", "warning");
      return;
    }

    this.closeActiveCustomizer();

    const styles = renderer.getStyleOptions();
    const layouts = renderer.getLayoutOptions();
    const textLayouts = renderer.getTextLayoutOptions();
    const modal = document.createElement("div");
    modal.className = "store-customizer-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cardCustomizerTitle");
    modal.innerHTML = `
      <div class="customizer-dialog">
        <div class="customizer-header">
          <div>
            <p class="store-kicker">Mother's Day card</p>
            <h3 id="cardCustomizerTitle">Customize your card</h3>
          </div>
          <button class="customizer-icon-button" type="button" data-close-customizer aria-label="Close customizer">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div class="customizer-body">
          <form class="card-customizer-form" id="cardCustomizerForm">
            <fieldset>
              <legend>Style</legend>
              <div class="card-choice-grid">
                ${styles.map((style, index) => this.createStyleChoice(style, index === 0)).join("")}
              </div>
            </fieldset>

            <fieldset>
              <legend>Card format</legend>
              <div class="card-layout-grid">
                ${layouts.map((layout, index) => this.createLayoutChoice(layout, index === 0)).join("")}
              </div>
            </fieldset>

            <fieldset>
              <legend>Text layout</legend>
              <div class="card-text-layout-grid">
                ${textLayouts.map((textLayout, index) => this.createTextLayoutChoice(textLayout, index === 0)).join("")}
              </div>
            </fieldset>

            <div class="customizer-fields-grid">
              <label class="customizer-field">
                <span>Salutation</span>
                <input type="text" name="salutation" maxlength="32" value="Dear" required />
              </label>

              <label class="customizer-field">
                <span>Recipient</span>
                <input type="text" name="recipient" maxlength="40" value="Mom" required />
              </label>

              <label class="customizer-field">
                <span>Signoff</span>
                <input type="text" name="signoff" maxlength="40" value="With love" required />
              </label>

              <label class="customizer-field">
                <span>Name</span>
                <input type="text" name="signature" maxlength="50" placeholder="Your name" />
              </label>
            </div>

            <div class="customizer-field customizer-photo-field">
              <span id="cardPhotoLabel">Photo</span>
              <div class="customizer-photo-actions">
                <label class="customizer-file-button" aria-labelledby="cardPhotoLabel">
                  <input type="file" name="photo" accept="image/*" />
                  <i class="fas fa-image" aria-hidden="true"></i>
                  <span>Choose image</span>
                </label>
                <button class="customizer-secondary-button" type="button" data-clear-card-photo hidden>
                  <i class="fas fa-xmark" aria-hidden="true"></i>
                  <span>Remove</span>
                </button>
              </div>
              <small id="cardPhotoStatus">No photo selected</small>
            </div>

            <label class="customizer-field">
              <span>Personalized message</span>
              <textarea name="message" maxlength="180" rows="4" placeholder="Optional message"></textarea>
            </label>

            <div class="customizer-actions">
              <div class="customizer-price">
                <span>Price</span>
                <strong id="customizerPrice">$5.00</strong>
              </div>
              <button class="btn btn-primary" id="addCardToCartBtn" type="submit">
                <i class="fas fa-cart-plus"></i>
                Add to cart - $5.00
              </button>
            </div>
          </form>

          <div class="card-preview-shell" aria-live="polite">
            <canvas id="cardPreviewCanvas"></canvas>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#cardCustomizerForm");
    const canvas = modal.querySelector("#cardPreviewCanvas");
    const priceElement = modal.querySelector("#customizerPrice");
    const submitButton = modal.querySelector("#addCardToCartBtn");
    const photoInput = modal.querySelector('input[name="photo"]');
    const photoStatus = modal.querySelector("#cardPhotoStatus");
    const clearPhotoButton = modal.querySelector("[data-clear-card-photo]");
    let currentPhotoDataUrl = "";
    let photoProcessing = false;
    let previewRequest = 0;

    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.showNotification(
        "Clean PNG downloads are available after payment",
        "info",
      );
    });
    canvas.addEventListener("dragstart", (event) => event.preventDefault());

    const setPhotoProcessing = (isProcessing) => {
      photoProcessing = isProcessing;
      if (submitButton) {
        submitButton.disabled = isProcessing;
      }
      if (photoStatus && isProcessing) {
        photoStatus.textContent = "Preparing photo...";
      }
    };

    const updatePreview = async () => {
      const requestId = (previewRequest += 1);
      const config = this.readCustomizerConfig(form, currentPhotoDataUrl);
      const price = renderer.getPrice(config);

      if (priceElement) {
        priceElement.textContent = `$${price.toFixed(2)}`;
      }

      if (submitButton) {
        submitButton.innerHTML = `
          <i class="fas fa-cart-plus"></i>
          Add to cart - $${price.toFixed(2)}
        `;
      }

      await renderer.renderToCanvasAsync(canvas, config, { preview: true });

      if (requestId !== previewRequest) {
        await renderer.renderToCanvasAsync(
          canvas,
          this.readCustomizerConfig(form, currentPhotoDataUrl),
          { preview: true },
        );
        return;
      }
    };

    const handlePhotoChange = async () => {
      const file = photoInput?.files?.[0];

      if (!file) {
        currentPhotoDataUrl = "";
        if (photoStatus) photoStatus.textContent = "No photo selected";
        if (clearPhotoButton) clearPhotoButton.hidden = true;
        await updatePreview();
        return;
      }

      setPhotoProcessing(true);

      try {
        currentPhotoDataUrl = await this.createCardPhotoDataUrl(file);
        if (photoStatus) photoStatus.textContent = file.name;
        if (clearPhotoButton) clearPhotoButton.hidden = false;
      } catch (error) {
        currentPhotoDataUrl = "";
        if (photoInput) photoInput.value = "";
        if (photoStatus) photoStatus.textContent = "No photo selected";
        if (clearPhotoButton) clearPhotoButton.hidden = true;
        this.showNotification(
          error.message || "That photo could not be added",
          "warning",
        );
      } finally {
        setPhotoProcessing(false);
        await updatePreview();
      }
    };

    const closeCustomizer = () => {
      document.removeEventListener("keydown", handleEscape);
      modal.remove();
      this.activeCustomizerCleanup = null;
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeCustomizer();
      }
    };

    this.activeCustomizerCleanup = closeCustomizer;

    modal.querySelectorAll("[data-close-customizer]").forEach((button) => {
      button.addEventListener("click", closeCustomizer);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeCustomizer();
      }
    });

    document.addEventListener("keydown", handleEscape);
    form.addEventListener("input", (event) => {
      if (event.target?.type !== "file") {
        void updatePreview();
      }
    });
    form.addEventListener("change", (event) => {
      if (event.target === photoInput) {
        void handlePhotoChange();
        return;
      }
      void updatePreview();
    });
    clearPhotoButton?.addEventListener("click", () => {
      currentPhotoDataUrl = "";
      if (photoInput) photoInput.value = "";
      if (photoStatus) photoStatus.textContent = "No photo selected";
      clearPhotoButton.hidden = true;
      void updatePreview();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (photoProcessing) {
        this.showNotification("The photo is still being prepared", "info");
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const customizedProduct = this.createCustomizedCardProduct(
        product,
        this.readCustomizerConfig(form, currentPhotoDataUrl),
      );

      this.addProductToCart(customizedProduct, submitButton);
      closeCustomizer();
    });

    void updatePreview();

    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => updatePreview())
        .catch(() => updatePreview());
    }
  }

  createStyleChoice(style, checked) {
    return `
      <label class="card-choice">
        <input type="radio" name="style" value="${this.escapeAttribute(style.id)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${this.escapeHTML(style.label)}</strong>
          <small>${this.escapeHTML(style.description)}</small>
          <em>$${Number(style.price).toFixed(2)}</em>
        </span>
      </label>
    `;
  }

  createLayoutChoice(layout, checked) {
    return `
      <label class="layout-choice">
        <input type="radio" name="layout" value="${this.escapeAttribute(layout.id)}" ${checked ? "checked" : ""} />
        <span>${this.escapeHTML(layout.label)}</span>
      </label>
    `;
  }

  createTextLayoutChoice(textLayout, checked) {
    return `
      <label class="text-layout-choice">
        <input type="radio" name="textLayout" value="${this.escapeAttribute(textLayout.id)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${this.escapeHTML(textLayout.label)}</strong>
          <small>${this.escapeHTML(textLayout.description)}</small>
        </span>
      </label>
    `;
  }

  readCustomizerConfig(form, photoDataUrl = "") {
    const formData = new FormData(form);
    return window.MothersDayCardRenderer.normalizeConfig({
      style: formData.get("style"),
      layout: formData.get("layout"),
      textLayout: formData.get("textLayout"),
      salutation: formData.get("salutation"),
      recipient: formData.get("recipient"),
      message: formData.get("message"),
      signoff: formData.get("signoff"),
      signature: formData.get("signature"),
      photoDataUrl,
    });
  }

  async createCardPhotoDataUrl(file) {
    if (!file || !file.type?.startsWith("image/")) {
      throw new Error("Choose a valid image file");
    }

    const sourceUrl = URL.createObjectURL(file);

    try {
      const image = await this.loadImage(sourceUrl);
      const maxSide = 640;
      const scale = Math.min(
        1,
        maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1),
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.74);
      });

      if (!blob) {
        throw new Error("That photo could not be processed");
      }

      const dataUrl = await this.blobToDataUrl(blob);
      if (dataUrl.length > 160000) {
        throw new Error("Choose a smaller photo");
      }

      return dataUrl;
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  loadImage(sourceUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That photo could not be loaded"));
      image.src = sourceUrl;
    });
  }

  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("That photo could not be read"));
      reader.readAsDataURL(blob);
    });
  }

  createCustomizedCardProduct(product, config) {
    const renderer = window.MothersDayCardRenderer;
    const normalized = renderer.normalizeConfig(config);
    const style = renderer.getStyle(normalized.style);
    const layout = renderer.getLayout(normalized.layout);
    const textLayout = renderer.getTextLayout(normalized.textLayout);
    const token = renderer.encodeConfig(normalized);
    const timestamp = Date.now();

    return {
      ...product,
      id: `${product.id}-${timestamp}`,
      originalId: product.id,
      price: renderer.getPrice(normalized),
      summary: `${style.label} ${layout.label.toLowerCase()} card with ${textLayout.label.toLowerCase()} text for ${normalized.recipient}.`,
      delivery: "Personalized PNG download page after payment, also emailed",
      downloadUrl: `/pages/downloads/mothers-day-card.html#card=${token}`,
      downloadLabel: "Open PNG download page",
      deliveryMode: "generated",
      files: [
        "Personalized PNG card",
        `Style: ${style.label}`,
        `Format: ${layout.label}`,
        `Text layout: ${textLayout.label}`,
        ...(normalized.photoDataUrl ? ["Photo: included"] : []),
      ],
      customization: {
        ...normalized,
        hasPhoto: Boolean(normalized.photoDataUrl),
        styleLabel: style.label,
        layoutLabel: layout.label,
        textLayoutLabel: textLayout.label,
        filename: renderer.getFilename(normalized),
        outputFormat: "PNG",
        downloadToken: token,
      },
      allowMultiple: true,
    };
  }

  closeActiveCustomizer() {
    if (typeof this.activeCustomizerCleanup === "function") {
      this.activeCustomizerCleanup();
    }
  }

  addProductToCart(product, button) {
    const cart = this.getCart();
    const allowsMultiple = product.allowMultiple === true;
    const productIdentity = product.originalId || product.id;
    const alreadyInCart = cart.some((item) => {
      const itemIdentity = item.product?.originalId || item.product?.id;
      return item.itemType === "product" && itemIdentity === productIdentity;
    });

    if (!allowsMultiple && alreadyInCart) {
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
        originalId: product.originalId || product.id,
        title: product.title,
        summary: product.summary,
        delivery: product.delivery,
        downloadUrl: product.downloadUrl,
        downloadLabel: product.downloadLabel,
        deliveryMode: product.deliveryMode,
        license: product.license,
        files: product.files || [],
        customization: product.customization || null,
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

    if (!allowsMultiple) {
      this.markButtonAdded(button);
    }

    this.showNotification(`${product.title} added to cart`, "success");
  }

  updateCartAwareButtons() {
    const cart = this.getCart();
    const productIds = new Set(
      cart
        .filter((item) => item.itemType === "product" && item.product?.id)
        .map((item) => item.product.originalId || item.product.id),
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
    const seasonalSection = document.getElementById("seasonalSection");
    const grid = document.getElementById("storeProducts");

    if (loading) {
      loading.hidden = true;
    }

    if (seasonalSection) {
      seasonalSection.hidden = true;
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
      <i class="fas fa-${type === "success" ? "check" : type === "warning" ? "exclamation-triangle" : "info-circle"}"></i>
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
