// src/screens/AppSplitTunnelScreen.tsx
// Uygulama Bazlı Bölünmüş Tünelleme (App Split Tunneling) Ekranı

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useConfigStore } from '../store/configStore';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

interface AppItem {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  category: string;
}

const DEFAULT_APPS: AppItem[] = [
  { id: '1', name: 'Chrome', packageName: 'com.android.chrome', icon: 'logo-chrome', category: 'Tarayıcı' },
  { id: '2', name: 'Telegram', packageName: 'org.telegram.messenger', icon: 'paper-plane', category: 'Mesajlaşma' },
  { id: '3', name: 'YouTube', packageName: 'com.google.android.youtube', icon: 'logo-youtube', category: 'Medya' },
  { id: '4', name: 'WhatsApp', packageName: 'com.whatsapp', icon: 'chatbubbles', category: 'Mesajlaşma' },
  { id: '5', name: 'Instagram', packageName: 'com.instagram.android', icon: 'logo-instagram', category: 'Sosyal' },
  { id: '6', name: 'Twitter / X', packageName: 'com.twitter.android', icon: 'logo-twitter', category: 'Sosyal' },
  { id: '7', name: 'Netflix', packageName: 'com.netflix.mediaclient', icon: 'tv', category: 'Medya' },
  { id: '8', name: 'Spotify', packageName: 'com.spotify.music', icon: 'musical-notes', category: 'Müzik' },
  { id: '9', name: 'Discord', packageName: 'com.discord', icon: 'logo-discord', category: 'Mesajlaşma' },
  { id: '10', name: 'Gmail', packageName: 'com.google.android.gm', icon: 'mail', category: 'E-posta' },
];

export function AppSplitTunnelScreen() {
  const navigation = useNavigation<any>();
  const { routingConfig, updateRoutingConfig } = useConfigStore();

  const [search, setSearch] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>(
    routingConfig.selectedBypassApps || ['org.telegram.messenger', 'com.android.chrome']
  );
  const [bypassMode, setBypassMode] = useState<boolean>(true); // true: Bypass, false: Proxy Only

  const filteredApps = DEFAULT_APPS.filter(
    app => app.name.toLowerCase().includes(search.toLowerCase()) ||
           app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleApp = async (pkgName: string) => {
    let next: string[];
    if (selectedApps.includes(pkgName)) {
      next = selectedApps.filter(p => p !== pkgName);
    } else {
      next = [...selectedApps, pkgName];
    }
    setSelectedApps(next);
    await updateRoutingConfig({ selectedBypassApps: next });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Uygulama Bölünmüş Tünelleme</Text>
            <Text style={styles.subtitle}>VPN tüneli dışında kalacak uygulamaları seçin</Text>
          </View>
        </View>

        {/* Mode Switch Card */}
        <View style={styles.modeCard}>
          <View style={styles.modeLeft}>
            <Ionicons
              name={bypassMode ? 'git-branch-outline' : 'shield-checkmark-outline'}
              size={24}
              color={Colors.primary}
            />
            <View style={{ marginLeft: Spacing.sm }}>
              <Text style={styles.modeTitle}>
                {bypassMode ? 'Seçili Uygulamaları Bypass Et' : 'Sadece Seçili Uygulamaları Tünelle'}
              </Text>
              <Text style={styles.modeSub}>
                {bypassMode
                  ? 'Seçilen uygulamalar VPN kullanmaz, doğrudan bağlanır'
                  : 'Sadece seçilen uygulamalar VPN kullanır, diğerleri bypass edilir'}
              </Text>
            </View>
          </View>
          <Switch
            value={bypassMode}
            onValueChange={setBypassMode}
            trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
            thumbColor={bypassMode ? Colors.primary : Colors.textMuted}
          />
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Uygulama ara..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filteredApps}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = selectedApps.includes(item.packageName);
            return (
              <TouchableOpacity
                style={[styles.appRow, isSelected && styles.appRowSelected]}
                onPress={() => toggleApp(item.packageName)}
                activeOpacity={0.7}
              >
                <View style={[styles.appIconContainer, { backgroundColor: isSelected ? Colors.primary + '25' : Colors.bgInput }]}>
                  <Ionicons name={item.icon as any} size={22} color={isSelected ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appPkg}>{item.packageName}</Text>
                </View>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleApp(item.packageName)}
                  trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                  thumbColor={isSelected ? Colors.primary : Colors.textMuted}
                />
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.h3 },
  subtitle: { ...Typography.caption, marginTop: 2 },

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  modeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
  modeTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  modeSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 14 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, padding: 0 },

  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },

  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appRowSelected: {
    borderColor: Colors.primary + '60',
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  appInfo: { flex: 1 },
  appName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  appPkg: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
