/* premium-nav.js - Premium Navigation Interactions */

(()=>{
  'use strict';

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initNavigationSwitching();
    initRippleEffect();
    console.log('[premium-nav] Navigation initialized');
  }

  /**
   * Initialize navigation item switching
   * Handles click events and updates active state
   */
  function initNavigationSwitching() {
    const navItems = document.querySelectorAll('.premium-nav-item[data-page]');

    navItems.forEach(item => {
      item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');

        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));

        // Add active class to clicked item
        this.classList.add('active');

        // Trigger page switch via global app if available
        if (window.app && typeof window.app.switchPage === 'function') {
          window.app.switchPage(page);
        }

        console.log('[premium-nav] Switched to page:', page);
      });
    });
  }

  /**
   * Enhanced ripple effect on click
   * Creates a visual ripple animation from click point
   */
  function initRippleEffect() {
    const navItems = document.querySelectorAll('.premium-nav-item');

    navItems.forEach(item => {
      item.addEventListener('mousedown', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
          transform: translate(-50%, -50%);
          animation: ripple-effect 0.6s ease-out;
          pointer-events: none;
          z-index: 1000;
        `;

        this.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });

    // Add ripple animation keyframes
    if (!document.querySelector('#ripple-effect-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-effect-keyframes';
      style.textContent = `
        @keyframes ripple-effect {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Export for debugging
  window.premiumNav = {
    version: '1.0.0'
  };
})();
