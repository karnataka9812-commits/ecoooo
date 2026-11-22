# EcoSonic 3.0 — Frontend Architecture & Handoff Guide

EcoSonic 3.0 is a nature-inspired environmental sound intelligence web application combining an editorial public website (`/`) with a scientific acoustic monitoring workspace (`/app/*`).

## Stage 1 Scope (Current Frontend Build)

This repository implements **Stage 1 (Frontend Construction)**:
- Complete responsive public landing page (`/`) with nature photography, editorial typography, methodology, capabilities, and explicitly labeled demonstration observatory preview.
- Full scientific monitoring workspace under `/app`:
  - `/app/observatory` — Live Observatory (layered spectrogram/waveform Canvas visualizer, stream controls, station fixture selector, metrics)
  - `/app/detections` — Species Intelligence (filtering, sorting, raw model score caveats)
  - `/app/soundscape` — Soundscape Intelligence (Apache ECharts visualizations for ACI, ADI, AEI, NDSI, Shannon entropy, temporal activity, frequency bands)
  - `/app/disturbances` — Disturbance Radar (transportation, environmental hazard, mechanical activity, cultural sound timeline)
  - `/app/sessions` — Session History (session archives and detail inspector)
  - `/app/settings` — Appearance, audio input preferences, validated backend endpoint configuration, and runtime diagnostics

## Demonstration Mode & Scientific Integrity

- All data displayed in Stage 1 originates from isolated local fixtures in `src/data/demoFixtures.ts` and is marked with explicit `DEMO MODE` indicators.
- Confidence scores are documented as raw acoustic model scores rather than calibrated probabilities.
- Soundscape metrics (ACI, ADI, AEI, NDSI, Spectral Shannon Entropy) are reported individually without fabricated composite ecosystem health scores.

## Stage 2 Integration Contract (Antigravity Handoff)

Presentation components do not import fixtures directly; they read from `EcoSonicContext`, which consumes an `EcoSonicDataAdapter` (`src/adapters/ecosonicAdapter.ts`).

To connect the frozen backend protocol in Stage 2:
1. Implement `EcoSonicDataAdapter` against the backend REST endpoints and WebSocket framing.
2. Pass the live adapter into `<EcoSonicProvider adapter={liveAdapter}>` in `src/App.tsx`.
3. Pass a live Web Audio `AnalyserNode` into `AcousticVisualizer` (`src/components/observatory/AcousticVisualizer.tsx`) to render live microphone buffers instead of demo synthesis.

## Development & Verification

```bash
npm run dev     # Start Vite dev server on port 3000
npm run lint    # TypeScript typecheck
npm run build   # Production bundle
npx --yes tsx --test src/lib/acoustics.test.ts  # Unit tests
```
