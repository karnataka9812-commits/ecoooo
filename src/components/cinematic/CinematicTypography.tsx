import { Link } from 'react-router-dom';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import type { TypographyState } from '../../lib/cinematicTimeline';

interface CinematicTypographyProps {
  typography: TypographyState;
  soundPlaying: boolean;
  soundMuted: boolean;
  onToggleSound: () => void;
}

/**
 * Restrained editorial identity integrated into the natural scene:
 * - Silent first frame: only whisper-faint ECOSONIC watermark
 * - Emerged world (85-100%): gradual arrival of ECOSONIC -> Listen deeper. -> quiet description & CTA
 */
export function CinematicTypography({
  typography,
  soundPlaying,
  soundMuted,
  onToggleSound,
}: CinematicTypographyProps) {
  const isListening = soundPlaying && !soundMuted;

  return (
    <>
      {/* Initial whisper-quiet wordmark during dark opening stillness */}
      {typography.quietMarkOpacity > 0.01 && (
        <div
          className="pointer-events-none absolute top-9 inset-x-0 flex justify-center z-30"
          style={{ opacity: typography.quietMarkOpacity }}
        >
          <span className="font-serif text-[11px] sm:text-xs font-normal tracking-[0.44em] text-[#D8D6CC] select-none">
            ECOSONIC
          </span>
        </div>
      )}

      {/* Staggered editorial identity after the new forest world has emerged */}
      {typography.brandOpacity > 0.01 && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-end">
          {/* Natural ground shadow scrim only behind lower-left text (zero glass cards or boxes) */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#060907]/88 via-[#070C09]/38 to-transparent"
            style={{ opacity: typography.brandOpacity }}
          />

          <div className="relative w-full max-w-[1320px] mx-auto px-6 sm:px-10 pb-10 sm:pb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-lg">
              <div
                style={{
                  opacity: typography.brandOpacity,
                  transform: `translate3d(0, ${(1 - typography.brandOpacity) * 10}px, 0)`,
                }}
                className="font-serif text-xs sm:text-[13px] font-normal tracking-[0.38em] text-[#D5D9C6]/90 transition-transform duration-300 ease-out"
              >
                ECOSONIC
              </div>

              <h1
                style={{
                  opacity: typography.taglineOpacity,
                  transform: `translate3d(0, ${(1 - typography.taglineOpacity) * 14}px, 0)`,
                }}
                className="mt-2.5 font-serif font-normal text-4xl sm:text-6xl leading-[1.03] tracking-[-0.01em] text-[#F1EFE6] transition-transform duration-300 ease-out"
              >
                Listen deeper.
              </h1>

              <p
                style={{
                  opacity: typography.descriptionOpacity,
                  transform: `translate3d(0, ${(1 - typography.descriptionOpacity) * 12}px, 0)`,
                }}
                className="mt-3.5 text-sm sm:text-[15px] text-[#D5D9C6]/90 leading-relaxed max-w-md transition-transform duration-300 ease-out"
              >
                Continuous bioacoustic observation across living landscapes—translating natural
                sound into structured ecological clarity.
              </p>
            </div>

            {typography.ctaOpacity > 0.02 && (
              <div
                style={{
                  opacity: typography.ctaOpacity,
                  transform: `translate3d(0, ${(1 - typography.ctaOpacity) * 10}px, 0)`,
                }}
                className="pointer-events-auto flex flex-wrap items-center gap-5 shrink-0 transition-transform duration-300 ease-out"
              >
                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-pressed={isListening}
                  aria-label={
                    isListening
                      ? 'Ambient Sound · On, click to mute forest soundscape'
                      : 'Ambient Sound · Off, click to enable forest soundscape'
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#D5D9C6] hover:text-[#F1EFE6] transition-colors cursor-pointer py-2 border-b border-[#D5D9C6]/30 hover:border-[#F1EFE6]"
                >
                  {isListening ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#D3A36C]" />
                      <span>Ambient Sound · On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#A5AC9C]" />
                      <span>Ambient Sound · Off</span>
                    </>
                  )}
                </button>

                <Link
                  to="/app/observatory"
                  className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-sm bg-[#EEEBDD] text-[#101C17] text-xs font-semibold tracking-[0.06em] uppercase hover:bg-[#D5D9C6] transition-colors whitespace-nowrap min-h-[42px]"
                >
                  <span>Enter Observatory</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
