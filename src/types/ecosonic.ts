export type HabitatPresetId = 'temperate-rainforest' | 'boreal-wetland' | 'subalpine-ridge';

export type MonitoringStatus = 'idle' | 'streaming' | 'paused' | 'completed';

export type DisturbanceCategory =
  | 'transportation'
  | 'environmental_hazard'
  | 'mechanical_activity'
  | 'cultural_sound';

export type DisturbanceSeverity = 'low' | 'moderate' | 'elevated';

export interface SpeciesDetection {
  id: string;
  commonName: string;
  scientificName: string;
  timestampIso: string;
  /** Raw acoustic model confidence score (0..1), NOT a calibrated probability. */
  confidenceScore: number;
  sessionId: string;
  frequencyRangeHz: [number, number];
  durationSec: number;
  habitatPreset: HabitatPresetId;
}

export interface FrequencyBandEnergy {
  bandLabel: string;
  rangeHz: string;
  energyDb: number;
  /** Relative share of spectral energy (0..100%) */
  relativeSharePct: number;
  dominantSource: 'biophony' | 'geophony' | 'anthrophony';
}

export interface TemporalActivityPoint {
  timeLabel: string;
  timestampIso: string;
  biophonyIndex: number;
  anthrophonyIndex: number;
  detectionCount: number;
  meanSplDb: number;
}

export interface SoundscapeIndices {
  /** Acoustic Complexity Index */
  aci: number;
  /** Acoustic Diversity Index */
  adi: number;
  /** Acoustic Evenness Index */
  aei: number;
  /** Normalized Difference Soundscape Index (-1 to +1) */
  ndsi: number;
  /** Spectral Shannon Entropy (normalized 0 to 1) */
  spectralEntropy: number;
  /** Mean Sound Pressure Level in dBFS relative reference */
  meanLevelDbfs: number;
  computedAtIso: string;
}

export interface SoundscapeSnapshot {
  presetId: HabitatPresetId;
  siteName: string;
  indices: SoundscapeIndices;
  frequencyBands: FrequencyBandEnergy[];
  temporalActivity: TemporalActivityPoint[];
}

export interface DisturbanceEvent {
  id: string;
  category: DisturbanceCategory;
  label: string;
  description: string;
  timestampIso: string;
  durationSec: number;
  peakDbfs: number;
  frequencyBandHz: [number, number];
  severity: DisturbanceSeverity;
  confidenceScore: number;
  sessionId: string;
}

export interface SessionSoundscapeSummary {
  aciMean: number;
  ndsiMean: number;
  spectralEntropyMean: number;
  dominantBandHz: string;
}

export interface MonitoringSession {
  id: string;
  title: string;
  siteName: string;
  coordinatesLabel: string;
  startedAtIso: string;
  endedAtIso: string | null;
  durationSec: number;
  status: MonitoringStatus;
  sampleRateHz: number;
  speciesDetectionCount: number;
  distinctSpeciesCount: number;
  disturbanceEventCount: number;
  soundscapeSummary: SessionSoundscapeSummary;
  notes: string;
}

export interface AcousticStreamMetrics {
  framesProcessed: number;
  windowDurationSec: number;
  sampleRateHz: number;
  inputGainDb: number;
  rmsLevelDbfs: number;
  peakFrequencyHz: number;
  bufferLatencyMs: number;
}

export interface AudioInputPreferences {
  preferredDeviceId: string;
  sampleRateHz: 44100 | 48000;
  fftSize: 1024 | 2048 | 4096;
  minConfidenceThreshold: number;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface BackendConnectionConfig {
  apiBaseUrl: string;
  wsStreamUrl: string;
  reconnectIntervalMs: number;
  mode: 'demo' | 'backend_ready';
}

export interface AppAppearancePreferences {
  theme: 'deep-forest' | 'field-light';
  reducedMotionOverride: boolean;
  showScientificNamesFirst: boolean;
}

export interface AdapterDiagnostics {
  adapterName: string;
  isDemoMode: boolean;
  protocolVersion: string;
  lastSyncIso: string | null;
  browserAudioApiSupported: boolean;
  mediaDevicesSupported: boolean;
  websocketReadyState: 'not_connected_demo' | 'connecting' | 'open' | 'closed';
}

export interface DetectionQueryOptions {
  search?: string;
  sessionId?: string | 'all';
  minConfidence?: number;
  sortBy?: 'timestamp_desc' | 'timestamp_asc' | 'confidence_desc' | 'name_asc';
}

export interface DisturbanceQueryOptions {
  category?: DisturbanceCategory | 'all';
  severity?: DisturbanceSeverity | 'all';
  sessionId?: string | 'all';
}
