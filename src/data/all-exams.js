import { EXAMS_CORE } from './exams';
import { EXAMS_LEVELS } from './exams-levels';
import { db } from '@/lib/db';

export function getAllExams() {
  let dbExams = [];
  try {
    const raw = db.universal.findMany({ type: 'exam' });
    dbExams = raw.map((item) => ({
      id: item.id,
      title: item.title,
      provider: item.data?.provider || 'telc',
      level: item.level || 'B1',
      minutes: Number(item.data?.minutes) || 90,
      reading: item.data?.reading || [],
      listening: item.data?.listening || [],
      writing: item.data?.writing || { task: '', hints: [] },
      speaking: item.data?.speaking || { part: 'Sprechen', prompt: '' },
      isImported: true,
    }));
  } catch (e) {}

  const deletedIds = db.exams?.getDeletedIds?.() || [];
  const overrides = db.exams?.getOverrides?.() || {};

  const combined = [...dbExams, ...EXAMS_CORE, ...EXAMS_LEVELS]
    .filter((e) => !deletedIds.includes(e.id))
    .map((e) => {
      if (overrides[e.id]) {
        return { ...e, ...overrides[e.id] };
      }
      return e;
    });

  return combined;
}

export const ALL_EXAMS = [...EXAMS_CORE, ...EXAMS_LEVELS];

export function getExamById(id) {
  const all = getAllExams();
  return all.find((e) => e.id === id) || all[0];
}

export function examsByLevel(levelId) {
  return getAllExams().filter((e) => e.level === levelId);
}

export function examsByProvider(provider) {
  return getAllExams().filter((e) => e.provider.toLowerCase() === provider.toLowerCase());
}
