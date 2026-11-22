import {
  DEMO_DETECTIONS,
  DEMO_DISTURBANCES,
  DEMO_SESSIONS,
  DEMO_SOUNDSCAPES,
  INITIAL_DEMO_STREAM_METRICS,
} from '../data/demoFixtures';
import { filterAndSortDetections, filterDisturbanceEvents } from '../lib/acoustics';
import type {
  AcousticStreamMetrics,
  AdapterDiagnostics,
  DetectionQueryOptions,
  DisturbanceEvent,
  DisturbanceQueryOptions,
  HabitatPresetId,
  MonitoringSession,
  SoundscapeSnapshot,
  SpeciesDetection,
} from '../types/ecosonic';

/**
 * EcoSonicDataAdapter defines the frontend integration contract.
 *
 * Handoff Note for Antigravity (Backend Integration Stage):
 * Implement this interface against the frozen backend REST & WebSocket protocol
 * without modifying presentation components. Swap the exported adapter instance
 * via EcoSonicProvider or createBackendAdapter(config).
 */
export interface EcoSonicDataAdapter {
  readonly name: string;
  readonly isDemoMode: boolean;

  getDiagnostics(): AdapterDiagnostics;

  fetchDetections(query?: DetectionQueryOptions): Promise<SpeciesDetection[]>;
  fetchSoundscapeSnapshot(presetId: HabitatPresetId): Promise<SoundscapeSnapshot>;
  fetchDisturbances(query?: DisturbanceQueryOptions): Promise<DisturbanceEvent[]>;
  fetchSessions(): Promise<MonitoringSession[]>;
  fetchSessionById(sessionId: string): Promise<MonitoringSession | null>;
  getInitialStreamMetrics(): AcousticStreamMetrics;
}

export class DemoEcoSonicAdapter implements EcoSonicDataAdapter {
  public readonly name = 'DemoFixtureAdapter (Local Isolated Fixtures)';
  public readonly isDemoMode = true;

  public getDiagnostics(): AdapterDiagnostics {
    const hasAudioContext =
      typeof window !== 'undefined' &&
      ('AudioContext' in window || 'webkitAudioContext' in window);
    const hasMediaDevices =
      typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

    return {
      adapterName: this.name,
      isDemoMode: true,
      protocolVersion: 'Frontend Contract v3.0 (Awaiting Backend Integration)',
      lastSyncIso: new Date().toISOString(),
      browserAudioApiSupported: hasAudioContext,
      mediaDevicesSupported: hasMediaDevices,
      websocketReadyState: 'not_connected_demo',
    };
  }

  public async fetchDetections(query?: DetectionQueryOptions): Promise<SpeciesDetection[]> {
    return filterAndSortDetections(DEMO_DETECTIONS, query);
  }

  public async fetchSoundscapeSnapshot(presetId: HabitatPresetId): Promise<SoundscapeSnapshot> {
    return DEMO_SOUNDSCAPES[presetId] ?? DEMO_SOUNDSCAPES['temperate-rainforest'];
  }

  public async fetchDisturbances(query?: DisturbanceQueryOptions): Promise<DisturbanceEvent[]> {
    return filterDisturbanceEvents(DEMO_DISTURBANCES, query);
  }

  public async fetchSessions(): Promise<MonitoringSession[]> {
    return [...DEMO_SESSIONS].sort(
      (a, b) => Date.parse(b.startedAtIso) - Date.parse(a.startedAtIso)
    );
  }

  public async fetchSessionById(sessionId: string): Promise<MonitoringSession | null> {
    return DEMO_SESSIONS.find((s) => s.id === sessionId) ?? null;
  }

  public getInitialStreamMetrics(): AcousticStreamMetrics {
    return { ...INITIAL_DEMO_STREAM_METRICS };
  }
}

export const defaultEcoSonicAdapter: EcoSonicDataAdapter = new DemoEcoSonicAdapter();
