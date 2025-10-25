// SigmaTrade Core Module - v10.1.0
// Handles: Initialization, Navigation, Wallet Management, UI Controls

class SigmaTradeCore {
    constructor() {
        this.ws = null;
        this.transactions = [];
        this.tokenTransactions = [];
        this.allTransactions = [];
        this.currentBlock = null;
        this.balance = '0';
        this.tokenBalances = {};
        this.totalTxCount = 0;
        this.isConnected = false;
        this.cache = new Map();
        this.lastApiCall = 0;
        this.apiCallDelay = 6000;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.cacheDB = null;
        this.cacheReady = false;
        this.virtualScroll = null;
        this.requestQueue = [];
        this.isBatchProcessing = false;
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.observer = null;
        this.currentActivePage = 'exchange';
        this.currentWalletId = CONFIG.MULTI_WALLET.DEFAULT_WALLET;
        this.walletData = {};
        this.debounceTimers = {};
    }

    async init() {
        this.log('Initializing SigmaTrade v10.1.0 - Multi-Wallet Fixed...', 'info');

        try {
            this.cacheDB = new CacheDB();
            await this.cacheDB.init();
            this.cacheReady = true;
            this.log('IndexedDB cache ready', 'cache');
            await this.cacheDB.cleanup();
        } catch (error) {
            this.log('IndexedDB not available, using Map fallback', 'warning');
            this.cacheReady = false;
        }

        this.initializeNavigation();
        this.initializeUI();

        // Инициализация для любого активного кошелька
        const hash = window.location.hash.slice(1) || 'exchange';
        if (CONFIG.WALLETS[hash]?.address) {
            this.currentWalletId = hash;
            this.currentActivePage = hash;
            await this.connectWebSocket();
            await this.startMonitoring();
        }

        // Setup event listeners handled by UI module
        if (window.SigmaTradeUIHandlers) {
            window.SigmaTradeUIHandlers.setupEventListeners(this);
            window.SigmaTradeUIHandlers.setupInfiniteScroll(this);
        }

        this.handleHashChange();
    }

    initializeNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                this.switchPage(page);
            });
        });

        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');

        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenuToggle.classList.toggle('active');
                mainNav.classList.toggle('mobile-open');
            });
        }

        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1);
        const validPages = ['exchange', 'mev', 'arbitrage', 'partner-rewards', 'cooperation', 'mindmap'];

        if (validPages.includes(hash)) {
            this.switchPage(hash);
        } else {
            window.location.hash = 'exchange';
        }
    }

    switchPage(pageName) {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');

        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.classList.remove('active');
            mainNav.classList.remove('mobile-open');
        }

        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            if (tab.getAttribute('data-page') === pageName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id === `page-${pageName}`) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        window.location.hash = pageName;
        this.currentActivePage = pageName;

        // Initialize mind map if switching to mindmap page
        if (pageName === 'mindmap' && window.mindMap) {
            setTimeout(() => {
                window.mindMap.init();
            }, 100);
        }

        // Initialize partner rewards map if switching to partner-rewards page
        if (pageName === 'partner-rewards' && window.partnerRewardsMap) {
            setTimeout(() => {
                window.partnerRewardsMap.init();
            }, 100);
        }

        // Initialize cooperation map if switching to cooperation page
        if (pageName === 'cooperation' && window.cooperationMap) {
            setTimeout(() => {
                window.cooperationMap.init();
            }, 100);
        }

        // Initialize exchange bot map if switching to exchange page
        if (pageName === 'exchange' && window.exchangeBotMap) {
            setTimeout(() => {
                window.exchangeBotMap.init();
            }, 100);
        }

        // Initialize MEV bot map if switching to MEV page
        if (pageName === 'mev' && window.mevBotMap) {
            setTimeout(() => {
                window.mevBotMap.init();
            }, 100);
        }

        // Переключение кошелька и перезапуск мониторинга
        if (CONFIG.MULTI_WALLET.AUTO_SWITCH && CONFIG.WALLETS[pageName]) {
            if (this.currentWalletId !== pageName && CONFIG.WALLETS[pageName]?.address) {
                this.switchWallet(pageName);
                if (!this.ws) {
                    this.connectWebSocket();
                }
                this.startMonitoring();
            }
        }

        this.log(`Switched to page: ${pageName}`, 'info');
    }

    log(message, type = 'info') {
        const emoji = {
            info: '🚀',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            network: '🔌',
            cache: '💾',
            optimize: '⚡'
        };
        console.log(`${emoji[type]} ${message}`);
    }

    getCurrentWallet() {
        return CONFIG.WALLETS[this.currentWalletId];
    }

    switchWallet(walletId) {
        if (!CONFIG.WALLETS[walletId]) {
            this.log(`Invalid wallet ID: ${walletId}`, 'error');
            return;
        }

        if (!CONFIG.WALLETS[walletId].address) {
            this.log(`Wallet ${walletId} has no address (in development)`, 'warning');
            return;
        }

        this.log(`Switching to wallet: ${walletId}`, 'info');
        this.currentWalletId = walletId;
        this.updateWalletInfo();
        this.transactions = [];
        this.allTransactions = [];
        this.tokenBalances = {};
        this.totalTxCount = 0;
        this.currentPage = 1;
        this.hasMore = true;
        this.showLoading();

        if (this.currentActivePage === this.currentWalletId) {
            this.refreshData();
        }
    }

    initializeUI() {
        this.updateWalletInfo();

        const networkName = document.getElementById('networkName');
        if (networkName) {
            networkName.textContent = CONFIG.NETWORK.NAME;
        }

        this.showLoading();
    }

    updateWalletInfo() {
        const wallet = this.getCurrentWallet();

        const walletShort = document.getElementById('walletShort');
        if (walletShort && wallet.address) {
            const addr = wallet.address;
            walletShort.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            walletShort.title = `${wallet.name}: ${addr}`;
        }

        const networkStatus = document.getElementById('networkStatus');
        if (networkStatus) {
            networkStatus.setAttribute('data-bot-type', this.currentWalletId);
        }
    }

    showLoading() {
        const listId = this.currentActivePage === 'mev' ? 'mevTransactionList' : 'transactionList';
        const listElement = document.getElementById(listId);
        if (listElement) {
            listElement.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Загрузка транзакций...</p>
                </div>
            `;
        }
    }

    async connectWebSocket() {
        if (this.ws) return;

        try {
            this.log('Connecting to WebSocket...', 'network');

            this.ws = new WebSocket(CONFIG.QUICKNODE.WSS);

            this.ws.onopen = () => {
                this.log('WebSocket connected', 'success');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateNetworkStatus(true);
                this.subscribeToBlocks();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.ws.onerror = (error) => {
                this.log('WebSocket error', 'error');
                this.updateNetworkStatus(false);
            };

            this.ws.onclose = () => {
                this.log('WebSocket disconnected', 'warning');
                this.isConnected = false;
                this.updateNetworkStatus(false);

                const wallet = this.getCurrentWallet();
                if (this.reconnectAttempts < this.maxReconnectAttempts && wallet?.address) {
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                    this.reconnectAttempts++;
                    this.log(`Reconnecting in ${delay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
                    setTimeout(() => this.connectWebSocket(), delay);
                }
            };

        } catch (error) {
            this.log('Failed to connect WebSocket', 'error');
            this.updateNetworkStatus(false);
        }
    }

    subscribeToBlocks() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const subscription = {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_subscribe',
            params: ['newHeads']
        };

        this.ws.send(JSON.stringify(subscription));
        this.log('Subscribed to new blocks', 'success');
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.method === 'eth_subscription' && data.params?.result?.number) {
                const blockNumber = parseInt(data.params.result.number, 16);
                this.currentBlock = blockNumber;
                this.updateBlockNumber(blockNumber);

                if (blockNumber % 20 === 0) {
                    this.invalidateCache();
                    const wallet = this.getCurrentWallet();
                    if (wallet?.address) {
                        this.debouncedRefreshData();
                    }
                }
            }

        } catch (error) {
            this.log('Error handling WebSocket message', 'error');
        }
    }

    debouncedRefreshData() {
        if (this.debounceTimers.refresh) {
            clearTimeout(this.debounceTimers.refresh);
        }

        this.debounceTimers.refresh = setTimeout(() => {
            this.refreshData();
        }, 2000);
    }

    invalidateCache() {
        const totalTxCache = this.cache.get('total_tx_count');
        this.cache.clear();
        if (totalTxCache) {
            this.cache.set('total_tx_count', totalTxCache);
        }
        this.log('Cache invalidated', 'cache');
    }

    async startMonitoring() {
        const wallet = this.getCurrentWallet();
        if (!wallet.address) {
            this.log(`Cannot start monitoring - no address for ${this.currentWalletId}`, 'warning');
            return;
        }

        // Data module handles fetching
        if (window.SigmaTradeData) {
            await window.SigmaTradeData.fetchTransactions(this, 1);

            setTimeout(() => {
                window.SigmaTradeData.updateAllBalancesBatched(this);
                window.SigmaTradeData.fetchTotalTransactionCount(this);
            }, 1000);

            setInterval(() => {
                const currentWallet = this.getCurrentWallet();
                if (currentWallet.address && !document.hidden) {
                    window.SigmaTradeData.updateAllBalancesBatched(this);
                }
            }, CONFIG.INTERVALS.BALANCE_UPDATE * 5);
        }
    }

    async refreshData() {
        const wallet = this.getCurrentWallet();
        if (!wallet.address) return;

        this.log('Refreshing data...', 'optimize');

        if (window.SigmaTradeData) {
            await Promise.all([
                window.SigmaTradeData.updateAllBalancesBatched(this),
                window.SigmaTradeData.fetchTotalTransactionCount(this)
            ]);

            this.currentPage = 1;
            this.hasMore = true;
            await window.SigmaTradeData.fetchTransactions(this, 1, true);
        }
    }

    formatBalance(balanceWei, decimals) {
        try {
            const balance = BigInt(balanceWei);
            const divisor = BigInt(10) ** BigInt(decimals);
            const wholePart = balance / divisor;
            const fractionalPart = balance % divisor;

            const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
            const formatted = `${wholePart}.${fractionalStr.slice(0, 4)}`;

            return this.formatNumber(parseFloat(formatted));
        } catch (error) {
            return '0.0000';
        }
    }

    formatNumber(num) {
        return num.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
    }

    updateBlockNumber(blockNumber) {
        const blockElement = document.getElementById('lastBlock');
        const mevBlockElement = document.getElementById('mevLastBlock');

        const blockText = `#${blockNumber.toLocaleString('ru-RU')}`;
        if (blockElement) {
            blockElement.textContent = blockText;
        }
        if (mevBlockElement) {
            mevBlockElement.textContent = blockText;
        }
    }

    updateNetworkStatus(connected) {
        const statusDot = document.getElementById('networkStatus');
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('disconnected');
            } else {
                statusDot.classList.add('disconnected');
            }
        }

        const networkName = document.getElementById('networkName');
        if (networkName) {
            networkName.textContent = connected ? CONFIG.NETWORK.NAME : 'Отключено';
        }
    }

    openTxInExplorer(hash) {
        window.open(`${CONFIG.NETWORK.EXPLORER}/tx/${hash}`, '_blank');
    }

    // Cache methods delegated to data module
    async setCache(key, value, ttl = CONFIG.CACHE.TTL) {
        if (window.SigmaTradeData) {
            return window.SigmaTradeData.setCache(this, key, value, ttl);
        }
    }

    async getFromCache(key, ttl = CONFIG.CACHE.TTL) {
        if (window.SigmaTradeData) {
            return window.SigmaTradeData.getFromCache(this, key, ttl);
        }
        return null;
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.SigmaTradeCore = SigmaTradeCore;
}
