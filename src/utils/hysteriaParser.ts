// src/utils/hysteriaParser.ts
// Parsers for Hysteria2, TUIC, and VLess REALITY URIs

import { V2RayConfig } from '../store/configStore';

export function parseHysteria2Uri(uri: string): Omit<V2RayConfig, 'id' | 'createdAt'> | null {
  try {
    const cleanUri = uri.trim();
    if (!cleanUri.startsWith('hysteria2://') && !cleanUri.startsWith('hy2://')) {
      return null;
    }

    const withoutScheme = cleanUri.replace(/^hysteria2:\/\//, '').replace(/^hy2:\/\//, '');
    const hashIdx = withoutScheme.lastIndexOf('#');
    const remark = hashIdx >= 0 ? decodeURIComponent(withoutScheme.substring(hashIdx + 1)) : '';
    const main = hashIdx >= 0 ? withoutScheme.substring(0, hashIdx) : withoutScheme;

    const [userInfoHost, queryString] = main.split('?');
    const atIdx = userInfoHost.lastIndexOf('@');
    
    let auth = '';
    let hostPort = userInfoHost;
    if (atIdx >= 0) {
      auth = userInfoHost.substring(0, atIdx);
      hostPort = userInfoHost.substring(atIdx + 1);
    }

    const lastColon = hostPort.lastIndexOf(':');
    const address = hostPort.substring(0, lastColon);
    const port = parseInt(hostPort.substring(lastColon + 1));

    const params = new URLSearchParams(queryString || '');

    return {
      name: remark || `Hy2-${address}`,
      protocol: 'hysteria2',
      address,
      port,
      password: auth,
      uuid: auth,
      security: 'tls',
      network: 'kcp',
      sni: params.get('sni') || address,
      allowInsecure: params.get('insecure') === '1' || params.get('insecure') === 'true',
      obfs: params.get('obfs') || undefined,
      obfsPassword: params.get('obfs-password') || undefined,
      remark,
    };
  } catch {
    return null;
  }
}

export function parseVLessRealityUri(uri: string): Omit<V2RayConfig, 'id' | 'createdAt'> | null {
  try {
    const cleanUri = uri.trim();
    if (!cleanUri.startsWith('vless://')) return null;

    const withoutScheme = cleanUri.replace('vless://', '');
    const [userInfo, rest] = withoutScheme.split('@');
    const hashIdx = rest.lastIndexOf('#');
    const remark = hashIdx >= 0 ? decodeURIComponent(rest.substring(hashIdx + 1)) : '';
    const main = hashIdx >= 0 ? rest.substring(0, hashIdx) : rest;
    
    const [hostPort, queryString] = main.split('?');
    const lastColon = hostPort.lastIndexOf(':');
    const address = hostPort.substring(0, lastColon);
    const port = parseInt(hostPort.substring(lastColon + 1));

    const params = new URLSearchParams(queryString || '');
    const security = params.get('security') as any || 'none';

    return {
      name: remark || address,
      protocol: 'vless',
      address,
      port,
      uuid: userInfo,
      security: security === 'reality' ? 'reality' : security === 'tls' ? 'tls' : 'none',
      network: (params.get('type') as any) || 'tcp',
      path: params.get('path') || undefined,
      host: params.get('host') || undefined,
      sni: params.get('sni') || undefined,
      flow: params.get('flow') || undefined,
      publicKey: params.get('pbk') || undefined,
      shortId: params.get('sid') || undefined,
      fingerprint: params.get('fp') || 'chrome',
      remark,
    };
  } catch {
    return null;
  }
}
