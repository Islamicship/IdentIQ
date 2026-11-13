"use strict";

/**
 * Initializes the Names tab (Asma ul-Husna and Names of the Prophet) with rendering, search, audio playback, copy and scroll progress.
 * @returns {void}
 */
(function () {
  var PREFS_KEY = "IS_names_v1";
  var LONG_ARABIC = 16;
  var COLLECTIONS = {
    husna: {
      heroAr: "أَسْمَاءُ اللَّهِ الْحُسْنَىٰ",
      gridId: "husnaGrid",
      noteKey: "namesNoteHusna",
    },
    nabi: {
      heroAr: "أَسْمَاءُ النَّبِيِّ ﷺ",
      gridId: "nabiGrid",
      noteKey: "namesNoteNabi",
    },
  };
  var ORDER = ["husna", "nabi"];
  var ICON_SPEAK =
    '<svg class="icon-speak" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var ICON_PLAY_ALL =
    '<svg class="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  var ICON_STOP_ALL =
    '<svg class="icon-stop" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
  var ICON_EQUALIZER =
    '<span class="name-equalizer" aria-hidden="true"><span></span><span></span><span></span></span>';

  var audioPlayer = new Audio();
  audioPlayer.crossOrigin = "anonymous";
  audioPlayer.preload = "none";

  var activeCardEl = null;
  var activeBtnEl = null;
  var onPlaybackComplete = null;
  var onStopPlaylistHook = null;

  /**
   * Removes the playing state and ARIA pressed state from the currently active card and speak button.
   * @returns {void}
   */
  function clearPlaybackUI() {
    if (activeCardEl) {
      activeCardEl.classList.remove("is-playing");
      activeCardEl = null;
    }
    if (activeBtnEl) {
      activeBtnEl.classList.remove("is-playing");
      activeBtnEl.setAttribute("aria-pressed", "false");
      activeBtnEl = null;
    }
  }

  /**
   * Stops the current audio, resets its source and handlers, and clears the playback UI.
   * @returns {void}
   */
  function stopPlayback() {
    onPlaybackComplete = null;
    audioPlayer.onended = null;
    audioPlayer.onerror = null;

    try {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      audioPlayer.removeAttribute("src");
    } catch (e) {}

    clearPlaybackUI();
  }

  /**
   * Stops all audio playback and resets the "Play All" playlist state through the registered hook.
   * @returns {void}
   */
  function stopAll() {
    stopPlayback();
    if (typeof onStopPlaylistHook === "function") {
      onStopPlaylistHook();
    }
  }

  /**
   * Plays an audio track for a name card, toggling it off if the same card is already playing.
   * @param {string} src - URL of the audio file to play.
   * @param {HTMLElement} cardEl - The name card element to highlight while playing.
   * @param {HTMLElement} btnEl - The speak button element to mark as pressed while playing.
   * @param {Function|null} onComplete - Callback invoked when playback ends, fails, or the source is missing.
   * @returns {void}
   */
  function playAudioTrack(src, cardEl, btnEl, onComplete) {
    var isSameActive = activeCardEl === cardEl && !audioPlayer.paused;

    stopPlayback();

    if (isSameActive) return;

    if (!src) {
      if (window.IS && IS.showToast)
        IS.showToast("Audio not available", "error");
      if (onComplete) onComplete();
      return;
    }

    activeCardEl = cardEl;
    activeBtnEl = btnEl;
    onPlaybackComplete = onComplete;

    if (activeCardEl) activeCardEl.classList.add("is-playing");
    if (activeBtnEl) {
      activeBtnEl.classList.add("is-playing");
      activeBtnEl.setAttribute("aria-pressed", "true");
    }

    audioPlayer.src = src;

    audioPlayer.onended = function () {
      var cb = onPlaybackComplete;
      stopPlayback();
      if (typeof cb === "function") cb();
    };

    audioPlayer.onerror = function () {
      stopPlayback();
      if (window.IS && IS.showToast)
        IS.showToast("Audio playback failed", "error");
      if (typeof onPlaybackComplete === "function") {
        var cb = onPlaybackComplete;
        onPlaybackComplete = null;
        cb();
      }
    };

    var playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(function (err) {
        if (
          err &&
          (err.name === "AbortError" || err.name === "NotAllowedError")
        )
          return;
        stopPlayback();
      });
    }
  }

  /**
   * Translates an i18n key and substitutes {placeholder} variables in the resulting string.
   * @param {string} key - The i18n key to look up.
   * @param {Object} [vars] - Map of placeholder names to replacement values.
   * @returns {string} The translated and interpolated string, or the key itself if i18n is unavailable.
   */
  function tr(key, vars) {
    var s = window.IS && IS.i18n ? IS.i18n.get(key) : key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  /**
   * Converts Arabic-Indic and Persian digits in a string to Latin digits.
   * @param {string} s - The input string possibly containing non-Latin digits.
   * @returns {string} The string with all digits converted to Latin, or an empty string if the input is empty.
   */
  function toLatinDigits(s) {
    if (!s) return "";
    var str = window.IS && IS.toLatin ? IS.toLatin(s) : s;
    return str
      .replace(/[\u0660-\u0669]/g, function (d) {
        return String(d.charCodeAt(0) - 1632);
      })
      .replace(/[\u06F0-\u06F9]/g, function (d) {
        return String(d.charCodeAt(0) - 1776);
      });
  }

  /**
   * Normalizes Arabic text for search by stripping diacritics and unifying letter variants.
   * @param {string} s - The Arabic text to normalize.
   * @returns {string} The normalized Arabic string, or an empty string if the input is empty.
   */
  function normAr(s) {
    if (!s) return "";
    return s
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
      .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
      .replace(/\u0649/g, "\u064A")
      .replace(/\u0629/g, "\u0647")
      .replace(/[\u0624\u0626]/g, "\u0621");
  }

  /**
   * Cleans a raw search query by converting digits to Latin, trimming, and tightening spaces around colons.
   * @param {string} q - The raw search query.
   * @returns {string} The cleaned query, or an empty string if the input is empty.
   */
  function cleanQuery(q) {
    if (!q) return "";
    var s = toLatinDigits(q).trim();
    return s.replace(/\s*:\s*/g, ":");
  }

  /**
   * Normalizes Latin transliteration text so that spelling variants match during search.
   * @param {string} s - The Latin text to normalize.
   * @returns {string} The lowercased string without accents, separators, or repeated letters, with ee/oo folded to i/u.
   */
  function normLatin(s) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/['\u2019`\-\s]+/g, "")
      .replace(/ee/g, "i")
      .replace(/oo/g, "u")
      .replace(/(.)\1+/g, "$1");
  }

  /**
   * Checks whether a string contains any Arabic-script characters.
   * @param {string} s - The string to test.
   * @returns {boolean} True if at least one Arabic character is present.
   */
  function hasArabic(s) {
    return /[\u0600-\u06FF]/.test(s);
  }

  /**
   * Creates a DOM element with an optional class name and text content.
   * @param {string} tag - The tag name of the element to create.
   * @param {string} [cls] - The CSS class name to assign.
   * @param {string} [text] - The text content to set.
   * @returns {HTMLElement} The newly created element.
   */
  function mk(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * Builds the localized reference label for a name's Quran reference.
   * @param {string} ref - The reference string (e.g. "59:23").
   * @returns {string} The translated reference text.
   */
  function refText(ref) {
    return tr("namesRef", {
      r: ref,
    });
  }

  /**
   * Determines whether a Quran reference matches a search query, as a prefix for "surah:" queries or an exact/prefix match otherwise.
   * @param {string} ref - The reference of a name card.
   * @param {string} q - The cleaned search query.
   * @returns {boolean} True if the reference matches the query.
   */
  function refMatches(ref, q) {
    if (q.charAt(q.length - 1) === ":") return ref.indexOf(q) === 0;
    return ref === q || ref.indexOf(q) === 0;
  }

  /**
   * Loads the saved collection and script preferences from localStorage.
   * @returns {Object} The saved preferences, or an empty object if none exist or parsing fails.
   */
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Saves the current collection and script selection to localStorage.
   * @param {Object} state - The current UI state containing collection and script.
   * @returns {void}
   */
  function savePrefs(state) {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          collection: state.collection,
          script: state.script,
        }),
      );
    } catch (e) {}
  }

  /**
   * Sets up a slim scroll-progress bar that tracks how far the user has scrolled through the names section.
   * @param {HTMLElement} section - The section element whose scroll progress is tracked.
   * @returns {{refresh: Function}} An object exposing a refresh function that schedules a progress update.
   */
  function initScrollProgress(section) {
    var bar = document.getElementById("namesProgress");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "namesProgress";
      bar.className = "names-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }
    var raf = 0;
    var last = -1;

    /**
     * Computes the current scroll progress and writes it to the bar's --np CSS variable.
     * @returns {void}
     */
    function update() {
      raf = 0;
      var shown = section.getClientRects().length > 0;
      bar.classList.toggle("is-active", shown);
      if (!shown) return;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var docMax = document.documentElement.scrollHeight - window.innerHeight;
      var max = Math.min(
        section.getBoundingClientRect().bottom + y - window.innerHeight,
        docMax,
      );
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (max > 0 && max - y <= 3) p = 1;
      if (p !== 0 && p !== 1 && Math.abs(p - last) < 5e-4) return;
      last = p;
      bar.style.setProperty("--np", p.toFixed(4));
    }

    /**
     * Schedules a single progress update on the next animation frame if none is pending.
     * @returns {void}
     */
    function schedule() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, {
      passive: true,
    });
    window.addEventListener("resize", schedule, {
      passive: true,
    });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(section);
    schedule();
    return {
      refresh: schedule,
    };
  }

  /**
   * Wires up the Names tab once the DOM is ready: renders collections, search, audio, copy, script toggle and playlist.
   * @returns {void}
   */
  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("tab-names");
    var data = window.IS && IS.namesData;
    if (!root || !data) return;
    var tablist = root.querySelector(".names-tabs");
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".names-tab"));
    var panels = Array.prototype.slice.call(
      root.querySelectorAll(".names-panel"),
    );
    var scriptBtns = Array.prototype.slice.call(
      root.querySelectorAll(".names-script button"),
    );
    var heroAr = document.getElementById("namesHeroArabic");
    var search = document.getElementById("namesSearch");
    var countEl = document.getElementById("namesCount");
    var noteEl = document.getElementById("namesNote");
    var emptyEl = document.getElementById("namesEmpty");
    var clearBtn = document.getElementById("namesClear");
    var prefs = loadPrefs();
    var state = {
      collection: "husna",
      script: "naskh",
      query: "",
    };
    var cards = {};
    var copyText = new WeakMap();
    var speakData = new WeakMap();

    /**
     * Builds and caches the name cards for a collection the first time it is shown.
     * @param {string} key - The collection key ("husna" or "nabi").
     * @returns {void}
     */
    function renderCollection(key) {
      if (cards[key]) return;
      var grid = document.getElementById(COLLECTIONS[key].gridId);
      var frag = document.createDocumentFragment();
      var items = [];
      (data[key] || []).forEach(function (n) {
        var li = mk("li", "name-card");
        li.dataset.id = n.id;
        var head = mk("div", "name-card-head");
        head.appendChild(mk("span", "name-index", String(n.id)));
        var actions = mk("div", "name-actions");
        var speakBtn = mk("button", "name-speak");
        speakBtn.type = "button";
        speakBtn.innerHTML = ICON_SPEAK + ICON_EQUALIZER;
        speakBtn.setAttribute("aria-pressed", "false");
        speakBtn.setAttribute(
          "aria-label",
          tr("namesSpeakLabel", {
            n: n.transliteration,
          }),
        );
        speakBtn._name = n.transliteration;
        actions.appendChild(speakBtn);
        var btn = mk("button", "name-copy");
        btn.type = "button";
        btn.innerHTML = window.IS && IS.COPY_SVG ? IS.COPY_SVG : "";
        btn.setAttribute(
          "aria-label",
          tr("namesCopyLabel", {
            n: n.transliteration,
          }),
        );
        btn._name = n.transliteration;
        actions.appendChild(btn);
        head.appendChild(actions);
        var ar = mk(
          "p",
          "name-arabic" + (n.arabic.length > LONG_ARABIC ? " is-long" : ""),
          n.arabic,
        );
        ar.setAttribute("lang", "ar");
        ar.setAttribute("dir", "rtl");
        var refEl = mk("p", "name-ref", refText(n.ref));
        refEl.setAttribute("dir", "auto");
        li.appendChild(head);
        li.appendChild(ar);
        li.appendChild(mk("p", "name-transliteration", n.transliteration));
        li.appendChild(mk("p", "name-translation", n.translation));
        li.appendChild(refEl);
        speakData.set(li, "audio/" + key + "-" + n.id + ".mp3");
        copyText.set(
          li,
          n.arabic + " — " + n.transliteration + " (" + n.translation + ")",
        );
        items.push({
          el: li,
          id: n.id,
          ref: n.ref,
          surah: (n.ref || "").split(":")[0],
          refEl: refEl,
          ar: normAr(n.arabic),
          translit: normLatin(n.transliteration),
          meaning: (n.translation || "").toLowerCase(),
        });
        frag.appendChild(li);
      });
      grid.appendChild(frag);
      cards[key] = items;
    }

    /**
     * Filters the active collection's cards by card number, Quran reference, Arabic text, transliteration or meaning.
     * @returns {void}
     */
    function applyFilter() {
      var items = cards[state.collection] || [];
      var q = cleanQuery(state.query);
      var shown = 0;

      if (!q) {
        items.forEach(function (it) {
          it.el.hidden = false;
        });
        updateCount(items.length, items.length, false);
        emptyEl.hidden = true;
        return;
      }

      var cardHashMatch = q.match(/^#\s*(\d+)$/);
      var isCardHash = !!cardHashMatch;
      var targetCardId = isCardHash ? parseInt(cardHashMatch[1], 10) : null;

      var isRef = /^\d{1,3}:\d{0,3}$/.test(q);

      var isPlainNum = /^\d+$/.test(q);

      var isAr = hasArabic(q);
      var needleAr = isAr ? normAr(q) : "";
      var needleTranslit =
        !isAr && !isRef && !isCardHash && !isPlainNum ? normLatin(q) : "";
      var needleMeaning =
        !isAr && !isRef && !isCardHash && !isPlainNum ? q.toLowerCase() : "";

      items.forEach(function (it) {
        var ok = false;

        if (isCardHash) {
          ok = it.id === targetCardId;
        } else if (isRef) {
          ok = refMatches(it.ref, q);
        } else if (isPlainNum) {
          ok = String(it.id) === q || it.surah === q;
        } else if (isAr) {
          ok = needleAr !== "" && it.ar.indexOf(needleAr) !== -1;
        } else {
          ok =
            (needleTranslit !== "" &&
              it.translit.indexOf(needleTranslit) !== -1) ||
            (needleMeaning !== "" && it.meaning.indexOf(needleMeaning) !== -1);
        }

        it.el.hidden = !ok;
        if (ok) shown++;
      });

      updateCount(shown, items.length, true);
      emptyEl.hidden = shown !== 0;
    }

    /**
     * Updates the result counter text to show either the total or the filtered count.
     * @param {number} shown - The number of currently visible cards.
     * @param {number} total - The total number of cards in the collection.
     * @param {boolean} filtered - Whether a search filter is currently active.
     * @returns {void}
     */
    function updateCount(shown, total, filtered) {
      countEl.textContent = filtered
        ? tr("namesCountSome", {
            n: shown,
            t: total,
          })
        : tr("namesCountAll", {
            t: total,
          });
    }

    /**
     * Updates the descriptive note text for the active collection.
     * @returns {void}
     */
    function updateNote() {
      if (noteEl)
        noteEl.textContent = tr(COLLECTIONS[state.collection].noteKey);
    }

    /**
     * Switches to a collection by stopping audio, rendering its cards, updating tabs, panels and hero text, and saving preferences.
     * @param {string} key - The collection key to activate; falls back to "husna" if invalid.
     * @returns {void}
     */
    function setCollection(key) {
      if (!Object.prototype.hasOwnProperty.call(COLLECTIONS, key))
        key = "husna";
      stopAll();
      state.collection = key;
      renderCollection(key);
      root.dataset.collection = key;
      tabs.forEach(function (t) {
        var on = t.dataset.collection === key;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.hidden = p.dataset.collection !== key;
      });
      heroAr.textContent = COLLECTIONS[key].heroAr;
      updateNote();
      applyFilter();
      savePrefs(state);
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        setCollection(t.dataset.collection);
      });
    });
    tablist.addEventListener("keydown", function (e) {
      var i = ORDER.indexOf(state.collection);
      var rtl = window.getComputedStyle(tablist).direction === "rtl";
      var next = null;
      if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1;
      else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = ORDER.length - 1;
      if (next === null) return;
      e.preventDefault();
      next = (next + ORDER.length) % ORDER.length;
      setCollection(ORDER[next]);
      tabs[next].focus();
    });

    /**
     * Sets the Arabic display script (naskh or nastaliq), updates the toggle buttons, and saves preferences.
     * @param {string} s - The script name; any value other than "nastaliq" falls back to "naskh".
     * @returns {void}
     */
    function setScript(s) {
      state.script = s === "nastaliq" ? "nastaliq" : "naskh";
      root.dataset.script = state.script;
      scriptBtns.forEach(function (b) {
        b.setAttribute(
          "aria-pressed",
          b.dataset.script === state.script ? "true" : "false",
        );
      });
      savePrefs(state);
    }
    scriptBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        setScript(b.dataset.script);
      });
    });

    /**
     * Updates the search query, stops any audio, syncs the input value, and re-applies the filter.
     * @param {string} q - The new search query.
     * @returns {void}
     */
    function setQuery(q) {
      stopAll();
      state.query = q;
      if (search.value !== q) search.value = q;
      applyFilter();
    }
    search.addEventListener("input", function () {
      setQuery(search.value);
    });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && search.value) {
        e.preventDefault();
        setQuery("");
      }
    });
    clearBtn.addEventListener("click", function () {
      setQuery("");
      search.focus();
    });
    root.addEventListener("click", function (e) {
      var sp = e.target.closest(".name-speak");
      if (sp) {
        var card = sp.closest(".name-card");
        var src = speakData.get(card);
        if (src) {
          if (isPlayingAll) stopAll();
          playAudioTrack(src, card, sp, null);
        }
        return;
      }
      var btn = e.target.closest(".name-copy");
      if (!btn) return;
      var text = copyText.get(btn.closest(".name-card"));
      if (!text) return;
      var onCopied = function (ok) {
        if (ok) {
          if (window.IS && IS.copyFx) IS.copyFx(btn);
          else
            console.warn("[names] IS.copyFx not found - js/ui.js is outdated.");
          if (window.IS && IS.showToast) IS.showToast(tr("namesCopied"));
        } else if (window.IS && IS.showToast) {
          IS.showToast(tr("copyFailed"), "error");
        }
      };
      if (window.IS && IS.copyText) {
        IS.copyText(text).then(onCopied);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            onCopied(true);
          },
          function () {
            onCopied(false);
          },
        );
      } else {
        onCopied(false);
      }
    });
    window.addEventListener("IS_lang_changed", function () {
      var q = state.query.trim();
      var items = cards[state.collection] || [];
      var shown = items.filter(function (it) {
        return !it.el.hidden;
      }).length;
      updateCount(shown, items.length, !!q);
      updateNote();
      Object.keys(cards).forEach(function (k) {
        cards[k].forEach(function (it) {
          it.refEl.textContent = refText(it.ref);
        });
      });
      root.querySelectorAll(".name-speak").forEach(function (b) {
        b.setAttribute(
          "aria-label",
          tr("namesSpeakLabel", {
            n: b._name,
          }),
        );
      });
      root.querySelectorAll(".name-copy").forEach(function (b) {
        b.setAttribute(
          "aria-label",
          tr("namesCopyLabel", {
            n: b._name,
          }),
        );
      });
    });

    var playAllBtn = document.getElementById("namesPlayAll");
    var isPlayingAll = false;
    var playlistQueue = [];
    var playlistIndex = 0;

    /**
     * Updates the "Play All" button's icon, label and ARIA label to reflect whether the playlist is running.
     * @param {boolean} active - True if the playlist is currently playing.
     * @returns {void}
     */
    function updatePlayAllBtn(active) {
      if (!playAllBtn) return;
      if (active) {
        playAllBtn.classList.add("is-active");
        playAllBtn.innerHTML =
          ICON_STOP_ALL + ' <span class="names-play-all-label">Stop</span>';
        playAllBtn.setAttribute("aria-label", "Stop audio playlist");
      } else {
        playAllBtn.classList.remove("is-active");
        playAllBtn.innerHTML =
          ICON_PLAY_ALL + ' <span class="names-play-all-label">Play All</span>';
        playAllBtn.setAttribute("aria-label", "Play all names");
      }
    }

    /**
     * Resets the playlist state and the "Play All" button when all playback is stopped.
     * @returns {void}
     */
    onStopPlaylistHook = function () {
      isPlayingAll = false;
      playlistQueue = [];
      playlistIndex = -1;
      updatePlayAllBtn(false);
    };

    /**
     * Plays the current playlist item, scrolls it into view, and advances to the next after a short pause.
     * @returns {void}
     */
    function playNextInQueue() {
      if (!isPlayingAll) return;
      if (playlistIndex >= playlistQueue.length) {
        stopAll();
        return;
      }

      var item = playlistQueue[playlistIndex];
      if (!item || !item.el) {
        stopAll();
        return;
      }

      item.el.scrollIntoView({ behavior: "smooth", block: "center" });

      var speakBtn = item.el.querySelector(".name-speak");
      var src = speakData.get(item.el);

      playAudioTrack(src, item.el, speakBtn, function () {
        if (!isPlayingAll) return;
        playlistIndex++;
        setTimeout(function () {
          if (isPlayingAll) playNextInQueue();
        }, 220);
      });
    }

    /**
     * Starts sequential playback of all currently visible name cards in the active collection.
     * @returns {void}
     */
    function startPlayAll() {
      var items = cards[state.collection] || [];
      var visibleItems = items.filter(function (it) {
        return !it.el.hidden;
      });

      if (visibleItems.length === 0) return;

      stopAll();
      isPlayingAll = true;
      playlistQueue = visibleItems;
      playlistIndex = 0;
      updatePlayAllBtn(true);
      playNextInQueue();
    }

    if (playAllBtn) {
      playAllBtn.addEventListener("click", function () {
        if (isPlayingAll) {
          stopAll();
        } else {
          startPlayAll();
        }
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isPlayingAll) {
        stopAll();
      }
    });

    setScript(prefs.script);
    setCollection(prefs.collection);
    var progress = initScrollProgress(root);
    IS.names = {
      show: setCollection,
      setScript: setScript,
      filter: setQuery,
      stop: stopAll,
      progress: progress,
    };
  });
})();
