package com.grabbit.app.data.extractor

import com.grabbit.app.data.model.FormatOption
import com.grabbit.app.data.model.MediaMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.Locale
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

object YouTubeStreamExtractor {

    private const val INNERTUBE_API_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
    private val VISITOR_DATA_REGEX = Pattern.compile("\"VISITOR_DATA\"\\s*:\\s*\"([^\"]+)\"")

    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .followRedirects(true)
            .build()
    }

    private val watchHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .followRedirects(true)
            .build()
    }

    suspend fun extract(videoId: String, originalUrl: String): MediaMetadata = withContext(Dispatchers.IO) {
        var visitorData = ""
        val cookieBuilder = StringBuilder()

        // Step 1: Pre-fetch embed page to extract VISITOR_DATA token and session cookies
        try {
            val embedRequest = Request.Builder()
                .url("https://www.youtube.com/embed/$videoId")
                .header(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
                )
                .header("Accept-Language", "en-US,en;q=0.9")
                .build()

            val embedResponse = watchHttpClient.newCall(embedRequest).execute()
            android.util.Log.d("Grabbit", "Embed response code: ${embedResponse.code}")
            val setCookies = embedResponse.headers("Set-Cookie")
            for (cookie in setCookies) {
                val clean = cookie.substringBefore(";").trim()
                if (clean.isNotEmpty()) {
                    if (cookieBuilder.isNotEmpty()) cookieBuilder.append("; ")
                    cookieBuilder.append(clean)
                }
            }

            val html = embedResponse.body?.string() ?: ""
            android.util.Log.d("Grabbit", "Embed HTML length: ${html.length}")
            val idx = html.indexOf("\"VISITOR_DATA\":\"")
            if (idx > -1) {
                val sub = html.substring(idx + 16)
                val endQuote = sub.indexOf('"')
                if (endQuote > 0) {
                    visitorData = sub.substring(0, endQuote)
                }
            }
            if (visitorData.isBlank()) {
                val matcher = VISITOR_DATA_REGEX.matcher(html)
                if (matcher.find()) {
                    visitorData = matcher.group(1) ?: ""
                }
            }
            android.util.Log.d("Grabbit", "Found visitorData: ${visitorData.take(30)}... (length: ${visitorData.length})")
        } catch (e: Exception) {
            android.util.Log.e("Grabbit", "Embed fetch failed", e)
            e.printStackTrace()
        }

        // Step 2: Query InnerTube API using official ANDROID client (unthrottled, token-resilient)
        val jsonPayload = JSONObject().apply {
            put("videoId", videoId)
            put(
                "context",
                JSONObject().apply {
                    put(
                        "client",
                        JSONObject().apply {
                            put("clientName", "ANDROID")
                            put("clientVersion", "20.10.38")
                            put("androidSdkVersion", 30)
                            put("osName", "Android")
                            put("osVersion", "11")
                            put("hl", "en")
                            put("gl", "US")
                            if (visitorData.isNotBlank()) {
                                put("visitorData", visitorData)
                            }
                        }
                    )
                }
            )
            put("contentCheckOk", true)
            put("racyCheckOk", true)
        }

        val requestBody = jsonPayload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

        val postBuilder = Request.Builder()
            .url(INNERTUBE_API_URL)
            .post(requestBody)
            .header(
                "User-Agent",
                "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip"
            )
            .header("X-YouTube-Client-Name", "3")
            .header("X-YouTube-Client-Version", "20.10.38")
            .header("Origin", "https://www.youtube.com")

        if (visitorData.isNotBlank()) {
            postBuilder.header("X-Goog-Visitor-Id", visitorData)
        }
        if (cookieBuilder.isNotEmpty()) {
            postBuilder.header("Cookie", cookieBuilder.toString())
        }

        val response = httpClient.newCall(postBuilder.build()).execute()
        val responseBody = response.body?.string() ?: throw IllegalStateException("Empty response from YouTube")
        android.util.Log.d("Grabbit", "Player response code: ${response.code}, body length: ${responseBody.length}")
        val json = JSONObject(responseBody)

        // Check Playability Status
        val playabilityStatus = json.optJSONObject("playabilityStatus")
        val status = playabilityStatus?.optString("status") ?: "ERROR"
        android.util.Log.d("Grabbit", "Player status: $status, reason: ${playabilityStatus?.optString("reason")}")
        if (status != "OK") {
            val reason = playabilityStatus?.optString("reason")
                ?: "This video cannot be streamed or downloaded (Status: $status)."
            throw IllegalArgumentException(reason)
        }

        val videoDetails = json.optJSONObject("videoDetails")
            ?: throw IllegalArgumentException("Failed to read video details.")

        val title = videoDetails.optString("title", "YouTube Video")
        val author = videoDetails.optString("author", "YouTube Channel")
        val lengthSeconds = videoDetails.optLong("lengthSeconds", 0L)
        val durationFormatted = formatDuration(lengthSeconds)

        var thumbnailUrl = "https://i.ytimg.com/vi/$videoId/hqdefault.jpg"
        val thumbnailsArray = videoDetails.optJSONObject("thumbnail")?.optJSONArray("thumbnails")
        if (thumbnailsArray != null && thumbnailsArray.length() > 0) {
            val bestThumb = thumbnailsArray.getJSONObject(thumbnailsArray.length() - 1)
            thumbnailUrl = bestThumb.optString("url", thumbnailUrl)
        }

        val streamingData = json.optJSONObject("streamingData")
            ?: throw IllegalArgumentException("No playable streaming streams found for this video.")

        val formatOptions = mutableListOf<FormatOption>()

        // 1. Progressive streams (Video + Audio combined in single playable file)
        val formatsArray = streamingData.optJSONArray("formats")
        var bestProgStreamUrl: String? = null

        if (formatsArray != null) {
            for (i in 0 until formatsArray.length()) {
                val f = formatsArray.getJSONObject(i)
                val streamUrl = f.optString("url")
                if (streamUrl.isNotBlank()) {
                    if (bestProgStreamUrl == null) bestProgStreamUrl = streamUrl

                    val qualityLabel = f.optString("qualityLabel", "360p")
                    val itag = f.optInt("itag", 18)
                    val mimeType = f.optString("mimeType", "video/mp4")
                    val ext = if (mimeType.contains("webm")) "webm" else "mp4"
                    val contentLength = f.optLong("contentLength", 0L)
                    val sizeStr = if (contentLength > 0) formatBytes(contentLength) else calculateEstimatedSize(lengthSeconds, 600_000)

                    formatOptions.add(
                        FormatOption(
                            id = "yt_prog_$itag",
                            resolution = "$qualityLabel Standard (Video+Audio)",
                            extension = ext,
                            approxSize = sizeStr,
                            isBest = (itag == 18 || i == 0),
                            isAudioOnly = false,
                            directStreamUrl = streamUrl
                        )
                    )
                }
            }
        }

        // 2. Adaptive Audio Streams
        val adaptiveArray = streamingData.optJSONArray("adaptiveFormats")
        if (adaptiveArray != null) {
            for (i in 0 until adaptiveArray.length()) {
                val f = adaptiveArray.getJSONObject(i)
                val streamUrl = f.optString("url")
                val mimeType = f.optString("mimeType", "")
                if (streamUrl.isNotBlank() && mimeType.startsWith("audio/")) {
                    val itag = f.optInt("itag")
                    val contentLength = f.optLong("contentLength", 0L)
                    val bitrate = f.optLong("bitrate", 128000L)
                    val sizeStr = if (contentLength > 0) formatBytes(contentLength) else calculateEstimatedSize(lengthSeconds, bitrate)

                    val isM4a = mimeType.contains("mp4")
                    val ext = if (isM4a) "m4a" else "webm"
                    val label = if (isM4a) "HQ Audio (128 kbps M4A)" else "Standard Audio (${bitrate / 1000} kbps)"

                    formatOptions.add(
                        FormatOption(
                            id = "yt_audio_$itag",
                            resolution = label,
                            extension = ext,
                            approxSize = sizeStr,
                            isBest = isM4a,
                            isAudioOnly = true,
                            directStreamUrl = streamUrl
                        )
                    )
                }
            }
        }

        // 3. Progressive stream as Audio option fallback
        if (formatOptions.none { it.isAudioOnly } && bestProgStreamUrl != null) {
            formatOptions.add(
                FormatOption(
                    id = "yt_audio_extracted",
                    resolution = "Audio (Standard AAC)",
                    extension = "m4a",
                    approxSize = calculateEstimatedSize(lengthSeconds, 128_000),
                    isBest = true,
                    isAudioOnly = true,
                    directStreamUrl = bestProgStreamUrl
                )
            )
        }

        if (formatOptions.isEmpty()) {
            throw IllegalArgumentException("No playable streams were found for this video.")
        }

        MediaMetadata(
            url = originalUrl,
            title = title,
            author = author,
            duration = durationFormatted,
            thumbnailUrl = thumbnailUrl,
            availableFormats = formatOptions
        )
    }

    private fun formatDuration(seconds: Long): String {
        if (seconds <= 0) return "--:--"
        val m = seconds / 60
        val s = seconds % 60
        val h = m / 60
        val remM = m % 60
        return if (h > 0) {
            String.format(Locale.US, "%d:%02d:%02d", h, remM, s)
        } else {
            String.format(Locale.US, "%02d:%02d", m, s)
        }
    }

    private fun formatBytes(bytes: Long): String {
        val mb = bytes / (1024.0 * 1024.0)
        return if (mb >= 1000.0) {
            String.format(Locale.US, "%.1f GB", mb / 1024.0)
        } else {
            String.format(Locale.US, "%.1f MB", mb)
        }
    }

    private fun calculateEstimatedSize(seconds: Long, bitrate: Long): String {
        if (seconds <= 0) return "~25 MB"
        val totalBits = seconds * bitrate
        val totalBytes = totalBits / 8
        return formatBytes(totalBytes)
    }
}

