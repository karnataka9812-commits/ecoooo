import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

const STILL_WATER_IMG = '/src/assets/images/still_forest_water_1795328638142.jpg';

export interface RippleImpulse {
  xNorm: number;
  yNorm: number;
  bornAt: number;
  maxRadius: number;
  strength: number;
}

export interface WaterRippleHandle {
  spawnRipple: (xNorm: number, yNorm: number, strength?: number) => void;
}

interface WaterRippleCanvasProps {
  waterOpacity: number;
  scrollRippleProgress: number;
  isActiveInViewport: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
  onWaterClick?: (xNorm: number, yNorm: number) => void;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

export const WaterRippleCanvas = forwardRef<WaterRippleHandle, WaterRippleCanvasProps>(
  function WaterRippleCanvas(
    {
      waterOpacity,
      scrollRippleProgress,
      isActiveInViewport,
      reducedMotion,
      isMobile,
      onWaterClick,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const imgLoadedRef = useRef(false);
    const userRipplesRef = useRef<RippleImpulse[]>([]);
    const propsRef = useRef({
      waterOpacity,
      scrollRippleProgress,
      isActiveInViewport,
      reducedMotion,
      isMobile,
    });
    propsRef.current = {
      waterOpacity,
      scrollRippleProgress,
      isActiveInViewport,
      reducedMotion,
      isMobile,
    };

    useImperativeHandle(ref, () => ({
      spawnRipple(xNorm: number, yNorm: number, strength = 1) {
        userRipplesRef.current.push({
          xNorm,
          yNorm,
          bornAt: performance.now(),
          maxRadius: isMobile ? 160 : 280,
          strength,
        });
        if (userRipplesRef.current.length > 10) {
          userRipplesRef.current.shift();
        }
      },
    }), [isMobile]);

    // Preload still forest water image once
    useEffect(() => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        imgRef.current = img;
        imgLoadedRef.current = true;
      };
      img.src = STILL_WATER_IMG;
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const particleCount = propsRef.current.isMobile ? 12 : 26;
      const motes: DustMote[] = Array.from({ length: particleCount }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00025,
        vy: -0.00018 - Math.random() * 0.00025,
        r: 0.7 + Math.random() * 1.4,
        alpha: 0.08 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
      }));

      let animId = 0;

      const render = (now: number) => {
        const {
          waterOpacity: wOp,
          scrollRippleProgress: rProg,
          isActiveInViewport: active,
          reducedMotion: reduced,
        } = propsRef.current;

        if (!active && animId !== 0) {
          animId = window.requestAnimationFrame(render);
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          if (!reduced) animId = window.requestAnimationFrame(render);
          return;
        }

        const tw = Math.floor(rect.width * dpr);
        const th = Math.floor(rect.height * dpr);
        if (canvas.width !== tw || canvas.height !== th) {
          canvas.width = tw;
          canvas.height = th;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Dark glassy forest water surface layer
        if (wOp > 0.01) {
          ctx.save();
          ctx.globalAlpha = wOp;
          if (imgLoadedRef.current && imgRef.current) {
            const img = imgRef.current;
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            const dx = (w - dw) / 2;
            const dy = (h - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
          } else {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#0D1713');
            grad.addColorStop(0.58, '#13211A');
            grad.addColorStop(1, '#09110D');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }

          // Restrained vignette scrim for editorial legibility
          const vig = ctx.createRadialGradient(w * 0.5, h * 0.64, w * 0.1, w * 0.5, h * 0.5, w * 0.85);
          vig.addColorStop(0, 'rgba(16, 28, 23, 0.12)');
          vig.addColorStop(1, 'rgba(10, 18, 15, 0.72)');
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }

        // 2. Scroll-driven primary water impact ripple (perspectival ellipse at y=64%)
        const impactX = w * 0.5;
        const impactY = h * 0.64;

        if (rProg > 0.005 && rProg < 0.99) {
          drawWavePacket(ctx, impactX, impactY, rProg, Math.max(w, h) * 0.65, 1.0);
        }

        // 3. Interactive click-spawned water ripples
        const remaining: RippleImpulse[] = [];
        for (const imp of userRipplesRef.current) {
          const age = (now - imp.bornAt) / 2600;
          if (age < 1) {
            drawWavePacket(ctx, imp.xNorm * w, imp.yNorm * h, age, imp.maxRadius, imp.strength);
            remaining.push(imp);
          }
        }
        userRipplesRef.current = remaining;

        // 4. Restrained atmospheric pollen / mist motes
        for (const m of motes) {
          if (!reduced) {
            m.x += m.vx + Math.sin(now * 0.0005 + m.phase) * 0.00015;
            m.y += m.vy;
            if (m.y < -0.02) m.y = 1.02;
            if (m.x < -0.02) m.x = 1.02;
            if (m.x > 1.02) m.x = -0.02;
          }
          const shimmer = 0.7 + 0.3 * Math.sin(now * 0.0012 + m.phase);
          ctx.fillStyle = `rgba(213, 217, 198, ${(m.alpha * shimmer).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (!reduced) {
          animId = window.requestAnimationFrame(render);
        }
      };

      render(performance.now());
      if (!propsRef.current.reducedMotion) {
        animId = window.requestAnimationFrame(render);
      }

      return () => {
        if (animId) window.cancelAnimationFrame(animId);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        data-testid="water-ripple-canvas"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const xNorm = (e.clientX - rect.left) / rect.width;
          const yNorm = (e.clientY - rect.top) / rect.height;
          userRipplesRef.current.push({
            xNorm,
            yNorm,
            bornAt: performance.now(),
            maxRadius: isMobile ? 160 : 280,
            strength: 0.9,
          });
          onWaterClick?.(xNorm, yNorm);
        }}
        className="absolute inset-0 w-full h-full cursor-pointer"
        aria-label="Interactive forest water surface; click to generate acoustic water ripples"
      />
    );
  }
);

/**
 * Renders multi-crest concentric water waves with realistic perspective foreshortening
 * (ellipse aspect ~0.42), copper-lichen specular rim refraction, and trailing wave dispersion.
 */
function drawWavePacket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  maxRx: number,
  strength: number
) {
  const aspectY = 0.42;
  const crests = [
    { offset: 0, width: 2.2, alpha: 0.65, color: '213, 217, 198' },
    { offset: -0.09, width: 1.6, alpha: 0.45, color: '211, 163, 108' },
    { offset: -0.19, width: 1.2, alpha: 0.34, color: '120, 139, 104' },
    { offset: -0.31, width: 0.9, alpha: 0.22, color: '213, 217, 198' },
  ];

  // Subtle refractive specular highlight pool at impact center
  if (progress < 0.45) {
    const centerAlpha = (1 - progress / 0.45) * 0.22 * strength;
    const rad = Math.max(8, progress * maxRx * 0.35);
    const pool = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    pool.addColorStop(0, `rgba(211, 163, 108, ${centerAlpha.toFixed(3)})`);
    pool.addColorStop(0.55, `rgba(120, 139, 104, ${(centerAlpha * 0.5).toFixed(3)})`);
    pool.addColorStop(1, 'rgba(16, 28, 23, 0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, aspectY);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = pool;
    ctx.fill();
    ctx.restore();
  }

  for (const crest of crests) {
    const p = progress + crest.offset;
    if (p <= 0 || p >= 1) continue;

    // Ease-out expansion radius
    const eased = 1 - Math.pow(1 - p, 1.8);
    const rx = Math.max(4, eased * maxRx);
    const ry = rx * aspectY;

    const fade = Math.sin(p * Math.PI) * (1 - p * 0.35) * strength;
    const alpha = Math.max(0, crest.alpha * fade);
    if (alpha < 0.01) continue;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${crest.color}, ${alpha.toFixed(3)})`;
    ctx.lineWidth = crest.width * (1 - p * 0.4);
    ctx.stroke();

    // Inner dark trough refraction shadow immediately behind leading crest
    if (rx > 10) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx - 3, Math.max(2, (rx - 3) * aspectY), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(10, 18, 15, ${(alpha * 0.55).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }
}
