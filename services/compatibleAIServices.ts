/**
 * AI Service Compatibility Layer for Budget Buddy Mobile
 * Provides a drop-in replacement for existing AI services with hybrid backend support
 */

import { serviceMigrationLayer } from './serviceMigrationLayer';
import { cohereAIService as originalCohereAIService } from './cohereAIService';
import { grokAIService as originalGrokAIService } from './grokAIService';
import { logger } from '../utils/logger';

/**
 * Hybrid Cohere AI Service - Drop-in replacement for cohereAIService
 * Maintains the exact same interface but uses hybrid backend when available
 */
class CompatibleCohereAIService {
  /**
   * Chat with AI - maintains original interface
   */
  async chatWithAI(userMessage: string): Promise<string> {
    try {
      return await serviceMigrationLayer.chatWithAI(userMessage);
    } catch (error) {
      logger.error('CompatibleCohereAI: Chat failed, using original service', { error });
      return await originalCohereAIService.chatWithAI(userMessage);
    }
  }

  /**
   * Generate insights - maintains original interface
   */
  async generateInsights(): Promise<any[]> {
    try {
      return await serviceMigrationLayer.generateInsights();
    } catch (error) {
      logger.error('CompatibleCohereAI: Insights failed, using original service', { error });
      return await originalCohereAIService.generateInsights();
    }
  }

  /**
   * Generate recommendations - maintains original interface
   */
  async generateRecommendations(): Promise<string[]> {
    try {
      return await serviceMigrationLayer.generateRecommendations();
    } catch (error) {
      logger.error('CompatibleCohereAI: Recommendations failed, using original service', { error });
      return await originalCohereAIService.generateRecommendations();
    }
  }

  /**
   * Generate business intelligence - maintains original interface
   */
  async generateBusinessIntelligenceInsights(): Promise<any> {
    return await serviceMigrationLayer.generateBusinessIntelligenceInsights();
  }

  /**
   * Generate business intelligence with data - maintains original interface
   */
  async generateBusinessIntelligenceInsightsWithData(
    bills: any[], 
    budget: number | null, 
    monthlyTotal: number
  ): Promise<any> {
    return await serviceMigrationLayer.generateBusinessIntelligenceInsightsWithData(bills, budget, monthlyTotal);
  }

  /**
   * Check if service is configured - custom implementation for compatibility
   */
  isConfigured(): boolean {
    // For compatibility, assume it's configured if we can make requests
    return true;
  }
}

/**
 * Hybrid Grok AI Service - Drop-in replacement for grokAIService
 * For now, passes through to original service since backend doesn't have Grok integration yet
 */
class CompatibleGrokAIService {
  /**
   * Chat with AI - passes through to original for now
   */
  async chatWithAI(userMessage: string): Promise<string> {
    // TODO: Implement backend Grok integration
    return await originalGrokAIService.chatWithAI(userMessage);
  }

  /**
   * Generate insights - passes through to original for now
   */
  async generateInsights(): Promise<any[]> {
    // TODO: Implement backend Grok integration
    return await originalGrokAIService.generateInsights();
  }

  /**
   * Generate business intelligence - passes through to original for now
   */
  async generateBusinessIntelligenceInsights(): Promise<any> {
    return await originalGrokAIService.generateBusinessIntelligenceInsights();
  }

  /**
   * Generate business intelligence with data - passes through to original for now
   */
  async generateBusinessIntelligenceInsightsWithData(
    bills: any[], 
    budget: number | null, 
    monthlyTotal: number
  ): Promise<any> {
    return await originalGrokAIService.generateBusinessIntelligenceInsightsWithData(bills, budget, monthlyTotal);
  }

  /**
   * Check if service is configured - custom implementation for compatibility
   */
  isConfigured(): boolean {
    // For compatibility, assume it's configured if we can make requests
    return true;
  }
}

// Create compatible instances
const compatibleCohereAIService = new CompatibleCohereAIService();
const compatibleGrokAIService = new CompatibleGrokAIService();

// Export with original names for drop-in replacement
export { 
  compatibleCohereAIService as cohereAIService,
  compatibleGrokAIService as grokAIService
};

// Also export hybrid services for direct access
export { 
  serviceMigrationLayer,
  CompatibleCohereAIService,
  CompatibleGrokAIService
};