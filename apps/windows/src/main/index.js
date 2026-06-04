/**
 * Grabbit — Main Process Entry
 *
 * Creates the frameless BrowserWindow with a custom titlebar,
 * registers all IPC handlers, and manages app lifecycle events.
 */

import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc.js'

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
  
  autoUpdater.on('checking-for-update', () => {
    console.log('[Grabbit Update] Checking for update...')
    if (mainWindow) mainWindow.webContents.send('updater:status', 'checking')
  })
  autoUpdater.on('update-available', (info) => {
    console.log('[Grabbit Update] Update available:', info.version)
    if (mainWindow) mainWindow.webContents.send('updater:status', 'available', info.version)
  })
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Grabbit Update] Update not available:', info ? info.version : '')
    if (mainWindow) mainWindow.webContents.send('updater:status', 'not-available')
  })
  autoUpdater.on('error', (err) => {
    console.error('[Grabbit Update] Error in auto-updater:', err)
    if (mainWindow) mainWindow.webContents.send('updater:status', 'error', err.message)
  })
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[Grabbit Update] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`)
    if (mainWindow) mainWindow.webContents.send('updater:progress', progressObj.percent)
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Grabbit Update] Update downloaded; will install on restart.')
    if (mainWindow) mainWindow.webContents.send('updater:status', 'downloaded', info.version)
    
    // Prompt the user to restart
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `A new version (${info.version}) of Grabbit has been downloaded.`,
      detail: 'Would you like to restart the application to apply the update now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(true, true)
      }
    })
  })

  // Handle manual update checks
  ipcMain.on('updater:check', () => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  // Start update check in packaged app
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
