// Auto-apply i18n attributes to existing content
// This script automatically adds data-i18n attributes to elements based on their content

(function() {
    'use strict';

    // Mapping of text content to translation keys
    const contentToKeyMap = {
        // Header
        'Подключение...': 'header.network_status',
        'Кошелек:': 'header.wallet_label',
        'Написать нам': 'header.email_title',
        'Копировать email': 'header.copy_email',
        'Войти': 'header.login_btn',

        // Navigation
        'Бот-обменник': 'nav.exchange',
        'МЭВ-бот': 'nav.mev',
        'Арбитраж': 'nav.arbitrage',
        'Партнерская программа': 'nav.partner_rewards',
        'Как начать': 'nav.cooperation',
        'Карта сайта': 'nav.mindmap',

        // Hero
        'Пока все болтают, мы работаем': 'hero.title',
        'Автоматический обмен криптовалют 24/7 на Binance Smart Chain': 'hero.subtitle',

        // Stats
        'Всего транзакций': 'stats.total_tx',
        'Последний блок': 'stats.last_block',
        'Баланс BNB': 'stats.balance_bnb',
        'Статус API': 'stats.api_status',

        // Transactions
        'История транзакций': 'transactions.title',
        'Обновить': 'transactions.refresh',
        'Фильтры': 'transactions.filters',
        'Тип транзакции:': 'transactions.type_label',
        'Все': 'transactions.type_all',
        'Входящие': 'transactions.type_in',
        'Исходящие': 'transactions.type_out',
        'Токены': 'transactions.type_token',
        'Период:': 'transactions.period_label',
        '24 часа': 'transactions.period_24h',
        '7 дней': 'transactions.period_7d',
        '30 дней': 'transactions.period_30d',
        'Все время': 'transactions.period_all',
        'Загрузка транзакций...': 'transactions.loading',
        'Транзакции не найдены': 'transactions.no_transactions',

        // Footer
        '© 2025 SigmaTrade. Мониторинг блокчейн транзакций': 'footer.slogan',
        'Контакты': 'footer.contacts',
        'Email': 'footer.email_label',

        // Common
        'Активен': 'bots_family.exchange_bot.status_active',
        'В разработке': 'bots_family.arb_bot.status_development',
        'Скоро': 'arbitrage.soon'
    };

    function autoApplyI18n() {
        if (!window.i18n) {
            console.log('i18n not loaded yet, retrying...');
            setTimeout(autoApplyI18n, 500);
            return;
        }

        console.log('🌍 Auto-applying i18n attributes...');

        // Apply to exact text matches
        Object.entries(contentToKeyMap).forEach(([text, key]) => {
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
                // Only check text nodes, not child elements
                return el.childNodes.length > 0 &&
                       Array.from(el.childNodes).some(node =>
                           node.nodeType === Node.TEXT_NODE &&
                           node.textContent.trim() === text
                       ) &&
                       !el.hasAttribute('data-i18n');
            });

            elements.forEach(el => {
                el.setAttribute('data-i18n', key);
            });
        });

        // Apply to placeholder attributes
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
            const placeholder = input.placeholder.trim();
            if (contentToKeyMap[placeholder]) {
                input.setAttribute('data-i18n-placeholder', contentToKeyMap[placeholder]);
            }
        });

        // Apply to title attributes
        document.querySelectorAll('[title]').forEach(el => {
            const title = el.title.trim();
            if (contentToKeyMap[title]) {
                el.setAttribute('data-i18n-title', contentToKeyMap[title]);
            }
        });

        console.log('✅ i18n attributes auto-applied');

        // Now apply translations
        if (window.i18n.applyTranslations) {
            window.i18n.applyTranslations();
        }
    }

    // Run after DOM is loaded and i18n is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoApplyI18n);
    } else {
        autoApplyI18n();
    }
})();
