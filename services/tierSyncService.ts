/**
 * Tier Synchronization Service
 * Synchronizes user tier between local savings data and backend authentication
 */

import { logger } from '../utils/logger';
import { savingsService } from './savingsService';

interface TierSyncResponse {
  success: boolean;
  oldTier: string;
  newTier: string;
  totalSavings: number;
}

class TierSyncService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://budget-buddy-backend-6q8z.onrender.com';

  /**
   * Sync user tier with backend based on current savings
   */
  async syncTierWithBackend(accessToken: string): Promise<TierSyncResponse | null> {
    try {
      // Get current savings balance from local data
      const currentBalance = await savingsService.getCurrentBalance();
      
      // Get current tier based on savings
      const currentTierData = await savingsService.getCurrentTier();
      
      logger.info('🔄 Syncing tier with backend', {
        currentBalance,
        currentTier: currentTierData.name
      });

      // Call backend to update tier
      const response = await fetch(`${this.baseUrl}/api/users/tier/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          total_savings: currentBalance
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ Failed to sync tier with backend', {
          status: response.status,
          error: errorText
        });
        return null;
      }

      const result = await response.json();
      
      logger.info('✅ Tier sync successful', {
        oldTier: result.old_tier,
        newTier: result.new_tier,
        totalSavings: result.total_savings
      });

      return {
        success: true,
        oldTier: result.old_tier,
        newTier: result.new_tier,
        totalSavings: result.total_savings
      };

    } catch (error) {
      logger.error('❌ Tier sync error', error);
      return null;
    }
  }

  /**
   * Check if tier sync is needed (local tier different from auth tier)
   */
  async shouldSyncTier(authTier: string): Promise<boolean> {
    try {
      const currentTierData = await savingsService.getCurrentTier();
      const localTier = currentTierData.name;
      
      const needsSync = localTier !== authTier;
      
      if (needsSync) {
        logger.info('🔍 Tier sync needed', {
          authTier,
          localTier,
          needsSync
        });
      }
      
      return needsSync;
    } catch (error) {
      logger.error('❌ Error checking tier sync status', error);
      return false;
    }
  }

  /**
   * Get the correct tier based on savings amount
   */
  calculateTierFromSavings(totalSavings: number): string {
    const tierThresholds = [
      { threshold: 10000, name: 'Elite Saver' },
      { threshold: 5000, name: 'Diamond Saver' },
      { threshold: 2500, name: 'Platinum Saver' },
      { threshold: 1000, name: 'Gold Saver' },
      { threshold: 500, name: 'Silver Saver' },
      { threshold: 100, name: 'Bronze Saver' },
      { threshold: 0, name: 'Starter' }
    ];

    for (const tier of tierThresholds) {
      if (totalSavings >= tier.threshold) {
        return tier.name;
      }
    }

    return 'Starter';
  }
}

// Export singleton instance
export const tierSyncService = new TierSyncService();
export default tierSyncService;