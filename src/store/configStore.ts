// src/store/configStore.ts
// Zustand tabanlı global state yönetimi - Native Core, Real TCP Ping & Hysteria2 / REALITY

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateV2RayConfigJson, V2RayFullConfig } from '../utils/configGenerator';
import { measureTcpPing, resolveCountryFlag } from '../utils/tcpPing';
import { parseHysteria2Uri, parseVLessRealityUri } from '../utils/hysteriaParser';
import { startNativeVpn, stopNativeVpn } from '../utils/vpnBridge';

export type Protocol = 'vmess' | 'vless' | 'trojan' | 'shadowsocks' | 'hysteria2' | 'tuic';

export interface V2RayConfig {
  id: string;
  name: string;
  protocol: Protocol;
  address: string;
  port: number;
  uuid?: string;
  password?: string;
  alterId?: number;
  cipher?: string;
  security: 'none' | 'tls' | 'xtls' | 'reality';
  network: 'tcp' | 'ws' | 'grpc' | 'h2' | 'kcp';
  path?: string;
  host?: string;
  sni?: string;
  allowInsecure?: boolean;
  flow?: string;
  publicKey?: string;
  shortId?: string;
  spiderX?: string;
  fingerprint?: string;
  obfs?: string;
  obfsPassword?: string;
  remark?: string;
  ping?: number;
  country?: string;
  flag?: string;
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
  bypassDomestic: boolean;
  directDomains: string[];
  proxyDomains: string[];
  blockDomains: string[];
  selectedBypassApps?: string[]; // App Split Tunneling
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
  activeFullConfig: V2RayFullConfig | null;

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

    // Check Hysteria2 / hy2 first
    if (cleanUri.startsWith('hysteria2://') || cleanUri.startsWith('hy2://')) {
      return parseHysteria2Uri(cleanUri);
    }

    // Check VLess / REALITY
    if (cleanUri.startsWith('vless://') && cleanUri.includes('security=reality')) {
      return parseVLessRealityUri(cleanUri);
    }

    // Standard vmess:// parse
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

    // Standard vless:// parse
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
        flow: params.get('flow') || undefined,
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
        cipher: method,
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
  selectedBypassApps: [],
};

const DEFAULT_DEMO_CONFIGS: Omit<V2RayConfig, 'id' | 'createdAt'>[] = [
  {
    name: '🇺🇸 US Fast - VLess REALITY',
    protocol: 'vless',
    address: 'us.v2ray.demo.net',
    port: 443,
    uuid: 'a3f8c2b1-9e4d-4c3a-8b1e-7f6a5d4c3b2a',
    security: 'reality',
    network: 'tcp',
    sni: 'yahoo.com',
    publicKey: '7f6a5d4c3b2a1e9d8c7b6a5f4e3d2c1b0a9f8e7d',
    shortId: '6ba7b810',
    fingerprint: 'chrome',
    ping: 45,
    country: 'United States',
    flag: '🇺🇸',
  },
  {
    name: '🇩🇪 DE HighSpeed - VMess WS',
    protocol: 'vmess',
    address: 'de.v2ray.demo.net',
    port: 443,
    uuid: 'c5d4e3f2-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
    security: 'tls',
    network: 'ws',
    path: '/vmess-ws',
    host: 'de.v2ray.demo.net',
    sni: 'de.v2ray.demo.net',
    ping: 38,
    country: 'Germany',
    flag: '🇩🇪',
  },
  {
    name: '🇳🇱 NL Privacy - Trojan TLS',
    protocol: 'trojan',
    address: 'nl.v2ray.demo.net',
    port: 443,
    password: 'trojan-password-demo',
    security: 'tls',
    network: 'tcp',
    sni: 'nl.v2ray.demo.net',
    ping: 42,
    country: 'Netherlands',
    flag: '🇳🇱',
  },
  {
    name: '🇹🇷 TR Local Node - Hysteria2',
    protocol: 'hysteria2',
    address: 'tr.v2ray.demo.net',
    port: 8443,
    password: 'hy2-password-demo',
    uuid: 'hy2-password-demo',
    security: 'tls',
    network: 'kcp',
    sni: 'tr.v2ray.demo.net',
    ping: 18,
    country: 'Türkiye',
    flag: '🇹🇷',
  },
];

