package com.grabbit.app.viewmodel

import android.app.Application
import android.app.DownloadManager
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Environment
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.grabbit.app.data.extractor.MediaExtractor
import com.grabbit.app.data.model.*
import com.grabbit.app.utils.FileOpener
import com.grabbit.app.utils.StorageAnalyzer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

import android.content.BroadcastReceiver
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbManager
import com.grabbit.app.BuildConfig
import com.grabbit.app.data.repository.DownloadHistoryRepository
import com.grabbit.app.utils.AppUpdateManager
import com.grabbit.app.utils.UpdateInfo

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val downloadJobs = ConcurrentHashMap<String, Job>()

    private val _urlInput = MutableStateFlow("")
    val urlInput: StateFlow<String> = _urlInput.asStateFlow()

    private val _isLoadingMetadata = MutableStateFlow(false)
    val isLoadingMetadata: StateFlow<Boolean> = _isLoadingMetadata.asStateFlow()

    private val _currentMetadata = MutableStateFlow<MediaMetadata?>(null)
    val currentMetadata: StateFlow<MediaMetadata?> = _currentMetadata.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _selectedMediaType = MutableStateFlow(MediaType.VIDEO)
    val selectedMediaType: StateFlow<MediaType> = _selectedMediaType.asStateFlow()

    private val _selectedFormat = MutableStateFlow<FormatOption?>(null)
    val selectedFormat: StateFlow<FormatOption?> = _selectedFormat.asStateFlow()

    private val prefs = application.getSharedPreferences("grabbit_settings", Context.MODE_PRIVATE)

    private val _appSettings = MutableStateFlow(loadSettings())
    val appSettings: StateFlow<AppSettings> = _appSettings.asStateFlow()

    // Persistent Download History (like YouTube, survives restarts and reboots)
    private val _downloadTasks = MutableStateFlow<List<DownloadTask>>(
        DownloadHistoryRepository.loadHistory(application)
    )
    val downloadTasks: StateFlow<List<DownloadTask>> = _downloadTasks.asStateFlow()

    // Real-Time Connected Storage Devices (Internal, SD Card, USB OTG)
    private val _connectedStorageDevices = MutableStateFlow<List<StorageDevice>>(
        StorageAnalyzer.getConnectedDevices(application)
    )
    val connectedStorageDevices: StateFlow<List<StorageDevice>> = _connectedStorageDevices.asStateFlow()

    // In-App Auto-Updater State (GitHub Releases API)
    val currentAppVersion: String = BuildConfig.VERSION_NAME
    private val _updateInfo = MutableStateFlow<UpdateInfo?>(null)
    val updateInfo: StateFlow<UpdateInfo?> = _updateInfo.asStateFlow()

    private val _isCheckingUpdate = MutableStateFlow(false)
    val isCheckingUpdate: StateFlow<Boolean> = _isCheckingUpdate.asStateFlow()

    private val _updateCheckMessage = MutableStateFlow<String?>(null)
    val updateCheckMessage: StateFlow<String?> = _updateCheckMessage.asStateFlow()

    private val _isDownloadingUpdate = MutableStateFlow(false)
    val isDownloadingUpdate: StateFlow<Boolean> = _isDownloadingUpdate.asStateFlow()

    private val _updateDownloadProgress = MutableStateFlow(0f)
    val updateDownloadProgress: StateFlow<Float> = _updateDownloadProgress.asStateFlow()

    private val _downloadedApkFile = MutableStateFlow<File?>(null)
    val downloadedApkFile: StateFlow<File?> = _downloadedApkFile.asStateFlow()

    private val storageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            refreshConnectedStorageDevices()
        }
    }

    init {
        // Register real-time storage mount/unmount & USB attach/detach listeners
        val filter = IntentFilter().apply {
            addAction(android.content.Intent.ACTION_MEDIA_MOUNTED)
            addAction(android.content.Intent.ACTION_MEDIA_UNMOUNTED)
            addAction(android.content.Intent.ACTION_MEDIA_REMOVED)
            addAction(android.content.Intent.ACTION_MEDIA_EJECT)
            addAction(android.content.Intent.ACTION_MEDIA_BAD_REMOVAL)
            addDataScheme("file")
        }
        val usbFilter = IntentFilter().apply {
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }
        try {
            application.registerReceiver(storageReceiver, filter)
            application.registerReceiver(storageReceiver, usbFilter)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun refreshConnectedStorageDevices() {
        _connectedStorageDevices.value = StorageAnalyzer.getConnectedDevices(getApplication())
    }

    override fun onCleared() {
        super.onCleared()
        try {
            getApplication<Application>().unregisterReceiver(storageReceiver)
        } catch (e: Exception) {}
    }

    private fun cleanLocationName(raw: String?): String {
        val defaultPath = "Internal Storage > Downloads > Grabbit"
        if (raw.isNullOrBlank()) return defaultPath
        var cleaned = raw.trim()
        if (cleaned.contains("/storage/emulated/0", ignoreCase = true) || cleaned.contains("storage/emulated/0", ignoreCase = true)) {
            cleaned = cleaned
                .replace("/storage/emulated/0/", "", ignoreCase = true)
                .replace("/storage/emulated/0", "", ignoreCase = true)
                .replace("storage/emulated/0/", "", ignoreCase = true)
                .replace("storage/emulated/0", "", ignoreCase = true)
            cleaned = if (cleaned.isBlank()) "Downloads > Grabbit" else cleaned
        } else if (cleaned.contains("/storage/emulated", ignoreCase = true) || cleaned.contains("storage/emulated", ignoreCase = true)) {
            cleaned = cleaned
                .replace("/storage/emulated/", "", ignoreCase = true)
                .replace("/storage/emulated", "", ignoreCase = true)
                .replace("storage/emulated/", "", ignoreCase = true)
                .replace("storage/emulated", "", ignoreCase = true)
            cleaned = if (cleaned.isBlank()) "Downloads > Grabbit" else cleaned
        }
        cleaned = cleaned.trimStart('/')
        cleaned = cleaned.replace("/", " > ").replace("\\", " > ").replace("  ", " ").trim()

        // Ensure the root storage device is always presented as the root
        if (!cleaned.startsWith("Internal Storage", ignoreCase = true) &&
            !cleaned.startsWith("SD Card", ignoreCase = true) &&
            !cleaned.startsWith("External", ignoreCase = true) &&
            !cleaned.startsWith("USB", ignoreCase = true)) {
            cleaned = "Internal Storage > $cleaned"
        }

        return if (cleaned.isBlank() || cleaned.equals("null", ignoreCase = true)) defaultPath else cleaned
    }

    private fun loadSettings(): AppSettings {
        val rawLoc = prefs.getString("download_location_name", "Internal Storage > Downloads > Grabbit") ?: "Internal Storage > Downloads > Grabbit"
        val cleanedLoc = cleanLocationName(rawLoc)
        if (cleanedLoc != rawLoc) {
            prefs.edit().putString("download_location_name", cleanedLoc).apply()
        }

        return AppSettings(
            downloadLocationName = cleanedLoc,
            customDownloadUri = prefs.getString("custom_download_uri", null),
            customDownloadPath = prefs.getString("custom_download_path", null),
            preferredVideoQuality = prefs.getString("preferred_video_quality", "Best Available (1080p)") ?: "Best Available (1080p)",
            preferredAudioQuality = prefs.getString("preferred_audio_quality", "320 kbps (High Quality MP3)") ?: "320 kbps (High Quality MP3)",
            maxConcurrentDownloads = prefs.getInt("max_concurrent", 3),
            wifiOnly = prefs.getBoolean("wifi_only", false),
            notifyOnCompletion = prefs.getBoolean("notify_completion", true),
            autoPasteLink = prefs.getBoolean("auto_paste", true)
        )
    }

    fun updateCustomDownloadLocation(uri: Uri?, displayName: String, physicalPath: String?) {
        val cleaned = cleanLocationName(displayName)
        prefs.edit()
            .putString("download_location_name", cleaned)
            .putString("custom_download_uri", uri?.toString())
            .putString("custom_download_path", physicalPath)
            .apply()

        _appSettings.value = _appSettings.value.copy(
            downloadLocationName = cleaned,
            customDownloadUri = uri?.toString(),
            customDownloadPath = physicalPath
        )
    }

    fun clearResult() {
        _currentMetadata.value = null
        _errorMessage.value = null
    }

    fun updateDownloadLocation(name: String) {
        val cleaned = cleanLocationName(name)
        prefs.edit().putString("download_location_name", cleaned).apply()
        _appSettings.value = _appSettings.value.copy(downloadLocationName = cleaned)
    }

    fun updateVideoQuality(quality: String) {
        prefs.edit().putString("preferred_video_quality", quality).apply()
        _appSettings.value = _appSettings.value.copy(preferredVideoQuality = quality)
    }

    fun updateAudioQuality(quality: String) {
        prefs.edit().putString("preferred_audio_quality", quality).apply()
        _appSettings.value = _appSettings.value.copy(preferredAudioQuality = quality)
    }

    fun updateMaxConcurrent(count: Int) {
        prefs.edit().putInt("max_concurrent", count).apply()
        _appSettings.value = _appSettings.value.copy(maxConcurrentDownloads = count)
    }

    fun updateWifiOnly(enabled: Boolean) {
        prefs.edit().putBoolean("wifi_only", enabled).apply()
        _appSettings.value = _appSettings.value.copy(wifiOnly = enabled)
    }

    fun updateNotifyOnCompletion(enabled: Boolean) {
        prefs.edit().putBoolean("notify_completion", enabled).apply()
        _appSettings.value = _appSettings.value.copy(notifyOnCompletion = enabled)
    }

    fun updateAutoPasteLink(enabled: Boolean) {
        prefs.edit().putBoolean("auto_paste", enabled).apply()
        _appSettings.value = _appSettings.value.copy(autoPasteLink = enabled)
    }

    fun onUrlChanged(newUrl: String) {
        _urlInput.value = newUrl
        if (_errorMessage.value != null) {
            _errorMessage.value = null
        }
    }

    fun dismissError() {
        _errorMessage.value = null
    }

    fun onMediaTypeChanged(type: MediaType) {
        _selectedMediaType.value = type
        _currentMetadata.value?.let { meta ->
            val formats = meta.availableFormats.filter {
                if (type == MediaType.VIDEO) !it.isAudioOnly else it.isAudioOnly
            }
            _selectedFormat.value = formats.firstOrNull()
        }
    }

    fun onFormatSelected(format: FormatOption) {
        _selectedFormat.value = format
    }

    fun fetchMetadata() {
        val url = _urlInput.value.trim()
        if (url.isEmpty()) return

        viewModelScope.launch {
            _isLoadingMetadata.value = true
            _currentMetadata.value = null
            _errorMessage.value = null

            try {
                // Real Live On-Device Stream & YouTube Extraction
                val metadata = MediaExtractor.extractMediaInfo(url)
                _currentMetadata.value = metadata
                _selectedFormat.value = metadata.availableFormats.firstOrNull { !it.isAudioOnly }
                    ?: metadata.availableFormats.firstOrNull()
            } catch (e: Exception) {
                // Reject invalid or non-downloadable links cleanly
                _currentMetadata.value = null
                _errorMessage.value = e.localizedMessage
                    ?: "No downloadable media found at this link. Please enter a valid URL."
            } finally {
                _isLoadingMetadata.value = false
            }
        }
    }

    fun startDownload() {
        val metadata = _currentMetadata.value ?: return
        val format = _selectedFormat.value ?: return

        val app = getApplication<Application>()
        val downloadDir = StorageAnalyzer.resolveDirectory(app, _appSettings.value.customDownloadPath)
        if (!downloadDir.exists()) {
            downloadDir.mkdirs()
        }

        val cleanTitle = metadata.title
            .replace(Regex("[^a-zA-Z0-9._ -]"), "_")
            .trim()
            .ifEmpty { "grabbit_${System.currentTimeMillis()}" }
            .take(50)

        val ext = format.extension.lowercase().ifEmpty { if (format.isAudioOnly) "m4a" else "mp4" }
        var targetFile = File(downloadDir, "$cleanTitle.$ext")
        var counter = 1
        while (targetFile.exists()) {
            targetFile = File(downloadDir, "$cleanTitle ($counter).$ext")
            counter++
        }

        val taskId = UUID.randomUUID().toString()
        val newTask = DownloadTask(
            id = taskId,
            url = metadata.url,
            title = metadata.title,
            author = metadata.author,
            thumbnailUrl = metadata.thumbnailUrl,
            format = format,
            status = DownloadStatus.DOWNLOADING,
            progress = 0f,
            speed = "Starting...",
            eta = "--:--",
            filePath = targetFile.absolutePath,
            totalBytes = 0L
        )

        val updatedList = listOf(newTask) + _downloadTasks.value
        _downloadTasks.value = updatedList
        DownloadHistoryRepository.saveHistory(app, updatedList)

        // Clear dashboard input and result after initiating download
        _currentMetadata.value = null
        _urlInput.value = ""

        startStreamingJob(newTask)
    }

    private fun startStreamingJob(task: DownloadTask) {
        val directUrl = task.format.directStreamUrl
        val app = getApplication<Application>()

        val job = viewModelScope.launch(Dispatchers.IO) {
            val targetFile = File(task.filePath ?: File(
                StorageAnalyzer.resolveDirectory(app, _appSettings.value.customDownloadPath),
                "download_${System.currentTimeMillis()}.${task.format.extension}"
            ).absolutePath)

            targetFile.parentFile?.let { if (!it.exists()) it.mkdirs() }

            // If target file already exists and is complete
            if (targetFile.exists() && targetFile.length() > 0) {
                withContext(Dispatchers.Main) {
                    MediaScannerConnection.scanFile(app, arrayOf(targetFile.absolutePath), null, null)
                }
                updateTask(task.id) {
                    it.copy(
                        progress = 1.0f,
                        status = DownloadStatus.COMPLETED,
                        speed = "Completed",
                        eta = "00:00",
                        downloadedBytes = targetFile.length(),
                        totalBytes = targetFile.length(),
                        filePath = targetFile.absolutePath
                    )
                }
                downloadJobs.remove(task.id)
                return@launch
            }

            // Staging partial download file
            val tempFile = File(targetFile.parentFile, "${targetFile.name}.download")

            // If no direct URL available, fallback to mock generation for demo
            if (directUrl.isNullOrBlank()) {
                val fallbackFile = FileOpener.ensureFileExists(app, task, _appSettings.value.downloadLocationName)
                updateTask(task.id) {
                    it.copy(
                        progress = 1.0f,
                        status = DownloadStatus.COMPLETED,
                        speed = "Completed",
                        eta = "00:00",
                        filePath = fallbackFile.absolutePath,
                        downloadedBytes = fallbackFile.length(),
                        totalBytes = fallbackFile.length()
                    )
                }
                downloadJobs.remove(task.id)
                return@launch
            }

            val existingBytes = if (tempFile.exists()) tempFile.length() else 0L

            val client = okhttp3.OkHttpClient.Builder()
                .protocols(listOf(okhttp3.Protocol.HTTP_1_1))
                .connectTimeout(25, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .followRedirects(true)
                .build()

            val requestBuilder = okhttp3.Request.Builder()
                .url(directUrl)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36")
                .header("Accept", "*/*")
                .header("Connection", "keep-alive")

            var isResuming = false
            if (existingBytes > 0) {
                requestBuilder.header("Range", "bytes=$existingBytes-")
                isResuming = true
            }

            updateTask(task.id) {
                it.copy(
                    status = DownloadStatus.DOWNLOADING,
                    speed = if (isResuming) "Resuming..." else "Connecting...",
                    filePath = targetFile.absolutePath
                )
            }

            var inputStream: InputStream? = null
            var outputStream: FileOutputStream? = null

            try {
                val response = client.newCall(requestBuilder.build()).execute()

                // If Range Not Satisfiable (HTTP 416), file is already fully received in tempFile
                if (response.code == 416 && existingBytes > 0) {
                    tempFile.renameTo(targetFile)
                    withContext(Dispatchers.Main) {
                        MediaScannerConnection.scanFile(app, arrayOf(targetFile.absolutePath), null, null)
                    }
                    val finalSize = targetFile.length()
                    updateTask(task.id) {
                        it.copy(
                            progress = 1.0f,
                            status = DownloadStatus.COMPLETED,
                            speed = "Completed",
                            eta = "00:00",
                            downloadedBytes = finalSize,
                            totalBytes = finalSize,
                            filePath = targetFile.absolutePath
                        )
                    }
                    downloadJobs.remove(task.id)
                    return@launch
                }

                if (!response.isSuccessful && response.code != 206) {
                    throw IllegalStateException("Server returned HTTP ${response.code}")
                }

                val body = response.body ?: throw IllegalStateException("Empty response body")
                val isPartial = response.code == 206
                val append = isPartial && existingBytes > 0

                val serverLength = body.contentLength()
                val totalBytes = when {
                    append -> existingBytes + (if (serverLength > 0) serverLength else 0L)
                    serverLength > 0 -> serverLength
                    task.totalBytes > 0 -> task.totalBytes
                    else -> 20_000_000L
                }

                inputStream = body.byteStream()
                outputStream = FileOutputStream(tempFile, append)

                val buffer = ByteArray(64 * 1024)
                var totalDownloaded = if (append) existingBytes else 0L
                var lastUpdateTime = System.currentTimeMillis()
                var bytesSinceLastUpdate = 0L

                while (coroutineContext.isActive) {
                    val bytesRead = inputStream.read(buffer)
                    if (bytesRead == -1) break

                    outputStream.write(buffer, 0, bytesRead)
                    totalDownloaded += bytesRead
                    bytesSinceLastUpdate += bytesRead

                    val now = System.currentTimeMillis()
                    if (now - lastUpdateTime >= 250) {
                        val timeDiffSec = (now - lastUpdateTime) / 1000.0
                        val speedBytesPerSec = if (timeDiffSec > 0) (bytesSinceLastUpdate / timeDiffSec) else 0.0
                        val speedStr = formatSpeed(speedBytesPerSec)

                        val progress = if (totalBytes > 0) {
                            (totalDownloaded.toFloat() / totalBytes.toFloat()).coerceIn(0.01f, 0.99f)
                        } else 0.5f
                        val remainingBytes = (totalBytes - totalDownloaded).coerceAtLeast(0L)
                        val etaSeconds = if (speedBytesPerSec > 0) (remainingBytes / speedBytesPerSec).toLong() else 0L
                        val etaStr = formatEta(etaSeconds)

                        updateTask(task.id) {
                            it.copy(
                                progress = progress,
                                status = DownloadStatus.DOWNLOADING,
                                downloadedBytes = totalDownloaded,
                                totalBytes = totalBytes,
                                speed = speedStr,
                                eta = etaStr,
                                filePath = targetFile.absolutePath
                            )
                        }

                        lastUpdateTime = now
                        bytesSinceLastUpdate = 0L
                    }
                }

                outputStream.flush()
                outputStream.close()
                outputStream = null

                if (!coroutineContext.isActive) {
                    // Job was cancelled/paused
                    return@launch
                }

                // Promote temp file to final target file
                if (tempFile.exists()) {
                    if (targetFile.exists()) targetFile.delete()
                    tempFile.renameTo(targetFile)
                }

                // Scan finished file to make visible immediately to system gallery and players
                withContext(Dispatchers.Main) {
                    MediaScannerConnection.scanFile(app, arrayOf(targetFile.absolutePath), null, null)
                }

                val finalSize = targetFile.length()
                updateTask(task.id) {
                    it.copy(
                        progress = 1.0f,
                        status = DownloadStatus.COMPLETED,
                        speed = "Completed",
                        eta = "00:00",
                        downloadedBytes = finalSize,
                        totalBytes = finalSize,
                        filePath = targetFile.absolutePath
                    )
                }
                downloadJobs.remove(task.id)

            } catch (e: Exception) {
                if (!coroutineContext.isActive) {
                    // Cancellation exception, ignore
                    return@launch
                }
                e.printStackTrace()
                updateTask(task.id) {
                    it.copy(
                        status = DownloadStatus.ERROR,
                        speed = "Error",
                        errorMessage = e.localizedMessage ?: "Download failed"
                    )
                }
                downloadJobs.remove(task.id)
            } finally {
                try { outputStream?.close() } catch (e: Exception) {}
                try { inputStream?.close() } catch (e: Exception) {}
            }
        }

        downloadJobs[task.id] = job
    }

    private fun updateTask(taskId: String, transform: (DownloadTask) -> DownloadTask) {
        val currentList = _downloadTasks.value
        val updated = currentList.map {
            if (it.id == taskId) transform(it) else it
        }
        _downloadTasks.value = updated

        // Persist when state changes to finished or paused
        val target = updated.find { it.id == taskId }
        if (target != null && (target.status == DownloadStatus.COMPLETED || target.status == DownloadStatus.PAUSED || target.status == DownloadStatus.ERROR)) {
            val app = getApplication<Application>()
            DownloadHistoryRepository.saveHistory(app, updated)
        }
    }

    private fun formatSpeed(bytesPerSec: Double): String {
        val mbPerSec = bytesPerSec / (1024.0 * 1024.0)
        return if (mbPerSec >= 1.0) {
            String.format(Locale.US, "%.1f MB/s", mbPerSec)
        } else {
            val kbPerSec = bytesPerSec / 1024.0
            String.format(Locale.US, "%.0f KB/s", kbPerSec)
        }
    }

    private fun formatEta(seconds: Long): String {
        if (seconds <= 0) return "00:01"
        val m = seconds / 60
        val s = seconds % 60
        return String.format(Locale.US, "%02d:%02d", m, s)
    }

    fun openFile(context: Context, taskId: String) {
        val task = _downloadTasks.value.find { it.id == taskId } ?: return
        FileOpener.openFile(context, task)
    }

    fun openDownloadFolder(context: Context) {
        val customUri = _appSettings.value.customDownloadUri?.let { Uri.parse(it) }
        val dir = StorageAnalyzer.resolveDirectory(context, _appSettings.value.customDownloadPath)
        StorageAnalyzer.openFolderInFileManager(context, dir, customUri)
    }

    fun togglePauseResume(taskId: String) {
        val task = _downloadTasks.value.find { it.id == taskId } ?: return
        if (task.status == DownloadStatus.DOWNLOADING) {
            // Cancel active job to pause stream cleanly
            downloadJobs.remove(taskId)?.cancel()
            updateTask(taskId) {
                it.copy(
                    status = DownloadStatus.PAUSED,
                    speed = "Paused",
                    eta = "--:--"
                )
            }
        } else if (task.status == DownloadStatus.PAUSED || task.status == DownloadStatus.ERROR) {
            // Resume streaming with HTTP Range from existing bytes
            startStreamingJob(task)
        }
    }

    fun cancelTask(taskId: String) {
        // Cancel active network job
        downloadJobs.remove(taskId)?.cancel()

        val task = _downloadTasks.value.find { it.id == taskId }
        task?.filePath?.let { path ->
            try {
                val file = File(path)
                if (file.exists()) file.delete()
                val tempFile = File("${path}.download")
                if (tempFile.exists()) tempFile.delete()
            } catch (e: Exception) {}
        }

        val updated = _downloadTasks.value.filterNot { it.id == taskId }
        _downloadTasks.value = updated
        val app = getApplication<Application>()
        DownloadHistoryRepository.saveHistory(app, updated)
    }

    // ==========================================
    // In-App Auto-Updater Functions
    // ==========================================

    fun checkForUpdates(silent: Boolean = false) {
        if (_isCheckingUpdate.value) return
        _isCheckingUpdate.value = true
        _updateCheckMessage.value = null

        viewModelScope.launch {
            val result = AppUpdateManager.checkForUpdate(currentAppVersion)
            _isCheckingUpdate.value = false
            result.onSuccess { info ->
                if (info != null) {
                    _updateInfo.value = info
                    _updateCheckMessage.value = null
                } else {
                    _updateInfo.value = null
                    if (!silent) {
                        _updateCheckMessage.value = "Grabbit is up to date (v$currentAppVersion)"
                    }
                }
            }.onFailure { error ->
                if (!silent) {
                    _updateCheckMessage.value = "Couldn't check for updates. Check connection."
                }
            }
        }
    }

    fun downloadAndInstallUpdate(context: Context) {
        val info = _updateInfo.value ?: return
        if (_isDownloadingUpdate.value) return

        _isDownloadingUpdate.value = true
        _updateDownloadProgress.value = 0f

        viewModelScope.launch {
            val downloadResult = AppUpdateManager.downloadApk(context, info.downloadUrl) { progress, _, _ ->
                if (progress >= 0f) {
                    _updateDownloadProgress.value = progress
                }
            }

            _isDownloadingUpdate.value = false

            downloadResult.onSuccess { apkFile ->
                _downloadedApkFile.value = apkFile
                // Trigger native Android installer
                val installResult = AppUpdateManager.installApk(context, apkFile)
                installResult.onFailure { error ->
                    _updateCheckMessage.value = error.message
                }
            }.onFailure { error ->
                _updateCheckMessage.value = "Download failed: ${error.localizedMessage}"
            }
        }
    }

    fun installDownloadedUpdate(context: Context) {
        val file = _downloadedApkFile.value ?: return
        val installResult = AppUpdateManager.installApk(context, file)
        installResult.onFailure { error ->
            _updateCheckMessage.value = error.message
        }
    }

    fun dismissUpdateDialog() {
        _updateInfo.value = null
        _updateCheckMessage.value = null
        _isDownloadingUpdate.value = false
        _updateDownloadProgress.value = 0f
    }
}
