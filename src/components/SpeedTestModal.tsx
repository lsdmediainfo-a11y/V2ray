// src/components/SpeedTestModal.tsx
// Interactive Real-Time Speedtest Modal UI

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { runSpeedTest, SpeedTestResult } from '../utils/speedTest';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

interface SpeedTestModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SpeedTestModal({ visible, onClose }: SpeedTestModalProps) {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'latency' | 'download' | 'upload' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [result, setResult] = useState<SpeedTestResult | null>(null);

  useEffect(() => {
    if (visible && phase === 'idle') {
      startTest();
    }
  }, [visible]);

  const startTest = async () => {
    setTesting(true);
    setPhase('latency');
    setProgress(0);
    setCurrentSpeed(0);
    setResult(null);

    try {
      const res = await runSpeedTest((p, prg, spd) => {
        setPhase(p);
        setProgress(prg);
        setCurrentSpeed(spd);
      });
      setResult(res);
      setPhase('complete');
    } catch (err) {
      console.error('Speedtest error:', err);
    } finally {
      setTesting(false);
    }
  };

  const phaseTitle = {
    idle: 'Hazır',
    latency: 'Gecikme Ölçülüyor...',
    download: 'İndirme Hızı Ölçülüyor...',
    upload: 'Yükleme Hızı Ölçülüyor...',
    complete: 'Hız Testi Tamamlandı',
  }[phase];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="speedometer-outline" size={24} color={Colors.primary} />
              <Text style={styles.title}>Hız Testi (Speedtest)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Speed Gauge Display */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeCircle}>
              {testing ? (
                <>
                  <Text style={styles.speedValue}>{currentSpeed.toFixed(1)}</Text>
                  <Text style={styles.speedUnit}>Mbps</Text>
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
                </>
              ) : result ? (
                <>
                  <Text style={[styles.speedValue, { color: Colors.success }]}>
                    {result.downloadMbps.toFixed(1)}
                  </Text>
                  <Text style={styles.speedUnit}>Mbps DL</Text>
                </>
              ) : (
                <Text style={styles.speedUnit}>Başlamak için buton kullanın</Text>
              )}
            </View>
            <Text style={styles.phaseLabel}>{phaseTitle}</Text>
          </View>

          {/* Metric Cards */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Ionicons name="arrow-down-circle" size={20} color={Colors.success} />
              <Text style={styles.metricVal}>{result ? `${result.downloadMbps.toFixed(1)} Mbps` : '—'}</Text>
              <Text style={styles.metricLabel}>İndirme</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="arrow-up-circle" size={20} color={Colors.primary} />
              <Text style={styles.metricVal}>{result ? `${result.uploadMbps.toFixed(1)} Mbps` : '—'}</Text>
              <Text style={styles.metricLabel}>Yükleme</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color={Colors.warning} />
              <Text style={styles.metricVal}>{result ? `${result.latencyMs} ms` : '—'}</Text>
              <Text style={styles.metricLabel}>Ping</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="pulse-outline" size={20} color={Colors.secondary} />
              <Text style={styles.metricVal}>{result ? `${result.jitterMs} ms` : '—'}</Text>
              <Text style={styles.metricLabel}>Jitter</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={startTest}
              disabled={testing}
            >
              <Ionicons name="reload" size={18} color="#fff" />
              <Text style={styles.btnText}>{testing ? 'Test Ediliyor...' : 'Tekrar Test Et'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
              <Text style={[styles.btnText, { color: Colors.textSecondary }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { ...Typography.h3 },
  closeBtn: { padding: 4 },

  gaugeContainer: { alignItems: 'center', marginVertical: Spacing.sm },
  gaugeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.glow(Colors.primary),
  },
  speedValue: { fontSize: 32, fontWeight: '900', color: Colors.primaryLight },
  speedUnit: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  phaseLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricVal: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 4 },
  metricLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border },
  btnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
});
