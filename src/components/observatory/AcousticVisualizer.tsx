import { useEffect, useRef } from 'react';
import type { HabitatPresetId, MonitoringStatus } from '../../types/ecosonic';

interface AcousticVisualizerProps {
  status: MonitoringStatus;
  presetId: HabitatPresetId;
  peakFrequencyHz: number;
  rmsLevelDbfs: number;
  reducedMotion?: boolean;
  height?: number;
}

/**
 * AcousticVisualizer renders a dual-layer scientific acoustic field view:
 * 1) Scrolling spectrogram-inspired frequency band energy columns (top 55%)
 * 2) Multi-harmonic acoustic waveform envelope with calibrated gridlines (bottom 45%)
 *
 * Future Antigravity Web Audio Integration:
 * Accept an optional `AnalyserNode` prop to replace deterministic demo harmonic synthesis
 * with live `getByteFrequencyData` / `getFloatTimeDomainData` buffers.
 */
export function AcousticVisualizer({
  status,
  presetId,
  peakFrequencyHz,
  rmsLevelDbfs,
  reducedMotion = false,
  height = 280,
}: AcousticVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ status, presetId, peakFrequencyHz, rmsLevelDbfs, reducedMotion });
  stateRef.current = { status, presetId, peakFrequencyHz, rmsLevelDbfs, reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = 0;
    const historyCols = 110;
    const freqBins = 44;

    // Pre-seed deterministic spectrogram waterfall history so first paint looks populated
    const waterfall: number[][] = Array.from({ length: historyCols }, (_, colIdx) =>
      computeColumnBins(colIdx * 0.14, freqBins, stateRef.current.presetId)
    );

    const drawFrame = (advance: boolean) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const h = rect.height;

      // Background deep forest obsidian
      ctx.fillStyle = '#0C1511';
      ctx.fillRect(0, 0, width, h);

      const { status: curStatus, presetId: curPreset, peakFrequencyHz: curPeak } = stateRef.current;

      if (advance && curStatus === 'streaming') {
        phase += 0.085;
        waterfall.shift();
        waterfall.push(computeColumnBins(phase, freqBins, curPreset));
      }

      const specHeight = Math.floor(h * 0.56);
      const waveTop = specHeight + 12;
      const waveHeight = h - waveTop - 24;

      // 1. Spectrogram heatmap region
      const colW = width / historyCols;
      const binH = specHeight / freqBins;

      for (let c = 0; c < historyCols; c++) {
        const col = waterfall[c];
        for (let b = 0; b < freqBins; b++) {
          const val = col[b];
          if (val < 0.06) continue;
          const y = specHeight - (b + 1) * binH;
          ctx.fillStyle = energyToColor(val);
          ctx.fillRect(c * colW, y, Math.ceil(colW) + 0.5, Math.ceil(binH) + 0.5);
        }
      }

      // Subtle horizontal frequency gridlines across spectrogram
      ctx.strokeStyle = 'rgba(213, 217, 198, 0.09)';
      ctx.lineWidth = 1;
      const freqTicks = [
        { label: '10 kHz', ratio: 0.14 },
        { label: '6 kHz', ratio: 0.38 },
        { label: '3 kHz', ratio: 0.62 },
        { label: '1 kHz', ratio: 0.84 },
      ];
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(213, 217, 198, 0.55)';
      for (const tick of freqTicks) {
        const y = Math.round(specHeight * tick.ratio) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(tick.label, 10, y - 4);
      }

      // Peak frequency indicator line
      const normPeak = Math.min(1, Math.max(0, curPeak / 11000));
      const peakY = Math.round(specHeight * (1 - normPeak)) + 0.5;
      ctx.strokeStyle = 'rgba(211, 163, 108, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, peakY);
      ctx.lineTo(width, peakY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Divider between spectrogram and waveform
      ctx.strokeStyle = 'rgba(213, 217, 198, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, specHeight + 0.5);
      ctx.lineTo(width, specHeight + 0.5);
      ctx.stroke();

      // 2. Layered acoustic waveform envelope
      const waveCenterY = waveTop + waveHeight / 2;

      // Zero-crossing baseline
      ctx.strokeStyle = 'rgba(213, 217, 198, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, waveCenterY);
      ctx.lineTo(width, waveCenterY);
      ctx.stroke();

      const ampScale = waveHeight * 0.42;

      // Soft moss area fill
      ctx.beginPath();
      ctx.moveTo(0, waveCenterY);
      const step = 3;
      for (let x = 0; x <= width; x += step) {
        const nx = x / width;
        const env = Math.sin(nx * Math.PI);
        const yOffset = synthesizeWave(nx, phase, curPreset) * ampScale * env;
        ctx.lineTo(x, waveCenterY - Math.abs(yOffset));
      }
      for (let x = width; x >= 0; x -= step) {
        const nx = x / width;
        const env = Math.sin(nx * Math.PI);
        const yOffset = synthesizeWave(nx, phase, curPreset) * ampScale * env;
        ctx.lineTo(x, waveCenterY + Math.abs(yOffset) * 0.85);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(120, 139, 104, 0.22)';
      ctx.fill();

      // Primary crisp waveform trace
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const nx = x / width;
        const env = Math.sin(nx * Math.PI);
        const yOffset = synthesizeWave(nx, phase, curPreset) * ampScale * env;
        if (x === 0) ctx.moveTo(x, waveCenterY + yOffset);
        else ctx.lineTo(x, waveCenterY + yOffset);
      }
      ctx.strokeStyle = '#D5D9C6';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Bottom time axis caption inside canvas
      ctx.fillStyle = 'rgba(165, 172, 156, 0.72)';
      ctx.font = '10px "IBM Plex Mono", monospace';
      const caption =
        width < 460
          ? 'TIME ENVELOPE · 48 kHz FFT (DEMO)'
          : 'TIME-DOMAIN ENVELOPE · 48.0 kHz / 2048-PT FFT (DEMO FIXTURE)';
      ctx.fillText(caption, 10, h - 8);

      ctx.restore();
    };

    const prefersReduced =
      stateRef.current.reducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    drawFrame(false);

    if (prefersReduced) {
      return;
    }

    let lastTime = 0;
    const loop = (ts: number) => {
      if (ts - lastTime >= 45) {
        lastTime = ts;
        drawFrame(true);
      }
      animId = window.requestAnimationFrame(loop);
    };
    animId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-[var(--app-border)] bg-[#0C1511]">
      <canvas
        ref={canvasRef}
        data-testid="acoustic-visualizer"
        aria-label="Layered environmental acoustic spectrogram and time-domain waveform visualizer"
        style={{ height: `${height}px`, width: '100%', display: 'block' }}
      />
    </div>
  );
}

