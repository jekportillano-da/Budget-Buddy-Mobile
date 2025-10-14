import { create } from 'zustand';
import { savingsService } from '../services/savingsService';
import type { SavingsEntry, UserAchievement, UserPreference } from '../services/databaseService';

interface SavingsState {
  // Core savings data
  currentBalance: number;
  savingsHistory: SavingsEntry[];
  isLoading: boolean;
  error: string | null;

  // Gamification
  currentTier: {
    name: string;
    threshold: number;
    progress: number;
    nextTier?: { name: string; threshold: number };
  };
  achievements: UserAchievement[];
  unlockedThemes: UserPreference[];
  activeTheme: string;

  // Statistics
  stats: {
    totalSavings: number;
    totalEntries: number;
    averageEntry: number;
    currentTier: string;
    achievements: UserAchievement[];
    weeklyAverage: number;
    monthlyAverage: number;
  } | null;

  // Actions
  addSavingsEntry: (
    amount: number,
    entryType: 'deposit' | 'withdrawal',
    label?: string,
    purpose?: string,
    date?: string
  ) => Promise<{ success: boolean; newAchievements: UserAchievement[] }>;
  
  loadSavingsData: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshHistory: (limit?: number) => Promise<void>;
  refreshTier: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  refreshThemes: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  activateTheme: (themeKey: string) => Promise<boolean>;
  syncTierWithAuth: () => Promise<void>;
  
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  // Initial state
  currentBalance: 0,
  savingsHistory: [],
  isLoading: false,
  error: null,
  
  currentTier: {
    name: 'Starter',
    threshold: 0,
    progress: 0,
    nextTier: { name: 'Bronze Saver', threshold: 100 }
  },
  achievements: [],
  unlockedThemes: [],
  activeTheme: 'default',
  stats: null,

  // Actions
  addSavingsEntry: async (amount, entryType, label, purpose, date) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await savingsService.addSavingsEntry(amount, entryType, label, purpose, date);
      
      // Refresh relevant data after adding entry
      await Promise.all([
        get().refreshBalance(),
        get().refreshHistory(),
        get().refreshTier(),
        get().refreshAchievements(),
        get().refreshThemes()
      ]);

      set({ isLoading: false });
      
      return { success: true, newAchievements: result.newAchievements };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add savings entry';
      set({ error: errorMessage, isLoading: false });
      console.error('❌ Error adding savings entry:', error);
      return { success: false, newAchievements: [] };
    }
  },

  loadSavingsData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await Promise.all([
        get().refreshBalance(),
        get().refreshHistory(),
        get().refreshTier(),
        get().refreshAchievements(),
        get().refreshThemes(),
        get().refreshStats()
      ]);

      // Load active theme
      const activeTheme = await savingsService.getActiveTheme();
      set({ activeTheme, isLoading: false });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load savings data';
      set({ error: errorMessage, isLoading: false });
      console.error('❌ Error loading savings data:', error);
    }
  },

  refreshBalance: async () => {
    try {
      const currentBalance = await savingsService.getCurrentBalance();
      set({ currentBalance });
    } catch (error) {
      console.error('❌ Error refreshing balance:', error);
      throw error;
    }
  },

  refreshHistory: async (limit = 50) => {
    try {
      const savingsHistory = await savingsService.getSavingsHistory(limit);
      set({ savingsHistory });
    } catch (error) {
      console.error('❌ Error refreshing history:', error);
      throw error;
    }
  },

  refreshTier: async () => {
    try {
      const currentTier = await savingsService.getCurrentTier();
      set({ currentTier });
    } catch (error) {
      console.error('❌ Error refreshing tier:', error);
      throw error;
    }
  },

  refreshAchievements: async () => {
    try {
      const achievements = await savingsService.checkAndAwardAchievements();
      // Also get existing achievements
      const stats = await savingsService.getSavingsStats();
      set({ achievements: stats.achievements });
    } catch (error) {
      console.error('❌ Error refreshing achievements:', error);
      throw error;
    }
  },

  refreshThemes: async () => {
    try {
      const unlockedThemes = await savingsService.getUnlockedThemes();
      set({ unlockedThemes });
    } catch (error) {
      console.error('❌ Error refreshing themes:', error);
      throw error;
    }
  },

  refreshStats: async () => {
    try {
      const stats = await savingsService.getSavingsStats();
      set({ stats });
    } catch (error) {
      console.error('❌ Error refreshing stats:', error);
      throw error;
    }
  },

  activateTheme: async (themeKey: string) => {
    try {
      await savingsService.activateTheme(themeKey);
      set({ activeTheme: themeKey });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate theme';
      set({ error: errorMessage });
      console.error('❌ Error activating theme:', error);
      return false;
    }
  },

  syncTierWithAuth: async () => {
    try {
      // Delay import to avoid circular dependency
      const authStoreModule = require('./authStore');
      const authStore = authStoreModule.useAuthStore.getState();
      
      if (authStore.isAuthenticated && authStore.tokens) {
        await authStore.syncTierAfterLogin();
        console.log('✅ Tier synced with auth store');
      } else {
        console.log('⚠️ Cannot sync tier: User not authenticated');
      }
    } catch (error) {
      console.error('❌ Error syncing tier with auth:', error);
      // Don't throw - this is a background operation
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));