export const useConfigStore = create<ConfigState>()(
  immer((set, get) => ({
    configs: [],
    subscriptions: [],
    routingConfig: initialRouting,
    activeConfigId: null,
    isConnected: false,
    isConnecting: false,
    isPingingAll: false,
    activeFullConfig: null,
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
          const parsed = JSON.parse(configsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            set(state => { state.configs = parsed; });
          } else {
            // Populate demo servers
            for (const demo of DEFAULT_DEMO_CONFIGS) {
              await get().addConfig(demo);
            }
          }
        } else {
          // First launch: initialize default demo servers
          for (const demo of DEFAULT_DEMO_CONFIGS) {
            await get().addConfig(demo);
          }
        }

        if (subsJson) {
          set(state => { state.subscriptions = JSON.parse(subsJson); });
        }
        if (routingJson) {
          set(state => { state.routingConfig = JSON.parse(routingJson); });
        }
        if (activeId && get().configs.some(c => c.id === activeId)) {
          set(state => { state.activeConfigId = activeId; });
        } else if (get().configs.length > 0) {
          const firstId = get().configs[0].id;
          set(state => { state.activeConfigId = firstId; });
          AsyncStorage.setItem(ACTIVE_KEY, firstId);
        }

        get().addLog(`[${new Date().toLocaleTimeString()}] ✓ V2Ray İstemcisi başlatıldı. SOCKS5: 10808 | HTTP: 10809`);
      } catch (err) {
        console.error('loadConfigs error:', err);
      }
    },

    addConfig: async (config) => {
      const geo = await resolveCountryFlag(config.address);
      const newConfig: V2RayConfig = {
        ...config,
        id: generateId(),
        createdAt: Date.now(),
        country: geo.country,
        flag: geo.flag,
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
      const { activeConfigId, configs, routingConfig } = get();
      if (!activeConfigId) return;
      const config = configs.find(c => c.id === activeConfigId);
      if (!config) return;

      set(state => { state.isConnecting = true; });
      get().addLog(`[${new Date().toLocaleTimeString()}] Yapılandırma hazırlanıyor: ${config.name} (${config.protocol.toUpperCase()})`);

      // Generate standard V2Ray/Xray JSON configuration
      const fullConfig = generateV2RayConfigJson(config, routingConfig);
      set(state => { state.activeFullConfig = fullConfig; });

      get().addLog(`[${new Date().toLocaleTimeString()}] SOCKS5 dinleyici: 127.0.0.1:10808 | HTTP: 127.0.0.1:10809`);
      get().addLog(`[${new Date().toLocaleTimeString()}] Tünel kuruluyor -> ${config.address}:${config.port}`);

      // Execute Native VpnService bridge
      await startNativeVpn(JSON.stringify(fullConfig));

      // Execution delay
      await new Promise(r => setTimeout(r, 600));

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
      get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Bağlantı aktif: ${config.flag || '🌐'} ${config.name}`);
    },

    disconnect: async () => {
      await stopNativeVpn();
      get().addLog(`[${new Date().toLocaleTimeString()}] Tünel kapatıldı. Bağlantı kesildi.`);
      set(state => {
        state.isConnected = false;
        state.activeFullConfig = null;
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

      // Real TCP socket pinging
      const ping = await measureTcpPing(config.address, config.port);
      const geo = await resolveCountryFlag(config.address);

      await get().updateConfig(id, {
        ping,
        country: geo.country,
        flag: geo.flag,
      });
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
        get().addLog(`[${new Date().toLocaleTimeString()}] En hızlı sunucu otomatik seçildi: ${fastest.flag || ''} ${fastest.name} (${fastest.ping}ms)`);
        return fastest.id;
      }
      return null;
    },

    // Subscriptions logic
    addSubscription: async (url, customName) => {
      try {
        get().addLog(`[${new Date().toLocaleTimeString()}] Abonelik indiriliyor: ${url}`);
        const res = await fetch(url);
        const text = await res.text();

        let decoded = text;
        try {
          decoded = atob(text.trim());
        } catch {}

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
          get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Abonelik başarıyla aktarıldı (${addedCount} sunucu)`);
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
        get().addLog(`[${new Date().toLocaleTimeString()}] Abonelik yenileniyor: ${sub.name}`);
        const res = await fetch(sub.url);
        const text = await res.text();

        let decoded = text;
        try {
          decoded = atob(text.trim());
        } catch {}

        const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);

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
        get().addLog(`[${new Date().toLocaleTimeString()}] ✓ Abonelik yenilendi: ${sub.name} (${addedCount} sunucu)`);
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
