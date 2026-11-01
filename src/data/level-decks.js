// ====================================================================
// SPRACHMEISTERSCHAFT — VOCABULARY DECKS BY LEVEL (A1–C2)
// Các bộ từ vựng được phân loại bài bản theo từng cấp độ khung CEFR
// ====================================================================

export const LEVEL_DECKS = [
  // --- A1: KHỞI ĐẦU ---
  {
    id: 'deck-a1-family',
    level: 'A1',
    title: 'Gia đình & Bản thân',
    deTitle: 'Familie & Persönliche Angaben',
    description: 'Các từ vựng cốt lõi để giới thiệu bản thân, các thành viên gia đình và các mối quan hệ thân cận.',
    cardsCount: 15,
    icon: 'Users',
    words: [
      { german: 'Vater', article: 'der', word_type: 'noun', vietnamese: 'người cha / bố', example_de: 'Mein Vater arbeitet als Arzt.', example_vi: 'Bố tôi làm việc như một bác sĩ.' },
      { german: 'Mutter', article: 'die', word_type: 'noun', vietnamese: 'người mẹ', example_de: 'Meine Mutter kocht sehr gut.', example_vi: 'Mẹ tôi nấu ăn rất ngon.' },
      { german: 'Kind', article: 'das', word_type: 'noun', vietnamese: 'đứa trẻ / con cái', example_de: 'Das Kind spielt im Garten.', example_vi: 'Đứa trẻ đang chơi trong vườn.' },
      { german: 'Familie', article: 'die', word_type: 'noun', vietnamese: 'gia đình', example_de: 'Meine Familie lebt in Hanoi.', example_vi: 'Gia đình tôi sống ở Hà Nội.' },
      { german: 'Freund', article: 'der', word_type: 'noun', vietnamese: 'người bạn (nam)', example_de: 'Er ist mein bester Freund.', example_vi: 'Anh ấy là người bạn thân nhất của tôi.' },
      { german: 'Name', article: 'der', word_type: 'noun', vietnamese: 'tên', example_de: 'Mein Name ist Dat.', example_vi: 'Tên tôi là Đạt.' },
      { german: 'wohnen', article: '', word_type: 'verb', vietnamese: 'sinh sống / cư trú', example_de: 'Ich wohne in Berlin.', example_vi: 'Tôi sống ở Berlin.' },
      { german: 'heißen', article: '', word_type: 'verb', vietnamese: 'tên là / gọi là', example_de: 'Wie heißen Sie?', example_vi: 'Ngài tên là gì?' },
    ],
  },
  {
    id: 'deck-a1-food',
    level: 'A1',
    title: 'Ăn uống & Đi chợ',
    deTitle: 'Essen, Trinken & Einkaufen',
    description: 'Tên gọi các món ăn, đồ uống thông dụng, đơn vị đo lường và mẫu câu giao tiếp khi mua sắm.',
    cardsCount: 18,
    icon: 'Utensils',
    words: [
      { german: 'Apfel', article: 'der', word_type: 'noun', vietnamese: 'quả táo', example_de: 'Ich esse jeden Tag einen Apfel.', example_vi: 'Tôi ăn một quả táo mỗi ngày.' },
      { german: 'Brot', article: 'das', word_type: 'noun', vietnamese: 'bánh mì', example_de: 'Das deutsche Brot schmeckt wunderbar.', example_vi: 'Bánh mì Đức có vị rất ngon.' },
      { german: 'Milch', article: 'die', word_type: 'noun', vietnamese: 'sữa', example_de: 'Trinkst du Kaffee mit Milch?', example_vi: 'Bạn có uống cà phê với sữa không?' },
      { german: 'Wasser', article: 'das', word_type: 'noun', vietnamese: 'nước', example_de: 'Ein Glas Wasser bitte.', example_vi: 'Làm ơn cho một ly nước.' },
      { german: 'Kaffee', article: 'der', word_type: 'noun', vietnamese: 'cà phê', example_de: 'Möchten Sie einen Kaffee?', example_vi: 'Ngài có muốn một tách cà phê không?' },
      { german: 'Supermarkt', article: 'der', word_type: 'noun', vietnamese: 'siêu thị', example_de: 'Ich gehe zum Supermarkt.', example_vi: 'Tôi đi đến siêu thị.' },
    ],
  },

  // --- A2: CƠ BẢN ---
  {
    id: 'deck-a2-living',
    level: 'A2',
    title: 'Nhà ở & Tiện nghi căn hộ',
    deTitle: 'Wohnen & Möbel',
    description: 'Từ vựng miêu tả các phòng trong nhà, đồ nội thất, tìm phòng trọ (WG) và hợp đồng thuê.',
    cardsCount: 16,
    icon: 'Home',
    words: [
      { german: 'Wohnung', article: 'die', word_type: 'noun', vietnamese: 'căn hộ', example_de: 'Die Wohnung hat drei Zimmer.', example_vi: 'Căn hộ có ba phòng.' },
      { german: 'Zimmer', article: 'das', word_type: 'noun', vietnamese: 'căn phòng', example_de: 'Mein Zimmer ist sehr hell.', example_vi: 'Phòng tôi rất sáng sủa.' },
      { german: 'Küche', article: 'die', word_type: 'noun', vietnamese: 'nhà bếp', example_de: 'Wir kochen zusammen in der Küche.', example_vi: 'Chúng tôi cùng nấu ăn trong bếp.' },
      { german: 'Miete', article: 'die', word_type: 'noun', vietnamese: 'tiền thuê nhà', example_de: 'Wie viel kostet die Miete pro Monat?', example_vi: 'Tiền thuê nhà mỗi tháng là bao nhiêu?' },
      { german: 'Bett', article: 'das', word_type: 'noun', vietnamese: 'cái giường', example_de: 'Das Bett ist sehr bequem.', example_vi: 'Cái giường rất êm ái.' },
    ],
  },
  {
    id: 'deck-a2-health',
    level: 'A2',
    title: 'Sức khỏe & Tại phòng khám',
    deTitle: 'Gesundheit & Beim Arzt',
    description: 'Bộ phận cơ thể, các triệu chứng đau ốm thông thường, gọi điện đặt lịch hẹn với bác sĩ.',
    cardsCount: 14,
    icon: 'HeartPulse',
    words: [
      { german: 'Arzt', article: 'der', word_type: 'noun', vietnamese: 'bác sĩ (nam)', example_de: 'Ich muss zum Arzt gehen.', example_vi: 'Tôi phải đi khám bác sĩ.' },
      { german: 'Kopfschmerzen', article: 'die', word_type: 'noun', vietnamese: 'chứng đau đầu', example_de: 'Ich habe starke Kopfschmerzen.', example_vi: 'Tôi bị đau đầu dữ dội.' },
      { german: 'Medikament', article: 'das', word_type: 'noun', vietnamese: 'thuốc tây', example_de: 'Nehmen Sie dieses Medikament nach dem Essen.', example_vi: 'Hãy uống thuốc này sau bữa ăn.' },
      { german: 'Termin', article: 'der', word_type: 'noun', vietnamese: 'cuộc hẹn / lịch hẹn', example_de: 'Haben Sie heute noch einen Termin frei?', example_vi: 'Hôm nay bạn còn lịch hẹn nào trống không?' },
    ],
  },

  // --- B1: TRUNG CẤP (CHUẨN THI GOETHE/TELC) ---
  {
    id: 'deck-b1-work',
    level: 'B1',
    title: 'Công sở, Xin việc & Phỏng vấn',
    deTitle: 'Beruf, Bewerbung & Vorstellungsgespräch',
    description: 'Hồ sơ xin việc (Lebenslauf), thư xin việc, kỹ năng nghề nghiệp và đối đáp phỏng vấn.',
    cardsCount: 20,
    icon: 'Briefcase',
    words: [
      { german: 'Bewerbung', article: 'die', word_type: 'noun', vietnamese: 'hồ sơ ứng tuyển', example_de: 'Ich habe meine Bewerbung per E-Mail geschickt.', example_vi: 'Tôi đã gửi hồ sơ ứng tuyển qua email.' },
      { german: 'Erfahrung', article: 'die', word_type: 'noun', vietnamese: 'kinh nghiệm', example_de: 'Ich habe viel Erfahrung in diesem Bereich.', example_vi: 'Tôi có nhiều kinh nghiệm trong lĩnh vực này.' },
      { german: 'Vorstellungsgespräch', article: 'das', word_type: 'noun', vietnamese: 'buổi phỏng vấn xin việc', example_de: 'Morgen habe ich ein wichtiges Vorstellungsgespräch.', example_vi: 'Ngày mai tôi có một buổi phỏng vấn quan trọng.' },
      { german: 'Gehalt', article: 'das', word_type: 'noun', vietnamese: 'tiền lương hàng tháng', example_de: 'Das Gehalt wird pünktlich überwiesen.', example_vi: 'Tiền lương được chuyển khoản đúng hạn.' },
      { german: 'Kollege', article: 'der', word_type: 'noun', vietnamese: 'đồng nghiệp (nam)', example_de: 'Meine Kollegen sind sehr hilfsbereit.', example_vi: 'Các đồng nghiệp của tôi rất hay giúp đỡ.' },
    ],
  },
  {
    id: 'deck-b1-environment',
    level: 'B1',
    title: 'Môi trường & Năng lượng xanh',
    deTitle: 'Umweltschutz & Nachhaltigkeit',
    description: 'Chủ đề quen thuộc trong phần thi Nói và Viết B1: biến đổi khí hậu, tái chế rác, giao thông công cộng.',
    cardsCount: 15,
    icon: 'Leaf',
    words: [
      { german: 'Umwelt', article: 'die', word_type: 'noun', vietnamese: 'môi trường sống', example_de: 'Wir müssen die Umwelt schützen.', example_vi: 'Chúng ta phải bảo vệ môi trường.' },
      { german: 'Klimawandel', article: 'der', word_type: 'noun', vietnamese: 'biến đổi khí hậu', example_de: 'Der Klimawandel betrifft alle Länder.', example_vi: 'Biến đổi khí hậu ảnh hưởng đến tất cả các quốc gia.' },
      { german: 'Müll', article: 'der', word_type: 'noun', vietnamese: 'rác thải', example_de: 'In Deutschland trennt man den Müll sorgfältig.', example_vi: 'Ở Đức người ta phân loại rác rất cẩn thận.' },
      { german: 'Energie', article: 'die', word_type: 'noun', vietnamese: 'năng lượng', example_de: 'Erneuerbare Energien sind die Zukunft.', example_vi: 'Năng lượng tái tạo là tương lai.' },
    ],
  },

  // --- B2: VỮNG VÀNG ---
  {
    id: 'deck-b2-debate',
    level: 'B2',
    title: 'Tranh luận, Báo chí & Quan điểm',
    deTitle: 'Debatte, Medien & Argumentation',
    description: 'Từ vựng cấu trúc lập luận để viết bài biểu đạt quan điểm (Stellungnahme) và tranh luận thi B2.',
    cardsCount: 16,
    icon: 'MessageCircle',
    words: [
      { german: 'Argument', article: 'das', word_type: 'noun', vietnamese: 'luận điểm / lập luận', example_de: 'Ein überzeugendes Argument anführen.', example_vi: 'Đưa ra một luận điểm thuyết phục.' },
      { german: 'Standpunkt', article: 'der', word_type: 'noun', vietnamese: 'quan điểm / góc nhìn', example_de: 'Aus meiner Sicht vertreten wir denselben Standpunkt.', example_vi: 'Theo góc nhìn của tôi chúng ta có cùng quan điểm.' },
      { german: 'Widerspruch', article: 'der', word_type: 'noun', vietnamese: 'sự mâu thuẫn / phản bác', example_de: 'Da muss ich Ihnen widersprechen.', example_vi: 'Về điểm đó tôi phải phản bác lại bạn.' },
      { german: 'Einfluss', article: 'der', word_type: 'noun', vietnamese: 'sự ảnh hưởng / tác động', example_de: 'Soziale Medien haben einen großen Einfluss.', example_vi: 'Mạng xã hội có một sức ảnh hưởng rất lớn.' },
    ],
  },

  // --- C1: CHUYÊN SÂU ---
  {
    id: 'deck-c1-academic',
    level: 'C1',
    title: 'Học thuật & Nghiên cứu khoa học',
    deTitle: 'Wissenschaftssprache & Forschung',
    description: 'Ngôn ngữ văn bản học thuật (Wissenschaftssprache), viết luận văn đại học và thuyết trình hội thảo.',
    cardsCount: 15,
    icon: 'GraduationCap',
    words: [
      { german: 'Erkenntnis', article: 'die', word_type: 'noun', vietnamese: 'sự nhận thức / phát hiện khoa học', example_de: 'Neue wissenschaftliche Erkenntnisse gewinnen.', example_vi: 'Đạt được những phát hiện khoa học mới.' },
      { german: 'Hypothese', article: 'die', word_type: 'noun', vietnamese: 'giả thuyết', example_de: 'Eine Hypothese überprüfen und verifizieren.', example_vi: 'Kiểm tra và xác minh một giả thuyết.' },
      { german: 'Phänomen', article: 'das', word_type: 'noun', vietnamese: 'hiện tượng', example_de: 'Ein komplexes gesellschaftliches Phänomen analysieren.', example_vi: 'Phân tích một hiện tượng xã hội phức tạp.' },
      { german: 'Verfahren', article: 'das', word_type: 'noun', vietnamese: 'quy trình / phương pháp tiến hành', example_de: 'Ein standardisiertes Verfahren anwenden.', example_vi: 'Áp dụng một quy trình đã được chuẩn hóa.' },
    ],
  },

  // --- C2: ĐIÊU LUYỆN ---
  {
    id: 'deck-c2-idioms',
    level: 'C2',
    title: 'Thành ngữ cao cấp & Tu từ cổ điển',
    deTitle: 'Redewendungen & Rhetorik',
    description: 'Nắm bắt các sắc thái tinh tế nhất của tiếng Đức, cách chơi chữ, thành ngữ ẩn dụ như người bản xứ.',
    cardsCount: 12,
    icon: 'Crown',
    words: [
      { german: 'die Kirche im Dorf lassen', article: '', word_type: 'idiom', vietnamese: 'đừng làm quá mọi chuyện lên / giữ chừng mực', example_de: 'Wir sollten jetzt keine Panik machen, sondern die Kirche im Dorf lassen.', example_vi: 'Chúng ta không nên hoảng loạn lúc này, mà hãy giữ chừng mực.' },
      { german: 'Schmetterlinge im Bauch haben', article: '', word_type: 'idiom', vietnamese: 'bồi hồi xao xuyến khi yêu', example_de: 'Wenn ich ihn sehe, habe ich immer noch Schmetterlinge im Bauch.', example_vi: 'Mỗi khi nhìn thấy anh ấy, tôi vẫn luôn cảm thấy xao xuyến bồi hồi.' },
      { german: 'ins Gras beißen', article: '', word_type: 'idiom', vietnamese: 'qua đời / mất (từ lóng)', example_de: 'Der alte Fernseher hat gestern ins Gras gebissen.', example_vi: 'Chiếc tivi cũ hôm qua đã "ngỏm" rồi.' },
    ],
  },
];
