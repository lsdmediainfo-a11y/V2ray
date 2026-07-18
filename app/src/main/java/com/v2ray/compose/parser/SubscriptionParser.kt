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
        return try {
            var cleaned = content.replace("\n", "").replace("\r", "").replace(" ", "").trim()
            while (cleaned.length % 4 != 0) {
                cleaned += "="
            }
            val bytes = Base64.decode(cleaned, Base64.DEFAULT or Base64.NO_WRAP or Base64.URL_SAFE)
            String(bytes, StandardCharsets.UTF_8)
        } catch (e: Exception) {
            content
        }
    }
}
