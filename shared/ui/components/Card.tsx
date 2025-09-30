/**
 * Card Component
 * Consistent card styling with design tokens
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useDesignTokens } from '../tokens';

export interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function Card({
  variant = 'elevated',
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  const { colors, spacing, borderRadius, shadows } = useDesignTokens();

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'md':
        return { padding: spacing.lg };
      case 'lg':
        return { padding: spacing.xl };
      case 'xl':
        return { padding: spacing.xxl };
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: borderRadius.lg,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          ...shadows.md,
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.primaryLight,
        };
    }
  };

  const cardStyles = [
    styles.base,
    getVariantStyles(),
    getPaddingStyles(),
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    // Base card styles
  },
});