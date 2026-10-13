package com.grabbit.app.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

data class UpdateInfo(
    val tagName: String,
    val versionName: String,
    val releaseNotes: String,
    val downloadUrl: String,
    val apkSize: Long
)

object AppUpdateManager {

    private const val GITHUB_OWNER = "zubulika"
    private const val GITHUB_REPO = "Grabbit"
    private const val RELEASES_API_URL = "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/latest"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    /**
     * Checks GitHub Releases API for a newer version than currentVersion.
     * Returns UpdateInfo if an update exists, null if already on latest or no release found.
     */
    suspend fun checkForUpdate(currentVersion: String): Result<UpdateInfo?> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(RELEASES_API_URL)
                .header("User-Agent", "Grabbit-Android-App")
                .header("Accept", "application/vnd.github.v3+json")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    if (response.code == 404) {
                        // No releases published yet on GitHub
                        return@withContext Result.success(null)
                    }
                    return@withContext Result.failure(Exception("GitHub API returned error: ${response.code}"))
                }

                val body = response.body?.string() ?: return@withContext Result.success(null)
                val json = JSONObject(body)

                val tagName = json.optString("tag_name", "").trim()
                val latestVersion = tagName.removePrefix("v").removePrefix("V").trim()
                val releaseNotes = json.optString("body", "Bug fixes and performance improvements.").trim()

                if (latestVersion.isEmpty()) {
                    return@withContext Result.success(null)
                }

                // Check if latestVersion is newer than currentVersion
                if (!isVersionNewer(latestVersion, currentVersion)) {
                    return@withContext Result.success(null)
                }

                // Look for the APK asset
                val assets = json.optJSONArray("assets")
                var downloadUrl: String? = null
                var apkSize: Long = 0

                if (assets != null) {
                    for (i in 0 until assets.length()) {
                        val asset = assets.getJSONObject(i)
                        val name = asset.optString("name", "")
                        if (name.endsWith(".apk", ignoreCase = true)) {
                            downloadUrl = asset.optString("browser_download_url", "")
                            apkSize = asset.optLong("size", 0)
                            break
                        }
                    }
                }

                if (downloadUrl.isNullOrEmpty()) {
                    return@withContext Result.success(null)
                }

                Result.success(
                    UpdateInfo(
                        tagName = tagName,
                        versionName = latestVersion,
                        releaseNotes = releaseNotes,
                        downloadUrl = downloadUrl,
                        apkSize = apkSize
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Compares two semantic version strings (e.g., "1.0.1" vs "1.0.0").
     * Returns true if target is strictly newer than current.
     */
    fun isVersionNewer(target: String, current: String): Boolean {
        try {
            val targetClean = target.removePrefix("v").removePrefix("V").split("-")[0]
            val currentClean = current.removePrefix("v").removePrefix("V").split("-")[0]

            val targetParts = targetClean.split(".").map { it.toIntOrNull() ?: 0 }
            val currentParts = currentClean.split(".").map { it.toIntOrNull() ?: 0 }

            val maxLen = maxOf(targetParts.size, currentParts.size)
            for (i in 0 until maxLen) {
                val t = targetParts.getOrElse(i) { 0 }
                val c = currentParts.getOrElse(i) { 0 }
                if (t > c) return true
                if (t < c) return false
            }
            return false
        } catch (e: Exception) {
            return target != current
        }
    }

    /**
     * Downloads the APK file into app internal cache with progress callback.
     */
    suspend fun downloadApk(
        context: Context,
        downloadUrl: String,
        onProgress: (progress: Float, downloadedBytes: Long, totalBytes: Long) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            val updateDir = File(context.cacheDir, "updates")
            if (!updateDir.exists()) {
                updateDir.mkdirs()
            }

            val destinationFile = File(updateDir, "Grabbit-update.apk")
            if (destinationFile.exists()) {
                destinationFile.delete()
            }

            val request = Request.Builder()
                .url(downloadUrl)
                .header("User-Agent", "Grabbit-Android-App")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Failed to download APK: HTTP ${response.code}"))
                }

                val responseBody = response.body ?: return@withContext Result.failure(Exception("Empty download response body"))
                val totalBytes = responseBody.contentLength()

                responseBody.byteStream().use { input ->
                    FileOutputStream(destinationFile).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        var totalDownloaded: Long = 0

                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalDownloaded += bytesRead
                            val progress = if (totalBytes > 0) {
                                totalDownloaded.toFloat() / totalBytes.toFloat()
                            } else {
                                -1f
                            }
                            onProgress(progress, totalDownloaded, totalBytes)
                        }
                        output.flush()
                    }
                }
            }

            Result.success(destinationFile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Prompts the native Android package installer to update the app in-place.
     */
    fun installApk(context: Context, apkFile: File): Result<Unit> {
        return try {
            if (!apkFile.exists()) {
                return Result.failure(Exception("Downloaded update file does not exist"))
            }

            // On Android 8.0+ (Oreo), verify permission to install unknown apps
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    val manageIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = Uri.parse("package:${context.packageName}")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(manageIntent)
                    return Result.failure(Exception("Please grant permission to install updates from Grabbit, then tap Install again."))
                }
            }

            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }

            context.startActivity(installIntent)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
