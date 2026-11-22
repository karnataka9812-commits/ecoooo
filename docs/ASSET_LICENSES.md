# EcoSonic 3.0 — Asset Provenance & Licenses

All visual, acoustic, and interactive assets in the EcoSonic 3.0 landing experience and demonstration observatory are either procedurally synthesized in-browser or locally generated project assets. No external stock scraping, copyrighted recordings, or paid third-party media APIs are used.

---

## 1. Environmental Audio Assets

| Asset Name | Source | URL | License | Attribution Requirement | Where It Is Used |
| --- | --- | --- | --- | --- | --- |
| Procedural Forest Soundscape (`birds`, `wind`, `water`, `insects`) | In-browser Web Audio API procedural synthesis (`src/audio/soundscapeEngine.ts`) | N/A (local procedural synthesis) | CC0 1.0 Universal (Public Domain Dedication) | None required | `src/components/immersive/SoundscapeMixer.tsx`, `src/components/immersive/ForestDepthStage.tsx` |
| Water Contact Acoustic Impulse | In-browser Web Audio API filtered noise + resonant droplet ping (`src/audio/soundscapeEngine.ts`) | N/A (local procedural synthesis) | CC0 1.0 Universal (Public Domain Dedication) | None required | `src/components/immersive/WaterRippleCanvas.tsx` |

---

## 2. Visual & Photographic Assets

| Asset Name | Source | URL | License | Attribution Requirement | Where It Is Used |
| --- | --- | --- | --- | --- | --- |
| `leaf_dark_water_1795329475477.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/leaf_dark_water_1795329475477.jpg`) | Project-owned local asset | None required | `src/components/cinematic/DarkWaterScene.tsx` |
| `forest_canopy_sunlight_1795328638876.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/forest_canopy_sunlight_1795328638876.jpg`) | Project-owned local asset | None required | `src/components/cinematic/EmergingWorld.tsx` |
| `hero_misty_forest_1795327580961.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/hero_misty_forest_1795327580961.jpg`) | Project-owned local asset | None required | `src/components/cinematic/EmergingWorld.tsx` (far atmospheric horizon layer) |
| `intro_wetland_habitat_1795327580798.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/intro_wetland_habitat_1795327580798.jpg`) | Project-owned local asset | None required | `src/pages/LandingPage.tsx` (`#overview`) |
| `capability_bird_canopy_1795327580975.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/capability_bird_canopy_1795327580975.jpg`) | Project-owned local asset | None required | `src/pages/LandingPage.tsx` (`#capabilities`) |
| `macro_moss_dew_1795327581100.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/macro_moss_dew_1795327581100.jpg`) | Project-owned local asset | None required | `src/pages/LandingPage.tsx` (`#methodology`) |
| `closing_alpine_ridge_1795327580352.jpg` | AI Studio project asset generation (`generate_image`) | N/A (local bundle asset `src/assets/images/closing_alpine_ridge_1795327580352.jpg`) | Project-owned local asset | None required | `src/pages/LandingPage.tsx` (closing editorial band) |

---

## 3. Procedural Visual Modules (Zero External Asset Dependencies)

- **Botanical Leaf SVG (`src/components/immersive/BotanicalLeaf.tsx`)**: Procedural vector geometry and leaf venation shading.
- **Concentric Water Ripple Physics (`src/components/immersive/WaterRippleCanvas.tsx`)**: Canvas 2D multi-crest wave packet refraction and ambient pollen/mist particles.
- **Multi-Layer Forest Silhouettes & Sunbeams (`src/components/immersive/ForestDepthStage.tsx`)**: Procedural SVG pine/fern layers, CSS radial wave reveal, and volumetric light columns.
