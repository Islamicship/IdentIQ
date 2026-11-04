# ⚡ IdentIQ · Gulf Identity Intelligence Platform

<p align="center">
  <img src="logo.png" alt="IdentIQ Logo" width="80"/>
</p>

<p align="center">
  <strong>v4.4 · Progressive Web App · Offline-First · Privacy-Focused</strong>
</p>

<p align="center">
  <a href="https://nexux-gen.netlify.app"><img src="https://img.shields.io/badge/Live%20Demo-nexux--gen.netlify.app-00a2ff?style=flat-square" alt="Live Demo"/></a>
  <img src="https://img.shields.io/badge/Version-4.4-00d4ff?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/License-Proprietary-ff4466?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/Built%20With-Vanilla%20JS-f5c542?style=flat-square" alt="Vanilla JS"/>
</p>

---

## Overview

IdentIQ is an **offline, client-side** web application designed to work with Gulf and South Asian identity documents. There is no server and no backend — everything runs entirely within your browser.

**Two core modules:**

| Module | Description |
|--------|-------------|
| **Identity Intel** | Paste text from an Iqama, CNIC, or Emirates ID — Name, ID Number, and Date of Birth are extracted automatically |
| **ID Generator** | Generates realistic identity data for 11 countries — CNIC, License, Address, and Dates |
| **Analytics** | Tracks extraction history, success rate, and export statistics |

---

## Live Demo

**[nexux-gen.netlify.app](https://nexux-gen.netlify.app)**

The app can also be installed as a PWA — works on both mobile and desktop, even without an internet connection.

---

## Features

**Identity Extractor**
- Supports both Arabic and English text
- Automatically converts between Gregorian and Hijri dates
- Age badge — calculates age automatically from the date of birth
- Voice input — supports 6 languages: Arabic, English, Urdu, Hindi, Bengali, and Nepali
- Virtual keyboard — available in both Arabic and English
- OCR text cleaning — handles output from ABBYY FineReader and similar tools

**ID Generator**
- 11 countries: Pakistan, UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, India, Bangladesh, Nepal, and Afghanistan
- Realistic addresses with actual city and area data for each country
- Issue date, expiry date (Issue + 5Y − 1D), and license number
- Hijri calendar — displays the current date in both Gregorian and Hijri formats

**App**
- Dark / Light theme
- UI language support: English, Urdu, and Arabic
- Keyboard shortcuts: `Alt+1` `Alt+2` `Alt+3`
- 5-minute privacy auto-wipe — clears all data after inactivity
- PWA — works offline and can be installed on any device
- Custom cursor styles — Nexus, Blade, Blaze

---

## Supported Countries

| # | Country | ID Type |
|---|---------|---------|
| 1 | 🇵🇰 Pakistan | CNIC (13-digit) |
| 2 | 🇸🇦 Saudi Arabia | Iqama / National ID |
| 3 | 🇦🇪 UAE | Emirates ID |
| 4 | 🇶🇦 Qatar | QID |
| 5 | 🇰🇼 Kuwait | Civil ID |
| 6 | 🇧🇭 Bahrain | CPR |
| 7 | 🇴🇲 Oman | National ID |
| 8 | 🇮🇳 India | Aadhaar-style |
| 9 | 🇧🇩 Bangladesh | NID |
| 10 | 🇳🇵 Nepal | National ID |
| 11 | 🇦🇫 Afghanistan | Tazkira |

---

## How to Use

### Identity Extractor (Tab 1)

1. Copy the text from your Iqama, CNIC, or ID document
2. Paste it into the **INPUT TERMINAL**
3. Data is extracted automatically — Name, ID Number, and Date of Birth
4. Use the copy button to copy any individual field
5. You can also use the voice button to provide input by speaking

> **Tip:** Text scanned with ABBYY FineReader or any other OCR tool can be pasted directly — the app cleans it automatically.

### ID Generator (Tab 2)

1. Select a country
2. Select a city or region
3. Click the **Generate New Identity** button
4. Use the copy button on any field to copy its value

### Analytics (Tab 3)

- View total documents processed, success rate, and export history
- Use the **Clear Data** button to wipe all history

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + 1` | Identity Intel tab |
| `Alt + 2` | ID Generator tab |
| `Alt + 3` | Analytics tab |
| `Escape` | Close calendar or keyboard |

---

## Installation (Self-Host)

No build steps. No `npm install` required.

```bash
git clone https://github.com/Islamicship/identiq.git
cd identiq
```

Upload all files to any HTTPS host:

- [GitHub Pages](https://pages.github.com)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)

> **HTTPS is required** for the Service Worker and Voice Input to function (also works on localhost).

---

## File Structure

```
identiq/
├── index.html          # Main UI — tabs, layout, HTML structure
├── style.css           # Main styling — dark/light theme
├── settings.css        # Settings panel styles
├── ui.js               # i18n, theme, audio, utilities
├── extractor.js        # Identity extraction logic
├── generator.js        # ID generation — 11 countries
├── main.js             # Tab navigation, analytics, privacy wipe
├── settings.js         # Settings panel, user preferences
├── mouse.js            # Custom cursor engine
├── service-worker.js   # PWA offline caching
├── manifest.json       # PWA manifest
├── moment_min.js       # Moment.js (local fallback)
└── moment-hijri_min.js # Hijri calendar (local fallback)
```

---

## Privacy

- **No server** — all data stays entirely within your browser
- **Auto-wipe** — all data is automatically cleared after 5 minutes of inactivity
- **No tracking** — no analytics, no cookies, no third-party requests

---

## Dependencies

Loaded via CDN (with local fallbacks available):

| Library | Purpose |
|---------|---------|
| [Moment.js](https://momentjs.com) | Gregorian date operations |
| [Moment-Hijri](https://github.com/xsoh/moment-hijri) | Hijri ↔ Gregorian conversion |
| [Canvas-Confetti](https://github.com/catdad/canvas-confetti) | Extraction success animation |

---

## Developer

**Creative Men** · Jhang, Punjab, Pakistan

- Email: creativemen70@gmail.com
- WhatsApp: [0321-8232140](https://wa.me/923218232140)
- Projects: [nexux-gen.netlify.app](https://nexux-gen.netlify.app) · [personal-ocr-tool.netlify.app](https://personal-ocr-tool.netlify.app)

---

## License

© 2025 Creative Men. All Rights Reserved.
