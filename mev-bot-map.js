/**
 * Interactive MEV Bot Map for SigmaTrade
 * Visualizes how the MEV bot works using sandwich attacks
 * Shows: Mempool Monitoring → Target Detection → Front-run → Victim TX → Back-run → Profit
 * MEV = Maximal Extractable Value through sandwich attack strategy
 */

class MevBotMap {
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
        this.render();
        this.setupEventListeners();
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
     * Render the MEV bot map
     */
    render() {
        // Clear existing content
        this.contentGroup.innerHTML = '';

        // Render links first (so they appear behind nodes)
        this.links.forEach(link => this.renderLink(link));

        // Render nodes
        this.nodes.forEach(node => this.renderNode(node));
    }

    /**
     * Render a link between nodes
     */
    renderLink(link) {
        const sourceNode = this.nodes.find(n => n.id === link.source);
        const targetNode = this.nodes.find(n => n.id === link.target);

        if (!sourceNode || !targetNode) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', `partner-link link-${link.type}`);
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('data-source', link.source);
        line.setAttribute('data-target', link.target);

        // Set appropriate marker and color based on link type
        const linkStyles = {
            process: { marker: 'url(#mev-arrow-process)', color: '#00d4ff', width: '2' },
            attack: { marker: 'url(#mev-arrow-attack)', color: '#ff6600', width: '3' },
            sandwich: { marker: 'url(#mev-arrow-sandwich)', color: '#ff00ff', width: '3' },
            money: { marker: 'url(#mev-arrow-money)', color: '#ffd700', width: '2.5' },
            success: { marker: 'url(#mev-arrow-success)', color: '#00ff88', width: '2' },
            pool: { marker: 'url(#mev-arrow-pool)', color: '#00ccff', width: '2' },
            info: { marker: 'url(#mev-arrow-info)', color: '#888888', width: '1.5' },
            warning: { marker: 'url(#mev-arrow-warning)', color: '#ffaa00', width: '2' }
        };

        const style = linkStyles[link.type] || linkStyles.process;
        line.setAttribute('marker-end', style.marker);
        line.setAttribute('stroke', style.color);
        line.setAttribute('stroke-width', style.width);

        this.contentGroup.appendChild(line);
    }

