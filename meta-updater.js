/**
 * Meta Tags Updater for SigmaTrade
 * Dynamically updates Open Graph and Twitter Card meta tags when page changes
 * Ensures beautiful previews in social media (Telegram, Facebook, Twitter, VK, etc.)
 */

class MetaUpdater {
    constructor() {
        this.baseUrl = 'https://sigmatrade.org';
        this.version = '11.2.0';

        // Define meta information for each page
        this.pageMeta = {
            'home': {
                title: 'SigmaTrade - Trading Bots Family Monitoring',
                titleRu: 'SigmaTrade - Мониторинг семейства торговых ботов',
                description: 'Professional monitoring of trading bots family. Exchange bots, arbitrage, and MEV activity. Real-time tracking on BSC.',
                descriptionRu: 'Мониторинг работы семейства торговых ботов Sigma Trade. Боты обмена, арбитража и МЭВ-деятельности. Real-time отслеживание на BSC.',
                image: 'home.svg',
                url: ''
            },
            'exchange': {
                title: 'Exchange Bot - Automated Crypto Exchange 24/7',
                titleRu: 'Бот-обменник - Автоматический обмен криптовалют 24/7',
                description: 'Automated cryptocurrency exchange with optimal rates. 0.1-0.8% fee. Profit distribution among participants.',
                descriptionRu: 'Автоматический обмен криптовалют с оптимальными курсами. Комиссия 0.1-0.8%. Распределение прибыли между участниками.',
                image: 'exchange-bot.svg',
                url: '#exchange'
            },
            'mev': {
                title: 'MEV Bot - Maximal Extractable Value (Sandwich Attack)',
                titleRu: 'МЭВ-бот - Максимальная извлекаемая ценность (Sandwich Attack)',
                description: 'MEV bot using sandwich attack strategy. Mempool monitoring, front-running and back-running for profit extraction.',
                descriptionRu: 'МЭВ-бот использует стратегию сендвич-атак. Мониторинг мемпула, front-run и back-run для извлечения прибыли.',
                image: 'mev-bot.svg',
                url: '#mev'
            },
            'arbitrage': {
                title: 'Arbitrage Bot - Cross-Exchange Arbitrage',
                titleRu: 'Арбитражный бот - Межбиржевой арбитраж',
                description: 'Cross-exchange arbitrage bot. Multi-DEX monitoring, 24/7 automation, spread analysis and optimal routes.',
                descriptionRu: 'Межбиржевой арбитражный бот. Мониторинг Multi-DEX, автоматизация 24/7, анализ спредов и оптимальные маршруты.',
                image: 'arbitrage.svg',
                url: '#arbitrage'
            },
            'partner-rewards': {
                title: 'Partner Program - Earn on 3 Levels (3% → 2% → 5%)',
                titleRu: 'Партнерская программа - Зарабатывайте на 3 уровнях (3% → 2% → 5%)',
                description: 'Three-level partner program. Earn from partner income and deposits. Growing percentages: 3% → 2% → 5%.',
                descriptionRu: 'Трехуровневая партнерская программа. Заработок с дохода и вложений партнеров. Растущие проценты: 3% → 2% → 5%.',
                image: 'partner-rewards.svg',
                url: '#partner-rewards'
            },
            'cooperation': {
                title: 'Get Started - Start Your Trading Journey | SigmaTrade',
                titleRu: 'Как начать - Начните свой путь в трейдинге | SigmaTrade',
                description: 'Start cooperation with SigmaTrade. Application → Interview → System Access. Email: trdgood00@gmail.com',
                descriptionRu: 'Начните сотрудничество с SigmaTrade. Заявка → Собеседование → Доступ к системам. Email: trdgood00@gmail.com',
                image: 'cooperation.svg',
                url: '#cooperation'
            },
            'mindmap': {
                title: 'Site Map - Interactive Platform Structure | SigmaTrade',
                titleRu: 'Карта сайта - Интерактивная структура платформы | SigmaTrade',
                description: 'Interactive visualization of SigmaTrade platform structure. Pages, features, and data sources.',
                descriptionRu: 'Интерактивная визуализация структуры платформы SigmaTrade. Страницы, функции и источники данных.',
                image: 'mindmap.svg',
                url: '#mindmap'
            }
        };

        // Detect current language
        this.currentLang = document.documentElement.lang || 'ru';
    }

    /**
     * Update all meta tags for a given page
     */
    updateMeta(pageName) {
        const meta = this.pageMeta[pageName] || this.pageMeta['home'];
        const isRussian = this.currentLang === 'ru';

        // Choose appropriate title and description based on language
        const title = isRussian ? meta.titleRu : meta.title;
        const description = isRussian ? meta.descriptionRu : meta.description;
        const imageUrl = `${this.baseUrl}/og-images/${meta.image}?v=${this.version}`;
        const pageUrl = `${this.baseUrl}/${meta.url}`;

        // Update document title
        document.title = title;

        // Update Open Graph tags
        this.updateTag('og-title', 'property', 'og:title', title);
        this.updateTag('og-description', 'property', 'og:description', description);
        this.updateTag('og-image', 'property', 'og:image', imageUrl);
        this.updateTag('og-image-secure', 'property', 'og:image:secure_url', imageUrl);
        this.updateTag('og-image-alt', 'property', 'og:image:alt', title);
        this.updateTag('og-url', 'property', 'og:url', pageUrl);

        // Update VK tags
        this.updateTag('vk-image', 'property', 'vk:image', imageUrl);

        // Update Twitter Card tags
        this.updateTag('twitter-title', 'name', 'twitter:title', title);
        this.updateTag('twitter-description', 'name', 'twitter:description', description);
        this.updateTag('twitter-image', 'name', 'twitter:image', imageUrl);
        this.updateTag('twitter-image-alt', 'name', 'twitter:image:alt', title);

        // Update canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = pageUrl;
        }

        // Log update (for debugging)
        console.log(`📱 Meta tags updated for page: ${pageName}`);
        console.log(`   Title: ${title}`);
        console.log(`   Image: ${imageUrl}`);
        console.log(`   URL: ${pageUrl}`);
    }

    /**
     * Update a single meta tag
     */
    updateTag(id, attribute, name, content) {
        let tag = document.getElementById(id);

        if (!tag) {
            // If tag doesn't exist with ID, try to find by attribute
            tag = document.querySelector(`meta[${attribute}="${name}"]`);
        }

        if (tag) {
            tag.setAttribute('content', content);
        } else {
            // Create new tag if doesn't exist
            const newTag = document.createElement('meta');
            newTag.setAttribute('id', id);
            newTag.setAttribute(attribute, name);
            newTag.setAttribute('content', content);
            document.head.appendChild(newTag);
        }
    }

    /**
     * Set language and update meta
     */
    setLanguage(lang) {
        this.currentLang = lang;
        document.documentElement.lang = lang;

        // Get current page from hash
        const hash = window.location.hash.slice(1);
        const pageName = hash || 'home';
        this.updateMeta(pageName);
    }

    /**
     * Initialize meta updater
     */
    init() {
        // Update meta on page load
        const hash = window.location.hash.slice(1);
        const initialPage = hash || 'home';
        this.updateMeta(initialPage);

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.slice(1);
            const newPage = newHash || 'home';
            this.updateMeta(newPage);
        });

        console.log('✅ MetaUpdater initialized');
    }
}

// Initialize meta updater when DOM is ready
if (typeof window !== 'undefined') {
    window.metaUpdater = new MetaUpdater();

    // Initialize after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.metaUpdater.init();
        });
    } else {
        window.metaUpdater.init();
    }
}
