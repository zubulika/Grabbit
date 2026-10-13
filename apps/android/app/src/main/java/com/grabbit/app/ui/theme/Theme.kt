package com.grabbit.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val GrabbitColorScheme = darkColorScheme(
    primary = GbAccent,
    onPrimary = GbText,
    primaryContainer = GbAccentSoft,
    onPrimaryContainer = GbText,
    secondary = GbSurfaceLight,
    onSecondary = GbText,
    background = GbBg,
    onBackground = GbText,
    surface = GbSurface,
    onSurface = GbText,
    surfaceVariant = GbSurfaceLight,
    onSurfaceVariant = GbTextDim,
    outline = GbBorder,
    error = GbError,
    onError = GbText
)

@Composable
fun GrabbitTheme(
    darkTheme: Boolean = true, // Grabbit defaults to signature ultra-dark aesthetic
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = GbBg.toArgb()
            window.navigationBarColor = GbBg.toArgb()
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = false
            insetsController.isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = GrabbitColorScheme,
        typography = Typography,
        content = content
    )
}
