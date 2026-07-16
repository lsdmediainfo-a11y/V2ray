// src/screens/LogsScreen.tsx
// Bağlantı günlükleri ekranı

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfigStore } from '../store/configStore';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

function LogEntry({ message, index }: { message: string; index: number }) {
  const isSuccess = message.includes('✓') || message.includes('başarılı');
  const isError = message.includes('hata') || message.includes('Hata') || message.includes('ERROR');
  const isWarn = message.includes('Bağlantı kesildi') || message.includes('uyarı');

  const color = isSuccess ? Colors.success : isError ? Colors.error : isWarn ? Colors.warning : Colors.textSecondary;

  return (
    <View style={[styles.logEntry, { borderLeftColor: color }]}>
      <Text style={[styles.logText, { color }]}>{message}</Text>
    </View>
  );
}

export function LogsScreen() {
  const { logs, clearLogs, addLog, isConnected } = useConfigStore();
  const listRef = useRef<FlatList>(null);

  const handleClear = () => {
    Alert.alert('Günlükleri Temizle', 'Tüm günlükler silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: clearLogs },
    ]);
  };

  const addTestLog = () => {
    const msgs = [
      `[${new Date().toLocaleTimeString()}] Tünel başlatıldı`,
      `[${new Date().toLocaleTimeString()}] DNS çözümlendi: 1.1.1.1`,
      `[${new Date().toLocaleTimeString()}] ✓ TCP bağlantısı kuruldu`,
      `[${new Date().toLocaleTimeString()}] Veri akışı başlıyor...`,
    ];
    msgs.forEach(m => addLog(m));
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Günlük</Text>
            <Text style={styles.subtitle}>{logs.length} kayıt</Text>
          </View>
          <View style={styles.headerActions}>
            {isConnected && (
              <TouchableOpacity style={styles.headerBtn} onPress={addTestLog}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.secondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerBtn} onPress={handleClear}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terminal area */}
        <View style={styles.terminal}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.dot, { backgroundColor: Colors.error }]} />
              <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            </View>
            <Text style={styles.terminalTitle}>v2ray-log</Text>
            <View style={styles.terminalStatus}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.textMuted }]} />
              <Text style={styles.statusText}>{isConnected ? 'RUNNING' : 'STOPPED'}</Text>
            </View>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyLog}>
              <Ionicons name="terminal-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Henüz günlük yok</Text>
              <Text style={styles.emptySubtext}>Bağlandığınızda günlükler burada görünür</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={logs}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={styles.logList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => <LogEntry message={item} index={index} />}
            />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: Colors.success, label: 'Başarı' },
            { color: Colors.error, label: 'Hata' },
            { color: Colors.warning, label: 'Uyarı' },
            { color: Colors.textSecondary, label: 'Bilgi' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.bodySmall, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  terminal: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#050810',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  terminalDots: { flexDirection: 'row', gap: 5, marginRight: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  terminalStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },

  logList: { padding: Spacing.sm },
  logEntry: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.sm,
    paddingVertical: 3,
    marginBottom: 2,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },

  emptyLog: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.md },
  emptySubtext: { ...Typography.bodySmall, textAlign: 'center', marginTop: 4 },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, fontSize: 10 },
});
