/**
 * Login Script - Entry Point
 * Initializes device detection and UI components
 */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const detector = new LoginDetector();
        new LoginUI(detector);
    });
} else {
    const detector = new LoginDetector();
    new LoginUI(detector);
}
