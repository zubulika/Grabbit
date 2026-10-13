package com.grabbit.app.data.model

data class AppSettings(
    val downloadLocationName: String = "Internal Storage > Downloads > Grabbit",
    val customDownloadUri: String? = null,
    val customDownloadPath: String? = null,
    val preferredVideoQuality: String = "Best Available (1080p)",
    val preferredAudioQuality: String = "320 kbps (High Quality MP3)",
    val maxConcurrentDownloads: Int = 3,
    val wifiOnly: Boolean = false,
    val notifyOnCompletion: Boolean = true,
    val autoPasteLink: Boolean = true
)
