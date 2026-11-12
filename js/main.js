"use strict";

/**
 * Initializes the whole application UI (i18n, theme, tabs, shortcuts, analytics, privacy wipe, install prompt) once the DOM is ready.
 * @returns {void} Nothing.
 */
document.addEventListener("DOMContentLoaded", function () {
  IS.i18n.init();
  IS.theme.init();
  if (window.APP_CONFIG) {
    document.querySelectorAll(".gen-version-tag").forEach(function (el) {
      el.textContent = "v" + APP_CONFIG.VERSION;
    });
  }
  /**
   * Removes leftover authentication data from the legacy Firebase-based version exactly once per browser.
   * @returns {void} Nothing.
   */
  (function cleanLegacyAuth() {
    try {
      if (localStorage.getItem("IS_legacy_auth_cleaned")) return;
      localStorage.removeItem("nexusid_remember_email");
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf("firebase:") === 0) localStorage.removeItem(k);
      });
      if (window.indexedDB) indexedDB.deleteDatabase("firebaseLocalStorageDb");
      localStorage.setItem("IS_legacy_auth_cleaned", "1");
    } catch (e) {}
  })();
  var tabs = document.querySelectorAll(".nav-tab[data-target]");
  var sections = document.querySelectorAll(".app-section");
  var wipeTimer = null;
  var wipeStart = null;
  var wipeEl = document.getElementById("wipeCountdown");
  var _wipeWarnShown = false;
  var _analyticsTimer;
  /**
   * Activates the requested app section, deactivates the others, and updates tab state, analytics rendering, the names module, and the generator button visibility.
   * @param {string} targetId - The element id of the app section to display.
   * @returns {void} Nothing.
   */
  function switchTab(targetId) {

    if (targetId === "tab-names" && (!window.IS || !IS.namesData)) {
      if (window.IS && IS.loadScript) {
        IS.loadScript("js/names-data.js", function () {
  IS.loadScript("js/names.js");
});
      }
    }

    tabs.forEach(function (t) {
      var isMe = t.getAttribute("data-target") === targetId;
      t.classList.toggle("active", isMe);
      t.setAttribute("aria-selected", isMe ? "true" : "false");
    });
    sections.forEach(function (s) {
      var isMe = s.id === targetId;
      s.style.display = isMe ? "" : "none";
      s.classList.toggle("active-section", isMe);
    });
    if (targetId === "tab-analytics") {
      clearTimeout(_analyticsTimer);
      _analyticsTimer = setTimeout(renderAnalytics, 80);
    }
    window._activeTab = targetId;
    if (targetId !== "tab-names" && window.IS && IS.names && IS.names.stop)
      IS.names.stop();
    var fab = document.getElementById("genFab");
    if (fab) {
      if (targetId === "tab-generator") fab.classList.add("fab-visible");
      else fab.classList.remove("fab-visible");
      fab.setAttribute(
        "aria-hidden",
        targetId !== "tab-generator" ? "true" : "false",
      );
    }
  }
  window.switchTab = switchTab;
  tabs.forEach(function (tab) {
    /**
     * Switches to the section targeted by the clicked navigation tab.
     * @returns {void} Nothing.
     */
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-target");
      if (target) switchTab(target);
    });
  });
  var hash = (location.hash || "").replace("#", "");
  var hashTarget = hash ? document.getElementById(hash) : null;
  var savedTab = "tab-extractor";
  try {
    if (window.IS && IS.settings)
      savedTab = IS.settings.read().defaultTab || savedTab;
  } catch (e) {}
  var savedTabEl = document.getElementById(savedTab);
  if (!savedTabEl || !savedTabEl.classList.contains("app-section"))
    savedTab = "tab-extractor";
  if (hash === "settings") {
    switchTab(savedTab);
    setTimeout(function () {
      if (window.IS && IS.settings) IS.settings.open();
    }, 300);
  } else if (hashTarget && hashTarget.classList.contains("app-section")) {
    switchTab(hash);
  } else {
    switchTab(savedTab);
  }
  var TAB_KEYS = {
    Digit1: "tab-extractor",
    Digit2: "tab-generator",
    Digit3: "tab-analytics",
    Digit4: "tab-names",
  };
  /**
   * Handles global keyboard shortcuts: Alt+digit switches tabs, Ctrl/Cmd+Enter triggers the active tab's primary action, and Escape closes the calendar or virtual keyboard.
   * @param {KeyboardEvent} e - The keydown event.
   * @returns {void} Nothing.
   */
  document.addEventListener("keydown", function (e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (window._IS_shortcutsEnabled === false) return;
      if (TAB_KEYS[e.code]) {
        e.preventDefault();
        switchTab(TAB_KEYS[e.code]);
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (window._IS_shortcutsEnabled === false) return;
      e.preventDefault();
      if (window._activeTab === "tab-generator") {
        var genBtn = document.getElementById("generate-btn");
        if (genBtn) genBtn.click();
      } else if (window._activeTab === "tab-extractor") {
        var input = document.getElementById("inputText");
        if (input)
          input.dispatchEvent(
            new Event("input", {
              bubbles: true,
            }),
          );
      }
      return;
    }
    if (e.key === "Escape") {
      if (window.IS && IS.calendar && IS.calendar.isOpen()) {
        IS.calendar.close();
        e.preventDefault();
        return;
      }
      var vkbd = document.getElementById("virtualKbd");
      if (vkbd && vkbd.style.display !== "none") {
        vkbd.style.opacity = "0";
        vkbd.style.transform = "translateY(12px)";
        setTimeout(function () {
          vkbd.style.display = "none";
        }, 200);
        e.preventDefault();
      }
    }
  });
  var langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    /**
     * Toggles the interface language between English and Urdu.
     * @returns {void} Nothing.
     */
    langBtn.addEventListener("click", function () {
      var newLang = IS.i18n._lang === "en" ? "ur" : "en";
      IS.i18n.setLang(newLang);
    });
  }
  var themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    /**
     * Toggles the application theme.
     * @returns {void} Nothing.
     */
    themeBtn.addEventListener("click", function () {
      IS.theme.toggle();
    });
  }
  /**
   * Renders the analytics counters, the recent exports list, and the extraction history list with restore and delete actions.
   * @returns {void} Nothing.
   */
  function renderAnalytics() {
    var data = window.IS && IS.analytics ? IS.analytics.get() : {};
    var total = data.totalProcessed || 0;
    var successes = data.successfulExtractions || 0;
    var totalExports = data.totalExports || 0;
    var rate = total > 0 ? Math.round((successes / total) * 100) : 0;
    var statTotal = document.getElementById("statTotal");
    var statSuccess = document.getElementById("statSuccess");
    var statExports = document.getElementById("statExports");
    var statRate = document.getElementById("statRate");
    if (statTotal) animateCount(statTotal, 0, total);
    if (statSuccess) animateCount(statSuccess, 0, successes);
    if (statExports) animateCount(statExports, 0, totalExports);
    if (statRate) animateCount(statRate, 0, rate, "%");
    var expList = document.getElementById("recentExportsList");
    if (expList) {
      if (!data.recentExports || !data.recentExports.length) {
        expList.innerHTML =
          '<li class="recent-empty" data-i18n="noExports">' +
          IS.i18n.get("noExports") +
          "</li>";
      } else {
        var exportIcon =
          window.IS && IS.ICONS && IS.ICONS.export
            ? IS.ICONS.export
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        expList.innerHTML = data.recentExports
          .map(function (ex) {
            var d = new Date(ex.ts);
            var label = String((ex && ex.label) || "")
              .replace(/_/g, " ")
              .replace(/\d{13}$/, "")
              .trim();
            return (
              '<li class="recent-item">' +
              exportIcon +
              '<span class="recent-label-text">' +
              IS.escHtml(label) +
              "</span>" +
              '<span class="recent-time">' +
              formatRelTime(d) +
              "</span>" +
              "</li>"
            );
          })
          .join("");
      }
    }
    var histList = document.getElementById("extractionHistoryList");
    if (histList) {
      var histData = window.IS && IS.history ? IS.history.get() : [];
      if (!histData || !histData.length) {
        histList.innerHTML =
          '<li class="recent-empty" data-i18n="noHistory">' +
          IS.i18n.get("noHistory") +
          "</li>";
      } else {
        histList.innerHTML = histData
          .map(function (entry, idx) {
            var nameLabel = entry.nameAr || entry.nameEn || "—";
            var idLabel = entry.aqama || "—";
            var dateLabel = entry.dobG || entry.dobH || "—";
            var ts = new Date(entry.ts);
            return (
              '<li class="recent-item history-item" data-idx="' +
              idx +
              '">' +
              '<div class="history-meta">' +
              '<span class="history-name">' +
              IS.escHtml(nameLabel) +
              "</span>" +
              '<span class="history-id">' +
              IS.escHtml(idLabel) +
              "</span>" +
              '<span class="history-dob">' +
              IS.escHtml(dateLabel) +
              "</span>" +
              "</div>" +
              '<div class="history-actions">' +
              '<span class="recent-time">' +
              formatRelTime(ts) +
              "</span>" +
              '<button class="history-restore-btn" data-idx="' +
              idx +
              '" aria-label="Restore this extraction">' +
              IS.i18n.get("restoreBtn") +
              "</button>" +
              '<button class="history-delete-btn" data-idx="' +
              idx +
              '" aria-label="Delete this entry" title="Delete">✕</button>' +
              "</div>" +
              "</li>"
            );
          })
          .join("");
        histList
          .querySelectorAll(".history-restore-btn")
          .forEach(function (btn) {
            /**
             * Restores the clicked history entry into the extractor form and switches to the extractor tab.
             * @returns {void} Nothing.
             */
            btn.addEventListener("click", function () {
              var idx = parseInt(btn.getAttribute("data-idx"), 10);
              var hist = IS.history.get();
              if (!hist[idx]) return;
              restoreExtraction(hist[idx]);
              switchTab("tab-extractor");
              IS.showToast("Extraction restored ✓");
            });
          });
        histList
          .querySelectorAll(".history-delete-btn")
          .forEach(function (btn) {
            /**
             * Deletes the clicked history entry from storage and re-renders the analytics view.
             * @returns {void} Nothing.
             */
            btn.addEventListener("click", function () {
              var idx = parseInt(btn.getAttribute("data-idx"), 10);
              var hist = IS.history.get();
              if (isNaN(idx) || idx < 0 || idx >= hist.length) return;
              hist.splice(idx, 1);
              try {
                localStorage.setItem("IS_history_v4", JSON.stringify(hist));
              } catch (e) {}
              renderAnalytics();
            });
          });
      }
    }
  }
  /**
   * Fills the extractor form fields from a saved history entry and shows only the field groups that have values.
   * @param {Object} entry - The history entry containing nameAr, nameEn, aqama, dobH, and dobG values.
   * @returns {void} Nothing.
   */
  function restoreExtraction(entry) {
    var nameAr = document.getElementById("nameArabic");
    var nameEn = document.getElementById("nameEnglish");
    var aqama = document.getElementById("aqamaNumber");
    var dobH = document.getElementById("dobHijri");
    var dobG = document.getElementById("dobGregorian");
    if (window.IS && IS.cancelTypewriter) IS.cancelTypewriter();
    if (nameAr) nameAr.value = entry.nameAr || "";
    if (nameEn) nameEn.value = entry.nameEn || "";
    if (aqama) aqama.value = entry.aqama || "";
    if (dobH) dobH.value = entry.dobH || "";
    if (dobG) dobG.value = entry.dobG || "";
    var card = document.getElementById("dataCard");
    var noData = document.getElementById("noDataMsg");
    if (noData) noData.classList.remove("visible");
    if (card) {
      card.style.display = "block";
      [
        "grp-nameAr",
        "grp-nameEn",
        "grp-aqama",
        "grp-dobH",
        "grp-dobG",
        "grp-nat",
      ].forEach(function (id) {
        var g = document.getElementById(id);
        if (g) {
          var hasVal = true;
          if (id === "grp-nameAr" && !entry.nameAr) hasVal = false;
          if (id === "grp-nameEn" && !entry.nameEn) hasVal = false;
          if (id === "grp-aqama" && !entry.aqama) hasVal = false;
          if (id === "grp-dobH" && !entry.dobH) hasVal = false;
          if (id === "grp-dobG" && !entry.dobG) hasVal = false;
          if (id === "grp-nat" && !entry.aqama && !entry.nameAr) hasVal = false;
          g.style.display = hasVal ? "block" : "none";
        }
      });
    }
    if (window.IS && IS.updateAgeBadge) {
      IS.updateAgeBadge(entry.dobG || "");
    }
    if (window.IS && IS.showDataCompleteIndicator) {
      var allComplete = !!(
        entry.nameAr &&
        entry.nameEn &&
        entry.aqama &&
        (entry.dobG || entry.dobH)
      );
      IS.showDataCompleteIndicator(allComplete);
    }
  }
  var clearBtn = document.getElementById("clearAnalyticsBtn");
  if (clearBtn) {
    /**
     * Clears all analytics data and extraction history after user confirmation, then re-renders the analytics view.
     * @returns {void} Nothing.
     */
    clearBtn.addEventListener("click", function () {
      var confirmMsg =
        window.IS && IS.i18n
          ? IS.i18n.get("confirmClearAll")
          : "Clear all analytics data and extraction history?";
      if (!confirm(confirmMsg)) return;
      IS.analytics.clear();
      IS.history.clear();
      renderAnalytics();
      IS.showToast("All data cleared.");
    });
  }
  /**
   * Normalizes a privacy-wipe duration to a positive number of minutes, defaulting to 5.
   * @param {*} v - The raw minutes value to normalize.
   * @returns {number} A finite positive number of minutes, or 5 if the value is invalid.
   */
  function normWipeMins(v) {
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : 5;
  }
  var _savedWipeMins = 5;
  try {
    if (window.IS && IS.settings)
      _savedWipeMins = normWipeMins(IS.settings.read().wipeMinutes);
  } catch (e) {}
  var WIPE_MS = _savedWipeMins * 60 * 1e3;
  /**
   * Updates the on-screen label that shows the configured privacy-wipe duration in minutes.
   * @param {number} mins - The wipe duration in minutes to display.
   * @returns {void} Nothing.
   */
  function syncWipeLabel(mins) {
    var el = document.getElementById("wipeMinsLabel");
    if (el) el.textContent = mins;
  }
  syncWipeLabel(_savedWipeMins);
  /**
   * Performs the privacy wipe by clearing all extractor inputs, displayed results, and stored history.
   * @returns {void} Nothing.
   */
  function doWipe() {
    var inputText = document.getElementById("inputText");
    if (inputText) {
      inputText.value = "";
      inputText.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );
    }
    [
      "nameArabic",
      "nameEnglish",
      "aqamaNumber",
      "dobHijri",
      "dobGregorian",
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    var card = document.getElementById("dataCard");
    if (card) card.style.display = "none";
    var noData = document.getElementById("noDataMsg");
    if (noData) noData.classList.remove("visible");
    var banner = document.getElementById("dataCompleteBanner");
    if (banner) banner.classList.remove("visible");
    var ageBadge = document.getElementById("ageBadge");
    if (ageBadge) ageBadge.style.display = "none";
    var hl = document.getElementById("inputHighlight");
    if (hl) hl.innerHTML = "";
    if (window.IS && IS.history) IS.history.clear();
    if (window.IS && IS.showToast)
      IS.showToast("Privacy wipe complete: input and history cleared.", "info");
    if (wipeEl) wipeEl.textContent = "";
    wipeStart = null;
  }
  /**
   * Restarts the inactivity countdown that triggers the privacy wipe, showing a warning toast and a live countdown until it fires.
   * @returns {void} Nothing.
   */
  function resetWipeTimer() {
    clearInterval(wipeTimer);
    if (wipeEl) wipeEl.textContent = "";
    _wipeWarnShown = false;
    wipeStart = Date.now();
    wipeTimer = setInterval(function () {
      var elapsed = Date.now() - wipeStart;
      var remaining = WIPE_MS - elapsed;
      if (remaining <= 0) {
        clearInterval(wipeTimer);
        doWipe();
        return;
      }
      if (remaining <= 6e4 && !_wipeWarnShown) {
        _wipeWarnShown = true;
        var s60 = Math.ceil(remaining / 1e3);
        IS.showToast("⏱ Privacy wipe in " + s60 + " seconds", "info", 4e3);
      }
      if (wipeEl) {
        var s = Math.ceil(remaining / 1e3);
        var m = Math.floor(s / 60);
        var sec = s % 60;
        wipeEl.textContent =
          m +
          ":" +
          (sec < 10 ? "0" : "") +
          sec +
          " " +
          IS.i18n.get("wipeUntil");
      }
    }, 1e3);
  }
  var _lastWipeReset = 0;
  /**
   * Resets the privacy-wipe timer on user activity, at most once every two seconds.
   * @returns {void} Nothing.
   */
  function throttledResetWipeTimer() {
    var now = Date.now();
    if (now - _lastWipeReset < 2e3) return;
    _lastWipeReset = now;
    resetWipeTimer();
  }
  ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach(
    function (ev) {
      document.addEventListener(ev, throttledResetWipeTimer, {
        passive: true,
      });
    },
  );
  resetWipeTimer();
  /**
   * Applies a changed privacy-wipe duration by updating the timeout, the label, and restarting the timer.
   * @param {CustomEvent} e - The event whose detail holds the new wipe duration in minutes.
   * @returns {void} Nothing.
   */
  window.addEventListener("IS_wipe_mins_changed", function (e) {
    var mins = normWipeMins(e.detail);
    WIPE_MS = mins * 60 * 1e3;
    syncWipeLabel(mins);
    resetWipeTimer();
  });
  /**
   * Re-renders the analytics view and wipe label after the interface language changes.
   * @returns {void} Nothing.
   */
  window.addEventListener("IS_lang_changed", function () {
    renderAnalytics();
    syncWipeLabel(WIPE_MS / 6e4);
  });
  /**
   * Stops the privacy-wipe interval before the page is unloaded.
   * @returns {void} Nothing.
   */
  window.addEventListener("beforeunload", function () {
    clearInterval(wipeTimer);
  });
  /**
   * Formats a date as a short relative-time label in English or Urdu, falling back to the locale date after one day.
   * @param {Date} d - The date to describe relative to now.
   * @returns {string} The relative-time label.
   */
  function formatRelTime(d) {
    var diff = Date.now() - d.getTime();
    var isUr = window.IS && IS.i18n && IS.i18n._lang === "ur";
    if (diff < 6e4) return isUr ? "ابھی ابھی" : "Just now";
    if (diff < 36e5)
      return Math.floor(diff / 6e4) + (isUr ? " منٹ پہلے" : "m ago");
    if (diff < 864e5)
      return Math.floor(diff / 36e5) + (isUr ? " گھنٹے پہلے" : "h ago");
    return d.toLocaleDateString();
  }
  /**
   * Animates an element's numeric text from one value to another with an ease-out curve, cancelling any previous animation on that element.
   * @param {HTMLElement} el - The element whose text content is animated.
   * @param {number} from - The starting value.
   * @param {number} to - The final value.
   * @param {string} [suffix] - Optional text appended to the number, such as "%".
   * @returns {void} Nothing.
   */
  function animateCount(el, from, to, suffix) {
    suffix = suffix || "";
    var dur = 600;
    var start = performance.now();
    var animId = (el._animId = (el._animId || 0) + 1);
    /**
     * Advances the count animation by one frame.
     * @param {number} now - The current high-resolution timestamp.
     * @returns {void} Nothing.
     */
    function step(now) {
      if (el._animId !== animId) return;
      var p = Math.min((now - start) / dur, 1);
      var v = Math.round(from + (to - from) * easeOut(p));
      el.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  /**
   * Applies a cubic ease-out curve to a normalized progress value.
   * @param {number} t - Linear progress between 0 and 1.
   * @returns {number} The eased progress between 0 and 1.
   */
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  var installBtn = document.getElementById("installAppBtn");
  var isStandalone =
    !!(
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) || navigator.standalone === true;
  /**
   * Captures the browser's install prompt and reveals the install button unless the app already runs standalone.
   * @param {Event} e - The beforeinstallprompt event.
   * @returns {void} Nothing.
   */
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    if (isStandalone) return;
    window._IS_deferredInstall = e;
    if (installBtn) installBtn.style.display = "";
  });
  if (installBtn) {
    /**
     * Shows the deferred install prompt to the user and hides the install button.
     * @returns {void} Nothing.
     */
    installBtn.addEventListener("click", function () {
      var deferred = window._IS_deferredInstall;
      if (!deferred) return;
      window._IS_deferredInstall = null;
      installBtn.style.display = "none";
      Promise.resolve()
        .then(function () {
          return deferred.prompt();
        })
        .then(function () {
          return deferred.userChoice;
        })
        .catch(function () {});
    });
  }
  /**
   * Hides the install button, clears the stored install prompt, and confirms installation to the user.
   * @returns {void} Nothing.
   */
  window.addEventListener("appinstalled", function () {
    if (installBtn) installBtn.style.display = "none";
    window._IS_deferredInstall = null;
    IS.showToast("App installed successfully!");
  });
  var genFabBtn = document.getElementById("genFabBtn");
  if (genFabBtn) {
    /**
     * Triggers the main generate button and plays a brief flash animation on the floating action button.
     * @returns {void} Nothing.
     */
    genFabBtn.addEventListener("click", function () {
      var realBtn = document.getElementById("generate-btn");
      if (realBtn) realBtn.click();
      genFabBtn.classList.remove("fab-flash");
      void genFabBtn.offsetWidth;
      genFabBtn.classList.add("fab-flash");
      setTimeout(function () {
        genFabBtn.classList.remove("fab-flash");
      }, 520);
    });
  }
});

