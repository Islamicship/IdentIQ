'use strict';

/* mouse.js — NexusID Cursor Engine v2.2
   Styles: nexus | blade | blaze | default
   BlueStacks-style yellow/gold precision gaming cursor added (blaze)
   Full: setStyle, applyState, tick, enterIdle, mousedown burst logic
*/

(function () {

    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var C = {};

    function getThemeColors() {
        var isLight = document.body && document.body.classList.contains('theme-light');
        return {
            dot:    isLight ? '#0077cc' : '#00d4ff',
            ring:   isLight ? '#005aaa' : '#00a2ff',
            hover:  isLight ? '#0055ff' : '#00ffcc',
            danger: '#ff4466',
            text:   isLight ? '#cc8800' : '#ffe066',
            drag:   isLight ? '#7755cc' : '#aa88ff',
            trail:  isLight ? '#005aaa' : '#00a2ff',

            blade:       isLight ? '#cc4400' : '#ff6b35',
            bladeHover:  isLight ? '#cc0022' : '#ff2244',
            bladeTrail:  isLight ? '#aa3300' : '#ff6b35',

            blaze:       isLight ? '#d4a000' : '#ffd700',
            blazeHover:  isLight ? '#e6b800' : '#ffe84d',
            blazeTrail:  isLight ? '#b8860b' : '#ffc200',
            blazeGlow:   isLight ? 'rgba(212,160,0,0.55)' : 'rgba(255,215,0,0.6)'
        };
    }

    Object.assign(C, getThemeColors());

    var _currentStyle = 'nexus';

    (function readSavedStyle() {
        try {
            var raw = localStorage.getItem('IS_settings_v1');
            if (raw) {
                var cfg = JSON.parse(raw);
                if (cfg.cursorStyle === 'blade' || cfg.cursorStyle === 'nexus' ||
                    cfg.cursorStyle === 'blaze' || cfg.cursorStyle === 'default') {
                    _currentStyle = cfg.cursorStyle;
                }
            }
        } catch (e) {}
    }());

    var styleEl = document.createElement('style');
    styleEl.id  = 'nexus-cursor-styles';
    document.head.appendChild(styleEl);

    var _savedStyles = '';

    /* ── NEXUS CSS ─────────────────────────────────────────────── */
    function buildNexusCSS() {
        return [
            '*, *::before, *::after { cursor: none !important; }',

            '#nc-dot {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483647;',
            '  width: 6px; height: 6px; border-radius: 50%;',
            '  background: ' + C.dot + ';',
            '  box-shadow: 0 0 8px 2px ' + C.dot + ', 0 0 20px 4px rgba(0,212,255,0.4);',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: width .15s ease, height .15s ease,',
            '              background .2s ease, box-shadow .2s ease,',
            '              opacity .4s ease, transform .05s ease;',
            '  transform: translate(-50%,-50%);',
            '}',

            '#nc-ring {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483646;',
            '  width: 32px; height: 32px; border-radius: 50%;',
            '  border: 1.5px solid rgba(0,162,255,0.7);',
            '  box-shadow: 0 0 12px 1px rgba(0,162,255,0.25), inset 0 0 8px rgba(0,162,255,0.1);',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: width .22s cubic-bezier(.34,1.56,.64,1),',
            '              height .22s cubic-bezier(.34,1.56,.64,1),',
            '              border-color .2s ease, box-shadow .2s ease,',
            '              border-width .2s ease, opacity .4s ease,',
            '              background .2s ease, transform .05s ease;',
            '  transform: translate(-50%,-50%);',
            '}',

            '#nc-ring::after {',
            '  content: "";',
            '  position: absolute; top: 50%; left: 15%; right: 15%; height: 1px;',
            '  background: linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent);',
            '  transform: translateY(-50%);',
            '  transition: opacity .2s;',
            '}',

            '#nc-ring::before {',
            '  content: "";',
            '  position: absolute; inset: -3px;',
            '  border-radius: 50%;',
            '  background: transparent;',
            '  border: 1px solid rgba(0,212,255,0.12);',
            '  transition: opacity .2s ease;',
            '}',

            '.nc-trail {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483644;',
            '  border-radius: 50%; pointer-events: none;',
            '  will-change: transform, opacity;',
            '  background: radial-gradient(circle, ' + C.trail + ', transparent 70%);',
            '}',

            '.nc-ripple {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483645;',
            '  border-radius: 50%; pointer-events: none;',
            '  border: 1px solid rgba(0,212,255,0.8);',
            '  transform: translate(-50%,-50%) scale(0);',
            '  animation: nc-ripple-anim 0.55s cubic-bezier(0,.7,.3,1) forwards;',
            '  will-change: transform, opacity;',
            '}',
            '@keyframes nc-ripple-anim {',
            '  0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }',
            '  100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }',
            '}',

            '#nc-dot.nc-text-mode {',
            '  width: 2px; height: 16px; border-radius: 1px;',
            '  background: ' + C.text + ';',
            '  box-shadow: 0 0 6px 2px rgba(255,224,102,0.5);',
            '  animation: nc-caret-blink 1s ease-in-out infinite;',
            '}',
            '@keyframes nc-caret-blink {',
            '  0%,100% { opacity: 1; } 50% { opacity: 0.4; }',
            '}',

            'body.theme-light #nc-dot {',
            '  background: #0077cc;',
            '  box-shadow: 0 0 8px 2px #0077cc, 0 0 20px 4px rgba(0,119,204,0.35);',
            '}',
            'body.theme-light #nc-ring {',
            '  border-color: rgba(0,90,170,0.65);',
            '  box-shadow: 0 0 12px 1px rgba(0,90,170,0.2), inset 0 0 8px rgba(0,90,170,0.08);',
            '}',
            'body.theme-light .nc-trail {',
            '  background: radial-gradient(circle, #005aaa, transparent 70%);',
            '}',
            'body.theme-light .nc-ripple {',
            '  border-color: rgba(0,100,200,0.75);',
            '}'
        ].join('\n');
    }

    /* ── BLADE CSS ─────────────────────────────────────────────── */
    function buildBladeCSS() {
        return [
            '*, *::before, *::after { cursor: none !important; }',

            '#nc-dot {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483647;',
            '  width: 12px; height: 12px;',
            '  background: transparent;',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: opacity .4s ease, transform .05s ease;',
            '  transform: translate(-50%,-50%);',
            '}',

            '#nc-dot::before {',
            '  content: "";',
            '  position: absolute;',
            '  top: 50%; left: 50%;',
            '  width: 12px; height: 1px;',
            '  background: ' + C.blade + ';',
            '  box-shadow: 0 0 5px 1px ' + C.blade + ';',
            '  transform: translate(-50%,-50%);',
            '  transition: width .15s ease, background .2s ease, box-shadow .2s ease;',
            '}',

            '#nc-dot::after {',
            '  content: "";',
            '  position: absolute;',
            '  top: 50%; left: 50%;',
            '  width: 1px; height: 12px;',
            '  background: ' + C.blade + ';',
            '  box-shadow: 0 0 5px 1px ' + C.blade + ';',
            '  transform: translate(-50%,-50%);',
            '  transition: height .15s ease, background .2s ease, box-shadow .2s ease;',
            '}',

            '#nc-ring {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483646;',
            '  width: 28px; height: 28px;',
            '  border-radius: 50%;',
            '  background: conic-gradient(',
            '    ' + C.blade + ' 0deg 70deg,',
            '    transparent 70deg 110deg,',
            '    ' + C.blade + ' 110deg 160deg,',
            '    transparent 160deg 200deg,',
            '    ' + C.blade + ' 200deg 250deg,',
            '    transparent 250deg 290deg,',
            '    ' + C.blade + ' 290deg 360deg',
            '  );',
            '  -webkit-mask: radial-gradient(circle, transparent 11px, black 12px);',
            '  mask: radial-gradient(circle, transparent 11px, black 12px);',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: width .22s cubic-bezier(.34,1.56,.64,1),',
            '              height .22s cubic-bezier(.34,1.56,.64,1),',
            '              opacity .4s ease, transform .05s ease;',
            '  transform: translate(-50%,-50%);',
            '  box-shadow: 0 0 10px 1px rgba(255,107,53,0.3);',
            '}',

            '#nc-ring::before {',
            '  content: "";',
            '  position: absolute; inset: -6px;',
            '  border-radius: 50%;',
            '  background: transparent;',
            '  border: 1px solid rgba(255,107,53,0.18);',
            '}',

            '#nc-ring::after {',
            '  content: "";',
            '  position: absolute;',
            '  top: 50%; left: 50%;',
            '  width: 4px; height: 4px;',
            '  background: transparent;',
            '  border-top: 1px solid ' + C.blade + ';',
            '  border-right: 1px solid ' + C.blade + ';',
            '  transform: translate(-50%,-50%) rotate(45deg);',
            '  box-shadow: 0 0 4px rgba(255,107,53,0.5);',
            '}',

            '.nc-trail {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483644;',
            '  width: 2px; height: 2px;',
            '  border-radius: 50%; pointer-events: none;',
            '  will-change: transform, opacity;',
            '  background: ' + C.bladeTrail + ';',
            '  box-shadow: 0 0 4px 1px ' + C.bladeTrail + ';',
            '}',

            '.nc-ripple {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483645;',
            '  border-radius: 50%; pointer-events: none;',
            '  border: 1px solid rgba(255,107,53,0.8);',
            '  transform: translate(-50%,-50%) scale(0);',
            '  animation: nc-blade-ripple 0.55s cubic-bezier(0,.7,.3,1) forwards;',
            '  will-change: transform, opacity;',
            '}',
            '@keyframes nc-blade-ripple {',
            '  0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }',
            '  100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }',
            '}',

            '@keyframes nc-idle-spin {',
            '  from { transform: translate(-50%,-50%) rotate(0deg); }',
            '  to   { transform: translate(-50%,-50%) rotate(360deg); }',
            '}',
            '#nc-ring.nc-idle-spin {',
            '  animation: nc-idle-spin 4s linear infinite;',
            '}',

            '#nc-dot.nc-text-mode::before {',
            '  width: 0;',
            '}',
            '#nc-dot.nc-text-mode::after {',
            '  height: 14px;',
            '  background: #ffaa00;',
            '  box-shadow: 0 0 6px 2px rgba(255,170,0,0.5);',
            '  animation: nc-caret-blink 1s ease-in-out infinite;',
            '}',
            '@keyframes nc-caret-blink {',
            '  0%,100% { opacity: 1; } 50% { opacity: 0.4; }',
            '}',

            'body.theme-light #nc-dot::before,',
            'body.theme-light #nc-dot::after {',
            '  background: #cc4400;',
            '  box-shadow: 0 0 5px 1px #cc4400;',
            '}',
            'body.theme-light #nc-ring {',
            '  box-shadow: 0 0 8px 1px rgba(180,60,0,0.25);',
            '}',
            'body.theme-light .nc-trail {',
            '  background: #aa3300;',
            '  box-shadow: 0 0 3px 1px #aa3300;',
            '}'
        ].join('\n');
    }

    /* ── BLAZE CSS — BlueStacks-style sharp yellow/gold gaming cursor ── */
    function buildBlazeCSS() {
        return [
            '*, *::before, *::after { cursor: none !important; }',

            '#nc-dot {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483647;',
            '  width: 0; height: 0;',
            '  background: transparent;',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: opacity .3s ease, transform .04s ease;',
            '  transform: translate(-2px,-2px);',
            '}',

            '#nc-dot::before {',
            '  content: "";',
            '  position: absolute;',
            '  top: 0; left: 0;',
            '  width: 0; height: 0;',
            '  border-left: 7px solid transparent;',
            '  border-right: 0px solid transparent;',
            '  border-top: 0px solid transparent;',
            '  border-bottom: 12px solid ' + C.blaze + ';',
            '  filter: drop-shadow(0 0 5px ' + C.blazeGlow + ') drop-shadow(0 0 12px ' + C.blazeGlow + ');',
            '  transition: border-color .2s ease, filter .2s ease;',
            '}',

            '#nc-dot::after {',
            '  content: "";',
            '  position: absolute;',
            '  top: 10px; left: 1px;',
            '  width: 2px; height: 7px;',
            '  background: ' + C.blaze + ';',
            '  border-radius: 1px;',
            '  transform: rotate(-38deg);',
            '  filter: drop-shadow(0 0 3px ' + C.blazeGlow + ');',
            '  transition: background .2s ease;',
            '}',

            '#nc-ring {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483646;',
            '  width: 4px; height: 4px;',
            '  background: ' + C.blaze + ';',
            '  border-radius: 50%;',
            '  box-shadow: 0 0 6px 2px ' + C.blazeGlow + ', 0 0 14px 4px rgba(255,215,0,0.25);',
            '  pointer-events: none;',
            '  will-change: transform, opacity;',
            '  transition: width .18s cubic-bezier(.34,1.56,.64,1),',
            '              height .18s cubic-bezier(.34,1.56,.64,1),',
            '              box-shadow .2s ease, opacity .35s ease,',
            '              background .2s ease, transform .04s ease;',
            '  transform: translate(-50%,-50%);',
            '}',

            '#nc-ring::before {',
            '  content: "";',
            '  position: absolute; inset: -5px;',
            '  border-radius: 50%;',
            '  border: 1px solid rgba(255,215,0,0.35);',
            '  transition: opacity .2s ease;',
            '}',

            '#nc-ring::after {',
            '  content: "";',
            '  position: absolute; inset: -10px;',
            '  border-radius: 50%;',
            '  border: 1px solid rgba(255,215,0,0.12);',
            '}',

            '.nc-trail {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483644;',
            '  width: 3px; height: 3px;',
            '  border-radius: 50%; pointer-events: none;',
            '  will-change: transform, opacity;',
            '  background: ' + C.blazeTrail + ';',
            '  box-shadow: 0 0 4px 1px rgba(255,210,0,0.4);',
            '}',

            '.nc-ripple {',
            '  position: fixed; top: 0; left: 0; z-index: 2147483645;',
            '  border-radius: 50%; pointer-events: none;',
            '  border: 1.5px solid rgba(255,215,0,0.85);',
            '  transform: translate(-50%,-50%) scale(0);',
            '  animation: nc-blaze-ripple 0.5s cubic-bezier(0,.65,.35,1) forwards;',
            '  will-change: transform, opacity;',
            '}',
            '@keyframes nc-blaze-ripple {',
            '  0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }',
            '  60%  { opacity: 0.7; }',
            '  100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }',
            '}',

            '@keyframes nc-blaze-idle-pulse {',
            '  0%,100% { box-shadow: 0 0 6px 2px rgba(255,215,0,0.5), 0 0 14px 4px rgba(255,215,0,0.2); }',
            '  50%     { box-shadow: 0 0 10px 4px rgba(255,215,0,0.8), 0 0 22px 8px rgba(255,215,0,0.35); }',
            '}',
            '#nc-ring.nc-idle-spin {',
            '  animation: nc-blaze-idle-pulse 1.4s ease-in-out infinite;',
            '}',

            '#nc-dot.nc-text-mode::before {',
            '  border: none;',
            '  width: 2px; height: 16px;',
            '  background: ' + C.blaze + ';',
            '  box-shadow: 0 0 6px 2px rgba(255,215,0,0.5);',
            '  animation: nc-caret-blink 1s ease-in-out infinite;',
            '}',
            '#nc-dot.nc-text-mode::after { display: none; }',
            '@keyframes nc-caret-blink {',
            '  0%,100% { opacity: 1; } 50% { opacity: 0.35; }',
            '}',

            'body.theme-light #nc-dot::before {',
            '  border-bottom-color: #c8960a;',
            '  filter: drop-shadow(0 0 4px rgba(200,150,10,0.6));',
            '}',
            'body.theme-light #nc-dot::after { background: #c8960a; }',
            'body.theme-light #nc-ring {',
            '  background: #d4a800;',
            '  box-shadow: 0 0 6px 2px rgba(212,168,0,0.55), 0 0 14px 4px rgba(212,168,0,0.2);',
            '}',
            'body.theme-light .nc-trail { background: #b8860b; box-shadow: 0 0 3px 1px rgba(184,134,11,0.4); }'
        ].join('\n');
    }

    /* ── applyCSS ──────────────────────────────────────────────── */
    function applyCSS() {
        if (_currentStyle === 'default') {
            styleEl.textContent = '';
            _savedStyles = '';
            return;
        }
        var css;
        if (_currentStyle === 'blade')      css = buildBladeCSS();
        else if (_currentStyle === 'blaze') css = buildBlazeCSS();
        else                                css = buildNexusCSS();
        styleEl.textContent = css;
        _savedStyles = css;
    }

    applyCSS();

    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.id   = 'nc-dot';
    ring.id  = 'nc-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    if (_currentStyle === 'default') {
        dot.style.display  = 'none';
        ring.style.display = 'none';
    }

    var TRAIL_COUNT = 8;
    var trailPool   = [];
    for (var ti = 0; ti < TRAIL_COUNT; ti++) {
        var tp = document.createElement('div');
        tp.className = 'nc-trail';
        var sz = (_currentStyle === 'blade' || _currentStyle === 'blaze') ? 3 : Math.max(2, 8 - ti);
        tp.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;opacity:0;';
        document.body.appendChild(tp);
        trailPool.push({ el: tp, x: 0, y: 0, opacity: 0 });
    }

    var mouse    = { x: -200, y: -200 };
    var ringPos  = { x: -200, y: -200 };
    var trailHistory = [];
    var TRAIL_LEN    = TRAIL_COUNT * 3;

    var state = {
        visible:      false,
        idle:         false,
        idleTimer:    null,
        idleSpinning: false,
        hovered:      null,
        magnetMx:     0,
        magnetMy:     0,
        dragging:     false,
        down:         false
    };

    var _rippleCount = 0;
    var MAX_RIPPLES  = 6;

    var INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, ' +
                      '.nav-tab, .copy-btn, .danger-btn, .sp-gear-btn, ' +
                      '.history-restore-btn, .history-delete-btn, .sp-seg-btn, ' +
                      '.sp-lang-card, .sp-theme-card, .sp-cursor-card, .sp-nav-item, [tabindex]';

    /* ── accentFor ─────────────────────────────────────────────── */
    function accentFor(el) {
        if (!el) return null;
        var cls = (el.className || '') + ' ' + (el.id || '');
        if (_currentStyle === 'blade') {
            if (/danger|delete|clear|wipe/i.test(cls)) return C.danger;
            return C.bladeHover;
        }
        if (_currentStyle === 'blaze') {
            if (/danger|delete|clear|wipe/i.test(cls)) return C.danger;
            return C.blazeHover;
        }
        if (/danger|delete|clear|wipe/i.test(cls)) return C.danger;
        if (/install|download|gear|settings/i.test(cls)) return C.hover;
        if (/input|textarea|search/i.test(el.tagName + cls)) return C.text;
        return C.hover;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ── _resetElements ────────────────────────────────────────── */
    function _resetElements() {
        var props = [
            'width','height','background','boxShadow','border','borderColor',
            'borderWidth','borderRadius','borderStyle','opacity','transform',
            'animation','transition','filter'
        ];
        props.forEach(function(p) {
            dot.style[p]  = '';
            ring.style[p] = '';
        });
        dot.classList.remove('nc-text-mode');
        ring.classList.remove('nc-idle-spin', 'nc-scanning');
    }

    /* ── applyStateNexus ───────────────────────────────────────── */
    function applyStateNexus(hovered, accent, isText, isDrag, isDown) {
        var col = accent || C.ring;

        if (isText) {
            dot.style.width      = '';
            dot.style.height     = '';
            dot.style.background = '';
            dot.style.boxShadow  = '';
            dot.classList.add('nc-text-mode');
            ring.style.width       = '2px';
            ring.style.height      = '2px';
            ring.style.borderColor = 'transparent';
            ring.style.background  = 'transparent';
            ring.style.boxShadow   = 'none';
        } else if (isDrag) {
            dot.classList.remove('nc-text-mode');
            dot.style.background  = C.drag;
            dot.style.boxShadow   = '0 0 10px 3px ' + C.drag;
            ring.style.width      = '40px';
            ring.style.height     = '40px';
            ring.style.borderColor = C.drag;
            ring.style.boxShadow  = '0 0 18px 3px rgba(170,136,255,0.35)';
            ring.style.background = 'rgba(170,136,255,0.04)';
        } else if (hovered) {
            dot.classList.remove('nc-text-mode');
            dot.style.background  = col;
            dot.style.boxShadow   = '0 0 12px 4px ' + col + ', 0 0 28px 8px rgba(0,212,255,0.3)';
            dot.style.width       = isDown ? '3px' : '6px';
            dot.style.height      = isDown ? '3px' : '6px';
            ring.style.width      = isDown ? '44px' : '50px';
            ring.style.height     = isDown ? '44px' : '50px';
            ring.style.borderColor = col;
            ring.style.borderWidth = '1.5px';
            ring.style.boxShadow  = '0 0 20px 3px rgba(0,212,255,0.3), inset 0 0 14px rgba(0,212,255,0.08)';
            ring.style.background = 'rgba(0,212,255,0.03)';
        } else {
            dot.classList.remove('nc-text-mode');
            dot.style.background  = isDown ? 'rgba(0,212,255,0.6)' : C.dot;
            dot.style.boxShadow   = isDown
                ? '0 0 4px 1px rgba(0,212,255,0.3)'
                : '0 0 8px 2px ' + C.dot + ', 0 0 20px 4px rgba(0,212,255,0.4)';
            dot.style.width       = isDown ? '4px' : '6px';
            dot.style.height      = isDown ? '4px' : '6px';
            ring.style.width      = isDown ? '24px' : '32px';
            ring.style.height     = isDown ? '24px' : '32px';
            ring.style.borderColor = 'rgba(0,162,255,0.7)';
            ring.style.borderWidth = '1.5px';
            ring.style.boxShadow  = '0 0 12px 1px rgba(0,162,255,0.25), inset 0 0 8px rgba(0,162,255,0.1)';
            ring.style.background = 'transparent';
        }
    }

    /* ── applyStateBlade ───────────────────────────────────────── */
    function applyStateBlade(hovered, accent, isText, isDrag, isDown) {
        ring.classList.remove('nc-idle-spin');

        if (isText) {
            dot.style.width      = '';
            dot.style.height     = '';
            dot.style.background = '';
            dot.style.boxShadow  = '';
            dot.classList.add('nc-text-mode');
            ring.style.width     = '2px';
            ring.style.height    = '2px';
            ring.style.opacity   = '0';
        } else if (isDrag) {
            dot.classList.remove('nc-text-mode');
            dot.style.width      = '20px';
            dot.style.height     = '20px';
            ring.style.width     = '34px';
            ring.style.height    = '34px';
            ring.style.opacity   = '0.8';
        } else if (hovered) {
            dot.classList.remove('nc-text-mode');
            dot.style.width      = isDown ? '10px' : '16px';
            dot.style.height     = isDown ? '10px' : '16px';
            ring.style.width     = isDown ? '16px' : '20px';
            ring.style.height    = isDown ? '16px' : '20px';
            ring.style.opacity   = '1';
        } else {
            dot.classList.remove('nc-text-mode');
            dot.style.width      = isDown ? '8px' : '12px';
            dot.style.height     = isDown ? '8px' : '12px';
            ring.style.width     = isDown ? '20px' : '28px';
            ring.style.height    = isDown ? '20px' : '28px';
            ring.style.opacity   = isDown ? '0.7' : '1';
        }
    }

    /* ── applyStateBlaze — sharp gaming pointer ────────────────── */
    function applyStateBlaze(hovered, accent, isText, isDrag, isDown) {
        ring.classList.remove('nc-idle-spin');

        if (isText) {
            dot.classList.add('nc-text-mode');
            ring.style.width     = '2px';
            ring.style.height    = '2px';
            ring.style.opacity   = '0';
        } else if (isDrag) {
            dot.classList.remove('nc-text-mode');
            dot.style.opacity    = '0.7';
            ring.style.width     = '10px';
            ring.style.height    = '10px';
            ring.style.background = C.drag;
            ring.style.boxShadow = '0 0 10px 3px rgba(170,136,255,0.5)';
            ring.style.opacity   = '0.9';
        } else if (hovered) {
            dot.classList.remove('nc-text-mode');
            dot.style.opacity    = '1';
            var glowCol = (accent && /ff4466|danger/.test(accent)) ? 'rgba(255,68,102,0.7)' : C.blazeGlow;
            ring.style.width     = isDown ? '6px'  : '8px';
            ring.style.height    = isDown ? '6px'  : '8px';
            ring.style.background = accent || C.blazeHover;
            ring.style.boxShadow = '0 0 10px 3px ' + glowCol + ', 0 0 20px 6px rgba(255,215,0,0.2)';
            ring.style.opacity   = '1';
        } else {
            dot.classList.remove('nc-text-mode');
            dot.style.opacity    = isDown ? '0.7' : '1';
            ring.style.width     = isDown ? '3px' : '4px';
            ring.style.height    = isDown ? '3px' : '4px';
            ring.style.background = C.blaze;
            ring.style.boxShadow = isDown
                ? '0 0 4px 1px rgba(255,215,0,0.4)'
                : '0 0 6px 2px ' + C.blazeGlow + ', 0 0 14px 4px rgba(255,215,0,0.25)';
            ring.style.opacity   = isDown ? '0.6' : '1';
        }
    }

    /* ── applyState — dispatch ─────────────────────────────────── */
    function applyState(hovered, accent, isText, isDrag, isDown) {
        if (_currentStyle === 'blade')      applyStateBlade(hovered, accent, isText, isDrag, isDown);
        else if (_currentStyle === 'blaze') applyStateBlaze(hovered, accent, isText, isDrag, isDown);
        else                                applyStateNexus(hovered, accent, isText, isDrag, isDown);
    }

    /* ── getMagnetOffset ───────────────────────────────────────── */
    function getMagnetOffset(el, mx, my) {
        if (!el) return { dx: 0, dy: 0 };
        var r    = el.getBoundingClientRect();
        var cx   = r.left + r.width  / 2;
        var cy   = r.top  + r.height / 2;
        var dx   = mx - cx;
        var dy   = my - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var PULL_DIST = 55;
        var STRENGTH;
        if (_currentStyle === 'blade')      STRENGTH = 0.20;
        else if (_currentStyle === 'blaze') STRENGTH = 0.15;
        else                                STRENGTH = 0.35;
        if (dist > PULL_DIST) return { dx: 0, dy: 0 };
        var factor = (1 - dist / PULL_DIST) * STRENGTH;
        return { dx: -dx * factor, dy: -dy * factor };
    }

    /* ── spawnRipple ───────────────────────────────────────────── */
    function spawnRipple(x, y, size, color) {
        if (_rippleCount >= MAX_RIPPLES) return;
        _rippleCount++;
        var rp = document.createElement('div');
        rp.className   = 'nc-ripple';
        rp.style.left  = x + 'px';
        rp.style.top   = y + 'px';
        rp.style.width  = (size || 60) + 'px';
        rp.style.height = (size || 60) + 'px';
        rp.style.borderColor = color || 'rgba(0,212,255,0.8)';
        document.body.appendChild(rp);
        setTimeout(function () {
            _rippleCount--;
            if (rp.parentNode) rp.parentNode.removeChild(rp);
        }, 560);
    }

    /* ── spawnBladeShockwave ───────────────────────────────────── */
    function spawnBladeShockwave(x, y) {
        var colours = ['rgba(255,107,53,0.9)', 'rgba(255,107,53,0.5)', 'rgba(255,107,53,0.25)'];
        var sizes   = [50, 80, 110];
        var delays  = [0, 80, 160];
        for (var i = 0; i < 3; i++) {
            (function(ii) {
                setTimeout(function() {
                    spawnRipple(x, y, sizes[ii], colours[ii]);
                }, delays[ii]);
            })(i);
        }
    }

    /* ── spawnBlazeImpact — golden burst on click ──────────────── */
    function spawnBlazeImpact(x, y) {
        var colours = [
            'rgba(255,215,0,0.95)',
            'rgba(255,200,0,0.6)',
            'rgba(255,185,0,0.3)'
        ];
        var sizes  = [36, 60, 88];
        var delays = [0, 60, 130];
        for (var i = 0; i < 3; i++) {
            (function(ii) {
                setTimeout(function() {
                    spawnRipple(x, y, sizes[ii], colours[ii]);
                }, delays[ii]);
            })(i);
        }
    }

    /* ── updateTrail ───────────────────────────────────────────── */
    function updateTrail() {
        trailHistory.push({ x: mouse.x, y: mouse.y });
        if (trailHistory.length > TRAIL_LEN) trailHistory.shift();

        if (_currentStyle === 'blade') {
            for (var i = 0; i < TRAIL_COUNT; i++) {
                var tp  = trailPool[i];
                if (i >= 4) { tp.el.style.opacity = '0'; continue; }
                var idx = trailHistory.length - 1 - (i * 2);
                if (idx < 0) { tp.el.style.opacity = '0'; continue; }
                var pos   = trailHistory[idx];
                var alpha = ((4 - i) / 4) * 0.55;
                tp.el.style.cssText = [
                    'width:2px', 'height:2px',
                    'opacity:' + alpha.toFixed(2),
                    'transform:translate(' + (pos.x - 1) + 'px,' + (pos.y - 1) + 'px)'
                ].join(';');
            }
        } else if (_currentStyle === 'blaze') {
            for (var b = 0; b < TRAIL_COUNT; b++) {
                var tpb  = trailPool[b];
                if (b >= 5) { tpb.el.style.opacity = '0'; continue; }
                var idxb = trailHistory.length - 1 - (b * 2);
                if (idxb < 0) { tpb.el.style.opacity = '0'; continue; }
                var posb  = trailHistory[idxb];
                var alphab = ((5 - b) / 5) * 0.45;
                var szb    = Math.max(1, 4 - b);
                tpb.el.style.cssText = [
                    'width:'   + szb + 'px',
                    'height:'  + szb + 'px',
                    'opacity:' + alphab.toFixed(2),
                    'transform:translate(' + (posb.x - szb/2) + 'px,' + (posb.y - szb/2) + 'px)'
                ].join(';');
            }
        } else {
            for (var j = 0; j < TRAIL_COUNT; j++) {
                var tpj  = trailPool[j];
                var idxj = trailHistory.length - 1 - (j * 3);
                if (idxj < 0) { tpj.el.style.opacity = '0'; continue; }
                var posj  = trailHistory[idxj];
                var alphaj = ((TRAIL_COUNT - j) / TRAIL_COUNT) * 0.35;
                var szj    = Math.max(1, 7 - j);
                tpj.el.style.cssText = [
                    'width:'   + szj + 'px',
                    'height:'  + szj + 'px',
                    'opacity:' + alphaj.toFixed(2),
                    'transform:translate(' + (posj.x - szj/2) + 'px,' + (posj.y - szj/2) + 'px)'
                ].join(';');
            }
        }
    }

    /* ── enterIdle ─────────────────────────────────────────────── */
    function enterIdle() {
        state.idle = true;
        if (_currentStyle === 'blaze') {
            dot.style.opacity  = '0.3';
            ring.style.opacity = '0.4';
            ring.classList.add('nc-idle-spin');
        } else if (_currentStyle === 'blade') {
            dot.style.opacity  = '0.2';
            ring.style.opacity = '0.2';
            ring.classList.add('nc-idle-spin');
        } else {
            dot.style.opacity  = '0.2';
            ring.style.opacity = '0.2';
        }
    }

    /* ── exitIdle ──────────────────────────────────────────────── */
    function exitIdle() {
        state.idle = false;
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
        ring.classList.remove('nc-idle-spin');
    }

    var RING_LERP = 0.14;

    /* ── tick — rAF loop ───────────────────────────────────────── */
    function tick() {
        requestAnimationFrame(tick);
        if (!state.visible) return;

        if (state.hovered) {
            var mag = getMagnetOffset(state.hovered, mouse.x, mouse.y);
            state.magnetMx = mag.dx;
            state.magnetMy = mag.dy;
        } else {
            state.magnetMx *= 0.85;
            state.magnetMy *= 0.85;
        }

        var lerpRate = (_currentStyle === 'blaze') ? 0.22 : RING_LERP;

        ringPos.x = lerp(ringPos.x, mouse.x + state.magnetMx, lerpRate);
        ringPos.y = lerp(ringPos.y, mouse.y + state.magnetMy, lerpRate);

        if (_currentStyle === 'blaze') {
            dot.style.transform  = 'translate(' + (mouse.x - 2) + 'px,' + (mouse.y - 2) + 'px)';
            ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%)';
        } else {
            dot.style.transform  = 'translate(' + mouse.x + 'px,' + mouse.y + 'px) translate(-50%,-50%)';
            ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%)';
        }

        updateTrail();
    }

    requestAnimationFrame(tick);

    /* ── mousemove ─────────────────────────────────────────────── */
    document.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        if (!state.visible) {
            state.visible      = true;
            dot.style.opacity  = '1';
            ring.style.opacity = '1';
            trailPool.forEach(function(t) { t.el.style.opacity = '0'; });
        }

        clearTimeout(state.idleTimer);
        if (state.idle) exitIdle();

        state.idleTimer = setTimeout(function () { enterIdle(); }, 3000);

        var el      = document.elementFromPoint(e.clientX, e.clientY);
        var nearest = el ? el.closest(INTERACTIVE) : null;

        var isText = false;
        if (el && !nearest) {
            var tag = el.tagName;
            try {
                var ct = window.getComputedStyle(el).cursor;
                if (tag === 'P' || tag === 'SPAN' || tag === 'H1' || tag === 'H2' ||
                    tag === 'H3' || tag === 'LI' || ct === 'text') {
                    isText = true;
                }
            } catch (ex) {}
        }

        state.hovered = nearest || null;
        var accent    = accentFor(nearest);
        applyState(!!nearest, accent, isText, state.dragging, state.down);
    }, { passive: true });

    /* ── mousedown — burst logic ───────────────────────────────── */
    document.addEventListener('mousedown', function (e) {
        state.down = true;
        var accent = accentFor(state.hovered);

        applyState(!!state.hovered, accent, false, state.dragging, true);

        if (_currentStyle === 'blade') {
            spawnBladeShockwave(e.clientX, e.clientY);
        } else if (_currentStyle === 'blaze') {
            spawnBlazeImpact(e.clientX, e.clientY);
        } else {
            spawnRipple(e.clientX, e.clientY,
                state.hovered ? 70 : 52,
                accent || 'rgba(0,212,255,0.8)');
        }
    });

    /* ── mouseup ───────────────────────────────────────────────── */
    document.addEventListener('mouseup', function () {
        state.down = false;
        var accent = accentFor(state.hovered);
        applyState(!!state.hovered, accent, false, state.dragging, false);
    });

    /* ── drag ──────────────────────────────────────────────────── */
    document.addEventListener('dragstart', function () {
        state.dragging = true;
        applyState(false, null, false, true, false);
    });
    document.addEventListener('dragend', function () {
        state.dragging = false;
        applyState(!!state.hovered, accentFor(state.hovered), false, false, false);
    });

    /* ── mouseleave / mouseenter ───────────────────────────────── */
    document.addEventListener('mouseleave', function () {
        state.visible  = false;
        state.hovered  = null;
        state.down     = false;
        state.dragging = false;
        state.idle     = false;
        clearTimeout(state.idleTimer);
        state.idleTimer = null;
        dot.style.opacity   = '0';
        ring.style.opacity  = '0';
        dot.style.display   = 'none';
        ring.style.display  = 'none';
        dot.classList.remove('nc-text-mode');
        ring.classList.remove('nc-idle-spin', 'nc-scanning');
        trailPool.forEach(function(t) {
            t.el.style.opacity   = '0';
            t.el.style.display   = 'none';
            t.el.style.transform = 'translate(-9999px,-9999px)';
        });
        trailHistory = [];
    });

    document.addEventListener('mouseenter', function () {
        state.visible      = true;
        state.idle         = false;
        dot.style.display  = '';
        ring.style.display = '';
        trailPool.forEach(function(t) { t.el.style.display = ''; });
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
        ring.classList.remove('nc-idle-spin');
        ringPos.x = mouse.x;
        ringPos.y = mouse.y;
    });

    /* ── scanning ring on buttons ──────────────────────────────── */
    var _sweepTimer = null;
    document.addEventListener('mouseover', function (e) {
        var el = e.target.closest && e.target.closest('button, .nav-tab, .sp-about-btn, .sp-seg-btn');
        if (!el) return;
        clearTimeout(_sweepTimer);
        _sweepTimer = null;
        if (_currentStyle !== 'blaze') ring.classList.add('nc-scanning');
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
        var el = e.target.closest && e.target.closest('button, .nav-tab, .sp-about-btn, .sp-seg-btn');
        if (!el) return;
        clearTimeout(_sweepTimer);
        _sweepTimer = setTimeout(function() {
            ring.classList.remove('nc-scanning');
            _sweepTimer = null;
        }, 80);
    }, { passive: true });

    /* ── dblclick ──────────────────────────────────────────────── */
    document.addEventListener('dblclick', function (e) {
        if (_currentStyle === 'blade') {
            spawnBladeShockwave(e.clientX, e.clientY);
        } else if (_currentStyle === 'blaze') {
            spawnBlazeImpact(e.clientX, e.clientY);
            spawnRipple(e.clientX, e.clientY, 100, 'rgba(255,215,0,0.2)');
        } else {
            spawnRipple(e.clientX, e.clientY, 90,  'rgba(0,255,204,0.6)');
            spawnRipple(e.clientX, e.clientY, 120, 'rgba(0,162,255,0.3)');
        }
    });

    /* ── Public API ────────────────────────────────────────────── */
    window._NexusCursor = {

        disable: function () {
            clearTimeout(state.idleTimer);
            state.idleTimer = null;
            state.visible = false;
            state.idle    = false;
            dot.style.display  = 'none';
            ring.style.display = 'none';
            trailPool.forEach(function(t) { t.el.style.display = 'none'; });
            styleEl.textContent = _savedStyles.replace(
                '*, *::before, *::after { cursor: none !important; }', ''
            );
        },

        enable: function () {
            styleEl.textContent = _savedStyles;
            dot.style.display   = '';
            ring.style.display  = '';
            trailPool.forEach(function(t) { t.el.style.display = ''; });
            dot.style.opacity  = '1';
            ring.style.opacity = '1';
            ring.classList.remove('nc-idle-spin');
            state.idle    = false;
            state.visible = false;
            clearTimeout(state.idleTimer);
            state.idleTimer = null;
        },

        syncTheme: function () {
            Object.assign(C, getThemeColors());
            trailPool.forEach(function(tp) {
                if (_currentStyle === 'blade') {
                    tp.el.style.background = C.bladeTrail;
                    tp.el.style.boxShadow  = '0 0 4px 1px ' + C.bladeTrail;
                } else if (_currentStyle === 'blaze') {
                    tp.el.style.background = C.blazeTrail;
                    tp.el.style.boxShadow  = '0 0 4px 1px rgba(255,210,0,0.4)';
                } else {
                    tp.el.style.background = 'radial-gradient(circle, ' + C.trail + ', transparent 70%)';
                }
            });
            applyCSS();
            _savedStyles = styleEl.textContent;
        },

        setStyle: function (name) {
            if (name !== 'nexus' && name !== 'blade' && name !== 'blaze' && name !== 'default') {
                name = 'nexus';
            }
            if (name === _currentStyle) return;

            _currentStyle = name;

            if (name === 'default') {
                _resetElements();
                styleEl.textContent = '';
                _savedStyles = '';
                dot.style.display  = 'none';
                ring.style.display = 'none';
                trailPool.forEach(function(tp) { tp.el.style.display = 'none'; });
                state.visible = false;
                clearTimeout(state.idleTimer);
                state.idleTimer = null;
                return;
            }

            dot.style.display  = '';
            ring.style.display = '';
            trailPool.forEach(function(tp) { tp.el.style.display = ''; });

            _resetElements();

            trailPool.forEach(function(tp, i) {
                var sz = (name === 'blade') ? 2
                       : (name === 'blaze') ? 3
                       : Math.max(2, 8 - i);
                tp.el.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;opacity:0;';
            });

            applyCSS();
            window._NexusCursor.syncTheme();

            trailHistory  = [];
            ringPos.x     = mouse.x;
            ringPos.y     = mouse.y;

            applyState(!!state.hovered, accentFor(state.hovered), false, state.dragging, state.down);
        }
    };

    /* ── Theme observer ────────────────────────────────────────── */
    (new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'class') {
                window._NexusCursor.syncTheme();
            }
        });
    })).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    /* ── Auto-apply saved cursor style ────────────────────────── */
    (function applyCursorSetting() {
        try {
            var raw = localStorage.getItem('IS_settings_v1');
            if (raw) {
                var cfg = JSON.parse(raw);
                if (cfg.cursorStyle && cfg.cursorStyle !== _currentStyle) {
                    window._NexusCursor.setStyle(cfg.cursorStyle);
                }
            }
        } catch(e) {}

        window.addEventListener('nexusid:settings-change', function(e) {
            if (!e.detail) return;
            if (e.detail.key === 'cursorStyle') {
                window._NexusCursor.setStyle(e.detail.value);
            }
        });
    }());

})();