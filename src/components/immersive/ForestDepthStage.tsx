import { useState } from 'react';
import { Bird, Bug, Droplets, Wind, X } from 'lucide-react';
import {
  SOUNDSCAPE_LAYERS,
  type SoundLayerId,
  type SoundscapeMixerSnapshot,
} from '../../audio/soundscapeEngine';
import type { SceneRevealState } from '../../lib/immersiveTimeline';

const FOREST_SUNLIGHT_IMG = '/src/assets/images/forest_canopy_sunlight_1795328638876.jpg';

interface AcousticPointSpec {
  id: SoundLayerId;
  label: string;
  desktop: { xPct: number; yPct: number };
  mobile: { xPct: number; yPct: number };
  icon: typeof Bird;
}

const ACOUSTIC_POINTS: AcousticPointSpec[] = [
  {
    id: 'birds',
    label: 'Canopy Birds',
    desktop: { xPct: 48, yPct: 41 },
    mobile: { xPct: 27, yPct: 44 },
    icon: Bird,
  },
  {
    id: 'wind',
    label: 'Evergreen Wind',
    desktop: { xPct: 72, yPct: 48 },
    mobile: { xPct: 73, yPct: 46 },
    icon: Wind,
  },
  {
    id: 'water',
    label: 'Forest Water',
    desktop: { xPct: 54, yPct: 68 },
    mobile: { xPct: 72, yPct: 61 },
    icon: Droplets,
  },
  {
    id: 'insects',
    label: 'Understory Insects',
    desktop: { xPct: 38, yPct: 59 },
    mobile: { xPct: 27, yPct: 61 },
    icon: Bug,
  },
];

interface ForestDepthStageProps {
  reveal: SceneRevealState;
  pointerOffset: { x: number; y: number };
  mixerState: SoundscapeMixerSnapshot;
  isMobile: boolean;
  reducedMotion: boolean;
  onSelectPoint: (id: SoundLayerId) => void;
  onHoverPoint: (id: SoundLayerId | null) => void;
  onDismissSpotlight: () => void;
  onTriggerWaterRipple: (xNorm: number, yNorm: number) => void;
}

