/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Hybrid AI Service - Integrates backend API with fallback to direct Cohere API
 */

import { hybridAPIClient } from './hybridAPIClient';
import { cohereAIService } from './cohereAIService';
import { useBillsStore } from '../stores/billsStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useUserStore } from '../stores/userStore';
import { useSavingsStore } from '../stores/savingsStore';
import { logger } from '../utils/logger';

class HybridAIService {
  /**
   * Chat with AI using hybrid backend/direct approach
   */
  async chatWithAI(userMessage: string): Promise<string> {
    try {
      logger.debug('HybridAI: Starting chat request', { 
        messageLength: userMessage.length,
        message: userMessage.substring(0, 50) + '...'
      });

      // First try backend AI service
      const backendResponse = await hybridAPIClient.chatWithAI(userMessage, this.getUserContext());
      
      if (backendResponse.success && backendResponse.data?.response) {
        logger.debug('HybridAI: Backend AI response successful', { 
          source: backendResponse.source,
          responseLength: backendResponse.data.response.length
        });
        return backendResponse.data.response;
      }

      // Fallback to direct Cohere API
      logger.info('HybridAI: Backend AI failed, falling back to direct Cohere API');
      return await cohereAIService.chatWithAI(userMessage);

    } catch (error) {
      logger.error('HybridAI: Chat request failed, using direct Cohere fallback', { error });
      return await cohereAIService.chatWithAI(userMessage);
    }
  }

  /**
   * Generate AI insights using hybrid approach
   */
  async generateInsights(): Promise<any[]> {
    try {
      logger.debug('HybridAI: Starting insights generation');

      // First try backend AI insights
      const insightsData = this.getInsightsContext();
      const backendResponse = await hybridAPIClient.getAIInsights(insightsData);
      
      if (backendResponse.success && backendResponse.data) {
        logger.debug('HybridAI: Backend insights successful', { 
          source: backendResponse.source,
          insightsCount: Array.isArray(backendResponse.data) ? backendResponse.data.length : 1
        });
        
        // Ensure we return an array
        return Array.isArray(backendResponse.data) ? backendResponse.data : [backendResponse.data];
      }

      // Fallback to direct Cohere API
      logger.info('HybridAI: Backend insights failed, falling back to direct Cohere API');
      return await cohereAIService.generateInsights();

    } catch (error) {
      logger.error('HybridAI: Insights generation failed, using direct Cohere fallback', { error });
      return await cohereAIService.generateInsights();
    }
  }

  /**
   * Generate recommendations using hybrid approach
   */
  async generateRecommendations(): Promise<string[]> {
    try {
      logger.debug('HybridAI: Starting recommendations generation');

      // First try backend AI recommendations
      const recommendationsData = this.getRecommendationsContext();
      const backendResponse = await hybridAPIClient.getAIRecommendations(recommendationsData);
      
      if (backendResponse.success && backendResponse.data) {
        logger.debug('HybridAI: Backend recommendations successful', { 
          source: backendResponse.source,
          recommendationsCount: Array.isArray(backendResponse.data) ? backendResponse.data.length : 1
        });
        
        // Ensure we return an array of strings
        const recommendations = Array.isArray(backendResponse.data) ? backendResponse.data : [backendResponse.data];
        return recommendations.map(r => typeof r === 'string' ? r : JSON.stringify(r));
      }

      // Fallback to direct Cohere API
      logger.info('HybridAI: Backend recommendations failed, falling back to direct Cohere API');
      return await cohereAIService.generateRecommendations();

    } catch (error) {
      logger.error('HybridAI: Recommendations generation failed, using direct Cohere fallback', { error });
      return await cohereAIService.generateRecommendations();
    }
  }

  /**
   * Generate business intelligence insights using hybrid approach
   */
  async generateBusinessIntelligenceInsights(): Promise<any> {
    try {
      logger.debug('HybridAI: Starting business intelligence generation');

      // Use the direct service for now as backend BI might need more complex integration
      // TODO: Implement backend BI endpoint
      return await cohereAIService.generateBusinessIntelligenceInsights();

    } catch (error) {
      logger.error('HybridAI: Business intelligence generation failed', { error });
      throw error;
    }
  }

  /**
   * Generate business intelligence with specific data
   */
  async generateBusinessIntelligenceInsightsWithData(
    bills: any[], 
    budget: number | null, 
    monthlyTotal: number
  ): Promise<any> {
    try {
      logger.debug('HybridAI: Starting business intelligence with data');

      // Use the direct service for now
      // TODO: Implement backend BI with data endpoint
      return await cohereAIService.generateBusinessIntelligenceInsightsWithData(bills, budget, monthlyTotal);

    } catch (error) {
      logger.error('HybridAI: Business intelligence with data generation failed', { error });
      throw error;
    }
  }

  /**
   * Get user context for AI requests
   */
  private getUserContext() {
    const billsStore = useBillsStore.getState();
    const budgetStore = useBudgetStore.getState();
    const userStore = useUserStore.getState();
    const savingsStore = useSavingsStore.getState();

    return {
      bills: billsStore.bills,
      monthlyBillsTotal: billsStore.monthlyTotal,
      budget: budgetStore.currentBudget,
      budgetBreakdown: budgetStore.breakdown,
      user: userStore.profile,
      totalIncome: userStore.totalHouseholdIncome,
      location: userStore.profile?.location || 'ncr',
      currentSavings: savingsStore.currentBalance,
      currentTier: savingsStore.currentTier,
    };
  }

  /**
   * Get insights context for AI requests
   */
  private getInsightsContext() {
    const userData = this.getUserContext();
    return {
      userData,
      requestType: 'insights',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recommendations context for AI requests
   */
  private getRecommendationsContext() {
    const userData = this.getUserContext();
    return {
      userData,
      requestType: 'recommendations',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if hybrid AI is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await hybridAPIClient.healthCheck();
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Get AI service status for debugging
   */
  async getServiceStatus() {
    const apiStatus = hybridAPIClient.getApiStatus();
    const backendAvailable = await this.isBackendAvailable();
    
    return {
      ...apiStatus,
      backendAIAvailable: backendAvailable,
      fallbackAvailable: true, // Direct Cohere is always available if configured
      hybridMode: true,
    };
  }

  /**
   * Force switch to direct mode for testing
   */
  async switchToDirectMode(): Promise<void> {
    await hybridAPIClient.switchToDirectMode();
    logger.info('HybridAI: Switched to direct mode');
  }

  /**
   * Try to reconnect to backend
   */
  async reconnectToBackend(): Promise<boolean> {
    const success = await hybridAPIClient.reconnectToBackend();
    if (success) {
      logger.info('HybridAI: Reconnected to backend');
    }
    return success;
  }
}

export const hybridAIService = new HybridAIService();