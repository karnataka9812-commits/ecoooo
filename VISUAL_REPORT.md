# EcoSonic 3.0 — Visual Implementation Report

## 1. Visual Identity & Design Tokens

- **Aesthetic Direction**: Premium Biophilic Technology — blending high-end conservation editorial design (`/` alternating `#101C17` deep forest and `#EEEBDD` warm ivory) with a calibrated scientific instrument workspace (`/app/*` in deep forest `#101C17`, secondary surface `#18271F`, deep pine `#243B2E`, moss `#788B68`, soft lichen `#D5D9C6`, muted stone `#A5AC9C`, and subtle amber `#D3A36C`).
- **Typography System**:
  - Editorial Display Serif: `Cormorant Garamond`
  - Modern UI Sans: `Plus Jakarta Sans`
  - Scientific Monospace (Tabular Numerals): `IBM Plex Mono` (`tabular-nums`)

## 2. Local Visual Assets (`src/assets/images/`)

Five bespoke nature and conservation assets were generated and stored locally:
- `hero_misty_forest_*.jpg` — Rainforest canopy at dawn (Section A Hero)
- `intro_wetland_habitat_*.jpg` — Misty wetland marsh and reflective lake (Section B Introduction)
- `macro_moss_dew_*.jpg` — Woodland moss and fern fronds with morning dew (Section C Methodology)
- `capability_bird_canopy_*.jpg` — Songbird on lichen-covered cedar branch (Section D Species Intelligence)
- `closing_alpine_ridge_*.jpg` — Twilight alpine ridge and evergreen valleys (Section F Closing CTA)

## 3. Feature Readiness Matrix

| Feature | Status | Notes |
| --- | --- | --- |
| Public Landing Page (`/`) | Functional locally | Sections A–G, responsive nav, local photography, demo preview |
| Live Observatory (`/app/observatory`) | Demo fixture mode | Canvas spectrogram/waveform visualizer, timer, station switcher |
| Species Intelligence (`/app/detections`) | Demo fixture mode | Client-side search, session filter, score threshold, sorting |
| Soundscape Intelligence (`/app/soundscape`) | Demo fixture mode | Apache ECharts temporal, radar fingerprint, and band energy charts |
| Disturbance Radar (`/app/disturbances`) | Demo fixture mode | 4-category classification timeline & intensity filter |
| Session History (`/app/sessions`) | Demo fixture mode | Session list, detail metrics, direct jump to species log |
| Settings & Diagnostics (`/app/settings`) | Functional locally | Theme toggle, audio preferences, endpoint URL validation, Web Audio capability check |
| Live Microphone & Backend WS | Awaiting Stage 2 | `EcoSonicDataAdapter` contract and Web Audio hooks prepared for Antigravity |
