// SigmaTrade Application v10.1.0 - Multi-Wallet Fixed
// Main Entry Point - Loads modular components

class SigmaTrade extends SigmaTradeCore {
    constructor() {
        super();
        this.init();
    }

    async copyToClipboard(text, event) {
        // Prevent tx-item click event
        if (event) {
            event.stopPropagation();
        }

        try {
            await navigator.clipboard.writeText(text);

            // Show toast notification
            if (window.showToast) {
                showToast('✅ Хеш скопирован в буфер обмена!', 'success');
            }

            // Visual feedback on button
            if (event && event.currentTarget) {
                const btn = event.currentTarget;
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '✓';
                btn.style.background = 'var(--accent-success)';

                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                }, 1500);
            }
        } catch (error) {
            this.log('Failed to copy to clipboard', 'error');
            if (window.showToast) {
                showToast('❌ Ошибка копирования', 'error');
            }
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SigmaTrade();

    // Export to window for footer navigation
    window.app = app;

    // Initialize email copy buttons
    initEmailCopyButtons();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Page hidden - pausing updates');
    } else {
        console.log('▶️ Page visible - resuming updates');
        if (app && app.getCurrentWallet()?.address) {
            const lastUpdate = app.cache.get('all_balances')?.timestamp || 0;
            if (Date.now() - lastUpdate > 120000) {
                app.debouncedRefreshData();
            }
        }
    }
});

// ✉️ Email Copy Functionality
function initEmailCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-email-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = button.getAttribute('data-email');

            try {
                // Copy to clipboard
                await navigator.clipboard.writeText(email);

                // Visual feedback
                button.classList.add('copied');

                // Show toast notification
                if (window.showToast) {
                    showToast(`📧 Email скопирован: ${email}`, 'success');
                }

                // Reset button state after animation
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 500);

            } catch (err) {
                console.error('Failed to copy email:', err);

                // Fallback method
                fallbackCopyEmail(email, button);
            }
        });
    });
}

// Fallback copy method for older browsers
function fallbackCopyEmail(email, button) {
    const textArea = document.createElement('textarea');
    textArea.value = email;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        button.classList.add('copied');

        if (window.showToast) {
            showToast(`📧 Email скопирован: ${email}`, 'success');
        }

        setTimeout(() => {
            button.classList.remove('copied');
        }, 500);
    } catch (err) {
        console.error('Fallback copy failed:', err);
        if (window.showToast) {
            showToast('❌ Не удалось скопировать email', 'error');
        }
    } finally {
        document.body.removeChild(textArea);
    }
}
