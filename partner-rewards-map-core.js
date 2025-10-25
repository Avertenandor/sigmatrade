/**
 * Partner Rewards Map Core Module
 * Handles: Initialization, Data Setup, Animation Loop, Transforms
 */

class PartnerRewardsMapCore {
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

        // Delegate rendering to render module
        if (window.PartnerRewardsMapRender) {
            window.PartnerRewardsMapRender.render(this);
            window.PartnerRewardsMapRender.setupEventListeners(this);
        }

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

// Export to window for global access
if (typeof window !== 'undefined') {
    window.PartnerRewardsMapCore = PartnerRewardsMapCore;
}
