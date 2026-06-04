/**
 * URLInput Component
 *
 * A large centered input field where the user pastes a YouTube or Facebook URL.
 * Validates the URL client-side with regex before calling the IPC bridge.
 */
import React, { useState, useRef, useEffect } from 'react'

// YouTube & Facebook URL validation patterns
const VALIDATION_PATTERNS = [
  // YouTube
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /^https?:\/\/youtu\.be\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
  // Facebook
  /^https?:\/\/(?:[\w-]+\.)?facebook\.com\/watch\/?\?v=[\w-]+/,
  /^https?:\/\/(?:[\w-]+\.)?facebook\.com\/reel\/[\w-]+/,
  /^https?:\/\/(?:[\w-]+\.)?facebook\.com\/[\w.]+\/videos\/[\w-]+/,
  /^https?:\/\/(?:[\w-]+\.)?facebook\.com\/share\/[vr]\/[\w-]+/,
  /^https?:\/\/fb\.watch\/[\w-]+\/?/
]

function isValidUrl(url) {
  return VALIDATION_PATTERNS.some((pattern) => pattern.test(url.trim()))
}

export default function URLInput({ onFetch, isLoading, error }) {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState('')
  const inputRef = useRef(null)

  // Auto-focus the input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    const trimmed = url.trim()
    if (!trimmed) {
      setValidationError('Please enter a YouTube or Facebook URL')
      return
    }

    if (!isValidUrl(trimmed)) {
      setValidationError('Please enter a valid YouTube or Facebook URL')
      return
    }

    onFetch(trimmed)
  }

  const handlePaste = (e) => {
    // Auto-submit on paste if valid
    setTimeout(() => {
      const pasted = e.target.value.trim()
      if (isValidUrl(pasted)) {
        setValidationError('')
      }
    }, 0)
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* URL Input Field */}
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-gb
            bg-gb-surface border transition-all duration-200
            ${displayError ? 'border-gb-error/60' : 'border-gb-border hover:border-gb-text-muted focus-within:border-gb-accent/50'}
          `}
        >
          {/* Link icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gb-text-muted shrink-0">
            <path
              d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (validationError) setValidationError('')
            }}
            onPaste={handlePaste}
            placeholder="Paste YouTube or Facebook URL here..."
            className="flex-1 bg-transparent text-sm text-gb-text placeholder:text-gb-text-muted outline-none"
            disabled={isLoading}
            id="url-input"
          />

          {/* Clear button */}
          {url && !isLoading && (
            <button
              type="button"
              onClick={() => { setUrl(''); setValidationError(''); inputRef.current?.focus() }}
              className="text-gb-text-muted hover:text-gb-text transition-colors"
              aria-label="Clear URL"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <p className="mt-2 text-xs text-gb-error flex items-center gap-1 animate-fade-in" id="url-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            {displayError}
          </p>
        )}
      </div>

      {/* Fetch Button */}
      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className={`
          mt-4 w-full py-3 rounded-gb font-semibold text-sm
          transition-all duration-200
          ${isLoading || !url.trim()
            ? 'bg-gb-surface-light text-gb-text-muted cursor-not-allowed'
            : 'bg-gb-accent hover:bg-gb-accent-hover text-white shadow-lg hover:shadow-gb active:scale-[0.98]'
          }
        `}
        id="fetch-button"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            {/* Spinner */}
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path
                d="M12 2a10 10 0 019.95 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Fetching video info…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Fetch
          </span>
        )}
      </button>
    </form>
  )
}
