/* ════════════════════════════════════════════════════════════════════
   login.js  v1.2.0  — FULLY FIXED
   NexusID v4.3 — Creative Men · Pakistan
   Login-page controller: tabs, validation, Firebase auth, animations

   FIXES:
   [FIX-1] NexusAuth null-guard — if Firebase config is placeholder /
           SDK fails to load, page no longer crashes with TypeError.
           All NexusAuth calls are wrapped in safety checks.
   [FIX-2] onAuthChanged guard wrapped in try/catch — prevents uncaught
           promise rejection crashing the page on bad config.
   [FIX-3] Canvas resize: debounced to prevent excessive redraws.
   [FIX-4] Canvas RAF leak fixed — resize no longer spawns duplicate loops.
   [FIX-5] switchTab now also updates aria-selected on tab buttons.
   [FIX-6] clearAlerts no longer throws if a DOM element is null.
   [FIX-7] Remember-me duplicate event listener removed (was added twice).
   ════════════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════════
   1. DOM REFERENCES
   ════════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const DOM = {
    /* Tabs */
    tabLogin:    $('tabLogin'),
    tabRegister: $('tabRegister'),
    panelLogin:  $('panelLogin'),
    panelReg:    $('panelReg'),

    /* Login panel */
    loginEmail:     $('loginEmail'),
    loginPass:      $('loginPass'),
    loginRemember:  $('loginRemember'),
    loginAlert:     $('loginAlert'),
    loginBtn:       $('loginBtn'),
    loginGoogleBtn: $('loginGoogleBtn'),
    toggleLoginPass:$('toggleLoginPass'),

    /* Register panel */
    regName:          $('regName'),
    regEmail:         $('regEmail'),
    regPass:          $('regPass'),
    regConfirm:       $('regConfirm'),
    regAlert:         $('regAlert'),
    regBtn:           $('regBtn'),
    regGoogleBtn:     $('regGoogleBtn'),
    toggleRegPass:    $('toggleRegPass'),
    toggleRegConfirm: $('toggleRegConfirm'),
    strengthBar:      $('strengthBar'),
    strengthLabel:    $('strengthLabel'),

    /* Forgot password overlay */
    forgotOverlay: $('forgotOverlay'),
    forgotEmail:   $('forgotEmail'),
    forgotAlert:   $('forgotAlert'),
    forgotBtn:     $('forgotBtn'),
    forgotClose:   $('forgotClose'),
    forgotOpen:    $('forgotOpen'),

    /* Success screen */
    successScreen: $('successScreen'),
};

/* ════════════════════════════════════════════════════════════════════
   FIX-1: NexusAuth safety wrapper
   If Firebase SDK / config failed, window.NexusAuth is undefined.
   Provide a no-op stub so the page degrades gracefully instead of crashing.
   ════════════════════════════════════════════════════════════════════ */
if (!window.NexusAuth) {
    console.warn('[NexusID Login] NexusAuth not found — Firebase may not be configured. Running in stub mode.');
    window.NexusAuth = {
        register:       () => Promise.reject({ code: 'auth/network-request-failed' }),
        login:          () => Promise.reject({ code: 'auth/network-request-failed' }),
        googleLogin:    () => Promise.reject({ code: 'auth/network-request-failed' }),
        forgotPassword: () => Promise.reject({ code: 'auth/network-request-failed' }),
        signOut:        () => Promise.resolve(),
        currentUser:    () => null,
        onAuthChanged:  () => () => {},   // returns unsubscribe no-op
        errorMessage:   code => {
            const MAP = {
                'auth/user-not-found':     'No account found with this email.',
                'auth/wrong-password':     'Incorrect password. Please try again.',
                'auth/invalid-email':      'Invalid email address format.',
                'auth/user-disabled':      'This account has been disabled.',
                'auth/invalid-credential': 'Invalid credentials. Please try again.',
                'auth/email-already-in-use':'An account with this email already exists.',
                'auth/weak-password':      'Password must be at least 6 characters.',
                'auth/popup-closed-by-user':'Google sign-in was cancelled.',
                'auth/popup-blocked':      'Browser blocked the sign-in popup. Please allow popups.',
                'auth/too-many-requests':  'Too many attempts. Please try again later.',
                'auth/network-request-failed':'Network error. Check your connection.',
            };
            return MAP[code] || 'An unexpected error occurred. Please try again.';
        },
    };
}

