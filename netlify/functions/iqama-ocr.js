"use strict";

/**
 * netlify/functions/iqama-ocr.js
 * POST /.netlify/functions/iqama-ocr
 *
 * Request  (JSON): { "image": "<base64 or data URL>", "mimeType": "image/jpeg" }
 * Response (JSON): { success: true, data: {5 fields}, meta: { model, latency_ms, warnings[] } }
 *                  { success: false, error: { code, message } }
 *
 * Env:  GEMINI_API_KEY (required, scope: Functions)
 *       GEMINI_MODEL (optional override, default gemini-3.5-flash-lite)
 *       ALLOWED_ORIGINS (optional, comma-separated extra origins)
 *       GEMINI_DEADLINE_MS (optional, default 9000 — keep below the function timeout)
 *
 * Needs Node 18+ (native fetch). No npm dependencies.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODELS = ["gemini-3.5-flash-lite", "gemini-2.5-flash"];

// Netlify sync functions are cut off at 10 s by default. Abort earlier so the client gets clean JSON.
const DEADLINE_MS = Math.max(3000, Number(process.env.GEMINI_DEADLINE_MS) || 9000);

// 4M base64 chars (~3 MB binary): generous ceiling, below Netlify's 6 MB request limit.
const MAX_BASE64_CHARS = 4000000;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/* ---------- CORS ---------- */

const ALLOWED_ORIGINS = new Set(
  [
    "https://islamicship.github.io",
    "https://ident-lq.netlify.app",
    ...(process.env.NETLIFY_DEV === "true" ? ["http://localhost:8888", "http://127.0.0.1:8888", "http://localhost:3000"] : []),
    ...(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
  ]
);

function getOrigin(event) {
  const h = event.headers || {};
  return String(h.origin || h.Origin || "").trim();
}
const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear();
  return arr.length > 8;
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

const SAFETY_SETTINGS = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_CIVIC_INTEGRITY",
].map((category) => ({ category, threshold: "BLOCK_NONE" }));

/* ---------- Strict schema + prompt ---------- */

const FIELD_ORDER = ["iqama_number", "arabic_name", "english_name", "dob_hijri", "dob_gregorian"];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    iqama_number: { type: "STRING", description: "10-digit residence (Iqama) number, Western digits 0-9 only. Empty string if unreadable." },
    arabic_name: { type: "STRING", description: "Holder's full name in Arabic script exactly as printed. Empty string if unreadable." },
    english_name: { type: "STRING", description: "Holder's full name in English letters exactly as printed. Empty string if unreadable." },
    dob_hijri: { type: "STRING", description: "Hijri date of birth as YYYY/MM/DD, Western digits. Empty string if not printed or unreadable." },
    dob_gregorian: { type: "STRING", description: "Gregorian date of birth as YYYY/MM/DD, Western digits. Empty string if not printed or unreadable." },
  },
  required: FIELD_ORDER,
  propertyOrdering: FIELD_ORDER,
};

const PROMPT = [
  "You are a strict OCR engine for Saudi Arabian Residence Identity cards (Iqama). The image is a photo of one card.",
  "Read the card and return the requested fields accurately.",
  "",
  "Rules:",
  "- Copy values exactly as printed. Never guess, infer or invent a value.",
  "- If a field is missing, blurred, cut off or not printed, return an empty string \"\" for that field.",
  "- iqama_number: the 10-digit residence number (label رقم الهوية or الرقم). Output Western digits 0-9 only (convert Arabic-Indic digits).",
  "- arabic_name: the holder's full name in Arabic script, as printed next to the label الاسم.",
  "- english_name: the holder's full name in English letters, as printed on the card.",
  "",
  "CRITICAL RULES FOR DATE OF BIRTH (الميلاد):",
  "- ONLY extract dates from the label 'الميلاد' or 'تاريخ الميلاد'.",
  "- STRICTLY FORBIDDEN: Do NOT extract dates from 'الإصدار' (Issue Date) or 'الانتهاء' (Expiry Date) as birth dates. 'الإصدار' is the card issue date, NOT birth date!",
  "- If the date printed next to 'الميلاد' starts with 19xx or 20xx, assign it to 'dob_gregorian' (YYYY/MM/DD), and leave 'dob_hijri' as empty string \"\".",
  "- If the date printed next to 'الميلاد' starts with 13xx or 14xx, assign it to 'dob_hijri' (YYYY/MM/DD), and leave 'dob_gregorian' as empty string \"\".",
  "- Only populate both if BOTH dates are explicitly printed under or next to 'الميلاد'.",
  "- If a date is printed day-first, reorder it to YYYY/MM/DD using Western digits 0-9.",
  "- Do NOT convert calendars. Only report what is explicitly under 'الميلاد'.",
  "",
  "- Ignore all other fields (profession, employer, nationality, issue place, issue date, expiry date).",
].join("\n");

