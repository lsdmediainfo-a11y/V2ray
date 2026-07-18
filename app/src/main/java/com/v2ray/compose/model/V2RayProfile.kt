package com.v2ray.compose.model

data class V2RayProfile(
    val id: String = java.util.UUID.randomUUID().toString(),
    val remark: String,
    val address: String,
    val port: Int,
    val protocol: ProtocolType,
    val uuidOrPassword: String,
    val security: String = "auto",
    val network: String = "tcp",
    val path: String = "",
    val host: String = "",
    val sni: String = "",
    val alterId: Int = 0,
    val isTls: Boolean = false,
    val isSelected: Boolean = false,
    val pingMs: Int = -1,
    val subscriptionUrl: String? = null,
    val rawUri: String = ""
)

enum class VpnStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    DISCONNECTING,
    ERROR
}

data class VpnState(
    val status: VpnStatus = VpnStatus.DISCONNECTED,
    val activeProfile: V2RayProfile? = null,
    val uploadSpeedKbps: Double = 0.0,
    val downloadSpeedKbps: Double = 0.0,
    val totalUploadBytes: Long = 0,
    val totalDownloadBytes: Long = 0,
    val connectionTimeSeconds: Long = 0,
    val errorMessage: String? = null
)

data class AppInfo(
    val packageName: String,
    val appName: String,
    val isBypassed: Boolean = false
)
