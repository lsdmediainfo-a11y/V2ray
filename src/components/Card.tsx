// src/components/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  active?: boolean;
}

export function Card({ children, style, active = false }: CardProps) {
  return (
    <View style={[styles.card, active && styles.cardActive, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardActive: {
    borderColor: Colors.primary + '80',
  },
});
