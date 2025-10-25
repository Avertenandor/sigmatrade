/**
 * Exchange Bot Map Core Module
 * Handles: Initialization, Data Setup, Animation Loop, Transforms
 */

class ExchangeBotMapCore {
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
        this.viewBoxWidth = 1600;
        this.viewBoxHeight = 1000;

        // Throttle state
        this.lastWheelTime = 0;
        this.wheelThrottle = 16; // ~60fps

        // Mobile detection
        this.isMobile = window.innerWidth < 768;

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

    /**
     * Interpolate between current and target values
     */
    lerp(start, end, alpha) {
        return start + (end - start) * alpha;
    }

    /**
     * Initialize the exchange bot map
     */
    init() {
        if (this.initialized) return;

        this.svg = document.getElementById('exchangeBotSvg');
        this.contentGroup = document.getElementById('exchangeBotContent');

        if (!this.svg || !this.contentGroup) {
            console.error('Exchange bot map SVG elements not found');
            return;
        }

        // Update mobile detection
        this.isMobile = window.innerWidth < 768;

        this.setupData();

        // Delegate rendering to render module
        if (window.ExchangeBotMapRender) {
            window.ExchangeBotMapRender.render(this);
            window.ExchangeBotMapRender.setupEventListeners(this);
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
            const alpha = 0.2;

            this.currentScale = this.lerp(this.currentScale, this.targetScale, alpha);
            this.currentX = this.lerp(this.currentX, this.targetX, alpha);
            this.currentY = this.lerp(this.currentY, this.targetY, alpha);

            // Apply SVG transform
            this.applyTransform();

            // Continue animation loop
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Apply transform to content group
     */
    applyTransform() {
        const transform = `translate(${this.currentX}, ${this.currentY}) scale(${this.currentScale})`;
        this.contentGroup.setAttribute('transform', transform);
    }

    /**
     * Setup exchange bot data structure
     */
    setupData() {
        const centerX = 800;
        const centerY = 500;
        const stepX = 280; // horizontal spacing
        const stepY = 180; // vertical spacing

        // Main flow nodes
        this.nodes = [
            // Central node - The Bot
            {
                id: 'bot',
                label: 'Бот-обменник',
                type: 'core',
                x: centerX,
                y: centerY,
                icon: '🤖',
                description: 'Автоматический обмен криптовалют',
                detail: '24/7 работа на BSC'
            },

            // Exchange Process Flow (Top)
            {
                id: 'user-request',
                label: 'Запрос обмена',
                type: 'process',
                x: centerX - stepX * 1.5,
                y: centerY - stepY,
                icon: '👤',
                description: 'Пользователь запрашивает обмен',
                detail: 'Например: BNB → USDT'
            },
            {
                id: 'rate-calc',
                label: 'Расчет курса',
                type: 'process',
                x: centerX - stepX * 0.5,
                y: centerY - stepY,
                icon: '💱',
                description: 'Определение оптимального курса',
                detail: 'Анализ рынка в реальном времени'
            },
            {
                id: 'execute',
                label: 'Выполнение',
                type: 'process',
                x: centerX + stepX * 0.5,
                y: centerY - stepY,
                icon: '⚡',
                description: 'Исполнение обмена',
                detail: 'Быстрая транзакция на блокчейне'
            },
            {
                id: 'complete',
                label: 'Завершено',
                type: 'success',
                x: centerX + stepX * 1.5,
                y: centerY - stepY,
                icon: '✅',
                description: 'Обмен успешно завершен',
                detail: 'Пользователь получает криптовалюту'
            },

            // Commission Flow (Right side)
            {
                id: 'commission',
                label: 'Комиссия',
                type: 'money',
                x: centerX + stepX,
                y: centerY,
                icon: '💰',
                description: 'Удержание комиссии',
                detail: 'От 0.1% до 0.8% от суммы обмена'
            },
            {
                id: 'commission-range',
                label: '0.1% - 0.8%',
                type: 'info',
                x: centerX + stepX * 1.7,
                y: centerY - stepY * 0.5,
                icon: '📊',
                description: 'Плавающая комиссия',
                detail: 'Зависит от объема и условий'
            },

            // Distribution (Bottom Right)
            {
                id: 'distribute',
                label: 'Распределение',
                type: 'process',
                x: centerX + stepX,
                y: centerY + stepY,
                icon: '🎯',
                description: 'Распределение комиссии',
                detail: 'Между участниками оборота'
            },

            // Participants (Bottom)
            {
                id: 'participant-1',
                label: 'Участник 1',
                type: 'participant',
                x: centerX - stepX * 0.8,
                y: centerY + stepY * 1.5,
                icon: '👤',
                description: 'Средства в обороте',
                detail: 'Получает % от комиссии'
            },
            {
                id: 'participant-2',
                label: 'Участник 2',
                type: 'participant',
                x: centerX,
                y: centerY + stepY * 1.5,
                icon: '👤',
                description: 'Средства в обороте',
                detail: 'Получает % от комиссии'
            },
            {
                id: 'participant-3',
                label: 'Участник 3',
                type: 'participant',
                x: centerX + stepX * 0.8,
                y: centerY + stepY * 1.5,
                icon: '👤',
                description: 'Средства в обороте',
                detail: 'Получает % от комиссии'
            },
            {
                id: 'more-participants',
                label: 'И другие...',
                type: 'participant',
                x: centerX + stepX * 1.6,
                y: centerY + stepY * 1.5,
                icon: '👥',
                description: 'Все участники оборота',
                detail: 'Доход пропорционален вложениям'
            },

            // Capital Pool (Left Bottom)
            {
                id: 'capital-pool',
                label: 'Оборотные средства',
                type: 'pool',
                x: centerX - stepX,
                y: centerY + stepY * 0.5,
                icon: '💎',
                description: 'Средства участников в работе',
                detail: 'Обеспечивают ликвидность'
            },

            // WARNING - Unauthorized Deposit (Left side - RED)
            {
                id: 'warning',
                label: '⚠️ ВАЖНО!',
                type: 'warning',
                x: centerX - stepX * 1.5,
                y: centerY,
                icon: '🚨',
                description: 'ВНИМАНИЕ!',
                detail: 'Прочитайте перед действиями'
            },
            {
                id: 'no-interview-deposit',
                label: 'Депозит без собеседования',
                type: 'danger',
                x: centerX - stepX * 1.5,
                y: centerY + stepY,
                icon: '❌',
                description: 'Попытка внести средства напрямую',
                detail: 'БЕЗ предварительного собеседования'
            },
            {
                id: 'money-lost',
                label: 'ПОТЕРЯ СРЕДСТВ',
                type: 'danger',
                x: centerX - stepX * 1.5,
                y: centerY + stepY * 1.8,
                icon: '💸',
                description: '❌ Средства НЕ ВОЗВРАЩАЮТСЯ',
                detail: 'Деньги внесенные таким образом теряются навсегда'
            },

            // Proper Way (Top Left - GREEN)
            {
                id: 'proper-way',
                label: '✅ Правильный путь',
                type: 'success',
                x: centerX - stepX * 1.5,
                y: centerY - stepY * 1.5,
                icon: '🎯',
                description: 'Как правильно начать',
                detail: 'Следуйте этому процессу'
            },
            {
                id: 'interview-first',
                label: 'Собеседование',
                type: 'success',
                x: centerX - stepX * 0.8,
                y: centerY - stepY * 1.5,
                icon: '🎥',
                description: 'Сначала пройдите собеседование',
                detail: 'Свяжитесь с trdgood00@gmail.com'
            }
        ];

        // Define connections (links)
        this.links = [
            // Main exchange flow
            { source: 'user-request', target: 'rate-calc', type: 'process' },
            { source: 'rate-calc', target: 'bot', type: 'process' },
            { source: 'bot', target: 'execute', type: 'process' },
            { source: 'execute', target: 'complete', type: 'process' },

            // Commission flow
            { source: 'bot', target: 'commission', type: 'money' },
            { source: 'commission', target: 'commission-range', type: 'info' },
            { source: 'commission', target: 'distribute', type: 'money' },

            // Distribution to participants
            { source: 'distribute', target: 'participant-1', type: 'money' },
            { source: 'distribute', target: 'participant-2', type: 'money' },
            { source: 'distribute', target: 'participant-3', type: 'money' },
            { source: 'distribute', target: 'more-participants', type: 'money' },

            // Capital pool
            { source: 'capital-pool', target: 'bot', type: 'pool' },
            { source: 'participant-1', target: 'capital-pool', type: 'pool' },
            { source: 'participant-2', target: 'capital-pool', type: 'pool' },
            { source: 'participant-3', target: 'capital-pool', type: 'pool' },

            // Warning path
            { source: 'warning', target: 'no-interview-deposit', type: 'danger' },
            { source: 'no-interview-deposit', target: 'money-lost', type: 'danger' },

            // Proper way
            { source: 'proper-way', target: 'interview-first', type: 'success' },
            { source: 'interview-first', target: 'capital-pool', type: 'success' }
        ];
    }

    /**
     * Smooth zoom
     */
    smoothZoom(factor) {
        this.targetScale = Math.max(0.3, Math.min(3, this.targetScale * factor));
    }

    /**
     * Reset view
     */
    reset() {
        this.targetScale = this.isMobile ? 0.4 : 0.7;
        this.targetX = 0;
        this.targetY = 0;
    }

    /**
     * Center view
     */
    centerView() {
        const svgRect = this.svg.getBoundingClientRect();
        const centerNode = this.nodes.find(n => n.id === 'bot');

        if (centerNode) {
            this.targetX = svgRect.width / 2 - centerNode.x;
            this.targetY = svgRect.height / 2 - centerNode.y;
        } else {
            this.targetX = svgRect.width / 2 - 800;
            this.targetY = svgRect.height / 2 - 500;
        }

        this.targetScale = this.isMobile ? 0.4 : 0.7;
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
    window.ExchangeBotMapCore = ExchangeBotMapCore;
}
