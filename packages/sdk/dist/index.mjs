// src/queue.ts
var EventQueue = class {
  constructor() {
    this.queue = [];
    this.flushTimer = null;
    this.apiKey = "";
    this.apiUrl = "";
    this.batchSize = 10;
    this.flushInterval = 3e4;
    this.debug = false;
  }
  /**
   * Initialize the queue
   */
  init(apiKey, apiUrl, batchSize, flushInterval, debug) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.debug = debug;
    this.startFlushTimer();
  }
  /**
   * Add event to queue
   */
  push(event) {
    this.queue.push(event);
    this.log(`Event queued: ${event.event}`, event);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  /**
   * Flush all events in queue to server
   */
  async flush() {
    if (this.queue.length === 0) {
      return;
    }
    const events = [...this.queue];
    this.queue = [];
    try {
      const payload = { events };
      this.log(`Flushing ${events.length} events`, payload);
      const response = await fetch(`${this.apiUrl}/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[Luzzi] Failed to send events:", error);
        if (this.queue.length < this.batchSize * 10) {
          this.queue.unshift(...events);
        }
      } else {
        const result = await response.json();
        this.log(`Events sent successfully`, result);
      }
    } catch (error) {
      console.error("[Luzzi] Failed to send events:", error);
      if (this.queue.length < this.batchSize * 10) {
        this.queue.unshift(...events);
      }
    }
  }
  /**
   * Start auto-flush timer
   */
  startFlushTimer() {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  /**
   * Stop auto-flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  /**
   * Get queue length
   */
  get length() {
    return this.queue.length;
  }
  /**
   * Clear queue and stop timer
   */
  reset() {
    this.queue = [];
    this.stopFlushTimer();
  }
  /**
   * Debug log
   */
  log(message, data) {
    if (this.debug) {
      console.log(`[Luzzi] ${message}`, data || "");
    }
  }
};

// src/core.ts
var DEFAULT_API_URL = "https://luzzi.vercel.app/api";
var DEFAULT_BATCH_SIZE = 10;
var DEFAULT_FLUSH_INTERVAL = 3e4;
var LuzziCore = class {
  constructor() {
    this.apiKey = "";
    this.apiUrl = DEFAULT_API_URL;
    this.sessionId = "";
    this.userTraits = {};
    this.deviceInfo = {};
    this.initialized = false;
    this.debug = false;
    this.queue = new EventQueue();
  }
  /**
   * Initialize the SDK
   * Must be called before any other method
   */
  init(apiKey, config = {}) {
    try {
      if (!apiKey) {
        console.error("[Luzzi] API key is required");
        return;
      }
      this.apiKey = apiKey;
      this.apiUrl = config.apiUrl || DEFAULT_API_URL;
      this.debug = config.debug || false;
      this.sessionId = this.generateSessionId();
      try {
        const autoDetected = this.collectDeviceInfo();
        this.deviceInfo = { ...autoDetected, ...config.deviceInfo };
      } catch {
        this.deviceInfo = config.deviceInfo || {};
      }
      this.queue.init(
        this.apiKey,
        this.apiUrl,
        config.batchSize || DEFAULT_BATCH_SIZE,
        config.flushInterval || DEFAULT_FLUSH_INTERVAL,
        this.debug
      );
      this.initialized = true;
      this.log("Initialized", { apiKey: apiKey.slice(0, 10) + "...", sessionId: this.sessionId });
      if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("beforeunload", () => {
          this.flush();
        });
        if (typeof document !== "undefined") {
          window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
              this.flush();
            }
          });
        }
      }
    } catch (error) {
      console.warn("[Luzzi] Failed to initialize:", error);
      this.initialized = true;
    }
  }
  /**
   * Track an event
   */
  track(eventName, properties) {
    if (!this.initialized) {
      console.warn("[Luzzi] SDK not initialized. Call luzzi.init() first.");
      return;
    }
    if (!eventName || typeof eventName !== "string") {
      console.warn("[Luzzi] Event name is required and must be a string");
      return;
    }
    this.queue.push({
      event: eventName,
      properties: properties || {},
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      device: this.deviceInfo
    });
  }
  /**
   * Identify the current user
   */
  identify(userId, traits) {
    if (!this.initialized) {
      console.warn("[Luzzi] SDK not initialized. Call luzzi.init() first.");
      return;
    }
    if (!userId || typeof userId !== "string") {
      console.warn("[Luzzi] User ID is required and must be a string");
      return;
    }
    this.userId = userId;
    this.userTraits = { ...this.userTraits, ...traits };
    this.log("User identified", { userId, traits });
    this.track("$identify", {
      ...this.userTraits,
      $user_id: userId
    });
  }
  /**
   * Reset the current user (logout)
   */
  reset() {
    this.log("Resetting user");
    this.flush();
    this.userId = void 0;
    this.userTraits = {};
    this.sessionId = this.generateSessionId();
    this.log("Reset complete", { newSessionId: this.sessionId });
  }
  /**
   * Manually flush the event queue
   */
  async flush() {
    if (!this.initialized) {
      return;
    }
    await this.queue.flush();
  }
  /**
   * Get the current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * Get the current user ID
   */
  getUserId() {
    return this.userId;
  }
  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  /**
   * Collect device information
   */
  collectDeviceInfo() {
    const info = {};
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      if (ua && typeof ua === "string") {
        if (ua.includes("Windows")) info.os = "windows";
        else if (ua.includes("Mac")) info.os = "macos";
        else if (ua.includes("Linux")) info.os = "linux";
        else if (ua.includes("Android")) info.os = "android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) info.os = "ios";
        if (ua.includes("Chrome") && !ua.includes("Edg")) info.browser = "chrome";
        else if (ua.includes("Firefox")) info.browser = "firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) info.browser = "safari";
        else if (ua.includes("Edg")) info.browser = "edge";
      }
      info.screen_width = window.screen?.width;
      info.screen_height = window.screen?.height;
      info.language = navigator.language;
      try {
        info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
      }
    }
    if (typeof process !== "undefined" && process.versions?.node) {
      info.os = process.platform;
      info.app_version = process.versions.node;
    }
    return info;
  }
  /**
   * Debug log
   */
  log(message, data) {
    if (this.debug) {
      console.log(`[Luzzi] ${message}`, data || "");
    }
  }
};
var luzziCore = new LuzziCore();

// src/index.ts
var luzzi = {
  /**
   * Initialize the SDK with your API key
   * Must be called before any other method
   *
   * @param apiKey - Your Luzzi API key (pk_live_xxx or pk_test_xxx)
   * @param config - Optional configuration
   */
  init: (apiKey, config) => {
    luzziCore.init(apiKey, config);
  },
  /**
   * Track an event
   *
   * @param eventName - Name of the event (e.g., "button_clicked", "page_viewed")
   * @param properties - Optional event properties
   *
   * @example
   * luzzi.track("purchase_completed", { amount: 99.99, currency: "USD" });
   */
  track: (eventName, properties) => {
    luzziCore.track(eventName, properties);
  },
  /**
   * Identify the current user
   *
   * @param userId - Unique user identifier
   * @param traits - Optional user traits/properties
   *
   * @example
   * luzzi.identify("user_123", { email: "user@example.com", plan: "pro" });
   */
  identify: (userId, traits) => {
    luzziCore.identify(userId, traits);
  },
  /**
   * Reset the current user (call on logout)
   * Clears user ID and generates a new session
   */
  reset: () => {
    luzziCore.reset();
  },
  /**
   * Manually flush pending events to the server
   * Events are automatically flushed on a timer and on page unload
   */
  flush: () => {
    return luzziCore.flush();
  },
  /**
   * Get the current session ID
   */
  getSessionId: () => {
    return luzziCore.getSessionId();
  },
  /**
   * Get the current user ID (if identified)
   */
  getUserId: () => {
    return luzziCore.getUserId();
  }
};
var index_default = luzzi;
var { init, track, identify, reset, flush, getSessionId, getUserId } = luzzi;
export {
  index_default as default,
  flush,
  getSessionId,
  getUserId,
  identify,
  init,
  reset,
  track
};
