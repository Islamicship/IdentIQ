/**
 * js/ocr.js — IdentIQ OCR Scanner (Saudi Iqama) — isolated module.
 *
 * Touches no other module. It only:
 *   1. drives the #tab-ocr UI and the floating #ocrInspector window,
 *   2. calls the iqama-ocr Netlify function,
 *   3. hands the result to extractor.js by writing into #inputText and
 *      dispatching a bubbling "input" event.
 *
 * Nothing in this file runs against IdentIQ's containers at load time: init
 * only wires listeners on OCR elements and resets OCR state. No events are
 * dispatched, and #dataCard / #inputText are touched only after a successful
 * scan (handoffToIntel).
 *
 * Load order: after moment.min.js, moment-hijri.min.js and main.js (all deferred).
 */
(() => {
  "use strict";

  /* ------------------------------------------------------------------
   * Config
   * ------------------------------------------------------------------ */
  const CONFIG = {
    NETLIFY_ABSOLUTE_ENDPOINT: "https://ident-lq.netlify.app/.netlify/functions/iqama-ocr",
    RELATIVE_ENDPOINT: "/.netlify/functions/iqama-ocr",

    MAX_WIDTH: 1200,
    MIN_WIDTH: 1100,
    JPEG_QUALITY: 0.75,
    MIN_QUALITY: 0.7,
    TARGET_BYTES: 350 * 1024,

    MAX_INPUT_BYTES: 25 * 1024 * 1024,
    REQUEST_TIMEOUT_MS: 15000,
    HANDOFF_DELAY_MS: 650,
    IDLE_WIPE_MS: 5 * 60 * 1000,

    ZOOM_MIN: 0.8,
    ZOOM_MAX: 4,
    ZOOM_STEP: 1.25,
  };

  const STAGES = ["upload", "compress", "ai", "done"];
  const STAGE_MESSAGES = {
    upload: "Reading your photo…",
    compress: "Resizing and compressing in your browser…",
    ai: "Sending the photo to Gemini and reading the card…",
    done: "Completed. Opening Identity Intel…",
  };

  /* ------------------------------------------------------------------
   * DOM
   * ------------------------------------------------------------------ */
  const $ = (selector, root = document) => root.querySelector(selector);
  const els = {
    tab: $("#tab-ocr"),
    dropzone: $("#ocrDropzone"),
    fileInput: $("#ocrFileInput"),
    preview: $("#ocrPreview"),
    previewImg: $("#ocrPreviewImg"),
    previewMeta: $("#ocrPreviewMeta"),
    scanBtn: $("#ocrScanBtn"),
    changeBtn: $("#ocrChangeBtn"),
    clearBtn: $("#ocrClearBtn"),
    steps: Array.from(document.querySelectorAll("#ocrSteps .ocr-step")),
    status: $("#ocrStatus"),
    // verification badge (Intel tab)
    viewRow: $("#ocrVerifyRow"),
    viewBtn: $("#ocrViewCardBtn"),
    // floating inspector
    insp: $("#ocrInspector"),
    inspHead: $("#ocrInspHead"),
    inspViewport: $("#ocrInspViewport"),
    inspImg: $("#ocrInspImg"),
    inspMeta: $("#ocrInspMeta"),
    zoomLabel: $("#ocrInspZoomLabel"),
    zoomIn: $("#ocrInspZoomIn"),
    zoomOut: $("#ocrInspZoomOut"),
    zoomReset: $("#ocrInspReset"),
    inspClose: $("#ocrInspClose"),
  };
  const required = ["tab", "dropzone", "fileInput", "scanBtn", "viewBtn", "insp", "inspHead", "inspViewport", "inspImg"];
  if (required.some((k) => !els[k])) {
    console.warn("[ocr] Markup incomplete, OCR module stays inactive.");
    return;
  }

  const state = {
    file: null,
    url: null,
    busy: false,
    scannedAt: null,
    idleTimer: 0,
    inspPlaced: false,
    inspUrl: null,
  };

  class OcrError extends Error {
    constructor(code, message, status) {
      super(message);
      this.name = "OcrError";
      this.code = code;
      this.status = status || 0;
    }
  }

  const frames = (n = 1) =>
    new Promise((resolve) => {
      const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step));
      step();
    });

  /* ------------------------------------------------------------------
   * Feedback: reuse the app's #gen-toast element (CSS lives in style.css)
   * ------------------------------------------------------------------ */
      function toast(message, kind = "info", ms = 3600) {
    if (window.IS && IS.showToast) IS.showToast(message, kind === "ok" ? undefined : kind, ms);
  }

  function setStatus(message, isError = false) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  /* ------------------------------------------------------------------
   * Tab switching (uses the real nav button; manual fallback if needed)
   * ------------------------------------------------------------------ */
  async function activateTab(id) {
    const target = document.getElementById(id);
    if (!target) throw new Error("Tab not found: " + id);
    const btn = document.querySelector('.nav-tab[data-target="' + id + '"]');
    if (btn) btn.click();
    await frames(2);

    if (getComputedStyle(target).display === "none") {
      document.querySelectorAll(".app-section").forEach((section) => {
        const on = section === target;
        section.style.display = on ? "" : "none";
        section.classList.toggle("active-section", on);
      });
      document.querySelectorAll(".nav-tab[data-target]").forEach((tab) => {
        const on = tab.getAttribute("data-target") === id;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    await frames(1);
  }

  const isOcrTabVisible = () => getComputedStyle(els.tab).display !== "none";

  /* ------------------------------------------------------------------
   * Step tracker
   * ------------------------------------------------------------------ */
  function setStage(stage, failed = false) {
    const idx = STAGES.indexOf(stage);
    els.steps.forEach((li, i) => {
      li.classList.remove("is-active", "is-done", "is-error");
      if (failed) {
        if (i < idx) li.classList.add("is-done");
        else if (i === idx) li.classList.add("is-error");
      } else if (stage === "done" || i < idx) {
        li.classList.add("is-done");
      } else if (i === idx) {
        li.classList.add("is-active");
      }
    });
    if (!failed) setStatus(STAGE_MESSAGES[stage]);
  }

  function resetStages() {
    els.steps.forEach((li) => li.classList.remove("is-active", "is-done", "is-error"));
  }

  /* ==================================================================
   * FLOATING CARD INSPECTOR
   * Non-modal: no backdrop, no blur, no focus trap, no scroll lock.
   * ================================================================== */
  const view = { s: 1, x: 0, y: 0 }; // zoom scale + pan offset (px, viewport space)
  let animTimer = 0;

  const isInspOpen = () => els.insp.classList.contains("is-open");
  const viewportSize = () => ({ w: els.inspViewport.clientWidth, h: els.inspViewport.clientHeight });
  const pageSize = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight });

  /* ----- zoom / pan ----- */
  function clampView() {
    const { w, h } = viewportSize();
    if (view.s <= 1) {
      // At or below fit: keep centred (no panning).
      view.x = (w - w * view.s) / 2;
      view.y = (h - h * view.s) / 2;
    } else {
      view.x = Math.min(0, Math.max(w - w * view.s, view.x));
      view.y = Math.min(0, Math.max(h - h * view.s, view.y));
    }
  }

  function applyView(animate = false) {
    clampView();
    if (animate) {
      els.inspViewport.classList.add("is-animating");
      clearTimeout(animTimer);
      animTimer = setTimeout(() => els.inspViewport.classList.remove("is-animating"), 220);
    }
    els.inspImg.style.transform = "translate(" + view.x + "px, " + view.y + "px) scale(" + view.s + ")";
    els.inspViewport.classList.toggle("is-zoomed", view.s > 1.001);
    if (els.zoomLabel) els.zoomLabel.textContent = Math.round(view.s * 100) + "%";
  }

  function resetView(animate = false) {
    view.s = 1;
    view.x = 0;
    view.y = 0;
    applyView(animate);
  }

  /** Zoom to `next`, keeping the point (px, py) — viewport coordinates — fixed under the cursor. */
  function zoomAt(next, px, py, animate = false) {
    const ns = Math.min(CONFIG.ZOOM_MAX, Math.max(CONFIG.ZOOM_MIN, next));
    if (Math.abs(ns - view.s) < 0.0005) return;
    const ratio = ns / view.s;
    view.x = px - (px - view.x) * ratio;
    view.y = py - (py - view.y) * ratio;
    view.s = ns;
    applyView(animate);
  }

  function zoomByStep(direction) {
    const { w, h } = viewportSize();
    const factor = direction > 0 ? CONFIG.ZOOM_STEP : 1 / CONFIG.ZOOM_STEP;
    zoomAt(view.s * factor, w / 2, h / 2, true);
  }

  els.inspViewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault(); // zoom the image, don't scroll the page
      const rect = els.inspViewport.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 0.05 : 0.0016; // lines vs pixels
      const boost = e.ctrlKey ? 3 : 1; // trackpad pinch arrives as ctrl+wheel
      zoomAt(view.s * Math.exp(-e.deltaY * unit * boost), e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false }
  );

  els.inspViewport.addEventListener("dblclick", (e) => {
    e.preventDefault();
    resetView(true);
  });

  // Pointer-based pan (mouse + touch) and two-finger pinch.
  const pointers = new Map();
  let pinch = null;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  els.inspViewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { els.inspViewport.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinch = { d: Math.max(1, dist(a, b)), s: view.s };
    }
    if (view.s > 1.001) els.inspViewport.classList.add("is-panning");
  });

  els.inspViewport.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);

    if (pointers.size === 2 && pinch) {
      const [a, b] = Array.from(pointers.values());
      const rect = els.inspViewport.getBoundingClientRect();
      zoomAt(pinch.s * (dist(a, b) / pinch.d), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    } else if (pointers.size === 1 && view.s > 1.001) {
      view.x += cur.x - prev.x;
      view.y += cur.y - prev.y;
      applyView();
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) els.inspViewport.classList.remove("is-panning");
  };
  els.inspViewport.addEventListener("pointerup", endPointer);
  els.inspViewport.addEventListener("pointercancel", endPointer);

  /* ----- window placement: drag, clamp, resize ----- */
  function placeAt(left, top) {
    const r = els.insp.getBoundingClientRect();
    const page = pageSize();
    const l = Math.min(Math.max(0, left), Math.max(0, page.w - r.width));
    const t = Math.min(Math.max(0, top), Math.max(0, page.h - r.height));
    els.insp.style.left = l + "px";
    els.insp.style.top = t + "px";
    els.insp.style.right = "auto";
    els.insp.style.bottom = "auto";
  }

  /** Switch from the CSS `right: 30px` anchor to explicit left/top so native resize grows right/down. */
  function anchorTopLeft() {
    const r = els.insp.getBoundingClientRect();
    placeAt(r.left, r.top);
  }

  /** Keep the window inside the viewport after a page resize or a user resize. */
  function keepInViewport() {
    if (!isInspOpen() || !els.insp.style.left) return;
    const r = els.insp.getBoundingClientRect();
    const page = pageSize();
    // If the user stretched it past the edge, shrink instead of shoving the window around.
    if (r.right > page.w) els.insp.style.width = Math.max(300, page.w - r.left) + "px";
    if (r.bottom > page.h) els.insp.style.height = Math.max(220, page.h - r.top) + "px";
    const r2 = els.insp.getBoundingClientRect();
    placeAt(r2.left, r2.top);
  }

  let drag = null;
  els.inspHead.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; // header buttons stay clickable
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const r = els.insp.getBoundingClientRect();
    drag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { els.inspHead.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    els.insp.classList.add("is-dragging");
  });
  els.inspHead.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    placeAt(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    els.insp.classList.remove("is-dragging");
  };
  els.inspHead.addEventListener("pointerup", endDrag);
  els.inspHead.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", () => {
    keepInViewport();
    if (isInspOpen()) applyView();
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (!isInspOpen()) return;
      keepInViewport();
      applyView(); // viewport box changed: re-clamp pan so the image never drifts out of frame
    }).observe(els.insp);
  }

  /* ----- open / close ----- */
  function openInspector() {
    if (!state.url) return;
    if (state.inspUrl !== state.url) {
      els.inspImg.src = state.url;
      state.inspUrl = state.url;
      resetView(false);
    }
    if (els.inspMeta) {
      els.inspMeta.textContent =
        (state.file ? state.file.name + " · " + formatKb(state.file.size) : "") +
        (state.scannedAt ? " · scanned " + state.scannedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "") +
        "  |  wheel = zoom · drag = pan · double-click = reset";
    }
    els.insp.classList.add("is-open");
    els.viewBtn.setAttribute("aria-expanded", "true");
    if (!state.inspPlaced) {
      anchorTopLeft();
      state.inspPlaced = true;
    } else {
      keepInViewport();
    }
    applyView();
    resetIdleTimer();
  }

  function closeInspector(restoreFocus = true) {
    if (!isInspOpen()) return;
    els.insp.classList.remove("is-open", "is-dragging");
    els.viewBtn.setAttribute("aria-expanded", "false");
    drag = null;
    pointers.clear();
    pinch = null;
    if (restoreFocus && !els.viewBtn.hidden && document.contains(els.viewBtn)) els.viewBtn.focus({ preventScroll: true });
  }

  function setVerifyVisible(on) {
    if (els.viewRow) els.viewRow.hidden = !on;
    els.viewBtn.hidden = !on;
  }

  els.viewBtn.setAttribute("aria-expanded", "false");
  els.viewBtn.addEventListener("click", () => (isInspOpen() ? closeInspector(false) : openInspector()));
  if (els.inspClose) els.inspClose.addEventListener("click", () => closeInspector(true));
  if (els.zoomIn) els.zoomIn.addEventListener("click", () => zoomByStep(1));
  if (els.zoomOut) els.zoomOut.addEventListener("click", () => zoomByStep(-1));
  if (els.zoomReset) els.zoomReset.addEventListener("click", () => resetView(true));

  // Keyboard, only while focus is inside the inspector (the rest of the page is never intercepted).
  els.insp.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeInspector(true);
    } else if (e.key === "+" || e.key === "=") {
      zoomByStep(1);
    } else if (e.key === "-" || e.key === "_") {
      zoomByStep(-1);
    } else if (e.key === "0") {
      resetView(true);
    }
  });

  /* ------------------------------------------------------------------
   * File handling / preview / privacy wipe
   * ------------------------------------------------------------------ */
  const formatKb = (bytes) => Math.max(1, Math.round(bytes / 1024)) + " KB";

  function setBusy(on) {
    state.busy = on;
    const hasFile = Boolean(state.file);
    els.scanBtn.disabled = on || !hasFile;
    els.changeBtn.disabled = on || !hasFile;
    els.clearBtn.disabled = on || !hasFile;
    els.scanBtn.classList.toggle("is-busy", on);
    els.scanBtn.setAttribute("aria-busy", on ? "true" : "false");
    const label = $(".ocr-scan-label", els.scanBtn);
    if (label) label.textContent = on ? "Scanning…" : "Scan Iqama Card";
    els.preview.classList.toggle("is-scanning", on);
  }

  function showPreview(file) {
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = URL.createObjectURL(file);
    els.previewImg.src = state.url;
    els.previewMeta.textContent = (file.name || "photo") + " · " + formatKb(file.size);
    els.preview.hidden = false;
    els.dropzone.hidden = true;
  }

  function clearFile({ silent = false } = {}) {
    if (state.busy) return;
    closeInspector(false);
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = null;
    state.inspUrl = null;
    state.file = null;
    state.scannedAt = null;
    els.previewImg.removeAttribute("src");
    els.inspImg.removeAttribute("src");
    els.preview.hidden = true;
    els.dropzone.hidden = false;
    els.fileInput.value = "";
    setVerifyVisible(false);
    resetStages();
    setStatus(silent ? "" : "Choose a card photo to begin.");
    setBusy(false);
    clearTimeout(state.idleTimer);
  }

  function resetIdleTimer() {
    clearTimeout(state.idleTimer);
    if (!state.file) return;
    state.idleTimer = setTimeout(() => {
      if (state.busy) return resetIdleTimer();
      clearFile();
      toast("Scanned card photo wiped after 5 minutes of inactivity.", "info", 4500);
    }, CONFIG.IDLE_WIPE_MS);
  }

  function acceptFile(file) {
    if (state.busy) return toast("A scan is running. Wait for it to finish.", "error");
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) return toast("That file is not an image. Choose a JPG, PNG or WebP photo.", "error");
    if (file.size > CONFIG.MAX_INPUT_BYTES) return toast("That photo is larger than 25 MB. Choose a smaller one.", "error");
    closeInspector(false); // the inspector must never show a previous card
    state.file = file;
    state.scannedAt = null;
    state.inspUrl = null;
    showPreview(file);
    setVerifyVisible(false); // only offered for a card that has been scanned
    resetStages();
    setStatus("Photo ready. Press “Scan Iqama Card”.");
    setBusy(false);
    resetIdleTimer();
  }

  /* ------------------------------------------------------------------
   * Canvas preprocessor
   * ------------------------------------------------------------------ */
  async function decodeImage(file) {
    if ("createImageBitmap" in window) {
      try {
        return await createImageBitmap(file); // honours EXIF orientation
      } catch (_) {
        /* fall back to <img> */
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => (URL.revokeObjectURL(url), resolve(img));
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new OcrError("DECODE", "This browser cannot open that image. HEIC is not supported — convert to JPG or PNG and retry."));
      };
      img.src = url;
    });
  }

  const canvasToBlob = (canvas, quality) =>
    new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new OcrError("ENCODE", "Could not encode the image as JPEG."))), "image/jpeg", quality)
    );

  async function compressImage(source) {
    const srcW = source.naturalWidth || source.width;
    const srcH = source.naturalHeight || source.height;
    if (!srcW || !srcH) throw new OcrError("DECODE", "The image has no readable size.");

    let width = Math.min(srcW, CONFIG.MAX_WIDTH);
    let quality = CONFIG.JPEG_QUALITY;
    let best = null;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const height = Math.max(1, Math.round((srcH * width) / srcW));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new OcrError("ENCODE", "Canvas is not available in this browser.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, quality);
      best = { blob, width, height, quality };
      if (blob.size <= CONFIG.TARGET_BYTES) break;

      if (quality > CONFIG.MIN_QUALITY + 0.001) quality = Math.max(CONFIG.MIN_QUALITY, Math.round((quality - 0.05) * 100) / 100);
      else if (width > CONFIG.MIN_WIDTH) width = Math.max(CONFIG.MIN_WIDTH, Math.round(width * 0.92));
      else break;
    }
    if (typeof source.close === "function") source.close();
    return best;
  }

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const out = String(reader.result || "");
        resolve(out.slice(out.indexOf(",") + 1));
      };
      reader.onerror = () => reject(new OcrError("ENCODE", "Could not read the compressed image."));
      reader.readAsDataURL(blob);
    });

  /* ------------------------------------------------------------------
   * Dual-host routing guard
   * ------------------------------------------------------------------ */
  function resolveEndpoint() {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host === "github.io" || host.endsWith(".github.io")) return CONFIG.NETLIFY_ABSOLUTE_ENDPOINT;
    return CONFIG.RELATIVE_ENDPOINT;
  }

    async function callApi(base64) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(resolveEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: "image/jpeg" }),
        signal: controller.signal,
      });
      let body = null;
      try {
        body = await response.json();
      } catch (err) {
        if (err && err.name === "AbortError") throw err;
        throw new OcrError("NOT_JSON", "The OCR server did not return JSON (HTTP " + response.status + ").", response.status);
      }
      if (!response.ok || !body || body.success !== true) {
        const e = (body && body.error) || {};
        throw new OcrError(e.code || "HTTP_" + response.status, e.message || "Request failed with HTTP " + response.status + ".", response.status);
      }
      return body;
    } catch (err) {
      if (err instanceof OcrError) throw err;
      if (err && err.name === "AbortError") throw new OcrError("CLIENT_TIMEOUT", "The server took too long to answer. Try again.");
      throw new OcrError("NETWORK", "Could not reach the OCR server. Check your connection and try again.");
    } finally {
      clearTimeout(timer);
    }
  }

  /* ------------------------------------------------------------------
   * Date helpers + deterministic Hijri fallback (moment-hijri)
   * ------------------------------------------------------------------ */
  const pad2 = (n) => String(n).padStart(2, "0");

  function normalizeDate(value) {
    const s = String(value || "").trim().replace(/\s+/g, "");
    let m = s.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
    if (m) return m[1] + "/" + pad2(m[2]) + "/" + pad2(m[3]);
    m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
    if (m) return m[3] + "/" + pad2(m[2]) + "/" + pad2(m[1]);
    return "";
  }

  const yearOf = (d) => (d ? Number(d.slice(0, 4)) : 0);
  const hijriReady = () => typeof window.moment === "function" && window.moment.fn && typeof window.moment.fn.iYear === "function";

  function gregorianToHijri(g) {
    if (!hijriReady() || !g) return "";
    const m = window.moment(g, "YYYY/MM/DD", true);
    if (!m.isValid()) return "";
    const out = m.format("iYYYY/iMM/iDD");
    return /^\d{4}\/\d{2}\/\d{2}$/.test(out) ? out : "";
  }

  function hijriToGregorian(h) {
    if (!hijriReady() || !h) return "";
    const m = window.moment(h, "iYYYY/iMM/iDD", true);
    if (!m.isValid()) return "";
    const out = m.format("YYYY/MM/DD");
    return /^\d{4}\/\d{2}\/\d{2}$/.test(out) ? out : "";
  }

  function prepareRecord(data, serverWarnings) {
    const warnings = [];
    const digits = String((data && data.iqama_number) || "").replace(/\D/g, "");
    const arabic = String((data && data.arabic_name) || "").replace(/\s+/g, " ").trim();
    const english = String((data && data.english_name) || "").replace(/\s+/g, " ").trim();
    let g = normalizeDate(data && data.dob_gregorian);
    let h = normalizeDate(data && data.dob_hijri);

    // Calendar mix-up guard: 13xx/14xx is Hijri, 19xx/20xx is Gregorian.
    if (g && !h && yearOf(g) < 1700) { h = g; g = ""; }
    else if (h && !g && yearOf(h) >= 1700) { g = h; h = ""; }
    else if (g && h && yearOf(g) < 1700 && yearOf(h) >= 1700) { [g, h] = [h, g]; }

    let filledG = false;
    let filledH = false;
    if (g && !h) {
      const calc = gregorianToHijri(g);
      if (calc) {
        h = calc;
        filledH = true;
        warnings.push("Hijri date was calculated from the Gregorian date (Umm al-Qura) and can differ by a day from the card.");
      } else {
        warnings.push("Hijri date could not be calculated. The Gregorian date was still passed on.");
      }
    } else if (h && !g) {
      const calc = hijriToGregorian(h);
      if (calc) {
        g = calc;
        filledG = true;
        warnings.push("Gregorian date was calculated from the Hijri date and can differ by a day from the card.");
      }
    }

    (serverWarnings || []).forEach((w) => {
      if (filledH && /^Hijri date of birth was not read/i.test(w)) return;
      if (filledG && /^Gregorian date of birth was not read/i.test(w)) return;
      warnings.push(w);
    });

    return { iqama: digits, arabic, english, gregorian: g, hijri: h, warnings };
  }

  /* ------------------------------------------------------------------
   * Synthetic paste handoff → extractor.js
   * ------------------------------------------------------------------ */
  function buildPasteBlock(r) {
    return [r.iqama, r.arabic, r.english, r.gregorian, r.hijri].filter(Boolean).join("\n");
  }

  async function handoffToIntel(record) {
    await activateTab("tab-extractor");
    const input = document.getElementById("inputText");
    if (!input) throw new OcrError("NO_TERMINAL", "Identity Intel input terminal (#inputText) was not found.");
    input.value = buildPasteBlock(record);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const card = document.getElementById("dataCard");
    if (card) setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
  }

  /* ------------------------------------------------------------------
   * Scan flow
   * ------------------------------------------------------------------ */
  async function runScan() {
    if (!state.file || state.busy) return;
    setBusy(true);
    setVerifyVisible(false);
    resetIdleTimer();

    let stage = "upload";
    try {
      setStage("upload");
      await frames(1);
      const bitmap = await decodeImage(state.file);

      stage = "compress";
      setStage("compress");
      await frames(1);
      const packed = await compressImage(bitmap);
      const base64 = await blobToBase64(packed.blob);
      els.previewMeta.textContent = (state.file.name || "photo") + " · sent " + formatKb(packed.blob.size) + " @ " + packed.width + "×" + packed.height;

      stage = "ai";
      setStage("ai");
      const body = await callApi(base64);

      const record = prepareRecord(body.data || {}, body.meta && body.meta.warnings);
      if (!record.iqama && !record.arabic && !record.english && !record.gregorian && !record.hijri) {
        throw new OcrError("NOTHING_READ", "Nothing could be read from this photo. Use a sharper, well-lit, full-card photo.");
      }

      state.scannedAt = new Date();
      stage = "done";
      setStage("done");
      setVerifyVisible(true);
      resetIdleTimer();

      await new Promise((resolve) => setTimeout(resolve, CONFIG.HANDOFF_DELAY_MS));
      await handoffToIntel(record);

      if (record.warnings.length) {
        const extra = record.warnings.length > 1 ? " (+" + (record.warnings.length - 1) + " more)" : "";
        toast(record.warnings[0] + extra, "info", 7000);
      } else {
        toast("Card read. Compare the fields with the scanned card.", "ok", 3600);
      }
    } catch (err) {
      const message = err && err.message ? err.message : "Something went wrong.";
      setStage(stage === "done" ? "ai" : stage, true);
      setStatus(message, true);
      toast(message, "error", 6500);
      console.error("[ocr]", err && err.code ? err.code : "CLIENT_ERROR", message);
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------------
   * Events
   * ------------------------------------------------------------------ */
  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      els.fileInput.click();
    }
  });
  els.fileInput.addEventListener("change", () => {
    const file = els.fileInput.files && els.fileInput.files[0];
    if (file) acceptFile(file);
    els.fileInput.value = "";
  });

  let dragDepth = 0;
  els.tab.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragDepth += 1;
    els.dropzone.classList.add("is-dragging");
  });
  els.tab.addEventListener("dragover", (e) => e.preventDefault());
  els.tab.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) els.dropzone.classList.remove("is-dragging");
  });
  els.tab.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    els.dropzone.classList.remove("is-dragging");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) acceptFile(file);
  });

  // Image paste (Ctrl+V) only while the OCR tab is visible; text pastes are never touched.
  document.addEventListener("paste", (e) => {
    if (!isOcrTabVisible()) return;
    const items = e.clipboardData && e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
    const img = items.find((it) => it.kind === "file" && it.type.startsWith("image/"));
    if (!img) return;
    const file = img.getAsFile();
    if (file) {
      e.preventDefault();
      acceptFile(file);
    }
  });

  els.scanBtn.addEventListener("click", runScan);
  els.changeBtn.addEventListener("click", () => !state.busy && els.fileInput.click());
  els.clearBtn.addEventListener("click", () => clearFile());
    window.addEventListener("IS_privacy_wipe", () => clearFile({ silent: true }));

  // Activity inside the OCR UI counts for the privacy wipe.
  ["click", "keydown", "pointerdown"].forEach((type) => {
    els.tab.addEventListener(type, resetIdleTimer, { passive: true });
    els.insp.addEventListener(type, resetIdleTimer, { passive: true });
  });
  els.inspViewport.addEventListener("wheel", resetIdleTimer, { passive: true });

  /* ------------------------------------------------------------------
   * Init (OCR-only; dispatches nothing, touches no IdentIQ container)
   * ------------------------------------------------------------------ */
  setVerifyVisible(false);
  resetStages();
  setBusy(false);
  setStatus("Choose a card photo to begin.");
})();