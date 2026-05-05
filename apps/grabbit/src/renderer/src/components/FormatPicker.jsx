/**
 * FormatPicker Component
 *
 * Displays video metadata and available formats for selection.
 */
import React, { useState } from 'react'

function FormatIcon({ type }) {
  if (type === 'audio') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gb-accent">
        <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gb-accent">
      <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function getQualityColor(id) {
  switch (id) {
    case '1080p': return 'bg-gb-accent/20 text-gb-accent'
    case '720p': return 'bg-yellow-500/20 text-yellow-400'
    case '480p': return 'bg-blue-500/20 text-blue-400'
    case 'audio': return 'bg-purple-500/20 text-purple-400'
    default: return 'bg-gb-surface-light text-gb-text-dim'
  }
}

export default function FormatPicker({ videoInfo, onSelect, onBack, downloadFolder, onChooseFolder }) {
  const [hoveredFormat, setHoveredFormat] = useState(null)
  const { title, thumbnail, channel, duration, formats } = videoInfo

  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gb-text-muted hover:text-gb-text transition-colors group"
        id="back-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          className="transform group-hover:-translate-x-0.5 transition-transform">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      {/* Video info card */}
      <div className="flex gap-4 p-4 rounded-gb bg-gb-surface border border-gb-border">
        {thumbnail && (
          <div className="shrink-0 w-40 h-[90px] rounded-gb-sm overflow-hidden bg-gb-surface-light">
            <img src={thumbnail} alt={title} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gb-text truncate leading-snug" title={title}>{title}</h2>
          {channel && <p className="text-xs text-gb-text-muted mt-1">{channel}</p>}
          {duration && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gb-text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {duration}
            </div>
          )}
        </div>
      </div>

      {/* Format list */}
      <div>
        <h3 className="text-xs font-medium text-gb-text-dim uppercase tracking-wider mb-3">Choose Format</h3>
        <div className="space-y-2">
          {formats.map((fmt) => (
            <button key={fmt.id} onClick={() => onSelect(fmt)}
              onMouseEnter={() => setHoveredFormat(fmt.id)}
              onMouseLeave={() => setHoveredFormat(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-gb border transition-all duration-200
                ${hoveredFormat === fmt.id
                  ? 'bg-gb-surface-light border-gb-accent/30 shadow-gb'
                  : 'bg-gb-surface border-gb-border hover:border-gb-accent/20'}`}
              id={`format-${fmt.id}`}>
              <FormatIcon type={fmt.type} />
              <span className="flex-1 text-left text-sm text-gb-text font-medium">{fmt.label}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${getQualityColor(fmt.id)}`}>
                {fmt.type === 'audio' ? 'MP3' : 'MP4'}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                className={`transition-all duration-200 ${hoveredFormat === fmt.id ? 'text-gb-accent translate-y-0.5' : 'text-gb-text-muted'}`}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Download folder */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-gb-sm bg-gb-surface border border-gb-border text-xs">
        <div className="flex items-center gap-2 text-gb-text-muted min-w-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate">{downloadFolder || 'Downloads'}</span>
        </div>
        <button onClick={onChooseFolder}
          className="text-gb-accent hover:text-gb-accent-hover transition-colors font-medium shrink-0 ml-2"
          id="change-folder-button">
          Change
        </button>
      </div>
    </div>
  )
}
