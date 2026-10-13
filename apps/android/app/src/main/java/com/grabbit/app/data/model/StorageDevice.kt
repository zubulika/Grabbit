package com.grabbit.app.data.model

enum class StorageType {
    INTERNAL,
    SD_CARD,
    USB_OTG
}

data class StorageDevice(
    val id: String,
    val name: String,
    val type: StorageType,
    val isRemovable: Boolean,
    val isPrimary: Boolean,
    val isMounted: Boolean,
    val totalBytes: Long,
    val freeBytes: Long,
    val totalFormatted: String,
    val freeFormatted: String,
    val rootPath: String?
)
