// Extracted business rules from Elio grammar.js and GrammarMindmap.model/sections/group.
// Source: cloudflare-return bd5179107363ebcc19764454b08d7c94acd1a289.
// No Elio markup, styles, navigation, event handlers or DOM are copied here.
export function normalizeGrammarAnswer(value) {
  return String(value).trim().toLocaleLowerCase('de').normalize('NFC').replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
}
export function visibleExercises(lesson) {
  return (Array.isArray(lesson?.exercises) ? lesson.exercises : [])
    .map((exercise, index) => ({ ...exercise, id: exercise.id || `${lesson.id}:exercise:${index}` }))
    .filter(exercise => exercise.origin !== 'ai' && exercise.answerSource !== 'ai');
}
export function gradeGrammarExercise(exercise, answer) {
  if (typeof answer !== 'string' || !answer.trim() || answer.length > 10000) throw new TypeError('Invalid grammar answer');
  const acceptedAnswers = Array.isArray(exercise.answers) ? exercise.answers : typeof exercise.answer === 'string' ? [exercise.answer] : [];
  if (!acceptedAnswers.length || acceptedAnswers.some(a => typeof a !== 'string' || !a.trim())) throw new TypeError('Verified answer key required');
  return { correct: acceptedAnswers.some(a => normalizeGrammarAnswer(a) === normalizeGrammarAnswer(answer)),
    acceptedAnswers: [...acceptedAnswers], explanation: exercise.explanation || '' };
}
export function validateGrammarCollection(collection) {
  if (!collection || typeof collection !== 'object' || Array.isArray(collection) || typeof collection.id !== 'string' ||
      !collection.id || collection.id.length > 128 || !Array.isArray(collection.items) || !collection.items.length || collection.items.length > 500) throw new TypeError('Invalid grammar collection');
  const ids = new Set(); let total = 0;
  for (const lesson of collection.items) {
    if (!lesson || typeof lesson.id !== 'string' || !lesson.id || lesson.id.length > 128 || ids.has(lesson.id) ||
        typeof lesson.title !== 'string' || !lesson.title.trim() || lesson.title.length > 500 ||
        !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lesson.level) ||
        typeof lesson.content !== 'string' || !lesson.content.trim() || lesson.content.length > 250000 ||
        !Array.isArray(lesson.exercises)) throw new TypeError('Invalid or duplicate grammar lesson');
    ids.add(lesson.id); const exercises = new Set();
    for (const exercise of visibleExercises(lesson)) {
      total++;
      const answers = Array.isArray(exercise.answers) ? exercise.answers : typeof exercise.answer === 'string' ? [exercise.answer] : [];
      if (typeof exercise.id !== 'string' || exercise.id.length > 256 || exercises.has(exercise.id) ||
          !['fill', 'quiz', 'build'].includes(exercise.type) || typeof exercise.question !== 'string' || !exercise.question.trim() || exercise.question.length > 10000 ||
          !answers.length || answers.length > 100 || answers.some(a => typeof a !== 'string' || !a.trim() || a.length > 10000) ||
          (exercise.type === 'quiz' && (!Array.isArray(exercise.options) || !exercise.options.length || exercise.options.some(a => typeof a !== 'string') || !answers.every(a => exercise.options.includes(a)))) ||
          (exercise.type === 'build' && (!Array.isArray(exercise.tokens) || !exercise.tokens.length || exercise.tokens.some(a => typeof a !== 'string')))) throw new TypeError('Invalid grammar exercise or answer key');
      exercises.add(exercise.id);
    }
  }
  if (total > 10000) throw new TypeError('Too many grammar exercises');
  return collection;
}
export function grammarSections(text) {
  const out = []; let title = '', lines = [];
  const flush = () => { const body = lines.join('\n').trim(); if (body) out.push({ title, body }); lines = []; };
  for (const line of String(text || '').split('\n')) {
    const heading = line.match(/^\s*#{1,6}\s+(.+?)\s*$/) || line.match(/^\s*\*\*(.+?)\*\*\s*$/) ||
      line.match(/^\s*((?:🔹|🎯) .{1,160}|(?:Ví dụ|Lưu ý|Ghi nhớ|Beispiele|Examples))\s*:?\s*$/i);
    if (heading) { flush(); title = heading[1].replace(/\*\*/g, ''); } else lines.push(line);
  }
  flush(); return out;
}
export function grammarSectionGroup(title) {
  if (/ví dụ|beispiel|example/i.test(title)) return 2;
  if (/lỗi|sai|chú ý|lưu ý|ghi nhớ|fehler|achtung|merkhilfe|mistake|remember/i.test(title)) return 3;
  if (/quy tắc|công thức|cấu trúc|vị trí|trật tự|bildung|struktur|wortstellung|satzbau|formel|structure|word order|bảng|tabelle/i.test(title)) return 1;
  if (/cách nhận biết|cách dùng|khi nào|ý nghĩa|verwendung|gebrauch|bedeutung|usage|meaning/i.test(title)) return 0;
  return 4;
}
export function grammarMindmap(lesson) {
  const groups = Array.from({ length: 5 }, () => []);
  for (const section of grammarSections(lesson.content)) groups[grammarSectionGroup(section.title)].push(section);
  return { title: lesson.title, level: lesson.level, groups, derivedFromSourceOnly: true };
}
