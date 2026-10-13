# Grabbit for Android (Native Kotlin + Jetpack Compose)

This is the pure native Android application for **Grabbit**, built with modern Kotlin, Jetpack Compose, Material 3, and Coroutines.

---

## 🎨 Design Language
- **Background**: `#0F0F0F` (`GbBg`)
- **Card Surface**: `#181818` (`GbSurface`)
- **Elevated Controls**: `#212121` (`GbSurfaceLight`)
- **Accent**: `#FF0000` / `#CC0000` (`GbAccent`)

---

## 📱 Features Implemented
1. **URL Grabber & Clipboard Paste**: One-click paste and automatic link detection.
2. **Android Share Intent Support**: Allows users to tap "Share" inside the YouTube app or browser and choose **Grabbit** to instantly analyze and download.
3. **Format & Stream Picker**: Segmented Video / Audio selector with resolution badges (1080p, 720p, MP3 320kbps).
4. **Live Download Progress Card**: Real-time progress bar, speed (MB/s), ETA, pause/resume, and completed file playback actions.
5. **Downloads Library Tab**: Dedicated tab listing all downloaded media.
6. **Preferences Sheet**: Configurable storage directories and future Firebase sync integration point.

---

## 🚀 How to Run & Build

### Option 1: Using Android Studio (Recommended for Beginners)
1. Open Android Studio.
2. Select **Open** and choose the `apps/android` directory.
3. Allow Gradle to sync dependencies.
4. Click the green **Run** button to launch on an emulator or connected phone.

### Option 2: Command Line / VS Code
Ensure you have **JDK 17+** and the **Android SDK** installed:

```bash
cd apps/android
./gradlew assembleDebug
```
To install directly to a connected device:
```bash
./gradlew installDebug
```
