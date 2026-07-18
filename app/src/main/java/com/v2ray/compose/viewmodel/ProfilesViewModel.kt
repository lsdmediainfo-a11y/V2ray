package com.v2ray.compose.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.v2ray.compose.V2RayApplication
import com.v2ray.compose.data.ProfileEntity
import com.v2ray.compose.model.V2RayProfile
import com.v2ray.compose.parser.SubscriptionParser
import com.v2ray.compose.parser.V2RayUriParser
import com.v2ray.compose.service.PingManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProfilesViewModel(application: Application) : AndroidViewModel(application) {

    private val db = (application as V2RayApplication).database.profileDao()

    private val _profiles = MutableStateFlow<List<V2RayProfile>>(emptyList())
    val profiles: StateFlow<List<V2RayProfile>> = _profiles.asStateFlow()

    private val _isTestingPing = MutableStateFlow(false)
    val isTestingPing: StateFlow<Boolean> = _isTestingPing.asStateFlow()

    private val _isSyncingSub = MutableStateFlow(false)
    val isSyncingSub: StateFlow<Boolean> = _isSyncingSub.asStateFlow()

    init {
        viewModelScope.launch {
            db.getAllProfiles().collect { entities ->
                _profiles.value = entities.map { it.toDomainModel() }
            }
        }
    }

    fun selectProfile(id: String) {
        viewModelScope.launch {
            db.selectProfile(id)
        }
    }

    fun saveProfile(profile: V2RayProfile) {
        viewModelScope.launch {
            db.insertProfile(ProfileEntity.fromDomainModel(profile))
        }
    }

    fun importFromUri(uriStr: String): Boolean {
        val parsed = V2RayUriParser.parse(uriStr) ?: return false
        viewModelScope.launch {
            db.insertProfile(ProfileEntity.fromDomainModel(parsed))
        }
        return true
    }

    fun importSubscription(urlStr: String) {
        viewModelScope.launch {
            _isSyncingSub.value = true
            val fetched = SubscriptionParser.fetchSubscription(urlStr)
            if (fetched.isNotEmpty()) {
                db.deleteSubscriptionProfiles(urlStr)
                db.insertProfiles(fetched.map { ProfileEntity.fromDomainModel(it) })
            }
            _isSyncingSub.value = false
        }
    }

    fun deleteProfile(profile: V2RayProfile) {
        viewModelScope.launch {
            db.deleteProfile(ProfileEntity.fromDomainModel(profile))
        }
    }

    fun testAllPings() {
        viewModelScope.launch(Dispatchers.IO) {
            _isTestingPing.value = true
            val list = _profiles.value
            for (p in list) {
                val ping = PingManager.pingTcp(p.address, p.port)
                db.updatePing(p.id, ping)
            }
            _isTestingPing.value = false
        }
    }
}
