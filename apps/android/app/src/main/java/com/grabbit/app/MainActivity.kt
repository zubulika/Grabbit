package com.grabbit.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.grabbit.app.ui.components.GrabbitBottomNav
import com.grabbit.app.ui.components.GrabbitTopBar
import com.grabbit.app.ui.components.ScreenTab
import com.grabbit.app.ui.screens.DownloadsScreen
import com.grabbit.app.ui.screens.HomeScreen
import com.grabbit.app.ui.screens.SettingsScreen
import com.grabbit.app.ui.theme.GbBg
import com.grabbit.app.ui.theme.GrabbitTheme
import com.grabbit.app.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Handle shared URL from external apps (e.g. YouTube app "Share via Grabbit")
        handleSendIntent(intent)

        setContent {
            GrabbitTheme {
                var currentTab by remember { mutableStateOf(ScreenTab.HOME) }
                var showSettings by remember { mutableStateOf(false) }

                BackHandler(enabled = showSettings) {
                    showSettings = false
                }

                // If user is on Downloads screen, pressing back returns to Home screen
                BackHandler(enabled = !showSettings && currentTab == ScreenTab.DOWNLOADS) {
                    currentTab = ScreenTab.HOME
                }

                if (showSettings) {
                    SettingsScreen(
                        viewModel = viewModel,
                        onBack = { showSettings = false }
                    )
                } else {
                    val downloadTasks by viewModel.downloadTasks.collectAsState()
                    val activeCount = downloadTasks.count { it.status == com.grabbit.app.data.model.DownloadStatus.DOWNLOADING }

                    Scaffold(
                        topBar = {
                            GrabbitTopBar(
                                onSettingsClick = { showSettings = true }
                            )
                        },
                        bottomBar = {
                            GrabbitBottomNav(
                                currentTab = currentTab,
                                onTabSelected = { currentTab = it },
                                activeDownloadsCount = activeCount
                            )
                        },
                        containerColor = GbBg
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            when (currentTab) {
                                ScreenTab.HOME -> HomeScreen(
                                    viewModel = viewModel,
                                    onNavigateToDownloads = { currentTab = ScreenTab.DOWNLOADS }
                                )
                                ScreenTab.DOWNLOADS -> DownloadsScreen(viewModel = viewModel)
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleSendIntent(intent)
    }

    private fun handleSendIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!sharedText.isNullOrBlank()) {
                viewModel.onUrlChanged(sharedText)
                viewModel.fetchMetadata()
            }
        }
    }
}
