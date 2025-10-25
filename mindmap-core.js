/**
 * Mind Map Core Module
 * Handles: Initialization, Data Setup, Animation Loop, Transforms
 */

class MindMapCore {
    constructor() {
        this.svg = null;
        this.contentGroup = null;
        this.nodes = [];
        this.links = [];

        // Transform state
        this.currentScale = 1;
        this.targetScale = 1;
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;

        // Animation state
        this.animationFrame = null;
        this.isAnimating = false;

        // Drag state
        this.isDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // Viewport
        this.viewBoxWidth = 1400;
        this.viewBoxHeight = 900;

        // Throttle state
        this.lastWheelTime = 0;
        this.wheelThrottle = 16; // ~60fps

        // Touch/pinch state for mobile
        this.touches = [];
        this.lastPinchDistance = 0;
        this.isPinching = false;

        this.initialized = false;
    }

    /**
     * Smooth easing functions
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
     * Interpolate between current and target values
     */
    lerp(start, end, alpha) {
        return start + (end - start) * alpha;
    }

    /**
     * Initialize the mind map
     */
    init() {
        if (this.initialized) return;

        this.svg = document.getElementById('mindmapSvg');
        this.contentGroup = document.getElementById('mindmapContent');

        if (!this.svg || !this.contentGroup) {
            console.error('Mind map SVG elements not found');
            return;
        }

        this.setupData();

        // Delegate rendering to render module
        if (window.MindMapRender) {
            window.MindMapRender.render(this);
            window.MindMapRender.setupEventListeners(this);
        }

        this.centerView();
        this.startAnimationLoop();

        this.initialized = true;
    }