/* ════════════════════════════════════════════════════════════════════
   2. TAB SWITCHING
   FIX-5: aria-selected is now kept in sync with active state
   ════════════════════════════════════════════════════════════════════ */
function switchTab(tab) {
    const isLogin = tab === 'login';

    /* FIX-8: null-guard every element before touching it */
    if (DOM.tabLogin) {
        DOM.tabLogin.classList.toggle('active', isLogin);
        DOM.tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
    }
    if (DOM.tabRegister) {
        DOM.tabRegister.classList.toggle('active', !isLogin);
        DOM.tabRegister.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    }
    if (DOM.panelLogin) {
        DOM.panelLogin.classList.toggle('active', isLogin);
        /* FIX-INERT: inert prevents keyboard Tab reaching hidden panel fields */
        DOM.panelLogin.inert = !isLogin;
    }
    if (DOM.panelReg) {
        DOM.panelReg.classList.toggle('active', !isLogin);
        /* FIX-INERT: inert prevents keyboard Tab reaching hidden panel fields */
        DOM.panelReg.inert = isLogin;
    }

    clearAlerts();
}

DOM.tabLogin    && DOM.tabLogin.addEventListener('click',    () => switchTab('login'));
DOM.tabRegister && DOM.tabRegister.addEventListener('click', () => switchTab('register'));

/* ════════════════════════════════════════════════════════════════════
   3. PASSWORD VISIBILITY TOGGLE
   ════════════════════════════════════════════════════════════════════ */
function makeToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
        const shown = input.type === 'text';
        input.type = shown ? 'password' : 'text';
        const eyeOn  = btn.querySelector('.icon-eye');
        const eyeOff = btn.querySelector('.icon-eye-off');
        if (eyeOn)  eyeOn.style.display  =  shown ? '' : 'none';
        if (eyeOff) eyeOff.style.display =  shown ? 'none' : '';
    });
}

makeToggle(DOM.toggleLoginPass,    DOM.loginPass);
makeToggle(DOM.toggleRegPass,      DOM.regPass);
makeToggle(DOM.toggleRegConfirm,   DOM.regConfirm);

/* ════════════════════════════════════════════════════════════════════
   4. PASSWORD STRENGTH METER
   ════════════════════════════════════════════════════════════════════ */
DOM.regPass && DOM.regPass.addEventListener('input', () => {
    const val = DOM.regPass.value;
    const bar = DOM.strengthBar;
    const lbl = DOM.strengthLabel;
    if (!bar) return;

    bar.className = 'password-strength-bar';
    if (!val) { if (lbl) lbl.textContent = ''; return; }

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
        bar.classList.add('strength-weak');
        if (lbl) { lbl.textContent = 'Weak';   lbl.style.color = 'var(--c-red)'; }
    } else if (score <= 3) {
        bar.classList.add('strength-medium');
        if (lbl) { lbl.textContent = 'Medium'; lbl.style.color = 'var(--c-yellow)'; }
    } else {
        bar.classList.add('strength-strong');
        if (lbl) { lbl.textContent = 'Strong'; lbl.style.color = 'var(--c-accent2)'; }
    }
});

/* ════════════════════════════════════════════════════════════════════
   5. VALIDATION HELPERS
   ════════════════════════════════════════════════════════════════════ */
function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function setFieldError(input, msg) {
    if (!input) return;                              // FIX-6: null guard
    const wrap = input.closest('.login-field');
    const err  = wrap && wrap.querySelector('.field-error');
    input.classList.toggle('input-error', !!msg);
    if (err) {
        err.textContent = msg || '';
        err.classList.toggle('visible', !!msg);
    }
}

function clearFieldError(input) {
    setFieldError(input, '');
}

function clearAlerts() {
    /* FIX-6: filter out nulls before forEach */
    [DOM.loginAlert, DOM.regAlert, DOM.forgotAlert].forEach(el => {
        if (!el) return;
        el.classList.remove('visible', 'error', 'success', 'info');
        el.textContent = '';
    });
    [DOM.loginEmail, DOM.loginPass, DOM.regEmail, DOM.regPass, DOM.regConfirm, DOM.regName].forEach(el => {
        if (el) clearFieldError(el);
    });
}

