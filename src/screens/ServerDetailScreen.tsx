// src/screens/ServerDetailScreen.tsx
// Sunucu detayları, QR kodu, konfigürasyon görüntüleme

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useConfigStore } from '../store/configStore';
import { Colors, Spacing, Radius, Typography, Shadow, getProtocolColor } from '../utils/theme';

function InfoRow({ label, value, mono = false, copyable = false }: {
  label: string;
  value: string | number | undefined;
  mono?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = async () => {
    if (value !== undefined) {
      await Clipboard.setStringAsync(String(value));
      Alert.alert('Kopyalandı', `${label} panoya kopyalandı.`);
    }
  };

  if (value === undefined || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.infoValueRow}
        onPress={copyable ? handleCopy : undefined}
        disabled={!copyable}
      >
        <Text style={[styles.infoValue, mono && styles.infoValueMono]} numberOfLines={2}>
          {String(value)}
        </Text>
        {copyable && (
          <Ionicons name="copy-outline" size={14} color={Colors.textMuted} style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>
    </View>
  );
}

function generateVmessUri(config: any): string {
  const obj = {
    v: '2',
    ps: config.name,
    add: config.address,
    port: String(config.port),
    id: config.uuid || '',
    aid: String(config.alterId || 0),
    net: config.network,
    type: 'none',
    host: config.host || '',
    path: config.path || '',
    tls: config.security === 'tls' ? 'tls' : '',
  };
  return 'vmess://' + btoa(JSON.stringify(obj));
}

function generateShareUri(config: any): string {
  const proto = config.protocol;
  if (proto === 'vmess') return generateVmessUri(config);
  if (proto === 'vless') {
    const params = new URLSearchParams();
    if (config.security !== 'none') params.set('security', config.security);
    if (config.network !== 'tcp') params.set('type', config.network);
    if (config.path) params.set('path', config.path);
    if (config.sni) params.set('sni', config.sni);
    const q = params.toString();
    return `vless://${config.uuid}@${config.address}:${config.port}${q ? '?' + q : ''}#${encodeURIComponent(config.name)}`;
  }
  if (proto === 'trojan') {
    return `trojan://${config.password}@${config.address}:${config.port}#${encodeURIComponent(config.name)}`;
  }
  return `ss://${btoa(`aes-256-gcm:${config.password}`)}@${config.address}:${config.port}#${encodeURIComponent(config.name)}`;
}

export function ServerDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { configId } = route.params;
  const { configs, deleteConfig, setActiveConfig, activeConfigId } = useConfigStore();

  const config = configs.find(c => c.id === configId);
  const [showQR, setShowQR] = useState(false);

  if (!config) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={Typography.body}>Sunucu bulunamadı</Text>
      </View>
    );
  }

  const shareUri = generateShareUri(config);
  const protocolColor = getProtocolColor(config.protocol);
  const isActive = config.id === activeConfigId;

  const handleShare = async () => {
    await Share.share({ message: shareUri, title: config.name });
  };

  const handleCopyUri = async () => {
    await Clipboard.setStringAsync(shareUri);
    Alert.alert('Kopyalandı', 'Paylaşım URI\'si panoya kopyalandı.');
  };

  const handleDelete = () => {
    Alert.alert(
      'Sunucuyu Sil',
      `"${config.name}" silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await deleteConfig(config.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{config.name}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Protocol badge */}
          <View style={styles.topSection}>
            <View style={[styles.protoBig, { backgroundColor: protocolColor + '20', borderColor: protocolColor + '50' }]}>
              <Text style={[styles.protoLetterBig, { color: protocolColor }]}>
                {config.protocol[0].toUpperCase()}
              </Text>
            </View>
            <View style={[styles.protoTag, { backgroundColor: protocolColor + '20' }]}>
              <Text style={[styles.protoTagText, { color: protocolColor }]}>
                {config.protocol.toUpperCase()}
              </Text>
            </View>
            {config.ping !== undefined && (
              <Text style={styles.pingText}>{config.ping}ms</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {!isActive && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.primary + '20', borderColor: Colors.primary + '50' }]}
                onPress={() => setActiveConfig(config.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Seç</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary + '50' }]}
              onPress={() => setShowQR(!showQR)}
            >
              <Ionicons name="qr-code-outline" size={18} color={Colors.secondary} />
              <Text style={[styles.actionBtnText, { color: Colors.secondary }]}>QR Kod</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.warning + '20', borderColor: Colors.warning + '50' }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={18} color={Colors.warning} />
              <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Paylaş</Text>
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          {showQR && (
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <QRCode value={shareUri} size={220} color={Colors.text} backgroundColor={Colors.bgCard} />
              </View>
              <TouchableOpacity style={styles.copyUriBtn} onPress={handleCopyUri}>
                <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.copyUriText}>URI Kopyala</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info rows */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Bağlantı Bilgileri</Text>
            <InfoRow label="Sunucu Adı" value={config.name} copyable />
            <InfoRow label="Adres" value={config.address} copyable mono />
            <InfoRow label="Port" value={config.port} />
            <InfoRow label="Protokol" value={config.protocol} />
            <InfoRow label="Ağ" value={config.network} />
            <InfoRow label="Güvenlik" value={config.security} />
          </View>

          {(config.uuid || config.password) && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Kimlik Doğrulama</Text>
              {config.uuid && <InfoRow label="UUID" value={config.uuid} copyable mono />}
              {config.password && <InfoRow label="Şifre" value={config.password} copyable mono />}
              {config.alterId !== undefined && <InfoRow label="Alter ID" value={config.alterId} />}
            </View>
          )}

          {(config.path || config.host || config.sni) && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Gelişmiş</Text>
              {config.path && <InfoRow label="Path" value={config.path} copyable mono />}
              {config.host && <InfoRow label="Host" value={config.host} copyable />}
              {config.sni && <InfoRow label="SNI" value={config.sni} copyable />}
              {config.allowInsecure !== undefined && (
                <InfoRow label="Güvensiz Sertifika" value={config.allowInsecure ? 'Evet' : 'Hayır'} />
              )}
            </View>
          )}

          {/* Share URI box */}
          <View style={styles.uriBox}>
            <Text style={styles.uriLabel}>Paylaşım URI'si</Text>
            <TouchableOpacity onPress={handleCopyUri}>
              <Text style={styles.uriText} numberOfLines={3}>{shareUri}</Text>
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
  scroll: { padding: Spacing.md, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: { ...Typography.h3, flex: 1 },
  deleteBtn: { padding: 8 },

  topSection: { alignItems: 'center', marginBottom: Spacing.lg },
  protoBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  protoLetterBig: { fontSize: 28, fontWeight: '900' },
  protoTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 6,
  },
  protoTagText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  pingText: { ...Typography.bodySmall, color: Colors.success },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  qrContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  qrBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
    marginBottom: Spacing.sm,
  },
  copyUriBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  copyUriText: { ...Typography.bodySmall },

  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm, color: Colors.primary },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '50',
  },
  infoLabel: { ...Typography.caption, flex: 0.4, paddingTop: 2 },
  infoValueRow: { flex: 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  infoValue: { ...Typography.bodySmall, color: Colors.text, textAlign: 'right', flex: 1 },
  infoValueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },

  uriBox: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  uriLabel: { ...Typography.caption, marginBottom: 6 },
  uriText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