/**
 * Registers the root-scoped service worker, removes the legacy js/-scoped one, and prompts the user to reload when an update is ready.
 * @returns {void} Nothing.
 */
(function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  var hadController = !!navigator.serviceWorker.controller;
  var userAccepted = false;
  var reloading = false;
  var toastShown = false;

  /**
   * Reloads the page a single time, ignoring repeated calls.
   * @returns {void} Nothing.
   */
  function reloadOnce() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  }

  /**
   * Reloads the page after a service worker takeover only if the user explicitly accepted the update.
   * @returns {void} Nothing.
   */
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (userAccepted) reloadOnce();
  });

  /**
   * Shows an "Update ready" toast with a reload button that activates the waiting service worker and reloads the page.
   * @param {ServiceWorker|null} worker - The waiting service worker to activate, or null if unavailable.
   * @returns {void} Nothing.
   */
  function showUpdateToast(worker) {
    if (toastShown || !(window.IS && IS.showToast)) return;
    toastShown = true;
    setTimeout(function () {
      toastShown = false;
    }, 5000);
    IS.showToast("Update ready", "info", 0);
    var toast = document.getElementById("gen-toast");
    if (!toast) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-reload", "");
    btn.textContent = "Reload now";
    btn.style.cssText =
      "background:rgba(0,180,255,0.2);border:1px solid rgba(0,180,255,0.4);color:#00d4ff;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;margin-left:6px;";
    toast.appendChild(btn);
    /**
     * Accepts the update by asking the waiting worker to skip waiting, falling back to a plain reload.
     * @returns {void} Nothing.
     */
    btn.addEventListener(
      "click",
      function () {
        if (worker && worker.state === "installed") {
          userAccepted = true;
          try {
            worker.postMessage({
              type: "SKIP_WAITING",
            });
          } catch (e) {
            reloadOnce();
            return;
          }
          setTimeout(reloadOnce, 3000);
        } else {
          reloadOnce();
        }
      },
      {
        once: true,
      },
    );
  }

  /**
   * Shows the update toast when the service worker reports an update and a previous controller existed.
   * @param {MessageEvent} e - The message event from the service worker.
   * @returns {void} Nothing.
   */
  navigator.serviceWorker.addEventListener("message", function (e) {
    if (e.data && e.data.type === "SW_UPDATED" && hadController)
      showUpdateToast(null);
  });

  /**
   * Cleans up legacy registrations, registers the service worker, wires update detection, and schedules hourly update checks once the page has loaded.
   * @returns {void} Nothing.
   */
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .getRegistrations()
      .then(function (regs) {
        return Promise.all(
          regs
            .filter(function (r) {
              return /\/js\/$/.test(r.scope);
            })
            .map(function (r) {
              return r.unregister();
            }),
        );
      })
      .then(function () {
        return navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
          updateViaCache: "none",
        });
      })
      .then(function (reg) {
        if (reg.waiting && navigator.serviceWorker.controller)
          showUpdateToast(reg.waiting);
        reg.addEventListener("updatefound", function () {
          var worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              showUpdateToast(worker);
          });
        });
        setInterval(
          function () {
            reg.update().catch(function () {});
          },
          60 * 60 * 1000,
        );
      })
      .catch(function (err) {
        console.error("[SW] registration failed:", err);
      });
  });
})();



