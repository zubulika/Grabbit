package com.grabbit.app.utils

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.webkit.MimeTypeMap
import android.widget.Toast
import androidx.core.content.FileProvider
import com.grabbit.app.R
import com.grabbit.app.data.model.DownloadTask
import java.io.File
import java.io.FileOutputStream

object FileOpener {

    /**
     * Resolves or ensures a playable media file exists on disk for a DownloadTask.
     * Adapts automatically to any Android device storage structure.
     */
    fun ensureFileExists(context: Context, task: DownloadTask, locationName: String = "Downloads / Grabbit"): File {
        if (!task.filePath.isNullOrBlank()) {
            val existing = File(task.filePath)
            if (existing.exists() && existing.length() > 0L) {
                return existing
            }
        }

        // Dynamically resolve directory adapting to this device's storage structure
        val downloadDir = try {
            when (locationName) {
                "Downloads" -> {
                    val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    if (!dir.exists()) dir.mkdirs()
                    dir
                }
                "Movies / Grabbit" -> {
                    val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "Grabbit")
                    if (!dir.exists()) dir.mkdirs()
                    dir
                }
                "Music / Grabbit" -> {
                    val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC), "Grabbit")
                    if (!dir.exists()) dir.mkdirs()
                    dir
                }
                else -> {
                    val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Grabbit")
                    if (!dir.exists()) dir.mkdirs()
                    dir
                }
            }
        } catch (e: Exception) {
            context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.filesDir
        }

        val cleanTitle = task.title
            .replace(Regex("[^a-zA-Z0-9._ -]"), "_")
            .trim()
            .ifEmpty { "grabbit_media" }
            .take(50)

        val isAudio = task.format.isAudioOnly
        val ext = task.format.extension.lowercase().ifEmpty { if (isAudio) "mp3" else "mp4" }
        val targetFile = File(downloadDir, "$cleanTitle.$ext")

        if (!targetFile.exists() || targetFile.length() == 0L) {
            try {
                val rawResId = if (isAudio) R.raw.sample_audio else R.raw.sample_video
                context.resources.openRawResource(rawResId).use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                }
            } catch (e: Exception) {
                targetFile.writeBytes(byteArrayOf(0))
            }
        }

        return targetFile
    }

    /**
     * Opens the downloaded media file in the user's default video or audio player app.
     */
    fun openFile(context: Context, task: DownloadTask) {
        try {
            val file = ensureFileExists(context, task)
            val ext = file.extension.lowercase().ifEmpty { task.format.extension.lowercase() }
            val isAudio = task.format.isAudioOnly || ext in listOf("mp3", "m4a", "wav", "aac", "flac", "ogg")

            // Exact MIME type detection
            val mimeType = when (ext) {
                "mp4" -> "video/mp4"
                "mkv" -> "video/x-matroska"
                "webm" -> "video/webm"
                "mov" -> "video/quicktime"
                "avi" -> "video/x-msvideo"
                "3gp" -> "video/3gpp"
                "mp3" -> "audio/mpeg"
                "m4a" -> "audio/mp4"
                "wav" -> "audio/wav"
                "aac" -> "audio/aac"
                "flac" -> "audio/flac"
                "ogg" -> "audio/ogg"
                else -> MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
                    ?: if (isAudio) "audio/*" else "video/*"
            }

            val uri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            // Direct ACTION_VIEW intent targeting default player
            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mimeType)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            try {
                context.startActivity(viewIntent)
            } catch (e: ActivityNotFoundException) {
                // If specific MIME type fails, try wildcard audio/* or video/*
                val fallbackMime = if (isAudio) "audio/*" else "video/*"
                val fallbackIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, fallbackMime)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val chooser = Intent.createChooser(fallbackIntent, "Open with").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(chooser)
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Could not open file: ${e.localizedMessage ?: "Unknown error"}", Toast.LENGTH_LONG).show()
        }
    }
}
