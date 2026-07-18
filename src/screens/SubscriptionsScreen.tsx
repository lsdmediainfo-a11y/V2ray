// src/screens/SubscriptionsScreen.tsx
// Abonelik Yönetimi Ekranı - HTTP/HTTPS URL üzerinden toplu sunucu içe aktarma ve otomatik güncelleme

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import { useConfigStore, Subscription } from '../store/configStore';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

function formatDate(timestamp: number): string {
  if (!timestamp) return 'Henüz güncellenmedi';
  const d = new Date(timestamp);
  return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function SubscriptionCard({
  subscription,
  onRefresh,
  onDelete,
  onToggleAuto,
  isRefreshing,
}: {
  subscription: Subscription;
  onRefresh: () => void;
  onDelete: () => void;
  onToggleAuto: () => void;
  isRefreshing: boolean;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="link-outline" size={24} color={Colors.primary} />
        </View>
        <View style={styles.subInfo}>
          <Text style={styles.subName} numberOfLines={1}>{subscription.name}</Text>
          <Text style={styles.subUrl} numberOfLines={1}>{subscription.url}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="server-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{subscription.configCount} Sunucu</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{formatDate(subscription.lastUpdated)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.autoRow}>
            <Text style={styles.autoText}>Otomatik Güncelle</Text>
            <Switch
              value={subscription.autoUpdate}
              onValueChange={onToggleAuto}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={subscription.autoUpdate ? Colors.primary : Colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                <Text style={styles.refreshBtnText}>Yenile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export function SubscriptionsScreen() {
  const {
    subscriptions,
    addSubscription,
    refreshSubscription,
    refreshAllSubscriptions,
    deleteSubscription,
    toggleAutoUpdateSubscription,
  } = useConfigStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) {
      Alert.alert('Hata', 'Lütfen geçerli bir abonelik URL\'si girin.');
      return;
    }
    setLoading(true);
    const success = await addSubscription(url.trim(), name.trim() || undefined);
    setLoading(false);

    if (success) {
      setUrl('');
      setName('');
      setModalVisible(false);
      Alert.alert('Başarılı', 'Abonelik ve sunucular içe aktarıldı.');
    } else {
      Alert.alert('Hata', 'Abonelik bağlantısı indirilemedi veya içinde geçerli sunucu bulunamadı.');
    }
  };

  const handleRefreshOne = async (sub: Subscription) => {
    setRefreshingId(sub.id);
    await refreshSubscription(sub.id);
    setRefreshingId(null);
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    await refreshAllSubscriptions();
    setRefreshingAll(false);
  };

  const handleDelete = (sub: Subscription) => {
    Alert.alert(
      'Aboneliği Sil',
      `"${sub.name}" ve bağlı ${sub.configCount} sunucu silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteSubscription(sub.id),
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Header
          title="Abonelik Yönetimi"
          subtitle={`${subscriptions.length} aktif abonelik`}
          rightAction={{
            icon: 'refresh-circle-outline',
            onPress: handleRefreshAll,
            color: Colors.primary,
          }}
        />

        {/* Top actions bar */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.addPill}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addPillGrad}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addPillText}>Yeni Abonelik Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="cloud-download-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz Abonelik Yok</Text>
            <Text style={styles.emptySub}>
              HTTP / HTTPS abonelik URL'nizi ekleyerek sunucularınızı otomatik güncelleyebilirsiniz.
            </Text>
            <Button
              title="Abonelik Bağlantısı Ekle"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <SubscriptionCard
                subscription={item}
                onRefresh={() => handleRefreshOne(item)}
                onDelete={() => handleDelete(item)}
                onToggleAuto={() => toggleAutoUpdateSubscription(item.id)}
                isRefreshing={refreshingId === item.id || refreshingAll}
              />
            )}
          />
        )}

        {/* Add Subscription Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Abonelik Ekle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Abonelik İsmi (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Premium Server List"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Abonelik URL (HTTP / HTTPS)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/sub/v2ray.txt"
                placeholderTextColor={Colors.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <View style={styles.modalButtons}>
                <Button
                  title="İptal"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="İçe Aktar"
                  onPress={handleAdd}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  topActions: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addPill: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  addPillGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  addPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    ...Typography.h3,
    fontSize: 16,
    marginBottom: 2,
  },
  subUrl: {
    ...Typography.caption,
  },
  deleteBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: Colors.bgModal,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
  },
  inputLabel: {
    ...Typography.label,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
