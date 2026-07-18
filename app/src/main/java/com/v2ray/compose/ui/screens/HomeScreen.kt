package com.v2ray.compose.ui.screens

import android.content.Intent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.v2ray.compose.model.VpnStatus
import com.v2ray.compose.ui.components.GlassCard
import com.v2ray.compose.ui.components.LatencyBadge
import com.v2ray.compose.ui.components.LiveSpeedMeter
import com.v2ray.compose.ui.theme.*
import com.v2ray.compose.viewmodel.ProfilesViewModel
import com.v2ray.compose.viewmodel.VpnViewModel

@Composable
fun HomeScreen(
    vpnViewModel: VpnViewModel,
    profilesViewModel: ProfilesViewModel,
    onNavigateToProfiles: () -> Unit,
    onPermissionNeeded: (Intent) -> Unit
) {
    val status by vpnViewModel.vpnStatus.collectAsState()
    val stats by vpnViewModel.trafficStats.collectAsState()
    val activeProfile by vpnViewModel.activeProfile.collectAsState()
    val isTestingPing by profilesViewModel.isTestingPing.collectAsState()

    val isConnected = status == VpnStatus.CONNECTED
    val isConnecting = status == VpnStatus.CONNECTING

    val statusColor by animateColorAsState(
        targetValue = when (status) {
            VpnStatus.CONNECTED -> StatusConnected
            VpnStatus.CONNECTING -> StatusConnecting
            else -> StatusDisconnected
        },
        label = "statusColor"
    )

    // Pulse animation for button when connecting
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scalePulse by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isConnecting) 1.08f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scalePulse"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = null,
                    tint = PrimaryNeonCyan,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "V2Ray VPN",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary
                )
            }

            Surface(
                color = statusColor.copy(alpha = 0.15f),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.5f))
            ) {
                Text(
                    text = status.name,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = statusColor
                )
            }
        }

        // Active Profile Selector Box & Auto Fastest Button
        Column(modifier = Modifier.fillMaxWidth()) {
            GlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToProfiles() }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "SELECTED SERVER",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = activeProfile?.remark ?: "No Profile Selected",
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary
                        )
                        if (activeProfile != null) {
                            Text(
                                text = "${activeProfile!!.protocol.displayName} • ${activeProfile!!.address}:${activeProfile!!.port}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }
                    }
                    if (activeProfile != null) {
                        LatencyBadge(pingMs = activeProfile!!.pingMs)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Auto Select Fastest Button
            OutlinedButton(
                onClick = {
                    profilesViewModel.selectFastestProfile { fastest ->
                        if (fastest != null && !isConnected) {
                            vpnViewModel.toggleVpn(onPermissionNeeded)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isTestingPing,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryNeonEmerald),
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryNeonEmerald)
            ) {
                if (isTestingPing) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = PrimaryNeonEmerald)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Pinging & Finding Fastest Server...")
                } else {
                    Icon(Icons.Default.Bolt, contentDescription = null, tint = PrimaryNeonEmerald)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Connect to Fastest Server (Auto Ping)")
                }
            }
        }

        // Animated Power Button
        Box(
            modifier = Modifier.size(180.dp),
            contentAlignment = Alignment.Center
        ) {
            // Glow Ring
            Box(
                modifier = Modifier
                    .size(170.dp)
                    .scale(scalePulse)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(statusColor.copy(alpha = 0.35f), Color.Transparent)
                        )
                    )
            )

            // Outer Circle Button
            Surface(
                modifier = Modifier
                    .size(130.dp)
                    .clip(CircleShape)
                    .clickable { vpnViewModel.toggleVpn(onPermissionNeeded) },
                color = CardDark,
                shape = CircleShape,
                border = androidx.compose.foundation.BorderStroke(3.dp, statusColor)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.PowerSettingsNew,
                        contentDescription = "Toggle VPN",
                        tint = statusColor,
                        modifier = Modifier.size(60.dp)
                    )
                }
            }
        }

        // Traffic Speed Meter with Neon Wave Canvas Graph
        LiveSpeedMeter(
            uploadSpeedKbps = if (isConnected) stats.txSpeedKbps else 0.0,
            downloadSpeedKbps = if (isConnected) stats.rxSpeedKbps else 0.0,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
