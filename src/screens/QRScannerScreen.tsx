// src/screens/QRScannerScreen.tsx
// Kamera kullanarak QR Kod tarama ekranı

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useConfigStore } from '../store/configStore';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { Button } from '../components/Button';

export function QRScannerScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const { importFromUri } = useConfigStore();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const success = await importFromUri(data);
    if (success) {
      Alert.alert('Başarılı', 'QR Koddaki sunucu eklendi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert(
        'Geçersiz QR Kod',
        'Bu QR kod geçerli bir V2Ray URI (vmess, vless, trojan, ss) içermiyor.',
        [
          { text: 'Tekrar Tara', onPress: () => setScanned(false) },
          { text: 'Kapat', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionText}>
          QR kodları tarayarak sunucu eklemek için kamera iznine ihtiyaç duyuyoruz.
        </Text>
        <Button title="İzin Ver" onPress={requestPermission} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={flash}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>QR Kod Tara</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setFlash(!flash)}>
              <Ionicons name={flash ? 'flash' : 'flash-outline'} size={22} color={flash ? Colors.warning : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Scanner Box */}
          <View style={styles.scanTargetContainer}>
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instruction}>
              V2Ray QR kodunu çerçevenin ortasına hizalayın
            </Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    ...Typography.h2,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  permissionText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scanTargetContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  scanTarget: {
    width: 260,
    height: 260,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: Radius.md,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: Radius.md,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: Radius.md,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: Radius.md,
  },
  instruction: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
});
