---
name: check-translations
description: >-
  Scans the codebase for React-i18next translation key calls (e.g. t('some.key')) and automatically heals and adds missing keys into locales JSON files.
---

# Check Translations

## Overview
This skill provides automated verification and healing of translation keys used in the codebase. It scans files under `src/` for standalone i18n lookup functions (`t('...')`) and ensures they are mapped in all localized JSON files under `src/locales/`. If any key is missing, it inserts placeholder translations automatically.

## Files Involved
- Validation tool: [check-translations.js](file:///c:/VCS/sandbox/workers-listing/scripts/check-translations.js)
- English dictionary: [translation.json](file:///c:/VCS/sandbox/workers-listing/src/locales/en/translation.json)
- Sinhala dictionary: [translation.json](file:///c:/VCS/sandbox/workers-listing/src/locales/si/translation.json)
- Tamil dictionary: [translation.json](file:///c:/VCS/sandbox/workers-listing/src/locales/ta/translation.json)

## Quick Start
Run the check script from the project root using Node.js:
```bash
node scripts/check-translations.js
```

## Workflow

### 1. Perform Scan and Fix
- Run the validation command `node scripts/check-translations.js` whenever:
  - You add new UI components that use translations (`t('key')`).
  - You edit or rename translation namespaces.
  - You observe translation paths (e.g., `WORKER.TOWN`) displaying on screen.

### 2. Verify JSON Changes
- Check git diff or inspect the translation files.
- If the script inserted placeholder values (e.g. `"District"` for `"worker.district"`), translate those placeholder values manually into other languages like Sinhala and Tamil.

### 3. Clear Browser Cache / Restart Server
- If keys are defined in translation files but still show up as uppercase strings in the browser, the browser or bundler memory cache may be stale.
- Reload the page using hard refresh (`Ctrl + F5` or `Cmd + Shift + R`) or restart the development server.
