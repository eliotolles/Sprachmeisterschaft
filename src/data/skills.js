export const SKILLS = [
  {
    "id": "listening",
    "de": "Hören / Dictation",
    "vi": "Luyện nghe chính tả",
    "icon": "Headphones",
    "tagline": "Nghe câu tiếng Đức chuẩn bản xứ và gõ lại chính xác từng từ.",
    "desc": "Tăng cường phản xạ âm thanh, nhận biết nối âm và viết đúng chính tả tiếng Đức."
  },
  {
    "id": "speaking",
    "de": "Sprechen / Shadowing",
    "vi": "Luyện nói đuổi",
    "icon": "Mic",
    "tagline": "Nghe câu mẫu rồi đọc đuổi theo micro để đạt độ tự nhiên và ngữ điệu chuẩn.",
    "desc": "Hệ thống AI nhận diện giọng nói và chấm điểm phần trăm độ khớp tức thì."
  },
  {
    "id": "reading",
    "de": "Lesen / Lesesaal",
    "vi": "Xưởng đọc hiểu",
    "icon": "BookOpen",
    "tagline": "Đọc các đoạn văn bám sát đề thi từ A1 đến C2 và trả lời câu hỏi trắc nghiệm.",
    "desc": "Giải thích chi tiết ngữ pháp, từ vựng và mẹo tìm từ khóa trong bài thi."
  },
  {
    "id": "writing",
    "de": "Schreiben / Schreibwerkstatt",
    "vi": "Xưởng viết luận",
    "icon": "PenTool",
    "tagline": "Viết email, thư từ và bài luận theo đề thi, gửi AI chấm điểm 4 tiêu chí.",
    "desc": "Nhận ngay thang điểm 100, sửa lỗi ngữ pháp từng câu và bài viết mẫu hoàn chỉnh."
  },
  {
    "id": "pronunciation",
    "de": "Aussprache",
    "vi": "Xưởng phát âm",
    "icon": "Volume2",
    "tagline": "Luyện phát âm các âm khó trong tiếng Đức (ch, r, ö, ü, ä, z, st, sp).",
    "desc": "Ghi âm giọng của bạn, so khớp với người bản xứ và xem thanh điểm âm sắc."
  },
  {
    "id": "grammar",
    "de": "Grammatik",
    "vi": "Xưởng ngữ pháp",
    "icon": "FileText",
    "tagline": "Hệ thống 100 chủ đề ngữ pháp từ cơ bản A1 đến nâng cao C2.",
    "desc": "Học quy tắc trực quan, ví dụ song ngữ Đức-Việt và làm bài tập chấm điểm ngay."
  },
  {
    "id": "interview",
    "de": "Interview / Sprechen",
    "vi": "Phỏng vấn thi nói",
    "icon": "Users",
    "tagline": "Mô phỏng 3 phần thi nói thực tế cùng giám khảo AI ELIO thông minh.",
    "desc": "Trò chuyện tương tác từng lượt, nhận phản hồi 4 tiêu chí và mẫu câu ăn điểm."
  },
  {
    "id": "game",
    "de": "Der / Die / Das",
    "vi": "Trò chơi phản xạ mạo từ",
    "icon": "Gamepad2",
    "tagline": "15 danh từ ngẫu nhiên, 6 giây mỗi câu — thử thách phản xạ thần tốc!",
    "desc": "Tích lũy combo, cộng điểm kinh nghiệm XP và khắc sâu mạo từ vào trí nhớ dài hạn."
  }
];
export const SKILL_POOLS = {
  "dictation": [
    {
      "de": "Guten Tag, wie kann ich Ihnen heute helfen?",
      "vi": "Xin chào, hôm nay tôi có thể giúp gì cho bạn?",
      "level": "A1"
    },
    {
      "de": "Ich möchte mich für den B1-Deutschkurs anmelden.",
      "vi": "Tôi muốn đăng ký khóa học tiếng Đức B1.",
      "level": "A2"
    },
    {
      "de": "Der Zug nach Frankfurt hat heute leider fünfzehn Minuten Verspätung.",
      "vi": "Tàu đi Frankfurt hôm nay tiếc là bị trễ mười lăm phút.",
      "level": "B1"
    },
    {
      "de": "Pünktlichkeit und Zuverlässigkeit spielen im deutschen Berufsleben eine zentrale Rolle.",
      "vi": "Sự đúng giờ và đáng tin cậy đóng vai trò chủ chốt trong công việc tại Đức.",
      "level": "B1"
    },
    {
      "de": "Nachhaltige Entwicklungen erfordern ein Umdenken in unserer gesamten Gesellschaft.",
      "vi": "Sự phát triển bền vững đòi hỏi một sự thay đổi tư duy trong toàn xã hội chúng ta.",
      "level": "B2"
    }
  ],
  "shadowing": [
    {
      "de": "Es freut mich sehr, Sie persönlich kennenzulernen.",
      "vi": "Tôi rất vui mừng được làm quen trực tiếp với bạn.",
      "level": "A1"
    },
    {
      "de": "Könnten Sie mir bitte sagen, wo der nächste Bahnhof liegt?",
      "vi": "Bạn có thể vui lòng chỉ giúp tôi nhà ga gần nhất nằm ở đâu không?",
      "level": "A2"
    },
    {
      "de": "Meiner Meinung nach ist die Vereinbarkeit von Familie und Beruf besonders wichtig.",
      "vi": "Theo ý kiến của tôi, sự cân bằng giữa gia đình và công việc là đặc biệt quan trọng.",
      "level": "B1"
    },
    {
      "de": "Obwohl die Aufgabe anspruchsvoll war, haben wir das Projekt erfolgreich abgeschlossen.",
      "vi": "Mặc dù nhiệm vụ đầy thách thức, chúng tôi đã hoàn thành dự án thành công.",
      "level": "B2"
    }
  ],
  "pronunciation_words": [
    {
      "word": "das Mädchen",
      "ipa": "/ˈmɛːtçən/",
      "meaning": "cô bé",
      "tip": "Âm /ç/ phát âm mềm như 'ich', môi hơi bè ra.",
      "level": "A1"
    },
    {
      "word": "die Übung",
      "ipa": "/ˈyːbʊŋ/",
      "meaning": "bài tập",
      "tip": "Chu môi tròn như đọc 'u' nhưng phát âm 'i'.",
      "level": "A1"
    },
    {
      "word": "schön",
      "ipa": "/ʃøːn/",
      "meaning": "xinh đẹp",
      "tip": "Môi tròn như đọc 'o' nhưng lưỡi phát âm 'ê'.",
      "level": "A1"
    },
    {
      "word": "der Zweck",
      "ipa": "/tsvɛk/",
      "meaning": "mục đích",
      "tip": "Âm 'z' đọc dứt khoát như 'ts' không rung cổ.",
      "level": "B1"
    },
    {
      "word": "die Aussprache",
      "ipa": "/ˈaʊ̯sˌʃpʁaːχə/",
      "meaning": "sự phát âm",
      "tip": "Âm 'sp' đọc là 'shp', âm 'ch' sau 'a' đọc khè sâu ở cổ họng.",
      "level": "B1"
    }
  ],
  "writing_tasks": [
    {
      "id": "w_a1",
      "level": "A1",
      "title": "Lời nhắn cho bạn bè về buổi học",
      "prompt": "Bạn không thể đến lớp tiếng Đức hôm nay vì bị cảm cúm. Hãy viết tin nhắn ngắn (ca. 30 từ) cho bạn cùng lớp.",
      "hints": [
        "Nói lý do bị ốm",
        "Hỏi bài tập về nhà",
        "Hẹn gặp vào buổi sau"
      ]
    },
    {
      "id": "w_b1_email",
      "level": "B1",
      "title": "Thư xin nghỉ phép gửi cấp trên",
      "prompt": "Viết email (khoảng 80 từ) gửi sếp của bạn (ông Schmidt) xin nghỉ phép 3 ngày vào tuần tới vì có việc gia đình quan trọng.",
      "hints": [
        "Lý do xin nghỉ phép",
        "Thời gian cụ thể",
        "Bàn giao công việc cho đồng nghiệp trong thời gian vắng mặt"
      ]
    },
    {
      "id": "w_b1_opinion",
      "level": "B1",
      "title": "Ý kiến diễn đàn: Học online hay học trực tiếp?",
      "prompt": "Viết một bài đóng góp ý kiến (khoảng 80 từ) cho diễn đàn học tập về chủ đề: 'Nên học tiếng Đức trực tuyến hay đến lớp truyền thống?'",
      "hints": [
        "Nêu trải nghiệm cá nhân",
        "Ưu điểm và nhược điểm của học trực tuyến",
        "Đưa ra lời khuyên"
      ]
    }
  ]
};
