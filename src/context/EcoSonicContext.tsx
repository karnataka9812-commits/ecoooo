import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultEcoSonicAdapter, type EcoSonicDataAdapter } from '../adapters/ecosonicAdapter';
import type {
  AcousticStreamMetrics,
  AppAppearancePreferences,
  AudioInputPreferences,
  BackendConnectionConfig,
  DisturbanceEvent,
  HabitatPresetId,
  MonitoringSession,
  MonitoringStatus,
  SoundscapeSnapshot,
  SpeciesDetection,
} from '../types/ecosonic';

interface EcoSonicContextValue {
  adapter: EcoSonicDataAdapter;
  isDemoMode: boolean;
  monitoringStatus: MonitoringStatus;
  activePreset: HabitatPresetId;
  elapsedSec: number;
  streamMetrics: AcousticStreamMetrics;
  detections: SpeciesDetection[];
  disturbances: DisturbanceEvent[];
  sessions: MonitoringSession[];
  soundscape: SoundscapeSnapshot | null;
  isLoading: boolean;
  appearance: AppAppearancePreferences;
  audioPrefs: AudioInputPreferences;
  backendConfig: BackendConnectionConfig;
  setActivePreset: (preset: HabitatPresetId) => void;
  toggleMonitoringStream: () => void;
  resetDemoSession: () => void;
  updateAppearance: (patch: Partial<AppAppearancePreferences>) => void;
  updateAudioPrefs: (patch: Partial<AudioInputPreferences>) => void;
  updateBackendConfig: (patch: Partial<BackendConnectionConfig>) => void;
  resetAllPreferences: () => void;
}

const DEFAULT_APPEARANCE: AppAppearancePreferences = {
  theme: 'deep-forest',
  reducedMotionOverride: false,
  showScientificNamesFirst: false,
};

const DEFAULT_AUDIO_PREFS: AudioInputPreferences = {
  preferredDeviceId: 'default',
  sampleRateHz: 48000,
  fftSize: 2048,
  minConfidenceThreshold: 0.65,
  noiseSuppression: false,
  autoGainControl: false,
};

const DEFAULT_BACKEND_CONFIG: BackendConnectionConfig = {
  apiBaseUrl: 'http://localhost:8000',
  wsStreamUrl: 'ws://localhost:8000/ws/audio',
  reconnectIntervalMs: 3000,
  mode: 'demo',
};

const EcoSonicContext = createContext<EcoSonicContextValue | null>(null);

export function EcoSonicProvider({
  children,
  adapter = defaultEcoSonicAdapter,
}: {
  children: React.ReactNode;
  adapter?: EcoSonicDataAdapter;
}) {
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>('streaming');
  const [activePreset, setActivePreset] = useState<HabitatPresetId>('temperate-rainforest');
  const [elapsedSec, setElapsedSec] = useState<number>(2140);
  const [streamMetrics, setStreamMetrics] = useState<AcousticStreamMetrics>(() =>
    adapter.getInitialStreamMetrics()
  );

  const [detections, setDetections] = useState<SpeciesDetection[]>([]);
  const [disturbances, setDisturbances] = useState<DisturbanceEvent[]>([]);
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [soundscape, setSoundscape] = useState<SoundscapeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [appearance, setAppearance] = useState<AppAppearancePreferences>(DEFAULT_APPEARANCE);
  const [audioPrefs, setAudioPrefs] = useState<AudioInputPreferences>(DEFAULT_AUDIO_PREFS);
  const [backendConfig, setBackendConfig] = useState<BackendConnectionConfig>(DEFAULT_BACKEND_CONFIG);

  // Sync theme attribute on documentElement for /app/* workspace
  useEffect(() => {
    if (appearance.theme === 'field-light') {
      document.documentElement.setAttribute('data-theme', 'field-light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [appearance.theme]);

  // Initial load from adapter
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([
      adapter.fetchDetections(),
      adapter.fetchDisturbances(),
      adapter.fetchSessions(),
      adapter.fetchSoundscapeSnapshot(activePreset),
    ])
      .then(([det, dist, ses, snd]) => {
        if (!active) return;
        setDetections(det);
        setDisturbances(dist);
        setSessions(ses);
        setSoundscape(snd);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adapter, activePreset]);

  // Subtle deterministic telemetry progression while demo stream is active
  useEffect(() => {
    if (monitoringStatus !== 'streaming') return;
    const interval = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
      setStreamMetrics((prev) => {
        const phase = (prev.framesProcessed % 20) / 20;
        const rmsJitter = Math.sin(phase * Math.PI * 2) * 1.4;
        const baseFreq =
          activePreset === 'temperate-rainforest'
            ? 3420
            : activePreset === 'boreal-wetland'
              ? 2180
              : 1640;
        return {
          ...prev,
          framesProcessed: prev.framesProcessed + 1,
          rmsLevelDbfs: Number((-37.6 + rmsJitter).toFixed(1)),
          peakFrequencyHz: Math.round(baseFreq + Math.cos(phase * Math.PI * 2) * 380),
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [monitoringStatus, activePreset]);

  const toggleMonitoringStream = useCallback(() => {
    setMonitoringStatus((prev) => (prev === 'streaming' ? 'paused' : 'streaming'));
  }, []);

  const resetDemoSession = useCallback(() => {
    setElapsedSec(0);
    setStreamMetrics(adapter.getInitialStreamMetrics());
    setMonitoringStatus('streaming');
  }, [adapter]);

  const updateAppearance = useCallback((patch: Partial<AppAppearancePreferences>) => {
    setAppearance((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateAudioPrefs = useCallback((patch: Partial<AudioInputPreferences>) => {
    setAudioPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateBackendConfig = useCallback((patch: Partial<BackendConnectionConfig>) => {
    setBackendConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAllPreferences = useCallback(() => {
    setAppearance(DEFAULT_APPEARANCE);
    setAudioPrefs(DEFAULT_AUDIO_PREFS);
    setBackendConfig(DEFAULT_BACKEND_CONFIG);
  }, []);

  const value = useMemo<EcoSonicContextValue>(
    () => ({
      adapter,
      isDemoMode: adapter.isDemoMode,
      monitoringStatus,
      activePreset,
      elapsedSec,
      streamMetrics,
      detections,
      disturbances,
      sessions,
      soundscape,
      isLoading,
      appearance,
      audioPrefs,
      backendConfig,
      setActivePreset,
      toggleMonitoringStream,
      resetDemoSession,
      updateAppearance,
      updateAudioPrefs,
      updateBackendConfig,
      resetAllPreferences,
    }),
    [
      adapter,
      monitoringStatus,
      activePreset,
      elapsedSec,
      streamMetrics,
      detections,
      disturbances,
      sessions,
      soundscape,
      isLoading,
      appearance,
      audioPrefs,
      backendConfig,
      toggleMonitoringStream,
      resetDemoSession,
      updateAppearance,
      updateAudioPrefs,
      updateBackendConfig,
      resetAllPreferences,
    ]
  );

  return <EcoSonicContext.Provider value={value}>{children}</EcoSonicContext.Provider>;
}

export function useEcoSonic(): EcoSonicContextValue {
  const ctx = useContext(EcoSonicContext);
  if (!ctx) {
    throw new Error('useEcoSonic must be used inside an EcoSonicProvider');
  }
  return ctx;
}
