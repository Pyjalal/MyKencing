import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Typography } from '../constants/theme';

interface PillButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PillButton({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  ...touchableProps
}: PillButtonProps) {
  const sizeStyles = SIZE_MAP[size] ?? SIZE_MAP.md;
  const variantStyles = VARIANT_MAP[variant] ?? VARIANT_MAP.primary;
  const indicatorColor = variantStyles.textColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles,
        variantStyles.background ?? {},
        variantStyles.border ?? {},
        disabled ? styles.disabled : {},
        style,
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      {...touchableProps}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              TEXT_SIZE_MAP[size] ?? TEXT_SIZE_MAP.md,
              { color: variantStyles.textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    minHeight: 40,
    paddingHorizontal: 16,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: 24,
  },
};

const TEXT_SIZE_MAP: Record<'sm' | 'md' | 'lg', TextStyle> = {
  sm: {
    fontSize: Typography.fontSize.sm,
  },
  md: {
    fontSize: Typography.fontSize.base,
  },
  lg: {
    fontSize: Typography.fontSize.lg,
  },
};

const VARIANT_MAP: Record<
  'primary' | 'secondary' | 'outline' | 'accent',
  { background?: ViewStyle; border?: ViewStyle; textColor: string }
> = {
  primary: {
    background: { backgroundColor: Colors.primary.main },
    textColor: Colors.primary.contrast,
  },
  secondary: {
    background: { backgroundColor: Colors.status.success },
    textColor: Colors.primary.contrast,
  },
  accent: {
    background: { backgroundColor: Colors.accent.main },
    textColor: Colors.accent.contrast,
  },
  outline: {
    background: { backgroundColor: 'transparent' },
    border: { borderWidth: 2, borderColor: Colors.primary.main },
    textColor: Colors.primary.main,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
