'use strict';

document.addEventListener('DOMContentLoaded', function () {

    IS.i18n.init();
    IS.theme.init();

    var tabs    = document.querySelectorAll('.nav-tab[data-target]');
    var sections = document.querySelectorAll('.app-section');

    var wipeTimer  = null;
    var wipeStart  = null;
    var wipeEl     = document.getElementById('wipeCountdown');
    var _wipeWarnShown = false;

    var _analyticsTimer;
    function switchTab(targetId) {
        tabs.forEach(function (t) {
            var isMe = t.getAttribute('data-target') === targetId;
            t.classList.toggle('active', isMe);
            t.setAttribute('aria-selected', isMe ? 'true' : 'false');
        });
        sections.forEach(function (s) {
            var isMe = s.id === targetId;
            s.style.display = isMe ? '' : 'none';
            s.classList.toggle('active-section', isMe);
        });
        if (targetId === 'tab-analytics') {
            clearTimeout(_analyticsTimer);
            _analyticsTimer = setTimeout(renderAnalytics, 80);
        }

        window._activeTab = targetId;
        if (wipeTimer && targetId !== 'tab-extractor') {
            clearInterval(wipeTimer);
            wipeTimer = null;
            if (wipeEl) wipeEl.textContent = '';
        }
        var fab = document.getElementById('genFab');
        if (fab) {
            if (targetId === 'tab-generator') fab.classList.add('fab-visible');
            else fab.classList.remove('fab-visible');
            fab.setAttribute('aria-hidden', targetId !== 'tab-generator' ? 'true' : 'false');
        }
        try { history.replaceState(null, '', '#' + targetId); } catch(e) {}
    }

    window.switchTab = switchTab;

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var target = tab.getAttribute('data-target');
            if (target) switchTab(target);
        });
    });

    var hash = (location.hash || '').replace('#', '');
    if (hash === 'settings') {
        switchTab('tab-extractor');
        setTimeout(function () { if (window.IS && IS.settings) IS.settings.open(); }, 300);
    } else if (hash && document.getElementById(hash)) {
        switchTab(hash);
    } else {
        switchTab('tab-extractor');
    }

    document.addEventListener('keydown', function (e) {
        if (e.altKey) {
            if (e.key === '1') { e.preventDefault(); switchTab('tab-extractor'); }
            if (e.key === '2') { e.preventDefault(); switchTab('tab-generator'); }
            if (e.key === '3') { e.preventDefault(); switchTab('tab-analytics'); }

            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                if (window._robotToggleChat) window._robotToggleChat();
            }
            return;
        }
        if (e.key === 'Escape') {
            var calPopup = document.getElementById('calPopup');
            if (calPopup && calPopup.classList.contains('open')) {
                calPopup.classList.remove('open');
                document.removeEventListener('click', window._calOutsideClick || function(){});
                e.preventDefault();
                return;
            }
            var vkbd = document.getElementById('virtualKbd');
            if (vkbd && vkbd.style.display !== 'none') {
                vkbd.style.opacity = '0';
                vkbd.style.transform = 'translateY(12px)';
                setTimeout(function () { vkbd.style.display = 'none'; }, 200);
                e.preventDefault();
            }
        }
    });

    var langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.addEventListener('click', function () {
            var newLang = IS.i18n._lang === 'en' ? 'ur' : 'en';
            IS.i18n.setLang(newLang);
        });
    }

    var themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            IS.theme.toggle();
        });
    }

    function renderAnalytics() {

        var data       = (window.IS && IS.analytics) ? IS.analytics.get() : {};
        var total      = data.totalProcessed      || 0;
        var successes  = data.successfulExtractions || 0;
        var totalExports = data.totalExports         || 0;
        var rate       = total > 0 ? Math.round((successes / total) * 100) : 0;

        var statTotal   = document.getElementById('statTotal');
        var statSuccess = document.getElementById('statSuccess');
        var statExports = document.getElementById('statExports');
        var statRate    = document.getElementById('statRate');
        if (statTotal)   animateCount(statTotal,   0, total);
        if (statSuccess) animateCount(statSuccess, 0, successes);
        if (statExports) animateCount(statExports, 0, totalExports);
        if (statRate)    animateCount(statRate,     0, rate, '%');

        var expList = document.getElementById('recentExportsList');
        if (expList) {
            if (!data.recentExports || !data.recentExports.length) {
                expList.innerHTML = '<li class="recent-empty" data-i18n="noExports">' + IS.i18n.get('noExports') + '</li>';
            } else {
                expList.innerHTML = data.recentExports.map(function (ex) {
                    var d = new Date(ex.ts);
                    var label = ex.label.replace(/_/g, ' ').replace(/\d{13}$/, '').trim();
                    return '<li class="recent-item">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                        '<span class="recent-label-text">' + IS.escHtml(label) + '</span>' +
                        '<span class="recent-time">' + formatRelTime(d) + '</span>' +
                    '</li>';
                }).join('');
            }
        }

        var histList = document.getElementById('extractionHistoryList');
        if (histList) {
            var histData = (window.IS && IS.history) ? IS.history.get() : [];
            if (!histData || !histData.length) {
                histList.innerHTML = '<li class="recent-empty" data-i18n="noHistory">' + IS.i18n.get('noHistory') + '</li>';
            } else {
                histList.innerHTML = histData.map(function (entry, idx) {
                    var nameLabel = entry.nameAr || entry.nameEn || '—';
                    var idLabel   = entry.aqama  || '—';
                    var dateLabel = entry.dobG   || entry.dobH || '—';
                    var ts        = new Date(entry.ts);
                    return '<li class="recent-item history-item" data-idx="' + idx + '">' +
                        '<div class="history-meta">' +
                            '<span class="history-name">' + IS.escHtml(nameLabel) + '</span>' +
                            '<span class="history-id">' + IS.escHtml(idLabel) + '</span>' +
                            '<span class="history-dob">' + IS.escHtml(dateLabel) + '</span>' +
                        '</div>' +
                        '<div class="history-actions">' +
                            '<span class="recent-time">' + formatRelTime(ts) + '</span>' +
                            '<button class="history-restore-btn" data-idx="' + idx + '" aria-label="Restore this extraction">' +
                                IS.i18n.get('restoreBtn') +
                            '</button>' +
                            '<button class="history-delete-btn" data-idx="' + idx + '" aria-label="Delete this entry" title="Delete">✕</button>' +
                        '</div>' +
                    '</li>';
                }).join('');

                histList.querySelectorAll('.history-restore-btn').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var idx  = parseInt(btn.getAttribute('data-idx'), 10);
                        var hist = IS.history.get();
                        if (!hist[idx]) return;
                        restoreExtraction(hist[idx]);
                        switchTab('tab-extractor');
                        IS.showToast('Extraction restored ✓');
                    });
                });

                histList.querySelectorAll('.history-delete-btn').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var idx  = parseInt(btn.getAttribute('data-idx'), 10);
                        var hist = IS.history.get();
                        if (isNaN(idx) || idx < 0 || idx >= hist.length) return;
                        hist.splice(idx, 1);
                        try { localStorage.setItem('IS_history_v4', JSON.stringify(hist)); } catch(e) {}
                        renderAnalytics();
                    });
                });
            }
        }
    }

    function restoreExtraction(entry) {
        var nameAr = document.getElementById('nameArabic');
        var nameEn = document.getElementById('nameEnglish');
        var aqama  = document.getElementById('aqamaNumber');
        var dobH   = document.getElementById('dobHijri');
        var dobG   = document.getElementById('dobGregorian');
        if (nameAr) nameAr.value = entry.nameAr || '';
        if (nameEn) nameEn.value = entry.nameEn || '';
        if (aqama)  aqama.value  = entry.aqama  || '';
        if (dobH)   dobH.value   = entry.dobH   || '';
        if (dobG)   dobG.value   = entry.dobG   || '';

        var card    = document.getElementById('dataCard');
        var noData  = document.getElementById('noDataMsg');
        if (noData) noData.classList.remove('visible');
        if (card) {
            card.style.display = 'block';
            ['grp-nameAr','grp-nameEn','grp-aqama','grp-dobH','grp-dobG','grp-nat'].forEach(function (id) {
                var g = document.getElementById(id);
                if (g) {
                    var hasVal = true;
                    if (id === 'grp-nameAr' && !entry.nameAr) hasVal = false;
                    if (id === 'grp-nameEn' && !entry.nameEn) hasVal = false;
                    if (id === 'grp-aqama'  && !entry.aqama)  hasVal = false;
                    if (id === 'grp-dobH'   && !entry.dobH)   hasVal = false;
                    if (id === 'grp-dobG'   && !entry.dobG)   hasVal = false;
                    if (id === 'grp-nat' && !entry.aqama && !entry.nameAr) hasVal = false;
                    g.style.display = hasVal ? 'block' : 'none';
                }
            });
        }

        var ageBadge = document.getElementById('ageBadge');
        if (ageBadge) {
            var dobGVal = entry.dobG || '';
            var parts   = dobGVal.split('/');
            if (parts.length === 3) {
                var dd = parseInt(parts[0], 10), mm = parseInt(parts[1], 10) - 1, yyyy = parseInt(parts[2], 10);
                var birthDate = new Date(yyyy, mm, dd);
                if (!isNaN(birthDate.getTime())) {
                    var now = new Date();
                    var age = now.getFullYear() - birthDate.getFullYear();
                    var mDiff = now.getMonth() - birthDate.getMonth();
                    if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) age--;
                    if (age >= 0 && age < 130) {
                        ageBadge.textContent = age + (age === 1 ? ' year old' : ' years old');
                        ageBadge.style.display = 'inline-flex';
                    } else {
                        ageBadge.style.display = 'none';
                    }
                } else {
                    ageBadge.style.display = 'none';
                }
            } else {
                ageBadge.style.display = 'none';
            }
        }

        var completeBanner = document.getElementById('dataCompleteBanner');
        if (completeBanner) {
            var allComplete = !!(entry.nameAr && entry.nameEn && entry.aqama &&
                                 (entry.dobG || entry.dobH));
            completeBanner.classList.toggle('visible', allComplete);
        }
    }

    var clearBtn = document.getElementById('clearAnalyticsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var confirmMsg = (window.IS && IS.i18n) ? IS.i18n.get('confirmClearAll') : 'Clear all analytics data and extraction history?';
            if (!confirm(confirmMsg)) return;
            IS.analytics.clear();
            IS.history.clear();
            renderAnalytics();
            IS.showToast('All data cleared.');
        });
    }

    var _savedWipeMins = 5;
    try { if (window.IS && IS.settings) _savedWipeMins = IS.settings.read().wipeMinutes || 5; } catch(e) {}
    var WIPE_MS    = _savedWipeMins * 60 * 1000;

    function doWipe() {
        var inputText = document.getElementById('inputText');
        if (inputText) { inputText.value = ''; inputText.dispatchEvent(new Event('input', { bubbles: true })); }
        var card = document.getElementById('dataCard');
        if (card) card.style.display = 'none';
        var noData = document.getElementById('noDataMsg');
        if (noData) noData.classList.remove('visible');
        var hl = document.getElementById('inputHighlight');
        if (hl) hl.innerHTML = '';
        IS.showToast('\uD83D\uDD12 Privacy wipe complete \u2014 input cleared.', 'info');
        if (wipeEl) wipeEl.textContent = '';
        wipeStart = null;
    }

    function resetWipeTimer() {
        clearInterval(wipeTimer);
        if (wipeEl) wipeEl.textContent = '';
        _wipeWarnShown = false;
        wipeStart = Date.now();
        wipeTimer = setInterval(function () {
            var elapsed   = Date.now() - wipeStart;
            var remaining = WIPE_MS - elapsed;
            if (remaining <= 0) { clearInterval(wipeTimer); doWipe(); return; }
            if (remaining <= 60000 && !_wipeWarnShown) {
                _wipeWarnShown = true;
                var s60 = Math.ceil(remaining / 1000);
                IS.showToast('\u23F1 Privacy wipe in ' + s60 + ' seconds', 'info', 4000);
            }
            if (wipeEl) {
                var s = Math.ceil(remaining / 1000);
                var m = Math.floor(s / 60);
                var sec = s % 60;
                wipeEl.textContent = m + ':' + (sec < 10 ? '0' : '') + sec + ' ' + IS.i18n.get('wipeUntil');
            }
        }, 1000);
    }

    var _lastWipeReset = 0;
    function throttledResetWipeTimer() {
        var now = Date.now();
        if (now - _lastWipeReset < 2000) return;
        _lastWipeReset = now;
        resetWipeTimer();
    }
    ['mousemove','keydown','touchstart','scroll','click'].forEach(function (ev) {
        document.addEventListener(ev, throttledResetWipeTimer, { passive: true });
    });
    resetWipeTimer();

    window.addEventListener('IS_wipe_mins_changed', function (e) {
        WIPE_MS = e.detail * 60 * 1000;
        resetWipeTimer();
    });

    window.addEventListener('IS_lang_changed', function () {
        renderAnalytics();
    });

    var _wipeLastVisible = Date.now();
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            _wipeLastVisible = Date.now();
            clearInterval(wipeTimer);
        } else {
            if (wipeStart) {
                var hiddenFor = Date.now() - _wipeLastVisible;
                wipeStart += hiddenFor;
                resetWipeTimer();
            }
        }
    });

    window.addEventListener('beforeunload', function () {
        clearInterval(wipeTimer);
    });

    function formatRelTime(d) {
        var diff = Date.now() - d.getTime();
        var isUr = window.IS && IS.i18n && IS.i18n._lang === 'ur';
        if (diff < 60000)    return isUr ? 'ابھی ابھی'                            : 'Just now';
        if (diff < 3600000)  return Math.floor(diff / 60000)   + (isUr ? ' منٹ پہلے'  : 'm ago');
        if (diff < 86400000) return Math.floor(diff / 3600000) + (isUr ? ' گھنٹے پہلے' : 'h ago');
        return d.toLocaleDateString();
    }

    function animateCount(el, from, to, suffix) {
        suffix = suffix || '';
        var dur   = 600;
        var start = performance.now();
        function step(now) {
            var p = Math.min((now - start) / dur, 1);
            var v = Math.round(from + (to - from) * easeOut(p));
            el.textContent = v + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    var installBtn = document.getElementById('installAppBtn');

    window.addEventListener('beforeinstallprompt', function (e) {

        if (sessionStorage.getItem('pwa_installed') || localStorage.getItem('pwa_installed')) {
            if (installBtn) installBtn.style.display = 'none';
            return;
        }
        e.preventDefault();
        window._IS_deferredInstall = e;
        if (installBtn) {
            installBtn.style.display = '';
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', function () {
            if (!window._IS_deferredInstall) return;
            window._IS_deferredInstall.prompt();
            window._IS_deferredInstall.userChoice.then(function (result) {
                if (result.outcome === 'accepted') {
                    installBtn.style.display = 'none';
                    sessionStorage.setItem('pwa_installed', '1');
                    localStorage.setItem('pwa_installed', '1');
                }
                window._IS_deferredInstall = null;
            });
        });
    }

    window.addEventListener('appinstalled', function () {
        if (installBtn) installBtn.style.display = 'none';
        window._IS_deferredInstall = null;
        sessionStorage.setItem('pwa_installed', '1');
        localStorage.setItem('pwa_installed', '1');
        IS.showToast('App installed successfully!');
    });

    var genFabBtn = document.getElementById('genFabBtn');
    if (genFabBtn) {
        genFabBtn.addEventListener('click', function () {
            var realBtn = document.getElementById('generate-btn');
            if (realBtn) realBtn.click();
            genFabBtn.classList.remove('fab-flash');
            void genFabBtn.offsetWidth;
            genFabBtn.classList.add('fab-flash');
            setTimeout(function() { genFabBtn.classList.remove('fab-flash'); }, 520);
        });
    }

    if ('serviceWorker' in navigator) {
        var _swUpdateToastShown = false;
        function _showUpdateToast() {
            if (_swUpdateToastShown) return;
            _swUpdateToastShown = true;
            setTimeout(function () { _swUpdateToastShown = false; }, 5000);
            IS.showToast('🔄 Update ready — <button onclick="location.reload()" style="background:rgba(0,180,255,0.2);border:1px solid rgba(0,180,255,0.4);color:#00d4ff;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;margin-left:6px;">Reload now</button>', 'info', 0, true);
        }
        navigator.serviceWorker.register('./service-worker.js', { scope: './' })
            .then(function (reg) {
                reg.addEventListener('updatefound', function () {
                    var nw = reg.installing;
                    if (!nw) return;
                    nw.addEventListener('statechange', function () {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                            _showUpdateToast();
                        }
                    });
                });
                navigator.serviceWorker.addEventListener('message', function (e) {
                    if (!e.data) return;
                    if (e.data.type === 'SW_UPDATED') { _showUpdateToast(); }
                });
            })
            .catch(function () {});
    }

});
