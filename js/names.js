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
    var ICON_PLAY_ALL = '<svg class="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
    var ICON_STOP_ALL = '<svg class="icon-stop" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
    var ICON_EQUALIZER = '<span class="name-equalizer" aria-hidden="true"><span></span><span></span><span></span></span>';

    // Singleton Audio Controller
    var audioPlayer = new Audio();
    audioPlayer.crossOrigin = "anonymous";
    audioPlayer.preload = "none";

    var activeCardEl = null;
    var activeBtnEl = null;
    var onPlaybackComplete = null;
    var onStopPlaylistHook = null;

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

    function stopAll() {
        stopPlayback();
        if (typeof onStopPlaylistHook === "function") {
            onStopPlaylistHook();
        }
    }

    function playAudioTrack(src, cardEl, btnEl, onComplete) {
        var isSameActive = (activeCardEl === cardEl && !audioPlayer.paused);

        // Previous audio ko fauran stop aur reset karo
        stopPlayback();

        // Agar wahi card dubara click kiya jo chal raha tha, toh sirf pause hoga
        if (isSameActive) return;

        if (!src) {
            if (window.IS && IS.showToast) IS.showToast("Audio not available", "error");
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

        audioPlayer.onended = function() {
            var cb = onPlaybackComplete;
            stopPlayback();
            if (typeof cb === "function") cb();
        };

        audioPlayer.onerror = function() {
            stopPlayback();
            if (window.IS && IS.showToast) IS.showToast("Audio playback failed", "error");
            if (typeof onPlaybackComplete === "function") {
                var cb = onPlaybackComplete;
                onPlaybackComplete = null;
                cb();
            }
        };

        var playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(function(err) {
                // Rapid switching par console AbortError ko safely ignore karo
                if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
                stopPlayback();
            });
        }
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
    function toLatinDigits(s) {
        if (!s) return "";
        var str = window.IS && IS.toLatin ? IS.toLatin(s) : s;
        return str.replace(/[\u0660-\u0669]/g, function(d) {
            return String(d.charCodeAt(0) - 1632);
        }).replace(/[\u06F0-\u06F9]/g, function(d) {
            return String(d.charCodeAt(0) - 1776);
        });
    }

    function normAr(s) {
        if (!s) return "";
        return s
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
            .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
            .replace(/\u0649/g, "\u064A")
            .replace(/\u0629/g, "\u0647")
            .replace(/[\u0624\u0626]/g, "\u0621");
    }

    function cleanQuery(q) {
        if (!q) return "";
        var s = toLatinDigits(q).trim();
        return s.replace(/\s*:\s*/g, ":");
    }

    function normLatin(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036F]/g, "").replace(/['\u2019`\-\s]+/g, "").replace(/ee/g, "i").replace(/oo/g, "u").replace(/(.)\1+/g, "$1");
    }

    function hasArabic(s) {
        return /[\u0600-\u06FF]/.test(s);
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
        return ref === q || ref.indexOf(q) === 0;
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
                speakBtn.innerHTML = ICON_SPEAK + ICON_EQUALIZER;
                speakBtn.setAttribute("aria-pressed", "false");
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
                speakData.set(li, "audio/" + key + "-" + n.id + ".mp3");
                copyText.set(li, n.arabic + " — " + n.transliteration + " (" + n.translation + ")");
                items.push({
                    el: li,
                    id: n.id,
                    ref: n.ref,
                    surah: (n.ref || "").split(":")[0],
                    refEl: refEl,
                    ar: normAr(n.arabic),
                    translit: normLatin(n.transliteration),
                    meaning: (n.translation || "").toLowerCase()
                });
                frag.appendChild(li);
            });
            grid.appendChild(frag);
            cards[key] = items;
        }
        function applyFilter() {
            var items = cards[state.collection] || [];
            var q = cleanQuery(state.query);
            var shown = 0;

            if (!q) {
                items.forEach(function(it) {
                    it.el.hidden = false;
                });
                updateCount(items.length, items.length, false);
                emptyEl.hidden = true;
                return;
            }

            // Parameter 1: Explicit card search (#5 ya # 5)
            var cardHashMatch = q.match(/^#\s*(\d+)$/);
            var isCardHash = !!cardHashMatch;
            var targetCardId = isCardHash ? parseInt(cardHashMatch[1], 10) : null;

            // Parameter 2: Surah:Ayah reference (e.g. "2:255", "2:", "59:23")
            var isRef = /^\d{1,3}:\d{0,3}$/.test(q);

            // Parameter 3: Plain digit (e.g. "2" ya "25") -> Card ID OR Surah Number
            var isPlainNum = /^\d+$/.test(q);

            // Text needles
            var isAr = hasArabic(q);
            var needleAr = isAr ? normAr(q) : "";
            var needleTranslit = !isAr && !isRef && !isCardHash && !isPlainNum ? normLatin(q) : "";
            var needleMeaning = !isAr && !isRef && !isCardHash && !isPlainNum ? q.toLowerCase() : "";

            items.forEach(function(it) {
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
                    ok = (needleTranslit !== "" && it.translit.indexOf(needleTranslit) !== -1) ||
                         (needleMeaning !== "" && it.meaning.indexOf(needleMeaning) !== -1);
                }

                it.el.hidden = !ok;
                if (ok) shown++;
            });

            updateCount(shown, items.length, true);
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
            stopAll();
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

        var playAllBtn = document.getElementById("namesPlayAll");
        var isPlayingAll = false;
        var playlistQueue = [];
        var playlistIndex = 0;

        function updatePlayAllBtn(active) {
            if (!playAllBtn) return;
            if (active) {
                playAllBtn.classList.add("is-active");
                playAllBtn.innerHTML = ICON_STOP_ALL + ' <span class="names-play-all-label">Stop</span>';
                playAllBtn.setAttribute("aria-label", "Stop audio playlist");
            } else {
                playAllBtn.classList.remove("is-active");
                playAllBtn.innerHTML = ICON_PLAY_ALL + ' <span class="names-play-all-label">Play All</span>';
                playAllBtn.setAttribute("aria-label", "Play all names");
            }
        }

        // Global hook: stopAll() call hone par playlist ko reset karega
        onStopPlaylistHook = function() {
            isPlayingAll = false;
            playlistQueue = [];
            playlistIndex = -1;
            updatePlayAllBtn(false);
        };

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

            // Auto-scroll to center
            item.el.scrollIntoView({ behavior: "smooth", block: "center" });

            var speakBtn = item.el.querySelector(".name-speak");
            var src = speakData.get(item.el);

            // Audio bajao (active highlight playAudioTrack khud handle karega)
            playAudioTrack(src, item.el, speakBtn, function() {
                if (!isPlayingAll) return;
                playlistIndex++;
                setTimeout(function() {
                    if (isPlayingAll) playNextInQueue();
                }, 220); // 220ms ka natural waqfa har naam ke darmiyan
            });
        }

        function startPlayAll() {
            var items = cards[state.collection] || [];
            // Sirf wahi cards uthao jo filter ke mutabiq visible hain
            var visibleItems = items.filter(function(it) {
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
            playAllBtn.addEventListener("click", function() {
                if (isPlayingAll) {
                    stopAll();
                } else {
                    startPlayAll();
                }
            });
        }
        document.addEventListener("keydown", function(e) {
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
            progress: progress
        };
    });
})();
