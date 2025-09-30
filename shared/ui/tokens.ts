/**
 * Design Tokens
 * Semantic design system tokens that integrate with existing ThemeContext
 */

import { useTheme } from '../../contexts/ThemeContext';

// Spacing tokens (consistent across all themes)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  giant: 48,
} as const;

// Typography scale
export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    giant: 32,
    massive: 48,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

// Border radius tokens
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999, // Fully rounded
} as const;

// Shadow tokens
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Animation timing
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear' as const,
    easeInOut: 'ease-in-out' as const,
    easeOut: 'ease-out' as const,
    easeIn: 'ease-in' as const,
  },
} as const;

// Opacity tokens
export const opacity = {
  disabled: 0.4,
  muted: 0.6,
  emphasis: 0.8,
  full: 1.0,
} as const;

/**
 * Hook to get semantic colors that integrate with the current theme
 */
export function useSemanticColors() {
  const { currentTheme } = useTheme();
  
  return {
    // Base colors from theme
    primary: currentTheme.colors.primary,
    secondary: currentTheme.colors.secondary,
    background: currentTheme.colors.background,
    surface: currentTheme.colors.surface,
    text: currentTheme.colors.text,
    textSecondary: currentTheme.colors.textSecondary,
    accent: currentTheme.colors.accent,
    success: currentTheme.colors.success,
    warning: currentTheme.colors.warning,
    error: currentTheme.colors.error,
    
    // Semantic variations
    primaryLight: currentTheme.colors.primary + '20', // 20% opacity
    primaryMuted: currentTheme.colors.primary + '60', // 60% opacity
    surfaceElevated: currentTheme.colors.surface,
    textMuted: currentTheme.colors.textSecondary,
    border: currentTheme.colors.textSecondary + '20',
    divider: currentTheme.colors.textSecondary + '10',
    
    // Interactive states
    hover: currentTheme.colors.primary + '10',
    pressed: currentTheme.colors.primary + '20',
    focus: currentTheme.colors.accent + '30',
    
    // Status colors with variations
    successLight: currentTheme.colors.success + '20',
    warningLight: currentTheme.colors.warning + '20',
    errorLight: currentTheme.colors.error + '20',
  };
}

/**
 * Hook to get complete design tokens
 */
export function useDesignTokens() {
  const colors = useSemanticColors();
  
  return {
    colors,
    spacing,
    typography,
    borderRadius,
    shadows,
    animations,
    opacity,
  };
}

// Export individual token categories for direct import
export const tokens = {
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  opacity,
};