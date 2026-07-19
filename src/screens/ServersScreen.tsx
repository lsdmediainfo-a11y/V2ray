// src/screens/ServersScreen.tsx
// Sunucu listesi, filtreleme, ülke bayrakları, ping ve sıralama

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useConfigStore, V2RayConfig, Protocol } from '../store/configStore';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
  getProtocolColor,
} from '../utils/theme';

function PingBadge({ ping }: { ping?: number }) {
  if (ping === undefined) return <Text style={styles.pingNone}>—</Text>;
  const color = ping < 120 ? Colors.success : ping < 300 ? Colors.warning : Colors.error;
  return <Text style={[styles.pingText, { color }]}>{ping}ms</Text>;
}

function ServerCard({
  config,
  isActive,
  onSelect,
  onDelete,
  onPing,
  onDetail,
}: {
  config: V2RayConfig;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPing: () => void;
  onDetail: () => void;
}) {
  const protocolColor = config.protocol === 'hysteria2' ? '#EC4899' : getProtocolColor(config.protocol);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={onSelect}
        onLongPress={onDetail}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {isActive && (
          <LinearGradient
            colors={[Colors.primary + '20', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        <View style={styles.cardLeft}>
          <Text style={styles.flagIcon}>{config.flag || '🌐'}</Text>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardName} numberOfLines={1}>{config.name}</Text>
              {config.country && <Text style={styles.countryLabel}>{config.country}</Text>}
            </View>
            <Text style={styles.cardAddress} numberOfLines={1}>
              {config.address}:{config.port}
            </Text>
            <View style={styles.cardMeta}>
              <View style={[styles.tag, { backgroundColor: protocolColor + '20' }]}>
                <Text style={[styles.tagText, { color: protocolColor }]}>{config.protocol.toUpperCase()}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: Colors.bgInput }]}>
                <Text style={styles.tagText}>{config.network.toUpperCase()}</Text>
              </View>
              {config.security !== 'none' && (
                <View style={[styles.tag, { backgroundColor: Colors.success + '20' }]}>
                  <Ionicons name="lock-closed" size={10} color={Colors.success} />
                  <Text style={[styles.tagText, { color: Colors.success }]}>{config.security}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          {isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            </View>
          )}
          <PingBadge ping={config.ping} />
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onPing}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="server-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Sunucu Yok</Text>
      <Text style={styles.emptySubtitle}>
        İlk sunucunuzu ekleyin veya{'\n'}pano'dan URI içe aktarın
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.emptyBtnGrad}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.emptyBtnText}>Sunucu Ekle</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export function ServersScreen() {
  const navigation = useNavigation<any>();
  const {
    configs,
    activeConfigId,
    setActiveConfig,
    deleteConfig,
    pingConfig,
    pingAllConfigs,
    selectFastestConfig,
    importFromClipboard,
  } = useConfigStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredConfigs = useMemo(() => {
    if (selectedFilter === 'all') return configs;
    if (selectedFilter === 'fastest') {
      return [...configs].sort((a, b) => (a.ping || 999) - (b.ping || 999));
    }
    return configs.filter(c => c.protocol === selectedFilter);
  }, [configs, selectedFilter]);

  const handleSelect = useCallback((id: string) => {
    setActiveConfig(id);
  }, []);

  const handleDelete = useCallback((config: V2RayConfig) => {
    Alert.alert(
      'Sunucuyu Sil',
      `"${config.name}" silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteConfig(config.id),
        },
      ]
    );
  }, []);

  const handlePing = useCallback(async (id: string) => {
    await pingConfig(id);
  }, []);

  const handlePingAll = async () => {
    setRefreshing(true);
    await pingAllConfigs();
    setRefreshing(false);
  };

  const handleSelectFastest = async () => {
    setRefreshing(true);
    const fastestId = await selectFastestConfig();
    setRefreshing(false);
    if (!fastestId) {
      Alert.alert('Bilgi', 'Ping atılabilen uygun sunucu bulunamadı.');
    }
  };

  const handleImportClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text) {
      Alert.alert('Hata', 'Pano boş!');
      return;
    }
    const ok = await importFromClipboard(text);
    if (ok) {
      Alert.alert('Başarılı', 'Sunucu(lar) başarıyla içe aktarıldı!');
    } else {
      Alert.alert('Hata', 'Geçerli URI bulunamadı.\nvmess://, vless://, trojan://, ss://, hysteria2:// desteklenir.');
    }
  };

  const filterChips = [
    { id: 'all', label: 'Tümü' },
    { id: 'fastest', label: '⚡ En Hızlı' },
    { id: 'vmess', label: 'VMess' },
    { id: 'vless', label: 'VLess' },
    { id: 'trojan', label: 'Trojan' },
    { id: 'shadowsocks', label: 'Shadowsocks' },
    { id: 'hysteria2', label: 'Hysteria2' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sunucular</Text>
          <Text style={styles.subtitle}>{configs.length} sunucu kayıtlı</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={handleSelectFastest}
          >
            <Ionicons name="flash-outline" size={16} color={Colors.primary} />
            <Text style={[styles.actionPillText, { color: Colors.primary }]}>En Hızlıyı Seç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={handlePingAll}
          >
            <Ionicons name="speedometer-outline" size={16} color={Colors.warning} />
            <Text style={[styles.actionPillText, { color: Colors.warning }]}>Ping At</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={handleImportClipboard}
          >
            <Ionicons name="clipboard-outline" size={16} color={Colors.secondary} />
            <Text style={[styles.actionPillText, { color: Colors.secondary }]}>Panodan İçe Aktar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn]}
            onPress={() => navigation.navigate('AddServer')}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addBtnGrad}>
              <Ionicons name="add" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Filter Chips Bar */}
        {configs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterChips.map(chip => {
              const active = selectedFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(chip.id)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* List */}
        {configs.length === 0 ? (
          <EmptyState onAdd={() => navigation.navigate('AddServer')} />
        ) : (
          <FlatList
            data={filteredConfigs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handlePingAll}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => (
              <ServerCard
                config={item}
                isActive={item.id === activeConfigId}
                onSelect={() => handleSelect(item.id)}
                onDelete={() => handleDelete(item)}
                onPing={() => handlePing(item.id)}
                onDetail={() => navigation.navigate('ServerDetail', { configId: item.id })}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.bodySmall, marginTop: 4 },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionPillText: { fontSize: 12, fontWeight: '600' },
  addBtn: { marginLeft: 'auto' as any },
  addBtnGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },

  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '25',
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primaryLight, fontWeight: '700' },

  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },

  cardWrapper: { marginBottom: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardActive: { borderColor: Colors.primary + '80' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  flagIcon: { fontSize: 28, marginRight: Spacing.xs },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { ...Typography.body, fontWeight: '700', marginBottom: 2, flexShrink: 1 },
  countryLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  cardAddress: { ...Typography.bodySmall, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },

  cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
  activeIndicator: {},
  pingNone: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  pingText: { fontSize: 13, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.bodySmall, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  emptyBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  emptyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
