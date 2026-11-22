import { useEffect, useRef } from 'react';
import type { LightState } from '../../lib/cinematicTimeline';

const LEAF_WATER_IMG = '/src/assets/images/leaf_dark_water_1795329475477.jpg';

interface RipplePacket {
  x: number;
  y: number;
  startTime: number;
}

interface ReliefField {
  width: number;
  height: number;
  r: Uint8ClampedArray;
  g: Uint8ClampedArray;
  b: Uint8ClampedArray;
  nx: Float32Array;
  ny: Float32Array;
  wet: Float32Array;
  isWater: Float32Array;
}

interface DarkWaterSceneProps {
  light: LightState;
  pointerOffset: { x: number; y: number };
  isInViewport: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  onWaterRipple?: () => void;
}

export function DarkWaterScene({
  light,
  pointerOffset,
  isInViewport,
  isMobile,
  reducedMotion,
  onWaterRipple,
}: DarkWaterSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fieldRef = useRef<ReliefField | null>(null);
  const ripplesRef = useRef<RipplePacket[]>([]);
  const lightRef = useRef(light);
  const pointerRef = useRef(pointerOffset);
  const dirtyRef = useRef(true);
  const imageBufferRef = useRef<ImageData | null>(null);

  lightRef.current = light;
  pointerRef.current = pointerOffset;

  // Mark canvas dirty whenever timeline light or pointer moves
  useEffect(() => {
    dirtyRef.current = true;
  }, [
    light.xNorm,
    light.yNorm,
    light.intensity,
    light.radiusNorm,
    light.waterMotion,
    pointerOffset.x,
    pointerOffset.y,
  ]);

  // Precompute photographic relief normals & moisture map once on mount
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = LEAF_WATER_IMG;

    img.onload = () => {
      if (cancelled) return;
      const w = isMobile ? 512 : 800;
      const h = isMobile ? 288 : 450;

      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;

      octx.drawImage(img, 0, 0, w, h);
      const src = octx.getImageData(0, 0, w, h).data;
      const len = w * h;

      const r = new Uint8ClampedArray(len);
      const g = new Uint8ClampedArray(len);
      const b = new Uint8ClampedArray(len);
      const lum = new Float32Array(len);
      const nx = new Float32Array(len);
      const ny = new Float32Array(len);
      const wet = new Float32Array(len);
      const isWater = new Float32Array(len);

      for (let i = 0; i < len; i++) {
        const idx = i * 4;
        const rr = src[idx];
        const gg = src[idx + 1];
        const bb = src[idx + 2];
        r[i] = rr;
        g[i] = gg;
        b[i] = bb;
        const l = 0.299 * rr + 0.587 * gg + 0.114 * bb;
        lum[i] = l;
        // Water in the photograph is dark neutral obsidian (low luminance & low warmth)
        const warmth = Math.abs(rr - bb) + Math.max(0, gg - bb);
        const waterMask = l < 24 && warmth < 14 ? 1 : Math.max(0, Math.min(1, (28 - l) / 14));
        isWater[i] = waterMask;
      }

      // Central-difference surface relief gradients for physical raking light & dew speculars
      for (let y = 1; y < h - 1; y++) {
        const row = y * w;
        for (let x = 1; x < w - 1; x++) {
          const i = row + x;
          const dx = (lum[i + 1] - lum[i - 1]) * 0.045;
          const dy = (lum[i + w] - lum[i - w]) * 0.045;
          const invLen = 1 / Math.sqrt(dx * dx + dy * dy + 1);
          nx[i] = -dx * invLen;
          ny[i] = -dy * invLen;

          // Local high-frequency bright specks correspond to micro moisture beads & leaf veins
          const avgNeighbor =
            (lum[i - 1] + lum[i + 1] + lum[i - w] + lum[i + w]) * 0.25;
          const localPeak = Math.max(0, lum[i] - avgNeighbor);
          wet[i] = Math.min(1, localPeak * 0.12 + (lum[i] > 85 ? 0.35 : 0));
        }
      }

      fieldRef.current = { width: w, height: h, r, g, b, nx, ny, wet, isWater };
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          imageBufferRef.current = ctx.createImageData(w, h);
        }
      }
      dirtyRef.current = true;
    };

    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  // Demand-driven + subtle ambient-sway render loop (pauses completely when offscreen)
  useEffect(() => {
    if (!isInViewport) return;
    let rafId = 0;
    let lastDraw = 0;

    const renderFrame = (now: number) => {
      rafId = window.requestAnimationFrame(renderFrame);

      const hasRipples = ripplesRef.current.length > 0;
      const hasWaterMotion = lightRef.current.waterMotion > 0.02;
      const idleBreathInterval = reducedMotion ? 999999 : hasRipples || hasWaterMotion ? 22 : 42;

      if (!dirtyRef.current && now - lastDraw < idleBreathInterval) {
        return;
      }
      if (reducedMotion && !dirtyRef.current && !hasRipples) {
        return;
      }

      const field = fieldRef.current;
      const canvas = canvasRef.current;
      if (!field || !canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!imageBufferRef.current || imageBufferRef.current.width !== field.width) {
        imageBufferRef.current = ctx.createImageData(field.width, field.height);
      }
      const imgData = imageBufferRef.current;
      const out = imgData.data;

      const { width: w, height: h, r, g, b, nx, ny, wet, isWater } = field;
      const lState = lightRef.current;
      const ptr = pointerRef.current;

      // Smooth breathing moonlight drift + pointer angle
      const tSec = now * 0.001;
      const swayX = reducedMotion ? 0 : Math.sin(tSec * 0.38) * 0.028;
      const swayY = reducedMotion ? 0 : Math.cos(tSec * 0.27) * 0.018;
      const lx = lState.xNorm + swayX + ptr.x * 0.045;
      const ly = lState.yNorm + swayY + ptr.y * 0.032;

      // Anisotropic beam parameters (rotated slightly at -24 deg like natural moonlight shaft)
      const cosA = 0.9135;
      const sinA = -0.4067;
      const invSigX2 = 1 / Math.max(0.004, lState.radiusNorm * lState.radiusNorm * 1.45);
      const invSigY2 = 1 / Math.max(0.003, lState.radiusNorm * lState.radiusNorm * 0.62);

      // Prune expired ripples
      ripplesRef.current = ripplesRef.current.filter((rp) => now - rp.startTime < 3600);
      const activeRipples = ripplesRef.current;
      const waterWake = lState.waterMotion;

      const ambientFloor = 0.045;
      const beamStrength = lState.intensity;

      for (let y = 0; y < h; y++) {
        const py = y / h;
        const dy = py - ly;
        const row = y * w;

        // Subtle horizontal vignette so edges blend into #050605 seamlessly
        const edgeY = Math.min(1, Math.min(py / 0.14, (1 - py) / 0.14));

        for (let x = 0; x < w; x++) {
          const i = row + x;
          const px = x / w;
          const dx = px - lx;

          // Rotated anisotropic beam distance
          const rx = dx * cosA - dy * sinA;
          const ry = dx * sinA + dy * cosA;
          const dist2 = rx * rx * invSigX2 + ry * ry * invSigY2;

          // Edge dissolve into pitch-black room
          const edgeX = Math.min(1, Math.min(px / 0.12, (1 - px) / 0.12));
          const vignette = edgeX * edgeY;

          const beam = Math.exp(-dist2) * beamStrength;

          // Physical directional light vector pointing from beam focus toward pixel
          const lvx = -dx * 2.4;
          const lvy = -dy * 2.4;
          const lvz = 0.65;
          const lvInv = 1 / Math.sqrt(lvx * lvx + lvy * lvy + lvz * lvz);
          const dirX = lvx * lvInv;
          const dirY = lvy * lvInv;
          const dirZ = lvz * lvInv;

          const nxx = nx[i];
          const nyy = ny[i];
          const nzz = 0.85;

          const ndotl = Math.max(0, nxx * dirX + nyy * dirY + nzz * dirZ);
          // Half-vector approximation for wet moisture glints
          const hx = dirX * 0.5;
          const hy = dirY * 0.5;
          const hz = (dirZ + 1) * 0.5;
          const hInv = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz);
          const ndoth = Math.max(0, (nxx * hx + nyy * hy + nzz * hz) * hInv);
          const specPow = Math.pow(ndoth, 24) * wet[i] * beam * 0.95;

          // Physical water wave refraction / caustic shimmer
          let waterBoost = 0;
          let sampleOffset = 0;
          const waterWeight = isWater[i];

          if (waterWeight > 0.05 && (waterWake > 0.01 || activeRipples.length > 0)) {
            let waveSlope = 0;
            if (waterWake > 0.01 && !reducedMotion) {
              waveSlope +=
                Math.sin(px * 38 + tSec * 1.45 + Math.cos(py * 24 - tSec * 0.9)) *
                0.35 *
                waterWake;
            }
            for (let k = 0; k < activeRipples.length; k++) {
              const rp = activeRipples[k];
              const age = (now - rp.startTime) * 0.001;
              const rdx = (px - rp.x) * 1.777;
              const rdy = py - rp.y;
              const dist = Math.sqrt(rdx * rdx + rdy * rdy);
              const front = age * 0.24;
              const band = dist - front;
              if (Math.abs(band) < 0.07) {
                const env = Math.exp(-(band * band) / 0.00085) * Math.exp(-age * 0.85);
                waveSlope += Math.sin(band * 155) * env * 1.3;
              }
            }
            waterBoost = Math.max(0, waveSlope) * (0.35 + beam * 1.65) * 18 * waterWeight;
            const shiftX = Math.round(waveSlope * 2.2 * waterWeight);
            const sx = Math.min(w - 1, Math.max(0, x + shiftX));
            sampleOffset = row + sx - i;
          }

          const srcIdx = i + sampleOffset;
          const lit =
            (ambientFloor + beam * (0.45 + ndotl * 1.18)) * vignette;

          const rr = r[srcIdx] * lit + specPow * 212 + waterBoost * 0.72;
          const gg = g[srcIdx] * lit + specPow * 214 + waterBoost * 0.84;
          const bb = b[srcIdx] * lit + specPow * 206 + waterBoost * 0.88;

          const outIdx = i * 4;
          // Deep neutral dark floor #050605
          out[outIdx] = rr < 5 ? 5 : rr > 255 ? 255 : rr;
          out[outIdx + 1] = gg < 6 ? 6 : gg > 255 ? 255 : gg;
          out[outIdx + 2] = bb < 5 ? 5 : bb > 255 ? 255 : bb;
          out[outIdx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      dirtyRef.current = false;
      lastDraw = now;
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [isInViewport, reducedMotion]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width;
    const yNorm = (e.clientY - rect.top) / rect.height;
    ripplesRef.current.push({ x: xNorm, y: yNorm, startTime: performance.now() });
    dirtyRef.current = true;
    onWaterRipple?.();
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      aria-label="Dark still water with resting alder leaf illuminated by moving light; click water to stir a subtle physical ripple"
      className="w-full h-full object-cover object-center block cursor-pointer"
    />
  );
}
