/**
 * Interactive Mind Map for SigmaTrade
 * Visualizes the entire user interaction concept
 */

class MindMap {
    constructor() {
        this.svg = null;
        this.contentGroup = null;
        this.nodes = [];
        this.links = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.draggedNode = null;
        this.viewBoxWidth = 1400;
        this.viewBoxHeight = 900;

        this.initialized = false;
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

        this.initialized = true;
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
            { source: 'mev', target: 'transactions' },
            { source: 'mev', target: 'balances' },
            { source: 'mev', target: 'stats' },
            { source: 'mev', target: 'bsc' },

            // Arbitrage bot features
            { source: 'arbitrage', target: 'stats' },
            { source: 'arbitrage', target: 'bsc' },

            // Real-time features
            { source: 'core', target: 'websocket' },
            { source: 'websocket', target: 'quicknode' },

            // Transaction interactions
            { source: 'transactions', target: 'copy' },
            { source: 'transactions', target: 'explorer' },

            // Data flow
            { source: 'transactions', target: 'etherscan' },
            { source: 'balances', target: 'etherscan' },
            { source: 'etherscan', target: 'cache' },
            { source: 'quicknode', target: 'cache' },

            // Mobile support
            { source: 'core', target: 'mobile' },

            // Stats connection
            { source: 'stats', target: 'etherscan' },
        ];
    }

    /**
     * Render the mind map
     */
    render() {
        this.contentGroup.innerHTML = '';

        // Draw links first (so they appear behind nodes)
        this.links.forEach(link => {
            const sourceNode = this.nodes.find(n => n.id === link.source);
            const targetNode = this.nodes.find(n => n.id === link.target);

            if (sourceNode && targetNode) {
                this.drawLink(sourceNode, targetNode);
            }
        });

        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
    }

    /**
     * Draw a link between two nodes
     */
    drawLink(source, target) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.setAttribute('class', 'mindmap-link');
        line.setAttribute('data-source', source.id);
        line.setAttribute('data-target', target.id);
        line.setAttribute('stroke', '#4a9eff');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-opacity', '0.3');
        line.setAttribute('marker-end', 'url(#arrowhead)');

        this.contentGroup.appendChild(line);
    }

    /**
     * Draw a node
     */
    drawNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `mindmap-node mindmap-node-${node.type}`);
        group.setAttribute('data-id', node.id);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.style.cursor = 'pointer';

        // Node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', this.getNodeRadius(node.type));
        circle.setAttribute('class', `node-circle node-${node.type}`);

        // Set colors based on type
        const colors = {
            core: '#ff6b6b',
            page: '#4a9eff',
            feature: '#51cf66',
            data: '#ffd93d'
        };
        circle.setAttribute('fill', colors[node.type] || '#888');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '3');

        // Add glow effect for core node
        if (node.type === 'core') {
            circle.setAttribute('filter', 'url(#glow)');
        }

        group.appendChild(circle);

        // Node icon (as text)
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
        label.setAttribute('fill', '#fff');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', 'bold');
        label.textContent = node.label;
        label.setAttribute('pointer-events', 'none');
        group.appendChild(label);

        // Node description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        desc.setAttribute('text-anchor', 'middle');
        desc.setAttribute('dy', this.getNodeRadius(node.type) + 40);
        desc.setAttribute('class', 'node-description');
        desc.setAttribute('fill', '#aaa');
        desc.setAttribute('font-size', '12');
        desc.textContent = node.description;
        desc.setAttribute('opacity', '0');
        desc.setAttribute('pointer-events', 'none');
        group.appendChild(desc);

        // Add event listeners
        group.addEventListener('mouseenter', () => this.onNodeHover(node, group, true));
        group.addEventListener('mouseleave', () => this.onNodeHover(node, group, false));
        group.addEventListener('mousedown', (e) => this.onNodeDragStart(e, node, group));
        group.addEventListener('click', () => this.onNodeClick(node));

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
     * Handle node hover
     */
    onNodeHover(node, group, isHover) {
        // Show/hide description
        const desc = group.querySelector('.node-description');
        if (desc) {
            desc.setAttribute('opacity', isHover ? '1' : '0');
        }

        // Highlight node
        const circle = group.querySelector('.node-circle');
        if (circle) {
            circle.setAttribute('stroke-width', isHover ? '5' : '3');
        }

        // Highlight connected links
        const links = this.contentGroup.querySelectorAll('.mindmap-link');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');

            if (source === node.id || target === node.id) {
                link.setAttribute('stroke-opacity', isHover ? '0.8' : '0.3');
                link.setAttribute('stroke-width', isHover ? '3' : '2');
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

        // Store initial mouse position
        const svg = this.svg;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        this.dragOffset = {
            x: svgP.x - node.x,
            y: svgP.y - node.y
        };
    }

    /**
     * Handle node click
     */
    onNodeClick(node) {
        if (this.isDragging) return;

        // Navigate to page if action is defined
        if (node.action && window.app) {
            window.app.switchPage(node.action);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Zoom buttons
        document.getElementById('mindmapZoomIn')?.addEventListener('click', () => this.zoom(1.2));
        document.getElementById('mindmapZoomOut')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('mindmapReset')?.addEventListener('click', () => this.reset());
        document.getElementById('mindmapCenter')?.addEventListener('click', () => this.centerView());

        // Mouse wheel zoom
        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta);
        });

        // Drag and pan
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());

        // Pan on SVG drag
        let isPanning = false;
        let panStart = { x: 0, y: 0 };

        this.svg.addEventListener('mousedown', (e) => {
            if (e.target === this.svg || e.target === this.contentGroup) {
                isPanning = true;
                panStart = { x: e.clientX - this.offsetX, y: e.clientY - this.offsetY };
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isPanning) {
                this.offsetX = e.clientX - panStart.x;
                this.offsetY = e.clientY - panStart.y;
                this.updateTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            isPanning = false;
        });
    }

    /**
     * Handle mouse move for node dragging
     */
    onMouseMove(event) {
        if (!this.isDragging || !this.draggedNode) return;

        const svg = this.svg;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        // Update node position
        const newX = svgP.x - this.dragOffset.x;
        const newY = svgP.y - this.dragOffset.y;

        this.draggedNode.node.x = newX;
        this.draggedNode.node.y = newY;

        // Update node visual position
        this.draggedNode.group.setAttribute('transform', `translate(${newX}, ${newY})`);

        // Update connected links
        this.updateLinks(this.draggedNode.node.id);
    }

    /**
     * Handle mouse up
     */
    onMouseUp() {
        this.isDragging = false;
        this.draggedNode = null;
    }

    /**
     * Update links connected to a node
     */
    updateLinks(nodeId) {
        const links = this.contentGroup.querySelectorAll('.mindmap-link');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');

            if (source === nodeId) {
                const sourceNode = this.nodes.find(n => n.id === source);
                if (sourceNode) {
                    link.setAttribute('x1', sourceNode.x);
                    link.setAttribute('y1', sourceNode.y);
                }
            }

            if (target === nodeId) {
                const targetNode = this.nodes.find(n => n.id === target);
                if (targetNode) {
                    link.setAttribute('x2', targetNode.x);
                    link.setAttribute('y2', targetNode.y);
                }
            }
        });
    }

    /**
     * Zoom the view
     */
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.5, Math.min(3, this.scale)); // Limit scale
        this.updateTransform();
    }

    /**
     * Reset the view
     */
    reset() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateTransform();
    }

    /**
     * Center the view
     */
    centerView() {
        const container = document.getElementById('mindmapContainer');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        // Calculate center of all nodes
        const nodesCenterX = this.nodes.reduce((sum, n) => sum + n.x, 0) / this.nodes.length;
        const nodesCenterY = this.nodes.reduce((sum, n) => sum + n.y, 0) / this.nodes.length;

        this.offsetX = centerX - nodesCenterX * this.scale;
        this.offsetY = centerY - nodesCenterY * this.scale;

        this.updateTransform();
    }

    /**
     * Update transform
     */
    updateTransform() {
        if (!this.contentGroup) return;
        this.contentGroup.setAttribute('transform',
            `translate(${this.offsetX}, ${this.offsetY}) scale(${this.scale})`
        );
    }

    /**
     * Destroy the mind map
     */
    destroy() {
        this.initialized = false;
        if (this.contentGroup) {
            this.contentGroup.innerHTML = '';
        }
    }
}

// Create global instance
window.mindMap = new MindMap();
