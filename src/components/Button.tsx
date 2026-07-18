// src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Colors, Radius, Spacing, Typography, Shadow } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.wrapper, style]}
      >
        <LinearGradient
          colors={disabled ? [Colors.border, Colors.border] : [Colors.primary, Colors.primaryDark]}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.textPrimary, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const getStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'danger':
        return styles.danger;
      case 'outline':
      default:
        return styles.outline;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'danger':
        return styles.textDanger;
      case 'outline':
      default:
        return styles.textOutline;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.btn, getStyle(), disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  secondary: {
    backgroundColor: Colors.bgInput,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error + '50',
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  textSecondary: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  textOutline: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  textDanger: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 15,
  },
});
