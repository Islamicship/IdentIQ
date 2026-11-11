"use strict";

/**
 * Initialises the extractor once the DOM is ready by wiring the input, highlighter, typewriter, voice input and virtual keyboard.
 */
document.addEventListener("DOMContentLoaded", function() {
    var f = {
        card: document.getElementById("dataCard"),
        noDataMsg: document.getElementById("noDataMsg"),
        nameAr: document.getElementById("nameArabic"),
        grpNameAr: document.getElementById("grp-nameAr"),
        nameEn: document.getElementById("nameEnglish"),
        grpNameEn: document.getElementById("grp-nameEn"),
        aqama: document.getElementById("aqamaNumber"),
        grpAqama: document.getElementById("grp-aqama"),
        dobH: document.getElementById("dobHijri"),
        grpDobH: document.getElementById("grp-dobH"),
        dobG: document.getElementById("dobGregorian"),
        grpDobG: document.getElementById("grp-dobG"),
        grpNat: document.getElementById("grp-nat"),
        input: document.getElementById("inputText"),
        highlight: document.getElementById("inputHighlight"),
        clear: document.getElementById("clearAllBtn"),
        header: document.getElementById("reloadBtn"),
        counter: document.getElementById("charCounter"),
        voiceBtn: document.getElementById("voiceBtn"),
        voiceStatus: document.getElementById("voiceStatus"),
        kbdBtn: document.getElementById("kbdBtn"),
        vkbd: document.getElementById("virtualKbd"),
        vkbdClose: document.getElementById("vkbdCloseBtn"),
        vkbdKeys: document.getElementById("vkbdKeys")
    };
    if (!f.input) return;
    f.input.setAttribute("maxlength", "50000");
    /**
     * Converts text to Latin characters through the shared IS helper when available, otherwise returns it unchanged.
     * @param {string} s - Text to convert.
     * @returns {string} The converted text.
     */
    function toLatin(s) { return (window.IS && IS.toLatin) ? IS.toLatin(s) : s; }
    /**
     * Removes invisible and control characters through the shared IS helper when available, otherwise returns the text unchanged.
     * @param {string} s - Text to clean.
     * @returns {string} The cleaned text.
     */
    function stripHidden(s) { return (window.IS && IS.stripHiddenChars) ? IS.stripHiddenChars(s) : s; }
    /**
     * Escapes text for safe HTML output through the shared IS helper, falling back to a plain string conversion.
     * @param {string} s - Text to escape.
     * @returns {string} The escaped text.
     */
    function escHtml(s) {
        return (window.IS && IS.escHtml) ? IS.escHtml(s) : String(s || "");
    }
    /**
     * Formats a moment instance with the given pattern in the English locale so digits stay Latin.
     * @param {moment.Moment} m - Moment instance to format.
     * @param {string} pattern - Moment format pattern.
     * @returns {string} The formatted date.
     */
    function fmt(m, pattern) { return m.clone().locale("en").format(pattern); }
    /**
     * Checks whether the moment-hijri plugin is loaded and usable.
     * @returns {boolean} True when Hijri conversion is available.
     */
    function hijriReady() { return !!(window.moment && moment.fn && moment.fn.iYear); }

    var LIMITS = { SCAN_CHARS: 20000, LINES: 300, DATES: 24, HL_CHARS: 8000, HL_SPANS: 400 };
    var AR_L = "\\u0621-\\u064A\\u066E-\\u06D3\\u06D5\\u06FA-\\u06FF";
    var AR_M = "\\u064B-\\u065F\\u0670\\u06D6-\\u06ED";
    var MARKS_RE = new RegExp("[" + AR_M + "]", "g");

    var RE = {
        id10: /\b[0-9]{10}\b/g,
        date: /[0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}/g,
        enRun: /[A-Za-z][A-Za-z'’.\-]*(?: +[A-Za-z][A-Za-z'’.\-]*)*/g,
        arName: new RegExp("[" + AR_L + "][" + AR_L + AR_M + " ]{7,}"),
        nameLead: /^\s*(?:FULL\s+)?NAME\b\s*/i,
        birthHint: /BIRTH|DOB|B\.?DATE|ميلاد|مولد/i,
        otherDateHint: /EXPIR|VALID|ISSUE|انتهاء|صلاحية|اصدار|إصدار/i
    };

    /**
     * Normalizes Arabic text by removing diacritics, standardizing the word Allah and collapsing whitespace.
     * @param {string} text - Raw Arabic text.
     * @returns {string} The cleaned text, or an empty string for empty input.
     */
    function cleanArabic(text) {
        if (!text) return "";
        var t = String(text).replace(/ﷲ/g, "اللّہ");
        t = t.replace(MARKS_RE, "");
        t = t.replace(/الله/g, "اللّه");
        t = t.replace(/اللہ/g, "اللّہ");
        return t.replace(/\s+/g, " ").trim();
    }
    /**
     * Normalizes an Arabic word for label comparison by removing diacritics and unifying alef, yaa and taa marbuta variants.
     * @param {string} w - Arabic word.
     * @returns {string} The normalized word.
     */
    function normAr(w) {
        return String(w).replace(MARKS_RE, "").replace(/[آأإٱ]/g, "ا")
            .replace(/ى/g, "ي").replace(/ة/g, "ه");
    }
    /**
     * Counts the Latin letters in a string and ignores every other character.
     * @param {string} s - Text to measure.
     * @returns {number} The number of Latin letters.
     */
    function lettersOnly(s) { return s.replace(/[^A-Za-z]/g, "").length; }

    /**
     * Empties the Arabic name, English name, aqama, Hijri date and Gregorian date fields.
     */
    function clearFields() {
        [ f.nameAr, f.nameEn, f.aqama, f.dobH, f.dobG ].forEach(function(el) {
            if (el) el.value = "";
        });
    }
    /**
     * Shows or hides the result card and its field groups depending on whether data was found, and displays the no-data message when input exists without a match.
     * @param {boolean} found - Whether any field was extracted.
     * @param {boolean} hasInput - Whether the user entered any text.
     */
    function showCard(found, hasInput) {
        if (f.noDataMsg) f.noDataMsg.classList.toggle("visible", !found && !!hasInput);
        if (!found) {
            if (f.card) f.card.style.display = "none";
            return;
        }
        if (f.card) f.card.style.display = "block";
        /**
         * Displays a field group only when its value is non-empty.
         * @param {HTMLElement|null} grp - Field group element.
         * @param {*} val - Field value that decides visibility.
         */
        function show(grp, val) {
            if (grp) grp.style.display = val ? "block" : "none";
        }
        show(f.grpNameAr, f.nameAr && f.nameAr.value);
        show(f.grpNameEn, f.nameEn && f.nameEn.value);
        show(f.grpAqama, f.aqama && f.aqama.value);
        show(f.grpDobH, f.dobH && f.dobH.value);
        show(f.grpDobG, f.dobG && f.dobG.value);
        if (f.grpNat) f.grpNat.style.display = "block";
        if (f.nameAr && f.nameAr.value) {
            f.nameAr.style.height = "auto";
            f.nameAr.style.height = f.nameAr.scrollHeight + "px";
        }
    }
    /**
     * Shows or hides the data-complete banner.
     * @param {boolean} complete - True when all required fields are filled.
     */
    function showDataCompleteIndicator(complete) {
        var banner = document.getElementById("dataCompleteBanner");
        if (!banner) return;
        if (complete) {
            banner.classList.add("visible");
        } else {
            banner.classList.remove("visible");
        }
    }
    window.IS = window.IS || {};
    IS.showDataCompleteIndicator = showDataCompleteIndicator;


    var TW = { timer: null, token: 0, lastKey: '', activeEl: null };
    var TW_CARET = '\u258D';
    var TW_ORDER = ['nameEn', 'aqama', 'nameAr', 'dobG', 'dobH'];

    /**
     * Checks whether the user's system requests reduced motion.
     * @returns {boolean} True when reduced motion is preferred.
     */
    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /**
     * Reads the current values of all result fields into a single object.
     * @returns {Object} Values keyed by nameAr, nameEn, aqama, dobH and dobG.
     */
    function readFields() {
        return {
            nameAr: f.nameAr ? f.nameAr.value : '',
            nameEn: f.nameEn ? f.nameEn.value : '',
            aqama:  f.aqama  ? f.aqama.value  : '',
            dobH:   f.dobH   ? f.dobH.value   : '',
            dobG:   f.dobG   ? f.dobG.value   : ''
        };
    }

    /**
     * Writes the given values into the result fields in typing order.
     * @param {Object} v - Values keyed by field name.
     */
    function writeFields(v) {
        TW_ORDER.forEach(function (k) { if (f[k]) f[k].value = v[k] || ''; });
    }

    /**
     * Marks the given field as the active typewriter target and clears the marker from the previous one.
     * @param {HTMLElement|null} el - Field to mark, or null to clear.
     */
    function setActive(el) {
        if (TW.activeEl && TW.activeEl !== el) TW.activeEl.classList.remove('tw-active');
        TW.activeEl = el || null;
        if (el) el.classList.add('tw-active');
    }

    /**
     * Stops any running typewriter animation and clears the active field marker.
     */
    function cancelTypewriter() {
        TW.token++;
        clearTimeout(TW.timer);
        TW.timer = null;
        setActive(null);
    }

    /**
     * Returns a randomized typing delay, with digits typed slower than letters and spaces faster.
     * @param {string} ch - Character about to be typed.
     * @returns {number} Delay in milliseconds.
     */
    function charDelay(ch) {
        var base = /[0-9]/.test(ch) ? 46 : (ch === ' ' ? 24 : 30);
        return base + Math.random() * 26;
    }

    /**
     * Animates the given values into their fields one character at a time and calls back when typing finishes.
     * @param {Object} vals - Values keyed by field name.
     * @param {Function} [onDone] - Callback invoked after typing completes.
     */
    function typeFields(vals, onDone) {
        cancelTypewriter();
        var myToken = TW.token;

        var jobs = TW_ORDER
            .filter(function (k) { return vals[k] && f[k]; })
            .map(function (k) { return { el: f[k], text: vals[k] }; });

        jobs.forEach(function (j) { j.el.value = ''; });

        var ji = 0, ci = 0;

        /**
         * Types the next character of the current field and schedules itself until every field is complete.
         */
        function step() {
            if (myToken !== TW.token) return;

            if (ji >= jobs.length) {
                setActive(null);
                writeFields(vals);
                if (onDone) onDone();
                return;
            }

            var job = jobs[ji];
            setActive(job.el);
            ci++;
            var done = ci >= job.text.length;
            job.el.value = job.text.slice(0, ci) + (done ? '' : TW_CARET);

            if (done) {
                ji++; ci = 0;
                TW.timer = setTimeout(step, 170);
            } else {
                TW.timer = setTimeout(step, charDelay(job.text.charAt(ci - 1)));
            }
        }
        step();
    }

    window.IS = window.IS || {};
    IS.cancelTypewriter = cancelTypewriter;

    /**
     * Finds regex matches in a string and appends them as highlight spans up to the span limit, optionally filtered by an accept callback.
     * @param {RegExp} re - Pattern to search for.
     * @param {string} str - Text to scan.
     * @param {string} cls - CSS class for the matched spans.
     * @param {Array<Object>} spans - Accumulator that receives the spans.
     * @param {Function} [accept] - Optional filter that approves a match.
     */
    function scanSpans(re, str, cls, spans, accept) {
        var r = new RegExp(re.source, "g"), m;
        while (spans.length < LIMITS.HL_SPANS && (m = r.exec(str))) {
            if (!m[0].length) { r.lastIndex++; continue; }
            if (!accept || accept(m[0])) spans.push({ s: m.index, e: m.index + m[0].length, cls: cls });
        }
    }
    /**
     * Builds the highlighted HTML for the input text by marking IDs, dates and names while escaping everything else.
     * @param {string} input - Raw input text.
     * @returns {string} HTML string with mark elements.
     */
    function buildHighlightHtml(input) {
        var all = typeof input === "string" ? input : "";
        var text = all.slice(0, LIMITS.HL_CHARS), rest = all.slice(LIMITS.HL_CHARS);
        var latin = toLatin(text);
        if (latin.length !== text.length) latin = text;
        var spans = [];
        scanSpans(RE.id10, latin, "hl-id", spans);
        scanSpans(RE.date, latin, "hl-date", spans);
        scanSpans(RE.arName, text, "hl-name-ar", spans);
        scanSpans(RE.enRun, text, "hl-name-en", spans, function (x) {
            return lettersOnly(x) >= 4 && (x.indexOf(" ") !== -1 || x.length >= 6);
        });
        spans.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
        var html = "", cur = 0, lastEnd = 0;
        spans.forEach(function (sp) {
            if (sp.s < lastEnd) return;
            if (sp.s > cur) html += escHtml(text.slice(cur, sp.s));
            html += '<mark class="' + sp.cls + '">' + escHtml(text.slice(sp.s, sp.e)) + "</mark>";
            cur = lastEnd = sp.e;
        });
        return html + escHtml(text.slice(cur)) + escHtml(rest) + "\n";
    }
    var _lastHlText = null;
    /**
     * Renders the highlight layer for the given text and skips the update when the text has not changed.
     * @param {string} text - Current input text.
     */
    function buildHighlight(text) {
        if (!f.highlight) return;
        if (text === _lastHlText) return;
        _lastHlText = text;
        f.highlight.innerHTML = buildHighlightHtml(text);
    }
    /**
     * Keeps the highlight layer's scroll position aligned with the input box.
     */
    function syncHighlightScroll() {
        if (f.highlight) {
            f.highlight.scrollTop = f.input.scrollTop;
            f.highlight.scrollLeft = f.input.scrollLeft;
        }
    }
    var EN_LABELS = [ "NATIONALITY", "NATIONAL", "EXPIRED", "EXPIRY", "EXPIRATION", "IQAMA", "IQAMA NUMBER", "RESIDENCE", "RESIDENT", "PERMIT", "KINGDOM", "KINGDOM OF", "SAUDI ARABIA", "UNITED ARAB EMIRATES", "DATE OF BIRTH", "DATE OF ISSUE", "DATE OF EXPIRY", "VALID", "VALID THRU", "VALID UNTIL", "VALID FROM", "IDENTITY", "IDENTITY CARD", "IDENTITY NUMBER", "CIVIL", "CIVIL ID", "CIVIL NUMBER", "PASSPORT", "PASSPORT NUMBER", "SPONSOR", "PROFESSION", "OCCUPATION", "MALE", "FEMALE", "GENDER", "SEX", "ISSUED", "ISSUE DATE", "ISSUE NO", "CARD NUMBER", "CARD NO", "REPUBLIC", "ISLAMIC", "MINISTRY", "INTERIOR", "AFGHANISTAN", "BANGLADESH", "BAHRAIN", "INDIA", "KUWAIT", "NEPAL", "OMAN", "PAKISTAN", "QATAR", "PLACE OF BIRTH", "PLACE OF ISSUE", "EMIRATES ID", "EMIRATES", "LABOUR", "LABOR", "BLOOD GROUP", "BLOOD TYPE", "NAME", "FULL NAME", "ADDRESS", "EMPLOYER", "SIGNATURE" ];
    var EN_LABEL_RE = new RegExp("\\b(?:" + EN_LABELS.join("|") + ")\\b", "i");
    var AR_LABELS = {};
    [ "الاسم", "الجنسية", "رقم", "الإقامة", "الهوية", "المملكة", "العربية", "السعودية", "وزارة", "الداخلية", "تاريخ", "الميلاد", "الانتهاء", "الإصدار", "المهنة", "الديانة", "الكفيل", "جواز", "السفر", "هجري", "ميلادي", "بنجلاديش", "نيبال", "الهند", "باكستان", "أفغانستان" ].forEach(function (w) { AR_LABELS[normAr(w)] = 1; });

    /**
     * Extracts a cleaned Arabic name from a line, ignoring label words and rejecting names that are too short.
     * @param {string} raw - Single line of input text.
     * @returns {string} The Arabic name, or an empty string if none qualifies.
     */
    function arabicNameFromLine(raw) {
        var m = raw.match(RE.arName);
        if (!m) return "";
        var name = cleanArabic(m[0]).split(" ").filter(function (t) { return t && !AR_LABELS[normAr(t)]; }).join(" ");
        return name.replace(/ /g, "").length >= 6 ? name : "";
    }
    /**
     * Extracts the best English name candidate from a line together with a confidence score.
     * @param {string} raw - Single line of input text.
     * @returns {{text: string, score: number}|null} The candidate with its score, or null if none qualifies.
     */
    function englishNameFromLine(raw) {
        var tail = raw.split(/[:：]/).pop().replace(RE.nameLead, "");
        var runs = tail.match(RE.enRun);
        if (!runs) return null;
        var best = "";
        runs.forEach(function (r) { if (lettersOnly(r) > lettersOnly(best)) best = r; });
        var cand = best.replace(/\s+/g, " ").replace(/^[\s.'’\-]+|[\s.'’\-]+$/g, "").toUpperCase();
        if (lettersOnly(cand) < 4 || EN_LABEL_RE.test(cand)) return null;
        var labeled = /^\s*(?:FULL\s+)?NAME\b/i.test(raw) || /\bNAME\b[^:]*[:：]/i.test(raw);
        return { text: cand, score: (labeled ? 2 : 0) + (cand.indexOf(" ") !== -1 ? 1 : 0) };
    }
    /**
     * Parses a date string as Gregorian or, when allowed, Hijri based on its year range.
     * @param {string} ds - Date string such as 1990/05/12 or 12-05-1990.
     * @param {boolean} hijriOk - Whether Hijri parsing is available.
     * @returns {{m: moment.Moment, hijri: boolean}|null} The parsed date, or null if it is invalid.
     */
    function parseDate(ds, hijriOk) {
        var std = ds.replace(/-/g, "/"), p = std.split("/");
        var yrFirst = p[0].length === 4;
        var yr = parseInt(yrFirst ? p[0] : p[2], 10);
        var m;
        if (yr >= 1900) {
            m = moment(std, yrFirst ? "YYYY/M/D" : "D/M/YYYY", "en", true);
            return m.isValid() ? { m: m, hijri: false } : null;
        }
        if (yr >= 1300 && yr <= 1500 && hijriOk) {
            m = moment(std, yrFirst ? "iYYYY/iM/iD" : "iD/iM/iYYYY", "en", true);
            return m.isValid() ? { m: m, hijri: true } : null;
        }
        return null;
    }
    /**
     * Chooses the most likely date of birth by preferring birth-hinted dates, excluding future dates and taking the earliest.
     * @param {Array<Object>} c - Candidate dates with hint values.
     * @param {Date} now - Current date used to exclude future dates.
     * @returns {Object|null} The chosen candidate, or null if none is usable.
     */
    function pickDob(c, now) {
        var pool = c.filter(function (x) { return x.hint === 2; });
        if (!pool.length) pool = c.filter(function (x) { return x.hint >= 0; });
        if (!pool.length) pool = c;
        pool = pool.filter(function (x) { return !x.m.isAfter(now); });
        if (!pool.length) return null;
        pool.sort(function (a, b) { return a.m.valueOf() - b.m.valueOf(); });
        return pool[0];
    }
    /**
     * Extracts the Arabic name, English name, aqama number and birth dates from raw text without ever throwing.
     * @param {string} input - Raw text to scan.
     * @returns {{found: boolean, values: Object}} Whether anything was found and the extracted values.
     */
    function extractFields(input) {
        var out = { nameAr: "", nameEn: "", aqama: "", dobH: "", dobG: "" };
        var text = typeof input === "string" ? input : "";
        if (text.normalize) { try { text = text.normalize("NFKC"); } catch (e) {} }
        text = text.slice(0, LIMITS.SCAN_CHARS);
        if (!text.trim()) return { found: false, values: out };

        var hijriOk = hijriReady(), now = new Date();
        var ids = [], en = [], ar = [], dates = [];

        text.split(/\r?\n/).slice(0, LIMITS.LINES).forEach(function (line) {
            var raw = line.trim();
            if (!raw) return;
            var clean = toLatin(raw);

            var idm = clean.match(RE.id10);
            if (idm) ids.push.apply(ids, idm);

            var e = englishNameFromLine(raw);
            if (e) en.push(e);

            if (clean.replace(/\D/g, "").length < 8) {
                var a = arabicNameFromLine(raw);
                if (a) ar.push(a);
            }

            if (window.moment && dates.length < LIMITS.DATES) {
                var hint = RE.birthHint.test(raw) ? 2 : (RE.otherDateHint.test(raw) ? -1 : 0);
                (clean.match(RE.date) || []).slice(0, 6).forEach(function (ds) {
                    var d = parseDate(ds, hijriOk);
                    if (d && dates.length < LIMITS.DATES) { d.hint = hint; dates.push(d); }
                });
            }
        });

        for (var i = 0; i < ids.length; i++) { if (/^[12]/.test(ids[i])) { out.aqama = ids[i]; break; } }
        if (!out.aqama && ids.length) out.aqama = ids[0];

        var bestE = null;
        en.forEach(function (c) { if (!bestE || c.score > bestE.score) bestE = c; });
        if (bestE) out.nameEn = bestE.text;

        for (var j = 0; j < ar.length; j++) { if (ar[j].indexOf(" ") !== -1) { out.nameAr = ar[j]; break; } }
        if (!out.nameAr && ar.length) out.nameAr = ar[0];

        var best = pickDob(dates, now);
        if (best) {
            var G = "DD/MM/YYYY", H = "iYYYY/iMM/iDD";
            out.dobG = fmt(best.m, G);
            out.dobH = hijriOk ? fmt(best.m, H) : "";
            dates.forEach(function (o) {
                if (o.hijri === best.hijri || Math.abs(o.m.diff(best.m, "days")) > 2) return;
                if (o.hijri) out.dobH = fmt(o.m, H); else out.dobG = fmt(o.m, G);
            });
        }
        return { found: !!(out.nameAr || out.nameEn || out.aqama || out.dobG || out.dobH), values: out };
    }

    /**
     * Runs extraction on the input and updates the fields, card, history, analytics and indicators, starting the typewriter animation for new data.
     */
    function extract() {
        var rawInput = stripHidden(f.input.value);
        var text = rawInput.trim();

        buildHighlight(rawInput);
        cancelTypewriter();

        if (!text) {
            clearFields();
            extract._lastSnap = "";
            extract._lastText = "";
            TW.lastKey = "";
            var emptyAgeBadge = document.getElementById("ageBadge");
            if (emptyAgeBadge) emptyAgeBadge.style.display = "none";
            showDataCompleteIndicator(false);
            showCard(false, false);
            return;
        }

        if (text !== extract._lastText) {
            extract._lastText = text;
            if (window.IS && IS.analytics) IS.analytics.increment("totalProcessed");
        }

        var res = extractFields(text);
        var found = res.found;
        clearFields();
        writeFields(res.values);

        if (!found) {
            extract._lastSnap = "";
            TW.lastKey = "";
            var nfBadge = document.getElementById("ageBadge");
            if (nfBadge) nfBadge.style.display = "none";
            showDataCompleteIndicator(false);
            showCard(false, true);
            return;
        }

        if (f.dobG && f.dobG.value && f.dobH && !f.dobH.value && window.moment && moment.fn.iYear) {
            try {
                var _gd = moment(f.dobG.value, "DD/MM/YYYY", "en", true);
                if (_gd.isValid()) f.dobH.value = fmt(_gd, "iYYYY/iMM/iDD");
            } catch (e) {}
        }

        var snap = [
            f.nameAr ? f.nameAr.value : "", f.nameEn ? f.nameEn.value : "",
            f.aqama  ? f.aqama.value  : "", f.dobH   ? f.dobH.value   : "",
            f.dobG   ? f.dobG.value   : ""
        ].join("|");
        if (snap !== extract._lastSnap) {
            extract._lastSnap = snap;
            if (window.IS && IS.analytics) IS.analytics.increment("successfulExtractions");
            if (window.IS && IS.history) IS.history.save({
                nameAr: f.nameAr ? f.nameAr.value : "",
                nameEn: f.nameEn ? f.nameEn.value : "",
                aqama:  f.aqama  ? f.aqama.value  : "",
                dobH:   f.dobH   ? f.dobH.value   : "",
                dobG:   f.dobG   ? f.dobG.value   : "",
                ts: Date.now()
            });
            if (window.IS && IS.triggerConfetti) IS.triggerConfetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
            if (window._robotReact) window._robotReact("extraction", found);
        }

        var vals = readFields();
        var key  = JSON.stringify(vals);
        var allComplete = !!(
            vals.nameAr.trim() && vals.nameEn.trim() && vals.aqama.trim() &&
            (vals.dobG.trim() || vals.dobH.trim())
        );

        showCard(true, true);

        /**
         * Writes the final values, updates the age badge and shows the data-complete indicator.
         */
        var finish = function () {
            writeFields(vals);
            updateAgeBadge(vals.dobG);
            showDataCompleteIndicator(allComplete);
        };

        if (key === TW.lastKey || prefersReducedMotion()) {
            TW.lastKey = key;
            finish();
        } else {
            TW.lastKey = key;
            showDataCompleteIndicator(false);
            updateAgeBadge("");
            typeFields(vals, finish);
        }
    }
    /**
     * Shows the age calculated from a DD/MM/YYYY birth date, or hides the badge when the date is empty or implausible.
     * @param {string} ddmmyyyy - Birth date in DD/MM/YYYY format.
     */
    function updateAgeBadge(ddmmyyyy) {
        var ageBadge = document.getElementById("ageBadge");
        if (!ageBadge) return;
        if (!ddmmyyyy) {
            ageBadge.style.display = "none";
            return;
        }
        var parts = ddmmyyyy.split("/");
        var birthDate = null;
        if (parts.length === 3) {
            var dd = parseInt(parts[0], 10), mm = parseInt(parts[1], 10) - 1, yyyy = parseInt(parts[2], 10);
            if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) birthDate = new Date(yyyy, mm, dd);
        }
        if (birthDate && !isNaN(birthDate.getTime())) {
            var now = new Date;
            var age = now.getFullYear() - birthDate.getFullYear();
            var mDiff = now.getMonth() - birthDate.getMonth();
            if (mDiff < 0 || mDiff === 0 && now.getDate() < birthDate.getDate()) age--;
            if (age >= 0 && age < 130) {
                ageBadge.textContent = age + (age === 1 ? " year old" : " years old");
                ageBadge.style.display = "inline-flex";
            } else {
                ageBadge.style.display = "none";
            }
        } else {
            ageBadge.style.display = "none";
        }
    }
    IS.updateAgeBadge = updateAgeBadge;
    var _debounceTimer = null;
    var HIDDEN_RE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u206A-\u206F\uFEFF\u00AD\uFFF9-\uFFFB\u2060-\u2064\u0007\u001F\u00A0\u202F\u205F\u2028\u2029\u000C\u0085\r]/;
    f.input.addEventListener("input", function(e) {
        var value = f.input.value, next = value, ocrFixes = 0, isPaste = !!(e && e.inputType === "insertFromPaste");
        if (isPaste && window.IS && IS.ocrClean) {
            var oc = IS.ocrClean(value);
            if (value.trim().length >= 5 && oc.length < 5) oc = value;
            if (oc !== value) {
                ocrFixes = IS.ocrDiffCount ? IS.ocrDiffCount(value, oc) : 1;
                next = oc;
            }
        }
        if (HIDDEN_RE.test(next)) next = stripHidden(next);
        if (next !== value) {
            var sel = f.input.selectionStart;
            f.input.value = next;
            var caret = isPaste ? next.length : Math.max(0, Math.min(next.length, sel - (value.length - next.length)));
            f.input.selectionStart = f.input.selectionEnd = caret;
            if (ocrFixes > 0 && IS.showToast) IS.showToast("OCR cleaned (" + ocrFixes + " fix" + (ocrFixes === 1 ? "" : "es") + ")");
        }
        buildHighlight(f.input.value);
        if (f.counter) {
            var len = f.input.value.length;
            f.counter.textContent = len > 0 ? len + " chars" : "";
        }
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(extract, 500);
    });
    f.input.addEventListener("scroll", syncHighlightScroll);
    if (window.ResizeObserver && f.highlight) {
        var _roTimer = null;
        var _ro = new ResizeObserver(function() {
            clearTimeout(_roTimer);
            _roTimer = setTimeout(syncHighlightScroll, 10);
        });
        _ro.observe(f.input);
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    var isListening = false;
    var voiceLangSelect = document.getElementById("voiceLangSelect");
    if (f.clear) {
        f.clear.addEventListener("click", function() {
            f.input.value = "";
            extract._lastSnap = "";
            extract._lastText = "";
            cancelTypewriter();
            TW.lastKey = "";
            clearTimeout(_debounceTimer);
            buildHighlight("");
            if (f.counter) f.counter.textContent = "";
            var ageBadge = document.getElementById("ageBadge");
            if (ageBadge) ageBadge.style.display = "none";
            showDataCompleteIndicator(false);
            if (isListening && recognition) {
                try {
                    recognition.stop();
                } catch (e) {}
                stopVoice();
            }
            extract();
        });
    }
    if (f.header) {
        f.header.addEventListener("click", function() {
            if (f.input.value.trim() && !confirm("Reload the app? Entered data will be lost.")) return;
            location.reload();
        });
    }
    /**
     * Connects each result field's copy button to the shared copy helper.
     */
    function setupExtractorCopyBtns() {
        var pairs = [ {
            btn: f.nameAr && f.nameAr.parentElement && f.nameAr.parentElement.querySelector(".copy-btn"),
            /**
             * Returns the current Arabic name value.
             * @returns {string} The field value, or an empty string if the field is missing.
             */
            get: function() {
                return f.nameAr ? f.nameAr.value : "";
            }
        }, {
            btn: f.nameEn && f.nameEn.parentElement && f.nameEn.parentElement.querySelector(".copy-btn"),
            /**
             * Returns the current English name value.
             * @returns {string} The field value, or an empty string if the field is missing.
             */
            get: function() {
                return f.nameEn ? f.nameEn.value : "";
            }
        }, {
            btn: f.aqama && f.aqama.parentElement && f.aqama.parentElement.querySelector(".copy-btn"),
            /**
             * Returns the current aqama number value.
             * @returns {string} The field value, or an empty string if the field is missing.
             */
            get: function() {
                return f.aqama ? f.aqama.value : "";
            }
        }, {
            btn: f.dobH && f.dobH.parentElement && f.dobH.parentElement.querySelector(".copy-btn"),
            /**
             * Returns the current Hijri date value.
             * @returns {string} The field value, or an empty string if the field is missing.
             */
            get: function() {
                return f.dobH ? f.dobH.value : "";
            }
        }, {
            btn: f.dobG && f.dobG.parentElement && f.dobG.parentElement.querySelector(".copy-btn"),
            /**
             * Returns the current Gregorian date value.
             * @returns {string} The field value, or an empty string if the field is missing.
             */
            get: function() {
                return f.dobG ? f.dobG.value : "";
            }
        } ];
        pairs.forEach(function(p) {
            if (p.btn) IS.setupCopyBtn(p.btn, p.get);
        });
    }
    setupExtractorCopyBtns();
    document.querySelectorAll(".nat-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var showingAr = btn.classList.contains("active-ar");
            if (showingAr) {
                var arVal = btn.getAttribute("data-ar");
                IS.fastCopy(arVal);
                IS.showToast("Copied: " + IS.escHtml(arVal));
                btn.textContent = btn.getAttribute("data-en");
                btn.classList.remove("active-ar");
            } else {
                var enVal = btn.getAttribute("data-en");
                IS.fastCopy(enVal);
                IS.showToast("Copied: " + IS.escHtml(enVal));
                btn.textContent = btn.getAttribute("data-ar");
                btn.classList.add("active-ar");
            }
        });
    });
    if (f.voiceBtn && SpeechRecognition) {
        recognition = new SpeechRecognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        var _voiceBaseText = "";
        var _voiceInsertAt = 0;
        var _voiceFinalCommitted = false;
        /**
         * Initialises voice capture state, records the insert position and shows the listening indicators.
         */
        recognition.onstart = function() {
            isListening = true;
            _voiceFinalCommitted = false;
            _voiceBaseText = f.input.value;
            _voiceInsertAt = f.input.selectionStart != null ? f.input.selectionStart : f.input.value.length;
            if (f.voiceBtn) f.voiceBtn.classList.add("listening");
            var selLang = voiceLangSelect ? voiceLangSelect.options[voiceLangSelect.selectedIndex] : null;
            var langLabel = selLang ? selLang.text : voiceLangSelect ? voiceLangSelect.value : "en-US";
            if (f.voiceStatus) f.voiceStatus.textContent = "🎙 " + langLabel;
            var tBox = document.querySelector(".terminal-box");
            if (tBox) tBox.classList.add("mic-active");
            injectVoiceWave();
        };
        /**
         * Merges the recognised transcript into the input at the saved position and commits once the result is final.
         * @param {SpeechRecognitionEvent} e - Speech recognition result event.
         */
        recognition.onresult = function(e) {
            if (_voiceFinalCommitted) return;
            var transcript = "";
            var isFinal = false;
            for (var i = 0; i < e.results.length; i++) {
                transcript += e.results[i][0].transcript;
                if (e.results[i].isFinal) isFinal = true;
            }
            transcript = IS.stripHiddenChars(transcript);
            var before = _voiceBaseText.substring(0, _voiceInsertAt);
            var after = _voiceBaseText.substring(_voiceInsertAt);
            var sep = before.length > 0 && !/\s$/.test(before) ? " " : "";
            f.input.value = before + sep + transcript + after;
            f.input.selectionStart = f.input.selectionEnd = _voiceInsertAt + sep.length + transcript.length;
            f.input.dispatchEvent(new Event("input", {
                bubbles: true
            }));
            if (isFinal) _voiceFinalCommitted = true;
        };
        /**
         * Stops voice input, shows a temporary microphone error message and clears it after two seconds.
         */
        recognition.onerror = function() {
            stopVoice();
            if (f.voiceStatus) f.voiceStatus.textContent = "⚠ Mic error";
            setTimeout(function() {
                if (f.voiceStatus) f.voiceStatus.textContent = "";
            }, 2e3);
        };
        /**
         * Stops voice input when recognition ends.
         */
        recognition.onend = function() {
            stopVoice();
        };
        f.voiceBtn.addEventListener("click", function() {
            if (isListening) {
                recognition.stop();
                stopVoice();
                return;
            }
            var selectedLang = voiceLangSelect ? voiceLangSelect.value : "en-US";
            recognition.lang = selectedLang;
            try {
                recognition.start();
            } catch (e) {}
        });
    } else if (f.voiceBtn) {
        f.voiceBtn.style.display = "none";
        var voiceCombo = document.getElementById("voiceCombo");
        if (voiceCombo) voiceCombo.style.display = "none";
    }
    if (f.dobG) {
        f.dobG.addEventListener("input", function() {
            var raw = f.dobG.value;
            var digits = raw.replace(/[^0-9]/g, "");
            var formatted = "";
            for (var i = 0; i < digits.length && i < 8; i++) {
                if (i === 2 || i === 4) formatted += "/";
                formatted += digits[i];
            }
            if (f.dobG.value !== formatted) {
                f.dobG.value = formatted;
                f.dobG.selectionStart = f.dobG.selectionEnd = formatted.length;
            }
            if (formatted.length === 10 && window.moment && moment.fn.iYear) {
                try {
                    var gDate = moment(formatted, "DD/MM/YYYY", "en", true);
                    if (gDate.isValid()) {
                        var hFormatted = fmt(gDate, "iYYYY/iMM/iDD");
                        if (f.dobH) {
                            f.dobH.value = hFormatted;
                            if (f.grpDobH) f.grpDobH.style.display = "block";
                        }
                        updateAgeBadge(formatted);
                        IS.showToast("✅ Gregorian → Hijri: " + hFormatted);
                    } else {
                        if (f.dobH) f.dobH.value = "";
                    }
                } catch (err) {
                    if (f.dobH) f.dobH.value = "";
                }
            } else if (formatted.length < 10) {
                if (f.dobH) f.dobH.value = "";
                updateAgeBadge("");
            }
        });
        f.dobG.addEventListener("keydown", function(e) {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            var allowed = [ "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Home", "End" ];
            if (allowed.indexOf(e.key) !== -1) return;
            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
        });
    }
    /**
     * Resets the voice input state and removes the listening indicators and waveform.
     */
    function stopVoice() {
        isListening = false;
        if (f.voiceBtn) f.voiceBtn.classList.remove("listening");
        if (f.voiceStatus) f.voiceStatus.textContent = "";
        var tBox = document.querySelector(".terminal-box");
        if (tBox) tBox.classList.remove("mic-active");
        removeVoiceWave();
    }
    /**
     * Adds the animated voice waveform next to the voice status once.
     */
    function injectVoiceWave() {
        if (document.getElementById("voiceWave")) return;
        var w = document.createElement("div");
        w.id = "voiceWave";
        w.className = "voice-wave";
        w.innerHTML = '<span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span>';
        if (f.voiceStatus) f.voiceStatus.parentElement.appendChild(w);
    }
    /**
     * Removes the voice waveform element if present.
     */
    function removeVoiceWave() {
        var w = document.getElementById("voiceWave");
        if (w) w.remove();
    }
    var vkbdLang = "en";
    var vkbdShift = false;
    var shiftLock = false;
    var lastShiftTap = 0;
    var KBD_EN = [ [ "1", "2", "3", "4", "5", "6", "7", "8", "9", "0" ], [ "q", "w", "e", "r", "t", "y", "u", "i", "o", "p" ], [ "a", "s", "d", "f", "g", "h", "j", "k", "l" ], [ "z", "x", "c", "v", "b", "n", "m" ] ];
    var KBD_AR_ROWS = [
        [ "٩", "٨", "٧", "٦", "٥", "٤", "٣", "٢", "١", "٠" ],
        [ "ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د", "ذ" ],
        [ "ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط" ],
        [ "ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "أ", "إ", "آ" ]
    ];
    /**
     * Attaches a press handler that fires once per tap across mouse, touch and pen while preventing the input from losing focus.
     * @param {HTMLElement} btn - Button to bind.
     * @param {Function} handler - Callback invoked with the button.
     */
    function bindPress(btn, handler) {
        btn.style.touchAction = "manipulation";
        btn.addEventListener("mousedown", function(e) { e.preventDefault(); });
        if (window.PointerEvent) {
            btn.addEventListener("pointerdown", function(e) {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                e.preventDefault();
                handler(btn);
            });
        } else {
            btn.addEventListener("click", function(e) { e.preventDefault(); handler(btn); });
        }
    }
    /**
     * Rebuilds the virtual keyboard keys for the active language with a short fade transition.
     */
    function renderVkbd() {
        if (!f.vkbdKeys) return;
        var isAr = vkbdLang === "ar";
        var rows = isAr ? KBD_AR_ROWS : KBD_EN;
        f.vkbdKeys.classList.add("vkbd-switching");
        setTimeout(function() {
            f.vkbdKeys.innerHTML = "";
            f.vkbdKeys.className = "vkbd-keys" + (isAr ? " rtl-layout" : "");
            rows.forEach(function(row) {
                var rowDiv = document.createElement("div");
                rowDiv.className = "vkbd-row";
                row.forEach(function(key) {
                    var ch = key, label = key;
                    var btn = document.createElement("button");
                    btn.className = "vkbd-key" + (isAr ? " vkbd-key-ar" : "");
                    btn.setAttribute("data-key", ch);
                    btn.setAttribute("type", "button");
                    btn.setAttribute("aria-label", ch);
                    if (isAr) {
                        btn.innerHTML = '<span class="vkbd-ar-main">' + label + "</span>";
                    } else {
                        var enUpper = vkbdShift || shiftLock;
                        btn.textContent = enUpper ? label.toUpperCase() : label;
                    }
                    /**
                     * Inserts the key's character, uppercased when shift is active, and resets one-shot shift.
                     */
                    function pressKey() {
                        var out;
                        if (!isAr && (vkbdShift || shiftLock)) {
                            out = ch.toUpperCase();
                        } else {
                            out = ch;
                        }
                        insertVkbdChar(out);
                        ripple(btn);
                        if (vkbdShift && !shiftLock) {
                            vkbdShift = false;
                            renderVkbd();
                        }
                    }
                    bindPress(btn, pressKey);
                    rowDiv.appendChild(btn);
                });
                f.vkbdKeys.appendChild(rowDiv);
            });
            var ctrlRow = document.createElement("div");
            ctrlRow.className = "vkbd-row vkbd-ctrl-row";
            if (!isAr) {
                var shiftBtn = makeCtrlKey(shiftLock ? "⇪ LOCK" : vkbdShift ? "⇧ ON" : "⇧", "vkbd-key vkbd-shift" + (shiftLock ? " vkbd-shift-lock" : vkbdShift ? " vkbd-shift-on" : ""), function() {
                    var now = Date.now();
                    if (now - lastShiftTap < 400) {
                        shiftLock = !shiftLock;
                        vkbdShift = false;
                    } else if (!shiftLock) {
                        vkbdShift = !vkbdShift;
                    }
                    lastShiftTap = now;
                    renderVkbd();
                });
                ctrlRow.appendChild(shiftBtn);
            }
            ctrlRow.appendChild(makeCtrlKey("Space", "vkbd-key vkbd-space", function() {
                insertVkbdChar(" ");
                ripple(ctrlRow);
            }));
            ctrlRow.appendChild(makeCtrlKey("⌫", "vkbd-key vkbd-bksp", doBackspace));
            ctrlRow.appendChild(makeCtrlKey("↵", "vkbd-key vkbd-enter", function() {
                insertVkbdChar("\n");
            }));
            f.vkbdKeys.appendChild(ctrlRow);
            f.vkbdKeys.style.opacity = "0";
            requestAnimationFrame(function() {
                f.vkbdKeys.style.transition = "opacity 0.15s ease";
                f.vkbdKeys.style.opacity = "1";
                setTimeout(function() {
                    f.vkbdKeys.style.transition = "";
                }, 160);
            });
        }, 120);
    }
    /**
     * Creates a control key button wired to the given handler.
     * @param {string} label - Text shown on the key.
     * @param {string} cls - CSS class names for the key.
     * @param {Function} handler - Callback invoked when the key is pressed.
     * @returns {HTMLButtonElement} The created button.
     */
    function makeCtrlKey(label, cls, handler) {
        var btn = document.createElement("button");
        btn.className = cls;
        btn.textContent = label;
        btn.setAttribute("type", "button");
        bindPress(btn, handler);
        return btn;
    }
    /**
     * Briefly applies a pressed-state class to give tap feedback.
     * @param {HTMLElement} btn - Element to animate.
     */
    function ripple(btn) {
        btn.classList.add("vkbd-press");
        setTimeout(function() {
            btn.classList.remove("vkbd-press");
        }, 140);
    }
    /**
     * Inserts a character at the input's caret or selection and fires an input event.
     * @param {string} ch - Character to insert.
     */
    function insertVkbdChar(ch) {
        if (!f.input) return;
        f.input.focus();
        var s = f.input.selectionStart, e = f.input.selectionEnd, cur = f.input.value;
        f.input.value = cur.substring(0, s) + ch + cur.substring(e);
        f.input.selectionStart = f.input.selectionEnd = s + ch.length;
        f.input.dispatchEvent(new Event("input", {
            bubbles: true
        }));
    }
    /**
     * Deletes the selected text or the character before the caret and fires an input event.
     */
    function doBackspace() {
        if (!f.input) return;
        f.input.focus();
        var s = f.input.selectionStart, e = f.input.selectionEnd, v = f.input.value;
        if (s !== e) {
            f.input.value = v.substring(0, s) + v.substring(e);
            f.input.selectionStart = f.input.selectionEnd = s;
        } else if (s > 0) {
            f.input.value = v.substring(0, s - 1) + v.substring(s);
            f.input.selectionStart = f.input.selectionEnd = s - 1;
        }
        f.input.dispatchEvent(new Event("input", {
            bubbles: true
        }));
    }
    if (f.vkbd) {
        f.vkbd.querySelectorAll(".vkbd-lang").forEach(function(tab) {
            tab.addEventListener("click", function() {
                f.vkbd.querySelectorAll(".vkbd-lang").forEach(function(t) {
                    t.classList.remove("active");
                    t.setAttribute("aria-pressed", "false");
                });
                tab.classList.add("active");
                tab.setAttribute("aria-pressed", "true");
                vkbdLang = tab.getAttribute("data-lang");
                vkbdShift = false;
                shiftLock = false;
                renderVkbd();
            });
        });
    }
    if (f.kbdBtn && f.vkbd) {
        f.kbdBtn.addEventListener("click", function() {
            var open = f.vkbd.style.display !== "none";
            if (open) {
                f.vkbd.style.opacity = "0";
                f.vkbd.style.transform = "translateY(12px)";
                setTimeout(function() {
                    f.vkbd.style.display = "none";
                }, 200);
            } else {
                f.vkbd.style.display = "block";
                f.vkbd.style.opacity = "0";
                f.vkbd.style.transform = "translateY(12px)";
                renderVkbd();
                f.input.focus();
                requestAnimationFrame(function() {
                    f.vkbd.style.transition = "opacity 0.2s ease, transform 0.2s ease";
                    f.vkbd.style.opacity = "1";
                    f.vkbd.style.transform = "translateY(0)";
                });
            }
        });
    }
    if (f.vkbdClose && f.vkbd) {
        f.vkbdClose.addEventListener("click", function() {
            f.vkbd.style.opacity = "0";
            f.vkbd.style.transform = "translateY(12px)";
            setTimeout(function() {
                f.vkbd.style.display = "none";
            }, 200);
        });
    }
});