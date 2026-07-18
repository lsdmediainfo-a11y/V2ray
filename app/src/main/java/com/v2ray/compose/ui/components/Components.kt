package com.v2ray.compose.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.v2ray.compose.ui.theme.*

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(CardDark.copy(alpha = 0.75f))
            .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
            .padding(16.dp),
        content = content
    )
}

@Composable
fun LiveSpeedMeter(
    uploadSpeedKbps: Double,
    downloadSpeedKbps: Double,
    modifier: Modifier = Modifier
) {
    val downloadHistory = remember { mutableStateListOf<Float>() }
    val uploadHistory = remember { mutableStateListOf<Float>() }

    LaunchedEffect(downloadSpeedKbps, uploadSpeedKbps) {
        if (downloadHistory.size > 20) downloadHistory.removeAt(0)
        if (uploadHistory.size > 20) uploadHistory.removeAt(0)
        downloadHistory.add(downloadSpeedKbps.toFloat())
        uploadHistory.add(uploadSpeedKbps.toFloat())
    }

    GlassCard(modifier = modifier) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Download speed
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("DOWNLOAD", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    Text(
                        text = String.format("%.1f KB/s", downloadSpeedKbps),
                        style = MaterialTheme.typography.titleMedium,
                        color = PrimaryNeonCyan
                    )
                }
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(GlassBorder)
                )
                // Upload speed
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("UPLOAD", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    Text(
                        text = String.format("%.1f KB/s", uploadSpeedKbps),
                        style = MaterialTheme.typography.titleMedium,
                        color = PrimaryNeonEmerald
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Real-Time Neon Speed Canvas Graph
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(BackgroundDark.copy(alpha = 0.5f))
            ) {
                val w = size.width
                val h = size.height

                val maxDl = (downloadHistory.maxOrNull() ?: 100f).coerceAtLeast(10f)
                val maxUl = (uploadHistory.maxOrNull() ?: 100f).coerceAtLeast(10f)

                if (downloadHistory.size > 1) {
                    val dlPath = Path()
                    val step = w / (downloadHistory.size - 1)
                    downloadHistory.forEachIndexed { i, speed ->
                        val x = i * step
                        val y = h - (speed / maxDl * (h * 0.8f)) - (h * 0.1f)
                        if (i == 0) dlPath.moveTo(x, y) else dlPath.lineTo(x, y)
                    }
                    drawPath(
                        path = dlPath,
                        color = PrimaryNeonCyan,
                        style = Stroke(width = 3f)
                    )
                }

                if (uploadHistory.size > 1) {
                    val ulPath = Path()
                    val step = w / (uploadHistory.size - 1)
                    uploadHistory.forEachIndexed { i, speed ->
                        val x = i * step
                        val y = h - (speed / maxUl * (h * 0.8f)) - (h * 0.1f)
                        if (i == 0) ulPath.moveTo(x, y) else ulPath.lineTo(x, y)
                    }
                    drawPath(
                        path = ulPath,
                        color = PrimaryNeonEmerald,
                        style = Stroke(width = 3f)
                    )
                }
            }
        }
    }
}

@Composable
fun LatencyBadge(pingMs: Int) {
    val (color, text) = when {
        pingMs < 0 -> Pair(TextMuted, "N/A")
        pingMs < 150 -> Pair(StatusConnected, "${pingMs}ms")
        pingMs < 300 -> Pair(StatusConnecting, "${pingMs}ms")
        else -> Pair(StatusDisconnected, "${pingMs}ms")
    }

    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.4f))
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = color
        )
    }
}
