export type CinematicPhaseId =
  | 'stillness'
  | 'illumination'
  | 'destabilize'
  | 'inversion'
  | 'emergence';

export interface CameraTransformState {
  rollDeg: number; // calm horizon drift (never jarring 180-deg flip)
  rollRad: number; // radians for Three.js camera.rotation.z
  pitchDeg: number; // serene downward gaze over lake -> level forest horizon
  pitchRad: number; // radians for Three.js camera.rotation.x
  cameraZ: number; // steady wide framing during fall, gentle forest glide after ripple
  darknessVeilOpacity: number;
}

export interface LeafMotionState {
  x: number; // aerodynamic pendulum sway in world units
  y: number; // elevated dark air -> calm lake contact
  z: number; // descends away from camera onto z≈0 lake plane (no zoom-in on leaf)
  scale: number; // slight perspective recession as it falls onto the water
  pitchRad: number; // tilts in cool air currents, levels flat on water
  yawRad: number; // gentle leaf flutter turn
  rollRad: number; // pendulum bank angle while gliding
  flutterAmount: number; // 1 while falling -> 0 settled on lake
  heightNorm: number; // 1 aloft -> 0 touching dark water
  opacity: number; // emerges softly from dark mist -> dissolves with portal ripple
  impactRippleProgress: number; // 0 before touchdown, expands 0 -> 1 across lake
  impactRippleStrength: number; // wave crest envelope peaking on touchdown, softening into portal
}

export interface LightState {
  xNorm: number; // 0..1 across frame
  yNorm: number; // 0..1 across frame
  intensity: number; // 0..1
  radiusNorm: number;
  waterMotion: number; // 0..1 water ripple & gentle wake
}

export interface WorldEmergenceState {
  portalProgress: number; // 0..1 slow fluid ripple-portal transition into forest
  settleScale: number; // 1.06 -> 1.0 gentle forest horizon arrival settle
  counterRollDeg: number; // subtle alignment settle -> 0
  hazeOpacity: number;
  particlesOpacity: number;
}

export interface TypographyState {
  quietMarkOpacity: number; // initial restrained ECOSONIC mark (0..0.32)
  brandOpacity: number; // emerged ECOSONIC identity
  taglineOpacity: number; // "Listen deeper."
  descriptionOpacity: number;
  ctaOpacity: number; // Observatory & sound interaction
  navbarVisible: boolean;
}

export interface CinematicTimelineState {
  progress: number;
  phase: CinematicPhaseId;
  camera: CameraTransformState;
  leaf: LeafMotionState;
  light: LightState;
  world: WorldEmergenceState;
  typography: TypographyState;
}

const DEG_TO_RAD = Math.PI / 180;

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

export function getPhaseForProgress(progress: number): CinematicPhaseId {
  const p = clamp01(progress);
  if (p < 0.2) return 'stillness';
  if (p < 0.4) return 'illumination';
  if (p < 0.6) return 'destabilize';
  if (p < 0.8) return 'inversion';
  return 'emergence';
}

/**
 * Single authoritative cinematic scroll timeline:
 * - 0.00 -> 0.20: Pitch-dark stillness above a nocturnal lake; a single alder leaf glides in soft moonlight
 * - 0.20 -> 0.43: Leaf drifts gently with natural pendulum flutter down onto the lake of darkness
 * - 0.43 -> 0.58: Soft touchdown; concentric ripples spread outward across the dark mirror water
 * - 0.54 -> 0.92: Expanding lake ripple slowly, smoothly transitions into the sunlit evergreen forest
 * - 0.84 -> 1.00: Living forest settles cleanly with staggered editorial typography and canopy header
 */
