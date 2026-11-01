// ====================================================================
// SPRACHMEISTERSCHAFT — STUDY ROADMAP & ONBOARDING GENERATOR
// Xây dựng lộ trình ôn thi cá nhân hóa chuẩn Khung tham chiếu Châu Âu (GER / CEFR)
// Tra cứu cấu trúc thi chính thức từ: Goethe-Institut, telc gGmbH, ÖSD, TestDaF
// ====================================================================

import { GRAMMAR_CORE } from '../data/grammar.js';
import { GRAMMAR_EXTRA } from '../data/grammar-extra.js';

export const OFFICIAL_EXAMS_META = {
  goethe: {
    id: 'goethe',
    name: 'Goethe-Zertifikat',
    fullName: 'Goethe-Zertifikat A1–C2',
    org: 'Goethe-Institut e.V. (München, Deutschland)',
    validLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skillsStructure: {
      Lesen: '4–5 phần (Teile): Đọc thư tín, tin tức báo chí, ghép nối thông điệp và quy định.',
      Hören: '4 phần (Teile): Thông báo ngắn nơi công cộng, hội thoại hàng ngày, bài phát thanh.',
      Schreiben: '1–2 bài: Thư cá nhân/trang trọng, bài viết bày tỏ quan điểm xã hội (Meinungsäußerung).',
      Sprechen: '3 phần: Giới thiệu bản thân/hỏi đáp, thuyết trình đề tài ngắn (Vortrag), thảo luận/lập kế hoạch chung.',
    },
    referenceSource: 'Goethe-Institut — Prüfungsordnung & Durchführungsbestimmungen (München).',
    description: 'Chứng chỉ chuẩn quốc tế của Viện Goethe, công nhận toàn cầu cho du học, định cư và hành nghề.',
  },
  telc: {
    id: 'telc',
    name: 'telc Deutsch',
    fullName: 'telc Deutsch / telc Beruf / telc DTZ',
    org: 'telc gGmbH — The European Language Certificates (Frankfurt am Main)',
    validLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skillsStructure: {
      Lesen: 'Teil 1–3: Đọc hiểu văn bản thực tế, email thông tin, ghép tiêu đề.',
      Sprachbausteine: 'Teil 1–2: Bài tập ngữ pháp và từ vựng điền từ khuyết (đặc trưng telc).',
      Hören: 'Teil 1–3: Nghe hiểu cuộc gọi, thông báo tin tức và phỏng vấn chuyên sâu.',
      Schreiben: 'Viết thư phản hồi thông tin hoặc khiếu nại (Beschwerdebrief / Halboffizieller Brief).',
      Sprechen: 'Teil 1–3: Giới thiệu, trao đổi chủ đề và giải quyết tình huống chung với bạn thi.',
    },
    referenceSource: 'telc gGmbH — Richtlinien & Übungstests für Europäische Sprachenzertifikate (Frankfurt).',
    description: 'Hệ thống chứng chỉ ngôn ngữ châu Âu phổ biến hàng đầu trong du học nghề, làm việc và quốc tịch Đức.',
  },
  oesd: {
    id: 'oesd',
    name: 'ÖSD',
    fullName: 'Österreichisches Sprachdiplom Deutsch',
    org: 'ÖSD-Zentrale (Wien, Österreich)',
    validLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skillsStructure: {
      Lesen: '3–4 bài đọc: Đọc thông tin thực tế, báo chí văn hóa Áo - Đức - Thụy Sĩ.',
      Hören: '2–3 bài nghe: Giọng chuẩn Hochdeutsch và biến thể phương ngữ vùng DACH.',
      Schreiben: '1–2 bài viết: Soạn văn bản cá nhân hoặc công việc, bài bình luận.',
      Sprechen: 'Đối thoại thực tế, miêu tả tranh ảnh và đóng vai tình huống xã hội.',
    },
    referenceSource: 'ÖSD Zentrale — Handbuch zur Prüfungsvorbereitung (Wien).',
    description: 'Bằng ngôn ngữ chính thức của Cộng hòa Áo, công nhận quốc tế cho hồ sơ visa, định cư và đại học.',
  },
  testdaf: {
    id: 'testdaf',
    name: 'TestDaF',
    fullName: 'Test Deutsch als Fremdsprache (TDN 3–5)',
    org: 'g.a.s.t. e.V. / TestDaF-Institut (Bochum, Deutschland)',
    validLevels: ['B2', 'C1'], // TestDaF chỉ áp dụng cho bậc học thuật B2-C1
    skillsStructure: {
      Lesen: '3 bài đọc học thuật: Đời sống sinh viên, tạp chí khoa học thường thức, bài nghiên cứu chuyên ngành.',
      Hören: '3 bài nghe: Đối thoại trong khuôn viên trường đại học, phỏng vấn chuyên gia, bài giảng học thuật.',
      Schreiben: 'Mô tả và phân tích biểu đồ thống kê, nêu lập luận và bảo vệ luận điểm cá nhân.',
      Sprechen: '7 nhiệm vụ ghi âm máy tính: Tham gia hội thảo, xin gia hạn nộp bài, thảo luận quan điểm.',
    },
    referenceSource: 'TestDaF-Institut / g.a.s.t. — TestDaF-Modellsatz & Leitfaden für Hochschulzugang (Bochum).',
    description: 'Kỳ thi học thuật chuyên biệt dành cho sinh viên quốc tế muốn theo học các trường đại học tại Đức.',
  },
  general: {
    id: 'general',
    name: 'Chưa chọn kỳ thi cụ thể',
    fullName: 'Tiếng Đức thực chiến & Giao tiếp đời sống DACH',
    org: 'Khung chuẩn ngôn ngữ chung Châu Âu (CEFR / GER)',
    validLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skillsStructure: {
      Toàn_diện: 'Cân bằng 4 kỹ năng nghe, nói, đọc, viết kết hợp phản xạ giao tiếp và vốn từ vựng đời sống.',
    },
    referenceSource: 'Council of Europe — Common European Framework of Reference for Languages (CEFR).',
    description: 'Lộ trình củng cố nền tảng vững chắc, linh hoạt chuyển tiếp sang bất kỳ kỳ thi chứng chỉ nào sau này.',
  },
};

