/**
 * Interactive Partner Rewards Mind Map for SigmaTrade
 * Visualizes 3-level referral program: 3% -> 2% -> 5%
 * Smooth 60fps animations with requestAnimationFrame
 * Hardware-accelerated transforms
 * Mobile-optimized for touch interactions
 */

class PartnerRewardsMap extends PartnerRewardsMapCore {
    constructor() {
        super();
    }
}

// Initialize partner rewards map when page loads
if (typeof window !== 'undefined') {
    window.partnerRewardsMap = new PartnerRewardsMap();
}