function computeColumnBins(t: number, bins: number, preset: HabitatPresetId): number[] {
  const result = new Array<number>(bins);
  const bioCenter =
    preset === 'temperate-rainforest' ? 0.44 : preset === 'boreal-wetland' ? 0.34 : 0.25;
  const bioSpread = preset === 'subalpine-ridge' ? 0.14 : 0.19;

  for (let b = 0; b < bins; b++) {
    const normFreq = b / (bins - 1);
    const biophonyBand = Math.exp(-Math.pow((normFreq - bioCenter) / bioSpread, 2));
    const upperHarmonic = Math.exp(-Math.pow((normFreq - (bioCenter + 0.24)) / 0.09, 2)) * 0.55;
    const chirp = 0.5 + 0.5 * Math.sin(t * 2.3 + b * 0.65) * Math.cos(t * 0.9 - b * 0.3);

    const lowGeophony =
      preset === 'subalpine-ridge'
        ? Math.exp(-normFreq * 6.5) * (0.55 + 0.25 * Math.sin(t * 0.7))
        : Math.exp(-normFreq * 9.0) * 0.35;

    const raw = (biophonyBand * 0.72 + upperHarmonic * 0.5) * chirp + lowGeophony;
    result[b] = Math.min(1, Math.max(0, raw));
  }
  return result;
}

function synthesizeWave(nx: number, phase: number, preset: HabitatPresetId): number {
  const f1 = preset === 'temperate-rainforest' ? 18 : preset === 'boreal-wetland' ? 13 : 9;
  const f2 = preset === 'temperate-rainforest' ? 37 : preset === 'boreal-wetland' ? 24 : 21;
  const carrier =
    Math.sin(nx * Math.PI * f1 - phase * 2.2) * 0.48 +
    Math.sin(nx * Math.PI * f2 + phase * 3.1) * 0.28 +
    Math.cos(nx * Math.PI * 6.5 - phase * 0.9) * 0.24;
  return carrier;
}

function energyToColor(v: number): string {
  if (v < 0.35) {
    const alpha = 0.15 + v * 1.1;
    return `rgba(36, 59, 46, ${alpha.toFixed(2)})`;
  }
  if (v < 0.72) {
    const alpha = 0.45 + (v - 0.35) * 1.1;
    return `rgba(120, 139, 104, ${alpha.toFixed(2)})`;
  }
  const alpha = 0.65 + (v - 0.72) * 1.1;
  return `rgba(211, 163, 108, ${Math.min(0.95, alpha).toFixed(2)})`;
}
