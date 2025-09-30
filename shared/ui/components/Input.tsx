/**
 * Input Component
 * Consistent text input styling with design tokens and accessibility
 */

import React, { useState } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  View, 
  StyleSheet,
  ViewStyle,
  AccessibilityRole 
} from 'react-native';
import { Text } from './Text';
import { useDesignTokens } from '../tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  isDisabled?: boolean;
  containerStyle?: ViewStyle | ViewStyle[];
}

export function Input({
  label,
  error,
  hint,
  size = 'md',
  variant = 'outline',
  isDisabled = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { colors, spacing, borderRadius, typography, opacity } = useDesignTokens();
  const [isFocused, setIsFocused] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 36,
          fontSize: typography.sizes.md,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 44,
          fontSize: typography.sizes.lg,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          minHeight: 52,
          fontSize: typography.sizes.xl,
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: borderRadius.md,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error 
            ? colors.error 
            : isFocused 
              ? colors.primary 
              : colors.border,
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.primaryLight,
          borderWidth: 1,
          borderColor: error 
            ? colors.error 
            : isFocused 
              ? colors.primary 
              : 'transparent',
        };
    }
  };

  const inputStyles = [
    styles.base,
    getSizeStyles(),
    getVariantStyles(),
    isDisabled && { opacity: opacity.disabled },
    {
      color: colors.text,
    },
    style,
  ];

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'none' as AccessibilityRole, // TextInput has its own accessibility
    accessibilityState: { 
      disabled: isDisabled,
    },
    accessibilityLabel: label,
    accessibilityHint: hint || error,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text 
          variant="caption" 
          color="textSecondary" 
          weight="medium"
          style={styles.label}
        >
          {label}
        </Text>
      )}
      
      <TextInput
        style={inputStyles}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={!isDisabled}
        placeholderTextColor={colors.textMuted}
        {...accessibilityProps}
        {...props}
      />
      
      {error && (
        <Text 
          variant="caption" 
          color="error"
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
      
      {hint && !error && (
        <Text 
          variant="caption" 
          color="textSecondary"
          style={styles.hintText}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4, // Small margin to prevent crowding
  },
  base: {
    fontFamily: undefined, // Use system font
  },
  label: {
    marginBottom: 4,
  },
  errorText: {
    marginTop: 4,
  },
  hintText: {
    marginTop: 4,
  },
});