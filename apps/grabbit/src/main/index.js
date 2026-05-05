/**
 * Grabbit — Main Process Entry
 *
 * Creates the frameless BrowserWindow with a custom titlebar,
 * registers all IPC handlers, and manages app lifecycle events.
 */

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
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
    frame: false, // frameless — we render our own titlebar
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
