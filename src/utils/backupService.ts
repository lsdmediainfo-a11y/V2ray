// src/utils/backupService.ts
// Backup Export/Import & Bulk URI Serializer for V2Ray Client

import { useConfigStore, V2RayConfig } from '../store/configStore';
import * as Clipboard from 'expo-clipboard';

export interface AppBackupData {
  version: string;
  timestamp: number;
  configs: V2RayConfig[];
  subscriptions: any[];
  routingConfig: any;
}

export function generateFullBackupJson(): string {
  const state = useConfigStore.getState();
  const backup: AppBackupData = {
    version: '1.0.0',
    timestamp: Date.now(),
    configs: state.configs,
    subscriptions: state.subscriptions,
    routingConfig: state.routingConfig,
  };
  return JSON.stringify(backup, null, 2);
}

export async function restoreFullBackupJson(jsonString: string): Promise<boolean> {
  try {
    const data: AppBackupData = JSON.parse(jsonString);
    if (!data.configs || !Array.isArray(data.configs)) return false;

    for (const config of data.configs) {
      await useConfigStore.getState().addConfig(config);
    }
    return true;
  } catch {
    return false;
  }
}

export function generateBulkUriString(): string {
  const configs = useConfigStore.getState().configs;
  const uris: string[] = [];

  for (const c of configs) {
    const uri = serializeConfigToUri(c);
    if (uri) uris.push(uri);
  }

  return uris.join('\n');
}

export function serializeConfigToUri(config: V2RayConfig): string | null {
  try {
    const remark = encodeURIComponent(config.name || config.remark || 'V2Ray');

    if (config.protocol === 'vmess') {
      const vmessObj = {
        v: '2',
        ps: config.name,
        add: config.address,
        port: String(config.port),
        id: config.uuid,
        aid: String(config.alterId || 0),
        net: config.network,
        type: 'none',
        host: config.host || '',
        path: config.path || '',
        tls: config.security === 'tls' ? 'tls' : '',
        sni: config.sni || '',
      };
      return 'vmess://' + btoa(JSON.stringify(vmessObj));
    }

    if (config.protocol === 'vless') {
      const sec = config.security || 'none';
      const net = config.network || 'tcp';
      const params = new URLSearchParams();
      params.set('security', sec);
      params.set('type', net);
      if (config.path) params.set('path', config.path);
      if (config.host) params.set('host', config.host);
      if (config.sni) params.set('sni', config.sni);
      if (config.flow) params.set('flow', config.flow);
      if (config.publicKey) params.set('pbk', config.publicKey);
      if (config.shortId) params.set('sid', config.shortId);
      if (config.fingerprint) params.set('fp', config.fingerprint);

      return `vless://${config.uuid}@${config.address}:${config.port}?${params.toString()}#${remark}`;
    }

    if (config.protocol === 'trojan') {
      return `trojan://${config.password}@${config.address}:${config.port}#${remark}`;
    }

    if (config.protocol === 'shadowsocks') {
      const auth = btoa(`${config.cipher || 'aes-256-gcm'}:${config.password}`);
      return `ss://${auth}@${config.address}:${config.port}#${remark}`;
    }

    if (config.protocol === 'hysteria2') {
      const params = new URLSearchParams();
      if (config.sni) params.set('sni', config.sni);
      if (config.allowInsecure) params.set('insecure', '1');
      if (config.obfs) params.set('obfs', config.obfs);
      if (config.obfsPassword) params.set('obfs-password', config.obfsPassword);

      return `hysteria2://${config.password || config.uuid}@${config.address}:${config.port}?${params.toString()}#${remark}`;
    }

    return null;
  } catch {
    return null;
  }
}
