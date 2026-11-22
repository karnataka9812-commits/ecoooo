import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight } from 'lucide-react';
import {
  soundscapeController,
  type SoundLayerId,
  type SoundscapeMixerSnapshot,
} from '../../audio/soundscapeEngine';
import {
  computeSceneRevealState,
  IMMERSIVE_CHAPTERS,
} from '../../lib/immersiveTimeline';
import { BotanicalLeaf } from './BotanicalLeaf';
import { ForestDepthStage } from './ForestDepthStage';
import { SoundscapeMixer } from './SoundscapeMixer';
import { WaterRippleCanvas, type WaterRippleHandle } from './WaterRippleCanvas';

export function CinematicForestExperience() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waterRef = useRef<WaterRippleHandle | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [mixerState, setMixerState] = useState<SoundscapeMixerSnapshot>(() =>
    soundscapeController.getSnapshot()
  );

  // Subscribe to centralized audio controller and dispose/stop on unmount
  useEffect(() => {
    const unsub = soundscapeController.subscribe(setMixerState);
    return () => {
      unsub();
      soundscapeController.stopAll();
    };
  }, []);

  // Track responsive mobile breakpoint & prefers-reduced-motion
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = () => setReducedMotion(mq.matches);

    window.addEventListener('resize', handleResize);
    mq.addEventListener('change', handleMotion);
    return () => {
      window.removeEventListener('resize', handleResize);
      mq.removeEventListener('change', handleMotion);
    };
  }, []);

  // Pause rendering and stop audio when scrolled completely past the cinematic section
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

  // Single unified scroll progress listener (reversible up/down)
  useEffect(() => {
    if (reducedMotion) return;
    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const passed = Math.min(scrollable, Math.max(0, -rect.top));
      const next = passed / scrollable;
      setScrollProgress((prev) => (Math.abs(prev - next) > 0.0005 ? next : prev));
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const reveal = useMemo(() => computeSceneRevealState(scrollProgress), [scrollProgress]);

  const scrollToChapter = useCallback(
    (targetProgress: number) => {
      if (reducedMotion) {
        setScrollProgress(targetProgress);
        return;
      }
      const el = containerRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      window.scrollTo({
        top: top + targetProgress * scrollable,
        behavior: 'smooth',
      });
    },
    [reducedMotion]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || isMobile || reveal.forestAperturePct < 20) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setPointerOffset({ x: nx, y: ny });
    },
    [reducedMotion, isMobile, reveal.forestAperturePct]
  );

  const handleWaterClick = useCallback(() => {
    if (reveal.interactiveReady) {
      soundscapeController.activatePoint('water');
    }
  }, [reveal.interactiveReady]);

  return (
    <section
      ref={containerRef}
      aria-label="EcoSonic 3.0 From Silence to Life Interactive Nature Sequence"
      onPointerMove={handlePointerMove}
      className={
        reducedMotion
          ? 'relative min-h-[88vh] bg-[#0B1410] text-[#EEEBDD]'
          : 'relative h-[340vh] md:h-[440vh] bg-[#0B1410] text-[#EEEBDD]'
      }
    >
      <div
        className={
          reducedMotion
            ? 'relative h-[88vh] overflow-hidden'
            : 'sticky top-0 h-screen w-full overflow-hidden'
        }
      >
        {/* Base Scene 1: Deep Atmospheric Forest Stillness Canvas */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#0B1410]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 75% 55% at 50% 42%, rgba(24, 39, 31, 0.45) 0%, rgba(11, 20, 16, 0.96) 75%)',
          }}
        />

        {/* Scene 3 Water Canvas + Interactive Clickable Water + Ambient Pollen/Mist Motes */}
        <WaterRippleCanvas
          ref={waterRef}
          waterOpacity={reveal.waterSurfaceOpacity}
          scrollRippleProgress={reveal.rippleProgress}
          isActiveInViewport={isInViewport}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
          onWaterClick={handleWaterClick}
        />

        {/* Scene 4 & 5: Multi-Layer Evergreen Forest Emerges via Radial Ripple Mask */}
        <ForestDepthStage
          reveal={reveal}
          pointerOffset={pointerOffset}
          mixerState={mixerState}
          isMobile={isMobile}
          reducedMotion={reducedMotion}
          onSelectPoint={(id: SoundLayerId) => soundscapeController.activatePoint(id)}
          onHoverPoint={(id: SoundLayerId | null) => {
            if (!mixerState.isPlaying) {
              soundscapeController.setSpotlight(id);
            }
          }}
          onDismissSpotlight={() => soundscapeController.setSpotlight(null)}
          onTriggerWaterRipple={(xNorm, yNorm) => {
            waterRef.current?.spawnRipple(xNorm, yNorm, 0.9);
          }}
        />

        {/* Scene 1 Opening Wordmark & Stillness Prompt */}
        {reveal.wordmarkOpacity > 0.02 && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10"
            style={{ opacity: reveal.wordmarkOpacity }}
          >
            <div className="font-serif text-4xl sm:text-6xl lg:text-7xl tracking-[0.28em] font-medium text-[#EEEBDD]/80 select-none">
              ECOSONIC
            </div>
            <div className="mt-4 h-px w-16 bg-[#788B68]/45" />
          </div>
        )}

        {reveal.stillnessPromptOpacity > 0.02 && (
          <div
            className="pointer-events-none absolute bottom-10 inset-x-0 flex flex-col items-center text-center px-6 z-10"
            style={{ opacity: reveal.stillnessPromptOpacity }}
          >
            <p className="font-mono text-xs tracking-[0.24em] text-[#D5D9C6]">
              LISTEN DEEPER.
            </p>
            <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#A5AC9C]">
              Something is alive beneath the silence.
            </p>
            <ArrowDown className="mt-4 w-4 h-4 text-[#788B68]/80 animate-bounce" aria-hidden="true" />
          </div>
        )}

        {/* Scene 2: Falling Botanical Leaf */}
        {reveal.leaf.visible && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 z-20 will-change-transform"
            style={{
              opacity: reveal.leaf.opacity,
              transform: `translate3d(calc(-50% + ${reveal.leaf.xPercent}vw), ${reveal.leaf.yPercent}vh, 0) perspective(600px) rotateX(${reveal.leaf.tiltXDeg}deg) rotate(${reveal.leaf.rotateDeg}deg) scale(${reveal.leaf.scale})`,
            }}
          >
            <BotanicalLeaf className="w-20 h-24 sm:w-28 sm:h-32" />
          </div>
        )}

        {/* Scene 3: Water Contact Editorial Statement */}
        {reveal.contactCopyOpacity > 0.02 && (
          <div
            className="pointer-events-none absolute inset-x-0 top-[24%] sm:top-[26%] px-6 text-center z-20"
            style={{ opacity: reveal.contactCopyOpacity }}
          >
            <p className="font-serif text-2xl sm:text-4xl lg:text-5xl font-medium tracking-wide text-[#EEEBDD] max-w-3xl mx-auto drop-shadow">
              ONE MOMENT CAN REVEAL AN ENTIRE WORLD.
            </p>
            <p className="mt-3 text-xs font-mono tracking-wider text-[#D5D9C6]/75">
              Click the water surface to stir additional ripples
            </p>
          </div>
        )}

        {/* Scene 4 & 5: Emergent Forest Headline, Soundscape Mixer & Observatory CTA */}
        {reveal.forestHeadlineOpacity > 0.02 && (
          <div
            className="pointer-events-none absolute inset-x-0 top-16 sm:top-20 px-4 sm:px-8 z-20"
            style={{ opacity: reveal.forestHeadlineOpacity }}
          >
            <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6">
              <div className="max-w-md sm:max-w-xl">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-[#D3A36C]">
                    LIVING ACOUSTIC ECOLOGY
                  </p>
                  <span className="md:hidden font-mono text-[10px] tracking-wider text-[#D5D9C6]/80">
                    {reveal.activeChapter.index} — {reveal.activeChapter.label}
                  </span>
                </div>
                <h1 className="mt-1 sm:mt-2 font-serif text-2xl sm:text-5xl lg:text-6xl font-semibold leading-[1.04] tracking-tight text-[#EEEBDD]">
                  AN ENTIRE WORLD IS SPEAKING.
                </h1>
                <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-base text-[#D5D9C6] leading-snug sm:leading-relaxed">
                  Every rustle, call, movement and vibration carries information about the
                  environment. EcoSonic turns ambient soundscapes into structured ecological
                  intelligence.
                </p>
              </div>

              {reveal.interactiveReady && (
                <div className="pointer-events-auto flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    to="/app/observatory"
                    className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-md bg-[#EEEBDD] text-[#101C17] text-xs sm:text-sm font-semibold tracking-[0.04em] hover:bg-[#D5D9C6] transition-colors whitespace-nowrap min-h-[38px] sm:min-h-[44px]"
                  >
                    <span>EXPLORE THE LIVING SOUNDSCAPE</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scene 5: Interactive Soundscape Mixer Console */}
        {reveal.interactiveReady && (
          <div className="absolute inset-x-0 bottom-3 sm:bottom-6 px-3 sm:px-8 z-30">
            <div className="max-w-[1320px] mx-auto">
              <SoundscapeMixer
                snapshot={mixerState}
                onTogglePlay={() => soundscapeController.togglePlay()}
                onToggleMute={() => soundscapeController.toggleMute()}
                onMasterVolumeChange={(v) => soundscapeController.setMasterVolume(v)}
                onToggleLayer={(id) =>
                  soundscapeController.setLayerEnabled(id, !mixerState.layers[id].enabled)
                }
                onLayerVolumeChange={(id, v) => soundscapeController.setLayerVolume(id, v)}
              />
            </div>
          </div>
        )}

        {/* Unobtrusive Chapter Progress Rail */}
        <nav
          aria-label="Immersive sequence chapters"
          className="hidden md:flex flex-col items-end gap-2.5 absolute right-6 top-1/2 -translate-y-1/2 z-30"
        >
          {IMMERSIVE_CHAPTERS.map((ch, idx) => {
            const active = reveal.chapterIndex === idx;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => scrollToChapter(ch.targetProgress)}
                aria-current={active ? 'step' : undefined}
                className={`group flex items-center gap-2.5 text-right font-mono text-[11px] tracking-wider transition-colors cursor-pointer py-1 ${
                  active ? 'text-[#EEEBDD]' : 'text-[#A5AC9C]/65 hover:text-[#D5D9C6]'
                }`}
              >
                <span>
                  {ch.index} — {ch.label}
                </span>
                <span
                  className={`h-px transition-all duration-200 ${
                    active ? 'w-6 bg-[#D3A36C]' : 'w-2.5 bg-[#A5AC9C]/40 group-hover:w-4'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Compact Mobile / Reduced-Motion Chapter Selector */}
        {(reducedMotion || reveal.forestHeadlineOpacity <= 0.25) && (
          <div
            aria-label="Chapter quick navigation"
            className={`${
              reducedMotion ? 'flex' : 'flex md:hidden'
            } items-center ${
              reveal.forestHeadlineOpacity > 0.25 ? 'justify-end' : 'justify-between'
            } gap-2 absolute top-16 right-4 sm:right-8 left-4 sm:left-8 z-30 pointer-events-none`}
          >
            {reveal.forestHeadlineOpacity <= 0.25 && (
              <span className="pointer-events-auto font-mono text-[11px] tracking-wider text-[#D5D9C6] bg-[#101C17]/80 px-2.5 py-1 rounded border border-[#D5D9C6]/15">
                {reveal.activeChapter.index} — {reveal.activeChapter.label}
              </span>
            )}

            {reducedMotion && (
              <div className="pointer-events-auto flex flex-wrap gap-1.5">
                {IMMERSIVE_CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => scrollToChapter(ch.targetProgress)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer ${
                      reveal.chapterIndex === idx
                        ? 'bg-[#788B68] text-[#101C17] border-[#788B68] font-semibold'
                        : 'bg-[#101C17]/85 text-[#D5D9C6] border-[#D5D9C6]/20'
                    }`}
                  >
                    {ch.index}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
