package com.v2ray.compose.parser

import android.util.Base64
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.v2ray.compose.model.ProtocolType
import com.v2ray.compose.model.V2RayProfile
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

object V2RayUriParser {

    fun parse(rawUri: String): V2RayProfile? {
        val trimmed = rawUri.trim()
        return try {
            when {
                trimmed.startsWith("vmess://", ignoreCase = true) -> parseVmess(trimmed)
                trimmed.startsWith("vless://", ignoreCase = true) -> parseVless(trimmed)
                trimmed.startsWith("trojan://", ignoreCase = true) -> parseTrojan(trimmed)
                trimmed.startsWith("ss://", ignoreCase = true) -> parseShadowsocks(trimmed)
                else -> null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun parseVmess(uriStr: String): V2RayProfile {
        val base64Content = uriStr.substring(8)
        var cleaned = base64Content.replace("\n", "").replace("\r", "").trim()
        while (cleaned.length % 4 != 0) cleaned += "="

        val decoded = String(Base64.decode(cleaned, Base64.DEFAULT or Base64.NO_WRAP or Base64.URL_SAFE), StandardCharsets.UTF_8)
        val json = Gson().fromJson(decoded, JsonObject::class.java)

        val remark = json.get("ps")?.asString ?: "VMess Profile"
        val add = json.get("add")?.asString ?: ""
        val port = json.get("port")?.asInt ?: 443
        val id = json.get("id")?.asString ?: ""
        val aid = json.get("aid")?.asInt ?: 0
        val net = json.get("net")?.asString ?: "tcp"
        val host = json.get("host")?.asString ?: ""
        val path = json.get("path")?.asString ?: ""
        val tls = json.get("tls")?.asString ?: ""

        return V2RayProfile(
            remark = remark,
            address = add,
            port = port,
            protocol = ProtocolType.VMESS,
            uuidOrPassword = id,
            alterId = aid,
            network = net,
            host = host,
            path = path,
            isTls = tls.equals("tls", ignoreCase = true),
            rawUri = uriStr
        )
    }

    private fun parseVless(uriStr: String): V2RayProfile {
        var rest = uriStr.substring(8)
        var remark = "VLESS Profile"

        if (rest.contains("#")) {
            val parts = rest.split("#", limit = 2)
            rest = parts[0]
            remark = try { URLDecoder.decode(parts[1], "UTF-8") } catch (e: Exception) { parts[1] }
        }

        var queryParams = emptyMap<String, String>()
        if (rest.contains("?")) {
            val parts = rest.split("?", limit = 2)
            rest = parts[0]
            queryParams = parseQueryParams(parts[1])
        }

        var uuid = ""
        var hostPort = rest
        if (rest.contains("@")) {
            val parts = rest.split("@", limit = 2)
            uuid = parts[0]
            hostPort = parts[1]
        }

        var host = hostPort
        var port = 443
        if (hostPort.contains(":")) {
            val parts = hostPort.split(":", limit = 2)
            host = parts[0]
            port = parts[1].toIntOrNull() ?: 443
        }

        val type = queryParams["type"] ?: "tcp"
        val security = queryParams["security"] ?: "none"
        val sni = queryParams["sni"] ?: ""
        val path = queryParams["path"] ?: ""

        return V2RayProfile(
            remark = remark,
            address = host,
            port = port,
            protocol = ProtocolType.VLESS,
            uuidOrPassword = uuid,
            network = type,
            sni = sni,
            path = path,
            isTls = security.equals("tls", ignoreCase = true) || security.equals("reality", ignoreCase = true),
            rawUri = uriStr
        )
    }

    private fun parseTrojan(uriStr: String): V2RayProfile {
        var rest = uriStr.substring(9)
        var remark = "Trojan Profile"

        if (rest.contains("#")) {
            val parts = rest.split("#", limit = 2)
            rest = parts[0]
            remark = try { URLDecoder.decode(parts[1], "UTF-8") } catch (e: Exception) { parts[1] }
        }

        var queryParams = emptyMap<String, String>()
        if (rest.contains("?")) {
            val parts = rest.split("?", limit = 2)
            rest = parts[0]
            queryParams = parseQueryParams(parts[1])
        }

        var password = ""
        var hostPort = rest
        if (rest.contains("@")) {
            val parts = rest.split("@", limit = 2)
            password = parts[0]
            hostPort = parts[1]
        }

        var host = hostPort
        var port = 443
        if (hostPort.contains(":")) {
            val parts = hostPort.split(":", limit = 2)
            host = parts[0]
            port = parts[1].toIntOrNull() ?: 443
        }

        val type = queryParams["type"] ?: "tcp"
        val sni = queryParams["sni"] ?: ""

        return V2RayProfile(
            remark = remark,
            address = host,
            port = port,
            protocol = ProtocolType.TROJAN,
            uuidOrPassword = password,
            network = type,
            sni = sni,
            isTls = true,
            rawUri = uriStr
        )
    }

    private fun parseShadowsocks(uriStr: String): V2RayProfile {
        var rest = uriStr.substring(5)
        var remark = "Shadowsocks Profile"

        if (rest.contains("#")) {
            val parts = rest.split("#", limit = 2)
            rest = parts[0]
            remark = try { URLDecoder.decode(parts[1], "UTF-8") } catch (e: Exception) { parts[1] }
        }

        var userInfo = ""
        var hostPort = rest
        if (rest.contains("@")) {
            val parts = rest.split("@", limit = 2)
            userInfo = parts[0]
            hostPort = parts[1]
        }

        var host = hostPort
        var port = 8388
        if (hostPort.contains(":")) {
            val parts = hostPort.split(":", limit = 2)
            host = parts[0]
            port = parts[1].toIntOrNull() ?: 8388
        }

        val decodedUser = try {
            String(Base64.decode(userInfo, Base64.DEFAULT or Base64.NO_WRAP or Base64.URL_SAFE), StandardCharsets.UTF_8)
        } catch (e: Exception) {
            userInfo
        }

        return V2RayProfile(
            remark = remark,
            address = host,
            port = port,
            protocol = ProtocolType.SHADOWSOCKS,
            uuidOrPassword = decodedUser,
            rawUri = uriStr
        )
    }

    private fun parseQueryParams(query: String?): Map<String, String> {
        if (query.isNullOrEmpty()) return emptyMap()
        val result = mutableMapOf<String, String>()
        for (param in query.split("&")) {
            val pair = param.split("=", limit = 2)
            if (pair.size == 2) {
                val k = try { URLDecoder.decode(pair[0], "UTF-8") } catch (e: Exception) { pair[0] }
                val v = try { URLDecoder.decode(pair[1], "UTF-8") } catch (e: Exception) { pair[1] }
                result[k] = v
            }
        }
        return result
    }

    fun generateV2RayConfigJson(profile: V2RayProfile, localSocksPort: Int = 10808, localHttpPort: Int = 10809): String {
        val json = JsonObject()

        // Inbounds
        val inbounds = com.google.gson.JsonArray()
        val socksInbound = JsonObject().apply {
            addProperty("tag", "socks-in")
            addProperty("port", localSocksPort)
            addProperty("protocol", "socks")
            val settings = JsonObject().apply {
                addProperty("auth", "noauth")
                addProperty("udp", true)
            }
            add("settings", settings)
        }
        inbounds.add(socksInbound)
        json.add("inbounds", inbounds)

        // Outbounds
        val outbounds = com.google.gson.JsonArray()
        val outbound = JsonObject().apply {
            addProperty("tag", "proxy")
            addProperty("protocol", profile.protocol.scheme)

            val settings = JsonObject()
            when (profile.protocol) {
                ProtocolType.VMESS -> {
                    val vnext = com.google.gson.JsonArray()
                    val server = JsonObject().apply {
                        addProperty("address", profile.address)
                        addProperty("port", profile.port)
                        val users = com.google.gson.JsonArray()
                        users.add(JsonObject().apply {
                            addProperty("id", profile.uuidOrPassword)
                            addProperty("alterId", profile.alterId)
                            addProperty("security", profile.security)
                        })
                        add("users", users)
                    }
                    vnext.add(server)
                    settings.add("vnext", vnext)
                }
                ProtocolType.VLESS -> {
                    val vnext = com.google.gson.JsonArray()
                    val server = JsonObject().apply {
                        addProperty("address", profile.address)
                        addProperty("port", profile.port)
                        val users = com.google.gson.JsonArray()
                        users.add(JsonObject().apply {
                            addProperty("id", profile.uuidOrPassword)
                            addProperty("encryption", "none")
                        })
                        add("users", users)
                    }
                    vnext.add(server)
                    settings.add("vnext", vnext)
                }
                ProtocolType.TROJAN -> {
                    val servers = com.google.gson.JsonArray()
                    val server = JsonObject().apply {
                        addProperty("address", profile.address)
                        addProperty("port", profile.port)
                        addProperty("password", profile.uuidOrPassword)
                    }
                    servers.add(server)
                    settings.add("servers", servers)
                }
                ProtocolType.SHADOWSOCKS -> {
                    val servers = com.google.gson.JsonArray()
                    val server = JsonObject().apply {
                        addProperty("address", profile.address)
                        addProperty("port", profile.port)
                        addProperty("password", profile.uuidOrPassword)
                        addProperty("method", "aes-256-gcm")
                    }
                    servers.add(server)
                    settings.add("servers", servers)
                }
                else -> {}
            }
            add("settings", settings)

            // StreamSettings
            val streamSettings = JsonObject().apply {
                addProperty("network", profile.network)
                if (profile.isTls) {
                    addProperty("security", "tls")
                    val tlsSettings = JsonObject().apply {
                        if (profile.sni.isNotEmpty()) addProperty("serverName", profile.sni)
                        addProperty("allowInsecure", true)
                    }
                    add("tlsSettings", tlsSettings)
                }
            }
            add("streamSettings", streamSettings)
        }
        outbounds.add(outbound)

        val directOutbound = JsonObject().apply {
            addProperty("tag", "direct")
            addProperty("protocol", "freedom")
        }
        outbounds.add(directOutbound)

        json.add("outbounds", outbounds)

        return Gson().toJson(json)
    }
}
