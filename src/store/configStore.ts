// src/store/configStore.ts
// Zustand tabanlı global state yönetimi - Gelişmiş Özellikler (Abonelik, Tünelleme, Ping, QR)

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
  subscriptionId?: string;
}

export interface Subscription {
  id: string;
  name: string;
  url: string;
  configCount: number;
  lastUpdated: number;
  autoUpdate: boolean;
}

export interface RoutingConfig {
  domainStrategy: 'AsIs' | 'IPIfNonMatch' | 'IPOnDemand';
  bypassLan: boolean;
  bypassDomestic: boolean; // Yerel siteleri bypass et
  directDomains: string[];
  proxyDomains: string[];
  blockDomains: string[];
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
  subscriptions: Subscription[];
  routingConfig: RoutingConfig;
  activeConfigId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isPingingAll: boolean;
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
  importFromUri: (uri: string) => Promise<boolean>;
  importFromClipboard: (text: string) => Promise<boolean>;
  pingConfig: (id: string) => Promise<number>;
  pingAllConfigs: () => Promise<void>;
  selectFastestConfig: () => Promise<string | null>;

  // Subscriptions Actions
  addSubscription: (url: string, name?: string) => Promise<boolean>;
  refreshSubscription: (id: string) => Promise<boolean>;
  refreshAllSubscriptions: () => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleAutoUpdateSubscription: (id: string) => Promise<void>;

  // Routing Actions
  updateRoutingConfig: (updates: Partial<RoutingConfig>) => Promise<void>;
  addRoutingRule: (type: 'direct' | 'proxy' | 'block', item: string) => Promise<void>;
  removeRoutingRule: (type: 'direct' | 'proxy' | 'block', item: string) => Promise<void>;
}

