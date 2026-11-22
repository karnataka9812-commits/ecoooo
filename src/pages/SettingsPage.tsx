import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import { validateEndpointUrl } from '../lib/acoustics';

export function SettingsPage() {
  const {
    adapter,
    appearance,
    audioPrefs,
    backendConfig,
    updateAppearance,
    updateAudioPrefs,
    updateBackendConfig,
    resetAllPreferences,
  } = useEcoSonic();

  const [apiUrlInput, setApiUrlInput] = useState(backendConfig.apiBaseUrl);
  const [wsUrlInput, setWsUrlInput] = useState(backendConfig.wsStreamUrl);
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const diagnostics = adapter.getDiagnostics();

  const handleSaveBackendConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const apiCheck = validateEndpointUrl(apiUrlInput, ['http:', 'https:']);
    if (!apiCheck.valid) {
      setEndpointError(`API URL: ${apiCheck.reason}`);
      return;
    }
    const wsCheck = validateEndpointUrl(wsUrlInput, ['ws:', 'wss:']);
    if (!wsCheck.valid) {
      setEndpointError(`WebSocket URL: ${wsCheck.reason}`);
      return;
    }

    setEndpointError(null);
    updateBackendConfig({
      apiBaseUrl: apiUrlInput.trim(),
      wsStreamUrl: wsUrlInput.trim(),
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    resetAllPreferences();
    setApiUrlInput('http://localhost:8000');
    setWsUrlInput('ws://localhost:8000/ws/audio');
    setEndpointError(null);
    setSavedNotice(false);
  };

  return (
    <AppShell
      title="Settings & Diagnostics"
      subtitle="Appearance, audio input preferences, backend adapter endpoints, and system capabilities"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Application Appearance */}
          <SurfacePanel as="section" className="p-6 space-y-5">
            <div className="pb-3 border-b border-[var(--app-border)]">
              <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                Application Appearance
              </h2>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Configure workspace surface contrast and taxonomic display conventions
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-[var(--app-text-muted)] mb-2">
                  Workspace Surface Theme
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateAppearance({ theme: 'deep-forest' })}
                    className={`px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      appearance.theme === 'deep-forest'
                        ? 'bg-[#788B68] text-[#101C17] font-semibold'
                        : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)]'
                    }`}
                  >
                    Deep Forest (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAppearance({ theme: 'field-light' })}
                    className={`px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      appearance.theme === 'field-light'
                        ? 'bg-[#788B68] text-[#101C17] font-semibold'
                        : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)]'
                    }`}
                  >
                    Warm Ivory Field Light
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-[var(--app-text)]">
                    Prioritize Scientific Binomial Names
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)]">
                    Display Latin taxonomy ahead of common names in species logs
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appearance.showScientificNamesFirst}
                  onChange={(e) =>
                    updateAppearance({ showScientificNamesFirst: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#788B68]"
                />
              </label>

              <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-[var(--app-text)]">
                    Static Visualizer Mode (Reduced Motion)
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)]">
                    Freeze continuous spectrogram scrolling in the Live Observatory
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appearance.reducedMotionOverride}
                  onChange={(e) =>
                    updateAppearance({ reducedMotionOverride: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#788B68]"
                />
              </label>
            </div>
          </SurfacePanel>

          {/* Audio Input Preferences */}
          <SurfacePanel as="section" className="p-6 space-y-5">
            <div className="pb-3 border-b border-[var(--app-border)]">
              <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                Audio Input Preferences
              </h2>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Preferred capture parameters for future Web Audio API microphone streaming
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sample-rate-select"
                  className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
                >
                  Target Sample Rate
                </label>
                <select
                  id="sample-rate-select"
                  value={audioPrefs.sampleRateHz}
                  onChange={(e) =>
                    updateAudioPrefs({ sampleRateHz: Number(e.target.value) as 44100 | 48000 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)]"
                >
                  <option value={48000}>48,000 Hz (Bioacoustic Standard)</option>
                  <option value={44100}>44,100 Hz (CD Standard)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fft-size-select"
                  className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
                >
                  Visualizer FFT Window Size
                </label>
                <select
                  id="fft-size-select"
                  value={audioPrefs.fftSize}
                  onChange={(e) =>
                    updateAudioPrefs({ fftSize: Number(e.target.value) as 1024 | 2048 | 4096 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)]"
                >
                  <option value={1024}>1024 bins</option>
                  <option value={2048}>2048 bins</option>
                  <option value={4096}>4096 bins</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="default-confidence"
                className="flex items-center justify-between text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
              >
                <span>Default Display Confidence Threshold</span>
                <span className="font-mono tabular-nums text-[var(--app-text)]">
                  {audioPrefs.minConfidenceThreshold.toFixed(2)}
                </span>
              </label>
              <input
                id="default-confidence"
                type="range"
                min={0.1}
                max={0.95}
                step={0.05}
                value={audioPrefs.minConfidenceThreshold}
                onChange={(e) =>
                  updateAudioPrefs({ minConfidenceThreshold: Number(e.target.value) })
                }
                className="w-full accent-[#788B68] cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-[var(--app-text)]">
                    Disable Browser Noise Suppression
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)]">
                    Recommended off for bioacoustics so bird vocalizations are not attenuated
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!audioPrefs.noiseSuppression}
                  onChange={(e) => updateAudioPrefs({ noiseSuppression: !e.target.checked })}
                  className="w-4 h-4 accent-[#788B68]"
                />
              </label>

              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-[var(--app-text)]">
                    Disable Auto Gain Control (AGC)
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)]">
                    Preserves true relative dBFS amplitude ratios across frequencies
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!audioPrefs.autoGainControl}
                  onChange={(e) => updateAudioPrefs({ autoGainControl: !e.target.checked })}
                  className="w-4 h-4 accent-[#788B68]"
                />
              </label>
            </div>
          </SurfacePanel>

          {/* Backend Connection Endpoints (No secrets stored or exposed) */}
          <SurfacePanel as="section" className="p-6 space-y-5">
            <div className="pb-3 border-b border-[var(--app-border)]">
              <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                Backend Connection
              </h2>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Stage 2 integration endpoints for Antigravity. No credentials or API secrets are
                stored in the browser.
              </p>
            </div>

            <form onSubmit={handleSaveBackendConfig} className="space-y-4">
              <div>
                <label
                  htmlFor="api-base-url"
                  className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
                >
                  REST API Base URL
                </label>
                <input
                  id="api-base-url"
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] focus:outline-none focus:border-[#788B68]"
                />
              </div>

              <div>
                <label
                  htmlFor="ws-stream-url"
                  className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
                >
                  WebSocket Stream URL
                </label>
                <input
                  id="ws-stream-url"
                  type="text"
                  value={wsUrlInput}
                  onChange={(e) => setWsUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] focus:outline-none focus:border-[#788B68]"
                />
              </div>

              {endpointError && (
                <p role="alert" className="text-xs text-[#D3A36C]">
                  {endpointError}
                </p>
              )}

              {savedNotice && (
                <p role="status" className="inline-flex items-center gap-1.5 text-xs text-[#788B68]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Endpoint preferences saved locally for Stage 2 handoff.</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button type="submit" variant="primary" size="sm">
                  Save Endpoints
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </Button>
              </div>
            </form>
          </SurfacePanel>
        </div>

        {/* Diagnostics Panel */}
        <SurfacePanel as="section" className="lg:col-span-5 p-6 space-y-5">
          <div className="pb-3 border-b border-[var(--app-border)]">
            <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
              Diagnostics
            </h2>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Client runtime capability and adapter state inspection
            </p>
          </div>

          <dl className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--app-border)]">
              <dt className="text-[var(--app-text-muted)]">Active Data Adapter</dt>
              <dd className="font-mono text-[var(--app-text)] text-right">
                {diagnostics.adapterName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--app-border)]">
              <dt className="text-[var(--app-text-muted)]">Operation Mode</dt>
              <dd className="font-mono text-[#D3A36C]">
                {diagnostics.isDemoMode ? 'DEMO FIXTURE MODE' : 'LIVE'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--app-border)]">
              <dt className="text-[var(--app-text-muted)]">Adapter Contract</dt>
              <dd className="font-mono text-[var(--app-text-secondary)] text-right">
                {diagnostics.protocolVersion}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--app-border)]">
              <dt className="text-[var(--app-text-muted)]">Web Audio API</dt>
              <dd className="font-mono text-[#788B68]">
                {diagnostics.browserAudioApiSupported ? 'Supported' : 'Unavailable'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--app-border)]">
              <dt className="text-[var(--app-text-muted)]">MediaDevices.getUserMedia</dt>
              <dd className="font-mono text-[#788B68]">
                {diagnostics.mediaDevicesSupported ? 'Available' : 'Unavailable'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <dt className="text-[var(--app-text-muted)]">WebSocket State</dt>
              <dd className="font-mono text-[var(--app-text-muted)]">
                Not connected (Stage 1 Demo)
              </dd>
            </div>
          </dl>
        </SurfacePanel>
      </div>
    </AppShell>
  );
}
