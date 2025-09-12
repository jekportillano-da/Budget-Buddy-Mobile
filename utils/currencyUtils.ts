/**
 * Currency and formatting utilities for Philippines-focused Budget Buddy
 */

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₱0.00';
  }
  
  // Force Philippines peso formatting
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₱0';
  }
  
  // Compact format for large numbers (₱1.2K, ₱50K, ₱1.2M)
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
  }
  
  return `₱${amount.toFixed(0)}`;
};

export const formatCurrencyNoDecimals = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₱0';
  }
  
  return `₱${amount.toLocaleString('en-PH', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`;
};

export const formatPercentage = (percentage: number | null | undefined): string => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0%';
  }
  
  return `${percentage.toFixed(1)}%`;
};

/**
 * Philippines-specific number formatting
 */
export const formatNumber = (number: number | null | undefined): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return number.toLocaleString('en-PH');
};

/**
 * Check if amount is in typical Philippines range and provide context
 */
export const getAmountContext = (amount: number, category: 'salary' | 'bill' | 'savings'): string => {
  switch (category) {
    case 'salary':
      if (amount < 20000) return 'Below minimum wage range';
      if (amount < 50000) return 'Lower middle class range';
      if (amount < 100000) return 'Middle class range';
      return 'Upper middle class range';
    
    case 'bill':
      if (amount < 1000) return 'Low cost utility';
      if (amount < 5000) return 'Typical utility range';
      if (amount < 10000) return 'High utility cost';
      return 'Very high utility cost';
    
    case 'savings':
      if (amount < 5000) return 'Building emergency fund';
      if (amount < 50000) return 'Good emergency fund';
      if (amount < 200000) return 'Strong savings';
      return 'Excellent savings';
    
    default:
      return '';
  }
};
