/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Authentication store with fallback implementations
 * Phase 4: Simple auth store without native dependencies
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple fallback implementations (no native modules)
const fallbackStorage = {
  async setItem(key: string, value: string) {
    return AsyncStorage.setItem(`secure_${key}`, value);
  },
  async getItem(key: string) {
    return AsyncStorage.getItem(`secure_${key}`);
  },
  async removeItem(key: string) {
    return AsyncStorage.removeItem(`secure_${key}`);
  },
};

const fallbackCrypto = {
  digest: async (algorithm: string, data: string) => {
    // Simple hash fallback (not cryptographically secure, just for testing)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },
};

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // Simple mock authentication for testing
          if (email && password.length >= 6) {
            const mockToken = `token_${Date.now()}`;
            const mockUser = {
              id: '1',
              email,
              name: email.split('@')[0],
            };

            // Store token using fallback storage
            await fallbackStorage.setItem('auth_token', mockToken);

            set({
              isAuthenticated: true,
              user: mockUser,
              token: mockToken,
              isLoading: false,
            });
          } else {
            throw new Error('Invalid email or password (min 6 characters)');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ isLoading: true, error: null });

          // Simple mock registration for testing
          if (email && password.length >= 6 && fullName.trim()) {
            const mockToken = `token_${Date.now()}`;
            const mockUser = {
              id: '1',
              email,
              name: fullName,
            };

            // Store token using fallback storage
            await fallbackStorage.setItem('auth_token', mockToken);

            set({
              isAuthenticated: true,
              user: mockUser,
              token: mockToken,
              isLoading: false,
            });
          } else {
            throw new Error('Invalid registration data');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Clear stored token
          await fallbackStorage.removeItem('auth_token');

          set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
          });
        }
      },

      validateSession: async () => {
        try {
          set({ isLoading: true });

          // Check for stored token
          const storedToken = await fallbackStorage.getItem('auth_token');

          if (storedToken) {
            // Mock validation - in real app, validate with server
            const mockUser = {
              id: '1',
              email: 'user@example.com',
              name: 'Test User',
            };

            set({
              isAuthenticated: true,
              user: mockUser,
              token: storedToken,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Session validation failed',
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential auth state, not UI state
      partialize: (state: AuthState) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);