package com.v2ray.compose.service

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

object PingManager {

    suspend fun pingTcp(host: String, port: Int, timeoutMs: Int = 3000): Int = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            val socket = Socket()
            socket.connect(InetSocketAddress(host, port), timeoutMs)
            socket.close()
            val latency = (System.currentTimeMillis() - startTime).toInt()
            if (latency > 0) latency else 1
        } catch (e: Exception) {
            -1
        }
    }
}
