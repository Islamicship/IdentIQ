"use strict";

(function () {
  /**
   * Recursively freezes an object and all of its nested objects and functions so the configuration cannot be modified at runtime.
   * @param {Object} obj - The object to freeze deeply.
   * @returns {Object} The same object after it has been frozen.
   */
  function deepFreeze(obj) {
    Object.keys(obj).forEach(function (prop) {
      var val = obj[prop];
      if (
        val !== null &&
        (typeof val === "object" || typeof val === "function") &&
        !Object.isFrozen(val)
      ) {
        deepFreeze(val);
      }
    });
    return Object.freeze(obj);
  }

  var STORAGE_KEYS = {
    HISTORY: "IS_history_v4",
    ANALYTICS: "IS_analytics_v3",
    SETTINGS: "IS_settings_v1",
    LANG: "IS_lang_v4",
    THEME: "IS_theme_v4",
    NAMES: "IS_names_v1",
    LAST_CLEARED: "IS_last_cleared",
    LEGACY_AUTH_CLEANED: "IS_legacy_auth_cleaned",
    PWA_INSTALLED: "pwa_installed",
  };

  var CONFIG = {
    VERSION: "6.1.1",
    YEAR: 2026,
    COPYRIGHT_RANGE: "2024–2026",
    APP_NAME: "IdentIQ",
    DEVELOPER: "Creative Men",
    PLATFORM: "Gulf Identity Intelligence Platform",

    STORAGE_KEYS: STORAGE_KEYS,
    ALL_WIPEABLE_KEYS: [
      STORAGE_KEYS.HISTORY,
      STORAGE_KEYS.ANALYTICS,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.LANG,
      STORAGE_KEYS.THEME,
      STORAGE_KEYS.NAMES,
    ],

    DEFAULTS: {
      WIPE_MINUTES: 5,
      HISTORY_MAX: 15,
      EXPORTS_MAX: 5,
      DEFAULT_TAB: "tab-extractor",
    },

    META: {
      name: "IdentIQ",
      version: "v5.9.1",
      released: "2024",
      developer: "Creative Men",
      location: "Jhang, Punjab, Pakistan",
      supportHours: "Weekdays · 24 Hours",
      email: "creativemen70@gmail.com",
      whatsapp: "0321-8232140",
      whatsappUrl: "https://wa.me/923218232140",
      github: "https://github.com/Islamicship",
      nexusApp: "https://ident-lq.netlify.app",
      ocrApp: "https://personal-ocr-tool.netlify.app",
      deenApp: "https://deen-toolkit.netlify.app",
      tagline: "Crafting Digital Intelligence for the Gulf & South Asia",
      copyright: "© 2024–2026 Creative Men. All rights reserved.",
      privacyVer: "Privacy Policy v2.0 (2026)",
    },
  };

  var FROZEN_CONFIG = deepFreeze(CONFIG);

  window.APP_CONFIG = FROZEN_CONFIG;
  window.IS = window.IS || {};
  window.IS.CONFIG = FROZEN_CONFIG;
})();
