/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Database service for SQLite data persistence
 */

import * as SQLite from 'expo-sqlite';
import { logger } from '../utils/logger';

export interface BudgetRecord {
  id: number;
  amount: number;
  duration: string;
  breakdown: string;
  savings_forecast: string;
  insights: string;
  created_at: string;
  synced: boolean;
}

export interface SyncItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

// Phase 2: Savings and gamification interfaces
export interface SavingsEntry {
  id?: number;
  amount: number;
  entry_type: 'deposit' | 'withdrawal' | 'adjustment' | 'transfer';
  label?: string;
  purpose?: string;
  date_entered: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface UserAchievement {
  id?: number;
  achievement_type: 'tier' | 'badge' | 'milestone';
  achievement_name: string;
  achieved_at: string;
  total_savings_at_achievement: number;
  is_active?: boolean;
  created_at?: string;
}

export interface UserPreference {
  id?: number;
  preference_type: 'theme' | 'avatar_border' | 'badge_display';
  preference_key: string;
  preference_value: string;
  unlocked_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SavingsGoal {
  id?: number;
  goal_name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  // Initialize database connection
  async init(): Promise<void> {
    try {
      // Updated for Expo SDK 51 - use openDatabaseSync for better compatibility
      this.db = await SQLite.openDatabaseAsync('budget_buddy_mobile.db');
      await this.createTables();
      await this.runMigrations();
      logger.debug('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization error', { error });
      throw error;
    }
  }

  // Create necessary tables
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Budget records table
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS budget_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          duration TEXT NOT NULL,
          breakdown TEXT NOT NULL,
          savings_forecast TEXT NOT NULL,
          insights TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT FALSE
        );`
      );

      // Sync queue table for pending operations
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          attempts INTEGER DEFAULT 0
        );`
      );

