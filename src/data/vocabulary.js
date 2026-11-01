import { VOCABULARY_A1 } from './vocabulary-a1';
import { VOCABULARY_A2 } from './vocabulary-a2';
import { VOCABULARY_B1 } from './vocabulary-b1';
import { VOCABULARY_ADVANCED } from './vocabulary-advanced';
import { TOPICS, STARTER_TOPICS } from './vocabulary-topics';

export { TOPICS, STARTER_TOPICS };

/**
 * Deduplicate word list by article + german
 */
export function mergeWords(...lists) {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const key = `${(item.article || '').trim()} ${(item.german || '').trim()}`.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
  }
  return result;
}

export const WORDS = mergeWords(
  VOCABULARY_A1,
  VOCABULARY_A2,
  VOCABULARY_B1,
  VOCABULARY_ADVANCED
);

export function wordsByTopic(topicId) {
  return WORDS.filter((w) => w.topic === topicId);
}

export function wordsByLevel(levelId) {
  return WORDS.filter((w) => w.level === levelId);
}
