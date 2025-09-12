import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  // Personal Information
  fullName: string;
  contactNumber: string;
  email: string;
  address: string;
  location: 'ncr' | 'province';
  
  // Employment Information
  employmentStatus: 'employed' | 'self_employed' | 'freelancer' | 'student' | 'unemployed' | 'retired';
  monthlyGrossIncome: number;
  monthlyNetIncome: number;
  
  // Family Information
  hasSpouse: boolean;
  spouseIncome?: number;
  numberOfDependents: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: 'PHP';
  notifications: boolean;
  syncEnabled: boolean;
  lastSyncDate?: string;
}

interface UserState {
  // Profile state
  profile: UserProfile | null;
  settings: AppSettings;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  totalHouseholdIncome: number;
  
  // Actions
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  calculateRecommendedBudget: () => {
    needs: number;
    wants: number;
    savings: number;
  };
  
  // Philippines-specific helpers
  getRegionalData: () => {
    minimumWage: number;
    averageCost: {
      utilities: { min: number; max: number };
      rent: { min: number; max: number };
      food: { min: number; max: number };
    };
    taxBracket: string;
  };
  
  // Sync actions
  syncProfile: () => Promise<void>;
  clearError: () => void;
}

// Philippines regional data
const PHILIPPINES_DATA = {
  ncr: {
    minimumWage: 645, // per day
    averageCost: {
      utilities: { min: 3500, max: 5000 },
      rent: { min: 15000, max: 35000 },
      food: { min: 8000, max: 15000 },
    },
    taxBracket: 'Standard',
  },
  province: {
    minimumWage: 450, // average provincial minimum wage
    averageCost: {
      utilities: { min: 2500, max: 4000 },
      rent: { min: 8000, max: 18000 },
      food: { min: 6000, max: 12000 },
    },
    taxBracket: 'Standard',
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      settings: {
        currency: 'PHP',
        notifications: true,
        syncEnabled: true,
      },
      isLoading: false,
      error: null,
      totalHouseholdIncome: 0,

      // Actions
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentProfile = get().profile;
          const now = new Date().toISOString();
          
          const updatedProfile: UserProfile = {
            // Default values
            fullName: '',
            contactNumber: '',
            email: '',
            address: '',
            location: 'ncr',
            employmentStatus: 'employed',
            monthlyGrossIncome: 0,
            monthlyNetIncome: 0,
            hasSpouse: false,
            numberOfDependents: 0,
            createdAt: currentProfile?.createdAt || now,
            updatedAt: now,
            
            // Current profile data
            ...currentProfile,
            
            // New updates
            ...profileData,
          };

          const totalHouseholdIncome = updatedProfile.monthlyNetIncome + (updatedProfile.spouseIncome || 0);

          set({
            profile: updatedProfile,
            totalHouseholdIncome,
            isLoading: false,
          });

          // TODO: Sync with backend
          console.log('Profile updated:', updatedProfile);
          
        } catch (error) {
          set({
            error: 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      clearProfile: () => {
        set({
          profile: null,
          totalHouseholdIncome: 0,
          error: null,
        });
      },

      updateSettings: (newSettings) => {
        const currentSettings = get().settings;
        set({
          settings: {
            ...currentSettings,
            ...newSettings,
            lastSyncDate: newSettings.syncEnabled ? new Date().toISOString() : currentSettings.lastSyncDate,
          },
        });
      },

      calculateRecommendedBudget: () => {
        const state = get();
        const income = state.totalHouseholdIncome || state.profile?.monthlyNetIncome || 0;
        
        // 50/30/20 rule adjusted for Philippines context
        const needs = income * 0.6; // Higher percentage for needs due to cost of living
        const wants = income * 0.25; // Slightly lower wants
        const savings = income * 0.15; // Adjusted savings rate
        
        return { needs, wants, savings };
      },

      getRegionalData: () => {
        const profile = get().profile;
        const location = profile?.location || 'ncr';
        return PHILIPPINES_DATA[location];
      },

      syncProfile: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Implement actual sync with backend
          await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
          
          set({
            isLoading: false,
            settings: {
              ...get().settings,
              lastSyncDate: new Date().toISOString(),
            },
          });
        } catch (error) {
          set({
            error: 'Failed to sync profile',
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        settings: state.settings,
        totalHouseholdIncome: state.totalHouseholdIncome,
      }),
    }
  )
);
