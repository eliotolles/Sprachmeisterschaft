import test from 'node:test';import assert from 'node:assert/strict';
import {clampSubtitleDrag} from '../src/lib/subtitle-drag.js';
const frame = { left: 0, top: 0, right: 800, bottom: 450 };
const box = { left: 200, top: 380, right: 600, bottom: 420 };
test('subtitle drag follows the mouse inside the video frame',()=>{
  assert.deepEqual(clampSubtitleDrag(10, -20, box, frame, { x: 0, y: 0 }), { x: 10, y: -20 });
  assert.deepEqual(clampSubtitleDrag(-30, 15, box, frame, { x: 40, y: -10 }), { x: 10, y: 5 });
});
test('subtitle drag is clamped so the box never leaves the frame',()=>{
  // Kéo quá trái/phải/trên/dưới đều dừng ở mép khung.
  assert.deepEqual(clampSubtitleDrag(-500, 0, box, frame, { x: 0, y: 0 }), { x: -200, y: 0 });
  assert.deepEqual(clampSubtitleDrag(500, 0, box, frame, { x: 0, y: 0 }), { x: 200, y: 0 });
  assert.deepEqual(clampSubtitleDrag(0, -500, box, frame, { x: 0, y: 0 }), { x: 0, y: -380 });
  assert.deepEqual(clampSubtitleDrag(0, 500, box, frame, { x: 0, y: 0 }), { x: 0, y: 30 });
});
test('subtitle drag does not move when the box is wider than the frame',()=>{
  const wide = { left: -50, top: 380, right: 850, bottom: 420 };
  assert.deepEqual(clampSubtitleDrag(100, 0, wide, frame, { x: 0, y: 0 }), { x: 0, y: 0 });
});
