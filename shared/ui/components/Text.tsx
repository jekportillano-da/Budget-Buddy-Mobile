/**
 * Typography Component
 * Consistent text styling with design tokens
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useDesignTokens } from '../tokens';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'accent' | 'success' | 'warning' | 'error' | 'surface' | 'background';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export function Text({ 
  variant = 'body', 
  color = 'text', 
  weight = 'normal',
  align = 'left',
  style, 
  children, 
  ...props 
}: TextProps) {
  const { colors, typography } = useDesignTokens();

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: typography.sizes.giant,
          fontWeight: typography.weights.bold,
          lineHeight: typography.sizes.giant * typography.lineHeights.tight,
        };
      case 'h2':
        return {
          fontSize: typography.sizes.xxxl,
          fontWeight: typography.weights.bold,
          lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
        };
      case 'h3':
        return {
          fontSize: typography.sizes.xxl,
          fontWeight: typography.weights.semibold,
          lineHeight: typography.sizes.xxl * typography.lineHeights.normal,
        };
      case 'body':
        return {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.normal,
          lineHeight: typography.sizes.lg * typography.lineHeights.normal,
        };
      case 'caption':
        return {
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.normal,
          lineHeight: typography.sizes.sm * typography.lineHeights.normal,
        };
      case 'button':
        return {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.medium,
          lineHeight: typography.sizes.lg * typography.lineHeights.normal,
        };
      default:
        return {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.normal,
          lineHeight: typography.sizes.lg * typography.lineHeights.normal,
        };
    }
  };

  const getColorStyle = () => {
    return { color: colors[color] || colors.text };
  };

  const getWeightStyle = () => {
    return { fontWeight: typography.weights[weight] };
  };

  const getAlignStyle = () => {
    return { textAlign: align };
  };

  const combinedStyle = [
    getVariantStyle(),
    getColorStyle(),
    getWeightStyle(),
    getAlignStyle(),
    style,
  ];

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
}