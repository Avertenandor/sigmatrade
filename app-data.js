// SigmaTrade Data Module - v12.3.0
// Handles: Data Fetching, Balances, Transactions, Caching, API Calls

const SigmaTradeData = {
    async setCache(app, key, value, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return;

        app.cache.set(key, {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        });

        if (app.cacheReady) {
            try {
                await app.cacheDB.set(key, value, ttl);
                app.log(`💾 Cached to IndexedDB: ${key} (TTL: ${ttl/1000}s)`, 'cache');
            } catch (error) {
                app.log('Failed to cache to IndexedDB', 'error');
            }
        }
    },

    async getFromCache(app, key, ttl = CONFIG.CACHE.TTL) {
        if (!CONFIG.CACHE.ENABLED) return null;

        const cached = app.cache.get(key);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            const cacheTTL = cached.ttl || ttl;

            if (age <= cacheTTL) {
                app.log(`💾 Cache HIT (memory): ${key}`, 'cache');
                return cached.value;
            } else {
                app.cache.delete(key);
            }
        }

        if (app.cacheReady) {
            try {
                const value = await app.cacheDB.get(key, ttl);
                if (value) {
                    app.cache.set(key, {
                        value: value,
                        timestamp: Date.now(),
                        ttl: ttl
                    });
                    app.log(`💾 Cache HIT (IndexedDB): ${key}`, 'cache');
                    return value;
                }
            } catch (error) {
                app.log('Failed to read from IndexedDB', 'error');
            }
        }

        app.log(`💾 Cache MISS: ${key}`, 'cache');
        return null;
    },

    async updateAllBalancesBatched(app) {
        try {
            const cacheKey = 'all_balances';
            const cached = await app.getFromCache(cacheKey, CONFIG.CACHE.BALANCE_TTL);

            if (cached) {
                app.log('Using cached balances', 'cache');
                app.tokenBalances = cached;
                this.displayBalances(app);

                const balanceElement = document.getElementById('balance');
                if (balanceElement && cached.BNB) {
                    balanceElement.textContent = cached.BNB.formatted;
                }
                return;
            }

            app.log('Fetching ALL balances in BATCH...', 'optimize');

            const wallet = app.getCurrentWallet();
            if (!wallet.address) {
                app.log('Current wallet has no address', 'warning');
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
                    formatted: app.formatBalance(bnbBalance, CONFIG.TOKENS.BNB.decimals)
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
                        formatted: app.formatBalance(balance, token.decimals)
                    };
                }
            });

            app.tokenBalances = balances;
            await app.setCache(cacheKey, balances, CONFIG.CACHE.BALANCE_TTL);
            this.displayBalances(app);

            const balanceElement = document.getElementById('balance');
            const mevBalanceElement = document.getElementById('mevBalance');

            if (balanceElement && balances.BNB) {
                balanceElement.textContent = balances.BNB.formatted;
            }
            if (mevBalanceElement && balances.BNB) {
                mevBalanceElement.textContent = balances.BNB.formatted;
            }

            app.log('✅ ALL balances fetched in ONE request!', 'success');

        } catch (error) {
            app.log('Error updating balances', 'error');
        }
    },

    displayBalances(app) {
        // Отображаем балансы на текущей странице
        const gridId = app.currentActivePage === 'mev' ? 'mevBalancesGrid' : 'balancesGrid';
        const gridElement = document.getElementById(gridId);
        if (!gridElement) return;

        const balances = Object.values(app.tokenBalances);
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
    },

    async fetchTotalTransactionCount(app) {
        try {
            const cacheKey = 'total_tx_count';
            const cached = await app.getFromCache(cacheKey, CONFIG.CACHE.TOTAL_TX_TTL);

            if (cached) {
                app.log('Using cached total TX count', 'cache');
                app.totalTxCount = cached;
                this.updateStats(app);
                return;
            }

            app.log('Fetching total transaction count...', 'info');

            const [regularCount, tokenCount] = await Promise.all([
                this.getTransactionCountOptimized(app, 'txlist'),
                this.getTransactionCountOptimized(app, 'tokentx')
            ]);

            app.totalTxCount = regularCount + tokenCount;
            await app.setCache(cacheKey, app.totalTxCount, CONFIG.CACHE.TOTAL_TX_TTL * 10);
            this.updateStats(app);
            app.log(`Total transactions: ${app.totalTxCount}`, 'success');

        } catch (error) {
            app.log('Error fetching total TX count', 'error');
        }
    },

    async getTransactionCountOptimized(app, action) {
        try {
            app.log(`Counting ${action} transactions...`, 'info');

            const wallet = app.getCurrentWallet();
            if (!wallet.address) return 0;

            // HARDCODED API URL TO BYPASS CONFIG CACHE
            let url = `https://api.bscscan.com/api?module=account&action=${action}&address=${wallet.address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc`;

            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }

            const response = await this.rateLimitedFetch(app, url);
            const data = await response.json();

            if (data.status === '1' && data.result && Array.isArray(data.result)) {
                const count = data.result.length;

                if (count === 0) {
                    return 0;
                }

                if (count === 10000) {
                    app.log(`More than 10000 ${action} - using approximation`, 'warning');
                    const lastTx = data.result[data.result.length - 1];
                    const lastBlock = parseInt(lastTx.blockNumber);
                    const currentBlock = app.currentBlock || lastBlock;

                    const blocksPerDay = 28800;
                    const daysPassed = (currentBlock - lastBlock) / blocksPerDay;
                    const txPerDay = 10000 / daysPassed;

                    const totalBlocks = currentBlock - (lastTx.blockNumber || currentBlock - 1000000);
                    const estimatedTotal = Math.floor((totalBlocks / blocksPerDay) * txPerDay);

                    return Math.max(10000, Math.min(estimatedTotal, 50000));
                }

                app.log(`Exact count for ${action}: ${count}`, 'success');
                return count;
            }

        } catch (error) {
            app.log(`Error getting ${action} count: ${error.message}`, 'error');
        }
        return 0;
    },

    async fetchTransactions(app, page = 1, reset = false) {
        if (app.isLoading) return;
        if (!app.hasMore && !reset) return;

        app.isLoading = true;

        if (reset) {
            app.currentPage = 1;
            app.hasMore = true;
            app.allTransactions = [];
        }

        try {
            const cacheKey = `transactions_page_${page}`;
            const cached = await app.getFromCache(cacheKey, CONFIG.CACHE.TX_TTL);

            if (cached && !reset) {
                app.log(`Using cached transactions page ${page}`, 'cache');

                if (reset) {
                    app.allTransactions = cached;
                } else {
                    app.allTransactions = [...app.allTransactions, ...cached];
                }

                if (window.SigmaTradeUIHandlers) {
                    window.SigmaTradeUIHandlers.displayTransactions(app, app.allTransactions);
                }

                if (cached.length < CONFIG.PAGINATION.PAGE_SIZE) {
                    app.hasMore = false;
                    if (window.SigmaTradeUIHandlers) {
                        window.SigmaTradeUIHandlers.showEndOfList(app);
                    }
                }

                app.isLoading = false;
                return;
            }

            // Parallel fetch: Regular via BscScan, Token via Node (Recent) + BscScan (History)
            const [regular, token, nodeToken] = await Promise.all([
                this.fetchRegularTransactions(app, page),
                this.fetchTokenTransactions(app, page),
                page === 1 ? this.fetchTokenTransactionsNode(app) : Promise.resolve([])
            ]);

            // Merge Node results with API results, deduplicating by hash
            const allTokenTx = [...nodeToken, ...token];
            const uniqueTokenTx = Array.from(new Map(allTokenTx.map(item => [item.hash, item])).values());

            const newTransactions = [
                ...regular.map(tx => ({...tx, txType: 'regular'})),
                ...uniqueTokenTx.map(tx => ({...tx, txType: 'token'}))
            ];

            newTransactions.sort((a, b) => b.timeStamp - a.timeStamp);
            await app.setCache(cacheKey, newTransactions, CONFIG.CACHE.TX_TTL);

            if (reset) {
                app.allTransactions = newTransactions;
            } else {
                app.allTransactions = [...app.allTransactions, ...newTransactions];
            }

            if (newTransactions.length < CONFIG.PAGINATION.PAGE_SIZE) {
                app.hasMore = false;
            }

            if (window.SigmaTradeUIHandlers) {
                window.SigmaTradeUIHandlers.displayTransactions(app, app.allTransactions);

                if (!app.hasMore) {
                    window.SigmaTradeUIHandlers.showEndOfList(app);
                }
            }

        } catch (error) {
            app.log('Error fetching transactions', 'error');
            if (window.SigmaTradeUIHandlers) {
                window.SigmaTradeUIHandlers.displayError(app);
            }
        } finally {
            app.isLoading = false;
        }
    },

    async fetchRegularTransactions(app, page = 1) {
        try {
            const wallet = app.getCurrentWallet();
            if (!wallet.address) return [];

            const offset = CONFIG.PAGINATION.PAGE_SIZE;

            // HARDCODED API URL TO BYPASS CONFIG CACHE
            let url = `https://api.bscscan.com/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;

            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }

            const response = await this.rateLimitedFetch(app, url);
            const data = await response.json();

            if (data.status === '1' && data.result) {
                return data.result;
            } else if (data.message === 'NOTOK') {
                app.log(`API Error: ${data.result}`, 'warning');
            }

        } catch (error) {
            app.log('Error fetching regular transactions', 'error');
        }
        return [];
    },

    async fetchTokenTransactions(app, page = 1) {
        try {
            const wallet = app.getCurrentWallet();
            if (!wallet.address) return [];

            const offset = CONFIG.PAGINATION.PAGE_SIZE;

            // HARDCODED API URL TO BYPASS CONFIG CACHE
            let url = `https://api.bscscan.com/api?module=account&action=tokentx&address=${wallet.address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`;

            if (CONFIG.ETHERSCAN.API_KEY) {
                url += `&apikey=${CONFIG.ETHERSCAN.API_KEY}`;
            }

            const response = await this.rateLimitedFetch(app, url);
            const data = await response.json();

            if (data.status === '1' && data.result) {
                return data.result;
            }

        } catch (error) {
            app.log('Error fetching token transactions', 'error');
        }
        return [];
    },

    // 🆕 HYBRID NODE FETCHING (Recent Token Transfers)
    async fetchTokenTransactionsNode(app) {
        try {
            const wallet = app.getCurrentWallet();
            if (!wallet.address) return [];

            app.log('Fetching recent token transfers via NODE...', 'optimize');

            // Topic0 for Transfer event: keccak256("Transfer(address,address,uint256)")
            const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            const addressTopic = '0x000000000000000000000000' + wallet.address.slice(2).toLowerCase();

            // Look back ~2 hours (2400 blocks @ 3s/block)
            // QuickNode free tier has stricter limits on block range
            const blockRange = 2400;
            const latestBlock = await this.getLatestBlockNumber();
            const fromBlock = Math.max(0, latestBlock - blockRange);

            const batchRequests = [];
            const tokensOfInterest = [CONFIG.TOKENS.USDT.address, CONFIG.TOKENS.BUSD.address, CONFIG.TOKENS.CAKE.address];

            // Construct batch request for logs
            // We need two requests: Incoming (Topic2) and Outgoing (Topic1)
            
            // 1. Incoming Transfers (to: wallet)
            batchRequests.push({
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [{
                    fromBlock: '0x' + fromBlock.toString(16),
                    toBlock: 'latest',
                    address: tokensOfInterest,
                    topics: [transferTopic, null, addressTopic]
                }],
                id: 1
            });

            // 2. Outgoing Transfers (from: wallet)
            batchRequests.push({
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [{
                    fromBlock: '0x' + fromBlock.toString(16),
                    toBlock: 'latest',
                    address: tokensOfInterest,
                    topics: [transferTopic, addressTopic]
                }],
                id: 2
            });

            const response = await fetch(CONFIG.QUICKNODE.HTTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchRequests)
            });

            const results = await response.json();
            const logs = [];

            if (results && Array.isArray(results)) {
                results.forEach(res => {
                    if (res.result && Array.isArray(res.result)) {
                        logs.push(...res.result);
                    }
                });
            }

            // Process logs into transaction format compatible with UI
            const transactions = await Promise.all(logs.map(async log => {
                const tokenSymbol = this.getTokenSymbolByAddress(log.address);
                const decimals = this.getTokenDecimalsByAddress(log.address);
                const value = BigInt(log.data).toString();
                
                // We need timestamp, but eth_getLogs doesn't return it.
                // We'll use current time for very recent, or estimate based on block number
                // Ideally we'd fetch block details, but that's expensive.
                // For now, we use an estimation: (currentBlock - logBlock) * 3s ago
                const ageSeconds = (latestBlock - parseInt(log.blockNumber, 16)) * 3;
                const timeStamp = Math.floor(Date.now() / 1000) - ageSeconds;

                return {
                    blockNumber: parseInt(log.blockNumber, 16).toString(),
                    timeStamp: timeStamp.toString(),
                    hash: log.transactionHash,
                    from: '0x' + log.topics[1].slice(26),
                    to: '0x' + log.topics[2].slice(26),
                    value: value,
                    tokenName: tokenSymbol, // Simplified
                    tokenSymbol: tokenSymbol,
                    tokenDecimal: decimals.toString(),
                    gasUsed: "0", // Not available in log
                    confirmations: (latestBlock - parseInt(log.blockNumber, 16)).toString()
                };
            }));

            app.log(`✅ Found ${transactions.length} recent token transfers via Node`, 'success');
            return transactions;

        } catch (error) {
            app.log(`Error fetching from Node: ${error.message}`, 'error');
            return [];
        }
    },

    async getLatestBlockNumber() {
        try {
            const response = await fetch(CONFIG.QUICKNODE.HTTP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                })
            });
            const data = await response.json();
            return parseInt(data.result, 16);
        } catch (e) {
            return 0;
        }
    },

    getTokenSymbolByAddress(address) {
        for (const key in CONFIG.TOKENS) {
            if (CONFIG.TOKENS[key].address && CONFIG.TOKENS[key].address.toLowerCase() === address.toLowerCase()) {
                return CONFIG.TOKENS[key].symbol;
            }
        }
        return 'Unknown';
    },

    getTokenDecimalsByAddress(address) {
        for (const key in CONFIG.TOKENS) {
            if (CONFIG.TOKENS[key].address && CONFIG.TOKENS[key].address.toLowerCase() === address.toLowerCase()) {
                return CONFIG.TOKENS[key].decimals;
            }
        }
        return 18;
    },

    async rateLimitedFetch(app, url) {
        const now = Date.now();
        const timeSinceLastCall = now - app.lastApiCall;

        if (timeSinceLastCall < app.apiCallDelay) {
            const waitTime = app.apiCallDelay - timeSinceLastCall;
            app.log(`Rate limiting: waiting ${waitTime}ms`, 'optimize');
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        app.lastApiCall = Date.now();
        // Add cache: no-store to prevent browser caching of API responses
        return fetch(url, { cache: "no-store" });
    },

    updateStats(app) {
        // Обновляем статистику на всех страницах
        const totalTxElement = document.getElementById('totalTx');
        const mevTotalTxElement = document.getElementById('mevTotalTx');

        if (totalTxElement) {
            totalTxElement.textContent = app.totalTxCount.toLocaleString('ru-RU');
        }
        if (mevTotalTxElement) {
            mevTotalTxElement.textContent = app.totalTxCount.toLocaleString('ru-RU');
        }

        const apiStatusElement = document.getElementById('apiStatus');
        const mevApiStatusElement = document.getElementById('mevApiStatus');

        const statusText = app.isConnected ? 'Online' : 'Offline';
        if (apiStatusElement) {
            apiStatusElement.textContent = statusText;
        }
        if (mevApiStatusElement) {
            mevApiStatusElement.textContent = statusText;
        }
    }
};

// Export to window for global access
if (typeof window !== 'undefined') {
    window.SigmaTradeData = SigmaTradeData;
}