    /**
     * Render a node
     */
    renderNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `partner-node node-${node.type}`);
        group.setAttribute('data-id', node.id);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // Node circle with gradient
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', node.type === 'core' ? '55' : '45');
        circle.setAttribute('class', `node-circle node-${node.type}`);

        // Apply glow filter to core and attack nodes
        if (node.type === 'core') {
            circle.setAttribute('filter', 'url(#mev-core-glow)');
        } else if (node.type === 'attack' || node.type === 'victim') {
            circle.setAttribute('filter', 'url(#mev-attack-glow)');
        }

        // Set gradient fill based on type
        const gradients = {
            core: 'linear-gradient(135deg, #ff6600 0%, #ff0066 100%)',
            process: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            attack: 'linear-gradient(135deg, #ff6600 0%, #cc0000 100%)',
            victim: 'linear-gradient(135deg, #9966ff 0%, #6633cc 100%)',
            money: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
            participant: 'linear-gradient(135deg, #9966ff 0%, #6633cc 100%)',
            pool: 'linear-gradient(135deg, #00ccff 0%, #0088cc 100%)',
            success: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
            info: 'linear-gradient(135deg, #666666 0%, #333333 100%)',
            warning: 'linear-gradient(135deg, #ffaa00 0%, #ff6600 100%)'
        };

        group.appendChild(circle);

        // Icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('y', '-10');
        icon.setAttribute('class', 'node-icon');
        icon.setAttribute('text-anchor', 'middle');
        icon.textContent = node.icon;
        group.appendChild(icon);

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('y', '15');
        label.setAttribute('class', 'node-label');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = node.label;
        group.appendChild(label);

        // Description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        desc.textContent = `${node.description}\n${node.detail}`;
        group.appendChild(desc);

        // Add hover events
        group.addEventListener('mouseenter', () => this.highlightNode(node.id));
        group.addEventListener('mouseleave', () => this.unhighlightAll());

        // Add drag events
        group.addEventListener('mousedown', (e) => this.onNodeMouseDown(e, node));

        this.contentGroup.appendChild(group);
    }

    /**
     * Highlight a node and its connections
     */
    highlightNode(nodeId) {
        // Highlight the node
        const nodeElement = this.contentGroup.querySelector(`[data-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.classList.add('highlighted');
        }

        // Highlight connected links
        this.links.forEach(link => {
            if (link.source === nodeId || link.target === nodeId) {
                const linkElement = this.contentGroup.querySelector(
                    `[data-source="${link.source}"][data-target="${link.target}"]`
                );
                if (linkElement) {
                    linkElement.classList.add('highlighted');
                }
            }
        });
    }

    /**
     * Remove all highlights
     */
    unhighlightAll() {
        this.contentGroup.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Zoom buttons
        const zoomInBtn = document.getElementById('mevBotZoomIn');
        const zoomOutBtn = document.getElementById('mevBotZoomOut');
        const resetBtn = document.getElementById('mevBotReset');
        const centerBtn = document.getElementById('mevBotCenter');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoom(1.2));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (centerBtn) centerBtn.addEventListener('click', () => this.centerView());

        // Mouse wheel zoom
        this.svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Pan events
        this.svg.addEventListener('mousedown', (e) => this.onPanStart(e));
        this.svg.addEventListener('mousemove', (e) => this.onPanMove(e));
        this.svg.addEventListener('mouseup', () => this.onPanEnd());
        this.svg.addEventListener('mouseleave', () => this.onPanEnd());

        // Touch events for mobile
        this.svg.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.svg.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.svg.addEventListener('touchend', () => this.onTouchEnd());

        // Resize handler
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
        });
    }

    /**
     * Handle node mouse down
     */
    onNodeMouseDown(e, node) {
        e.stopPropagation();
        this.isDragging = true;
        this.draggedNode = node;

        const rect = this.svg.getBoundingClientRect();
        this.dragStartX = (e.clientX - rect.left) / this.currentScale;
        this.dragStartY = (e.clientY - rect.top) / this.currentScale;

        document.addEventListener('mousemove', this.onNodeDrag);
        document.addEventListener('mouseup', this.onNodeDragEnd);
    }

    /**
     * Handle node drag
     */
    onNodeDrag = (e) => {
        if (!this.isDragging || !this.draggedNode) return;

        const rect = this.svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.currentScale;
        const y = (e.clientY - rect.top) / this.currentScale;

        this.draggedNode.x = x;
        this.draggedNode.y = y;

        this.render();
    }

    /**
     * Handle node drag end
     */
    onNodeDragEnd = () => {
        this.isDragging = false;
        this.draggedNode = null;

        document.removeEventListener('mousemove', this.onNodeDrag);
        document.removeEventListener('mouseup', this.onNodeDragEnd);
    }

    /**
     * Zoom in/out
     */
    zoom(factor) {
        this.targetScale = Math.max(0.3, Math.min(3, this.targetScale * factor));
    }

    /**
     * Handle mouse wheel
     */
    onWheel(e) {
        e.preventDefault();

        const now = Date.now();
        if (now - this.lastWheelTime < this.wheelThrottle) return;
        this.lastWheelTime = now;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
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
     * Pan start
     */
    onPanStart(e) {
        if (this.isDragging) return;

        this.isPanning = true;
        this.dragStartX = e.clientX - this.targetX;
        this.dragStartY = e.clientY - this.targetY;
        this.svg.style.cursor = 'grabbing';
    }

    /**
     * Pan move
     */
    onPanMove(e) {
        if (!this.isPanning) return;

        this.targetX = e.clientX - this.dragStartX;
        this.targetY = e.clientY - this.dragStartY;
    }

    /**
     * Pan end
     */
    onPanEnd() {
        this.isPanning = false;
        this.svg.style.cursor = 'grab';
    }

    /**
     * Touch start
     */
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isPanning = true;
            this.dragStartX = touch.clientX - this.targetX;
            this.dragStartY = touch.clientY - this.targetY;
        }
    }

    /**
     * Touch move
     */
    onTouchMove(e) {
        if (e.touches.length === 1 && this.isPanning) {
            e.preventDefault();
            const touch = e.touches[0];
            this.targetX = touch.clientX - this.dragStartX;
            this.targetY = touch.clientY - this.dragStartY;
        }
    }

    /**
     * Touch end
     */
    onTouchEnd() {
        this.isPanning = false;
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

// Initialize MEV bot map when needed
if (typeof window !== 'undefined') {
    window.mevBotMap = new MevBotMap();
}
