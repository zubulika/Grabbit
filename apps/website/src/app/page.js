/**
 * Grabbit Landing Page
 * 
 * A high-conversion, minimalist design for the Grabbit desktop app.
 */
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="Grabbit Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-2xl tracking-tighter uppercase">Grabbit</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
          <a href="#download" className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors border border-white/10">
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Version 1.0.0 Now Available
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] animate-slide-up">
          The <span className="text-red-600">fastest</span> way to <br className="hidden md:block" /> grab any video.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          A minimalist desktop powerhouse built for speed. Fetch high-quality video and audio from YouTube and beyond with zero friction.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <a 
            href="/downloads/Grabbit-Setup.exe" 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-red-600/30 flex items-center justify-center gap-3"
            id="download-hero"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15L17 10M12 15L7 10M12 15V3M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download for Windows
          </a>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Windows 10/11 • Portable & NSIS
          </p>
        </div>

        {/* App Preview Mockup */}
        <div className="mt-24 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-[#181818] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden aspect-[16/10] max-w-4xl mx-auto flex items-center justify-center text-gray-600 font-mono text-sm">
            {/* Minimal App Shell Mockup */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-[#212121] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
              <div className="mx-auto text-[10px] text-gray-500 uppercase tracking-widest">Grabbit.exe</div>
            </div>
            <div className="flex flex-col items-center gap-6 opacity-40">
              <div className="w-64 h-10 bg-white/5 rounded-lg border border-white/5"></div>
              <div className="w-48 h-12 bg-red-600/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-red-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h3 className="text-xl font-bold">Lightning Fast</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Engineered with Electron and yt-dlp to ensure maximum performance and minimal overhead during downloads.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-red-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M12 7v10M7 12h10"/></svg>
            </div>
            <h3 className="text-xl font-bold">Pro Formats</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Choose from 1080p, 720p, or high-fidelity Audio Only MP3. Automatic merging via bundled FFmpeg.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-red-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h3 className="text-xl font-bold">All-in-One</h3>
            <p className="text-gray-400 text-sm leading-relaxed">No Python or FFmpeg required on your machine. Everything is bundled into a single, portable executable.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
               <img src="/logo.png" alt="Grabbit" className="w-full h-full object-contain opacity-80" />
             </div>
             <span className="font-bold text-sm tracking-widest uppercase text-gray-500">Grabbit</span>
          </div>
          <p className="text-gray-600 text-[11px] uppercase tracking-widest font-medium text-center">
            &copy; 2026 Grabbit. MIT Licensed. Developed for the modern web.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