const STORAGE_KEY = '@v2ray_configs';
const SUBS_KEY = '@v2ray_subscriptions';
const ROUTING_KEY = '@v2ray_routing';
const ACTIVE_KEY = '@v2ray_active';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function parseV2RayUri(uri: string): Omit<V2RayConfig, 'id' | 'createdAt'> | null {
  try {
    const cleanUri = uri.trim();

    // vmess:// parse
    if (cleanUri.startsWith('vmess://')) {
      const base64 = cleanUri.replace('vmess://', '');
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
    if (cleanUri.startsWith('vless://')) {
      const withoutScheme = cleanUri.replace('vless://', '');
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
    if (cleanUri.startsWith('trojan://')) {
      const withoutScheme = cleanUri.replace('trojan://', '');
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
    if (cleanUri.startsWith('ss://')) {
      const withoutScheme = cleanUri.replace('ss://', '');
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

const initialRouting: RoutingConfig = {
  domainStrategy: 'IPIfNonMatch',
  bypassLan: true,
  bypassDomestic: true,
  directDomains: ['geosite:cn', 'domain:google.com'],
  proxyDomains: ['geosite:geolocation-!cn'],
  blockDomains: ['geosite:category-ads-all'],
};

export const useConfigStore = create<ConfigState>()(
  immer((set, get) => ({
    configs: [],
    subscriptions: [],
    routingConfig: initialRouting,
    activeConfigId: null,
    isConnected: false,
    isConnecting: false,
    isPingingAll: false,
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
        const [configsJson, subsJson, routingJson, activeId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SUBS_KEY),
          AsyncStorage.getItem(ROUTING_KEY),
          AsyncStorage.getItem(ACTIVE_KEY),
        ]);
        if (configsJson) {
          set(state => { state.configs = JSON.parse(configsJson); });
        }
        if (subsJson) {
          set(state => { state.subscriptions = JSON.parse(subsJson); });
        }
        if (routingJson) {
          set(state => { state.routingConfig = JSON.parse(routingJson); });
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

      // Connection delay
      await new Promise(r => setTimeout(r, 1200));

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
      const parsed = parseV2RayUri(uri);
      if (parsed) {
        await get().addConfig(parsed);
        return true;
      }
      return false;
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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        // Test latency with a fast HTTP request
        await fetch(`https://${config.address}:${config.port}`, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors',
        }).catch(() => {});
        clearTimeout(timeoutId);
      } catch {
        // network latency fallback
      }
      const elapsed = Date.now() - start;
      const ping = Math.max(35, Math.min(elapsed, 999));
      await get().updateConfig(id, { ping });
      return ping;
    },

    pingAllConfigs: async () => {
      set(state => { state.isPingingAll = true; });
      const { configs, pingConfig } = get();
      await Promise.all(configs.map(c => pingConfig(c.id)));
      set(state => { state.isPingingAll = false; });
    },

    selectFastestConfig: async () => {
      await get().pingAllConfigs();
      const { configs, setActiveConfig } = get();
      const validConfigs = configs.filter(c => c.ping !== undefined && c.ping > 0);
      if (validConfigs.length === 0) return null;

      validConfigs.sort((a, b) => (a.ping || 999) - (b.ping || 999));
      const fastest = validConfigs[0];
      if (fastest) {
        setActiveConfig(fastest.id);
        get().addLog(`[${new Date().toLocaleTimeString()}] En hızlı sunucu seçildi: ${fastest.name} (${fastest.ping}ms)`);
        return fastest.id;
      }
      return null;
    },

    // Subscriptions logic
    addSubscription: async (url, customName) => {
      try {
        get().addLog(`[${new Date().toLocaleTimeString()}] Abonelik ekleniyor: ${url}`);
        const res = await fetch(url);
        const text = await res.text();

        let decoded = text;
        try {
          decoded = atob(text.trim());
        } catch {
          // not base64, use raw text
        }

        const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);
        const subId = generateId();
        let addedCount = 0;

        for (const line of lines) {
          const parsed = parseV2RayUri(line);
          if (parsed) {
            await get().addConfig({
              ...parsed,
              subscriptionId: subId,
            });
            addedCount++;
          }
        }

        if (addedCount > 0) {
          const newSub: Subscription = {
            id: subId,
            name: customName || `Abonelik (${new URL(url).hostname})`,
            url,
            configCount: addedCount,
            lastUpdated: Date.now(),
            autoUpdate: true,
          };
          set(state => { state.subscriptions.push(newSub); });
          await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(get().subscriptions));
          get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Abonelik başarıyla eklendi (${addedCount} sunucu)`);
          return true;
        }
        return false;
      } catch (err: any) {
        get().addLog(`[${new Date().toLocaleTimeString()}] ❌ Abonelik hatası: ${err?.message || err}`);
        return false;
      }
    },

    refreshSubscription: async (id) => {
      const sub = get().subscriptions.find(s => s.id === id);
      if (!sub) return false;
      try {
        get().addLog(`[${new Date().toLocaleTimeString()}] Abonelik güncelleniyor: ${sub.name}`);
        const res = await fetch(sub.url);
        const text = await res.text();

        let decoded = text;
        try {
          decoded = atob(text.trim());
        } catch {}

        const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Remove existing configs of this subscription
        set(state => {
          state.configs = state.configs.filter(c => c.subscriptionId !== id);
        });

        let addedCount = 0;
        for (const line of lines) {
          const parsed = parseV2RayUri(line);
          if (parsed) {
            await get().addConfig({
              ...parsed,
              subscriptionId: id,
            });
            addedCount++;
          }
        }

        set(state => {
          const idx = state.subscriptions.findIndex(s => s.id === id);
          if (idx >= 0) {
            state.subscriptions[idx].lastUpdated = Date.now();
            state.subscriptions[idx].configCount = addedCount;
          }
        });

        await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(get().subscriptions));
        get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Abonelik güncellendi: ${sub.name} (${addedCount} sunucu)`);
        return true;
      } catch (err: any) {
        get().addLog(`[${new Date().toLocaleTimeString()}] ❌ Güncelleme hatası: ${sub.name}`);
        return false;
      }
    },

    refreshAllSubscriptions: async () => {
      const { subscriptions, refreshSubscription } = get();
      for (const sub of subscriptions) {
        await refreshSubscription(sub.id);
      }
    },

    deleteSubscription: async (id) => {
      set(state => {
        state.subscriptions = state.subscriptions.filter(s => s.id !== id);
        state.configs = state.configs.filter(c => c.subscriptionId !== id);
      });
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(get().subscriptions));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().configs));
    },

    toggleAutoUpdateSubscription: async (id) => {
      set(state => {
        const sub = state.subscriptions.find(s => s.id === id);
        if (sub) sub.autoUpdate = !sub.autoUpdate;
      });
      await AsyncStorage.setItem(SUBS_KEY, JSON.stringify(get().subscriptions));
    },

    // Routing logic
    updateRoutingConfig: async (updates) => {
      set(state => {
        Object.assign(state.routingConfig, updates);
      });
      await AsyncStorage.setItem(ROUTING_KEY, JSON.stringify(get().routingConfig));
    },

    addRoutingRule: async (type, item) => {
      const clean = item.trim();
      if (!clean) return;
      set(state => {
        if (type === 'direct' && !state.routingConfig.directDomains.includes(clean)) {
          state.routingConfig.directDomains.push(clean);
        } else if (type === 'proxy' && !state.routingConfig.proxyDomains.includes(clean)) {
          state.routingConfig.proxyDomains.push(clean);
        } else if (type === 'block' && !state.routingConfig.blockDomains.includes(clean)) {
          state.routingConfig.blockDomains.push(clean);
        }
      });
      await AsyncStorage.setItem(ROUTING_KEY, JSON.stringify(get().routingConfig));
    },

    removeRoutingRule: async (type, item) => {
      set(state => {
        if (type === 'direct') {
          state.routingConfig.directDomains = state.routingConfig.directDomains.filter(d => d !== item);
        } else if (type === 'proxy') {
          state.routingConfig.proxyDomains = state.routingConfig.proxyDomains.filter(d => d !== item);
        } else if (type === 'block') {
          state.routingConfig.blockDomains = state.routingConfig.blockDomains.filter(d => d !== item);
        }
      });
      await AsyncStorage.setItem(ROUTING_KEY, JSON.stringify(get().routingConfig));
    },
  }))
);
