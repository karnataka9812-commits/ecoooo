import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bird, Search } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, MetricReadout, SkeletonPanel, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import {
  countDistinctSpecies,
  filterAndSortDetections,
  formatTimestampDateTime,
} from '../lib/acoustics';
import type { DetectionQueryOptions } from '../types/ecosonic';

export function DetectionsPage() {
  const { detections, sessions, isLoading, appearance } = useEcoSonic();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>(
    searchParams.get('session') ?? 'all'
  );
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [sortBy, setSortBy] = useState<NonNullable<DetectionQueryOptions['sortBy']>>(
    'timestamp_desc'
  );

  const filtered = useMemo(
    () =>
      filterAndSortDetections(detections, {
        search,
        sessionId: selectedSession,
        minConfidence,
        sortBy,
      }),
    [detections, search, selectedSession, minConfidence, sortBy]
  );

  const distinctCount = useMemo(() => countDistinctSpecies(filtered), [filtered]);
  const meanConfidence = useMemo(() => {
    if (filtered.length === 0) return '0.00';
    const sum = filtered.reduce((acc, item) => acc + item.confidenceScore, 0);
    return (sum / filtered.length).toFixed(2);
  }, [filtered]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSession('all');
    setMinConfidence(0);
    setSortBy('timestamp_desc');
    setSearchParams({});
  };

  return (
    <AppShell
      title="Species Intelligence"
      subtitle="Taxonomic acoustic observations with session provenance and raw model confidence scores"
    >
      <div className="space-y-6">
        {/* Summary Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricReadout
            label="Matching Detections"
            value={filtered.length}
            context="Filtered demonstration observations"
          />
          <MetricReadout
            label="Distinct Taxa"
            value={distinctCount}
            accent="moss"
            context="Unique scientific binomials in view"
          />
          <MetricReadout
            label="Mean Model Score"
            value={meanConfidence}
            context="Raw classifier output (not calibrated probability)"
          />
        </section>

        {/* Filter & Sort Controls */}
        <SurfacePanel className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label
                htmlFor="species-search"
                className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
              >
                Search Common or Scientific Name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--app-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="species-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Pacific Wren or Ixoreus"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]/60 focus:outline-none focus:border-[#788B68]"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="session-filter"
                className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
              >
                Monitoring Session
              </label>
              <select
                id="session-filter"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] focus:outline-none focus:border-[#788B68]"
              >
                <option value="all">All Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.siteName.replace(' (Demo Fixture)', '')}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="sort-order"
                className="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
              >
                Sort Order
              </label>
              <select
                id="sort-order"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as NonNullable<DetectionQueryOptions['sortBy']>)
                }
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] focus:outline-none focus:border-[#788B68]"
              >
                <option value="timestamp_desc">Newest First</option>
                <option value="timestamp_asc">Oldest First</option>
                <option value="confidence_desc">Highest Model Score</option>
                <option value="name_asc">Common Name (A–Z)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="min-score-range"
                className="flex items-center justify-between text-xs font-medium text-[var(--app-text-muted)] mb-1.5"
              >
                <span>Min Score</span>
                <span className="font-mono tabular-nums text-[var(--app-text)]">
                  {minConfidence.toFixed(2)}
                </span>
              </label>
              <input
                id="min-score-range"
                type="range"
                min={0}
                max={0.95}
                step={0.05}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-[#788B68] cursor-pointer"
              />
            </div>
          </div>
        </SurfacePanel>

        {/* Detections Table / Empty / Loading */}
        {isLoading ? (
          <SkeletonPanel className="h-72" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bird className="w-5 h-5" />}
            title="No species detections match these filters"
            description="Adjust the search query, minimum confidence threshold, or session selector to view demonstration observations."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <SurfacePanel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--app-border)] text-xs font-mono text-[var(--app-text-muted)] bg-[var(--app-bg)]/40">
                    <th className="py-3.5 px-5 font-medium">Species</th>
                    <th className="py-3.5 px-5 font-medium">Scientific Name</th>
                    <th className="py-3.5 px-5 font-medium">Timestamp</th>
                    <th className="py-3.5 px-5 font-medium">Frequency Band</th>
                    <th className="py-3.5 px-5 font-medium">Session</th>
                    <th className="py-3.5 px-5 font-medium text-right">Model Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--app-border)] text-sm">
                  {filtered.map((det) => (
                    <tr
                      key={det.id}
                      className="hover:bg-[var(--app-surface-elevated)]/30 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-[var(--app-text)] whitespace-nowrap">
                        {appearance.showScientificNamesFirst ? det.scientificName : det.commonName}
                      </td>
                      <td className="py-3.5 px-5 italic text-[var(--app-text-secondary)] whitespace-nowrap">
                        {appearance.showScientificNamesFirst ? det.commonName : det.scientificName}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-[var(--app-text-muted)] whitespace-nowrap">
                        {formatTimestampDateTime(det.timestampIso)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-[var(--app-text-secondary)] whitespace-nowrap">
                        {det.frequencyRangeHz[0]}–{det.frequencyRangeHz[1]} Hz
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[var(--app-text-muted)] whitespace-nowrap">
                        {det.sessionId}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-medium text-[#788B68] whitespace-nowrap">
                        {det.confidenceScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[var(--app-border)] text-xs text-[var(--app-text-muted)] flex flex-wrap items-center justify-between gap-2">
              <span>
                Note: Model confidence scores represent raw acoustic classifier similarity and are
                not calibrated detection probabilities.
              </span>
              <span className="font-mono">DEMO FIXTURES</span>
            </div>
          </SurfacePanel>
        )}
      </div>
    </AppShell>
  );
}
