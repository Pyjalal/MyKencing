import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { cn } from '../lib/utils';
import { Colors } from '../constants/theme';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function PillButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  className,
}: PillButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "rounded-pill flex-row items-center justify-center",
        size === 'sm' && "h-10 px-4",
        size === 'md' && "h-14 px-6",
        size === 'lg' && "h-16 px-8",
        variant === 'primary' && "bg-primary",
        variant === 'secondary' && "bg-success",
        variant === 'outline' && "bg-transparent border-2 border-primary",
        (disabled || loading) && "opacity-50",
        className
      )}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary.main : Colors.primary.contrast} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={cn(
            "font-semibold",
            size === 'sm' && "text-sm",
            size === 'md' && "text-base",
            size === 'lg' && "text-lg",
            variant === 'outline' ? "text-primary" : "text-white"
          )}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
