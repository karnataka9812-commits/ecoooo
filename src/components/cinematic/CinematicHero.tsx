import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  soundscapeController,
  type SoundscapeMixerSnapshot,
} from '../../audio/soundscapeEngine';
import {
  computeCinematicTimeline,
  type CinematicTimelineState,
  type TypographyState,
} from '../../lib/cinematicTimeline';
import { CinematicTypography } from './CinematicTypography';
import { DarkWaterScene } from './DarkWaterScene';
import { EmergingWorld } from './EmergingWorld';
import { WebGLCinematicStage } from './WebGLCinematicStage';
import { WorldTransition } from './WorldTransition';

gsap.registerPlugin(ScrollTrigger);

interface CinematicHeroProps {
  onNavbarVisibilityChange?: (visible: boolean) => void;
}

function typographyDiffers(a: TypographyState, b: TypographyState): boolean {
  return (
    a.navbarVisible !== b.navbarVisible ||
    Math.abs(a.quietMarkOpacity - b.quietMarkOpacity) > 0.015 ||
    Math.abs(a.brandOpacity - b.brandOpacity) > 0.015 ||
    Math.abs(a.taglineOpacity - b.taglineOpacity) > 0.015 ||
    Math.abs(a.descriptionOpacity - b.descriptionOpacity) > 0.015 ||
    Math.abs(a.ctaOpacity - b.ctaOpacity) > 0.015
  );
}

/**
 * Authoritative scroll-driven cinematic opening sequence:
 * Lenis smooth scroll + GSAP ScrollTrigger + isolated Three.js WebGL shader portal
 * (with automatic Canvas 2D + CSS 3D fallback if WebGL is unavailable).
 */
