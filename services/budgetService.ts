import { BudgetBreakdown, SavingsForecast, BudgetInsights } from '../stores/budgetStore';

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend

class BudgetService {
  // Online API calls
  async calculateBudget(amount: number, duration: string): Promise<BudgetBreakdown> {
    const response = await fetch(`${API_BASE_URL}/api/budget/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, duration }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getSavingsForecast(
    monthly_savings: number,
    emergency_fund: number,
    current_goal: number
  ): Promise<SavingsForecast> {
    const response = await fetch(`${API_BASE_URL}/api/savings/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthly_savings,
        emergency_fund,
        current_goal,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getInsights(
    budget_breakdown: BudgetBreakdown,
    savings_data: SavingsForecast
  ): Promise<BudgetInsights> {
    const response = await fetch(`${API_BASE_URL}/api/insights/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        budget_breakdown,
        savings_data,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Offline calculations (mirrors your backend logic)
  calculateBudgetOffline(amount: number, duration: string): BudgetBreakdown {
    // Normalize values to match the selected time period
    const divisor = duration === 'daily' ? 30 : duration === 'weekly' ? 4.33 : 1;
    const adjusted_amount = amount / divisor;

    // Define category percentages (same as your backend)
    const percentages = {
      'food/groceries': 0.30,
      transportation: 0.15,
      utilities: 0.20,
      emergency_fund: 0.20,
      discretionary: 0.15,
    };

    // Calculate breakdowns
    const categories: Record<string, number> = {};
    for (const [category, percentage] of Object.entries(percentages)) {
      categories[category] = Math.round(adjusted_amount * percentage * 100) / 100;
    }

    const total_essential = categories['food/groceries'] + categories.transportation + categories.utilities;
    const total_savings = categories.emergency_fund + categories.discretionary;

    return {
      categories,
      total_essential: Math.round(total_essential * 100) / 100,
      total_savings: Math.round(total_savings * 100) / 100,
    };
  }

  calculateSavingsForecastOffline(breakdown: BudgetBreakdown): SavingsForecast {
    const monthly_savings = breakdown.total_savings;
    const emergency_fund = breakdown.categories.emergency_fund || 0;

    // Calculate monthly projections (1, 2, 3, 6, 12 months)
    const periods = [1, 2, 3, 6, 12];
    const monthly_projections = periods.map(months => {
      // Simple compound calculation with 0.5% monthly interest
      const principal = emergency_fund;
      const monthly_contribution = monthly_savings;
      const monthly_rate = 0.005;
      
      let total = principal;
      for (let i = 0; i < months; i++) {
        total = (total + monthly_contribution) * (1 + monthly_rate);
      }
      return Math.round(total * 100) / 100;
    });

    // Calculate emergency fund progress (assuming 50k goal)
    const emergency_goal = 50000;
    const emergency_fund_progress = Math.min(
      (emergency_fund / emergency_goal) * 100,
      100
    );

    // What-if scenarios
    const what_if_scenarios = {
      monthly_10pct_more: Math.round(monthly_savings * 1.1 * 100) / 100,
      yearly_10pct_more: Math.round(monthly_savings * 1.1 * 12 * 100) / 100,
      months_to_goal: Math.ceil(emergency_goal / monthly_savings),
      months_saved: Math.max(0, Math.ceil(emergency_goal / monthly_savings) - Math.ceil(emergency_goal / (monthly_savings * 1.1))),
    };

    return {
      monthly_projections,
      emergency_fund_progress: Math.round(emergency_fund_progress * 100) / 100,
      what_if_scenarios,
    };
  }

  calculateInsightsOffline(
    breakdown: BudgetBreakdown,
    savingsForecast: SavingsForecast
  ): BudgetInsights {
    const total_budget = breakdown.total_essential + breakdown.total_savings;
    const savings_rate = (breakdown.total_savings / total_budget) * 100;
    const emergency_progress = savingsForecast.emergency_fund_progress;

    // Calculate health score (simple version of your backend logic)
    let health_score = 0;
    
    // Savings rate factor (40% weight)
    health_score += Math.min(savings_rate * 2, 40);
    
    // Emergency fund factor (30% weight)
    health_score += (emergency_progress * 0.3);
    
    // Discretionary spending factor (30% weight)
    const discretionary_ratio = ((breakdown.categories.discretionary || 0) / total_budget) * 100;
    health_score += Math.max(30 - discretionary_ratio, 0);

    health_score = Math.round(health_score * 100) / 100;

    // Determine status
    const status = health_score >= 80 ? 'excellent' : 
                  health_score >= 60 ? 'on_track' : 
                  'needs_improvement';

    // Generate insights
    const insights: Array<{
      type: 'success' | 'warning' | 'info';
      message: string;
    }> = [];
    const recommendations: string[] = [];

    if (emergency_progress >= 75) {
      insights.push({
        type: 'success' as const,
        message: `Strong emergency fund at ${emergency_progress.toFixed(1)}% of goal`,
      });
      recommendations.push('Consider investing additional savings for long-term growth');
    } else if (emergency_progress >= 25) {
      insights.push({
        type: 'info' as const,
        message: `Building emergency fund: ${emergency_progress.toFixed(1)}% of goal`,
      });
      recommendations.push('Stay consistent with emergency fund contributions');
    } else {
      insights.push({
        type: 'warning' as const,
        message: `Low emergency fund: ${emergency_progress.toFixed(1)}% of goal`,
      });
      recommendations.push('Prioritize building your emergency fund');
    }

    if (savings_rate >= 20) {
      insights.push({
        type: 'success' as const,
        message: `Healthy savings rate: ${savings_rate.toFixed(1)}% of income`,
      });
    } else {
      insights.push({
        type: 'warning' as const,
        message: `Low savings rate: ${savings_rate.toFixed(1)}% of income`,
      });
      recommendations.push('Look for ways to increase your savings rate to 20% or more');
    }

    return {
      health_score,
      status,
      insights,
      recommendations,
    };
  }
}

export const budgetService = new BudgetService();
