import assert from 'node:assert/strict';
import test from 'node:test';
import { computeCinematicTimeline, getPhaseForProgress } from './cinematicTimeline.ts';

test('getPhaseForProgress maps all five cinematic phases monotonically', () => {
  assert.equal(getPhaseForProgress(0.0), 'stillness');
  assert.equal(getPhaseForProgress(0.19), 'stillness');
  assert.equal(getPhaseForProgress(0.25), 'illumination');
  assert.equal(getPhaseForProgress(0.48), 'destabilize');
  assert.equal(getPhaseForProgress(0.72), 'inversion');
  assert.equal(getPhaseForProgress(0.92), 'emergence');
});

test('first frame holds camera wide above dark lake with leaf aloft and restrained typography', () => {
  const start = computeCinematicTimeline(0);
  assert.equal(start.camera.rollDeg, 0);
  assert.equal(start.world.portalProgress, 0);
  assert.equal(start.leaf.heightNorm, 1);
  assert.ok(start.leaf.y > 0.25, 'leaf starts elevated above the dark lake');
  assert.equal(start.leaf.impactRippleProgress, 0);
  assert.equal(start.typography.brandOpacity, 0);
  assert.equal(start.typography.taglineOpacity, 0);
  assert.equal(start.typography.ctaOpacity, 0);
  assert.equal(start.typography.navbarVisible, false);
  assert.ok(start.typography.quietMarkOpacity <= 0.35);
  assert.ok(start.light.intensity > 0.15 && start.light.intensity < 0.45);
});

test('leaf descends onto lake without camera zoom-in, then triggers ripple and slow smooth transition', () => {
  const start = computeCinematicTimeline(0);
  const midFall = computeCinematicTimeline(0.22);
  const touchdown = computeCinematicTimeline(0.45);
  const midTransition = computeCinematicTimeline(0.72);

  // Camera does not zoom into the leaf while falling
  assert.equal(midFall.camera.cameraZ, start.camera.cameraZ);
  assert.ok(midFall.leaf.y < start.leaf.y, 'leaf descends downward toward water');
  assert.ok(midFall.leaf.z < start.leaf.z, 'leaf moves toward water plane rather than camera');
  assert.ok(midFall.leaf.scale <= start.leaf.scale, 'leaf does not zoom larger during fall');
  assert.equal(midFall.world.portalProgress, 0);

  // Touchdown settles leaf flat and initiates concentric lake ripple before forest transition
  assert.equal(touchdown.leaf.heightNorm, 0);
  assert.ok(touchdown.leaf.impactRippleProgress > 0);
  assert.ok(touchdown.leaf.impactRippleStrength > 0.4);
  assert.equal(touchdown.world.portalProgress, 0);

  // Transition opens slowly and smoothly without sudden 180-deg camera flip or ghosted leaf overlay
  assert.ok(midTransition.world.portalProgress > 0.35 && midTransition.world.portalProgress < 0.65);
  assert.equal(midTransition.leaf.opacity, 0);
  assert.ok(Math.abs(midTransition.camera.rollDeg) < 3);
});

test('emerged world completes slow portal transition and staggered typography at 85-100%, reversing cleanly', () => {
  const end = computeCinematicTimeline(1.0);
  assert.equal(end.world.portalProgress, 1);
  assert.equal(end.world.hazeOpacity, 1);
  assert.equal(end.world.particlesOpacity, 1);
  assert.equal(end.typography.brandOpacity, 1);
  assert.equal(end.typography.taglineOpacity, 1);
  assert.equal(end.typography.ctaOpacity, 1);
  assert.equal(end.typography.navbarVisible, true);

  const reversed = computeCinematicTimeline(0);
  assert.equal(reversed.leaf.heightNorm, 1);
  assert.equal(reversed.camera.rollDeg, 0);
  assert.equal(reversed.world.portalProgress, 0);
  assert.equal(reversed.typography.navbarVisible, false);
});
