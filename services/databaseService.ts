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

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  // Initialize database connection
  async init(): Promise<void> {
    try {
      // Updated for Expo SDK 51 - use openDatabaseSync for better compatibility
      this.db = await SQLite.openDatabaseAsync('budget_buddy_mobile.db');
      await this.createTables();
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
      
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
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
}

export const databaseService = new DatabaseService();
