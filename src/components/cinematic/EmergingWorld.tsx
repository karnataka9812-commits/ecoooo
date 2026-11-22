const MID_FOREST_IMG = '/src/assets/images/forest_canopy_sunlight_1795328638876.jpg';
const FAR_MIST_IMG = '/src/assets/images/hero_misty_forest_1795327580961.jpg';

const AIR_MOTES = [
  { x: 18, y: 26, size: 2, delay: '0s', dur: '14s' },
  { x: 27, y: 42, size: 1.5, delay: '2.1s', dur: '17s' },
  { x: 38, y: 31, size: 2, delay: '4.4s', dur: '13s' },
  { x: 46, y: 54, size: 1.5, delay: '1.2s', dur: '16s' },
  { x: 55, y: 28, size: 2.5, delay: '3.5s', dur: '15s' },
  { x: 63, y: 46, size: 1.5, delay: '0.8s', dur: '18s' },
  { x: 71, y: 34, size: 2, delay: '5.2s', dur: '14s' },
  { x: 78, y: 58, size: 1.5, delay: '2.9s', dur: '16s' },
  { x: 42, y: 68, size: 2, delay: '6.1s', dur: '15s' },
  { x: 58, y: 63, size: 1.5, delay: '1.7s', dur: '17s' },
  { x: 31, y: 61, size: 1.5, delay: '3.9s', dur: '19s' },
  { x: 66, y: 22, size: 2, delay: '4.8s', dur: '14s' },
];

export interface FallbackWorldState {
  visibility: number;
  scale: number;
  counterRollDeg: number;
  farLayerOpacity: number;
  midLayerOpacity: number;
  nearLayerOpacity: number;
  hazeOpacity: number;
}

interface EmergingWorldProps {
  world: FallbackWorldState;
  pointerOffset: { x: number; y: number };
  isMobile: boolean;
  reducedMotion: boolean;
  isInViewport: boolean;
}

/**
 * Multi-layered photographed forest environment revealed after the 180-degree camera roll.
 * Combines far misty atmosphere, mid-depth sunlit cedar canopy, and matched near-field botanical depth.
 */
export function EmergingWorld({
  world,
  pointerOffset,
  isMobile,
  reducedMotion,
  isInViewport,
}: EmergingWorldProps) {
  if (world.visibility <= 0.005) {
    return null;
  }

  const px = reducedMotion || isMobile ? 0 : pointerOffset.x;
  const py = reducedMotion || isMobile ? 0 : pointerOffset.y;

  const aperturePct = world.visibility * 140;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#060907]"
      style={{
        opacity: Math.min(1, world.visibility * 1.15),
        transform: `scale(${world.scale}) rotateZ(${world.counterRollDeg}deg)`,
        WebkitMaskImage:
          world.visibility >= 0.96
            ? undefined
            : `radial-gradient(ellipse ${aperturePct}% ${aperturePct * 0.85}% at 50% 48%, rgba(0,0,0,1) 46%, rgba(0,0,0,0.4) 76%, rgba(0,0,0,0) 100%)`,
        maskImage:
          world.visibility >= 0.96
            ? undefined
            : `radial-gradient(ellipse ${aperturePct}% ${aperturePct * 0.85}% at 50% 48%, rgba(0,0,0,1) 46%, rgba(0,0,0,0.4) 76%, rgba(0,0,0,0) 100%)`,
      }}
    >
      {/* Far Layer: Atmospheric distant misty horizon & high canopy glow */}
      <div
        aria-hidden="true"
        className="absolute inset-[-4%] will-change-transform transition-transform duration-500 ease-out"
        style={{
          opacity: world.farLayerOpacity * 0.52,
          transform: `translate3d(${px * -5}px, ${py * -4}px, 0) scale(1.06)`,
        }}
      >
        <img
          src={FAR_MIST_IMG}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top filter blur-[2px] brightness-110 saturate-75"
        />
      </div>

      {/* Middle Layer: Primary photographed old-growth forest with natural morning sunbeams */}
      <div
        className="absolute inset-[-3%] will-change-transform transition-transform duration-300 ease-out"
        style={{
          opacity: world.midLayerOpacity,
          transform: `translate3d(${px * -11}px, ${py * -7}px, 0) scale(1.04)`,
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.92) 22%, rgba(0,0,0,1) 48%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.92) 22%, rgba(0,0,0,1) 48%)',
        }}
      >
        <img
          src={MID_FOREST_IMG}
          alt="Sunlit Pacific Northwest evergreen forest with mist, cedar trunks, and fern floor"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Atmospheric natural morning haze */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: world.hazeOpacity * 0.45,
          background:
            'radial-gradient(ellipse 68% 45% at 56% 34%, rgba(235, 228, 206, 0.16) 0%, rgba(16, 28, 23, 0) 70%)',
        }}
      />

      {/* Near Layer: Matched shallow-depth foreground ferns & mossy floor edges (1.6x parallax) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-6%] bottom-[-5%] h-[42%] will-change-transform transition-transform duration-200 ease-out"
        style={{
          opacity: world.nearLayerOpacity * 0.92,
          transform: `translate3d(${px * -20}px, ${py * -11}px, 0) scale(1.12)`,
          WebkitMaskImage:
            'radial-gradient(ellipse 95% 88% at 50% 100%, rgba(0,0,0,1) 18%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 76%)',
          maskImage:
            'radial-gradient(ellipse 95% 88% at 50% 100%, rgba(0,0,0,1) 18%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 76%)',
        }}
      >
        <img
          src={MID_FOREST_IMG}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-bottom filter blur-[1.4px] contrast-105 brightness-90"
        />
      </div>

      {/* Subtle airborne forest motes inside the sunbeams (disabled in reduced-motion or offscreen) */}
      {!reducedMotion && isInViewport && world.visibility > 0.65 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {(isMobile ? AIR_MOTES.slice(0, 6) : AIR_MOTES).map((mote, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[#EEE6CF]/35 animate-pulse"
              style={{
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                animationDelay: mote.delay,
                animationDuration: mote.dur,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