export function ForestDepthStage({
  reveal,
  pointerOffset,
  mixerState,
  isMobile,
  reducedMotion,
  onSelectPoint,
  onHoverPoint,
  onDismissSpotlight,
  onTriggerWaterRipple,
}: ForestDepthStageProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SoundLayerId | null>(null);

  const px = reducedMotion || isMobile ? 0 : pointerOffset.x;
  const py = reducedMotion || isMobile ? 0 : pointerOffset.y;

  const aperture = reveal.forestAperturePct;
  const windActive = mixerState.isPlaying && !mixerState.isMuted && mixerState.layers.wind.enabled;

  const maskStyle =
    aperture <= 0.5
      ? {
          WebkitMaskImage: 'radial-gradient(circle at 50% 64%, black 0%, transparent 0%)',
          maskImage: 'radial-gradient(circle at 50% 64%, black 0%, transparent 0%)',
        }
      : {
          WebkitMaskImage: `radial-gradient(ellipse ${aperture * 1.15}% ${aperture * 0.92}% at 50% 64%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0) 100%)`,
          maskImage: `radial-gradient(ellipse ${aperture * 1.15}% ${aperture * 0.92}% at 50% 64%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0) 100%)`,
        };

  const spotlightId = hoveredPoint ?? mixerState.activeSpotlight;
  const spotlightMeta = spotlightId ? SOUNDSCAPE_LAYERS[spotlightId] : null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={maskStyle}
    >
      {/* Layer 1: Background Forest Canopy + Dawn Sunlight */}
      <div
        className="absolute inset-[-4%] transition-transform duration-300 ease-out will-change-transform"
        style={{
          opacity: reveal.distantCanopyOpacity,
          transform: `translate3d(${px * -8}px, ${py * -6}px, 0) scale(${1.06 - reveal.distantCanopyOpacity * 0.03})`,
        }}
      >
        <img
          src={FOREST_SUNLIGHT_IMG}
          alt="Sunlit evergreen cedar and pine forest canopy with misty depth"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#101C17]/88 via-[#101C17]/30 to-[#101C17]/65"
        />
      </div>

      {/* Layer 2: Atmospheric Mist & Volumetric Morning Light Rays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: reveal.fogDepthOpacity * 0.72,
          background:
            'radial-gradient(ellipse 85% 42% at 50% 56%, rgba(213,217,198,0.14) 0%, rgba(24,39,31,0.28) 55%, rgba(16,28,23,0) 100%)',
        }}
      />

      {!isMobile && (
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-screen transition-transform duration-500 ease-out"
          style={{
            opacity: reveal.sunlightRaysOpacity * 0.55,
            transform: `translate3d(${px * -12}px, ${py * -8}px, 0)`,
            background:
              'conic-gradient(from 195deg at 56% 18%, transparent 0deg, rgba(211,163,108,0.16) 14deg, transparent 28deg, rgba(213,217,198,0.11) 42deg, transparent 58deg)',
          }}
        />
      )}

      {/* Layer 3: Midground Evergreen Silhouettes */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          opacity: reveal.midgroundPinesOpacity * 0.72,
          transform: `translate3d(${px * -14}px, ${py * -9}px, 0)`,
        }}
      >
        <g fill="#122019" fillOpacity="0.68">
          <path d="M-20 900 L-20 510 L25 415 L45 455 L75 340 L105 450 L145 415 L175 560 L175 900 Z" />
          <path d="M1260 900 L1260 540 L1305 410 L1335 470 L1370 335 L1405 460 L1460 400 L1460 900 Z" />
        </g>
      </svg>

      {/* Layer 4: Delicate Foreground Fern Fronds & Cedar Framing */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-out will-change-transform ${
          windActive && !reducedMotion ? 'animate-[pulse_7s_ease-in-out_infinite]' : ''
        }`}
        style={{
          opacity: reveal.foregroundFloraOpacity * 0.82,
          transform: `translate3d(${px * -22}px, ${py * -12}px, 0)`,
        }}
      >
        <g fill="#0A130F" fillOpacity="0.72">
          {/* Bottom-left delicate fern frond cluster */}
          <path d="M-10 900 L-10 735 C22 745, 52 762, 74 785 C46 782, 22 790, 6 806 C48 800, 88 812, 122 835 C86 832, 54 842, 28 860 C72 856, 118 866, 158 900 Z" />
          {/* Bottom-right delicate fern frond cluster */}
          <path d="M1450 900 L1450 725 C1412 740, 1378 760, 1352 786 C1384 782, 1410 790, 1430 806 C1382 800, 1338 814, 1300 838 C1340 834, 1376 844, 1404 862 C1356 858, 1306 868, 1264 900 Z" />
        </g>
      </svg>

      {/* Layer 5: Interactive Acoustic Reticle Points (Enabled in Chapter 05) */}
      {reveal.interactiveReady && (
        <div className="absolute inset-0 pointer-events-auto">
          {ACOUSTIC_POINTS.map((pt) => {
            const Icon = pt.icon;
            const coords = isMobile ? pt.mobile : pt.desktop;
            const isLayerOn =
              mixerState.layers[pt.id].enabled && mixerState.isPlaying && !mixerState.isMuted;
            const isActive = spotlightId === pt.id;
            return (
              <button
                key={pt.id}
                type="button"
                aria-label={`Explore ${pt.label} acoustic point`}
                onMouseEnter={() => {
                  setHoveredPoint(pt.id);
                  onHoverPoint(pt.id);
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  onHoverPoint(null);
                }}
                onFocus={() => {
                  setHoveredPoint(pt.id);
                  onHoverPoint(pt.id);
                }}
                onBlur={() => {
                  setHoveredPoint(null);
                  onHoverPoint(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoint(pt.id);
                  if (pt.id === 'water') {
                    onTriggerWaterRipple(coords.xPct / 100, coords.yPct / 100);
                  }
                }}
                style={{
                  left: `${coords.xPct}%`,
                  top: `${coords.yPct}%`,
                  transform: `translate(-50%, -50%) translate3d(${px * -10}px, ${py * -7}px, 0)`,
                }}
                className={`group absolute flex items-center gap-2 px-2.5 py-1.5 rounded-md border backdrop-blur-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3A36C] ${
                  isActive || isLayerOn
                    ? 'bg-[#18271F]/92 border-[#D3A36C]/85 text-[#EEEBDD] shadow-lg'
                    : 'bg-[#101C17]/78 border-[#D5D9C6]/35 text-[#D5D9C6] hover:border-[#EEEBDD]/75 hover:text-[#EEEBDD]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive || isLayerOn ? 'bg-[#D3A36C]' : 'bg-[#788B68]'
                  }`}
                />
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive || isLayerOn ? 'text-[#D3A36C]' : 'text-[#788B68]'
                  }`}
                />
                <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap">
                  {pt.label}
                </span>
              </button>
            );
          })}

          {/* Contextual Species / Sound Spotlight Card */}
          {spotlightMeta && (
            <div
              role="region"
              aria-label={`${spotlightMeta.label} acoustic details`}
              className="pointer-events-auto absolute left-4 right-4 sm:left-8 sm:right-auto sm:max-w-xs bottom-[198px] sm:bottom-36 z-20 rounded-lg border border-[#D5D9C6]/25 bg-[#101C17]/94 backdrop-blur-md p-3.5 sm:p-4 text-left shadow-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono text-[#D3A36C]">
                  {spotlightMeta.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#A5AC9C]">
                    {mixerState.layers[spotlightMeta.id].enabled &&
                    mixerState.isPlaying &&
                    !mixerState.isMuted
                      ? 'ACTIVE IN MIX'
                      : 'DEMO LAYER'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredPoint(null);
                      onDismissSpotlight();
                    }}
                    aria-label="Close acoustic spotlight"
                    className="p-0.5 rounded text-[#A5AC9C] hover:text-[#EEEBDD] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-1 font-serif text-lg sm:text-xl font-semibold text-[#EEEBDD]">
                {spotlightMeta.speciesOrSource}
              </h3>
              <p className="mt-1 text-xs text-[#D5D9C6]/90 leading-relaxed">
                {spotlightMeta.description}
              </p>

              {/* Compact waveform indicator */}
              <div className="mt-2.5 pt-2 border-t border-[#D5D9C6]/12 flex items-center justify-between gap-3">
                <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
                  {[0.4, 0.85, 0.6, 1.0, 0.5, 0.75, 0.35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-sm bg-[#788B68] transition-all duration-300"
                      style={{
                        height:
                          mixerState.isPlaying && !mixerState.isMuted && !reducedMotion
                            ? `${Math.round(h * 14)}px`
                            : '4px',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#A5AC9C] truncate">
                  {spotlightMeta.licenseNotice}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
