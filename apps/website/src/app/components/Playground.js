"use client";

import React, { useState, useEffect, useCallback } from 'react';
import URLInput from './URLInput';
import FormatPicker from './FormatPicker';
import ProgressCard from './ProgressCard';

const VIEW = {
  INPUT: 'input',
  FORMAT: 'format',
  PROGRESS: 'progress'
};

export default function Playground() {
  const [view, setView] = useState(VIEW.INPUT);
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [progress, setProgress] = useState({ percent: 0, speed: '', eta: '', size: '' });
  const [downloadState, setDownloadState] = useState('idle'); // idle | downloading | complete | error
  const [downloadedFilePath, setDownloadedFilePath] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Simulates download progress over time
  useEffect(() => {
    let interval = null;
    if (downloadState === 'downloading') {
      const isAudio = selectedFormat?.type === 'audio';
      const totalSizeMb = isAudio ? 4.2 : 48.5;
      
      interval = setInterval(() => {
        setProgress((prev) => {
          const nextPercent = prev.percent + Math.random() * 8 + 2;
          
          if (nextPercent >= 100) {
            clearInterval(interval);
            setDownloadState('complete');
            
            const cleanTitle = (videoInfo?.title || 'download')
              .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
              .substring(0, 30)
              .trim();
            const ext = isAudio ? 'mp3' : 'mp4';
            const suffix = isAudio ? 'audio' : selectedFormat?.id || '1080p';
            setDownloadedFilePath(`C:\\Users\\User\\Downloads\\${cleanTitle}-${suffix}.${ext}`);
            
            return {
              percent: 100,
              speed: '-',
              eta: '00:00',
              size: `${totalSizeMb.toFixed(1)} MiB`
            };
          }
          
          const speed = (Math.random() * 4 + 8).toFixed(2);
          const currentSizeMb = (totalSizeMb * (nextPercent / 100)).toFixed(1);
          const size = `${currentSizeMb}/${totalSizeMb.toFixed(1)} MiB`;
          
          const remainingPercent = 100 - nextPercent;
          const etaSec = Math.ceil(remainingPercent / 15);
          const eta = `00:${etaSec.toString().padStart(2, '0')}`;
          
          return {
            percent: nextPercent,
            speed: `${speed} MiB/s`,
            eta,
            size
          };
        });
      }, 350);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [downloadState, selectedFormat, videoInfo]);

  const handleFetch = useCallback(async (inputUrl) => {
    setUrl(inputUrl);
    setFetchError('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(inputUrl)}`);
      const result = await res.json();
      setIsLoading(false);

      if (result.success) {
        setVideoInfo(result.data);
        setView(VIEW.FORMAT);
      } else {
        setFetchError(result.error || 'Failed to fetch video info');
      }
    } catch (err) {
      setIsLoading(false);
      setFetchError('Connection timeout. Please try again.');
    }
  }, []);

  const handleStartDownload = useCallback((format) => {
    setSelectedFormat(format);
    setView(VIEW.PROGRESS);
    setDownloadState('downloading');
    setProgress({ percent: 0, speed: '', eta: '', size: '' });
    setDownloadError('');
  }, []);

  const handleReset = useCallback(() => {
    setView(VIEW.INPUT);
    setUrl('');
    setVideoInfo(null);
    setSelectedFormat(null);
    setProgress({ percent: 0, speed: '', eta: '', size: '' });
    setDownloadState('idle');
    setDownloadedFilePath('');
    setDownloadError('');
    setFetchError('');
  }, []);

  const handleBack = useCallback(() => {
    if (view === VIEW.FORMAT) {
      setView(VIEW.INPUT);
      setVideoInfo(null);
      setFetchError('');
    } else if (view === VIEW.PROGRESS && downloadState !== 'downloading') {
      setView(VIEW.FORMAT);
      setDownloadState('idle');
    }
  }, [view, downloadState]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[380px] animate-slide-up">
      {view === VIEW.INPUT && (
        <div className="w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gb-accent/5 overflow-hidden">
              <img src="/logo.png" alt="Grabbit Logo" className="w-11 h-11 object-contain animate-pulse-slow" />
            </div>
            <h2 className="font-display font-bold text-2xl tracking-tight text-white">Try Grabbit Web</h2>
            <p className="text-sm text-gb-text-muted max-w-sm mx-auto leading-relaxed">
              Paste a YouTube or Facebook link below to try the download manager right inside your browser.
            </p>
          </div>

          <URLInput
            onFetch={handleFetch}
            isLoading={isLoading}
            error={fetchError}
          />
        </div>
      )}

      {view === VIEW.FORMAT && videoInfo && (
        <div className="w-full">
          <FormatPicker
            videoInfo={videoInfo}
            onSelect={handleStartDownload}
            onBack={handleBack}
            downloadFolder="Downloads (Browser Default)"
            onChooseFolder={() => {
              alert("Browser security blocks custom output folders. To choose custom folders, please download Grabbit for Windows.");
            }}
          />
        </div>
      )}

      {view === VIEW.PROGRESS && (
        <div className="w-full">
          <ProgressCard
            videoInfo={videoInfo}
            format={selectedFormat}
            progress={progress}
            state={downloadState}
            filePath={downloadedFilePath}
            error={downloadError}
            onReset={handleReset}
            onBack={handleBack}
          />
        </div>
      )}
    </div>
  );
}
