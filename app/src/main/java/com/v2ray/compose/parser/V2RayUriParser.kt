package com.v2ray.compose.parser

import android.util.Base64
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.v2ray.compose.model.ProtocolType
import com.v2ray.compose.model.V2RayProfile
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

object V2RayUriParser {

    fun parse(uriStr: String): V2RayProfile? {
        val trimmed = uriStr.trim()
        return when {
            trimmed.startsWith("vmess://", ignoreCase = true) -> parseVmess(trimmed)
            trimmed.startsWith("vless://", ignoreCase = true) -> parseVless(trimmed)
            trimmed.startsWith("trojan://", ignoreCase = true) -> parseTrojan(trimmed)
            trimmed.startsWith("ss://", ignoreCase = true) -> parseShadowsocks(trimmed)
            else -> null
        }
    }

    private fun parseVmess(uriStr: String): V2RayProfile? {
        return try {
            val base64Data = uriStr.substring(8).trim()
            val decoded = String(Base64.decode(base64Data, Base64.DEFAULT or Base64.NO_WRAP or Base64.URL_SAFE), StandardCharsets.UTF_8)
            val json = Gson().fromJson(decoded, JsonObject::class.java)

            V2RayProfile(
                remark = json.get("ps")?.asString ?: "VMess Profile",
                address = json.get("add")?.asString ?: "",
                port = json.get("port")?.asInt ?: 443,
                protocol = ProtocolType.VMESS,
                uuidOrPassword = json.get("id")?.asString ?: "",
                alterId = json.get("aid")?.asInt ?: 0,
                security = json.get("scy")?.asString ?: "auto",
                network = json.get("net")?.asString ?: "tcp",
                sni = json.get("sni")?.asString ?: json.get("host")?.asString ?: "",
                isTls = json.get("tls")?.asString == "tls",
                rawUri = uriStr
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun parseVless(uriStr: String): V2RayProfile {
        var rest = uriStr.substring(8)
        var remark = "VLESS Profile"

        if (rest.contains("#")) {
            val parts = rest.split("#", limit = 2)
            rest = parts[0]
            remark = try { URLDecoder.decode(parts[1], "UTF-8") } catch (e: Exception) { parts[1] }
        }

        var queryStr: String? = null
        if (rest.contains("?")) {
            val parts = rest.split("?", limit = 2)
            rest = parts[0]
            queryStr = parts[1]
        }

        val queryParams = parseQueryParams(queryStr)

        var uuid = ""
        var hostPort = rest
        if (rest.contains("@")) {
            val parts = rest.split("@", limit = 2)
            uuid = parts[0]
            hostPort = parts[1]
        }

        var address = hostPort
        var port = 443
        if (hostPort.contains(":")) {
            val parts = hostPort.split(":", limit = 2)
            address = parts[0]
            port = parts[1].toIntOrNull() ?: 443
        }

        val securityParam = queryParams["security"] ?: ""
        val isReality = securityParam.equals("reality", ignoreCase = true)
        val isTls = isReality || securityParam.equals("tls", ignoreCase = true)

        return V2RayProfile(
            remark = remark,
            address = address,
            port = port,
            protocol = ProtocolType.VLESS,
            uuidOrPassword = uuid,
            sni = queryParams["sni"] ?: queryParams["host"] ?: "",
            network = queryParams["type"] ?: queryParams["net"] ?: "tcp",
            isTls = isTls,
            isReality = isReality,
            publicKey = queryParams["pbk"] ?: queryParams["public-key"] ?: "",
            shortId = queryParams["sid"] ?: queryParams["short-id"] ?: "",
            fingerprint = queryParams["fp"] ?: queryParams["fingerprint"] ?: "chrome",
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

        var queryStr: String? = null
        if (rest.contains("?")) {
            val parts = rest.split("?", limit = 2)
            rest = parts[0]
            queryStr = parts[1]
        }

        val queryParams = parseQueryParams(queryStr)

        var password = ""
        var hostPort = rest
        if (rest.contains("@")) {
            val parts = rest.split("@", limit = 2)
            password = parts[0]
            hostPort = parts[1]
        }

        var address = hostPort
        var port = 443
        if (hostPort.contains(":")) {
            val parts = hostPort.split(":", limit = 2)
            address = parts[0]
            port = parts[1].toIntOrNull() ?: 443
        }

        return V2RayProfile(
            remark = remark,
            address = address,
            port = port,
            protocol = ProtocolType.TROJAN,
            uuidOrPassword = password,
            sni = queryParams["sni"] ?: queryParams["peer"] ?: "",
            network = queryParams["type"] ?: "tcp",
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

    fun generateV2RayConfigJson(
        profile: V2RayProfile,
        localSocksPort: Int = 10808,
        localHttpPort: Int = 10809,
        dnsServer: String = "1.1.1.1",
        enableAdBlock: Boolean = true
    ): String {
        val json = JsonObject()

        // Ultra-low CPU/RAM Logger configuration
        val log = JsonObject().apply {
            addProperty("loglevel", "error")
        }
        json.add("log", log)

        // Custom DoH / DNS Configuration
        val dns = JsonObject().apply {
            val servers = com.google.gson.JsonArray().apply {
                add(dnsServer)
                add("https://dns.adguard-dns.com/dns-query")
                add("8.8.8.8")
            }
            add("servers", servers)
        }
        json.add("dns", dns)

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
                            if (profile.isReality) {
                                addProperty("flow", "xtls-rprx-vision")
                            }
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
                addProperty("network", profile.network.ifEmpty { "tcp" })
                if (profile.isReality) {
                    addProperty("security", "reality")
                    val realitySettings = JsonObject().apply {
                        if (profile.sni.isNotEmpty()) addProperty("serverName", profile.sni)
                        if (profile.publicKey.isNotEmpty()) addProperty("publicKey", profile.publicKey)
                        if (profile.shortId.isNotEmpty()) addProperty("shortId", profile.shortId)
                        addProperty("fingerprint", if (profile.fingerprint.isNotEmpty()) profile.fingerprint else "chrome")
                    }
                    add("realitySettings", realitySettings)
                } else if (profile.isTls) {
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

        val blockOutbound = JsonObject().apply {
            addProperty("tag", "block")
            addProperty("protocol", "blackhole")
        }
        outbounds.add(blockOutbound)

        json.add("outbounds", outbounds)

        // AdBlock & Tracker Blocking Routing Rules
        if (enableAdBlock) {
            val routing = JsonObject().apply {
                addProperty("domainStrategy", "IPIfNonMatch")
                val rules = com.google.gson.JsonArray().apply {
                    val adRule = JsonObject().apply {
                        addProperty("type", "field")
                        val domains = com.google.gson.JsonArray().apply {
                            add("geosite:category-ads-all")
                            add("domain:doubleclick.net")
                            add("domain:adservice.google.com")
                        }
                        add("outboundTag", "block")
                        add("domain", domains)
                    }
                    add(adRule)
                }
                add("rules", rules)
            }
            json.add("routing", routing)
        }

        return Gson().toJson(json)
    }
}
