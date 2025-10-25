/**
 * Interactive MEV Bot Map for SigmaTrade
 * Visualizes how the MEV bot works using sandwich attacks
 * Shows: Mempool Monitoring → Target Detection → Front-run → Victim TX → Back-run → Profit
 * MEV = Maximal Extractable Value through sandwich attack strategy
 */

class MevBotMap extends MevBotMapCore {
    constructor() {
        super();
    }
}

// Initialize MEV bot map when needed
if (typeof window !== 'undefined') {
    window.mevBotMap = new MevBotMap();
}
