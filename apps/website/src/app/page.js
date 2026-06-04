"use client";

import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';

// Platform Icons for navigation dropdown and cards
function PlatformIcon({ platform }) {
  if (platform === 'windows') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gb-accent shrink-0">
        <path d="M3 5.5L11 4v7.5H3V5.5zm8.8-1.7L21 2.5V11.5h-9.2V3.8zM3 12.5h8v7.5l-8-1.5v-6zm8.8 0H21v9l-9.2-1.3v-7.7z" />
      </svg>
    );
  }
  if (platform === 'macos') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gb-accent shrink-0">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.22.67-2.94 1.51-.62.72-1.16 1.86-1.01 2.96 1.12.09 2.27-.6 2.96-1.42z" />
      </svg>
    );
  }
  if (platform === 'linux') {
    return (
      <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" className="text-gb-accent shrink-0">
        <path d="M16.672 0c-0.208 0-0.421 0.011-0.641 0.027-5.635 0.447-4.14 6.411-4.224 8.4-0.104 1.453-0.4 2.604-1.4 4.027-1.183 1.401-2.839 3.667-3.625 6.025-0.369 1.109-0.547 2.251-0.38 3.324-0.052 0.041-0.104 0.088-0.151 0.176-0.344 0.36-0.6 0.803-0.881 1.12-0.265 0.265-0.645 0.355-1.063 0.532-0.416 0.181-0.88 0.359-1.151 0.911-0.12 0.251-0.183 0.521-0.177 0.803 0 0.26 0.037 0.531 0.073 0.713 0.079 0.531 0.156 0.969 0.052 1.292-0.333 0.905-0.369 1.525-0.14 1.979 0.233 0.448 0.713 0.625 1.249 0.803 1.084 0.265 2.547 0.181 3.704 0.796 1.233 0.625 2.489 0.896 3.489 0.631 0.697-0.156 1.291-0.62 1.609-1.26 0.781-0.005 1.64-0.36 3.011-0.448 0.932-0.079 2.099 0.359 3.437 0.265 0.036 0.183 0.083 0.265 0.156 0.448v0.005c0.52 1.036 1.484 1.505 2.516 1.427 1.025-0.083 2.119-0.713 3.004-1.744 0.844-1.016 2.245-1.444 3.172-2 0.464-0.267 0.839-0.625 0.865-1.141 0.031-0.531-0.265-1.083-0.948-1.833v-0.131l-0.005-0.005c-0.229-0.265-0.333-0.713-0.453-1.233-0.115-0.537-0.24-1.047-0.656-1.396-0.084-0.073-0.167-0.089-0.255-0.177-0.073-0.052-0.163-0.083-0.251-0.088 0.573-1.704 0.349-3.396-0.235-4.923-0.708-1.88-1.953-3.52-2.896-4.645-1.063-1.339-2.104-2.609-2.083-4.489 0.036-2.871 0.317-8.177-4.724-8.188zM17.375 4.541h0.021c0.281 0 0.525 0.084 0.776 0.261 0.255 0.181 0.443 0.443 0.583 0.713 0.141 0.344 0.215 0.609 0.224 0.963 0-0.025 0.005-0.052 0.005-0.077v0.14c0-0.011-0.005-0.020-0.005-0.031l-0.005-0.032c0 0.324-0.067 0.647-0.197 0.943-0.063 0.167-0.156 0.319-0.287 0.448-0.036-0.020-0.073-0.041-0.115-0.057-0.14-0.063-0.265-0.083-0.38-0.176-0.093-0.037-0.192-0.068-0.292-0.089 0.063-0.077 0.193-0.177 0.245-0.265 0.068-0.167 0.104-0.349 0.115-0.536v-0.027c0.005-0.177-0.027-0.359-0.084-0.531-0.057-0.177-0.129-0.267-0.239-0.443-0.115-0.089-0.224-0.177-0.36-0.177h-0.020c-0.125 0-0.235 0.036-0.349 0.177-0.125 0.124-0.219 0.276-0.271 0.443-0.073 0.172-0.115 0.353-0.12 0.531v0.027c0 0.119 0.011 0.239 0.025 0.359-0.26-0.088-0.583-0.183-0.812-0.271-0.011-0.088-0.021-0.177-0.021-0.265v-0.027c-0.009-0.353 0.057-0.703 0.199-1.025 0.109-0.292 0.307-0.543 0.573-0.709 0.228-0.171 0.504-0.265 0.791-0.265zM13.427 4.62h0.047c0.188 0 0.36 0.063 0.532 0.177 0.197 0.172 0.355 0.385 0.459 0.619 0.12 0.267 0.187 0.537 0.208 0.891v0.005c0.005 0.177 0.005 0.272-0.005 0.355v0.109c-0.041 0.011-0.073 0.021-0.109 0.031-0.203 0.073-0.364 0.177-0.527 0.267 0.016-0.12 0.016-0.24 0.005-0.355v-0.021c-0.015-0.176-0.052-0.265-0.109-0.443-0.041-0.135-0.12-0.26-0.224-0.359-0.063-0.057-0.151-0.089-0.239-0.084h-0.032c-0.093 0.005-0.172 0.052-0.244 0.177-0.089 0.099-0.141 0.224-0.161 0.36-0.037 0.14-0.048 0.291-0.032 0.443v0.015c0.016 0.183 0.047 0.272 0.109 0.448 0.057 0.177 0.131 0.267 0.219 0.355 0.016 0.016 0.027 0.027 0.047 0.031-0.093 0.079-0.156 0.095-0.233 0.183-0.053 0.037-0.109 0.084-0.177 0.095-0.141-0.168-0.261-0.349-0.365-0.537-0.129-0.281-0.197-0.583-0.208-0.891-0.021-0.301 0.016-0.604 0.104-0.891 0.079-0.26 0.204-0.505 0.38-0.713 0.172-0.177 0.344-0.265 0.557-0.265zM15.255 6.896c0.443 0 0.975 0.083 1.62 0.531 0.391 0.267 0.699 0.36 1.407 0.62 0.344 0.183 0.541 0.36 0.64 0.537v-0.177c0.095 0.197 0.105 0.421 0.021 0.624-0.167 0.417-0.688 0.86-1.421 1.125v0.005c-0.355 0.177-0.667 0.443-1.032 0.62-0.369 0.177-0.787 0.391-1.349 0.355-0.203 0.009-0.405-0.021-0.599-0.089-0.145-0.077-0.291-0.167-0.427-0.265-0.26-0.177-0.484-0.443-0.817-0.62v-0.005h-0.005c-0.537-0.328-0.823-0.683-0.917-0.948-0.088-0.359-0.005-0.624 0.261-0.801 0.296-0.177 0.504-0.36 0.64-0.448 0.14-0.099 0.193-0.136 0.235-0.172h0.005v-0.005c0.224-0.271 0.577-0.625 1.12-0.803 0.181-0.047 0.391-0.083 0.619-0.083zM18.984 9.749c0.48 1.891 1.6 4.636 2.319 5.964 0.38 0.713 1.14 2.213 1.468 4.032 0.208-0.005 0.437 0.025 0.683 0.088 0.864-2.229-0.724-4.625-1.448-5.292-0.297-0.265-0.312-0.443-0.167-0.443 0.787 0.708 1.817 2.095 2.192 3.672 0.172 0.713 0.215 1.475 0.032 2.229 0.088 0.036 0.177 0.083 0.271 0.088 1.375 0.715 1.885 1.251 1.64 2.052v-0.057c-0.077-0.004-0.161 0-0.239 0h-0.021c0.204-0.624-0.244-1.104-1.421-1.635-1.219-0.531-2.193-0.448-2.36 0.62-0.011 0.057-0.015 0.088-0.020 0.183-0.095 0.031-0.188 0.067-0.281 0.083-0.573 0.36-0.881 0.896-1.057 1.584-0.172 0.713-0.224 1.541-0.271 2.495-0.032 0.448-0.229 1.119-0.428 1.801-2 1.432-4.776 2.052-7.129 0.448-0.152-0.26-0.329-0.5-0.537-0.713-0.099-0.167-0.224-0.312-0.369-0.443 0.244 0 0.453-0.041 0.62-0.089 0.192-0.093 0.344-0.255 0.421-0.447 0.141-0.355 0-0.928-0.464-1.553-0.457-0.619-1.239-1.323-2.38-2.025-0.843-0.531-1.317-1.161-1.536-1.86-0.219-0.713-0.188-1.448-0.021-2.192 0.328-1.427 1.167-2.817 1.704-3.688 0.14-0.083 0.047 0.183-0.547 1.303-0.527 1-1.521 3.328-0.163 5.135 0.053-1.317 0.344-2.619 0.865-3.833 0.749-1.703 2.323-4.671 2.448-7.025 0.063 0.052 0.287 0.183 0.385 0.271 0.287 0.177 0.505 0.443 0.787 0.62 0.281 0.265 0.635 0.448 1.167 0.448 0.052 0.005 0.099 0.005 0.145 0.005 0.547 0 0.975-0.177 1.328-0.355 0.385-0.183 0.699-0.448 0.989-0.536h0.005c0.62-0.177 1.115-0.537 1.391-0.933zM21.901 21.693c0.052 0.801 0.459 1.661 1.177 1.837 0.781 0.177 1.911-0.443 2.385-1.020l0.281-0.011c0.421-0.011 0.771 0.011 1.129 0.355l0.005 0.005c0.276 0.265 0.407 0.708 0.521 1.167 0.115 0.536 0.203 1.041 0.547 1.421 0.645 0.703 0.859 1.208 0.849 1.521v0c-0.021 0.348-0.251 0.525-0.667 0.791-0.839 0.537-2.328 0.948-3.276 2.095-0.824 0.984-1.828 1.52-2.715 1.588-0.885 0.073-1.651-0.265-2.099-1.197l-0.005-0.005c-0.281-0.532-0.161-1.365 0.073-2.251 0.235-0.891 0.573-1.796 0.62-2.531 0.047-0.953 0.099-1.781 0.255-2.423 0.161-0.62 0.412-1.063 0.86-1.307l0.057-0.032zM7.479 21.76h0.016c0.073 0 0.141 0.005 0.208 0.021 0.5 0.073 0.943 0.443 1.365 1l1.213 2.219 0.005 0.005c0.323 0.708 1.005 1.416 1.583 2.183 0.579 0.796 1.027 1.509 0.975 2.093v0.011c-0.079 0.989-0.641 1.525-1.5 1.724-0.86 0.177-2.027 0-3.193-0.62-1.291-0.713-2.828-0.625-3.812-0.803-0.489-0.088-0.812-0.271-0.964-0.536-0.145-0.265-0.151-0.803 0.167-1.641v-0.004c0.156-0.448 0.043-1.005-0.036-1.495-0.073-0.532-0.109-0.944 0.057-1.251 0.213-0.448 0.531-0.531 0.921-0.713 0.391-0.177 0.855-0.265 1.219-0.625h0.005v-0.005c0.339-0.353 0.595-0.796 0.891-1.115 0.251-0.271 0.505-0.448 0.88-0.448zM17.027 9.661c-0.579 0.265-1.261 0.713-1.985 0.713s-1.292-0.353-1.703-0.62c-0.208-0.181-0.375-0.359-0.5-0.448-0.219-0.176-0.193-0.447-0.099-0.447 0.145 0.020 0.172 0.181 0.265 0.271 0.131 0.088 0.287 0.265 0.479 0.443 0.391 0.265 0.912 0.624 1.557 0.624 0.647 0 1.407-0.359 1.865-0.624 0.26-0.177 0.593-0.443 0.864-0.62 0.208-0.183 0.199-0.36 0.369-0.36 0.172 0.021 0.048 0.177-0.192 0.443-0.245 0.183-0.62 0.448-0.921 0.625zM15.584 7.547v-0.025c-0.005-0.027 0.015-0.057 0.041-0.068 0.093-0.057 0.239-0.037 0.344 0.005 0.083 0 0.213 0.088 0.203 0.181-0.011 0.063-0.115 0.089-0.183 0.089-0.072 0-0.125-0.057-0.187-0.093-0.068-0.021-0.199-0.011-0.219-0.089zM14.849 7.547c-0.027 0.079-0.152 0.068-0.219 0.089-0.063 0.036-0.115 0.093-0.188 0.093-0.068 0-0.177-0.027-0.183-0.093-0.009-0.089 0.115-0.177 0.199-0.177 0.109-0.043 0.244-0.063 0.348-0.005 0.021 0.011 0.048 0.041 0.037 0.068v0.025z" />
      </svg>
    );
  }
  if (platform === 'android') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-gb-accent shrink-0">
        <path d="M16.602 11.002c-.524 0-.954-.43-.954-.954 0-.525.43-.954.954-.954.524 0 .954.43.954.954 0 .525-.43.954-.954.954zm-9.204 0c-.524 0-.954-.43-.954-.954 0-.525.43-.954.954-.954.525 0 .954.43.954.954 0 .525-.43.954-.954.954zm9.646-3.834l1.385-2.4a.477.477 0 0 0-.174-.651.478.478 0 0 0-.652.174l-1.4 2.424A7.83 7.83 0 0 0 12 5.753c-1.64 0-3.155.5-4.407 1.362l-1.4-2.424a.478.478 0 0 0-.652-.174.477.477 0 0 0-.174.651l1.385 2.4A7.95 7.95 0 0 0 3.125 13.5h17.75a7.95 7.95 0 0 0-3.629-6.332z" />
      </svg>
    );
  }
  return null;
}

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize Lenis Smooth Scrolling on Mount
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: 'vertical',
      normalizeWheel: true,
      smoothWheel: true,
    });
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);

    // Close mobile menu on resize to desktop width
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      lenis.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30 overflow-x-hidden flex flex-col pt-16">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-600/5 blur-[150px] pointer-events-none select-none"></div>

      {/* Sticky Fixed Glassmorphic Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-[#0f0f0f]/80 border-b border-white/5 select-none shrink-0">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand logo */}
          <div className="flex items-center gap-3 group select-none">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-gb-accent/5 group-hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Grabbit Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider uppercase text-white">Grabbit</span>
          </div>

          {/* Navigation links & CTA button */}
          <div className="flex items-center gap-6 relative">
            <div className="hidden md:flex items-center gap-6">
              {/* Downloads dropdown with zero-gap hover container */}
              <div 
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button 
                  className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold flex items-center gap-1 cursor-pointer py-1.5"
                >
                  Download
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown menu aligns exactly top-full with padding-top bridging hover gaps */}
                <div 
                  className={`
                    absolute right-1/2 translate-x-1/2 top-full pt-2 w-56 transition-all duration-200 origin-top
                    ${isDropdownOpen 
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                      : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                    }
                  `}
                >
                  <div className="p-2.5 rounded-gb bg-gb-surface border border-gb-border shadow-2xl space-y-1">
                    {/* Windows Link */}
                    <a 
                      href="#downloads" 
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleScrollTo(e, 'downloads');
                      }}
                      className="flex items-center justify-between p-2 rounded-gb-sm hover:bg-gb-surface-light border border-transparent hover:border-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform="windows" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-none">Windows</p>
                          <p className="text-[9px] text-gb-text-muted mt-0.5">Desktop App</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-gb-accent/15 text-gb-accent uppercase">v1.0.0</span>
                    </a>

                    {/* macOS Link */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-gb-sm border border-transparent opacity-60 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform="macos" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-none">macOS</p>
                          <p className="text-[9px] text-gb-text-muted mt-0.5">Coming Soon</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-gb-text-muted uppercase">Soon</span>
                    </div>

                    {/* Linux Link */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-gb-sm border border-transparent opacity-60 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform="linux" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-none">Linux</p>
                          <p className="text-[9px] text-gb-text-muted mt-0.5">Coming Soon</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-gb-text-muted uppercase">Soon</span>
                    </div>

                    {/* Android Link */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-gb-sm border border-transparent opacity-60 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform="android" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-none">Android</p>
                          <p className="text-[9px] text-gb-text-muted mt-0.5">Coming Soon</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-gb-text-muted uppercase">Soon</span>
                    </div>
                  </div>
                </div>
              </div>

              <a href="/docs" target="_blank" className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold">Docs</a>
              <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold">Features</a>
              
              {/* Get Started Navbar CTA Button */}
              <a 
                href="/app" 
                className="bg-gb-accent hover:bg-gb-accent-hover text-white text-xs px-4 py-2 rounded-gb font-bold transition-all shadow-md active:scale-[0.98]"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Three-Dot Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-gb bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.95] transition-all cursor-pointer"
              aria-label="Toggle Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div 
          className={`
            md:hidden fixed top-[65px] left-0 right-0 z-40 p-5 border-b border-white/5 bg-[#0f0f0f]/95 backdrop-blur-lg flex flex-col gap-4 transition-all duration-300 origin-top
            ${isMobileMenuOpen 
              ? 'opacity-100 scale-y-100 pointer-events-auto' 
              : 'opacity-0 scale-y-95 pointer-events-none'
            }
          `}
        >
          <a 
            href="#downloads" 
            onClick={(e) => {
              setIsMobileMenuOpen(false);
              handleScrollTo(e, 'downloads');
            }}
            className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold py-2 border-b border-white/5"
          >
            Download
          </a>
          <a 
            href="/docs" 
            target="_blank"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold py-2 border-b border-white/5"
          >
            Docs
          </a>
          <a 
            href="#features" 
            onClick={(e) => {
              setIsMobileMenuOpen(false);
              handleScrollTo(e, 'features');
            }}
            className="text-xs text-gb-text-dim hover:text-white transition-colors uppercase tracking-widest font-semibold py-2 border-b border-white/5"
          >
            Features
          </a>
          <a 
            href="/app" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="bg-gb-accent hover:bg-gb-accent-hover text-white text-center text-xs py-3 rounded-gb font-bold transition-all shadow-md active:scale-[0.98] mt-2"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl w-full mx-auto px-6 pt-28 pb-32 text-center relative z-10 flex flex-col items-center flex-1 justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gb-accent/10 border border-gb-accent/20 text-gb-accent text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Version 1.0.0 Available
        </div>
        
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7.5xl tracking-tighter mb-6 leading-[1.05] animate-slide-up text-white max-w-4xl text-center mx-auto">
          Any video, audio, or media. <br /> Grabbed in seconds.
        </h1>
        
        <p className="text-base sm:text-lg text-gb-text-dim mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in text-center" style={{ animationDelay: '0.1s' }}>
          An advanced, open-source download engine that makes fetching web media effortless. Just paste any URL to automatically parse quality streams and grab high-definition videos, audio tracks, or metadata in seconds. Equipped with a multithreaded acceleration core, Grabbit works natively in your browser and as a portable desktop app.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in w-full sm:w-auto mx-auto" style={{ animationDelay: '0.2s' }}>
          <a 
            href="/app" 
            className="w-full sm:w-auto bg-gb-accent hover:bg-gb-accent-hover text-white px-10 py-4.5 rounded-xl font-bold text-base transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-gb-accent/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Get Started
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
          <a 
            href="#downloads" 
            onClick={(e) => handleScrollTo(e, 'downloads')}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-8 py-4.5 rounded-xl font-bold text-base transition-all border border-white/5 flex items-center justify-center gap-2 cursor-pointer"
          >
            Download App
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl w-full mx-auto px-6 py-20 border-t border-white/5 relative z-10 self-center">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mb-2">Designed for Simplicity</h2>
          <p className="text-sm text-gb-text-muted">High-performance features packaged in a clean, minimal user experience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border space-y-4">
            <div className="w-11 h-11 bg-gb-accent/5 rounded-xl flex items-center justify-center border border-gb-accent/15 text-gb-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-white">Maximum Speeds</h3>
            <p className="text-gb-text-dim text-xs leading-relaxed">
              Uses multiple parallel connections to download files at the highest possible speed supported by your connection.
            </p>
          </div>

          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border space-y-4">
            <div className="w-11 h-11 bg-gb-accent/5 rounded-xl flex items-center justify-center border border-gb-accent/15 text-gb-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                <path d="M12 7v10M7 12h10" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-white">Full Quality</h3>
            <p className="text-gb-text-dim text-xs leading-relaxed">
              Downloads the highest available resolution (up to 4K) and audio track automatically, combining them cleanly on your system.
            </p>
          </div>

          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border space-y-4">
            <div className="w-11 h-11 bg-gb-accent/5 rounded-xl flex items-center justify-center border border-gb-accent/15 text-gb-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-white">No Setup Required</h3>
            <p className="text-gb-text-dim text-xs leading-relaxed">
              The application contains everything it needs inside a single installer. Run the app and start downloading immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="downloads" className="max-w-6xl w-full mx-auto px-6 py-20 border-t border-white/5 relative z-10 self-center">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mb-2">Supported Platforms</h2>
          <p className="text-sm text-gb-text-muted">Select the package format compatible with your desktop system.</p>
        </div>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Windows Platform Card */}
          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border flex flex-col justify-between hover:border-gb-accent/30 transition-all group">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PlatformIcon platform="windows" />
                <span className="text-[10px] text-gb-text-muted font-bold uppercase tracking-wider">Windows 10/11</span>
              </div>
              <h3 className="font-display font-bold text-base text-white mb-2">Windows</h3>
              <p className="text-gb-text-muted text-xs leading-relaxed mb-6">
                Standard guided setup package. Sets up desktop shortcuts and configures updates automatically.
              </p>
            </div>
            <a 
              href="/downloads/Grabbit-Setup.exe"
              className="w-full py-3 bg-gb-accent hover:bg-gb-accent-hover text-white text-center text-xs font-bold rounded-gb transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gb-accent/10"
              id="download-windows"
            >
              Download
            </a>
          </div>

          {/* macOS Platform Card */}
          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border flex flex-col justify-between opacity-60 select-none">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PlatformIcon platform="macos" />
                <span className="text-[10px] text-gb-text-muted font-bold uppercase tracking-wider">macOS App</span>
              </div>
              <h3 className="font-display font-bold text-base text-white mb-2">macOS</h3>
              <p className="text-gb-text-muted text-xs leading-relaxed mb-6">
                Optimized package supporting Apple Silicon (M1/M2/M3) and Intel Core processors.
              </p>
            </div>
            <button 
              disabled
              className="w-full py-3 bg-white/5 text-gb-text-muted text-center text-xs font-bold rounded-gb border border-white/5 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Linux Platform Card */}
          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border flex flex-col justify-between opacity-60 select-none">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PlatformIcon platform="linux" />
                <span className="text-[10px] text-gb-text-muted font-bold uppercase tracking-wider">Linux AppImage</span>
              </div>
              <h3 className="font-display font-bold text-base text-white mb-2">Linux</h3>
              <p className="text-gb-text-muted text-xs leading-relaxed mb-6">
                Standalone package built on the standard kernel. Compatible with major desktop distributions.
              </p>
            </div>
            <button 
              disabled
              className="w-full py-3 bg-white/5 text-gb-text-muted text-center text-xs font-bold rounded-gb border border-white/5 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Android Platform Card */}
          <div className="p-6 rounded-gb bg-gb-surface border border-gb-border flex flex-col justify-between opacity-60 select-none">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PlatformIcon platform="android" />
                <span className="text-[10px] text-gb-text-muted font-bold uppercase tracking-wider">Android App</span>
              </div>
              <h3 className="font-display font-bold text-base text-white mb-2">Android</h3>
              <p className="text-gb-text-muted text-xs leading-relaxed mb-6">
                Mobile companion package designed for ARM architectures and standard Android package installations.
              </p>
            </div>
            <button 
              disabled
              className="w-full py-3 bg-white/5 text-gb-text-muted text-center text-xs font-bold rounded-gb border border-white/5 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-16 border-t border-white/5 relative z-10 text-xs shrink-0 mt-auto self-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-gb-accent/5">
                <img src="/logo.png" alt="Grabbit Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-display font-bold tracking-widest uppercase text-white">Grabbit</span>
            </div>
            <p className="text-gb-text-muted text-[11px] leading-relaxed max-w-[200px]">
              A lightning-fast, high-quality media downloader built for simplicity and power.
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">Product</p>
            <ul className="space-y-2 text-gb-text-dim text-[11px]">
              <li><a href="/app" className="hover:text-white transition-colors">Playground Client</a></li>
              <li><a href="#downloads" onClick={(e) => handleScrollTo(e, 'downloads')} className="hover:text-white transition-colors">Download App</a></li>
              <li><a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-white transition-colors">Features List</a></li>
            </ul>
          </div>

          {/* Resources links */}
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">Resources</p>
            <ul className="space-y-2 text-gb-text-dim text-[11px]">
              <li><a href="/docs" target="_blank" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="https://github.com/zubulika/Grabbit" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><a href="/docs" target="_blank" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">Legal</p>
            <ul className="space-y-2 text-gb-text-dim text-[11px]">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Open Source Compliance</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-gb-text-muted text-[11px]">
          <p>&copy; 2026 Grabbit. MIT Licensed. Powered by Lessmanual Technologies.</p>
          <div className="flex gap-4">
            <a href="https://github.com/zubulika/Grabbit" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
