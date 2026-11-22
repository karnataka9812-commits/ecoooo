import React, { useMemo, useState } from 'react';
import { AlertTriangle, Cog, Music, Plane, ShieldAlert } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, MetricReadout, SkeletonPanel, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import {
  filterDisturbanceEvents,
  formatDurationSeconds,
  formatTimestampDateTime,
  getDisturbanceCategoryLabel,
  summarizeDisturbancesByCategory,
} from '../lib/acoustics';
import type { DisturbanceCategory, DisturbanceSeverity } from '../types/ecosonic';

const CATEGORY_META: Record<
  DisturbanceCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    description: string;
  }
> = {
  transportation: {
    label: 'Transportation',
    icon: Plane,
    accentClass: 'text-[#D3A36C]',
    description: 'Aircraft, rail corridors, and distant road transit low-frequency envelopes.',
  },
  environmental_hazard: {
    label: 'Potential Environmental Hazard',
    icon: AlertTriangle,
    accentClass: 'text-[#E07A5F]',
    description: 'Severe wind shear, canopy limb fractures, or abrupt abiotic impulse events.',
  },
  mechanical_activity: {
    label: 'Mechanical Activity',
    icon: Cog,
    accentClass: 'text-[#D5D9C6]',
    description: 'Harmonic engine signatures, forestry equipment, and motorized maintenance.',
  },
  cultural_sound: {
    label: 'Cultural Sounds',
    icon: Music,
    accentClass: 'text-[#788B68]',
    description: 'Human speech corridors, distant village bells, and recreational trail acoustics.',
  },
};

export function DisturbancesPage() {
  const { disturbances, isLoading } = useEcoSonic();
  const [categoryFilter, setCategoryFilter] = useState<DisturbanceCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<DisturbanceSeverity | 'all'>('all');

  const counts = useMemo(() => summarizeDisturbancesByCategory(disturbances), [disturbances]);

  const filtered = useMemo(
    () =>
      filterDisturbanceEvents(disturbances, {
        category: categoryFilter,
        severity: severityFilter,
      }),
    [disturbances, categoryFilter, severityFilter]
  );

  return (
    <AppShell
      title="Disturbance Radar"
      subtitle="Categorized non-animal acoustic events and temporal intrusion timeline"
    >
      <div className="space-y-6">
        {/* Category Summary Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricReadout
            label="Transportation"
            value={counts.transportation}
            accent="amber"
            context="Aircraft & rail corridor signatures"
          />
          <MetricReadout
            label="Environmental Hazards"
            value={counts.environmental_hazard}
            context="Wind shear & canopy fracture impulses"
          />
          <MetricReadout
            label="Mechanical Activity"
            value={counts.mechanical_activity}
            context="Motorized equipment & harmonic noise"
          />
          <MetricReadout
            label="Cultural Sounds"
            value={counts.cultural_sound}
            accent="moss"
            context="Human speech & distant community sound"
          />
        </section>

        {/* Filter Bar */}
        <SurfacePanel className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by disturbance category">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#788B68] text-[#101C17] font-semibold'
                  : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)]'
              }`}
            >
              All Categories ({disturbances.length})
            </button>

            {(Object.keys(CATEGORY_META) as DisturbanceCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#788B68] text-[#101C17] font-semibold'
                      : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="severity-select" className="text-xs text-[var(--app-text-muted)]">
              Intensity:
            </label>
            <select
              id="severity-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as DisturbanceSeverity | 'all')}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] focus:outline-none focus:border-[#788B68]"
            >
              <option value="all">All Intensities</option>
              <option value="elevated">Elevated</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </SurfacePanel>

        {/* Event Timeline */}
        {isLoading ? (
          <SkeletonPanel className="h-72" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-5 h-5" />}
            title="No disturbance events match the active filters"
            description="Reset the category or intensity filter to inspect all non-biological acoustic events."
            actionLabel="Show All Disturbances"
            onAction={() => {
              setCategoryFilter('all');
              setSeverityFilter('all');
            }}
          />
        ) : (
          <SurfacePanel as="section" className="p-6">
            <div className="pb-4 border-b border-[var(--app-border)] flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                Acoustic Event Timeline
              </h2>
              <span className="text-xs font-mono text-[var(--app-text-muted)]">
                {filtered.length} events · DEMO FIXTURES
              </span>
            </div>

            <ol className="mt-6 space-y-6">
              {filtered.map((ev) => {
                const meta = CATEGORY_META[ev.category];
                const Icon = meta.icon;
                return (
                  <li
                    key={ev.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-6 border-b border-[var(--app-border)] last:border-b-0 last:pb-0"
                  >
                    <div className="lg:col-span-3 font-mono text-xs tabular-nums text-[var(--app-text-muted)] space-y-1">
                      <div className="text-[var(--app-text-secondary)]">
                        {formatTimestampDateTime(ev.timestampIso)}
                      </div>
                      <div>Session {ev.sessionId}</div>
                    </div>

                    <div className="lg:col-span-6 space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${meta.accentClass}`} />
                        <span className={`text-xs font-medium ${meta.accentClass}`}>
                          {getDisturbanceCategoryLabel(ev.category)}
                        </span>
                        <span aria-hidden="true" className="text-[var(--app-text-muted)]">
                          ·
                        </span>
                        <span className="text-xs capitalize text-[var(--app-text-muted)]">
                          {ev.severity} intensity
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-[var(--app-text)]">{ev.label}</h3>
                      <p className="text-sm text-[var(--app-text-muted)] leading-relaxed">
                        {ev.description}
                      </p>
                    </div>

                    <div className="lg:col-span-3 flex lg:flex-col lg:items-end justify-between gap-2 font-mono text-xs tabular-nums">
                      <div>
                        <span className="text-[var(--app-text-muted)] mr-1.5">Peak</span>
                        <span className="text-[#D3A36C] font-medium">
                          {ev.peakDbfs.toFixed(1)} dBFS
                        </span>
                      </div>
                      <div className="text-[var(--app-text-secondary)]">
                        {ev.frequencyBandHz[0]}–{ev.frequencyBandHz[1]} Hz
                      </div>
                      <div className="text-[var(--app-text-muted)]">
                        Duration {formatDurationSeconds(ev.durationSec)} · Score{' '}
                        {ev.confidenceScore.toFixed(2)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </SurfacePanel>
        )}
      </div>
    </AppShell>
  );
}
