package com.v2ray.compose.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.v2ray.compose.ui.components.GlassCard
import com.v2ray.compose.ui.theme.*
import com.v2ray.compose.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    settingsViewModel: SettingsViewModel
) {
    val autoConnect by settingsViewModel.autoConnect.collectAsState()
    val killSwitch by settingsViewModel.killSwitch.collectAsState()
    val bypassLan by settingsViewModel.bypassLan.collectAsState()

    var enableMux by remember { mutableStateOf(true) }
    var enableSniffing by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Settings & Security",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Security & Kill Switch Card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(text = "SECURITY & PROTECTION", style = MaterialTheme.typography.bodyMedium, color = StatusDisconnected)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "VPN Kill Switch", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                    Text(text = "Block all internet traffic if VPN connection drops", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
                Switch(checked = killSwitch, onCheckedChange = { settingsViewModel.setKillSwitch(it) })
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp), color = GlassBorder)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Auto-Connect on Boot", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                    Text(text = "Connect to selected profile when device starts", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
                Switch(checked = autoConnect, onCheckedChange = { settingsViewModel.setAutoConnect(it) })
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Connection & Routing Card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(text = "ROUTING & PROTOCOL", style = MaterialTheme.typography.bodyMedium, color = PrimaryNeonCyan)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Bypass LAN & Local Traffic", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                    Text(text = "Direct connection for local private networks", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
                Switch(checked = bypassLan, onCheckedChange = { settingsViewModel.setBypassLan(it) })
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp), color = GlassBorder)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Enable Traffic Sniffing", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Switch(checked = enableSniffing, onCheckedChange = { enableSniffing = it })
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp), color = GlassBorder)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Enable Mux (Multiplexing)", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Switch(checked = enableMux, onCheckedChange = { enableMux = it })
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Core Info Card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(text = "ENGINE & CORE INFO", style = MaterialTheme.typography.bodyMedium, color = PrimaryNeonEmerald)
            Spacer(modifier = Modifier.height(12.dp))

            Text(text = "V2Ray Core Version: v5.12.1", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "TUN Engine: Tun2Socks v2.5.2", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "App Version: 1.0.0 (Compose Native)", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
    }
}
