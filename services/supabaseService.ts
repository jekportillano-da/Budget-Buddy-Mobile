/**
 * Supabase Client Configuration
 * Provides authentication and database services for Budget Buddy Mobile
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure authentication settings
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
  db: {
    // Configure database settings
    schema: 'public',
  },
  global: {
    // Configure global settings
    headers: {
      'X-Client-Info': 'budget-buddy-mobile/1.0.0',
    },
  },
});

logger.info('Supabase client initialized successfully', { 
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey 
});

// Authentication helpers
export const auth = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string) => {
    logger.info('Attempting user signup', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      logger.error('Signup failed', error);
      throw error;
    }
    
    logger.info('User signup successful', { userId: data.user?.id });
    return data;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    logger.info('Attempting user signin', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.error('Signin failed', error);
      throw error;
    }
    
    logger.info('User signin successful', { userId: data.user?.id });
    return data;
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    logger.info('User signing out');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Signout failed', error);
      throw error;
    }
    
    logger.info('User signout successful');
  },

  /**
   * Get current user session
   */
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Failed to get session', error);
      throw error;
    }
    
    return session;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Failed to get current user', error);
      throw error;
    }
    
    return user;
  },
};

// Database helpers
export const database = {
  /**
   * Get user profile by ID
   */
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      logger.error('Failed to get user profile', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Create or update user profile
   */
  upsertUserProfile: async (profile: any) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile)
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to upsert user profile', error);
      throw error;
    }
    
    return data;
  },
};

// Connection test
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    logger.info('[INFO] Testing Supabase connection...');
    
    // Test connection by checking auth session (doesn't require any tables)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('[ERROR] Supabase connection test failed', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }

    // If we get here, the connection is working
    logger.info('[INFO] Supabase connection test successful');
    return {
      success: true,
      message: 'Connected successfully to Supabase! 🎉'
    };
  } catch (error) {
    logger.error('[ERROR] Supabase connection test error', error);
    return {
      success: false,
      message: `Connection error: ${error}`
    };
  }
};

// Export the client for direct use if needed
export default supabase;