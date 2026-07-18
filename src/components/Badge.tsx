// src/components/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../utils/theme';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  color = Colors.primary,
  backgroundColor,
  style,
  icon,
}: BadgeProps) {
  const bg = backgroundColor || color + '20';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
