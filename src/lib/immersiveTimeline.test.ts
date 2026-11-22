import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLeafPose,
  computeSceneRevealState,
  getChapterForProgress,
  IMMERSIVE_CHAPTERS,
} from './immersiveTimeline';

test('getChapterForProgress maps boundaries cleanly across all 5 chapters', () => {
  assert.equal(getChapterForProgress(0).chapter.id, 'stillness');
  assert.equal(getChapterForProgress(0.25).chapter.id, 'first-contact');
  assert.equal(getChapterForProgress(0.45).chapter.id, 'ripple');
  assert.equal(getChapterForProgress(0.68).chapter.id, 'forest');
  assert.equal(getChapterForProgress(0.95).chapter.id, 'soundscape');
  assert.equal(IMMERSIVE_CHAPTERS.length, 5);
});

test('computeLeafPose descends naturally, settles at p=0.40, and reverses cleanly', () => {
  const pre = computeLeafPose(0.05);
  assert.equal(pre.visible, false);
  assert.equal(pre.settledOnWater, false);

  const mid = computeLeafPose(0.26);
  assert.equal(mid.visible, true);
  assert.equal(mid.settledOnWater, false);
  assert.ok(mid.yPercent > 0 && mid.yPercent < 64);

  const impact = computeLeafPose(0.4);
  assert.equal(impact.settledOnWater, true);
  assert.ok(Math.abs(impact.yPercent - 64) < 0.01);

  // Reversing back to 0.26 yields the exact same pose
  const reversedMid = computeLeafPose(0.26);
  assert.deepEqual(reversedMid, mid);
});

test('computeSceneRevealState sequences stillness -> ripple -> layered forest -> soundscape', () => {
  const start = computeSceneRevealState(0);
  assert.equal(start.wordmarkOpacity, 1);
  assert.equal(start.rippleProgress, 0);
  assert.equal(start.interactiveReady, false);

  const ripple = computeSceneRevealState(0.48);
  assert.ok(ripple.rippleProgress > 0);
  assert.ok(ripple.contactCopyOpacity > 0.5);
  assert.ok(ripple.forestAperturePct > 0);

  const emerging = computeSceneRevealState(0.68);
  assert.ok(emerging.distantCanopyOpacity > emerging.foregroundFloraOpacity);

  const final = computeSceneRevealState(0.92);
  assert.equal(final.interactiveReady, true);
  assert.ok(final.sunlightRaysOpacity > 0.9);
  assert.ok(final.forestHeadlineOpacity > 0.9);
});
