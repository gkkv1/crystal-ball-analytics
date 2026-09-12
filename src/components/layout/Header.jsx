// src/components/layout/Header.jsx
// Crystal Ball — Application Header
// Left: TCS logo from assets | Center: Title | Right: Theme toggle, Expo Mode, Home

import { Monitor, Home, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import TCSLogo from '../../assets/TCSLogo.png';

export default function Header({ onHome, showHome = true, presentationMode, onTogglePresentation, moduleLabel = 'Revenue Performance' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className="flex items-center justify-between px-5 shrink-0"
      style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0D2040 100%)',
        minHeight: 58,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* LEFT — TCS Logo */}
      <div className="flex items-center gap-3 min-w-[160px]">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.97)',
            padding: '4px 10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}
        >
          <img
            src={TCSLogo}
            alt="TCS — Tata Consultancy Services"
            style={{ height: 26, width: 'auto', display: 'block' }}
          />
        </div>
        <div className="hidden md:flex flex-col">
          <span
            className="text-white/90 font-semibold"
            style={{ fontSize: 9.5, letterSpacing: '0.07em', textTransform: 'uppercase' }}
          >
            Industrial Autonomy
          </span>
          <span
            className="text-blue-300"
            style={{ fontSize: 8.5, letterSpacing: '0.05em' }}
          >
            &amp; Engineering Division
          </span>
        </div>
      </div>

      {/* CENTER — Title */}
      <div className="flex-1 text-center px-4">
        <h1 className="text-white font-bold tracking-tight" style={{ fontSize: 15.5, letterSpacing: '-0.01em' }}>
          {moduleLabel} Dashboard
          <span className="ml-2 text-blue-300/60 font-light hidden lg:inline">|</span>
          <span className="ml-2 text-blue-300 font-semibold hidden lg:inline" style={{ fontSize: 13 }}>Crystal Ball</span>
        </h1>
        <p className="text-slate-400 mt-0.5" style={{ fontSize: 9.5, letterSpacing: '0.08em' }}>
          ANALYTICS PLATFORM · SYNTHETIC DEMO DATA · ALL NUMBERS IN BEACON INR CR.
        </p>
      </div>

      {/* RIGHT — Controls */}
      <div className="flex items-center gap-2 min-w-[160px] justify-end">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="theme-toggle"
          aria-label="Toggle dark/light theme"
        >
          {isDark
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Presentation Mode */}
        <button
          onClick={onTogglePresentation}
          title={presentationMode ? 'Exit Presentation Mode' : 'Presentation Mode'}
          className={clsx(
            'hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            presentationMode
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white border border-white/10'
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          {presentationMode ? 'Exit Expo' : 'Expo Mode'}
        </button>

        {/* Home */}
        {showHome && (
          <button
            onClick={onHome}
            className="nav-home-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/75 hover:bg-white/20 hover:text-white text-xs font-semibold transition-all border border-white/10"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        )}
      </div>
    </header>
  );
}
