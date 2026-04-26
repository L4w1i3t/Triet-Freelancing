// =======================================================
// PRIVACY ANALYTICS - GDPR Compliant Analytics System
// =======================================================

class PrivacyAnalytics {
  constructor() {
    // Check if we're in development mode
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("github.io") ||
      window.location.protocol === "file:";

    this.config = {
      trackingEnabled: true, // Consent not required
      cookieless: true, // No cookies by default
      sessionOnly: true, // Only session storage
      anonymizeIPs: true,
      respectDoNotTrack: true,
      dataRetention: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      endpoint: "/api/analytics", // Your own analytics endpoint
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      developmentMode: isDevelopment, // Disable API calls in development
    };

    this.sessionId = this.generateSessionId();
    this.eventQueue = [];
    // Consent is no longer required; assume consent granted
    this.userConsent = true;
    this.doNotTrack = this.checkDoNotTrack();

    this.init();
  }

  init() {
    // Respect Do Not Track header
    if (this.doNotTrack) {
      console.log(" Analytics disabled due to Do Not Track setting");
      return;
    }

    // Consent banner removed; start tracking directly

    this.startTracking();
    this.setupEventListeners();
    this.startPeriodicFlush();

    console.log(" Privacy-compliant analytics initialized");
  }

  // ===============================================
  // CONSENT MANAGEMENT
  // ===============================================

  checkDoNotTrack() {
    return (
      navigator.doNotTrack === "1" ||
      navigator.doNotTrack === "yes" ||
      navigator.msDoNotTrack === "1" ||
      window.doNotTrack === "1"
    );
  }

  checkUserConsent() {
    const consent = localStorage.getItem("analytics_consent");
    const consentDate = localStorage.getItem("analytics_consent_date");

    if (!consent || !consentDate) return false;

    // Check if consent is still valid (1 year)
    const consentAge = Date.now() - parseInt(consentDate);
    const oneYear = 365 * 24 * 60 * 60 * 1000;

    if (consentAge > oneYear) {
      this.clearConsent();
      return false;
    }

    return consent === "granted";
  }

  grantConsent() {
    // Consent is assumed granted; start tracking directly
    this.startTracking();
    console.log(" Analytics consent granted");
  }

  revokeConsent() {
    this.clearConsent();
    this.clearAnalyticsData();
    this.userConsent = false;
    this.config.trackingEnabled = false;
    console.log(" Analytics consent revoked");
  }

  clearConsent() {
    localStorage.removeItem("analytics_consent");
    localStorage.removeItem("analytics_consent_date");
  }

  clearAnalyticsData() {
    sessionStorage.removeItem("analytics_session");
    sessionStorage.removeItem("analytics_events");
    this.eventQueue = [];
  }

  // ===============================================
  // CONSENT BANNER
  // ===============================================

  // showConsentBanner method removed as consent UI is no longer used.

