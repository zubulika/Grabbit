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
    const packagedPath = path.join(process.resourcesPath, 'bin', binaryName)
    if (fs.existsSync(packagedPath)) return packagedPath
  }

  const candidates = [
    path.join(app.getAppPath(), 'resources', 'bin', binaryName),
    path.join(process.cwd(), 'resources', 'bin', binaryName),
    path.join(process.cwd(), 'apps', 'windows', 'resources', 'bin', binaryName),
    path.join(process.cwd(), 'apps', 'windows', 'dist', 'win-unpacked', 'resources', 'bin', binaryName)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return candidates[0]
}

const YT_DLP = () => getBinPath('yt-dlp.exe')
const FFMPEG = () => getBinPath('ffmpeg.exe')

// ─── Update yt-dlp ─────────────────────────────────────────────

/**
 * Runs `yt-dlp -U` to update yt-dlp to the latest upstream version.
 */
export function updateYtDlp() {
  return new Promise((resolve) => {
    try {
      console.log('[Downloader] Running yt-dlp -U update check...')
      const ytdlp = YT_DLP()
      if (!fs.existsSync(ytdlp)) {
        console.warn('[Downloader] yt-dlp binary not found at:', ytdlp)
        return resolve({ success: false, error: 'yt-dlp binary not found' })
      }
      const proc = spawn(ytdlp, ['-U', '--no-warnings'], { windowsHide: true })
      let output = ''
      proc.stdout.on('data', (d) => { output += d.toString() })
      proc.stderr.on('data', (d) => { output += d.toString() })
      proc.on('close', (code) => {
        console.log('[Downloader] yt-dlp update finished with code:', code, output.trim())
        resolve({ success: code === 0, output: output.trim() })
      })
      proc.on('error', (err) => {
        console.error('[Downloader] yt-dlp update error:', err.message)
        resolve({ success: false, error: err.message })
      })
    } catch (e) {
      console.error('[Downloader] yt-dlp update exception:', e.message)
      resolve({ success: false, error: e.message })
    }
  })
}

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

// ─── Direct Media & Image Handlers ─────────────────────────────

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp'])

function getUrlExtension(url) {
  try {
    const pathname = new URL(url).pathname
    const lastPart = pathname.split('/').pop() || ''
    const ext = lastPart.split('.').pop() || ''
    return ext.toLowerCase()
  } catch {
    return ''
  }
}

function cleanTitleFromUrl(url, defaultTitle = 'Downloaded File') {
  try {
    const pathname = new URL(url).pathname
    const lastPart = decodeURIComponent(pathname.split('/').pop() || '')
    const base = lastPart.replace(/\.[^/.]+$/, '').trim()
    return sanitiseFilename(base) || defaultTitle
  } catch {
    return defaultTitle
  }
}

async function fetchDirectMediaInfo(url) {
  const ext = getUrlExtension(url)
  const isImageExt = IMAGE_EXTENSIONS.has(ext)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,video/*,audio/*,*/*'
      },
      signal: AbortSignal.timeout(8000)
    })

    if (res.ok) {
      const contentType = (res.headers.get('content-type') || '').toLowerCase()

      // Check if it's an image
      if (isImageExt || contentType.startsWith('image/')) {
        const resolvedExt = isImageExt ? ext : (contentType.split('/')[1]?.split(';')[0] || 'jpg')
        const title = cleanTitleFromUrl(url, 'Image')
        return {
          title,
          thumbnail: url,
          duration: '',
          channel: new URL(url).hostname,
          formats: [
            {
              id: 'image',
              label: `Download Image (${resolvedExt.toUpperCase()})`,
              type: 'image',
              ext: resolvedExt
            }
          ]
        }
      }

      // Check if it's direct video
      if (contentType.startsWith('video/')) {
        const resolvedExt = contentType.split('/')[1]?.split(';')[0] || 'mp4'
        const title = cleanTitleFromUrl(url, 'Video')
        return {
          title,
          thumbnail: '',
          duration: '',
          channel: new URL(url).hostname,
          formats: [
            { id: 'best', label: `Download Video (${resolvedExt.toUpperCase()})`, type: 'video' },
            { id: 'audio', label: 'Audio Only (MP3)', type: 'audio' }
          ]
        }
      }

      // Check if it's direct audio
      if (contentType.startsWith('audio/')) {
        const title = cleanTitleFromUrl(url, 'Audio')
        return {
          title,
          thumbnail: '',
          duration: '',
          channel: new URL(url).hostname,
          formats: [
            { id: 'audio', label: 'Audio Only (MP3)', type: 'audio' }
          ]
        }
      }
    }
  } catch (e) {
    console.warn('[Downloader] Direct media inspection note:', e.message)
  }

  // If extension is a known image, return image metadata even without headers
  if (isImageExt) {
    return {
      title: cleanTitleFromUrl(url, 'Image'),
      thumbnail: url,
      duration: '',
      channel: new URL(url).hostname,
      formats: [
        {
          id: 'image',
          label: `Download Image (${ext.toUpperCase()})`,
          type: 'image',
          ext
        }
      ]
    }
  }

  return null
}

