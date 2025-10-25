/**
 * MEV Bot Map Render Module
 * Handles: Rendering Nodes/Links, Event Listeners, Interactions
 */

const MevBotMapRender = {
    /**
     * Render the MEV bot map
     */
    render(core) {
        // Clear existing content
        core.contentGroup.innerHTML = '';

        // Render links first (so they appear behind nodes)
        core.links.forEach(link => this.renderLink(core, link));

        // Render nodes
        core.nodes.forEach(node => this.renderNode(core, node));
    },

    /**
     * Render a link between nodes
     */
    renderLink(core, link) {
        const sourceNode = core.nodes.find(n => n.id === link.source);
        const targetNode = core.nodes.find(n => n.id === link.target);

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

        core.contentGroup.appendChild(line);
    },

    /**
     * Render a node
     */
    renderNode(core, node) {
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
        group.addEventListener('mouseenter', () => this.highlightNode(core, node.id));
        group.addEventListener('mouseleave', () => this.unhighlightAll(core));

        // Add drag events
        group.addEventListener('mousedown', (e) => this.onNodeMouseDown(core, e, node));

        core.contentGroup.appendChild(group);
    },

    /**
     * Highlight a node and its connections
     */
    highlightNode(core, nodeId) {
        // Highlight the node
        const nodeElement = core.contentGroup.querySelector(`[data-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.classList.add('highlighted');
        }

        // Highlight connected links
        core.links.forEach(link => {
            if (link.source === nodeId || link.target === nodeId) {
                const linkElement = core.contentGroup.querySelector(
                    `[data-source="${link.source}"][data-target="${link.target}"]`
                );
                if (linkElement) {
                    linkElement.classList.add('highlighted');
                }
            }
        });
    },

    /**
     * Remove all highlights
     */
    unhighlightAll(core) {
        core.contentGroup.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    },

    /**
     * Handle node mouse down
     */
    onNodeMouseDown(core, e, node) {
        e.stopPropagation();
        core.isDragging = true;
        core.draggedNode = node;

        const rect = core.svg.getBoundingClientRect();
        core.dragStartX = (e.clientX - rect.left) / core.currentScale;
        core.dragStartY = (e.clientY - rect.top) / core.currentScale;

        document.addEventListener('mousemove', (e) => this.onNodeDrag(core, e));
        document.addEventListener('mouseup', () => this.onNodeDragEnd(core));
    },

    /**
     * Handle node drag
     */
    onNodeDrag(core, e) {
        if (!core.isDragging || !core.draggedNode) return;

        const rect = core.svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / core.currentScale;
        const y = (e.clientY - rect.top) / core.currentScale;

        core.draggedNode.x = x;
        core.draggedNode.y = y;

        this.render(core);
    },

    /**
     * Handle node drag end
     */
    onNodeDragEnd(core) {
        core.isDragging = false;
        core.draggedNode = null;

        document.removeEventListener('mousemove', (e) => this.onNodeDrag(core, e));
        document.removeEventListener('mouseup', () => this.onNodeDragEnd(core));
    },

    /**
     * Setup event listeners
     */
    setupEventListeners(core) {
        // Zoom buttons
        const zoomInBtn = document.getElementById('mevBotZoomIn');
        const zoomOutBtn = document.getElementById('mevBotZoomOut');
        const resetBtn = document.getElementById('mevBotReset');
        const centerBtn = document.getElementById('mevBotCenter');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => core.zoom(1.2));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => core.zoom(0.8));
        if (resetBtn) resetBtn.addEventListener('click', () => core.reset());
        if (centerBtn) centerBtn.addEventListener('click', () => core.centerView());

        // Mouse wheel zoom
        core.svg.addEventListener('wheel', (e) => this.onWheel(core, e), { passive: false });

        // Pan events
        core.svg.addEventListener('mousedown', (e) => this.onPanStart(core, e));
        core.svg.addEventListener('mousemove', (e) => this.onPanMove(core, e));
        core.svg.addEventListener('mouseup', () => this.onPanEnd(core));
        core.svg.addEventListener('mouseleave', () => this.onPanEnd(core));

        // Touch events for mobile
        core.svg.addEventListener('touchstart', (e) => this.onTouchStart(core, e), { passive: false });
        core.svg.addEventListener('touchmove', (e) => this.onTouchMove(core, e), { passive: false });
        core.svg.addEventListener('touchend', () => this.onTouchEnd(core));

        // Resize handler
        window.addEventListener('resize', () => {
            core.isMobile = window.innerWidth < 768;
        });
    },

    /**
     * Handle mouse wheel
     */
    onWheel(core, e) {
        e.preventDefault();

        const now = Date.now();
        if (now - core.lastWheelTime < core.wheelThrottle) return;
        core.lastWheelTime = now;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        core.zoom(delta);
    },

    /**
     * Pan start
     */
    onPanStart(core, e) {
        if (core.isDragging) return;

        core.isPanning = true;
        core.dragStartX = e.clientX - core.targetX;
        core.dragStartY = e.clientY - core.targetY;
        core.svg.style.cursor = 'grabbing';
    },

    /**
     * Pan move
     */
    onPanMove(core, e) {
        if (!core.isPanning) return;

        core.targetX = e.clientX - core.dragStartX;
        core.targetY = e.clientY - core.dragStartY;
    },

    /**
     * Pan end
     */
    onPanEnd(core) {
        core.isPanning = false;
        core.svg.style.cursor = 'grab';
    },

    /**
     * Touch start
     */
    onTouchStart(core, e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            core.isPanning = true;
            core.dragStartX = touch.clientX - core.targetX;
            core.dragStartY = touch.clientY - core.targetY;
        }
    },

    /**
     * Touch move
     */
    onTouchMove(core, e) {
        if (e.touches.length === 1 && core.isPanning) {
            e.preventDefault();
            const touch = e.touches[0];
            core.targetX = touch.clientX - core.dragStartX;
            core.targetY = touch.clientY - core.dragStartY;
        }
    },

    /**
     * Touch end
     */
    onTouchEnd(core) {
        core.isPanning = false;
    }
};

// Export to window for global access
if (typeof window !== 'undefined') {
    window.MevBotMapRender = MevBotMapRender;
}
