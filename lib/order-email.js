const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
const DEFAULT_SITE_URL = "https://trietdev.com";

function getEmailConfig(env = process.env) {
  return {
    apiKey: env.RESEND_API_KEY || "",
    from: env.ORDER_EMAIL_FROM || env.RESEND_FROM_EMAIL || "",
    adminTo: env.ORDER_EMAIL_TO || env.ADMIN_EMAIL || "",
    siteUrl: env.SITE_URL || DEFAULT_SITE_URL,
  };
}

function validateEmailConfig(config) {
  const missing = [];

  if (!config.apiKey) missing.push("RESEND_API_KEY");
  if (!config.from) missing.push("ORDER_EMAIL_FROM");
  if (parseRecipients(config.adminTo).length === 0) {
    missing.push("ORDER_EMAIL_TO");
  }

  return missing;
}

function validateOrderData(orderData) {
  if (!orderData || typeof orderData !== "object") {
    return "Order data is required.";
  }

  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    return "Order must contain at least one item.";
  }

  const customerInfo = orderData.customerInfo || {};
  if (
    typeof customerInfo.name !== "string" ||
    customerInfo.name.trim().length < 2 ||
    customerInfo.name.length > 100
  ) {
    return "Valid customer name is required.";
  }

  if (!isValidEmail(customerInfo.email)) {
    return "Valid customer email is required.";
  }

  if (!["confirmed", "paid"].includes(orderData.status)) {
    return "Confirmed or paid order status is required.";
  }

  if (!orderData.paymentInfo?.transactionId) {
    return "Payment transaction details are required.";
  }

  return null;
}

function extractEmailAddress(from) {
  if (!from) return "";
  const str = String(from);
  const angleMatch = str.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1].trim();
  const simpleMatch = str.match(/[^\s<"]+@[^\s>"]+/);
  return simpleMatch ? simpleMatch[0].trim() : str.trim();
}

async function sendOrderEmails(orderData, env = process.env) {
  const config = getEmailConfig(env);
  const missingConfig = validateEmailConfig(config);

  if (missingConfig.length > 0) {
    throw new Error(`Missing email configuration: ${missingConfig.join(", ")}`);
  }

  const validationError = validateOrderData(orderData);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node runtime.");
  }
  const messages = buildOrderEmailMessages(orderData, config);

  // Extract the raw email address from the configured "from" so we can
  // include the domain in any helpful error messages returned to the caller.
  const fromEmailOnly = extractEmailAddress(config.from || "");
  const fromDomain = (fromEmailOnly.split("@")[1] || "").toLowerCase();

  const response = await fetch(RESEND_BATCH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(orderData),
      "User-Agent": "trietdev-store/1.0",
    },
    body: JSON.stringify(messages),
  });

  const responseText = await response.text();
  let responseBody = null;

  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    responseBody = responseText;
  }

  if (!response.ok) {
    const resendError =
      responseBody?.message ||
      responseBody?.error ||
      `Resend request failed with status ${response.status}`;

    // If the API indicates a domain/verification problem, make the message
    // more actionable by including the domain and a link to Resend's domain
    // verification page.
    const looksLikeDomainIssue = /verify|not verified|domain/i.test(
      String(resendError),
    );

    if (looksLikeDomainIssue) {
      const domainHint = fromDomain
        ? ` Please add and verify the domain ${fromDomain} at https://resend.com/domains`
        : ` Please add and verify your sending domain at https://resend.com/domains`;
      const err = new Error(`${resendError}${domainHint}`);
      err.statusCode = 422;
      throw err;
    }

    throw new Error(resendError);
  }

  return {
    success: true,
    sent: messages.length,
    response: responseBody,
  };
}

function buildOrderEmailMessages(orderData, config) {
  const customerEmail = orderData.customerInfo.email.trim().toLowerCase();
  const orderId = cleanText(orderData.orderId || `ORD-${Date.now()}`);
  const adminSubject = `New order ${orderId}`;
  const customerSubject = `Order ${orderId} confirmed`;

  return [
    {
      from: config.from,
      to: parseRecipients(config.adminTo),
      subject: adminSubject,
      html: buildAdminHtml(orderData, config),
      text: buildAdminText(orderData, config),
      tags: buildTags(orderId, "admin"),
    },
    {
      from: config.from,
      to: [customerEmail],
      subject: customerSubject,
      html: buildCustomerHtml(orderData, config),
      text: buildCustomerText(orderData, config),
      tags: buildTags(orderId, "customer"),
    },
  ];
}

