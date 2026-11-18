import test from 'node:test';
import assert from 'node:assert/strict';
import { groupListeningLibrary } from '../src/lib/listening-groups.js';
import { cleanListeningCues } from '../src/lib/listening-cues.js';

const video = (recordId, itemId, youtubeId) => ({
  recordId,
  itemId,
  youtubeId,
  title: 'Video ' + youtubeId,
  collectionTitle: 'Bộ nghe',
  scope: 'private',
  owner: 'user-1',
  level: 'B1',
  subtitles: [],
});

test('duplicate source video IDs are skipped, the rest of the library still loads', () => {
  const videos = [
    video('rec-a', 'vid-1', '4-eDoThe6qo'),
    video('rec-a', 'vid-1', '4-eDoThe6qo'),
    video('rec-b', undefined, 'dQw4w9WgXcQ'),
  ];
  let result;
  assert.doesNotThrow(() => { result = groupListeningLibrary(videos, []); });
  assert.equal(result.episodes.length, 2);
  assert.deepEqual(
    result.episodes.map((e) => e.youtubeId).sort(),
    ['4-eDoThe6qo', 'dQw4w9WgXcQ']
  );
});

test('cleanListeningCues keeps valid cues, drops invalid ones, sorts by start', () => {
  const cues = cleanListeningCues([
    { start: 10, end: 12, de: 'Zweiter Satz', vi: 'Câu hai' },
    { start: 5, end: 9, de: 'Erster Satz', vi: '' },
    { start: 20, end: 18, de: 'Ende vor Start', vi: '' },
    { start: 30, end: 32, de: '   ', vi: '' },
    { start: 40, end: 42, de: 'x'.repeat(1501), vi: '' },
    { start: 50, end: 55, text: 'Text statt de', vi: 'Nghĩa' },
  ]);
  assert.equal(cues.length, 3);
  assert.equal(cues[0].text, 'Erster Satz');
  assert.equal(cues[1].text, 'Zweiter Satz');
  assert.equal(cues[1].vi, 'Câu hai');
  assert.equal(cues[2].text, 'Text statt de');
});

test('cleanListeningCues returns empty for no valid cues', () => {
  assert.deepEqual(cleanListeningCues([]), []);
  assert.deepEqual(cleanListeningCues([{ start: 0, end: 0, de: 'a' }]), []);
  assert.deepEqual(cleanListeningCues(null), []);
});
