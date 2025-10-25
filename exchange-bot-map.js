/**
 * Interactive Exchange Bot Map for SigmaTrade
 * Visualizes how the exchange bot works: exchanges, commissions, and participant rewards
 * Shows: Exchange Process → Commission (0.1-0.8%) → Distribution to Participants
 * IMPORTANT WARNING: Direct deposits without interview = permanent loss
 */

class ExchangeBotMap extends ExchangeBotMapCore {
    constructor() {
        super();
    }
}

// Initialize exchange bot map when needed
if (typeof window !== 'undefined') {
    window.exchangeBotMap = new ExchangeBotMap();
}
