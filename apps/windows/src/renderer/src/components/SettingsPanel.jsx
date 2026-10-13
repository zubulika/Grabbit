import React, { useState, useEffect } from 'react'

export default function SettingsPanel({ onClose, downloadFolder, onChooseFolder, version }) {
  const [preferredFormat, setPreferredFormat] = useState('1080p')
  const [updaterStatus, setUpdaterStatus] = useState('idle') // idle | checking | available | not-available | downloading | downloaded | error
  const [updaterProgress, setUpdaterProgress] = useState(0)
  const [availableVersion, setAvailableVersion] = useState('')
  const [updaterError, setUpdaterError] = useState('')
  const [logPaths, setLogPaths] = useState(null)

  // Load current settings on mount
  useEffect(() => {
    window.grabbit.getSettings().then((settings) => {
      if (settings.preferredFormat) setPreferredFormat(settings.preferredFormat)
    })
    window.grabbit.getLogPaths?.().then((paths) => {
      if (paths) setLogPaths(paths)
    })
  }, [])

  // Listen to auto-updater status updates
  useEffect(() => {
    const removeStatusListener = window.grabbit.onUpdaterStatus((status, info) => {
      setUpdaterStatus(status)
      if (status === 'available') {
        setAvailableVersion(info || '')
        setUpdaterProgress(0)
      } else if (status === 'downloaded') {
        setAvailableVersion(info || '')
      } else if (status === 'error') {
        setUpdaterError(info || 'An error occurred during update check')
      }
    })

    const removeProgressListener = window.grabbit.onUpdaterProgress((percent) => {
      setUpdaterStatus('downloading')
      setUpdaterProgress(Math.round(percent))
    })

    return () => {
      removeStatusListener()
      removeProgressListener()
    }
  }, [])

  const handleFormatChange = (e) => {
    const value = e.target.value
    setPreferredFormat(value)
    window.grabbit.setSetting('preferredFormat', value)
  };

  const triggerUpdateCheck = () => {
    setUpdaterStatus('checking')
    setUpdaterError('')
    window.grabbit.checkForUpdates()

    // Safety fallback in case of network timeout
    setTimeout(() => {
      setUpdaterStatus((cur) => (cur === 'checking' ? 'not-available' : cur))
    }, 10000)
  };

  return (
    <div className="w-full bg-gb-surface rounded-gb border border-gb-border p-6 shadow-gb flex flex-col gap-6 animate-slide-up text-gb-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gb-border pb-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gb-accent">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <h2 className="text-lg font-bold">Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded transition-colors text-gb-text-dim hover:text-gb-text"
          title="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="flex flex-col gap-5">
        {/* Preference: Preferred Format/Resolution */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gb-text-dim">
            Preferred Format
          </label>
          <div className="relative">
            <select
              value={preferredFormat}
              onChange={handleFormatChange}
              className="w-full bg-[#212121] border border-gb-border rounded-gb-sm px-3 py-2 text-sm text-gb-text outline-none focus:border-gb-accent/50 appearance-none cursor-pointer"
            >
              <option value="2160p">2160p (4K UHD - MP4)</option>
              <option value="1440p">1440p (2K QHD - MP4)</option>
              <option value="1080p">1080p (Full HD - MP4)</option>
              <option value="720p">720p (HD - MP4)</option>
              <option value="480p">480p (SD - MP4)</option>
              <option value="best">Best Quality Available</option>
              <option value="mp3">Audio Only (MP3)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gb-text-dim">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] text-gb-text-muted">
            The default quality selected automatically when downloading new videos.
          </p>
        </div>

        {/* Preference: Download Folder */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gb-text-dim">
            Download Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={downloadFolder || 'Downloads folder'}
              className="flex-1 bg-[#212121] border border-gb-border rounded-gb-sm px-3 py-2 text-xs text-gb-text outline-none truncate"
            />
            <button
              onClick={onChooseFolder}
              className="px-4 py-2 bg-gb-surface-light border border-gb-border hover:border-gb-text-dim hover:bg-white/5 rounded-gb-sm font-semibold text-xs transition-colors"
            >
              Browse
            </button>
          </div>
          <p className="text-[11px] text-gb-text-muted">
            Choose where downloaded audio and video files will be saved on your computer.
          </p>
        </div>

        {/* Preference: Auto Updater */}
        <div className="flex flex-col gap-2 border-t border-gb-border pt-4 mt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gb-text-dim">
            Application Updates
          </label>
          <div className="bg-[#121212] border border-gb-border rounded-gb p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Grabbit Client</p>
                <p className="text-xs text-gb-text-dim">Current version: v{version}</p>
              </div>
              <button
                onClick={triggerUpdateCheck}
                disabled={updaterStatus === 'checking' || updaterStatus === 'downloading'}
                className={`
                  px-4 py-2 rounded-gb-sm font-semibold text-xs transition-colors
                  ${updaterStatus === 'checking' || updaterStatus === 'downloading'
                    ? 'bg-gb-surface-light text-gb-text-muted cursor-not-allowed border border-gb-border'
                    : 'bg-gb-accent hover:bg-gb-accent-hover text-white'
                  }
                `}
              >
                {updaterStatus === 'checking' ? 'Checking…' : 'Check for Updates'}
              </button>
            </div>

            {/* Status Message */}
            <div className="text-xs mt-1">
              {updaterStatus === 'idle' && (
                <span className="text-gb-text-muted">No update checks run yet.</span>
              )}
              {updaterStatus === 'checking' && (
                <span className="text-gb-text-dim animate-pulse flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-gb-text-dim" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking for new versions on GitHub...
                </span>
              )}
              {updaterStatus === 'available' && (
                <span className="text-gb-warning">
                  New update found ({availableVersion})! Starting background download...
                </span>
              )}
              {updaterStatus === 'not-available' && (
                <span className="text-gb-success flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Grabbit is up to date!
                </span>
              )}
              {updaterStatus === 'downloading' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-gb-text-dim">
                    <span>Downloading update ({availableVersion})…</span>
                    <span>{updaterProgress}%</span>
                  </div>
                  <div className="w-full bg-gb-surface-light h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gb-accent h-full transition-all duration-300"
                      style={{ width: `${updaterProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {updaterStatus === 'downloaded' && (
                <div className="flex flex-col gap-2">
                  <span className="text-gb-success flex items-center gap-1.5 font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Update ({availableVersion}) downloaded!
                  </span>
                  <button
                    onClick={() => window.grabbit.installUpdate()}
                    className="self-start mt-1 px-3 py-1.5 bg-gb-accent hover:bg-gb-accent-hover text-white text-xs font-semibold rounded-gb-sm transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Restart & Install Update
                  </button>
                </div>
              )}
              {updaterStatus === 'error' && (
                <span className="text-gb-error flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {updaterError}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Backend Logs & Diagnostics */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gb-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-gb-text-dim flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gb-accent">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Backend Session Logs</span>
            </label>
            {logPaths?.sessionId && (
              <span className="font-mono text-[10px] text-gb-text-muted lowercase px-1.5 py-0.5 bg-black/30 rounded border border-white/5">
                {logPaths.sessionId}
              </span>
            )}
          </div>
          <div className="bg-[#212121] border border-gb-border rounded-gb-sm p-3 flex flex-col gap-2.5">
            <p className="text-xs text-gb-text-dim leading-relaxed">
              Every launch records a timestamped backend session log capturing extractor calls, process telemetry, and runtime events.
            </p>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gb-success animate-pulse shrink-0" />
                <span className="font-mono text-[11px] text-gb-text-muted truncate max-w-[260px]" title={logPaths?.currentLogFile || ''}>
                  {logPaths?.currentLogFile ? logPaths.currentLogFile.split(/[/\\]/).pop() : 'session.log'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.grabbit.openLogsFolder?.()}
                className="px-3 py-1.5 bg-gb-surface-light hover:bg-white/10 text-xs font-medium rounded-gb-sm transition-colors text-gb-text flex items-center gap-1.5 border border-gb-border hover:border-gb-text-dim/40 cursor-pointer active:scale-95 shrink-0"
                title="Open the logs folder in Windows Explorer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Open Logs Folder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gb-text-muted mt-2 border-t border-gb-border pt-4 flex flex-col items-center gap-1">
        <p>Grabbit is licensed under MIT. &copy; 2026 Grabbit.</p>
        <p className="text-gb-text-dim">
          Developed and maintained by{' '}
          <a
            href="https://lmlogics.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gb-accent transition-colors font-medium underline underline-offset-2 decoration-white/20 hover:decoration-gb-accent"
          >
            LM Logics
          </a>
        </p>
      </div>
    </div>
  )
}
