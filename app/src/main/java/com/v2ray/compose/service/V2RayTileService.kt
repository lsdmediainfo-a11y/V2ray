package com.v2ray.compose.service

import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi
import com.v2ray.compose.model.VpnStatus

@RequiresApi(Build.VERSION_CODES.N)
class V2RayTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        val currentStatus = V2RayVpnService.vpnStatus.value
        if (currentStatus == VpnStatus.CONNECTED || currentStatus == VpnStatus.CONNECTING) {
            val intent = Intent(this, V2RayVpnService::class.java).apply {
                action = V2RayVpnService.ACTION_DISCONNECT
            }
            startService(intent)
        } else {
            val intent = Intent(this, V2RayVpnService::class.java).apply {
                action = V2RayVpnService.ACTION_CONNECT
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
        updateTileState()
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        val isConnected = V2RayVpnService.vpnStatus.value == VpnStatus.CONNECTED
        tile.state = if (isConnected) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.label = if (isConnected) "V2Ray: ON" else "V2Ray: OFF"
        tile.updateTile()
    }
}
