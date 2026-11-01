export const LEVELS = [
  {
    id: "A1",
    label: "A1 — Khởi đầu",
    de: "Anfänger",
    desc: "Hiểu và dùng các câu quen thuộc hàng ngày, chào hỏi, giới thiệu bản thân.",
    vocabTarget: 60,
    cefr: "Breakthrough / Beginner",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
  },
  {
    id: "A2",
    label: "A2 — Cơ bản",
    de: "Grundlegende Kenntnisse",
    desc: "Giao tiếp trong các tình huống đơn giản về gia đình, mua sắm, công việc gần gũi.",
    vocabTarget: 90,
    cefr: "Waystage / Elementary",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
  },
  {
    id: "B1",
    label: "B1 — Trung cấp",
    de: "Fortgeschrittene Sprachverwendung",
    desc: "Tự chủ xử lý hầu hết tình huống du lịch, làm việc, bày tỏ ý kiến, thi quốc tịch/du học nghề.",
    vocabTarget: 120,
    cefr: "Threshold / Intermediate",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
  },
  {
    id: "B2",
    label: "B2 — Vững vàng",
    de: "Selbständige Sprachverwendung",
    desc: "Hiểu nội dung văn bản phức tạp, tranh luận lưu loát, làm việc chuyên môn tại Đức.",
    vocabTarget: 200,
    cefr: "Vantage / Upper Intermediate",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800",
  },
  {
    id: "C1",
    label: "C1 — Chuyên sâu",
    de: "Fachkundige Sprachkenntnisse",
    desc: "Sử dụng ngôn ngữ linh hoạt cho học thuật, nghiên cứu, đại học và công việc cấp cao.",
    vocabTarget: 300,
    cefr: "Effective Operational / Advanced",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800",
  },
  {
    id: "C2",
    label: "C2 — Điêu luyện",
    de: "Exzellente Kenntnisse",
    desc: "Hiểu dễ dàng mọi thứ nghe hoặc đọc, biểu đạt tự nhiên như người bản xứ.",
    vocabTarget: 400,
    cefr: "Mastery / Proficiency",
    badgeColor: "bg-stone-200 text-stone-900 border-stone-400 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700",
  },
];

export const LEVEL_IDS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[2]; // Mặc định B1
}

export function vocabTargetFor(levelId) {
  const lvl = levelById(levelId);
  return lvl ? lvl.vocabTarget : 120;
}
