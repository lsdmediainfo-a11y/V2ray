// src/utils/clashParser.ts
// Multi-format Parser for Clash YAML configs & Base64 SIP002 Subscriptions

import { V2RayConfig } from '../store/configStore';
import { parseV2RayUri } from '../store/configStore';

export function parseClashYaml(yamlText: string): Array<Omit<V2RayConfig, 'id' | 'createdAt'>> {
  const configs: Array<Omit<V2RayConfig, 'id' | 'createdAt'>> = [];
  try {
    const lines = yamlText.split('\n');
    let inProxies = false;
    let currentProxy: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('proxies:')) {
        inProxies = true;
        continue;
      }

      if (inProxies) {
        if (trimmed.startsWith('- name:') || trimmed.startsWith('- { name:')) {
          if (currentProxy) {
            const parsed = convertClashItemToV2Ray(currentProxy);
            if (parsed) configs.push(parsed);
          }
          currentProxy = {};
          const nameVal = extractYamlValue(trimmed, 'name');
          if (nameVal) currentProxy.name = nameVal;
          const typeVal = extractYamlValue(trimmed, 'type');
          if (typeVal) currentProxy.type = typeVal;
        } else if (currentProxy && trimmed.includes(':')) {
          const colonIdx = trimmed.indexOf(':');
          const key = trimmed.substring(0, colonIdx).trim().replace(/^- /, '');
          const val = trimmed.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          currentProxy[key] = val;
        } else if (trimmed === '' || (trimmed.endsWith(':') && !trimmed.startsWith('server') && !trimmed.startsWith('port'))) {
          // End of proxies section
          if (currentProxy) {
            const parsed = convertClashItemToV2Ray(currentProxy);
            if (parsed) configs.push(parsed);
            currentProxy = null;
          }
          if (!trimmed.startsWith('-')) inProxies = false;
        }
      }
    }

    if (currentProxy) {
      const parsed = convertClashItemToV2Ray(currentProxy);
      if (parsed) configs.push(parsed);
    }
  } catch (err) {
    console.error('Clash YAML parse error:', err);
  }

  return configs;
}

function extractYamlValue(line: string, key: string): string | null {
  const match = line.match(new RegExp(`${key}:\\s*['"]?([^,'"}]+)['"]?`));
  return match ? match[1].trim() : null;
}

function convertClashItemToV2Ray(item: any): Omit<V2RayConfig, 'id' | 'createdAt'> | null {
  if (!item.server || !item.port || !item.type) return null;

  const type = item.type.toLowerCase();
  const address = item.server;
  const port = parseInt(item.port);
  const name = item.name || `${type.toUpperCase()}-${address}`;

  if (type === 'vmess') {
    return {
      name,
      protocol: 'vmess',
      address,
      port,
      uuid: item.uuid,
      alterId: parseInt(item.alterId) || 0,
      security: item.tls ? 'tls' : 'none',
      network: item.network || 'tcp',
      path: item['ws-opts']?.path || item.path || undefined,
      host: item['ws-opts']?.headers?.Host || item.host || undefined,
      sni: item.sni || item.servername || undefined,
      remark: name,
    };
  }

  if (type === 'vless') {
    return {
      name,
      protocol: 'vless',
      address,
      port,
      uuid: item.uuid,
      security: item.reality ? 'reality' : item.tls ? 'tls' : 'none',
      network: item.network || 'tcp',
      path: item.path || undefined,
      sni: item.servername || item.sni || undefined,
      flow: item.flow || undefined,
      publicKey: item['reality-opts']?.['public-key'] || item.publicKEY || undefined,
      shortId: item['reality-opts']?.['short-id'] || undefined,
      remark: name,
    };
  }

  if (type === 'trojan') {
    return {
      name,
      protocol: 'trojan',
      address,
      port,
      password: item.password,
      security: 'tls',
      network: 'tcp',
      sni: item.sni || item.servername || address,
      remark: name,
    };
  }

  if (type === 'ss' || type === 'shadowsocks') {
    return {
      name,
      protocol: 'shadowsocks',
      address,
      port,
      cipher: item.cipher,
      password: item.password,
      security: 'none',
      network: 'tcp',
      remark: name,
    };
  }

  if (type === 'hysteria2' || type === 'hy2') {
    return {
      name,
      protocol: 'hysteria2',
      address,
      port,
      password: item.password || item.auth,
      uuid: item.password || item.auth,
      security: 'tls',
      network: 'kcp',
      sni: item.sni || address,
      obfs: item.obfs,
      obfsPassword: item['obfs-password'],
      remark: name,
    };
  }

  return null;
}

export function parseMultiFormatContent(content: string): Array<Omit<V2RayConfig, 'id' | 'createdAt'>> {
  const trimmed = content.trim();

  // Try Clash YAML
  if (trimmed.includes('proxies:') || (trimmed.includes('name:') && trimmed.includes('server:'))) {
    const clashConfigs = parseClashYaml(trimmed);
    if (clashConfigs.length > 0) return clashConfigs;
  }

  // Try decoding Base64 multi-line subscription
  let decoded = trimmed;
  try {
    decoded = atob(trimmed);
  } catch {}

  const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);
  const configs: Array<Omit<V2RayConfig, 'id' | 'createdAt'>> = [];

  for (const line of lines) {
    const parsed = parseV2RayUri(line);
    if (parsed) configs.push(parsed);
  }

  return configs;
}
