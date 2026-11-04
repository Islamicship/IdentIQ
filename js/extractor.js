"use strict";

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
    function cleanArabic(text) {
        if (!text) return "";
        var t = text;
        t = t.replace(/\uFDF2/g, "اللّہ");
        t = t.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, "");
        t = t.replace(/\u0627\u0644\u0644\u0647/g, "اللّه");
        t = t.replace(/\u0627\u0644\u0644\u06C1/g, "اللّہ");
        return t.trim();
    }
    function clearFields() {
        [ f.nameAr, f.nameEn, f.aqama, f.dobH, f.dobG ].forEach(function(el) {
            if (el) el.value = "";
        });
    }
    function showCard(found, hasInput) {
        if (f.noDataMsg) f.noDataMsg.classList.toggle("visible", !found && !!hasInput);
        if (!found) {
            if (f.card) f.card.style.display = "none";
            return;
        }
        if (f.card) f.card.style.display = "block";
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
    function showDataCompleteIndicator(complete) {
        var banner = document.getElementById("dataCompleteBanner");
        if (!banner) return;
        if (complete) {
            banner.classList.add("visible");
        } else {
            banner.classList.remove("visible");
        }
    }


    var TW = { timer: null, token: 0, lastKey: '', activeEl: null };
    var TW_CARET = '\u258D';                                   // ▍
    var TW_ORDER = ['nameEn', 'aqama', 'nameAr', 'dobG', 'dobH']; // typing ka tarteeb

    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function readFields() {
        return {
            nameAr: f.nameAr ? f.nameAr.value : '',
            nameEn: f.nameEn ? f.nameEn.value : '',
            aqama:  f.aqama  ? f.aqama.value  : '',
            dobH:   f.dobH   ? f.dobH.value   : '',
            dobG:   f.dobG   ? f.dobG.value   : ''
        };
    }

    function writeFields(v) {
        TW_ORDER.forEach(function (k) { if (f[k]) f[k].value = v[k] || ''; });
    }

    function setActive(el) {
        if (TW.activeEl && TW.activeEl !== el) TW.activeEl.classList.remove('tw-active');
        TW.activeEl = el || null;
        if (el) el.classList.add('tw-active');
    }

    function cancelTypewriter() {
        TW.token++;
        clearTimeout(TW.timer);
        TW.timer = null;
        setActive(null);
    }

    function charDelay(ch) {
        var base = /[0-9]/.test(ch) ? 46 : (ch === ' ' ? 24 : 30);
        return base + Math.random() * 26;
    }

    function typeFields(vals, onDone) {
        cancelTypewriter();
        var myToken = TW.token;

        var jobs = TW_ORDER
            .filter(function (k) { return vals[k] && f[k]; })
            .map(function (k) { return { el: f[k], text: vals[k] }; });

        jobs.forEach(function (j) { j.el.value = ''; });

        var ji = 0, ci = 0;

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

    function buildHighlight(text) {
        if (!f.highlight) return;
        var latinText = IS.toLatin(text);
        var spans = [];
        var idRe = /\b([0-9]{10})\b/g;
        var m;
        while ((m = idRe.exec(latinText)) !== null) {
            spans.push({
                s: m.index,
                e: m.index + m[0].length,
                cls: "hl-id"
            });
        }
        var dateRe = /([0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})|([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/g;
        while ((m = dateRe.exec(latinText)) !== null) {
            spans.push({
                s: m.index,
                e: m.index + m[0].length,
                cls: "hl-date"
            });
        }
        var arRe = /[\u0600-\u06FF][\u0600-\u06FF ]{7,}/g;
        while ((m = arRe.exec(text)) !== null) {
            spans.push({
                s: m.index,
                e: m.index + m[0].length,
                cls: "hl-name-ar"
            });
        }
        var enRe = /[A-Za-z][A-Za-z ]*[A-Za-z]/g;
        while ((m = enRe.exec(text)) !== null) {
            var matched = m[0];
            var nonSpaceCount = matched.replace(/ /g, "").length;
            if (nonSpaceCount >= 4 && (matched.indexOf(" ") !== -1 || matched.length >= 6)) {
                spans.push({
                    s: m.index,
                    e: m.index + matched.length,
                    cls: "hl-name-en"
                });
            }
        }
        spans.sort(function(a, b) {
            return a.s - b.s || b.e - a.e;
        });
        var result = "";
        var cursor = 0;
        var lastEnd = 0;
        spans.forEach(function(sp) {
            if (sp.s < lastEnd) return;
            if (sp.s > cursor) result += IS.escHtml(text.slice(cursor, sp.s));
            result += '<mark class="' + sp.cls + '">' + IS.escHtml(text.slice(sp.s, sp.e)) + "</mark>";
            cursor = sp.e;
            lastEnd = sp.e;
        });
        if (cursor < text.length) result += IS.escHtml(text.slice(cursor));
        result += "\n";
        f.highlight.innerHTML = result;
    }
    function syncHighlightScroll() {
        if (f.highlight) {
            f.highlight.scrollTop = f.input.scrollTop;
            f.highlight.scrollLeft = f.input.scrollLeft;
        }
    }
    var EN_LABEL_BLACKLIST = [ "NATIONALITY", "NATIONAL", "EXPIRED", "EXPIRY", "EXPIRATION", "IQAMA", "IQAMA NUMBER", "RESIDENCE", "RESIDENT", "PERMIT", "KINGDOM", "KINGDOM OF", "SAUDI ARABIA", "UNITED ARAB EMIRATES", "DATE OF BIRTH", "DATE OF ISSUE", "DATE OF EXPIRY", "VALID", "VALID THRU", "VALID UNTIL", "VALID FROM", "IDENTITY", "IDENTITY CARD", "IDENTITY NUMBER", "CIVIL", "CIVIL ID", "CIVIL NUMBER", "PASSPORT", "PASSPORT NUMBER", "SPONSOR", "PROFESSION", "OCCUPATION", "MALE", "FEMALE", "GENDER", "SEX", "ISSUED", "ISSUE DATE", "ISSUE NO", "CARD NUMBER", "CARD NO", "REPUBLIC", "ISLAMIC", "MINISTRY", "INTERIOR", "AFGHANISTAN", "BANGLADESH", "BAHRAIN", "INDIA", "KUWAIT", "NEPAL", "OMAN", "PAKISTAN", "QATAR", "PLACE OF BIRTH", "PLACE OF ISSUE", "EMIRATES ID", "EMIRATES", "LABOUR", "LABOR", "BLOOD GROUP", "BLOOD TYPE" ];
    var EN_LABEL_RE = new RegExp("\\b(" + EN_LABEL_BLACKLIST.concat([ "NAME", "FULL NAME", "ADDRESS", "EMPLOYER", "SIGNATURE" ]).join("|") + ")\\b", "i");
    var AR_BLACKLIST = [ "الجنسية", "بنجلاديش", "نيبال", "الهند", "باكستان" ];
    function extract() {
        var rawInput = IS.stripHiddenChars(f.input.value);
        var text = rawInput.trim();

        buildHighlight(rawInput);
        cancelTypewriter();                      // purani chalti typing band

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

        clearFields();
        var lines = text.split("\n");
        var found = false;

        lines.forEach(function (line) {
            var raw = line.trim();
            if (!raw) return;
            var clean = IS.toLatin(raw);

            if (!f.aqama.value) {
                var mA = clean.match(/\b([0-9]{10})\b/);
                if (mA) { f.aqama.value = mA[1]; found = true; }
            }

            if (!f.nameEn.value) {
                var tail = raw.split(/[:：]/).pop();
                var mE = tail.match(/[A-Za-z][A-Za-z ]*[A-Za-z]/);
                if (mE) {
                    var candidate = mE[0].trim().toUpperCase();
                    if (candidate.replace(/ /g, "").length >= 4 && !EN_LABEL_RE.test(candidate)) {
                        f.nameEn.value = candidate; found = true;
                    }
                }
            }

            if (!f.nameAr.value) {
                var mAr = raw.match(/[\u0600-\u06FF][\u0600-\u06FF ]{7,}/);
                var isBlacklisted = AR_BLACKLIST.some(function (w) { return raw.indexOf(w) !== -1; });
                var tooManyDigits = clean.replace(/\D/g, "").length >= 8;
                if (mAr && !isBlacklisted && !tooManyDigits) {
                    f.nameAr.value = cleanArabic(mAr[0]); found = true;
                }
            }

            var datePattern = /([0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})|([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/g;
            var dates = clean.match(datePattern);
            if (dates && window.moment) {
                var gregorianCandidates = [];
                dates.forEach(function (ds) {
                    var std     = ds.replace(/-/g, "/");
                    var parts   = std.split("/");
                    var yrFirst = parts[0].length === 4;
                    var yr      = yrFirst ? parseInt(parts[0]) : parseInt(parts[2]);
                    var fmtG    = yrFirst ? "YYYY/M/D" : "D/M/YYYY";
                    var fmtH    = yrFirst ? "iYYYY/iM/iD" : "iD/iM/iYYYY";
                    if (yr >= 1900) {
                        var g = moment(std, fmtG, true);
                        if (!g.isValid()) return;
                        gregorianCandidates.push({ g: g, yr: yr });
                        found = true;
                    } else if (yr >= 1300 && yr <= 1500) {
                        var h = moment(std, fmtH, true);
                        if (!h.isValid()) return;
                        if (!f.dobH.value) f.dobH.value = h.format("iYYYY/iMM/iDD");
                        if (!f.dobG.value) f.dobG.value = h.format("DD/MM/YYYY");
                        found = true;
                    }
                });
                if (gregorianCandidates.length > 0 && !f.dobG.value) {
                    gregorianCandidates.sort(function (a, b) { return a.yr - b.yr; });
                    var dobCandidate = gregorianCandidates[0].g;
                    f.dobG.value = dobCandidate.format("DD/MM/YYYY");
                    if (!f.dobH.value && moment.fn.iYear) f.dobH.value = dobCandidate.format("iYYYY/iMM/iDD");
                }
            }
        });

        /* ───────── Result handling ───────── */
        if (!found) {
            extract._lastSnap = "";
            TW.lastKey = "";
            var nfBadge = document.getElementById("ageBadge");
            if (nfBadge) nfBadge.style.display = "none";
            showDataCompleteIndicator(false);
            showCard(false, true);
            return;
        }

        // Hijri fallback (Gregorian se)
        if (f.dobG && f.dobG.value && f.dobH && !f.dobH.value && window.moment && moment.fn.iYear) {
            try {
                var _gd = moment(f.dobG.value, "DD/MM/YYYY", true);
                if (_gd.isValid()) f.dobH.value = _gd.format("iYYYY/iMM/iDD");
            } catch (e) {}
        }

        // History / analytics / confetti (sirf jab data change ho)
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
            IS.triggerConfetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
            if (window._robotReact) window._robotReact("extraction", found);
        }

        var vals = readFields();
        var key  = JSON.stringify(vals);
        var allComplete = !!(
            vals.nameAr.trim() && vals.nameEn.trim() && vals.aqama.trim() &&
            (vals.dobG.trim() || vals.dobH.trim())
        );

        // Card ka layout FINAL values se banao
        showCard(true, true);

        var finish = function () {
            writeFields(vals);
            updateAgeBadge(vals.dobG);
            showDataCompleteIndicator(allComplete);
        };

        if (key === TW.lastKey || prefersReducedMotion()) {
            TW.lastKey = key;
            finish();                            // wahi data: foran dikhao
        } else {
            TW.lastKey = key;
            showDataCompleteIndicator(false);
            updateAgeBadge("");
            typeFields(vals, finish);            // typewriter
        }
    }
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
    var _debounceTimer = null;
    f.input.addEventListener("input", function(e) {
        if (e.inputType === "insertFromPaste" && IS.ocrClean) {
            var before = f.input.value;
            var cleaned = IS.ocrClean(before);
            if (before.trim().length >= 5 && cleaned.length < 5) cleaned = IS.stripHiddenChars(before);
            if (cleaned !== before) {
                var diff = IS.ocrDiffCount ? IS.ocrDiffCount(before, cleaned) : 1;
                f.input.value = cleaned;
                f.input.selectionStart = f.input.selectionEnd = cleaned.length;
                if (diff > 0) IS.showToast("OCR cleaned (" + diff + " fix" + (diff === 1 ? "" : "es") + ")");
            }
        }
        var raw = f.input.value;
        var hasHidden = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u206A-\u206F\uFEFF\u00AD\uFFF9-\uFFFB\u2060-\u2064\u0007\u001F\u00A0\u202F\u205F\u2028\u2029\u000C\u0085\r]/.test(raw);
        if (hasHidden && IS.stripHiddenChars) {
            var cleaned = IS.stripHiddenChars(raw);
            if (cleaned !== raw) {
                var sel = f.input.selectionStart;
                f.input.value = cleaned;
                var removed = raw.length - cleaned.length;
                f.input.selectionStart = f.input.selectionEnd = Math.max(0, sel - removed);
            }
        }
        buildHighlight(f.input.value);
        if (f.counter) {
            var len = f.input.value.length;
            f.counter.textContent = len > 0 ? len + " chars" : "";
        }
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(function() {
            extract();
        }, 500);
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
    function setupExtractorCopyBtns() {
        var pairs = [ {
            btn: f.nameAr && f.nameAr.parentElement && f.nameAr.parentElement.querySelector(".copy-btn"),
            get: function() {
                return f.nameAr ? f.nameAr.value : "";
            }
        }, {
            btn: f.nameEn && f.nameEn.parentElement && f.nameEn.parentElement.querySelector(".copy-btn"),
            get: function() {
                return f.nameEn ? f.nameEn.value : "";
            }
        }, {
            btn: f.aqama && f.aqama.parentElement && f.aqama.parentElement.querySelector(".copy-btn"),
            get: function() {
                return f.aqama ? f.aqama.value : "";
            }
        }, {
            btn: f.dobH && f.dobH.parentElement && f.dobH.parentElement.querySelector(".copy-btn"),
            get: function() {
                return f.dobH ? f.dobH.value : "";
            }
        }, {
            btn: f.dobG && f.dobG.parentElement && f.dobG.parentElement.querySelector(".copy-btn"),
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
        recognition.onerror = function() {
            stopVoice();
            if (f.voiceStatus) f.voiceStatus.textContent = "⚠ Mic error";
            setTimeout(function() {
                if (f.voiceStatus) f.voiceStatus.textContent = "";
            }, 2e3);
        };
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
                    var gDate = moment(formatted, "DD/MM/YYYY", true);
                    if (gDate.isValid()) {
                        var hFormatted = gDate.format("iYYYY/iMM/iDD");
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
    function stopVoice() {
        isListening = false;
        if (f.voiceBtn) f.voiceBtn.classList.remove("listening");
        if (f.voiceStatus) f.voiceStatus.textContent = "";
        var tBox = document.querySelector(".terminal-box");
        if (tBox) tBox.classList.remove("mic-active");
        removeVoiceWave();
    }
    function injectVoiceWave() {
        if (document.getElementById("voiceWave")) return;
        var w = document.createElement("div");
        w.id = "voiceWave";
        w.className = "voice-wave";
        w.innerHTML = '<span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span><span class="vw-bar"></span>';
        if (f.voiceStatus) f.voiceStatus.parentElement.appendChild(w);
    }
    function removeVoiceWave() {
        var w = document.getElementById("voiceWave");
        if (w) w.remove();
    }
    var vkbdLang = "en";
    var vkbdShift = false;
    var shiftLock = false;
    var lastShiftTap = 0;
    var KBD_EN = [ [ "1", "2", "3", "4", "5", "6", "7", "8", "9", "0" ], [ "q", "w", "e", "r", "t", "y", "u", "i", "o", "p" ], [ "a", "s", "d", "f", "g", "h", "j", "k", "l" ], [ "z", "x", "c", "v", "b", "n", "m" ] ];
    var KBD_AR_ROWS = [ [ {
        ch: "٩",
        label: "٩"
    }, {
        ch: "٨",
        label: "٨"
    }, {
        ch: "٧",
        label: "٧"
    }, {
        ch: "٦",
        label: "٦"
    }, {
        ch: "٥",
        label: "٥"
    }, {
        ch: "٤",
        label: "٤"
    }, {
        ch: "٣",
        label: "٣"
    }, {
        ch: "٢",
        label: "٢"
    }, {
        ch: "١",
        label: "١"
    }, {
        ch: "٠",
        label: "٠"
    } ], [ {
        ch: "ض",
        label: "ض"
    }, {
        ch: "ص",
        label: "ص"
    }, {
        ch: "ث",
        label: "ث"
    }, {
        ch: "ق",
        label: "ق"
    }, {
        ch: "ف",
        label: "ف"
    }, {
        ch: "غ",
        label: "غ"
    }, {
        ch: "ع",
        label: "ع"
    }, {
        ch: "ه",
        label: "ه"
    }, {
        ch: "خ",
        label: "خ"
    }, {
        ch: "ح",
        label: "ح"
    }, {
        ch: "ج",
        label: "ج"
    }, {
        ch: "د",
        label: "د"
    }, {
        ch: "ذ",
        label: "ذ"
    } ], [ {
        ch: "ش",
        label: "ش"
    }, {
        ch: "س",
        label: "س"
    }, {
        ch: "ي",
        label: "ي"
    }, {
        ch: "ب",
        label: "ب"
    }, {
        ch: "ل",
        label: "ل"
    }, {
        ch: "ا",
        label: "ا"
    }, {
        ch: "ت",
        label: "ت"
    }, {
        ch: "ن",
        label: "ن"
    }, {
        ch: "م",
        label: "م"
    }, {
        ch: "ك",
        label: "ك"
    }, {
        ch: "ط",
        label: "ط"
    } ], [ {
        ch: "ئ",
        label: "ئ"
    }, {
        ch: "ء",
        label: "ء"
    }, {
        ch: "ؤ",
        label: "ؤ"
    }, {
        ch: "ر",
        label: "ر"
    }, {
        ch: "لا",
        label: "لا"
    }, {
        ch: "ى",
        label: "ى"
    }, {
        ch: "ة",
        label: "ة"
    }, {
        ch: "و",
        label: "و"
    }, {
        ch: "ز",
        label: "ز"
    }, {
        ch: "ظ",
        label: "ظ"
    }, {
        ch: "أ",
        label: "أ"
    }, {
        ch: "إ",
        label: "إ"
    }, {
        ch: "آ",
        label: "آ"
    } ] ];
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
                    var ch = typeof key === "object" ? key.ch : key;
                    var label = typeof key === "object" ? key.label : key;
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
                    btn.addEventListener("mousedown", function(e) {
                        e.preventDefault();
                        pressKey();
                    });
                    btn.addEventListener("touchstart", function(e) {
                        e.preventDefault();
                        pressKey();
                    }, {
                        passive: false
                    });
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
    function makeCtrlKey(label, cls, handler) {
        var btn = document.createElement("button");
        btn.className = cls;
        btn.textContent = label;
        btn.setAttribute("type", "button");
        btn.addEventListener("mousedown", function(e) {
            e.preventDefault();
            handler(btn);
        });
        btn.addEventListener("touchstart", function(e) {
            e.preventDefault();
            handler(btn);
        }, {
            passive: false
        });
        return btn;
    }
    function ripple(btn) {
        btn.classList.add("vkbd-press");
        setTimeout(function() {
            btn.classList.remove("vkbd-press");
        }, 140);
    }
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