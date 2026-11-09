"use strict";

window.IS = window.IS || {};

(function(IS) {
    var _sharedAC = null;
    function getAudioContext() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!_sharedAC || _sharedAC.state === "closed") {
            try {
                _sharedAC = new AC;
            } catch (e) {
                return null;
            }
        }
        if (_sharedAC.state === "suspended") {
            try {
                var rp = _sharedAC.resume();
                if (rp && rp.catch) rp.catch(function() {});
            } catch (e) {}
        }
        return _sharedAC;
    }
    IS.playCopySound = function() {
        try {
            var ctx = getAudioContext();
            if (!ctx) return;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + .06);
            gain.gain.setValueAtTime(.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + .2);
        } catch (e) {}
    };
    IS.stripHiddenChars = function(text) {
        if (!text) return "";
        return text.replace(/[\u200B-\u200F]/g, "").replace(/[\u202A-\u202E]/g, "").replace(/[\u2066-\u2069]/g, "").replace(/[\u206A-\u206F]/g, "").replace(/\uFEFF/g, "").replace(/\u00AD/g, "").replace(/[\uFFF9-\uFFFB]/g, "").replace(/[\uE000-\uF8FF]/g, "").replace(/\u00A0/g, " ").replace(/\u202F/g, " ").replace(/\u205F/g, " ").replace(/\u2028/g, "\n").replace(/\u2029/g, "\n").replace(/\u000C/g, "\n").replace(/\u0085/g, "\n").replace(/[\u2060-\u2064]/g, "").replace(/[\u0007\u001F]/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[^\S\n]+/g, " ");
    };
    IS.ocrClean = function(text) {
        if (!text) return "";
        var t = IS.stripHiddenChars(text);
        t = t.replace(/\n{3,}/g, "\n\n");
        t = t.replace(/^[\s\-_=|]{3,}$/gm, "");
        t = t.replace(/\b([0-9]{5})\s([0-9]{5})\b/g, "$1$2");
        t = t.replace(/([\u0600-\u06FF])\n([\u0600-\u06FF])/g, "$1 $2");
        if (t.normalize) t = t.normalize("NFC");
        t = t.replace(/\uFEFB|\uFEFC/g, "لا").replace(/\uFEF9|\uFEFA/g, "لإ").replace(/\uFEF7|\uFEF8/g, "لأ").replace(/\uFEF5|\uFEF6/g, "لآ").replace(/[\uFE70-\uFE7F]/g, "").replace(/[\uFB50-\uFB51]/g, "ٱ").replace(/[\uFB52-\uFB55]/g, "ٻ");
        t = t.replace(/\t/g, " ");
        t = t.replace(/([A-Za-z\u0600-\u06FF])-\s*\n\s*([A-Za-z\u0600-\u06FF])/g, "$1$2");
        t = t.replace(/([0-9])O([0-9])/g, "$10$2").replace(/([0-9])O\b/g, "$10").replace(/\bO([0-9])/g, "0$1");
        t = t.replace(/([0-9])l([0-9])/g, "$11$2").replace(/([0-9])l\b/g, "$11").replace(/\bl([0-9])/g, "1$1");
        t = t.replace(/([0-9])\|([0-9])/g, "$11$2").replace(/([0-9])\|\b/g, "$11").replace(/\b\|([0-9])/g, "1$1");
        var lines = t.split("\n");
        var out = [];
        var lastKey = "";
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i].replace(/^[ \t]+|[ \t]+$/g, "");
            if (/^[\|\~\#\_\^\`\u00AC\*\+\=\<\>\{\}\[\]\\\/]+$/.test(ln)) continue;
            if (/^[\d\.\-\,\s]{1,4}$/.test(ln) && !/[A-Za-z\u0600-\u06FF]/.test(ln)) continue;
            var key = ln.toLowerCase().replace(/\s+/g, " ");
            if (key && key === lastKey) continue;
            lastKey = key;
            out.push(ln);
        }
        t = out.join("\n").replace(/\n{3,}/g, "\n\n");
        return t.trim();
    };
    IS.ocrDiffCount = function(before, after) {
        if (!before || !after) return 0;
        var removed = Math.max(0, before.split("\n").length - after.split("\n").length);
        var shrink = Math.max(0, before.replace(/\s/g, "").length - after.replace(/\s/g, "").length);
        return removed + Math.floor(shrink / 4);
    };
    function legacyCopy(text) {
        var prev = document.activeElement;
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        var ok = false;
        try {
            ta.focus({
                preventScroll: true
            });
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            ok = document.execCommand("copy") === true;
        } catch (e) {
            ok = false;
        }
        if (ta.parentNode) ta.parentNode.removeChild(ta);
        if (prev && prev !== document.body && typeof prev.focus === "function") {
            try {
                prev.focus({
                    preventScroll: true
                });
            } catch (e) {}
        }
        return ok;
    }
    IS.copyText = function(text) {
        if (!text) return Promise.resolve(false);
        IS.playCopySound();
        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
            var p;
            try {
                p = navigator.clipboard.writeText(text);
            } catch (e) {
                return Promise.resolve(legacyCopy(text));
            }
            return p.then(function() {
                return true;
            }, function() {
                return legacyCopy(text);
            });
        }
        return Promise.resolve(legacyCopy(text));
    };
    IS.fastCopy = function(text) {
        if (!text) return false;
        IS.copyText(text);
        return true;
    };
    IS.fastCopy._legacyCopy = legacyCopy;
    IS.toLatin = function(s) {
        if (!s) return "";
        s = s.replace(/[\u0660-\u0669]/g, function(d) {
            return d.charCodeAt(0) - 1632;
        });
        s = s.replace(/[\u06F0-\u06F9]/g, function(d) {
            return d.charCodeAt(0) - 1776;
        });
        return s;
    };
    IS.pad = function(n) {
        return String(n).padStart(2, "0");
    };
    IS.escHtml = function(s) {
        return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    };
    IS.fmtDate = function(d) {
        return IS.pad(d.getDate()) + "-" + IS.pad(d.getMonth() + 1) + "-" + d.getFullYear();
    };
    IS.computeExpiryDate = function(issueDate) {
        var expiry = new Date(issueDate.getFullYear() + 5, issueDate.getMonth(), issueDate.getDate());
        expiry.setDate(expiry.getDate() - 1);
        return expiry;
    };
    IS.COPY_SVG = '<svg viewBox="0 0 20 20" fill="none"><rect x="7" y="7" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 13H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    IS.TICK_SVG = '<svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><path class="tick-path" d="M6.5 11l3.5 3.5 5.5-6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="16" stroke-dashoffset="16"/></svg>';
    var FX_SPARKS = 8;
    var FX_ICON_MS = 1150;
    var FX_END_MS = 1300;
    function fxSpan(cls) {
        var s = document.createElement("span");
        s.className = cls;
        return s;
    }
    function buildCopyFx() {
        var fx = fxSpan("copy-fx");
        fx.setAttribute("aria-hidden", "true");
        fx.appendChild(fxSpan("copy-fx__ring"));
        for (var i = 0; i < FX_SPARKS; i++) {
            var sp = fxSpan("copy-fx__spark");
            sp.style.setProperty("--a", i * 360 / FX_SPARKS + "deg");
            sp.style.setProperty("--i", i);
            fx.appendChild(sp);
        }
        var badge = fxSpan("copy-fx__badge");
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path class="copy-fx__tick" d="M6.5 12.5l3.8 3.8 7.2-8.3"/></svg>';
        fx.appendChild(badge);
        return fx;
    }
    IS.copyFxVersion = 1;
    IS.copyFx = function(btn) {
        if (!btn) return;
        clearTimeout(btn._fxIconTimer);
        clearTimeout(btn._fxEndTimer);
        var old = btn.querySelector(".copy-fx");
        if (old) old.remove();
        btn.classList.remove("fx-copied");
        void btn.offsetWidth;
        if (btn.hasAttribute("data-tip")) {
            if (btn._fxTip === undefined) btn._fxTip = btn.getAttribute("data-tip");
            btn.setAttribute("data-tip", "Copied!");
        }
        btn._copying = true;
        btn.appendChild(buildCopyFx());
        btn.classList.add("fx-copied");
        try {
            var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (navigator.vibrate && !calm) navigator.vibrate(10);
        } catch (e) {}
        btn._fxIconTimer = setTimeout(function() {
            btn.classList.remove("fx-copied", "hover-pending");
            if (btn._fxTip !== undefined) btn.setAttribute("data-tip", btn._fxTip);
        }, FX_ICON_MS);
        btn._fxEndTimer = setTimeout(function() {
            var fx = btn.querySelector(".copy-fx");
            if (fx) fx.remove();
            btn._copying = false;
        }, FX_END_MS);
    };
    IS.setupCopyBtn = function(btn, getValue) {
        btn._getCopyValue = getValue;
        if (btn._copyBound) return;
        btn._copyBound = true;
        btn.innerHTML = IS.COPY_SVG;
        btn._copying = false;
        if (!btn.hasAttribute("data-tip")) btn.setAttribute("data-tip", "Copy");
        btn.addEventListener("click", function() {
            var val = typeof btn._getCopyValue === "function" ? btn._getCopyValue() : "";
            if (!val) return;
            IS.copyText(val).then(function(ok) {
                if (ok) IS.copyFx(btn); else IS.showToast(IS.i18n.get("copyFailed"), "error");
            });
        });
    };
    IS.triggerConfetti = function(opts) {
        if (typeof window.confetti !== "function") return;
        window.confetti(Object.assign({
            particleCount: 90,
            spread: 70,
            origin: {
                y: .55
            },
            disableForReducedMotion: true,
            colors: [ "#00f5e8", "#00e87a", "#00a2ff", "#ffffff", "#ffcc00" ]
        }, opts || {}));
    };
    var _exportConfettiRunning = false;
    IS.triggerExportConfetti = function() {
        if (typeof window.confetti !== "function" || _exportConfettiRunning) return;
        _exportConfettiRunning = true;
        var end = Date.now() + 900;
        (function frame() {
            window.confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: {
                    x: 0
                },
                disableForReducedMotion: true,
                colors: [ "#00f5e8", "#00e87a", "#00a2ff" ]
            });
            window.confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: {
                    x: 1
                },
                disableForReducedMotion: true,
                colors: [ "#00f5e8", "#00e87a", "#ffcc00" ]
            });
            if (Date.now() < end) requestAnimationFrame(frame); else _exportConfettiRunning = false;
        })();
    };
    function _escToast(s) {
        return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    IS.showToast = function(msg, type, duration, trustedHtml) {
        var toast = document.getElementById("gen-toast");
        if (!toast) return;
        toast.innerHTML = trustedHtml ? msg || "Done!" : _escToast(msg || "Done!");
        toast.className = "gen-toast" + (type ? " toast-" + type : "") + " show";
        clearTimeout(toast._t);
        var ms = duration === 0 ? 0 : duration || 2400;
        if (ms > 0) toast._t = setTimeout(function() {
            toast.classList.remove("show");
        }, ms);
    };
    var STRINGS = {
        en: {
            navIntel: "Identity Intel",
            navGen: "Realistic ID",
            navAnalytics: "Analytics",
            navInstall: "Install",
            headerTitle: "IdentIQ · Identity Intel",
            headerVersion: "v" + (window.APP_CONFIG ? APP_CONFIG.VERSION : "5.9.1") + " Core Processor",
            headerLive: "● LIVE",
            extractedInfo: "EXTRACTED INFORMATION",
            nameAr: "Name (Arabic / Urdu)",
            nameEn: "Name (English)",
            idNumber: "Aqama / ID Number",
            dobH: "DOB (Hijri)",
            dobG: "DOB (Gregorian)",
            natSelect: "Nationality Quick Select",
            inputLabel: "INPUT TERMINAL",
            inputPlaceholder: "Paste Iqama / ID text here…\nData extracts automatically as you type or paste.",
            clearBtn: "✕ Clear",
            hintPaste: "Auto-extracts on paste",
            hintEnter: "Enter = New line",
            hintLang: "Arabic & English supported",
            noData: "No recognisable data found — check input and try again.",
            confirmClearAll: "Clear all analytics data and extraction history? This cannot be undone.",
            genTitle: "Realistic Digital Identity",
            countryLabel: "Select Country",
            cityLabel: "Select City / Region",
            labelCNIC: "CNIC / National ID",
            labelLicense: "License Number",
            labelIssue: "Issue Date",
            labelExpiry: "Expiry Date",
            labelAddress: "Full Address",
            labelDate: "Current Date",
            labelWeekday: "Weekday",
            calBtn: "Calendar",
            genBtn: "Generate New Identity",
            analyticsTitle: "Analytics Dashboard",
            clearData: "✕ Clear Data",
            statDocs: "Documents Processed",
            statSuccess: "Successful Extractions",
            statExports: "Total Exports",
            statRate: "Success Rate",
            recentExports: "Recent Exports",
            extractHistory: "Extraction History",
            noExports: "No exports yet.",
            noHistory: "No history yet.",
            restoreBtn: "Restore",
            privacyText: 'Auto-wipe after <strong id="wipeMinsLabel">5</strong> minutes of inactivity.',
            shortcutsLabel: "Shortcuts:",
            shortcut1: "[Alt+1] Intel",
            shortcut2: "[Alt+2] Generator",
            shortcut3: "[Alt+3] Analytics",
            themeToggle: "Light Mode",
            langToggle: "اردو",
            wipeUntil: "until wipe",
            footerText: "© " + (window.APP_CONFIG ? APP_CONFIG.COPYRIGHT_RANGE : "2024–2026") + " " + (window.APP_CONFIG ? APP_CONFIG.APP_NAME : "IdentIQ") + " · " + (window.APP_CONFIG ? APP_CONFIG.DEVELOPER : "Creative Men") + " · " + (window.APP_CONFIG ? APP_CONFIG.PLATFORM : "Gulf Identity Intelligence Platform") + " v" + (window.APP_CONFIG ? APP_CONFIG.VERSION : "5.9.1"),
            navNames: "Names",
            shortcut4: "[Alt+4] Names",
            namesTitle: "Divine & Prophetic Names",
            namesTabHusna: "Names of Allah",
            namesTabNabi: 'Names of Muhammad <span class="names-saws">ﷺ</span>',
            namesSearchPh: "Name, meaning, number or 2:255…",
            namesScriptNaskh: "Naskh",
            namesScriptNastaliq: "Nastaliq",
            namesCountAll: "{t} names",
            namesCountSome: "Showing {n} of {t}",
            namesEmptyTitle: "No name matches your search.",
            namesEmptyHint: "Try the transliteration, a word from the meaning, the number, or an ayah like 2:255.",
            namesClear: "Clear search",
            namesCopied: "Name copied",
            namesCopyLabel: "Copy {n}",
            namesSpeakLabel: "Listen to {n}",
            namesSpeakUnsupported: "Speech is not supported in this browser",
            namesSpeakNoVoice: "No Arabic voice found on this device",
            namesRef: "Quran {r}",
            copyFailed: "Copy failed",
            namesNoteHusna: "Names of Allah as they appear in the Quran, arranged by first occurrence (surah:ayah).",
            namesNoteNabi: "Names and titles of the Prophet \uFDFA found in the Quran, arranged by first occurrence (surah:ayah)."
        },
        ur: {
            navIntel: "شناختی ڈیٹا",
            navGen: "شناختی کارڈ",
            navAnalytics: "تجزیات",
            navInstall: "انسٹال",
            headerTitle: "انٹرپرائز شناخت پروسیسر",
            headerVersion: "ورژن " + (window.APP_CONFIG ? APP_CONFIG.VERSION : "5.9.1") + " کور پروسیسر",
            headerLive: "● فعال",
            extractedInfo: "نکالی گئی معلومات",
            nameAr: "نام (عربی / اردو)",
            nameEn: "نام (انگریزی)",
            idNumber: "اقامہ / شناختی نمبر",
            dobH: "تاریخ پیدائش (ہجری)",
            dobG: "تاریخ پیدائش (عیسوی)",
            natSelect: "قومیت کا انتخاب",
            inputLabel: "ان پٹ ٹرمینل",
            inputPlaceholder: "اقامہ یا شناختی کارڈ کا متن یہاں پیسٹ کریں…",
            clearBtn: "✕ صاف کریں",
            hintPaste: "پیسٹ پر خودکار نکالے",
            hintEnter: "انٹر = نئی سطر",
            hintLang: "عربی اور انگریزی سپورٹ",
            noData: "کوئی ڈیٹا نہیں ملا — دوبارہ کوشش کریں۔",
            confirmClearAll: "تمام تجزیاتی ڈیٹا اور نکالنے کی تاریخ صاف کریں؟ یہ واپس نہیں ہو سکتا۔",
            genTitle: "شناختی ڈیٹا جنریٹر",
            countryLabel: "ملک منتخب کریں",
            cityLabel: "شہر / علاقہ",
            labelCNIC: "قومی شناختی کارڈ",
            labelLicense: "لائسنس نمبر",
            labelIssue: "جاری تاریخ",
            labelExpiry: "میعاد ختم",
            labelAddress: "مکمل پتہ",
            labelDate: "آج کی تاریخ",
            labelWeekday: "دن",
            calBtn: "کیلنڈر",
            genBtn: "نئی شناخت بنائیں",
            analyticsTitle: "تجزیاتی ڈیش بورڈ",
            clearData: "✕ ڈیٹا صاف کریں",
            statDocs: "دستاویزات پروسیس ہوئیں",
            statSuccess: "کامیاب نکالی",
            statExports: "کل برآمدات",
            statRate: "کامیابی کی شرح",
            recentExports: "حالیہ برآمدات",
            extractHistory: "تاریخچہ",
            noExports: "ابھی تک کوئی برآمد نہیں۔",
            noHistory: "ابھی تک کوئی تاریخچہ نہیں۔",
            restoreBtn: "بحال کریں",
            privacyText: '<strong id="wipeMinsLabel">5</strong> منٹ عدم سرگرمی کے بعد خودکار صفائی۔',
            shortcutsLabel: "شارٹ کٹس:",
            shortcut1: "[Alt+1] ڈیٹا",
            shortcut2: "[Alt+2] جنریٹر",
            shortcut3: "[Alt+3] تجزیات",
            themeToggle: "لائٹ موڈ",
            langToggle: "English",
            wipeUntil: "تک صفائی",
            footerText: "© " + (window.APP_CONFIG ? APP_CONFIG.COPYRIGHT_RANGE : "2024–2026") + " " + (window.APP_CONFIG ? APP_CONFIG.APP_NAME : "IdentIQ") + " · " + (window.APP_CONFIG ? APP_CONFIG.DEVELOPER : "Creative Men") + " · گلف شناخت پلیٹ فارم v" + (window.APP_CONFIG ? APP_CONFIG.VERSION : "5.9.1"),
            navNames: "اسماء",
            shortcut4: "[Alt+4] اسماء",
            namesTitle: "اسمائے الٰہی و نبوی",
            namesTabHusna: "اسماء الحسنیٰ",
            namesTabNabi: 'اسمائے محمد <span class="names-saws">ﷺ</span>',
            namesSearchPh: "نام، مطلب، نمبر یا 2:255…",
            namesScriptNaskh: "نسخ",
            namesScriptNastaliq: "نستعلیق",
            namesCountAll: "کل {t} نام",
            namesCountSome: "{t} میں سے {n} نام",
            namesEmptyTitle: "آپ کی تلاش سے کوئی نام نہیں ملا۔",
            namesEmptyHint: "ٹرانسلٹریشن، مطلب کا کوئی لفظ، نمبر یا آیت (جیسے 2:255) آزما کر دیکھیں۔",
            namesClear: "تلاش صاف کریں",
            namesCopied: "نام کاپی ہو گیا",
            namesCopyLabel: "{n} کاپی کریں",
            namesSpeakLabel: "{n} سنیں",
            namesSpeakUnsupported: "اس براؤزر میں آواز کی سہولت موجود نہیں",
            namesSpeakNoVoice: "اس ڈیوائس پر عربی آواز دستیاب نہیں",
            namesRef: "قرآن {r}",
            copyFailed: "کاپی نہیں ہو سکا",
            namesNoteHusna: "اللہ تعالیٰ کے وہ نام جو قرآن مجید میں آئے ہیں، پہلی بار آنے کی ترتیب سے (سورت:آیت)۔",
            namesNoteNabi: "نبی کریم \uFDFA کے وہ نام اور القاب جو قرآن مجید میں آئے ہیں، پہلی بار آنے کی ترتیب سے (سورت:آیت)۔"
        }
    };
    IS.i18n = {
        _lang: "en",
        get: function(key) {
            return (STRINGS[this._lang] || STRINGS.en)[key] || key;
        },
        setLang: function(lang) {
            this._lang = lang === "ur" ? "ur" : "en";
            try {
                localStorage.setItem("IS_lang_v4", this._lang);
            } catch (e) {}
            this._apply();
            window.dispatchEvent(new CustomEvent("IS_lang_changed"));
        },
        init: function() {
            var prev = this._lang;
            try {
                var s = localStorage.getItem("IS_lang_v4");
                if (s === "en" || s === "ur") this._lang = s;
            } catch (e) {}
            this._apply();
            if (this._lang !== prev) {
                window.dispatchEvent(new CustomEvent("IS_lang_changed"));
            }
        },
        _apply: function() {
            var lang = this._lang;
            document.querySelectorAll("[data-i18n]").forEach(function(el) {
                var key = el.getAttribute("data-i18n");
                var str = (STRINGS[lang] || STRINGS.en)[key];
                if (str === undefined) return;
                if (/<[a-z]/i.test(str)) el.innerHTML = str; else el.textContent = str;
            });
            document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
                var key = el.getAttribute("data-i18n-placeholder");
                var str = (STRINGS[lang] || STRINGS.en)[key];
                if (str !== undefined) el.placeholder = str;
            });
            document.body.classList.toggle("lang-ur", lang === "ur");
            document.documentElement.setAttribute("lang", lang === "ur" ? "ur" : "en");
            if (IS.theme && IS.theme._apply) IS.theme._apply();
        }
    };
    IS.theme = {
        _mode: "dark",
        init: function() {
            try {
                var s = localStorage.getItem("IS_theme_v4");
                if (s) this._mode = s;
            } catch (e) {}
            this._apply();
        },
        toggle: function() {
            this._mode = this._mode === "dark" ? "light" : "dark";
            try {
                localStorage.setItem("IS_theme_v4", this._mode);
            } catch (e) {}
            this._apply();
        },
        _apply: function() {
            document.body.classList.toggle("theme-light", this._mode === "light");
            var btn = document.getElementById("themeToggleBtn");
            if (btn) {
                btn.classList.toggle("active", this._mode === "light");
                var labelEl = btn.querySelector('[data-i18n="themeToggle"]');
                if (labelEl) {
                    labelEl.removeAttribute("data-i18n");
                    var lang = IS.i18n ? IS.i18n._lang : "en";
                    if (this._mode === "light") {
                        labelEl.textContent = lang === "ur" ? "ڈارک موڈ" : "Dark Mode";
                    } else {
                        labelEl.textContent = lang === "ur" ? "لائٹ موڈ" : "Light Mode";
                    }
                }
            }
        }
    };
    IS.HISTORY_MAX = 15;
    IS.EXPORTS_MAX = 5;
    var HKEY = "IS_history_v4";
    IS.history = {
        _max: IS.HISTORY_MAX,
        get: function() {
            try {
                var a = JSON.parse(localStorage.getItem(HKEY) || "[]");
                if (!Array.isArray(a)) return [];
                return a.filter(function(x) {
                    return x && typeof x === "object";
                });
            } catch (e) {
                return [];
            }
        },
        save: function(entry) {
            var list = this.get();
            list.unshift(entry);
            list = list.slice(0, IS.HISTORY_MAX);
            try {
                localStorage.setItem(HKEY, JSON.stringify(list));
            } catch (e) {}
        },
        clear: function() {
            try {
                localStorage.removeItem(HKEY);
            } catch (e) {}
        }
    };
    var AKEY = "IS_analytics_v3";
    IS.analytics = {
        _defaults: function() {
            return {
                totalProcessed: 0,
                successfulExtractions: 0,
                totalExports: 0,
                recentExports: []
            };
        },
        get: function() {
            var d = this._defaults();
            try {
                var p = JSON.parse(localStorage.getItem(AKEY) || "{}");
                if (p && typeof p === "object" && !Array.isArray(p)) Object.assign(d, p);
            } catch (e) {
                d = this._defaults();
            }
            [ "totalProcessed", "successfulExtractions", "totalExports" ].forEach(function(k) {
                var n = Number(d[k]);
                d[k] = isFinite(n) && n >= 0 ? Math.floor(n) : 0;
            });
            d.recentExports = Array.isArray(d.recentExports) ? d.recentExports.filter(function(x) {
                return x && typeof x === "object";
            }) : [];
            return d;
        },
        save: function(d) {
            try {
                localStorage.setItem(AKEY, JSON.stringify(d));
            } catch (e) {}
        },
        increment: function(key) {
            var d = this.get();
            d[key] = (d[key] || 0) + 1;
            this.save(d);
        },
        addExport: function(label) {
            var d = this.get();
            d.totalExports = (d.totalExports || 0) + 1;
            d.recentExports = [ {
                label: label,
                ts: Date.now()
            } ].concat((d.recentExports || []).slice(0, IS.EXPORTS_MAX - 1));
            this.save(d);
        },
        clear: function() {
            try {
                localStorage.removeItem(AKEY);
            } catch (e) {}
        }
    };
})(window.IS);