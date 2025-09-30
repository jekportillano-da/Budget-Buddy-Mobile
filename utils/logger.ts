/**
 * Budget Buddy Mobile - Logging Utility
 * @license MIT
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = this.getDefaultLogLevel();

  private getDefaultLogLevel(): LogLevel {
    // Check for React Native __DEV__ global safely
    try {
      // Use globalThis to safely check for __DEV__ without TypeScript errors
      const globalScope = globalThis as any;
      if (typeof globalScope.__DEV__ !== 'undefined') {
        return globalScope.__DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
      }
    } catch {
      // Ignore errors accessing global scope
    }
    
    // Fallback to NODE_ENV
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
    }
    
    // Default fallback for safety
    return LogLevel.WARN;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
