package com.grabbit.app.data.extractor

import com.grabbit.app.data.model.FormatOption
import com.grabbit.app.data.model.MediaMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.regex.Pattern

object MediaExtractor {

    private val YOUTUBE_REGEX = Pattern.compile(
        "^.*(?:youtu.be\\/|v\\/|e\\/|u\\/\\w+\\/|embed\\/|v=|shorts\\/)([^#&?]*).*",
        Pattern.CASE_INSENSITIVE
    )

    private val DIRECT_MEDIA_EXTENSIONS = setOf(
        "mp4", "m4v", "mkv", "webm", "mov", "avi", "3gp",
        "mp3", "m4a", "wav", "aac", "ogg", "flac",
        "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif"
    )

    fun extractYouTubeId(url: String): String? {
        val trimmed = url.trim()
        val matcher = YOUTUBE_REGEX.matcher(trimmed)
        if (matcher.matches() && matcher.group(1)?.length == 11) {
            return matcher.group(1)
        }
        // Fallback split checks
        return when {
            trimmed.contains("youtu.be/") -> trimmed.substringAfter("youtu.be/").substringBefore("?").substringBefore("&").substringBefore("#")
            trimmed.contains("v=") -> trimmed.substringAfter("v=").substringBefore("&").substringBefore("#")
            trimmed.contains("shorts/") -> trimmed.substringAfter("shorts/").substringBefore("?").substringBefore("&").substringBefore("#")
            else -> null
        }?.takeIf { it.length == 11 }
    }

