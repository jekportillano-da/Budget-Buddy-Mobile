export { budgetService } from './budgetService';
export { databaseService } from './databaseService';
export { savingsService, SavingsService } from './savingsService';

// Original AI services (for direct access if needed)
export { cohereAIService as originalCohereAIService } from './cohereAIService';
export { grokAIService as originalGrokAIService } from './grokAIService';

// Hybrid AI services (compatible drop-in replacements)
export { cohereAIService, grokAIService } from './compatibleAIServices';

// Hybrid API and configuration services
export { apiConfigService } from './apiConfigService';
export { hybridAPIClient } from './hybridAPIClient';
export { hybridAIService } from './hybridAIService';
export { serviceMigrationLayer } from './serviceMigrationLayer';

export type { 
  BudgetRecord, 
  SyncItem, 
  SavingsEntry, 
  UserAchievement, 
  UserPreference, 
  SavingsGoal 
} from './databaseService';

export type {
  APIMode,
  APIConfig,
  BackendHealthStatus
} from './apiConfigService';

export type {
  APIResponse,
  AuthTokens,
  AuthCredentials
} from './hybridAPIClient';
