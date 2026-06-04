"use client";

import React, { useState, useEffect } from 'react';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'features', label: 'Core Features' },
    { id: 'monorepo', label: 'Monorepo Architecture' },
    { id: 'build-guide', label: 'Developer Build Guide' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'legal', label: 'Legal & Privacy' },
  ];

  // Auto-scroll to top when active section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30 flex flex-col">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/5 blur-[100px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/5 blur-[100px] pointer-events-none select-none"></div>

      {/* Top Glassmorphic Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-[#0f0f0f]/85 border-b border-white/5 select-none shrink-0">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand logo */}
          <a href="/" className="flex items-center gap-3 group select-none">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-gb-accent/5 group-hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Grabbit Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider uppercase text-white">Grabbit <span className="text-[10px] text-gb-accent tracking-normal font-semibold lowercase align-super ml-1">docs</span></span>
          </a>

          <div className="flex items-center gap-6">
            <a href="/" className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold">Home</a>
            <a href="/app" className="bg-gb-accent hover:bg-gb-accent-hover text-white text-xs px-4 py-2 rounded-gb font-bold transition-all shadow-md active:scale-[0.98]">
              Launch App
            </a>
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <div className="max-w-6xl w-full mx-auto px-6 pt-24 pb-16 flex flex-col md:flex-row gap-8 flex-1 relative z-10">
        
        {/* Left Sticky Sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-fit border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gb-text-muted mb-4">Documentation</p>
          <ul className="space-y-1.5">
            {sections.map((sec) => (
              <li key={sec.id}>
                <button
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-gb-sm text-xs font-semibold tracking-wide transition-all border ${
                    activeSection === sec.id
                      ? 'bg-gb-accent/10 border-gb-accent/20 text-gb-accent'
                      : 'border-transparent text-gb-text-dim hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sec.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Scrollable Content Pane */}
        <main className="flex-1 min-w-0 md:pl-4">
          {activeSection === 'getting-started' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">Getting Started</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Grabbit is a minimal, lightning-fast media downloader. It allows you to download video and audio from popular platforms directly on your system, or interact with a live sandbox demo in the web browser.
                </p>
              </div>

              <div className="p-4 rounded-gb bg-gb-surface border border-gb-border space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gb-accent"></span>
                  Quick Installation (Windows)
                </h3>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  To get started with Grabbit on Windows, download our standalone installer. It bundles everything needed, including format pickers, download libraries, and the desktop runner.
                </p>
                <div className="pt-2">
                  <a href="/downloads/Grabbit-Setup.exe" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gb-accent hover:bg-gb-accent-hover text-white rounded-gb transition-all">
                    Download for Windows 10/11
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg text-white">Browser Sandbox Demo</h2>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  If you prefer not to install the desktop client immediately, you can try our web platform client. The web version lets you parse URLs and examine download details in a sandboxed, responsive playground.
                </p>
                <div>
                  <a href="/app" className="inline-flex items-center gap-1.5 text-xs font-bold text-gb-accent hover:underline">
                    Try Browser Demo &rarr;
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">Core Features</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Grabbit is built with premium developer aesthetics and clean, highly performance-optimized core functionality.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-gb bg-gb-surface border border-gb-border space-y-2">
                  <h3 className="text-xs font-bold text-white">Maximum Download Speed</h3>
                  <p className="text-[11px] text-gb-text-dim leading-relaxed">
                    By making parallel chunked requests, Grabbit fetches stream chunks concurrently to fully saturate your network bandwidth.
                  </p>
                </div>
                <div className="p-4 rounded-gb bg-gb-surface border border-gb-border space-y-2">
                  <h3 className="text-xs font-bold text-white">Highest Resolution Streams</h3>
                  <p className="text-[11px] text-gb-text-dim leading-relaxed">
                    Downloads top quality video tracks (up to 4K resolutions) and premium audio streams independently, then merges them with ease.
                  </p>
                </div>
                <div className="p-4 rounded-gb bg-gb-surface border border-gb-border space-y-2">
                  <h3 className="text-xs font-bold text-white">Metadata Parsing</h3>
                  <p className="text-[11px] text-gb-text-dim leading-relaxed">
                    Automatically retrieves oEmbed metadata, displaying video descriptions, thumbnails, author names, and durations prior to download.
                  </p>
                </div>
                <div className="p-4 rounded-gb bg-gb-surface border border-gb-border space-y-2">
                  <h3 className="text-xs font-bold text-white">Fully Portable</h3>
                  <p className="text-[11px] text-gb-text-dim leading-relaxed">
                    Self-contained architecture. Desktop versions operate cleanly without polluting system variables or folders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'monorepo' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">Monorepo Architecture</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Grabbit utilizes npm workspaces to keep the landing page, developer tools, and platform clients isolated yet easily accessible in one repository.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg text-white">Folder Structure</h2>
                <div className="p-4 rounded-gb bg-[#080808] border border-white/5 font-mono text-[11px] text-gb-text-dim space-y-1">
                  <p className="text-white">Grabbit/</p>
                  <p>&nbsp;&nbsp;├── apps/</p>
                  <p className="text-white">&nbsp;&nbsp;│&nbsp;&nbsp;├── website/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Next.js Web App & Docs</p>
                  <p className="text-white">&nbsp;&nbsp;│&nbsp;&nbsp;├── windows/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Desktop Windows Electron App</p>
                  <p className="text-gb-text-muted">&nbsp;&nbsp;│&nbsp;&nbsp;├── macos/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# macOS Target Workspace Placeholder</p>
                  <p className="text-gb-text-muted">&nbsp;&nbsp;│&nbsp;&nbsp;├── linux/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Linux Target Workspace Placeholder</p>
                  <p className="text-gb-text-muted">&nbsp;&nbsp;│&nbsp;&nbsp;└── android/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Android Target Workspace Placeholder</p>
                  <p>&nbsp;&nbsp;├── package.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Monorepo Workspace Configuration</p>
                  <p>&nbsp;&nbsp;├── dev.py&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Local Development Runner</p>
                  <p>&nbsp;&nbsp;└── build.py&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Interactive Installer Builder</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-display font-semibold text-lg text-white">Platform Modules</h2>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  The client applications are separated by target platform under the <code className="text-white bg-white/5 px-1 rounded">/apps</code> directory. This enables developers to create highly customized layouts and interfaces (such as an Android package or macOS client) while referencing the shared video core.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'build-guide' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">Developer Build Guide</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Follow these steps to run Grabbit locally and compile production builds.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg text-white">1. Prerequisites</h2>
                <ul className="list-disc pl-5 text-xs text-gb-text-dim space-y-1.5">
                  <li>Node.js (version 20 or higher)</li>
                  <li>Python 3.x (optional, for dev/build scripts)</li>
                  <li>Git (for cloning the repo)</li>
                </ul>

                <h2 className="font-display font-semibold text-lg text-white">2. Running Development Mode</h2>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  Install workspaces dependencies first:
                </p>
                <pre className="p-3 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-accent">
                  npm install
                </pre>
                
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  To run the website and docs workspace:
                </p>
                <pre className="p-3 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-accent">
                  npm run website:dev
                </pre>

                <p className="text-xs text-gb-text-dim leading-relaxed">
                  To run the desktop App workspace:
                </p>
                <pre className="p-3 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-accent">
                  npm run windows:dev
                </pre>

                <h2 className="font-display font-semibold text-lg text-white">3. Building the Windows Installer</h2>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  We supply a GUI tool to compile the desktop Electron executable. To run the release builder:
                </p>
                <pre className="p-3 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-accent">
                  python build.py
                </pre>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  Alternatively, build manually using NPM:
                </p>
                <pre className="p-3 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-accent">
                  npm run windows:build
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'api-reference' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">API Reference</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Integrate video extraction directly inside your applications by querying our REST parser.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg text-white">Query Metadata Endpoint</h2>
                <p className="text-xs text-gb-text-dim leading-relaxed">
                  The API parses target URLs and responds with enriched JSON info cards.
                </p>
                
                <div className="p-3 rounded-gb bg-[#080808] border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gb-success/15 text-gb-success uppercase">GET</span>
                  <code className="text-xs text-white">/api/info?url=&lt;video-url&gt;</code>
                </div>

                <h3 className="text-xs font-bold text-white mt-4">Successful Response Structure</h3>
                <pre className="p-4 rounded-gb bg-[#080808] border border-white/5 text-[11px] font-mono text-gb-text-dim overflow-x-auto">
{`{
  "title": "Amazing Video Title",
  "author_name": "Creator Channel",
  "thumbnail_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
  "html": "<iframe src='...'></iframe>",
  "duration": "14:23",
  "formats": [
    { "quality": "1080p", "ext": "mp4", "fps": 60 },
    { "quality": "720p", "ext": "mp4", "fps": 30 },
    { "quality": "Audio Only", "ext": "m4a", "fps": 0 }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-2">Legal & Privacy</h1>
                <p className="text-gb-text-dim text-sm leading-relaxed">
                  Grabbit is committed to open-source compliance and user privacy.
                </p>
              </div>

              <div className="space-y-4 text-xs text-gb-text-dim leading-relaxed">
                <h2 className="font-display font-semibold text-base text-white">Privacy Statement</h2>
                <p>
                  Grabbit collects no personal, diagnostic, or activity information. All download operations, streaming inquiries, and parsing actions happen directly client-side on your local machine.
                </p>

                <h2 className="font-display font-semibold text-base text-white">Terms of Service</h2>
                <p>
                  Grabbit is provided under the MIT License. Users must ensure that they comply with applicable platform guidelines and copyright terms when downloading video assets.
                </p>

                <h2 className="font-display font-semibold text-base text-white">License Compliance</h2>
                <p>
                  This project integrates multiple open source libraries. For full license details, refer to the LICENSE file inside our repository.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-8 border-t border-white/5 relative z-10 text-xs shrink-0 text-center text-gb-text-muted mt-auto">
        &copy; 2026 Grabbit. MIT Licensed. Simple, clean, and developer-friendly.
      </footer>
    </div>
  );
}
