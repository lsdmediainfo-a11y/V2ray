// src/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../utils/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: any;
    onPress: () => void;
    color?: string;
  };
  style?: ViewStyle;
}

export function Header({ title, subtitle, onBack, rightAction, style }: HeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {rightAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={rightAction.onPress}>
          <Ionicons name={rightAction.icon} size={22} color={rightAction.color || Colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  actionBtn: {
    padding: 8,
    marginLeft: Spacing.xs,
  },
});
