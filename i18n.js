/* i18n.js */
(() => {
  const AVAILABLE_LOCALES = ["ru","en","de","tr","uk","ro","es","fr","it","pl","vi","id","ar","zh-Hans","zh-Hant"];
  const DEFAULT_LOCALE = "ru";
  const I18N_VERSION = "2025-10-24";

  const cacheKey = (lang) => `i18n:${lang}:${I18N_VERSION}`;
  const dictCache = new Map();
  let currentLang = DEFAULT_LOCALE;

  async function loadDict(lang) {
    if (dictCache.has(lang)) return dictCache.get(lang);
    const cached = localStorage.getItem(cacheKey(lang));
    if (cached) {
      const parsed = JSON.parse(cached);
      dictCache.set(lang, parsed);
      return parsed;
    }
    const res = await fetch(`./locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`i18n: failed to load ${lang}`);
    const json = await res.json();
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
    const warned = new Set();
    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const raw = dict[key];
      const attrs = (el.getAttribute("data-i18n-attr") || "").split(",").map(s => s.trim()).filter(Boolean);
      const asHtml = el.hasAttribute("data-i18n-html");

      if (raw !== undefined) {
        if (asHtml) el.innerHTML = raw;
        else el.textContent = raw;
      } else {
        if (!warned.has(key)) {
          console.warn(`[i18n] missing key: ${key}`);
          warned.add(key);
        }
      }

      if (attrs.length) {
        attrs.forEach(a => {
          const ak = `${key}.__attr__.${a}`;
          if (dict[ak] !== undefined) el.setAttribute(a, dict[ak]);
        });
      }
    });
  }

  async function set(lang) {
    if (!AVAILABLE_LOCALES.includes(lang)) lang = DEFAULT_LOCALE;
    currentLang = lang;
    localStorage.setItem("i18n:lang", lang);
    try {
      const dict = await loadDict(lang);
      // fallback к ru
      if (lang !== "ru") {
        const ru = await loadDict("ru");
        applyTranslations(Object.assign({}, ru, dict));
      } else {
        applyTranslations(dict);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function init() {
    const url = new URL(location.href);
    const q = url.searchParams.get("lang");
    const stored = localStorage.getItem("i18n:lang");
    const lang = q || stored || DEFAULT_LOCALE;
    await set(lang);
  }

  window.I18N = { init, set, AVAILABLE_LOCALES, DEFAULT_LOCALE, I18N_VERSION };
})();
