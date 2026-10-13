package com.grabbit.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grabbit.app.data.model.StorageDevice
import com.grabbit.app.data.model.StorageType
import com.grabbit.app.ui.theme.*
import com.grabbit.app.utils.StorageAnalyzer
import com.grabbit.app.viewmodel.MainViewModel

@Composable
fun SettingsScreen(
    viewModel: MainViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val settings by viewModel.appSettings.collectAsState()
    val connectedDevices by viewModel.connectedStorageDevices.collectAsState()

    val updateInfo by viewModel.updateInfo.collectAsState()
    val isCheckingUpdate by viewModel.isCheckingUpdate.collectAsState()
    val updateCheckMessage by viewModel.updateCheckMessage.collectAsState()
    val isDownloadingUpdate by viewModel.isDownloadingUpdate.collectAsState()
    val updateDownloadProgress by viewModel.updateDownloadProgress.collectAsState()

    // Clean folder picker via Android Storage Access Framework
    val folderPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
            val (displayName, physicalPath) = StorageAnalyzer.parseHumanReadablePathFromUri(context, uri)
            viewModel.updateCustomDownloadLocation(uri, displayName, physicalPath)
        }
    }

    var showVideoQualityDialog by remember { mutableStateOf(false) }
    var showAudioQualityDialog by remember { mutableStateOf(false) }
    var showConcurrentDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GbBg)
    ) {
        // Minimalist Header with Back Arrow
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(GbBg)
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(GbSurface)
                    .border(1.dp, GbBorder, RoundedCornerShape(10.dp))
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = GbText,
                    modifier = Modifier.size(20.dp)
                )
            }
            Text(
                text = "Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = GbText,
                fontSize = 18.sp
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 36.dp)
        ) {
            // Storage Drives Section (Passive status indicators, no buttons, no badges)
            item {
                SectionTitle("STORAGE")
            }

            items(connectedDevices, key = { it.id }) { device ->
                StorageDriveIndicatorCard(device = device)
            }

            // Download Folder Section
            item {
                SectionTitle("DOWNLOAD FOLDER")
            }
            item {
                val friendlyLocation = formatCleanLocation(settings.downloadLocationName)

                DownloadFolderCard(
                    locationDisplay = friendlyLocation,
                    onChangeFolder = { folderPickerLauncher.launch(null) },
                    onOpenFolder = { viewModel.openDownloadFolder(context) },
                    onResetDefault = {
                        viewModel.updateCustomDownloadLocation(null, "Internal Storage > Downloads > Grabbit", null)
                    }
                )
            }

            // Media Quality Preferences
            item {
                SectionTitle("MEDIA QUALITY")
            }
            item {
                SettingCard(
                    icon = Icons.Default.HighQuality,
                    title = "Video Quality",
                    subtitle = settings.preferredVideoQuality,
                    onClick = { showVideoQualityDialog = true }
                )
            }
            item {
                SettingCard(
                    icon = Icons.Default.Audiotrack,
                    title = "Audio Quality",
                    subtitle = settings.preferredAudioQuality,
                    onClick = { showAudioQualityDialog = true }
                )
            }

            // Preferences
            item {
                SectionTitle("PREFERENCES")
            }
            item {
                SettingCard(
                    icon = Icons.Default.Speed,
                    title = "Simultaneous Downloads",
                    subtitle = "${settings.maxConcurrentDownloads} active tasks",
                    onClick = { showConcurrentDialog = true }
                )
            }
            item {
                SettingToggleCard(
                    icon = Icons.Default.Wifi,
                    title = "Wi-Fi Only",
                    subtitle = "Only download when connected to Wi-Fi",
                    checked = settings.wifiOnly,
                    onCheckedChange = viewModel::updateWifiOnly
                )
            }
            item {
                SettingToggleCard(
                    icon = Icons.Default.Notifications,
                    title = "Completion Notifications",
                    subtitle = "Notify when downloads complete",
                    checked = settings.notifyOnCompletion,
                    onCheckedChange = viewModel::updateNotifyOnCompletion
                )
            }

            // Updates Section
            item {
                SectionTitle("APP UPDATES")
            }
            item {
                AppUpdateCard(
                    currentVersion = viewModel.currentAppVersion,
                    isChecking = isCheckingUpdate,
                    statusMessage = updateCheckMessage,
                    onCheckUpdates = { viewModel.checkForUpdates(silent = false) }
                )
            }

            // About
            item {
                SectionTitle("ABOUT")
            }
            item {
                SettingCard(
                    icon = Icons.Default.Info,
                    title = "Grabbit",
                    subtitle = "Version ${viewModel.currentAppVersion} • Grab Anything with a Link",
                    onClick = null
                )
            }
        }
    }

    // In-App Update Dialog
    if (updateInfo != null) {
        UpdateAvailableDialog(
            updateInfo = updateInfo!!,
            isDownloading = isDownloadingUpdate,
            progress = updateDownloadProgress,
            onUpdateNow = { viewModel.downloadAndInstallUpdate(context) },
            onDismiss = { viewModel.dismissUpdateDialog() }
        )
    }

    // Video Quality Dialog
    if (showVideoQualityDialog) {
        OptionChoiceDialog(
            title = "Video Quality",
            options = listOf(
                "Best Available (1080p)" to "Max resolution and bitrate",
                "720p HD" to "Balanced quality and file size",
                "480p Standard" to "Smaller download size",
                "360p Medium" to "Lowest data usage"
            ),
            selected = settings.preferredVideoQuality,
            onSelect = {
                viewModel.updateVideoQuality(it)
                showVideoQualityDialog = false
            },
            onDismiss = { showVideoQualityDialog = false }
        )
    }

    // Audio Quality Dialog
    if (showAudioQualityDialog) {
        OptionChoiceDialog(
            title = "Audio Quality",
            options = listOf(
                "320 kbps (High Quality MP3)" to "Studio audio fidelity",
                "192 kbps (Standard MP3)" to "Standard stream audio",
                "128 kbps (Fast M4A)" to "Lightweight audio format"
            ),
            selected = settings.preferredAudioQuality,
            onSelect = {
                viewModel.updateAudioQuality(it)
                showAudioQualityDialog = false
            },
            onDismiss = { showAudioQualityDialog = false }
        )
    }

    // Concurrent Tasks Dialog
    if (showConcurrentDialog) {
        OptionChoiceDialog(
            title = "Simultaneous Downloads",
            options = listOf(
                "1" to "Sequential downloads (1 task at a time)",
                "2" to "2 simultaneous tasks",
                "3" to "3 simultaneous tasks (Recommended)",
                "5" to "5 simultaneous tasks"
            ),
            selected = settings.maxConcurrentDownloads.toString(),
            onSelect = {
                viewModel.updateMaxConcurrent(it.toIntOrNull() ?: 3)
                showConcurrentDialog = false
            },
            onDismiss = { showConcurrentDialog = false }
        )
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelSmall,
        color = GbTextMuted,
        letterSpacing = 1.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(start = 4.dp, top = 6.dp)
    )
}

