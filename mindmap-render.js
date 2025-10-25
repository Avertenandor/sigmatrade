/**
 * Mind Map Render Module
 * Handles: Rendering Nodes/Links, Event Listeners, Interactions
 */

const MindMapRender = {
    /**
     * Render the mind map
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
        line.setAttribute('class', 'mindmap-link');
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('data-source', link.source);
        line.setAttribute('data-target', link.target);

        core.contentGroup.appendChild(line);
    },

    /**
     * Render a node
     */
    renderNode(core, node) {
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
        icon.setAttribute('fill', '#fff');
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
        group.addEventListener('mouseenter', () => this.onNodeHover(core, node, group, true));
        group.addEventListener('mouseleave', () => this.onNodeHover(core, node, group, false));
        group.addEventListener('mousedown', (e) => this.onNodeDragStart(core, e, node, group));
        group.addEventListener('click', () => this.onNodeClick(core, node));

        // Touch support
        group.addEventListener('touchstart', (e) => {
            // Don't prevent default on touchstart to allow other touch interactions
            // Only handle single touch for node dragging
            if (e.touches.length === 1) {
                this.onNodeDragStart(core, e.touches[0], node, group);
            }
        }, { passive: true });

        core.contentGroup.appendChild(group);
    },

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
        const links = core.contentGroup.querySelectorAll('.mindmap-link');
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

        // Get mouse/touch position (with proper touch event handling)
        const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches.length > 0 ? event.touches[0].clientX : 0);
        const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches.length > 0 ? event.touches[0].clientY : 0);

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

        // Get mouse/touch position (with proper touch event handling)
        const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches.length > 0 ? event.touches[0].clientX : 0);
        const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches.length > 0 ? event.touches[0].clientY : 0);

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

            // Update visual position with SVG transform (not CSS)
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
        const links = core.contentGroup.querySelectorAll('.mindmap-link');
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
     * Handle node click
     */
    onNodeClick(core, node) {
        if (core.isDragging) return;

        // Navigate to page if action is defined
        if (node.action && window.app) {
            // Add click animation
            const nodeGroup = core.contentGroup.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeGroup) {
                nodeGroup.classList.add('clicked');
                setTimeout(() => nodeGroup.classList.remove('clicked'), 300);
            }

            setTimeout(() => {
                window.app.switchPage(node.action);
            }, 150);
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners(core) {
        // Zoom buttons with smooth animation
        document.getElementById('mindmapZoomIn')?.addEventListener('click', () => core.smoothZoom(1.3));
        document.getElementById('mindmapZoomOut')?.addEventListener('click', () => core.smoothZoom(0.7));
        document.getElementById('mindmapReset')?.addEventListener('click', () => core.reset());
        document.getElementById('mindmapCenter')?.addEventListener('click', () => core.centerView());

        // Mouse wheel zoom (throttled)
        core.svg.addEventListener('wheel', (e) => this.onWheel(core, e), { passive: false });

        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(core, e));
        document.addEventListener('mouseup', () => this.onMouseUp(core));

        // Touch events for panning and dragging
        document.addEventListener('touchmove', (e) => {
            if (core.isPinching) {
                e.preventDefault();
                this.onTouchMove(core, e);
            } else if (core.isDragging || core.isPanning) {
                e.preventDefault();
                this.onMouseMove(core, e);
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            this.onTouchEnd(core, e);
            this.onMouseUp(core);
        });

        // Pan on SVG background (mouse)
        core.svg.addEventListener('mousedown', (e) => {
            if (e.target === core.svg || e.target.closest('#mindmapContent') === core.contentGroup) {
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

        // Touch events for SVG (panning and pinch-to-zoom)
        core.svg.addEventListener('touchstart', (e) => {
            this.onTouchStart(core, e);
        }, { passive: false });
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
    },

    /**
     * Handle touch start for pinch-to-zoom and panning
     */
    onTouchStart(core, event) {
        const touches = event.touches;

        if (touches.length === 2) {
            // Two-finger touch = pinch-to-zoom
            event.preventDefault();
            core.isPinching = true;
            core.touches = Array.from(touches);

            // Calculate initial distance between two fingers
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            core.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
        } else if (touches.length === 1) {
            // Single touch = pan
            if (event.target === core.svg || event.target.closest('#mindmapContent') === core.contentGroup) {
                core.isPanning = true;
                core.panStartX = touches[0].clientX;
                core.panStartY = touches[0].clientY;
                core.panStartOffsetX = core.currentX;
                core.panStartOffsetY = core.currentY;
            }
        }
    },

    /**
     * Handle touch move for pinch-to-zoom
     */
    onTouchMove(core, event) {
        if (!core.isPinching || event.touches.length !== 2) {
            return;
        }

        event.preventDefault();

        const touches = event.touches;

        // Calculate current distance between two fingers
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        // Calculate zoom factor based on distance change
        if (core.lastPinchDistance > 0) {
            const scale = currentDistance / core.lastPinchDistance;
            core.smoothZoom(scale);
        }

        core.lastPinchDistance = currentDistance;
    },

    /**
     * Handle touch end
     */
    onTouchEnd(core, event) {
        if (event.touches.length < 2) {
            core.isPinching = false;
            core.lastPinchDistance = 0;
            core.touches = [];
        }

        if (event.touches.length === 0) {
            core.isPanning = false;
        }
    }
};

// Export to window for global access
if (typeof window !== 'undefined') {
    window.MindMapRender = MindMapRender;
}
