// src/screens/AddServerScreen.tsx
// Manuel sunucu ekleme ve URI import formu

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useConfigStore, Protocol } from '../store/configStore';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';

type TabType = 'manual' | 'uri';

const PROTOCOLS: { key: Protocol; label: string; color: string }[] = [
  { key: 'vmess', label: 'VMess', color: Colors.vmess },
  { key: 'vless', label: 'VLess', color: Colors.vless },
  { key: 'trojan', label: 'Trojan', color: Colors.trojan },
  { key: 'shadowsocks', label: 'SS', color: Colors.shadowsocks },
  { key: 'hysteria2', label: 'Hysteria2', color: '#EC4899' },
];

const NETWORKS = ['tcp', 'ws', 'grpc', 'h2', 'kcp'] as const;
const SECURITIES = ['none', 'tls', 'xtls'] as const;

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={{ color: Colors.error }}>*</Text>}
      </Text>
      {children}
    </View>
  );
}

function TextInputField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textDisabled}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.segmentItem, value === opt.key && { backgroundColor: opt.color || Colors.primary }]}
          onPress={() => onChange(opt.key)}
        >
          <Text style={[
            styles.segmentText,
            value === opt.key && styles.segmentTextActive,
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AddServerScreen() {
  const navigation = useNavigation<any>();
  const { addConfig, importFromClipboard } = useConfigStore();
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  // Manual form state
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<Protocol>('vmess');
  const [address, setAddress] = useState('');
  const [port, setPort] = useState('443');
  const [uuid, setUuid] = useState('');
  const [password, setPassword] = useState('');
  const [alterId, setAlterId] = useState('0');
  const [security, setSecurity] = useState<'none' | 'tls' | 'xtls'>('tls');
  const [network, setNetwork] = useState<'tcp' | 'ws' | 'grpc' | 'h2' | 'kcp'>('tcp');
  const [path, setPath] = useState('');
  const [host, setHost] = useState('');
  const [sni, setSni] = useState('');
  const [allowInsecure, setAllowInsecure] = useState(false);

  // URI import state
  const [uriText, setUriText] = useState('');

  const handleManualAdd = async () => {
    if (!address.trim()) return Alert.alert('Hata', 'Sunucu adresi gerekli!');
    if (!port || isNaN(Number(port))) return Alert.alert('Hata', 'Geçerli bir port girin!');
    if ((protocol === 'vmess' || protocol === 'vless') && !uuid.trim())
      return Alert.alert('Hata', 'UUID gerekli!');
    if ((protocol === 'trojan' || protocol === 'shadowsocks') && !password.trim())
      return Alert.alert('Hata', 'Şifre gerekli!');

    await addConfig({
      name: name.trim() || address,
      protocol,
      address: address.trim(),
      port: Number(port),
      uuid: uuid.trim() || undefined,
      password: password.trim() || undefined,
      alterId: Number(alterId),
      security,
      network,
      path: path.trim() || undefined,
      host: host.trim() || undefined,
      sni: sni.trim() || undefined,
      allowInsecure,
    });
    Alert.alert('Başarılı', 'Sunucu eklendi!', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
  };

  const handleUriImport = async () => {
    const text = uriText.trim();
    if (!text) {
      Alert.alert('Hata', 'URI girin!');
      return;
    }
    const ok = await importFromClipboard(text);
    if (ok) {
      Alert.alert('Başarılı', 'Sunucu(lar) içe aktarıldı!', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert('Hata', 'Geçerli URI bulunamadı.\n\nvmess://, vless://, trojan://, ss:// desteklenir.');
    }
  };

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    setUriText(text);
  };

  const needsUUID = protocol === 'vmess' || protocol === 'vless';
  const needsPassword = protocol === 'trojan' || protocol === 'shadowsocks';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sunucu Ekle</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Ionicons name="create-outline" size={16} color={activeTab === 'manual' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>Manuel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'uri' && styles.tabActive]}
              onPress={() => setActiveTab('uri')}
            >
              <Ionicons name="link-outline" size={16} color={activeTab === 'uri' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'uri' && styles.tabTextActive]}>URI / QR</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'manual' ? (
              <>
                <FormField label="İsim">
                  <TextInputField value={name} onChangeText={setName} placeholder="Sunucu Adı (isteğe bağlı)" />
                </FormField>

                <FormField label="Protokol" required>
                  <SegmentControl options={PROTOCOLS} value={protocol} onChange={setProtocol} />
                </FormField>

                <FormField label="Adres" required>
                  <TextInputField
                    value={address}
                    onChangeText={setAddress}
                    placeholder="example.com veya 1.2.3.4"
                    keyboardType="url"
                  />
                </FormField>

                <FormField label="Port" required>
                  <TextInputField
                    value={port}
                    onChangeText={setPort}
                    placeholder="443"
                    keyboardType="numeric"
                  />
                </FormField>

                {needsUUID && (
                  <FormField label="UUID" required>
                    <TextInputField
                      value={uuid}
                      onChangeText={setUuid}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </FormField>
                )}

                {needsPassword && (
                  <FormField label="Şifre" required>
                    <TextInputField
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Şifre"
                      secureTextEntry
                    />
                  </FormField>
                )}

                {protocol === 'vmess' && (
                  <FormField label="Alter ID">
                    <TextInputField
                      value={alterId}
                      onChangeText={setAlterId}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </FormField>
                )}

                <FormField label="Güvenlik">
                  <SegmentControl
                    options={SECURITIES.map(s => ({ key: s, label: s === 'none' ? 'Yok' : s.toUpperCase() }))}
                    value={security}
                    onChange={setSecurity}
                  />
                </FormField>

                <FormField label="Ağ">
                  <SegmentControl
                    options={NETWORKS.map(n => ({ key: n, label: n.toUpperCase() }))}
                    value={network}
                    onChange={setNetwork}
                  />
                </FormField>

                {(network === 'ws' || network === 'h2') && (
                  <FormField label="Path">
                    <TextInputField value={path} onChangeText={setPath} placeholder="/path" />
                  </FormField>
                )}

                {network === 'ws' && (
                  <FormField label="Host">
                    <TextInputField value={host} onChangeText={setHost} placeholder="example.com" />
                  </FormField>
                )}

                {security !== 'none' && (
                  <>
                    <FormField label="SNI">
                      <TextInputField value={sni} onChangeText={setSni} placeholder="example.com" />
                    </FormField>

                    <View style={styles.switchRow}>
                      <View>
                        <Text style={styles.switchLabel}>Güvensiz Sertifikaya İzin Ver</Text>
                        <Text style={styles.switchDesc}>Önerilmez — yalnızca test için</Text>
                      </View>
                      <Switch
                        value={allowInsecure}
                        onValueChange={setAllowInsecure}
                        trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                        thumbColor={allowInsecure ? Colors.primary : Colors.textMuted}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleManualAdd}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.submitGrad}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitText}>Sunucu Ekle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* URI Import */}
                <View style={styles.uriSection}>
                  <View style={styles.uriHeader}>
                    <Text style={styles.uriTitle}>URI Yapıştır</Text>
                    <TouchableOpacity style={styles.pasteBtn} onPress={pasteFromClipboard}>
                      <Ionicons name="clipboard-outline" size={16} color={Colors.secondary} />
                      <Text style={styles.pasteBtnText}>Panoya Yapıştır</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.uriInput}
                    value={uriText}
                    onChangeText={setUriText}
                    placeholder={
                      'vmess://...\nvless://...\ntrojan://...\nss://...\n\n(Her satıra bir URI)'
                    }
                    placeholderTextColor={Colors.textDisabled}
                    multiline
                    numberOfLines={8}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <View style={styles.supportedProtos}>
                    <Text style={styles.supportedTitle}>Desteklenen Protokoller:</Text>
                    <View style={styles.protoTags}>
                      {['vmess://', 'vless://', 'trojan://', 'ss://'].map(p => (
                        <View key={p} style={styles.protoTag}>
                          <Text style={styles.protoTagText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { marginBottom: Spacing.sm }]}
                    onPress={() => navigation.navigate('QRScanner')}
                  >
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.submitGrad}>
                      <Ionicons name="camera-outline" size={20} color="#fff" />
                      <Text style={styles.submitText}>Kamera ile QR Tara</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleUriImport}>
                    <LinearGradient colors={[Colors.secondary, Colors.secondaryDark]} style={styles.submitGrad}>
                      <Ionicons name="download-outline" size={20} color="#fff" />
                      <Text style={styles.submitText}>İçe Aktar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgModal },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  headerTitle: { ...Typography.h3 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  tabActive: { backgroundColor: Colors.bgInput },
  tabText: { ...Typography.label, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  field: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, marginBottom: 6 },

  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  inputMultiline: { height: 100, textAlignVertical: 'top', paddingTop: Spacing.sm },

  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm - 2,
  },
  segmentText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { color: '#fff' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: { ...Typography.body, fontSize: 14 },
  switchDesc: { ...Typography.caption, marginTop: 2 },

  submitBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // URI Tab
  uriSection: {},
  uriHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  uriTitle: { ...Typography.h3, fontSize: 16 },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary + '20',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  pasteBtnText: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  uriInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    padding: Spacing.md,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  supportedProtos: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  supportedTitle: { ...Typography.caption, marginBottom: 8 },
  protoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  protoTag: {
    backgroundColor: Colors.primary + '20',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  protoTagText: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