private fun formatCleanLocation(raw: String): String {
    val defaultPath = "Internal Storage > Downloads > Grabbit"
    if (raw.isBlank() || raw.equals("null", ignoreCase = true)) return defaultPath
    var cleaned = raw.trim()
    if (cleaned.contains("/storage/emulated/0", ignoreCase = true) || cleaned.contains("storage/emulated/0", ignoreCase = true)) {
        cleaned = cleaned
            .replace("/storage/emulated/0/", "", ignoreCase = true)
            .replace("/storage/emulated/0", "", ignoreCase = true)
            .replace("storage/emulated/0/", "", ignoreCase = true)
            .replace("storage/emulated/0", "", ignoreCase = true)
        cleaned = if (cleaned.isBlank()) "Downloads > Grabbit" else cleaned
    } else if (cleaned.contains("/storage/emulated", ignoreCase = true) || cleaned.contains("storage/emulated", ignoreCase = true)) {
        cleaned = cleaned
            .replace("/storage/emulated/", "", ignoreCase = true)
            .replace("/storage/emulated", "", ignoreCase = true)
            .replace("storage/emulated/", "", ignoreCase = true)
            .replace("storage/emulated", "", ignoreCase = true)
        cleaned = if (cleaned.isBlank()) "Downloads > Grabbit" else cleaned
    }
    cleaned = cleaned.trimStart('/')
    cleaned = cleaned.replace("/", " > ").replace("\\", " > ").replace("  ", " ").trim()

    // Ensure the root storage device is always presented as the root
    if (!cleaned.startsWith("Internal Storage", ignoreCase = true) &&
        !cleaned.startsWith("SD Card", ignoreCase = true) &&
        !cleaned.startsWith("External", ignoreCase = true) &&
        !cleaned.startsWith("USB", ignoreCase = true)) {
        cleaned = "Internal Storage > $cleaned"
    }

    return if (cleaned.isBlank() || cleaned.equals("null", ignoreCase = true)) defaultPath else cleaned
}

