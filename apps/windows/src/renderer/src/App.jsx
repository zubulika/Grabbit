/**
 * Grabbit — App Root Component
 *
 * Orchestrates the full UI flow:
 *   1. URL input → 2. Format picker → 3. Progress card
 * Manages app state and communicates with the main process via window.grabbit API.
 */
import React, { useState, useEffect, useCallback } from 'react'
import URLInput from './components/URLInput'
import FormatPicker from './components/FormatPicker'
import ProgressCard from './components/ProgressCard'
import SettingsPanel from './components/SettingsPanel'
import logo from './assets/logo.png'


// ─── App States ─────────────────────────────────────────────────
const VIEW = {
  INPUT: 'input',
  FORMAT: 'format',
  PROGRESS: 'progress',
  SETTINGS: 'settings'
}

// ─── Draggable Titlebar Header ──────────────────────────────────
function Titlebar({ onOpenSettings }) {
  return (
    <div className="titlebar-drag flex items-center justify-between h-8 bg-gb-bg px-3 shrink-0 select-none">
      <div className="flex items-center gap-2 titlebar-no-drag">
        <img src={logo} alt="Grabbit" className="w-4 h-4 object-contain" />
        <span className="text-[10px] font-bold tracking-widest text-gb-text-dim uppercase">Grabbit</span>
      </div>

      {/* Settings icon shifted left to not overlap with Windows native window controls overlay */}
      <div className="flex items-center titlebar-no-drag mr-[140px]">
        <button
          onClick={onOpenSettings}
          className="p-1 text-gb-text-dim hover:text-gb-text hover:bg-white/5 rounded transition-colors"
          title="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [view, setView] = useState(VIEW.INPUT)
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [progress, setProgress] = useState({ percent: 0, speed: '', eta: '', filename: '' })
  const [downloadState, setDownloadState] = useState('idle') // idle | downloading | complete | error
  const [downloadedFilePath, setDownloadedFilePath] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [downloadFolder, setDownloadFolder] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [prevView, setPrevView] = useState(VIEW.INPUT)

  const handleOpenSettings = useCallback(() => {
    setPrevView(view)
    setView(VIEW.SETTINGS)
  }, [view])

  const handleCloseSettings = useCallback(() => {
    setView(prevView)
  }, [prevView])

  // ── Load saved settings and version on mount ──────────────
  useEffect(() => {
    window.grabbit.getSettings().then((settings) => {
      if (settings.downloadFolder) setDownloadFolder(settings.downloadFolder)
    })
    window.grabbit.getVersion().then((ver) => {
      if (ver) setVersion(ver)
    })
  }, [])

  // ── Listen for download progress ──────────────────────────
  useEffect(() => {
    const cleanup = window.grabbit.onDownloadProgress((prog) => {
      setProgress(prog)
    })
    return cleanup
  }, [])

  // ── Fetch video info ──────────────────────────────────────
  const handleFetch = useCallback(async (inputUrl) => {
    setUrl(inputUrl)
    setFetchError('')
    setIsLoading(true)

    const result = await window.grabbit.fetchInfo(inputUrl)

    setIsLoading(false)

    if (result.success) {
      setVideoInfo(result.data)
      setView(VIEW.FORMAT)
    } else {
      setFetchError(result.error || 'Failed to fetch video info')
    }
  }, [])

  // ── Start download ────────────────────────────────────────
  const handleStartDownload = useCallback(async (format) => {
    setSelectedFormat(format)
    setView(VIEW.PROGRESS)
    setDownloadState('downloading')
    setProgress({ percent: 0, speed: '', eta: '', filename: '' })
    setDownloadError('')

    const result = await window.grabbit.startDownload(url, format)

    if (result.success) {
      setDownloadedFilePath(result.filePath)
      setDownloadState('complete')
    } else {
      setDownloadError(result.error || 'Download failed')
      setDownloadState('error')
    }
  }, [url])

  // ── Open folder ───────────────────────────────────────────
  const handleOpenFolder = useCallback(() => {
    window.grabbit.openFolder(downloadedFilePath)
  }, [downloadedFilePath])

  // ── Choose folder ─────────────────────────────────────────
  const handleChooseFolder = useCallback(async () => {
    const result = await window.grabbit.chooseFolder()
    if (result.success) {
      setDownloadFolder(result.folder)
    }
  }, [])

  // ── Reset to start ────────────────────────────────────────
  const handleReset = useCallback(() => {
    setView(VIEW.INPUT)
    setUrl('')
    setVideoInfo(null)
    setSelectedFormat(null)
    setProgress({ percent: 0, speed: '', eta: '', filename: '' })
    setDownloadState('idle')
    setDownloadedFilePath('')
    setDownloadError('')
    setFetchError('')
  }, [])

  // ── Back to format picker ─────────────────────────────────
  const handleBack = useCallback(() => {
    if (view === VIEW.FORMAT) {
      setView(VIEW.INPUT)
      setVideoInfo(null)
      setFetchError('')
    } else if (view === VIEW.PROGRESS && downloadState !== 'downloading') {
      setView(VIEW.FORMAT)
      setDownloadState('idle')
    }
  }, [view, downloadState])

  return (
    <div className="flex flex-col h-full">

      <Titlebar onOpenSettings={handleOpenSettings} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-6 overflow-hidden">
        {/* ── Step 1: URL Input ─────────────────────────────── */}
        {view === VIEW.INPUT && (
          <div className="w-full max-w-xl animate-fade-in">
            {/* Logo / Hero area */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gb-accent/5 mb-4 overflow-hidden">
                <img src={logo} alt="Grabbit Logo" className="w-14 h-14 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-gb-text mb-1">Grabbit</h1>
              <p className="text-sm text-gb-text-muted">
                Paste a YouTube or Facebook link and download in seconds
              </p>
            </div>

            <URLInput
              onFetch={handleFetch}
              isLoading={isLoading}
              error={fetchError}
            />

            {/* Download folder indicator */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gb-text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="truncate max-w-xs">
                {downloadFolder || 'Downloads folder'}
              </span>
              <button
                onClick={handleChooseFolder}
                className="text-gb-accent hover:text-gb-accent-hover transition-colors underline underline-offset-2"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Format Picker ────────────────────────── */}
        {view === VIEW.FORMAT && videoInfo && (
          <div className="w-full max-w-xl animate-slide-up">
            <FormatPicker
              videoInfo={videoInfo}
              onSelect={handleStartDownload}
              onBack={handleBack}
              downloadFolder={downloadFolder}
              onChooseFolder={handleChooseFolder}
            />
          </div>
        )}

        {/* ── Step 3: Progress Card ────────────────────────── */}
        {view === VIEW.PROGRESS && (
          <div className="w-full max-w-xl animate-slide-up">
            <ProgressCard
              videoInfo={videoInfo}
              format={selectedFormat}
              progress={progress}
              state={downloadState}
              filePath={downloadedFilePath}
              error={downloadError}
              onOpenFolder={handleOpenFolder}
              onReset={handleReset}
              onBack={handleBack}
            />
          </div>
        )}

        {/* ── Settings Page ─────────────────────────────────── */}
        {view === VIEW.SETTINGS && (
          <div className="w-full max-w-xl animate-slide-up">
            <SettingsPanel
              onClose={handleCloseSettings}
              downloadFolder={downloadFolder}
              onChooseFolder={handleChooseFolder}
              version={version}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-7 flex items-center justify-center text-[10px] text-gb-text-muted border-t border-gb-border shrink-0">
        Grabbit v{version} — Powered by Grabbit
      </footer>
    </div>
  )
}
