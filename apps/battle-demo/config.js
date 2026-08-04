(function () {
  'use strict';

  const defaults = {
    storageNamespace: 'wrestle-manager-demo-v1',
    productLinks: {
      booth: 'https://takoyakichan.booth.pm/items/8121734',
      dlsite: 'https://www.dlsite.com/ai/work/=/product_id/RJ01592994.html',
      fanza: '',
    },
    promotionLinks: {
      // These URLs can be replaced by build-time environment variables.
      primaryUrl: '',
      primaryLabel: '',
      trialUrl: 'https://takoyakichan.booth.pm/items/8058404',
      followXUrl: '',
    },
  };

  const overrides = window.WM_DEMO_CONFIG_OVERRIDES || {};
  window.WM_DEMO_CONFIG = Object.freeze({
    ...defaults,
    ...overrides,
    productLinks: Object.freeze({
      ...defaults.productLinks,
      ...(overrides.productLinks || {}),
    }),
    promotionLinks: Object.freeze({
      ...defaults.promotionLinks,
      ...(overrides.promotionLinks || {}),
    }),
  });
})();
