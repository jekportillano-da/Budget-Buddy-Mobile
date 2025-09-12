import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { grokAIService } from '../services/grokAIService';

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info';
  category: 'budget' | 'spending' | 'savings' | 'bills' | 'philippines';
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  philippinesSpecific?: boolean;
  createdAt: string;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  impact: {
    budget: number;
    savings: number;
    healthScore: number;
  };
}

export interface Trend {
  period: string;
  value: number;
  change: number;
  percentageChange: number;
}

interface InsightsState {
  // Data state
  insights: Insight[];
  healthScore: number;
  recommendations: string[];
  trends: Trend[];
  whatIfScenarios: WhatIfScenario[];
  
  // AI status tracking
  isUsingRealAI: boolean;
  aiStatus: 'configured' | 'fallback' | 'checking';
  aiResponseTime: number | null;
  lastAICall: string | null;
  
  // Philippines-specific data
  philippinesData: {
    minimumWage: number;
    inflationRate: number;
    averageUtilities: { min: number; max: number };
    averageRent: { ncr: number; province: number };
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  generateInsights: () => Promise<void>;
  generateFallbackInsights: () => Promise<Insight[]>;
  calculateHealthScore: () => number;
  getWhatIfScenarios: (scenario: string, value: number) => Promise<void>;
  getPhilippinesInsights: () => Insight[];
  refreshInsights: () => Promise<void>;
  clearInsights: () => void;
}

export const useInsightsStore = create<InsightsState>()(
  persist(
    (set, get) => ({
      // Initial state
      insights: [],
      healthScore: 75,
      recommendations: [],
      trends: [],
      whatIfScenarios: [],
      
      isUsingRealAI: false,
      aiStatus: 'checking' as const,
      aiResponseTime: null,
      lastAICall: null,
      
      philippinesData: {
        minimumWage: 645, // NCR minimum wage per day
        inflationRate: 3.2,
        averageUtilities: { min: 3500, max: 5000 },
        averageRent: { ncr: 15000, province: 8000 },
      },
      
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Generate AI-powered insights using real data
      generateInsights: async () => {
        set({ isLoading: true, error: null, aiStatus: 'checking' });
        const startTime = Date.now();
        
        try {
          console.log('🤖 Generating AI insights with real data...');
          
          // Use Grok AI service to generate intelligent insights
          const [insights, recommendations] = await Promise.all([
            grokAIService.generateInsights(),
            grokAIService.generateRecommendations(),
          ]);

          const healthScore = grokAIService.calculateHealthScore();
          const aiResponseTime = Date.now() - startTime;
          
          // Check if we got real AI response or fallback
          const isRealAI = insights.some((insight: Insight) => 
            !insight.message.includes('mock') && !insight.message.includes('fallback')
          );

          console.log(`✅ AI insights generated in ${aiResponseTime}ms`);
          console.log(`🤖 Using ${isRealAI ? 'Real Grok AI' : 'Intelligent Fallback'}`);
          console.log(`📊 Generated ${insights.length} insights with health score: ${healthScore}`);

          set({
            insights,
            recommendations,
            healthScore,
            isUsingRealAI: isRealAI,
            aiStatus: isRealAI ? 'configured' : 'fallback',
            aiResponseTime,
            lastAICall: new Date().toISOString(),
            isLoading: false,
            lastUpdated: new Date().toISOString(),
            error: null,
          });
        } catch (error) {
          console.error('❌ AI insights generation failed:', error);
          set({
            error: 'Failed to generate AI insights. Using offline mode.',
            isUsingRealAI: false,
            isLoading: false,
          });
          
          // Still try to provide some value with fallback insights
          try {
            const fallbackInsights = await get().generateFallbackInsights();
            set({ 
              insights: fallbackInsights,
              healthScore: 70, // Conservative score for fallback
            });
          } catch (fallbackError) {
            console.error('❌ Even fallback insights failed:', fallbackError);
          }
        }
      },

      // Fallback insights when AI is not available
      generateFallbackInsights: async (): Promise<Insight[]> => {
        // This would normally be called by grokAIService.generateFallbackInsights()
        // but we can provide a basic fallback here too
        const now = new Date().toISOString();
        
        return [
          {
            id: `fallback-welcome-${Date.now()}`,
            type: 'info',
            category: 'philippines',
            message: '🇵🇭 Welcome to Budget Buddy Philippines! Set up your profile to get personalized financial insights.',
            action: 'Complete your profile in the Profile tab',
            priority: 'medium',
            philippinesSpecific: true,
            createdAt: now,
          },
          {
            id: `fallback-bills-${Date.now()}`,
            type: 'info',
            category: 'bills',
            message: '💡 Add your monthly bills to get intelligent spending analysis and cost-saving tips.',
            action: 'Add your bills in the Bills tab',
            priority: 'medium',
            createdAt: now,
          },
        ];
      },

      calculateHealthScore: () => {
        return get().healthScore;
      },

      getWhatIfScenarios: async (scenario, value) => {
        set({ isLoading: true });
        
        try {
          const scenarios: WhatIfScenario[] = [];
          
          if (scenario === 'salary_increase') {
            scenarios.push({
              id: 'salary-increase',
              title: `${(value * 100).toFixed(0)}% Salary Increase`,
              description: `Impact of a ${(value * 100).toFixed(0)}% salary increase on your budget:`,
              impact: {
                budget: 20000 * (1 + value),
                savings: 5000 * (1 + value),
                healthScore: Math.min(100, get().healthScore + 15),
              },
            });
          } else if (scenario === 'bill_reduction') {
            scenarios.push({
              id: 'bill-reduction',
              title: `${(value * 100).toFixed(0)}% Bill Reduction`,
              description: `Potential savings from reducing bills by ${(value * 100).toFixed(0)}%:`,
              impact: {
                budget: 20000,
                savings: 5000 + (20000 * value * 0.5), // Assume 50% of savings go to savings
                healthScore: Math.min(100, get().healthScore + 10),
              },
            });
          }

          set({ whatIfScenarios: scenarios, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to calculate scenarios', isLoading: false });
        }
      },

      getPhilippinesInsights: () => {
        const state = get();
        return state.insights.filter(insight => insight.philippinesSpecific === true);
      },

      refreshInsights: async () => {
        console.log('🔄 Refreshing insights with latest data...');
        await get().generateInsights();
      },

      clearInsights: () => {
        set({ 
          insights: [], 
          recommendations: [], 
          whatIfScenarios: [],
          lastUpdated: null,
          lastAICall: null,
        });
      },
    }),
    {
      name: 'insights-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        insights: state.insights,
        healthScore: state.healthScore,
        recommendations: state.recommendations,
        lastUpdated: state.lastUpdated,
        isUsingRealAI: state.isUsingRealAI,
        lastAICall: state.lastAICall,
        aiResponseTime: state.aiResponseTime,
      }),
    }
  )
);
