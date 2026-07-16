# V2Ray Client — React Native

Tam özellikli, modern tasarımlı React Native (Expo) V2Ray istemci uygulaması.

## 📱 Ekranlar

| Ana Sayfa | Sunucular | Sunucu Ekle | Detay | Günlük | Ayarlar |
|-----------|-----------|-------------|-------|--------|---------|
| Bağlantı butonu, trafik istatistikleri | Sunucu listesi, ping ölçümü | Manuel form + URI import | QR kod, paylaş | Terminal günlük | Toggle ayarlar |

## ✨ Özellikler

### Protokol Desteği
- **VMess** (vmess://) — UUID, AlterId, çoklu ağ
- **VLess** (vless://) — UUID, Flow, XTLS
- **Trojan** (trojan://) — Password, TLS
- **Shadowsocks** (ss://) — Cipher + Password

### Sunucu Yönetimi
- Sunucu ekleme (manuel form)
- URI ile toplu içe aktarma (pano / dosya)
- Ping ölçümü (tüm sunucular)
- QR kod oluşturma & paylaşma
- Sunucu detay görüntüleme & kopyalama

### Bağlantı
- Animasyonlu bağlantı butonu
- Gerçek zamanlı trafik istatistikleri (↓ İndirme / ↑ Yükleme)
- Bağlantı süresi göstergesi
- Terminal tarzı günlük ekranı

### Ayarlar
- Otomatik bağlan
- Kill Switch
- LAN bypass
- IPv6 desteği
- UDP protokolü
- Mux (çoğullama)

## 🚀 Kurulum

### Gereksinimler
```bash
node >= 18
npm >= 9
expo-cli
Android Studio veya fiziksel cihaz
```

### Adımlar

```bash
# 1. Bağımlılıkları yükle
cd v2ray-app
npm install

# 2. Expo ile başlat
npx expo start

# 3. Android için çalıştır
npx expo run:android

# 4. APK oluştur (EAS Build)
npm install -g eas-cli
eas build --platform android --profile preview
```

## 📂 Proje Yapısı

```
v2ray-app/
├── App.tsx                    # Uygulama giriş noktası
├── app.json                   # Expo yapılandırması
├── package.json               # Bağımlılıklar
├── babel.config.js
├── tsconfig.json
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx  # Tab + Stack navigasyon
    ├── screens/
    │   ├── HomeScreen.tsx     # Ana ekran (bağlantı + istatistik)
    │   ├── ServersScreen.tsx  # Sunucu listesi
    │   ├── AddServerScreen.tsx# Sunucu ekle / URI import
    │   ├── ServerDetailScreen.tsx # Detay + QR kod
    │   ├── LogsScreen.tsx     # Terminal günlük
    │   └── SettingsScreen.tsx # Ayarlar
    ├── store/
    │   └── configStore.ts     # Zustand global state
    └── utils/
        └── theme.ts           # Renkler, tipografi, yardımcılar
```

## 🎨 Tasarım

- **Tema:** Karanlık (Dark Mode) — #0A0E1A arka plan
- **Vurgu Rengi:** Indigo (`#6366F1`)
- **Protokol Renkleri:**
  - VMess → Indigo `#6366F1`
  - VLess → Violet `#8B5CF6`
  - Trojan → Amber `#F59E0B`
  - Shadowsocks → Emerald `#10B981`
- **Animasyonlar:** Bağlantı butonu glow efekti, scale animasyonları

## 🔌 URI Format Örnekleri

```
# VMess
vmess://eyJ2IjoiMiIsInBzIjoiTXkgU2VydmVyIiwiYWRkIjoiZXhhbXBsZS5jb20iLCJwb3J0IjoiNDQzIiwiaWQiOiJ4eHh4In0=

# VLess
vless://uuid@example.com:443?security=tls&type=ws&path=/ws#MyServer

# Trojan
trojan://password@example.com:443#MyServer

# Shadowsocks
ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:8388#MyServer
```

## ⚠️ Yasal Uyarı

Bu uygulama yalnızca **eğitim ve araştırma** amaçlıdır.
Bulunduğunuz ülkenin yasalarına uygun şekilde kullanın.
