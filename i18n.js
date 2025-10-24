/* i18n.js */
(() => {
  const AVAILABLE_LOCALES = ["ru","en","de","tr","uk","ro","es","fr","it","pl","vi","id","ar","zh-Hans","zh-Hant"];
  const DEFAULT_LOCALE = "ru";
  const I18N_VERSION = "2025-10-24";
  const DEBUG = true; // Включить debug mode

  const cacheKey = (lang) => `i18n:${lang}:${I18N_VERSION}`;
  const dictCache = new Map();
  let currentLang = DEFAULT_LOCALE;

  function log(message, ...args) {
    if (DEBUG) console.log(`[i18n] ${message}`, ...args);
  }

  async function loadDict(lang) {
    if (dictCache.has(lang)) {
      log(`Using cached dict for ${lang}`);
      return dictCache.get(lang);
    }

    const cached = localStorage.getItem(cacheKey(lang));
    if (cached) {
      log(`Loading ${lang} from localStorage`);
      const parsed = JSON.parse(cached);
      dictCache.set(lang, parsed);
      return parsed;
    }

    log(`Fetching ${lang}.json from server...`);
    const res = await fetch(`./locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`i18n: failed to load ${lang}`);
    const json = await res.json();
    log(`Loaded ${lang}.json, keys:`, Object.keys(json).length);
    localStorage.setItem(cacheKey(lang), JSON.stringify(json));
    dictCache.set(lang, json);
    return json;
  }

  function applyMeta(dict) {
    if (dict["meta.title"]) document.title = dict["meta.title"];
    const md = document.querySelector('meta[name="description"]');
    if (md && dict["meta.description"]) md.setAttribute("content", dict["meta.description"]);
    document.documentElement.setAttribute("lang", currentLang);
  }

  function applyTranslations(dict) {
    applyMeta(dict);
    const nodes = document.querySelectorAll("[data-i18n]");
    log(`Found ${nodes.length} elements with data-i18n`);

    const warned = new Set();
    let applied = 0;
    let missing = 0;

    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;

      const raw = dict[key];
      const attrs = (el.getAttribute("data-i18n-attr") || "").split(",").map(s => s.trim()).filter(Boolean);
      const asHtml = el.hasAttribute("data-i18n-html");

      if (raw !== undefined) {
        if (asHtml) el.innerHTML = raw;
        else el.textContent = raw;
        applied++;
      } else {
        if (!warned.has(key)) {
          console.warn(`[i18n] missing key: ${key}`);
          warned.add(key);
          missing++;
        }
      }

      if (attrs.length) {
        attrs.forEach(a => {
          const ak = `${key}.__attr__.${a}`;
          if (dict[ak] !== undefined) el.setAttribute(a, dict[ak]);
        });
      }
    });

    log(`Applied ${applied} translations, ${missing} keys missing`);
  }

  async function set(lang) {
    if (!AVAILABLE_LOCALES.includes(lang)) {
      log(`Lang ${lang} not available, using ${DEFAULT_LOCALE}`);
      lang = DEFAULT_LOCALE;
    }

    currentLang = lang;
    localStorage.setItem("i18n:lang", lang);
    log(`Switching to language: ${lang}`);

    try {
      const dict = await loadDict(lang);

      // fallback к ru
      if (lang !== "ru") {
        log(`Loading Russian fallback...`);
        const ru = await loadDict("ru");
        const merged = Object.assign({}, ru, dict);
        log(`Merged dict has ${Object.keys(merged).length} keys`);
        applyTranslations(merged);
      } else {
        applyTranslations(dict);
      }

      log(`Language switched to ${lang} successfully`);
    } catch (e) {
      console.error("[i18n] Error:", e);
    }
  }

  async function init() {
    const url = new URL(location.href);
    const q = url.searchParams.get("lang");
    const stored = localStorage.getItem("i18n:lang");
    const lang = q || stored || DEFAULT_LOCALE;

    log(`Initializing i18n with lang: ${lang}`);
    log(`Available locales:`, AVAILABLE_LOCALES);

    await set(lang);
  }

  window.I18N = { init, set, AVAILABLE_LOCALES, DEFAULT_LOCALE, I18N_VERSION };
  log("i18n.js loaded successfully");
})();
