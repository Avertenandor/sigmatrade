/**
 * Interactive Mind Map for SigmaTrade - Premium Edition
 * Smooth 60fps animations with requestAnimationFrame
 * Hardware-accelerated transforms
 * Easing functions for buttery smooth interactions
 */

class MindMap extends MindMapCore {
    constructor() {
        super();
    }
}

// Initialize mind map when page loads
if (typeof window !== 'undefined') {
    window.mindMap = new MindMap();
}
