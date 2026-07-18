package com.v2ray.compose.parser

import android.util.Base64
import com.v2ray.compose.model.V2RayProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

object SubscriptionParser {

    suspend fun fetchSubscription(subscriptionUrl: String): List<V2RayProfile> = withContext(Dispatchers.IO) {
        val url = URL(subscriptionUrl)
        val connection = url.openConnection() as HttpURLConnection
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.requestMethod = "GET"
        connection.setRequestProperty("User-Agent", "v2rayNG/1.8.5")

        try {
            val responseCode = connection.responseCode
            if (responseCode == 200) {
                val rawBody = connection.inputStream.bufferedReader().use { it.readText() }.trim()
                val decoded = decodeSubscriptionContent(rawBody)

                val profiles = mutableListOf<V2RayProfile>()
                for (line in decoded.lines()) {
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty()) {
                        val profile = V2RayUriParser.parse(trimmed)
                        if (profile != null) {
                            profiles.add(profile.copy(subscriptionUrl = subscriptionUrl))
                        }
                    }
                }
                profiles
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        } finally {
            connection.disconnect()
        }
    }

    private fun decodeSubscriptionContent(content: String): String {
        val cleaned = content.replace("\n", "").replace("\r", "").replace(" ", "").trim()
        val padded = if (cleaned.length % 4 != 0) cleaned + "=".repeat(4 - (cleaned.length % 4)) else cleaned

        // Stage 1: Try standard Base64 NO_WRAP
        try {
            val bytes = Base64.decode(padded, Base64.NO_WRAP)
            val text = String(bytes, StandardCharsets.UTF_8)
            if (text.contains("://")) return text
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Stage 2: Try URL-safe Base64 substitution (- -> +, _ -> /)
        try {
            val alt = padded.replace("-", "+").replace("_", "/")
            val bytes = Base64.decode(alt, Base64.NO_WRAP)
            val text = String(bytes, StandardCharsets.UTF_8)
            if (text.contains("://")) return text
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return content
    }
}
