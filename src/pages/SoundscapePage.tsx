import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { AppShell } from '../components/layout/AppShell';
import { EChartBox } from '../components/charts/EChartBox';
import { MetricReadout, SkeletonPanel, SurfacePanel } from '../components/ui/Primitives';
import { useEcoSonic } from '../context/EcoSonicContext';
import { DEMO_HABITAT_PRESETS } from '../data/demoFixtures';
import { summarizeAcousticSources } from '../lib/acoustics';

export function SoundscapePage() {
  const { activePreset, setActivePreset, soundscape, isLoading, appearance } = useEcoSonic();
  const isLight = appearance.theme === 'field-light';
  const axisLabelColor = isLight ? '#243B2E' : '#A5AC9C';
  const axisLineColor = isLight ? 'rgba(16, 28, 23, 0.2)' : 'rgba(213, 217, 198, 0.2)';
  const splitLineColor = isLight ? 'rgba(16, 28, 23, 0.08)' : 'rgba(213, 217, 198, 0.08)';
  const tooltipBg = isLight ? '#EEEBDD' : '#101C17';
  const tooltipText = isLight ? '#101C17' : '#EEEBDD';

  const sourceShare = useMemo(
    () => summarizeAcousticSources(soundscape?.frequencyBands ?? []),
    [soundscape]
  );

  const temporalOption = useMemo<EChartsOption>(() => {
    if (!soundscape) return {};
    const times = soundscape.temporalActivity.map((p) => p.timeLabel);
    const bio = soundscape.temporalActivity.map((p) => p.biophonyIndex);
    const anthro = soundscape.temporalActivity.map((p) => p.anthrophonyIndex);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: axisLineColor,
        textStyle: { color: tooltipText, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 },
      },
      legend: {
        data: ['Biophony Activity', 'Anthrophony Activity'],
        textStyle: { color: axisLabelColor, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12 },
        top: 0,
        right: 0,
      },
      grid: { left: 46, right: 20, top: 40, bottom: 32 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisLabelColor, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: axisLabelColor, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 },
      },
      series: [
        {
          name: 'Biophony Activity',
          type: 'line',
          smooth: true,
          data: bio,
          lineStyle: { color: '#788B68', width: 2.5 },
          itemStyle: { color: '#788B68' },
          areaStyle: { color: 'rgba(120, 139, 104, 0.16)' },
        },
        {
          name: 'Anthrophony Activity',
          type: 'line',
          smooth: true,
          data: anthro,
          lineStyle: { color: '#D3A36C', width: 2, type: 'dashed' },
          itemStyle: { color: '#D3A36C' },
        },
      ],
    };
  }, [soundscape, tooltipBg, tooltipText, axisLabelColor, axisLineColor, splitLineColor]);

  const bandOption = useMemo<EChartsOption>(() => {
    if (!soundscape) return {};
    const labels = soundscape.frequencyBands.map((b) => b.rangeHz);
    const shares = soundscape.frequencyBands.map((b) => ({
      value: b.relativeSharePct,
      itemStyle: {
        color:
          b.dominantSource === 'biophony'
            ? '#788B68'
            : b.dominantSource === 'geophony'
              ? '#A5AC9C'
              : '#D3A36C',
        borderRadius: [4, 4, 0, 0],
      },
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: axisLineColor,
        textStyle: { color: tooltipText, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 },
        formatter: (params: unknown) => {
          const item = Array.isArray(params) ? params[0] : params;
          const idx = (item as { dataIndex?: number })?.dataIndex ?? 0;
          const band = soundscape.frequencyBands[idx];
          if (!band) return '';
          return `${band.bandLabel} (${band.rangeHz})<br/>Share: ${band.relativeSharePct}% · Energy: ${band.energyDb.toFixed(1)} dB`;
        },
      },
      grid: { left: 46, right: 16, top: 24, bottom: 36 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisLabelColor, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '%',
        nameTextStyle: { color: axisLabelColor, fontFamily: 'IBM Plex Mono, monospace' },
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: axisLabelColor, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 },
      },
      series: [{ type: 'bar', barWidth: '46%', data: shares }],
    };
  }, [soundscape, tooltipBg, tooltipText, axisLabelColor, axisLineColor, splitLineColor]);

  const radarOption = useMemo<EChartsOption>(() => {
    if (!soundscape) return {};
    const { aci, adi, aei, ndsi, spectralEntropy } = soundscape.indices;
    // Normalize each index onto a 0..1 display axis while showing raw units in tooltip
    const normAci = Math.min(1, aci / 250);
    const normAdi = Math.min(1, adi / 3.0);
    const normAei = Math.min(1, aei);
    const normNdsi = (ndsi + 1) / 2;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: axisLineColor,
        textStyle: { color: tooltipText, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 },
      },
      radar: {
        indicator: [
          { name: 'ACI (Complexity)', max: 1 },
          { name: 'ADI (Diversity)', max: 1 },
          { name: 'AEI (Evenness)', max: 1 },
          { name: 'NDSI (Bio Balance)', max: 1 },
          { name: 'H′ (Entropy)', max: 1 },
        ],
        axisName: { color: axisLabelColor, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11 },
        splitLine: { lineStyle: { color: axisLineColor } },
        splitArea: {
          areaStyle: {
            color: isLight
              ? ['rgba(16, 28, 23, 0.03)', 'rgba(36, 59, 46, 0.06)']
              : ['rgba(16, 28, 23, 0.2)', 'rgba(24, 39, 31, 0.2)'],
          },
        },
        axisLine: { lineStyle: { color: axisLineColor } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [normAci, normAdi, normAei, normNdsi, spectralEntropy],
              name: soundscape.siteName,
              areaStyle: { color: 'rgba(120, 139, 104, 0.25)' },
              lineStyle: { color: '#788B68', width: 2 },
              itemStyle: { color: '#D5D9C6' },
            },
          ],
        },
      ],
    };
  }, [soundscape]);

  return (
    <AppShell
      title="Soundscape Intelligence"
      subtitle="Acoustic indices (ACI, ADI, AEI, NDSI), spectral Shannon entropy, and frequency-band energy"
    >
      <div className="space-y-6">
        {/* Station Selector */}
        <SurfacePanel className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D3A36C]">
              DEMO FIXTURE DATASET · NO FABRICATED HEALTH SCORES
            </div>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">
              Indices are reported as individual empirical measurements with ecological context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DEMO_HABITAT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePreset(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activePreset === p.id
                    ? 'bg-[#788B68] text-[#101C17] font-semibold'
                    : 'bg-[var(--app-bg)] text-[var(--app-text-secondary)] border border-[var(--app-border)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </SurfacePanel>

        {isLoading || !soundscape ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonPanel />
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        ) : (
          <>
            {/* Five Core Acoustic Indices */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricReadout
                label="ACI"
                value={soundscape.indices.aci.toFixed(1)}
                context="Acoustic Complexity Index — rapid amplitude modulation across frequency bins."
              />
              <MetricReadout
                label="ADI"
                value={soundscape.indices.adi.toFixed(2)}
                context="Acoustic Diversity Index — Shannon diversity across occupied frequency bands."
              />
              <MetricReadout
                label="AEI"
                value={soundscape.indices.aei.toFixed(2)}
                context="Acoustic Evenness Index — Gini coefficient of band occupancy (lower = more even)."
              />
              <MetricReadout
                label="NDSI"
                value={(soundscape.indices.ndsi >= 0 ? '+' : '') + soundscape.indices.ndsi.toFixed(2)}
                accent="moss"
                context="Normalized Difference Soundscape Index — 2–8 kHz biophony vs 1–2 kHz anthrophony."
              />
              <MetricReadout
                label="Spectral Entropy"
                value={soundscape.indices.spectralEntropy.toFixed(2)}
                context="Normalized Shannon entropy (H′) of spectral energy distribution (0–1)."
              />
            </section>

            {/* Charts Row 1: Temporal Activity + Fingerprint Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SurfacePanel as="section" className="lg:col-span-7 p-6">
                <div className="mb-4">
                  <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                    Temporal Activity Profile
                  </h2>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    Biophony vs. anthrophony progression across sample intervals ({soundscape.siteName})
                  </p>
                </div>
                <EChartBox
                  option={temporalOption}
                  height={280}
                  ariaLabel="Line chart comparing biophony and anthrophony temporal activity"
                />
              </SurfacePanel>

              <SurfacePanel as="section" className="lg:col-span-5 p-6">
                <div className="mb-4">
                  <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                    Soundscape Fingerprint
                  </h2>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    Normalized multi-index geometric profile (reference scale)
                  </p>
                </div>
                <EChartBox
                  option={radarOption}
                  height={280}
                  ariaLabel="Radar chart showing normalized ACI, ADI, AEI, NDSI, and Spectral Entropy"
                />
              </SurfacePanel>
            </div>

            {/* Charts Row 2: Frequency-Band Energy + Source Attribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SurfacePanel as="section" className="lg:col-span-8 p-6">
                <div className="mb-4">
                  <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                    Frequency-Band Energy Distribution
                  </h2>
                  <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                    Relative spectral share by acoustic band (Moss: Biophony · Stone: Geophony · Amber: Anthrophony)
                  </p>
                </div>
                <EChartBox
                  option={bandOption}
                  height={260}
                  ariaLabel="Bar chart of frequency band energy percentage shares"
                />
              </SurfacePanel>

              <SurfacePanel as="section" className="lg:col-span-4 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[var(--app-text)]">
                    Measurement Context
                  </h2>
                  <p className="text-xs text-[var(--app-text-muted)] mt-1 leading-relaxed">
                    Soundscape indices characterize acoustic structure, not direct biodiversity
                    counts or composite health grades.
                  </p>

                  <dl className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                      <dt className="text-[var(--app-text-muted)]">Biophony Band Share</dt>
                      <dd className="font-mono tabular-nums text-[#788B68] font-medium">
                        {sourceShare.biophonyPct}%
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                      <dt className="text-[var(--app-text-muted)]">Geophony Band Share</dt>
                      <dd className="font-mono tabular-nums text-[var(--app-text-secondary)] font-medium">
                        {sourceShare.geophonyPct}%
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                      <dt className="text-[var(--app-text-muted)]">Anthrophony Band Share</dt>
                      <dd className="font-mono tabular-nums text-[#D3A36C] font-medium">
                        {sourceShare.anthrophonyPct}%
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-[var(--app-text-muted)]">Mean Level</dt>
                      <dd className="font-mono tabular-nums text-[var(--app-text)]">
                        {soundscape.indices.meanLevelDbfs.toFixed(1)} dBFS
                      </dd>
                    </div>
                  </dl>
                </div>
              </SurfacePanel>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
