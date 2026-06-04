import React from 'react';
import Playground from '../components/Playground';

export const metadata = {
  title: "Grabbit — Web Downloader App",
  description: "Experience Grabbit's video and audio extraction interface directly in your browser.",
};

export default function AppRoute() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30 flex flex-col relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-red-600/5 blur-[100px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none select-none"></div>

      {/* Top Application Bar */}
      <header className="h-14 bg-gb-surface border-b border-gb-border px-6 flex justify-between items-center relative z-10 select-none shrink-0">
        {/* Left corner: Logo, Brand and Back Navigation Link */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center bg-gb-accent/5">
              <img src="/logo.png" alt="Grabbit Logo" className="w-4.5 h-4.5 object-contain" />
            </div>
            <span className="font-display font-bold text-xs tracking-wider uppercase text-white">Grabbit</span>
          </div>

          <span className="text-white/10 text-xs">|</span>

          <a 
            href="/" 
            className="text-xs text-gb-text-dim hover:text-white flex items-center gap-1.5 transition-colors group font-semibold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-x-0.5 transition-transform">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 5 19 12 12 5" />
            </svg>
            Back to Home
          </a>
        </div>

        {/* Right corner: Engine status (hidden on very small screens for clean layout) */}
        <div className="hidden sm:flex items-center gap-2 select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gb-text-muted">Web Engine Active</span>
        </div>
      </header>

      {/* Main Workspace occupying full width, with auto vertical scrolling */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 md:p-12 relative z-10 overflow-y-auto">
        <div className="max-w-3xl w-full py-4">
          <Playground />
        </div>
      </main>

      {/* Sleek bottom status bar */}
      <footer className="h-8 bg-gb-surface border-t border-gb-border flex items-center justify-center text-[9px] text-gb-text-muted select-none tracking-widest uppercase shrink-0 relative z-10">
        Playground Session — Grabbit Desktop Engine v1.0.0
      </footer>
    </div>
  );
}