function showAlert(el, type, msg) {
    if (!el) return;
    el.className = `login-alert ${type} visible`;
    el.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            ${type === 'success'
                ? '<polyline points="20 6 9 17 4 12"/>'
                : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span>${msg}</span>`;
}

/* ════════════════════════════════════════════════════════════════════
   6. BUTTON LOADING STATE + RATE-LIMIT GUARD
   FIX-RATELIMIT: prevents spam-clicking auth buttons before Firebase responds.
   Each button gets a 1500ms cooldown after being enabled again on error,
   so rapid repeated attempts are blocked client-side.
   ════════════════════════════════════════════════════════════════════ */
const _btnCooldowns = new WeakMap();

function setLoading(btn, loading) {
    if (!btn) return;
    /* If re-enabling after an error, apply a short cooldown */
    if (!loading) {
        const cooldownTimer = _btnCooldowns.get(btn);
        if (cooldownTimer) clearTimeout(cooldownTimer);
        /* Keep disabled for 1.5s after error to prevent rapid re-submission */
        btn.disabled = true;
        btn.classList.remove('loading');
        const t = setTimeout(() => { btn.disabled = false; }, 1500);
        _btnCooldowns.set(btn, t);
        return;
    }
    btn.disabled = true;
    btn.classList.add('loading');
}

/* ════════════════════════════════════════════════════════════════════
   7. SUCCESS ANIMATION → REDIRECT
   ════════════════════════════════════════════════════════════════════ */
function showSuccess(redirectTo = './index.html') {
    if (DOM.successScreen) {
        DOM.successScreen.classList.add('visible');
    }
    setTimeout(() => {
        window.location.href = redirectTo;
    }, 1600);
}

/* ════════════════════════════════════════════════════════════════════
   8. LOGIN FORM
   ════════════════════════════════════════════════════════════════════ */
DOM.loginBtn && DOM.loginBtn.addEventListener('click', async () => {
    const email = DOM.loginEmail ? DOM.loginEmail.value.trim() : '';
    const pass  = DOM.loginPass  ? DOM.loginPass.value         : '';
    let ok = true;

    clearAlerts();

    if (!email || !isValidEmail(email)) {
        setFieldError(DOM.loginEmail, 'Enter a valid email address.');
        ok = false;
    }
    if (!pass) {
        setFieldError(DOM.loginPass, 'Password is required.');
        ok = false;
    }
    if (!ok) return;

    setLoading(DOM.loginBtn, true);

    try {
        await window.NexusAuth.login(email, pass);
        showSuccess();
    } catch (err) {
        showAlert(DOM.loginAlert, 'error', window.NexusAuth.errorMessage(err.code));
        setLoading(DOM.loginBtn, false);
    }
});

/* Enter key on login fields */
[DOM.loginEmail, DOM.loginPass].forEach(el => {
    el && el.addEventListener('keydown', e => {
        if (e.key === 'Enter') DOM.loginBtn && DOM.loginBtn.click();
    });
});

/* Live clear errors */
DOM.loginEmail && DOM.loginEmail.addEventListener('input', () => clearFieldError(DOM.loginEmail));
DOM.loginPass  && DOM.loginPass.addEventListener('input',  () => clearFieldError(DOM.loginPass));

/* ════════════════════════════════════════════════════════════════════
   9. GOOGLE LOGIN
   ════════════════════════════════════════════════════════════════════ */
function handleGoogleLogin(alertEl, btn) {
    setLoading(btn, true);
    window.NexusAuth.googleLogin()
        .then(() => showSuccess())
        .catch(err => {
            showAlert(alertEl, 'error', window.NexusAuth.errorMessage(err.code));
            setLoading(btn, false);
        });
}

DOM.loginGoogleBtn && DOM.loginGoogleBtn.addEventListener('click',
    () => handleGoogleLogin(DOM.loginAlert, DOM.loginGoogleBtn));

DOM.regGoogleBtn && DOM.regGoogleBtn.addEventListener('click',
    () => handleGoogleLogin(DOM.regAlert, DOM.regGoogleBtn));

/* ════════════════════════════════════════════════════════════════════
   10. REGISTER FORM
   ════════════════════════════════════════════════════════════════════ */
DOM.regBtn && DOM.regBtn.addEventListener('click', async () => {
    const name    = DOM.regName    ? DOM.regName.value.trim()   : '';
    const email   = DOM.regEmail   ? DOM.regEmail.value.trim()  : '';
    const pass    = DOM.regPass    ? DOM.regPass.value          : '';
    const confirm = DOM.regConfirm ? DOM.regConfirm.value       : '';
    let ok = true;

    clearAlerts();

    if (!name) {
        setFieldError(DOM.regName, 'Full name is required.');
        ok = false;
    }
    if (!email || !isValidEmail(email)) {
        setFieldError(DOM.regEmail, 'Enter a valid email address.');
        ok = false;
    }
    if (pass.length < 6) {
        setFieldError(DOM.regPass, 'Password must be at least 6 characters.');
        ok = false;
    }
    if (pass !== confirm) {
        setFieldError(DOM.regConfirm, 'Passwords do not match.');
        ok = false;
    }
    if (!ok) return;

    setLoading(DOM.regBtn, true);

    try {
        const cred = await window.NexusAuth.register(email, pass);
        if (cred && cred.user && name) {
            await cred.user.updateProfile({ displayName: name }).catch(() => {});
        }
        showSuccess();
    } catch (err) {
        showAlert(DOM.regAlert, 'error', window.NexusAuth.errorMessage(err.code));
        setLoading(DOM.regBtn, false);
    }
});

/* Enter key on register fields */
[DOM.regName, DOM.regEmail, DOM.regPass, DOM.regConfirm].forEach(el => {
    el && el.addEventListener('keydown', e => {
        if (e.key === 'Enter') DOM.regBtn && DOM.regBtn.click();
    });
});

/* Live clear errors on register */
[DOM.regName, DOM.regEmail, DOM.regPass, DOM.regConfirm].forEach(el => {
    el && el.addEventListener('input', () => clearFieldError(el));
});

/* ════════════════════════════════════════════════════════════════════
   11. FORGOT PASSWORD OVERLAY
   ════════════════════════════════════════════════════════════════════ */
function openForgot() {
    if (DOM.forgotOverlay) {
        DOM.forgotOverlay.classList.add('open');
        DOM.forgotOverlay.removeAttribute('aria-hidden');
        setTimeout(() => DOM.forgotEmail && DOM.forgotEmail.focus(), 50);
    }
}

function closeForgot() {
    if (DOM.forgotOverlay) {
        DOM.forgotOverlay.classList.remove('open');
        DOM.forgotOverlay.setAttribute('aria-hidden', 'true');
        if (DOM.forgotAlert) DOM.forgotAlert.classList.remove('visible', 'error', 'success', 'info');
        if (DOM.forgotEmail) DOM.forgotEmail.value = '';
    }
}

DOM.forgotOpen  && DOM.forgotOpen.addEventListener('click',  openForgot);
DOM.forgotClose && DOM.forgotClose.addEventListener('click', closeForgot);

/* Close on backdrop click */
DOM.forgotOverlay && DOM.forgotOverlay.addEventListener('click', e => {
    if (e.target === DOM.forgotOverlay) closeForgot();
});

/* Close on Escape */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' &&
        DOM.forgotOverlay &&
        DOM.forgotOverlay.classList.contains('open')) {
        closeForgot();
    }
});

DOM.forgotBtn && DOM.forgotBtn.addEventListener('click', async () => {
    const email = DOM.forgotEmail ? DOM.forgotEmail.value.trim() : '';
    if (!email || !isValidEmail(email)) {
        showAlert(DOM.forgotAlert, 'error', 'Enter a valid email address.');
        return;
    }

    setLoading(DOM.forgotBtn, true);

    try {
        await window.NexusAuth.forgotPassword(email);
        showAlert(DOM.forgotAlert, 'success',
            'Reset link sent! Check your inbox (and spam folder).');
        setLoading(DOM.forgotBtn, false);
    } catch (err) {
        showAlert(DOM.forgotAlert, 'error', window.NexusAuth.errorMessage(err.code));
        setLoading(DOM.forgotBtn, false);
    }
});

DOM.forgotEmail && DOM.forgotEmail.addEventListener('keydown', e => {
    if (e.key === 'Enter') DOM.forgotBtn && DOM.forgotBtn.click();
});

/* ════════════════════════════════════════════════════════════════════
   12. AUTH STATE GUARD — redirect if already logged in
   FIX-2:      Wrapped in try/catch — bad Firebase config no longer crashes page
   FIX-TIMING: onAuthChanged fires immediately if user is cached (already logged in).
               This can happen before DOM is fully painted, skipping the success
               screen. We now wait for DOMContentLoaded before subscribing, and
               use a 200ms guard so the success animation has time to render
               before window.location.replace fires.
   ════════════════════════════════════════════════════════════════════ */
function _attachAuthGuard() {
    try {
        window.NexusAuth.onAuthChanged(user => {
            if (user) {
                /* Small guard: ensure success screen is visible before redirect */
                if (DOM.successScreen &&
                    DOM.successScreen.classList.contains('visible')) {
                    /* Already showing success — redirect is already scheduled */
                    return;
                }
                /*
                 * User was already logged in when page loaded (cached session).
                 * Show success briefly then redirect — avoids jarring blank flash.
                 */
                if (DOM.successScreen) {
                    DOM.successScreen.classList.add('visible');
                }
                setTimeout(() => {
                    window.location.replace('./index.html');
                }, 800);
            }
        });
    } catch (e) {
        console.warn('[NexusID Login] onAuthChanged error:', e);
    }
}

/* FIX-TIMING: subscribe only after DOM is ready */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attachAuthGuard);
} else {
    _attachAuthGuard(); // already ready (script deferred or at end of body)
}

/* ════════════════════════════════════════════════════════════════════
   13. CANVAS PARTICLE ANIMATION
   FIX-3: Debounced resize — no more excessive canvas resets on drag-resize
   FIX-4: resize no longer spawns a second RAF loop
   ════════════════════════════════════════════════════════════════════ */
(function initCanvas() {
    const canvas = $('login-bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W, H, nodes = [], raf = null;
    let resizeTimer = null;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createNode() {
        return {
            x:  Math.random() * W,
            y:  Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r:  Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
        };
    }

    function init() {
        resize();
        nodes = Array.from({ length: 60 }, createNode);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        /* Draw connecting lines */
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx   = nodes[i].x - nodes[j].x;
                const dy   = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0,180,255,${(1 - dist / 120) * 0.12})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        /* Draw nodes */
        nodes.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,180,255,${n.alpha})`;
            ctx.fill();

            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
        });

        raf = requestAnimationFrame(draw);
    }

    function startDraw() {
        if (raf) cancelAnimationFrame(raf); // FIX-4: cancel before starting
        raf = requestAnimationFrame(draw);
    }

    init();
    startDraw();

    /* FIX-3: debounced resize — only triggers 150ms after user stops resizing */
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
            /* redistribute nodes within new bounds */
            nodes.forEach(n => {
                if (n.x > W) n.x = Math.random() * W;
                if (n.y > H) n.y = Math.random() * H;
            });
        }, 150);
    });

    /* Pause when tab hidden (save battery) */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        } else {
            /* FIX-CANVAS-RACE: if tab was hidden before init() completed,
               W and H are undefined — ctx.clearRect(NaN) would silently fail.
               Re-init if dimensions are missing before restarting draw loop. */
            if (!W || !H) init();
            startDraw();
        }
    });
})();

