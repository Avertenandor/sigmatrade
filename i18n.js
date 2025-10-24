// SigmaTrade Internationalization System
// Supported languages: ru, kk, zh, ja, tr, pt, es, vi

class I18n {
    constructor() {
        this.currentLang = this.detectLanguage();
        this.translations = {};
        this.fallbackLang = 'ru';
        this.supportedLanguages = {
            ru: { name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
            kk: { name: 'Казахский', flag: '🇰🇿', nativeName: 'Қазақша' },
            zh: { name: 'Китайский', flag: '🇨🇳', nativeName: '中文' },
            ja: { name: 'Японский', flag: '🇯🇵', nativeName: '日本語' },
            tr: { name: 'Турецкий', flag: '🇹🇷', nativeName: 'Türkçe' },
            pt: { name: 'Португальский', flag: '🇵🇹', nativeName: 'Português' },
            es: { name: 'Испанский', flag: '🇪🇸', nativeName: 'Español' },
            vi: { name: 'Вьетнамский', flag: '🇻🇳', nativeName: 'Tiếng Việt' }
        };
    }

    detectLanguage() {
        // Проверяем сохраненный язык
        const savedLang = localStorage.getItem('sigmatrade_language');
        if (savedLang && this.isSupported(savedLang)) {
            return savedLang;
        }

        // Проверяем язык браузера
        const browserLang = navigator.language.split('-')[0];
        if (this.isSupported(browserLang)) {
            return browserLang;
        }

        // По умолчанию русский
        return 'ru';
    }

    isSupported(lang) {
        return Object.keys(this.supportedLanguages).includes(lang);
    }

    async loadTranslations(lang) {
        if (!this.isSupported(lang)) {
            console.error(`Language ${lang} is not supported`);
            return false;
        }

        try {
            const response = await fetch(`./locales/${lang}.json?v=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang} translations`);
            }

            this.translations[lang] = await response.json();
            console.log(`✅ Loaded translations for ${lang}`);
            return true;
        } catch (error) {
            console.error(`❌ Error loading translations for ${lang}:`, error);
            return false;
        }
    }

    async init() {
        // Загружаем текущий язык и fallback
        await this.loadTranslations(this.currentLang);

        if (this.currentLang !== this.fallbackLang) {
            await this.loadTranslations(this.fallbackLang);
        }

        this.applyTranslations();
        this.updateHtmlLang();
        console.log(`🌍 I18n initialized with language: ${this.currentLang}`);
    }

    t(key, params = {}) {
        let translation = this.getNestedTranslation(this.currentLang, key);

        // Fallback к русскому если перевод не найден
        if (!translation && this.currentLang !== this.fallbackLang) {
            translation = this.getNestedTranslation(this.fallbackLang, key);
        }

        // Fallback к самому ключу
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }

        // Замена параметров
        Object.keys(params).forEach(param => {
            translation = translation.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        });

        return translation;
    }

    getNestedTranslation(lang, key) {
        const keys = key.split('.');
        let value = this.translations[lang];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return value;
    }

    applyTranslations() {
        // Переводим элементы с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Переводим элементы с data-i18n-html (для HTML контента)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.t(key);
        });

        // Переводим атрибуты title
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Переводим атрибуты placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Обновляем meta теги
        this.updateMetaTags();
    }

    updateMetaTags() {
        const description = document.querySelector('meta[name="description"]');
        if (description) {
            description.content = this.t('meta.description');
        }

        const keywords = document.querySelector('meta[name="keywords"]');
        if (keywords) {
            keywords.content = this.t('meta.keywords');
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = this.t('meta.og_title');
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.content = this.t('meta.og_description');
        }

        document.title = this.t('meta.title');
    }

    updateHtmlLang() {
        document.documentElement.lang = this.currentLang;
    }

    async changeLanguage(lang) {
        if (!this.isSupported(lang)) {
            console.error(`Language ${lang} is not supported`);
            return false;
        }

        if (lang === this.currentLang) {
            return true;
        }

        // Загружаем переводы если еще не загружены
        if (!this.translations[lang]) {
            const loaded = await this.loadTranslations(lang);
            if (!loaded) {
                return false;
            }
        }

        this.currentLang = lang;
        localStorage.setItem('sigmatrade_language', lang);

        this.applyTranslations();
        this.updateHtmlLang();

        // Обновляем активное состояние кнопки языка
        this.updateLanguageButton();

        // Отправляем событие изменения языка
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

        console.log(`🌍 Language changed to: ${lang}`);
        return true;
    }

    updateLanguageButton() {
        const currentLangBtn = document.querySelector('.lang-switcher .current-lang');
        if (currentLangBtn) {
            const langInfo = this.supportedLanguages[this.currentLang];
            currentLangBtn.innerHTML = `
                <span class="lang-flag">${langInfo.flag}</span>
                <span class="lang-code">${this.currentLang.toUpperCase()}</span>
            `;
        }

        // Обновляем активный пункт в выпадающем списке
        document.querySelectorAll('.lang-option').forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang === this.currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getLanguageInfo(lang) {
        return this.supportedLanguages[lang];
    }

    getAllLanguages() {
        return this.supportedLanguages;
    }
}

// Глобальный экземпляр
window.i18n = new I18n();

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
    await window.i18n.init();
    console.log('✅ i18n initialized successfully');

    // Отправляем событие о готовности i18n
    window.dispatchEvent(new CustomEvent('i18nReady', {
        detail: { language: window.i18n.getCurrentLanguage() }
    }));
});
