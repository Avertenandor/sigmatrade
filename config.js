// Configuration for SigmaTrade v8.0.0 - Multi-Wallet Support
const CONFIG = {
    // 🆕 v8.0.0: МУЛЬТИКОШЕЛЕК - Семейство ботов Sigma Trade
    WALLETS: {
        exchange: {
            id: 'exchange',
            name: 'Бот-обменник',
            address: '0xB685760EBD368a891F27ae547391F4E2A289895b',
            icon: '🔄',
            color: '#4F46E5', // Индиго/Фиолетовый
            status: 'active',
            description: 'Автоматический обмен криптовалют 24/7'
        },
        mev: {
            id: 'mev',
            name: 'МЭВ-бот',
            address: '0xd5c6f3B71bCcEb2eF8332bd8225f5F39E56A122c',
            icon: '💼',
            color: '#F59E0B', // Оранжевый
            status: 'active', // Теперь активен!
            description: 'Максимальная извлекаемая ценность (MEV)'
        },
        arbitrage: {
            id: 'arbitrage',
            name: 'Арбитражный бот',
            address: null, // Пока не активен
            icon: '📊',
            color: '#10B981', // Зеленый
            status: 'development',
            description: 'Межбиржевой арбитраж'
        }
    },
    
    // QuickNode endpoints (BSC)
    QUICKNODE: {
        HTTP: 'https://old-patient-butterfly.bsc.quiknode.pro/4f481d121ed69acf769b858f6db52d8ce1805020',
        WSS: 'wss://old-patient-butterfly.bsc.quiknode.pro/4f481d121ed69acf769b858f6db52d8ce1805020'
    },
    
    // Etherscan V2 API (for BSC)
    ETHERSCAN: {
        BASE_URL: 'https://api.etherscan.io/v2/api',
        CHAIN_ID: 56, // BSC
        API_KEY: 'RF1Q8SCFHFD1EVAP5A4WCMIM4DREA7UNUH'
    },
    
    // Network settings
    NETWORK: {
        NAME: 'Binance Smart Chain',
        CHAIN_ID: 56,
        SYMBOL: 'BNB',
        EXPLORER: 'https://bscscan.com'
    },
    
    // Token Contracts (BSC)
    TOKENS: {
        BNB: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
            icon: '💰',
            isNative: true
        },
        USDT: {
            address: '0x55d398326f99059fF775485246999027B3197955',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 18,
            icon: '💵'
        },
        CAKE: {
            address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
            name: 'PancakeSwap',
            symbol: 'CAKE',
            decimals: 18,
            icon: '🎂'
        },
        BUSD: {
            address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            name: 'Binance USD',
            symbol: 'BUSD',
            decimals: 18,
            icon: '💴'
        }
    },
    
    // ⚡ ОПТИМИЗИРОВАННЫЕ ИНТЕРВАЛЫ
    INTERVALS: {
        BLOCK_UPDATE: 3000,      // 3 секунды (BSC block time ~3s)
        BALANCE_UPDATE: 300000,  // 5 МИНУТ - экономия 80%!
        TX_REFRESH: 120000       // 2 МИНУТЫ - экономия 75%!
    },
    
    // Pagination
    PAGINATION: {
        PAGE_SIZE: 50,           // 50 транзакций за раз
        MAX_PAGES: 20,           // максимум 20 страниц (1000 TX)
        INITIAL_LOAD: 50         // начальная загрузка
    },
    
    // 💾 АГРЕССИВНОЕ КЕШИРОВАНИЕ
    CACHE: {
        ENABLED: true,
        TTL: 300000,             // 5 МИНУТ - общий кеш
        TX_TTL: 180000,          // 3 МИНУТЫ - кеш транзакций
        BALANCE_TTL: 300000,     // 5 МИНУТ - кеш балансов
        TOTAL_TX_TTL: 600000     // 10 МИНУТ - кеш счетчика
    },
    
    // Infinite Scroll settings
    SCROLL: {
        THRESHOLD: 200,          // 200px от низа
        BATCH_SIZE: 50           // 50 транзакций за раз
    },
    
    // 🆕 v8.0.0: Настройки мультикошелька
    MULTI_WALLET: {
        DEFAULT_WALLET: 'exchange', // По умолчанию
        AUTO_SWITCH: true,          // Автопереключение по странице
        CACHE_PER_WALLET: true,     // Раздельное кеширование
        BATCH_ALL_WALLETS: false    // Батчинг для всех кошельков сразу (false = экономия)
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

/* 
⚡ ОПТИМИЗАЦИИ v4.0.0-v8.0.0:

1. БАТЧИНГ RPC:
   - ВСЕ балансы токенов в ОДНОМ запросе
   - Экономия: ~75% запросов к QuickNode

2. АГРЕССИВНОЕ КЕШИРОВАНИЕ:
   - Балансы: 5 минут TTL
   - Транзакции: 3 минуты TTL
   - Счетчик TX: 10 минут TTL
   - Экономия: ~80% запросов к Etherscan

3. РЕДКИЕ ОБНОВЛЕНИЯ:
   - Балансы: каждые 5 минут
   - Транзакции: каждые 2 минуты
   - Проверка блоков: каждые 20 блоков
   - Экономия: ~75% общих запросов

4. LAZY LOADING:
   - WebSocket подключается только на активной странице
   - Данные загружаются только для активного кошелька
   - Экономия: ~50% при навигации

5. МУЛЬТИКОШЕЛЕК v8.0.0:
   - Раздельное кеширование для каждого кошелька
   - Загрузка только для активного кошелька
   - Автопереключение по странице
   - Экономия: дополнительные ~30%

ИТОГО:
- QuickNode: ~85% экономия запросов
- Etherscan: ~80% экономия запросов  
- Мультикошелек: дополнительная оптимизация
- Общая эффективность: 6x меньше запросов!
*/
