package com.v2ray.compose

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallSplit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.v2ray.compose.ui.screens.HomeScreen
import com.v2ray.compose.ui.screens.ProfilesScreen
import com.v2ray.compose.ui.screens.SettingsScreen
import com.v2ray.compose.ui.screens.SplitTunnelingScreen
import com.v2ray.compose.ui.theme.BackgroundDark
import com.v2ray.compose.ui.theme.CardDark
import com.v2ray.compose.ui.theme.PrimaryNeonCyan
import com.v2ray.compose.ui.theme.TextSecondary
import com.v2ray.compose.ui.theme.V2RayTheme
import com.v2ray.compose.viewmodel.ProfilesViewModel
import com.v2ray.compose.viewmodel.SettingsViewModel
import com.v2ray.compose.viewmodel.VpnViewModel

class MainActivity : ComponentActivity() {

    private val vpnViewModel: VpnViewModel by viewModels()
    private val profilesViewModel: ProfilesViewModel by viewModels()
    private val settingsViewModel: SettingsViewModel by viewModels()

    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            vpnViewModel.startVpnService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            V2RayTheme {
                MainScreenContent()
            }
        }
    }

    @Composable
    fun MainScreenContent() {
        val navController = rememberNavController()
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route ?: "home"

        Scaffold(
            containerColor = BackgroundDark,
            bottomBar = {
                NavigationBar(
                    containerColor = CardDark
                ) {
                    NavigationBarItem(
                        selected = currentRoute == "home",
                        onClick = { navController.navigate("home") },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                        label = { Text("Home") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PrimaryNeonCyan,
                            selectedTextColor = PrimaryNeonCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "profiles",
                        onClick = { navController.navigate("profiles") },
                        icon = { Icon(Icons.Default.List, contentDescription = "Profiles") },
                        label = { Text("Profiles") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PrimaryNeonCyan,
                            selectedTextColor = PrimaryNeonCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "split_tunneling",
                        onClick = { navController.navigate("split_tunneling") },
                        icon = { Icon(Icons.Default.CallSplit, contentDescription = "Split") },
                        label = { Text("Split") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PrimaryNeonCyan,
                            selectedTextColor = PrimaryNeonCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "settings",
                        onClick = { navController.navigate("settings") },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PrimaryNeonCyan,
                            selectedTextColor = PrimaryNeonCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = "home",
                modifier = Modifier.padding(innerPadding)
            ) {
                composable("home") {
                    HomeScreen(
                        vpnViewModel = vpnViewModel,
                        onNavigateToProfiles = { navController.navigate("profiles") },
                        onPermissionNeeded = { intent -> vpnPermissionLauncher.launch(intent) }
                    )
                }
                composable("profiles") {
                    ProfilesScreen(profilesViewModel = profilesViewModel)
                }
                composable("split_tunneling") {
                    SplitTunnelingScreen(settingsViewModel = settingsViewModel)
                }
                composable("settings") {
                    SettingsScreen()
                }
            }
        }
    }
}
