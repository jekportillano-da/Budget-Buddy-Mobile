import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseService';
import { logger } from '../utils/logger';

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
  loadProfile: (userId: string) => Promise<void>;
  saveProfile: () => Promise<void>;
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

          // Auto-save to Supabase if sync is enabled
          const state = get();
          if (state.settings.syncEnabled) {
            try {
              await state.saveProfile();
              logger.info('[INFO] Profile auto-saved to Supabase');
            } catch (saveError) {
              logger.warn('[WARN] Auto-save failed, will retry on next sync', saveError);
              // Don't throw error here - profile was updated locally successfully
            }
          }
          
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

      // Load profile from Supabase for authenticated user
      loadProfile: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          logger.info('[INFO] Loading user profile from Supabase', { userId });
          
          // Load user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw profileError;
          }

          // Load app settings
          const { data: settingsData, error: settingsError } = await supabase
            .from('app_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (settingsError && settingsError.code !== 'PGRST116') {
            throw settingsError;
          }

          // Convert database format to app format
          const profile: UserProfile | null = profileData ? {
            fullName: profileData.full_name,
            contactNumber: profileData.contact_number || '',
            email: profileData.email,
            address: profileData.address || '',
            location: profileData.location as 'ncr' | 'province',
            employmentStatus: profileData.employment_status as UserProfile['employmentStatus'],
            monthlyGrossIncome: Number(profileData.monthly_gross_income) || 0,
            monthlyNetIncome: Number(profileData.monthly_net_income) || 0,
            hasSpouse: profileData.has_spouse,
            spouseIncome: profileData.spouse_income ? Number(profileData.spouse_income) : undefined,
            numberOfDependents: profileData.number_of_dependents,
            createdAt: profileData.created_at,
            updatedAt: profileData.updated_at,
          } : null;

          const settings: AppSettings = settingsData ? {
            currency: 'PHP', // Always PHP for our app
            notifications: settingsData.notifications,
            syncEnabled: settingsData.sync_enabled,
            lastSyncDate: settingsData.last_sync_date,
          } : {
            currency: 'PHP',
            notifications: true,
            syncEnabled: true,
          };

          const totalHouseholdIncome = (profile?.monthlyNetIncome || 0) + (profile?.spouseIncome || 0);

          set({
            profile,
            settings,
            totalHouseholdIncome,
            isLoading: false,
          });

          logger.info('[INFO] Profile loaded successfully from Supabase');
        } catch (error) {
          logger.error('[ERROR] Failed to load profile from Supabase', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load profile',
            isLoading: false,
          });
        }
      },

      // Save current profile to Supabase
      saveProfile: async () => {
        const state = get();
        if (!state.profile) {
          logger.warn('[WARN] No profile to save');
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          logger.info('[INFO] Saving profile to Supabase', { userId: user.id });

          // Convert app format to database format
          const profileData = {
            id: user.id,
            full_name: state.profile.fullName,
            contact_number: state.profile.contactNumber,
            email: state.profile.email,
            address: state.profile.address,
            location: state.profile.location,
            employment_status: state.profile.employmentStatus,
            monthly_gross_income: state.profile.monthlyGrossIncome,
            monthly_net_income: state.profile.monthlyNetIncome,
            has_spouse: state.profile.hasSpouse,
            spouse_income: state.profile.spouseIncome,
            number_of_dependents: state.profile.numberOfDependents,
          };

          // Upsert profile (insert or update)
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (profileError) {
            throw profileError;
          }

          // Update settings
          const settingsData = {
            user_id: user.id,
            currency: state.settings.currency,
            notifications: state.settings.notifications,
            sync_enabled: state.settings.syncEnabled,
            last_sync_date: new Date().toISOString(),
          };

          const { error: settingsError } = await supabase
            .from('app_settings')
            .upsert(settingsData, { onConflict: 'user_id' });

          if (settingsError) {
            throw settingsError;
          }

          set({
            isLoading: false,
            settings: {
              ...state.settings,
              lastSyncDate: settingsData.last_sync_date,
            },
          });

          logger.info('[INFO] Profile saved successfully to Supabase');
        } catch (error) {
          logger.error('[ERROR] Failed to save profile to Supabase', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to save profile',
            isLoading: false,
          });
        }
      },

      syncProfile: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            logger.warn('[WARN] Cannot sync: User not authenticated');
            return;
          }

          // First save current changes, then load fresh data
          await get().saveProfile();
          await get().loadProfile(user.id);
          
          logger.info('[INFO] Profile sync completed');
        } catch (error) {
          logger.error('[ERROR] Profile sync failed', error);
          set({
            error: error instanceof Error ? error.message : 'Sync failed',
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
