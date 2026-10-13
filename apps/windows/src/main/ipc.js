/**
 * Grabbit — IPC Handlers (Main Process)
 *
 * All inter-process communication handlers live here.
 * The renderer calls these via the contextBridge-exposed API.
 */

import { ipcMain, dialog, shell, BrowserWindow, app } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { fetchVideoInfo, downloadMedia, defaultDownloadDir, updateYtDlp } from './downloader.js'

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

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
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
    console.log('[IPC] fetch-info invoked for URL:', url)
    try {
      const info = await fetchVideoInfo(url)
      return { success: true, data: info }
    } catch (err) {
      console.error('[IPC] fetch-info error:', err.message)
      return { success: false, error: err.message }
    }
  })

  // ── Start download ────────────────────────────────────────
  ipcMain.handle('start-download', async (event, { url, format }) => {
    const saveDir = store.get('downloadFolder') || defaultDownloadDir()
    console.log('[IPC] start-download invoked:', { url, format: format?.id, saveDir })

    try {
      const filePath = await downloadMedia(url, format, saveDir, (progress) => {
        // Stream progress updates back to the renderer
        event.sender.send('download-progress', progress)
      })

      // Store the preferred format for next time
      store.set('preferredFormat', format.id)

      console.log('[IPC] start-download finished successfully:', filePath)
      return { success: true, filePath }
    } catch (err) {
      console.error('[IPC] start-download failed:', err.message)
      return { success: false, error: err.message }
    }
  })

  // ── Open folder containing the downloaded file ────────────
  ipcMain.handle('open-folder', async (_event, filePath) => {
    if (filePath) {
      console.log('[IPC] Revealing item in folder:', filePath)
      shell.showItemInFolder(filePath)
    } else {
      const folder = store.get('downloadFolder') || defaultDownloadDir()
      console.log('[IPC] Opening download directory:', folder)
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
      console.log('[IPC] Download folder updated to:', chosen)
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
    console.log(`[IPC] Setting updated: ${key} =`, value)
    store.set(key, value)
    return { success: true }
  })

  // ── Get App Version ───────────────────────────────────────
  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // ── Update Extractor Binary (yt-dlp) ──────────────────────
  ipcMain.handle('update-ytdlp', async () => {
    console.log('[IPC] Extractor update requested')
    return await updateYtDlp()
  })
}
