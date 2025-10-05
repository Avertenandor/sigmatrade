// SigmaTrade Application v3.0.0 - Multi-page Structure
class SigmaTrade {
    constructor() {
        this.ws = null;
        this.transactions = [];
        this.tokenTransactions = [];
        this.allTransactions = []; // Merged list for display
        this.currentBlock = null;
        this.balance = '0';
        this.tokenBalances = {};
        this.totalTxCount = 0;
        this.isConnected = false;
        this.cache = new Map();
        this.lastApiCall = 0;
        this.apiCallDelay = 5000; // 5 seconds between API calls
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Pagination state
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.observer = null;
        
        // Current active page
        this.currentActivePage = 'exchange';
        
        this.init();
    }
    
    async init() {
        this.log('Initializing SigmaTrade v3.0.0...', 'info');
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize UI
        this.initializeUI();
        
        // Connect to QuickNode WebSocket
        await this.connectWebSocket();
        
        // Start monitoring (only for exchange page)
        await this.startMonitoring();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up infinite scroll
        this.setupInfiniteScroll();
        
        // Handle initial URL hash
        this.handleHashChange();
    }
    
    // ============= NAVIGATION =============
    
    initializeNavigation() {
        // Tab navigation
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                this.switchPage(page);
            });
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenuToggle.classList.toggle('active');
                mainNav.classList.toggle('mobile-open');
            });
        }
        
        // Handle hash changes (for direct URL navigation)
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }
    
    handleHashChange() {
        const hash = window.location.hash.slice(1); // Remove #
        const validPages = ['exchange', 'mev', 'arbitrage'];
        
        if (validPages.includes(hash)) {
            this.switchPage(hash);
        } else {
            // Default to exchange page
            window.location.hash = 'exchange';
        }
    }
    
    switchPage(pageName) {
        // Close mobile menu if open
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.classList.remove('active');
            mainNav.classList.remove('mobile-open');
        }
        
        // Update active tab
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            if (tab.getAttribute('data-page') === pageName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update active page
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id === `page-${pageName}`) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        // Update URL hash
        window.location.hash = pageName;
        
        // Update current active page
        this.currentActivePage = pageName;
        
        this.log(`Switched to page: ${pageName}`, 'info');
    }
    
    // Safe logging without exposing sensitive data
    log(message, type = 'info') {
        const emoji = {
            info: '🚀',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            network: '🔌'
        };
        console.log(`${emoji[type]} ${message}`);
    }
    
    initializeUI() {
        // Set wallet address
        const walletShort = document.getElementById('walletShort');
        if (walletShort) {
            const addr = CONFIG.WALLET_ADDRESS;
            walletShort.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        }
        
        // Set network name
        const networkName = document.getElementById('networkName');
        if (networkName) {
            networkName.textContent = CONFIG.NETWORK.NAME;
        }
        
        // Show loading state
        this.showLoading();
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
        try {
            this.log('Connecting to WebSocket...', 'network');
            
            this.ws = new WebSocket(CONFIG.QUICKNODE.WSS);
            
            this.ws.onopen = () => {
                this.log('WebSocket connected', 'success');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateNetworkStatus(true);
                
                // Subscribe to new blocks
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
                
                // Reconnect with exponential backoff
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
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
            
            // Handle new block
            if (data.method === 'eth_subscription' && data.params?.result?.number) {
                const blockNumber = parseInt(data.params.result.number, 16);
                this.currentBlock = blockNumber;
                this.updateBlockNumber(blockNumber);
                
                // Check for new transactions periodically (every 10 blocks ~30 sec)
                if (blockNumber % 10 === 0) {
                    this.invalidateCache();
                    if (this.currentActivePage === 'exchange') {
                        this.refreshData();
                    }
                }
            }
            
        } catch (error) {
            this.log('Error handling WebSocket message', 'error');
        }
    }
    
    invalidateCache() {
        // Keep total TX count cache, but invalidate transaction lists
        const totalTxCache = this.cache.get('total_tx_count');
        this.cache.clear();
        if (totalTxCache) {
            this.cache.set('total_tx_count', totalTxCache);
        }
        this.log('Cache invalidated', 'info');
    }
    
    async startMonitoring() {
        // Get initial data (only for exchange page)
        if (this.currentActivePage === 'exchange') {
            await Promise.all([
                this.updateAllBalances(),
                this.fetchTotalTransactionCount(),
                this.fetchTransactions(1)
            ]);
        }
        
        // Set up periodic updates
        setInterval(() => {
            if (this.currentActivePage === 'exchange') {
                this.updateAllBalances();
            }
        }, CONFIG.INTERVALS.BALANCE_UPDATE);
    }
    
    async refreshData() {
        // Only refresh if on exchange page
        if (this.currentActivePage !== 'exchange') return;
        
        // Refresh balances and first page of transactions
        await Promise.all([
            this.updateAllBalances(),
            this.fetchTotalTransactionCount()
        ]);
        
        // Reset pagination
        this.currentPage = 1;
        this.hasMore = true;
        await this.fetchTransactions(1, true);
    }
    
    // ============= TOKEN BALANCES =============
    
    async updateAllBalances() {
        try {
            const balances = {};
            
            // Get BNB balance
            const bnbBalance = await this.getBNBBalance();
            balances.BNB = {
                ...CONFIG.TOKENS.BNB,
                balance: bnbBalance,
                formatted: this.formatBalance(bnbBalance, CONFIG.TOKENS.BNB.decimals)
            };
            
            // Get ERC-20 token balances
            for (const [key, token] of Object.entries(CONFIG.TOKENS)) {
                if (token.isNative) continue; // Skip BNB, already done
                
                const balance = await this.getTokenBalance(token.address, token.decimals);
                balances[key] = {
                    ...token,
                    balance: balance,
                    formatted: this.formatBalance(balance, token.decimals)
                };
            }
            
            this.tokenBalances = balances;
            this.displayBalances();
            
            // Update BNB in stat card
            const balanceElement = document.getElementById('balance');
            if (balanceElement && balances.BNB) {
                balanceElement.textContent = balances.BNB.formatted;
            }
            
        } catch (error) {
            this.log('Error updating balances', 'error');
        }
    }
    
    async getBNBBalance() {
        try {
            const response = await this.makeRPCCall({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [CONFIG.WALLET_ADDRESS, 'latest'],
                id: Date.now()
            });
            
            if (response && response.result) {
                const balanceWei = BigInt(response.result);
                return balanceWei.toString();
            }
        } catch (error) {
            this.log('Error getting BNB balance', 'error');
        }
        return '0';
    }
    
    async getTokenBalance(contractAddress, decimals) {
        try {
            // ERC-20 balanceOf(address) function signature
            const data = '0x70a08231000000000000000000000000' + CONFIG.WALLET_ADDRESS.slice(2).toLowerCase();
            
            const response = await this.makeRPCCall({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: contractAddress,
                    data: data
                }, 'latest'],
                id: Date.now()
            });
            
            if (response && response.result) {
                const balance = BigInt(response.result);
                return balance.toString();
            }
        } catch (error) {
            this.log(`Error getting token balance for ${contractAddress}`, 'error');
        }
        return '0';
    }
    
    formatBalance(balanceWei, decimals) {
        try {
            const balance = BigInt(balanceWei);
            const divisor = BigInt(10) ** BigInt(decimals);
            const wholePart = balance / divisor;
            const fractionalPart = balance % divisor;
            
            // Format with up to 4 decimal places
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
            gridElement.innerHTML = `
                <div class="loading-state">
                    <p>Загрузка балансов...</p>
                </div>
            `;
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
    
    // ============= TOTAL TRANSACTION COUNT =============
    
    async fetchTotalTransactionCount() {
        try {
            const cacheKey = 'total_tx_count';
            const cached = this.getFromCache(cacheKey, CONFIG.CACHE.TOTAL_TX_TTL);
            if (cached) {
                this.log('Using cached total TX count', 'info');
                this.totalTxCount = cached;
                this.updateStats();
                return;
            }
            
            this.log('Fetching total transaction count...', 'info');
            
            // Get counts from both endpoints
            const [regularCount, tokenCount] = await Promise.all([
                this.getTransactionCount('txlist'),
                this.getTransactionCount('tokentx')
            ]);
            
            this.totalTxCount = regularCount + tokenCount;
            this.setCache(cacheKey, this.totalTxCount, CONFIG.CACHE.TOTAL_TX_TTL);
            this.updateStats();
            
            this.log(`Total transactions: ${this.totalTxCount}`, 'success');
            
        } catch (error) {
            this.log('Error fetching total TX count', 'error');
        }
    }
    
    async getTransactionCount(action) {
        try {
            // Use page=1&offset=1 to get metadata with total count
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=${action}&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                // Return the length of results
                // Note: Etherscan doesn't provide total count in response,
                // so we approximate by checking if we got maximum results
                return data.result.length;
            }
            
        } catch (error) {
            this.log(`Error getting ${action} count`, 'error');
        }
        return 0;
    }
    
    // ============= TRANSACTION FETCHING WITH PAGINATION =============
    
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
            // Fetch both regular and token transactions for this page
            const [regular, token] = await Promise.all([
                this.fetchRegularTransactions(page),
                this.fetchTokenTransactions(page)
            ]);
            
            // Merge and sort
            const newTransactions = [
                ...regular.map(tx => ({...tx, txType: 'regular'})),
                ...token.map(tx => ({...tx, txType: 'token'}))
            ];
            
            newTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
            
            if (reset) {
                this.allTransactions = newTransactions;
            } else {
                this.allTransactions = [...this.allTransactions, ...newTransactions];
            }
            
            // Check if we have more to load
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
            const offset = CONFIG.PAGINATION.PAGE_SIZE;
            
            this.log(`Fetching regular transactions (page ${page})...`, 'info');
            
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=txlist&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;
            
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
            const offset = CONFIG.PAGINATION.PAGE_SIZE;
            
            this.log(`Fetching token transactions (page ${page})...`, 'info');
            
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=tokentx&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;
            
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
    
    // Rate limiting wrapper for API calls
    async rateLimitedFetch(url) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        
        if (timeSinceLastCall < this.apiCallDelay) {
            const waitTime = this.apiCallDelay - timeSinceLastCall;
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
        
        const html = transactions.map(tx => {
            const isIncoming = tx.to.toLowerCase() === CONFIG.WALLET_ADDRESS.toLowerCase();
            const type = isIncoming ? 'in' : 'out';
            const typeLabel = isIncoming ? 'Входящая' : 'Исходящая';
            
            // Handle both regular and token transactions
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
            
            return `
                <div class="tx-item" onclick="app.openTxInExplorer('${tx.hash}')">
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
                </div>
            `;
        }).join('');
        
        listElement.innerHTML = html;
        
        // Re-attach scroll loader if has more
        if (this.hasMore && !this.isLoading) {
            this.attachScrollLoader();
        }
    }
    
    displayNoTransactions() {
        const listElement = document.getElementById('transactionList');
        if (listElement) {
            listElement.innerHTML = `
                <div class="loading-state">
                    <p>Транзакции не найдены</p>
                </div>
            `;
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
        
        // Remove existing loader if any
        const existingLoader = listElement.querySelector('.scroll-loader');
        if (existingLoader) {
            existingLoader.remove();
        }
        
        // Add loader at the end
        const loader = document.createElement('div');
        loader.className = 'scroll-loader';
        loader.id = 'scrollLoader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <span>Загрузка...</span>
        `;
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
    
    async makeRPCCall(payload) {
        try {
            const response = await fetch(CONFIG.QUICKNODE.HTTP, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            return await response.json();
        } catch (error) {
            this.log('RPC call error', 'error');
            return null;
        }
    }
    
    // Cache management
    setCache(key, value, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return;
        
        this.cache.set(key, {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        });
    }
    
    getFromCache(key, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return null;
        
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is still valid
        const age = Date.now() - cached.timestamp;
        const cacheTTL = cached.ttl || ttl;
        
        if (age > cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    openTxInExplorer(hash) {
        window.open(`${CONFIG.NETWORK.EXPLORER}/tx/${hash}`, '_blank');
    }
    
    // ============= INFINITE SCROLL =============
    
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
        
        // Start observing the loader
        setTimeout(() => {
            const loader = document.getElementById('scrollLoader');
            if (loader && this.observer) {
                this.observer.observe(loader);
            }
        }, 1000);
    }
    
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.log('Manual refresh triggered', 'info');
                this.showLoading();
                this.refreshData();
            });
        }
        
        // Filter button
        const filterBtn = document.getElementById('filterBtn');
        const filterPanel = document.getElementById('filterPanel');
        if (filterBtn && filterPanel) {
            filterBtn.addEventListener('click', () => {
                filterPanel.classList.toggle('hidden');
            });
        }
        
        // Filter handlers
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
        
        // Filter by type
        if (txType !== 'all') {
            filtered = filtered.filter(tx => {
                const isIncoming = tx.to.toLowerCase() === CONFIG.WALLET_ADDRESS.toLowerCase();
                if (txType === 'in') return isIncoming;
                if (txType === 'out') return !isIncoming;
                if (txType === 'token') return tx.txType === 'token';
                return true;
            });
        }
        
        // Filter by period
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

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SigmaTrade();
});

// Handle page visibility for optimization
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Page hidden - reducing updates');
    } else {
        console.log('▶️ Page visible - resuming updates');
        if (app && app.currentActivePage === 'exchange') {
            app.refreshData();
        }
    }
});
