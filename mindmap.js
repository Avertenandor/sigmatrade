/**
 * Interactive Mind Map for SigmaTrade - Premium Edition
 * Smooth 60fps animations with requestAnimationFrame
 * Hardware-accelerated transforms
 * Easing functions for buttery smooth interactions
 */

class MindMap {
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
     * Render the mind map
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
        line.setAttribute('class', 'mindmap-link');
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('data-source', link.source);
        line.setAttribute('data-target', link.target);

        this.contentGroup.appendChild(line);
    }

    /**
     * Render a node
     */
    renderNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `mindmap-node node-${node.type}`);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.setAttribute('data-node-id', node.id);
        group.style.cursor = node.action ? 'pointer' : 'move';

        // Node circle with smooth transitions
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'node-circle');
        circle.setAttribute('r', this.getNodeRadius(node.type));

        // Add glow effect for core node
        if (node.type === 'core') {
            circle.setAttribute('filter', 'url(#glow)');
        }

        group.appendChild(circle);

        // Node icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dy', '0.35em');
        icon.setAttribute('class', 'node-icon');
        icon.setAttribute('font-size', node.type === 'core' ? '36' : '24');
        icon.textContent = node.icon;
        icon.setAttribute('pointer-events', 'none');
        group.appendChild(icon);

        // Node label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', this.getNodeRadius(node.type) + 20);
        label.setAttribute('class', 'node-label');
        label.textContent = node.label;
        label.setAttribute('pointer-events', 'none');
        group.appendChild(label);

        // Node description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        desc.setAttribute('text-anchor', 'middle');
        desc.setAttribute('dy', this.getNodeRadius(node.type) + 40);
        desc.setAttribute('class', 'node-description');
        desc.textContent = node.description;
        desc.setAttribute('pointer-events', 'none');
        group.appendChild(desc);

        // Event listeners
        group.addEventListener('mouseenter', () => this.onNodeHover(node, group, true));
        group.addEventListener('mouseleave', () => this.onNodeHover(node, group, false));
        group.addEventListener('mousedown', (e) => this.onNodeDragStart(e, node, group));
        group.addEventListener('click', () => this.onNodeClick(node));

        // Touch support
        group.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onNodeDragStart(e.touches[0], node, group);
        });

        this.contentGroup.appendChild(group);
    }

    /**
     * Get node radius based on type
     */
    getNodeRadius(type) {
        const radii = {
            core: 50,
            page: 40,
            feature: 30,
            data: 30
        };
        return radii[type] || 30;
    }

    /**
     * Handle node hover with smooth animations
     */
    onNodeHover(node, group, isHover) {
        // Add/remove hover class for CSS transitions
        if (isHover) {
            group.classList.add('hovered');
        } else {
            group.classList.remove('hovered');
        }

        // Highlight connected links
        const links = this.contentGroup.querySelectorAll('.mindmap-link');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');

            if (source === node.id || target === node.id) {
                if (isHover) {
                    link.classList.add('highlighted');
                } else {
                    link.classList.remove('highlighted');
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

        // Get mouse/touch position
        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        // Convert to SVG coordinates
        const pt = this.svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(this.contentGroup.getScreenCTM().inverse());

        this.dragStartX = svgP.x - node.x;
        this.dragStartY = svgP.y - node.y;

        // Add dragging class for visual feedback
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
            // Node dragging
            const pt = this.svg.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const svgP = pt.matrixTransform(this.contentGroup.getScreenCTM().inverse());

            const newX = svgP.x - this.dragStartX;
            const newY = svgP.y - this.dragStartY;

            // Update node position
            this.draggedNode.node.x = newX;
            this.draggedNode.node.y = newY;

            // Update visual position with SVG transform (not CSS)
            this.draggedNode.group.setAttribute('transform', `translate(${newX}, ${newY})`);

            // Update connected links
            this.updateLinksForNode(this.draggedNode.node);
        } else if (this.isPanning) {
            // Pan the view
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
        const links = this.contentGroup.querySelectorAll('.mindmap-link');
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
     * Handle node click
     */
    onNodeClick(node) {
        if (this.isDragging) return;

        // Navigate to page if action is defined
        if (node.action && window.app) {
            // Add click animation
            const nodeGroup = this.contentGroup.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeGroup) {
                nodeGroup.classList.add('clicked');
                setTimeout(() => nodeGroup.classList.remove('clicked'), 300);
            }

            setTimeout(() => {
                window.app.switchPage(node.action);
            }, 150);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Zoom buttons with smooth animation
        document.getElementById('mindmapZoomIn')?.addEventListener('click', () => this.smoothZoom(1.3));
        document.getElementById('mindmapZoomOut')?.addEventListener('click', () => this.smoothZoom(0.7));
        document.getElementById('mindmapReset')?.addEventListener('click', () => this.reset());
        document.getElementById('mindmapCenter')?.addEventListener('click', () => this.centerView());

        // Mouse wheel zoom (throttled)
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
            if (e.target === this.svg || e.target.closest('#mindmapContent') === this.contentGroup) {
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
    }

    /**
     * Handle mouse wheel with throttling
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

// Initialize mind map when page loads
if (typeof window !== 'undefined') {
    window.mindMap = new MindMap();
}
