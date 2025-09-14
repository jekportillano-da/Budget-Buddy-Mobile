import { databaseService } from './databaseService';
import type { SavingsEntry, UserAchievement, UserPreference } from './databaseService';

/**
 * Savings Service - Higher-level business logic for Phase 2 gamified savings
 * Coordinates between database, gamification, and UI layers
 */
export class SavingsService {
  constructor() {
    // Use singleton database service instance
  }

  // ================================
  // Savings Entry Operations
  // ================================

  /**
   * Add a new savings entry with automatic tier checking
   */
  async addSavingsEntry(
    amount: number,
    entryType: 'deposit' | 'withdrawal',
    label?: string,
    purpose?: string,
    date?: string
  ): Promise<{ entryId: number; newAchievements: UserAchievement[] }> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      
      // Save the entry
      const entryId = await databaseService.saveSavingsEntry({
        amount: entryType === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount),
        entry_type: entryType,
        label,
        purpose,
        date_entered: date || new Date().toISOString(),
        synced: false
      });

      // Check for new achievements after adding entry
      const newAchievements = await this.checkAndAwardAchievements();

      console.log('✅ Savings entry added successfully:', { entryId, newAchievements: newAchievements.length });
      return { entryId, newAchievements };
    } catch (error) {
      console.error('❌ Error adding savings entry:', error);
      throw error;
    }
  }

  /**
   * Get recent savings entries with calculated balances
   */
  async getSavingsHistory(limit: number = 50): Promise<SavingsEntry[]> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      return await databaseService.getSavingsEntries(limit);
    } catch (error) {
      console.error('❌ Error getting savings history:', error);
      throw error;
    }
  }

  /**
   * Get current total savings balance
   */
  async getCurrentBalance(): Promise<number> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      return await databaseService.getTotalSavings();
    } catch (error) {
      console.error('❌ Error getting current balance:', error);
      throw error;
    }
  }

  // ================================
  // Gamification & Tier System
  // ================================

  /**
   * Check current savings against tier thresholds and award achievements
   */
  async checkAndAwardAchievements(): Promise<UserAchievement[]> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      
      const currentSavings = await this.getCurrentBalance();
      const existingAchievements = await databaseService.getUserAchievements();
      const newAchievements: UserAchievement[] = [];

      // Define tier thresholds (configurable in future)
      const tiers = [
        { threshold: 100, name: 'Bronze Saver', type: 'tier' },
        { threshold: 500, name: 'Silver Saver', type: 'tier' },
        { threshold: 1000, name: 'Gold Saver', type: 'tier' },
        { threshold: 2500, name: 'Platinum Saver', type: 'tier' },
        { threshold: 5000, name: 'Diamond Saver', type: 'tier' },
        { threshold: 10000, name: 'Elite Saver', type: 'tier' }
      ];

      // Check milestone achievements
      const milestones = [
        { threshold: 50, name: 'First Steps', type: 'milestone' },
        { threshold: 250, name: 'Quarter Master', type: 'milestone' },
        { threshold: 750, name: 'Three Quarter Hero', type: 'milestone' },
        { threshold: 1500, name: 'Steady Climber', type: 'milestone' },
        { threshold: 3000, name: 'Savings Champion', type: 'milestone' },
        { threshold: 7500, name: 'Financial Wizard', type: 'milestone' }
      ];

      // Combine all achievement types
      const allAchievements = [...tiers, ...milestones];

      for (const achievement of allAchievements) {
        if (currentSavings >= achievement.threshold) {
          // Check if this achievement already exists
          const exists = existingAchievements.some(
            (existing: UserAchievement) => existing.achievement_name === achievement.name
          );

          if (!exists) {
            // Award new achievement
            const newAchievement: UserAchievement = {
              id: 0, // Will be set by database
              achievement_type: achievement.type as 'tier' | 'milestone',
              achievement_name: achievement.name,
              achieved_at: new Date().toISOString(),
              total_savings_at_achievement: currentSavings,
              is_active: true,
              created_at: new Date().toISOString()
            };

            await databaseService.saveAchievement(newAchievement);
            newAchievements.push(newAchievement);

            // Unlock theme for tier achievements
            if (achievement.type === 'tier') {
              await this.unlockThemeForTier(achievement.name);
            }
          }
        }
      }

      console.log('✅ Achievement check completed:', { newAchievements: newAchievements.length });
      return newAchievements;
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Get current user tier based on savings
   */
  async getCurrentTier(): Promise<{ 
    name: string; 
    threshold: number; 
    progress: number; 
    nextTier?: { name: string; threshold: number } 
  }> {
    try {
      const currentSavings = await this.getCurrentBalance();
      
      const tiers = [
        { threshold: 0, name: 'Starter' },
        { threshold: 100, name: 'Bronze Saver' },
        { threshold: 500, name: 'Silver Saver' },
        { threshold: 1000, name: 'Gold Saver' },
        { threshold: 2500, name: 'Platinum Saver' },
        { threshold: 5000, name: 'Diamond Saver' },
        { threshold: 10000, name: 'Elite Saver' }
      ];

      let currentTier = tiers[0];
      let nextTier: { threshold: number; name: string } | undefined = tiers[1];

      for (let i = 0; i < tiers.length; i++) {
        if (currentSavings >= tiers[i].threshold) {
          currentTier = tiers[i];
          nextTier = i + 1 < tiers.length ? tiers[i + 1] : undefined;
        } else {
          break;
        }
      }

      const progress = nextTier 
        ? ((currentSavings - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
        : 100;

      console.log('✅ Current tier calculated:', { currentTier: currentTier.name, progress });
      return {
        name: currentTier.name,
        threshold: currentTier.threshold,
        progress: Math.min(100, Math.max(0, progress)),
        nextTier
      };
    } catch (error) {
      console.error('❌ Error getting current tier:', error);
      throw error;
    }
  }

  // ================================
  // Theme & Customization
  // ================================

  /**
   * Unlock theme for achieving tier
   */
  private async unlockThemeForTier(tierName: string): Promise<void> {
    try {
      const themeMap: { [key: string]: string } = {
        'Bronze Saver': 'bronze_theme',
        'Silver Saver': 'silver_theme',
        'Gold Saver': 'gold_theme',
        'Platinum Saver': 'platinum_theme',
        'Diamond Saver': 'diamond_theme',
        'Elite Saver': 'elite_theme'
      };

      const themeKey = themeMap[tierName];
      if (themeKey) {
        await databaseService.saveUserPreference({
          preference_type: 'theme',
          preference_key: themeKey,
          preference_value: themeKey,
          unlocked_at: new Date().toISOString(),
          is_active: false // User needs to manually activate
        });

        console.log('✅ Theme unlocked for tier:', { tierName, themeKey });
      }
    } catch (error) {
      console.error('❌ Error unlocking theme:', error);
      throw error;
    }
  }

  /**
   * Get all unlocked themes
   */
  async getUnlockedThemes(): Promise<UserPreference[]> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      return await databaseService.getUserPreferences('theme');
    } catch (error) {
      console.error('❌ Error getting unlocked themes:', error);
      throw error;
    }
  }

  /**
   * Activate a theme
   */
  async activateTheme(themeKey: string): Promise<void> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      
      const unlockedThemes = await this.getUnlockedThemes();
      const themeExists = unlockedThemes.some(theme => theme.preference_key === themeKey);

      if (!themeExists && themeKey !== 'default') {
        throw new Error('Theme not unlocked');
      }

      await databaseService.saveUserPreference({
        preference_type: 'theme',
        preference_key: themeKey,
        preference_value: themeKey,
        is_active: true
      });

      console.log('✅ Theme activated:', themeKey);
    } catch (error) {
      console.error('❌ Error activating theme:', error);
      throw error;
    }
  }

  /**
   * Get currently active theme
   */
  async getActiveTheme(): Promise<string> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      return await databaseService.getActiveTheme();
    } catch (error) {
      console.error('❌ Error getting active theme:', error);
      return 'default';
    }
  }

  // ================================
  // Statistics & Analytics
  // ================================

  /**
   * Get savings statistics for insights
   */
  async getSavingsStats(): Promise<{
    totalSavings: number;
    totalEntries: number;
    averageEntry: number;
    currentTier: string;
    achievements: UserAchievement[];
    weeklyAverage: number;
    monthlyAverage: number;
  }> {
    try {
      const totalSavings = await this.getCurrentBalance();
      const entries = await this.getSavingsHistory(1000); // Get more for calculations
      const achievements = await databaseService.getUserAchievements();
      const tier = await this.getCurrentTier();

      // Calculate averages
      const totalEntries = entries.length;
      const averageEntry = totalEntries > 0 ? totalSavings / totalEntries : 0;

      // Calculate weekly/monthly averages (simplified)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyEntries = entries.filter(entry => {
        const entryDate = entry.created_at ? new Date(entry.created_at) : null;
        return entryDate && entryDate >= oneWeekAgo;
      });
      
      const monthlyEntries = entries.filter(entry => {
        const entryDate = entry.created_at ? new Date(entry.created_at) : null;
        return entryDate && entryDate >= oneMonthAgo;
      });

      const weeklySum = weeklyEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const monthlySum = monthlyEntries.reduce((sum, entry) => sum + entry.amount, 0);

      const weeklyAverage = weeklySum / 7; // Per day
      const monthlyAverage = monthlySum / 30; // Per day

      const stats = {
        totalSavings,
        totalEntries,
        averageEntry,
        currentTier: tier.name,
        achievements,
        weeklyAverage,
        monthlyAverage
      };

      console.log('✅ Savings stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting savings stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const savingsService = new SavingsService();