export function CinematicHero({ onNavbarVisibilityChange }: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<CinematicTimelineState>(computeCinematicTimeline(0));
  const pointerTargetRef = useRef({ x: 0, y: 0 });

  const [webglAvailable, setWebglAvailable] = useState(true);
  const [fallbackState, setFallbackState] = useState<CinematicTimelineState>(() =>
    computeCinematicTimeline(0)
  );
  const [typography, setTypography] = useState<TypographyState>(
    () => timelineRef.current.typography
  );
  const [renderVersion, setRenderVersion] = useState(0);
  const [reducedProgress, setReducedProgress] = useState(0.45);

  const [isInViewport, setIsInViewport] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [fallbackPointer, setFallbackPointer] = useState({ x: 0, y: 0 });
  const [mixerState, setMixerState] = useState<SoundscapeMixerSnapshot>(() =>
    soundscapeController.getSnapshot()
  );

  // Sync centralized Web Audio controller (always muted initially, stops offscreen/unmount)
  useEffect(() => {
    const unsub = soundscapeController.subscribe(setMixerState);
    return () => {
      unsub();
      soundscapeController.stopAll();
    };
  }, []);

  // Responsive breakpoint & reduced-motion media listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(mq.matches);

    window.addEventListener('resize', onResize);
    mq.addEventListener('change', onMotion);
    return () => {
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', onMotion);
    };
  }, []);

  // Pause GPU/audio work when visitor scrolls below the cinematic opening
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInViewport(visible);
        if (!visible) {
          soundscapeController.stopAll();
        }
      },
      { threshold: 0.02 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Single Scroll Authority: Lenis + GSAP ScrollTrigger driving timelineRef at 60 FPS with zero React churn
  useEffect(() => {
    if (reducedMotion) {
      const next = computeCinematicTimeline(reducedProgress);
      timelineRef.current = next;
      setTypography(next.typography);
      if (!webglAvailable) setFallbackState(next);
      setRenderVersion((v) => v + 1);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: true,
    });

    const onLenisScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onLenisScroll);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.42,
      onUpdate: (self) => {
        const next = computeCinematicTimeline(self.progress);
        timelineRef.current = next;

        if (!webglAvailable) {
          setFallbackState(next);
        }
        setTypography((prev) => (typographyDiffers(prev, next.typography) ? next.typography : prev));
      },
    });

    // Ensure initial progress matches current scroll position on mount/refresh
    const initialNext = computeCinematicTimeline(trigger.progress);
    timelineRef.current = initialNext;
    setTypography(initialNext.typography);
    if (!webglAvailable) setFallbackState(initialNext);

    return () => {
      trigger.kill();
      lenis.off('scroll', onLenisScroll);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, [reducedMotion, reducedProgress, webglAvailable]);

  // Notify landing header visibility smoothly
  useEffect(() => {
    onNavbarVisibilityChange?.(
      reducedMotion ? true : typography.navbarVisible || !isInViewport
    );
  }, [onNavbarVisibilityChange, reducedMotion, typography.navbarVisible, isInViewport]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || isMobile || !isInViewport) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      pointerTargetRef.current = { x: nx, y: ny };
      if (!webglAvailable) {
        setFallbackPointer({ x: nx, y: ny });
      }
    },
    [reducedMotion, isMobile, isInViewport, webglAvailable]
  );

  const handleWebGLUnavailable = useCallback(() => {
    setWebglAvailable(false);
  }, []);

  const handleToggleSound = useCallback(() => {
    if (!mixerState.isPlaying) {
      soundscapeController.setMasterVolume(0.45);
      soundscapeController.setLayerEnabled('water', true);
      soundscapeController.setLayerEnabled('wind', true);
      soundscapeController.setLayerEnabled('birds', true);
      soundscapeController.setLayerEnabled('insects', false);
      soundscapeController.togglePlay();
    } else {
      soundscapeController.toggleMute();
    }
  }, [mixerState.isPlaying]);

  return (
    <section
      ref={containerRef}
      aria-label="EcoSonic Cinematic Opening"
      onPointerMove={handlePointerMove}
      className={
        reducedMotion
          ? 'relative min-h-[92vh] bg-[#050605] text-[#EEEBDD]'
          : 'relative h-[440vh] md:h-[520vh] bg-[#050605] text-[#EEEBDD]'
      }
    >
      <div
        className={
          reducedMotion
            ? 'relative h-[92vh] overflow-hidden bg-[#050605]'
            : 'sticky top-0 h-screen w-full overflow-hidden bg-[#050605]'
        }
      >
        {webglAvailable ? (
          <WebGLCinematicStage
            timelineRef={timelineRef}
            pointerTargetRef={pointerTargetRef}
            renderVersion={renderVersion}
            isInViewport={isInViewport}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            onWebGLUnavailable={handleWebGLUnavailable}
          />
        ) : (
          <>
            <EmergingWorld
              world={{
                visibility: fallbackState.world.portalProgress,
                scale: fallbackState.world.settleScale,
                counterRollDeg: fallbackState.world.counterRollDeg,
                farLayerOpacity: fallbackState.world.portalProgress,
                midLayerOpacity: fallbackState.world.portalProgress,
                nearLayerOpacity: fallbackState.world.portalProgress,
                hazeOpacity: fallbackState.world.hazeOpacity,
              }}
              pointerOffset={fallbackPointer}
              isMobile={isMobile}
              reducedMotion={reducedMotion}
              isInViewport={isInViewport}
            />
            <WorldTransition camera={fallbackState.camera} progress={fallbackState.progress}>
              <DarkWaterScene
                light={fallbackState.light}
                pointerOffset={fallbackPointer}
                isInViewport={isInViewport}
                isMobile={isMobile}
                reducedMotion={reducedMotion}
              />
            </WorldTransition>
          </>
        )}

        {/* Restrained Editorial Typography & Optional Sound */}
        <CinematicTypography
          typography={typography}
          soundPlaying={mixerState.isPlaying}
          soundMuted={mixerState.isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* Reduced-motion accessible scene switcher */}
        {reducedMotion && (
          <div className="absolute bottom-6 right-6 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReducedProgress(0.45)}
              className={`px-3 py-1.5 text-[11px] font-mono tracking-wider border cursor-pointer ${
                reducedProgress < 0.5
                  ? 'border-[#D5D9C6]/60 bg-[#101C17]/90 text-[#EEEBDD]'
                  : 'border-[#D5D9C6]/20 bg-[#050605]/70 text-[#A5AC9C]'
              }`}
            >
              Dark Lake
            </button>
            <button
              type="button"
              onClick={() => setReducedProgress(1)}
              className={`px-3 py-1.5 text-[11px] font-mono tracking-wider border cursor-pointer ${
                reducedProgress >= 0.5
                  ? 'border-[#D5D9C6]/60 bg-[#101C17]/90 text-[#EEEBDD]'
                  : 'border-[#D5D9C6]/20 bg-[#050605]/70 text-[#A5AC9C]'
              }`}
            >
              Living Forest
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
