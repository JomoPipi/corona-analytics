"use strict";
(() => {
  // src/sdk.ts
  var CoronaAnalytics = class {
    queue = [];
    url = "";
    debug = false;
    STORAGE_KEY = "corona_analytics_queue";
    userId = "";
    sessionId = "";
    constructor() {
      this.userId = this.getPersistentId();
      this.sessionId = crypto.randomUUID();
      this._recoverFromStorage();
    }
    /**
     * Initialize the SDK with configuration.
     * This is usually the first call made by the user.
     */
    init(config) {
      this.url = config.url;
      this.debug = config.debug || false;
      if (this.debug) console.log("CoronaAnalytics: Initialized");
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush();
        }
      });
    }
    /**
     * Log an event to the queue.
     */
    log(eventName, data = {}) {
      const newEvent = {
        event: eventName,
        received_at: (/* @__PURE__ */ new Date()).toISOString(),
        user_id: this.userId,
        session_id: this.sessionId,
        ...data
      };
      this.queue.push(newEvent);
      this._saveToStorage();
      if (this.debug) console.log(`Logged: ${eventName}`, newEvent);
    }
    /**
     * Force upload of all queued events.
     */
    flush() {
      if (!this.url || this.queue.length === 0) return;
      const payload = JSON.stringify(this.queue);
      const blob = new Blob([payload], { type: "application/json" });
      const success = navigator.sendBeacon(this.url, blob);
      if (success) {
        if (this.debug) console.log("Flushed via Beacon");
        this.queue = [];
        this._saveToStorage();
      } else {
        fetch(this.url, {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true
        }).then(() => {
          if (this.debug) console.log("Flushed via Fetch");
          this.queue = [];
          this._saveToStorage();
        }).catch((e) => console.error("Analytics flush failed", e));
      }
    }
    processQueue(queue) {
      if (this.debug)
        console.log(`Processing ${queue.length} queued commands...`);
      queue.forEach((args) => {
        const params = Array.from(args);
        const method = params[0];
        const data = params.slice(1);
        if (typeof this[method] === "function") {
          this[method](...data);
        }
      });
    }
    // Optional: Allow the app to override this if they log in later
    identify(realUserId) {
      this.userId = realUserId;
      localStorage.setItem("corona_analytics_user_id", realUserId);
    }
    // --- PRIVATE HELPERS ---
    getPersistentId() {
      const KEY = "corona_analytics_user_id";
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
      }
      return id;
    }
    _saveToStorage() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
      } catch (e) {
      }
    }
    _recoverFromStorage() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const recoveredEvents = JSON.parse(stored);
          if (Array.isArray(recoveredEvents)) {
            this.queue = [...recoveredEvents, ...this.queue];
            if (this.debug && recoveredEvents.length > 0) {
              console.log(
                `Recovered ${recoveredEvents.length} events from storage.`
              );
            }
          }
        }
      } catch (e) {
        console.error("Failed to recover analytics", e);
      }
    }
  };
  var existingStub = window.CoronaAnalytics;
  var instance = new CoronaAnalytics();
  window.CoronaAnalytics = instance;
  if (existingStub && Array.isArray(existingStub.q)) {
    instance.processQueue(existingStub.q);
  }
})();
