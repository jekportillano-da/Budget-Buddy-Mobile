/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Budget store for managing budget data and calculations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { budgetService } from '../services/budgetService';
import { databaseService } from '../services/databaseService';
import { logger } from '../utils/logger';

export interface BudgetBreakdown {
  categories: Record<string, number>;
  total_essential: number;
  total_savings: number;
}

export interface SavingsForecast {
  monthly_projections: number[];
  emergency_fund_progress: number;
  what_if_scenarios: Record<string, number>;
}

export interface BudgetInsights {
  health_score: number;
  status: 'excellent' | 'on_track' | 'needs_improvement';
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
  recommendations: string[];
}

interface BudgetState {
  // Current state
  currentBudget: number | null;
  duration: 'daily' | 'weekly' | 'monthly';
  breakdown: BudgetBreakdown | null;
  savingsForecast: SavingsForecast | null;
  insights: BudgetInsights | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Offline state
  isOffline: boolean;
  pendingSync: any[];
  
  // Actions
  calculateBudget: (amount: number, duration: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  getSavingsForecast: () => Promise<void>;
  getInsights: () => Promise<void>;
  syncData: () => Promise<void>;
  setOfflineStatus: (offline: boolean) => void;
  clearError: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBudget: null,
      duration: 'monthly',
      breakdown: null,
      savingsForecast: null,
      insights: null,
      isLoading: false,
      error: null,
      isOffline: false,
      pendingSync: [],

      // Calculate budget breakdown
      calculateBudget: async (amount: number, duration: 'daily' | 'weekly' | 'monthly') => {
        set({ isLoading: true, error: null });
        
        try {
          logger.debug('Calculating budget', { amount, duration });
          
          // Use offline calculation first (simpler and more reliable)
          const breakdown = budgetService.calculateBudgetOffline(amount, duration);
          logger.debug('Budget breakdown calculated', { breakdown });
          
          // Try to save to database (don't fail if it doesn't work)
          try {
            await databaseService.init();
            await databaseService.saveBudgetRecord(
              amount,
              duration,
              breakdown,
              {},
              {}
            );
          } catch (dbError) {
            logger.warn('Database save failed', { error: dbError });
            // Continue without database - app should still work
          }
          
          set({ 
            currentBudget: amount, 
            duration, 
            breakdown,
            isLoading: false 
          });
        } catch (error) {
          logger.error('Budget calculation error', { error });
          set({ 
            error: error instanceof Error ? error.message : 'Failed to calculate budget',
            isLoading: false 
          });
        }
      },

      // Get savings forecast
      getSavingsForecast: async () => {
        const { breakdown, isOffline } = get();
        if (!breakdown) return;

        try {
          if (!isOffline) {
            try {
              const forecast = await budgetService.getSavingsForecast(
                breakdown.total_savings,
                breakdown.categories.emergency_fund || 0,
                50000 // default goal
              );
              
              set({ savingsForecast: forecast });
              return;
            } catch (error) {
              logger.debug('Online forecast failed, falling back to offline');
            }
          }
          
          // Offline calculation
          const forecast = budgetService.calculateSavingsForecastOffline(breakdown);
          set({ savingsForecast: forecast });
          
        } catch (error) {
          logger.error('Savings forecast error', { error });
        }
      },

      // Get AI insights
      getInsights: async () => {
        const { breakdown, savingsForecast, isOffline } = get();
        if (!breakdown || !savingsForecast) return;

        try {
          if (!isOffline) {
            try {
              const insights = await budgetService.getInsights(breakdown, savingsForecast);
              set({ insights });
              return;
            } catch (error) {
              logger.debug('Online insights failed, falling back to offline');
            }
          }
          
          // Offline insights calculation
          const insights = budgetService.calculateInsightsOffline(breakdown, savingsForecast);
          set({ insights });
          
        } catch (error) {
          logger.error('Insights error', { error });
        }
      },

      // Sync data when back online
      syncData: async () => {
        const { pendingSync, isOffline } = get();
        if (isOffline || pendingSync.length === 0) return;

        try {
          // Sync pending calculations
          for (const item of pendingSync) {
            if (item.type === 'budget') {
              await budgetService.calculateBudget(item.data.amount, item.data.duration);
            }
            // Add other sync types as needed
          }
          
          set({ pendingSync: [] });
        } catch (error) {
          logger.error('Sync failed', { error });
        }
      },

      setOfflineStatus: (offline: boolean) => {
        set({ isOffline: offline });
        if (!offline) {
          // Trigger sync when coming back online
          get().syncData();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'budget-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data, not UI state
      partialize: (state: BudgetState) => ({
        currentBudget: state.currentBudget,
        duration: state.duration,
        breakdown: state.breakdown,
        savingsForecast: state.savingsForecast,
        insights: state.insights,
        pendingSync: state.pendingSync,
      }),
    }
  )
);
