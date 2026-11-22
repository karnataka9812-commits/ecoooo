import { Link } from 'react-router-dom';
import { ArrowRight, Mic, MicOff, Pause, Play, RotateCcw } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { AcousticVisualizer } from '../components/observatory/AcousticVisualizer';
import { Button, MetricReadout, SkeletonPanel, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import { DEMO_HABITAT_PRESETS } from '../data/demoFixtures';
import {
  formatDurationSeconds,
  formatTimestampTime,
  getDisturbanceCategoryLabel,
} from '../lib/acoustics';

export function ObservatoryPage() {
  const {
    monitoringStatus,
    activePreset,
    elapsedSec,
    streamMetrics,
    detections,
    disturbances,
    soundscape,
    isLoading,
    appearance,
    setActivePreset,
    toggleMonitoringStream,
    resetDemoSession,
  } = useEcoSonic();

  const presetDetections = detections
    .filter((d) => d.habitatPreset === activePreset)
    .slice(0, 5);

  const activeSessionId =
    activePreset === 'temperate-rainforest'
      ? 'ses-2026-1121-a'
      : activePreset === 'boreal-wetland'
        ? 'ses-2026-1120-b'
        : 'ses-2026-1119-c';

  const recentDisturbances = disturbances
    .filter((ev) => ev.sessionId === activeSessionId)
    .slice(0, 4);

  return (
    <AppShell
      title="Live Observatory"
      subtitle="Acoustic stream monitor, spectral envelope, and real-time demonstration fixture telemetry"
    >
      <div className="space-y-6">
        {/* Explicit DEMO MODE Notice & Session Controls */}
        <SurfacePanel className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-xs">
              <span className="font-mono font-medium text-[#D3A36C]">
                DEMO MODE · ISOLATED FIXTURE STREAM
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-[var(--app-text-muted)]">
                ·
              </span>
              <span className="text-[var(--app-text-muted)]">
                Browser microphone capture awaits backend WebSocket integration
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label="Select demonstration habitat station">
              {DEMO_HABITAT_PRESETS.map((preset) => {
                const active = preset.id === activePreset;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePreset(preset.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#788B68] text-[#101C17] font-semibold'
                        : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)] text-xs">
              {monitoringStatus === 'streaming' ? (
                <Mic className="w-3.5 h-3.5 text-[#788B68]" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-[#D3A36C]" />
              )}
              <span className="text-[var(--app-text-secondary)]">
                Input: Demo Fixture ({streamMetrics.sampleRateHz / 1000} kHz)
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={toggleMonitoringStream}
              aria-label={monitoringStatus === 'streaming' ? 'Pause demo stream' : 'Start demo stream'}
            >
              {monitoringStatus === 'streaming' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Stream</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={resetDemoSession}
              aria-label="Reset session timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Timer</span>
            </Button>
          </div>
        </SurfacePanel>

        {/* Primary Acoustic Visualizer */}
        <section aria-label="Acoustic spectrogram and waveform monitor">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 className="text-sm font-medium text-[var(--app-text-secondary)]">
              Spectral Waterfall & Time-Domain Envelope
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[var(--app-text-muted)]">
              <span>
                Peak: <strong className="text-[var(--app-text)]">{streamMetrics.peakFrequencyHz} Hz</strong>
              </span>
              <span>
                RMS: <strong className="text-[var(--app-text)]">{streamMetrics.rmsLevelDbfs.toFixed(1)} dBFS</strong>
              </span>
              <span>
                Elapsed: <strong className="text-[var(--app-text)]">{formatDurationSeconds(elapsedSec)}</strong>
              </span>
            </div>
          </div>

          <AcousticVisualizer
            status={monitoringStatus}
            presetId={activePreset}
            peakFrequencyHz={streamMetrics.peakFrequencyHz}
            rmsLevelDbfs={streamMetrics.rmsLevelDbfs}
            reducedMotion={appearance.reducedMotionOverride}
            height={300}
          />
        </section>

        {/* Processing & Soundscape Metrics Strip */}
        {isLoading || !soundscape ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonPanel />
            <SkeletonPanel />
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        ) : (
          <section aria-label="Live soundscape and processing statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricReadout
              label="Acoustic Complexity (ACI)"
              value={soundscape.indices.aci.toFixed(1)}
              context="Spectral temporal variation (Demo fixture)"
            />
            <MetricReadout
              label="NDSI Balance"
              value={(soundscape.indices.ndsi >= 0 ? '+' : '') + soundscape.indices.ndsi.toFixed(2)}
              accent="moss"
              context="Biophony vs anthrophony ratio (-1 to +1)"
            />
            <MetricReadout
              label="Spectral Entropy (H′)"
              value={soundscape.indices.spectralEntropy.toFixed(2)}
              context="Normalized frequency dispersion (0 to 1)"
            />
            <MetricReadout
              label="Frames Processed"
              value={streamMetrics.framesProcessed.toLocaleString()}
              unit={`${streamMetrics.bufferLatencyMs} ms`}
              context="3.0s sliding inference window (Demo)"
            />
          </section>
        )}

        {/* Two-column Split: Live Species Detections & Disturbance Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfacePanel as="section" className="lg:col-span-7 p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--app-border)]">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                  Recent Species Detections
                </h2>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  Confidence scores reflect raw model output, not calibrated probabilities.
                </p>
              </div>
              <Link
                to="/app/detections"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#788B68] hover:underline underline-offset-4 whitespace-nowrap"
              >
                <span>All Detections</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[var(--app-border)] mt-2">
              {presetDetections.map((det) => (
                <div
                  key={det.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--app-text)] truncate">
                      {appearance.showScientificNamesFirst ? det.scientificName : det.commonName}
                    </div>
                    <div className="text-xs text-[var(--app-text-muted)] truncate">
                      <span className="italic">
                        {appearance.showScientificNamesFirst ? det.commonName : det.scientificName}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        {det.frequencyRangeHz[0]}–{det.frequencyRangeHz[1]} Hz
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="text-sm font-medium text-[#788B68]">
                      {det.confidenceScore.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-[var(--app-text-muted)]">
                      {formatTimestampTime(det.timestampIso)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SurfacePanel>

          <SurfacePanel as="section" className="lg:col-span-5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--app-border)]">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                    Disturbance Signals
                  </h2>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    Non-biological acoustic events in active fixture
                  </p>
                </div>
                <Link
                  to="/app/disturbances"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D3A36C] hover:underline underline-offset-4 whitespace-nowrap"
                >
                  <span>Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[var(--app-border)] mt-2">
                {recentDisturbances.map((ev) => (
                  <div key={ev.id} className="py-3.5 space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--app-text)]">
                        {ev.label}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#D3A36C] shrink-0">
                        {ev.peakDbfs.toFixed(1)} dBFS
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                      <span>{getDisturbanceCategoryLabel(ev.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{ev.severity} intensity</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatTimestampTime(ev.timestampIso)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--app-border)] text-xs text-[var(--app-text-muted)]">
              Session ID:{' '}
              <span className="font-mono text-[var(--app-text-secondary)]">{activeSessionId}</span>
            </div>
          </SurfacePanel>
        </div>
      </div>
    </AppShell>
  );
}
