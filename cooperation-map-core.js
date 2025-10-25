/**
 * Cooperation Map Core Module
 * Handles: Initialization, Data Setup, Animation Loop, Transforms
 */

class CooperationMapCore {
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
     * Initialize the cooperation map
     */
    init() {
        if (this.initialized) return;

        this.svg = document.getElementById('cooperationSvg');
        this.contentGroup = document.getElementById('cooperationContent');

        if (!this.svg || !this.contentGroup) {
            console.error('Cooperation map SVG elements not found');
            return;
        }

        // Update mobile detection
        this.isMobile = window.innerWidth < 768;

        this.setupData();

        // Delegate rendering to render module
        if (window.CooperationMapRender) {
            window.CooperationMapRender.render(this);
            window.CooperationMapRender.setupEventListeners(this);
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
     * Setup cooperation process data structure
     */
    setupData() {
        const centerX = 700;
        const centerY = 450;
        const stepX = 220; // horizontal spacing

        // Main flow nodes
        this.nodes = [
            {
                id: 'start',
                label: 'Вы',
                type: 'process',
                x: centerX - stepX * 2.5,
                y: centerY,
                icon: '👤',
                description: 'Потенциальный участник',
                detail: 'Готовы начать сотрудничество?'
            },
            {
                id: 'email',
                label: 'Заявка',
                type: 'process',
                x: centerX - stepX * 1.5,
                y: centerY,
                icon: '📧',
                description: 'Отправка email на trdgood00@gmail.com',
                detail: 'Расскажите о себе и целях'
            },
            {
                id: 'response',
                label: 'Ответ',
                type: 'process',
                x: centerX - stepX * 0.5,
                y: centerY,
                icon: '📬',
                description: 'Получение ответа',
                detail: 'Ответим в течение 24-48 часов'
            },
            {
                id: 'interview',
                label: 'Собеседование',
                type: 'process',
                x: centerX + stepX * 0.5,
                y: centerY,
                icon: '🎥',
                description: 'Видео собеседование',
                detail: 'Обсуждение условий и оценка'
            },
            {
                id: 'decision',
                label: 'Решение',
                type: 'process',
                x: centerX + stepX * 1.5,
                y: centerY,
                icon: '⚖️',
                description: 'Принятие решения',
                detail: 'Оценка результатов собеседования'
            },
            // Success path
            {
                id: 'success',
                label: 'Одобрено',
                type: 'success',
                x: centerX + stepX * 2.5,
                y: centerY - 150,
                icon: '✅',
                description: 'Успешное прохождение',
                detail: 'Добро пожаловать в команду!'
            },
            {
                id: 'access',
                label: 'Доступ к системам',
                type: 'success',
                x: centerX + stepX * 3.5,
                y: centerY - 220,
                icon: '🤖',
                description: 'MEV, Арбитраж, Торговля',
                detail: 'Полный доступ к торговым ботам'
            },
            {
                id: 'team',
                label: 'Место в команде',
                type: 'success',
                x: centerX + stepX * 3.5,
                y: centerY - 150,
                icon: '👥',
                description: 'Определение в команду',
                detail: 'Поддержка и обучение'
            },
            {
                id: 'own-team',
                label: 'Своя команда',
                type: 'success',
                x: centerX + stepX * 3.5,
                y: centerY - 80,
                icon: '🏆',
                description: 'Право создать команду',
                detail: 'Партнерская программа 3→2→5%'
            },
            // Failure path
            {
                id: 'reject',
                label: 'Отказ',
                type: 'fail',
                x: centerX + stepX * 2.5,
                y: centerY + 150,
                icon: '❌',
                description: 'Не одобрено',
                detail: 'К сожалению, не подошли'
            },
            // Recommendation bonus path
            {
                id: 'recommendation',
                label: 'Рекомендации',
                type: 'bonus',
                x: centerX + stepX * 0.5,
                y: centerY - 180,
                icon: '⭐',
                description: 'От действующих участников',
                detail: 'Повышают шансы и улучшают условия'
            }
        ];

        // Define connections (links)
        this.links = [
            { source: 'start', target: 'email', type: 'process' },
            { source: 'email', target: 'response', type: 'process' },
            { source: 'response', target: 'interview', type: 'process' },
            { source: 'interview', target: 'decision', type: 'process' },
            { source: 'decision', target: 'success', type: 'success' },
            { source: 'decision', target: 'reject', type: 'fail' },
            { source: 'success', target: 'access', type: 'success' },
            { source: 'success', target: 'team', type: 'success' },
            { source: 'success', target: 'own-team', type: 'success' },
            { source: 'recommendation', target: 'interview', type: 'bonus' },
            { source: 'recommendation', target: 'decision', type: 'bonus' }
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
        this.targetScale = this.isMobile ? 0.5 : 0.8;
        this.targetX = 0;
        this.targetY = 0;
    }

    /**
     * Center view
     */
    centerView() {
        const svgRect = this.svg.getBoundingClientRect();
        const centerNode = this.nodes.find(n => n.id === 'interview');

        if (centerNode) {
            this.targetX = svgRect.width / 2 - centerNode.x;
            this.targetY = svgRect.height / 2 - centerNode.y;
        } else {
            this.targetX = svgRect.width / 2 - 700;
            this.targetY = svgRect.height / 2 - 450;
        }

        this.targetScale = this.isMobile ? 0.5 : 0.8;
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
    window.CooperationMapCore = CooperationMapCore;
}
