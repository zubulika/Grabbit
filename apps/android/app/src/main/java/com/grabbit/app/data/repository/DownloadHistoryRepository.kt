package com.grabbit.app.data.repository

import android.content.Context
import com.grabbit.app.data.model.DownloadStatus
import com.grabbit.app.data.model.DownloadTask
import com.grabbit.app.data.model.FormatOption
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object DownloadHistoryRepository {

    private const val FILE_NAME = "grabbit_downloads_history.json"

    @Synchronized
    fun loadHistory(context: Context): List<DownloadTask> {
        val file = File(context.filesDir, FILE_NAME)
        if (!file.exists()) return emptyList()

        val list = mutableListOf<DownloadTask>()
        try {
            val jsonStr = file.readText()
            if (jsonStr.isBlank()) return emptyList()

            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val formatObj = obj.optJSONObject("format")

                val format = if (formatObj != null) {
                    FormatOption(
                        id = formatObj.optString("id", "default"),
                        resolution = formatObj.optString("resolution", "1080p"),
                        extension = formatObj.optString("extension", "mp4"),
                        approxSize = formatObj.optString("approxSize", ""),
                        isBest = formatObj.optBoolean("isBest", false),
                        isAudioOnly = formatObj.optBoolean("isAudioOnly", false),
                        directStreamUrl = formatObj.optString("directStreamUrl", null)
                    )
                } else {
                    FormatOption(
                        id = "default",
                        resolution = "Video",
                        extension = "mp4",
                        approxSize = ""
                    )
                }

                val savedStatusStr = obj.optString("status", DownloadStatus.COMPLETED.name)
                var status = try {
                    DownloadStatus.valueOf(savedStatusStr)
                } catch (e: Exception) {
                    DownloadStatus.COMPLETED
                }

                val filePath = obj.optString("filePath", null)

                // Validate physical file on disk
                var totalBytes = obj.optLong("totalBytes", 0L)
                var downloadedBytes = obj.optLong("downloadedBytes", 0L)

                if (filePath != null) {
                    val physicalFile = File(filePath)
                    if (physicalFile.exists() && physicalFile.length() > 0) {
                        totalBytes = physicalFile.length()
                        downloadedBytes = physicalFile.length()
                        status = DownloadStatus.COMPLETED
                    } else if (status == DownloadStatus.DOWNLOADING) {
                        // If app was killed while downloading, treat as paused for safe resume
                        status = DownloadStatus.PAUSED
                    }
                }

                val task = DownloadTask(
                    id = obj.optString("id", System.currentTimeMillis().toString()),
                    url = obj.optString("url", ""),
                    title = obj.optString("title", "Unknown Media"),
                    author = obj.optString("author", "Grabbit"),
                    thumbnailUrl = obj.optString("thumbnailUrl", ""),
                    format = format,
                    status = status,
                    progress = if (status == DownloadStatus.COMPLETED) 1f else obj.optDouble("progress", 0.0).toFloat(),
                    speed = if (status == DownloadStatus.COMPLETED) "Completed" else if (status == DownloadStatus.PAUSED) "Paused" else "--",
                    eta = if (status == DownloadStatus.COMPLETED) "00:00" else "--:--",
                    downloadedBytes = downloadedBytes,
                    totalBytes = totalBytes,
                    filePath = filePath,
                    errorMessage = obj.optString("errorMessage", null)
                )
                list.add(task)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    @Synchronized
    fun saveHistory(context: Context, tasks: List<DownloadTask>) {
        try {
            val jsonArray = JSONArray()
            for (task in tasks) {
                val obj = JSONObject()
                obj.put("id", task.id)
                obj.put("url", task.url)
                obj.put("title", task.title)
                obj.put("author", task.author)
                obj.put("thumbnailUrl", task.thumbnailUrl)
                obj.put("status", task.status.name)
                obj.put("progress", task.progress.toDouble())
                obj.put("downloadedBytes", task.downloadedBytes)
                obj.put("totalBytes", task.totalBytes)
                obj.put("filePath", task.filePath)
                obj.put("errorMessage", task.errorMessage)

                val formatObj = JSONObject()
                formatObj.put("id", task.format.id)
                formatObj.put("resolution", task.format.resolution)
                formatObj.put("extension", task.format.extension)
                formatObj.put("approxSize", task.format.approxSize)
                formatObj.put("isBest", task.format.isBest)
                formatObj.put("isAudioOnly", task.format.isAudioOnly)
                formatObj.put("directStreamUrl", task.format.directStreamUrl)
                obj.put("format", formatObj)

                jsonArray.put(obj)
            }

            val file = File(context.filesDir, FILE_NAME)
            file.writeText(jsonArray.toString())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
