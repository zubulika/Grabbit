---
name: windows-release-cicd
description: Automated CI/CD pipeline blueprint and release management protocol for building Windows Electron installers (.exe), compiling release notes & changelogs from git history, attaching differential update assets, and publishing GitHub Releases.
---

# Windows App CI/CD & Automated GitHub Release Standard

This skill establishes the production standard for automating Windows application builds (`.exe` NSIS installer), bundling runtime engines (`yt-dlp.exe` and `ffmpeg.exe`), generating release notes and changelogs, computing cryptographic checksums (SHA-256), and publishing official GitHub Releases configured for Electron Auto-Updater (`electron-updater`).

---

## 🧭 System Architecture & Release Flow

```
┌─────────────────────────────────┐
│       Trigger Event             │
│  • Push tag: vX.Y.Z             │
│  • workflow_dispatch (Manual)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     windows-latest Runner       │
│  1. Checkout with full history  │
│  2. Setup Node.js 20 & cache    │
│  3. Sync package.json version   │
│  4. Acquire yt-dlp & FFmpeg     │
│  5. Compile Vite & Electron     │
│  6. Generate NSIS Installer     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       Release Packaging         │
│  • GrabbitSetup.exe             │
│  • GrabbitSetup-vX.Y.Z.exe      │
│  • latest.yml (auto-updater)    │
│  • .blockmap (differential)     │
│  • SHA256SUMS.txt               │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     GitHub Release Publish      │
│  • Automated Changelog & PRs    │
│  • SHA-256 Checksums table      │
│  • All installer binaries live  │
└─────────────────────────────────┘
```

---

## 📦 Critical Components for Windows Desktop Apps

### 1. The Auto-Updater Triad
Electron applications using `electron-updater` require three essential files in the GitHub Release assets to enable seamless background and differential updates:
1. **`GrabbitSetup.exe`**: The primary executable installer specified in `latest.yml`.
2. **`latest.yml`**: Contains version, sha512 hash, and file size of the installer.
3. **`GrabbitSetup.exe.blockmap`**: Enables differential downloads so users only download byte deltas during updates instead of downloading the entire ~400MB installer.

### 2. Bundled Engine Binaries (`extraResources`)
Video downloaders and media processing applications rely on external executables (`yt-dlp.exe` and `ffmpeg.exe`). Because binaries are typically git-ignored (`**/resources/bin/*`), CI runners must acquire them prior to running `electron-builder`:
- **yt-dlp**: Download the latest binary from GitHub Releases:
  ```powershell
  curl.exe -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -o "$binDir/yt-dlp.exe"
  ```
- **FFmpeg**: Locate preinstalled system FFmpeg on the Windows runner or install via Chocolatey:
  ```powershell
  $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($ffmpeg) {
    Copy-Item $ffmpeg.Source "$binDir/ffmpeg.exe" -Force
  } else {
    choco install ffmpeg --no-progress -y
    Copy-Item (Get-Command ffmpeg).Source "$binDir/ffmpeg.exe" -Force
  }
  ```

### 3. Repository Permissions
GitHub Actions requires explicit write permissions to create releases and upload binary assets:
```yaml
permissions:
  contents: write
```

---

## 🚀 Execution Procedures

### Option A: Release via Git Semantic Tag (Recommended)

1. **Verify or bump version** in `apps/windows/package.json`:
   ```bash
   git status
   ```
2. **Create annotated git tag**:
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1"
   ```
3. **Push tag to origin**:
   ```bash
   git push origin v1.0.1
   ```
4. **Monitor GitHub Actions**:
   ```bash
   gh run watch
   ```

---

### Option B: Release via GitHub CLI / Manual Trigger (`workflow_dispatch`)

Trigger without creating a local git tag immediately:
```bash
# Trigger manual build with specific tag
gh workflow run windows-release.yml -f release_tag=v1.0.1

