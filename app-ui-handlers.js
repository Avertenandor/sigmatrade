// SigmaTrade UI Handlers Module - v10.1.0
// Handles: UI Rendering, Event Listeners, Filters, Virtual Scroll, Clipboard

const SigmaTradeUIHandlers = {
    displayTransactions(app, transactions) {
        // Отображаем транзакции на текущей странице
        const listId = app.currentActivePage === 'mev' ? 'mevTransactionList' : 'transactionList';
        const listElement = document.getElementById(listId);
        if (!listElement) return;

        if (!transactions || transactions.length === 0) {
            this.displayNoTransactions(app);
            return;
        }

        if (app.virtualScroll) {
            app.virtualScroll.destroy();
            app.virtualScroll = null;
        }

        listElement.innerHTML = '';

        const itemHeight = 150;

        app.virtualScroll = new VirtualScroll(
            listElement,
            itemHeight,
            (tx, index) => this.renderTransactionItem(app, tx, index)
        );

        app.virtualScroll.setItems(transactions);

        if (app.hasMore && !app.isLoading) {
            const loader = document.createElement('div');
            loader.className = 'scroll-loader';
            loader.id = 'scrollLoader';
            loader.innerHTML = `<div class="spinner"></div><span>Загрузка...</span>`;
            loader.style.display = 'none';

            app.virtualScroll.attachScrollLoader(loader);
            app.virtualScroll.setScrollEndCallback(() => {
                const wallet = app.getCurrentWallet();
                if (app.hasMore && !app.isLoading && wallet?.address) {
                    app.log('Loading more transactions...', 'info');
                    app.currentPage++;
                    if (window.SigmaTradeData) {
                        window.SigmaTradeData.fetchTransactions(app, app.currentPage);
                    }
                }
            });
        }
    },

    renderTransactionItem(app, tx, index) {
        const div = document.createElement('div');
        div.className = 'tx-item';
        div.onclick = () => app.openTxInExplorer(tx.hash);

        const wallet = app.getCurrentWallet();
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
                    <button class="copy-btn" onclick="window.app.copyToClipboard('${tx.hash}', event)" title="Копировать хеш">
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
    },

    displayNoTransactions(app) {
        const listId = app.currentActivePage === 'mev' ? 'mevTransactionList' : 'transactionList';
        const listElement = document.getElementById(listId);
        if (listElement) {
            listElement.innerHTML = `<div class="loading-state"><p>Транзакции не найдены</p></div>`;
        }
    },

    displayError(app) {
        const listElement = document.getElementById('transactionList');
        if (listElement) {
            listElement.innerHTML = `
                <div class="loading-state">
                    <p>Ошибка загрузки транзакций</p>
                    <button class="btn-control" onclick="window.app.refreshData()">Повторить</button>
                </div>
            `;
        }
    },

    showEndOfList(app) {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;

        const endMessage = document.createElement('div');
        endMessage.className = 'end-of-list';
        endMessage.textContent = 'Все транзакции загружены';
        listElement.appendChild(endMessage);
    },

    setupEventListeners(app) {
        // Exchange page buttons
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                app.log('Manual refresh triggered', 'info');
                app.showLoading();
                app.refreshData();
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
                app.log('MEV Manual refresh triggered', 'info');
                app.showLoading();
                app.refreshData();
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
            txTypeFilter.addEventListener('change', () => this.applyFilters(app));
        }

        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.applyFilters(app));
        }

        // MEV filters
        const mevTxTypeFilter = document.getElementById('mevTxTypeFilter');
        if (mevTxTypeFilter) {
            mevTxTypeFilter.addEventListener('change', () => this.applyFilters(app));
        }

        const mevPeriodFilter = document.getElementById('mevPeriodFilter');
        if (mevPeriodFilter) {
            mevPeriodFilter.addEventListener('change', () => this.applyFilters(app));
        }
    },

    applyFilters(app) {
        // Используем фильтры с текущей страницы
        const isMevPage = app.currentActivePage === 'mev';
        const txType = document.getElementById(isMevPage ? 'mevTxTypeFilter' : 'txTypeFilter')?.value || 'all';
        const period = document.getElementById(isMevPage ? 'mevPeriodFilter' : 'periodFilter')?.value || 'all';

        let filtered = [...app.allTransactions];

        if (txType !== 'all') {
            const wallet = app.getCurrentWallet();
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

        this.displayTransactions(app, filtered);
    },

    setupInfiniteScroll(app) {
        const listElement = document.getElementById('transactionList');
        if (!listElement) return;

        const options = {
            root: listElement,
            rootMargin: `${CONFIG.SCROLL.THRESHOLD}px`,
            threshold: 0.1
        };

        app.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wallet = app.getCurrentWallet();
                if (entry.isIntersecting && app.hasMore && !app.isLoading && wallet?.address) {
                    app.log('Loading more transactions...', 'info');
                    app.currentPage++;
                    if (window.SigmaTradeData) {
                        window.SigmaTradeData.fetchTransactions(app, app.currentPage);
                    }
                }
            });
        }, options);

        setTimeout(() => {
            const loader = document.getElementById('scrollLoader');
            if (loader && app.observer) {
                app.observer.observe(loader);
            }
        }, 1000);
    }
};

// Export to window for global access
if (typeof window !== 'undefined') {
    window.SigmaTradeUIHandlers = SigmaTradeUIHandlers;
}
