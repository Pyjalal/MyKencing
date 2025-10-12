/**
 * PrimaryButton Component
 * Elderly-friendly button with 3 sizes and 4 variants
 * Specifications:
 * - Large: 60px height (primary actions)
 * - Medium: 52px height
 * - Small: 44px height
 * - Variants: primary, secondary, outline, danger
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, TouchTargets } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  icon,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    isDisabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.primary.main : Colors.primary.contrast}
          size="small"
        />
      ) : (
        <>
          {icon && icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
    gap: 8,
  },

  // Sizes
  small: {
    minHeight: TouchTargets.min - 12, // 44px
    paddingHorizontal: 20,
    minWidth: 100,
  },
  medium: {
    minHeight: TouchTargets.min - 4, // 52px
    paddingHorizontal: 24,
    minWidth: 120,
  },
  large: {
    minHeight: TouchTargets.recommended, // 60px
    paddingHorizontal: 32,
    minWidth: 140,
  },

  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.main,
  },
  secondary: {
    backgroundColor: Colors.secondary.main,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  danger: {
    backgroundColor: Colors.status.error,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  smallText: {
    fontSize: Typography.fontSize.sm,
  },
  mediumText: {
    fontSize: Typography.fontSize.base,
  },
  largeText: {
    fontSize: Typography.fontSize.lg,
  },

  // Variant text colors
  primaryText: {
    color: Colors.primary.contrast,
  },
  secondaryText: {
    color: Colors.secondary.contrast,
  },
  outlineText: {
    color: Colors.primary.main,
  },
  dangerText: {
    color: Colors.primary.contrast,
  },

  disabledText: {
    color: Colors.text.disabled,
  },
});
