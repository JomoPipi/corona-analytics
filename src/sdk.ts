interface CAEvent {
  event: string;
  received_at: string;
  user_id: string;
  session_id: string;
  [key: string]: any;
}

interface CAConfig {
  url: string;
  debug?: boolean;
}

class CoronaAnalytics {
  private queue: CAEvent[] = [];
  private url: string = "";
  private debug: boolean = false;
  private readonly STORAGE_KEY = "corona_analytics_queue";
  private userId: string = "";
  private sessionId: string = "";

  constructor() {
    // 1. Generate or Retrieve User ID (Persists forever)
    this.userId = this.getPersistentId();

    // 2. Generate Session ID (New for every page load)
    this.sessionId = crypto.randomUUID();

    // 1. Recover any unsent data from previous sessions immediately
    this._recoverFromStorage();
  }

  /**
   * Initialize the SDK with configuration.
   * This is usually the first call made by the user.
   */
  public init(config: CAConfig) {
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
  public log(eventName: string, data: object = {}) {
    const newEvent: CAEvent = {
      event: eventName,
      received_at: new Date().toISOString(),
      user_id: this.userId,
      session_id: this.sessionId,
      ...data,
    };

    this.queue.push(newEvent);
    this._saveToStorage();

    if (this.debug) console.log(`Logged: ${eventName}`, newEvent);
  }

  /**
   * Force upload of all queued events.
   */
  public flush() {
    if (!this.url || this.queue.length === 0) return;

    const payload = JSON.stringify(this.queue);
    const blob = new Blob([payload], { type: "application/json" });

    // Try Beacon first (reliable for page unload)
    const success = navigator.sendBeacon(this.url, blob);

    if (success) {
      if (this.debug) console.log("Flushed via Beacon");
      this.queue = [];
      this._saveToStorage();
    } else {
      // Fallback to fetch
      fetch(this.url, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      })
        .then(() => {
          if (this.debug) console.log("Flushed via Fetch");
          this.queue = [];
          this._saveToStorage();
        })
        .catch((e) => console.error("Analytics flush failed", e));
    }
  }

  public processQueue(queue: any[]) {
    if (this.debug)
      console.log(`Processing ${queue.length} queued commands...`);

    queue.forEach((args) => {
      // 'arguments' object from the loader is not a real array, convert it
      const params = Array.from(args);
      const method = params[0] as keyof CoronaAnalytics;
      const data = params.slice(1);

      if (typeof this[method] === "function") {
        // @ts-ignore
        this[method](...data);
      }
    });
  }

  // Optional: Allow the app to override this if they log in later
  public identify(realUserId: string) {
    this.userId = realUserId;
    localStorage.setItem("corona_analytics_user_id", realUserId);
  }

  // --- PRIVATE HELPERS ---
  private getPersistentId(): string {
    const KEY = "corona_analytics_user_id";
    let id = localStorage.getItem(KEY);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  }

  private _saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      // Storage quota full or disabled
    }
  }

  private _recoverFromStorage() {
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
}

// Capture the existing stub (and its queue)
const existingStub = (window as any).CoronaAnalytics;

// Create the real instance
const instance = new CoronaAnalytics();

// Replace the window object immediately
(window as any).CoronaAnalytics = instance;

// Now, if there was a queue, replay it into the new instance
if (existingStub && Array.isArray(existingStub.q)) {
  instance.processQueue(existingStub.q);
}
