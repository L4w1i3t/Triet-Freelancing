(function () {
  const FONT_STACK = '"Montserrat", "Inter", Arial, sans-serif';
  const BODY_FONT_STACK = '"Inter", Arial, sans-serif';
  const DEFAULT_MESSAGE =
    "Thank you for everything you do. You are loved more than words can say.";
  const PRODUCT_PRICE = 5;
  const MAX_PHOTO_DATA_URL_LENGTH = 160000;
  const PHOTO_DATA_URL_PATTERN = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;
  const photoImageCache = new Map();

  const STYLE_OPTIONS = [
    {
      id: "floral-bloom",
      label: "Floral Bloom",
      description: "Rose, coral, and leafy corner blooms",
      price: PRODUCT_PRICE,
      motif: "floral",
      palette: createPalette(
        "#fff1f5",
        "#fee2e2",
        "#9f1239",
        "#4a2630",
        "#85545f",
        "#e11d48",
        "#f59e0b",
        "#15803d",
      ),
    },
    {
      id: "soft-letter",
      label: "Soft Letter",
      description: "Warm stationery with quiet borders",
      price: PRODUCT_PRICE,
      motif: "letter",
      palette: createPalette(
        "#fff7ed",
        "#fde68a",
        "#7c2d12",
        "#432818",
        "#7f5539",
        "#c2410c",
        "#0f766e",
        "#65a30d",
      ),
    },
    {
      id: "lavender-sprig",
      label: "Lavender Sprig",
      description: "Soft lavender and botanical stems",
      price: PRODUCT_PRICE,
      motif: "sprig",
      palette: createPalette(
        "#f5f3ff",
        "#ddd6fe",
        "#5b21b6",
        "#312e57",
        "#6d5f8d",
        "#8b5cf6",
        "#a78bfa",
        "#3f7d20",
      ),
    },
    {
      id: "sunny-garden",
      label: "Sunny Garden",
      description: "Bright marigold, sky, and garden shapes",
      price: PRODUCT_PRICE,
      motif: "sun",
      palette: createPalette(
        "#ecfeff",
        "#fef3c7",
        "#92400e",
        "#34240d",
        "#7a5b1d",
        "#f59e0b",
        "#0ea5e9",
        "#16a34a",
      ),
    },
    {
      id: "ocean-breeze",
      label: "Ocean Breeze",
      description: "Sea glass tones with soft wave lines",
      price: PRODUCT_PRICE,
      motif: "wave",
      palette: createPalette(
        "#ecfeff",
        "#d1fae5",
        "#155e75",
        "#12343b",
        "#426f79",
        "#0891b2",
        "#10b981",
        "#0f766e",
      ),
    },
    {
      id: "celestial-night",
      label: "Celestial Night",
      description: "Moonlit navy with stars and sparkles",
      price: PRODUCT_PRICE,
      motif: "star",
      palette: createPalette(
        "#111827",
        "#312e81",
        "#fde68a",
        "#eef2ff",
        "#c7d2fe",
        "#facc15",
        "#818cf8",
        "#38bdf8",
        "rgba(17, 24, 39, 0.82)",
      ),
    },
    {
      id: "modern-minimal",
      label: "Modern Minimal",
      description: "Clean neutral layout with a bold accent",
      price: PRODUCT_PRICE,
      motif: "minimal",
      palette: createPalette(
        "#f8fafc",
        "#e2e8f0",
        "#111827",
        "#1f2937",
        "#64748b",
        "#0f766e",
        "#f97316",
        "#0f766e",
      ),
    },
    {
      id: "checker-pop",
      label: "Checker Pop",
      description: "Playful checker marks and bright color",
      price: PRODUCT_PRICE,
      motif: "checker",
      palette: createPalette(
        "#fff7ed",
        "#fce7f3",
        "#831843",
        "#3f1232",
        "#7b5068",
        "#ec4899",
        "#22c55e",
        "#16a34a",
      ),
    },
    {
      id: "sage-botanical",
      label: "Sage Botanical",
      description: "Quiet green leaves and natural texture",
      price: PRODUCT_PRICE,
      motif: "botanical",
      palette: createPalette(
        "#f7fee7",
        "#dcfce7",
        "#365314",
        "#23330d",
        "#5f7742",
        "#65a30d",
        "#84cc16",
        "#15803d",
      ),
    },
    {
      id: "vintage-lace",
      label: "Vintage Lace",
      description: "Classic rose tones with lace-like edges",
      price: PRODUCT_PRICE,
      motif: "lace",
      palette: createPalette(
        "#fff7f3",
        "#fed7aa",
        "#881337",
        "#3f1d2a",
        "#8a5668",
        "#be123c",
        "#d97706",
        "#6b8e23",
      ),
    },
    {
      id: "heartfelt-pop",
      label: "Heartfelt Pop",
      description: "Bold hearts with pink and aqua energy",
      price: PRODUCT_PRICE,
      motif: "hearts",
      palette: createPalette(
        "#fdf2f8",
        "#cffafe",
        "#be185d",
        "#3b1330",
        "#7c4a6d",
        "#db2777",
        "#06b6d4",
        "#14b8a6",
      ),
    },
    {
      id: "ribbon-keepsake",
      label: "Ribbon Keepsake",
      description: "Gift ribbon lines with polished edges",
      price: PRODUCT_PRICE,
      motif: "ribbon",
      palette: createPalette(
        "#f8fafc",
        "#dbeafe",
        "#1d4ed8",
        "#172554",
        "#50628e",
        "#2563eb",
        "#f43f5e",
        "#0f766e",
      ),
    },
    {
      id: "daisy-day",
      label: "Daisy Day",
      description: "Fresh daisies with light yellow warmth",
      price: PRODUCT_PRICE,
      motif: "daisy",
      palette: createPalette(
        "#fefce8",
        "#dcfce7",
        "#854d0e",
        "#2f260c",
        "#716333",
        "#eab308",
        "#ffffff",
        "#16a34a",
      ),
    },
    {
      id: "pearl-blush",
      label: "Pearl Blush",
      description: "Soft pearl dots and blush gradients",
      price: PRODUCT_PRICE,
      motif: "pearl",
      palette: createPalette(
        "#fff1f2",
        "#f5f5f4",
        "#9d174d",
        "#3b2530",
        "#7c5866",
        "#fb7185",
        "#f8fafc",
        "#94a3b8",
      ),
    },
    {
      id: "garden-party",
      label: "Garden Party",
      description: "Layered greenery and cheerful blossoms",
      price: PRODUCT_PRICE,
      motif: "garden",
      palette: createPalette(
        "#f0fdf4",
        "#ffe4e6",
        "#166534",
        "#17321d",
        "#4e7257",
        "#22c55e",
        "#fb7185",
        "#15803d",
      ),
    },
    {
      id: "paper-cut",
      label: "Paper Cut",
      description: "Layered paper shapes with crisp color",
      price: PRODUCT_PRICE,
      motif: "modern",
      palette: createPalette(
        "#f8fafc",
        "#ede9fe",
        "#4c1d95",
        "#241336",
        "#685584",
        "#7c3aed",
        "#f97316",
        "#0f766e",
      ),
    },
    {
      id: "orchid-glow",
      label: "Orchid Glow",
      description: "Orchid petals with rich purple highlights",
      price: PRODUCT_PRICE,
      motif: "orchid",
      palette: createPalette(
        "#faf5ff",
        "#fbcfe8",
        "#701a75",
        "#351a38",
        "#7d4a82",
        "#c026d3",
        "#f0abfc",
        "#15803d",
      ),
    },
    {
      id: "peony-bouquet",
      label: "Peony Bouquet",
      description: "Full peony clusters with layered leaves",
      price: PRODUCT_PRICE,
      motif: "peony",
      palette: createPalette(
        "#fff7fb",
        "#fce7f3",
        "#9d174d",
        "#3f1d32",
        "#8b5b70",
        "#ec4899",
        "#fb7185",
        "#15803d",
      ),
    },
    {
      id: "wildflower-meadow",
      label: "Wildflower Meadow",
      description: "Loose meadow stems and tiny blossoms",
      price: PRODUCT_PRICE,
      motif: "wildflower",
      palette: createPalette(
        "#f0fdfa",
        "#fff7ed",
        "#0f766e",
        "#263a2f",
        "#5d7165",
        "#f97316",
        "#a855f7",
        "#16a34a",
      ),
    },
    {
      id: "tulip-border",
      label: "Tulip Border",
      description: "Tall tulips framing the message",
      price: PRODUCT_PRICE,
      motif: "tulip",
      palette: createPalette(
        "#fff1f2",
        "#e0f2fe",
        "#be123c",
        "#3c2430",
        "#7d5964",
        "#f43f5e",
        "#facc15",
        "#15803d",
      ),
    },
    {
      id: "joyful-confetti",
      label: "Joyful Confetti",
      description: "Static celebratory confetti and sparkle",
      price: PRODUCT_PRICE,
      motif: "confetti",
      palette: createPalette(
        "#fefce8",
        "#dbeafe",
        "#1e3a8a",
        "#16213f",
        "#53607c",
        "#2563eb",
        "#f43f5e",
        "#14b8a6",
      ),
    },
  ];

  const LAYOUT_OPTIONS = [
    { id: "portrait", label: "Portrait", width: 1200, height: 1600 },
    { id: "landscape", label: "Landscape", width: 1600, height: 1200 },
    { id: "square", label: "Square", width: 1400, height: 1400 },
    { id: "story", label: "Story", width: 1080, height: 1920 },
    { id: "wide", label: "Wide", width: 1800, height: 1000 },
    { id: "keepsake", label: "Keepsake", width: 1500, height: 2100 },
  ];

  const TEXT_LAYOUT_OPTIONS = [
    {
      id: "classic-center",
      label: "Classic Center",
      description: "Balanced centered greeting",
    },
    {
      id: "editorial-left",
      label: "Editorial Left",
      description: "Left-aligned note style",
    },
    {
      id: "split-panel",
      label: "Split Panel",
      description: "Greeting and note side by side",
    },
    {
      id: "bottom-letter",
      label: "Bottom Letter",
      description: "Open top with a lower note",
    },
    {
      id: "title-frame",
      label: "Title Frame",
      description: "Framed message block",
    },
    {
      id: "postcard",
      label: "Postcard",
      description: "Postcard-inspired composition",
    },
    {
      id: "bold-stack",
      label: "Bold Stack",
      description: "Large stacked headline",
    },
    {
      id: "compact-note",
      label: "Compact Note",
      description: "Small polished keepsake text",
    },
  ];

  const STYLE_MAP = new Map(STYLE_OPTIONS.map((option) => [option.id, option]));
  const LAYOUT_MAP = new Map(
    LAYOUT_OPTIONS.map((option) => [option.id, option]),
  );
  const TEXT_LAYOUT_MAP = new Map(
    TEXT_LAYOUT_OPTIONS.map((option) => [option.id, option]),
  );

  function createPalette(
    backgroundStart,
    backgroundEnd,
    title,
    text,
    muted,
    accent,
    accentTwo,
    leaf,
    panel = "rgba(255, 255, 255, 0.78)",
  ) {
    return {
      backgroundStart,
      backgroundEnd,
      panel,
      title,
      text,
      muted,
      accent,
      accentTwo,
      leaf,
    };
  }

  function normalizeConfig(config = {}) {
    const requestedStyle =
      config.style === "animated-gif" ? "joyful-confetti" : config.style;
    const style = STYLE_MAP.has(requestedStyle)
      ? requestedStyle
      : STYLE_OPTIONS[0].id;
    const layout = LAYOUT_MAP.has(config.layout)
      ? config.layout
      : LAYOUT_OPTIONS[0].id;
    const textLayout = TEXT_LAYOUT_MAP.has(config.textLayout)
      ? config.textLayout
      : TEXT_LAYOUT_OPTIONS[0].id;
    const rawSignature = cleanField(config.signature || "", 50);
    const signature =
      Number(config.version || 0) < 3 &&
      !config.signoff &&
      rawSignature.toLowerCase() === "with love"
        ? ""
        : rawSignature;

    return {
      version: 3,
      style,
      layout,
      textLayout,
      salutation: cleanField(config.salutation || "Dear", 32),
      recipient: cleanField(config.recipient || "Mom", 40),
      message: cleanField(config.message || "", 180),
      signoff: cleanField(config.signoff || "With love", 40),
      signature,
      photoDataUrl: cleanPhotoDataUrl(config.photoDataUrl),
    };
  }

  function cleanField(value, maxLength) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function cleanPhotoDataUrl(value) {
    const photoDataUrl = String(value || "").trim();
    if (!photoDataUrl) return "";
    if (!PHOTO_DATA_URL_PATTERN.test(photoDataUrl)) return "";
    return photoDataUrl.length <= MAX_PHOTO_DATA_URL_LENGTH ? photoDataUrl : "";
  }

  function getStyle(styleId) {
    return STYLE_MAP.get(styleId) || STYLE_OPTIONS[0];
  }

  function getLayout(layoutId) {
    return LAYOUT_MAP.get(layoutId) || LAYOUT_OPTIONS[0];
  }

  function getTextLayout(textLayoutId) {
    return TEXT_LAYOUT_MAP.get(textLayoutId) || TEXT_LAYOUT_OPTIONS[0];
  }

  function getPrice() {
    return PRODUCT_PRICE;
  }

  function getFilename(config) {
    const normalized = normalizeConfig(config);
    const recipient = normalized.recipient || "mom";
    const slug = recipient
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    return `mothers-day-card-${slug || "mom"}.png`;
  }

  function renderToCanvas(canvas, config, options = {}) {
    if (!canvas) return null;

    const normalized = normalizeConfig(config);
    const style = getStyle(normalized.style);
    const layout = getLayout(normalized.layout);
    const palette = style.palette;
    const ctx = canvas.getContext("2d");
    const isPreview = options.preview === true;
    const outputScale = isPreview ? 0.45 : 1;
    const width = layout.width;
    const height = layout.height;
    const canvasWidth = Math.round(width * outputScale);
    const canvasHeight = Math.round(height * outputScale);
    const minSide = Math.min(width, height);
    const padding = minSide * 0.075;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.aspectRatio = `${width} / ${height}`;
    canvas.dataset.layout = layout.id;
    canvas.dataset.textLayout = normalized.textLayout;
    canvas.dataset.preview = isPreview ? "true" : "false";

    if (typeof ctx.setTransform === "function") {
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
    } else if (typeof ctx.scale === "function" && outputScale !== 1) {
      ctx.scale(outputScale, outputScale);
    }

    drawBackground(ctx, width, height, palette, style.motif);
    drawPanel(ctx, padding, width, height, palette);
    drawStyleAccents(ctx, style.motif, width, height, padding, palette);
    drawCardPhoto(
      ctx,
      options.photoImage,
      normalized,
      width,
      height,
      padding,
      palette,
    );
    drawCardText(ctx, normalized, width, height, padding, palette);

    if (isPreview) {
      drawPreviewWatermark(ctx, width, height, palette);
      canvas.setAttribute(
        "aria-label",
        "Watermarked Mother's Day card preview",
      );
    }

    return normalized;
  }

  async function renderToCanvasAsync(canvas, config, options = {}) {
    const normalized = normalizeConfig(config);
    const photoImage = normalized.photoDataUrl
      ? await loadPhotoImage(normalized.photoDataUrl)
      : null;

    return renderToCanvas(canvas, normalized, {
      ...options,
      photoImage,
    });
  }

  function loadPhotoImage(photoDataUrl) {
    if (!photoDataUrl) return Promise.resolve(null);
    if (photoImageCache.has(photoDataUrl)) {
      return photoImageCache.get(photoDataUrl);
    }

    const imagePromise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = photoDataUrl;
    });

    photoImageCache.set(photoDataUrl, imagePromise);
    return imagePromise;
  }

  function drawBackground(ctx, width, height, palette, motif) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.backgroundStart);
    gradient.addColorStop(1, palette.backgroundEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (motif === "checker") {
      drawCheckerBackground(ctx, width, height, palette);
    }

    ctx.save();
    ctx.globalAlpha = motif === "minimal" ? 0.08 : 0.15;
    for (let i = 0; i < 34; i += 1) {
      const x = ((i * 197) % width) + 12;
      const y = ((i * 113) % height) + 8;
      const radius = 4 + ((i * 7) % 18);
      ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.accentTwo;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCheckerBackground(ctx, width, height, palette) {
    const tile = Math.max(34, Math.min(width, height) * 0.045);
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        if ((x / tile + y / tile) % 2 === 0) {
          ctx.fillStyle = palette.accent;
          ctx.fillRect(x, y, tile, tile);
        }
      }
    }
    ctx.restore();
  }

  function drawPanel(ctx, padding, width, height, palette) {
    ctx.save();
    ctx.shadowColor = "rgba(83, 31, 52, 0.16)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
    roundedRect(
      ctx,
      padding,
      padding,
      width - padding * 2,
      height - padding * 2,
      34,
    );
    ctx.fillStyle = palette.panel;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = Math.max(4, Math.min(width, height) * 0.004);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.stroke();
    ctx.restore();
  }

  function drawStyleAccents(ctx, motif, width, height, padding, palette) {
    switch (motif) {
      case "letter":
        drawLetterAccents(ctx, width, height, padding, palette);
        break;
      case "sprig":
      case "botanical":
        drawSprigAccents(ctx, width, height, padding, palette);
        break;
      case "sun":
        drawSunAccents(ctx, width, height, padding, palette);
        break;
      case "wave":
        drawWaveAccents(ctx, width, height, padding, palette);
        break;
      case "star":
        drawStarAccents(ctx, width, height, padding, palette);
        break;
      case "minimal":
        drawMinimalAccents(ctx, width, height, padding, palette);
        break;
      case "checker":
        drawModernAccents(ctx, width, height, padding, palette);
        break;
      case "lace":
        drawLaceAccents(ctx, width, height, padding, palette);
        break;
      case "hearts":
        drawHeartAccents(ctx, width, height, padding, palette);
        break;
      case "ribbon":
        drawRibbonAccents(ctx, width, height, padding, palette);
        break;
      case "daisy":
        drawFloralAccents(ctx, width, height, padding, palette, "daisy");
        break;
      case "pearl":
        drawPearlAccents(ctx, width, height, padding, palette);
        break;
      case "garden":
        drawSprigAccents(ctx, width, height, padding, palette);
        drawFloralAccents(ctx, width, height, padding, palette, "small");
        break;
      case "modern":
        drawModernAccents(ctx, width, height, padding, palette);
        break;
      case "orchid":
        drawFloralAccents(ctx, width, height, padding, palette, "orchid");
        break;
      case "peony":
        drawPeonyAccents(ctx, width, height, padding, palette);
        break;
      case "wildflower":
        drawWildflowerAccents(ctx, width, height, padding, palette);
        break;
      case "tulip":
        drawTulipAccents(ctx, width, height, padding, palette);
        break;
      case "confetti":
        drawConfettiAccents(ctx, width, height, padding, palette);
        break;
      default:
        drawFloralAccents(ctx, width, height, padding, palette);
    }
  }

  function drawFloralAccents(ctx, width, height, padding, palette, variant) {
    const flowerSize = Math.min(width, height) * 0.052;
    const positions = [
      [padding * 1.45, padding * 1.35, -0.4],
      [width - padding * 1.45, padding * 1.55, 0.35],
      [padding * 1.5, height - padding * 1.45, 0.2],
      [width - padding * 1.45, height - padding * 1.35, -0.25],
    ];

    positions.forEach(([x, y, rotation], index) => {
      const scale = variant === "small" ? 0.68 : index % 2 === 0 ? 1 : 0.82;
      drawFlower(ctx, x, y, flowerSize * scale, rotation, palette, variant);
    });
  }

  function drawPeonyAccents(ctx, width, height, padding, palette) {
    const minSide = Math.min(width, height);
    const clusters = [
      [padding * 1.45, padding * 1.3, 1, -0.3],
      [width - padding * 1.48, padding * 1.38, 0.86, 0.38],
      [padding * 1.55, height - padding * 1.32, 0.92, 0.2],
      [width - padding * 1.5, height - padding * 1.38, 1.05, -0.25],
    ];

    clusters.forEach(([x, y, scale, rotation], index) => {
      drawPeonyCluster(
        ctx,
        x,
        y,
        minSide * 0.07 * scale,
        rotation,
        palette,
        index,
      );
    });
  }

  function drawWildflowerAccents(ctx, width, height, padding, palette) {
    const minSide = Math.min(width, height);
    const meadowTop = height - padding * 1.08;
    const stems = [
      [padding * 1.45, 0.32, -0.25, palette.accent],
      [padding * 2.05, 0.48, 0.16, palette.accentTwo],
      [padding * 2.72, 0.38, -0.08, palette.title],
      [width - padding * 2.65, 0.42, 0.12, palette.accent],
      [width - padding * 1.95, 0.52, -0.18, palette.accentTwo],
      [width - padding * 1.35, 0.34, 0.24, palette.title],
    ];

    ctx.save();
    stems.forEach(([x, heightRatio, lean, color], index) => {
      drawWildflowerStem(
        ctx,
        x,
        meadowTop,
        minSide * heightRatio,
        lean,
        color,
        palette,
        index,
      );
    });
    ctx.restore();

    drawSprig(
      ctx,
      padding * 1.25,
      padding * 1.2,
      minSide * 0.16,
      0.72,
      palette,
    );
    drawSprig(
      ctx,
      width - padding * 1.25,
      padding * 1.2,
      minSide * 0.16,
      2.35,
      palette,
    );
  }

  function drawTulipAccents(ctx, width, height, padding, palette) {
    const minSide = Math.min(width, height);
    const baseY = height - padding * 1.12;
    const tulips = [
      [padding * 1.28, baseY, minSide * 0.19, -0.16, palette.accent],
      [padding * 1.88, baseY, minSide * 0.25, 0.1, palette.accentTwo],
      [padding * 2.48, baseY, minSide * 0.18, -0.08, palette.title],
      [width - padding * 2.5, baseY, minSide * 0.18, 0.08, palette.title],
      [width - padding * 1.9, baseY, minSide * 0.25, -0.12, palette.accent],
      [width - padding * 1.3, baseY, minSide * 0.2, 0.14, palette.accentTwo],
    ];

    tulips.forEach(([x, y, size, lean, color], index) => {
      drawTulip(ctx, x, y, size, lean, color, palette, index);
    });
  }

  function drawLetterAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(4, Math.min(width, height) * 0.004);
    for (let i = 0; i < 3; i += 1) {
      const inset = padding * (1.35 + i * 0.28);
      roundedRect(ctx, inset, inset, width - inset * 2, height - inset * 2, 22);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.accentTwo;
    ctx.beginPath();
    ctx.moveTo(width - padding * 1.75, padding * 1.2);
    ctx.lineTo(width - padding * 1.05, padding * 1.2);
    ctx.lineTo(width - padding * 1.05, padding * 2.55);
    ctx.quadraticCurveTo(
      width - padding * 1.4,
      padding * 2.22,
      width - padding * 1.75,
      padding * 2.55,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSprigAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.strokeStyle = palette.leaf;
    ctx.fillStyle = palette.leaf;
    ctx.lineWidth = Math.max(4, Math.min(width, height) * 0.005);

    [
      [padding * 1.35, padding * 1.15, 0.7],
      [width - padding * 1.35, height - padding * 1.15, -2.45],
      [width - padding * 1.35, padding * 1.15, 2.3],
      [padding * 1.35, height - padding * 1.15, -0.75],
    ].forEach(([x, y, rotation]) => {
      drawSprig(ctx, x, y, Math.min(width, height) * 0.19, rotation, palette);
    });

    ctx.restore();
  }

  function drawSunAccents(ctx, width, height, padding, palette) {
    const radius = Math.min(width, height) * 0.08;
    ctx.save();
    ctx.translate(width - padding * 1.7, padding * 1.6);
    ctx.strokeStyle = palette.accent;
    ctx.fillStyle = palette.accentTwo;
    ctx.lineWidth = Math.max(3, radius * 0.08);
    for (let i = 0; i < 16; i += 1) {
      const angle = (Math.PI * 2 * i) / 16;
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * radius * 1.2,
        Math.sin(angle) * radius * 1.2,
      );
      ctx.lineTo(
        Math.cos(angle) * radius * 1.85,
        Math.sin(angle) * radius * 1.85,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawWaveAccents(ctx, width, height, padding, palette, 0.12);
  }

  function drawWaveAccents(ctx, width, height, padding, palette, alpha = 0.22) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(5, Math.min(width, height) * 0.006);
    for (let row = 0; row < 4; row += 1) {
      const y = height - padding * (1.25 + row * 0.35);
      ctx.beginPath();
      for (let x = padding; x <= width - padding; x += 20) {
        const waveY = y + Math.sin((x / width) * Math.PI * 6) * padding * 0.09;
        if (x === padding) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStarAccents(ctx, width, height, padding, palette) {
    ctx.save();
    for (let i = 0; i < 28; i += 1) {
      const x = padding + ((i * 227) % (width - padding * 2));
      const y = padding + ((i * 149) % (height - padding * 2));
      const radius = Math.min(width, height) * (0.01 + (i % 4) * 0.003);
      drawSparkle(
        ctx,
        x,
        y,
        radius,
        i % 2 ? palette.accent : palette.accentTwo,
      );
    }
    ctx.fillStyle = palette.accentTwo;
    ctx.globalAlpha = 0.24;
    ctx.beginPath();
    ctx.arc(
      width - padding * 1.55,
      padding * 1.55,
      padding * 0.42,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      width - padding * 1.38,
      padding * 1.43,
      padding * 0.42,
      0,
      Math.PI * 2,
    );
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawMinimalAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(4, Math.min(width, height) * 0.006);
    ctx.beginPath();
    ctx.moveTo(padding * 1.35, padding * 1.35);
    ctx.lineTo(width - padding * 1.35, padding * 1.35);
    ctx.moveTo(width - padding * 1.35, height - padding * 1.35);
    ctx.lineTo(padding * 1.35, height - padding * 1.35);
    ctx.stroke();
    ctx.fillStyle = palette.accentTwo;
    ctx.fillRect(
      width - padding * 2.3,
      padding * 1.55,
      padding * 0.95,
      padding * 0.22,
    );
    ctx.restore();
  }

  function drawLaceAccents(ctx, width, height, padding, palette) {
    const radius = Math.max(10, Math.min(width, height) * 0.018);
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = Math.max(2, radius * 0.18);
    for (let x = padding * 1.3; x <= width - padding * 1.3; x += radius * 2.8) {
      ctx.beginPath();
      ctx.arc(x, padding * 1.32, radius, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, height - padding * 1.32, radius, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeartAccents(ctx, width, height, padding, palette) {
    ctx.save();
    const size = Math.min(width, height) * 0.05;
    [
      [padding * 1.35, padding * 1.4, -0.2],
      [width - padding * 1.4, padding * 1.55, 0.24],
      [padding * 1.55, height - padding * 1.3, 0.18],
      [width - padding * 1.35, height - padding * 1.35, -0.25],
    ].forEach(([x, y, rotation], index) => {
      drawHeart(
        ctx,
        x,
        y,
        size * (index % 2 ? 0.82 : 1),
        rotation,
        index % 2 ? palette.accentTwo : palette.accent,
      );
    });
    ctx.restore();
  }

  function drawRibbonAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(10, Math.min(width, height) * 0.014);
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(padding * 1.25, padding * 1.25);
    ctx.bezierCurveTo(
      width * 0.35,
      height * 0.2,
      width * 0.65,
      height * 0.08,
      width - padding * 1.25,
      padding * 1.55,
    );
    ctx.stroke();
    ctx.strokeStyle = palette.accentTwo;
    ctx.beginPath();
    ctx.moveTo(width - padding * 1.25, height - padding * 1.25);
    ctx.bezierCurveTo(
      width * 0.65,
      height * 0.8,
      width * 0.35,
      height * 0.92,
      padding * 1.25,
      height - padding * 1.55,
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawPearlAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.fillStyle = palette.accentTwo;
    ctx.globalAlpha = 0.48;
    const radius = Math.min(width, height) * 0.018;
    for (let i = 0; i < 24; i += 1) {
      const topX = padding * 1.22 + i * ((width - padding * 2.44) / 23);
      const bottomX =
        width - padding * 1.22 - i * ((width - padding * 2.44) / 23);
      ctx.beginPath();
      ctx.arc(
        topX,
        padding * 1.25,
        radius * (i % 3 === 0 ? 1.15 : 0.82),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        bottomX,
        height - padding * 1.25,
        radius * (i % 4 === 0 ? 1.05 : 0.78),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawModernAccents(ctx, width, height, padding, palette) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(padding * 1.2, padding * 1.2, padding * 1.25, padding * 0.4);
    ctx.fillRect(
      width - padding * 2.45,
      height - padding * 1.6,
      padding * 1.25,
      padding * 0.4,
    );
    ctx.fillStyle = palette.accentTwo;
    ctx.beginPath();
    ctx.arc(
      width - padding * 1.55,
      padding * 1.65,
      padding * 0.45,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      padding * 1.55,
      height - padding * 1.65,
      padding * 0.35,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  function drawConfettiAccents(ctx, width, height, padding, palette) {
    ctx.save();
    const colors = [
      palette.accent,
      palette.accentTwo,
      palette.leaf,
      palette.title,
    ];
    for (let i = 0; i < 42; i += 1) {
      const x = padding + ((i * 181) % (width - padding * 2));
      const y = padding + ((i * 257) % (height - padding * 2));
      const size = Math.min(width, height) * (0.01 + (i % 3) * 0.004);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i * Math.PI) / 7);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.46;
      ctx.fillRect(-size / 2, -size / 2, size, size * 0.42);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCardPhoto(
    ctx,
    photoImage,
    config,
    width,
    height,
    padding,
    palette,
  ) {
    if (!photoImage) return;

    const rect = getPhotoFrameRect(config.textLayout, width, height, padding);
    const radius = Math.min(rect.width, rect.height) * 0.12;

    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
    ctx.shadowBlur = Math.max(18, Math.min(width, height) * 0.018);
    ctx.shadowOffsetY = Math.max(10, Math.min(width, height) * 0.01);
    roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fill();
    ctx.shadowColor = "transparent";

    const inset = Math.max(8, Math.min(width, height) * 0.009);
    roundedRect(
      ctx,
      rect.x + inset,
      rect.y + inset,
      rect.width - inset * 2,
      rect.height - inset * 2,
      Math.max(8, radius - inset),
    );
    ctx.clip();
    drawImageCover(
      ctx,
      photoImage,
      rect.x + inset,
      rect.y + inset,
      rect.width - inset * 2,
      rect.height - inset * 2,
    );
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(4, Math.min(width, height) * 0.005);
    roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
    ctx.stroke();
    drawFlower(
      ctx,
      rect.x + rect.width * 0.08,
      rect.y + rect.height * 0.08,
      Math.min(rect.width, rect.height) * 0.13,
      -0.36,
      palette,
      "small",
    );
    ctx.restore();
  }

  function getPhotoFrameRect(textLayout, width, height, padding) {
    const minSide = Math.min(width, height);
    const isWide = width > height * 1.15;
    const size = isWide ? minSide * 0.16 : minSide * 0.18;
    const wideWidth = size * 1.18;
    const xCenter = (width - wideWidth) / 2;
    const xRight = width - padding * 1.35 - wideWidth;
    const yBottom = height - padding * 1.35 - size;

    switch (textLayout) {
      case "classic-center":
        return {
          x: xCenter,
          y: height * 0.58,
          width: wideWidth,
          height: size,
        };
      case "editorial-left":
        return {
          x: xRight,
          y: height * 0.38,
          width: wideWidth,
          height: size,
        };
      case "split-panel":
        return {
          x: padding * 1.5,
          y: height - padding * 1.55 - size,
          width: wideWidth,
          height: size,
        };
      case "bottom-letter":
      case "title-frame":
        return {
          x: xRight,
          y: padding * 1.45,
          width: wideWidth,
          height: size,
        };
      case "postcard":
        return {
          x: width - padding * 2.75,
          y: padding * 1.38,
          width: padding * 1.55,
          height: padding * 1.15,
        };
      case "bold-stack":
        return {
          x: xCenter,
          y: height * 0.67,
          width: wideWidth,
          height: size,
        };
      case "compact-note":
        return {
          x: xCenter,
          y: height * 0.67,
          width: wideWidth,
          height: size,
        };
      default:
        return {
          x: xCenter,
          y: yBottom,
          width: wideWidth,
          height: size,
        };
    }
  }

  function drawImageCover(ctx, image, x, y, width, height) {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    if (!imageWidth || !imageHeight) return;

    const scale = Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function getSalutationLine(config, punctuation = true) {
    const salutation = cleanField(config.salutation || "", 32);
    const recipient = cleanField(config.recipient || "Mom", 40);
    const line = [salutation, recipient].filter(Boolean).join(" ");
    if (!line) return punctuation ? "Dear Mom," : "Dear Mom";
    return punctuation ? `${line},` : line;
  }

  function getSignatureLine(config, options = {}) {
    const signoff = cleanField(config.signoff || "", 40);
    const signature = cleanField(config.signature || "", 50);
    const prefix = options.prefix || "";
    const separator = options.separator || ", ";
    const line =
      signoff && signature
        ? `${signoff}${separator}${signature}`
        : signoff || signature || "With love";

    return `${prefix}${line}`;
  }

  function hasCardPhoto(config) {
    return Boolean(config.photoDataUrl);
  }

  function getPhotoTextRegion(config, width, height, padding) {
    if (!hasCardPhoto(config)) {
      return null;
    }

    const photoRect = getPhotoFrameRect(
      config.textLayout,
      width,
      height,
      padding,
    );
    const minSide = Math.min(width, height);
    const gap = Math.max(24, minSide * 0.03);
    const x = padding * 1.55;
    const maxWidth = Math.max(minSide * 0.34, photoRect.x - x - gap);

    return {
      x,
      centerX: x + maxWidth / 2,
      maxWidth,
      photoRect,
    };
  }

  function drawCardText(ctx, config, width, height, padding, palette) {
    switch (config.textLayout) {
      case "editorial-left":
        drawEditorialLeftText(ctx, config, width, height, padding, palette);
        break;
      case "split-panel":
        drawSplitPanelText(ctx, config, width, height, padding, palette);
        break;
      case "bottom-letter":
        drawBottomLetterText(ctx, config, width, height, padding, palette);
        break;
      case "title-frame":
        drawTitleFrameText(ctx, config, width, height, padding, palette);
        break;
      case "postcard":
        drawPostcardText(ctx, config, width, height, padding, palette);
        break;
      case "bold-stack":
        drawBoldStackText(ctx, config, width, height, padding, palette);
        break;
      case "compact-note":
        drawCompactNoteText(ctx, config, width, height, padding, palette);
        break;
      default:
        drawClassicCenterText(ctx, config, width, height, padding, palette);
    }
  }

  function drawClassicCenterText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const includesPhoto = hasCardPhoto(config);
    drawFittedSingleLine(ctx, {
      text: "Happy Mother's Day",
      x: width / 2,
      y: height * 0.22,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.titleSize,
      minFontSize: 42,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
    });
    drawFittedSingleLine(ctx, {
      text: getSalutationLine(config),
      x: width / 2,
      y: height * 0.34,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.recipientSize,
      minFontSize: 24,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.accent,
    });
    drawFittedParagraph(ctx, {
      text: config.message || DEFAULT_MESSAGE,
      x: width / 2,
      y: height * 0.43,
      maxWidth: metrics.maxTextWidth,
      maxHeight: height * (includesPhoto ? 0.2 : 0.25),
      fontSize: metrics.messageSize,
      minFontSize: 22,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: width / 2,
      y: height - padding * 1.65,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.signatureSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
    });
  }

  function drawEditorialLeftText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const leftX = padding * 1.65;
    const maxWidth = width - padding * 3.2;
    const photoRegion = getPhotoTextRegion(config, width, height, padding);
    const safeMaxWidth = photoRegion
      ? Math.min(maxWidth, photoRegion.maxWidth)
      : maxWidth;
    drawFittedSingleLine(ctx, {
      text: "Happy Mother's Day",
      x: leftX,
      y: height * 0.22,
      maxWidth: safeMaxWidth,
      fontSize: metrics.titleSize * 0.9,
      minFontSize: 36,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
      align: "left",
    });
    drawFittedSingleLine(ctx, {
      text: getSalutationLine(config, false),
      x: leftX,
      y: height * 0.33,
      maxWidth: safeMaxWidth,
      fontSize: metrics.recipientSize,
      minFontSize: 24,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.accent,
      align: "left",
    });
    drawFittedParagraph(ctx, {
      text: config.message || DEFAULT_MESSAGE,
      x: leftX,
      y: height * 0.5,
      maxWidth: Math.min(maxWidth * 0.78, safeMaxWidth),
      maxHeight: height * 0.28,
      fontSize: metrics.messageSize,
      minFontSize: 22,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
      align: "left",
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config, { prefix: "- " }),
      x: leftX,
      y: height - padding * 1.65,
      maxWidth: safeMaxWidth,
      fontSize: metrics.signatureSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
      align: "left",
    });
  }

  function drawSplitPanelText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const centerX = width / 2;
    const gutter = padding * 0.5;
    const leftX = padding * 1.55;
    const rightX = centerX + gutter;
    const leftWidth = centerX - leftX - gutter;
    const rightWidth = width - rightX - padding * 1.05;
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = Math.max(3, metrics.minSide * 0.004);
    ctx.beginPath();
    ctx.moveTo(centerX, padding * 1.65);
    ctx.lineTo(centerX, height - padding * 1.65);
    ctx.stroke();
    ctx.restore();

    drawStackedTitle(ctx, {
      lines: ["Happy", "Mother's", "Day"],
      x: leftX,
      y: height * 0.38,
      maxWidth: leftWidth,
      maxHeight: height * 0.32,
      fontSize: metrics.titleSize * 0.76,
      minFontSize: 28,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
      align: "left",
      lineHeightRatio: 1.0,
    });
    drawFittedSingleLine(ctx, {
      text: getSalutationLine(config, false),
      x: leftX,
      y: height * 0.62,
      maxWidth: leftWidth,
      fontSize: metrics.recipientSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.accent,
      align: "left",
    });
    drawFittedParagraph(ctx, {
      text: config.message || DEFAULT_MESSAGE,
      x: rightX,
      y: height * 0.45,
      maxWidth: rightWidth,
      maxHeight: height * 0.35,
      fontSize: metrics.messageSize * 0.74,
      minFontSize: 18,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
      align: "left",
      lineHeightRatio: 1.28,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: rightX,
      y: height * 0.68,
      maxWidth: rightWidth,
      fontSize: metrics.signatureSize * 0.88,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
      align: "left",
    });
  }

  function drawBottomLetterText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const photoRegion = getPhotoTextRegion(config, width, height, padding);
    const titleX = photoRegion ? photoRegion.centerX : width / 2;
    const titleWidth = photoRegion
      ? photoRegion.maxWidth
      : metrics.maxTextWidth;
    drawFittedSingleLine(ctx, {
      text: "Happy Mother's Day",
      x: titleX,
      y: height * 0.25,
      maxWidth: titleWidth,
      fontSize: metrics.titleSize,
      minFontSize: 42,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
    });
    drawFittedParagraph(ctx, {
      text: `${getSalutationLine(config)} ${config.message || DEFAULT_MESSAGE}`,
      x: width / 2,
      y: height * 0.63,
      maxWidth: metrics.maxTextWidth * 0.88,
      maxHeight: height * 0.26,
      fontSize: metrics.messageSize,
      minFontSize: 21,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: width / 2,
      y: height * 0.78,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.signatureSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
    });
  }

  function drawTitleFrameText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const photoRegion = getPhotoTextRegion(config, width, height, padding);
    const titleX = photoRegion ? photoRegion.centerX : width / 2;
    const titleWidth = photoRegion
      ? photoRegion.maxWidth
      : metrics.maxTextWidth;
    const boxX = padding * 1.55;
    const boxY = height * 0.38;
    const boxWidth = width - padding * 3.1;
    const boxHeight = height * 0.32;
    drawFittedSingleLine(ctx, {
      text: "Happy Mother's Day",
      x: titleX,
      y: height * 0.24,
      maxWidth: titleWidth,
      fontSize: metrics.titleSize * 0.94,
      minFontSize: 38,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
    });
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = Math.max(3, metrics.minSide * 0.004);
    roundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 22);
    ctx.stroke();
    ctx.restore();
    drawFittedSingleLine(ctx, {
      text: getSalutationLine(config),
      x: width / 2,
      y: boxY + boxHeight * 0.22,
      maxWidth: boxWidth * 0.82,
      fontSize: metrics.recipientSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.accent,
    });
    drawFittedParagraph(ctx, {
      text: config.message || DEFAULT_MESSAGE,
      x: width / 2,
      y: boxY + boxHeight * 0.55,
      maxWidth: boxWidth * 0.78,
      maxHeight: boxHeight * 0.42,
      fontSize: metrics.messageSize * 0.88,
      minFontSize: 20,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: width / 2,
      y: height - padding * 1.55,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.signatureSize,
      minFontSize: 22,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
    });
  }

  function drawPostcardText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const leftX = padding * 1.55;
    const rightX = width * 0.54;
    const leftWidth = width * 0.5 - leftX - padding * 0.35;
    const rightWidth = width - rightX - padding * 1.1;
    ctx.save();
    ctx.strokeStyle = palette.muted;
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = Math.max(2, metrics.minSide * 0.003);
    ctx.beginPath();
    ctx.moveTo(width * 0.5, padding * 1.75);
    ctx.lineTo(width * 0.5, height - padding * 1.75);
    ctx.stroke();
    ctx.strokeRect(
      width - padding * 2.6,
      padding * 1.45,
      padding * 1.35,
      padding * 1.0,
    );
    ctx.restore();
    drawStackedTitle(ctx, {
      lines: ["Happy", "Mother's", "Day"],
      x: leftX,
      y: height * 0.34,
      maxWidth: leftWidth,
      maxHeight: height * 0.28,
      fontSize: metrics.titleSize * 0.72,
      minFontSize: 26,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
      align: "left",
      lineHeightRatio: 1.0,
    });
    drawFittedParagraph(ctx, {
      text: `${getSalutationLine(config)} ${config.message || DEFAULT_MESSAGE}`,
      x: rightX,
      y: height * 0.48,
      maxWidth: rightWidth,
      maxHeight: height * 0.34,
      fontSize: metrics.messageSize * 0.72,
      minFontSize: 18,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
      align: "left",
      lineHeightRatio: 1.28,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: rightX,
      y: height * 0.7,
      maxWidth: rightWidth,
      fontSize: metrics.signatureSize * 0.78,
      minFontSize: 20,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
      align: "left",
    });
  }

  function drawBoldStackText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const includesPhoto = hasCardPhoto(config);
    const stackSize = Math.min(112, Math.max(54, metrics.minSide * 0.092));
    ["Happy", "Mother's", "Day"].forEach((line, index) => {
      drawFittedSingleLine(ctx, {
        text: line,
        x: width / 2,
        y: height * (0.22 + index * 0.09),
        maxWidth: metrics.maxTextWidth,
        fontSize: stackSize,
        minFontSize: 34,
        weight: 800,
        family: FONT_STACK,
        color: index === 1 ? palette.accent : palette.title,
      });
    });
    drawFittedSingleLine(ctx, {
      text: getSalutationLine(config, false),
      x: width / 2,
      y: height * 0.52,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.recipientSize,
      minFontSize: 22,
      weight: 800,
      family: BODY_FONT_STACK,
      color: palette.accentTwo,
    });
    drawFittedParagraph(ctx, {
      text: config.message || DEFAULT_MESSAGE,
      x: width / 2,
      y: height * (includesPhoto ? 0.58 : 0.64),
      maxWidth: metrics.maxTextWidth * 0.82,
      maxHeight: height * (includesPhoto ? 0.12 : 0.18),
      fontSize: metrics.messageSize * 0.82,
      minFontSize: 19,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: width / 2,
      y: includesPhoto ? height - padding * 1.35 : height * 0.78,
      maxWidth: metrics.maxTextWidth,
      fontSize: metrics.signatureSize * 0.9,
      minFontSize: 20,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
    });
  }

  function drawCompactNoteText(ctx, config, width, height, padding, palette) {
    const metrics = getSharedTextMetrics(width, height, padding);
    const includesPhoto = hasCardPhoto(config);
    drawFittedSingleLine(ctx, {
      text: "Mother's Day",
      x: width / 2,
      y: height * 0.28,
      maxWidth: metrics.maxTextWidth * 0.8,
      fontSize: metrics.titleSize * 0.8,
      minFontSize: 34,
      weight: 800,
      family: FONT_STACK,
      color: palette.title,
    });
    drawFittedParagraph(ctx, {
      text: `${getSalutationLine(config, false)} - ${config.message || DEFAULT_MESSAGE}`,
      x: width / 2,
      y: height * (includesPhoto ? 0.45 : 0.49),
      maxWidth: metrics.maxTextWidth * 0.78,
      maxHeight: height * (includesPhoto ? 0.2 : 0.25),
      fontSize: metrics.messageSize * 0.76,
      minFontSize: 18,
      weight: 500,
      family: BODY_FONT_STACK,
      color: palette.text,
      lineHeightRatio: 1.28,
    });
    drawFittedSingleLine(ctx, {
      text: getSignatureLine(config),
      x: width / 2,
      y: includesPhoto ? height - padding * 1.35 : height * 0.67,
      maxWidth: metrics.maxTextWidth * 0.72,
      fontSize: metrics.signatureSize * 0.76,
      minFontSize: 18,
      weight: 700,
      family: BODY_FONT_STACK,
      color: palette.muted,
    });
  }

  function getSharedTextMetrics(width, height, padding) {
    const minSide = Math.min(width, height);
    return {
      minSide,
      maxTextWidth: width - padding * 3.2,
      titleSize: Math.min(104, Math.max(68, minSide * 0.085)),
      recipientSize: Math.min(52, Math.max(34, minSide * 0.043)),
      messageSize: Math.min(44, Math.max(28, minSide * 0.036)),
      signatureSize: Math.min(48, Math.max(28, minSide * 0.039)),
    };
  }

  function drawFittedSingleLine(ctx, options) {
    let size = options.fontSize;
    const align = options.align || "center";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color;

    while (size > options.minFontSize) {
      ctx.font = `${options.weight} ${size}px ${options.family}`;
      if (ctx.measureText(options.text).width <= options.maxWidth) break;
      size -= 2;
    }

    ctx.font = `${options.weight} ${size}px ${options.family}`;
    ctx.fillText(options.text, options.x, options.y);
  }

  function drawStackedTitle(ctx, options) {
    const lines = (options.lines || []).filter(Boolean);
    if (!lines.length) return;

    let size = options.fontSize;
    const align = options.align || "center";
    const lineHeightRatio = options.lineHeightRatio || 1.0;
    let lineHeight = size * lineHeightRatio;

    while (size >= options.minFontSize) {
      ctx.font = `${options.weight} ${size}px ${options.family}`;
      lineHeight = size * lineHeightRatio;
      const fitsWidth = lines.every(
        (line) => ctx.measureText(line).width <= options.maxWidth,
      );
      const fitsHeight = lines.length * lineHeight <= options.maxHeight;
      if (fitsWidth && fitsHeight) break;
      if (size === options.minFontSize) break;
      size = Math.max(options.minFontSize, size - 2);
    }

    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color;
    ctx.font = `${options.weight} ${size}px ${options.family}`;

    const startY = options.y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, options.x, startY + index * lineHeight);
    });
  }

  function drawFittedParagraph(ctx, options) {
    let size = options.fontSize;
    let lines = [];
    const lineHeightRatio = options.lineHeightRatio || 1.35;
    let lineHeight = size * lineHeightRatio;
    const align = options.align || "center";
    const allowWordBreak = options.allowWordBreak === true;

    while (size >= options.minFontSize) {
      ctx.font = `${options.weight} ${size}px ${options.family}`;
      lines = wrapText(ctx, options.text, options.maxWidth, {
        allowWordBreak,
      });
      lineHeight = size * lineHeightRatio;
      if (
        lines.length * lineHeight <= options.maxHeight &&
        !linesOverflow(ctx, lines, options.maxWidth)
      ) {
        break;
      }
      if (size === options.minFontSize) break;
      size = Math.max(options.minFontSize, size - 2);
    }

    if (!allowWordBreak && linesOverflow(ctx, lines, options.maxWidth)) {
      ctx.font = `${options.weight} ${size}px ${options.family}`;
      lines = wrapText(ctx, options.text, options.maxWidth, {
        allowWordBreak: true,
      });
    }

    const maxLines = Math.max(1, Math.floor(options.maxHeight / lineHeight));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let lastLine = lines[lines.length - 1];
      while (
        lastLine.length > 0 &&
        ctx.measureText(`${lastLine}...`).width > options.maxWidth
      ) {
        lastLine = lastLine.slice(0, -1).trim();
      }
      lines[lines.length - 1] = `${lastLine}...`;
    }

    const startY = options.y - ((lines.length - 1) * lineHeight) / 2;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color;
    ctx.font = `${options.weight} ${size}px ${options.family}`;

    lines.forEach((line, index) => {
      ctx.fillText(line, options.x, startY + index * lineHeight);
    });
  }

  function wrapText(ctx, text, maxWidth, options = {}) {
    const allowWordBreak = options.allowWordBreak === true;
    const words = String(text || "")
      .split(/\s+/)
      .filter(Boolean);
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
        return;
      }

      if (currentLine) lines.push(currentLine);

      if (allowWordBreak && ctx.measureText(word).width > maxWidth) {
        const chunks = splitLongWord(ctx, word, maxWidth);
        lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1] || "";
        return;
      }

      currentLine = word;
    });

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [DEFAULT_MESSAGE];
  }

  function linesOverflow(ctx, lines, maxWidth) {
    return lines.some((line) => ctx.measureText(line).width > maxWidth + 0.5);
  }

  function splitLongWord(ctx, word, maxWidth) {
    const chunks = [];
    let currentChunk = "";

    Array.from(word).forEach((character) => {
      const testChunk = `${currentChunk}${character}`;
      if (!currentChunk || ctx.measureText(testChunk).width <= maxWidth) {
        currentChunk = testChunk;
        return;
      }

      chunks.push(currentChunk);
      currentChunk = character;
    });

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  function drawPeonyCluster(ctx, x, y, radius, rotation, palette, index) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = palette.leaf;
    ctx.globalAlpha = 0.72;
    [
      [-radius * 0.92, radius * 0.1, -0.5],
      [radius * 0.86, radius * 0.14, 0.48],
      [-radius * 0.52, radius * 0.78, -0.9],
      [radius * 0.58, radius * 0.78, 0.82],
    ].forEach(([leafX, leafY, leafRotation]) => {
      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate(leafRotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.62, radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.globalAlpha = 1;
    [
      [0, 0, 1],
      [-radius * 0.5, radius * 0.2, 0.72],
      [radius * 0.46, radius * 0.26, 0.66],
    ].forEach(([flowerX, flowerY, scale], flowerIndex) => {
      drawLayeredBloom(
        ctx,
        flowerX,
        flowerY,
        radius * scale,
        palette,
        index + flowerIndex,
      );
    });

    ctx.restore();
  }

  function drawLayeredBloom(ctx, x, y, radius, palette, seed) {
    const colors = [palette.accent, palette.accentTwo, "#fff7ad"];

    ctx.save();
    ctx.translate(x, y);
    for (let layer = 0; layer < 3; layer += 1) {
      const petalCount = 7 + layer * 2;
      const layerRadius = radius * (1 - layer * 0.22);
      ctx.fillStyle = colors[layer % colors.length];
      ctx.globalAlpha = layer === 0 ? 0.72 : 0.82;

      for (let i = 0; i < petalCount; i += 1) {
        ctx.save();
        ctx.rotate(((Math.PI * 2) / petalCount) * i + seed * 0.14);
        ctx.beginPath();
        ctx.ellipse(
          layerRadius * 0.42,
          0,
          layerRadius * 0.34,
          layerRadius * 0.16,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.title;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWildflowerStem(
    ctx,
    x,
    baseY,
    height,
    lean,
    flowerColor,
    palette,
    index,
  ) {
    const topX = x + height * lean;
    const topY = baseY - height;

    ctx.save();
    ctx.strokeStyle = palette.leaf;
    ctx.fillStyle = palette.leaf;
    ctx.lineWidth = Math.max(3, height * 0.018);
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(
      x + height * lean * 0.5,
      baseY - height * 0.52,
      topX,
      topY,
    );
    ctx.stroke();

    for (let leafIndex = 0; leafIndex < 2; leafIndex += 1) {
      const t = 0.35 + leafIndex * 0.26;
      const leafX = x + (topX - x) * t;
      const leafY = baseY + (topY - baseY) * t;
      const side = (leafIndex + index) % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(
        leafX + side * height * 0.045,
        leafY,
        height * 0.075,
        height * 0.026,
        side * 0.56,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    drawTinyBloom(ctx, topX, topY, height * 0.11, flowerColor, palette);
    ctx.restore();
  }

  function drawTinyBloom(ctx, x, y, radius, flowerColor, palette) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = flowerColor;
    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / 5);
      ctx.beginPath();
      ctx.ellipse(
        radius * 0.52,
        0,
        radius * 0.35,
        radius * 0.18,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = palette.accentTwo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTulip(ctx, x, baseY, height, lean, flowerColor, palette, index) {
    const bloomY = baseY - height;
    const bloomX = x + height * lean;
    const bloomWidth = height * 0.34;
    const bloomHeight = height * 0.28;

    ctx.save();
    ctx.strokeStyle = palette.leaf;
    ctx.fillStyle = palette.leaf;
    ctx.lineWidth = Math.max(4, height * 0.025);
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(
      x + height * lean * 0.45,
      baseY - height * 0.48,
      bloomX,
      bloomY,
    );
    ctx.stroke();

    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.ellipse(
        x + side * height * 0.08,
        baseY - height * 0.34,
        height * 0.14,
        height * 0.04,
        side * 0.52,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    ctx.translate(bloomX, bloomY);
    ctx.rotate(lean * 0.3);
    ctx.fillStyle = flowerColor;
    ctx.globalAlpha = 0.86;
    ctx.beginPath();
    ctx.moveTo(0, bloomHeight * 0.52);
    ctx.bezierCurveTo(
      -bloomWidth * 0.58,
      bloomHeight * 0.18,
      -bloomWidth * 0.42,
      -bloomHeight * 0.62,
      0,
      -bloomHeight * 0.28,
    );
    ctx.bezierCurveTo(
      bloomWidth * 0.42,
      -bloomHeight * 0.62,
      bloomWidth * 0.58,
      bloomHeight * 0.18,
      0,
      bloomHeight * 0.52,
    );
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = index % 2 === 0 ? palette.accentTwo : palette.accent;
    [-0.28, 0.28].forEach((offset) => {
      ctx.beginPath();
      ctx.ellipse(
        bloomWidth * offset,
        bloomHeight * 0.02,
        bloomWidth * 0.2,
        bloomHeight * 0.48,
        offset,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFlower(
    ctx,
    x,
    y,
    radius,
    rotation,
    palette,
    variant = "default",
  ) {
    const petalCount = variant === "daisy" ? 10 : 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    for (let i = 0; i < petalCount; i += 1) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / petalCount);
      ctx.fillStyle =
        variant === "daisy"
          ? palette.accentTwo
          : i % 2 === 0
            ? palette.accent
            : palette.accentTwo;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.ellipse(
        radius * 0.58,
        0,
        radius * 0.42,
        radius * (variant === "orchid" ? 0.3 : 0.22),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = variant === "orchid" ? palette.accentTwo : "#fff7ad";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.leaf;
    ctx.lineWidth = Math.max(4, radius * 0.08);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, radius * 0.65);
    ctx.quadraticCurveTo(
      -radius * 0.95,
      radius * 1.02,
      -radius * 1.3,
      radius * 1.5,
    );
    ctx.stroke();

    ctx.fillStyle = palette.leaf;
    ctx.beginPath();
    ctx.ellipse(
      -radius * 1.05,
      radius * 1.05,
      radius * 0.32,
      radius * 0.16,
      -0.55,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  function drawSprig(ctx, x, y, length, rotation, palette) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = palette.leaf;
    ctx.fillStyle = palette.leaf;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.15, length * 0.35, 0, length);
    ctx.stroke();

    for (let i = 1; i <= 5; i += 1) {
      const leafY = (length / 6) * i;
      const side = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(
        side * length * 0.11,
        leafY,
        length * 0.12,
        length * 0.04,
        side * 0.55,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHeart(ctx, x, y, size, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(size / 32, size / 32);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.bezierCurveTo(-20, -8, -16, -26, 0, -14);
    ctx.bezierCurveTo(16, -26, 20, -8, 0, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(ctx, x, y, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius * 0.25, y - radius * 0.25);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x + radius * 0.25, y + radius * 0.25);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius * 0.25, y + radius * 0.25);
    ctx.lineTo(x - radius, y);
    ctx.lineTo(x - radius * 0.25, y - radius * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPreviewWatermark(ctx, width, height, palette) {
    const minSide = Math.min(width, height);
    const watermarkSize = Math.max(42, minSide * 0.13);
    const bandHeight = Math.max(44, minSide * 0.09);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 5.8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${watermarkSize}px ${FONT_STACK}`;
    ctx.lineWidth = Math.max(3, minSide * 0.007);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";
    ctx.fillStyle = "rgba(15, 23, 42, 0.2)";

    for (let y = -height; y <= height; y += watermarkSize * 1.55) {
      for (let x = -width; x <= width; x += watermarkSize * 3.9) {
        ctx.strokeText("PREVIEW", x, y);
        ctx.fillText("PREVIEW", x, y);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.76)";
    ctx.fillRect(0, height - bandHeight, width, bandHeight);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(13, minSide * 0.026)}px ${BODY_FONT_STACK}`;
    ctx.fillText(
      "PREVIEW ONLY - PAID DOWNLOAD REMOVES WATERMARK",
      width / 2,
      height - bandHeight / 2,
    );

    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(2, minSide * 0.004);
    ctx.beginPath();
    ctx.moveTo(0, height - bandHeight);
    ctx.lineTo(width, height - bandHeight);
    ctx.stroke();
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function encodeConfig(config) {
    const normalized = normalizeConfig(config);
    return toBase64Url(JSON.stringify(normalized));
  }

  function decodeConfig(token) {
    if (!token || typeof token !== "string") {
      throw new Error("Missing card configuration.");
    }

    return normalizeConfig(JSON.parse(fromBase64Url(token)));
  }

  function toBase64Url(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function fromBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
  }

  function createDownloadPath(config) {
    return `/pages/downloads/mothers-day-card.html#card=${encodeConfig(config)}`;
  }

  function cloneOptions(options) {
    return options.map((option) => ({ ...option }));
  }

  window.MothersDayCardRenderer = {
    normalizeConfig,
    renderToCanvas,
    renderToCanvasAsync,
    getPrice,
    getFilename,
    encodeConfig,
    decodeConfig,
    createDownloadPath,
    getStyleOptions: () => cloneOptions(STYLE_OPTIONS),
    getLayoutOptions: () => cloneOptions(LAYOUT_OPTIONS),
    getTextLayoutOptions: () => cloneOptions(TEXT_LAYOUT_OPTIONS),
    getStyle,
    getLayout,
    getTextLayout,
  };
})();