/**
 * Lấy danh sách chủ điểm ngữ pháp phù hợp cấp độ (không bao giờ gán cứng Module 1)
 */
function getGrammarTopicsForLevel(level) {
  const allGrammar = [...GRAMMAR_CORE, ...GRAMMAR_EXTRA];
  const matched = allGrammar.filter((g) => g.level === level);
  if (matched.length > 0) return matched;
  return allGrammar.filter((g) => g.level === 'B1' || g.level === 'A2');
}

/**
 * Tạo lộ trình ôn thi khoa học dựa trên câu trả lời Onboarding
 */
export function generateStudyRoadmap({
  examKey = 'telc',
  currentLevel = 'A2',
  targetLevel = 'B1',
  examDate = null,
  timeFrame = '1_3_months', // '1_month' | '1_3_months' | '3_6_months' | 'specific_date' | 'undetermined'
  weakSkills = ['writing', 'speaking'],
  dailyMinutes = 45,
  daysPerWeek = 5,
}) {
  const examInfo = OFFICIAL_EXAMS_META[examKey] || OFFICIAL_EXAMS_META.telc;

  // 1. Tính toán số ngày và ngày kết thúc
  const today = new Date();
  let targetDate;
  let totalDays = 60;

  if (timeFrame === 'specific_date' && examDate) {
    targetDate = new Date(examDate);
    const diffTime = targetDate.getTime() - today.getTime();
    totalDays = Math.max(14, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  } else if (timeFrame === '1_month') {
    totalDays = 30;
    targetDate = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
  } else if (timeFrame === '1_3_months') {
    totalDays = 75;
    targetDate = new Date(today.getTime() + 75 * 24 * 3600 * 1000);
  } else if (timeFrame === '3_6_months') {
    totalDays = 120;
    targetDate = new Date(today.getTime() + 120 * 24 * 3600 * 1000);
  } else {
    totalDays = 60;
    targetDate = new Date(today.getTime() + 60 * 24 * 3600 * 1000);
  }

  // Tổng số giờ dự kiến
  const activeDaysCount = Math.round((totalDays / 7) * daysPerWeek);
  const totalEstimatedHours = Math.round((activeDaysCount * dailyMinutes) / 60);

  // 2. Chia thành 4 giai đoạn chiến lược (Phases)
  const p1Days = Math.max(3, Math.round(totalDays * 0.25));
  const p2Days = Math.max(4, Math.round(totalDays * 0.35));
  const p3Days = Math.max(3, Math.round(totalDays * 0.25));
  const p4Days = Math.max(2, totalDays - p1Days - p2Days - p3Days);

  const phases = [
    {
      index: 1,
      name: 'Giai đoạn 1: Xây nền Từ vựng & Ngữ pháp cốt lõi',
      deName: 'Fundament: Wortschatz & Kern-Grammatik',
      durationDays: p1Days,
      focus: 'Lấp đầy các lỗ hổng ngữ pháp trọng tâm theo cấp độ và nạp 200–300 từ vựng chủ điểm cốt lõi.',
      milestone: `Nắm vững cấu trúc câu, trật tự từ và phản xạ mạo từ der/die/das trình độ ${targetLevel}.`,
    },
    {
      index: 2,
      name: `Giai đoạn 2: Luyện kỹ năng chuyên sâu & Dạng bài ${examInfo.name}`,
      deName: 'Fertigkeiten-Training & Prüfungsformate',
      durationDays: p2Days,
      focus: `Tập trung chuyên biệt vào các kỹ năng người học cảm thấy khó nhất (${weakSkills.join(', ')}). Rèn kỹ năng làm từng Teil.`,
      milestone: `Thành thạo mẫu câu viết thư (Redemittel) và tự tin hoàn thành các phần thi nói/nghe trong thời gian chuẩn.`,
    },
    {
      index: 3,
      name: `Giai đoạn 3: Thực chiến Đề mô phỏng & Bấm giờ nghiêm ngặt`,
      deName: 'Modelltest-Simulation unter Zeitdruck',
      durationDays: p3Days,
      focus: `Giải trọn vẹn bộ đề thi mô phỏng ${examInfo.name} ${targetLevel}. Rèn tâm lý phòng thi và quản lý thời gian.`,
      milestone: `Đạt tối thiểu 60/100 điểm ở tất cả các đề thi thử nghiệm và quen thuộc với quy chế thi.`,
    },
    {
      index: 4,
      name: 'Giai đoạn 4: Tổng rà soát lỗi sai & Tối ưu Redemittel',
      deName: 'Fehleranalyse & Prüfungsvorbereitung',
      durationDays: p4Days,
      focus: 'Ôn lại toàn bộ ghi chú lỗi sai từ AI chấm bài, làm quen mẫu phiếu trả lời trắc nghiệm và giữ phong độ đỉnh cao.',
      milestone: 'Sẵn sàng 100% về kiến thức và tinh thần cho ngày bước vào phòng thi chính thức.',
    },
  ];

  // 3. Lấy chủ điểm ngữ pháp thực tế từ database
  const grammarTopics = getGrammarTopicsForLevel(targetLevel);
  let grammarIdx = 0;

  // 4. Sinh danh sách nhiệm vụ chi tiết theo ngày (Daily Tasks)
  const dailyTasks = [];
  let dayCounter = 1;

  for (let d = 0; d < totalDays; d++) {
    const curDate = new Date(today.getTime() + d * 24 * 3600 * 1000);
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 6 is Saturday

    // Nếu vượt quá số ngày học trong tuần thì xếp ngày nghỉ hoặc ôn nhẹ
    const isRestDay = (daysPerWeek < 7 && dayOfWeek === 0) || (daysPerWeek <= 5 && dayOfWeek === 6);

    let phaseIndex = 1;
    if (d >= p1Days + p2Days + p3Days) phaseIndex = 4;
    else if (d >= p1Days + p2Days) phaseIndex = 3;
    else if (d >= p1Days) phaseIndex = 2;

    const dateStr = curDate.toISOString().split('T')[0];

    if (isRestDay) {
      dailyTasks.push({
        id: `task_d${d + 1}_rest`,
        dayNumber: d + 1,
        date: dateStr,
        isRestDay: true,
        title: 'Nghỉ ngơi tái tạo năng lượng hoặc xem 1 video YouTube tiếng Đức nhẹ nhàng',
        skill: 'listening',
        durationMinutes: 15,
        targetPath: '/skills/listening',
        completed: false,
      });
      continue;
    }

    // Các tác vụ trong ngày học
    const currentGrammar = grammarTopics[grammarIdx % grammarTopics.length] || { title_vi: 'Chia động từ và trật tự câu' };
    grammarIdx++;

    // Tác vụ 1: Từ vựng hoặc Ngữ pháp
    const task1Duration = Math.round(dailyMinutes * 0.35);
    dailyTasks.push({
      id: `task_d${d + 1}_core`,
      dayNumber: d + 1,
      date: dateStr,
      phase: phaseIndex,
      title: phaseIndex === 1
        ? `Học ngữ pháp: "${currentGrammar.title_vi}" & ôn thẻ từ vựng`
        : `Ôn từ vựng chuyên sâu trình độ ${targetLevel} & kiểm tra phản xạ từ`,
      skill: phaseIndex === 1 ? 'grammar' : 'vocabulary',
      durationMinutes: task1Duration,
      targetPath: phaseIndex === 1 ? '/skills?skill=grammar' : '/review',
      completed: false,
      isKeyTask: true,
    });

    // Tác vụ 2: Kỹ năng trọng tâm (ưu tiên kỹ năng yếu)
    const task2Duration = dailyMinutes - task1Duration;
    let chosenSkill = 'reading';
    let task2Title = '';
    let targetPath = '/skills';

    if (phaseIndex === 1) {
      // Giai đoạn 1: Nghe hiểu & Đọc hiểu nền tảng
      if (weakSkills.includes('listening')) {
        chosenSkill = 'listening';
        task2Title = 'Nghe 1 đoạn hội thoại video & luyện chép chính tả (Diktat)';
        targetPath = '/skills/listening';
      } else {
        chosenSkill = 'reading';
        task2Title = `Đọc hiểu bài ngắn trình độ ${targetLevel} & tra cứu cấu trúc câu`;
        targetPath = '/skills?skill=reading';
      }
    } else if (phaseIndex === 2) {
      // Giai đoạn 2: Luyện sâu kỹ năng yếu và dạng bài thi
      if (weakSkills.includes('writing') && (d % 2 === 0)) {
        chosenSkill = 'writing';
        task2Title = `Viết thư/bài văn theo yêu cầu đề thi ${examInfo.name} & nhờ AI chấm chi tiết`;
        targetPath = '/skills?skill=writing';
      } else if (weakSkills.includes('speaking')) {
        chosenSkill = 'speaking';
        task2Title = `Luyện nói phản xạ Redemittel với AI Tutor chuẩn bị cho phần Sprechen`;
        targetPath = '/skills?skill=speaking';
      } else if (weakSkills.includes('listening')) {
        chosenSkill = 'listening';
        task2Title = `Luyện nghe ngắt từng câu (Satz-für-Satz) & làm quen bẫy nghe`;
        targetPath = '/skills/listening';
      } else {
        chosenSkill = 'reading';
        task2Title = `Giải 1 bài đọc hiểu trắc nghiệm chuẩn cấu trúc ${examInfo.name}`;
        targetPath = '/skills?skill=reading';
      }
    } else if (phaseIndex === 3) {
      // Giai đoạn 3: Thực chiến Đề thi
      chosenSkill = 'exam';
      task2Title = `Làm 1 phần thi mô phỏng ${examInfo.name} ${targetLevel} (Lesen / Hören / Schreiben)`;
      targetPath = '/exams';
    } else {
      // Giai đoạn 4: Tổng rà soát lỗi
      chosenSkill = 'review';
      task2Title = 'Xem lại sổ tay lỗi sai ngữ pháp & từ vựng, củng cố sự tự tin';
      targetPath = '/readiness';
    }

    dailyTasks.push({
      id: `task_d${d + 1}_skill`,
      dayNumber: d + 1,
      date: dateStr,
      phase: phaseIndex,
      title: task2Title,
      skill: chosenSkill,
      durationMinutes: task2Duration,
      targetPath,
      completed: false,
      isKeyTask: false,
    });
  }

  return {
    meta: {
      examKey,
      examName: examInfo.name,
      org: examInfo.org,
      referenceSource: examInfo.referenceSource,
      currentLevel,
      targetLevel,
      timeFrame,
      totalDays,
      activeDaysCount,
      totalEstimatedHours,
      dailyMinutes,
      daysPerWeek,
      weakSkills,
      targetDate: targetDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      disclaimer: 'Lộ trình học tập mang tính đề xuất học thuật dựa trên dữ liệu khảo sát và cấu trúc thi chính thức. Hệ thống sẽ tự động cập nhật và thích ứng theo tiến độ thực tế của người học qua từng buổi học; không tự cam kết chắc chắn đỗ nếu không duy trì việc luyện tập nghiêm túc.',
    },
    phases,
    dailyTasks,
  };
}

/**
 * Điều chỉnh lịch khi bỏ lỡ buổi học (Reschedule)
 * Dồn các tác vụ chưa hoàn thành sang các ngày tiếp theo một cách khoa học
 */
export function rescheduleMissedTasks(roadmap) {
  if (!roadmap || !Array.isArray(roadmap.dailyTasks)) return roadmap;

  const todayStr = new Date().toISOString().split('T')[0];
  const copy = JSON.parse(JSON.stringify(roadmap));

  const missedTasks = copy.dailyTasks.filter(
    (t) => !t.completed && !t.isRestDay && t.date < todayStr
  );

  if (missedTasks.length === 0) return copy;

  // Lấy các ngày học tương lai
  const futureDays = copy.dailyTasks.filter((t) => t.date >= todayStr && !t.isRestDay);
  if (futureDays.length === 0) return copy;

  // Đổi ngày cho các tác vụ bỏ lỡ sang các ngày tới
  missedTasks.forEach((mTask, idx) => {
    const targetFuture = futureDays[idx % futureDays.length];
    if (targetFuture) {
      mTask.date = targetFuture.date;
      mTask.title = `[Bù lịch] ${mTask.title}`;
    }
  });

  return copy;
}
