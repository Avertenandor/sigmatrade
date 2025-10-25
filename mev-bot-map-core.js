/**
 * MEV Bot Map Core Module
 * Handles: Initialization, Data Setup, Animation Loop, Transforms
 */

class MevBotMapCore {
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
     * Initialize the MEV bot map
     */
    init() {
        if (this.initialized) return;

        this.svg = document.getElementById('mevBotSvg');
        this.contentGroup = document.getElementById('mevBotContent');

        if (!this.svg || !this.contentGroup) {
            console.error('MEV bot map SVG elements not found');
            return;
        }

        // Update mobile detection
        this.isMobile = window.innerWidth < 768;

        this.setupData();

        // Delegate rendering to render module
        if (window.MevBotMapRender) {
            window.MevBotMapRender.render(this);
            window.MevBotMapRender.setupEventListeners(this);
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

            // Apply transform
            this.applyTransform();

            // Continue loop
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Apply current transform to content group
     */
    applyTransform() {
        if (this.contentGroup) {
            this.contentGroup.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.currentScale})`;
        }
    }

    /**
     * Setup MEV bot data (nodes and links)
     */
    setupData() {
        const centerX = this.viewBoxWidth / 2;
        const centerY = this.viewBoxHeight / 2;
        const stepX = 250;
        const stepY = 180;

        // Define nodes for MEV sandwich attack visualization
        this.nodes = [
            // Core - MEV Bot (Center)
            {
                id: 'mev-bot',
                label: 'МЭВ-бот',
                type: 'core',
                x: centerX,
                y: centerY,
                icon: '🤖',
                description: 'MEV Bot - Sandwich Attack',
                detail: 'Извлечение максимальной ценности'
            },

            // Stage 1: Mempool Monitoring (Top)
            {
                id: 'mempool-monitor',
                label: 'Мониторинг Мемпула',
                type: 'process',
                x: centerX,
                y: centerY - stepY * 1.5,
                icon: '👁️',
                description: 'Сканирование pending транзакций',
                detail: 'Real-time мониторинг BSC mempool'
            },

            // Stage 2: Target Detection (Top Right)
            {
                id: 'target-detection',
                label: 'Обнаружение цели',
                type: 'process',
                x: centerX + stepX * 1.2,
                y: centerY - stepY,
                icon: '🎯',
                description: 'Поиск крупной сделки',
                detail: 'Анализ объема и impact на цену'
            },

            // Stage 3: Front-running Transaction (Right Top)
            {
                id: 'front-run',
                label: 'Front-run TX',
                type: 'attack',
                x: centerX + stepX * 1.5,
                y: centerY - stepY * 0.3,
                icon: '⚡',
                description: 'Покупка перед жертвой',
                detail: 'Более высокий gas price'
            },

            // Stage 4: Victim Transaction (Center Right)
            {
                id: 'victim-tx',
                label: 'Транзакция жертвы',
                type: 'victim',
                x: centerX + stepX * 1.5,
                y: centerY + stepY * 0.3,
                icon: '👤',
                description: 'Крупная покупка/продажа',
                detail: 'Двигает цену вверх'
            },

            // Stage 5: Back-running Transaction (Right Bottom)
            {
                id: 'back-run',
                label: 'Back-run TX',
                type: 'attack',
                x: centerX + stepX * 1.5,
                y: centerY + stepY,
                icon: '💨',
                description: 'Продажа после жертвы',
                detail: 'Захват profit от price impact'
            },

            // Profit Extraction (Bottom Right)
            {
                id: 'profit',
                label: 'Прибыль',
                type: 'money',
                x: centerX + stepX * 0.8,
                y: centerY + stepY * 1.5,
                icon: '💰',
                description: 'Profit от разницы цен',
                detail: 'Buy low (front) → Sell high (back)'
            },

            // Profit Range Info
            {
                id: 'profit-range',
                label: '0.5% - 3%',
                type: 'info',
                x: centerX + stepX * 1.7,
                y: centerY + stepY * 1.5,
                icon: '📊',
                description: 'Типичная прибыль с сделки',
                detail: 'Зависит от волатильности'
            },

            // Distribution (Bottom)
            {
                id: 'distribute',
                label: 'Распределение',
                type: 'process',
                x: centerX,
                y: centerY + stepY * 1.5,
                icon: '🎯',
                description: 'Распределение прибыли',
                detail: 'Между участниками системы'
            },

            // Participants (Bottom Left)
            {
                id: 'participant-1',
                label: 'Участник 1',
                type: 'participant',
                x: centerX - stepX * 0.8,
                y: centerY + stepY * 1.8,
                icon: '👤',
                description: 'Капитал в работе',
                detail: 'Получает % от MEV прибыли'
            },
            {
                id: 'participant-2',
                label: 'Участник 2',
                type: 'participant',
                x: centerX - stepX * 0.2,
                y: centerY + stepY * 1.8,
                icon: '👤',
                description: 'Капитал в работе',
                detail: 'Получает % от MEV прибыли'
            },
            {
                id: 'more-participants',
                label: 'И другие...',
                type: 'participant',
                x: centerX + stepX * 0.4,
                y: centerY + stepY * 1.8,
                icon: '👥',
                description: 'Все участники MEV системы',
                detail: 'Доход пропорционален вложениям'
            },

            // Gas Optimization (Left Top)
            {
                id: 'gas-optimize',
                label: 'Оптимизация Gas',
                type: 'process',
                x: centerX - stepX * 1.2,
                y: centerY - stepY,
                icon: '⛽',
                description: 'Динамический gas price',
                detail: 'Выше жертвы для front-run'
            },

            // Speed Advantage (Left)
            {
                id: 'speed',
                label: 'Преимущество скорости',
                type: 'success',
                x: centerX - stepX * 1.5,
                y: centerY - stepY * 0.2,
                icon: '🚀',
                description: 'Быстрее жертвы',
                detail: 'Direct node connection + priority'
            },

            // Capital Pool (Left Bottom)
            {
                id: 'capital-pool',
                label: 'Капитал MEV',
                type: 'pool',
                x: centerX - stepX * 1.2,
                y: centerY + stepY * 0.8,
                icon: '💎',
                description: 'Оборотные средства для атак',
                detail: 'Ликвидность для sandwich операций'
            },

            // Price Impact Analysis (Top Left)
            {
                id: 'price-impact',
                label: 'Анализ Price Impact',
                type: 'info',
                x: centerX - stepX * 0.8,
                y: centerY - stepY * 1.5,
                icon: '📈',
                description: 'Расчет влияния на цену',
                detail: 'Определение профитности атаки'
            },

            // Sandwich Attack Label
            {
                id: 'sandwich-label',
                label: '🥪 SANDWICH ATTACK',
                type: 'warning',
                x: centerX + stepX * 0.5,
                y: centerY - stepY * 1.8,
                icon: '🥪',
                description: 'Единственная стратегия бота',
                detail: 'Front-run + Back-run = Sandwich'
            }
        ];

        // Define connections (links)
        this.links = [
            // Main MEV sandwich flow
            { source: 'mempool-monitor', target: 'mev-bot', type: 'process' },
            { source: 'mev-bot', target: 'target-detection', type: 'process' },
            { source: 'target-detection', target: 'front-run', type: 'attack' },
            { source: 'front-run', target: 'victim-tx', type: 'sandwich' },
            { source: 'victim-tx', target: 'back-run', type: 'sandwich' },
            { source: 'back-run', target: 'profit', type: 'money' },

            // Profit flow
            { source: 'profit', target: 'profit-range', type: 'info' },
            { source: 'profit', target: 'distribute', type: 'money' },

            // Distribution to participants
            { source: 'distribute', target: 'participant-1', type: 'money' },
            { source: 'distribute', target: 'participant-2', type: 'money' },
            { source: 'distribute', target: 'more-participants', type: 'money' },

            // Gas optimization
            { source: 'gas-optimize', target: 'mev-bot', type: 'process' },
            { source: 'gas-optimize', target: 'front-run', type: 'attack' },

            // Speed advantage
            { source: 'speed', target: 'mev-bot', type: 'success' },

            // Capital pool
            { source: 'capital-pool', target: 'mev-bot', type: 'pool' },
            { source: 'participant-1', target: 'capital-pool', type: 'pool' },
            { source: 'participant-2', target: 'capital-pool', type: 'pool' },

            // Price impact analysis
            { source: 'price-impact', target: 'mempool-monitor', type: 'info' },
            { source: 'price-impact', target: 'target-detection', type: 'info' },

            // Sandwich attack label
            { source: 'sandwich-label', target: 'target-detection', type: 'warning' }
        ];
    }

    /**
     * Zoom in/out
     */
    zoom(factor) {
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
     * Center view
     */
    centerView() {
        const rect = this.svg.getBoundingClientRect();
        this.targetX = (rect.width - this.viewBoxWidth * this.targetScale) / 2;
        this.targetY = (rect.height - this.viewBoxHeight * this.targetScale) / 2;
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
    window.MevBotMapCore = MevBotMapCore;
}
