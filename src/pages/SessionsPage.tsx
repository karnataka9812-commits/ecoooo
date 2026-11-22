import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, MapPin } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, SkeletonPanel, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import { formatDurationSeconds, formatTimestampDateTime } from '../lib/acoustics';

export function SessionsPage() {
  const { sessions, isLoading } = useEcoSonic();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeSession =
    sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null;

  return (
    <AppShell
      title="Session History"
      subtitle="Archived and active monitoring sessions with species, disturbance, and soundscape summaries"
    >
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SkeletonPanel className="lg:col-span-5 h-80" />
          <SkeletonPanel className="lg:col-span-7 h-80" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<History className="w-5 h-5" />}
          title="No monitoring sessions recorded"
          description="Acoustic sessions appear here once an observation stream has been initialized."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Session List */}
          <SurfacePanel as="section" className="lg:col-span-5 divide-y divide-[var(--app-border)]">
            <div className="p-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[var(--app-text)]">
                Recorded Sessions
              </h2>
              <span className="text-xs font-mono text-[var(--app-text-muted)]">
                {sessions.length} Demo Fixtures
              </span>
            </div>

            {sessions.map((session) => {
              const selected = activeSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedId(session.id)}
                  className={`w-full text-left p-5 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[var(--app-surface-elevated)]/70'
                      : 'hover:bg-[var(--app-surface-elevated)]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[var(--app-text-muted)]">{session.id}</span>
                    <span
                      className={`font-mono capitalize ${
                        session.status === 'streaming'
                          ? 'text-[#788B68]'
                          : 'text-[var(--app-text-muted)]'
                      }`}
                    >
                      {session.status === 'streaming' ? 'Demo Streaming' : session.status}
                    </span>
                  </div>

                  <div className="mt-1.5 text-sm font-medium text-[var(--app-text)]">
                    {session.title}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                    <span>{formatTimestampDateTime(session.startedAtIso)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDurationSeconds(session.durationSec)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{session.speciesDetectionCount} detections</span>
                  </div>
                </button>
              );
            })}
          </SurfacePanel>

          {/* Session Inspector */}
          {activeSession && (
            <SurfacePanel as="section" className="lg:col-span-7 p-6 space-y-6">
              <div className="pb-5 border-b border-[var(--app-border)] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D3A36C]">
                    <span>{activeSession.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">
                      {activeSession.status === 'streaming'
                        ? 'Demo Stream Active'
                        : activeSession.status}
                    </span>
                  </div>
                  <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[var(--app-text)]">
                    {activeSession.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                    <MapPin className="w-3.5 h-3.5 text-[#788B68]" />
                    <span>{activeSession.siteName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{activeSession.coordinatesLabel}</span>
                  </div>
                </div>

                <Link
                  to={`/app/detections?session=${activeSession.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#788B68] text-[#101C17] text-xs font-semibold hover:bg-[#899D78] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Inspect Species Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
                  <div className="text-xs text-[var(--app-text-muted)]">Duration</div>
                  <div className="mt-1.5 text-xl font-mono font-medium tabular-nums text-[var(--app-text)]">
                    {formatDurationSeconds(activeSession.durationSec)}
                  </div>
                </div>
                <div className="p-4 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
                  <div className="text-xs text-[var(--app-text-muted)]">Species Detections</div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-xl font-mono font-medium tabular-nums text-[#788B68]">
                      {activeSession.speciesDetectionCount}
                    </span>
                    <span className="text-xs font-mono text-[var(--app-text-muted)]">
                      {activeSession.distinctSpeciesCount} taxa
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
                  <div className="text-xs text-[var(--app-text-muted)]">Disturbance Events</div>
                  <div className="mt-1.5 text-xl font-mono font-medium tabular-nums text-[var(--app-amber)]">
                    {activeSession.disturbanceEventCount}
                  </div>
                </div>
                <div className="p-4 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
                  <div className="text-xs text-[var(--app-text-muted)]">Sample Rate</div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-xl font-mono font-medium tabular-nums text-[var(--app-text)]">
                      {(activeSession.sampleRateHz / 1000).toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-[var(--app-text-muted)]">kHz</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--app-text-muted)] mb-3">
                  Soundscape Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)] text-sm">
                  <div>
                    <div className="text-xs text-[var(--app-text-muted)]">Mean ACI</div>
                    <div className="mt-1 font-mono tabular-nums text-[var(--app-text)]">
                      {activeSession.soundscapeSummary.aciMean.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-text-muted)]">Mean NDSI</div>
                    <div className="mt-1 font-mono tabular-nums text-[#788B68]">
                      +{activeSession.soundscapeSummary.ndsiMean.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-text-muted)]">Mean Entropy</div>
                    <div className="mt-1 font-mono tabular-nums text-[var(--app-text)]">
                      {activeSession.soundscapeSummary.spectralEntropyMean.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--app-text-muted)]">Dominant Band</div>
                    <div className="mt-1 font-mono tabular-nums text-[var(--app-text)]">
                      {activeSession.soundscapeSummary.dominantBandHz}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--app-text-muted)] mb-1.5">
                  Field Notes
                </h3>
                <p className="text-sm text-[var(--app-text-secondary)] leading-relaxed">
                  {activeSession.notes}
                </p>
              </div>
            </SurfacePanel>
          )}
        </div>
      )}
    </AppShell>
  );
}