  showPrivacyModal() {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="privacy-modal-overlay">
        <div class="privacy-modal">
          <div class="privacy-modal-header">
            <h3> Our Privacy-First Analytics</h3>
            <button class="privacy-modal-close">×</button>
          </div>
          <div class="privacy-modal-content">
            <h4>What We Track:</h4>
            <ul>
              <li>Page views and navigation patterns</li>
              <li>Commission inquiry and completion rates</li>
              <li>Performance metrics and error rates</li>
              <li>General geographic region (country only)</li>
            </ul>
            
            <h4>What We DON'T Track:</h4>
            <ul>
              <li>Personal information or contact details</li>
              <li>Exact location or IP addresses</li>
              <li>Cross-site tracking or cookies</li>
              <li>Browsing history on other sites</li>
            </ul>
            
            <h4>Privacy Features:</h4>
            <ul>
              <li> No cookies used</li>
              <li> Data stored locally in your browser</li>
              <li> No third-party analytics services</li>
              <li> Data automatically deleted after 30 days</li>
              <li> Respects "Do Not Track" setting</li>
            </ul>
            
            <p><strong>You can change your preference anytime in our privacy settings.</strong></p>
          </div>
          <div class="privacy-modal-actions">
            <button id="privacy-accept" class="consent-btn accept">Accept Analytics</button>
            <button id="privacy-decline" class="consent-btn decline">No Thanks</button>
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    const modalStyle = document.createElement("style");
    modalStyle.textContent = `
      // Consent banner and related UI have been removed as analytics are always enabled.
        margin-top: 0;
      }
      .privacy-modal-content ul {
        margin: 0.5rem 0 1rem 1rem;
        color: rgba(255, 255, 255, 0.8);
      }
      .privacy-modal-content li {
        margin-bottom: 0.25rem;
      }
      .privacy-modal-actions {
        padding: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
    `;
    document.head.appendChild(modalStyle);

    document.body.appendChild(modal);

    // Add event listeners
    modal
      .querySelector(".privacy-modal-close")
      .addEventListener("click", () => {
        modal.remove();
      });

    modal.querySelector("#privacy-accept").addEventListener("click", () => {
      this.grantConsent();
      modal.remove();
    });

    modal.querySelector("#privacy-decline").addEventListener("click", () => {
      this.dismissBanner();
      modal.remove();
    });

    // Close on overlay click
    modal
      .querySelector(".privacy-modal-overlay")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          modal.remove();
        }
      });
  }

  // ===============================================
  // SESSION MANAGEMENT
  // ===============================================

  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  startTracking() {
    this.config.trackingEnabled = true;

    // Track initial page view
    this.trackPageView();

    console.log(" Privacy analytics tracking started");
  }

  // ===============================================
  // EVENT TRACKING
  // ===============================================

  track(eventName, properties = {}) {
    if (!this.config.trackingEnabled || !this.userConsent) {
      return;
    }

    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      session_id: this.sessionId,
      page_url: this.getAnonymizedURL(),
      referrer: this.getAnonymizedReferrer(),
      user_agent_hash: this.hashUserAgent(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.addToQueue(event);
  }

  trackPageView(customPath = null) {
    this.track("page_view", {
      path: customPath || this.getAnonymizedURL(),
      title: document.title,
      loading_time: performance.now(),
    });
  }

  trackCommissionInquiry(serviceType, packageType = null) {
    this.track("commission_inquiry", {
      service_type: serviceType,
      package_type: packageType,
      page: "service_details",
    });
  }

  trackOrderStarted(orderData) {
    this.track("order_started", {
      service_type: orderData.service?.name,
      package_type: orderData.package?.name,
      estimated_value: orderData.summary?.total,
      item_count: orderData.items?.length || 0,
    });
  }

  trackOrderCompleted(orderData) {
    this.track("order_completed", {
      service_type: orderData.service?.name,
      package_type: orderData.package?.name,
      final_value: orderData.summary?.total,
      payment_method: orderData.paymentInfo?.paymentMethod,
      completion_time: Date.now(),
    });
  }

  trackFormSubmission(formType, success = true) {
    this.track("form_submission", {
      form_type: formType,
      success: success,
      timestamp: Date.now(),
    });
  }

  trackError(errorType, errorMessage = null) {
    this.track("error", {
      error_type: errorType,
      error_message: errorMessage ? errorMessage.substring(0, 100) : null,
      page: this.getAnonymizedURL(),
    });
  }

  trackPerformance() {
    if (typeof performance !== "undefined" && performance.timing) {
      const timing = performance.timing;
      this.track("performance", {
        page_load_time: timing.loadEventEnd - timing.navigationStart,
        dom_ready_time:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        first_paint:
          performance.getEntriesByType("paint")[0]?.startTime || null,
      });
    }
  }

  // ===============================================
  // DATA PROCESSING
  // ===============================================

  generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  sanitizeProperties(properties) {
    const sanitized = {};

    Object.keys(properties).forEach((key) => {
      const value = properties[key];

      // Remove sensitive data
      if (this.isSensitiveKey(key)) {
        return;
      }

      // Sanitize values
      if (typeof value === "string") {
        sanitized[key] = value.substring(0, 200); // Limit string length
      } else if (typeof value === "number") {
        sanitized[key] = value;
      } else if (typeof value === "boolean") {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = null;
      }
    });

    return sanitized;
  }

  isSensitiveKey(key) {
    const sensitiveKeys = [
      "email",
      "phone",
      "name",
      "address",
      "credit_card",
      "password",
      "token",
      "api_key",
      "personal",
    ];

    const keyLower = key.toLowerCase();
    return sensitiveKeys.some((sensitive) => keyLower.includes(sensitive));
  }

  getAnonymizedURL() {
    const url = new URL(window.location.href);

    // Remove query parameters that might contain sensitive data
    const allowedParams = ["service", "package", "page"];
    const filteredParams = new URLSearchParams();

    allowedParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        filteredParams.set(param, url.searchParams.get(param));
      }
    });

    return (
      url.pathname +
      (filteredParams.toString() ? "?" + filteredParams.toString() : "")
    );
  }

  getAnonymizedReferrer() {
    if (!document.referrer) return null;

    try {
      const referrerURL = new URL(document.referrer);
      return referrerURL.hostname; // Only return the domain
    } catch (e) {
      return null;
    }
  }

  hashUserAgent() {
    // Create a hash of the user agent for bot detection without storing the full string
    const ua = navigator.userAgent;
    let hash = 0;
    for (let i = 0; i < ua.length; i++) {
      hash = (hash << 5) - hash + ua.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // ===============================================
  // EVENT QUEUE MANAGEMENT
  // ===============================================

  addToQueue(event) {
    this.eventQueue.push(event);

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.sendEvents(events);
  }

  async sendEvents(events) {
    try {
      // In development mode, just log the events instead of sending to API
      if (this.config.developmentMode) {
        console.log(" [DEV MODE] Analytics events (not sent to server):", {
          events: events,
          session_id: this.sessionId,
          timestamp: Date.now(),
          count: events.length,
        });
        return;
      }

      // Send to your own analytics endpoint
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: events,
          session_id: this.sessionId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      console.log(` Sent ${events.length} analytics events`);
    } catch (error) {
      console.warn("Failed to send analytics events:", error);

      // Add events back to queue for retry (limit to prevent memory issues)
      if (this.eventQueue.length < 50) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flushEvents();
    });
  }

  // ===============================================
  // EVENT LISTENERS
  // ===============================================

  setupEventListeners() {
    // Track commission-related interactions
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-track]");
      if (target) {
        const trackingData = target.dataset.track;
        try {
          const data = JSON.parse(trackingData);
          this.track(data.event, data.properties || {});
        } catch (err) {
          this.track("click", { element: target.tagName.toLowerCase() });
        }
      }
    });

    // Track form submissions
    document.addEventListener("submit", (e) => {
      const form = e.target;
      const formType = form.id || form.className || "unknown";
      this.trackFormSubmission(formType, true);
    });

    // Track errors
    window.addEventListener("error", (e) => {
      this.trackError("javascript_error", e.message);
    });

    // Track performance after page load
    window.addEventListener("load", () => {
      setTimeout(() => {
        this.trackPerformance();
      }, 1000);
    });
  }

  // ===============================================
  // PUBLIC API
  // ===============================================

  getAnalyticsStatus() {
    return {
      tracking_enabled: this.config.trackingEnabled,
      user_consent: this.userConsent,
      do_not_track: this.doNotTrack,
      session_id: this.sessionId,
      events_queued: this.eventQueue.length,
    };
  }

  showPrivacySettings() {
    this.showPrivacyModal();
  }

  exportUserData() {
    // Allow users to export their analytics data
    const userData = {
      session_id: this.sessionId,
      consent_date: localStorage.getItem("analytics_consent_date"),
      events: this.eventQueue,
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-analytics-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  deleteUserData() {
    this.revokeConsent();
    this.clearAnalyticsData();
    alert("All your analytics data has been deleted.");
  }
}

// Initialize Privacy Analytics
window.PrivacyAnalytics = PrivacyAnalytics;

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.privacyAnalytics = new PrivacyAnalytics();
  });
} else {
  window.privacyAnalytics = new PrivacyAnalytics();
}
