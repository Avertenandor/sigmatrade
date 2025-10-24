// SigmaTrade Application v10.1.0 - Multi-Wallet Fixed
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
        
        this.init();
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
        
        this.setupEventListeners();
        this.setupInfiniteScroll();
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
        
        await this.fetchTransactions(1);
        
        setTimeout(() => {
            this.updateAllBalancesBatched();
            this.fetchTotalTransactionCount();
        }, 1000);
        
        setInterval(() => {
            const currentWallet = this.getCurrentWallet();
            if (currentWallet.address && !document.hidden) {
                this.updateAllBalancesBatched();
            }
        }, CONFIG.INTERVALS.BALANCE_UPDATE * 5);
    }
    
    async refreshData() {
        const wallet = this.getCurrentWallet();
        if (!wallet.address) return;
        
        this.log('Refreshing data...', 'optimize');
        
        await Promise.all([
            this.updateAllBalancesBatched(),
            this.fetchTotalTransactionCount()
        ]);
        
        this.currentPage = 1;
        this.hasMore = true;
        await this.fetchTransactions(1, true);
    }
    
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
            
            const wallet = this.getCurrentWallet();
            if (!wallet.address) {
                this.log('Current wallet has no address', 'warning');
                return;
            }
            
            const batchRequests = [];
            
            batchRequests.push({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [wallet.address, 'latest'],
                id: 1
            });
            
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
            
            const response = await fetch(CONFIG.QUICKNODE.HTTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequests)
            });
            
            const results = await response.json();
            const balances = {};
            
            if (results[0]?.result) {
                const bnbBalance = BigInt(results[0].result).toString();
                balances.BNB = {
                    ...CONFIG.TOKENS.BNB,
                    balance: bnbBalance,
                    formatted: this.formatBalance(bnbBalance, CONFIG.TOKENS.BNB.decimals)
                };
            }
            
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
            await this.setCache(cacheKey, balances, CONFIG.CACHE.BALANCE_TTL);
            this.displayBalances();
            
            const balanceElement = document.getElementById('balance');
            const mevBalanceElement = document.getElementById('mevBalance');
            
            if (balanceElement && balances.BNB) {
                balanceElement.textContent = balances.BNB.formatted;
            }
            if (mevBalanceElement && balances.BNB) {
                mevBalanceElement.textContent = balances.BNB.formatted;
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
        // Отображаем балансы на текущей странице
        const gridId = this.currentActivePage === 'mev' ? 'mevBalancesGrid' : 'balancesGrid';
        const gridElement = document.getElementById(gridId);
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
            
            const [regularCount, tokenCount] = await Promise.all([
                this.getTransactionCountOptimized('txlist'),
                this.getTransactionCountOptimized('tokentx')
            ]);
            
            this.totalTxCount = regularCount + tokenCount;
            await this.setCache(cacheKey, this.totalTxCount, CONFIG.CACHE.TOTAL_TX_TTL * 10);
            this.updateStats();
            this.log(`Total transactions: ${this.totalTxCount}`, 'success');
            
        } catch (error) {
            this.log('Error fetching total TX count', 'error');
        }
    }
    
    async getTransactionCountOptimized(action) {
        try {
            this.log(`Counting ${action} transactions...`, 'info');
            
            const wallet = this.getCurrentWallet();
            if (!wallet.address) return 0;
            
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=${action}&address=${wallet.address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc`;
            
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
                
                if (count === 10000) {
                    this.log(`More than 10000 ${action} - using approximation`, 'warning');
                    const lastTx = data.result[data.result.length - 1];
                    const lastBlock = parseInt(lastTx.blockNumber);
                    const currentBlock = this.currentBlock || lastBlock;
                    
                    const blocksPerDay = 28800;
                    const daysPassed = (currentBlock - lastBlock) / blocksPerDay;
                    const txPerDay = 10000 / daysPassed;
                    
                    const totalBlocks = currentBlock - (lastTx.blockNumber || currentBlock - 1000000);
                    const estimatedTotal = Math.floor((totalBlocks / blocksPerDay) * txPerDay);
                    
                    return Math.max(10000, Math.min(estimatedTotal, 50000));
                }
                
                this.log(`Exact count for ${action}: ${count}`, 'success');
                return count;
            }
            
        } catch (error) {
            this.log(`Error getting ${action} count: ${error.message}`, 'error');
        }
        return 0;
    }
    
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
            
            const [regular, token] = await Promise.all([
                this.fetchRegularTransactions(page),
                this.fetchTokenTransactions(page)
            ]);
            
            const newTransactions = [
                ...regular.map(tx => ({...tx, txType: 'regular'})),
                ...token.map(tx => ({...tx, txType: 'token'}))
            ];
            
            newTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
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
        // Отображаем транзакции на текущей странице
        const listId = this.currentActivePage === 'mev' ? 'mevTransactionList' : 'transactionList';
        const listElement = document.getElementById(listId);
        if (!listElement) return;
        
        if (!transactions || transactions.length === 0) {
            this.displayNoTransactions();
            return;
        }
        
        if (this.virtualScroll) {
            this.virtualScroll.destroy();
            this.virtualScroll = null;
        }
        
        listElement.innerHTML = '';
        
        const itemHeight = 150;
        
        this.virtualScroll = new VirtualScroll(
            listElement,
            itemHeight,
            (tx, index) => this.renderTransactionItem(tx, index)
        );
        
        this.virtualScroll.setItems(transactions);
        
        if (this.hasMore && !this.isLoading) {
            const loader = document.createElement('div');
            loader.className = 'scroll-loader';
            loader.id = 'scrollLoader';
            loader.innerHTML = `<div class="spinner"></div><span>Загрузка...</span>`;
            loader.style.display = 'none';
            
            this.virtualScroll.attachScrollLoader(loader);
            this.virtualScroll.setScrollEndCallback(() => {
                const wallet = this.getCurrentWallet();
                if (this.hasMore && !this.isLoading && wallet?.address) {
                    this.log('Loading more transactions...', 'info');
                    this.currentPage++;
                    this.fetchTransactions(this.currentPage);
                }
            });
        }
    }
    
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
                <div class="tx-hash-container">
                    <span class="tx-hash" title="${tx.hash}">${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}</span>
                    <button class="copy-btn" onclick="app.copyToClipboard('${tx.hash}', event)" title="Копировать хеш">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
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
        const listId = this.currentActivePage === 'mev' ? 'mevTransactionList' : 'transactionList';
        const listElement = document.getElementById(listId);
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
    
    showEndOfList() {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;
        
        const endMessage = document.createElement('div');
        endMessage.className = 'end-of-list';
        endMessage.textContent = 'Все транзакции загружены';
        listElement.appendChild(endMessage);
    }
    
    updateStats() {
        // Обновляем статистику на всех страницах
        const totalTxElement = document.getElementById('totalTx');
        const mevTotalTxElement = document.getElementById('mevTotalTx');
        
        if (totalTxElement) {
            totalTxElement.textContent = this.totalTxCount.toLocaleString('ru-RU');
        }
        if (mevTotalTxElement) {
            mevTotalTxElement.textContent = this.totalTxCount.toLocaleString('ru-RU');
        }
        
        const apiStatusElement = document.getElementById('apiStatus');
        const mevApiStatusElement = document.getElementById('mevApiStatus');
        
        const statusText = this.isConnected ? 'Online' : 'Offline';
        if (apiStatusElement) {
            apiStatusElement.textContent = statusText;
        }
        if (mevApiStatusElement) {
            mevApiStatusElement.textContent = statusText;
        }
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
    
    async setCache(key, value, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return;
        
        this.cache.set(key, {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        });
        
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
        
        if (this.cacheReady) {
            try {
                const value = await this.cacheDB.get(key, ttl);
                if (value) {
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
    
    async copyToClipboard(text, event) {
        // Prevent tx-item click event
        if (event) {
            event.stopPropagation();
        }
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Show toast notification
            if (window.showToast) {
                showToast('✅ Хеш скопирован в буфер обмена!', 'success');
            }
            
            // Visual feedback on button
            if (event && event.currentTarget) {
                const btn = event.currentTarget;
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '✓';
                btn.style.background = 'var(--accent-success)';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                }, 1500);
            }
        } catch (error) {
            this.log('Failed to copy to clipboard', 'error');
            if (window.showToast) {
                showToast('❌ Ошибка копирования', 'error');
            }
        }
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
                const wallet = this.getCurrentWallet();
                if (entry.isIntersecting && this.hasMore && !this.isLoading && wallet?.address) {
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
        // Exchange page buttons
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
        
        // MEV page buttons
        const mevRefreshBtn = document.getElementById('mevRefreshBtn');
        if (mevRefreshBtn) {
            mevRefreshBtn.addEventListener('click', () => {
                this.log('MEV Manual refresh triggered', 'info');
                this.showLoading();
                this.refreshData();
            });
        }
        
        const mevFilterBtn = document.getElementById('mevFilterBtn');
        const mevFilterPanel = document.getElementById('mevFilterPanel');
        if (mevFilterBtn && mevFilterPanel) {
            mevFilterBtn.addEventListener('click', () => {
                mevFilterPanel.classList.toggle('hidden');
            });
        }
        
        // Exchange filters
        const txTypeFilter = document.getElementById('txTypeFilter');
        if (txTypeFilter) {
            txTypeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // MEV filters
        const mevTxTypeFilter = document.getElementById('mevTxTypeFilter');
        if (mevTxTypeFilter) {
            mevTxTypeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const mevPeriodFilter = document.getElementById('mevPeriodFilter');
        if (mevPeriodFilter) {
            mevPeriodFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    
    applyFilters() {
        // Используем фильтры с текущей страницы
        const isMevPage = this.currentActivePage === 'mev';
        const txType = document.getElementById(isMevPage ? 'mevTxTypeFilter' : 'txTypeFilter')?.value || 'all';
        const period = document.getElementById(isMevPage ? 'mevPeriodFilter' : 'periodFilter')?.value || 'all';
        
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

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SigmaTrade();

    // Initialize email copy buttons
    initEmailCopyButtons();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Page hidden - pausing updates');
    } else {
        console.log('▶️ Page visible - resuming updates');
        if (app && app.getCurrentWallet()?.address) {
            const lastUpdate = app.cache.get('all_balances')?.timestamp || 0;
            if (Date.now() - lastUpdate > 120000) {
                app.debouncedRefreshData();
            }
        }
    }
});

// ✉️ Email Copy Functionality
function initEmailCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-email-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = button.getAttribute('data-email');

            try {
                // Copy to clipboard
                await navigator.clipboard.writeText(email);

                // Visual feedback
                button.classList.add('copied');

                // Show toast notification
                if (window.showToast) {
                    showToast(`📧 Email скопирован: ${email}`, 'success');
                }

                // Reset button state after animation
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 500);

            } catch (err) {
                console.error('Failed to copy email:', err);

                // Fallback method
                fallbackCopyEmail(email, button);
            }
        });
    });
}

// Fallback copy method for older browsers
function fallbackCopyEmail(email, button) {
    const textArea = document.createElement('textarea');
    textArea.value = email;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        button.classList.add('copied');

        if (window.showToast) {
            showToast(`📧 Email скопирован: ${email}`, 'success');
        }

        setTimeout(() => {
            button.classList.remove('copied');
        }, 500);
    } catch (err) {
        console.error('Fallback copy failed:', err);
        if (window.showToast) {
            showToast('❌ Не удалось скопировать email', 'error');
        }
    } finally {
        document.body.removeChild(textArea);
    }
}
