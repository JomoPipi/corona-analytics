# Corona Analytics

Paste the following script into your html to load the sdk:

```js
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
  })(window, document, 'https://your-analytics.vercel.app/sdk.js');
</script>
```