// ==========================================================================
// SMART INTENT PRELOAD: ZERO LIGHTHOUSE OVERHEAD
// ==========================================================================
(function setupIntentPreload() {
  var namesTabBtn = document.querySelector('[data-target="tab-names"]');
  if (!namesTabBtn) return;

  function preloadNames() {
    if (window.IS && IS.loadScript && !window.IS.namesData) {
      IS.loadScript("js/names-data.js", function () {
  IS.loadScript("js/names.js");
});
    }
  }

  // Desktop par mouse aane par, ya mobile par pehla touch aane par prefetch karega
  namesTabBtn.addEventListener("pointerenter", preloadNames, { once: true });
  namesTabBtn.addEventListener("touchstart", preloadNames, { once: true, passive: true });
})();

// === ON-DEMAND SETTINGS LOADER ===
(function setupSettingsOnDemand() {
  function openSettings() {
    if (window.IS && IS.settings && IS.settings.open) {
      IS.settings.open();
    } else if (window.IS && IS.loadScript) {
      IS.loadScript("js/settings.min.js", function () {
        if (window.IS && IS.settings && IS.settings.open) {
          IS.settings.open();
        }
      });
    }
  }

  var gear = document.getElementById("settingsGearBtn");
  if (gear) {
    gear.addEventListener("click", openSettings);
    // User cursor laye ya touch kare to background mein instant load ho
    gear.addEventListener("pointerenter", function () {
      if (window.IS && IS.loadScript && (!window.IS || !IS.settings)) {
        IS.loadScript("js/settings.min.js");
      }
    }, { once: true });
    gear.addEventListener("touchstart", function () {
      if (window.IS && IS.loadScript && (!window.IS || !IS.settings)) {
        IS.loadScript("js/settings.min.js");
      }
    }, { once: true, passive: true });
  }

  // Keyboard shortcut Alt+S ko handle karo
  window.addEventListener("keydown", function (e) {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openSettings();
    }
  });
})();