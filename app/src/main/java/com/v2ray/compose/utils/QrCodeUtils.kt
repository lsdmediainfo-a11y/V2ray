package com.v2ray.compose.utils

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.v2ray.compose.model.V2RayProfile
import java.net.URLEncoder

object QrCodeUtils {

    fun generateQrCodeBitmap(text: String, width: Int = 512, height: Int = 512): Bitmap? {
        return try {
            val hints = hashMapOf<EncodeHintType, Any>()
            hints[EncodeHintType.MARGIN] = 1
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, width, height, hints)
            val w = bitMatrix.width
            val h = bitMatrix.height
            val pixels = IntArray(w * h)
            for (y in 0 until h) {
                for (x in 0 until w) {
                    pixels[y * w + x] = if (bitMatrix.get(x, y)) Color.BLACK else Color.WHITE
                }
            }
            val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
            bitmap
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun profileToUri(profile: V2RayProfile): String {
        val encodedRemark = try { URLEncoder.encode(profile.remark, "UTF-8") } catch (e: Exception) { profile.remark }
        return when (profile.protocol.name.lowercase()) {
            "vless" -> {
                val sec = if (profile.isReality) "security=reality&pbk=${profile.publicKey}&sid=${profile.shortId}&fp=${profile.fingerprint}" else if (profile.isTls) "security=tls" else "security=none"
                "vless://${profile.uuidOrPassword}@${profile.address}:${profile.port}?type=${profile.network}&sni=${profile.sni}&$sec#$encodedRemark"
            }
            "trojan" -> {
                "trojan://${profile.uuidOrPassword}@${profile.address}:${profile.port}?sni=${profile.sni}#$encodedRemark"
            }
            else -> {
                "vless://${profile.uuidOrPassword}@${profile.address}:${profile.port}?type=${profile.network}&sni=${profile.sni}#$encodedRemark"
            }
        }
    }
}
