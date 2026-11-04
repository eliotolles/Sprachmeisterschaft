import { vocabTargetFor } from '@/data/levels';

/**
 * Format Date as YYYY-MM-DD in local time
 */
export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a YYYY-MM-DD date string
 */
export function addDays(dateStr, days) {
  const [y, m, d] = (dateStr || formatDate()).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Calculate difference in days between two YYYY-MM-DD date strings
 */
export function daysBetween(dateStrA, dateStrB) {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * SRS Algorithm (SM-2 variant based on days)
 * Grades:
 * 0: Quên (Again)
 * 1: Khó (Hard)
 * 2: Được (Good)
 * 3: Dễ (Easy)
 */
export function computeSrs(card, grade) {
  const today = formatDate();
  let ease = card.ease_factor ?? 2.5;
  let interval = card.interval_days ?? 0;
  let reps = card.repetitions ?? 0;
  let lapses = card.lapses ?? 0;

  if (grade === 0) {
    // Quên
    lapses += 1;
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    // Grade 1..3 correspond to q = 3, 4, 5 in SM-2
    const q = grade === 1 ? 3 : grade === 2 ? 4 : 5;
    ease = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }

    if (grade === 1) {
      interval = Math.max(1, Math.round(interval * 0.6));
    }

    reps += 1;
  }

  // Determine status
  let status = "review";
  if (interval >= 21) {
    status = "mastered";
  } else if (reps === 0) {
    status = "learning";
  }

  // Next due date
  const dueDate = addDays(today, interval);

  return {
    ease_factor: Number(ease.toFixed(2)),
    interval_days: interval,
    repetitions: reps,
    lapses,
    status,
    due_date: dueDate,
    last_reviewed: today,
  };
}

/**
 * Calculate Exam Readiness Score (0..100)
 */
export function computeReadiness(cards = [], skillSessions = [], examResults = [], targetLevel = "B1") {
  const target = vocabTargetFor(targetLevel);

  // 1. Vocab readiness
  let learned = 0;
  let mastered = 0;
  for (const c of cards) {
    if ((c.repetitions || 0) > 0) learned++;
    if ((c.interval_days || 0) >= 21) mastered++;
  }
  const vocabScore = Math.min(100, Math.round(((learned * 0.65 + mastered * 0.35) / target) * 100));

  // 2. Skills readiness
  const skillNames = ["listening", "speaking", "reading", "writing", "pronunciation", "grammar", "interview"];
  const recentBySkill = {};

  // Sort sessions newest first
  const sortedSessions = [...skillSessions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  for (const s of sortedSessions) {
    if (s.skill && recentBySkill[s.skill] === undefined) {
      recentBySkill[s.skill] = Number(s.score) || 0;
    }
  }

  let practicedCount = 0;
  let skillScoreSum = 0;
  let weakestSkill = null;
  let lowestScore = 999;

  for (const name of skillNames) {
    if (recentBySkill[name] !== undefined) {
      practicedCount++;
      skillScoreSum += recentBySkill[name];
      if (recentBySkill[name] < lowestScore) {
        lowestScore = recentBySkill[name];
        weakestSkill = name;
      }
    }
  }

  const practicedRatio = practicedCount / 7;
  const avgSkill = practicedCount > 0 ? skillScoreSum / practicedCount : 0;
  const skillsScore = Math.min(100, Math.round(avgSkill * (0.55 + 0.45 * practicedRatio)));

  // 3. Exam readiness: average of up to 3 recent exams
  const sortedExams = [...examResults].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentExams = sortedExams.slice(0, 3);
  let examScore = 0;
  if (recentExams.length > 0) {
    const sum = recentExams.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    examScore = Math.min(100, Math.round(sum / recentExams.length));
  }

  // Total readiness
  const total = Math.min(100, Math.round(vocabScore * 0.3 + skillsScore * 0.4 + examScore * 0.3));

  return {
    total,
    vocab: {
      score: vocabScore,
      learned,
      mastered,
      target,
    },
    skills: {
      score: skillsScore,
      practicedCount,
      totalSkills: 7,
      weakestSkill: weakestSkill || (practicedCount === 0 ? "listening" : null),
    },
    exams: {
      score: examScore,
      takenCount: examResults.length,
      recentCount: recentExams.length,
    },
  };
}

/**
 * Calculate consecutive streak days from StudyLog records
 */
export function calculateStreak(studyLogs = []) {
  if (!studyLogs || studyLogs.length === 0) return 0;

  // Filter logs that had active learning
  const activeDates = new Set(
    studyLogs
      .filter((l) => (l.cards_reviewed || 0) > 0 || (l.xp || 0) > 0 || (l.minutes || 0) > 0)
      .map((l) => l.date)
  );

  if (activeDates.size === 0) return 0;

  const today = formatDate();
  const yesterday = addDays(today, -1);

  // Check if active today or yesterday
  let checkDate = activeDates.has(today) ? today : (activeDates.has(yesterday) ? yesterday : null);
  if (!checkDate) return 0;

  let streak = 0;
  while (activeDates.has(checkDate)) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return streak;
}

/**
 * Speech Recognition Text Normalization
 */
export function normalizeGermanText(text = "") {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'„“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Speech match similarity percentage (0..100)
 */
export function speechMatchScore(expected, actual) {
  const normExp = normalizeGermanText(expected);
  const normAct = normalizeGermanText(actual);

  if (!normExp && !normAct) return 100;
  if (!normExp || !normAct) return 0;
  if (normExp === normAct) return 100;

  const dist = levenshteinDistance(normExp, normAct);
  const maxLen = Math.max(normExp.length, normAct.length);
  const ratio = Math.max(0, (maxLen - dist) / maxLen);

  return Math.round(ratio * 100);
}

/**
 * Text-to-Speech using Web Speech API (de-DE)
 */
export function speakGerman(text, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("SpeechSynthesis not supported.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate; // Slightly slower, clear learner rate

  const voices = window.speechSynthesis.getVoices();
  const deVoice = voices.find(
    (v) => (v.lang === "de-DE" || v.lang.startsWith("de")) && (v.name.includes("Google") || v.name.includes("Anna") || v.name.includes("Markus") || v.name.includes("Hedda"))
  ) || voices.find((v) => v.lang.startsWith("de"));

  if (deVoice) {
    utterance.voice = deVoice;
  }

  window.speechSynthesis.speak(utterance);
}
