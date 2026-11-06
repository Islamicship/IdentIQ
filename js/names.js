"use strict";

(function() {
    var PREFS_KEY = "IS_names_v1";
    var LONG_ARABIC = 16;
    var COLLECTIONS = {
        husna: {
            heroAr: "أَسْمَاءُ اللَّهِ الْحُسْنَىٰ",
            gridId: "husnaGrid",
            noteKey: "namesNoteHusna"
        },
        nabi: {
            heroAr: "أَسْمَاءُ النَّبِيِّ ﷺ",
            gridId: "nabiGrid",
            noteKey: "namesNoteNabi"
        }
    };
    var ORDER = [ "husna", "nabi" ];
    var ICON_COPY = '<svg class="icon-copy" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    var ICON_SPEAK = '<svg class="icon-speak" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    var USE_AUDIO_FILES = true;
    var arVoice = null;
    function pickArabicVoice() {
        if (!("speechSynthesis" in window)) return;
        var voices = speechSynthesis.getVoices() || [];
        arVoice = voices.find(function(v) {
            return v.lang && v.lang.replace("_", "-") === "ar-SA";
        }) || voices.find(function(v) {
            return v.lang && v.lang.toLowerCase().indexOf("ar") === 0;
        }) || null;
    }
    if ("speechSynthesis" in window) {
        pickArabicVoice();
        if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickArabicVoice);
    }
    var player = null;
    var liveUtterance = null;
    var audioFailed = {};
    function clearSpeaking() {
        document.querySelectorAll(".name-speak.speaking").forEach(function(b) {
            b.classList.remove("speaking");
        });
    }
    function stopAll() {
        if (player) {
            player.onplaying = player.onended = player.onpause = player.onerror = null;
            try {
                player.pause();
            } catch (e) {}
            player = null;
        }
        if (liveUtterance) {
            liveUtterance.onstart = liveUtterance.onend = liveUtterance.onerror = null;
            liveUtterance = null;
        }
        if ("speechSynthesis" in window) speechSynthesis.cancel();
        clearSpeaking();
    }
    function speakTTS(text, btn) {
        if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
            if (window.IS && IS.showToast) IS.showToast(tr("namesSpeakUnsupported"), "error");
            return;
        }
        if (!arVoice) pickArabicVoice();
        var u = new SpeechSynthesisUtterance(text.replace(/\uFDFA/g, "").replace(/\u0671/g, "\u0627").trim());
        u.lang = "ar-SA";
        if (arVoice) u.voice = arVoice;
        u.rate = 0.8;
        u.onstart = function() {
            btn.classList.add("speaking");
        };
        liveUtterance = u;
        u.onend = u.onerror = function() {
            btn.classList.remove("speaking");
            if (liveUtterance === u) liveUtterance = null;
        };
        speechSynthesis.speak(u);
        if (!arVoice && window.IS && IS.showToast) IS.showToast(tr("namesSpeakNoVoice"), "info");
    }
    function speakName(info, btn) {
        var wasSpeaking = btn.classList.contains("speaking");
        stopAll();
        if (wasSpeaking) return;
        if (USE_AUDIO_FILES && info.src && !audioFailed[info.src]) {
            var a = new Audio(info.src);
            player = a;
            a.onplaying = function() {
                btn.classList.add("speaking");
            };
            a.onended = a.onpause = function() {
                btn.classList.remove("speaking");
                if (player === a) player = null;
            };
            var fallback = function() {
                if (player !== a) return;
                audioFailed[info.src] = true;
                player = null;
                btn.classList.remove("speaking");
                speakTTS(info.ar, btn);
            };
            a.onerror = fallback;
            var pr = a.play();
            if (pr && pr.catch) pr.catch(function(err) {
                if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) {
                    if (player === a) player = null;
                    return;
                }
                fallback();
            });
            return;
        }
        speakTTS(info.ar, btn);
    }
    function tr(key, vars) {
        var s = window.IS && IS.i18n ? IS.i18n.get(key) : key;
        if (vars) {
            Object.keys(vars).forEach(function(k) {
                s = s.split("{" + k + "}").join(String(vars[k]));
            });
        }
        return s;
    }
    function normAr(s) {
        return s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627").replace(/\u0649/g, "\u064A");
    }
    function normLatin(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036F]/g, "").replace(/['\u2019`\-\s]+/g, "").replace(/ee/g, "i").replace(/oo/g, "u").replace(/(.)\1+/g, "$1");
    }
    function hasArabic(s) {
        return /[\u0600-\u06FF]/.test(s);
    }
    function toLatinDigits(s) {
        return window.IS && IS.toLatin ? IS.toLatin(s) : s;
    }
    function mk(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function refText(ref) {
        return tr("namesRef", {
            r: ref
        });
    }
    function refMatches(ref, q) {
        if (q.charAt(q.length - 1) === ":") return ref.indexOf(q) === 0;
        return ref === q;
    }
    function loadPrefs() {
        try {
            return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
        } catch (e) {
            return {};
        }
    }
    function savePrefs(state) {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({
                collection: state.collection,
                script: state.script
            }));
        } catch (e) {}
    }
    // Scroll progress (slim bar at the top of the viewport).
    // CSS lives in names.css (.names-progress). JS only writes one number, --np (0..1);
    // the bar is animated by CSS with transform: scaleX() on the GPU (no layout, no width animation).
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
        function update() {
            raf = 0;
            var shown = section.getClientRects().length > 0;
            bar.classList.toggle("is-active", shown);
            if (!shown) return;
            var y = window.pageYOffset || document.documentElement.scrollTop || 0;
            var docMax = document.documentElement.scrollHeight - window.innerHeight;
            var max = Math.min(section.getBoundingClientRect().bottom + y - window.innerHeight, docMax);
            var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
            if (max > 0 && max - y <= 3) p = 1;
            if (p !== 0 && p !== 1 && Math.abs(p - last) < 5e-4) return;
            last = p;
            bar.style.setProperty("--np", p.toFixed(4));
        }
        function schedule() {
            if (!raf) raf = requestAnimationFrame(update);
        }
        window.addEventListener("scroll", schedule, {
            passive: true
        });
        window.addEventListener("resize", schedule, {
            passive: true
        });
        // Fires when the tab is shown/hidden, when a collection renders or switches,
        // when search filters cards, and on language change (text length).
        if (window.ResizeObserver) new ResizeObserver(schedule).observe(section);
        schedule();
        return {
            refresh: schedule
        };
    }
    document.addEventListener("DOMContentLoaded", function() {
        var root = document.getElementById("tab-names");
        var data = window.IS && IS.namesData;
        if (!root || !data) return;
        var tablist = root.querySelector(".names-tabs");
        var tabs = Array.prototype.slice.call(root.querySelectorAll(".names-tab"));
        var panels = Array.prototype.slice.call(root.querySelectorAll(".names-panel"));
        var scriptBtns = Array.prototype.slice.call(root.querySelectorAll(".names-script button"));
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
            query: ""
        };
        var cards = {};
        var copyText = new WeakMap;
        var speakData = new WeakMap;
        function renderCollection(key) {
            if (cards[key]) return;
            var grid = document.getElementById(COLLECTIONS[key].gridId);
            var frag = document.createDocumentFragment();
            var items = [];
            (data[key] || []).forEach(function(n) {
                var li = mk("li", "name-card");
                li.dataset.id = n.id;
                var head = mk("div", "name-card-head");
                head.appendChild(mk("span", "name-index", String(n.id)));
                var actions = mk("div", "name-actions");
                var speakBtn = mk("button", "name-speak");
                speakBtn.type = "button";
                speakBtn.innerHTML = ICON_SPEAK;
                speakBtn.setAttribute("aria-label", tr("namesSpeakLabel", {
                    n: n.transliteration
                }));
                speakBtn._name = n.transliteration;
                actions.appendChild(speakBtn);
                var btn = mk("button", "name-copy");
                btn.type = "button";
                btn.innerHTML = ICON_COPY;
                btn.setAttribute("aria-label", tr("namesCopyLabel", {
                    n: n.transliteration
                }));
                btn._name = n.transliteration;
                actions.appendChild(btn);
                head.appendChild(actions);
                var ar = mk("p", "name-arabic" + (n.arabic.length > LONG_ARABIC ? " is-long" : ""), n.arabic);
                ar.setAttribute("lang", "ar");
                ar.setAttribute("dir", "rtl");
                var refEl = mk("p", "name-ref", refText(n.ref));
                refEl.setAttribute("dir", "auto");
                li.appendChild(head);
                li.appendChild(ar);
                li.appendChild(mk("p", "name-transliteration", n.transliteration));
                li.appendChild(mk("p", "name-translation", n.translation));
                li.appendChild(refEl);
                speakData.set(li, {
                    ar: n.arabic,
                    src: "audio/" + key + "-" + n.id + ".mp3"
                });
                copyText.set(li, n.arabic + " — " + n.transliteration + " (" + n.translation + ")");
                items.push({
                    el: li,
                    id: n.id,
                    ref: n.ref,
                    refEl: refEl,
                    hay: normLatin(n.transliteration + " " + n.translation) + " " + normAr(n.arabic)
                });
                frag.appendChild(li);
            });
            grid.appendChild(frag);
            cards[key] = items;
        }
        function applyFilter() {
            var items = cards[state.collection] || [];
            var q = toLatinDigits(state.query).trim();
            var isNum = /^\d+$/.test(q);
            var isRef = /^\d{1,3}:\d{0,3}$/.test(q);
            var needle = !q || isNum || isRef ? "" : hasArabic(q) ? normAr(q) : normLatin(q);
            var shown = 0;
            items.forEach(function(it) {
                var ok;
                if (!q) ok = true; else if (isRef) ok = refMatches(it.ref, q); else if (isNum) ok = String(it.id) === q; else ok = needle !== "" && it.hay.indexOf(needle) !== -1;
                it.el.hidden = !ok;
                if (ok) shown++;
            });
            updateCount(shown, items.length, !!q);
            emptyEl.hidden = shown !== 0;
        }
        function updateCount(shown, total, filtered) {
            countEl.textContent = filtered ? tr("namesCountSome", {
                n: shown,
                t: total
            }) : tr("namesCountAll", {
                t: total
            });
        }
        function updateNote() {
            if (noteEl) noteEl.textContent = tr(COLLECTIONS[state.collection].noteKey);
        }
        function setCollection(key) {
            if (!Object.prototype.hasOwnProperty.call(COLLECTIONS, key)) key = "husna";
            stopAll();
            state.collection = key;
            renderCollection(key);
            root.dataset.collection = key;
            tabs.forEach(function(t) {
                var on = t.dataset.collection === key;
                t.setAttribute("aria-selected", on ? "true" : "false");
                t.tabIndex = on ? 0 : -1;
            });
            panels.forEach(function(p) {
                p.hidden = p.dataset.collection !== key;
            });
            heroAr.textContent = COLLECTIONS[key].heroAr;
            updateNote();
            applyFilter();
            savePrefs(state);
        }
        tabs.forEach(function(t) {
            t.addEventListener("click", function() {
                setCollection(t.dataset.collection);
            });
        });
        tablist.addEventListener("keydown", function(e) {
            var i = ORDER.indexOf(state.collection);
            var rtl = window.getComputedStyle(tablist).direction === "rtl";
            var next = null;
            if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1; else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1; else if (e.key === "Home") next = 0; else if (e.key === "End") next = ORDER.length - 1;
            if (next === null) return;
            e.preventDefault();
            next = (next + ORDER.length) % ORDER.length;
            setCollection(ORDER[next]);
            tabs[next].focus();
        });
        function setScript(s) {
            state.script = s === "nastaliq" ? "nastaliq" : "naskh";
            root.dataset.script = state.script;
            scriptBtns.forEach(function(b) {
                b.setAttribute("aria-pressed", b.dataset.script === state.script ? "true" : "false");
            });
            savePrefs(state);
        }
        scriptBtns.forEach(function(b) {
            b.addEventListener("click", function() {
                setScript(b.dataset.script);
            });
        });
        function setQuery(q) {
            state.query = q;
            if (search.value !== q) search.value = q;
            applyFilter();
        }
        search.addEventListener("input", function() {
            setQuery(search.value);
        });
        search.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && search.value) {
                e.preventDefault();
                setQuery("");
            }
        });
        clearBtn.addEventListener("click", function() {
            setQuery("");
            search.focus();
        });
        root.addEventListener("click", function(e) {
            var sp = e.target.closest(".name-speak");
            if (sp) {
                var info = speakData.get(sp.closest(".name-card"));
                if (info) speakName(info, sp);
                return;
            }
            var btn = e.target.closest(".name-copy");
            if (!btn) return;
            var text = copyText.get(btn.closest(".name-card"));
            if (!text) return;
            var onCopied = function(ok) {
                if (ok) {
                    if (window.IS && IS.copyFx) IS.copyFx(btn); else console.warn("[names] IS.copyFx not found - js/ui.js is outdated.");
                    if (window.IS && IS.showToast) IS.showToast(tr("namesCopied"));
                } else if (window.IS && IS.showToast) {
                    IS.showToast(tr("copyFailed"), "error");
                }
            };
            if (window.IS && IS.copyText) {
                IS.copyText(text).then(onCopied);
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    onCopied(true);
                }, function() {
                    onCopied(false);
                });
            } else {
                onCopied(false);
            }
        });
        window.addEventListener("IS_lang_changed", function() {
            var q = state.query.trim();
            var items = cards[state.collection] || [];
            var shown = items.filter(function(it) {
                return !it.el.hidden;
            }).length;
            updateCount(shown, items.length, !!q);
            updateNote();
            Object.keys(cards).forEach(function(k) {
                cards[k].forEach(function(it) {
                    it.refEl.textContent = refText(it.ref);
                });
            });
            root.querySelectorAll(".name-speak").forEach(function(b) {
                b.setAttribute("aria-label", tr("namesSpeakLabel", {
                    n: b._name
                }));
            });
            root.querySelectorAll(".name-copy").forEach(function(b) {
                b.setAttribute("aria-label", tr("namesCopyLabel", {
                    n: b._name
                }));
            });
        });
        setScript(prefs.script);
        setCollection(prefs.collection);
        var progress = initScrollProgress(root);
        IS.names = {
            show: setCollection,
            setScript: setScript,
            filter: setQuery,
            stop: stopAll,
            progress: progress
        };
    });
})();
