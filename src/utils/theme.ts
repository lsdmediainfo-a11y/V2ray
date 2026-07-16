// src/utils/theme.ts
// Uygulama renk teması ve stil sabitleri

export const Colors = {
  // Backgrounds
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgCardDark: '#0D1220',
  bgInput: '#1A2035',
  bgModal: '#0D1525',

  // Brand
  primary: '#6366F1',       // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#06B6D4',     // Cyan
  secondaryDark: '#0891B2',
  accent: '#F472B6',        // Pink

  // Status
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  error: '#EF4444',
  errorDark: '#DC2626',

  // Protocol colors
  vmess: '#6366F1',
  vless: '#8B5CF6',
  trojan: '#F59E0B',
  shadowsocks: '#10B981',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textDisabled: '#334155',

  // Border
  border: '#1E293B',
  borderLight: '#334155',

  // Gradients (start, end)
  gradientPrimary: ['#6366F1', '#4F46E5'] as const,
  gradientSuccess: ['#10B981', '#059669'] as const,
  gradientError: ['#EF4444', '#DC2626'] as const,
  gradientCard: ['#1E293B', '#0F172A'] as const,
  gradientBg: ['#0A0E1A', '#111827'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  }),
};

export function getProtocolColor(protocol: string): string {
  switch (protocol) {
    case 'vmess': return Colors.vmess;
    case 'vless': return Colors.vless;
    case 'trojan': return Colors.trojan;
    case 'shadowsocks': return Colors.shadowsocks;
    default: return Colors.primary;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
}

export function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}s ${mins % 60}d ${secs % 60}sn`;
  if (mins > 0) return `${mins}d ${secs % 60}sn`;
  return `${secs}sn`;
}
