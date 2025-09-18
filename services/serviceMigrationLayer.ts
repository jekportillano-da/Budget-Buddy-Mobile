/**
 * Service Migration Layer for Budget Buddy Mobile
 * Provides backwards compatibility while transitioning to hybrid API
 */

import { hybridAIService } from './hybridAIService';
import { cohereAIService } from './cohereAIService';
import { grokAIService } from './grokAIService';
import { apiConfigService } from './apiConfigService';
import { logger } from '../utils/logger';

interface MigrationConfig {
  enableHybridAI: boolean;
  enableGradualRollout: boolean;
  rolloutPercentage: number;
  enableFallback: boolean;
}

class ServiceMigrationLayer {
  private config: MigrationConfig;

  constructor() {
    this.config = {
      enableHybridAI: process.env.EXPO_PUBLIC_ENABLE_HYBRID_AI === 'true',
      enableGradualRollout: process.env.EXPO_PUBLIC_ENABLE_GRADUAL_ROLLOUT === 'true',
      rolloutPercentage: parseInt(process.env.EXPO_PUBLIC_ROLLOUT_PERCENTAGE || '50'),
      enableFallback: process.env.EXPO_PUBLIC_ENABLE_MIGRATION_FALLBACK !== 'false',
    };

    logger.debug('ServiceMigration: Initialized', this.config);
  }

  /**
   * Get the appropriate AI service based on migration configuration
   */
  getAIService(): typeof hybridAIService | typeof cohereAIService {
    // If hybrid AI is disabled, always use direct service
    if (!this.config.enableHybridAI) {
      logger.debug('ServiceMigration: Using direct AI service (hybrid disabled)');
      return cohereAIService;
    }

    // If gradual rollout is enabled, use percentage-based decision
    if (this.config.enableGradualRollout) {
      const shouldUseHybrid = Math.random() * 100 < this.config.rolloutPercentage;
      if (shouldUseHybrid) {
        logger.debug('ServiceMigration: Using hybrid AI service (rollout)');
        return hybridAIService;
      } else {
        logger.debug('ServiceMigration: Using direct AI service (rollout)');
        return cohereAIService;
      }
    }

    // Default to hybrid service
    logger.debug('ServiceMigration: Using hybrid AI service (default)');
    return hybridAIService;
  }

  /**
   * Chat with AI using migration layer
   */
  async chatWithAI(userMessage: string): Promise<string> {
    const aiService = this.getAIService();
    
    try {
      const result = await aiService.chatWithAI(userMessage);
      logger.debug('ServiceMigration: Chat successful', { 
        service: aiService === hybridAIService ? 'hybrid' : 'direct',
        responseLength: result.length
      });
      return result;
    } catch (error) {
      logger.error('ServiceMigration: Chat failed', { error });
      
      // Fallback to direct service if hybrid fails and fallback is enabled
      if (this.config.enableFallback && aiService === hybridAIService) {
        logger.info('ServiceMigration: Falling back to direct AI service');
        return await cohereAIService.chatWithAI(userMessage);
      }
      
      throw error;
    }
  }

  /**
   * Generate insights using migration layer
   */
  async generateInsights(): Promise<any[]> {
    const aiService = this.getAIService();
    
    try {
      const result = await aiService.generateInsights();
      logger.debug('ServiceMigration: Insights successful', { 
        service: aiService === hybridAIService ? 'hybrid' : 'direct',
        insightsCount: result.length
      });
      return result;
    } catch (error) {
      logger.error('ServiceMigration: Insights failed', { error });
      
      // Fallback to direct service if hybrid fails and fallback is enabled
      if (this.config.enableFallback && aiService === hybridAIService) {
        logger.info('ServiceMigration: Falling back to direct AI service');
        return await cohereAIService.generateInsights();
      }
      
      throw error;
    }
  }

  /**
   * Generate recommendations using migration layer
   */
  async generateRecommendations(): Promise<string[]> {
    const aiService = this.getAIService();
    
    try {
      const result = await aiService.generateRecommendations();
      logger.debug('ServiceMigration: Recommendations successful', { 
        service: aiService === hybridAIService ? 'hybrid' : 'direct',
        recommendationsCount: result.length
      });
      return result;
    } catch (error) {
      logger.error('ServiceMigration: Recommendations failed', { error });
      
      // Fallback to direct service if hybrid fails and fallback is enabled
      if (this.config.enableFallback && aiService === hybridAIService) {
        logger.info('ServiceMigration: Falling back to direct AI service');
        return await cohereAIService.generateRecommendations();
      }
      
      throw error;
    }
  }

  /**
   * Generate business intelligence using migration layer
   */
  async generateBusinessIntelligenceInsights(): Promise<any> {
    // For now, business intelligence always uses direct service
    // TODO: Implement backend BI endpoints
    return await cohereAIService.generateBusinessIntelligenceInsights();
  }

  /**
   * Generate business intelligence with data using migration layer
   */
  async generateBusinessIntelligenceInsightsWithData(
    bills: any[], 
    budget: number | null, 
    monthlyTotal: number
  ): Promise<any> {
    // For now, business intelligence always uses direct service
    // TODO: Implement backend BI endpoints
    return await cohereAIService.generateBusinessIntelligenceInsightsWithData(bills, budget, monthlyTotal);
  }

  /**
   * Get migration status and service health
   */
  async getMigrationStatus() {
    const hybridStatus = await hybridAIService.getServiceStatus();
    const currentService = this.getAIService();
    
    return {
      migrationConfig: this.config,
      currentService: currentService === hybridAIService ? 'hybrid' : 'direct',
      apiConfig: apiConfigService.getConfig(),
      hybridServiceStatus: hybridStatus,
      isBackendHealthy: hybridStatus.backendHealthy,
      fallbackAvailable: true,
    };
  }

  /**
   * Update migration configuration
   */
  updateConfig(newConfig: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('ServiceMigration: Configuration updated', this.config);
  }

  /**
   * Enable hybrid AI for all requests
   */
  enableHybridAI(): void {
    this.updateConfig({ 
      enableHybridAI: true, 
      enableGradualRollout: false 
    });
    logger.info('ServiceMigration: Hybrid AI enabled for all requests');
  }

  /**
   * Disable hybrid AI and use direct service only
   */
  disableHybridAI(): void {
    this.updateConfig({ 
      enableHybridAI: false 
    });
    logger.info('ServiceMigration: Hybrid AI disabled, using direct service only');
  }

  /**
   * Enable gradual rollout with specified percentage
   */
  enableGradualRollout(percentage: number = 50): void {
    this.updateConfig({ 
      enableHybridAI: true,
      enableGradualRollout: true, 
      rolloutPercentage: Math.max(0, Math.min(100, percentage))
    });
    logger.info(`ServiceMigration: Gradual rollout enabled at ${percentage}%`);
  }

  /**
   * Get debug information for troubleshooting
   */
  async getDebugInfo() {
    const migrationStatus = await this.getMigrationStatus();
    const aiService = this.getAIService();
    
    return {
      ...migrationStatus,
      debugInfo: {
        selectedService: aiService === hybridAIService ? 'hybrid' : 'direct',
        timestamp: new Date().toISOString(),
        environment: __DEV__ ? 'development' : 'production',
      }
    };
  }
}

export const serviceMigrationLayer = new ServiceMigrationLayer();