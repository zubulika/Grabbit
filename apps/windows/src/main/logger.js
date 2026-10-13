/**
 * Grabbit — Session Logger (Main Process)
 *
 * Captures all backend / main process output into timestamped session log files
 * located under `<project-root>/logs/` (dev) or `%APPDATA%/Grabbit/logs/` (production).
 *
 * Features:
 * - Unique session log file per application launch: `session_YYYY-MM-DD_HH-mm-ss.log`
 * - Synced `latest.log` pointer for quick inspection
 * - Millisecond-precision timestamps on every single log entry
 * - Intercepts console.log, console.info, console.warn, console.error
 * - Intercepts unhandled exceptions & promise rejections
 * - IPC bridge for UI log ingestion & 1-click "Open Logs Folder"
 */

import { app, shell, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import util from 'util'

// ─── Helpers ────────────────────────────────────────────────────────

function pad(num, length = 2) {
  return String(num).padStart(length, '0')
}

export function formatTimestamp(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  const ms = pad(date.getMilliseconds(), 3)
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms}`
}

function getSessionTimestamp(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`
}

/**
 * Resolves the logs directory path.
 * In dev: recursively locates project root containing `package.json` + `apps/`, returns `<root>/logs`.
 * In prod: returns `%APPDATA%/Grabbit/logs` (or OS user-data directory equivalent).
 */
export function resolveLogDirectory() {
  if (app && app.isPackaged) {
    const prodDir = path.join(app.getPath('userData'), 'logs')
    try {
      if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true })
      return prodDir
    } catch (_) {}
  }

  // Search upwards for project root in development
  let currentDir = process.cwd()
  for (let i = 0; i < 4; i++) {
    const pkgPath = path.join(currentDir, 'package.json')
    const hasApps = fs.existsSync(path.join(currentDir, 'apps'))
    const hasGit = fs.existsSync(path.join(currentDir, '.git'))
    if (fs.existsSync(pkgPath) && (hasApps || hasGit)) {
      const logsDir = path.join(currentDir, 'logs')
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true })
      }
      return logsDir
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  const fallbackDir = path.join(process.cwd(), 'logs')
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true })
  }
  return fallbackDir
}

// ─── Logger Initialization ──────────────────────────────────────────

const logDir = resolveLogDirectory()
const sessionId = getSessionTimestamp()
const logFilename = `session_${sessionId}.log`
const currentLogFile = path.join(logDir, logFilename)
const latestLogFile = path.join(logDir, 'latest.log')

const origLog = console.log.bind(console)
const origInfo = console.info.bind(console)
const origWarn = console.warn.bind(console)
const origError = console.error.bind(console)
const origDebug = (console.debug || console.log).bind(console)

let isInitialized = false

/**
 * Appends a formatted line directly to both the session log file and latest.log.
 */
function appendLog(level, tag, message) {
  const ts = formatTimestamp()
  const tagStr = tag ? ` [${tag}]` : ''
  const line = `[${ts}] [${level}]${tagStr} ${message}\n`

  try {
    fs.appendFileSync(currentLogFile, line, 'utf8')
    fs.appendFileSync(latestLogFile, line, 'utf8')
  } catch (err) {
    origError(`[Logger Error] Failed to write to log file: ${err.message}`)
  }
}

/**
 * Structured logger API
 */
export const logger = {
  info(tag, ...args) {
    const msg = util.format(...args)
    origLog(`[${tag}]`, ...args)
    appendLog('INFO', tag, msg)
  },
  warn(tag, ...args) {
    const msg = util.format(...args)
    origWarn(`[${tag}]`, ...args)
    appendLog('WARN', tag, msg)
  },
  error(tag, ...args) {
    const msg = util.format(...args)
    origError(`[${tag}]`, ...args)
    appendLog('ERROR', tag, msg)
  },
  debug(tag, ...args) {
    const msg = util.format(...args)
    origDebug(`[${tag}]`, ...args)
    appendLog('DEBUG', tag, msg)
  },
  getLogDir() {
    return logDir
  },
  getLogFile() {
    return currentLogFile
  },
  getLatestFile() {
    return latestLogFile
  }
}

export function initLogger() {
  if (isInitialized) return
  isInitialized = true

  // Ensure latest.log is reset or fresh for this session
  try {
    const banner = [
      '='.repeat(80),
      'GRABBIT BACKEND SESSION LOG',
      `Session ID    : ${sessionId}`,
      `Started At    : ${formatTimestamp()} (Local) | ${new Date().toISOString()} (UTC)`,
      `App Version   : ${app?.getVersion ? app.getVersion() : '1.0.1'} (Packaged: ${app?.isPackaged ? 'true' : 'false'})`,
      `Platform      : ${process.platform} (${process.arch})`,
      `Node / Elect  : Node ${process.versions.node} / Electron ${process.versions.electron}`,
      `PID           : ${process.pid}`,
      `Log File      : ${currentLogFile}`,
      '='.repeat(80),
      ''
    ].join('\n')

    fs.writeFileSync(currentLogFile, banner, 'utf8')
    fs.writeFileSync(latestLogFile, banner, 'utf8')
  } catch (err) {
    origError(`[Logger Error] Could not initialize session log header: ${err.message}`)
  }

  // Intercept standard console output
  console.log = (...args) => {
    origLog(...args)
    appendLog('INFO', null, util.format(...args))
  }
  console.info = (...args) => {
    origInfo(...args)
    appendLog('INFO', null, util.format(...args))
  }
  console.warn = (...args) => {
    origWarn(...args)
    appendLog('WARN', null, util.format(...args))
  }
  console.error = (...args) => {
    origError(...args)
    appendLog('ERROR', null, util.format(...args))
  }
  console.debug = (...args) => {
    origDebug(...args)
    appendLog('DEBUG', null, util.format(...args))
  }

  // Capture unhandled rejections and fatal errors
  process.on('uncaughtException', (err) => {
    const stack = err?.stack || String(err)
    origError('[FATAL] Uncaught Exception:', stack)
    appendLog('FATAL', 'Process', `Uncaught Exception: ${stack}`)
  })

  process.on('unhandledRejection', (reason) => {
    const msg = reason?.stack || String(reason)
    origError('[FATAL] Unhandled Rejection:', msg)
    appendLog('FATAL', 'Process', `Unhandled Rejection: ${msg}`)
  })

  // Register IPC handlers for logs
  if (ipcMain?.handle) {
    ipcMain.handle('app:open-logs', async () => {
      try {
        if (fs.existsSync(logDir)) {
          if (shell?.openPath) await shell.openPath(logDir)
          return { success: true, path: logDir }
        }
        return { success: false, error: 'Logs directory not found' }
      } catch (err) {
        return { success: false, error: err.message }
      }
    })

    ipcMain.handle('app:get-log-paths', async () => {
      return {
        logDir,
        currentLogFile,
        latestLogFile,
        sessionId
      }
    })
  }

  // Bridge logs from UI
  if (ipcMain?.on) {
    ipcMain.on('app:log', (_event, payload) => {
      const level = (payload?.level || 'INFO').toUpperCase()
      const tag = payload?.tag || 'Renderer'
      const message = payload?.message || String(payload)
      appendLog(level, tag, message)
    })
  }

  // Log clean shutdown on quit
  if (app?.on) {
    app.on('will-quit', () => {
      appendLog('INFO', 'Main', 'Grabbit application shutting down. Session ended cleanly.')
    })
  }

  origLog(`[Grabbit Logger] Session logging active -> ${currentLogFile}`)
}

// Auto-initialize on module import
initLogger()
