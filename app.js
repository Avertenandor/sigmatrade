// SigmaTrade Application
class SigmaTrade {
    constructor() {
        this.ws = null;
        this.transactions = [];
        this.currentBlock = null;
        this.balance = '0';
        this.isConnected = false;
        this.cache = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing SigmaTrade...');
        
        // Initialize UI
        this.initializeUI();
        
        // Connect to QuickNode WebSocket
        await this.connectWebSocket();
        
        // Start monitoring
        await this.startMonitoring();
        
        // Set up event listeners
        this.setupEventListeners();
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
    }
    
    async connectWebSocket() {
        try {
            console.log('🔌 Connecting to QuickNode WebSocket...');
            
            this.ws = new WebSocket(CONFIG.QUICKNODE.WSS);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.updateNetworkStatus(true);
                
                // Subscribe to new blocks
                this.subscribeToBlocks();
                
                // Subscribe to pending transactions for our wallet
                this.subscribeToPendingTx();
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateNetworkStatus(false);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.isConnected = false;
                this.updateNetworkStatus(false);
                
                // Reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
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
        console.log('📡 Subscribed to new blocks');
    }
    
    subscribeToPendingTx() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        const subscription = {
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_subscribe',
            params: ['logs', {
                address: CONFIG.WALLET_ADDRESS
            }]
        };
        
        this.ws.send(JSON.stringify(subscription));
        console.log('📡 Subscribed to wallet events');
    }
    
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Handle new block
            if (data.method === 'eth_subscription' && data.params?.result?.number) {
                const blockNumber = parseInt(data.params.result.number, 16);
                this.currentBlock = blockNumber;
                this.updateBlockNumber(blockNumber);
                
                // Fetch new transactions when new block arrives
                this.fetchRecentTransactions();
            }
            
            // Handle wallet events
            if (data.method === 'eth_subscription' && data.params?.result?.topics) {
                console.log('📨 New wallet event detected');
                this.fetchRecentTransactions();
            }
            
        } catch (error) {
            console.error('❌ Error handling WebSocket message:', error);
        }
    }
    
    async startMonitoring() {
        // Get initial data
        await this.updateBalance();
        await this.fetchRecentTransactions();
        
        // Set up periodic updates
        setInterval(() => this.updateBalance(), CONFIG.INTERVALS.BALANCE_UPDATE);
    }
    
    async updateBalance() {
        try {
            const response = await this.makeRPCCall({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [CONFIG.WALLET_ADDRESS, 'latest'],
                id: 1
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
            console.error('❌ Error updating balance:', error);
        }
    }
    
    async fetchRecentTransactions() {
        try {
            // Check cache first
            const cacheKey = 'recent_tx';
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📦 Using cached transactions');
                this.displayTransactions(cached);
                return;
            }
            
            console.log('🔍 Fetching recent transactions...');
            
            // Use Etherscan V2 API for transaction history
            const url = `${CONFIG.ETHERSCAN.BASE_URL}?chainid=${CONFIG.ETHERSCAN.CHAIN_ID}&module=account&action=txlist&address=${CONFIG.WALLET_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=${CONFIG.PAGINATION.PAGE_SIZE}&sort=desc`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
                this.transactions = data.result;
                this.setCache(cacheKey, data.result);
                this.displayTransactions(data.result);
                
                // Update stats
                this.updateStats();
            } else {
                console.warn('⚠️ No transactions found or API error');
                this.displayNoTransactions();
            }
            
        } catch (error) {
            console.error('❌ Error fetching transactions:', error);
            this.displayError();
        }
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
            const value = (parseInt(tx.value) / 1e18).toFixed(6);
            const date = new Date(tx.timeStamp * 1000).toLocaleString('ru-RU');
            
            return `
                <div class="tx-item" onclick="app.openTxInExplorer('${tx.hash}')">
                    <div class="tx-header">
                        <span class="tx-type ${type}">${typeLabel}</span>
                        <span class="tx-hash">${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}</span>
                    </div>
                    <div class="tx-details">
                        <div class="tx-detail">
                            <span class="tx-detail-label">Сумма</span>
                            <span class="tx-detail-value">${value} ${CONFIG.NETWORK.SYMBOL}</span>
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
                    <button class="btn-control" onclick="app.fetchRecentTransactions()">Повторить</button>
                </div>
            `;
        }
    }
    
    updateStats() {
        const totalTxElement = document.getElementById('totalTx');
        if (totalTxElement) {
            totalTxElement.textContent = this.transactions.length;
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
            console.error('❌ RPC call error:', error);
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
                this.cache.clear();
                this.fetchRecentTransactions();
            });
        }
        
        // Filter button
        const filterBtn = document.getElementById('filterBtn');
        const filterPanel = document.getElementById('filterPanel');
        if (filterBtn && filterPanel) {
            filterBtn.addEventListener('click', () => {
                filterPanel.style.display = filterPanel.style.display === 'none' ? 'flex' : 'none';
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
        
        let filtered = [...this.transactions];
        
        // Filter by type
        if (txType !== 'all') {
            filtered = filtered.filter(tx => {
                const isIncoming = tx.to.toLowerCase() === CONFIG.WALLET_ADDRESS.toLowerCase();
                if (txType === 'in') return isIncoming;
                if (txType === 'out') return !isIncoming;
                if (txType === 'token') return tx.tokenSymbol; // Token transfers
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
        // Could reduce update frequency here
    } else {
        console.log('▶️ Page visible - resuming normal updates');
        if (app) {
            app.fetchRecentTransactions();
        }
    }
});