    suspend fun extractMediaInfo(rawUrl: String): MediaMetadata = withContext(Dispatchers.IO) {
        val trimmed = rawUrl.trim()
        if (trimmed.isBlank()) {
            throw IllegalArgumentException("Please enter a valid link or URL")
        }
        val trimmedUrl = if (!trimmed.startsWith("http://", ignoreCase = true) && !trimmed.startsWith("https://", ignoreCase = true)) {
            "https://$trimmed"
        } else {
            trimmed
        }

        // 1. Check YouTube / YouTube Music
        val videoId = extractYouTubeId(trimmedUrl)
        if (videoId != null) {
            return@withContext YouTubeStreamExtractor.extract(videoId, trimmedUrl)
        }

        // 2. Check direct media file extension in URL
        val cleanPath = trimmedUrl.substringBefore("?").substringBefore("#")
        val ext = cleanPath.substringAfterLast(".", "").lowercase(Locale.ROOT)
        if (ext in DIRECT_MEDIA_EXTENSIONS) {
            return@withContext extractDirectMediaInfo(trimmedUrl, ext)
        }

        // 3. Inspect headers for direct video/audio/image content
        try {
            val url = URL(trimmedUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "HEAD"
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
            connection.connectTimeout = 8000
            connection.readTimeout = 8000
            connection.instanceFollowRedirects = true

            val code = connection.responseCode
            val contentType = connection.contentType?.lowercase(Locale.ROOT) ?: ""
            val contentLength = connection.contentLengthLong

            connection.disconnect()

            if (code in 200..299) {
                if (contentType.startsWith("video/")) {
                    val formatExt = contentType.substringAfter("video/").substringBefore(";").take(4).ifEmpty { "mp4" }
                    return@withContext createDirectMetadata(
                        url = trimmedUrl,
                        isAudio = false,
                        ext = formatExt,
                        lengthBytes = contentLength
                    )
                } else if (contentType.startsWith("audio/")) {
                    val formatExt = contentType.substringAfter("audio/").substringBefore(";").take(4).ifEmpty { "mp3" }
                    return@withContext createDirectMetadata(
                        url = trimmedUrl,
                        isAudio = true,
                        ext = formatExt,
                        lengthBytes = contentLength
                    )
                } else if (contentType.startsWith("image/")) {
                    val formatExt = contentType.substringAfter("image/").substringBefore(";").take(4).ifEmpty { "jpg" }
                    return@withContext createDirectMetadata(
                        url = trimmedUrl,
                        isAudio = false,
                        ext = formatExt,
                        lengthBytes = contentLength
                    )
                }
            }
        } catch (e: Exception) {
            // Header inspection failed or unsupported
        }

        // 4. Fallback for social media pages (Instagram reels, TikTok, web pages) via OpenGraph inspection
        try {
            val url = URL(trimmedUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36")
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.instanceFollowRedirects = true

            val html = conn.inputStream.bufferedReader().use { reader ->
                val chars = CharArray(32768)
                val read = reader.read(chars)
                if (read > 0) String(chars, 0, read) else ""
            }
            conn.disconnect()

            val ogVideoRegex = Regex("<meta[^>]+property=[\"']og:video[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            val ogVideoSecureRegex = Regex("<meta[^>]+property=[\"']og:video:secure_url[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            val ogImageRegex = Regex("<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            val ogTitleRegex = Regex("<meta[^>]+property=[\"']og:title[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)

            val videoStream = ogVideoRegex.find(html)?.groupValues?.get(1)
                ?: ogVideoSecureRegex.find(html)?.groupValues?.get(1)
            val imageThumb = ogImageRegex.find(html)?.groupValues?.get(1)
            val pageTitle = ogTitleRegex.find(html)?.groupValues?.get(1) ?: URL(trimmedUrl).host

            if (!videoStream.isNullOrBlank()) {
                val format = FormatOption(
                    id = "reel_stream",
                    resolution = "Best Quality Stream",
                    extension = "mp4",
                    approxSize = "~25 MB",
                    isBest = true,
                    isAudioOnly = false,
                    directStreamUrl = videoStream
                )
                return@withContext MediaMetadata(
                    url = trimmedUrl,
                    title = pageTitle,
                    author = URL(trimmedUrl).host,
                    duration = "--:--",
                    thumbnailUrl = imageThumb ?: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
                    availableFormats = listOf(format)
                )
            } else if (!imageThumb.isNullOrBlank()) {
                val format = FormatOption(
                    id = "image_stream",
                    resolution = "Original Image",
                    extension = "jpg",
                    approxSize = "~5 MB",
                    isBest = true,
                    isAudioOnly = false,
                    directStreamUrl = imageThumb
                )
                return@withContext MediaMetadata(
                    url = trimmedUrl,
                    title = pageTitle,
                    author = URL(trimmedUrl).host,
                    duration = "",
                    thumbnailUrl = imageThumb,
                    availableFormats = listOf(format)
                )
            }
        } catch (e: Exception) {
            // OpenGraph inspection fallback failed
        }

        // 5. Final fallback
        throw IllegalArgumentException("No downloadable media found at this link. Please enter a valid URL.")
    }

    private fun extractDirectMediaInfo(directUrl: String, extension: String): MediaMetadata {
        val isAudio = extension in setOf("mp3", "m4a", "wav", "aac", "ogg", "flac")
        var contentLength = 0L

        try {
            val url = URL(directUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "HEAD"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000
            contentLength = conn.contentLengthLong
            conn.disconnect()
        } catch (e: Exception) {
            // Ignore error
        }

        return createDirectMetadata(directUrl, isAudio, extension, contentLength)
    }

    private fun createDirectMetadata(
        url: String,
        isAudio: Boolean,
        ext: String,
        lengthBytes: Long
    ): MediaMetadata {
        val cleanName = url.substringBefore("?").substringAfterLast("/").ifEmpty { "Media File" }
        val sizeStr = if (lengthBytes > 0) formatBytes(lengthBytes) else "~15 MB"
        val isImage = ext in setOf("jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif")

        val formatOption = FormatOption(
            id = "direct_stream",
            resolution = if (isImage) "Original Image (${ext.uppercase(Locale.ROOT)})" else if (isAudio) "Direct Audio Stream" else "Original Video Stream",
            extension = ext,
            approxSize = sizeStr,
            isBest = true,
            isAudioOnly = isAudio,
            directStreamUrl = url
        )

        return MediaMetadata(
            url = url,
            title = cleanName,
            author = URL(url).host,
            duration = if (isImage) "" else "--:--",
            thumbnailUrl = if (isImage) url else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
            availableFormats = listOf(formatOption)
        )
    }

    private fun formatBytes(bytes: Long): String {
        val mb = bytes / (1024.0 * 1024.0)
        return if (mb >= 1000.0) {
            String.format(Locale.US, "%.1f GB", mb / 1024.0)
        } else {
            String.format(Locale.US, "%.1f MB", mb)
        }
    }
}
