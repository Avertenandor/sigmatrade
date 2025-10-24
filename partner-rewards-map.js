/**
 * Interactive Partner Rewards Mind Map for SigmaTrade
 * Visualizes 3-level referral program: 3% -> 2% -> 5%
 * Smooth 60fps animations with requestAnimationFrame
 * Hardware-accelerated transforms
 * Mobile-optimized for touch interactions
 */

class PartnerRewardsMap {
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
     * Initialize the partner rewards map
     */
    init() {
        if (this.initialized) return;

        this.svg = document.getElementById('partnerRewardsSvg');
        this.contentGroup = document.getElementById('partnerRewardsContent');

        if (!this.svg || !this.contentGroup) {
            console.error('Partner rewards map SVG elements not found');
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
            const alpha = 0.2; // Optimized for SVG transform

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
     * Apply transform to content group using SVG transform
     */
    applyTransform() {
        const transform = `translate(${this.currentX}, ${this.currentY}) scale(${this.currentScale})`;
        this.contentGroup.setAttribute('transform', transform);
    }

    /**
     * Setup partner rewards data structure
     * 3 levels: 3% -> 2% -> 5%
     */
    setupData() {
        // Center - You (user)
        this.nodes = [
            {
                id: 'you',
                label: 'ВЫ',
                type: 'core',
                x: 700,
                y: 450,
                icon: '👤',
                description: 'Вы - партнер программы',
                percentage: null
            },
        ];

        this.links = [];

        // Level 1: 3% - 3 referrals
        const level1Count = 3;
        const level1Radius = 200;
        const level1StartAngle = -Math.PI / 2; // Start from top

        for (let i = 0; i < level1Count; i++) {
            const angle = level1StartAngle + (i * 2 * Math.PI / level1Count);
            const x = 700 + level1Radius * Math.cos(angle);
            const y = 450 + level1Radius * Math.sin(angle);

            const nodeId = `level1-${i}`;
            this.nodes.push({
                id: nodeId,
                label: `Партнер 1.${i + 1}`,
                type: 'level1',
                x: x,
                y: y,
                icon: '👥',
                description: 'Партнер 1-го уровня',
                percentage: '3%',
                income: 'От дохода и вложений'
            });

            this.links.push({ source: 'you', target: nodeId });

            // Level 2: 2% - 2 referrals per level 1
            const level2Count = 2;
            const level2Radius = 180;
            const level2BaseAngle = angle;

            for (let j = 0; j < level2Count; j++) {
                const offset = (j - 0.5) * (Math.PI / 4);
                const level2Angle = level2BaseAngle + offset;
                const level2X = x + level2Radius * Math.cos(level2Angle);
                const level2Y = y + level2Radius * Math.sin(level2Angle);

                const level2NodeId = `level2-${i}-${j}`;
                this.nodes.push({
                    id: level2NodeId,
                    label: `Партнер 2.${i + 1}.${j + 1}`,
                    type: 'level2',
                    x: level2X,
                    y: level2Y,
                    icon: '👤',
                    description: 'Партнер 2-го уровня',
                    percentage: '2%',
                    income: 'От дохода и вложений'
                });

                this.links.push({ source: nodeId, target: level2NodeId });

                // Level 3: 5% - 1-2 referrals per level 2
                const level3Count = j === 0 ? 2 : 1;
                const level3Radius = 150;

                for (let k = 0; k < level3Count; k++) {
                    const level3Offset = level3Count === 1 ? 0 : (k - 0.5) * (Math.PI / 6);
                    const level3Angle = level2Angle + level3Offset;
                    const level3X = level2X + level3Radius * Math.cos(level3Angle);
                    const level3Y = level2Y + level3Radius * Math.sin(level3Angle);

                    const level3NodeId = `level3-${i}-${j}-${k}`;
                    this.nodes.push({
                        id: level3NodeId,
                        label: `Партнер 3.${i + 1}.${j + 1}.${k + 1}`,
                        type: 'level3',
                        x: level3X,
                        y: level3Y,
                        icon: '👤',
                        description: 'Партнер 3-го уровня',
                        percentage: '5%',
                        income: 'От дохода и вложений'
                    });

                    this.links.push({ source: level2NodeId, target: level3NodeId });
                }
            }
        }
    }

    /**
     * Render the partner rewards map
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
        line.setAttribute('class', 'partner-link');
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('data-source', link.source);
        line.setAttribute('data-target', link.target);
        line.setAttribute('marker-end', 'url(#partner-arrow)');

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
        if (!this.isMobile || node.type === 'core') {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dy', this.getNodeRadius(node.type) + 20);
            label.setAttribute('class', 'node-label');
            label.setAttribute('font-size', this.isMobile ? '11' : '13');
            label.textContent = this.isMobile && node.type !== 'core' ? '' : node.label;
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
    }

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
        const links = this.contentGroup.querySelectorAll('.partner-link');
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

            // Update visual position with SVG transform
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
        // Zoom buttons with smooth animation
        document.getElementById('partnerZoomIn')?.addEventListener('click', () => this.smoothZoom(1.3));
        document.getElementById('partnerZoomOut')?.addEventListener('click', () => this.smoothZoom(0.7));
        document.getElementById('partnerReset')?.addEventListener('click', () => this.reset());
        document.getElementById('partnerCenter')?.addEventListener('click', () => this.centerView());

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
            if (e.target === this.svg || e.target.closest('#partnerRewardsContent') === this.contentGroup) {
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

        // Handle window resize for mobile adaptation
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;

            // Re-render if mobile state changed
            if (wasMobile !== this.isMobile) {
                this.render();
            }
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
        this.targetScale = this.isMobile ? 0.6 : 1;
        this.targetX = 0;
        this.targetY = 0;
    }

    /**
     * Center view on the core node (You)
     */
    centerView() {
        const coreNode = this.nodes.find(n => n.id === 'you');
        if (!coreNode) return;

        const svgRect = this.svg.getBoundingClientRect();
        this.targetX = svgRect.width / 2 - coreNode.x;
        this.targetY = svgRect.height / 2 - coreNode.y;
        this.targetScale = this.isMobile ? 0.6 : 1;
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

// Initialize partner rewards map when page loads
if (typeof window !== 'undefined') {
    window.partnerRewardsMap = new PartnerRewardsMap();
}
