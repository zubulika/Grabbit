package com.grabbit.app.data.model

enum class MediaType {
    VIDEO,
    AUDIO
}

enum class DownloadStatus {
    IDLE,
    FETCHING_INFO,
    QUEUED,
    DOWNLOADING,
    PROCESSING,
    COMPLETED,
    ERROR,
    PAUSED,
    CANCELLED
}

data class FormatOption(
    val id: String,
    val resolution: String, // e.g. "1080p", "720p", "360p", "320kbps"
    val extension: String,  // e.g. "mp4", "mp3", "m4a"
    val approxSize: String, // e.g. "45 MB"
    val isBest: Boolean = false,
    val isAudioOnly: Boolean = false,
    val directStreamUrl: String? = null
)

data class MediaMetadata(
    val url: String,
    val title: String,
    val author: String,
    val duration: String,
    val thumbnailUrl: String,
    val availableFormats: List<FormatOption> = emptyList()
)

data class DownloadTask(
    val id: String,
    val url: String,
    val title: String,
    val author: String,
    val thumbnailUrl: String,
    val format: FormatOption,
    val status: DownloadStatus = DownloadStatus.QUEUED,
    val progress: Float = 0f, // 0.0 to 1.0
    val speed: String = "0 MB/s",
    val eta: String = "--:--",
    val downloadedBytes: Long = 0L,
    val totalBytes: Long = 0L,
    val filePath: String? = null,
    val errorMessage: String? = null
)
