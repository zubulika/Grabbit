"use client";

import React, { useState } from 'react';

export default function ProgressCard({
  videoInfo,
  format,
  progress,
  state,       // 'downloading' | 'complete' | 'error'
  filePath,
  error,
  onReset,
  onBack
}) {
  const [showCtaModal, setShowCtaModal] = useState(false);
  const isDownloading = state === 'downloading';
  const isComplete = state === 'complete';
  const isError = state === 'error';
  const percent = Math.min(Math.round(progress.percent || 0), 100);

  // Triggered when clicking "Save to Disk" or "Download File"
  const handleSaveToDisk = () => {
    // Start actual download of a tiny sample video/audio file
    const link = document.createElement('a');
    if (format?.type === 'audio') {
      link.href = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA'; // Tiny dummy mp3
      link.download = `${videoInfo?.title || 'audio'}-Grabbit.mp3`;
    } else {
      link.href = 'data:video/mp4;base64,AAAAGGZ0eXBtcDQyAAAAAG1wNDJpc29tAAAAKHV1aWR4Direct'; // Tiny dummy mp4
      link.download = `${videoInfo?.title || 'video'}-Grabbit.mp4`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show CTA modal
    setShowCtaModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Back button (only when not actively downloading) */}
      {!isDownloading && (
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gb-text-muted hover:text-gb-text transition-colors group cursor-pointer"
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
      <div className="p-5 rounded-gb bg-gb-surface border border-gb-border space-y-4 relative overflow-hidden">
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
                  'bg-gb-accent shadow-[0_0_12px_rgba(255,0,0,0.4),_0_0_24px_rgba(255,0,0,0.15)]'}`}
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

        {/* Simulated logs */}
        {isDownloading && (
          <div className="bg-black/40 rounded-gb-sm p-3 font-mono text-[10px] text-green-400 space-y-1 h-20 overflow-y-hidden border border-white/5 select-none">
            {percent < 15 && <p className="animate-pulse">&gt; Initialising yt-dlp compiler...</p>}
            {percent >= 15 && percent < 40 && (
              <>
                <p>&gt; Initialising yt-dlp compiler...</p>
                <p className="animate-pulse">&gt; Fetching video stream resources...</p>
              </>
            )}
            {percent >= 40 && percent < 75 && (
              <>
                <p>&gt; Fetching video stream resources...</p>
                <p className="animate-pulse">&gt; Downloading parts (Speed: {progress.speed || '8.5 MB/s'})...</p>
              </>
            )}
            {percent >= 75 && percent < 95 && (
              <>
                <p>&gt; Downloading parts complete.</p>
                <p className="animate-pulse">&gt; Merging audio & video streams via FFmpeg...</p>
              </>
            )}
            {percent >= 95 && (
              <>
                <p>&gt; Merging complete.</p>
                <p className="animate-pulse">&gt; Sanitising final output file...</p>
              </>
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

        {/* Completed: show simulated file path */}
        {isComplete && filePath && (
          <div className="px-3 py-2.5 rounded-gb-sm bg-gb-success/5 border border-gb-success/15 animate-fade-in">
            <p className="text-[11px] text-gb-text-muted mb-1">Simulated Destination:</p>
            <p className="text-xs text-gb-text font-mono truncate" title={filePath}>
              {filePath}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {isComplete && (
            <button onClick={handleSaveToDisk}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 rounded-gb cursor-pointer
                bg-gb-accent hover:bg-gb-accent-hover text-white text-sm font-semibold
                transition-all duration-200 active:scale-[0.98] shadow-lg shadow-gb-accent/20"
              id="open-folder-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save to Disk
            </button>
          )}
          {(isComplete || isError) && (
            <button onClick={onReset}
              className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 rounded-gb text-sm font-semibold cursor-pointer
                transition-all duration-200 active:scale-[0.98] border
                ${isComplete
                  ? 'bg-gb-surface border-gb-border text-gb-text-dim hover:text-gb-text hover:border-gb-text-muted'
                  : 'bg-gb-accent hover:bg-gb-accent-hover text-white border-transparent'}`}
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

      {/* CTA Modal Overlay */}
      {showCtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-gb max-w-md w-full p-6 text-center shadow-2xl relative animate-slide-up">
            {/* Close button */}
            <button
              onClick={() => setShowCtaModal(false)}
              className="absolute top-4 right-4 text-gb-text-muted hover:text-gb-text cursor-pointer transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-16 h-16 mx-auto bg-gb-accent/10 text-gb-accent border border-gb-accent/20 rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">Simulated Download Completed!</h4>
            <p className="text-xs text-gb-text-muted leading-relaxed mb-6">
              A placeholder media file has been downloaded. In-browser downloading is limited by browser sandbox constraints.
              For unlimited speeds, auto-merging of high-definition formats (1080p, 4K), and multi-thread downloads, get the **Grabbit Desktop App** for Windows!
            </p>

            <div className="flex flex-col gap-2">
              <a
                href="/downloads/Grabbit-Setup.exe"
                className="w-full py-3 bg-gb-accent hover:bg-gb-accent-hover text-white text-sm font-bold rounded-gb transition-all active:scale-[0.98]"
              >
                Download Desktop App
              </a>
              <button
                onClick={() => setShowCtaModal(false)}
                className="w-full py-3 border border-gb-border hover:border-gb-text-muted text-gb-text-dim hover:text-white text-sm font-semibold rounded-gb transition-all cursor-pointer"
              >
                Continue using Playground
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