function buildAdminText(orderData, config) {
  const customerInfo = orderData.customerInfo || {};
  const paymentInfo = orderData.paymentInfo || {};
  const lines = [
    `Order: ${cleanText(orderData.orderId || "Unknown")}`,
    `Date: ${formatDate(orderData.confirmedAt || orderData.timestamp)}`,
    "",
    "Customer",
    `Name: ${cleanText(customerInfo.name || "Not provided")}`,
    `Email: ${cleanText(customerInfo.email || "Not provided")}`,
    `Phone: ${cleanText(customerInfo.phone || "Not provided")}`,
    `Preferred contact: ${cleanText(customerInfo.preferredContact || "Email")}`,
    "",
    "Payment",
    `Method: ${formatPaymentMethod(paymentInfo.paymentMethod)}`,
    `Status: ${cleanText(paymentInfo.status || orderData.status || "Unknown")}`,
    `Transaction: ${cleanText(paymentInfo.transactionId || "Not available")}`,
    "",
    "Items",
    ...orderData.items.map((item, index) =>
      formatItemText(item, index, config.siteUrl),
    ),
    "",
    "Totals",
    `Subtotal: ${formatMoney(orderData.summary?.subtotal)}`,
    `Tax: ${formatMoney(orderData.summary?.tax)}`,
    `Total: ${formatMoney(orderData.summary?.total)}`,
    "",
    `Notes: ${cleanText(orderData.notes || "No additional notes")}`,
  ];

  return lines.join("\n");
}

function buildCustomerText(orderData, config) {
  const downloads = getDigitalDownloads(orderData, config.siteUrl);
  const lines = [
    `Thanks for your order, ${cleanText(orderData.customerInfo?.name || "there")}.`,
    `Order: ${cleanText(orderData.orderId || "Unknown")}`,
    `Total: ${formatMoney(orderData.summary?.total)}`,
    "",
    "Items",
    ...orderData.items.map((item, index) =>
      formatItemText(item, index, config.siteUrl),
    ),
  ];

  if (downloads.length > 0) {
    lines.push(
      "",
      "Downloads",
      ...downloads.map((item) => `${item.title}: ${item.downloadUrl}`),
    );
  }

  lines.push("", "I will follow up if anything else is needed for this order.");

  return lines.join("\n");
}

function buildAdminHtml(orderData, config) {
  return buildEmailShell(
    "New Order",
    `Order ${escapeHtml(orderData.orderId || "Unknown")}`,
    `
      ${buildCustomerHtmlBlock(orderData)}
      ${buildPaymentHtmlBlock(orderData)}
      ${buildItemsHtmlBlock(orderData, config.siteUrl)}
      ${buildTotalsHtmlBlock(orderData)}
      <p><strong>Notes:</strong> ${escapeHtml(orderData.notes || "No additional notes")}</p>
    `,
  );
}

function buildCustomerHtml(orderData, config) {
  const downloads = getDigitalDownloads(orderData, config.siteUrl);
  const downloadBlock =
    downloads.length > 0
      ? `
        <h2>Downloads</h2>
        <ul>
          ${downloads
            .map(
              (item) =>
                `<li><a href="${escapeHtml(item.downloadUrl)}">${escapeHtml(item.title)}</a></li>`,
            )
            .join("")}
        </ul>
      `
      : "";

  return buildEmailShell(
    "Order Confirmed",
    `Thanks, ${escapeHtml(orderData.customerInfo?.name || "there")}`,
    `
      <p>Your order has been confirmed. I will follow up if anything else is needed.</p>
      ${buildItemsHtmlBlock(orderData, config.siteUrl)}
      ${downloadBlock}
      ${buildTotalsHtmlBlock(orderData)}
    `,
  );
}

function buildEmailShell(label, heading, body) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f6f8fb;color:#172033;font-family:Arial,sans-serif;">
        <div style="max-width:680px;margin:0 auto;padding:28px 18px;">
          <p style="margin:0 0 12px;color:#0f766e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${label}</p>
          <div style="background:#ffffff;border:1px solid #e6ebf2;border-radius:8px;padding:24px;">
            <h1 style="margin:0 0 18px;color:#111827;font-size:24px;">${heading}</h1>
            ${body}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildCustomerHtmlBlock(orderData) {
  const customerInfo = orderData.customerInfo || {};
  return `
    <h2>Customer</h2>
    <p>
      <strong>Name:</strong> ${escapeHtml(customerInfo.name || "Not provided")}<br>
      <strong>Email:</strong> ${escapeHtml(customerInfo.email || "Not provided")}<br>
      <strong>Phone:</strong> ${escapeHtml(customerInfo.phone || "Not provided")}<br>
      <strong>Preferred contact:</strong> ${escapeHtml(customerInfo.preferredContact || "Email")}
    </p>
  `;
}

function buildPaymentHtmlBlock(orderData) {
  const paymentInfo = orderData.paymentInfo || {};
  return `
    <h2>Payment</h2>
    <p>
      <strong>Method:</strong> ${escapeHtml(formatPaymentMethod(paymentInfo.paymentMethod))}<br>
      <strong>Status:</strong> ${escapeHtml(paymentInfo.status || orderData.status || "Unknown")}<br>
      <strong>Transaction:</strong> ${escapeHtml(paymentInfo.transactionId || "Not available")}
    </p>
  `;
}

