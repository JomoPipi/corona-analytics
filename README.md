# Corona Analytics

Paste the following script into your html to load the sdk:
```js
<script>
  (function(w, d, src) {
    // 1. Define the global variable
    w.CoronaAnalytics = w.CoronaAnalytics || function() {
      (w.CoronaAnalytics.q = w.CoronaAnalytics.q || []).push(arguments);
    };
    
    // 2. Load the real script asynchronously
    var s = d.createElement('script');
    s.async = true;
    s.src = src;
    var x = d.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  })(window, document, 'https://your-analytics.vercel.app/sdk.js');

  // Usage immediately available:
  CoronaAnalytics('init', { url: 'https://api.yoursite.com/ingest' });
  CoronaAnalytics('log', 'game_loaded');
</script>
```