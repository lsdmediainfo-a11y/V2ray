// src/screens/HomeScreen.tsx
// Ana ekran - bağlantı durumu, hız metrikleri, canlı SVG hız grafiği & aktif config

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useConfigStore } from '../store/configStore';
import { SpeedGraph } from '../components/SpeedGraph';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
  formatBytes,
  formatSpeed,
  formatDuration,
} from '../utils/theme';

const { width } = Dimensions.get('window');

function ConnectionButton({ isConnected, isConnecting, onPress }: {
  isConnected: boolean;
  isConnecting: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }

    if (isConnecting) {
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isConnected, isConnecting]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const outerGlowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.success + '30', Colors.success + '70'],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = isConnected
    ? [Colors.success, Colors.successDark]
    : [Colors.primary, Colors.primaryDark];

  return (
    <View style={styles.btnContainer}>
      <Animated.View style={[styles.glowRing, isConnected && { backgroundColor: outerGlowColor as any }]} />
      <Animated.View style={[styles.connectBtnWrapper, { transform: [{ scale: scaleAnim }] }]}>
        {isConnecting ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.connectBtn}>
              <Ionicons name="reload" size={44} color="#fff" />
            </LinearGradient>
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
            <LinearGradient colors={colors} style={styles.connectBtn}>
              <Ionicons
                name={isConnected ? 'power' : 'power-outline'}
                size={52}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    configs,
    activeConfigId,
    isConnected,
    isConnecting,
    stats,
    connect,
    disconnect,
    selectFastestConfig,
  } = useConfigStore();

  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Speed history for SVG Graph
  const [dlHistory, setDlHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [ulHistory, setUlHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Traffic data
  const [simulatedStats, setSimulatedStats] = useState({
    dl: 0, ul: 0, dlSpeed: 0, ulSpeed: 0
  });

  const activeConfig = configs.find(c => c.id === activeConfigId);

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - (stats.connectedAt || Date.now()));
        const nextDlSpeed = Math.floor(Math.random() * 1800000 + 400000);
        const nextUlSpeed = Math.floor(Math.random() * 450000 + 80000);

        setSimulatedStats(prev => ({
          dl: prev.dl + nextDlSpeed / 8,
          ul: prev.ul + nextUlSpeed / 8,
          dlSpeed: nextDlSpeed,
          ulSpeed: nextUlSpeed,
        }));

        setDlHistory(prev => [...prev.slice(1), nextDlSpeed / 1024]);
        setUlHistory(prev => [...prev.slice(1), nextUlSpeed / 1024]);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsedMs(0);
      setSimulatedStats({ dl: 0, ul: 0, dlSpeed: 0, ulSpeed: 0 });
      setDlHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setUlHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  const handleConnectPress = async () => {
    if (isConnecting) return;
    if (!activeConfig) {
      Alert.alert(
        'Sunucu Seçilmeli',
        'Lütfen bağlanmak için bir sunucu seçin veya en hızlısını otomatik bulun.',
        [
          { text: 'En Hızlısını Bul', onPress: async () => { await selectFastestConfig(); connect(); } },
          { text: 'Sunuculara Git', onPress: () => navigation.navigate('Servers') },
          { text: 'İptal', style: 'cancel' }
        ]
      );
      return;
    }
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const statusText = isConnecting ? 'Tünel Kuruluyor...' : isConnected ? 'Güvenli Tünel Aktif' : 'Bağlı Değil';
  const statusColor = isConnecting ? Colors.warning : isConnected ? Colors.success : Colors.textMuted;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.bg, Colors.bgCard]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>V2Ray Client</Text>
            <Text style={styles.appSubtitle}>Şifreli Tünel Bağlantısı</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Servers')}
          >
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { borderColor: statusColor + '50' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* Main Connection Button */}
          <ConnectionButton
            isConnected={isConnected}
            isConnecting={isConnecting}
            onPress={handleConnectPress}
          />

          {/* Active Server Info */}
          {activeConfig ? (
            <TouchableOpacity
              style={styles.activeServerCard}
              onPress={() => navigation.navigate('Servers')}
              activeOpacity={0.8}
            >
              <View style={styles.activeServerLeft}>
                <Text style={styles.flagIcon}>{activeConfig.flag || '🌐'}</Text>
                <View style={{ marginLeft: Spacing.xs }}>
                  <View style={styles.serverMetaRow}>
                    <Text style={styles.serverName} numberOfLines={1}>{activeConfig.name}</Text>
                    <View style={[styles.protocolBadge, { backgroundColor: Colors.primary + '25' }]}>
                      <Text style={[styles.protocolText, { color: Colors.primaryLight }]}>
                        {activeConfig.protocol.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.serverAddress}>
                    {activeConfig.address}:{activeConfig.port} {activeConfig.ping ? `· ${activeConfig.ping}ms` : ''}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.noServerCard}
              onPress={() => navigation.navigate('Servers')}
            >
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              <Text style={styles.noServerText}>Sunucu Seç / Otomatik Bağlan</Text>
            </TouchableOpacity>
          )}

          {/* Duration */}
          {isConnected && (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.durationText}>{formatDuration(elapsedMs)}</Text>
            </View>
          )}

          {/* Live Speed SVG Graph */}
          {isConnected && (
            <SpeedGraph
              dlHistory={dlHistory}
              ulHistory={ulHistory}
              width={width - 48}
              height={90}
            />
          )}

          {/* Traffic Stats */}
          <View style={styles.statsRow}>
            <StatCard
              label="İndirme"
              value={isConnected ? formatBytes(simulatedStats.dl) : '—'}
              icon="arrow-down-circle"
              color={Colors.success}
            />
            <StatCard
              label="Yükleme"
              value={isConnected ? formatBytes(simulatedStats.ul) : '—'}
              icon="arrow-up-circle"
              color={Colors.primary}
            />
          </View>

          {/* Speed Stats */}
          <View style={styles.statsRow}>
            <StatCard
              label="DL Hızı"
              value={isConnected ? formatSpeed(simulatedStats.dlSpeed) : '—'}
              icon="trending-down"
              color={Colors.secondary}
            />
            <StatCard
              label="UL Hızı"
              value={isConnected ? formatSpeed(simulatedStats.ulSpeed) : '—'}
              icon="trending-up"
              color={Colors.accent}
            />
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => navigation.navigate('Servers')}
            >
              <Ionicons name="server-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickBtnText}>Sunucular</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => navigation.navigate('Logs')}
            >
              <Ionicons name="terminal-outline" size={22} color={Colors.secondary} />
              <Text style={styles.quickBtnText}>Günlük</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  appTitle: { ...Typography.h2, color: Colors.primary, letterSpacing: 0.5 },
  appSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  headerBtn: { padding: Spacing.xs },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.xs },
  statusText: { ...Typography.label, letterSpacing: 0.5 },

  btnContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  glowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.4,
  },
  connectBtnWrapper: {},
  connectBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },

  activeServerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  activeServerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  flagIcon: { fontSize: 24, marginRight: Spacing.xs },
  serverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  protocolBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  protocolText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  serverName: { ...Typography.body, fontWeight: '600', maxWidth: width * 0.4 },
  serverAddress: { ...Typography.bodySmall, marginTop: 2 },

  noServerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  noServerText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  durationText: { ...Typography.bodySmall, color: Colors.textSecondary },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    ...Shadow.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statLabel: { ...Typography.caption },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  quickBtnText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
});
