// src/store/configStore.ts
// Zustand tabanlı global state yönetimi

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Protocol = 'vmess' | 'vless' | 'trojan' | 'shadowsocks';

export interface V2RayConfig {
  id: string;
  name: string;
  protocol: Protocol;
  address: string;
  port: number;
  uuid?: string;
  password?: string;
  alterId?: number;
  security: 'none' | 'tls' | 'xtls';
  network: 'tcp' | 'ws' | 'grpc' | 'h2' | 'kcp';
  path?: string;
  host?: string;
  sni?: string;
  allowInsecure?: boolean;
  remark?: string;
  ping?: number;
  createdAt: number;
  isActive?: boolean;
}

export interface ConnectionStats {
  uploadBytes: number;
  downloadBytes: number;
  uploadSpeed: number;
  downloadSpeed: number;
  connectedAt?: number;
  duration: number;
}

interface ConfigState {
  configs: V2RayConfig[];
  activeConfigId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  stats: ConnectionStats;
  logs: string[];

  // Actions
  loadConfigs: () => Promise<void>;
  addConfig: (config: Omit<V2RayConfig, 'id' | 'createdAt'>) => Promise<void>;
  updateConfig: (id: string, updates: Partial<V2RayConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  setActiveConfig: (id: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateStats: (stats: Partial<ConnectionStats>) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  importFromUri: (uri: string) => Promise<void>;
  importFromClipboard: (text: string) => Promise<boolean>;
  pingConfig: (id: string) => Promise<number>;
}

const STORAGE_KEY = '@v2ray_configs';
const ACTIVE_KEY = '@v2ray_active';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function parseV2RayUri(uri: string): Omit<V2RayConfig, 'id' | 'createdAt'> | null {
  try {
    // vmess:// parse
    if (uri.startsWith('vmess://')) {
      const base64 = uri.replace('vmess://', '');
      const decoded = atob(base64);
      const data = JSON.parse(decoded);
      return {
        name: data.ps || data.add,
        protocol: 'vmess',
        address: data.add,
        port: parseInt(data.port),
        uuid: data.id,
        alterId: parseInt(data.aid) || 0,
        security: data.tls === 'tls' ? 'tls' : 'none',
        network: data.net || 'tcp',
        path: data.path,
        host: data.host,
        sni: data.sni,
        remark: data.ps,
      };
    }

    // vless:// parse
    if (uri.startsWith('vless://')) {
      const withoutScheme = uri.replace('vless://', '');
      const [userInfo, rest] = withoutScheme.split('@');
      const atIndex = rest.lastIndexOf('#');
      const remark = atIndex >= 0 ? decodeURIComponent(rest.substring(atIndex + 1)) : '';
      const hostPart = atIndex >= 0 ? rest.substring(0, atIndex) : rest;
      const [hostPort, queryString] = hostPart.split('?');
      const lastColon = hostPort.lastIndexOf(':');
      const address = hostPort.substring(0, lastColon);
      const port = parseInt(hostPort.substring(lastColon + 1));

      const params = new URLSearchParams(queryString || '');

      return {
        name: remark || address,
        protocol: 'vless',
        address,
        port,
        uuid: userInfo,
        security: (params.get('security') as any) || 'none',
        network: (params.get('type') as any) || 'tcp',
        path: params.get('path') || undefined,
        host: params.get('host') || undefined,
        sni: params.get('sni') || undefined,
        remark,
      };
    }

    // trojan:// parse
    if (uri.startsWith('trojan://')) {
      const withoutScheme = uri.replace('trojan://', '');
      const atIndex = withoutScheme.indexOf('@');
      const password = withoutScheme.substring(0, atIndex);
      const rest = withoutScheme.substring(atIndex + 1);
      const hashIndex = rest.lastIndexOf('#');
      const remark = hashIndex >= 0 ? decodeURIComponent(rest.substring(hashIndex + 1)) : '';
      const hostPart = hashIndex >= 0 ? rest.substring(0, hashIndex) : rest;
      const [hostPort] = hostPart.split('?');
      const lastColon = hostPort.lastIndexOf(':');
      const address = hostPort.substring(0, lastColon);
      const port = parseInt(hostPort.substring(lastColon + 1));

      return {
        name: remark || address,
        protocol: 'trojan',
        address,
        port,
        password,
        security: 'tls',
        network: 'tcp',
        sni: address,
        remark,
      };
    }

    // ss:// (Shadowsocks) parse
    if (uri.startsWith('ss://')) {
      const withoutScheme = uri.replace('ss://', '');
      const hashIndex = withoutScheme.lastIndexOf('#');
      const remark = hashIndex >= 0 ? decodeURIComponent(withoutScheme.substring(hashIndex + 1)) : '';
      const main = hashIndex >= 0 ? withoutScheme.substring(0, hashIndex) : withoutScheme;

      let decoded = '';
      try {
        decoded = atob(main);
      } catch {
        const atIdx = main.indexOf('@');
        if (atIdx >= 0) {
          decoded = atob(main.substring(0, atIdx)) + '@' + main.substring(atIdx + 1);
        }
      }

      const atIdx = decoded.lastIndexOf('@');
      const methodPass = decoded.substring(0, atIdx);
      const hostPort = decoded.substring(atIdx + 1);
      const [method, pass] = methodPass.split(':');
      const lastColon = hostPort.lastIndexOf(':');
      const address = hostPort.substring(0, lastColon);
      const port = parseInt(hostPort.substring(lastColon + 1));

      return {
        name: remark || address,
        protocol: 'shadowsocks',
        address,
        port,
        password: pass,
        security: 'none',
        network: 'tcp',
        remark,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const useConfigStore = create<ConfigState>()(
  immer((set, get) => ({
    configs: [],
    activeConfigId: null,
    isConnected: false,
    isConnecting: false,
    stats: {
      uploadBytes: 0,
      downloadBytes: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      duration: 0,
    },
    logs: [],

    loadConfigs: async () => {
      try {
        const [configsJson, activeId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_KEY),
        ]);
        if (configsJson) {
          set(state => { state.configs = JSON.parse(configsJson); });
        }
        if (activeId) {
          set(state => { state.activeConfigId = activeId; });
        }
      } catch (err) {
        console.error('loadConfigs error:', err);
      }
    },

    addConfig: async (config) => {
      const newConfig: V2RayConfig = {
        ...config,
        id: generateId(),
        createdAt: Date.now(),
      };
      set(state => { state.configs.push(newConfig); });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().configs));
    },

    updateConfig: async (id, updates) => {
      set(state => {
        const idx = state.configs.findIndex(c => c.id === id);
        if (idx >= 0) Object.assign(state.configs[idx], updates);
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().configs));
    },

    deleteConfig: async (id) => {
      set(state => {
        state.configs = state.configs.filter(c => c.id !== id);
        if (state.activeConfigId === id) state.activeConfigId = null;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().configs));
    },

    setActiveConfig: (id) => {
      set(state => { state.activeConfigId = id; });
      AsyncStorage.setItem(ACTIVE_KEY, id);
    },

    connect: async () => {
      const { activeConfigId, configs } = get();
      if (!activeConfigId) return;
      const config = configs.find(c => c.id === activeConfigId);
      if (!config) return;

      set(state => { state.isConnecting = true; });
      get().addLog(`[${new Date().toLocaleTimeString()}] ${config.name} bağlanılıyor...`);

      // Simulated connection delay
      await new Promise(r => setTimeout(r, 1500));

      set(state => {
        state.isConnecting = false;
        state.isConnected = true;
        state.stats = {
          uploadBytes: 0,
          downloadBytes: 0,
          uploadSpeed: 0,
          downloadSpeed: 0,
          connectedAt: Date.now(),
          duration: 0,
        };
      });
      get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Bağlantı başarılı: ${config.address}:${config.port}`);
    },

    disconnect: async () => {
      get().addLog(`[${new Date().toLocaleTimeString()}] Bağlantı kesildi.`);
      set(state => {
        state.isConnected = false;
        state.stats = { uploadBytes: 0, downloadBytes: 0, uploadSpeed: 0, downloadSpeed: 0, duration: 0 };
      });
    },

    updateStats: (stats) => {
      set(state => { Object.assign(state.stats, stats); });
    },

    addLog: (message) => {
      set(state => {
        state.logs.unshift(message);
        if (state.logs.length > 200) state.logs.pop();
      });
    },

    clearLogs: () => {
      set(state => { state.logs = []; });
    },

    importFromUri: async (uri) => {
      // File import placeholder
    },

    importFromClipboard: async (text) => {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let importedCount = 0;
      for (const line of lines) {
        const parsed = parseV2RayUri(line);
        if (parsed) {
          await get().addConfig(parsed);
          importedCount++;
        }
      }
      return importedCount > 0;
    },

    pingConfig: async (id) => {
      const config = get().configs.find(c => c.id === id);
      if (!config) return -1;
      const start = Date.now();
      // Simulated ping
      await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
      const ping = Date.now() - start;
      await get().updateConfig(id, { ping });
      return ping;
    },
  }))
);