function buildItemsHtmlBlock(orderData, siteUrl) {
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  return `
    <h2>Items</h2>
    <ul>
      ${items
        .map((item) => {
          const name = getItemName(item);
          const description = getItemDescription(item);
          const downloadUrl = getDownloadUrl(item, siteUrl);
          const customizationBlock = buildCustomizationHtml(item);
          const downloadLine = downloadUrl
            ? `<br><a href="${escapeHtml(downloadUrl)}">Download</a>`
            : "";
          return `
            <li>
              <strong>${escapeHtml(name)}</strong> - ${escapeHtml(formatMoney(getItemPrice(item)))}
              <br>${escapeHtml(description)}
              ${customizationBlock}
              ${downloadLine}
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function buildTotalsHtmlBlock(orderData) {
  return `
    <h2>Totals</h2>
    <p>
      <strong>Subtotal:</strong> ${escapeHtml(formatMoney(orderData.summary?.subtotal))}<br>
      <strong>Tax:</strong> ${escapeHtml(formatMoney(orderData.summary?.tax))}<br>
      <strong>Total:</strong> ${escapeHtml(formatMoney(orderData.summary?.total))}
    </p>
  `;
}

function formatItemText(item, index, siteUrl) {
  const lines = [
    `${index + 1}. ${getItemName(item)} - ${formatMoney(getItemPrice(item))}`,
    `   ${getItemDescription(item)}`,
  ];
  const files = Array.isArray(item.product?.files) ? item.product.files : [];
  const downloadUrl = getDownloadUrl(item, siteUrl);

  if (files.length > 0) {
    lines.push(`   Files: ${files.map(cleanText).join(", ")}`);
  }

  getCustomizationLines(item).forEach((line) => {
    lines.push(`   ${line}`);
  });

  if (downloadUrl) {
    lines.push(`   Download: ${downloadUrl}`);
  }

  return lines.join("\n");
}

function buildCustomizationHtml(item) {
  const lines = getCustomizationLines(item);
  if (lines.length === 0) return "";

  return `
    <ul>
      ${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
    </ul>
  `;
}

function getCustomizationLines(item) {
  const customization = item?.product?.customization;
  if (!customization) return [];

  const lines = [];
  if (customization.styleLabel) {
    lines.push(`Style: ${cleanText(customization.styleLabel)}`);
  }
  if (customization.layoutLabel) {
    lines.push(`Format: ${cleanText(customization.layoutLabel)}`);
  }
  if (customization.textLayoutLabel) {
    lines.push(`Text layout: ${cleanText(customization.textLayoutLabel)}`);
  }
  if (customization.recipient) {
    lines.push(`Recipient: ${cleanText(customization.recipient)}`);
  }
  if (customization.message) {
    lines.push(`Message: ${cleanText(customization.message)}`);
  }
  if (customization.signature) {
    lines.push(`Signature: ${cleanText(customization.signature)}`);
  }
  if (customization.outputFormat) {
    lines.push(`Format: ${cleanText(customization.outputFormat)}`);
  }

  return lines;
}

function getDigitalDownloads(orderData, siteUrl) {
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  return items
    .filter((item) => item.itemType === "product" || Boolean(item.product))
    .map((item) => ({
      title: getItemName(item),
      downloadUrl: getDownloadUrl(item, siteUrl),
    }))
    .filter((item) => item.downloadUrl);
}

function getItemName(item) {
  return cleanText(item?.product?.title || item?.service?.name || "Item");
}

function getItemDescription(item) {
  return cleanText(
    item?.product?.summary ||
      item?.projectDescription ||
      item?.service?.description ||
      "No description provided",
  );
}

function getItemPrice(item) {
  return Number(item?.pricing?.totalPrice || item?.service?.basePrice || 0);
}

function getDownloadUrl(item, siteUrl) {
  const downloadUrl = item?.product?.downloadUrl;
  if (!downloadUrl) return "";

  try {
    return new URL(downloadUrl, siteUrl).href;
  } catch (error) {
    return cleanText(downloadUrl);
  }
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-US", { timeZone: "America/New_York" });
}

function formatPaymentMethod(value) {
  if (value === "stripe") return "Stripe";
  if (value === "manual") return "Manual payment";
  if (value === "bitcoin") return "Bitcoin";
  return "Not available";
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim()
    .slice(0, 2000);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildTags(orderId, recipient) {
  return [
    { name: "order_id", value: sanitizeTagValue(orderId) },
    { name: "recipient", value: sanitizeTagValue(recipient) },
  ];
}

function sanitizeTagValue(value) {
  const sanitized = String(value || "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 256);
  return sanitized || "unknown";
}

function createIdempotencyKey(orderData) {
  return sanitizeTagValue(`order-email-${orderData.orderId || Date.now()}`);
}

module.exports = {
  buildOrderEmailMessages,
  getEmailConfig,
  sendOrderEmails,
  validateEmailConfig,
  validateOrderData,
};
