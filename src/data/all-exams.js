import { EXAMS_CORE } from './exams';
import { EXAMS_LEVELS } from './exams-levels';

export const ALL_EXAMS = [...EXAMS_CORE, ...EXAMS_LEVELS];

export function getExamById(id) {
  return ALL_EXAMS.find((e) => e.id === id) || ALL_EXAMS[0];
}

export function examsByLevel(levelId) {
  return ALL_EXAMS.filter((e) => e.level === levelId);
}

export function examsByProvider(provider) {
  return ALL_EXAMS.filter((e) => e.provider.toLowerCase() === provider.toLowerCase());
}
