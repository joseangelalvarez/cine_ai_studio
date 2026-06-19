package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = CinemaGold,
    secondary = CinemaGoldVariant,
    tertiary = CineCyan,
    background = CinemaCoalDark,
    surface = CinemaCoalSurface,
    surfaceVariant = CinemaCarbonBox,
    onBackground = PaleWhite,
    onSurface = PaleWhite
  )

private val LightColorScheme = DarkColorScheme

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force cinematic dark console
  dynamicColor: Boolean = false, // Maintain custom brand color identity
  content: @Composable () -> Unit,
) {
  val colorScheme = DarkColorScheme

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
