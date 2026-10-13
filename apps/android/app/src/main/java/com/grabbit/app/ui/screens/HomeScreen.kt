package com.grabbit.app.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grabbit.app.ui.components.FormatSelector
import com.grabbit.app.ui.components.UrlInputCard
import com.grabbit.app.ui.theme.*
import com.grabbit.app.viewmodel.MainViewModel

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onNavigateToDownloads: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val urlInput by viewModel.urlInput.collectAsState()
    val isLoading by viewModel.isLoadingMetadata.collectAsState()
    val metadata by viewModel.currentMetadata.collectAsState()
    val selectedMediaType by viewModel.selectedMediaType.collectAsState()
    val selectedFormat by viewModel.selectedFormat.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    // System back navigation: if viewing analyzed result, go back to clean input
    BackHandler(enabled = metadata != null) {
        viewModel.clearResult()
    }

    if (metadata == null) {
        // Clean Minimal Centered URL Input Layout
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(GbBg)
                .padding(horizontal = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-30).dp)
            ) {
                // Slogan
                Text(
                    text = buildAnnotatedString {
                        append("Grab Anything ")
                        withStyle(style = SpanStyle(color = GbAccent)) {
                            append("with a Link")
                        }
                    },
                    style = MaterialTheme.typography.headlineSmall,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                // Clean URL Input Card
                UrlInputCard(
                    url = urlInput,
                    onUrlChange = viewModel::onUrlChanged,
                    onFetchClicked = viewModel::fetchMetadata,
                    isLoading = isLoading,
                    errorMessage = errorMessage
                )
            }
        }
    } else {
        // Dedicated Result Screen (URL Input Field is completely removed)
        val meta = metadata!!
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(GbBg)
        ) {
            // Dedicated Top Bar with Back Arrow
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(GbBg)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    IconButton(
                        onClick = viewModel::clearResult,
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(GbSurface)
                            .border(1.dp, GbBorder, RoundedCornerShape(10.dp))
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back to URL Input",
                            tint = GbText,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        text = "Media Details",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = GbText,
                        fontSize = 18.sp
                    )
                }

                IconButton(
                    onClick = viewModel::clearResult,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(GbSurface)
                        .border(1.dp, GbBorder, RoundedCornerShape(10.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = GbTextDim,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Scrollable Content with Full Details
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 4.dp, bottom = 32.dp)
            ) {
                item {
                    FormatSelector(
                        metadata = meta,
                        selectedMediaType = selectedMediaType,
                        onMediaTypeChange = viewModel::onMediaTypeChanged,
                        selectedFormat = selectedFormat,
                        onFormatSelect = viewModel::onFormatSelected,
                        onStartDownload = {
                            viewModel.startDownload()
                            onNavigateToDownloads?.invoke()
                        }
                    )
                }
            }
        }
    }
}
