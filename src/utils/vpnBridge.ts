// src/utils/vpnBridge.ts
// Native VPN Service Bridge Helper with NativeModules & Expo Fallback

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { VpnServiceModule } = NativeModules;
const vpnEmitter = VpnServiceModule ? new NativeEventEmitter(VpnServiceModule) : null;

export interface VpnStatus {
  isConnected: boolean;
  activeConfigName?: string;
  bytesReceived: number;
  bytesSent: number;
}

export async function startNativeVpn(configJsonString: string): Promise<boolean> {
  if (Platform.OS === 'android' && VpnServiceModule?.startVpn) {
    try {
      const result = await VpnServiceModule.startVpn(configJsonString);
      return result;
    } catch (err) {
      console.warn('Native VpnServiceModule startVpn fallback:', err);
    }
  }
  // Native module fallback
  return true;
}

export async function stopNativeVpn(): Promise<boolean> {
  if (Platform.OS === 'android' && VpnServiceModule?.stopVpn) {
    try {
      const result = await VpnServiceModule.stopVpn();
      return result;
    } catch (err) {
      console.warn('Native VpnServiceModule stopVpn fallback:', err);
    }
  }
  return true;
}

export function subscribeVpnStatusEvents(
  onStatusChange: (status: VpnStatus) => void,
  onLogMessage: (log: string) => void
) {
  if (!vpnEmitter) return () => {};

  const statusSub = vpnEmitter.addListener('onVpnStatusChanged', onStatusChange);
  const logSub = vpnEmitter.addListener('onVpnLogMessage', onLogMessage);

  return () => {
    statusSub.remove();
    logSub.remove();
  };
}
