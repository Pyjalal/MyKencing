import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'yellow' | 'light' | 'white';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;
  minWidth?: number;
}

export function PillButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
  backgroundColor,
  textColor,
  minWidth,
}: PillButtonProps) {
  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 14 : 10,
    paddingHorizontal: size === 'sm' ? 16 : size === 'lg' ? 32 : 24,
    minWidth: minWidth,
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  if (backgroundColor) {
    buttonStyle.backgroundColor = backgroundColor;
  } else if (variant === 'yellow') {
    buttonStyle.backgroundColor = '#F8D849';
  } else if (variant === 'light') {
    buttonStyle.backgroundColor = '#EFF1FE';
  } else if (variant === 'white') {
    buttonStyle.backgroundColor = Colors.background.card;
  } else if (variant === 'primary') {
    buttonStyle.backgroundColor = Colors.primary.main;
  } else if (variant === 'secondary') {
    buttonStyle.backgroundColor = Colors.status.success;
  } else if (variant === 'outline') {
    buttonStyle.backgroundColor = 'transparent';
    buttonStyle.borderWidth = 2;
    buttonStyle.borderColor = Colors.primary.main;
  }

  const defaultTextStyle: TextStyle = {
    fontSize: size === 'sm' ? Typography.fontSize.sm : size === 'lg' ? Typography.fontSize.lg : Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: textColor || (variant === 'outline' ? Colors.primary.main : Colors.text.primary),
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary.main : Colors.text.primary} />
      ) : (
        <>
          {icon && <View style={{ marginRight: Spacing.xs }}>{icon}</View>}
          <Text style={defaultTextStyle}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
