/**
 * Grabbit — Main Process Entry
 *
 * Creates the frameless BrowserWindow with a custom titlebar,
 * registers all IPC handlers, and manages app lifecycle events.
 */

import './logger.js'
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc.js'
import { updateYtDlp } from './downloader.js'

/** Keep a global reference so the window isn't garbage-collected */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    resizable: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 32
    },
    backgroundColor: '#0f0f0f',
    show: false, // show after ready-to-show to avoid flash
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Remove default menu bar
  mainWindow.setMenu(null)

  // Graceful show to prevent white flash
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Track maximized state for the custom titlebar
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-change', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-change', false)
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load the renderer — HMR in dev, file in prod
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App Lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  // Set the app user model id for Windows notifications / taskbar
  electronApp.setAppUserModelId('com.grabbit.app')

  // Dev tool shortcuts (F12, etc.) only in dev
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers before creating the window
  registerIpcHandlers()

  createWindow()

  // ─── Auto Updater Configuration ──────────────────────────────────
  autoUpdater.logger = console
  autoUpdater.autoDownload = true // Automatically download update in background
  autoUpdater.autoInstallOnAppQuit = true // Automatically install when user exits
  autoUpdater.autoRunAppAfterInstall = true

  // Open-source / GitHub unsigned release compatibility
  if (process.platform === 'win32') {
    autoUpdater.verifyUpdateCodeSignature = false
  }

  // Explicitly point to the GitHub repository feed
  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'zubulika',
      repo: 'Grabbit'
    })
  } catch (err) {
    console.warn('[Grabbit Update] Could not set feed URL:', err.message)
  }
  
  autoUpdater.on('checking-for-update', () => {
    console.log('[Grabbit Update] Checking for update...')
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', 'checking')
  })
  autoUpdater.on('update-available', (info) => {
    console.log('[Grabbit Update] Update available:', info?.version)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', 'available', info?.version)
  })
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Grabbit Update] Up to date:', info?.version || '')
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', 'not-available', info?.version)
  })
  autoUpdater.on('error', (err) => {
    console.error('[Grabbit Update] Error in auto-updater:', err)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', 'error', err?.message || String(err))
  })
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    console.log(`[Grabbit Update] Progress: ${percent}% (${progressObj.bytesPerSecond} B/s)`)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:progress', percent)
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Grabbit Update] Update downloaded; ready to install:', info?.version)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', 'downloaded', info?.version)
    
    // Prompt the user to restart
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready to Install',
      message: `Grabbit v${info?.version || ''} has been downloaded.`,
      detail: 'Restart Grabbit now to apply the update immediately?',
      buttons: ['Restart & Install', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true)
      }
    }).catch(() => {})
  })

  // Handle manual update checks
  ipcMain.on('updater:check', () => {
    if (is.dev) {
      console.log('[Grabbit Update] Running in development mode; update check bypassed.')
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater:status', 'not-available', 'Dev mode')
      }
      return
    }
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[Grabbit Update] Manual update check error:', err)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater:status', 'error', err.message)
      }
    })
    updateYtDlp().catch((err) => console.error('[Grabbit Update] yt-dlp update error:', err))
  })

  // Handle immediate install trigger from UI button
  ipcMain.on('updater:install', () => {
    console.log('[Grabbit Update] User triggered immediate quit and install.')
    autoUpdater.quitAndInstall(false, true)
  })

  // Start background yt-dlp update check so video/audio extractors stay current
  updateYtDlp().then((res) => {
    if (res?.output) console.log('[Grabbit Update] yt-dlp binary status:', res.output)
  }).catch((err) => {
    console.error('[Grabbit Update] yt-dlp background update failed:', err)
  })

  // Start update check in packaged app after short delay for UI initialization
  if (!is.dev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error('[Grabbit Update] Initial update check error:', err)
      })
    }, 4000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