export function computeCinematicTimeline(rawProgress: number): CinematicTimelineState {
  const p = clamp01(rawProgress);
  const phase = getPhaseForProgress(p);

  // 1. Falling leaf kinematics (0.00 -> 0.43 descent; settles calmly at lake surface y = -0.22)
  const fallEase = smootherstep(0.0, 0.43, p);
  const heightNorm = clamp01(1 - fallEase);
  const flutterDecay = 1 - smoothstep(0.32, 0.43, p);

  const leafX = Math.sin(fallEase * Math.PI * 2.1) * 0.22 * flutterDecay;
  const leafY = lerp(0.34, -0.22, fallEase);
  // Moves slightly deeper toward the lake plane as it falls (never zooms toward the camera)
  const leafZ = lerp(0.42, 0.02, fallEase);
  const leafScale = lerp(0.96, 0.86, fallEase);

  const leafRollRad = Math.sin(fallEase * Math.PI * 2.1 + 0.35) * 0.32 * flutterDecay;
  const leafPitchRad =
    lerp(0.32, 0.04, fallEase) + Math.cos(fallEase * Math.PI * 3.0) * 0.12 * flutterDecay;
  const leafYawRad =
    lerp(-0.2, 0.02, fallEase) + Math.sin(fallEase * Math.PI * 1.5) * 0.14 * flutterDecay;

  const leafEnter = lerp(0.58, 1.0, smoothstep(0.0, 0.1, p));
  const leafExit = 1 - smootherstep(0.5, 0.63, p);
  const leafOpacity = clamp01(leafEnter * leafExit);

  // 2. Touchdown concentric ripple (starts gently at 0.41, radiates outward smoothly across lake)
  const impactRippleProgress = smootherstep(0.41, 0.82, p);
  const rippleRise = smoothstep(0.4, 0.47, p);
  const rippleFade = 1 - smootherstep(0.64, 0.82, p);
  const impactRippleStrength = clamp01(rippleRise * rippleFade);

  // 3. Moonlight beam follows the falling leaf onto the dark lake
  const lightX = clamp01(0.5 + leafX * 0.38);
  const lightY = lerp(0.32, 0.56, fallEase);
  const lightReveal = lerp(0.32, 0.88, smoothstep(0.0, 0.32, p));
  const lightFade = 1 - smootherstep(0.62, 0.84, p);
  const lightIntensity = clamp01(lightReveal * lightFade);
  const radiusNorm = lerp(0.2, 0.34, smoothstep(0.04, 0.56, p));
  const waterMotion = clamp01(
    smoothstep(0.38, 0.5, p) * (1 - smootherstep(0.78, 0.92, p))
  );

  // 4. Calm observational camera (zero leaf zoom-in, zero dizzying inversion)
  const cameraZ = lerp(2.38, 2.16, smootherstep(0.54, 0.94, p));
  const pitchDeg = lerp(-4.5, 0, smootherstep(0.52, 0.88, p));
  const rollDeg = Math.sin(smoothstep(0.44, 0.88, p) * Math.PI) * 1.6;
  const darknessVeilOpacity = clamp01(
    smoothstep(0.48, 0.62, p) * (1 - smootherstep(0.64, 0.84, p)) * 0.2
  );

  // 5. Slow, smooth transition through the lake ripple into the sunlit forest (0.54 -> 0.92)
  const portalProgress = smootherstep(0.54, 0.92, p);
  const settleScale = lerp(1.06, 1.0, smootherstep(0.56, 0.94, p));
  const counterRollDeg = lerp(-2.2, 0, smootherstep(0.56, 0.9, p));
  const hazeOpacity = smootherstep(0.66, 0.94, p);
  const particlesOpacity = smootherstep(0.74, 0.96, p);

  // 6. Editorial typography: quiet dark opening -> staggered reveal after transition settles
  const quietMarkOpacity = lerp(0.32, 0, smoothstep(0.16, 0.34, p));
  const brandOpacity = smoothstep(0.84, 0.92, p);
  const taglineOpacity = smoothstep(0.86, 0.94, p);
  const descriptionOpacity = smoothstep(0.88, 0.96, p);
  const ctaOpacity = smoothstep(0.9, 0.97, p);

  return {
    progress: p,
    phase,
    camera: {
      rollDeg,
      rollRad: rollDeg * DEG_TO_RAD,
      pitchDeg,
      pitchRad: pitchDeg * DEG_TO_RAD,
      cameraZ,
      darknessVeilOpacity,
    },
    leaf: {
      x: leafX,
      y: leafY,
      z: leafZ,
      scale: leafScale,
      pitchRad: leafPitchRad,
      yawRad: leafYawRad,
      rollRad: leafRollRad,
      flutterAmount: flutterDecay,
      heightNorm,
      opacity: leafOpacity,
      impactRippleProgress,
      impactRippleStrength,
    },
    light: {
      xNorm: lightX,
      yNorm: lightY,
      intensity: lightIntensity,
      radiusNorm,
      waterMotion,
    },
    world: {
      portalProgress,
      settleScale,
      counterRollDeg,
      hazeOpacity,
      particlesOpacity,
    },
    typography: {
      quietMarkOpacity,
      brandOpacity,
      taglineOpacity,
      descriptionOpacity,
      ctaOpacity,
      navbarVisible: p >= 0.88,
    },
  };
}