/* ---------- Helpers ---------- */

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function respond(statusCode, body, headers) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
    body: JSON.stringify(body),
  };
}
const failure = (status, code, message, headers) => respond(status, { success: false, error: { code, message } }, headers);

function getModels() {
  const fromEnv = (process.env.GEMINI_MODEL || "").trim();
  if (!fromEnv) return DEFAULT_MODELS.slice();
  return [fromEnv, ...DEFAULT_MODELS.filter((m) => m !== fromEnv)];
}

/* ---------- Request parsing ---------- */

function parseRequest(event) {
  let raw = event.body || "";
  if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
  if (!raw) throw new HttpError(400, "EMPTY_BODY", "Request body is empty. Send JSON: { \"image\": \"<base64>\", \"mimeType\": \"image/jpeg\" }.");

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    throw new HttpError(400, "INVALID_JSON", "Request body is not valid JSON.");
  }
  if (!payload || typeof payload !== "object") throw new HttpError(400, "INVALID_JSON", "Request body must be a JSON object.");

  let image = typeof payload.image === "string" ? payload.image.trim() : "";
  let mimeType = typeof payload.mimeType === "string" ? payload.mimeType.trim().toLowerCase() : "";

  const dataUrl = image.match(/^data:([\w/+.-]+);base64,/i);
  if (dataUrl) {
    if (!mimeType) mimeType = dataUrl[1].toLowerCase();
    image = image.slice(dataUrl[0].length);
  }
  image = image.replace(/\s+/g, "");
  mimeType = mimeType || "image/jpeg";

  if (!image) throw new HttpError(400, "MISSING_IMAGE", "Field \"image\" is required (base64 string or data URL).");
  if (!ALLOWED_MIME.has(mimeType)) throw new HttpError(400, "UNSUPPORTED_MIME", "Unsupported image type \"" + mimeType + "\". Use JPEG, PNG or WebP.");
  if (image.length > MAX_BASE64_CHARS) throw new HttpError(413, "IMAGE_TOO_LARGE", "Image payload is too large. Compress the image (max width 1200 px, JPEG) before sending.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new HttpError(400, "INVALID_BASE64", "Field \"image\" is not valid base64.");
  return { image, mimeType };
}

/* ---------- Gemini call ---------- */

async function callGemini({ model, apiKey, image, mimeType, signal }) {
  const response = await fetch(GEMINI_ENDPOINT + "/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey, // header, not ?key=, so the key never lands in URL logs
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: PROMPT }, { inlineData: { mimeType, data: image } }] }],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
    signal,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    /* non-JSON upstream body */
  }
  return { ok: response.ok, status: response.status, json };
}

