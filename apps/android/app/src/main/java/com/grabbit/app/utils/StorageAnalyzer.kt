package com.grabbit.app.utils

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.storage.StorageManager
import android.os.storage.StorageVolume
import android.provider.DocumentsContract
import android.widget.Toast
import androidx.core.content.FileProvider
import com.grabbit.app.data.model.StorageDevice
import com.grabbit.app.data.model.StorageType
import java.io.File
import java.net.URLDecoder
import java.util.Locale

object StorageAnalyzer {

    data class DeviceStorageStatus(
        val totalSpace: String,
        val freeSpace: String,
        val usedPercentage: Float,
        val storageRootName: String,
        val activeFolderDisplay: String,
        val absolutePath: String
    )

    fun getConnectedDevices(context: Context): List<StorageDevice> {
        val devices = mutableListOf<StorageDevice>()
        val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as? StorageManager

        if (storageManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val volumes = storageManager.storageVolumes
            for (volume in volumes) {
                val state = volume.state
                val isMounted = state == Environment.MEDIA_MOUNTED || state == Environment.MEDIA_MOUNTED_READ_ONLY
                val isRemovable = volume.isRemovable
                val isPrimary = volume.isPrimary

                val desc = volume.getDescription(context)
                val type = when {
                    !isRemovable && isPrimary -> StorageType.INTERNAL
                    desc.contains("USB", ignoreCase = true) || desc.contains("OTG", ignoreCase = true) -> StorageType.USB_OTG
                    else -> StorageType.SD_CARD
                }

                var totalBytes = 0L
                var freeBytes = 0L
                var rootPath: String? = null

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    volume.directory?.let { dir ->
                        rootPath = dir.absolutePath
                        try {
                            val stat = StatFs(dir.path)
                            totalBytes = stat.blockCountLong * stat.blockSizeLong
                            freeBytes = stat.availableBlocksLong * stat.blockSizeLong
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }

                if (totalBytes == 0L && isPrimary) {
                    val root = Environment.getExternalStorageDirectory()
                    rootPath = root.absolutePath
                    try {
                        val stat = StatFs(root.path)
                        totalBytes = stat.blockCountLong * stat.blockSizeLong
                        freeBytes = stat.availableBlocksLong * stat.blockSizeLong
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                val displayName = when {
                    isPrimary -> "Internal Storage"
                    type == StorageType.USB_OTG -> if (desc.isNotBlank()) desc else "USB OTG Storage"
                    else -> if (desc.isNotBlank()) desc else "SD Card Storage"
                }

                devices.add(
                    StorageDevice(
                        id = volume.uuid ?: "primary",
                        name = displayName,
                        type = type,
                        isRemovable = isRemovable,
                        isPrimary = isPrimary,
                        isMounted = isMounted,
                        totalBytes = totalBytes,
                        freeBytes = freeBytes,
                        totalFormatted = formatBytes(totalBytes),
                        freeFormatted = formatBytes(freeBytes),
                        rootPath = rootPath
                    )
                )
            }
        }

        // Fallback if no volumes returned
        if (devices.isEmpty()) {
            val root = Environment.getExternalStorageDirectory()
            var totalBytes = 0L
            var freeBytes = 0L
            try {
                val stat = StatFs(root.path)
                totalBytes = stat.blockCountLong * stat.blockSizeLong
                freeBytes = stat.availableBlocksLong * stat.blockSizeLong
            } catch (e: Exception) {}

            devices.add(
                StorageDevice(
                    id = "primary",
                    name = "Internal Storage",
                    type = StorageType.INTERNAL,
                    isRemovable = false,
                    isPrimary = true,
                    isMounted = true,
                    totalBytes = totalBytes,
                    freeBytes = freeBytes,
                    totalFormatted = formatBytes(totalBytes),
                    freeFormatted = formatBytes(freeBytes),
                    rootPath = root.absolutePath
                )
            )
        }

        return devices
    }

    fun getStorageStatus(
        context: Context,
        displayName: String,
        customPath: String? = null
    ): DeviceStorageStatus {
        val root = Environment.getExternalStorageDirectory()
        var totalFormatted = "Unknown"
        var freeFormatted = "Unknown"
        var usedPct = 0f

        val targetDir = resolveDirectory(context, customPath)
        val statTarget = if (targetDir.exists()) targetDir else root

        try {
            val stat = StatFs(statTarget.path)
            val blockSize = stat.blockSizeLong
            val totalBlocks = stat.blockCountLong
            val availableBlocks = stat.availableBlocksLong

            val totalBytes = totalBlocks * blockSize
            val freeBytes = availableBlocks * blockSize
            val usedBytes = totalBytes - freeBytes

            if (totalBytes > 0) {
                usedPct = (usedBytes.toFloat() / totalBytes.toFloat()).coerceIn(0f, 1f)
                totalFormatted = formatBytes(totalBytes)
                freeFormatted = formatBytes(freeBytes)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return DeviceStorageStatus(
            totalSpace = totalFormatted,
            freeSpace = freeFormatted,
            usedPercentage = usedPct,
            storageRootName = if (customPath != null) "Custom Destination" else "Phone Internal Storage",
            activeFolderDisplay = displayName,
            absolutePath = targetDir.absolutePath
        )
    }

    fun resolveDirectory(context: Context, customPath: String?): File {
        if (!customPath.isNullOrBlank()) {
            try {
                val dir = File(customPath)
                if (!dir.exists()) dir.mkdirs()
                if (dir.canWrite()) return dir
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Default: Downloads/Grabbit
        return try {
            val defaultDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Grabbit")
            if (!defaultDir.exists()) defaultDir.mkdirs()
            defaultDir
        } catch (e: Exception) {
            context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.filesDir
        }
    }

    fun parseHumanReadablePathFromUri(context: Context, treeUri: Uri): Pair<String, String?> {
        val docId = try {
            DocumentsContract.getTreeDocumentId(treeUri)
        } catch (e: Exception) {
            treeUri.lastPathSegment ?: "Custom Folder"
        }

        val decoded = try {
            URLDecoder.decode(docId, "UTF-8")
        } catch (e: Exception) {
            docId
        }

        var relativePath = ""
        var volumeId = "primary"

        if (decoded.contains(":")) {
            val parts = decoded.split(":", limit = 2)
            volumeId = parts.getOrNull(0) ?: "primary"
            relativePath = parts.getOrNull(1) ?: ""
        } else {
            relativePath = decoded
        }

        // Clean any raw emulated paths
        if (relativePath.contains("/storage/emulated/0", ignoreCase = true) || relativePath.contains("storage/emulated/0", ignoreCase = true)) {
            relativePath = relativePath
                .replace("/storage/emulated/0/", "", ignoreCase = true)
                .replace("/storage/emulated/0", "", ignoreCase = true)
                .replace("storage/emulated/0/", "", ignoreCase = true)
                .replace("storage/emulated/0", "", ignoreCase = true)
        } else if (relativePath.contains("/storage/emulated", ignoreCase = true) || relativePath.contains("storage/emulated", ignoreCase = true)) {
            relativePath = relativePath
                .replace("/storage/emulated/", "", ignoreCase = true)
                .replace("/storage/emulated", "", ignoreCase = true)
                .replace("storage/emulated/", "", ignoreCase = true)
                .replace("storage/emulated", "", ignoreCase = true)
        }

        val isPrimary = volumeId.equals("primary", ignoreCase = true) || volumeId.contains("emulated", ignoreCase = true)
        val driveLabel = if (isPrimary) {
            "Internal Storage"
        } else {
            val matchedDevice = getConnectedDevices(context).find {
                it.id.equals(volumeId, ignoreCase = true) || (it.rootPath != null && it.rootPath.contains(volumeId, ignoreCase = true))
            }
            matchedDevice?.name ?: "SD Card"
        }

        val cleanRelative = relativePath.trim('/').replace("/", " > ").replace("\\", " > ").trim()
        val display = if (cleanRelative.isNotBlank()) "$driveLabel > $cleanRelative" else driveLabel

        val physicalPath = if (isPrimary) {
            val root = Environment.getExternalStorageDirectory().absolutePath
            val cleanRel = relativePath.trim('/')
            if (cleanRel.isNotBlank()) "$root/$cleanRel" else root
        } else {
            val cleanRel = relativePath.trim('/')
            "/storage/$volumeId/$cleanRel".trimEnd('/')
        }

        return Pair(display, physicalPath)
    }

    /**
     * Directly opens and ENTERS the exact last directory (not the directory one step before)
     */
    fun openFolderInFileManager(context: Context, folder: File, customUri: Uri? = null) {
        if (!folder.exists()) {
            folder.mkdirs()
        }

        // Strategy 1: If a SAF Uri was chosen, open directly using DocumentsContract tree/document URI
        if (customUri != null) {
            try {
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(customUri, DocumentsContract.Document.MIME_TYPE_DIR)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                return
            } catch (e: Exception) {}

            try {
                val docId = DocumentsContract.getTreeDocumentId(customUri)
                val directDocUri = DocumentsContract.buildDocumentUriUsingTree(customUri, docId)
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(directDocUri, DocumentsContract.Document.MIME_TYPE_DIR)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                return
            } catch (e: Exception) {}
        }

        // Strategy 2: Open exact folder via DocumentsContract document URI (enters folder directly)
        try {
            val relPath = if (folder.absolutePath.contains("/storage/emulated/0/")) {
                folder.absolutePath.substringAfter("/storage/emulated/0/").trim('/')
            } else {
                "Download/Grabbit"
            }
            val exactDocUri = DocumentsContract.buildDocumentUri(
                "com.android.externalstorage.documents",
                "primary:$relPath"
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(exactDocUri, DocumentsContract.Document.MIME_TYPE_DIR)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            return
        } catch (e: Exception) {}

        // Strategy 3: Open exact folder in Android DocumentsUI tree
        try {
            val relPath = if (folder.absolutePath.contains("/storage/emulated/0/")) {
                folder.absolutePath.substringAfter("/storage/emulated/0/").trim('/')
            } else {
                "Download/Grabbit"
            }
            val exactTreeUri = DocumentsContract.buildTreeDocumentUri(
                "com.android.externalstorage.documents",
                "primary:$relPath"
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(exactTreeUri, DocumentsContract.Document.MIME_TYPE_DIR)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            return
        } catch (e: Exception) {}

        // Strategy 4: FileProvider with standard directory MIME type
        try {
            val uri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                folder
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, DocumentsContract.Document.MIME_TYPE_DIR)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(Intent.createChooser(intent, "Open Folder").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
            return
        } catch (e: Exception) {}

        // Strategy 5: Resource/folder or generic view
        try {
            val uri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                folder
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "*/*")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(Intent.createChooser(intent, "Open Folder").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
            return
        } catch (e: Exception) {}

        Toast.makeText(context, folder.absolutePath, Toast.LENGTH_SHORT).show()
    }

    fun formatBytes(bytes: Long): String {
        if (bytes <= 0) return "0 MB"
        val gb = bytes / (1024.0 * 1024.0 * 1024.0)
        return if (gb >= 1.0) {
            String.format(Locale.US, "%.1f GB", gb)
        } else {
            val mb = bytes / (1024.0 * 1024.0)
            String.format(Locale.US, "%.0f MB", mb)
        }
    }
}
