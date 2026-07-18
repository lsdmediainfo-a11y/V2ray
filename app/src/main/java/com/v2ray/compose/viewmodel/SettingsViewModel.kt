package com.v2ray.compose.viewmodel

import android.app.Application
import android.content.pm.PackageManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.v2ray.compose.model.AppInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val _installedApps = MutableStateFlow<List<AppInfo>>(emptyList())
    val installedApps: StateFlow<List<AppInfo>> = _installedApps.asStateFlow()

    private val _bypassedPackages = MutableStateFlow<Set<String>>(emptySet())
    val bypassedPackages: StateFlow<Set<String>> = _bypassedPackages.asStateFlow()

    init {
        loadInstalledApps()
    }

    private fun loadInstalledApps() {
        viewModelScope.launch(Dispatchers.IO) {
            val pm = getApplication<Application>().packageManager
            val packages = pm.getInstalledPackages(PackageManager.GET_META_DATA)
            val list = mutableListOf<AppInfo>()

            for (pkg in packages) {
                if (pkg.packageName != getApplication<Application>().packageName) {
                    val appName = pkg.applicationInfo.loadLabel(pm).toString()
                    list.add(AppInfo(packageName = pkg.packageName, appName = appName))
                }
            }
            _installedApps.value = list.sortedBy { it.appName }
        }
    }

    fun toggleAppBypass(packageName: String) {
        val current = _bypassedPackages.value.toMutableSet()
        if (current.contains(packageName)) {
            current.remove(packageName)
        } else {
            current.add(packageName)
        }
        _bypassedPackages.value = current
    }
}
