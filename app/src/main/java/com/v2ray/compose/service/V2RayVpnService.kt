package com.v2ray.compose.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import com.v2ray.compose.model.VpnStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class V2RayVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    private var isRunning = false
    private var bytesRx: Long = 0
    private var bytesTx: Long = 0

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        when (action) {
            ACTION_CONNECT -> {
                val configJson = intent.getStringExtra(EXTRA_CONFIG_JSON)
                val bypassedPackages = intent.getStringArrayListExtra(EXTRA_BYPASSED_PACKAGES) ?: arrayListOf()
                startVpn(configJson, bypassedPackages)
            }
            ACTION_DISCONNECT -> {
                stopVpn()
            }
        }
        return START_NOT_STICKY
    }

    private fun startVpn(configJson: String?, bypassedPackages: ArrayList<String>) {
        if (isRunning) return
        isRunning = true
        _vpnStatus.value = VpnStatus.CONNECTING

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("V2Ray VPN Active")
            .setContentText("Securing network connection...")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        serviceScope.launch {
            try {
                val builder = Builder()
                    .setSession("V2RayComposeVPN")
                    .addAddress("10.0.0.2", 24)
                    .addRoute("0.0.0.0", 0)
                    .addDnsServer("1.1.1.1")
                    .addDnsServer("8.8.8.8")
                    .setMtu(1500)

                for (pkg in bypassedPackages) {
                    try {
                        builder.addDisallowedApplication(pkg)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                vpnInterface = builder.establish()

                if (vpnInterface != null) {
                    _vpnStatus.value = VpnStatus.CONNECTED
                    startTrafficMonitor()
                } else {
                    _vpnStatus.value = VpnStatus.ERROR
                    stopVpn()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _vpnStatus.value = VpnStatus.ERROR
                stopVpn()
            }
        }
    }

    private fun startTrafficMonitor() {
        serviceScope.launch {
            var timeSeconds = 0L
            val prefs = getSharedPreferences("v2ray_settings", Context.MODE_PRIVATE)

            while (isRunning && isActive) {
                val isLowBatteryMode = prefs.getBoolean("low_battery_saver", true)
                val updateIntervalMs = if (isLowBatteryMode) 2500L else 1000L
                delay(updateIntervalMs)

                timeSeconds += (updateIntervalMs / 1000L).coerceAtLeast(1L)

                // Simulated traffic metrics
                val deltaRx = (100000..500000).random().toLong()
                val deltaTx = (20000..150000).random().toLong()

                bytesRx += deltaRx
                bytesTx += deltaTx

                val rxSpeedKbps = (deltaRx * 8) / (updateIntervalMs / 1000.0)
                val txSpeedKbps = (deltaTx * 8) / (updateIntervalMs / 1000.0)

                _trafficStats.value = TrafficStats(
                    rxSpeedKbps = rxSpeedKbps,
                    txSpeedKbps = txSpeedKbps,
                    totalRxBytes = bytesRx,
                    totalTxBytes = bytesTx,
                    uptimeSeconds = timeSeconds
                )
            }
        }
    }

    private fun stopVpn() {
        isRunning = false
        _vpnStatus.value = VpnStatus.DISCONNECTING
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        serviceJob.cancel()
        serviceJob = Job()
        stopForeground(STOP_FOREGROUND_REMOVE)
        _vpnStatus.value = VpnStatus.DISCONNECTED
        stopSelf()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "V2Ray VPN Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    data class TrafficStats(
        val rxSpeedKbps: Double = 0.0,
        val txSpeedKbps: Double = 0.0,
        val totalRxBytes: Long = 0,
        val totalTxBytes: Long = 0,
        val uptimeSeconds: Long = 0
    )

    companion object {
        const val ACTION_CONNECT = "com.v2ray.compose.ACTION_CONNECT"
        const val ACTION_DISCONNECT = "com.v2ray.compose.ACTION_DISCONNECT"
        const val EXTRA_CONFIG_JSON = "EXTRA_CONFIG_JSON"
        const val EXTRA_BYPASSED_PACKAGES = "EXTRA_BYPASSED_PACKAGES"

        private const val CHANNEL_ID = "v2ray_vpn_channel"
        private const val NOTIFICATION_ID = 1001

        private val _vpnStatus = MutableStateFlow(VpnStatus.DISCONNECTED)
        val vpnStatus: StateFlow<VpnStatus> = _vpnStatus

        private val _trafficStats = MutableStateFlow(TrafficStats())
        val trafficStats: StateFlow<TrafficStats> = _trafficStats
    }
}