/**
 * Clean, Human-Engineered Storage Drive Status Card
 * Zero badges, zero buttons. Purely an elegant passive status bar.
 */
@Composable
private fun StorageDriveIndicatorCard(device: StorageDevice) {
    val deviceIcon = when (device.type) {
        StorageType.INTERNAL -> Icons.Default.PhoneAndroid
        StorageType.SD_CARD -> Icons.Default.SdCard
        StorageType.USB_OTG -> Icons.Default.Usb
    }

    val usedPct = if (device.totalBytes > 0) {
        ((device.totalBytes - device.freeBytes).toFloat() / device.totalBytes.toFloat()).coerceIn(0f, 1f)
    } else 0f

    val safeDeviceName = when {
        device.name.contains("/storage", ignoreCase = true) || device.name.contains("emulated", ignoreCase = true) -> "Internal Storage"
        device.isPrimary -> "Internal Storage"
        else -> device.name
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(GbSurface)
            .border(1.dp, GbBorder, RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(GbSurfaceLight)
                    .border(1.dp, GbBorder, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = deviceIcon,
                    contentDescription = null,
                    tint = GbAccent,
                    modifier = Modifier.size(17.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = safeDeviceName,
                    style = MaterialTheme.typography.titleMedium,
                    color = GbText,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                Text(
                    text = "${device.freeFormatted} free of ${device.totalFormatted}",
                    style = MaterialTheme.typography.bodySmall,
                    color = GbTextDim,
                    fontSize = 12.sp
                )
            }
        }

        if (device.totalBytes > 0) {
            LinearProgressIndicator(
                progress = { usedPct },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = GbAccent,
                trackColor = GbSurfaceLight
            )
        }
    }
}

/**
 * Minimalist Download Folder Card
 * Shows clean, human-friendly folder path with root storage indicator,
 * top-right reset icon button, and centered, equally-sized action buttons:
 * "Change Folder" and "Open Folder".
 */
@Composable
private fun DownloadFolderCard(
    locationDisplay: String,
    onChangeFolder: () -> Unit,
    onOpenFolder: () -> Unit,
    onResetDefault: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(GbSurface)
            .border(1.dp, GbBorder, RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(GbSurfaceLight)
                    .border(1.dp, GbBorder, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Folder,
                    contentDescription = null,
                    tint = GbAccent,
                    modifier = Modifier.size(19.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Save Location",
                    style = MaterialTheme.typography.titleMedium,
                    color = GbText,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                Text(
                    text = locationDisplay,
                    style = MaterialTheme.typography.bodySmall,
                    color = GbTextDim,
                    fontSize = 12.sp,
                    maxLines = 2
                )
            }

            // Top-right reset icon to revert to default download directory
            IconButton(
                onClick = onResetDefault,
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(GbSurfaceLight)
                    .border(1.dp, GbBorder, RoundedCornerShape(8.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.RestartAlt,
                    contentDescription = "Reset to default location",
                    tint = GbTextMuted,
                    modifier = Modifier.size(17.dp)
                )
            }
        }

        // Action buttons: Exactly same size and horizontally centered
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = onChangeFolder,
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = GbAccent,
                    contentColor = GbText
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = GbText
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Change Folder",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            OutlinedButton(
                onClick = onOpenFolder,
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = GbText
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, GbBorder),
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.FolderOpen,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = GbAccent
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Open Folder",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = GbText
                )
            }
        }
    }
}

