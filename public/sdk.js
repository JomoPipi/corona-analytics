"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CoronaAnalytics {
    queue = [];
    url = "";
    debug = false;
    STORAGE_KEY = "corona_analytics_queue";
    constructor() {
        // 1. Recover any unsent data from previous sessions immediately
        this._recoverFromStorage();
    }
    /**
     * Initialize the SDK with configuration.
     * This is usually the first call made by the user.
     */
    init(config) {
        this.url = config.url;
        this.debug = config.debug || false;
        if (this.debug)
            console.log("CoronaAnalytics: Initialized");
        // 2. Process any commands the user triggered before this script loaded
        this._processLoaderQueue();
        // 3. Auto-flush on page visibility change (tab switch/close)
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
        if (!this.url) {
            console.warn("CoronaAnalytics: No URL set. Call init() first.");
            return;
        }
        const newEvent = {
            event: eventName,
            time: Date.now(),
            ...data,
        };
        this.queue.push(newEvent);
        this._saveToStorage();
        if (this.debug)
            console.log(`Logged: ${eventName}`, newEvent);
    }
    /**
     * Force upload of all queued events.
     */
    flush() {
        if (!this.url || this.queue.length === 0)
            return;
        const payload = JSON.stringify(this.queue);
        const blob = new Blob([payload], { type: "application/json" });
        // Try Beacon first (reliable for page unload)
        const success = navigator.sendBeacon(this.url, blob);
        if (success) {
            if (this.debug)
                console.log("Flushed via Beacon");
            this.queue = [];
            this._saveToStorage();
        }
        else {
            // Fallback to fetch
            fetch(this.url, {
                method: "POST",
                body: payload,
                headers: { "Content-Type": "application/json" },
                keepalive: true,
            })
                .then(() => {
                if (this.debug)
                    console.log("Flushed via Fetch");
                this.queue = [];
                this._saveToStorage();
            })
                .catch((e) => console.error("Analytics flush failed", e));
        }
    }
    // --- PRIVATE HELPERS ---
    _saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        }
        catch (e) {
            // Storage quota full or disabled
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
                        console.log(`Recovered ${recoveredEvents.length} events from storage.`);
                    }
                }
            }
        }
        catch (e) {
            console.error("Failed to recover analytics", e);
        }
    }
    _processLoaderQueue() {
        // Check if the window object has the loader stub
        const existing = window.CoronaAnalytics;
        // If it exists and has a 'q' array, it is the loader stub
        if (existing && Array.isArray(existing.q)) {
            if (this.debug)
                console.log(`Processing ${existing.q.length} queued commands...`);
            existing.q.forEach((args) => {
                // args is ['methodName', arg1, arg2...]
                const method = args[0];
                const params = args.slice(1);
                if (typeof this[method] === "function") {
                    // @ts-ignore - Dynamic dispatch
                    this[method](...params);
                }
            });
        }
    }
}
// Instantiate and replace the window object
window.CoronaAnalytics = new CoronaAnalytics();
//# sourceMappingURL=sdk.js.map