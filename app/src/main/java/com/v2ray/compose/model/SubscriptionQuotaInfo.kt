package com.v2ray.compose.model

data class SubscriptionQuotaInfo(
    val uploadBytes: Long = 0,
    val downloadBytes: Long = 1194002311470L,
    val totalBytes: Long = 5368709120000L,
    val expireTimestamp: Long = 1789862400L
) {
    val usedBytes: Long get() = uploadBytes + downloadBytes
    val usedPercentage: Float get() = if (totalBytes > 0) (usedBytes.toFloat() / totalBytes.toFloat()).coerceIn(0f, 1f) else 0f
    
    fun formattedUsedGb(): String = String.format("%.2f GB", usedBytes / (1024.0 * 1024.0 * 1024.0))
    fun formattedTotalTb(): String = String.format("%.2f TB", totalBytes / (1024.0 * 1024.0 * 1024.0 * 1024.0))
    fun formattedRemainingDays(): String = "64 Days"
}
