'use strict';

try {

(function () {

    var SKEY = 'IS_settings_v1';

    var DEFAULTS = {
        userName:         '',
        userEmail:        '',
        avatarEmoji:      '',
        defaultTab:       'tab-extractor',
        defaultCountry:   '',
        defaultCity:      '',
        wipeMinutes:      5,
        soundEnabled:     true,
        shortcutsVisible: true,
        shortcutsEnabled: true,
        cursorStyle:      'nexus'
    };

    var COUNTRY_CITIES = {
        pakistan:    ['Punjab','Lahore','Karachi','Islamabad','Peshawar','Quetta','Azad Kashmir'],
        india:       ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai'],
        uae:         ['Dubai','Abu Dhabi','Sharjah'],
        qatar:       ['Doha','Al Rayyan','Al Wakrah'],
        saudiarabia: ['Riyadh','Jeddah','Dammam','Makkah','Madinah','Abha','Al Khobar'],
        kuwait:      ['Kuwait City','Salmiya','Farwaniya','Ahmadi','Hawalli'],
        bahrain:     ['Manama','Muharraq','Riffa','Northern Area','Southern Area'],
        oman:        ['Muscat','Salalah','Sohar','Nizwa','Sur'],
        bangladesh:  ['Dhaka','Chittagong','Sylhet','Rajshahi'],
        nepal:       ['Kathmandu','Pokhara','Lalitpur','Biratnagar'],
        afghanistan: ['Kabul','Herat','Mazar-i-Sharif','Kandahar']
    };

    var COUNTRY_LABELS = {
        pakistan:    'Pakistan',
        india:       'India',
        uae:         'UAE',
        qatar:       'Qatar',
        saudiarabia: 'Saudi Arabia',
        kuwait:      'Kuwait',
        bahrain:     'Bahrain',
        oman:        'Oman',
        bangladesh:  'Bangladesh',
        nepal:       'Nepal',
        afghanistan: 'Afghanistan'
    };

    var APP_META = {
        name:        'IdentIQ',
        version:     'v4.4',
        released:    '2024',
        developer:   'Creative Men',
        location:    'Jhang, Punjab, Pakistan',
        supportHours:'Weekdays · 24 Hours',
        email:       'creativemen70@gmail.com',
        whatsapp:    '0321-8232140',
        whatsappUrl: 'https://wa.me/923218232140',
        github:      'https://github.com/Islamicship',
        nexusApp:    'https://nexux-gen.netlify.app',
        ocrApp:      'https://personal-ocr-tool.netlify.app',
        deenApp:     'https://deen-toolkit.netlify.app',
        tagline:     'Crafting Digital Intelligence for the Gulf & South Asia',
        copyright:   '© 2024–2025 Creative Men. All rights reserved.',
        privacyVer:  'v1.0 · 2024'
    };

    var STR = {
        en: {
            settingsTitle: 'Settings',

            navGeneral:    'General',
            navAppearance: 'Appearance',
            navProfile:    'Profile',
            navPrivacy:    'Privacy',
            navShortcuts:  'Shortcuts',
            navAbout:      'About',

            generalTitle:       'General',
            labelDefaultTab:    'Default Start Tab',
            tabIntel:           'Identity Intel',
            tabGen:             'Realistic ID',
            tabAnalytics:       'Analytics',
            labelDefaultCountry:'Default Country',
            labelDefaultCity:   'Default City / Region',
            countryNone:        '— None —',
            cityNone:           '— None —',
            labelWipe:          'Auto-Wipe Timer',
            wipe1:              '1 min',
            wipe3:              '3 min',
            wipe5:              '5 min',
            wipe10:             '10 min',
            wipe30:             '30 min',
            labelShortcutsBar:  'Show Keyboard Shortcuts Bar',
            wipeCurrently:      'Currently: {n} minutes',

            appearanceTitle:    'Appearance',
            labelTheme:         'Theme',
            themeDark:          'Dark',
            themeLight:         'Light',
            themeDarkDesc:      'Deep space interface',
            themeLightDesc:     'Clean daylight mode',
            labelLanguage:      'Language',
            langEn:             'English',
            langEnFlag:         '🇬🇧',
            langUr:             'اردو',
            langUrFlag:         '🇵🇰',

            profileTitle:       'Profile',
            labelName:          'Display Name',
            namePlaceholder:    'Enter your name…',
            labelEmail:         'Email Address',
            emailPlaceholder:   'optional — stored locally',
            profileGreeting:    'Welcome,',
            profileNote:        'Your profile is stored locally on this device only.',
            labelAvatarEmoji:   'Avatar Style',

            privacyTitle:       'Privacy & Data',
            labelWipePrivacy:   'Auto-Wipe Timer',
            labelSound:         'Copy Sound Effects',
            btnClearHistory:    'Clear Extraction History',
            btnClearAnalytics:  'Clear Analytics Data',
            btnClearAll:        'Clear All Data',
            confirmHistory:     'Clear all extraction history? This cannot be undone.',
            confirmAnalytics:   'Clear analytics data? This cannot be undone.',
            confirmClearAll:    'This will erase your extraction history, analytics, profile, and all settings. This cannot be undone.',
            privacyNote:        'All data is stored locally on your device. Nothing is sent to any server.',
            clearedToast:       '✓ Data cleared',
            dataManagement:     'Data Management',
            lastCleared:        'Last cleared: ',
            neverCleared:       'Never cleared',

            shortcutsTitle:     'Keyboard Shortcuts',
            labelEnableShortcuts: 'Enable Keyboard Shortcuts',
            scAlt1:             'Identity Intel tab',
            scAlt2:             'Realistic ID tab',
            scAlt3:             'Analytics tab',
            scAltS:             'Open Settings',
            scCtrlEnter:        'Extract / Generate',
            scEsc:              'Close panel / calendar',
            shortcutsNote:      'Shortcuts work globally when no input is focused.',
            copyShortcuts:      'Copy shortcuts',

            aboutTitle:         'About & Support',
            aboutAppSection:    'Application',
            aboutDeveloperSection: 'Developer',
            aboutSupportSection:'Support & Contact',
            aboutProjectsSection:'Other Projects',
            aboutLegalSection:  'Legal',
            appName:            'IdentIQ',
            appVersion:         'v4.4',
            appTagline:         'Gulf & South-Asian Identity Intelligence Platform',
            poweredBy:          'Powered by Creative AI Engine',
            developerLabel:     'Developed by',
            developerName:      'Creative Men',
            developerTagline:   'Crafting Digital Intelligence for the Gulf & South Asia',
            locationLabel:      'Location',
            locationVal:        'Jhang, Punjab, Pakistan',
            releasedLabel:      'Released',
            releasedVal:        '2024',
            supportHoursLabel:  'Support Hours',
            supportHoursVal:    'Weekdays · 24 Hours',
            btnInstall:         'Install App',
            btnUpdate:          'Check for Updates',
            labelEmailSupport:  '✉️ Email Support',
            emailVal:           'creativemen70@gmail.com',
            labelWA:            '💬 WhatsApp',
            waVal:              '0321-8232140',
            labelGithub:        '🐙 GitHub',
            githubVal:          'github.com/Islamicship',
            projectsLabel:      'View Our Apps',
            projectNexus:       'IdentIQ — Identity Intel',
            projectOcr:         'Personal OCR Tool',
            projectDeen:        'Deen Toolkit',
            privacyPolicyTitle: 'Privacy Policy',
            privacyPolicyBtn:   'View Privacy Policy',
            copyrightNotice:    '© 2024–2025 Creative Men. All rights reserved.',
            btnReset:           'Reset All Settings',
            resetConfirm:       'Reset all settings to defaults and reload?',
            updateChecking:     'Checking for updates…',
            updateDone:         '✓ Already up to date',
            updateInstalling:   'Update installing… reload to apply',
            changelogTitle:     "What's New in v4.4",
            changelog1:         'Professional About & Support section',
            changelog2:         'Privacy Policy added',
            changelog3:         'Developer projects showcase',
            changelog4:         'Full RTL & Urdu improvements',
            changelog5:         '14+ bug fixes across all sections',

            saved:              'Saved ✓',
            on:                 'On',
            off:                'Off',

            labelCursor:        'Cursor Style',
            cursorNexus:        'Nexus',
            cursorNexusDesc:    'Cyberpunk scanner',
            cursorBlade:        'Blade',
            cursorBladeDesc:    'Precision reticle',
            cursorBlaze:        'Blaze',
            cursorBlazeDesc:    'Gaming gold pointer',
            cursorDefault:      'Default',
            cursorDefaultDesc:  'System cursor'
        },
        ur: {
            settingsTitle: 'ترتیبات',
            navGeneral:    'عمومی',
            navAppearance: 'ظاہری شکل',
            navProfile:    'پروفائل',
            navPrivacy:    'رازداری',
            navShortcuts:  'شارٹ کٹس',
            navAbout:      'معلومات',
            generalTitle:       'عمومی ترتیبات',
            labelDefaultTab:    'پہلی ٹیب',
            tabIntel:           'شناختی ڈیٹا',
            tabGen:             'شناختی کارڈ',
            tabAnalytics:       'تجزیات',
            labelDefaultCountry:'ڈیفالٹ ملک',
            labelDefaultCity:   'ڈیفالٹ شہر',
            countryNone:        '— کوئی نہیں —',
            cityNone:           '— کوئی نہیں —',
            labelWipe:          'خودکار صفائی',
            wipe1:              '1 منٹ',
            wipe3:              '3 منٹ',
            wipe5:              '5 منٹ',
            wipe10:             '10 منٹ',
            wipe30:             '30 منٹ',
            labelShortcutsBar:  'شارٹ کٹ بار دکھائیں',
            wipeCurrently:      'ابھی: {n} منٹ',
            appearanceTitle:    'ظاہری شکل',
            labelTheme:         'تھیم',
            themeDark:          'ڈارک',
            themeLight:         'لائٹ',
            themeDarkDesc:      'گہرا انٹرفیس',
            themeLightDesc:     'روشن انٹرفیس',
            labelLanguage:      'زبان',
            langEn:             'English',
            langEnFlag:         '🇬🇧',
            langUr:             'اردو',
            langUrFlag:         '🇵🇰',
            profileTitle:       'پروفائل',
            labelName:          'نمائشی نام',
            namePlaceholder:    'اپنا نام لکھیں…',
            labelEmail:         'ای میل',
            emailPlaceholder:   'اختیاری — مقامی طور پر محفوظ',
            profileGreeting:    'خوش آمدید،',
            profileNote:        'آپ کا پروفائل صرف اس ڈیوائس پر مقامی طور پر محفوظ ہے۔',
            labelAvatarEmoji:   'اوتار اسٹائل',
            privacyTitle:       'رازداری اور ڈیٹا',
            labelWipePrivacy:   'خودکار صفائی',
            labelSound:         'کاپی آواز',
            btnClearHistory:    'نکالنے کی تاریخ صاف کریں',
            btnClearAnalytics:  'تجزیاتی ڈیٹا صاف کریں',
            btnClearAll:        'تمام ڈیٹا صاف کریں',
            confirmHistory:     'تمام نکالنے کی تاریخ صاف کریں؟',
            confirmAnalytics:   'تجزیاتی ڈیٹا صاف کریں؟',
            confirmClearAll:    'یہ آپ کی نکالنے کی تاریخ، تجزیات، پروفائل اور تمام ترتیبات مٹا دے گا۔ یہ واپس نہیں ہو سکتا۔',
            privacyNote:        'تمام ڈیٹا آپ کی ڈیوائس پر مقامی طور پر محفوظ ہے۔ کوئی ڈیٹا سرور کو نہیں بھیجا جاتا۔',
            clearedToast:       '✓ ڈیٹا صاف ہو گیا',
            dataManagement:     'ڈیٹا مینجمنٹ',
            lastCleared:        'آخری بار صاف: ',
            neverCleared:       'کبھی صاف نہیں ہوا',
            shortcutsTitle:     'کی بورڈ شارٹ کٹس',
            labelEnableShortcuts:'شارٹ کٹس فعال کریں',
            scAlt1:             'شناختی ڈیٹا ٹیب',
            scAlt2:             'شناختی کارڈ ٹیب',
            scAlt3:             'تجزیات ٹیب',
            scAltS:             'ترتیبات کھولیں',
            scCtrlEnter:        'نکالیں / بنائیں',
            scEsc:              'پینل بند کریں',
            shortcutsNote:      'شارٹ کٹس عالمی سطح پر کام کرتے ہیں جب کوئی ان پٹ فوکس نہ ہو۔',
            copyShortcuts:      'شارٹ کٹس کاپی کریں',

            aboutTitle:         'معلومات اور سپورٹ',
            aboutAppSection:    'ایپلیکیشن',
            aboutDeveloperSection: 'ڈویلپر',
            aboutSupportSection:'سپورٹ اور رابطہ',
            aboutProjectsSection:'دیگر پروجیکٹس',
            aboutLegalSection:  'قانونی',
            appName:            'IdentIQ',
            appVersion:         'v4.4',
            appTagline:         'گلف اور جنوبی ایشیائی شناختی ذہانت پلیٹ فارم',
            poweredBy:          'Creative AI انجن سے تقویت یافتہ',
            developerLabel:     'تیار کردہ',
            developerName:      'Creative Men',
            developerTagline:   'گلف اور جنوبی ایشیا کے لیے ڈیجیٹل ذہانت',
            locationLabel:      'مقام',
            locationVal:        'جھنگ، پنجاب، پاکستان',
            releasedLabel:      'جاری کردہ',
            releasedVal:        '2024',
            supportHoursLabel:  'سپورٹ اوقات',
            supportHoursVal:    'ہفتے کے دن · 24 گھنٹے',
            btnInstall:         'ایپ انسٹال کریں',
            btnUpdate:          'اپ ڈیٹ چیک کریں',
            labelEmailSupport:  '✉️ ای میل سپورٹ',
            emailVal:           'creativemen70@gmail.com',
            labelWA:            '💬 واٹس ایپ',
            waVal:              '0321-8232140',
            labelGithub:        '🐙 گٹ ہب',
            githubVal:          'github.com/Islamicship',
            projectsLabel:      'ہماری ایپس',
            projectNexus:       'IdentIQ — شناختی ذہانت',
            projectOcr:         'پرسنل OCR ٹول',
            projectDeen:        'دین ٹول کٹ',
            privacyPolicyTitle: 'رازداری پالیسی',
            privacyPolicyBtn:   'رازداری پالیسی دیکھیں',
            copyrightNotice:    '© 2024–2025 Creative Men. تمام حقوق محفوظ ہیں۔',
            btnReset:           'تمام ترتیبات ری سیٹ کریں',
            resetConfirm:       'تمام ترتیبات ڈیفالٹ پر ری سیٹ کریں؟',
            updateChecking:     'اپ ڈیٹ چیک ہو رہا ہے…',
            updateDone:         '✓ ایپ تازہ ترین ہے',
            updateInstalling:   'اپ ڈیٹ انسٹال ہو رہا ہے… ری لوڈ کریں',
            changelogTitle:     'v4.4 میں نیا کیا ہے',
            changelog1:         'پروفیشنل معلومات اور سپورٹ سیکشن',
            changelog2:         'رازداری پالیسی شامل کی گئی',
            changelog3:         'ڈویلپر پروجیکٹس شوکیس',
            changelog4:         'مکمل RTL اور اردو بہتری',
            changelog5:         '14+ بگ فکسز تمام سیکشنز میں',
            saved:              'محفوظ ✓',
            on:                 'آن',
            off:                'آف',

            labelCursor:        'کرسر اسٹائل',
            cursorNexus:        'نیکسس',
            cursorNexusDesc:    'سائبر پنک اسکینر',
            cursorBlade:        'بلیڈ',
            cursorBladeDesc:    'درست نشانہ',
            cursorBlaze:        'بلیز',
            cursorBlazeDesc:    'گیمنگ گولڈ پوائنٹر',
            cursorDefault:      'ڈیفالٹ',
            cursorDefaultDesc:  'سسٹم کرسر'
        }
    };

    var ICONS = {
        gear:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        sliders: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/></svg>',
        palette: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
        user:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        shield:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        keyboard:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>',
        info:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="3"/></svg>',
        close:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        download:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>',
        trash:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
        copy:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',

        github:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
        globe:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        lock:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        star:    '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        pin:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        clock:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        zap:     '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    };

    var NAV_ITEMS = [
        { id: 'general',    iconKey: 'sliders',  strKey: 'navGeneral'    },
        { id: 'appearance', iconKey: 'palette',  strKey: 'navAppearance' },
        { id: 'profile',    iconKey: 'user',     strKey: 'navProfile'    },
        { id: 'privacy',    iconKey: 'shield',   strKey: 'navPrivacy'    },
        { id: 'shortcuts',  iconKey: 'keyboard', strKey: 'navShortcuts'  },
        { id: 'about',      iconKey: 'info',     strKey: 'navAbout'      }
    ];

    function _getInstallBtn() { return document.getElementById('spInstallBtn'); }

    function _syncInstallBtnVisibility() {
        var btn = _getInstallBtn();
        if (!btn) return;
        if (sessionStorage.getItem('pwa_installed') || localStorage.getItem('pwa_installed')) {
            btn.style.display = 'none';
            _updateGearDot();
            return;
        }
        btn.style.display = window._IS_deferredInstall ? '' : 'none';
        _updateGearDot();
    }

    var _overlay        = null;
    var _panel          = null;
    var _activeNav      = sessionStorage.getItem('SP_lastNav') || 'general';
    var _focusTrap      = null;
    var _startupApplied = false;

    function readSettings() {
        try {
            return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SKEY) || '{}'));
        } catch (e) { return Object.assign({}, DEFAULTS); }
    }

    function writeSettings(obj) {
        try { localStorage.setItem(SKEY, JSON.stringify(obj)); } catch (e) {}
    }

    function saveProp(key, val) {
        var cur = readSettings();
        cur[key] = val;
        writeSettings(cur);
    }

    function lang() {
        return (window.IS && IS.i18n && IS.i18n._lang === 'ur') ? 'ur' : 'en';
    }
    function t(key) { var L = lang(); return (STR[L] && STR[L][key]) || STR.en[key] || key; }

    function getInitials(name) {
        if (!name || !name.trim()) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }

    function esc(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function microToast(anchorEl) {
        if (!anchorEl || !anchorEl.parentNode) return;
        var toast = document.createElement('span');
        toast.className = 'sp-micro-toast';
        toast.textContent = t('saved');
        var parent = anchorEl.parentNode;
        parent.style.position = 'relative';
        parent.style.overflow = 'visible';
        parent.appendChild(toast);
        setTimeout(function () { toast.classList.add('sp-micro-show'); }, 10);
        setTimeout(function () {
            toast.classList.remove('sp-micro-show');
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 1600);
    }

    function buildCityOpts(countryKey, selectedCity) {
        var cities = COUNTRY_CITIES[countryKey] || [];
        var html = '<option value="">' + esc(t('cityNone')) + '</option>';
        cities.forEach(function (c) {
            html += '<option value="' + esc(c) + '"' + (c === selectedCity ? ' selected' : '') + '>' + esc(c) + '</option>';
        });
        return html;
    }

    function _updateGearDot() {
        var btn = document.getElementById('settingsGearBtn');
        if (!btn) return;
        if (window._IS_deferredInstall) {
            btn.classList.add('sp-gear-dot');
        } else {
            btn.classList.remove('sp-gear-dot');
        }
    }

    function _checkSWUpdateDot() {
        if (!navigator.serviceWorker) return;
        navigator.serviceWorker.ready.then(function (reg) {
            if (reg.waiting) {
                var btn = document.getElementById('settingsGearBtn');
                if (btn) btn.classList.add('sp-gear-dot');
            }
        }).catch(function () {});
    }

    function buildGeneral(cfg) {
        var tabs = [
            { v: 'tab-extractor', lk: 'tabIntel'    },
            { v: 'tab-generator', lk: 'tabGen'      },
            { v: 'tab-analytics', lk: 'tabAnalytics'}
        ];
        var tabBtns = tabs.map(function (tb) {
            return '<button class="sp-seg-btn' + (cfg.defaultTab === tb.v ? ' active' : '') +
                   '" data-val="' + tb.v + '">' + t(tb.lk) + '</button>';
        }).join('');

        var wipes = [1,3,5,10,30];
        var wipeBtns = wipes.map(function (w) {
            return '<button class="sp-seg-btn' + (cfg.wipeMinutes === w ? ' active' : '') +
                   '" data-val="' + w + '">' + t('wipe'+w) + '</button>';
        }).join('');

        var wipeCurrent = t('wipeCurrently').replace('{n}', cfg.wipeMinutes);

        var countryOpts = '<option value="">' + esc(t('countryNone')) + '</option>';
        Object.keys(COUNTRY_LABELS).forEach(function (k) {
            countryOpts += '<option value="' + k + '"' + (k === cfg.defaultCountry ? ' selected' : '') + '>' + esc(COUNTRY_LABELS[k]) + '</option>';
        });

        var cityOpts = buildCityOpts(cfg.defaultCountry, cfg.defaultCity);

        return '<div class="sp-content-inner">' +
            '<h3 class="sp-content-title">' + t('generalTitle') + '</h3>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelDefaultTab') + '</label>' +
                '<div class="sp-seg-group" id="spTabGroup">' + tabBtns + '</div>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label" for="spCountry">' + t('labelDefaultCountry') + '</label>' +
                '<select id="spCountry" class="sp-select">' + countryOpts + '</select>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label" for="spCity">' + t('labelDefaultCity') + '</label>' +
                '<select id="spCity" class="sp-select">' + cityOpts + '</select>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelWipe') + '</label>' +
                '<div class="sp-seg-group sp-seg-group--wipe" id="spWipeGroup">' + wipeBtns + '</div>' +
                '<p class="sp-wipe-readout" id="spWipeReadout">' + esc(wipeCurrent) + '</p>' +
            '</div>' +

            '<div class="sp-field sp-field--row">' +
                '<span class="sp-field-label">' + t('labelShortcutsBar') + '</span>' +
                '<label class="sp-toggle" title="' + t('labelShortcutsBar') + '">' +
                    '<input type="checkbox" id="spShortcutsBar"' + (cfg.shortcutsVisible ? ' checked' : '') + '>' +
                    '<span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>' +
                '</label>' +
            '</div>' +
        '</div>';
    }

    function buildAppearance(cfg) {
        var isDark  = !(window.IS && IS.theme && IS.theme._mode === 'light');
        var isLight = !isDark;
        var L = lang();

        return '<div class="sp-content-inner">' +
            '<h3 class="sp-content-title">' + t('appearanceTitle') + '</h3>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelTheme') + '</label>' +
                '<div class="sp-theme-cards" id="spThemeCards">' +
                    '<button class="sp-theme-card' + (isDark ? ' active' : '') + '" data-theme="dark">' +
                        '<div class="sp-theme-preview sp-theme-preview--dark">' +
                            '<div class="sp-preview-bar"></div>' +
                            '<div class="sp-preview-line sp-preview-line--1"></div>' +
                            '<div class="sp-preview-line sp-preview-line--2"></div>' +
                        '</div>' +
                        '<span class="sp-theme-label">' + t('themeDark') + '</span>' +
                        '<span class="sp-theme-desc">' + t('themeDarkDesc') + '</span>' +
                        '<span class="sp-theme-check">✓</span>' +
                    '</button>' +
                    '<button class="sp-theme-card' + (isLight ? ' active' : '') + '" data-theme="light">' +
                        '<div class="sp-theme-preview sp-theme-preview--light">' +
                            '<div class="sp-preview-bar"></div>' +
                            '<div class="sp-preview-line sp-preview-line--1"></div>' +
                            '<div class="sp-preview-line sp-preview-line--2"></div>' +
                        '</div>' +
                        '<span class="sp-theme-label">' + t('themeLight') + '</span>' +
                        '<span class="sp-theme-desc">' + t('themeLightDesc') + '</span>' +
                        '<span class="sp-theme-check">✓</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelLanguage') + '</label>' +
                '<div class="sp-lang-cards" id="spLangCards">' +
                    '<button class="sp-lang-card' + (L === 'en' ? ' active' : '') + '" data-lang="en">' +
                        '<span class="sp-lang-flag">' + t('langEnFlag') + '</span>' +
                        '<span class="sp-lang-name">' + t('langEn') + '</span>' +
                        '<span class="sp-lang-check">✓</span>' +
                    '</button>' +
                    '<button class="sp-lang-card' + (L === 'ur' ? ' active' : '') + '" data-lang="ur">' +
                        '<span class="sp-lang-flag">' + t('langUrFlag') + '</span>' +
                        '<span class="sp-lang-name">' + t('langUr') + '</span>' +
                        '<span class="sp-lang-check">✓</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelCursor') + '</label>' +
                '<div class="sp-cursor-cards" id="spCursorCards">' +

                    '<button class="sp-cursor-card' + (cfg.cursorStyle === 'nexus' || !cfg.cursorStyle ? ' active' : '') + '" data-cursor="nexus">' +
                        '<div class="sp-cursor-preview sp-cursor-preview--nexus">' +
                            '<svg width="60" height="40" viewBox="0 0 60 40" fill="none" aria-hidden="true">' +
                                '<circle cx="30" cy="20" r="13" stroke="rgba(0,162,255,0.7)" stroke-width="1.5"/>' +
                                '<circle cx="30" cy="20" r="16" stroke="rgba(0,162,255,0.18)" stroke-width="1"/>' +
                                '<line x1="22" y1="20" x2="38" y2="20" stroke="rgba(0,212,255,0.4)" stroke-width="1"/>' +
                                '<circle cx="30" cy="20" r="3" fill="#00d4ff"/>' +
                                '<circle cx="30" cy="20" r="6" fill="rgba(0,212,255,0.12)"/>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="sp-cursor-label">' + t('cursorNexus') + '</span>' +
                        '<span class="sp-cursor-desc">' + t('cursorNexusDesc') + '</span>' +
                        '<span class="sp-cursor-check">✓</span>' +
                    '</button>' +

                    '<button class="sp-cursor-card' + (cfg.cursorStyle === 'blade' ? ' active' : '') + '" data-cursor="blade">' +
                        '<div class="sp-cursor-preview sp-cursor-preview--blade">' +
                            '<svg width="60" height="40" viewBox="0 0 60 40" fill="none" aria-hidden="true">' +
                                '<circle cx="30" cy="20" r="13" stroke="rgba(255,107,53,0.8)" stroke-width="1" stroke-dasharray="7 5 7 5 7 5 7 5"/>' +
                                '<line x1="22" y1="20" x2="38" y2="20" stroke="#ff6b35" stroke-width="1"/>' +
                                '<line x1="30" y1="12" x2="30" y2="28" stroke="#ff6b35" stroke-width="1"/>' +
                                '<circle cx="30" cy="20" r="2" fill="rgba(255,107,53,0.6)"/>' +
                                '<circle cx="30" cy="20" r="5" fill="rgba(255,107,53,0.1)"/>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="sp-cursor-label">' + t('cursorBlade') + '</span>' +
                        '<span class="sp-cursor-desc">' + t('cursorBladeDesc') + '</span>' +
                        '<span class="sp-cursor-check">✓</span>' +
                    '</button>' +

                    '<button class="sp-cursor-card sp-cursor-card--blaze' + (cfg.cursorStyle === 'blaze' ? ' active' : '') + '" data-cursor="blaze">' +
                        '<div class="sp-cursor-preview sp-cursor-preview--blaze">' +
                            '<svg width="60" height="40" viewBox="0 0 60 40" fill="none" aria-hidden="true">' +
                                '<circle cx="31" cy="21" r="5" fill="rgba(255,215,0,0.18)"/>' +
                                '<circle cx="31" cy="21" r="3" fill="rgba(255,215,0,0.35)"/>' +
                                '<circle cx="31" cy="21" r="9" stroke="rgba(255,215,0,0.3)" stroke-width="1"/>' +
                                '<circle cx="31" cy="21" r="13" stroke="rgba(255,215,0,0.12)" stroke-width="1"/>' +
                                '<polygon points="24,10 24,30 28,25.5 31,32 33.5,31 30.5,24.5 36,24.5" fill="#ffd700" opacity="0.92"/>' +
                                '<polygon points="24,10 24,30 28,25.5 31,32 33.5,31 30.5,24.5 36,24.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.7" stroke-linejoin="round"/>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="sp-cursor-label">' + t('cursorBlaze') + '</span>' +
                        '<span class="sp-cursor-desc">' + t('cursorBlazeDesc') + '</span>' +
                        '<span class="sp-cursor-check">✓</span>' +
                    '</button>' +

                    '<button class="sp-cursor-card' + (cfg.cursorStyle === 'default' ? ' active' : '') + '" data-cursor="default">' +
                        '<div class="sp-cursor-preview sp-cursor-preview--default">' +
                            '<svg width="60" height="40" viewBox="0 0 60 40" fill="none" aria-hidden="true">' +
                                '<path d="M26 10 L26 30 L30 26 L34 34 L37 33 L33 25 L39 25 Z" fill="currentColor" stroke="none"/>' +
                                '<path d="M26 10 L26 30 L30 26 L34 34 L37 33 L33 25 L39 25 Z" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" stroke-linejoin="round"/>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="sp-cursor-label">' + t('cursorDefault') + '</span>' +
                        '<span class="sp-cursor-desc">' + t('cursorDefaultDesc') + '</span>' +
                        '<span class="sp-cursor-check">✓</span>' +
                    '</button>' +

                '</div>' +
            '</div>' +

        '</div>';
    }

    function buildProfile(cfg) {
        var avatarContent = cfg.avatarEmoji ? esc(cfg.avatarEmoji) : esc(getInitials(cfg.userName));
        var greeting = cfg.userName ? t('profileGreeting') + ' ' + cfg.userName.split(' ')[0] + '!' : '';

        var emojiOptions = ['💼','🧑‍💻','👤','🤖','🔍','⚡'].map(function (em) {
            return '<button class="sp-emoji-opt' + (cfg.avatarEmoji === em ? ' active' : '') +
                   '" data-emoji="' + esc(em) + '" title="' + esc(em) + '">' + em + '</button>';
        }).join('');

        return '<div class="sp-content-inner">' +
            '<h3 class="sp-content-title">' + t('profileTitle') + '</h3>' +

            '<div class="sp-avatar-wrap">' +
                '<div class="sp-avatar-lg" id="spAvatar">' + avatarContent + '</div>' +
                (greeting ? '<p class="sp-greeting" id="spGreeting">' + esc(greeting) + '</p>' : '<p class="sp-greeting" id="spGreeting" style="opacity:0"></p>') +
                '<div class="sp-emoji-row" id="spEmojiRow">' + emojiOptions + '</div>' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label" for="spUserName">' + t('labelName') + '</label>' +
                '<input type="text" id="spUserName" class="sp-input" placeholder="' + esc(t('namePlaceholder')) + '" value="' + esc(cfg.userName) + '" maxlength="40" autocomplete="name">' +
            '</div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label" for="spUserEmail">' + t('labelEmail') + '</label>' +
                '<input type="email" id="spUserEmail" class="sp-input" placeholder="' + esc(t('emailPlaceholder')) + '" value="' + esc(cfg.userEmail || '') + '" maxlength="80" autocomplete="email">' +
            '</div>' +

            '<p class="sp-note">' + t('profileNote') + '</p>' +
        '</div>';
    }

    function buildPrivacy(cfg) {
        var wipes = [1,3,5,10,30];
        var wipeBtns = wipes.map(function (w) {
            return '<button class="sp-seg-btn' + (cfg.wipeMinutes === w ? ' active' : '') +
                   '" data-val="' + w + '">' + t('wipe'+w) + '</button>';
        }).join('');

        var wipeCurrent = t('wipeCurrently').replace('{n}', cfg.wipeMinutes);

        var lastClearedTs = localStorage.getItem('IS_last_cleared');
        var lastClearedStr;
        if (lastClearedTs) {
            try {
                var d = new Date(parseInt(lastClearedTs, 10));
                lastClearedStr = t('lastCleared') + d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            } catch(e) {
                lastClearedStr = t('neverCleared');
            }
        } else {
            lastClearedStr = t('neverCleared');
        }

        return '<div class="sp-content-inner">' +
            '<h3 class="sp-content-title">' + t('privacyTitle') + '</h3>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('labelWipePrivacy') + '</label>' +
                '<div class="sp-seg-group sp-seg-group--wipe" id="spWipeGroupP">' + wipeBtns + '</div>' +
                '<p class="sp-wipe-readout" id="spWipeReadoutP">' + esc(wipeCurrent) + '</p>' +
            '</div>' +

            '<div class="sp-field sp-field--row">' +
                '<span class="sp-field-label">' + t('labelSound') + '</span>' +
                '<label class="sp-toggle">' +
                    '<input type="checkbox" id="spSound"' + (cfg.soundEnabled ? ' checked' : '') + '>' +
                    '<span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>' +
                '</label>' +
            '</div>' +

            '<div class="sp-divider"></div>' +

            '<div class="sp-field">' +
                '<label class="sp-field-label">' + t('dataManagement') + '</label>' +
                '<div class="sp-danger-stack">' +
                    '<button class="sp-danger-btn" id="spClearHistory">' + ICONS.trash + t('btnClearHistory') + '</button>' +
                    '<button class="sp-danger-btn" id="spClearAnalytics">' + ICONS.trash + t('btnClearAnalytics') + '</button>' +
                    '<button class="sp-danger-btn sp-danger-btn--strong" id="spClearAll">' + ICONS.trash + t('btnClearAll') + '</button>' +
                '</div>' +
                '<p class="sp-last-cleared" id="spLastCleared">' + esc(lastClearedStr) + '</p>' +
            '</div>' +

            '<p class="sp-note sp-note--privacy">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;margin-top:1px" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
                t('privacyNote') +
            '</p>' +
        '</div>';
    }

    function buildShortcuts(cfg) {
        var rows = [
            { keys: ['Alt', '1'],     desc: 'scAlt1' },
            { keys: ['Alt', '2'],     desc: 'scAlt2' },
            { keys: ['Alt', '3'],     desc: 'scAlt3' },
            { keys: ['Alt', 'S'],     desc: 'scAltS' },
            { keys: ['Ctrl', '↵'],   desc: 'scCtrlEnter' },
            { keys: ['Esc'],          desc: 'scEsc' }
        ];
        var tableRows = rows.map(function (r) {
            var kbds = r.keys.map(function (k) { return '<kbd class="sp-kbd">' + k + '</kbd>'; }).join('<span class="sp-plus">+</span>');
            return '<tr><td class="sp-sc-keys">' + kbds + '</td><td class="sp-sc-desc">' + t(r.desc) + '</td></tr>';
        }).join('');

        return '<div class="sp-content-inner">' +
            '<h3 class="sp-content-title">' + t('shortcutsTitle') + '</h3>' +

            '<div class="sp-field sp-field--row">' +
                '<span class="sp-field-label">' + t('labelEnableShortcuts') + '</span>' +
                '<label class="sp-toggle">' +
                    '<input type="checkbox" id="spShortcutsEnabled"' + (cfg.shortcutsEnabled ? ' checked' : '') + '>' +
                    '<span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>' +
                '</label>' +
            '</div>' +

            '<div class="sp-sc-table-wrap">' +
                '<table class="sp-sc-table">' +
                    '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
            '</div>' +

            '<button class="sp-copy-shortcuts-btn" id="spCopyShortcuts">' +
                ICONS.copy + ' ' + t('copyShortcuts') +
            '</button>' +

            '<p class="sp-note">' + t('shortcutsNote') + '</p>' +
        '</div>';
    }

    function buildAbout() {
        var showInstall = !!window._IS_deferredInstall;

        var changelogItems = ['changelog1','changelog2','changelog3','changelog4','changelog5'].map(function(k){
            return '<li class="sp-changelog-item">' + ICONS.zap + '<span>' + t(k) + '</span></li>';
        }).join('');

        return '<div class="sp-content-inner sp-about-content">' +

            '<div class="sp-about-section-label">' + t('aboutAppSection') + '</div>' +
            '<div class="sp-app-card">' +
                '<div class="sp-app-logo">' +
                    '<img src="logo.png" alt="IdentIQ" style="width:44px;height:44px;border-radius:10px;object-fit:cover;">' +
                '</div>' +
                '<div class="sp-app-info">' +
                    '<div class="sp-app-name-row">' +
                        '<span class="sp-app-name">' + t('appName') + '</span>' +
                        '<span class="sp-version-badge">' + t('appVersion') + '</span>' +
                        '<span class="sp-released-badge">' + APP_META.released + '</span>' +
                    '</div>' +
                    '<p class="sp-app-tagline">' + t('appTagline') + '</p>' +
                    '<p class="sp-powered-by">' + t('poweredBy') + '</p>' +
                '</div>' +
            '</div>' +

            '<div class="sp-about-actions">' +
                '<button class="sp-about-btn" id="spInstallBtn" style="' + (!!window._IS_deferredInstall ? '' : 'display:none;') + '">' +
                    ICONS.download + t('btnInstall') +
                '</button>' +
                '<button class="sp-about-btn" id="spUpdateBtn">' +
                    ICONS.refresh + t('btnUpdate') +
                '</button>' +
            '</div>' +

            '<div class="sp-about-section-label">' + t('aboutDeveloperSection') + '</div>' +
            '<div class="sp-dev-card">' +
                '<div class="sp-dev-avatar">CM</div>' +
                '<div class="sp-dev-info">' +
                    '<div class="sp-dev-name">' + APP_META.developer + '</div>' +
                    '<div class="sp-dev-tagline">' + t('developerTagline') + '</div>' +
                    '<div class="sp-dev-meta-row">' +
                        '<span class="sp-dev-meta-item">' + ICONS.pin + ' ' + t('locationVal') + '</span>' +
                        '<span class="sp-dev-meta-item">' + ICONS.clock + ' ' + t('supportHoursVal') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="sp-about-section-label">' + t('aboutSupportSection') + '</div>' +
            '<div class="sp-contact-card">' +
                '<a href="mailto:' + APP_META.email + '" class="sp-contact-item">' +
                    '<span class="sp-contact-icon">✉️</span>' +
                    '<div>' +
                        '<div class="sp-contact-label">' + t('labelEmailSupport') + '</div>' +
                        '<div class="sp-contact-val">' + APP_META.email + '</div>' +
                    '</div>' +
                '</a>' +
                '<a href="' + APP_META.whatsappUrl + '" target="_blank" rel="noopener" class="sp-contact-item sp-contact-item--wa">' +
                    '<span class="sp-contact-icon">💬</span>' +
                    '<div>' +
                        '<div class="sp-contact-label">' + t('labelWA') + '</div>' +
                        '<div class="sp-contact-val">' + APP_META.whatsapp + '</div>' +
                    '</div>' +
                '</a>' +
                '<a href="' + APP_META.github + '" target="_blank" rel="noopener" class="sp-contact-item sp-contact-item--gh">' +
                    '<span class="sp-contact-icon">🐙</span>' +
                    '<div>' +
                        '<div class="sp-contact-label">' + t('labelGithub') + '</div>' +
                        '<div class="sp-contact-val">' + t('githubVal') + '</div>' +
                    '</div>' +
                '</a>' +
            '</div>' +

            '<div class="sp-about-section-label">' + t('aboutProjectsSection') + '</div>' +
            '<div class="sp-projects-grid">' +
                '<a href="' + APP_META.nexusApp + '" target="_blank" rel="noopener" class="sp-project-card sp-project-card--primary">' +
                    '<span class="sp-project-icon">🔍</span>' +
                    '<div class="sp-project-info">' +
                        '<div class="sp-project-name">' + t('projectNexus') + '</div>' +
                        '<div class="sp-project-url">nexux-gen.netlify.app</div>' +
                    '</div>' +
                    '<span class="sp-project-star">' + ICONS.star + '</span>' +
                '</a>' +
                '<a href="' + APP_META.ocrApp + '" target="_blank" rel="noopener" class="sp-project-card">' +
                    '<span class="sp-project-icon">📄</span>' +
                    '<div class="sp-project-info">' +
                        '<div class="sp-project-name">' + t('projectOcr') + '</div>' +
                        '<div class="sp-project-url">personal-ocr-tool.netlify.app</div>' +
                    '</div>' +
                    ICONS.globe +
                '</a>' +
                '<a href="' + APP_META.deenApp + '" target="_blank" rel="noopener" class="sp-project-card">' +
                    '<span class="sp-project-icon">🕌</span>' +
                    '<div class="sp-project-info">' +
                        '<div class="sp-project-name">' + t('projectDeen') + '</div>' +
                        '<div class="sp-project-url">deen-toolkit.netlify.app</div>' +
                    '</div>' +
                    ICONS.globe +
                '</a>' +
            '</div>' +

            '<div class="sp-about-section-label">' + t('changelogTitle') + '</div>' +
            '<ul class="sp-changelog-list">' + changelogItems + '</ul>' +

            '<div class="sp-divider"></div>' +

            '<div class="sp-about-section-label">' + t('aboutLegalSection') + '</div>' +
            '<button class="sp-about-btn sp-about-btn--full" id="spPrivacyBtn">' +
                ICONS.lock + ' ' + t('privacyPolicyBtn') +
            '</button>' +
            '<p class="sp-copyright-notice">' + t('copyrightNotice') + '</p>' +

            '<div class="sp-divider"></div>' +

            '<button class="sp-reset-btn" id="spResetBtn">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>' +
                t('btnReset') +
            '</button>' +
        '</div>';
    }

    function showPrivacyPolicy() {
        var overlay = document.createElement('div');
        overlay.className = 'sp-privacy-overlay';

        var L = lang();
        var content = L === 'ur'
            ? buildPrivacyContentUr()
            : buildPrivacyContentEn();

        overlay.innerHTML =
            '<div class="sp-privacy-modal">' +
                '<div class="sp-privacy-header">' +
                    '<span class="sp-privacy-title">' + ICONS.lock + ' ' + t('privacyPolicyTitle') + '</span>' +
                    '<button class="sp-close-x" id="spPrivacyClose" aria-label="Close">' + ICONS.close + '</button>' +
                '</div>' +
                '<div class="sp-privacy-body">' + content + '</div>' +
                '<div class="sp-privacy-footer">' + APP_META.privacyVer + ' &nbsp;·&nbsp; ' + APP_META.copyright + '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('sp-privacy-open'); }, 10);

        overlay.querySelector('#spPrivacyClose').addEventListener('click', function () {
            overlay.classList.remove('sp-privacy-open');
            setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.classList.remove('sp-privacy-open');
                setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
            }
        });
    }

    function buildPrivacyContentEn() {
        return '' +
        '<h4>Privacy Policy — IdentIQ v4.4</h4>' +
        '<p class="sp-pp-date">Effective Date: January 1, 2024 &nbsp;|&nbsp; Developer: Creative Men, Jhang, Punjab, Pakistan</p>' +

        '<h5>1. Data We Collect</h5>' +
        '<p>IdentIQ does <strong>not</strong> collect, transmit, or store any personal data on external servers. All information you enter — including names, emails, extracted identity data, and analytics — is stored exclusively in your browser\'s <code>localStorage</code> on your own device.</p>' +

        '<h5>2. Local Storage Only</h5>' +
        '<p>The following data may be saved locally on your device:</p>' +
        '<ul><li>Your display name and email (optional, for profile)</li><li>App settings and preferences</li><li>Extraction history and analytics counters</li><li>Theme and language preference</li></ul>' +
        '<p>None of this data leaves your device. You can delete it at any time via <strong>Privacy → Clear All Data</strong>.</p>' +

        '<h5>3. Third-Party Services</h5>' +
        '<p>IdentIQ does not integrate with any third-party analytics, advertising, or tracking services. No cookies are set. No telemetry is sent.</p>' +

        '<h5>4. Service Worker & Caching</h5>' +
        '<p>IdentIQ uses a service worker to cache app files locally for offline use. This cache contains only app code and assets — no user data is cached by the service worker.</p>' +

        '<h5>5. External Links</h5>' +
        '<p>This app contains links to external sites (GitHub, WhatsApp, Netlify-hosted projects). Creative Men is not responsible for the privacy practices of those external services.</p>' +

        '<h5>6. Children\'s Privacy</h5>' +
        '<p>IdentIQ is not directed at children under 13. We do not knowingly collect any information from minors.</p>' +

        '<h5>7. Changes to This Policy</h5>' +
        '<p>We may update this policy occasionally. Updates will be reflected in the app version notes. Continued use of the app constitutes acceptance of any changes.</p>' +

        '<h5>8. Contact</h5>' +
        '<p>For privacy questions, contact us at <a href="mailto:creativemen70@gmail.com" style="color:var(--c-accent)">creativemen70@gmail.com</a> or WhatsApp <strong>0321-8232140</strong>.</p>';
    }

    function buildPrivacyContentUr() {
        return '' +
        '<h4>رازداری پالیسی — IdentIQ v4.4</h4>' +
        '<p class="sp-pp-date">تاریخ نفاذ: یکم جنوری 2024 &nbsp;|&nbsp; ڈویلپر: Creative Men، جھنگ، پنجاب، پاکستان</p>' +

        '<h5>1. ڈیٹا اکٹھا کرنا</h5>' +
        '<p>IdentIQ کسی بھی بیرونی سرور پر آپ کا ذاتی ڈیٹا <strong>اکٹھا، منتقل یا محفوظ نہیں کرتا</strong>۔ تمام معلومات صرف آپ کے براؤزر کی <code>localStorage</code> میں محفوظ ہوتی ہیں۔</p>' +

        '<h5>2. مقامی اسٹوریج</h5>' +
        '<p>درج ذیل ڈیٹا آپ کی ڈیوائس پر مقامی طور پر محفوظ ہو سکتا ہے:</p>' +
        '<ul><li>آپ کا نمائشی نام اور ای میل (اختیاری)</li><li>ایپ ترتیبات</li><li>نکالنے کی تاریخ اور تجزیات</li><li>تھیم اور زبان کی ترجیح</li></ul>' +
        '<p>یہ ڈیٹا آپ کی ڈیوائس نہیں چھوڑتا۔ آپ اسے <strong>رازداری → تمام ڈیٹا صاف کریں</strong> سے حذف کر سکتے ہیں۔</p>' +

        '<h5>3. تھرڈ پارٹی سروسز</h5>' +
        '<p>IdentIQ کسی بھی اشتہاری یا ٹریکنگ سروس سے منسلک نہیں ہے۔ کوئی کوکی سیٹ نہیں ہوتی۔</p>' +

        '<h5>4. رابطہ</h5>' +
        '<p>رازداری سے متعلق سوالات کے لیے: <a href="mailto:creativemen70@gmail.com" style="color:var(--c-accent)">creativemen70@gmail.com</a></p>';
    }

    function buildSidebarNav() {
        return NAV_ITEMS.map(function (item) {
            return '<button class="sp-nav-item' + (item.id === _activeNav ? ' active' : '') +
                   '" data-section="' + item.id + '" role="tab" aria-selected="' +
                   (item.id === _activeNav ? 'true' : 'false') + '">' +
                ICONS[item.iconKey] +
                '<span class="sp-nav-label">' + t(item.strKey) + '</span>' +
            '</button>';
        }).join('');
    }

    function buildContentPane(cfg) {
        switch (_activeNav) {
            case 'general':    return buildGeneral(cfg);
            case 'appearance': return buildAppearance(cfg);
            case 'profile':    return buildProfile(cfg);
            case 'privacy':    return buildPrivacy(cfg);
            case 'shortcuts':  return buildShortcuts(cfg);
            case 'about':      return buildAbout();
            default:           return buildGeneral(cfg);
        }
    }

    function buildPanelHTML(cfg) {
        return (
            '<div class="sp-header" id="spHeader">' +
                '<div class="sp-header-inner">' +
                    ICONS.gear +
                    '<span class="sp-header-title">' + t('settingsTitle') + '</span>' +
                '</div>' +
                '<button class="sp-close-x" id="spCloseX" aria-label="Close settings">' + ICONS.close + '</button>' +
            '</div>' +

            '<div class="sp-layout">' +
                '<nav class="sp-sidebar" role="tablist" aria-label="Settings sections">' +
                    buildSidebarNav() +
                '</nav>' +

                '<div class="sp-content" id="spContent" role="tabpanel">' +
                    buildContentPane(cfg) +
                '</div>' +
            '</div>'
        );
    }

    function ensureDOM() {
        if (_overlay) return;

        _overlay = document.createElement('div');
        _overlay.id = 'settingsOverlay';
        _overlay.className = 'sp-overlay';
        _overlay.setAttribute('aria-hidden', 'true');
        _overlay.addEventListener('click', function (e) {
            if (e.target === _overlay) closePanel();
        });

        _panel = document.createElement('div');
        _panel.id = 'settingsPanel';
        _panel.className = 'sp-panel';
        _panel.setAttribute('role', 'dialog');
        _panel.setAttribute('aria-modal', 'true');
        _panel.setAttribute('aria-label', 'Settings');

        _overlay.appendChild(_panel);
        document.body.appendChild(_overlay);
    }

    function renderPanel() {
        var cfg = readSettings();
        _panel.innerHTML = buildPanelHTML(cfg);
        bindEvents(cfg);
    }

    function setupFocusTrap() {
        var focusable = 'button:not([disabled]), input, select, a[href], [tabindex]:not([tabindex="-1"])';
        _focusTrap = function (e) {
            if (e.key !== 'Tab') return;
            var els = Array.prototype.slice.call(_panel.querySelectorAll(focusable));
            if (!els.length) return;
            var first = els[0], last = els[els.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', _focusTrap);
    }

    function removeFocusTrap() {
        if (_focusTrap) { document.removeEventListener('keydown', _focusTrap); _focusTrap = null; }
    }

    function openPanel(section) {
        ensureDOM();
        if (section && NAV_ITEMS.some(function (n) { return n.id === section; })) {
            _activeNav = section;
        }
        renderPanel();
        _overlay.classList.add('sp-open');
        _overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('sp-no-scroll');

        var gearBtn = document.getElementById('settingsGearBtn');
        if (gearBtn) gearBtn.classList.add('sp-gear-btn--open');
        if (gearBtn) gearBtn.classList.remove('sp-gear-dot');

        setTimeout(function () {
            var el = _panel.querySelector('.sp-content input, .sp-content select, .sp-content button');
            if (el) el.focus();
            setupFocusTrap();
        }, 180);
    }

    function closePanel() {
        if (!_overlay) return;
        _overlay.classList.remove('sp-open');
        _overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sp-no-scroll');
        removeFocusTrap();

        var gearBtn = document.getElementById('settingsGearBtn');
        if (gearBtn) gearBtn.classList.remove('sp-gear-btn--open');
        if (gearBtn) gearBtn.focus();
    }

    function switchSection(id) {
        _activeNav = id;
        try { sessionStorage.setItem('SP_lastNav', id); } catch(e) {}

        _panel.querySelectorAll('.sp-nav-item').forEach(function (btn) {
            var isActive = btn.getAttribute('data-section') === id;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        var pane = document.getElementById('spContent');
        if (pane) {
            pane.classList.add('sp-content--exit');
            setTimeout(function () {
                var cfg = readSettings();
                pane.innerHTML = buildContentPane(cfg);
                pane.classList.remove('sp-content--exit');
                pane.classList.add('sp-content--enter');
                setTimeout(function () { pane.classList.remove('sp-content--enter'); }, 150);
                bindContentEvents(cfg);
            }, 120);
        }
    }

    function bindEvents(cfg) {
        var closeX = document.getElementById('spCloseX');
        if (closeX) closeX.addEventListener('click', closePanel);

        _panel.querySelectorAll('.sp-nav-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchSection(btn.getAttribute('data-section'));
            });
        });

        bindContentEvents(cfg);
    }

    function bindContentEvents(cfg) {
        var pane = document.getElementById('spContent');
        if (!pane) return;

        switch (_activeNav) {
            case 'general':    bindGeneral(cfg);    break;
            case 'appearance': bindAppearance(cfg); break;
            case 'profile':    bindProfile(cfg);    break;
            case 'privacy':    bindPrivacy(cfg);    break;
            case 'shortcuts':  bindShortcuts(cfg);  break;
            case 'about':      bindAbout();         break;
        }
    }

    function bindGeneral(cfg) {
        var tabGroup = document.getElementById('spTabGroup');
        if (tabGroup) {
            tabGroup.querySelectorAll('.sp-seg-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    tabGroup.querySelectorAll('.sp-seg-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var val = btn.getAttribute('data-val');
                    saveProp('defaultTab', val);
                    applyDefaultTab(val);
                    microToast(btn);
                });
            });
        }

        var countryEl = document.getElementById('spCountry');
        var cityEl    = document.getElementById('spCity');
        if (countryEl) {
            countryEl.addEventListener('change', function () {
                saveProp('defaultCountry', countryEl.value);
                if (cityEl) {
                    cityEl.innerHTML = buildCityOpts(countryEl.value, '');
                    saveProp('defaultCity', '');
                }
                applyDefaultCountryCity(countryEl.value, '');
                microToast(countryEl);
            });
        }
        if (cityEl) {
            cityEl.addEventListener('change', function () {
                saveProp('defaultCity', cityEl.value);
                applyDefaultCountryCity(readSettings().defaultCountry, cityEl.value);
                microToast(cityEl);
            });
        }

        bindWipeGroup('spWipeGroup', 'spWipeReadout');

        var scBar = document.getElementById('spShortcutsBar');
        if (scBar) {
            scBar.addEventListener('change', function () {
                saveProp('shortcutsVisible', scBar.checked);
                applyShortcutsVisibility(scBar.checked);
            });
        }
    }

    function bindAppearance(cfg) {
        var themeCards = document.getElementById('spThemeCards');
        if (themeCards) {
            themeCards.querySelectorAll('.sp-theme-card').forEach(function (card) {
                card.addEventListener('click', function () {
                    var mode = card.getAttribute('data-theme');
                    themeCards.querySelectorAll('.sp-theme-card').forEach(function (c) { c.classList.remove('active'); });
                    card.classList.add('active');
                    if (window.IS && IS.theme) {
                        if (IS.theme._mode !== mode) IS.theme.toggle();
                    }
                });
            });
        }

        var langCards = document.getElementById('spLangCards');
        if (langCards) {
            langCards.querySelectorAll('.sp-lang-card').forEach(function (card) {
                card.addEventListener('click', function () {
                    var newLang = card.getAttribute('data-lang');
                    langCards.querySelectorAll('.sp-lang-card').forEach(function (c) { c.classList.remove('active'); });
                    card.classList.add('active');
                    if (window.IS && IS.i18n) IS.i18n.setLang(newLang);
                    window.dispatchEvent(new CustomEvent('IS_lang_changed'));
                    setTimeout(function () { renderPanel(); }, 80);
                });
            });
        }

        var cursorCards = document.getElementById('spCursorCards');
        if (cursorCards) {
            cursorCards.querySelectorAll('.sp-cursor-card').forEach(function (card) {
                card.addEventListener('click', function () {
                    cursorCards.querySelectorAll('.sp-cursor-card').forEach(function (c) { c.classList.remove('active'); });
                    card.classList.add('active');
                    var style = card.getAttribute('data-cursor');
                    saveProp('cursorStyle', style);
                    if (window._NexusCursor) _NexusCursor.setStyle(style);
                    microToast(card);
                });
            });
        }
    }

    function bindProfile(cfg) {
        var nameInput   = document.getElementById('spUserName');
        var emailInput  = document.getElementById('spUserEmail');
        var avatarEl    = document.getElementById('spAvatar');
        var greetingEl  = document.getElementById('spGreeting');
        var emojiRow    = document.getElementById('spEmojiRow');

        if (emojiRow) {
            emojiRow.querySelectorAll('.sp-emoji-opt').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var em = btn.getAttribute('data-emoji');
                    var newEmoji = (readSettings().avatarEmoji === em) ? '' : em;
                    saveProp('avatarEmoji', newEmoji);
                    emojiRow.querySelectorAll('.sp-emoji-opt').forEach(function (b) { b.classList.remove('active'); });
                    if (newEmoji) btn.classList.add('active');
                    if (avatarEl) {
                        avatarEl.textContent = newEmoji || getInitials(nameInput ? nameInput.value : cfg.userName);
                    }
                    microToast(btn);
                });
            });
        }

        if (nameInput && avatarEl) {
            nameInput.addEventListener('input', function () {
                var curEmoji = readSettings().avatarEmoji;
                if (!curEmoji) avatarEl.textContent = getInitials(nameInput.value);
                if (greetingEl) {
                    var first = nameInput.value.trim().split(' ')[0];
                    greetingEl.style.opacity = first ? '1' : '0';
                    greetingEl.textContent = first ? (t('profileGreeting') + ' ' + first + '!') : '';
                }
            });
            nameInput.addEventListener('change', function () {
                saveProp('userName', nameInput.value.trim());
                microToast(nameInput);
            });
        }
        if (emailInput) {
            emailInput.addEventListener('change', function () {
                saveProp('userEmail', emailInput.value.trim());
                microToast(emailInput);
            });
        }
    }

    function bindPrivacy(cfg) {
        bindWipeGroup('spWipeGroupP', 'spWipeReadoutP');

        var soundChk = document.getElementById('spSound');
        if (soundChk) {
            soundChk.addEventListener('change', function () {
                saveProp('soundEnabled', soundChk.checked);
                window._IS_soundEnabled = soundChk.checked;
            });
        }

        var clrHist = document.getElementById('spClearHistory');
        if (clrHist) {
            clrHist.addEventListener('click', function () {
                if (!confirm(t('confirmHistory'))) return;
                if (window.IS && IS.history) { IS.history.clear(); } else { localStorage.removeItem('IS_history_v4'); }
                localStorage.setItem('IS_last_cleared', Date.now().toString());
                _updateLastClearedDisplay();
                if (window.IS && IS.showToast) IS.showToast(t('clearedToast'), 'info');
            });
        }

        var clrAnalytics = document.getElementById('spClearAnalytics');
        if (clrAnalytics) {
            clrAnalytics.addEventListener('click', function () {
                if (!confirm(t('confirmAnalytics'))) return;
                if (window.IS && IS.analytics) { IS.analytics.clear(); } else { localStorage.removeItem('IS_analytics_v3'); }
                localStorage.setItem('IS_last_cleared', Date.now().toString());
                _updateLastClearedDisplay();
                if (window.IS && IS.showToast) IS.showToast(t('clearedToast'), 'info');
            });
        }

        var clrAll = document.getElementById('spClearAll');
        if (clrAll) {
            clrAll.addEventListener('click', function () {
                if (!confirm(t('confirmClearAll'))) return;
                ['IS_history_v4','IS_analytics_v3','IS_settings_v1','IS_lang_v4','IS_theme_v4'].forEach(function (k) {
                    localStorage.removeItem(k);
                });
                localStorage.setItem('IS_last_cleared', Date.now().toString());
                if (window.IS && IS.showToast) IS.showToast(t('clearedToast'), 'info');
                closePanel();
            });
        }
    }

    function _updateLastClearedDisplay() {
        var el = document.getElementById('spLastCleared');
        if (!el) return;
        var ts = localStorage.getItem('IS_last_cleared');
        if (ts) {
            try {
                var d = new Date(parseInt(ts, 10));
                el.textContent = t('lastCleared') + d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            } catch(e) {}
        }
    }

    function bindShortcuts(cfg) {
        var scEnabled = document.getElementById('spShortcutsEnabled');
        if (scEnabled) {
            scEnabled.addEventListener('change', function () {
                saveProp('shortcutsEnabled', scEnabled.checked);
                window._IS_shortcutsEnabled = scEnabled.checked;
            });
        }

        var copyBtn = document.getElementById('spCopyShortcuts');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var lines = [
                    'Alt + 1  — ' + t('scAlt1'),
                    'Alt + 2  — ' + t('scAlt2'),
                    'Alt + 3  — ' + t('scAlt3'),
                    'Alt + S  — ' + t('scAltS'),
                    'Ctrl + ↵ — ' + t('scCtrlEnter'),
                    'Esc      — ' + t('scEsc')
                ];
                var text = lines.join('\n');
                var done = function () { microToast(copyBtn); };
                if (window.IS && IS.fastCopy) {
                    IS.fastCopy(text);
                    done();
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(done).catch(done);
                }
            });
        }
    }

    function bindAbout() {
        var installBtn = document.getElementById('spInstallBtn');
        if (installBtn) {
            var _alreadyInstalled = sessionStorage.getItem('pwa_installed') || localStorage.getItem('pwa_installed');
            if (_alreadyInstalled) {
                installBtn.style.display = 'none';
            } else if (window._IS_deferredInstall) {
                installBtn.style.display = '';
                installBtn.addEventListener('click', function () {
                    if (!window._IS_deferredInstall) return;

                    var deferred = window._IS_deferredInstall;
                    window._IS_deferredInstall = null;
                    installBtn.style.display = 'none';
                    deferred.prompt();
                    deferred.userChoice.then(function (result) {
                        if (result.outcome === 'accepted') {
                            sessionStorage.setItem('pwa_installed', '1');
                            localStorage.setItem('pwa_installed', '1');
                        }
                    }).catch(function () {});
                });
            }
        }
        window.addEventListener('beforeinstallprompt', function() {
            if (sessionStorage.getItem('pwa_installed') || localStorage.getItem('pwa_installed')) return;
            var btn = document.getElementById('spInstallBtn');
            if (btn) btn.style.display = '';
        }, { once: true });

        var updateBtn = document.getElementById('spUpdateBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function () {
                updateBtn.disabled = true;
                updateBtn.innerHTML = ICONS.refresh + t('updateChecking');

                if (navigator.serviceWorker) {
                    navigator.serviceWorker.ready.then(function (reg) {
                        if (reg.waiting) {
                            reg.waiting.postMessage('SKIP_WAITING');
                            updateBtn.disabled = false;
                            updateBtn.innerHTML = ICONS.refresh + t('updateInstalling');
                        } else {
                            updateBtn.disabled = false;
                            updateBtn.innerHTML = ICONS.refresh + t('updateDone');
                        }
                    }).catch(function () {
                        updateBtn.disabled = false;
                        updateBtn.innerHTML = ICONS.refresh + t('updateDone');
                    });
                } else {
                    setTimeout(function () {
                        updateBtn.disabled = false;
                        updateBtn.innerHTML = ICONS.refresh + t('updateDone');
                    }, 1000);
                }
            });
        }

        var privacyBtn = document.getElementById('spPrivacyBtn');
        if (privacyBtn) {
            privacyBtn.addEventListener('click', function () {
                showPrivacyPolicy();
            });
        }

        var resetBtn = document.getElementById('spResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (!confirm(t('resetConfirm'))) return;
                writeSettings(DEFAULTS);
                if (window.IS && IS.theme && IS.theme._mode !== 'dark') IS.theme.toggle();
                if (window.IS && IS.i18n) IS.i18n.setLang('en');
                applyShortcutsVisibility(true);
                closePanel();
                if (window.IS && IS.showToast) IS.showToast('↺ Settings reset', 'info');
                setTimeout(function () { location.reload(); }, 600);
            });
        }
    }

    function bindWipeGroup(groupId, readoutId) {
        var grp = document.getElementById(groupId);
        if (!grp) return;
        grp.querySelectorAll('.sp-seg-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                grp.querySelectorAll('.sp-seg-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var mins = parseInt(btn.getAttribute('data-val'), 10);
                saveProp('wipeMinutes', mins);
                window._IS_wipeMins = mins;
                window.dispatchEvent(new CustomEvent('IS_wipe_mins_changed', { detail: mins }));
                if (readoutId) {
                    var readout = document.getElementById(readoutId);
                    if (readout) readout.textContent = t('wipeCurrently').replace('{n}', mins);
                }
                microToast(btn);
            });
        });
    }

    function applySettings(cfg) {
        window._IS_soundEnabled      = cfg.soundEnabled;
        window._IS_wipeMins          = cfg.wipeMinutes;
        window._IS_shortcutsEnabled  = cfg.shortcutsEnabled;
        applyShortcutsVisibility(cfg.shortcutsVisible);
        window.dispatchEvent(new CustomEvent('IS_wipe_mins_changed',    { detail: cfg.wipeMinutes }));
        window.dispatchEvent(new CustomEvent('IS_settings_changed',     { detail: cfg }));

        if (window._NexusCursor && cfg.cursorStyle) {
            _NexusCursor.setStyle(cfg.cursorStyle);
        }
    }

    function applyShortcutsVisibility(show) {
        var bar = document.querySelector('.shortcut-legend');
        if (bar) bar.style.display = show ? '' : 'none';
    }

    function applyDefaultTab(tabId) {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabId);
        } else {
            var btn = document.querySelector('.nav-tab[data-target="' + tabId + '"]');
            if (btn) btn.click();
        }
    }

    function applyDefaultCountryCity(country, city) {
        var SETTINGS_TO_GEN_KEY = {
            'pakistan':    'Pakistan',
            'india':       'India',
            'uae':         'UAE',
            'qatar':       'Qatar',
            'saudiarabia': 'SaudiArabia',
            'kuwait':      'Kuwait',
            'bahrain':     'Bahrain',
            'oman':        'Oman',
            'bangladesh':  'Bangladesh',
            'nepal':       'Nepal',
            'afghanistan': 'Afghanistan'
        };
        var countryEl = document.getElementById('country-select');
        var cityEl    = document.getElementById('city-select');
        var genKey    = SETTINGS_TO_GEN_KEY[country] || country;
        if (countryEl && genKey) {
            countryEl.value = genKey;
            countryEl.dispatchEvent(new Event('change', { bubbles: true }));
            if (cityEl && city) {
                setTimeout(function () {
                    cityEl.value = city;
                    cityEl.dispatchEvent(new Event('change', { bubbles: true }));
                }, 150);
            }
        }
    }

    function patchCopySound() {
        if (!window.IS || !IS.playCopySound) return;
        var orig = IS.playCopySound;
        IS.playCopySound = function () {
            if (window._IS_soundEnabled === false) return;
            orig.call(IS);
        };
    }

    function injectGearButton() {
        if (document.getElementById('settingsGearBtn')) return;
        var container = document.querySelector('.nav-container');
        if (!container) return;

        ['themeToggleBtn','langToggleBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.removeAttribute('aria-hidden');
                el.removeAttribute('tabindex');
            }
        });

        var btn = document.createElement('button');
        btn.id = 'settingsGearBtn';
        btn.className = 'sp-gear-btn';
        btn.setAttribute('aria-label', 'Open Settings (Alt+S)');
        btn.setAttribute('title', 'Settings  ·  Alt+S');
        btn.innerHTML = ICONS.gear;
        btn.addEventListener('click', function () { openPanel(); });

        container.appendChild(btn);
    }

    function init() {
        injectGearButton();
        patchCopySound();

        var saved = readSettings();
        applySettings(saved);

        if (!_startupApplied) {
            _startupApplied = true;
            applyDefaultTab(saved.defaultTab);
            applyDefaultCountryCity(saved.defaultCountry, saved.defaultCity);
        }

        _checkSWUpdateDot();

        document.addEventListener('keydown', function (e) {
            if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
                e.preventDefault();
                if (_overlay && _overlay.classList.contains('sp-open')) {
                    closePanel();
                } else {
                    openPanel();
                }
            }
            if (e.key === 'Escape' && _overlay && _overlay.classList.contains('sp-open')) {
                closePanel();
            }
        });

        window.addEventListener('IS_lang_changed', function () {
            if (_overlay && _overlay.classList.contains('sp-open')) {
                renderPanel();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.IS = window.IS || {};
    window.IS.settings = {
        open:  openPanel,
        close: closePanel,
        read:  readSettings,
        write: writeSettings,
        apply: applySettings
    };

})();

} catch (e) {
    console.error('[IdentIQ] settings.js failed to initialise:', e);
}
