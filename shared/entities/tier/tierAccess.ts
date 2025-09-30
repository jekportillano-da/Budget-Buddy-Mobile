/**
 * Tier Access Logic
 * Centralized tier-based feature access and limits
 */

export const TIER_LEVELS = {
  'Starter': 0,
  'Bronze Saver': 1,
  'Silver Saver': 2,
  'Gold Saver': 3,
  'Platinum Saver': 4,
  'Diamond Saver': 5,
  'Elite Saver': 6,
} as const;

export const TIER_THRESHOLDS = {
  'Starter': 0,
  'Bronze Saver': 100,
  'Silver Saver': 500,
  'Gold Saver': 1000,
  'Platinum Saver': 2500,
  'Diamond Saver': 5000,
  'Elite Saver': 10000,
} as const;

export type TierName = keyof typeof TIER_LEVELS;

export interface TierLimits {
  aiRequestsPerDay: number;
  aiChatEnabled: boolean;
  premiumInsights: boolean;
  advancedCharts: boolean;
  exportData: boolean;
}

/**
 * Get numeric tier level for comparison
 */
export function getTierLevel(tierName: string): number {
  return TIER_LEVELS[tierName as TierName] || 0;
}

/**
 * Get tier threshold amount
 */
export function getTierThreshold(tierName: string): number {
  return TIER_THRESHOLDS[tierName as TierName] || 0;
}

/**
 * Check if user can use AI features (Bronze tier or higher)
 */
export function canUseAI(tierName: string): boolean {
  return getTierLevel(tierName) >= TIER_LEVELS['Bronze Saver'];
}

/**
 * Check if user has premium insights access (Gold tier or higher)
 */
export function hasPremiumInsights(tierName: string): boolean {
  return getTierLevel(tierName) >= TIER_LEVELS['Gold Saver'];
}

/**
 * Check if user has unlimited AI access (Platinum tier or higher)
 */
export function hasUnlimitedAI(tierName: string): boolean {
  return getTierLevel(tierName) >= TIER_LEVELS['Platinum Saver'];
}

/**
 * Get tier-based limits and features
 */
export function limitsFor(tierName: string): TierLimits {
  const level = getTierLevel(tierName);
  
  return {
    aiRequestsPerDay: level >= 4 ? -1 : Math.max(0, level * 5), // -1 means unlimited
    aiChatEnabled: level >= 1,
    premiumInsights: level >= 3,
    advancedCharts: level >= 2,
    exportData: level >= 2,
  };
}

/**
 * Get tier feature description text
 */
export function getTierFeatureText(tierName: string): string {
  const level = getTierLevel(tierName);
  
  if (level >= 4) return '🌟 Unlimited AI features available!';
  if (level >= 3) return '⭐ Advanced insights unlocked! Upgrade to Platinum for unlimited access.';
  if (level >= 2) return '✨ Premium features available! Upgrade to Gold for advanced insights.';
  if (level >= 1) return '💫 Basic AI chat unlocked! Upgrade to Silver for more features.';
  return '🔒 Save more to unlock advanced AI features!';
}

/**
 * Get minimum tier required for a feature
 */
export function getMinimumTierFor(feature: keyof TierLimits): TierName {
  switch (feature) {
    case 'aiChatEnabled':
      return 'Bronze Saver';
    case 'advancedCharts':
    case 'exportData':
      return 'Silver Saver'; 
    case 'premiumInsights':
      return 'Gold Saver';
    case 'aiRequestsPerDay':
      return 'Platinum Saver'; // For unlimited
    default:
      return 'Starter';
  }
}

/**
 * Calculate how much more savings needed to reach next tier
 */
export function getSavingsNeededForNextTier(currentSavings: number, currentTierName: string): {
  nextTier: TierName | null;
  amountNeeded: number;
} {
  const tierNames = Object.keys(TIER_THRESHOLDS) as TierName[];
  const currentLevel = getTierLevel(currentTierName);
  
  for (const tierName of tierNames) {
    const tierLevel = getTierLevel(tierName);
    const threshold = getTierThreshold(tierName);
    
    if (tierLevel > currentLevel && currentSavings < threshold) {
      return {
        nextTier: tierName,
        amountNeeded: threshold - currentSavings,
      };
    }
  }
  
  return {
    nextTier: null,
    amountNeeded: 0,
  };
}

/**
 * Get all tiers in order with their thresholds
 */
export function getAllTiers(): Array<{ name: TierName; threshold: number; level: number }> {
  return Object.entries(TIER_THRESHOLDS).map(([name, threshold]) => ({
    name: name as TierName,
    threshold,
    level: getTierLevel(name),
  })).sort((a, b) => a.level - b.level);
}

/**
 * Get emoji representation for a tier
 */
export function getTierEmoji(tierName: string): string {
  const tierEmojis: Record<TierName, string> = {
    'Starter': '🥉',
    'Bronze Saver': '🥉',
    'Silver Saver': '🥈', 
    'Gold Saver': '🥇',
    'Platinum Saver': '💎',
    'Diamond Saver': '💎',
    'Elite Saver': '👑'
  };
  return tierEmojis[tierName as TierName] || '🏆';
}