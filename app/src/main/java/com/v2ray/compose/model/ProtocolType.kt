package com.v2ray.compose.model

enum class ProtocolType(val displayName: String, val scheme: String) {
    VMESS("VMess", "vmess"),
    VLESS("VLESS", "vless"),
    TROJAN("Trojan", "trojan"),
    SHADOWSOCKS("Shadowsocks", "ss"),
    SOCKS("Socks", "socks"),
    HTTP("HTTP", "http");

    companion object {
        fun fromScheme(scheme: String): ProtocolType {
            return entries.find { it.scheme.equals(scheme, ignoreCase = true) } ?: VMESS
        }
    }
}
