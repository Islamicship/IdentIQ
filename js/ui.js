'use strict';

window.IS = window.IS || {};

(function (IS) {

    var _sharedAC = null;
    function getAudioContext() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!_sharedAC || _sharedAC.state === 'closed') {
            try { _sharedAC = new AC(); } catch (e) { return null; }
        }
        if (_sharedAC.state === 'suspended') {
            try { _sharedAC.resume(); } catch (e) {}
        }
        return _sharedAC;
    }

    IS.playCopySound = function () {
        try {
            var ctx = getAudioContext();
            if (!ctx) return;
            var osc  = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
    };

    IS.stripHiddenChars = function (text) {
        if (!text) return '';
        return text
            .replace(/[\u200B-\u200F]/g, '')
            .replace(/[\u202A-\u202E]/g, '')
            .replace(/[\u2066-\u2069]/g, '')
            .replace(/[\u206A-\u206F]/g, '')
            .replace(/\uFEFF/g, '')
            .replace(/\u00AD/g, '')
            .replace(/[\uFFF9-\uFFFB]/g, '')
            .replace(/[\uE000-\uF8FF]/g, '')
            .replace(/\u00A0/g, ' ')
            .replace(/\u202F/g, ' ')
            .replace(/\u205F/g, ' ')
            .replace(/\u2028/g, '\n')
            .replace(/\u2029/g, '\n')
            .replace(/\u000C/g, '\n')
            .replace(/\u0085/g, '\n')
            .replace(/[\u2060-\u2064]/g, '')
            .replace(/[\u0007\u001F]/g, ' ')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[^\S\n]+/g, ' ');
    };

    IS.ocrClean = function (text) {
        if (!text) return '';

        var t = IS.stripHiddenChars(text);

        t = t.replace(/\n{3,}/g, '\n\n');
        t = t.replace(/^[\s\-_=|]{3,}$/gm, '');
        t = t.replace(/\b([0-9]{5})\s([0-9]{5})\b/g, '$1$2');
        t = t.replace(/([\u0600-\u06FF])\n([\u0600-\u06FF])/g, '$1 $2');

        if (t.normalize) t = t.normalize('NFC');

        t = t
          .replace(/\uFEFB|\uFEFC/g, '\u0644\u0627')
          .replace(/\uFEF9|\uFEFA/g, '\u0644\u0625')
          .replace(/\uFEF7|\uFEF8/g, '\u0644\u0623')
          .replace(/\uFEF5|\uFEF6/g, '\u0644\u0622')
          .replace(/[\uFE70-\uFE7F]/g, '')
          .replace(/[\uFB50-\uFB51]/g, '\u0671')
          .replace(/[\uFB52-\uFB55]/g, '\u067B');

        t = t.replace(/\t/g, ' ');

        t = t.replace(/([A-Za-z\u0600-\u06FF])-\s*\n\s*([A-Za-z\u0600-\u06FF])/g, '$1$2');

        t = t.replace(/([0-9])O([0-9])/g, '$10$2').replace(/([0-9])O\b/g, '$10').replace(/\bO([0-9])/g, '0$1');
        t = t.replace(/([0-9])l([0-9])/g, '$11$2').replace(/([0-9])l\b/g,  '$11').replace(/\bl([0-9])/g,  '1$1');
        t = t.replace(/([0-9])\|([0-9])/g,'$11$2').replace(/([0-9])\|\b/g, '$11').replace(/\b\|([0-9])/g, '1$1');

        var lines   = t.split('\n');
        var out     = [];
        var lastKey = '';
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i].replace(/^[ \t]+|[ \t]+$/g, '');

            if (/^[\|\~\#\_\^\`\u00AC\*\+\=\<\>\{\}\[\]\\\/]+$/.test(ln)) continue;

            if (/^[\d\.\-\,\s]{1,4}$/.test(ln) && !/[A-Za-z\u0600-\u06FF]/.test(ln)) continue;

            var key = ln.toLowerCase().replace(/\s+/g, ' ');
            if (key && key === lastKey) continue;
            lastKey = key;

            out.push(ln);
        }

        t = out.join('\n').replace(/\n{3,}/g, '\n\n');

        return t.trim();
    };

    IS.ocrDiffCount = function (before, after) {
        if (!before || !after) return 0;
        var removed = Math.max(0, before.split('\n').length - after.split('\n').length);
        var shrink  = Math.max(0, before.replace(/\s/g,'').length - after.replace(/\s/g,'').length);
        return removed + Math.floor(shrink / 4);
    };

    IS.fastCopy = function (text) {
        if (!text) return false;
        IS.playCopySound();
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(function () {
                IS.fastCopy._legacyCopy(text);
            });
            return true;
        }
        IS.fastCopy._legacyCopy(text);
        return true;
    };

    IS.fastCopy._legacyCopy = function (text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
    };

    IS.toLatin = function (s) {
        if (!s) return '';
        s = s.replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x0660; });
        s = s.replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 0x06F0; });
        return s;
    };

    IS.pad = function (n) { return String(n).padStart(2, '0'); };

    IS.escHtml = function (s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    IS.fmtDate = function (d) {
        return IS.pad(d.getDate()) + '-' + IS.pad(d.getMonth() + 1) + '-' + d.getFullYear();
    };

    IS.computeExpiryDate = function (issueDate) {
        var expiry = new Date(issueDate.getFullYear() + 5, issueDate.getMonth(), issueDate.getDate());
        expiry.setDate(expiry.getDate() - 1);
        return expiry;
    };

    IS.COPY_SVG = '<svg viewBox="0 0 20 20" fill="none"><rect x="7" y="7" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 13H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    IS.TICK_SVG = '<svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><path class="tick-path" d="M6.5 11l3.5 3.5 5.5-6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="16" stroke-dashoffset="16"/></svg>';

    function animateCopyBtn(btn) {
        if (btn._copying) return;
        btn._copying = true;
        btn.innerHTML = IS.TICK_SVG;
        btn.classList.add('copied');
        requestAnimationFrame(function () {
            var path = btn.querySelector('.tick-path');
            if (path) { path.style.transition = 'stroke-dashoffset 0.38s cubic-bezier(0.4,0,0.2,1)'; path.style.strokeDashoffset = '0'; }
        });
        setTimeout(function () { btn.innerHTML = IS.COPY_SVG; btn.classList.remove('copied','hover-pending'); btn._copying = false; }, 1100);
    }

    IS.setupCopyBtn = function (btn, getValue) {
        btn.innerHTML = IS.COPY_SVG; btn._copying = false; btn._hoverTimer = null;
        if (!btn.hasAttribute('data-tip')) btn.setAttribute('data-tip', 'Copy');
        function doCopy() {
            var val = getValue(); if (!val) return;
            IS.fastCopy(val); clearTimeout(btn._hoverTimer);
            btn.classList.remove('hover-pending'); animateCopyBtn(btn);
        }
        btn.addEventListener('click', doCopy);
        btn.addEventListener('mouseenter', function () { if (btn._copying) return; btn.classList.add('hover-pending'); btn._hoverTimer = setTimeout(doCopy, 1200); });
        btn.addEventListener('mouseleave', function () { clearTimeout(btn._hoverTimer); btn._hoverTimer = null; if (!btn._copying) btn.classList.remove('hover-pending'); });
    };

    IS.triggerConfetti = function (opts) {
        if (typeof window.confetti !== 'function') return;
        window.confetti(Object.assign({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: ['#00f5e8','#00e87a','#00a2ff','#ffffff','#ffcc00'] }, opts || {}));
    };
    IS.triggerExportConfetti = function () {
        if (typeof window.confetti !== 'function') return;
        var end = Date.now() + 900;
        (function frame() {
            window.confetti({ particleCount: 4, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#00f5e8','#00e87a','#00a2ff'] });
            window.confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00f5e8','#00e87a','#ffcc00'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        })();
    };

    function _escToast(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    IS.showToast = function (msg, type, duration, trustedHtml) {
        var toast = document.getElementById('gen-toast');
        if (!toast) return;
        toast.innerHTML = trustedHtml ? (msg || 'Done!') : _escToast(msg || 'Done!');
        toast.className = 'gen-toast' + (type ? ' toast-' + type : '') + ' show';
        clearTimeout(toast._t);
        var ms = (duration === 0) ? 0 : (duration || 2400);
        if (ms > 0) toast._t = setTimeout(function () { toast.classList.remove('show'); }, ms);
    };

    var STRINGS = {
        en: {
            navIntel:'Identity Intel', navGen:'Realistic ID', navAnalytics:'Analytics', navInstall:'Install',
            headerTitle:'IdentIQ · Identity Intel', headerVersion:'V4.4 Core Processor', headerLive:'● LIVE',
            extractedInfo:'EXTRACTED INFORMATION',
            nameAr:'Name (Arabic / Urdu)', nameEn:'Name (English)', idNumber:'Aqama / ID Number',
            dobH:'DOB (Hijri)', dobG:'DOB (Gregorian)', natSelect:'Nationality Quick Select',
            inputLabel:'INPUT TERMINAL', inputPlaceholder:'Paste Iqama / ID text here…\nData extracts automatically as you type or paste.',
            clearBtn:'✕ Clear', hintPaste:'Auto-extracts on paste', hintEnter:'Enter = New line', hintLang:'Arabic & English supported',
            noData:'No recognisable data found — check input and try again.',
            confirmClearAll:'Clear all analytics data and extraction history? This cannot be undone.',
            genTitle:'Realistic Digital Identity', countryLabel:'Select Country', cityLabel:'Select City / Region',
            labelCNIC:'CNIC / National ID', labelLicense:'License Number', labelIssue:'Issue Date',
            labelExpiry:'Expiry Date', labelAddress:'Full Address', labelDate:'Current Date', labelWeekday:'Weekday',
            calBtn:'Calendar', genBtn:'Generate New Identity',
            analyticsTitle:'Analytics Dashboard', clearData:'✕ Clear Data',
            statDocs:'Documents Processed', statSuccess:'Successful Extractions', statExports:'Total Exports', statRate:'Success Rate',
            recentExports:'Recent Exports', extractHistory:'Extraction History',
            noExports:'No exports yet.', noHistory:'No history yet.', restoreBtn:'Restore',
            privacyText:'Auto-wipe after <strong>5 minutes</strong> of inactivity.',
            shortcutsLabel:'Shortcuts:', shortcut1:'[Alt+1] Intel', shortcut2:'[Alt+2] Generator', shortcut3:'[Alt+3] Analytics',
            themeToggle:'Light Mode', langToggle:'اردو', wipeUntil:'until wipe',
            footerText:'© 2024–2025 IdentIQ · Creative Men · Gulf Identity Intelligence Platform v4.4'
        },
        ur: {
            navIntel:'شناختی ڈیٹا', navGen:'شناختی کارڈ', navAnalytics:'تجزیات', navInstall:'انسٹال',
            headerTitle:'انٹرپرائز شناخت پروسیسر', headerVersion:'ورژن 4.4 کور پروسیسر', headerLive:'● فعال',
            extractedInfo:'نکالی گئی معلومات',
            nameAr:'نام (عربی / اردو)', nameEn:'نام (انگریزی)', idNumber:'اقامہ / شناختی نمبر',
            dobH:'تاریخ پیدائش (ہجری)', dobG:'تاریخ پیدائش (عیسوی)', natSelect:'قومیت کا انتخاب',
            inputLabel:'ان پٹ ٹرمینل', inputPlaceholder:'اقامہ یا شناختی کارڈ کا متن یہاں پیسٹ کریں…',
            clearBtn:'✕ صاف کریں', hintPaste:'پیسٹ پر خودکار نکالے', hintEnter:'انٹر = نئی سطر', hintLang:'عربی اور انگریزی سپورٹ',
            noData:'کوئی ڈیٹا نہیں ملا — دوبارہ کوشش کریں۔',
            confirmClearAll:'تمام تجزیاتی ڈیٹا اور نکالنے کی تاریخ صاف کریں؟ یہ واپس نہیں ہو سکتا۔',
            genTitle:'شناختی ڈیٹا جنریٹر', countryLabel:'ملک منتخب کریں', cityLabel:'شہر / علاقہ',
            labelCNIC:'قومی شناختی کارڈ', labelLicense:'لائسنس نمبر', labelIssue:'جاری تاریخ',
            labelExpiry:'میعاد ختم', labelAddress:'مکمل پتہ', labelDate:'آج کی تاریخ', labelWeekday:'دن',
            calBtn:'کیلنڈر', genBtn:'نئی شناخت بنائیں',
            analyticsTitle:'تجزیاتی ڈیش بورڈ', clearData:'✕ ڈیٹا صاف کریں',
            statDocs:'دستاویزات پروسیس ہوئیں', statSuccess:'کامیاب نکالی', statExports:'کل برآمدات', statRate:'کامیابی کی شرح',
            recentExports:'حالیہ برآمدات', extractHistory:'تاریخچہ',
            noExports:'ابھی تک کوئی برآمد نہیں۔', noHistory:'ابھی تک کوئی تاریخچہ نہیں۔', restoreBtn:'بحال کریں',
            privacyText:'<strong>5 منٹ</strong> عدم سرگرمی کے بعد خودکار صفائی۔',
            shortcutsLabel:'شارٹ کٹس:', shortcut1:'[Alt+1] ڈیٹا', shortcut2:'[Alt+2] جنریٹر', shortcut3:'[Alt+3] تجزیات',
            themeToggle:'لائٹ موڈ', langToggle:'English', wipeUntil:'تک صفائی',
            footerText:'© 2024–2025 IdentIQ · Creative Men · گلف شناخت پلیٹ فارم v4.4'
        }
    };

    IS.i18n = {
        _lang: 'en',
        get: function (key) { return (STRINGS[this._lang] || STRINGS.en)[key] || key; },
        setLang: function (lang) {
            this._lang = (lang === 'ur') ? 'ur' : 'en';
            try { localStorage.setItem('IS_lang_v4', this._lang); } catch(e) {}
            this._apply();
        },
        init: function () {
            var prev = this._lang;
            try { var s = localStorage.getItem('IS_lang_v4'); if (s) this._lang = s; } catch(e) {}
            this._apply();
            if (this._lang !== prev) {
                window.dispatchEvent(new CustomEvent('IS_lang_changed'));
            }
        },
        _apply: function () {
            var lang = this._lang;
            document.querySelectorAll('[data-i18n]').forEach(function (el) {
                var key = el.getAttribute('data-i18n');
                var str = (STRINGS[lang] || STRINGS.en)[key];
                if (str === undefined) return;
                if (/<[a-z]/i.test(str)) el.innerHTML = str; else el.textContent = str;
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
                var key = el.getAttribute('data-i18n-placeholder');
                var str = (STRINGS[lang] || STRINGS.en)[key];
                if (str !== undefined) el.placeholder = str;
            });
            document.body.classList.toggle('lang-ur', lang === 'ur');
            document.documentElement.setAttribute('lang', lang === 'ur' ? 'ur' : 'en');
            if (IS.theme && IS.theme._apply) IS.theme._apply();
        }
    };

    IS.theme = {
        _mode: 'dark',
        init: function () {
            try { var s = localStorage.getItem('IS_theme_v4'); if (s) this._mode = s; } catch(e) {}
            this._apply();
        },
        toggle: function () {
            this._mode = (this._mode === 'dark') ? 'light' : 'dark';
            try { localStorage.setItem('IS_theme_v4', this._mode); } catch(e) {}
            this._apply();
        },
        _apply: function () {
            document.body.classList.toggle('theme-light', this._mode === 'light');
            var btn = document.getElementById('themeToggleBtn');
            if (btn) {
                btn.classList.toggle('active', this._mode === 'light');
                var labelEl = btn.querySelector('[data-i18n="themeToggle"]');
                if (labelEl) {
                    labelEl.removeAttribute('data-i18n');
                    var lang = IS.i18n ? IS.i18n._lang : 'en';
                    if (this._mode === 'light') {
                        labelEl.textContent = (lang === 'ur') ? 'ڈارک موڈ' : 'Dark Mode';
                    } else {
                        labelEl.textContent = (lang === 'ur') ? 'لائٹ موڈ' : 'Light Mode';
                    }
                }
            }
        }
    };

    IS.HISTORY_MAX  = 15;
    IS.EXPORTS_MAX  = 5;

    var HKEY = 'IS_history_v4';
    IS.history = {
        _max: IS.HISTORY_MAX,
        get: function () { try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch(e) { return []; } },
        save: function (entry) {
            var list = this.get(); list.unshift(entry); list = list.slice(0, IS.HISTORY_MAX);
            try { localStorage.setItem(HKEY, JSON.stringify(list)); } catch(e) {}
        },
        clear: function () { try { localStorage.removeItem(HKEY); } catch(e) {} }
    };

    var AKEY = 'IS_analytics_v3';
    IS.analytics = {
        _defaults: function () { return { totalProcessed: 0, successfulExtractions: 0, totalExports: 0, recentExports: [] }; },
        get: function () { try { return Object.assign(this._defaults(), JSON.parse(localStorage.getItem(AKEY) || '{}')); } catch (e) { return this._defaults(); } },
        save: function (d) { try { localStorage.setItem(AKEY, JSON.stringify(d)); } catch (e) {} },
        increment: function (key) { var d = this.get(); d[key] = (d[key] || 0) + 1; this.save(d); },
        addExport: function (label) {
            var d = this.get(); d.totalExports = (d.totalExports || 0) + 1;
            d.recentExports = [{ label: label, ts: Date.now() }].concat((d.recentExports || []).slice(0, IS.EXPORTS_MAX - 1));
            this.save(d);
        },
        clear: function () { try { localStorage.removeItem(AKEY); } catch (e) {} }
    };

})(window.IS);
