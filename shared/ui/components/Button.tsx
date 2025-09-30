/**
 * Button Component
 * Consistent button styling with design tokens and accessibility
 */

import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  AccessibilityRole 
} from 'react-native';
import { Text } from './Text';
import { useDesignTokens } from '../tokens';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  children,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const { colors, spacing, borderRadius, shadows, opacity } = useDesignTokens();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 36,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 44,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          minHeight: 52,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
          ...shadows.sm,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderWidth: 0,
          ...shadows.sm,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'surface'; // White text on colored background
      case 'outline':
      case 'ghost':
        return 'primary';
    }
  };

  const disabled = isDisabled || isLoading;

  const buttonStyles = [
    styles.base,
    getSizeStyles(),
    getVariantStyles(),
    fullWidth && styles.fullWidth,
    disabled && { opacity: opacity.disabled },
    style,
  ];

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityState: { 
      disabled: disabled,
      busy: isLoading,
    },
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      {...accessibilityProps}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={colors[getTextColor()]} 
        />
      ) : (
        <Text 
          variant="button" 
          color={getTextColor()} 
          align="center"
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});