import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locales = ['en', 'si', 'ta'];
const srcDir = path.join(__dirname, '../src');
const localesDir = path.join(__dirname, '../src/locales');

// Helper to recursively get all JS/JSX files
function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'locales' && file !== 'assets' && file !== 'node_modules') {
        getFiles(filePath, files);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      files.push(filePath);
    }
  }
  return files;
}

// Deep set utility for nested objects
function setDeep(obj, pathArray, value) {
  let current = obj;
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = pathArray[pathArray.length - 1];
  if (!(lastKey in current)) {
    current[lastKey] = value;
    return true; // Key was added
  }
  return false; // Key already existed
}

// Deep get utility
function hasDeep(obj, pathArray) {
  let current = obj;
  for (const key of pathArray) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  return true;
}

// Main logic
function checkAndFix() {
  console.log('Scanning source files for i18n keys...');
  const files = getFiles(srcDir);
  const keys = new Set();

  // Regex to match standalone t('some.key') or t("some.key")
  const regex = /\bt\(\s*(['"`])(.*?)\1/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[2];
      // Avoid matching dynamic keys or empty/invalid keys
      if (key && !key.includes('${') && !key.includes('+') && !key.startsWith('categories.')) {
        keys.add(key);
      }
    }
  }

  console.log(`Found ${keys.size} static translation keys in code.`);

  let updatedAny = false;

  for (const locale of locales) {
    const filePath = path.join(localesDir, locale, 'translation.json');
    if (!fs.existsSync(filePath)) {
      console.error(`Translation file missing: ${filePath}`);
      continue;
    }

    let translationJson;
    try {
      translationJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Error parsing JSON at ${filePath}:`, e.message);
      continue;
    }

    let localeUpdated = false;
    for (const key of keys) {
      const parts = key.split('.');
      if (!hasDeep(translationJson, parts)) {
        // Generate a placeholder value
        const lastPart = parts[parts.length - 1];
        // Humanize last part, e.g. "resultsTitle" -> "Results Title"
        const placeholder = lastPart
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();

        setDeep(translationJson, parts, placeholder);
        console.log(`[${locale}] Added missing key: "${key}" -> "${placeholder}"`);
        localeUpdated = true;
        updatedAny = true;
      }
    }

    if (localeUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(translationJson, null, 2) + '\n', 'utf8');
      console.log(`[${locale}] Saved updates to translation.json`);
    } else {
      console.log(`[${locale}] All keys are valid.`);
    }
  }

  if (updatedAny) {
    console.log('\nSuccess: Missing translation keys have been resolved automatically.');
  } else {
    console.log('\nSuccess: No missing translation keys found.');
  }
}

checkAndFix();
