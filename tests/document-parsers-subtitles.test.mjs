import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeSubtitles, normalizeSubtitleText } from '../src/lib/subtitle-parser.js';

test('SRT subtitles parse into timed German cues', () => {
  const cues = parseYouTubeSubtitles(`1
00:00:05,000 --> 00:00:09,000
Guten Morgen, Benjamin!

2
00:00:10,500 --> 00:00:14,000
Wie geht es dir heute? | Hôm nay bạn thế nào?
`);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 5);
  assert.equal(cues[0].end, 9);
  assert.equal(cues[0].de, 'Guten Morgen, Benjamin!');
  assert.equal(cues[0].vi, '');
  assert.equal(cues[1].de, 'Wie geht es dir heute?');
  assert.equal(cues[1].vi, 'Hôm nay bạn thế nào?');
});

test('VTT headers, NOTE blocks and MM:SS timestamps are normalized before parsing', () => {
  const raw = `WEBVTT

NOTE This is a comment block
that should be skipped

00:05.000 --> 00:09.000
Hallo zusammen!
`;
  const cues = parseYouTubeSubtitles(normalizeSubtitleText(raw));
  assert.equal(cues.length, 1);
  assert.equal(cues[0].start, 5);
  assert.equal(cues[0].end, 9);
  assert.equal(cues[0].de, 'Hallo zusammen!');
});

test('empty or whitespace-only subtitle text parses to no cues', () => {
  assert.deepEqual(parseYouTubeSubtitles(''), []);
  assert.deepEqual(parseYouTubeSubtitles('   \n  '), []);
});
