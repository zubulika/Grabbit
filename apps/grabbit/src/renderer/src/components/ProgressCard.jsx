/**
 * ProgressCard Component
 *
 * Shows download progress with a bar, speed/ETA stats,
 * and completion/error states with action buttons.
 */
import React from 'react'

export default function ProgressCard({
  videoInfo,
  format,
  progress,
  state,       // 'downloading' | 'complete' | 'error'
  filePath,
  error,
  onOpenFolder,
  onReset,
  onBack
}) {
  const isDownloading = state === 'downloading'
  const isComplete = state === 'complete'
  const isError = state === 'error'
  const percent = Math.min(Math.round(progress.percent || 0), 100)

  return (
    <div className="space-y-5">
      {/* Back button (only when not actively downloading) */}
      {!isDownloading && (
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gb-text-muted hover:text-gb-text transition-colors group"
          id="progress-back-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            className="transform group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      )}

      {/* Main card */}
      <div className="p-5 rounded-gb bg-gb-surface border border-gb-border space-y-4">
        {/* Video title + format */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gb-text truncate">
              {videoInfo?.title || 'Downloading...'}
            </h3>
            <p className="text-xs text-gb-text-muted mt-0.5">
              {format?.label || 'Unknown format'}
            </p>
          </div>
          {/* Status badge */}
          <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase
            ${isComplete ? 'bg-gb-success/15 text-gb-success' :
              isError ? 'bg-gb-error/15 text-gb-error' :
              'bg-gb-accent/15 text-gb-accent'}`}>
            {isComplete ? 'Complete' : isError ? 'Failed' : 'Downloading'}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gb-text-dim font-medium">{percent}%</span>
            {isDownloading && progress.eta && (
              <span className="text-xs text-gb-text-muted">ETA {progress.eta}</span>
            )}
          </div>
          <div className="w-full h-2 bg-gb-surface-light rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out
                ${isComplete ? 'bg-gb-success' :
                  isError ? 'bg-gb-error' :
                  'bg-gb-accent progress-glow'}`}
              style={{ width: `${isComplete ? 100 : percent}%` }}
            />
          </div>
        </div>

        {/* Stats row (while downloading) */}
        {isDownloading && (
          <div className="flex items-center gap-4 text-xs text-gb-text-muted">
            {progress.speed && (
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {progress.speed}
              </div>
            )}
            {progress.size && (
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {progress.size}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {isError && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-gb-sm bg-gb-error/10 border border-gb-error/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gb-error shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            <p className="text-xs text-gb-error/90 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Completed: show file path */}
        {isComplete && filePath && (
          <div className="px-3 py-2.5 rounded-gb-sm bg-gb-success/5 border border-gb-success/15">
            <p className="text-[11px] text-gb-text-muted mb-1">Saved to:</p>
            <p className="text-xs text-gb-text font-mono truncate" title={filePath}>
              {filePath}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isComplete && (
            <button onClick={onOpenFolder}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-gb
                bg-gb-accent hover:bg-gb-accent-hover text-white text-sm font-semibold
                transition-all duration-200 active:scale-[0.98]"
              id="open-folder-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open Folder
            </button>
          )}
          {(isComplete || isError) && (
            <button onClick={onReset}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-gb text-sm font-semibold
                transition-all duration-200 active:scale-[0.98] border
                ${isComplete
                  ? 'flex-1 bg-gb-surface border-gb-border text-gb-text-dim hover:text-gb-text hover:border-gb-text-muted'
                  : 'flex-1 bg-gb-accent hover:bg-gb-accent-hover text-white border-transparent'}`}
              id="new-download-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
