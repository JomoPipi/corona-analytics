# Corona Analytics 🦠

A lightweight, performance-first analytics SDK designed for games and high-performance web apps.

**Why use this instead of Google Analytics?**
* **Zero Performance Cost:** No network requests during gameplay. Logs are queued in memory.
* **Offline First:** Events are persisted to `localStorage`. If a player crashes while offline, data is uploaded the next time they play.
* **Ad-Blocker Friendly:** Self-hosted on your own domain/Vercel, avoiding common ad-block lists.
* **Tiny:** < 2KB minified.

---

## 1. Client Setup

Paste the following loader script into your `index.html`. This creates a lightweight proxy that queues events immediately, ensuring you never miss a `game_start` event even if the SDK hasn't finished loading.
```html
<script>
  (function(w, d, src) {
    // 1. If the global doesn't exist, create a Proxy
    if (!w.CoronaAnalytics) {
      w.CoronaAnalytics = new Proxy(
        // The "Target" (where we store the queue)
        { q: [] }, 
        // The "Handler" (intercepts operations)
        {
          get: function(target, prop) {
            // A. If the SDK is asking for the queue, return it
            if (prop === 'q') return target.q;

            // B. For ANY other property (log, init, identify, etc.),
            //    return a function that queues the call.
            return function() {
              var args = Array.prototype.slice.call(arguments);
              // Push ['methodName', arg1, arg2...]
              target.q.push([prop].concat(args));
            };
          }
        }
      );
    }

    // 2. Load the real script asynchronously
    var s = d.createElement('script');
    s.async = true;
    s.src = src;
    var x = d.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  })(window, document, 'https://corona-analytics-pied.vercel.app/sdk.global.js');
</script>
```