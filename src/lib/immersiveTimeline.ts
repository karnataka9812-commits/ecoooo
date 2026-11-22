export interface ImmersiveChapter {
  id: string;
  index: string;
  label: string;
  start: number;
  end: number;
  targetProgress: number;
}

export const IMMERSIVE_CHAPTERS: ImmersiveChapter[] = [
  { id: 'stillness', index: '01', label: 'STILLNESS', start: 0.0, end: 0.16, targetProgress: 0.02 },
  { id: 'first-contact', index: '02', label: 'FIRST CONTACT', start: 0.16, end: 0.38, targetProgress: 0.27 },
  { id: 'ripple', index: '03', label: 'THE RIPPLE', start: 0.38, end: 0.56, targetProgress: 0.45 },
  { id: 'forest', index: '04', label: 'THE FOREST', start: 0.56, end: 0.8, targetProgress: 0.72 },
  { id: 'soundscape', index: '05', label: 'THE SOUNDSCAPE', start: 0.8, end: 1.0, targetProgress: 0.92 },
];

export interface LeafPose {
  visible: boolean;
  /** Horizontal offset from center in vw-like percentage (-12..12) */
  xPercent: number;
  /** Vertical position in viewport height % ( -10 .. 66 ) */
  yPercent: number;
  /** Rotation in degrees */
  rotateDeg: number;
  /** Subtle 3D tilt in degrees */
  tiltXDeg: number;
  scale: number;
  opacity: number;
  settledOnWater: boolean;
}

export interface SceneRevealState {
  chapterIndex: number;
  activeChapter: ImmersiveChapter;
  wordmarkOpacity: number;
  stillnessPromptOpacity: number;
  contactCopyOpacity: number;
  waterSurfaceOpacity: number;
  rippleProgress: number;
  /** Radial mask expansion percentage (0..145) revealing the forest out of the ripple */
  forestAperturePct: number;
  distantCanopyOpacity: number;
  fogDepthOpacity: number;
  midgroundPinesOpacity: number;
  foregroundFloraOpacity: number;
  sunlightRaysOpacity: number;
  forestHeadlineOpacity: number;
  interactiveReady: boolean;
  leaf: LeafPose;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function rangeProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export function getChapterForProgress(progress: number): {
  index: number;
  chapter: ImmersiveChapter;
} {
  const p = clamp01(progress);
  for (let i = 0; i < IMMERSIVE_CHAPTERS.length; i++) {
    const ch = IMMERSIVE_CHAPTERS[i];
    if (p <= ch.end || i === IMMERSIVE_CHAPTERS.length - 1) {
      return { index: i, chapter: ch };
    }
  }
  return { index: 0, chapter: IMMERSIVE_CHAPTERS[0] };
}

/**
 * Computes deterministic, reversible leaf descent trajectory across scroll progress [0..1].
 * Leaf enters at p=0.12, descends with natural sinusoidal flutter, decelerates into
 * the water surface at p=0.40, and gently drifts/fades as the forest takes over.
 */
export function computeLeafPose(progress: number): LeafPose {
  const p = clamp01(progress);
  if (p < 0.1) {
    return {
      visible: false,
      xPercent: -4,
      yPercent: -12,
      rotateDeg: -18,
      tiltXDeg: 10,
      scale: 1.05,
      opacity: 0,
      settledOnWater: false,
    };
  }

  const descentT = rangeProgress(p, 0.12, 0.4);
  // Ease out near the water surface for natural air cushion deceleration
  const easedY = 1 - Math.pow(1 - descentT, 1.55);

  const waterSurfaceY = 64;
  const startY = -10;
  const yPercent = startY + easedY * (waterSurfaceY - startY);

  // Lateral pendulum sway that damps as it reaches the water
  const flutterDamp = 1 - smoothstep(0.75, 1.0, descentT) * 0.72;
  const xPercent = Math.sin(descentT * Math.PI * 2.4) * 7.5 * flutterDamp - (1 - descentT) * 3.5;

  const rotateDeg =
    -22 + descentT * 38 + Math.sin(descentT * Math.PI * 3.1) * 14 * flutterDamp;
  const tiltXDeg = 18 * (1 - descentT * 0.45) + Math.cos(descentT * Math.PI * 2.2) * 10;

  // Perspective scale slightly decreases as it settles onto the water plane
  const scale = 1.08 - descentT * 0.28;

  const fadeIn = smoothstep(0.1, 0.17, p);
  const fadeOutInForest = 1 - smoothstep(0.58, 0.76, p);
  const opacity = clamp01(fadeIn * fadeOutInForest);

  // Subtle drift after touching water
  const postDrift = rangeProgress(p, 0.4, 0.76);

  return {
    visible: opacity > 0.01,
    xPercent: xPercent + postDrift * 2.2,
    yPercent: yPercent + postDrift * 1.4,
    rotateDeg: rotateDeg + postDrift * 6,
    tiltXDeg: descentT >= 1 ? 48 : tiltXDeg,
    scale: scale - postDrift * 0.08,
    opacity,
    settledOnWater: p >= 0.4,
  };
}

/**
 * Maps single unified scroll progress [0..1] into coherent reversible visual layer states.
 */
export function computeSceneRevealState(progress: number): SceneRevealState {
  const p = clamp01(progress);
  const { index, chapter } = getChapterForProgress(p);

  const wordmarkOpacity = 1 - smoothstep(0.12, 0.25, p);
  const stillnessPromptOpacity = 1 - smoothstep(0.08, 0.2, p);

  const waterSurfaceOpacity = smoothstep(0.16, 0.34, p) * (1 - smoothstep(0.78, 0.96, p) * 0.65);

  const rippleProgress = rangeProgress(p, 0.39, 0.68);

  const contactCopyOpacity =
    smoothstep(0.36, 0.44, p) * (1 - smoothstep(0.54, 0.64, p));

  // Forest emerges organically from the expanding water ripple
  const forestAperturePct = smoothstep(0.42, 0.78, p) * 145;
  const distantCanopyOpacity = smoothstep(0.44, 0.64, p);
  const fogDepthOpacity = smoothstep(0.48, 0.72, p);
  const midgroundPinesOpacity = smoothstep(0.54, 0.76, p);
  const foregroundFloraOpacity = smoothstep(0.62, 0.84, p);
  const sunlightRaysOpacity = smoothstep(0.68, 0.9, p);

  const forestHeadlineOpacity = smoothstep(0.74, 0.88, p);
  const interactiveReady = p >= 0.78;

  return {
    chapterIndex: index,
    activeChapter: chapter,
    wordmarkOpacity,
    stillnessPromptOpacity,
    contactCopyOpacity,
    waterSurfaceOpacity,
    rippleProgress,
    forestAperturePct,
    distantCanopyOpacity,
    fogDepthOpacity,
    midgroundPinesOpacity,
    foregroundFloraOpacity,
    sunlightRaysOpacity,
    forestHeadlineOpacity,
    interactiveReady,
    leaf: computeLeafPose(p),
  };
}
