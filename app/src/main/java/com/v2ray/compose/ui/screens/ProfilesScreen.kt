package com.v2ray.compose.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.v2ray.compose.model.ProtocolType
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

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }

    var showImportDialog by remember { mutableStateOf(false) }
    var showManualDialog by remember { mutableStateOf(false) }
    var editingProfile by remember { mutableStateOf<V2RayProfile?>(null) }
    var importText by remember { mutableStateOf("") }

    val categories = listOf("All", "WhatsApp", "YouTube", "Telegram", "Social", "AI & Tools", "REALITY")

    val filteredProfiles = remember(profiles, searchQuery, selectedCategory) {
        profiles.filter { profile ->
            val matchesCategory = when (selectedCategory) {
                "WhatsApp" -> profile.remark.contains("whatsapp", ignoreCase = true) || profile.sni.contains("whatsapp", ignoreCase = true)
                "YouTube" -> profile.remark.contains("youtube", ignoreCase = true) || profile.sni.contains("youtube", ignoreCase = true)
                "Telegram" -> profile.remark.contains("telegram", ignoreCase = true) || profile.sni.contains("telegram", ignoreCase = true)
                "Social" -> profile.remark.contains("tiktok", ignoreCase = true) || profile.remark.contains("instagram", ignoreCase = true) || profile.remark.contains("spotify", ignoreCase = true)
                "AI & Tools" -> profile.remark.contains("chatgpt", ignoreCase = true) || profile.remark.contains("speedtest", ignoreCase = true) || profile.remark.contains("gigsky", ignoreCase = true) || profile.remark.contains("redbull", ignoreCase = true)
                "REALITY" -> profile.isReality
                else -> true
            }

            val matchesSearch = searchQuery.isEmpty() ||
                    profile.remark.contains(searchQuery, ignoreCase = true) ||
                    profile.address.contains(searchQuery, ignoreCase = true) ||
                    profile.sni.contains(searchQuery, ignoreCase = true)

            matchesCategory && matchesSearch
        }
    }

    Scaffold(
        containerColor = BackgroundDark,
        floatingActionButton = {
            Column(horizontalAlignment = Alignment.End) {
                SmallFloatingActionButton(
                    onClick = {
                        editingProfile = null
                        showManualDialog = true
                    },
                    containerColor = PrimaryNeonEmerald,
                    contentColor = BackgroundDark,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = "Manual Configuration Add")
                }

                FloatingActionButton(
                    onClick = { showImportDialog = true },
                    containerColor = PrimaryNeonCyan,
                    contentColor = BackgroundDark
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Import Configuration Link")
                }
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
                    text = "Server Profiles (${profiles.size})",
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

            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search profiles (WhatsApp, YouTube, etc.)...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryNeonCyan,
                    unfocusedBorderColor = GlassBorder,
                    focusedLabelColor = PrimaryNeonCyan
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Category Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val count = remember(profiles, cat) {
                        profiles.count { profile ->
                            when (cat) {
                                "WhatsApp" -> profile.remark.contains("whatsapp", ignoreCase = true) || profile.sni.contains("whatsapp", ignoreCase = true)
                                "YouTube" -> profile.remark.contains("youtube", ignoreCase = true) || profile.sni.contains("youtube", ignoreCase = true)
                                "Telegram" -> profile.remark.contains("telegram", ignoreCase = true) || profile.sni.contains("telegram", ignoreCase = true)
                                "Social" -> profile.remark.contains("tiktok", ignoreCase = true) || profile.remark.contains("instagram", ignoreCase = true) || profile.remark.contains("spotify", ignoreCase = true)
                                "AI & Tools" -> profile.remark.contains("chatgpt", ignoreCase = true) || profile.remark.contains("speedtest", ignoreCase = true) || profile.remark.contains("gigsky", ignoreCase = true) || profile.remark.contains("redbull", ignoreCase = true)
                                "REALITY" -> profile.isReality
                                else -> true
                            }
                        }
                    }

                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text("$cat ($count)") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryNeonCyan,
                            selectedLabelColor = BackgroundDark,
                            containerColor = CardDark,
                            labelColor = TextPrimary
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredProfiles.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (profiles.isEmpty()) "No profiles imported yet.\nTap '+' to paste link or 'Edit' icon for manual entry." else "No profiles match current search/filter.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredProfiles, key = { it.id }) { profile ->
                        ProfileCardItem(
                            profile = profile,
                            onSelect = { profilesViewModel.selectProfile(profile.id) },
                            onEdit = {
                                editingProfile = profile
                                showManualDialog = true
                            },
                            onDelete = { profilesViewModel.deleteProfile(profile) }
                        )
                    }
                }
            }
        }
    }

    // Import Dialog (URI / Subscription URL)
    if (showImportDialog) {
        AlertDialog(
            onDismissRequest = { showImportDialog = false },
            containerColor = CardDark,
            title = { Text("Import Config / Subscription", color = TextPrimary) },
            text = {
                OutlinedTextField(
                    value = importText,
                    onValueChange = { importText = it },
                    label = { Text("Paste URI (vless://, vmess://, trojan://, http://...)") },
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

    // Manual Form Dialog (Creation & Editor with REALITY support)
    if (showManualDialog) {
        ManualProfileEditorDialog(
            profileToEdit = editingProfile,
            onDismiss = { showManualDialog = false },
            onSave = { profile ->
                profilesViewModel.saveProfile(profile)
                showManualDialog = false
            }
        )
    }
}

@Composable
fun ProfileCardItem(
    profile: V2RayProfile,
    onSelect: () -> Unit,
    onEdit: () -> Unit,
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
                    if (profile.isReality) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            color = PrimaryNeonEmerald.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "REALITY",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.bodyMedium.copy(color = PrimaryNeonEmerald)
                            )
                        }
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
                Spacer(modifier = Modifier.width(4.dp))
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSecondary)
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusDisconnected)
                }
            }
        }
    }
}