      // User settings table
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Phase 2: Savings tracking tables
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS savings_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          entry_type TEXT NOT NULL CHECK (entry_type IN ('deposit', 'withdrawal', 'adjustment', 'transfer')),
          label TEXT,
          purpose TEXT,
          date_entered DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT FALSE
        );`
      );

      // Phase 2: User achievements and tiers
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS user_achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          achievement_type TEXT NOT NULL,
          achievement_name TEXT NOT NULL,
          achieved_at DATETIME NOT NULL,
          total_savings_at_achievement REAL NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Phase 2: Theme and visual preferences
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          preference_type TEXT NOT NULL,
          preference_key TEXT NOT NULL,
          preference_value TEXT NOT NULL,
          unlocked_at DATETIME,
          is_active BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Phase 2: Savings goals (future-ready)
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS savings_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          goal_name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0,
          target_date DATE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );
      
      // Create performance indexes for frequently queried columns
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_budget_records_created_at ON budget_records(created_at);
        CREATE INDEX IF NOT EXISTS idx_savings_entries_date_entered ON savings_entries(date_entered);
        CREATE INDEX IF NOT EXISTS idx_savings_entries_entry_type ON savings_entries(entry_type);
        CREATE INDEX IF NOT EXISTS idx_user_achievements_achieved_at ON user_achievements(achieved_at);
        CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_type ON user_achievements(achievement_type);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
        CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);
        CREATE INDEX IF NOT EXISTS idx_savings_goals_is_active ON savings_goals(is_active);
      `);
      
      console.log('✅ Database tables created successfully');
      console.log('✅ Performance indexes created');
      console.log('✅ Phase 2 savings tables initialized');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  // Run database migrations
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if we need to migrate savings_entries table
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(savings_entries)");
      
      // Check if the entry_type column has the old constraints
      const entryTypeColumn = tableInfo.find((col: any) => col.name === 'entry_type');
      
      if (entryTypeColumn) {
        // Try to insert a test record to see if the constraint allows 'deposit'
        try {
          await this.db.runAsync(
            'INSERT INTO savings_entries (amount, entry_type, date_entered) VALUES (?, ?, ?)',
            [0.01, 'deposit', new Date().toISOString()]
          );
          // If successful, delete the test record
          await this.db.runAsync('DELETE FROM savings_entries WHERE amount = 0.01');
          console.log('✅ Savings table schema is correct');
        } catch (error) {
          // If the constraint fails, we need to migrate
          console.log('🔄 Migrating savings_entries table schema...');
          
          // Create backup of existing data
          const existingData = await this.db.getAllAsync('SELECT * FROM savings_entries');
          
          // Drop and recreate table with correct schema
          await this.db.execAsync('DROP TABLE savings_entries');
          await this.db.execAsync(`
            CREATE TABLE savings_entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              amount REAL NOT NULL,
              entry_type TEXT NOT NULL CHECK (entry_type IN ('deposit', 'withdrawal', 'adjustment', 'transfer')),
              label TEXT,
              purpose TEXT,
              date_entered DATE NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced BOOLEAN DEFAULT FALSE
            )
          `);
          
          // Restore data with updated entry types
          for (const row of existingData) {
            const rowData = row as any; // Type assertion for SQLite row data
            let newEntryType = 'deposit';
            if (rowData.entry_type === 'daily' || rowData.entry_type === 'weekly' || rowData.entry_type === 'monthly') {
              newEntryType = rowData.amount >= 0 ? 'deposit' : 'withdrawal';
            }
            
            await this.db.runAsync(
              'INSERT INTO savings_entries (amount, entry_type, label, purpose, date_entered, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [rowData.amount, newEntryType, rowData.label, rowData.purpose, rowData.date_entered, rowData.created_at, rowData.updated_at, rowData.synced]
            );
          }
          
          console.log('✅ Savings table migration completed');
        }
      }
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      // Don't throw error - continue with normal operation
    }
  }

  // Save budget calculation
  async saveBudgetRecord(
    amount: number,
    duration: string,
    breakdown: any,
    savingsForecast: any,
    insights: any
  ): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO budget_records (amount, duration, breakdown, savings_forecast, insights, synced)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          amount,
          duration,
          JSON.stringify(breakdown),
          JSON.stringify(savingsForecast),
          JSON.stringify(insights),
          0
        ]
      );

      // Add to sync queue
      await this.addToSyncQueue('create', 'budget_records', {
        id: result.lastInsertRowId,
        amount,
        duration,
        breakdown,
        savings_forecast: savingsForecast,
        insights
      });
      
      console.log('✅ Budget record saved successfully:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ Error saving budget record:', error);
      throw error;
    }
  }

  // Get recent budget records
  async getBudgetRecords(limit: number = 20): Promise<BudgetRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM budget_records ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      const records: BudgetRecord[] = result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        duration: row.duration,
        breakdown: JSON.parse(row.breakdown),
        savings_forecast: JSON.parse(row.savings_forecast),
        insights: JSON.parse(row.insights),
        created_at: row.created_at,
        synced: Boolean(row.synced)
      }));

      console.log('✅ Retrieved budget records:', records.length);
      return records;
    } catch (error) {
      console.error('❌ Error getting budget records:', error);
      throw error;
    }
  }

  // Add item to sync queue
  async addToSyncQueue(action: string, table: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const id = `${table}_${action}_${Date.now()}_${Math.random()}`;
      
      await this.db.runAsync(
        `INSERT INTO sync_queue (id, action, table_name, data, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          action,
          table,
          JSON.stringify(data),
          Date.now()
        ]
      );
      
      console.log('✅ Added to sync queue:', id);
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
      throw error;
    }
  }

  // User settings management
  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO user_settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))`,
        [key, value]
      );
      console.log('✅ Setting saved:', key);
    } catch (error) {
      console.error('❌ Error saving setting:', error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync(
        'SELECT value FROM user_settings WHERE key = ?',
        [key]
      );
      
      return result ? (result as any).value : null;
    } catch (error) {
      console.error('❌ Error getting setting:', error);
      throw error;
    }
  }

  // Get database stats
  async getStats(): Promise<{
    totalRecords: number;
    unsyncedRecords: number;
    pendingSyncItems: number;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get total records
      const totalResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM budget_records'
      );
      const totalRecords = totalResult ? (totalResult as any).count : 0;

      // Get unsynced records
      const unsyncedResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM budget_records WHERE synced = 0'
      );
      const unsyncedRecords = unsyncedResult ? (unsyncedResult as any).count : 0;

      // Get pending sync items
      const syncResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue'
      );
      const pendingSyncItems = syncResult ? (syncResult as any).count : 0;

      console.log('✅ Database stats retrieved');
      return { totalRecords, unsyncedRecords, pendingSyncItems };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      throw error;
    }
  }

  // Clear all data (for logout or reset)
  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.execAsync('DELETE FROM budget_records');
      await this.db.execAsync('DELETE FROM sync_queue');
      await this.db.execAsync('DELETE FROM user_settings');
      
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  // ================================
  // Phase 2: Savings & Gamification Methods
  // ================================

  // Savings entries methods
  async saveSavingsEntry(entry: Omit<SavingsEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO savings_entries (amount, entry_type, label, purpose, date_entered, synced)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entry.amount,
          entry.entry_type,
          entry.label || null,
          entry.purpose || null,
          entry.date_entered,
          0
        ]
      );

      console.log('✅ Savings entry saved successfully:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ Error saving savings entry:', error);
      throw error;
    }
  }

  async getSavingsEntries(limit: number = 50): Promise<SavingsEntry[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM savings_entries ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      const entries: SavingsEntry[] = result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        entry_type: row.entry_type,
        label: row.label,
        purpose: row.purpose,
        date_entered: row.date_entered,
        created_at: row.created_at,
        updated_at: row.updated_at,
        synced: Boolean(row.synced)
      }));

      console.log('✅ Retrieved savings entries:', entries.length);
      return entries;
    } catch (error) {
      console.error('❌ Error getting savings entries:', error);
      throw error;
    }
  }

  async getTotalSavings(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync(
        'SELECT SUM(amount) as total FROM savings_entries'
      );
      
      const total = result ? (result as any).total || 0 : 0;
      console.log('✅ Total savings calculated:', total);
      return total;
    } catch (error) {
      console.error('❌ Error calculating total savings:', error);
      throw error;
    }
  }

  // Achievement methods
  async saveAchievement(achievement: Omit<UserAchievement, 'id' | 'created_at'>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `INSERT INTO user_achievements (achievement_type, achievement_name, achieved_at, total_savings_at_achievement, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          achievement.achievement_type,
          achievement.achievement_name,
          achievement.achieved_at,
          achievement.total_savings_at_achievement,
          achievement.is_active !== false ? 1 : 0
        ]
      );

      console.log('✅ Achievement saved successfully');
    } catch (error) {
      console.error('❌ Error saving achievement:', error);
      throw error;
    }
  }

  async getUserAchievements(): Promise<UserAchievement[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM user_achievements WHERE is_active = 1 ORDER BY achieved_at DESC'
      );

      const achievements: UserAchievement[] = result.map((row: any) => ({
        id: row.id,
        achievement_type: row.achievement_type,
        achievement_name: row.achievement_name,
        achieved_at: row.achieved_at,
        total_savings_at_achievement: row.total_savings_at_achievement,
        is_active: Boolean(row.is_active),
        created_at: row.created_at
      }));

      console.log('✅ Retrieved user achievements:', achievements.length);
      return achievements;
    } catch (error) {
      console.error('❌ Error getting achievements:', error);
      throw error;
    }
  }

  // Preference methods
  async saveUserPreference(preference: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // First, deactivate any existing preferences of the same type
      await this.db.runAsync(
        `UPDATE user_preferences SET is_active = 0 
         WHERE preference_type = ? AND preference_key = ?`,
        [preference.preference_type, preference.preference_key]
      );

      // Insert new preference
      await this.db.runAsync(
        `INSERT INTO user_preferences (preference_type, preference_key, preference_value, unlocked_at, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          preference.preference_type,
          preference.preference_key,
          preference.preference_value,
          preference.unlocked_at || null,
          preference.is_active !== false ? 1 : 0
        ]
      );

      console.log('✅ User preference saved successfully');
    } catch (error) {
      console.error('❌ Error saving user preference:', error);
      throw error;
    }
  }

  async getUserPreferences(type?: string): Promise<UserPreference[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      let query = 'SELECT * FROM user_preferences';
      let params: any[] = [];

      if (type) {
        query += ' WHERE preference_type = ?';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.db.getAllAsync(query, params);

      const preferences: UserPreference[] = result.map((row: any) => ({
        id: row.id,
        preference_type: row.preference_type,
        preference_key: row.preference_key,
        preference_value: row.preference_value,
        unlocked_at: row.unlocked_at,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      console.log('✅ Retrieved user preferences:', preferences.length);
      return preferences;
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      throw error;
    }
  }

  async getActiveTheme(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync(
        `SELECT preference_value FROM user_preferences 
         WHERE preference_type = 'theme' AND is_active = 1 
         ORDER BY updated_at DESC LIMIT 1`
      );
      
      return result ? (result as any).preference_value : 'default';
    } catch (error) {
      console.error('❌ Error getting active theme:', error);
      return 'default'; // Fallback to default theme
    }
  }
}

export const databaseService = new DatabaseService();
