import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countDistinctSpecies,
  filterAndSortDetections,
  filterDisturbanceEvents,
  formatDurationSeconds,
  summarizeAcousticSources,
  summarizeDisturbancesByCategory,
  validateEndpointUrl,
} from './acoustics';
import type { DisturbanceEvent, FrequencyBandEnergy, SpeciesDetection } from '../types/ecosonic';

const sampleDetections: SpeciesDetection[] = [
  {
    id: 'det-1',
    commonName: 'Pacific Wren',
    scientificName: 'Troglodytes pacificus',
    timestampIso: '2026-11-21T06:14:22.000Z',
    confidenceScore: 0.91,
    sessionId: 'ses-01',
    frequencyRangeHz: [2400, 7200],
    durationSec: 3.4,
    habitatPreset: 'temperate-rainforest',
  },
  {
    id: 'det-2',
    commonName: 'Varied Thrush',
    scientificName: 'Ixoreus naevius',
    timestampIso: '2026-11-21T06:16:05.000Z',
    confidenceScore: 0.78,
    sessionId: 'ses-01',
    frequencyRangeHz: [1800, 4100],
    durationSec: 2.1,
    habitatPreset: 'temperate-rainforest',
  },
  {
    id: 'det-3',
    commonName: 'Pacific Wren',
    scientificName: 'Troglodytes pacificus',
    timestampIso: '2026-11-21T06:18:10.000Z',
    confidenceScore: 0.62,
    sessionId: 'ses-02',
    frequencyRangeHz: [2500, 7100],
    durationSec: 2.8,
    habitatPreset: 'temperate-rainforest',
  },
];

test('filterAndSortDetections filters by search, session, and minConfidence', () => {
  const bySearch = filterAndSortDetections(sampleDetections, { search: 'ixoreus' });
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'det-2');

  const byConfidence = filterAndSortDetections(sampleDetections, { minConfidence: 0.75 });
  assert.equal(byConfidence.length, 2);

  const bySession = filterAndSortDetections(sampleDetections, { sessionId: 'ses-02' });
  assert.equal(bySession.length, 1);
  assert.equal(bySession[0].id, 'det-3');
});

test('filterAndSortDetections sorts by confidence descending and timestamp descending', () => {
  const byConf = filterAndSortDetections(sampleDetections, { sortBy: 'confidence_desc' });
  assert.deepEqual(
    byConf.map((d) => d.id),
    ['det-1', 'det-2', 'det-3']
  );

  const byTimeDesc = filterAndSortDetections(sampleDetections, { sortBy: 'timestamp_desc' });
  assert.deepEqual(
    byTimeDesc.map((d) => d.id),
    ['det-3', 'det-2', 'det-1']
  );
});

test('countDistinctSpecies deduplicates by scientificName', () => {
  assert.equal(countDistinctSpecies(sampleDetections), 2);
});

test('filterDisturbanceEvents and summarizeDisturbancesByCategory work accurately', () => {
  const events: DisturbanceEvent[] = [
    {
      id: 'dist-1',
      category: 'transportation',
      label: 'High-altitude jet transit',
      description: 'Low-frequency sweep',
      timestampIso: '2026-11-21T06:10:00.000Z',
      durationSec: 42,
      peakDbfs: -28.4,
      frequencyBandHz: [60, 420],
      severity: 'moderate',
      confidenceScore: 0.84,
      sessionId: 'ses-01',
    },
    {
      id: 'dist-2',
      category: 'mechanical_activity',
      label: 'Distant timber equipment',
      description: 'Harmonic engine signature',
      timestampIso: '2026-11-21T06:12:00.000Z',
      durationSec: 18,
      peakDbfs: -31.2,
      frequencyBandHz: [110, 680],
      severity: 'elevated',
      confidenceScore: 0.79,
      sessionId: 'ses-01',
    },
  ];

  const filtered = filterDisturbanceEvents(events, { category: 'mechanical_activity' });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'dist-2');

  const summary = summarizeDisturbancesByCategory(events);
  assert.equal(summary.transportation, 1);
  assert.equal(summary.mechanical_activity, 1);
  assert.equal(summary.environmental_hazard, 0);
  assert.equal(summary.cultural_sound, 0);
});

test('summarizeAcousticSources normalizes band shares to 100%', () => {
  const bands: FrequencyBandEnergy[] = [
    { bandLabel: 'Low', rangeHz: '20–500 Hz', energyDb: -32, relativeSharePct: 20, dominantSource: 'anthrophony' },
    { bandLabel: 'Mid', rangeHz: '2–6 kHz', energyDb: -18, relativeSharePct: 60, dominantSource: 'biophony' },
    { bandLabel: 'Wind', rangeHz: '500–1200 Hz', energyDb: -26, relativeSharePct: 20, dominantSource: 'geophony' },
  ];

  const shares = summarizeAcousticSources(bands);
  assert.equal(shares.biophonyPct, 60);
  assert.equal(shares.geophonyPct, 20);
  assert.equal(shares.anthrophonyPct, 20);
});

test('formatDurationSeconds formats MM:SS and HH:MM:SS', () => {
  assert.equal(formatDurationSeconds(65), '01:05');
  assert.equal(formatDurationSeconds(3661), '01:01:01');
  assert.equal(formatDurationSeconds(-5), '00:00');
});

test('validateEndpointUrl enforces protocol and URL syntax', () => {
  assert.equal(validateEndpointUrl('https://api.ecosonic.local/v1', ['http:', 'https:']).valid, true);
  assert.equal(validateEndpointUrl('wss://stream.ecosonic.local/ws', ['ws:', 'wss:']).valid, true);
  assert.equal(validateEndpointUrl('http://stream.ecosonic.local/ws', ['ws:', 'wss:']).valid, false);
  assert.equal(validateEndpointUrl('not a url', ['https:']).valid, false);
  assert.equal(validateEndpointUrl('', ['https:']).valid, false);
});