# Or with custom release notes
gh workflow run windows-release.yml -f release_tag=v1.0.1 -f custom_notes="Bug fixes for YouTube 4K stream extraction"
```

---

### Option C: 1-Click Release from `build.py`

When using the desktop builder GUI (`python build.py`):
1. Adjust the Major, Minor, Patch spinboxes to the target version.
2. Click **Start Build Process** to run a local sanity check.
3. Click **Tag & Trigger GitHub Release (CI/CD)** to automatically commit, tag, and push to GitHub.

---

## 📋 GitHub Actions Workflow Reference

The production workflow resides at `.github/workflows/windows-release.yml`:

```yaml
name: Build & Release Windows App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      release_tag:
        description: 'Tag name for manual release (e.g. v1.0.0)'
        required: false
        default: 'latest'
      is_draft:
        description: 'Create as draft release'
        type: boolean
        required: false
        default: false
      is_prerelease:
        description: 'Mark as pre-release'
        type: boolean
        required: false
        default: false
      custom_notes:
        description: 'Optional custom release notes prefix'
        required: false
        default: ''

permissions:
  contents: write

jobs:
  build-and-release:
    name: Build Windows EXE & Release
    runs-on: windows-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Determine Target Version
        id: version_step
        shell: pwsh
        run: |
          $ref = "${{ github.ref_name }}"
          $inputTag = "${{ inputs.release_tag }}"
          
          if ($ref -and $ref -ne "main" -and $ref -ne "master") {
            $tag = $ref
          } elseif ($inputTag -and $inputTag -ne "latest") {
            $tag = $inputTag
          } else {
            $pkg = Get-Content "apps/windows/package.json" -Raw | ConvertFrom-Json
            $tag = "v$($pkg.version)"
          }
          
          $cleanVersion = $tag.TrimStart('v')
          Write-Host "Resolved release tag: $tag (Version: $cleanVersion)"
          "TAG=$tag" | Out-File -FilePath $env:GITHUB_OUTPUT -Append
          "VERSION=$cleanVersion" | Out-File -FilePath $env:GITHUB_OUTPUT -Append

      - name: Sync package.json Version
        shell: pwsh
        run: |
          $ver = "${{ steps.version_step.outputs.VERSION }}"
          $pkgPath = "apps/windows/package.json"
          $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
          $pkg.version = $ver
          $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
          Write-Host "Synchronized $pkgPath version to $ver"

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Prepare Bundled Binaries (yt-dlp & FFmpeg)
        shell: pwsh
        run: |
          $binDir = "apps/windows/resources/bin"
          New-Item -ItemType Directory -Force -Path $binDir | Out-Null
          
          Write-Host "Downloading yt-dlp.exe..."
          curl.exe -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -o "$binDir/yt-dlp.exe"
          
          Write-Host "Resolving FFmpeg..."
          $ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
          if ($ffmpegCmd) {
            $ffmpegPath = $ffmpegCmd.Source
            Write-Host "Using pre-installed FFmpeg from: $ffmpegPath"
            Copy-Item $ffmpegPath "$binDir/ffmpeg.exe" -Force
          } else {
            Write-Host "Installing FFmpeg via chocolatey..."
            choco install ffmpeg --no-progress -y
            $ffmpegCmd = Get-Command ffmpeg
            Copy-Item $ffmpegCmd.Source "$binDir/ffmpeg.exe" -Force
          }
          
          $ytDlp = Get-Item "$binDir/yt-dlp.exe"
          $ffmpeg = Get-Item "$binDir/ffmpeg.exe"
          
          Write-Host "yt-dlp: $($ytDlp.Length) bytes"
          Write-Host "ffmpeg: $($ffmpeg.Length) bytes"
          
          if ($ytDlp.Length -lt 1000000 -or $ffmpeg.Length -lt 1000000) {
            Write-Error "Engine binaries appear corrupted or incomplete!"
            exit 1
          }

      - name: Build Electron App for Windows
        run: npm run build:win -w apps/windows
        env:
          ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true'

      - name: Prepare & Verify Release Assets
        id: stage_assets
        shell: pwsh
        run: |
          $dist = "apps/windows/dist"
          $tag = "${{ steps.version_step.outputs.TAG }}"
          $setupExe = "$dist/GrabbitSetup.exe"
          
          if (-not (Test-Path $setupExe)) {
            Write-Error "Build artifact GrabbitSetup.exe not found in $dist!"
            exit 1
          }
          
          # Versioned installer copy
          $versionedExe = "$dist/GrabbitSetup-$tag.exe"
          Copy-Item $setupExe $versionedExe -Force
          
          # SHA-256 Checksum
          $hash = (Get-FileHash $setupExe -Algorithm SHA256).Hash
          $checksumFile = "$dist/SHA256SUMS.txt"
          "$hash  GrabbitSetup.exe" | Out-File -FilePath $checksumFile -Encoding utf8
          "$hash  GrabbitSetup-$tag.exe" | Out-File -FilePath $checksumFile -Append -Encoding utf8
          
          Write-Host "Installer SHA256: $hash"
          "INSTALLER_HASH=$hash" | Out-File -FilePath $env:GITHUB_OUTPUT -Append

      - name: Upload Artifacts to GitHub Action Run
        uses: actions/upload-artifact@v4
        with:
          name: Grabbit-Windows-${{ steps.version_step.outputs.TAG }}
          path: |
            apps/windows/dist/GrabbitSetup.exe
            apps/windows/dist/GrabbitSetup-*.exe
            apps/windows/dist/GrabbitSetup.exe.blockmap
            apps/windows/dist/latest.yml
            apps/windows/dist/SHA256SUMS.txt
          retention-days: 14

      - name: Prepare Release Notes Header
        id: release_notes
        shell: pwsh
        run: |
          $tag = "${{ steps.version_step.outputs.TAG }}"
          $hash = "${{ steps.stage_assets.outputs.INSTALLER_HASH }}"
          $customNotes = "${{ inputs.custom_notes }}"
          
          $lines = @(
            "## 🚀 Grabbit Windows $tag",
            ""
          )
          if ($customNotes) {
            $lines += $customNotes
            $lines += ""
          }
          $lines += @(
            "### 📦 Downloads & Assets",
            "| Asset | Description |",
            "|---|---|",
            "| **[GrabbitSetup.exe](https://github.com/zubulika/Grabbit/releases/download/$tag/GrabbitSetup.exe)** | Standard Windows x64 Installer (Recommended) |",
            "| **[GrabbitSetup-$tag.exe](https://github.com/zubulika/Grabbit/releases/download/$tag/GrabbitSetup-$tag.exe)** | Version-stamped standalone installer |",
            "| **latest.yml & .blockmap** | Electron Auto-updater differential assets |",
            "",
            "### 🔒 Checksums (SHA-256)",
            "````",
            "$hash  GrabbitSetup.exe",
            "````",
            "",
            "---"
          )
          $lines -join "`r`n" | Out-File -FilePath "release_notes.md" -Encoding utf8

      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/') || github.event_name == 'workflow_dispatch'
        with:
          tag_name: ${{ steps.version_step.outputs.TAG }}
          name: "Grabbit Windows ${{ steps.version_step.outputs.TAG }}"
          body_path: release_notes.md
          generate_release_notes: true
          draft: ${{ inputs.is_draft || false }}
          prerelease: ${{ inputs.is_prerelease || false }}
          files: |
            apps/windows/dist/GrabbitSetup.exe
            apps/windows/dist/GrabbitSetup-*.exe
            apps/windows/dist/GrabbitSetup.exe.blockmap
            apps/windows/dist/latest.yml
            apps/windows/dist/SHA256SUMS.txt
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🛠️ Verification Checklist

- [x] **Git Tags**: Tags follow semantic format (`v1.0.0`, `v1.0.1`).
- [x] **Release Notes**: Automatically compiled using `generate_release_notes: true` based on PRs and commits.
- [x] **Binaries**: `yt-dlp.exe` and `ffmpeg.exe` verified present in `resources/bin` during build.
- [x] **Auto-Update**: `latest.yml` and `.blockmap` uploaded alongside the `.exe` so the app updates itself in production.
- [x] **Integrity**: SHA-256 checksum generated and displayed in release notes.
