package com.v2ray.compose.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.v2ray.compose.ui.components.GlassCard
import com.v2ray.compose.ui.theme.*

@Composable
fun SettingsScreen() {
    var autoConnect by remember { mutableStateOf(false) }
    var enableMux by remember { mutableStateOf(true) }
    var enableSniffing by remember { mutableStateOf(true) }
    var dnsServer by remember { mutableStateOf("1.1.1.1 (Cloudflare)") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = "Settings",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(text = "CONNECTION & ROUTING", style = MaterialTheme.typography.bodyMedium, color = PrimaryNeonCyan)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Auto Connect on Boot", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Switch(checked = autoConnect, onCheckedChange = { autoConnect = it })
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

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(text = "CORE INFO", style = MaterialTheme.typography.bodyMedium, color = PrimaryNeonEmerald)
            Spacer(modifier = Modifier.height(12.dp))

            Text(text = "V2Ray Core Version: v5.12.1", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "TUN Engine: Tun2Socks v2.5.2", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "App Version: 1.0.0 (Compose Native)", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
    }
}