function upstreamToHttpError(result, model) {
  const g = result.json && result.json.error ? result.json.error : {};
  const googleMessage = String(g.message || "Gemini returned HTTP " + result.status + ".").slice(0, 300);
  console.error("[upstream " + result.status + "] model=" + model + " " + googleMessage);

  const unavailable = new HttpError(503, "SERVICE_UNAVAILABLE", "OCR service is temporarily unavailable. Please try again later.");
  const reason = (Array.isArray(g.details) ? g.details.map((d) => d && d.reason).find(Boolean) : "") || "";

  if (reason === "API_KEY_INVALID" || /api key not valid/i.test(googleMessage)) return unavailable;
  if (result.status === 401 || result.status === 403 || result.status === 404) return unavailable;
  if (result.status === 429) return new HttpError(429, "RATE_LIMITED", "Quota or rate limit reached. Wait a minute and retry.");
  if (result.status === 400) {
    if (/image|inline_data|inlineData/i.test(googleMessage)) {
      return new HttpError(400, "UNREADABLE_IMAGE", "Gemini could not process this image. Try a different photo.");
    }
    return unavailable;
  }
  if (result.status >= 500) return new HttpError(502, "GEMINI_UNAVAILABLE", "Gemini is temporarily unavailable. Retry in a few seconds.");
  return new HttpError(502, "GEMINI_ERROR", "OCR provider error. Please try again.");
}

