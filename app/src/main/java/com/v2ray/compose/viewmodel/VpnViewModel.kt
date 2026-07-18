package com.v2ray.compose.viewmodel

import android.app.Application
import android.content.Intent
import android.net.VpnService
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.v2ray.compose.V2RayApplication
import com.v2ray.compose.model.V2RayProfile
import com.v2ray.compose.model.VpnState
import com.v2ray.compose.model.VpnStatus
import com.v2ray.compose.parser.V2RayUriParser
import com.v2ray.compose.service.V2RayVpnService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class VpnViewModel(application: Application) : AndroidViewModel(application) {

    private val db = (application as V2RayApplication).database.profileDao()

    val vpnStatus: StateFlow<VpnStatus> = V2RayVpnService.vpnStatus
    val trafficStats = V2RayVpnService.trafficStats

    private val _activeProfile = MutableStateFlow<V2RayProfile?>(null)
    val activeProfile: StateFlow<V2RayProfile?> = _activeProfile.asStateFlow()

    init {
        viewModelScope.launch {
            db.getAllProfiles().collect { list ->
                val selected = list.find { it.isSelected }?.toDomainModel() ?: list.firstOrNull()?.toDomainModel()
                _activeProfile.value = selected
            }
        }
    }

    fun toggleVpn(onPermissionNeeded: (Intent) -> Unit) {
        val context = getApplication<Application>()
        if (vpnStatus.value == VpnStatus.CONNECTED || vpnStatus.value == VpnStatus.CONNECTING) {
            val intent = Intent(context, V2RayVpnService::class.java).apply {
                action = V2RayVpnService.ACTION_DISCONNECT
            }
            context.startService(intent)
        } else {
            val prepareIntent = VpnService.prepare(context)
            if (prepareIntent != null) {
                onPermissionNeeded(prepareIntent)
            } else {
                startVpnService()
            }
        }
    }

    fun startVpnService() {
        val context = getApplication<Application>()
        val profile = activeProfile.value ?: return
        val configJson = V2RayUriParser.generateV2RayConfigJson(profile)

        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_CONNECT
            putExtra(V2RayVpnService.EXTRA_CONFIG_JSON, configJson)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }
}
