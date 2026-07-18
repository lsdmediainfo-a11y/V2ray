package com.v2ray.compose.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.v2ray.compose.model.AppInfo
import com.v2ray.compose.ui.components.GlassCard
import com.v2ray.compose.ui.theme.*
import com.v2ray.compose.viewmodel.SettingsViewModel

@Composable
fun SplitTunnelingScreen(
    settingsViewModel: SettingsViewModel
) {
    val apps by settingsViewModel.installedApps.collectAsState()
    val bypassed by settingsViewModel.bypassedPackages.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    val filteredApps = remember(apps, searchQuery) {
        if (searchQuery.isEmpty()) apps else apps.filter { it.appName.contains(searchQuery, ignoreCase = true) || it.packageName.contains(searchQuery, ignoreCase = true) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = "Split Tunneling",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )
        Text(
            text = "Select applications to bypass the VPN tunnel",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search apps...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryNeonCyan,
                unfocusedBorderColor = GlassBorder,
                focusedLabelColor = PrimaryNeonCyan
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredApps.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PrimaryNeonCyan)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredApps, key = { it.packageName }) { app ->
                    val isBypassed = bypassed.contains(app.packageName)
                    AppBypassRow(
                        app = app,
                        isBypassed = isBypassed,
                        onToggle = { settingsViewModel.toggleAppBypass(app.packageName) }
                    )
                }
            }
        }
    }
}

@Composable
fun AppBypassRow(
    app: AppInfo,
    isBypassed: Boolean,
    onToggle: () -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = app.appName, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Text(text = app.packageName, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            }
            Switch(
                checked = isBypassed,
                onCheckedChange = { onToggle() },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = BackgroundDark,
                    checkedTrackColor = PrimaryNeonCyan,
                    uncheckedThumbColor = TextSecondary,
                    uncheckedTrackColor = CardDark
                )
            )
        }
    }
}
