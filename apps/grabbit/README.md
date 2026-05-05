# Grabbit

A modern YouTube & multi-platform video/audio downloader desktop app built with Electron, React, and Tailwind CSS.

## Prerequisites

Place the following binaries in `resources/bin/`:
- `yt-dlp.exe` — [Download](https://github.com/yt-dlp/yt-dlp/releases)
- `ffmpeg.exe` — [Download](https://www.gyan.dev/ffmpeg/builds/)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:win
```

## Tech Stack

- **Electron** + **electron-vite** — Desktop shell & build toolchain
- **React 18** + **Tailwind CSS v3** — UI
- **yt-dlp** + **ffmpeg** — Download engine
- **electron-store** — Persistent settings
- **electron-builder** — Packaging (Windows NSIS)