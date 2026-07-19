// src/utils/configGenerator.ts
// Generates standard V2Ray/Xray JSON configuration for client runtimes

import { V2RayConfig, RoutingConfig } from '../store/configStore';

export interface V2RayFullConfig {
  log: {
    loglevel: string;
  };
  inbounds: Array<{
    port: number;
    listen: string;
    protocol: string;
    settings?: any;
    sniffing?: {
      enabled: boolean;
      destOverride: string[];
    };
  }>;
  outbounds: Array<{
    protocol: string;
    settings?: any;
    streamSettings?: any;
    tag: string;
  }>;
  routing: {
    domainStrategy: string;
    rules: Array<{
      type: string;
      domain?: string[];
      ip?: string[];
      outboundTag: string;
    }>;
  };
}

export function generateV2RayConfigJson(
  config: V2RayConfig,
  routing: RoutingConfig
): V2RayFullConfig {
  const outbound: any = {
    tag: 'proxy',
    protocol: config.protocol,
    settings: {},
    streamSettings: {
      network: config.network || 'tcp',
      security: config.security || 'none',
    },
  };

  // Configure protocol specific settings
  if (config.protocol === 'vmess') {
    outbound.settings = {
      vnext: [
        {
          address: config.address,
          port: config.port,
          users: [
            {
              id: config.uuid,
              alterId: config.alterId || 0,
              security: 'auto',
            },
          ],
        },
      ],
    };
  } else if (config.protocol === 'vless') {
    outbound.settings = {
      vnext: [
        {
          address: config.address,
          port: config.port,
          users: [
            {
              id: config.uuid,
              encryption: 'none',
              flow: config.flow || undefined,
            },
          ],
        },
      ],
    };

    // REALITY or TLS settings
    if (config.security === 'reality') {
      outbound.streamSettings.realitySettings = {
        show: false,
        fingerprint: config.fingerprint || 'chrome',
        serverName: config.sni || config.host || config.address,
        publicKey: config.publicKey || '',
        shortId: config.shortId || '',
        spiderX: config.spiderX || '',
      };
    } else if (config.security === 'tls') {
      outbound.streamSettings.tlsSettings = {
        allowInsecure: config.allowInsecure || false,
        serverName: config.sni || config.host || config.address,
      };
    }
  } else if (config.protocol === 'trojan') {
    outbound.settings = {
      servers: [
        {
          address: config.address,
          port: config.port,
          password: config.password,
        },
      ],
    };
    outbound.streamSettings.tlsSettings = {
      allowInsecure: config.allowInsecure || false,
      serverName: config.sni || config.address,
    };
  } else if (config.protocol === 'shadowsocks') {
    outbound.settings = {
      servers: [
        {
          address: config.address,
          port: config.port,
          method: config.cipher || 'aes-256-gcm',
          password: config.password,
        },
      ],
    };
  } else if (config.protocol === 'hysteria2') {
    outbound.protocol = 'hysteria2';
    outbound.settings = {
      servers: [
        {
          address: config.address,
          port: config.port,
          auth: config.password || config.uuid,
          obfs: config.obfs ? { type: 'salamander', password: config.obfsPassword } : undefined,
        },
      ],
    };
  }

  // Network Transport Settings (WS, gRPC, HTTP/2)
  if (config.network === 'ws') {
    outbound.streamSettings.wsSettings = {
      path: config.path || '/',
      headers: config.host ? { Host: config.host } : {},
    };
  } else if (config.network === 'grpc') {
    outbound.streamSettings.grpcSettings = {
      serviceName: config.path || '',
      multiMode: false,
    };
  }

  // Routing Rules construction
  const rules: any[] = [];

  // LAN Bypass
  if (routing.bypassLan) {
    rules.push({
      type: 'field',
      ip: ['geoip:private'],
      outboundTag: 'direct',
    });
  }

  // Domestic/Country Bypass
  if (routing.bypassDomestic) {
    rules.push({
      type: 'field',
      domain: ['geosite:cn'],
      ip: ['geoip:cn'],
      outboundTag: 'direct',
    });
  }

  // Custom Direct Rules
  if (routing.directDomains.length > 0) {
    rules.push({
      type: 'field',
      domain: routing.directDomains,
      outboundTag: 'direct',
    });
  }

  // Custom Block Rules
  if (routing.blockDomains.length > 0) {
    rules.push({
      type: 'field',
      domain: routing.blockDomains,
      outboundTag: 'block',
    });
  }

  // Default Proxy Rule
  rules.push({
    type: 'field',
    network: 'tcp,udp',
    outboundTag: 'proxy',
  });

  return {
    log: {
      loglevel: 'warning',
    },
    inbounds: [
      {
        port: 10808,
        listen: '127.0.0.1',
        protocol: 'socks',
        settings: {
          auth: 'noauth',
          udp: true,
        },
        sniffing: {
          enabled: true,
          destOverride: ['http', 'tls'],
        },
      },
      {
        port: 10809,
        listen: '127.0.0.1',
        protocol: 'http',
        settings: {},
      },
    ],
    outbounds: [
      outbound,
      {
        tag: 'direct',
        protocol: 'freedom',
        settings: {},
      },
      {
        tag: 'block',
        protocol: 'blackhole',
        settings: {
          response: {
            type: 'none',
          },
        },
      },
    ],
    routing: {
      domainStrategy: routing.domainStrategy || 'IPIfNonMatch',
      rules,
    },
  };
}
