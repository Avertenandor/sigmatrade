// SigmaTrade Application v8.0.0 - Multi-Wallet Support
class SigmaTrade {
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
        
        // v4.1.0: IndexedDB
        this.cacheDB = null;
        this.cacheReady = false;
        
        // v4.1.0: Virtual Scrolling
        this.virtualScroll = null;
        
        // Request batching queue
        this.requestQueue = [];
        this.isBatchProcessing = false;
        
        // Pagination state
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.observer = null;
        
        // Current active page
        this.currentActivePage = 'exchange';
        
        // 🆕 v8.0.0: Multi-Wallet Support
        this.currentWalletId = CONFIG.MULTI_WALLET.DEFAULT_WALLET;
        this.walletData = {}; // Данные для каждого кошелька
        
        // Debounce timers
        this.debounceTimers = {};
        
        this.init();
    }
    
    async init() {
        this.log('Initializing SigmaTrade v8.0.0 - Multi-Wallet Support...', 'info');
        
        // v4.1.0: Инициализация IndexedDB
        try {
            this.cacheDB = new CacheDB();
            await this.cacheDB.init();
            this.cacheReady = true;
            this.log('IndexedDB cache ready', 'cache');
            
            // Cleanup старых записей
            await this.cacheDB.cleanup();
        } catch (error) {
            this.log('IndexedDB not available, using Map fallback', 'warning');
            this.cacheReady = false;
        }
        
        this.initializeNavigation();
        this.initializeUI();
        
        // Connect ONLY if on exchange page
        if (window.location.hash === '#exchange' || !window.location.hash) {
            await this.connectWebSocket();
            await this.startMonitoring();
        }
        
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.handleHashChange();
    }
    
    // ============= NAVIGATION =============
    
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
        const validPages = ['exchange', 'mev', 'arbitrage'];
        
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
        
        // 🆕 v8.0.0: Автоматическое переключение кошелька при смене страницы
        if (CONFIG.MULTI_WALLET.AUTO_SWITCH && CONFIG.WALLETS[pageName]) {
            if (this.currentWalletId !== pageName) {
                this.switchWallet(pageName);
            }
        }
        
        // Lazy connect WebSocket только при переходе на активную страницу с адресом
        if (CONFIG.WALLETS[pageName]?.address && !this.ws) {
            this.connectWebSocket();
            this.startMonitoring();
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
    
    // 🆕 v8.0.0: Получить текущий активный кошелек
    getCurrentWallet() {
        return CONFIG.WALLETS[this.currentWalletId];
    }
    
    // 🆕 v8.0.0: Переключить кошелек
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
        
        // Обновить UI
        this.updateWalletInfo();
        
        // Очистить данные
        this.transactions = [];
        this.allTransactions = [];
        this.tokenBalances = {};
        this.totalTxCount = 0;
        
        // Перезагрузить данные
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
    
    // 🆕 v8.0.0: Обновить информацию о кошельке в UI
    updateWalletInfo() {
        const wallet = this.getCurrentWallet();
        
        const walletShort = document.getElementById('walletShort');
        if (walletShort && wallet.address) {
            const addr = wallet.address;
            walletShort.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            walletShort.title = `${wallet.name}: ${addr}`;
        }
        
        // 🎨 v9.0.0: Использовать data-атрибут вместо inline style
        const networkStatus = document.getElementById('networkStatus');
        if (networkStatus) {
            networkStatus.setAttribute('data-bot-type', this.currentWalletId);
        }
    }
    
    showLoading() {
        const listElement = document.getElementById('transactionList');
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
        if (this.ws) return; // Уже подключен
        
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
                
                // Reconnect только если на exchange page
                if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentActivePage === 'exchange') {
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
                
                // ОПТИМИЗАЦИЯ: Проверка каждые 20 блоков (~60 сек) вместо 10
                if (blockNumber % 20 === 0) {
                    this.invalidateCache();
                    if (this.currentActivePage === 'exchange') {
                        this.debouncedRefreshData();
                    }
                }
            }
            
        } catch (error) {
            this.log('Error handling WebSocket message', 'error');
        }
    }
    
    // ОПТИМИЗАЦИЯ: Debounced refresh для избежания дублирующих запросов
    debouncedRefreshData() {
        if (this.debounceTimers.refresh) {
            clearTimeout(this.debounceTimers.refresh);
        }
        
        this.debounceTimers.refresh = setTimeout(() => {
            this.refreshData();
        }, 2000); // 2 секунды задержка
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
        if (this.currentActivePage !== 'exchange') return;
        
        // ОПТИМИЗАЦИЯ: Загружаем только критичные данные сразу
        await this.fetchTransactions(1);
        
        // Балансы и счетчики загружаем с задержкой
        setTimeout(() => {
            this.updateAllBalancesBatched();
            this.fetchTotalTransactionCount();
        }, 1000);
        
        // ОПТИМИЗАЦИЯ: Обновления каждые 5 минут вместо 1 минуты
        setInterval(() => {
            if (this.currentActivePage === 'exchange' && !document.hidden) {
                this.updateAllBalancesBatched();
            }
        }, CONFIG.INTERVALS.BALANCE_UPDATE * 5); // x5 реже!
    }
    
    async refreshData() {
        if (this.currentActivePage !== 'exchange') return;
        
        this.log('Refreshing data...', 'optimize');
        
        // ОПТИМИЗАЦИЯ: Параллельные запросы но с батчингом
        await Promise.all([
            this.updateAllBalancesBatched(),
            this.fetchTotalTransactionCount()
        ]);
        
        this.currentPage = 1;
        this.hasMore = true;
        await this.fetchTransactions(1, true);
    }
    
    // ============= ОПТИМИЗИРОВАННЫЕ БАЛАНСЫ (BATCHED RPC) =============
    
    async updateAllBalancesBatched() {
        try {
            const cacheKey = 'all_balances';
            const cached = await this.getFromCache(cacheKey, CONFIG.CACHE.BALANCE_TTL);
            
            if (cached) {
                this.log('Using cached balances', 'cache');
                this.tokenBalances = cached;
                this.displayBalances();
                
                const balanceElement = document.getElementById('balance');
                if (balanceElement && cached.BNB) {
                    balanceElement.textContent = cached.BNB.formatted;
                }
                return;
            }
            
            this.log('Fetching ALL balances in BATCH...', 'optimize');
            
            // 🆕 v8.0.0: Используем адрес текущего кошелька
            const wallet = this.getCurrentWallet();
            if (!wallet.address) {
                this.log('Current wallet has no address', 'warning');
                return;
            }
            
            // ОПТИМИЗАЦИЯ: Батчинг всех RPC запросов в один
            const batchRequests = [];
            
            // BNB balance
            batchRequests.push({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [wallet.address, 'latest'],
                id: 1
            });
            
            // Token balances
            let id = 2;
            const tokenKeys = Object.keys(CONFIG.TOKENS).filter(key => !CONFIG.TOKENS[key].isNative);
            
            for (const key of tokenKeys) {
                const token = CONFIG.TOKENS[key];
                const data = '0x70a08231000000000000000000000000' + wallet.address.slice(2).toLowerCase();
                
                batchRequests.push({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: token.address,
                        data: data
                    }, 'latest'],
                    id: id++
                });
            }
            
            // КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ: Один запрос вместо 4+!
            const response = await fetch(CONFIG.QUICKNODE.HTTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequests)
            });
            
            const results = await response.json();
            
            // Parse results
            const balances = {};
            
            // BNB (первый результат)
            if (results[0]?.result) {
                const bnbBalance = BigInt(results[0].result).toString();
                balances.BNB = {
                    ...CONFIG.TOKENS.BNB,
                    balance: bnbBalance,
                    formatted: this.formatBalance(bnbBalance, CONFIG.TOKENS.BNB.decimals)
                };
            }
            
            // Tokens (остальные результаты)
            tokenKeys.forEach((key, index) => {
                const token = CONFIG.TOKENS[key];
                const result = results[index + 1];
                
                if (result?.result) {
                    const balance = BigInt(result.result).toString();
                    balances[key] = {
                        ...token,
                        balance: balance,
                        formatted: this.formatBalance(balance, token.decimals)
                    };
                }
            });
            
            this.tokenBalances = balances;
            
            // АГРЕССИВНОЕ КЕШИРОВАНИЕ: 5 минут TTL
            await this.setCache(cacheKey, balances, CONFIG.CACHE.BALANCE_TTL);
            
            this.displayBalances();
            
            const balanceElement = document.getElementById('balance');
            if (balanceElement && balances.BNB) {
                balanceElement.textContent = balances.BNB.formatted;
            }
            
            this.log('✅ ALL balances fetched in ONE request!', 'success');
            
        } catch (error) {
            this.log('Error updating balances', 'error');
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
    
    displayBalances() {
        const gridElement = document.getElementById('balancesGrid');
        if (!gridElement) return;
        
        const balances = Object.values(this.tokenBalances);
        if (balances.length === 0) {
            gridElement.innerHTML = `<div class="loading-state"><p>Загрузка балансов...</p></div>`;
            return;
        }
        
        const html = balances.map(token => `
            <div class="balance-card">
                <div class="balance-header">
                    <div class="balance-icon">${token.icon}</div>
                    <div class="balance-token">${token.symbol}</div>
                </div>
                <div class="balance-amount">${token.formatted}</div>
                <div class="balance-usd">${token.name}</div>
            </div>
        `).join('');
        
        gridElement.innerHTML = html;
    }
    
    // ============= ОПТИМИЗИРОВАННЫЙ СЧЕТЧИК ТРАНЗАКЦИЙ =============
    
    async fetchTotalTransactionCount() {
        try {
            const cacheKey = 'total_tx_count';
            const cached = await this.getFromCache(cacheKey, CONFIG.CACHE.TOTAL_TX_TTL);
            
            if (cached) {
                this.log('Using cached total TX count', 'cache');
                this.totalTxCount = cached;
                this.updateStats();
                return;
            }
            
            this.log('Fetching total transaction count...', 'info');
            
            // ОПТИМИЗАЦИЯ: Параллельные запросы с минимальным offset
            const [regularCount, tokenCount] = await Promise.all([
                this.getTransactionCountOptimized('txlist'),
                this.getTransactionCountOptimized('tokentx')
            ]);
            
            this.totalTxCount = regularCount + tokenCount;
            
            // АГРЕССИВНОЕ КЕШИРОВАНИЕ: 10 минут TTL (счетчик не меняется часто)
            await this.setCache(cacheKey, this.totalTxCount, CONFIG.CACHE.TOTAL_TX_TTL * 10);
            
            this.updateStats();
            
            this.log(`Total transactions: ${this.totalTxCount}`, 'success');
            
        } catch (error) {
            this.log('Error fetching total TX count', 'error');
        }
    }
    
    async getTransactionCountOptimized(action) {
        try {
            // УЛУЧШЕННЫЙ МЕТОД: Бинарный поиск для точного подсчета
            this.log(`Counting ${action} transactions...`, 'info');
            
            // Шаг 1: Пробуем получить много транзакций за раз
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=${action}&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result && Array.isArray(data.result)) {
                const count = data.result.length;
                
                if (count === 0) {
                    return 0;
                }
                
                // Если получили ровно 10000, значит транзакций больше
                // В таком случае делаем еще один запрос для более точного подсчета
                if (count === 10000) {
                    this.log(`More than 10000 ${action} - using approximation`, 'warning');
                    // Берем последнюю транзакцию и экстраполируем
                    const lastTx = data.result[data.result.length - 1];
                    const lastBlock = parseInt(lastTx.blockNumber);
                    const currentBlock = this.currentBlock || lastBlock;
                    
                    // Примерная оценка: 10000 TX за (currentBlock - lastBlock) блоков
                    // BSC: ~3 сек на блок, ~28800 блоков в день
                    const blocksPerDay = 28800;
                    const daysPassed = (currentBlock - lastBlock) / blocksPerDay;
                    const txPerDay = 10000 / daysPassed;
                    
                    // Экстраполируем на весь период
                    const totalBlocks = currentBlock - (lastTx.blockNumber || currentBlock - 1000000);
                    const estimatedTotal = Math.floor((totalBlocks / blocksPerDay) * txPerDay);
                    
                    return Math.max(10000, Math.min(estimatedTotal, 50000));
                }
                
                // Если меньше 10000 - это точное количество
                this.log(`Exact count for ${action}: ${count}`, 'success');
                return count;
            }
            
        } catch (error) {
            this.log(`Error getting ${action} count: ${error.message}`, 'error');
        }
        return 0;
    }
    
    // ============= ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ТРАНЗАКЦИЙ =============
    
    async fetchTransactions(page = 1, reset = false) {
        if (this.isLoading) return;
        if (!this.hasMore && !reset) return;
        
        this.isLoading = true;
        
        if (reset) {
            this.currentPage = 1;
            this.hasMore = true;
            this.allTransactions = [];
        }
        
        try {
            const cacheKey = `transactions_page_${page}`;
            const cached = await this.getFromCache(cacheKey, CONFIG.CACHE.TX_TTL);
            
            if (cached && !reset) {
                this.log(`Using cached transactions page ${page}`, 'cache');
                
                if (reset) {
                    this.allTransactions = cached;
                } else {
                    this.allTransactions = [...this.allTransactions, ...cached];
                }
                
                this.displayTransactions(this.allTransactions);
                
                if (cached.length < CONFIG.PAGINATION.PAGE_SIZE) {
                    this.hasMore = false;
                    this.showEndOfList();
                }
                
                this.isLoading = false;
                return;
            }
            
            // ОПТИМИЗАЦИЯ: Параллельная загрузка но с rate limiting
            const [regular, token] = await Promise.all([
                this.fetchRegularTransactions(page),
                this.fetchTokenTransactions(page)
            ]);
            
            const newTransactions = [
                ...regular.map(tx => ({...tx, txType: 'regular'})),
                ...token.map(tx => ({...tx, txType: 'token'}))
            ];
            
            newTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
            
            // Кешируем страницу
            await this.setCache(cacheKey, newTransactions, CONFIG.CACHE.TX_TTL);
            
            if (reset) {
                this.allTransactions = newTransactions;
            } else {
                this.allTransactions = [...this.allTransactions, ...newTransactions];
            }
            
            if (newTransactions.length < CONFIG.PAGINATION.PAGE_SIZE) {
                this.hasMore = false;
            }
            
            this.displayTransactions(this.allTransactions);
            
            if (!this.hasMore) {
                this.showEndOfList();
            }
            
        } catch (error) {
            this.log('Error fetching transactions', 'error');
            this.displayError();
        } finally {
            this.isLoading = false;
        }
    }
    
    async fetchRegularTransactions(page = 1) {
        try {
            const wallet = this.getCurrentWallet();
            if (!wallet.address) return [];
            
            const offset = CONFIG.PAGINATION.PAGE_SIZE;
            
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                return data.result;
            } else if (data.message === 'NOTOK') {
                this.log(`API Error: ${data.result}`, 'warning');
            }
            
        } catch (error) {
            this.log('Error fetching regular transactions', 'error');
        }
        return [];
    }
    
    async fetchTokenTransactions(page = 1) {
        try {
            const wallet = this.getCurrentWallet();
            if (!wallet.address) return [];
            
            const offset = CONFIG.PAGINATION.PAGE_SIZE;
            
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=tokentx&address=${wallet.address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                return data.result;
            }
            
        } catch (error) {
            this.log('Error fetching token transactions', 'error');
        }
        return [];
    }
    
    // ОПТИМИЗАЦИЯ: Rate limiting с увеличенной задержкой
    async rateLimitedFetch(url) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        
        if (timeSinceLastCall < this.apiCallDelay) {
            const waitTime = this.apiCallDelay - timeSinceLastCall;
            this.log(`Rate limiting: waiting ${waitTime}ms`, 'optimize');
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastApiCall = Date.now();
        return fetch(url);
    }
    
    displayTransactions(transactions) {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;
        
        if (!transactions || transactions.length === 0) {
            this.displayNoTransactions();
            return;
        }
        
        // v4.1.0: Уничтожить старый virtual scroll
        if (this.virtualScroll) {
            this.virtualScroll.destroy();
            this.virtualScroll = null;
        }
        
        // Очистить контейнер
        listElement.innerHTML = '';
        
        // v4.1.0: Создать virtual scroll
        const itemHeight = 150; // Высота tx-item
        
        this.virtualScroll = new VirtualScroll(
            listElement,
            itemHeight,
            (tx, index) => this.renderTransactionItem(tx, index)
        );
        
        // Установить данные
        this.virtualScroll.setItems(transactions);
        
        // Scroll loader
        if (this.hasMore && !this.isLoading) {
            const loader = document.createElement('div');
            loader.className = 'scroll-loader';
            loader.id = 'scrollLoader';
            loader.innerHTML = `<div class="spinner"></div><span>Загрузка...</span>`;
            loader.style.display = 'none';
            
            this.virtualScroll.attachScrollLoader(loader);
            this.virtualScroll.setScrollEndCallback(() => {
                if (this.hasMore && !this.isLoading && this.currentActivePage === 'exchange') {
                    this.log('Loading more transactions...', 'info');
                    this.currentPage++;
                    this.fetchTransactions(this.currentPage);
                }
            });
        }
    }
    
    // v4.1.0: Рендер одной транзакции для Virtual Scroll
    renderTransactionItem(tx, index) {
        const div = document.createElement('div');
        div.className = 'tx-item';
        div.onclick = () => this.openTxInExplorer(tx.hash);
        
        const wallet = this.getCurrentWallet();
        const isIncoming = tx.to.toLowerCase() === wallet.address.toLowerCase();
        const type = isIncoming ? 'in' : 'out';
        const typeLabel = isIncoming ? 'Входящая' : 'Исходящая';
        
        let value, symbol;
        if (tx.txType === 'token') {
            const decimals = parseInt(tx.tokenDecimal) || 18;
            value = (parseInt(tx.value) / Math.pow(10, decimals)).toFixed(6);
            symbol = tx.tokenSymbol || 'TOKEN';
        } else {
            value = (parseInt(tx.value) / 1e18).toFixed(6);
            symbol = CONFIG.NETWORK.SYMBOL;
        }
        
        const date = new Date(tx.timeStamp * 1000).toLocaleString('ru-RU');
        const txTypeLabel = tx.txType === 'token' ? '🪙 Токен' : '💰 BNB';
        
        div.innerHTML = `
            <div class="tx-header">
                <span class="tx-type ${type}">${typeLabel}</span>
                <span class="tx-hash">${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}</span>
            </div>
            <div class="tx-details">
                <div class="tx-detail">
                    <span class="tx-detail-label">Тип</span>
                    <span class="tx-detail-value">${txTypeLabel}</span>
                </div>
                <div class="tx-detail">
                    <span class="tx-detail-label">Сумма</span>
                    <span class="tx-detail-value">${value} ${symbol}</span>
                </div>
                <div class="tx-detail">
                    <span class="tx-detail-label">От/Кому</span>
                    <span class="tx-detail-value">${isIncoming ? tx.from.slice(0, 10) : tx.to.slice(0, 10)}...</span>
                </div>
                <div class="tx-detail">
                    <span class="tx-detail-label">Блок</span>
                    <span class="tx-detail-value">#${tx.blockNumber}</span>
                </div>
                <div class="tx-detail">
                    <span class="tx-detail-label">Время</span>
                    <span class="tx-detail-value">${date}</span>
                </div>
            </div>
        `;
        
        return div;
    }
    
    displayNoTransactions() {
        const listElement = document.getElementById('transactionList');
        if (listElement) {
            listElement.innerHTML = `<div class="loading-state"><p>Транзакции не найдены</p></div>`;
        }
    }
    
    displayError() {
        const listElement = document.getElementById('transactionList');
        if (listElement) {
            listElement.innerHTML = `
                <div class="loading-state">
                    <p>Ошибка загрузки транзакций</p>
                    <button class="btn-control" onclick="app.refreshData()">Повторить</button>
                </div>
            `;
        }
    }
    
    attachScrollLoader() {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;
        
        const existingLoader = listElement.querySelector('.scroll-loader');
        if (existingLoader) {
            existingLoader.remove();
        }
        
        const loader = document.createElement('div');
        loader.className = 'scroll-loader';
        loader.id = 'scrollLoader';
        loader.innerHTML = `<div class="spinner"></div><span>Загрузка...</span>`;
        loader.style.display = 'none';
        listElement.appendChild(loader);
    }
    
    showEndOfList() {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;
        
        const endMessage = document.createElement('div');
        endMessage.className = 'end-of-list';
        endMessage.textContent = 'Все транзакции загружены';
        listElement.appendChild(endMessage);
    }
    
    updateStats() {
        const totalTxElement = document.getElementById('totalTx');
        if (totalTxElement) {
            totalTxElement.textContent = this.totalTxCount.toLocaleString('ru-RU');
        }
        
        const apiStatusElement = document.getElementById('apiStatus');
        if (apiStatusElement) {
            apiStatusElement.textContent = this.isConnected ? 'Online' : 'Offline';
        }
    }
    
    updateBlockNumber(blockNumber) {
        const blockElement = document.getElementById('lastBlock');
        if (blockElement) {
            blockElement.textContent = `#${blockNumber.toLocaleString('ru-RU')}`;
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
    
    // v4.1.0: Улучшенное кеширование с IndexedDB
    async setCache(key, value, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return;
        
        // Memory cache (быстро)
        this.cache.set(key, {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        });
        
        // IndexedDB cache (персистентно)
        if (this.cacheReady) {
            try {
                await this.cacheDB.set(key, value, ttl);
                this.log(`💾 Cached to IndexedDB: ${key} (TTL: ${ttl/1000}s)`, 'cache');
            } catch (error) {
                this.log('Failed to cache to IndexedDB', 'error');
            }
        }
    }
    
    async getFromCache(key, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return null;
        
        // Memory cache сначала
        const cached = this.cache.get(key);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            const cacheTTL = cached.ttl || ttl;
            
            if (age <= cacheTTL) {
                this.log(`💾 Cache HIT (memory): ${key}`, 'cache');
                return cached.value;
            } else {
                this.cache.delete(key);
            }
        }
        
        // IndexedDB потом
        if (this.cacheReady) {
            try {
                const value = await this.cacheDB.get(key, ttl);
                if (value) {
                    // Восстановить в memory
                    this.cache.set(key, {
                        value: value,
                        timestamp: Date.now(),
                        ttl: ttl
                    });
                    this.log(`💾 Cache HIT (IndexedDB): ${key}`, 'cache');
                    return value;
                }
            } catch (error) {
                this.log('Failed to read from IndexedDB', 'error');
            }
        }
        
        this.log(`💾 Cache MISS: ${key}`, 'cache');
        return null;
    }
    
    openTxInExplorer(hash) {
        window.open(`${CONFIG.NETWORK.EXPLORER}/tx/${hash}`, '_blank');
    }
    
    setupInfiniteScroll() {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;
        
        const options = {
            root: listElement,
            rootMargin: `${CONFIG.SCROLL.THRESHOLD}px`,
            threshold: 0.1
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading && this.currentActivePage === 'exchange') {
                    this.log('Loading more transactions...', 'info');
                    this.currentPage++;
                    this.fetchTransactions(this.currentPage);
                }
            });
        }, options);
        
        setTimeout(() => {
            const loader = document.getElementById('scrollLoader');
            if (loader && this.observer) {
                this.observer.observe(loader);
            }
        }, 1000);
    }
    
    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.log('Manual refresh triggered', 'info');
                this.showLoading();
                this.refreshData();
            });
        }
        
        const filterBtn = document.getElementById('filterBtn');
        const filterPanel = document.getElementById('filterPanel');
        if (filterBtn && filterPanel) {
            filterBtn.addEventListener('click', () => {
                filterPanel.classList.toggle('hidden');
            });
        }
        
        const txTypeFilter = document.getElementById('txTypeFilter');
        if (txTypeFilter) {
            txTypeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    
    applyFilters() {
        const txType = document.getElementById('txTypeFilter')?.value || 'all';
        const period = document.getElementById('periodFilter')?.value || 'all';
        
        let filtered = [...this.allTransactions];
        
        if (txType !== 'all') {
            const wallet = this.getCurrentWallet();
            filtered = filtered.filter(tx => {
                const isIncoming = tx.to.toLowerCase() === wallet.address.toLowerCase();
                if (txType === 'in') return isIncoming;
                if (txType === 'out') return !isIncoming;
                if (txType === 'token') return tx.txType === 'token';
                return true;
            });
        }
        
        if (period !== 'all') {
            const now = Date.now() / 1000;
            const periods = {
                '24h': 86400,
                '7d': 604800,
                '30d': 2592000
            };
            
            const threshold = now - periods[period];
            filtered = filtered.filter(tx => tx.timeStamp >= threshold);
        }
        
        this.displayTransactions(filtered);
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SigmaTrade();
});

// ОПТИМИЗАЦИЯ: Останавливаем обновления когда вкладка неактивна
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Page hidden - pausing updates');
    } else {
        console.log('▶️ Page visible - resuming updates');
        if (app && app.currentActivePage === 'exchange') {
            // Обновляем только если прошло больше 2 минут
            const lastUpdate = app.cache.get('all_balances')?.timestamp || 0;
            if (Date.now() - lastUpdate > 120000) {
                app.debouncedRefreshData();
            }
        }
    }
});
