// src/screens/SettingsScreen.tsx
// Uygulama ayarları

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useConfigStore } from '../store/configStore';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor = Colors.primary,
  label,
  sublabel,
  right,
  onPress,
  separator = true,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  separator?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !separator && styles.rowNoSep]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { configs, clearLogs, routingConfig, updateRoutingConfig } = useConfigStore();

  const [autoConnect, setAutoConnect] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [bypassLAN, setBypassLAN] = useState(true);
  const [ipv6, setIpv6] = useState(false);
  const [dns, setDns] = useState('1.1.1.1');
  const [udpEnabled, setUdpEnabled] = useState(true);
  const [muxEnabled, setMuxEnabled] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Verileri Temizle',
      'Tüm sunucular ve ayarlar silinecek. Devam edilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: () => clearLogs() },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* App info */}
          <View style={styles.appInfo}>
            <View style={styles.appLogo}>
              <Ionicons name="shield" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>V2Ray Client</Text>
            <Text style={styles.appVersion}>v1.0.0 · {configs.length} sunucu</Text>
          </View>

          <SettingsSection title="Bağlantı">
            <SettingsRow
              icon="apps-outline"
              iconColor={Colors.primary}
              label="Uygulama Bölünmüş Tünelleme"
              sublabel="VPN dışı bırakılacak uygulamaları seçin"
              onPress={() => navigation.navigate('AppSplitTunnel')}
            />
            <SettingsRow
              icon="flash-outline"
              iconColor={Colors.warning}
              label="Otomatik Bağlan"
              sublabel="Uygulama açılışında bağlan"
              right={
                <Switch
                  value={autoConnect}
                  onValueChange={setAutoConnect}
                  trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                  thumbColor={autoConnect ? Colors.primary : Colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              iconColor={Colors.error}
              label="Kill Switch"
              sublabel="VPN kesilince interneti kes"
              right={
                <Switch
                  value={killSwitch}
                  onValueChange={setKillSwitch}
                  trackColor={{ false: Colors.border, true: Colors.error + '80' }}
                  thumbColor={killSwitch ? Colors.error : Colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="home-outline"
              iconColor={Colors.success}
              label="LAN'ı Bypass Et"
              sublabel="Yerel ağ trafiğini tünel dışında bırak"
              right={
                <Switch
                  value={bypassLAN}
                  onValueChange={setBypassLAN}
                  trackColor={{ false: Colors.border, true: Colors.success + '80' }}
                  thumbColor={bypassLAN ? Colors.success : Colors.textMuted}
                />
              }
              separator={false}
            />
          </SettingsSection>

          <SettingsSection title="Ağ & Tünelleme">
            <SettingsRow
              icon="git-network-outline"
              iconColor={Colors.primary}
              label="LAN'ı Bypass Et"
              sublabel="Yerel ağ (192.168.x.x vb.) doğrudan bağlansın"
              right={
                <Switch
                  value={routingConfig.bypassLan}
                  onValueChange={(val) => updateRoutingConfig({ bypassLan: val })}
                  trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                  thumbColor={routingConfig.bypassLan ? Colors.primary : Colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="flag-outline"
              iconColor={Colors.secondary}
              label="Yerel Siteleri Bypass Et"
              sublabel="Ülke içi siteler tünel dışı kalsın"
              right={
                <Switch
                  value={routingConfig.bypassDomestic}
                  onValueChange={(val) => updateRoutingConfig({ bypassDomestic: val })}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={routingConfig.bypassDomestic ? Colors.secondary : Colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="globe-outline"
              iconColor={Colors.secondary}
              label="IPv6"
              sublabel="IPv6 desteğini etkinleştir"
              right={
                <Switch
                  value={ipv6}
                  onValueChange={setIpv6}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={ipv6 ? Colors.secondary : Colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="radio-outline"
              iconColor={Colors.accent}
              label="UDP Desteği"
              sublabel="UDP protokolünü etkinleştir"
              right={
                <Switch
                  value={udpEnabled}
                  onValueChange={setUdpEnabled}
                  trackColor={{ false: Colors.border, true: Colors.accent + '80' }}
                  thumbColor={udpEnabled ? Colors.accent : Colors.textMuted}
                />
              }
              separator={false}
            />
          </SettingsSection>

          <SettingsSection title="Uygulama">
            <SettingsRow
              icon="document-text-outline"
              iconColor={Colors.textSecondary}
              label="Günlükleri Temizle"
              onPress={() => { clearLogs(); Alert.alert('Temizlendi', 'Günlükler silindi.'); }}
            />
            <SettingsRow
              icon="information-circle-outline"
              iconColor={Colors.secondary}
              label="Hakkında"
              sublabel="V2Ray Protokol Destekli İstemci"
              onPress={() => Alert.alert('V2Ray Client', 'Sürüm: 1.0.0\n\nVMess, VLess, Trojan, Shadowsocks protokolleri desteklenir.\n\nBu uygulama sadece eğitim ve test amaçlıdır.')}
            />
            <SettingsRow
              icon="trash-outline"
              iconColor={Colors.error}
              label="Tüm Verileri Sil"
              sublabel="Sunucular ve ayarlar silinir"
              onPress={handleClearData}
              separator={false}
            />
          </SettingsSection>

          {/* Protocol support info */}
          <View style={styles.protos}>
            <Text style={styles.protosTitle}>Desteklenen Protokoller</Text>
            <View style={styles.protoRow}>
              {[
                { name: 'VMess', color: Colors.vmess },
                { name: 'VLess', color: Colors.vless },
                { name: 'Trojan', color: Colors.trojan },
                { name: 'SS', color: Colors.shadowsocks },
              ].map(p => (
                <View key={p.name} style={[styles.protoChip, { borderColor: p.color + '60', backgroundColor: p.color + '15' }]}>
                  <Ionicons name="checkmark" size={12} color={p.color} />
                  <Text style={[styles.protoChipText, { color: p.color }]}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.disclaimer}>
            ⚠️ Bu uygulama yalnızca eğitim ve araştırma amaçlıdır. Yerel yasalara uygun olarak kullanın.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  title: { ...Typography.h2 },

  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 60 },

  appInfo: { alignItems: 'center', paddingVertical: Spacing.xl },
  appLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    marginBottom: Spacing.md,
    ...Shadow.glow(Colors.primary),
  },
  appName: { ...Typography.h2, marginBottom: 4 },
  appVersion: { ...Typography.bodySmall },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm, paddingLeft: 4 },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowNoSep: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rowContent: { flex: 1 },
  rowLabel: { ...Typography.body, fontSize: 14, fontWeight: '500' },
  rowSublabel: { ...Typography.caption, marginTop: 2 },

  protos: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  protosTitle: { ...Typography.label, marginBottom: Spacing.sm },
  protoRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  protoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  protoChipText: { fontSize: 12, fontWeight: '700' },

  disclaimer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
});
