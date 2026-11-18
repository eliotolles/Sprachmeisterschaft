import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVideoTime, clampSeekTime, stepVolume, resolveVideoShortcut } from '../src/lib/yt-controls.js';

test('formatVideoTime: m:ss, có giờ thì h:mm:ss', () => {
  assert.equal(formatVideoTime(0), '0:00');
  assert.equal(formatVideoTime(5), '0:05');
  assert.equal(formatVideoTime(65), '1:05');
  assert.equal(formatVideoTime(599), '9:59');
  assert.equal(formatVideoTime(3600), '1:00:00');
  assert.equal(formatVideoTime(3661), '1:01:01');
  assert.equal(formatVideoTime(NaN), '0:00');
  assert.equal(formatVideoTime(-3), '0:00');
});

test('clampSeekTime: tua kẹp trong [0, duration]', () => {
  assert.equal(clampSeekTime(44, -5, 1169), 39);
  assert.equal(clampSeekTime(44, 5, 1169), 49);
  assert.equal(clampSeekTime(2, -5, 1169), 0);
  assert.equal(clampSeekTime(1168, 10, 1169), 1169);
  assert.equal(clampSeekTime(44, -10, 1169), 34);
});

test('stepVolume: bước 5, kẹp 0-100', () => {
  assert.equal(stepVolume(50, 5), 55);
  assert.equal(stepVolume(98, 5), 100);
  assert.equal(stepVolume(2, -5), 0);
  assert.equal(stepVolume(0, -5), 0);
});

test('resolveVideoShortcut: đủ phím tắt YouTube, không cướp phím khi đang gõ', () => {
  assert.equal(resolveVideoShortcut(' ', 'div', false), 'toggle-play');
  assert.equal(resolveVideoShortcut('k', 'div', false), 'toggle-play');
  assert.equal(resolveVideoShortcut('K', 'div', false), 'toggle-play');
  assert.equal(resolveVideoShortcut('ArrowLeft', 'div', false), 'seek-back-5');
  assert.equal(resolveVideoShortcut('ArrowRight', 'div', false), 'seek-forward-5');
  assert.equal(resolveVideoShortcut('j', 'div', false), 'seek-back-10');
  assert.equal(resolveVideoShortcut('l', 'div', false), 'seek-forward-10');
  assert.equal(resolveVideoShortcut('f', 'div', false), 'toggle-fullscreen');
  assert.equal(resolveVideoShortcut('m', 'div', false), 'toggle-mute');
  assert.equal(resolveVideoShortcut('ArrowUp', 'div', false), 'volume-up');
  assert.equal(resolveVideoShortcut('ArrowDown', 'div', false), 'volume-down');
  assert.equal(resolveVideoShortcut('a', 'div', false), null);
  // Đang gõ trong ô nhập / textarea / vùng sửa được thì không cướp phím.
  assert.equal(resolveVideoShortcut(' ', 'input', false), null);
  assert.equal(resolveVideoShortcut('k', 'textarea', false), null);
  assert.equal(resolveVideoShortcut('ArrowLeft', 'select', false), null);
  assert.equal(resolveVideoShortcut(' ', 'div', true), null);
});
