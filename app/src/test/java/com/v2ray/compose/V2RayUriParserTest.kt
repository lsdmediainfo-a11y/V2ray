package com.v2ray.compose

import com.v2ray.compose.model.ProtocolType
import com.v2ray.compose.parser.V2RayUriParser
import org.junit.Assert.*
import org.junit.Test

class V2RayUriParserTest {

    @Test
    fun testVlessParsing() {
        val uri = "vless://a1b2c3d4-e5f6-7890-abcd-ef1234567890@192.168.1.1:443?type=tcp&security=tls&sni=example.com#TestVlessServer"
        val profile = V2RayUriParser.parse(uri)

        assertNotNull(profile)
        assertEquals("TestVlessServer", profile?.remark)
        assertEquals("192.168.1.1", profile?.address)
        assertEquals(443, profile?.port)
        assertEquals(ProtocolType.VLESS, profile?.protocol)
        assertEquals("a1b2c3d4-e5f6-7890-abcd-ef1234567890", profile?.uuidOrPassword)
        assertTrue(profile?.isTls == true)
        assertEquals("example.com", profile?.sni)
    }

    @Test
    fun testTrojanSpecialCharsInRemark() {
        val uri = "trojan://1@14.48--2026.07.18.time:1448?sni=fake_ip_for_sub_link&security=tls#%E2%8F%B3%201.112/5TB%20%F0%9F%93%85%2064%20Days"
        val profile = V2RayUriParser.parse(uri)

        assertNotNull(profile)
        assertEquals("⏳ 1.112/5TB 📅 64 Days", profile?.remark)
        assertEquals("14.48--2026.07.18.time", profile?.address)
        assertEquals(1448, profile?.port)
        assertEquals(ProtocolType.TROJAN, profile?.protocol)
    }

    @Test
    fun testGenerateConfigJson() {
        val uri = "vless://a1b2c3d4-e5f6-7890-abcd-ef1234567890@192.168.1.1:443?type=tcp&security=tls&sni=example.com#TestVlessServer"
        val profile = V2RayUriParser.parse(uri)!!
        val json = V2RayUriParser.generateV2RayConfigJson(profile)

        assertTrue(json.contains("proxy"))
        assertTrue(json.contains("192.168.1.1"))
        assertTrue(json.contains("socks-in"))
    }
}