function readModelOutput(json) {
  const blockReason = json && json.promptFeedback && json.promptFeedback.blockReason;
  if (blockReason) throw new HttpError(422, "BLOCKED_BY_MODEL", "Gemini blocked this image (" + blockReason + "). Try a clearer photo of the card.");

  const candidate = json && Array.isArray(json.candidates) ? json.candidates[0] : null;
  if (!candidate) throw new HttpError(502, "NO_CANDIDATES", "Gemini returned no result for this image. Retry with a clearer photo.");

  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
  const text = parts.map((p) => (p && typeof p.text === "string" ? p.text : "")).join("").trim();
  if (!text) throw new HttpError(502, "EMPTY_RESPONSE", "Gemini returned an empty answer (finishReason: " + (candidate.finishReason || "unknown") + ").");

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (_) {
    const hint = candidate.finishReason === "MAX_TOKENS" ? " The answer was cut off (MAX_TOKENS)." : "";
    throw new HttpError(502, "BAD_MODEL_OUTPUT", "Gemini did not return valid JSON." + hint);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new HttpError(502, "BAD_MODEL_OUTPUT", "Gemini returned JSON in an unexpected shape.");
  return parsed;
}

/* ---------- Normalisation and sanity checks ---------- */

function toWesternDigits(value) {
  return String(value)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}
const cleanText = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

function normaliseDate(value) {
  const s = toWesternDigits(cleanText(value)).replace(/\s+/g, "");
  let m = s.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (m) return m[1] + "/" + m[2].padStart(2, "0") + "/" + m[3].padStart(2, "0");
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return m[3] + "/" + m[2].padStart(2, "0") + "/" + m[1].padStart(2, "0");
  return s;
}

function normalise(raw) {
  const warnings = [];

  const iqama = toWesternDigits(cleanText(raw.iqama_number)).replace(/\D/g, "");
  const arabicName = cleanText(raw.arabic_name);
  const englishName = cleanText(raw.english_name);
  let dobHijri = normaliseDate(raw.dob_hijri);
  let dobGregorian = normaliseDate(raw.dob_gregorian);

  // Calendar mix-up guard: 13xx/14xx is Hijri, 19xx/20xx is Gregorian.
  const year = (d) => (/^\d{4}\//.test(d) ? Number(d.slice(0, 4)) : 0);
  if (dobGregorian && year(dobGregorian) && year(dobGregorian) < 1700 && !dobHijri) { dobHijri = dobGregorian; dobGregorian = ""; }
  else if (dobHijri && year(dobHijri) >= 1700 && !dobGregorian) { dobGregorian = dobHijri; dobHijri = ""; }
  else if (dobHijri && dobGregorian && year(dobGregorian) < 1700 && year(dobHijri) >= 1700) { [dobHijri, dobGregorian] = [dobGregorian, dobHijri]; }

  if (!iqama) warnings.push("Iqama number was not read.");
  else if (iqama.length !== 10) warnings.push("Iqama number has " + iqama.length + " digits instead of 10. Check it against the card.");
  else if (iqama[0] !== "1" && iqama[0] !== "2") warnings.push("Iqama number does not start with 1 or 2. Check it against the card.");

  if (!arabicName) warnings.push("Arabic name was not read.");
  if (!englishName) warnings.push("English name was not read.");

  const datePattern = /^(\d{4})\/(\d{2})\/(\d{2})$/;

  if (!dobHijri) {
    warnings.push("Hijri date of birth was not read (it may not be printed on this card).");
  } else {
    const m = dobHijri.match(datePattern);
    if (!m) warnings.push("Hijri date of birth is not in YYYY/MM/DD format: \"" + dobHijri + "\".");
    else if (Number(m[1]) < 1300 || Number(m[1]) > 1460) warnings.push("Hijri year " + m[1] + " looks wrong. Check it against the card.");
  }

  if (!dobGregorian) {
    warnings.push("Gregorian date of birth was not read (it may not be printed on this card).");
  } else {
    const m = dobGregorian.match(datePattern);
    if (!m) warnings.push("Gregorian date of birth is not in YYYY/MM/DD format: \"" + dobGregorian + "\".");
    else if (Number(m[1]) < 1900 || Number(m[1]) > new Date().getUTCFullYear()) warnings.push("Gregorian year " + m[1] + " looks wrong. Check it against the card.");
  }

  return {
    data: { iqama_number: iqama, arabic_name: arabicName, english_name: englishName, dob_hijri: dobHijri, dob_gregorian: dobGregorian },
    warnings,
  };
}

/* ---------- Handler ---------- */

exports.handler = async (event) => {
  const startedAt = Date.now();
  const origin = getOrigin(event);
  const cors = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return failure(405, "METHOD_NOT_ALLOWED", "Use POST with a JSON body.", { ...cors, Allow: "POST, OPTIONS" });

  // Browsers always send Origin on cross-origin POSTs. Refuse unknown web origins so nobody
  // can embed this endpoint and burn your Gemini quota from another site.
  // Same-origin calls (the site calling its own function, on any Netlify domain) are always fine.
  const host = String((event.headers || {}).host || (event.headers || {}).Host || "").toLowerCase();
  let originHost = "";
  try { originHost = origin ? new URL(origin).host.toLowerCase() : ""; } catch (_) { originHost = ""; }
  const sameOrigin = Boolean(host) && originHost === host;
  if (!origin || (!sameOrigin && !ALLOWED_ORIGINS.has(origin))) return failure(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed to use the OCR service.", cors);

    const ip = String((event.headers || {})["x-nf-client-connection-ip"] || "").trim();
  if (ip && rateLimited(ip)) return failure(429, "RATE_LIMITED", "Too many scans. Wait a minute and retry.", { ...cors, "Retry-After": "60" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return failure(503, "SERVICE_UNAVAILABLE", "OCR service is temporarily unavailable. Please try again later.", cors);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);

  try {
    const { image, mimeType } = parseRequest(event);
    const models = getModels();

    let result = null;
    let usedModel = null;
    for (let i = 0; i < models.length; i += 1) {
      usedModel = models[i];
      result = await callGemini({ model: usedModel, apiKey, image, mimeType, signal: controller.signal });
      if ((result.status === 404 || result.status === 429 || result.status >= 500) && i < models.length - 1) {
        console.warn("Model " + usedModel + " returned 404, trying " + models[i + 1] + ".");
        continue;
      }
      break;
    }

    if (!result.ok) throw upstreamToHttpError(result, usedModel);

    const { data, warnings } = normalise(readModelOutput(result.json));
    return respond(200, { success: true, data, meta: { model: usedModel, latency_ms: Date.now() - startedAt, warnings } }, cors);
  } catch (err) {
    if (err instanceof HttpError) {
      if (err.status >= 500) console.error("[" + err.code + "] " + err.message);
      return failure(err.status, err.code, err.message, cors);
    }
    if (err && err.name === "AbortError") {
      return failure(504, "TIMEOUT", "Gemini did not answer within " + DEADLINE_MS / 1000 + " seconds. Retry, or use a smaller or clearer photo.", cors);
    }
    // Never log image data or extracted personal data — only the error itself.
    console.error("Unhandled error:", err && err.message ? err.message : err);
    return failure(500, "INTERNAL_ERROR", "Unexpected server error. Check the function logs.", cors);
  } finally {
    clearTimeout(timer);
  }
};
