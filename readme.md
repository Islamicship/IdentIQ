# ⚡ IdentIQ · Gulf Identity Intelligence Platform

<p align="center">
  <img src="../assets/logo.png" alt="IdentIQ Logo" width="80"/>
</p>

<p align="center">
  <strong>v5.9.1 · Progressive Web App · Offline-First · Zero-Backend Privacy</strong>
</p>

<p align="center">
  <a href="https://ident-lq.netlify.app"><img src="https://img.shields.io/badge/Live%20Demo-ident--lq.netlify.app-00a2ff?style=flat-square" alt="Live Demo"/></a>
  <img src="https://img.shields.io/badge/Version-5.9.1-00d4ff?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-00e676?style=flat-square" alt="PWA"/>
  <img src="https://img.shields.io/badge/Stack-Vanilla%20JS-f5c542?style=flat-square" alt="Vanilla JS"/>
</p>

---

## Overview

IdentIQ is an **offline-first, zero-backend** client-side intelligence platform tailored for Gulf (GCC) and South Asian identity data processing, synthetic ID generation, and Quranic reference exploration.

All processing, parsing, and state management run 100% inside your local browser sandbox. No user data, pasted documents, or queries are ever sent to an external server.

---

## Core Modules

| #   | Module                       | Primary Capability                                                                                                                                  |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Identity Intel**           | Extracts Name, ID Number, and DOB from raw/OCR identity documents (Iqama, CNIC, Emirates ID, QID, etc.)                                             |
| 2   | **Realistic ID**             | Generates verified synthetic identity profiles, realistic residential addresses, and issue/expiry dates across 11 countries                         |
| 3   | **Analytics**                | Tracks local document parsing metrics, success rates, processing counters, and manual/auto history cleanup                                          |
| 4   | **Divine & Prophetic Names** | Comprehensive Quranic repository featuring 85 Names of Allah and 25 Names of Prophet Muhammad ﷺ with native audio pronunciations and ayah citations |

---

## Detailed Features

### 1. Identity Intel (Extractor)

- **Multi-Script OCR Ingestion:** Normalizes and parses raw text outputs from ABBYY FineReader, Google Lens, and standard scanners.
- **Bi-Directional Date Conversion:** Seamless calculation between Gregorian and Hijri calendar systems.
- **Automated Demographics:** Dynamic age calculation based on extracted Date of Birth.
- **Multilingual Voice Dictation:** Voice-to-text input supporting 6 regional languages (Arabic, English, Urdu, Hindi, Bengali, Nepali).
- **Embedded Virtual Keyboards:** On-screen English and Arabic input layouts for clean data entry.

### 2. Realistic ID (Generator)

- **11 Supported Nations:** Pakistan (CNIC), Saudi Arabia (Iqama/National ID), UAE (Emirates ID), Qatar (QID), Kuwait (Civil ID), Bahrain (CPR), Oman (Civil ID), India (Aadhaar), Bangladesh (NID), Nepal (National ID), Afghanistan (Tazkira).
- **Geographic Precision:** Generates realistic local administrative addresses, cities, and postal regions per country.
- **Regulatory Date Logic:** Automatic calculation of legal validity cycles (`Issue + 5Y − 1D`).

### 3. Divine & Prophetic Names

- **Quranic First Occurrence:** 85 Divine Names (Asma-ul-Husna) and 25 Prophetic Titles (Asma-un-Nabi) ordered by their first chronological appearance in the Quran (`Surah:Ayah`).
- **High-Fidelity Audio:** 110 pre-rendered, crystal-clear Arabic pronunciations playable directly via offline cache.
- **Typography Engine:** One-click live toggle between classical **Naskh** and **Nastaliq** calligraphic scripts.
- **Multi-Parameter Search:** Real-time search by English translation, Arabic script, chronological index, or Quranic reference (e.g., `2:255`).

### 4. Platform & Security

- **Privacy Engine:** 5-minute inactivity auto-wipe securely clears all local clipboard and parsing memory.
- **PWA Capabilities:** Fully installable on Desktop (Chrome, Edge) and Mobile (Android, iOS) with instant background offline sync.
- **Internationalization (i18n):** Native UI localization for English, Arabic, and Urdu.

---

## Keyboard Shortcuts

| Shortcut  | Navigation Target                            |
| :-------: | -------------------------------------------- |
| `Alt + 1` | Switch to **Identity Intel**                 |
| `Alt + 2` | Switch to **Realistic ID**                   |
| `Alt + 3` | Switch to **Analytics**                      |
| `Alt + 4` | Switch to **Names**                          |
| `Escape`  | Dismiss open modals, calendars, or keyboards |

---

## Project Structure

```text
IdentIQ/
├── _headers               # Production security & cache headers
├── _redirects             # SPA routing rules
├── index.html             # Core semantic layout & tab containers
├── manifest.json          # PWA application metadata
├── service-worker.js      # Offline cache strategies & network proxy
│
├── assets/
│   └── logo.png           # Platform branding
│
├── audio/                 # 110 optimized MP3 pronunciation assets
│   ├── husna-1.mp3 ... husna-85.mp3
│   └── nabi-1.mp3 ... nabi-25.mp3
│
├── css/
│   ├── copy-fx.css        # Toast notifications & copy interaction styles
│   ├── names.css          # Quranic typography & audio cards styling
│   ├── settings.css       # Preference drawer & modal presentation
│   └── style.css          # Base responsive layout & color variables
│
├── docs/
│   ├── readme.md          # Technical documentation
│   └── Report.html        # Build audit report
│
├── js/
│   ├── extractor.js       # OCR normalization & token parsing engine
│   ├── generator.js       # Country-specific ID algorithms & address DB
│   ├── main.js            # App coordinator, tabs, shortcuts, auto-wipe
│   ├── names-data.js      # Immutable dataset: Arabic, transliteration, references
│   ├── names.js           # Audio playback controller & search filter
│   ├── settings.js        # User preferences, themes, and locale handlers
│   └── ui.js              # DOM rendering, copy clipboard, i18n dictionary
│
└── lib/                   # Locally bundled runtime libraries
    ├── confetti.browser.min.js
    ├── moment.min.js
    └── moment-hijri.min.js
```

## Privacy & Security Baseline

- **Zero Tracking:** No Google Analytics, no third-party trackers, no tracking pixels.
- **Local Persistence:** Data lives exclusively in browser memory (`sessionStorage` / `localStorage`).
- **Cryptographic Headers:** Hardened Content Security Policy (CSP), anti-clickjacking (`X-Frame-Options: DENY`), and strict MIME-type sniffing protection.

---

## Maintainer & Copyright

**Creative Men** · Jhang, Punjab, Pakistan

- **Email:** creativemen70@gmail.com
- **Production URL:** [ident-lq.netlify.app](https://ident-lq.netlify.app)

© 2024–2026 IdentIQ · Creative Men · Gulf Identity Intelligence Platform. All Rights Reserved.