/* ════════════════════════════════════════════════════════════════════
   14. REMEMBER ME — pre-fill email from localStorage
   FIX-7: Removed duplicate event listener (was added twice in original)
          Remember-me logic merged into the single loginBtn click handler
   ════════════════════════════════════════════════════════════════════ */
(function initRemember() {
    try {
        const saved = localStorage.getItem('nexusid_remember_email');
        if (saved && DOM.loginEmail) {
            DOM.loginEmail.value = saved;
            if (DOM.loginRemember) DOM.loginRemember.checked = true;
        }
    } catch (e) {
        /* localStorage may be blocked in private/restricted contexts */
        console.warn('[NexusID Login] localStorage unavailable:', e);
    }
})();

/* Save / clear remember-me on login — single handler using capture phase */
DOM.loginBtn && DOM.loginBtn.addEventListener('click', () => {
    try {
        const email = DOM.loginEmail && DOM.loginEmail.value.trim();
        if (DOM.loginRemember && DOM.loginRemember.checked && email) {
            localStorage.setItem('nexusid_remember_email', email);
        } else {
            localStorage.removeItem('nexusid_remember_email');
        }
    } catch (e) { /* localStorage blocked */ }
}, true); // capture phase — runs before the async login handler

/* ════════════════════════════════════════════════════════════════════
   READY
   ════════════════════════════════════════════════════════════════════ */
console.log('[NexusID Login] login.js v1.2.0 ready');
