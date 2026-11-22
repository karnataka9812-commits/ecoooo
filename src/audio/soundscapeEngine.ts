export type SoundLayerId = 'birds' | 'wind' | 'water' | 'insects';

export interface SoundLayerMeta {
  id: SoundLayerId;
  label: string;
  speciesOrSource: string;
  category: string;
  description: string;
  licenseNotice: string;
}

export const SOUNDSCAPE_LAYERS: Record<SoundLayerId, SoundLayerMeta> = {
  birds: {
    id: 'birds',
    label: 'Birds',
    speciesOrSource: 'Woodland Songbird Chorus (Illustrative Synthesis)',
    category: 'Biophony · Avian Vocalization',
    description:
      'High-canopy harmonic whistles and modulated dawn calls propagating between 2.2 kHz and 5.4 kHz.',
    licenseNotice:
      'Original procedural Web Audio synthesis authored for EcoSonic 3.0 (CC0 1.0 Universal Public Domain).',
  },
  wind: {
    id: 'wind',
    label: 'Wind',
    speciesOrSource: 'Evergreen Canopy Breeze',
    category: 'Geophony · Atmospheric Turbulence',
    description:
      'Slowly swelling bandpass-filtered air movement brushing through Sitka spruce and cedar needles.',
    licenseNotice:
      'Original procedural Web Audio synthesis authored for EcoSonic 3.0 (CC0 1.0 Universal Public Domain).',
  },
  water: {
    id: 'water',
    label: 'Water',
    speciesOrSource: 'Forest Pond Margin & Brook',
    category: 'Geophony · Hydrological Flow',
    description:
      'Soft broadband stream shimmer and occasional water-drop resonance along mossy shoreline stones.',
    licenseNotice:
      'Original procedural Web Audio synthesis authored for EcoSonic 3.0 (CC0 1.0 Universal Public Domain).',
  },
  insects: {
    id: 'insects',
    label: 'Insects',
    speciesOrSource: 'Understory Fern Stridulation',
    category: 'Biophony · Orthoptera Envelope',
    description:
      'Subtle rhythmic high-frequency pulses nestled within the damp forest floor fern layer.',
    licenseNotice:
      'Original procedural Web Audio synthesis authored for EcoSonic 3.0 (CC0 1.0 Universal Public Domain).',
  },
};

export interface SoundscapeMixerSnapshot {
  isPlaying: boolean;
  isMuted: boolean;
  masterVolume: number;
  layers: Record<SoundLayerId, { enabled: boolean; volume: number }>;
  activeSpotlight: SoundLayerId | null;
}

type Listener = (snapshot: SoundscapeMixerSnapshot) => void;

/**
 * Centralized Web Audio API soundscape controller.
 * - Starts muted and never autoplays on page load.
 * - Creates/resumes AudioContext only upon explicit user interaction.
 * - Uses smooth exponential/linear gain ramps to avoid sudden clicks or cuts.
 * - Cleans up all oscillators, buffers, timers, and AudioContext on dispose().
 */
class SoundscapeAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private layerGains: Partial<Record<SoundLayerId, GainNode>> = {};
  private timers: number[] = [];
  private sourceNodes: AudioNode[] = [];
  private listeners = new Set<Listener>();

  private state: SoundscapeMixerSnapshot = {
    isPlaying: false,
    isMuted: true,
    masterVolume: 0.7,
    layers: {
      birds: { enabled: true, volume: 0.72 },
      wind: { enabled: true, volume: 0.55 },
      water: { enabled: true, volume: 0.6 },
      insects: { enabled: false, volume: 0.45 },
    },
    activeSpotlight: null,
  };

  public getSnapshot(): SoundscapeMixerSnapshot {
    return {
      ...this.state,
      layers: {
        birds: { ...this.state.layers.birds },
        wind: { ...this.state.layers.wind },
        water: { ...this.state.layers.water },
        insects: { ...this.state.layers.insects },
      },
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    for (const fn of this.listeners) {
      fn(snap);
    }
  }

  private ensureAudioGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      const ids: SoundLayerId[] = ['birds', 'wind', 'water', 'insects'];
      for (const id of ids) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.connect(this.masterGain);
        this.layerGains[id] = gain;
      }

      this.buildAmbientBed(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private buildAmbientBed(ctx: AudioContext) {
    // Shared procedural pink/brown noise buffer (4 seconds seamless loop)
    const length = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.08) * 0.35;
    }

    // 1. WIND LAYER: Low-mid sweeping bandpass noise modulated by slow LFO
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.4, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.11, ctx.currentTime);
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(190, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    windSrc.connect(windFilter);
    windFilter.connect(this.layerGains.wind!);
    windSrc.start();
    windLfo.start();
    this.sourceNodes.push(windSrc, windLfo);

    // 2. WATER LAYER: Gentle stream shimmer (higher bandpass + soft low body)
    const waterSrc = ctx.createBufferSource();
    waterSrc.buffer = noiseBuffer;
    waterSrc.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.setValueAtTime(1350, ctx.currentTime);
    waterFilter.Q.setValueAtTime(0.75, ctx.currentTime);

    waterSrc.connect(waterFilter);
    waterFilter.connect(this.layerGains.water!);
    waterSrc.start();
    this.sourceNodes.push(waterSrc);

    // 3. BIRDS LAYER: Scheduled melodic woodland phrases when playing & enabled
    const birdTimer = window.setInterval(() => {
      if (!this.ctx || !this.state.isPlaying || this.state.isMuted) return;
      if (!this.state.layers.birds.enabled) return;
      this.triggerBirdPhrase(this.ctx);
    }, 2400);
    this.timers.push(birdTimer);

    // 4. INSECTS LAYER: Subtle rhythmic high-frequency understory pulse
    const insectTimer = window.setInterval(() => {
      if (!this.ctx || !this.state.isPlaying || this.state.isMuted) return;
      if (!this.state.layers.insects.enabled) return;
      this.triggerInsectPulse(this.ctx);
    }, 1150);
    this.timers.push(insectTimer);
  }

  private triggerBirdPhrase(ctx: AudioContext) {
    const dest = this.layerGains.birds;
    if (!dest) return;
    const now = ctx.currentTime;
    const notes = [2480, 3120, 2790, 3520];
    const startNote = Math.floor(Math.random() * 2);

    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.14;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = notes[(startNote + i) % notes.length] + (Math.random() * 140 - 70);
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (i === 2 ? 1.18 : 0.92), t + 0.1);

      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.09, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(env);
      env.connect(dest);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  private triggerInsectPulse(ctx: AudioContext) {
    const dest = this.layerGains.insects;
    if (!dest) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.085;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(4850, t);

      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.035, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

      osc.connect(env);
      env.connect(dest);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  private syncGains() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const targetMaster =
      this.state.isPlaying && !this.state.isMuted
        ? Math.max(0.0001, this.state.masterVolume * 0.65)
        : 0.0001;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetMaster, now, 0.12);

    (Object.keys(this.state.layers) as SoundLayerId[]).forEach((id) => {
      const node = this.layerGains[id];
      if (!node) return;
      const layer = this.state.layers[id];
      const target = layer.enabled ? Math.max(0.0001, layer.volume * 0.5) : 0.0001;
      node.gain.cancelScheduledValues(now);
      node.gain.setTargetAtTime(target, now, 0.12);
    });
  }

  public togglePlay(): void {
    this.ensureAudioGraph();
    const nextPlaying = !this.state.isPlaying;
    this.state.isPlaying = nextPlaying;
    if (nextPlaying && this.state.isMuted) {
      this.state.isMuted = false;
    }
    this.syncGains();
    if (nextPlaying && this.ctx && this.state.layers.birds.enabled) {
      this.triggerBirdPhrase(this.ctx);
    }
    this.emit();
  }

  public setMuted(muted: boolean): void {
    if (!muted) {
      this.ensureAudioGraph();
    }
    this.state.isMuted = muted;
    this.syncGains();
    this.emit();
  }

  public toggleMute(): void {
    this.setMuted(!this.state.isMuted);
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.min(1, Math.max(0, volume));
    this.syncGains();
    this.emit();
  }

  public setLayerEnabled(id: SoundLayerId, enabled: boolean): void {
    this.state.layers[id].enabled = enabled;
    this.syncGains();
    this.emit();
  }

  public setLayerVolume(id: SoundLayerId, volume: number): void {
    this.state.layers[id].volume = Math.min(1, Math.max(0, volume));
    this.syncGains();
    this.emit();
  }

  /**
   * Explicit user interaction on a forest acoustic marker:
   * Highlights the marker, enables its layer, unmutes/starts audio, and triggers immediate feedback.
   */
  public activatePoint(id: SoundLayerId): void {
    const ctx = this.ensureAudioGraph();
    this.state.activeSpotlight = id;
    this.state.layers[id].enabled = true;
    this.state.isPlaying = true;
    this.state.isMuted = false;
    this.syncGains();

    if (ctx) {
      if (id === 'birds') this.triggerBirdPhrase(ctx);
      if (id === 'insects') this.triggerInsectPulse(ctx);
    }
    this.emit();
  }

  public setSpotlight(id: SoundLayerId | null): void {
    this.state.activeSpotlight = id;
    this.emit();
  }

  public stopAll(): void {
    this.state.isPlaying = false;
    this.state.isMuted = true;
    this.syncGains();
    this.emit();
  }

  public dispose(): void {
    this.stopAll();
    for (const timer of this.timers) {
      window.clearInterval(timer);
    }
    this.timers = [];
    for (const node of this.sourceNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already-stopped source nodes
      }
    }
    this.sourceNodes = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.layerGains = {};
  }
}

export const soundscapeController = new SoundscapeAudioController();
