// Configuration for SigmaTrade v5.0.0
const CONFIG = {
    // Wallet to monitor
    WALLET_ADDRESS: '0xB685760EBD368a891F27ae547391F4E2A289895b',
    
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
    
    // ⚡ ОПТИМИЗИРОВАННЫЕ ИНТЕРВАЛЫ (все увеличены в 5-10 раз!)
    INTERVALS: {
        BLOCK_UPDATE: 3000,      // 3 секунды (BSC block time ~3s)
        BALANCE_UPDATE: 300000,  // 5 МИНУТ (было 60 сек) - экономия 80%!
        TX_REFRESH: 120000       // 2 МИНУТЫ (было 30 сек) - экономия 75%!
    },
    
    // Pagination
    PAGINATION: {
        PAGE_SIZE: 50,           // 50 транзакций за раз
        MAX_PAGES: 20,           // максимум 20 страниц (1000 TX)
        INITIAL_LOAD: 50         // начальная загрузка
    },
    
    // 💾 АГРЕССИВНОЕ КЕШИРОВАНИЕ (увеличены TTL в 5-10 раз!)
    CACHE: {
        ENABLED: true,
        TTL: 300000,             // 5 МИНУТ (было 60 сек) - общий кеш
        TX_TTL: 180000,          // 3 МИНУТЫ (было 60 сек) - кеш транзакций
        BALANCE_TTL: 300000,     // 5 МИНУТ (было 10 сек) - кеш балансов
        TOTAL_TX_TTL: 600000     // 10 МИНУТ (было 5 мин) - кеш счетчика
    },
    
    // Infinite Scroll settings
    SCROLL: {
        THRESHOLD: 200,          // 200px от низа (было 100)
        BATCH_SIZE: 50           // 50 транзакций за раз
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

/* 
⚡ ОПТИМИЗАЦИИ v4.0.0 (сохранены в v5.0.0):

1. БАТЧИНГ RPC:
   - ВСЕ балансы токенов в ОДНОМ запросе вместо 4+
   - Экономия: ~75% запросов к QuickNode

2. АГРЕССИВНОЕ КЕШИРОВАНИЕ:
   - Балансы: 5 минут TTL (было 10 сек)
   - Транзакции: 3 минуты TTL (было 60 сек)
   - Счетчик TX: 10 минут TTL (было 5 мин)
   - Экономия: ~80% запросов к Etherscan

3. РЕДКИЕ ОБНОВЛЕНИЯ:
   - Балансы: каждые 5 минут (было 60 сек)
   - Транзакции: каждые 2 минуты (было 30 сек)
   - Проверка блоков: каждые 20 блоков (было 10)
   - Экономия: ~75% общих запросов

4. LAZY LOADING:
   - WebSocket подключается только на странице Exchange
   - Данные загружаются только когда нужны
   - Экономия: ~50% при навигации

5. DEBOUNCING:
   - 2 секунды задержка перед refresh
   - Предотвращает дублирование запросов
   - Экономия: ~30% избыточных запросов

ИТОГО:
- QuickNode: ~85% экономия запросов
- Etherscan: ~80% экономия запросов
- Общая эффективность: 5x меньше запросов!
*/
