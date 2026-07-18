package com.v2ray.compose.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.v2ray.compose.model.V2RayProfile
import com.v2ray.compose.ui.components.GlassCard
import com.v2ray.compose.ui.components.LatencyBadge
import com.v2ray.compose.ui.theme.*
import com.v2ray.compose.viewmodel.ProfilesViewModel

@Composable
fun ProfilesScreen(
    profilesViewModel: ProfilesViewModel
) {
    val profiles by profilesViewModel.profiles.collectAsState()
    val isTestingPing by profilesViewModel.isTestingPing.collectAsState()
    var showImportDialog by remember { mutableStateOf(false) }
    var importText by remember { mutableStateOf("") }

    Scaffold(
        containerColor = BackgroundDark,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showImportDialog = true },
                containerColor = PrimaryNeonCyan,
                contentColor = BackgroundDark
            ) {
                Icon(Icons.Default.Add, contentDescription = "Import Configuration")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Server Profiles",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary
                )

                IconButton(
                    onClick = { profilesViewModel.testAllPings() },
                    enabled = !isTestingPing
                ) {
                    if (isTestingPing) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = PrimaryNeonCyan)
                    } else {
                        Icon(Icons.Default.NetworkCheck, contentDescription = "Ping All", tint = PrimaryNeonCyan)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (profiles.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No profiles imported yet.\nTap '+' to paste VMess / VLESS / Trojan link.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(profiles, key = { it.id }) { profile ->
                        ProfileCardItem(
                            profile = profile,
                            onSelect = { profilesViewModel.selectProfile(profile.id) },
                            onDelete = { profilesViewModel.deleteProfile(profile) }
                        )
                    }
                }
            }
        }
    }

    if (showImportDialog) {
        AlertDialog(
            onDismissRequest = { showImportDialog = false },
            containerColor = CardDark,
            title = { Text("Import Config / Subscription", color = TextPrimary) },
            text = {
                OutlinedTextField(
                    value = importText,
                    onValueChange = { importText = it },
                    label = { Text("Paste URI (vmess://, vless://, http://...)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryNeonCyan,
                        unfocusedBorderColor = TextMuted,
                        focusedLabelColor = PrimaryNeonCyan
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val trimmed = importText.trim()
                        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                            profilesViewModel.importSubscription(trimmed)
                        } else {
                            profilesViewModel.importFromUri(trimmed)
                        }
                        showImportDialog = false
                        importText = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeonCyan, contentColor = BackgroundDark)
                ) {
                    Text("Import")
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun ProfileCardItem(
    profile: V2RayProfile,
    onSelect: () -> Unit,
    onDelete: () -> Unit
) {
    val borderColor = if (profile.isSelected) PrimaryNeonCyan else GlassBorder

    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .border(2.dp, borderColor, RoundedCornerShape(20.dp))
            .clickable { onSelect() }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = PrimaryNeonCyan.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = profile.protocol.displayName,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.bodyMedium.copy(color = PrimaryNeonCyan)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = profile.remark,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${profile.address}:${profile.port}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                LatencyBadge(pingMs = profile.pingMs)
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusDisconnected)
                }
            }
        }
    }
}
