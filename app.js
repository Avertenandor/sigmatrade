// SigmaTrade Application - Enhanced Version
class SigmaTrade {
    constructor() {
        this.ws = null;
        this.transactions = [];
        this.tokenTransactions = [];
        this.currentBlock = null;
        this.balance = '0';
        this.isConnected = false;
        this.cache = new Map();
        this.lastApiCall = 0;
        this.apiCallDelay = 5000; // 5 seconds between API calls
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }
    
    async init() {
        this.log('Initializing SigmaTrade...', 'info');
        
        // Initialize UI
        this.initializeUI();
        
        // Connect to QuickNode WebSocket
        await this.connectWebSocket();
        
        // Start monitoring
        await this.startMonitoring();
        
        // Set up event listeners
        this.setupEventListeners();
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
                    this.fetchAllTransactions();
                }
            }
            
        } catch (error) {
            this.log('Error handling WebSocket message', 'error');
        }
    }
    
    invalidateCache() {
        this.cache.clear();
        this.log('Cache invalidated', 'info');
    }
    
    async startMonitoring() {
        // Get initial data
        await this.updateBalance();
        await this.fetchAllTransactions();
        
        // Set up periodic updates
        setInterval(() => this.updateBalance(), CONFIG.INTERVALS.BALANCE_UPDATE);
    }
    
    async updateBalance() {
        try {
            const response = await this.makeRPCCall({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [CONFIG.WALLET_ADDRESS, 'latest'],
                id: Date.now()
            });
            
            if (response && response.result) {
                const balanceWei = parseInt(response.result, 16);
                const balanceBNB = (balanceWei / 1e18).toFixed(4);
                this.balance = balanceBNB;
                
                const balanceElement = document.getElementById('balance');
                if (balanceElement) {
                    balanceElement.textContent = balanceBNB;
                }
            }
        } catch (error) {
            this.log('Error updating balance', 'error');
        }
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
    
    async fetchAllTransactions() {
        // Fetch both regular and token transactions
        await Promise.all([
            this.fetchRegularTransactions(),
            this.fetchTokenTransactions()
        ]);
        
        // Merge and display
        this.mergeAndDisplayTransactions();
    }
    
    async fetchRegularTransactions() {
        try {
            const cacheKey = 'regular_tx';
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.log('Using cached regular transactions', 'info');
                this.transactions = cached;
                return;
            }
            
            this.log('Fetching regular transactions...', 'info');
            
            // Build URL with API key if available
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=txlist&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=${CONFIG.PAGINATION.PAGE_SIZE}&sort=desc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                this.transactions = data.result;
                this.setCache(cacheKey, data.result);
                this.log(`Loaded ${data.result.length} regular transactions`, 'success');
            } else if (data.message === 'NOTOK') {
                this.log(`API Error: ${data.result}`, 'warning');
            }
            
        } catch (error) {
            this.log('Error fetching regular transactions', 'error');
        }
    }
    
    async fetchTokenTransactions() {
        try {
            const cacheKey = 'token_tx';
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.log('Using cached token transactions', 'info');
                this.tokenTransactions = cached;
                return;
            }
            
            this.log('Fetching token transactions...', 'info');
            
            // Build URL for BEP-20 token transfers
            let url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=tokentx&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=${CONFIG.PAGINATION.PAGE_SIZE}&sort=desc`;
            
            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }
            
            const response = await this.rateLimitedFetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                this.tokenTransactions = data.result;
                this.setCache(cacheKey, data.result);
                this.log(`Loaded ${data.result.length} token transactions`, 'success');
            }
            
        } catch (error) {
            this.log('Error fetching token transactions', 'error');
        }
    }
    
    mergeAndDisplayTransactions() {
        // Merge both types of transactions
        const allTransactions = [
            ...this.transactions.map(tx => ({...tx, txType: 'regular'})),
            ...this.tokenTransactions.map(tx => ({...tx, txType: 'token'}))
        ];
        
        // Sort by timestamp descending
        allTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
        
        // Take only the most recent ones
        const recent = allTransactions.slice(0, CONFIG.PAGINATION.PAGE_SIZE);
        
        this.displayTransactions(recent);
        this.updateStats(allTransactions.length);
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
                    <button class="btn-control" onclick="app.fetchAllTransactions()">Повторить</button>
                </div>
            `;
        }
    }
    
    updateStats(totalCount = null) {
        const totalTxElement = document.getElementById('totalTx');
        if (totalTxElement) {
            const count = totalCount || (this.transactions.length + this.tokenTransactions.length);
            totalTxElement.textContent = count;
        }
        
        const apiStatusElement = document.getElementById('apiStatus');
        if (apiStatusElement) {
            apiStatusElement.textContent = this.isConnected ? 'Online' : 'Offline';
        }
    }
    
    updateBlockNumber(blockNumber) {
        const blockElement = document.getElementById('lastBlock');
        if (blockElement) {
            blockElement.textContent = `#${blockNumber.toLocaleString()}`;
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
    setCache(key, value) {
        if (!CONFIG.CACHE.ENABLED) return;
        
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }
    
    getFromCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;
        
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is still valid
        if (Date.now() - cached.timestamp > CONFIG.CACHE.TTL) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    openTxInExplorer(hash) {
        window.open(`${CONFIG.NETWORK.EXPLORER}/tx/${hash}`, '_blank');
    }
    
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.invalidateCache();
                this.showLoading();
                this.fetchAllTransactions();
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
        
        // Merge all transactions
        let allTransactions = [
            ...this.transactions.map(tx => ({...tx, txType: 'regular'})),
            ...this.tokenTransactions.map(tx => ({...tx, txType: 'token'}))
        ];
        
        // Filter by type
        if (txType !== 'all') {
            allTransactions = allTransactions.filter(tx => {
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
            allTransactions = allTransactions.filter(tx => tx.timeStamp >= threshold);
        }
        
        // Sort by timestamp
        allTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
        
        this.displayTransactions(allTransactions);
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
        if (app) {
            app.fetchAllTransactions();
        }
    }
});
