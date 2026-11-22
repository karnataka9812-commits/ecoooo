import type { ReactNode } from 'react';
import { clamp01, smoothstep, type CameraTransformState } from '../../lib/cinematicTimeline';

interface WorldTransitionProps {
  camera: CameraTransformState;
  progress: number;
  children: ReactNode;
}

/**
 * Non-WebGL graceful fallback camera rig (CSS 3D perspective roll + inversion darkness veil).
 * Activated only when WebGL is unavailable on the host device.
 */
export function WorldTransition({ camera, progress, children }: WorldTransitionProps) {
  const darkWaterOpacity = clamp01(1 - smoothstep(0.64, 0.9, progress));
  const fallbackScale = 1 + (2.38 - camera.cameraZ) * 0.45;

  return (
    <>
      {darkWaterOpacity > 0.005 && (
        <div
          className="absolute inset-0 bg-[#050605] overflow-hidden"
          style={{
            opacity: darkWaterOpacity,
            perspective: '1100px',
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 flex items-center justify-center bg-[#050605] will-change-transform"
            style={{
              width: 'max(100vw, calc(100vh * 16 / 9))',
              aspectRatio: '16 / 9',
              transform: `translate3d(-50%, -50%, 0) scale(${fallbackScale}) rotateX(${camera.pitchDeg}deg) rotateZ(${camera.rollDeg}deg)`,
              transformOrigin: '50% 52%',
            }}
          >
            {children}
          </div>
        </div>
      )}

      {camera.darknessVeilOpacity > 0.005 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#040504] z-20"
          style={{ opacity: camera.darknessVeilOpacity }}
        />
      )}
    </>
  );
}
