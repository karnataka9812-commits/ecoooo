import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  AudioWaveform,
  Bird,
  History,
  Menu,
  Radio,
  Settings,
  ShieldAlert,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useEcoSonic } from '../../context/EcoSonicContext';
import { DEMO_HABITAT_PRESETS } from '../../data/demoFixtures';
import { formatDurationSeconds } from '../../lib/acoustics';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APP_NAV_ITEMS: NavItem[] = [
  { to: '/app/observatory', label: 'Live Observatory', icon: Radio },
  { to: '/app/detections', label: 'Species Intelligence', icon: Bird },
  { to: '/app/soundscape', label: 'Soundscape', icon: AudioWaveform },
  { to: '/app/disturbances', label: 'Disturbance Radar', icon: ShieldAlert },
  { to: '/app/sessions', label: 'Session History', icon: History },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDemoMode, monitoringStatus, activePreset, elapsedSec } = useEcoSonic();
  const location = useLocation();

  const activeHabitat =
    DEMO_HABITAT_PRESETS.find((p) => p.id === activePreset) ?? DEMO_HABITAT_PRESETS[0];

  const statusText =
    monitoringStatus === 'streaming'
      ? 'Demo Stream Active'
      : monitoringStatus === 'paused'
        ? 'Demo Stream Paused'
        : 'Idle';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--app-surface)] border-r border-[var(--app-border)] text-[var(--app-text)]">
      <div className="px-6 py-5 border-b border-[var(--app-border)] flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-xl font-semibold tracking-tight text-[var(--app-text)] whitespace-nowrap"
        >
          EcoSonic 3.0
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-md text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Observatory workspace navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--app-surface-elevated)] text-[var(--app-text)] border border-[var(--app-border-strong)]'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-elevated)]/40 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--app-border)] space-y-3">
        <div className="px-3 py-2.5 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--app-amber)] whitespace-nowrap">
            {isDemoMode ? 'DEMO MODE · FIXTURE' : 'BACKEND CONNECTED'}
          </div>
          <div className="mt-1 text-xs text-[var(--app-text-secondary)] truncate">
            {activeHabitat.label}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs font-mono tabular-nums text-[var(--app-text-muted)]">
            <Activity className="w-3.5 h-3.5 text-[#788B68] shrink-0" />
            <span>{statusText}</span>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex">
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/65"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-[var(--app-bg)]/95 backdrop-blur-sm border-b border-[var(--app-border)] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-md text-[var(--app-text-secondary)] hover:bg-[var(--app-surface)] min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[var(--app-text)] truncate">
                {title}
              </h1>
              <p className="text-xs text-[var(--app-text-muted)] truncate hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
              <span>{activeHabitat.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[var(--app-text-secondary)]">
                {formatDurationSeconds(elapsedSec)}
              </span>
            </div>
            <div
              data-testid="demo-mode-badge"
              className="px-2.5 py-1 rounded border border-[#D3A36C]/40 bg-[#D3A36C]/10 text-[#D3A36C] font-mono text-[11px] font-medium whitespace-nowrap"
            >
              {isDemoMode ? 'DEMO MODE' : 'LIVE'}
            </div>
          </div>
        </header>

        <main
          key={location.pathname}
          className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1360px] w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
