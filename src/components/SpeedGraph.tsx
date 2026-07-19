// src/components/SpeedGraph.tsx
// Real-time Live SVG Bandwidth Speed Graph Component

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';

interface SpeedGraphProps {
  dlHistory: number[]; // Speed values in KB/s
  ulHistory: number[];
  width?: number;
  height?: number;
}

export function SpeedGraph({ dlHistory, ulHistory, width = 320, height = 100 }: SpeedGraphProps) {
  const maxSpeed = Math.max(10, ...dlHistory, ...ulHistory);

  const createSvgPath = (data: number[]) => {
    if (data.length === 0) return '';
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - (val / maxSpeed) * (height - 15) - 5;
      return `${x},${y}`;
    });

    return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  };

  const createLinePath = (data: number[]) => {
    if (data.length === 0) return '';
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - (val / maxSpeed) * (height - 15) - 5;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>DL (İndirme)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>UL (Yükleme)</Text>
        </View>
      </View>

      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          <LinearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.success} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={Colors.success} stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="ulGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Download Area & Line */}
        <Path d={createSvgPath(dlHistory)} fill="url(#dlGradient)" />
        <Path d={createLinePath(dlHistory)} stroke={Colors.success} strokeWidth="2" fill="none" />

        {/* Upload Area & Line */}
        <Path d={createSvgPath(ulHistory)} fill="url(#ulGradient)" />
        <Path d={createLinePath(ulHistory)} stroke={Colors.primary} strokeWidth="2" fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 11,
  },
  svg: {
    overflow: 'hidden',
  },
});