@Composable
private fun SettingCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: (() -> Unit)?
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(GbSurface)
            .border(1.dp, GbBorder, RoundedCornerShape(12.dp))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(GbSurfaceLight)
                .border(1.dp, GbBorder, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = GbAccent,
                modifier = Modifier.size(17.dp)
            )
        }

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = GbText,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = GbTextDim,
                fontSize = 12.sp
            )
        }

        if (onClick != null) {
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = GbTextMuted,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun SettingToggleCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(GbSurface)
            .border(1.dp, GbBorder, RoundedCornerShape(12.dp))
            .clickable { onCheckedChange(!checked) }
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(GbSurfaceLight)
                .border(1.dp, GbBorder, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (checked) GbAccent else GbTextMuted,
                modifier = Modifier.size(17.dp)
            )
        }

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = GbText,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = GbTextDim,
                fontSize = 12.sp
            )
        }

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = GbText,
                checkedTrackColor = GbAccent,
                uncheckedThumbColor = GbTextDim,
                uncheckedTrackColor = GbSurfaceLight,
                uncheckedBorderColor = GbBorder
            )
        )
    }
}

@Composable
private fun OptionChoiceDialog(
    title: String,
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = GbSurface,
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = GbText
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                options.forEach { (optionKey, desc) ->
                    val isSelected = optionKey == selected
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) GbSurfaceLight else GbSurface)
                            .border(
                                1.dp,
                                if (isSelected) GbAccent else GbBorder,
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { onSelect(optionKey) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { onSelect(optionKey) },
                            colors = RadioButtonDefaults.colors(
                                selectedColor = GbAccent,
                                unselectedColor = GbTextMuted
                            )
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = optionKey,
                                style = MaterialTheme.typography.titleSmall,
                                color = if (isSelected) GbText else GbTextDim,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                            if (desc.isNotEmpty()) {
                                Text(
                                    text = desc,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = GbTextMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = GbTextDim)
            }
        }
    )
}

@Composable
fun AppUpdateCard(
    currentVersion: String,
    isChecking: Boolean,
    statusMessage: String?,
    onCheckUpdates: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = GbSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, GbBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(GbSurfaceLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.SystemUpdate,
                            contentDescription = "App Updates",
                            tint = GbAccent,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Auto-Updates",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = GbText
                        )
                        Text(
                            text = "Current: v$currentVersion (GitHub)",
                            style = MaterialTheme.typography.bodySmall,
                            color = GbTextDim,
                            fontSize = 11.sp
                        )
                    }
                }

                Button(
                    onClick = onCheckUpdates,
                    enabled = !isChecking,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = GbAccent,
                        disabledContainerColor = GbSurfaceLight
                    ),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    if (isChecking) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(14.dp),
                            color = GbTextDim,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "Check",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = GbText
                        )
                    }
                }
            }

            if (!statusMessage.isNullOrEmpty()) {
                Text(
                    text = statusMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = GbTextDim,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
fun UpdateAvailableDialog(
    updateInfo: com.grabbit.app.utils.UpdateInfo,
    isDownloading: Boolean,
    progress: Float,
    onUpdateNow: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isDownloading) onDismiss() },
        containerColor = GbSurface,
        titleContentColor = GbText,
        textContentColor = GbTextDim,
        shape = RoundedCornerShape(16.dp),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.SystemUpdate,
                    contentDescription = null,
                    tint = GbAccent,
                    modifier = Modifier.size(22.dp)
                )
                Text(
                    text = "Update Available",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = GbText
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Grabbit v${updateInfo.versionName} is ready to install.",
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    color = GbText
                )

                if (updateInfo.releaseNotes.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(GbSurfaceLight)
                            .border(1.dp, GbBorder, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Text(
                            text = updateInfo.releaseNotes,
                            style = MaterialTheme.typography.bodySmall,
                            color = GbTextDim,
                            fontSize = 12.sp,
                            maxLines = 6
                        )
                    }
                }

                if (isDownloading) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        LinearProgressIndicator(
                            progress = { if (progress >= 0f) progress else 0f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = GbAccent,
                            trackColor = GbBorder
                        )
                        Text(
                            text = if (progress >= 0f) "Downloading: ${(progress * 100).toInt()}%" else "Connecting...",
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = 11.sp,
                            color = GbTextMuted
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onUpdateNow,
                enabled = !isDownloading,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = GbAccent,
                    disabledContainerColor = GbSurfaceLight
                )
            ) {
                Text(
                    text = if (isDownloading) "Downloading..." else "Update Now",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = GbText
                )
            }
        },
        dismissButton = {
            if (!isDownloading) {
                TextButton(onClick = onDismiss) {
                    Text("Later", color = GbTextDim, fontSize = 13.sp)
                }
            }
        }
    )
}
