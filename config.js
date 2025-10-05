// Configuration for SigmaTrade
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
    
    // Update intervals (in milliseconds)
    INTERVALS: {
        BLOCK_UPDATE: 3000,     // 3 seconds (BSC block time ~3s)
        BALANCE_UPDATE: 10000,  // 10 seconds
        TX_REFRESH: 30000       // 30 seconds for full tx list
    },
    
    // Pagination
    PAGINATION: {
        PAGE_SIZE: 50,
        MAX_PAGES: 10
    },
    
    // Cache settings
    CACHE: {
        ENABLED: true,
        TTL: 60000 // 1 minute
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
