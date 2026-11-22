import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import {
  SOUNDSCAPE_LAYERS,
  type SoundLayerId,
  type SoundscapeMixerSnapshot,
} from '../../audio/soundscapeEngine';

interface SoundscapeMixerProps {
  snapshot: SoundscapeMixerSnapshot;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onMasterVolumeChange: (val: number) => void;
  onToggleLayer: (id: SoundLayerId) => void;
  onLayerVolumeChange: (id: SoundLayerId, val: number) => void;
}

const LAYER_ORDER: SoundLayerId[] = ['birds', 'wind', 'water', 'insects'];

export function SoundscapeMixer({
  snapshot,
  onTogglePlay,
  onToggleMute,
  onMasterVolumeChange,
  onToggleLayer,
  onLayerVolumeChange,
}: SoundscapeMixerProps) {
  return (
    <section
      aria-label="Interactive Soundscape Mixer"
      className="w-full rounded-lg border border-[#D5D9C6]/22 bg-[#101C17]/92 backdrop-blur-md px-3 py-2.5 sm:px-5 sm:py-3.5 text-[#EEEBDD]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4">
        {/* Master Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={snapshot.isPlaying ? 'Pause soundscape audio' : 'Play soundscape audio'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md bg-[#788B68] text-[#101C17] text-xs font-semibold hover:bg-[#899D78] transition-colors whitespace-nowrap cursor-pointer min-h-[36px] sm:min-h-[38px]"
            >
              {snapshot.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Listen to Forest</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={snapshot.isMuted ? 'Unmute all audio' : 'Mute all audio'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer min-h-[36px] sm:min-h-[38px] ${
                snapshot.isMuted
                  ? 'border-[#D3A36C]/50 bg-[#D3A36C]/10 text-[#D3A36C]'
                  : 'border-[#D5D9C6]/25 bg-[#18271F] text-[#EEEBDD]'
              }`}
            >
              {snapshot.isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#788B68]" />
                  <span>Sound On</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 pl-1">
            <label htmlFor="master-volume" className="text-[11px] font-mono text-[#A5AC9C]">
              Master
            </label>
            <input
              id="master-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={snapshot.masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              className="w-16 sm:w-20 accent-[#788B68] cursor-pointer"
            />
          </div>
        </div>

        {/* Independent Layer Channels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1">
          {LAYER_ORDER.map((id) => {
            const meta = SOUNDSCAPE_LAYERS[id];
            const layer = snapshot.layers[id];
            return (
              <div
                key={id}
                className="flex flex-col gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md bg-[#18271F]/80 border border-[#D5D9C6]/12"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleLayer(id)}
                    aria-pressed={layer.enabled}
                    className={`text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                      layer.enabled ? 'text-[#EEEBDD]' : 'text-[#A5AC9C]'
                    }`}
                  >
                    {meta.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLayer(id)}
                    aria-label={`${layer.enabled ? 'Disable' : 'Enable'} ${meta.label} layer`}
                    className={`text-[10px] font-mono cursor-pointer ${
                      layer.enabled ? 'text-[#788B68]' : 'text-[#A5AC9C]/60'
                    }`}
                  >
                    {layer.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input
                  type="range"
                  aria-label={`${meta.label} layer volume`}
                  min={0}
                  max={1}
                  step={0.05}
                  value={layer.volume}
                  disabled={!layer.enabled}
                  onChange={(e) => onLayerVolumeChange(id, Number(e.target.value))}
                  className="w-full accent-[#788B68] disabled:opacity-35 cursor-pointer h-3"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 pt-1.5 border-t border-[#D5D9C6]/10 flex items-center justify-between gap-2 text-[10px] text-[#A5AC9C]">
        <span className="truncate">
          Demonstration Soundscape · Audio begins muted until activated
        </span>
        <span className="hidden sm:inline font-mono shrink-0">CC0 Procedural Web Audio Synthesis</span>
      </div>
    </section>
  );
}
