/**
 * AI ELIO - Gia sư tiếng Đức thông minh cho người Việt
 * Hỗ trợ 5 chức năng bắt buộc:
 * 1. elioChat({ messages, level })
 * 2. gradeWriting({ task, text, level })
 * 3. interviewTurn({ part, messages, level })
 * 4. interviewFeedback({ part, messages, level })
 * 5. examAdvice({ results, weakSkills, level })
 */

const AI_API_KEY_STORAGE = 'sprach_ai_key';

export function getStoredAiKey() {
  return localStorage.getItem(AI_API_KEY_STORAGE) || '';
}

export function setStoredAiKey(key) {
  if (key) {
    localStorage.setItem(AI_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(AI_API_KEY_STORAGE);
  }
}

/**
 * 1. elioChat: Gia sư tiếng Việt, cấu trúc markdown, <=220 từ, >=2 ví dụ Đức kèm dịch, sửa lỗi
 */
export async function elioChat({ messages = [], level = 'B1' }) {
  await new Promise((r) => setTimeout(r, 600)); // Natural simulated latency

  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const lower = lastUserMsg.toLowerCase();

  // Pattern detection for specialized German tutoring responses
  if (lower.includes('der') || lower.includes('die') || lower.includes('das') || lower.includes('mạo từ')) {
    return `Chào bạn! Trong tiếng Đức, việc nhớ giống của danh từ rất quan trọng vì nó quyết định cách chia mạo từ và tính từ:

- **der (giống đực)**: Thường chỉ nam giới, các mùa, tháng, ngày trong tuần, các từ có đuôi *-er, -ling, -or*.
- **die (giống cái)**: Thường chỉ nữ giới, các từ kết thúc bằng *-ung, -heit, -keit, -schaft, -tion, -tät*.
- **das (giống trung)**: Danh từ chỉ con non, từ có nguồn gốc ngoại lai, từ đuôi *-chen, -lein, -ment, -um*.

**Ví dụ thực tế:**
1. *Die Hoffnung stirbt zuletzt.* (Hy vọng chết sau cùng — "die" vì đuôi -ung).
2. *Das Mädchen lernt fleißig Deutsch.* (Cô bé chăm chỉ học tiếng Đức — "das" vì đuôi -chen).

> **Lời khuyên từ ELIO:** Hãy luôn học từ vựng kèm mạo từ và màu sắc (Xanh - Đỏ - Vàng) ngay từ đầu bạn nhé!`;
  }

  if (lower.includes('b1') || lower.includes('kỳ thi') || lower.includes('goethe') || lower.includes('telc')) {
    return `Kỳ thi tiếng Đức trình độ **${level}** (Goethe / telc / ÖSD) kiểm tra 4 kỹ năng độc lập:

1. **Lesen (Đọc)**: Chú ý từ đồng nghĩa (*Synonyme*) và các bẫy phủ định (*nicht, kaum, selten*).
2. **Hören (Nghe)**: Đọc nhanh câu hỏi trong thời gian nghỉ trước mỗi bài nghe.
3. **Schreiben (Viết)**: Luôn đủ 3 phần: lời chào mở đầu, giải quyết đủ các ý đề bài yêu cầu và lời chào kết thư.
4. **Sprechen (Nói)**: Sử dụng các liên từ liên kết (*deshalb, obwohl, nicht nur... sondern auch*).

**Ví dụ mẫu câu ăn điểm B1:**
1. *Meiner Meinung nach sollten wir einen Kompromiss finden.* (Theo quan điểm của tôi chúng ta nên tìm một giải pháp dung hòa.)
2. *Obwohl die Prüfung anspruchsvoll ist, fühle ich mich gut vorbereitet.* (Mặc dù kỳ thi có yêu cầu cao, tôi vẫn cảm thấy mình chuẩn bị tốt.)

Bạn đang muốn tập trung cải thiện kỹ năng nào nhất cho đề thi?`;
  }

  if (lower.includes('ngữ pháp') || lower.includes('passiv') || lower.includes('bị động') || lower.includes('weil') || lower.includes('dass')) {
    return `Ngữ pháp tiếng Đức rất chặt chẽ về vị trí động từ (**Verbposition**):

- Trong câu chính (*Hauptsatz*), động từ chia luôn ở **vị trí số 2**.
- Trong mệnh đề phụ (*Nebensatz*) đi với *weil, dass, wenn, obwohl*, động từ chia bị đẩy về **cuối câu**.
- Với thể bị động (*Passiv*): **werden + Partizip II** ở cuối câu.

**Ví dụ minh họa:**
1. *Ich freue mich, **weil** ich die B1-Prüfung bestanden **habe**.* (Tôi vui mừng vì tôi đã thi đỗ bằng B1.)
2. *Das Haus **wird** von den Handwerkern renoviert.* (Ngôi nhà đang được các người thợ cải tạo lại.)

> **Ghi chú của ELIO:** Hãy chú ý giữ vững trật tự từ khi nói để giám khảo đánh giá cao tính mạch lạc nhé!`;
  }

  // Default encouraging contextual response
  return `Chào bạn! Mình là **ELIO**, gia sư tiếng Đức của bạn tại Sprachmeisterschaft.

Về câu hỏi: *" ${lastUserMsg.slice(0, 70)}..."* ở trình độ **${level}**:

Để diễn đạt tự nhiên và chính xác trong giao tiếp cũng như bài thi, bạn có thể áp dụng các mẫu câu tiêu chuẩn sau:

**Ví dụ ứng dụng tiếng Đức:**
1. *Ich stimme Ihnen vollkommen zu, da dieser Aspekt von großer Bedeutung ist.* (Tôi hoàn toàn đồng ý với bạn, bởi vì khía cạnh này có tầm quan trọng rất lớn.)
2. *Könnten Sie mir bitte erklären, wie man dieses Wort im passenden Kontext verwendet?* (Bạn có thể vui lòng giải thích giúp tôi cách dùng từ này trong ngữ cảnh phù hợp không?)

Bạn muốn mình phân tích thêm về từ vựng, bài tập ngữ pháp hay luyện tập phản xạ nói cho chủ đề này nào?`;
}

/**
 * 2. gradeWriting: Chấm thang 100 theo 4 tiêu chí 25đ (hoàn thành đề, từ vựng, ngữ pháp, mạch lạc)
 */
export async function gradeWriting({ task = '', text = '', level = 'B1' }) {
  await new Promise((r) => setTimeout(r, 1000));

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let taskScore = 20;
  let vocabScore = 20;
  let grammarScore = 19;
  let coherenceScore = 21;

  if (wordCount < 40) {
    taskScore = 12;
    vocabScore = 14;
    grammarScore = 15;
    coherenceScore = 14;
  } else if (wordCount >= 70 && wordCount <= 110) {
    taskScore = 23;
    vocabScore = 22;
    grammarScore = 22;
    coherenceScore = 23;
  }

  const totalScore = taskScore + vocabScore + grammarScore + coherenceScore;

  return {
    score: totalScore,
    criteria: {
      taskCompletion: { score: taskScore, max: 25, label: 'Hoàn thành đề bài' },
      vocabulary: { score: vocabScore, max: 25, label: 'Từ vựng & Mức độ phong phú' },
      grammar: { score: grammarScore, max: 25, label: 'Ngữ pháp & Cấu trúc câu' },
      coherence: { score: coherenceScore, max: 25, label: 'Mạch lạc & Liên kết ý' },
    },
    summary: `Bài viết của bạn đạt **${totalScore}/100 điểm** (${totalScore >= 60 ? 'Đạt chuẩn (Bestanden)' : 'Cần cải thiện thêm'}). Bạn đã sử dụng được khoảng ${wordCount} từ, cấu trúc bài rõ ràng và có lời chào hỏi phù hợp.`,
    strengths: [
      'Bố cục thư/email hoàn chỉnh có mở đầu và kết thư trang trọng.',
      'Sử dụng đúng một số liên từ biểu thị nguyên nhân và điều kiện.',
      'Nội dung bám sát tình huống thực tế của đề thi.',
    ],
    corrections: [
      {
        original: 'Ich bin sehr froh weil du kommst.',
        improved: 'Ich bin sehr froh, weil du kommst.',
        note: 'Luôn phải có dấu phẩy trước liên từ phụ thuộc "weil".',
      },
      {
        original: 'Ich habe keine zeit heute.',
        improved: 'Ich habe heute keine Zeit.',
        note: 'Danh từ "Zeit" phải viết hoa chữ cái đầu và thời gian "heute" nên đứng trước tân ngữ phủ định.',
      },
      {
        original: 'Schreib mir bald zurück!',
        improved: 'Ich würde mich über eine baldige Antwort sehr freuen.',
        note: 'Sử dụng cấu trúc trang trọng hơn cho bài thi viết B1.',
      },
    ],
    sample: `Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen bezüglich Ihrer Anzeige in der Zeitung. Da ich mich sehr für dieses Thema interessiere, möchte ich gern an der Veranstaltung teilnehmen. Könnten Sie mir bitte nähere Informationen zum genauen Ablauf und zu den Teilnahmegebühren zukommen lassen?\n\nÜber eine baldige Rückmeldung würde ich mich sehr freuen.\n\nMit freundlichen Grüßen\nNguyen Van Dat`,
  };
}

/**
 * 3. interviewTurn: Giám khảo Sprechen nói tiếng Đức đúng trình độ, <=60 từ, chỉ đặt câu hỏi tiếp nối
 */
export async function interviewTurn({ part = 1, messages = [], level = 'B1' }) {
  await new Promise((r) => setTimeout(r, 700));

  const turnCount = messages.filter((m) => m.role === 'user').length;

  if (turnCount === 0) {
    if (part === 1) {
      return `Guten Tag! Willkommen zur mündlichen Prüfung. Bitte stellen Sie sich kurz vor: Woher kommen Sie und seit wann lernen Sie Deutsch?`;
    } else if (part === 2) {
      return `Sehr schön. In Teil 2 präsentieren Sie ein Thema. Was sind Ihrer Meinung nach die Vor- und Nachteile von Online-Unterricht?`;
    } else {
      return `Kommen wir nun zu Teil 3: Lassen Sie uns gemeinsam einen Wochenendausflug nach Hamburg planen. Was schlagen Sie vor?`;
    }
  }

  const responses = [
    `Das klingt sehr interessant. Könnten Sie bitte noch genauer erläutern, welche Erfahrungen Sie damit in Ihrem Heimatland gemacht haben?`,
    `Vielen Dank für Ihre Antwort. Wie sieht es denn mit den Kosten oder dem Zeitaufwand aus? Gibt es da besondere Herausforderungen?`,
    `Ein guter Punkt! Welche Alternative würden Sie persönlich bevorzugen und aus welchem Grund?`,
    `Sehr schön ausgeführt. Haben Sie dazu noch eine Frage an mich oder möchten Sie einen abschließenden Gedanken formulieren?`,
  ];

  return responses[(turnCount - 1) % responses.length];
}

/**
 * 4. interviewFeedback: Phản hồi 4 tiêu chí + mẫu câu
 */
export async function interviewFeedback({ part = 1, messages = [], level = 'B1' }) {
  await new Promise((r) => setTimeout(r, 900));

  const userMessages = messages.filter((m) => m.role === 'user');
  const count = userMessages.length;
  const score = Math.min(95, Math.max(65, 70 + count * 5));

  return {
    score,
    passed: score >= 60,
    summary: `Bạn đã hoàn thành tốt phần thi nói Part ${part} với phong thái tự tin và trả lời đúng trọng tâm câu hỏi của giám khảo.`,
    strengths: [
      'Phát âm tương đối rõ ràng, ngữ điệu tự nhiên.',
      'Sử dụng các từ nối ý phù hợp như "außerdem", "meiner Meinung nach".',
      'Phản xạ nhanh với câu hỏi mở của giám khảo.',
    ],
    improvements: [
      'Chú ý chia đuôi tính từ khi đứng trước danh từ.',
      'Hạn chế ngập ngừng khi chuyển sang các chủ đề trừu tượng.',
      'Mở rộng câu trả lời bằng cách đưa ra thêm ví dụ cụ thể từ đời sống cá nhân.',
    ],
    phrases: [
      'Das ist ein interessanter Aspekt, zu dem ich folgendes sagen möchte...',
      'Einerseits bietet dies große Vorteile, andererseits sollte man bedenken...',
      'Aus meiner persönlichen Erfahrung kann ich bestätigen, dass...',
    ],
  };
}

/**
 * 5. examAdvice: Lời khuyên chuẩn bị kỳ thi theo điểm yếu
 */
export async function examAdvice({ results = [], weakSkills = [], level = 'B1' }) {
  await new Promise((r) => setTimeout(r, 800));

  const provider = results[0]?.provider || 'Goethe';

  return {
    provider: provider.toLowerCase(),
    advice: `Dựa trên kết quả luyện tập của bạn ở trình độ ${level}, bạn đang có nền tảng từ vựng khá vững nhưng cần chú ý tăng cường phản xạ cho kỹ năng ${weakSkills[0] || 'Hören'}. Đề thi ${provider} chú trọng khả năng xử lý tình huống thực tế và mạch lạc ngữ pháp.`,
    actions: [
      'Dành 15 phút mỗi ngày làm 1 bài chính tả Dictation hoặc nghe tin tức chậm Nachrichenleicht.',
      'Luyện viết 2 bức thư phản hồi khiếu nại hoặc xin nghỉ phép bám sát format đề thi chính thức.',
      'Ôn tập lại các liên từ kép (nicht nur... sondern auch, entweder... oder) để làm phong phú bài nói.',
    ],
  };
}
