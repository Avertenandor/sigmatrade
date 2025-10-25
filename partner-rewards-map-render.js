/**
 * Partner Rewards Map Render Module
 * Handles: Rendering Nodes/Links, Event Listeners, Interactions
 */

const PartnerRewardsMapRender = {
    /**
     * Render the partner rewards map
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
        line.setAttribute('class', 'partner-link');
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('data-source', link.source);
        line.setAttribute('data-target', link.target);
        line.setAttribute('marker-end', 'url(#partner-arrow)');

        core.contentGroup.appendChild(line);
    },

    /**
     * Render a node
     */
    renderNode(core, node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `partner-node node-${node.type}`);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.setAttribute('data-node-id', node.id);
        group.style.cursor = 'move';

        // Node circle with smooth transitions
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'node-circle');
        circle.setAttribute('r', this.getNodeRadius(node.type));

        // Add glow effect for core node
        if (node.type === 'core') {
            circle.setAttribute('filter', 'url(#partner-glow)');
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

        // Percentage badge for level nodes
        if (node.percentage) {
            const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badge.setAttribute('text-anchor', 'middle');
            badge.setAttribute('dy', '-25');
            badge.setAttribute('class', 'node-percentage');
            badge.setAttribute('font-size', '16');
            badge.setAttribute('font-weight', 'bold');
            badge.setAttribute('fill', this.getPercentageColor(node.type));
            badge.textContent = node.percentage;
            badge.setAttribute('pointer-events', 'none');
            group.appendChild(badge);
        }

        // Node label (hidden on mobile by default, shown on hover)
        if (!core.isMobile || node.type === 'core') {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dy', this.getNodeRadius(node.type) + 20);
            label.setAttribute('class', 'node-label');
            label.setAttribute('font-size', core.isMobile ? '11' : '13');
            label.textContent = core.isMobile && node.type !== 'core' ? '' : node.label;
            label.setAttribute('pointer-events', 'none');
            group.appendChild(label);
        }

        // Node description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        desc.setAttribute('text-anchor', 'middle');
        desc.setAttribute('dy', this.getNodeRadius(node.type) + 40);
        desc.setAttribute('class', 'node-description');
        desc.setAttribute('font-size', '12');
        desc.textContent = node.income || node.description;
        desc.setAttribute('pointer-events', 'none');
        group.appendChild(desc);

        // Event listeners
        group.addEventListener('mouseenter', () => this.onNodeHover(core, node, group, true));
        group.addEventListener('mouseleave', () => this.onNodeHover(core, node, group, false));
        group.addEventListener('mousedown', (e) => this.onNodeDragStart(core, e, node, group));

        // Touch support
        group.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onNodeDragStart(core, e.touches[0], node, group);
        });

        core.contentGroup.appendChild(group);
    },

    /**
     * Get node radius based on type
     */
    getNodeRadius(type) {
        const radii = {
            core: 50,
            level1: 35,
            level2: 30,
            level3: 25
        };
        return radii[type] || 30;
    },

    /**
     * Get percentage color based on level
     */
    getPercentageColor(type) {
        const colors = {
            level1: '#00d4ff',  // 3% - cyan
            level2: '#ffd700',  // 2% - gold
            level3: '#00ff88'   // 5% - green
        };
        return colors[type] || '#00d4ff';
    },

    /**
     * Handle node hover with smooth animations
     */
    onNodeHover(core, node, group, isHover) {
        // Add/remove hover class for CSS transitions
        if (isHover) {
            group.classList.add('hovered');
        } else {
            group.classList.remove('hovered');
        }

        // Highlight connected links
        const links = core.contentGroup.querySelectorAll('.partner-link');
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
    },

    /**
     * Handle node drag start
     */
    onNodeDragStart(core, event, node, group) {
        event.stopPropagation();

        core.isDragging = true;
        core.draggedNode = { node, group };

        // Get mouse/touch position
        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        // Convert to SVG coordinates
        const pt = core.svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(core.contentGroup.getScreenCTM().inverse());

        core.dragStartX = svgP.x - node.x;
        core.dragStartY = svgP.y - node.y;

        // Add dragging class for visual feedback
        group.classList.add('dragging');
    },

    /**
     * Handle mouse move
     */
    onMouseMove(core, event) {
        if (!core.isDragging && !core.isPanning) return;

        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        if (core.isDragging && core.draggedNode) {
            // Node dragging
            const pt = core.svg.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const svgP = pt.matrixTransform(core.contentGroup.getScreenCTM().inverse());

            const newX = svgP.x - core.dragStartX;
            const newY = svgP.y - core.dragStartY;

            // Update node position
            core.draggedNode.node.x = newX;
            core.draggedNode.node.y = newY;

            // Update visual position with SVG transform
            core.draggedNode.group.setAttribute('transform', `translate(${newX}, ${newY})`);

            // Update connected links
            this.updateLinksForNode(core, core.draggedNode.node);
        } else if (core.isPanning) {
            // Pan the view
            const dx = clientX - core.panStartX;
            const dy = clientY - core.panStartY;

            core.targetX = core.panStartOffsetX + dx;
            core.targetY = core.panStartOffsetY + dy;
        }
    },

    /**
     * Update links connected to a node
     */
    updateLinksForNode(core, node) {
        const links = core.contentGroup.querySelectorAll('.partner-link');
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
    },

    /**
     * Handle mouse up
     */
    onMouseUp(core) {
        if (core.draggedNode) {
            core.draggedNode.group.classList.remove('dragging');
        }

        core.isDragging = false;
        core.isPanning = false;
        core.draggedNode = null;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners(core) {
        // Zoom buttons with smooth animation
        document.getElementById('partnerZoomIn')?.addEventListener('click', () => core.smoothZoom(1.3));
        document.getElementById('partnerZoomOut')?.addEventListener('click', () => core.smoothZoom(0.7));
        document.getElementById('partnerReset')?.addEventListener('click', () => core.reset());
        document.getElementById('partnerCenter')?.addEventListener('click', () => core.centerView());

        // Mouse wheel zoom (throttled)
        core.svg.addEventListener('wheel', (e) => this.onWheel(core, e), { passive: false });

        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(core, e));
        document.addEventListener('mouseup', () => this.onMouseUp(core));

        // Touch events
        document.addEventListener('touchmove', (e) => {
            if (core.isDragging || core.isPanning) {
                e.preventDefault();
                this.onMouseMove(core, e);
            }
        }, { passive: false });
        document.addEventListener('touchend', () => this.onMouseUp(core));

        // Pan on SVG background
        core.svg.addEventListener('mousedown', (e) => {
            if (e.target === core.svg || e.target.closest('#partnerRewardsContent') === core.contentGroup) {
                core.isPanning = true;
                core.panStartX = e.clientX;
                core.panStartY = e.clientY;
                core.panStartOffsetX = core.currentX;
                core.panStartOffsetY = core.currentY;
                core.svg.style.cursor = 'grabbing';
            }
        });

        core.svg.addEventListener('mouseup', () => {
            core.svg.style.cursor = 'default';
        });

        // Handle window resize for mobile adaptation
        window.addEventListener('resize', () => {
            const wasMobile = core.isMobile;
            core.isMobile = window.innerWidth < 768;

            // Re-render if mobile state changed
            if (wasMobile !== core.isMobile) {
                this.render(core);
            }
        });
    },

    /**
     * Handle mouse wheel with throttling
     */
    onWheel(core, event) {
        event.preventDefault();

        const now = Date.now();
        if (now - core.lastWheelTime < core.wheelThrottle) {
            return;
        }
        core.lastWheelTime = now;

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        core.smoothZoom(delta);
    }
};

// Export to window for global access
if (typeof window !== 'undefined') {
    window.PartnerRewardsMapRender = PartnerRewardsMapRender;
}
