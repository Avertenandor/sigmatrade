// virtual-scroll.js - Virtual Scrolling Manager v4.1.0
class VirtualScroll {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.visibleItems = [];
        this.startIndex = 0;
        this.endIndex = 0;
        this.buffer = 5;
        
        this.viewport = null;
        this.content = null;
        this.scrollLoader = null;
        
        this.init();
    }
    
    init() {
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.cssText = `
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
        `;
        
        this.content = document.createElement('div');
        this.content.className = 'virtual-scroll-content';
        this.content.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        this.viewport.appendChild(this.content);
        this.container.appendChild(this.viewport);
        
        this.viewport.addEventListener('scroll', () => this.onScroll());
        window.addEventListener('resize', () => this.update());
    }
    
    setItems(items) {
        this.items = items;
        
        const totalHeight = items.length * this.itemHeight;
        this.content.style.height = totalHeight + 'px';
        
        this.update();
    }
    
    onScroll() {
        this.update();
        
        if (this.scrollLoader && this.onScrollEnd) {
            const scrollTop = this.viewport.scrollTop;
            const scrollHeight = this.viewport.scrollHeight;
            const clientHeight = this.viewport.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 500) {
                this.onScrollEnd();
            }
        }
    }
    
    update() {
        const scrollTop = this.viewport.scrollTop;
        const viewportHeight = this.viewport.clientHeight;
        
        this.startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
        this.endIndex = Math.min(
            this.items.length,
            Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.buffer
        );
        
        this.visibleItems = this.items.slice(this.startIndex, this.endIndex);
        
        this.render();
    }
    
    render() {
        const fragment = document.createDocumentFragment();
        const offsetY = this.startIndex * this.itemHeight;
        
        this.visibleItems.forEach((item, index) => {
            const element = this.renderItem(item, this.startIndex + index);
            element.style.cssText = `
                position: absolute;
                top: ${offsetY + (index * this.itemHeight)}px;
                width: 100%;
                left: 0;
                box-sizing: border-box;
            `;
            
            fragment.appendChild(element);
        });
        
        this.content.innerHTML = '';
        this.content.appendChild(fragment);
        
        if (this.scrollLoader) {
            this.content.appendChild(this.scrollLoader);
        }
    }
    
    attachScrollLoader(loaderElement) {
        this.scrollLoader = loaderElement;
        if (this.content) {
            this.content.appendChild(this.scrollLoader);
        }
    }
    
    setScrollEndCallback(callback) {
        this.onScrollEnd = callback;
    }
    
    destroy() {
        if (this.viewport) {
            this.viewport.removeEventListener('scroll', this.onScroll);
        }
        window.removeEventListener('resize', this.update);
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.viewport = null;
        this.content = null;
        this.items = [];
    }
    
    getViewport() {
        return this.viewport;
    }
    
    scrollToTop() {
        if (this.viewport) {
            this.viewport.scrollTop = 0;
        }
    }
}
