/**
 * Grabbit — IPC Handlers (Main Process)
 *
 * All inter-process communication handlers live here.
 * The renderer calls these via the contextBridge-exposed API.
 */

import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { fetchVideoInfo, downloadMedia, defaultDownloadDir } from './downloader.js'

// ─── Persistent Settings ───────────────────────────────────────
const store = new Store({
  name: 'grabbit-settings',
  defaults: {
    downloadFolder: defaultDownloadDir(),
    preferredFormat: '1080p',
    theme: 'dark'
  }
})

// ─── Window Control ────────────────────────────────────────────

function setupWindowControls() {
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
  })
}

// ─── IPC Handler Registration ──────────────────────────────────

export function registerIpcHandlers() {
  setupWindowControls()

  // ── Fetch video info ──────────────────────────────────────
  ipcMain.handle('fetch-info', async (_event, url) => {
    try {
      const info = await fetchVideoInfo(url)
      return { success: true, data: info }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // ── Start download ────────────────────────────────────────
  ipcMain.handle('start-download', async (event, { url, format }) => {
    const saveDir = store.get('downloadFolder') || defaultDownloadDir()

    try {
      const filePath = await downloadMedia(url, format, saveDir, (progress) => {
        // Stream progress updates back to the renderer
        event.sender.send('download-progress', progress)
      })

      // Store the preferred format for next time
      store.set('preferredFormat', format.id)

      return { success: true, filePath }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // ── Open folder containing the downloaded file ────────────
  ipcMain.handle('open-folder', async (_event, filePath) => {
    if (filePath) {
      // Reveal the specific file in Explorer
      shell.showItemInFolder(filePath)
    } else {
      // Open the downloads folder
      const folder = store.get('downloadFolder') || defaultDownloadDir()
      shell.openPath(folder)
    }
  })

  // ── Choose download folder ────────────────────────────────
  ipcMain.handle('choose-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose Download Folder',
      defaultPath: store.get('downloadFolder') || defaultDownloadDir(),
      properties: ['openDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const chosen = result.filePaths[0]
      store.set('downloadFolder', chosen)
      return { success: true, folder: chosen }
    }

    return { success: false }
  })

  // ── Settings: Get ─────────────────────────────────────────
  ipcMain.handle('settings:get', async () => {
    return {
      downloadFolder: store.get('downloadFolder'),
      preferredFormat: store.get('preferredFormat'),
      theme: store.get('theme')
    }
  })

  // ── Settings: Set ─────────────────────────────────────────
  ipcMain.handle('settings:set', async (_event, { key, value }) => {
    store.set(key, value)
    return { success: true }
  })
}
