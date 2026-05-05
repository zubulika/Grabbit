/**
 * Grabbit — Preload Script
 *
 * Exposes a safe, typed API to the renderer process via contextBridge.
 * This is the ONLY bridge between the sandboxed renderer and Node.js APIs.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('grabbit', {
  // ── Video Info ─────────────────────────────────────────────
  fetchInfo: (url) => ipcRenderer.invoke('fetch-info', url),

  // ── Download ───────────────────────────────────────────────
  startDownload: (url, format) =>
    ipcRenderer.invoke('start-download', { url, format }),

  onDownloadProgress: (callback) => {
    const handler = (_event, progress) => callback(progress)
    ipcRenderer.on('download-progress', handler)
    // Return cleanup function
    return () => ipcRenderer.removeListener('download-progress', handler)
  },

  // ── File Operations ────────────────────────────────────────
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),

  // ── Settings ───────────────────────────────────────────────
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),

  // ── Window Controls (frameless titlebar) ───────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  onMaximizedChange: (callback) => {
    const handler = (_event, state) => callback(state)
    ipcRenderer.on('window:maximized-change', handler)
    return () => ipcRenderer.removeListener('window:maximized-change', handler)
  }
})