async function downloadDirectImage(url, format, saveDir, onProgress) {
  console.log('[Downloader] Direct image download initiated:', url)
  const ext = format.ext || getUrlExtension(url) || 'jpg'
  const title = cleanTitleFromUrl(url, 'Image')
  const finalFilename = path.join(saveDir, `${title}.${ext}`)

  onProgress({ percent: 20, size: '-', speed: '-', eta: '...', filename: finalFilename })

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to download image (HTTP ${res.status}: ${res.statusText})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(finalFilename, buffer)

  onProgress({ percent: 100, size: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`, speed: '-', eta: '00:00', filename: finalFilename })
  console.log('[Downloader] Image downloaded successfully to:', finalFilename)
  return finalFilename
}

// ─── Fetch Video Info ──────────────────────────────────────────

/**
 * Retrieves metadata for any URL (video, reel, audio, image, etc.).
 * Returns { title, thumbnail, duration, channel, formats[] }
 */
export async function fetchVideoInfo(url) {
  // Check if it is directly an image link
  if (IMAGE_EXTENSIONS.has(getUrlExtension(url))) {
    const directInfo = await fetchDirectMediaInfo(url)
    if (directInfo) return directInfo
  }

  return new Promise((resolve, reject) => {
    console.log('[Downloader] Fetching media metadata for URL:', url)
    const ytdlp = YT_DLP()
    const args = [
      '--dump-json',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node',
      url
    ]
    const proc = spawn(ytdlp, args, { windowsHide: true })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', async (code) => {
      if (code !== 0) {
        // Fallback: check if it's a direct image or media URL that yt-dlp didn't parse
        const fallback = await fetchDirectMediaInfo(url)
        if (fallback) return resolve(fallback)

        console.error('[Downloader] Failed to fetch media metadata:', stderr || `exit code ${code}`)
        return reject(new Error(stderr || `Unable to fetch media info (code ${code})`))
      }

      try {
        const info = JSON.parse(stdout)
        console.log('[Downloader] Metadata fetched successfully:', info.title)

        const videoFormats = []
        const isImage = info._type === 'image' || IMAGE_EXTENSIONS.has(info.ext?.toLowerCase())

        if (isImage) {
          const imgExt = info.ext || 'jpg'
          videoFormats.push({
            id: 'image',
            label: `Download Image (${imgExt.toUpperCase()})`,
            type: 'image',
            ext: imgExt
          })
        } else {
          // Build dynamic format list supporting resolutions up to 4K (2160p) and 8K (4320p)
          const standardHeights = [4320, 2160, 1440, 1080, 720, 480, 360]

          // Extract all available video heights from info.formats
          const availableHeights = new Set()
          for (const f of (info.formats || [])) {
            if (f.height && f.height > 0 && f.vcodec && f.vcodec !== 'none') {
              availableHeights.add(f.height)
            }
          }

          // Match available heights against standard target categories (highest first)
          for (const targetH of standardHeights) {
            const hasFormat = Array.from(availableHeights).some(
              (h) => (h >= targetH - 10 && h <= targetH + 10) || h === targetH
            )
            if (hasFormat) {
              let label = `${targetH}p MP4`
              if (targetH >= 4320) label = `4320p (8K UHD - MP4)`
              else if (targetH >= 2160) label = `2160p (4K UHD - MP4)`
              else if (targetH >= 1440) label = `1440p (2K QHD - MP4)`
              else if (targetH >= 1080) label = `1080p (Full HD - MP4)`
              else if (targetH >= 720) label = `720p (HD - MP4)`
              else if (targetH >= 480) label = `480p (SD - MP4)`
              else label = `${targetH}p (SD - MP4)`

              videoFormats.push({
                id: `${targetH}p`,
                label,
                height: targetH,
                type: 'video'
              })
            }
          }

          // Fallback: If no standard height matched but video heights exist, add maximum available
          if (videoFormats.length === 0 && availableHeights.size > 0) {
            const maxH = Math.max(...Array.from(availableHeights))
            videoFormats.push({
              id: `${maxH}p`,
              label: `${maxH}p (MP4)`,
              height: maxH,
              type: 'video'
            })
          }

          // Universal fallback: Always provide at least best video format if no heights resolved (e.g. reels/stories)
          if (videoFormats.length === 0) {
            videoFormats.push({
              id: 'best',
              label: 'Best Quality (MP4)',
              type: 'video'
            })
          }

          // Always offer audio-only (MP3) for media streams
          videoFormats.push({
            id: 'audio',
            label: 'Audio Only (MP3)',
            type: 'audio'
          })
        }

        resolve({
          title: info.title || 'Untitled',
          thumbnail: info.thumbnail || '',
          duration: info.duration_string || '',
          channel: info.uploader || '',
          formats: videoFormats
        })
      } catch (err) {
        reject(new Error('Failed to parse media metadata: ' + err.message))
      }
    })

    proc.on('error', (err) => {
      reject(new Error('Failed to start extractor: ' + err.message))
    })
  })
}

// ─── Download Video / Audio / Image ────────────────────────────

/**
 * Internal single-attempt runner for media download.
 */
function runDownloadAttempt(url, format, saveDir, onProgress) {
  // Direct image handling
  if (format?.type === 'image' || format?.id === 'image') {
    return downloadDirectImage(url, format, saveDir, onProgress)
  }

  return new Promise((resolve, reject) => {
    const ytdlp = YT_DLP()
    const ffmpeg = FFMPEG()
    const isAudio = format.type === 'audio'

    // Build the output template
    const suffix = isAudio ? 'audio' : (format.id || 'best')
    const ext = isAudio ? 'mp3' : 'mp4'
    const outputTemplate = path.join(saveDir, `%(title)s-${suffix}.${ext}`)

    const args = [
      '--ffmpeg-location', path.dirname(ffmpeg),
      '--newline',
      '-o', outputTemplate,
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node'
    ]

    if (isAudio) {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else if (format.height) {
      args.push(
        '-S', `res:${format.height},vcodec:h264,acodec:m4a`,
        '-f', `bestvideo[height<=${format.height}]+bestaudio/best[height<=${format.height}]/best`,
        '--merge-output-format', 'mp4',
        '--recode-video', 'mp4'
      )
    } else {
      args.push(
        '-f', 'bestvideo+bestaudio/best',
        '--merge-output-format', 'mp4'
      )
    }

    args.push(url)

    console.log(`[Downloader] Spawning download process: URL="${url}", Format="${format?.id || format?.label}", Dest="${outputTemplate}"`)
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
        console.error('[Downloader] Download failed with code:', code, stderr)
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
            console.log('[Downloader] Download completed successfully:', lastFilename)
            return resolve(lastFilename)
          }
          console.log('[Downloader] Download completed and sanitized:', finalPath)
          return resolve(finalPath)
        }
        console.log('[Downloader] Download completed successfully:', lastFilename)
        return resolve(lastFilename)
      }

      // Fallback — construct expected path
      const fallbackTarget = path.join(saveDir, `download.${ext}`)
      console.log('[Downloader] Download completed (fallback path):', fallbackTarget)
      resolve(fallbackTarget)
    })

    proc.on('error', (err) => {
      reject(new Error('Failed to start yt-dlp: ' + err.message))
    })
  })
}

/**
 * Spawns yt-dlp to download a video/audio.
 * Automatically recovers from HTTP 403 Forbidden by updating yt-dlp and retrying once.
 *
 * @param {string}   url       – Media or file URL
 * @param {object}   format    – { id, type } from fetchVideoInfo
 * @param {string}   saveDir   – Target directory
 * @param {function} onProgress – Called with { percent, speed, eta, filename }
 * @param {boolean}  isRetry   – Internal retry flag
 *
 * @returns {Promise<string>}  – Resolves with the final file path
 */
export async function downloadMedia(url, format, saveDir, onProgress, isRetry = false) {
  try {
    return await runDownloadAttempt(url, format, saveDir, onProgress)
  } catch (err) {
    const is403 = err.message && (err.message.includes('403') || err.message.includes('Forbidden'))
    if (!isRetry && is403) {
      console.log('[Downloader] HTTP 403 Forbidden detected. Attempting yt-dlp update and retry...')
      try {
        await updateYtDlp()
        return await downloadMedia(url, format, saveDir, onProgress, true)
      } catch (retryErr) {
        throw new Error(
          'Media stream access was restricted (HTTP 403). An automatic extractor update was attempted: ' +
          retryErr.message
        )
      }
    }
    throw err
  }
}