    /**
     * Main animation loop for smooth 60fps animations
     */
    startAnimationLoop() {
        const animate = () => {
            // Smooth interpolation towards target
            // Higher alpha = faster/more responsive, Lower alpha = smoother/slower
            const alpha = 0.2; // Optimized for SVG transform

            this.currentScale = this.lerp(this.currentScale, this.targetScale, alpha);
            this.currentX = this.lerp(this.currentX, this.targetX, alpha);
            this.currentY = this.lerp(this.currentY, this.targetY, alpha);

            // Apply SVG transform (not CSS transform - SVG elements need setAttribute)
            this.applyTransform();

            // Continue animation loop
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Apply transform to content group using SVG transform (not CSS)
     */
    applyTransform() {
        // SVG transform uses unitless values, not px
        const transform = `translate(${this.currentX}, ${this.currentY}) scale(${this.currentScale})`;
        this.contentGroup.setAttribute('transform', transform);
    }

    /**
     * Setup mind map data structure
     */
    setupData() {
        // Define all nodes in the mind map
        this.nodes = [
            // Core
            { id: 'core', label: 'SigmaTrade', type: 'core', x: 700, y: 450, icon: 'Σ', description: 'Платформа мониторинга' },

            // Main Pages
            { id: 'exchange', label: 'Бот-обменник', type: 'page', x: 400, y: 250, icon: '🔄', description: 'Exchange Bot Page', action: 'exchange' },
            { id: 'mev', label: 'МЭВ-бот', type: 'page', x: 700, y: 150, icon: '💼', description: 'MEV Bot Page', action: 'mev' },
            { id: 'arbitrage', label: 'Арбитраж', type: 'page', x: 1000, y: 250, icon: '📊', description: 'Arbitrage Bot Page', action: 'arbitrage' },
            { id: 'mindmap', label: 'Карта сайта', type: 'page', x: 1100, y: 450, icon: '🗺️', description: 'Mind Map Page', action: 'mindmap' },

            // Features - Real-time monitoring
            { id: 'websocket', label: 'WebSocket', type: 'feature', x: 500, y: 600, icon: '🔌', description: 'Real-time блок подписка' },
            { id: 'transactions', label: 'Транзакции', type: 'feature', x: 300, y: 450, icon: '📝', description: 'История транзакций' },
            { id: 'balances', label: 'Балансы', type: 'feature', x: 200, y: 600, icon: '💰', description: 'Token балансы' },

            // Features - Filtering & Search
            { id: 'filters', label: 'Фильтры', type: 'feature', x: 150, y: 350, icon: '🔍', description: 'Фильтрация транзакций' },
            { id: 'virtual-scroll', label: 'Virtual Scroll', type: 'feature', x: 300, y: 150, icon: '📜', description: 'Оптимизация прокрутки' },

            // Features - User interactions
            { id: 'copy', label: 'Копирование', type: 'feature', x: 900, y: 600, icon: '📋', description: 'Копировать TX hash' },
            { id: 'explorer', label: 'BSC Explorer', type: 'feature', x: 1100, y: 600, icon: '🔗', description: 'Открыть в explorer' },

            // Data sources
            { id: 'cache', label: 'IndexedDB', type: 'data', x: 700, y: 750, icon: '💾', description: 'Кэширование данных' },
            { id: 'etherscan', label: 'Etherscan API', type: 'data', x: 500, y: 750, icon: '🌐', description: 'Blockchain данные' },
            { id: 'quicknode', label: 'QuickNode RPC', type: 'data', x: 900, y: 750, icon: '⚡', description: 'RPC провайдер' },

            // Statistics
            { id: 'stats', label: 'Статистика', type: 'feature', x: 1200, y: 250, icon: '📊', description: 'Статистика ботов' },

            // Mobile
            { id: 'mobile', label: 'Мобильная версия', type: 'feature', x: 1250, y: 550, icon: '📱', description: 'Адаптивный дизайн' },

            // Network
            { id: 'bsc', label: 'BSC Network', type: 'data', x: 400, y: 50, icon: '⛓️', description: 'Binance Smart Chain' },
        ];

        // Define connections between nodes
        this.links = [
            // Core connections
            { source: 'core', target: 'exchange' },
            { source: 'core', target: 'mev' },
            { source: 'core', target: 'arbitrage' },
            { source: 'core', target: 'mindmap' },

            // Exchange bot features
            { source: 'exchange', target: 'transactions' },
            { source: 'exchange', target: 'balances' },
            { source: 'exchange', target: 'filters' },
            { source: 'exchange', target: 'virtual-scroll' },
            { source: 'exchange', target: 'bsc' },

            // MEV bot features
            { source: 'mev', target: 'websocket' },
            { source: 'mev', target: 'transactions' },
            { source: 'mev', target: 'bsc' },

            // Arbitrage bot features
            { source: 'arbitrage', target: 'websocket' },
            { source: 'arbitrage', target: 'stats' },
            { source: 'arbitrage', target: 'bsc' },

            // Common features
            { source: 'transactions', target: 'copy' },
            { source: 'transactions', target: 'explorer' },
            { source: 'transactions', target: 'virtual-scroll' },

            // Data connections
            { source: 'transactions', target: 'cache' },
            { source: 'balances', target: 'cache' },
            { source: 'websocket', target: 'quicknode' },
            { source: 'transactions', target: 'etherscan' },
            { source: 'balances', target: 'etherscan' },

            // Mobile
            { source: 'mindmap', target: 'mobile' },
        ];
    }

    /**
     * Smooth zoom with target interpolation
     */
    smoothZoom(factor) {
        this.targetScale = Math.max(0.3, Math.min(3, this.targetScale * factor));
    }

    /**
     * Reset view
     */
    reset() {
        this.targetScale = 1;
        this.targetX = 0;
        this.targetY = 0;
    }

    /**
     * Center view on the core node
     */
    centerView() {
        const coreNode = this.nodes.find(n => n.id === 'core');
        if (!coreNode) return;

        const svgRect = this.svg.getBoundingClientRect();
        this.targetX = svgRect.width / 2 - coreNode.x;
        this.targetY = svgRect.height / 2 - coreNode.y;
        this.targetScale = 1;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.initialized = false;
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.MindMapCore = MindMapCore;
}
