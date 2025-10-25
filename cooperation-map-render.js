/**
 * Cooperation Map Render Module
 * Handles: Rendering Nodes/Links, Event Listeners, Interactions
 */

const CooperationMapRender = {
    /**
     * Render the cooperation map
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
        this.ensureGradients(core);
        circle.setAttribute('fill', fillColor);

        group.appendChild(circle);

        // Node icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dy', '0.35em');
        icon.setAttribute('class', 'node-icon');
        icon.setAttribute('font-size', '28');
        icon.setAttribute('fill', '#fff');
        icon.textContent = node.icon;
        icon.setAttribute('pointer-events', 'none');
        group.appendChild(icon);

        // Node label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', this.getNodeRadius(node.type) + 18);
        label.setAttribute('class', 'node-label');
        label.setAttribute('font-size', core.isMobile ? '11' : '13');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#fff');
        label.textContent = node.label;
        label.setAttribute('pointer-events', 'none');
        group.appendChild(label);

        // Node description (shown on hover)
        const desc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        desc.setAttribute('text-anchor', 'middle');
        desc.setAttribute('dy', this.getNodeRadius(node.type) + 35);
        desc.setAttribute('class', 'node-description');
        desc.setAttribute('font-size', '11');
        desc.setAttribute('fill', '#aaa');
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
        detail.setAttribute('fill', '#999');
        detail.textContent = node.detail;
        detail.setAttribute('pointer-events', 'none');
        group.appendChild(detail);

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
     * Ensure gradients exist in SVG defs
     */
    ensureGradients(core) {
        const defs = core.svg.querySelector('defs');
        if (!defs) return;

        // Check if gradients already exist
        if (defs.querySelector('#processGradient')) return;

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
        defs.appendChild(createGradient('processGradient', '#00d4ff', '#0099cc'));
        defs.appendChild(createGradient('successGradient', '#00ff88', '#00cc66'));
        defs.appendChild(createGradient('failGradient', '#ff4444', '#cc0000'));
        defs.appendChild(createGradient('bonusGradient', '#ffd700', '#ffaa00'));
    },

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
    },

    /**
     * Handle node hover
     */
    onNodeHover(core, node, group, isHover) {
        // Add/remove hover class
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
                    link.setAttribute('opacity', '1');
                    link.setAttribute('stroke-width', '3');
                } else {
                    link.classList.remove('highlighted');
                    link.setAttribute('opacity', '0.6');
                    link.setAttribute('stroke-width', '2');
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

        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        const pt = core.svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(core.contentGroup.getScreenCTM().inverse());

        core.dragStartX = svgP.x - node.x;
        core.dragStartY = svgP.y - node.y;

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
            const pt = core.svg.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const svgP = pt.matrixTransform(core.contentGroup.getScreenCTM().inverse());

            const newX = svgP.x - core.dragStartX;
            const newY = svgP.y - core.dragStartY;

            core.draggedNode.node.x = newX;
            core.draggedNode.node.y = newY;

            core.draggedNode.group.setAttribute('transform', `translate(${newX}, ${newY})`);

            this.updateLinksForNode(core, core.draggedNode.node);
        } else if (core.isPanning) {
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
        // Zoom buttons
        document.getElementById('cooperationZoomIn')?.addEventListener('click', () => core.smoothZoom(1.3));
        document.getElementById('cooperationZoomOut')?.addEventListener('click', () => core.smoothZoom(0.7));
        document.getElementById('cooperationReset')?.addEventListener('click', () => core.reset());
        document.getElementById('cooperationCenter')?.addEventListener('click', () => core.centerView());

        // Mouse wheel zoom
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
            if (e.target === core.svg || e.target.closest('#cooperationContent') === core.contentGroup) {
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

        // Handle window resize
        window.addEventListener('resize', () => {
            const wasMobile = core.isMobile;
            core.isMobile = window.innerWidth < 768;

            if (wasMobile !== core.isMobile) {
                this.render(core);
            }
        });
    },

    /**
     * Handle mouse wheel
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
    window.CooperationMapRender = CooperationMapRender;
}
