/**
 * Interactive Cooperation Process Map for SigmaTrade
 * Visualizes the onboarding journey from application to system access
 * Shows: Email → Response → Interview → Success/Failure paths
 * Includes recommendation bonus path
 */

class CooperationMap {
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
     * Render the cooperation map
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

        // Set appropriate marker based on link type
        const markerUrl = link.type === 'success' ? 'url(#cooperation-arrow-success)' :
                         link.type === 'fail' ? 'url(#cooperation-arrow-fail)' :
                         'url(#cooperation-arrow)';
        line.setAttribute('marker-end', markerUrl);

        // Set stroke color based on type
        const strokeColor = link.type === 'success' ? '#00ff88' :
                           link.type === 'fail' ? '#ff4444' :
                           link.type === 'bonus' ? '#ffd700' :
                           '#00d4ff';
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', '2');
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
        const fillColor = node.type === 'success' ? 'url(#successGradient)' :
                         node.type === 'fail' ? 'url(#failGradient)' :
                         node.type === 'bonus' ? 'url(#bonusGradient)' :
                         'url(#processGradient)';

        // Create gradients if they don't exist
        this.ensureGradients();
        circle.setAttribute('fill', fillColor);

        group.appendChild(circle);

        // Node icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dy', '0.35em');
        icon.setAttribute('class', 'node-icon');
        icon.setAttribute('font-size', '28');
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
     * Ensure gradients exist in SVG defs
     */
    ensureGradients() {
        const defs = this.svg.querySelector('defs');
        if (!defs) return;

        // Check if gradients already exist
        if (defs.querySelector('#processGradient')) return;

        // Process gradient (blue)
        const processGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        processGrad.setAttribute('id', 'processGradient');
        processGrad.setAttribute('x1', '0%');
        processGrad.setAttribute('y1', '0%');
        processGrad.setAttribute('x2', '100%');
        processGrad.setAttribute('y2', '100%');
        processGrad.innerHTML = `
            <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
        `;
        defs.appendChild(processGrad);

        // Success gradient (green)
        const successGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        successGrad.setAttribute('id', 'successGradient');
        successGrad.setAttribute('x1', '0%');
        successGrad.setAttribute('y1', '0%');
        successGrad.setAttribute('x2', '100%');
        successGrad.setAttribute('y2', '100%');
        successGrad.innerHTML = `
            <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00cc66;stop-opacity:1" />
        `;
        defs.appendChild(successGrad);

        // Fail gradient (red)
        const failGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        failGrad.setAttribute('id', 'failGradient');
        failGrad.setAttribute('x1', '0%');
        failGrad.setAttribute('y1', '0%');
        failGrad.setAttribute('x2', '100%');
        failGrad.setAttribute('y2', '100%');
        failGrad.innerHTML = `
            <stop offset="0%" style="stop-color:#ff4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cc0000;stop-opacity:1" />
        `;
        defs.appendChild(failGrad);

        // Bonus gradient (gold)
        const bonusGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        bonusGrad.setAttribute('id', 'bonusGradient');
        bonusGrad.setAttribute('x1', '0%');
        bonusGrad.setAttribute('y1', '0%');
        bonusGrad.setAttribute('x2', '100%');
        bonusGrad.setAttribute('y2', '100%');
        bonusGrad.innerHTML = `
            <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:1" />
        `;
        defs.appendChild(bonusGrad);
    }

    /**
     * Get node radius based on type
     */
    getNodeRadius(type) {
        const radii = {
            process: 35,
            success: 35,
            fail: 35,
            bonus: 40
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
                    link.setAttribute('stroke-width', '3');
                } else {
                    link.classList.remove('highlighted');
                    link.setAttribute('opacity', '0.6');
                    link.setAttribute('stroke-width', '2');
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
        document.getElementById('cooperationZoomIn')?.addEventListener('click', () => this.smoothZoom(1.3));
        document.getElementById('cooperationZoomOut')?.addEventListener('click', () => this.smoothZoom(0.7));
        document.getElementById('cooperationReset')?.addEventListener('click', () => this.reset());
        document.getElementById('cooperationCenter')?.addEventListener('click', () => this.centerView());

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
            if (e.target === this.svg || e.target.closest('#cooperationContent') === this.contentGroup) {
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

// Initialize cooperation map when needed
if (typeof window !== 'undefined') {
    window.cooperationMap = new CooperationMap();
}
