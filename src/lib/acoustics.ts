import type {
  DetectionQueryOptions,
  DisturbanceCategory,
  DisturbanceEvent,
  DisturbanceQueryOptions,
  FrequencyBandEnergy,
  SpeciesDetection,
} from '../types/ecosonic';

/**
 * Filter and sort species detections deterministically.
 */
export function filterAndSortDetections(
  detections: readonly SpeciesDetection[],
  options: DetectionQueryOptions = {}
): SpeciesDetection[] {
  const {
    search = '',
    sessionId = 'all',
    minConfidence = 0,
    sortBy = 'timestamp_desc',
  } = options;

  const normalizedQuery = search.trim().toLowerCase();

  const filtered = detections.filter((item) => {
    if (sessionId !== 'all' && item.sessionId !== sessionId) {
      return false;
    }
    if (item.confidenceScore < minConfidence) {
      return false;
    }
    if (normalizedQuery.length > 0) {
      const commonMatch = item.commonName.toLowerCase().includes(normalizedQuery);
      const sciMatch = item.scientificName.toLowerCase().includes(normalizedQuery);
      const sessionMatch = item.sessionId.toLowerCase().includes(normalizedQuery);
      if (!commonMatch && !sciMatch && !sessionMatch) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'timestamp_asc':
        return Date.parse(a.timestampIso) - Date.parse(b.timestampIso);
      case 'confidence_desc':
        return b.confidenceScore - a.confidenceScore || Date.parse(b.timestampIso) - Date.parse(a.timestampIso);
      case 'name_asc':
        return a.commonName.localeCompare(b.commonName);
      case 'timestamp_desc':
      default:
        return Date.parse(b.timestampIso) - Date.parse(a.timestampIso);
    }
  });

  return sorted;
}

/**
 * Count distinct species names across a detection slice.
 */
export function countDistinctSpecies(detections: readonly SpeciesDetection[]): number {
  const seen = new Set<string>();
  for (const d of detections) {
    seen.add(d.scientificName);
  }
  return seen.size;
}

/**
 * Filter disturbance events by category, severity, and session.
 */
export function filterDisturbanceEvents(
  events: readonly DisturbanceEvent[],
  options: DisturbanceQueryOptions = {}
): DisturbanceEvent[] {
  const { category = 'all', severity = 'all', sessionId = 'all' } = options;

  return events
    .filter((ev) => {
      if (category !== 'all' && ev.category !== category) return false;
      if (severity !== 'all' && ev.severity !== severity) return false;
      if (sessionId !== 'all' && ev.sessionId !== sessionId) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.timestampIso) - Date.parse(a.timestampIso));
}

/**
 * Summarize disturbance event counts by category.
 */
export function summarizeDisturbancesByCategory(
  events: readonly DisturbanceEvent[]
): Record<DisturbanceCategory, number> {
  const counts: Record<DisturbanceCategory, number> = {
    transportation: 0,
    environmental_hazard: 0,
    mechanical_activity: 0,
    cultural_sound: 0,
  };

  for (const ev of events) {
    counts[ev.category] += 1;
  }

  return counts;
}

/**
 * Summarize share of biophony vs geophony vs anthrophony spectral bands.
 * Returns normalized percentages summing to 100 when bands exist.
 */
export function summarizeAcousticSources(bands: readonly FrequencyBandEnergy[]): {
  biophonyPct: number;
  geophonyPct: number;
  anthrophonyPct: number;
} {
  if (bands.length === 0) {
    return { biophonyPct: 0, geophonyPct: 0, anthrophonyPct: 0 };
  }

  let bio = 0;
  let geo = 0;
  let anthro = 0;
  let total = 0;

  for (const band of bands) {
    const share = Math.max(0, band.relativeSharePct);
    total += share;
    if (band.dominantSource === 'biophony') bio += share;
    else if (band.dominantSource === 'geophony') geo += share;
    else anthro += share;
  }

  if (total === 0) {
    return { biophonyPct: 0, geophonyPct: 0, anthrophonyPct: 0 };
  }

  const biophonyPct = Math.round((bio / total) * 100);
  const geophonyPct = Math.round((geo / total) * 100);
  const anthrophonyPct = Math.max(0, 100 - biophonyPct - geophonyPct);

  return { biophonyPct, geophonyPct, anthrophonyPct };
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS scientific notation.
 */
export function formatDurationSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format ISO timestamp to concise UTC/local HH:MM:SS display.
 */
export function formatTimestampTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toISOString().slice(11, 19) + ' UTC';
}

/**
 * Format ISO timestamp to YYYY-MM-DD HH:MM UTC.
 */
export function formatTimestampDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return `${d.toISOString().slice(0, 10)} · ${d.toISOString().slice(11, 16)} UTC`;
}

/**
 * Validate HTTP/HTTPS or WS/WSS endpoint URLs entered in Settings.
 */
export function validateEndpointUrl(
  value: string,
  expectedProtocols: readonly ('http:' | 'https:' | 'ws:' | 'wss:')[]
): { valid: boolean; reason?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Endpoint URL is required.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (!expectedProtocols.includes(parsed.protocol as 'http:' | 'https:' | 'ws:' | 'wss:')) {
      return {
        valid: false,
        reason: `Protocol must be one of: ${expectedProtocols.join(', ')}`,
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Enter a valid URL including protocol (e.g. https:// or wss://).' };
  }
}

export function getDisturbanceCategoryLabel(category: DisturbanceCategory): string {
  switch (category) {
    case 'transportation':
      return 'Transportation';
    case 'environmental_hazard':
      return 'Potential Environmental Hazard';
    case 'mechanical_activity':
      return 'Mechanical Activity';
    case 'cultural_sound':
      return 'Cultural Sounds';
  }
}
