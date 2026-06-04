/**
 * Grabbit — Downloader Module
 *
 * Wraps yt-dlp binary calls via child_process.spawn.
 * Parses progress output and emits events back to the renderer via IPC.
 */

import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import { app } from 'electron'
import fs from 'fs'

// ─── Binary Paths ──────────────────────────────────────────────

/**
 * Resolves the path to a bundled binary (yt-dlp or ffmpeg).
 * In dev, binaries live under <project>/resources/bin/
 * In prod, electron-builder extraResources puts them in <app>/resources/bin/
 */
function getBinPath(binaryName) {
  const isPackaged = app.isPackaged
  if (isPackaged) {
    return path.join(process.resourcesPath, 'bin', binaryName)
  }
  // In ESM, __dirname is not available, we use path.resolve
  return path.join(process.cwd(), 'resources/bin', binaryName)
}

const YT_DLP = () => getBinPath('yt-dlp.exe')
const FFMPEG = () => getBinPath('ffmpeg.exe')

// ─── Filename Sanitiser ────────────────────────────────────────

/**
 * Strips characters that are illegal in Windows filenames.
 */
export function sanitiseFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim()
}

// ─── Default Download Folder ───────────────────────────────────

export function defaultDownloadDir() {
  return path.join(os.homedir(), 'Downloads')
}

// ─── Fetch Video Info ──────────────────────────────────────────

/**
 * Runs `yt-dlp --dump-json` to retrieve video metadata.
 * Returns { title, thumbnail, formats[] }
 */
export function fetchVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = YT_DLP()
    const args = ['--dump-json', '--no-warnings', url]
    const proc = spawn(ytdlp, args, { windowsHide: true })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `yt-dlp exited with code ${code}`))
      }

      try {
        const info = JSON.parse(stdout)

        // Build a simplified format list for the UI
        const videoFormats = []
        const heights = [1080, 720, 480]

        for (const h of heights) {
          // Check if this resolution is available
          const match = (info.formats || []).find(
            (f) => f.height === h && f.vcodec !== 'none'
          )
          if (match) {
            videoFormats.push({
              id: `${h}p`,
              label: `${h}p MP4`,
              height: h,
              type: 'video'
            })
          }
        }

        // Always offer audio-only
        videoFormats.push({
          id: 'audio',
          label: 'Audio Only (MP3)',
          type: 'audio'
        })

        resolve({
          title: info.title || 'Untitled',
          thumbnail: info.thumbnail || '',
          duration: info.duration_string || '',
          channel: info.uploader || '',
          formats: videoFormats
        })
      } catch (err) {
        reject(new Error('Failed to parse yt-dlp output: ' + err.message))
      }
    })

    proc.on('error', (err) => {
      reject(new Error('Failed to start yt-dlp: ' + err.message))
    })
  })
}

// ─── Download Video / Audio ────────────────────────────────────

/**
 * Spawns yt-dlp to download a video/audio.
 *
 * @param {string}   url       – YouTube or Facebook URL
 * @param {object}   format    – { id, type } from fetchVideoInfo
 * @param {string}   saveDir   – Target directory
 * @param {function} onProgress – Called with { percent, speed, eta, filename }
 *
 * @returns {Promise<string>}  – Resolves with the final file path
 */
export function downloadMedia(url, format, saveDir, onProgress) {
  return new Promise((resolve, reject) => {
    const ytdlp = YT_DLP()
    const ffmpeg = FFMPEG()
    const isAudio = format.type === 'audio'

    // Build the output template
    // e.g. "Lofi Hip Hop Mix-1080p.mp4" or "Lofi Hip Hop Mix-audio.mp3"
    const suffix = isAudio ? 'audio' : format.id
    const ext = isAudio ? 'mp3' : 'mp4'
    const outputTemplate = path.join(saveDir, `%(title)s-${suffix}.${ext}`)

    const args = [
      '--ffmpeg-location', path.dirname(ffmpeg),
      '--newline', // ensures progress lines end with newline
      '-o', outputTemplate,
      '--no-warnings'
    ]

    if (isAudio) {
      // Extract audio as MP3
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else {
      // Merge best video (up to target height) + best audio into MP4
      args.push(
        '-f', `bestvideo[height<=${format.height}]+bestaudio/best[height<=${format.height}]`,
        '--merge-output-format', 'mp4'
      )
    }

    args.push(url)

    const proc = spawn(ytdlp, args, { windowsHide: true })

    let lastFilename = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n')

      for (const line of lines) {
        // yt-dlp progress output looks like:
        // [download]  45.2% of ~50.00MiB at  2.50MiB/s ETA 00:12
        const progressMatch = line.match(
          /\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/
        )
        if (progressMatch) {
          onProgress({
            percent: parseFloat(progressMatch[1]),
            size: progressMatch[2],
            speed: progressMatch[3],
            eta: progressMatch[4],
            filename: lastFilename
          })
        }

        // Capture the destination filename
        const destMatch = line.match(/\[(?:download|Merger)\]\s+Destination:\s+(.+)/)
        if (destMatch) {
          lastFilename = destMatch[1].trim()
        }

        // Detect already-downloaded
        const alreadyMatch = line.match(/\[download\]\s+(.+)\s+has already been downloaded/)
        if (alreadyMatch) {
          lastFilename = alreadyMatch[1].trim()
        }

        // 100% complete line (sometimes lacks speed/eta)
        const completeMatch = line.match(/\[download\]\s+100%/)
        if (completeMatch) {
          onProgress({
            percent: 100,
            speed: '-',
            eta: '00:00',
            filename: lastFilename
          })
        }
      }
    })

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `yt-dlp exited with code ${code}`))
      }

      // Sanitise the final filename
      if (lastFilename) {
        const dir = path.dirname(lastFilename)
        const base = path.basename(lastFilename)
        const cleanName = sanitiseFilename(base)
        const finalPath = path.join(dir, cleanName)

        // Rename if we stripped characters
        if (cleanName !== base) {
          try {
            fs.renameSync(lastFilename, finalPath)
          } catch {
            // If rename fails, just use original path
            return resolve(lastFilename)
          }
          return resolve(finalPath)
        }
        return resolve(lastFilename)
      }

      // Fallback — construct expected path
      resolve(path.join(saveDir, `download.${ext}`))
    })

    proc.on('error', (err) => {
      reject(new Error('Failed to start yt-dlp: ' + err.message))
    })
  })
}
