/**
 * Interactive Exchange Bot Map for SigmaTrade
 * Visualizes how the exchange bot works: exchanges, commissions, and participant rewards
 * Shows: Exchange Process → Commission (0.1-0.8%) → Distribution to Participants
 * IMPORTANT WARNING: Direct deposits without interview = permanent loss
 */

class ExchangeBotMap {
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
     * Render the exchange bot map
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
            process: { marker: 'url(#exchange-arrow-process)', color: '#00d4ff', width: '2' },
            money: { marker: 'url(#exchange-arrow-money)', color: '#ffd700', width: '3' },
            success: { marker: 'url(#exchange-arrow-success)', color: '#00ff88', width: '2' },
            danger: { marker: 'url(#exchange-arrow-danger)', color: '#ff4444', width: '3' },
            pool: { marker: 'url(#exchange-arrow-pool)', color: '#00d4ff', width: '2' },
            info: { marker: 'url(#exchange-arrow-info)', color: '#888888', width: '1.5' }
        };

        const style = linkStyles[link.type] || linkStyles.process;
        line.setAttribute('marker-end', style.marker);
        line.setAttribute('stroke', style.color);
        line.setAttribute('stroke-width', style.width);
        line.setAttribute('opacity', '0.6');

        this.contentGroup.appendChild(line);
    }

    /**
     * Render a node
     */
    renderNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `partner-node node-${node.type}`);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.setAttribute('data-node-id', node.id);
        group.style.cursor = 'move';

        // Node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'node-circle');
        circle.setAttribute('r', this.getNodeRadius(node.type));

        // Set fill based on type
        const fillColor = this.getNodeFillColor(node.type);

        // Create gradients if they don't exist
        this.ensureGradients();
        circle.setAttribute('fill', fillColor);

        // Add special styling for warning and danger nodes
        if (node.type === 'warning' || node.type === 'danger') {
            circle.setAttribute('stroke', '#ff4444');
            circle.setAttribute('stroke-width', '3');
            circle.setAttribute('filter', 'url(#exchange-danger-glow)');
        } else if (node.type === 'core') {
            circle.setAttribute('filter', 'url(#exchange-core-glow)');
        }

        group.appendChild(circle);

        // Node icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dy', '0.35em');
        icon.setAttribute('class', 'node-icon');
        icon.setAttribute('font-size', node.type === 'core' ? '36' : '28');
        icon.textContent = node.icon;
        icon.setAttribute('pointer-events', 'none');
        group.appendChild(icon);

        // Node label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', this.getNodeRadius(node.type) + 18);
        label.setAttribute('class', 'node-label');
        label.setAttribute('font-size', this.isMobile ? '11' : '13');
        label.setAttribute('font-weight', 'bold');
        label.textContent = node.label;
        label.setAttribute('pointer-events', 'none');

        // Special color for danger labels
        if (node.type === 'danger' || node.type === 'warning') {
            label.setAttribute('fill', '#ff4444');
        }

        group.appendChild(label);

        // Node description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        desc.setAttribute('text-anchor', 'middle');
        desc.setAttribute('dy', this.getNodeRadius(node.type) + 35);
        desc.setAttribute('class', 'node-description');
        desc.setAttribute('font-size', '11');
        desc.textContent = node.description;
        desc.setAttribute('pointer-events', 'none');
        group.appendChild(desc);

        // Node detail (shown on hover)
        const detail = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        detail.setAttribute('text-anchor', 'middle');
        detail.setAttribute('dy', this.getNodeRadius(node.type) + 50);
        detail.setAttribute('class', 'node-detail');
        detail.setAttribute('font-size', '10');
        detail.setAttribute('font-style', 'italic');
        detail.textContent = node.detail;
        detail.setAttribute('pointer-events', 'none');
        group.appendChild(detail);

        // Event listeners
        group.addEventListener('mouseenter', () => this.onNodeHover(node, group, true));
        group.addEventListener('mouseleave', () => this.onNodeHover(node, group, false));
        group.addEventListener('mousedown', (e) => this.onNodeDragStart(e, node, group));

        // Touch support
        group.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onNodeDragStart(e.touches[0], node, group);
        });

        this.contentGroup.appendChild(group);
    }

    /**
     * Get node fill color based on type
     */
    getNodeFillColor(type) {
        const fills = {
            core: 'url(#exchangeCoreGradient)',
            process: 'url(#exchangeProcessGradient)',
            success: 'url(#exchangeSuccessGradient)',
            money: 'url(#exchangeMoneyGradient)',
            participant: 'url(#exchangeParticipantGradient)',
            pool: 'url(#exchangePoolGradient)',
            warning: 'url(#exchangeWarningGradient)',
            danger: 'url(#exchangeDangerGradient)',
            info: 'url(#exchangeInfoGradient)'
        };
        return fills[type] || fills.process;
    }

    /**
     * Ensure gradients exist in SVG defs
     */
    ensureGradients() {
        const defs = this.svg.querySelector('defs');
        if (!defs) return;

        // Check if gradients already exist
        if (defs.querySelector('#exchangeCoreGradient')) return;

        // Helper to create gradient
        const createGradient = (id, color1, color2) => {
            const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            grad.setAttribute('id', id);
            grad.setAttribute('x1', '0%');
            grad.setAttribute('y1', '0%');
            grad.setAttribute('x2', '100%');
            grad.setAttribute('y2', '100%');
            grad.innerHTML = `
                <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
            `;
            return grad;
        };

        // Create all gradients
        defs.appendChild(createGradient('exchangeCoreGradient', '#00d4ff', '#0066ff'));
        defs.appendChild(createGradient('exchangeProcessGradient', '#00d4ff', '#0099cc'));
        defs.appendChild(createGradient('exchangeSuccessGradient', '#00ff88', '#00cc66'));
        defs.appendChild(createGradient('exchangeMoneyGradient', '#ffd700', '#ffaa00'));
        defs.appendChild(createGradient('exchangeParticipantGradient', '#9966ff', '#6633cc'));
        defs.appendChild(createGradient('exchangePoolGradient', '#00ccff', '#0088cc'));
        defs.appendChild(createGradient('exchangeWarningGradient', '#ff8800', '#ff4400'));
        defs.appendChild(createGradient('exchangeDangerGradient', '#ff4444', '#cc0000'));
        defs.appendChild(createGradient('exchangeInfoGradient', '#888888', '#666666'));
    }

    /**
     * Get node radius based on type
     */
    getNodeRadius(type) {
        const radii = {
            core: 50,
            process: 35,
            success: 35,
            money: 40,
            participant: 30,
            pool: 38,
            warning: 45,
            danger: 40,
            info: 32
        };
        return radii[type] || 35;
    }

    /**
     * Handle node hover
     */
    onNodeHover(node, group, isHover) {
        // Add/remove hover class
        if (isHover) {
            group.classList.add('hovered');
        } else {
            group.classList.remove('hovered');
        }

        // Highlight connected links
        const links = this.contentGroup.querySelectorAll('.partner-link');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');

            if (source === node.id || target === node.id) {
                if (isHover) {
                    link.classList.add('highlighted');
                    link.setAttribute('opacity', '1');
                    const currentWidth = parseFloat(link.getAttribute('stroke-width'));
                    link.setAttribute('stroke-width', String(currentWidth + 1));
                } else {
                    link.classList.remove('highlighted');
                    link.setAttribute('opacity', '0.6');
                    const currentWidth = parseFloat(link.getAttribute('stroke-width'));
                    link.setAttribute('stroke-width', String(currentWidth - 1));
                }
            }
        });
    }

    /**
     * Handle node drag start
     */
    onNodeDragStart(event, node, group) {
        event.stopPropagation();

        this.isDragging = true;
        this.draggedNode = { node, group };

        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        const pt = this.svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(this.contentGroup.getScreenCTM().inverse());

        this.dragStartX = svgP.x - node.x;
        this.dragStartY = svgP.y - node.y;

        group.classList.add('dragging');
    }

    /**
     * Handle mouse move
     */
    onMouseMove(event) {
        if (!this.isDragging && !this.isPanning) return;

        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        if (this.isDragging && this.draggedNode) {
            const pt = this.svg.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const svgP = pt.matrixTransform(this.contentGroup.getScreenCTM().inverse());

            const newX = svgP.x - this.dragStartX;
            const newY = svgP.y - this.dragStartY;

            this.draggedNode.node.x = newX;
            this.draggedNode.node.y = newY;

            this.draggedNode.group.setAttribute('transform', `translate(${newX}, ${newY})`);

            this.updateLinksForNode(this.draggedNode.node);
        } else if (this.isPanning) {
            const dx = clientX - this.panStartX;
            const dy = clientY - this.panStartY;

            this.targetX = this.panStartOffsetX + dx;
            this.targetY = this.panStartOffsetY + dy;
        }
    }

    /**
     * Update links connected to a node
     */
    updateLinksForNode(node) {
        const links = this.contentGroup.querySelectorAll('.partner-link');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');

            if (source === node.id) {
                link.setAttribute('x1', node.x);
                link.setAttribute('y1', node.y);
            }
            if (target === node.id) {
                link.setAttribute('x2', node.x);
                link.setAttribute('y2', node.y);
            }
        });
    }

    /**
     * Handle mouse up
     */
    onMouseUp() {
        if (this.draggedNode) {
            this.draggedNode.group.classList.remove('dragging');
        }

        this.isDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Zoom buttons
        document.getElementById('exchangeBotZoomIn')?.addEventListener('click', () => this.smoothZoom(1.3));
        document.getElementById('exchangeBotZoomOut')?.addEventListener('click', () => this.smoothZoom(0.7));
        document.getElementById('exchangeBotReset')?.addEventListener('click', () => this.reset());
        document.getElementById('exchangeBotCenter')?.addEventListener('click', () => this.centerView());

        // Mouse wheel zoom
        this.svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());

        // Touch events
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging || this.isPanning) {
                e.preventDefault();
                this.onMouseMove(e);
            }
        }, { passive: false });
        document.addEventListener('touchend', () => this.onMouseUp());

        // Pan on SVG background
        this.svg.addEventListener('mousedown', (e) => {
            if (e.target === this.svg || e.target.closest('#exchangeBotContent') === this.contentGroup) {
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.panStartOffsetX = this.currentX;
                this.panStartOffsetY = this.currentY;
                this.svg.style.cursor = 'grabbing';
            }
        });

        this.svg.addEventListener('mouseup', () => {
            this.svg.style.cursor = 'default';
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;

            if (wasMobile !== this.isMobile) {
                this.render();
            }
        });
    }

    /**
     * Handle mouse wheel
     */
    onWheel(event) {
        event.preventDefault();

        const now = Date.now();
        if (now - this.lastWheelTime < this.wheelThrottle) {
            return;
        }
        this.lastWheelTime = now;

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        this.smoothZoom(delta);
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

// Initialize exchange bot map when needed
if (typeof window !== 'undefined') {
    window.exchangeBotMap = new ExchangeBotMap();
}
