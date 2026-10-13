package com.grabbit.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DownloadDone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grabbit.app.data.model.DownloadStatus
import com.grabbit.app.ui.components.DownloadCard
import com.grabbit.app.ui.theme.*
import com.grabbit.app.viewmodel.MainViewModel

@Composable
fun DownloadsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val downloadTasks by viewModel.downloadTasks.collectAsState()
    val activeTasks = downloadTasks.filter { it.status != DownloadStatus.COMPLETED && it.status != DownloadStatus.CANCELLED }
    val completedTasks = downloadTasks.filter { it.status == DownloadStatus.COMPLETED }

    if (activeTasks.isEmpty() && completedTasks.isEmpty()) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(GbBg),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.DownloadDone,
                    contentDescription = null,
                    tint = GbTextMuted,
                    modifier = Modifier.size(44.dp)
                )
                Text(
                    text = "No downloads yet",
                    style = MaterialTheme.typography.titleMedium,
                    color = GbTextDim,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(GbBg)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
        ) {
            // In Progress / Active Downloads Section
            if (activeTasks.isNotEmpty()) {
                item {
                    Text(
                        text = "In Progress (${activeTasks.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = GbText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }

                items(activeTasks, key = { it.id }) { task ->
                    DownloadCard(
                        task = task,
                        onPauseResume = viewModel::togglePauseResume,
                        onCancel = viewModel::cancelTask,
                        onOpenFile = { taskId -> viewModel.openFile(context, taskId) },
                        onOpenFolder = { viewModel.openDownloadFolder(context) }
                    )
                }
            }

            // Completed Downloads Library Section
            if (completedTasks.isNotEmpty()) {
                item {
                    if (activeTasks.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(6.dp))
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Library (${completedTasks.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = GbText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        TextButton(
                            onClick = { viewModel.openDownloadFolder(context) },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Open Folder",
                                color = GbAccent,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                items(completedTasks, key = { it.id }) { task ->
                    DownloadCard(
                        task = task,
                        onPauseResume = viewModel::togglePauseResume,
                        onCancel = viewModel::cancelTask,
                        onOpenFile = { taskId -> viewModel.openFile(context, taskId) },
                        onOpenFolder = { viewModel.openDownloadFolder(context) }
                    )
                }
            }
        }
    }
}
