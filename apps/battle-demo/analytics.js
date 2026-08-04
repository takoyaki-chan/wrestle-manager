(function () {
  'use strict';

  function trackEvent(name, properties) {
    const detail = {
      name: String(name || ''),
      properties: { ...(properties || {}) },
      occurredAt: new Date().toISOString(),
    };

    try {
      if (typeof window.WM_DEMO_ANALYTICS_ADAPTER === 'function') {
        window.WM_DEMO_ANALYTICS_ADAPTER(detail.name, detail.properties);
      }
    } catch (error) {
      console.debug('[Wrestle-Manager Demo] analytics adapter skipped:', error);
    }

    try {
      window.dispatchEvent(new CustomEvent('wrestle-manager-demo:analytics', { detail }));
    } catch (_) {
      // Analytics must never interrupt the demo.
    }
  }

  window.WMDemoAnalytics = Object.freeze({ trackEvent });
})();
