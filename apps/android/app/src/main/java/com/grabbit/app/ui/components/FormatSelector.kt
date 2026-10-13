package com.grabbit.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Audiotrack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.grabbit.app.data.model.FormatOption
import com.grabbit.app.data.model.MediaMetadata
import com.grabbit.app.data.model.MediaType
import com.grabbit.app.ui.theme.*

@Composable
fun FormatSelector(
    metadata: MediaMetadata,
    selectedMediaType: MediaType,
    onMediaTypeChange: (MediaType) -> Unit,
    selectedFormat: FormatOption?,
    onFormatSelect: (FormatOption) -> Unit,
    onStartDownload: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(GbSurface)
            .border(1.dp, GbBorder, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Media Preview (Thumbnail + Info)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(width = 110.dp, height = 72.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(GbSurfaceLight)
            ) {
                AsyncImage(
                    model = metadata.thumbnailUrl,
                    contentDescription = metadata.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                // Duration Badge
                if (metadata.duration.isNotBlank()) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(4.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(GbBg.copy(alpha = 0.85f))
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = metadata.duration,
                            style = MaterialTheme.typography.bodySmall,
                            color = GbText,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = metadata.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = GbText,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = metadata.author,
                    style = MaterialTheme.typography.bodyMedium,
                    color = GbTextDim,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        HorizontalDivider(color = GbBorder)

        // Segmented Control: Video vs Audio
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(GbSurfaceLight)
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            SegmentButton(
                title = "Video (MP4/MKV)",
                icon = Icons.Default.Videocam,
                isSelected = selectedMediaType == MediaType.VIDEO,
                onClick = { onMediaTypeChange(MediaType.VIDEO) },
                modifier = Modifier.weight(1f)
            )
            SegmentButton(
                title = "Audio (MP3)",
                icon = Icons.Default.Audiotrack,
                isSelected = selectedMediaType == MediaType.AUDIO,
                onClick = { onMediaTypeChange(MediaType.AUDIO) },
                modifier = Modifier.weight(1f)
            )
        }

        // Quality Pills
        Text(
            text = "Select Quality / Stream",
            style = MaterialTheme.typography.labelLarge,
            color = GbTextDim
        )

        val filteredFormats = metadata.availableFormats.filter {
            if (selectedMediaType == MediaType.VIDEO) !it.isAudioOnly else it.isAudioOnly
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(filteredFormats) { format ->
                val isSelected = selectedFormat?.id == format.id
                FormatChip(
                    format = format,
                    isSelected = isSelected,
                    onClick = { onFormatSelect(format) }
                )
            }
        }

        // Download Action Button
        Button(
            onClick = onStartDownload,
            enabled = selectedFormat != null,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = GbAccent,
                contentColor = GbText
            )
        ) {
            Icon(
                imageVector = Icons.Default.Download,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Download ${selectedFormat?.resolution ?: ""}",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }
    }
}

@Composable
private fun SegmentButton(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) GbAccent else GbSurfaceLight)
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) GbText else GbTextMuted,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = if (isSelected) GbText else GbTextDim,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}

@Composable
private fun FormatChip(
    format: FormatOption,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) GbAccentSoft else GbSurfaceLight)
            .border(
                1.dp,
                if (isSelected) GbAccent else GbBorder,
                RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = format.resolution,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) GbAccent else GbText
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${format.extension.uppercase()} • ${format.approxSize}",
                style = MaterialTheme.typography.bodySmall,
                color = GbTextDim
            )
        }
    }
}
