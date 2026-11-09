const grammarRoot = 'https://www.deutschakademie.de/online-deutschkurs/deutsche-grammatik/';
const phonetics = 'https://www.goethe.de/ins/vn/de/spr/unt/for/gia/ltb.html';

export const EXPLORE_LESSONS = [
  {
    id: 'sentence',
    title: 'Cấu trúc câu',
    intro: 'Xây một câu đúng bằng cách xác định động từ chia trước, rồi đặt các thành phần còn lại vào khung câu.',
    cards: [
      {
        title: 'Câu kể và vị trí thứ hai',
        rule: 'Động từ chia đứng ở vị trí thứ hai. Một cụm như Heute Morgen vẫn chỉ chiếm một vị trí. Nếu đưa thời gian lên đầu, chủ ngữ chuyển ra sau động từ.',
        examples: [
          ['Ich lerne heute Deutsch.', 'Hôm nay tôi học tiếng Đức.'],
          ['Heute Morgen lerne ich zu Hause.', 'Sáng nay tôi học ở nhà.']
        ],
        note: 'Không viết Heute ich lerne. Vị trí được tính theo thành phần câu, không theo số từ.'
      },
      {
        title: 'Khung động từ',
        rule: 'Với động từ khuyết thiếu, Perfekt hoặc động từ tách, phần đã chia ở vị trí hai, phần còn lại thường ở cuối câu.',
        examples: [
          ['Ich muss morgen früh arbeiten.', 'Ngày mai tôi phải làm việc sớm.'],
          ['Ich habe gestern meine Mutter angerufen.', 'Hôm qua tôi đã gọi cho mẹ.']
        ],
        note: 'Đánh dấu hai đầu khung trước khi thêm thời gian, địa điểm hoặc tân ngữ.'
      },
      {
        title: 'Câu phụ',
        rule: 'Sau weil, dass, wenn hoặc obwohl, động từ chia thường về cuối mệnh đề. Nếu câu phụ đứng đầu, động từ của câu chính đứng ngay sau dấu phẩy.',
        examples: [
          ['Ich bleibe zu Hause, weil ich krank bin.', 'Tôi ở nhà vì bị ốm.'],
          ['Wenn ich Zeit habe, besuche ich dich.', 'Nếu có thời gian, tôi sẽ đến thăm bạn.']
        ],
        note: 'Denn nối hai mệnh đề chính nên giữ trật tự động từ ở vị trí hai.'
      },
      {
        title: 'Đặt câu hỏi',
        rule: 'Câu hỏi có/không bắt đầu bằng động từ chia. Câu hỏi có từ để hỏi thường đặt từ để hỏi trước động từ.',
        examples: [
          ['Hast du morgen Zeit?', 'Ngày mai bạn có thời gian không?'],
          ['Wann beginnt der Kurs?', 'Khóa học bắt đầu khi nào?']
        ]
      }
    ],
    quiz: {
      question: 'Chọn câu đúng.',
      options: ['Morgen ich muss arbeiten.', 'Morgen muss ich arbeiten.'],
      answer: 1,
      explanation: 'Morgen là vị trí đầu. Muss đứng thứ hai, arbeiten ở cuối.'
    },
    sources: [
      { title: 'DeutschAkademie · Hauptsatz', url: grammarRoot + 'satzbau/hauptsatz/' },
      { title: 'DeutschAkademie · Satzklammer', url: grammarRoot + 'satzbau/hauptsatz/satzklammer/' },
      { title: 'DeutschAkademie · Satzbau', url: grammarRoot + 'satzbau/' }
    ]
  },
  {
    id: 'articles',
    title: 'Der · Die · Das',
    intro: 'Học danh từ cùng mạo từ, dạng số nhiều và một cụm thường dùng. Đuôi từ là dấu hiệu hỗ trợ, cần kiểm tra từng từ.',
    cards: [
      {
        title: 'Những đuôi thường gặp',
        rule: 'Các danh từ tận cùng bằng -ung, -heit, -keit, -schaft thường là die. Dạng thu nhỏ với -chen hoặc -lein là das. Danh từ với -ling thường là der.',
        examples: [
          ['die Ausbildung, die Möglichkeit, die Freundschaft', 'việc đào tạo, khả năng, tình bạn'],
          ['das Mädchen, das Büchlein, der Lehrling', 'cô bé, quyển sách nhỏ, người học nghề']
        ],
        note: 'Mädchen dùng das theo cấu tạo từ. Giống ngữ pháp không luôn trùng giới tính tự nhiên.'
      },
      {
        title: 'Danh từ ghép',
        rule: 'Trong một danh từ ghép, thành phần cuối quyết định giống và nghĩa chính.',
        examples: [
          ['das Haus → die Haustür', 'ngôi nhà → cửa ra vào của ngôi nhà'],
          ['der Tisch → die Tischlampe', 'cái bàn → đèn bàn']
        ],
        note: 'Ghi die Tür và die Lampe để nhớ vì sao hai từ ghép này dùng die.'
      },
      {
        title: 'Học cả số nhiều',
        rule: 'Ở Nominativ và Akkusativ, mạo từ xác định số nhiều là die. Hình thức của danh từ vẫn phải học riêng.',
        examples: [
          ['das Buch – die Bücher', 'quyển sách – những quyển sách'],
          ['der Tisch – die Tische', 'cái bàn – những cái bàn']
        ],
        note: 'Khi viết câu, phải biến đổi mạo từ theo cách. Der Tisch có thể thành den Tisch hoặc dem Tisch.'
      }
    ],
    quiz: {
      question: 'Từ Haustür dùng mạo từ nào?',
      options: ['der', 'die', 'das'],
      answer: 1,
      explanation: 'Thành phần cuối là die Tür nên dùng die Haustür.'
    },
    sources: [{ title: 'DeutschAkademie · Ngữ pháp tiếng Đức', url: grammarRoot }]
  },
  {
    id: 'participle',
    title: 'Partizip II',
    intro: 'Partizip II dùng trong Perfekt và nhiều cấu trúc khác. Tách việc tạo Partizip II khỏi việc chọn haben hoặc sein.',
    cards: [
      {
        title: 'Động từ đều',
        rule: 'Mẫu thường gặp là ge- + gốc động từ + -t. Với gốc khó phát âm, thường thêm -et.',
        examples: [
          ['machen → gemacht; lernen → gelernt', 'làm → đã làm; học → đã học'],
          ['arbeiten → gearbeitet', 'làm việc → đã làm việc']
        ],
        note: 'Động từ mạnh cần học cả ba dạng, chẳng hạn gehen – ging – gegangen.'
      },
      {
        title: 'Tiền tố và -ieren',
        rule: 'Động từ tách đặt ge- giữa tiền tố và gốc. Động từ không tách với be-, emp-, ent-, er-, ge-, miss-, ver-, zer- không thêm ge-. Động từ tận cùng bằng -ieren cũng không thêm ge-.',
        examples: [
          ['einkaufen → eingekauft; anrufen → angerufen', 'mua sắm; gọi điện'],
          ['besuchen → besucht; studieren → studiert', 'thăm; học đại học']
        ],
        note: 'Nhớ sự khác nhau giữa động từ tách và không tách, không chỉ nhìn chiều dài của từ.'
      },
      {
        title: 'Dùng trong câu',
        rule: 'Perfekt gồm haben/sein đã chia và Partizip II ở cuối. Nhiều động từ chỉ di chuyển hoặc thay đổi trạng thái dùng sein, nhưng không áp dụng máy móc cho mọi động từ có chuyển động.',
        examples: [
          ['Wir haben zusammen gekocht.', 'Chúng tôi đã nấu ăn cùng nhau.'],
          ['Sie ist nach Hause gefahren.', 'Cô ấy đã đi về nhà.']
        ],
        note: 'Học trợ động từ cùng động từ. Bleiben dùng sein dù không chỉ chuyển động.'
      },
      {
        title: 'Partizip II làm tính từ',
        rule: 'Khi đứng trước danh từ, Partizip II nhận đuôi tính từ theo mạo từ và cách.',
        examples: [
          ['die geschlossene Tür', 'cánh cửa đã đóng'],
          ['Ich öffne das gekaufte Buch.', 'Tôi mở quyển sách đã mua.']
        ]
      }
    ],
    quiz: {
      question: 'Partizip II của besuchen là gì?',
      options: ['gebesucht', 'besucht', 'besuchen'],
      answer: 1,
      explanation: 'Be- là tiền tố không tách nên không thêm ge-.'
    },
    sources: [
      { title: 'DeutschAkademie · Partizip II', url: grammarRoot + 'wortarten/verben/partizip-2/' },
      { title: 'DeutschAkademie · Perfekt', url: grammarRoot + 'wortarten/verben/deutsche-zeitformen/perfekt/' },
      { title: 'Deutsche Grammatik 2.0 · Dùng Partizip II', url: 'https://deutschegrammatik20.de/verbformen/das-partizip-ii/partizip-ii/die-verwendung-des-partizips-ii/' }
    ]
  },
  {
    id: 'daily',
    title: 'Giao tiếp đời sống',
    intro: 'Hệ thống các tình huống giao tiếp thiết thực nhất trong cuộc sống hàng ngày tại Đức: từ đặt hẹn, thuê nhà, đi bác sĩ, mua sắm đến giao tiếp với cơ quan công quyền.',
    cards: [
      {
        title: 'Đặt, dời và hủy lịch hẹn (Termine)',
        rule: 'Người Đức làm việc luôn theo lịch hẹn (Termin). Hãy nói mục đích ngay từ đầu, hỏi khung giờ trống, xác nhận lại thời gian và xin xác nhận qua email nếu cần.',
        examples: [
          ['Ich möchte gern einen Termin vereinbaren. Haben Sie nächste Woche etwas frei?', 'Tôi muốn đặt một lịch hẹn. Tuần sau bên mình còn giờ trống không?'],
          ['Könnten wir den Termin bitte auf Donnerstag verschieben?', 'Chúng ta có thể dời lịch hẹn sang thứ Năm được không?'],
          ['Ich muss den Termin leider absagen, da ich kurzfristig verhindert bin.', 'Tôi rất tiếc phải hủy lịch hẹn vì có việc bận đột xuất.']
        ],
        note: 'Verschieben auf + Akkusativ: dời sang ngày nào. Absagen: hủy hoàn toàn. Nhớ báo hủy trước ít nhất 24 giờ để tránh bị phạt phí hủy lịch.'
      },
      {
        title: 'Khám bệnh & Đi hiệu thuốc (Beim Arzt & Apotheke)',
        rule: 'Mô tả triệu chứng cụ thể, thời gian bắt đầu bị, tiền sử dị ứng và xin giấy nghỉ ốm (Krankschreibung / AU-Bescheinigung) nộp cho công ty hoặc trường học.',
        examples: [
          ['Ich fühle mich seit zwei Tagen schlapp und habe starke Halsschmerzen.', 'Tôi thấy mệt lả người từ 2 ngày nay và bị đau họng dữ dội.'],
          ['Ich brauche ein Attest für meinen Arbeitgeber.', 'Tôi cần một giấy xác nhận bệnh (giấy nghỉ ốm) cho cơ quan/chủ lao động.'],
          ['Gibt es dieses Medikament rezeptfrei, oder brauche ich ein Rezept?', 'Thuốc này có bán không cần kê đơn không, hay tôi cần đơn thuốc của bác sĩ?']
        ],
        note: 'Praxis = phòng khám tư; Notaufnahme = cấp cứu bệnh viện. Giấy nghỉ ốm điện tử ngày nay được gọi là eAU.'
      },
      {
        title: 'Thuê nhà & Liên hệ chủ nhà (Wohnung & Vermieter)',
        rule: 'Khi tìm nhà hoặc báo hỏng hóc trong căn hộ, trình bày lịch sự nhưng rõ ràng về tình trạng thực tế để bên quản lý nhà (Hausverwaltung) cử thợ tới xử lý.',
        examples: [
          ['Ich interessiere mich sehr für die Wohnung und würde mich über eine Besichtigung freuen.', 'Tôi rất quan tâm đến căn hộ và rất mong có cơ hội được đến xem nhà.'],
          ['Die Heizung im Wohnzimmer wird nicht warm. Könnten Sie bitte einen Handwerker schicken?', 'Máy sưởi ở phòng khách không ấm. Anh/chị có thể vui lòng cử thợ đến kiểm tra không?'],
          ['Seit gestern tropft der Wasserhahn in der Küche ununterbrochen.', 'Từ hôm qua vòi nước trong bếp bị rò rỉ chảy giọt liên tục.']
        ],
        note: 'Warmmiete = tiền thuê nhà đã gồm chi phí sưởi/nước; Kaltmiete = tiền thuê nhà thuần (chưa gồm chi phí phụ Nebenkosten).'
      },
      {
        title: 'Ngân hàng & Thủ tục hành chính (Bank & Behörden)',
        rule: 'Giao dịch ở ngân hàng (Sparkasse, Deutsche Bank...) và văn phòng hành chính (Bürgeramt, Ausländerbehörde) cần dùng từ ngữ chính xác, lịch sự và mang đầy đủ hồ sơ gốc.',
        examples: [
          ['Ich möchte ein Girokonto eröffnen. Welche Unterlagen benötigen Sie dafür?', 'Tôi muốn mở một tài khoản thanh toán vãng lai. Quý ngân hàng cần những giấy tờ gì?'],
          ['Ich bin neu in die Stadt gezogen und möchte mich hier polizeilich anmelden.', 'Tôi mới chuyển tới thành phố và muốn đăng ký thường trú (Anmeldung) tại đây.'],
          ['Könnten Sie mir bitte eine schriftliche Bestätigung ausstellen?', 'Anh/chị có thể cấp cho tôi một bản xác nhận bằng văn bản được không?']
        ],
        note: 'Meldebestätigung (giấy xác nhận thường trú) là chìa khóa để làm mọi thủ tục tại Đức: mở tài khoản ngân hàng, làm thẻ bảo hiểm y tế, xin mã số thuế cá nhân (Steuer-ID).'
      },
      {
        title: 'Mua sắm & Đổi trả hàng hóa (Einkaufen & Reklamation)',
        rule: 'Hỏi về kích cỡ, chương trình giảm giá, và quyền đổi trả bảo hành với hóa đơn mua hàng (Kassenbon).',
        examples: [
          ['Haben Sie diese Hose vielleicht auch in Größe M da?', 'Mẫu quần này bên mình còn cỡ M không ạ?'],
          ['Ich möchte diesen Pullover umtauschen, hier ist der Kassenbon.', 'Tôi muốn đổi chiếc áo len này, đây là hóa đơn tính tiền.'],
          ['Das Gerät funktioniert leider nicht richtig. Gilt darauf noch Garantie?', 'Thiết bị này tiếc là không hoạt động đúng. Sản phẩm này còn thời hạn bảo hành không?']
        ],
        note: 'Luôn giữ lại Kassenbon (hóa đơn giấy). Tại hầu hết các cửa hàng ở Đức, bạn được đổi trả trong vòng 14 ngày nếu hàng còn nguyên tem mác.'
      },
      {
        title: 'Nhà hàng, Quán ăn & Gọi món (Im Restaurant & Café)',
        rule: 'Gọi bàn, gọi món ăn, hỏi nguyên liệu khi ăn kiêng hoặc dị ứng, xin thanh toán riêng (getrennt zahlen) và để lại tiền boa (Trinkgeld).',
        examples: [
          ['Haben Sie einen Tisch für zwei Personen frei?', 'Bên mình còn bàn trống cho 2 người không?'],
          ['Ich hätte gern das Tagesgericht mit einem stillen Wasser, bitte.', 'Cho tôi xin món ăn của ngày hôm nay kèm một chai nước khoáng không ga.'],
          ['Wir möchten gern zahlen, bitte getrennt. Stimmt so, vielen Dank!', 'Chúng tôi muốn thanh toán, xin tính riêng. Giữ lại tiền thừa nhé (tiền boa), cảm ơn nhiều!']
        ],
        note: 'Stimmt so = "Cứ giữ tiền thừa, không cần thối lại" (cách đưa tiền boa ngắn gọn và lịch sự phổ biến nhất tại Đức).'
      },
      {
        title: 'Giao thông công cộng & Đi lại (Bahn & Öffentliche Verkehrsmittel)',
        rule: 'Đi tàu xe buýt (S-Bahn, U-Bahn, ICE), hỏi trạm đỗ, nối chuyến, báo trễ giờ và xử lý khi bị hủy chuyến.',
        examples: [
          ['Fährt dieser Zug direkt nach München oder muss ich umsteigen?', 'Chuyến tàu này chạy thẳng đến München hay tôi phải chuyển tàu?'],
          ['Entschuldigung, hält dieser Bus am Hauptbahnhof?', 'Xin lỗi, xe buýt này có dừng ở ga trung tâm (Hauptbahnhof) không?'],
          ['Wegen einer Verspätung habe ich meinen Anschlusszug verpasst.', 'Vì tàu bị trễ nên tôi đã bị lỡ chuyến tàu nối tiếp.']
        ],
        note: 'Umsteigen = chuyển tàu; Aussteigen = xuống tàu; Einsteigen = lên tàu. Vé Deutschlandticket (49€-Ticket) đi được toàn bộ phương tiện địa phương trên cả nước Đức.'
      },
      {
        title: 'Giao lưu hàng xóm & Kết nối bạn bè (Nachbarschaft & Freunde)',
        rule: 'Giới thiệu bản thân thân thiện khi chuyển đến khu mới, gửi lời chào và xây dựng mối quan hệ hòa nhã với láng giềng.',
        examples: [
          ['Hallo! Ich bin der neue Nachbar aus dem zweiten Stock. Schön, Sie kennenzulernen!', 'Xin chào! Tôi là người hàng xóm mới chuyển đến tầng 2. Rất vui được làm quen với anh/chị!'],
          ['Entschuldigung, könnten Sie heute Abend die Musik etwas leiser drehen?', 'Xin lỗi, tối nay bạn có thể vặn nhạc nhỏ lại một chút được không?'],
          ['Hast du am Wochenende Lust auf einen Kaffee?', 'Cuối tuần này bạn có hứng thú đi uống cà phê không?']
        ],
        note: 'Chào hàng xóm ở cầu thang là nét lịch sự tối thiểu ở Đức. Một lời chào "Guten Tag" hay "Hallo" tạo ấn tượng rất tốt.'
      }
    ],
    quiz: {
      question: 'Bạn muốn đổi lịch hẹn sang thứ Năm tuần sau. Câu nào sau đây là chuẩn ngữ pháp và tự nhiên nhất?',
      options: [
        'Könnten wir den Termin bitte auf nächsten Donnerstag verschieben?',
        'Ich muss den Termin nächsten Donnerstag absagen.',
        'Wann ist der Termin nächsten Donnerstag?'
      ],
      answer: 0,
      explanation: 'Verschieben auf + Akkusativ mang nghĩa là dời/chuyển lịch sang một thời điểm khác. Absagen có nghĩa là hủy hẳn.'
    },
    sources: [
      { title: 'Goethe-Institut · Tự học và giao tiếp đời sống', url: 'https://www.goethe.de/de/spr/ueb/sst.html' },
      { title: 'Deutsche Welle · Deutsch im Alltag (Nicos Weg)', url: 'https://learngerman.dw.com/' }
    ]
  },
  {
    id: 'colloquial',
    title: 'Khẩu ngữ',
    intro: 'Nắm vững tiếng Đức đời sống tự nhiên của người bản xứ: các tiểu từ tình thái (Modalpartikeln), tiếng lóng đời thường, cách nuốt âm và diễn đạt ngắn gọn mà sách giáo khoa ít dạy.',
    cards: [
      {
        title: 'Tiểu từ "mal" – Làm câu mềm mại và tự nhiên hơn',
        rule: 'Mal (viết tắt của einmal) biến câu mệnh lệnh gắt gỏng thành lời nhờ vả nhẹ nhàng, thân mật hoặc lời đề nghị dễ chịu.',
        examples: [
          ['Kannst du mir mal bitte kurz helfen?', 'Bạn có thể giúp mình một chút được không?'],
          ['Schau mal hier, das ist wirklich interessant!', 'Nhìn này xem, cái này thú vị thực sự đấy!'],
          ['Sag mal, hast du am Samstag schon was vor?', 'Này cho mình hỏi, thứ Bảy này bạn đã có dự định gì chưa?']
        ],
        note: 'Sag mal / Sag mal kurz là cách mở đầu câu chuyện thân mật cực kỳ phổ biến trong giao tiếp bạn bè hàng ngày.'
      },
      {
        title: 'Phản bác phủ định với "Doch!"',
        rule: 'Doch được dùng để khẳng định lại một sự việc khi người đối diện đặt câu hỏi phủ định hoặc đưa ra nhận định phủ định. Tiếng Việt hay nhầm lẫn nói "Ja" trong trường hợp này.',
        examples: [
          ['Kommst du heute nicht zur Party? – Doch, natürlich komme ich!', 'Hôm nay bạn không đến tiệc à? – Có chứ, đương nhiên mình đến!'],
          ['Du hast deine Hausaufgaben nicht gemacht, oder? – Doch, hier sind sie!', 'Bạn chưa làm bài tập về nhà đúng không? – Có làm chứ, chúng ở đây này!'],
          ['Das schmeckt dir wohl nicht? – Doch, es ist sehr lecker!', 'Món này có vẻ không hợp khẩu vị bạn à? – Có chứ, ngon lắm mà!']
        ],
        note: 'Quy tắc vàng: Nếu câu hỏi có "nicht/kein" và bạn muốn trả lời CÓ, luôn luôn dùng "Doch", tuyệt đối không dùng "Ja".'
      },
      {
        title: 'Cặp từ chấp nhận thực tế: "halt" và "eben"',
        rule: 'Halt và eben biểu thị sự chấp nhận một điều hiển nhiên, không thể thay đổi được, tương đương với "đành chịu vậy", "thì vốn dĩ là thế".',
        examples: [
          ['Es regnet in Strömen. Da müssen wir halt zu Hause bleiben.', 'Mưa như trút nước. Thế thì bọn mình đành phải ở nhà vậy thôi.'],
          ['So ist das Leben eben, man kann nicht alles haben.', 'Cuộc đời vốn dĩ là thế, người ta không thể có được tất cả mọi thứ.'],
          ['Ich habe den Bus verpasst, jetzt muss ich halt warten.', 'Tôi bị lỡ xe buýt rồi, giờ thì đành phải đợi chuyến tiếp theo thôi.']
        ],
        note: 'Người miền Nam Đức và Áo chuộng dùng "halt", người miền Bắc hay dùng "eben", nghĩa thực tế hoàn toàn tương đương nhau.'
      },
      {
        title: 'Cụm từ cửa miệng kinh điển: "Passt schon", "Alles klar", "Geht so"',
        rule: 'Các cụm từ ngắn gọn phản hồi nhanh trong đời thường, vừa nhanh chóng vừa mang lại cảm giác giao tiếp rất tự nhiên.',
        examples: [
          ['Danke dir! – Passt schon, kein Problem!', 'Cảm ơn bạn nhé! – Ổn mà, không có vấn đề gì đâu!'],
          ['Alles klar, ich melde mich später bei dir.', 'Mọi thứ rõ rồi, lát nữa mình sẽ nhắn tin/gọi lại cho bạn nhé.'],
          ['Wie geht es dir heute? – Na ja, geht so, ich bin ziemlich müde.', 'Hôm nay bạn thế nào? – Ừm, cũng tạm thôi, mình thấy khá là mệt.']
        ],
        note: '"Passt schon" là câu trả lời đa năng của người Đức: dùng khi nhận tiền thối, khi ai đó xin lỗi, hoặc khi chấp nhận một giải pháp tạm thời.'
      },
      {
        title: 'Thích và không thích: "Bock haben" vs. "Keinen Bock"',
        rule: 'Bock haben auf + Akkusativ là khẩu ngữ cực phổ biến của giới trẻ và người đi làm để nói về việc có hứng thú, có tâm trạng làm cái gì đó (đồng nghĩa với Lust haben).',
        examples: [
          ['Hast du Bock auf eine Pizza heute Abend?', 'Tối nay bạn có hứng làm bữa pizza không?'],
          ['Ich habe heute echt null Bock auf Sport.', 'Hôm nay mình thực sự số 0 có tí hứng thú nào để đi tập thể thao cả.'],
          ['Voll Bock! Lass uns sofort losgehen!', 'Hứng quá luôn! Bọn mình xuất phát ngay đi!']
        ],
        note: '"Null Bock" biểu thị hoàn toàn không muốn làm gì. Đây là từ ngữ thân mật (informell), không dùng trong văn bản công việc trang trọng.'
      },
      {
        title: 'Tiếng lóng về tiền bạc: "Kohle", "Knete", "Mäuse"',
        rule: 'Trong văn nói thân mật, người Đức rất hiếm khi lặp đi lặp lại từ "Geld", thay vào đó họ dùng các từ lóng dân dã.',
        examples: [
          ['Das neue Smartphone kostet echt eine Stange Geld / eine Menge Kohle.', 'Chiếc điện thoại thông minh mới này tốn cả đống tiền đấy.'],
          ['Ich bin diesen Monat ziemlich knapp bei Kasse.', 'Tháng này tôi đang khá là kẹt tiền (cháy túi).'],
          ['Hast du ein bisschen Kleingeld für den Parkscheinautomaten dabei?', 'Bạn có chút tiền lẻ nào cho máy mua vé đỗ xe không?']
        ],
        note: 'Kohle (nghĩa gốc là than đá), Knete (đất nặn) đều mang nghĩa lóng là "tiền nong".'
      },
      {
        title: 'Lời chào & Cảm thán: "Na?", "Moin!", "Krass!", "Quatsch!"',
        rule: 'Cách phản xạ cảm xúc trực tiếp khi trò chuyện với bạn bè, đồng nghiệp thân thiết.',
        examples: [
          ['Na, alles fit bei dir?', 'Sao rồi, mọi chuyện ổn thỏa cả chứ?'],
          ['Moin moin! Wie läuft die Arbeit?', 'Chào buổi sáng/Chào nhé! Công việc dạo này tiến triển thế nào?'],
          ['Echt jetzt? Das ist ja voll krass!', 'Thật luôn á? Chuyện đó đỉnh/kinh khủng thật đấy!'],
          ['Ach Quatsch, mach dir darüber keine Sorgen!', 'Ôi xàm/vớ vẩn quá, đừng bận tâm lo lắng về điều đó làm gì!']
        ],
        note: 'Ở miền Bắc Đức (Hamburg, Bremen...), "Moin" có thể dùng để chào nhau bất cứ giờ nào trong ngày, kể cả sáng, trưa lẫn tối.'
      },
      {
        title: 'Hiện tượng nuốt âm & Viết tắt trong văn nói đời thực',
        rule: 'Trong hội thoại nhanh, người bản xứ thường nuốt âm e ở đuôi động từ hoặc gộp mạo từ vào từ đứng trước.',
        examples: [
          ['Ich hab\' keine Zeit. (thay vì Ich habe keine Zeit)', 'Tôi chẳng có thời gian.'],
          ['Kannste mir das mal geben? (Kannst du...)', 'Bạn có thể đưa cho tôi cái đó được không?'],
          ['Hast du \'nen Stift? / Ich hab\' \'ne Frage.', 'Bạn có cây bút nào không? / Tôi có một câu hỏi.']
        ],
        note: '\'nen = einen; \'ne = eine; \'n = ein. Hiểu quy tắc này giúp bạn nghe người Đức nói phim ảnh, podcast mà không bị bỡ ngỡ.'
      }
    ],
    quiz: {
      question: 'Bạn của bạn hỏi: "Du hast keine Lust auf Kino?" (Bạn không có hứng đi xem phim à?). Bạn thực ra RẤT MUỐN đi. Bạn nên đáp lại như thế nào?',
      options: [
        'Doch, ich habe voll Bock!',
        'Ja, ich habe keine Lust.',
        'Nein, ich gehe ins Kino.'
      ],
      answer: 0,
      explanation: 'Khi câu hỏi ở dạng phủ định (keine Lust) mà ta muốn khẳng định ngược lại, phải dùng "Doch". "Voll Bock haben" là khẩu ngữ tự nhiên diễn tả việc rất hào hứng.'
    },
    sources: [
      { title: 'IDS grammis · Hệ thống ngữ pháp & khẩu ngữ tiếng Đức', url: 'https://grammis.ids-mannheim.de/' },
      { title: 'Duden · Từ điển khẩu ngữ & tiếng lóng tiếng Đức', url: 'https://www.duden.de/' }
    ]
  },
  {
    id: 'idioms',
    title: 'Thành ngữ & tục ngữ',
    intro: 'Kho tàng thành ngữ (Redewendungen) và tục ngữ (Sprichwörter) đậm đà bản sắc văn hóa Đức, giúp bài nói và bài viết của bạn sinh động, giàu hình tượng như người bản xứ.',
    cards: [
      {
        title: 'Chúc may mắn: "Die Daumen drücken" & "Schwein haben"',
        rule: 'Người Đức nắm ngón tay cái vào trong lòng bàn tay (Drücken) thay vì bắt chéo ngón tay (Cross fingers) như người Anh để chúc may mắn. Và khi gặp may bất ngờ, họ bảo mình "có một con heo".',
        examples: [
          ['Ich habe morgen meine B1-Prüfung. – Ich drücke dir ganz fest die Daumen!', 'Mai mình thi B1 rồi. – Mình chúc bạn thi thật may mắn và suôn sẻ nhé!'],
          ['Da hast du aber echt Schwein gehabt, dass der Zug Verspätung hatte!', 'Bạn may mắn thật đấy, đúng lúc chuyến tàu bị trễ nên mới kịp!']
        ],
        note: 'Trong văn hóa dân gian Đức thời Trung cổ, con heo tượng trưng cho sự no ấm, may mắn và thịnh vượng bất ngờ.'
      },
      {
        title: 'Bối rối, không hiểu: "Nur Bahnhof verstehen" & "Auf dem Schlauch stehen"',
        rule: 'Dùng khi hoàn toàn mất phương hướng, không nắm bắt được câu chuyện hoặc đột nhiên bị nghẽn suy nghĩ, chưa nghĩ ra câu trả lời.',
        examples: [
          ['Bei dieser grammatischen Erklärung verstehe ich nur Bahnhof.', 'Nghe cách giải thích ngữ pháp này tôi chẳng hiểu mô tê gì cả.'],
          ['Entschuldige, ich stand gerade auf dem Schlauch. Kannst du das noch mal erklären?', 'Xin lỗi nhé, nãy giờ đầu óc mình bị đơ/nghẽn chưa nghĩ ra. Bạn giải thích lại được không?']
        ],
        note: '"Auf dem Schlauch stehen" bắt nguồn từ hình ảnh ai đó giẫm lên ống nước cứu hỏa làm nước không thể chảy qua được.'
      },
      {
        title: 'Mù quáng hoặc không nhận ra điều rõ ràng: "Tomaten auf den Augen haben"',
        rule: 'Thành ngữ dí dỏm dùng khi ai đó không nhìn thấy một vật đang sờ sờ ngay trước mắt mình hoặc bỏ qua một sự thật hiển nhiên.',
        examples: [
          ['Wo ist denn meine Brille? – Sie liegt doch direkt vor dir! Hast du Tomaten auf den Augen?', 'Kính của mình đâu rồi nhỉ? – Nó nằm ngay trước mặt cậu kìa! Cậu có bị mù màu/mù dở không đấy?'],
          ['Er hat nicht bemerkt, dass sie traurig war. Er hatte wohl Tomaten auf den Augen.', 'Anh ấy đã không nhận ra cô ấy đang buồn. Có lẽ anh ấy quá vô tâm không thấy gì.']
        ],
        note: 'Đây là câu nói trêu đùa quen thuộc giữa bạn bè, người thân trong gia đình khi tìm đồ thất lạc.'
      },
      {
        title: 'Lỡ lời & Tạo tình huống khó xử: "Ins Fettnäpfchen treten"',
        rule: 'Nói hoặc làm điều gì đó vô ý khiến người khác bị tổn thương, xấu hổ hoặc làm bầu không khí trở nên ngượng ngùng.',
        examples: [
          ['Ich habe sie gefragt, wann das Baby kommt, aber sie war gar nicht schwanger. Da bin ich voll ins Fettnäpfchen getreten!', 'Tôi lỡ hỏi khi nào cô ấy sinh em bé, nhưng cô ấy đâu có mang thai. Đúng là một phen muối mặt/hố to!'],
          ['Sei vorsichtig mit deinen Witzen, sonst trittst du schnell ins Fettnäpfchen.', 'Hãy cẩn thận với những câu đùa của bạn, nếu không sẽ rất dễ chạm nọc người khác đấy.']
        ],
        note: '"Fettnäpfchen" xưa kia là khay mỡ để tra dầu cho ủng da đặt bên ngưỡng cửa nhà; nếu khách bước chân dẫm vào sẽ làm bẩn cả sàn nhà.'
      },
      {
        title: 'Một công đôi việc: "Zwei Fliegen mit einer Klappe schlagen"',
        rule: 'Giải quyết được hai vấn đề hoặc đạt được hai mục tiêu chỉ bằng một hành động duy nhất (tương đương "Nhất cử lưỡng tiện" trong tiếng Việt).',
        examples: [
          ['Wenn ich mit dem Fahrrad zur Arbeit fahre, schlage ich zwei Fliegen mit einer Klappe: Ich spare Geld und tue etwas für meine Fitness.', 'Đi xe đạp đi làm tôi được cả đôi đường: vừa tiết kiệm tiền xăng lại vừa rèn luyện thể lực.'],
          ['Wir können das Treffen mit dem Einkaufen verbinden und so zwei Fliegen mit einer Klappe schlagen.', 'Bọn mình có thể kết hợp buổi gặp mặt với việc đi mua sắm luôn, một công đôi việc.']
        ]
      },
      {
        title: 'Quyết tâm vượt khó: "Die Zähne zusammenbeißen" & "Übung macht den Meister"',
        rule: 'Khích lệ tinh thần kiên trì, cắn răng chịu đựng khó khăn để hoàn thành mục tiêu đến cùng.',
        examples: [
          ['Die letzten Tage vor der Prüfung sind hart, aber du musst jetzt die Zähne zusammenbeißen.', 'Những ngày cuối trước kỳ thi rất vất vả, nhưng lúc này bạn phải cắn răng kiên trì vượt qua.'],
          ['Niemand spricht von Anfang an perfekt Deutsch. Übung macht den Meister!', 'Chẳng ai vừa bắt đầu đã nói tiếng Đức hoàn hảo cả. Có công mài sắt, có ngày nên kim!']
        ],
        note: '"Übung macht den Meister" là một trong những câu tục ngữ được người Đức trích dẫn nhiều nhất trong việc học tập và rèn nghề.'
      },
      {
        title: 'Nói thẳng thắn: "Die Dinge beim Namen nennen" vs. "Um den heißen Brei herumreden"',
        rule: 'Văn hóa Đức đề cao tính trực diện. "Um den heißen Brei herumreden" là nói vòng vo tam quốc, né tránh vấn đề chính.',
        examples: [
          ['Hör auf, um den heißen Brei herumzureden, und sag mir endlich die Wahrheit!', 'Thôi đừng nói vòng vo tam quốc nữa, hãy nói cho tôi sự thật ngay đi!'],
          ['Wir müssen die Probleme offen ansprechen und die Dinge beim Namen nennen.', 'Chúng ta phải thẳng thắn đối diện với các vấn đề và gọi đúng tên sự thật.']
        ],
        note: 'Hình ảnh ẩn dụ: chiếc bát cháo nóng, người đó chỉ dám thổi quanh mép bát mà không dám chạm vào phần cháo đặc ở giữa.'
      },
      {
        title: 'Chính xác hoàn toàn: "Den Nagel auf den Kopf treffen"',
        rule: 'Diễn tả việc ai đó đưa ra một nhận định, phân tích hoặc câu trả lời hoàn toàn trúng tim đen, chính xác từng chi tiết.',
        examples: [
          ['Mit deiner Analyse hast du den Nagel auf den Kopf getroffen.', 'Với bài phân tích của mình, bạn đã đánh trúng ngay trọng tâm vấn đề rồi đấy.'],
          ['Seine Kritik trifft genau den Nagel auf den Kopf.', 'Lời phê bình của anh ấy hoàn toàn chính xác không lệch đi đâu được.']
        ]
      }
    ],
    quiz: {
      question: 'Bạn muốn nói: "Bằng hành động này, tôi giải quyết được cả hai việc cùng lúc (một công đôi việc)". Thành ngữ nào đúng?',
      options: [
        'Ich schlage zwei Fliegen mit einer Klappe.',
        'Ich drücke zwei Daumen.',
        'Ich verstehe nur zwei Bahnhöfe.'
      ],
      answer: 0,
      explanation: '"Zwei Fliegen mit einer Klappe schlagen" nghĩa đen là đập chết hai con ruồi bằng một cái vỉ, tương đương "một công đôi việc / nhất cử lưỡng tiện".'
    },
    sources: [
      { title: 'Deutsche Welle · Das sagt man so! (Video & Audio)', url: 'https://learngerman.dw.com/de/das-sagt-man-so/c-54413000' },
      { title: 'Redensarten-Index · Tra cứu thành ngữ tiếng Đức chuẩn xác', url: 'https://www.redensarten-index.de/' }
    ]
  },
  {
    id: 'ipa',
    title: 'IPA & phát âm',
    intro: 'Cẩm nang phiên âm quốc tế (IPA) và kỹ thuật phát âm chuẩn Đức: từ các nguyên âm biến âm Umlaut, phân biệt âm dài ngắn, âm tắc thanh môn (Knacklaut) đến cứng hóa âm cuối.',
    cards: [
      {
        title: 'Nguyên âm dài vs. Nguyên âm ngắn',
        rule: 'Độ dài nguyên âm trong tiếng Đức thay đổi hoàn toàn nghĩa của từ. Ký hiệu [ː] sau nguyên âm trong IPA biểu thị âm dài và căng; không có [ː] là âm ngắn và thả lỏng.',
        examples: [
          ['bieten [ˈbiːtən] (đề nghị) – bitten [ˈbɪtən] (xin xỏ, yêu cầu)', 'Khẩu hình [iː] căng mỉm cười; khẩu hình [ɪ] hơi thả lỏng hàm.'],
          ['Staat [ʃtaːt] (quốc gia) – Stadt [ʃtat] (thành phố)', 'Âm [aː] mở sâu vòm họng; âm [a] phát âm dứt khoát ngắn.'],
          ['Ofen [ˈoːfən] (cái lò) – offen [ˈɔfən] (mở cửa)', 'Âm [oː] tròn môi chặt chẽ; âm [ɔ] mở khẩu hình rộng hơn.']
        ],
        note: 'Mẹo nhớ: Nguyên âm đứng trước 1 phụ âm thường là âm dài (đặc biệt khi có h câm hoặc ie); nguyên âm đứng trước phụ âm kép (tt, mm, ff, ck) luôn là âm ngắn.'
      },
      {
        title: 'Bí quyết phát âm chuẩn hai âm Umlaut: Ü [yː]/[ʏ] và Ö [øː]/[œ]',
        rule: 'Tuyệt đối không đọc Ü thành "u" hay Ö thành "ô". Hãy dùng kỹ thuật chuyển khẩu hình từ nguyên âm cơ bản.',
        examples: [
          ['Cách tạo âm Ü: Phát âm chữ [iː], giữ nguyên vị trí đầu lưỡi tì răng dưới, rồi chúm môi tròn về phía trước như thổi sáo.', 'fühlen [ˈfyːlən] (cảm thấy) khác với füllen [ˈfʏlən] (đổ đầy)'],
          ['Cách tạo âm Ö: Phát âm chữ [eː], giữ nguyên vị trí lưỡi, rồi tròn môi lại.', 'schön [ʃøːn] (đẹp) khác với schon [ʃoːn] (đã rồi)']
        ],
        note: 'Lỗi người Việt hay gặp: Nhầm lẫn giữa "schon" (đã) và "schön" (đẹp). Hãy tập nhìn gương chúm môi để kiểm tra phản xạ.'
      },
      {
        title: 'Phân biệt Ich-Laut [ç] và Ach-Laut [x]',
        rule: 'Quy tắc vị trí: Sau các nguyên âm a, o, u, au -> phát âm Ach-Laut [x] ở sâu trong cuống họng. Sau e, i, ä, ö, ü, eu, äu hoặc sau phụ âm (l, r, n) -> phát âm Ich-Laut [ç] đẩy hơi qua kẽ vòm miệng mềm.',
        examples: [
          ['Ach-Laut [x]: Bach [bax] (con suối), Buch [buːx] (quyển sách), machen [ˈmaxn̩] (làm)', 'Hơi cọ xát ở sâu gốc lưỡi gà.'],
          ['Ich-Laut [ç]: ich [ɪç] (tôi), nicht [nɪçt] (không), Küche [ˈkʏçə] (nhà bếp)', 'Đầu lưỡi chạm răng cửa dưới, thân lưỡi nâng sát vòm cứng trên tạo khe hẹp để luồng hơi lướt qua xì nhẹ.']
        ],
        note: 'Tuyệt đối không đọc "ich" thành "ích" hay "ít" trong tiếng Việt. Đây là âm xì hơi không rung dây thanh quản.'
      },
      {
        title: 'Âm R trong tiếng Đức: R vòm họng [ʁ] vs. R nguyên âm hóa [ɐ]',
        rule: 'Khi đứng đầu từ hoặc sau phụ âm, R được rung nhẹ ở cuống họng [ʁ]. Khi đứng ở cuối từ (đặc biệt là đuôi -er) hoặc sau nguyên âm dài, R được đọc thành nguyên âm lướt nhẹ [ɐ] (gần giống chữ "ơ/a" nhẹ thả lỏng).',
        examples: [
          ['R ở đầu từ [ʁ]: rot [ʁoːt] (màu đỏ), Reise [ˈʁaɪzə] (chuyến đi)', 'Rung nhẹ luồng hơi tại lưỡi gà ở cuống họng.'],
          ['R ở cuối từ [ɐ]: Vater [ˈfaːtɐ] (người cha), Wasser [ˈvasɐ] (nước), wer [veːɐ] (ai)', 'Đọc đuôi -er nhẹ nhàng như âm "ơ" mở hơi nghiêng về "a", không uốn lưỡi.']
        ],
        note: 'Đừng cố gắng rung đầu lưỡi quá mạnh như tiếng Nga hay tiếng Tây Ban Nha. Trong tiếng Đức hiện đại chuẩn, âm R vòm họng nhẹ nhàng hơn nhiều.'
      },
      {
        title: 'Cứng hóa âm cuối (Auslautverhärtung)',
        rule: 'Các phụ âm hữu thanh b, d, g, v khi đứng ở cuối một từ hoặc cuối một âm tiết sẽ bị biến đổi thành phụ âm vô thanh tương ứng: b → [p], d → [t], g → [k], v → [f].',
        examples: [
          ['Tag [taːk] (chữ g đọc là [k]) – nhưng Tage [ˈtaːɡə] (chữ g lại là [ɡ])', 'ngày – những ngày'],
          ['und [ʊnt] (chữ d đọc là [t]) – Bild [bɪlt] (bức tranh)', 'và – bức tranh'],
          ['ab [ap] (chữ b đọc là [p]) – gelb [ɡɛlp] (màu vàng)', 'từ – màu vàng']
        ],
        note: 'Hiện tượng này xảy ra hoàn toàn tự nhiên đối với người bản xứ Đức, nắm vững sẽ giúp bạn phát âm chắc và chuẩn âm điệu đặc trưng của tiếng Đức.'
      },
      {
        title: 'Âm tắc thanh môn (Knacklaut / Glottal Stop [ʔ])',
        rule: 'Trước mọi từ hoặc thành phần gốc từ bắt đầu bằng một nguyên âm, người Đức ngắt luồng khí ở thanh quản một tích tắc trước khi bật âm nguyên âm đó ra. Đây chính là lý do tiếng Đức nghe có nhịp ngắt dứt khoát, không nối tuôn trào như tiếng Pháp hay tiếng Anh.',
        examples: [
          ['Theater [teˈʔaːtɐ] – ngắt giữa e và a thay vì lướt mượt qua nhau', 'nhà hát'],
          ['beantworten [bəˈʔantvɔʁtn̩] – ngắt rõ rệt giữa tiền tố be- và gốc antworten', 'trả lời câu hỏi'],
          ['Ich esse einen Apfel [ʔɪç ˈʔɛsə ˈʔaɪnən ˈʔapfl̩]', 'Tôi ăn một quả táo (từng từ đều có lực bật ngắt thanh quản)']
        ],
        note: 'Chính âm Knacklaut này giúp người Đức phân biệt rõ ràng ranh giới giữa các từ ghép và tiền tố.'
      },
      {
        title: 'Các phụ âm ghép đặc biệt: sp/st thành [ʃp]/[ʃt], pf, z [ts]',
        rule: 'Khi s đứng trước p hoặc t ở đầu từ hoặc đầu âm tiết gốc, nó luôn phát âm thành âm nặng [ʃ] (như chữ "s" nặng). Chữ z luôn phát âm là [ts].',
        examples: [
          ['Sport [ʃpɔʁt], sprechen [ˈʃpʁɛçn̩], Straße [ˈʃtʁaːsə]', 'thể thao, nói, đường phố'],
          ['Zug [tsuːk], Zeit [tsaɪt], Zimmer [ˈtsɪmɐ]', 'tàu hỏa, thời gian, căn phòng'],
          ['Apfel [ˈʔapfl̩], Pferd [pfeːɐ̯t]', 'quả táo, con ngựa (bật âm [p] đồng thời đẩy luồng hơi [f] ngay lập tức)']
        ],
        note: 'Tuyệt đối không đọc z thành "d" hay "gi" tiếng Việt. Hãy đọc như chữ "t" kết hợp "s" nhanh dứt khoát: [ts].'
      },
      {
        title: 'Trọng âm từ và nhịp điệu câu (Wortakzent & Intonation)',
        rule: 'Tiền tố tách (an-, auf-, aus-, ein-, mit-, vor...) luôn nhận trọng âm chính. Tiền tố không tách (be-, emp-, ent-, er-, ge-, miss-, ver-, zer-) không bao giờ nhận trọng âm.',
        examples: [
          ['ˈaufstehen, ˈeinkaufen, ˈmitkommen', 'Trọng âm rơi mạnh vào âm tiết đầu tiên.'],
          ['beˈsuchen, verˈstehen, erˈklären', 'Trọng âm rơi vào thân động từ phía sau.']
        ],
        note: 'Đặt sai trọng âm của từ có thể khiến người Đức không nhận ra từ bạn đang nói dù các chữ cái đều đúng.'
      }
    ],
    quiz: {
      question: 'Từ "Straße" có âm đầu "st-" được phiên âm và phát âm chuẩn xác như thế nào trong IPA?',
      options: ['[ʃt]', '[st]', '[ts]'],
      answer: 0,
      explanation: 'Trong tiếng Đức chuẩn, s đứng trước t hoặc p ở đầu từ hoặc đầu gốc từ luôn được đọc thành âm [ʃ] nặng: Straße [ˈʃtʁaːsə].'
    },
    sources: [
      { title: 'Goethe-Institut Việt Nam · Laute(r) bitte! Luyện âm tiếng Đức', url: phonetics },
      { title: 'Goethe-Institut · Aussprachetutorials chuyên sâu', url: 'https://www.goethe.de/prj/dlp/de/unterrichtsmaterial/aussprachetutorials' },
      { title: 'Duden Aussprachewörterbuch · Bảng quy chuẩn ngữ âm Duden', url: 'https://www.duden.de/' }
    ]
  },
  {
    id: 'culture',
    title: 'Văn hóa Đức',
    intro: 'Khám phá văn hóa và phong cách sống đặc trưng của người Đức: sự đúng giờ tuyệt đối, phân loại rác, văn hóa tiền mặt, nguyên tắc giữ yên tĩnh và sự thẳng thắn chân thành.',
    cards: [
      {
        title: 'Quy tắc xưng hô: "Du" vs. "Sie"',
        rule: 'Người Đức phân biệt ranh giới rất rõ ràng giữa thân mật (duzen) và trang trọng, lịch sự (siezen). Tại trường học, công sở mới hoặc khi gặp người lạ ngoài đường, luôn luôn xưng "Sie".',
        examples: [
          ['Könnten Sie mir bitte helfen? (Trang trọng với người chưa quen biết)', 'Ông/Bà có thể vui lòng giúp tôi được không?'],
          ['Darf ich Ihnen das Du anbieten? (Lời mời chuyển sang xưng hô thân mật)', 'Tôi có thể đề nghị chúng ta xưng "du" với nhau được không?'],
          ['Wir duzen uns hier alle im Team. (Văn hóa công ty trẻ, startup)', 'Ở đội ngũ này tất cả chúng tôi đều xưng "du" với nhau.']
        ],
        note: 'Nguyên tắc vàng: Người có cấp bậc cao hơn hoặc người lớn tuổi hơn mới là người có quyền chủ động đề nghị chuyển sang xưng "Du".'
      },
      {
        title: 'Đúng giờ là thước đo của sự tôn trọng (Pünktlichkeit)',
        rule: 'Ở Đức, đúng giờ có nghĩa là đến trước giờ hẹn từ 5 đến 10 phút. Đến muộn dù chỉ 5 phút mà không báo trước bị coi là thiếu tôn trọng và thiếu chuyên nghiệp.',
        examples: [
          ['Fünf Minuten vor der Zeit ist des Deutschen Pünktlichkeit.', 'Thành ngữ: Năm phút trước giờ hẹn mới chính là sự đúng giờ của người Đức.'],
          ['Es tut mir sehr leid, die Bahn hat Verspätung. Ich komme circa zehn Minuten später.', 'Tôi rất xin lỗi, tàu bị trễ. Tôi sẽ đến muộn khoảng 10 phút.']
        ],
        note: 'Nếu nhận thấy mình có khả năng bị muộn, hãy nhấc máy gọi điện hoặc nhắn tin báo ngay trước giờ hẹn ít nhất 15 phút kèm lý do và số phút dự kiến đến.'
      },
      {
        title: 'Giờ yên tĩnh và Ngày Chủ Nhật tĩnh lặng (Ruhezeit & Sonntagsruhe)',
        rule: 'Luật pháp Đức quy định giờ giữ yên tĩnh (thường từ 22:00 đêm đến 06:00/07:00 sáng hôm sau và cả ngày Chủ Nhật cùng các ngày lễ chính thức).',
        examples: [
          ['Sonntags sind alle Supermärkte und Geschäfte geschlossen.', 'Vào Chủ Nhật, tất cả các siêu thị và cửa hàng mua sắm đều đóng cửa.'],
          ['Bitte am Sonntag nicht bohren, keinen Rasen mähen und keine laute Musik hören!', 'Xin vui lòng không khoan tường, không cắt cỏ và không bật nhạc lớn vào Chủ Nhật!']
        ],
        note: 'Người vi phạm Ruhezeit có thể bị hàng xóm phàn nàn trực tiếp, báo ban quản lý nhà hoặc thậm chí gọi cảnh sát xử phạt hành chính (Ordnungsamt).'
      },
      {
        title: 'Nghệ thuật phân loại rác chi tiết (Mülltrennung & Pfandsystem)',
        rule: 'Nước Đức là một trong những quốc gia đi đầu thế giới về tái chế. Mỗi hộ gia đình đều có các thùng rác riêng biệt theo màu sắc.',
        examples: [
          ['Blauer Eimer (Thùng xanh dương): Giấy vụn, bìa carton (Altpapier).', 'Không bỏ giấy ăn dính dầu mỡ vào đây.'],
          ['Gelber Sack / Gelbe Tonne (Thùng vàng): Bao bì nhựa, vỏ hộp sữa, kim loại (Verpackungen).', 'Các vật liệu có logo điểm xanh "Grüner Punkt".'],
          ['Braune Tonne (Thùng nâu): Rác hữu cơ, thức ăn thừa, vỏ rau củ quả (Biomüll).', 'Dùng để ủ phân sinh học.'],
          ['Schwarze / Graue Tonne (Thùng đen/xám): Rác thải còn lại không thể tái chế (Restmüll).', 'Túi hút bụi, đầu lọc thuốc lá, tã bỉm.']
        ],
        note: 'Chai nhựa và lon nước có in logo mũi tên xoay tròn (Pfandlogo) mang giá trị tiền hoàn trả (0.25€/chai). Đừng vứt sọt rác, hãy mang ra máy tự động ở siêu thị đổi lại tiền!'
      },
      {
        title: 'Văn hóa tiền mặt (Barzahlung) & Tiền boa (Trinkgeld)',
        rule: 'Dù công nghệ thanh toán thẻ đã phổ biến hơn, người Đức vẫn rất gắn bó với tiền mặt (Bargeld) vì coi trọng quyền riêng tư và kiểm soát chi tiêu cá nhân.',
        examples: [
          ['Nur Barzahlung möglich! (Biển báo thường gặp ở quán ăn nhỏ, chợ phiên)', 'Ở đây chỉ nhận tiền mặt!'],
          ['Haben Sie es vielleicht passend? (Người thu ngân hỏi tiền đúng số lượng)', 'Bạn có tiền vừa vặn đúng số tiền lẻ này không?'],
          ['Trinkgeld: Thường để lại 5% - 10% trên tổng hóa đơn nếu bạn hài lòng với dịch vụ.', 'Ví dụ bữa ăn 27€ thì làm tròn lên 30€ và nói "Stimmt so!".']
        ],
        note: 'Luôn mang theo một ít tiền mặt trong ví (khoảng 20 - 50€) để phòng trường hợp tiệm bánh mì, quán kem hay máy bán vé chỉ chấp nhận tiền giấy/tiền xu.'
      },
      {
        title: 'Giao tiếp thẳng thắn, trực diện (Direktheit statt Höflichkeitsfloskeln)',
        rule: 'Người Đức có phong cách giao tiếp đi thẳng vào vấn đề ("Sachlichkeit"). Họ nói chính xác điều họ nghĩ, phê bình công việc chứ không công kích cá nhân.',
        examples: [
          ['Das ist fachlich nicht korrekt. Wir müssen diesen Teil noch einmal überarbeiten.', 'Về mặt chuyên môn phần này chưa đúng. Chúng ta cần phải làm lại phần này.'],
          ['Ich bin da anderer Meinung. Lass uns die Vor- und Nachteile abwägen.', 'Tôi có quan điểm khác về việc này. Hãy cùng cân nhắc ưu và nhược điểm.']
        ],
        note: 'Đừng cảm thấy bị xúc phạm khi người Đức góp ý trực tiếp. Họ coi sự thẳng thắn là tính trung thực và giúp tiết kiệm thời gian cho cả hai bên.'
      },
      {
        title: 'Văn hóa tiệc nướng & Thư giãn sau giờ làm (Grillen & Feierabend)',
        rule: 'Mùa hè tại Đức gắn liền với những buổi nướng xúc xích thịt ngoài công viên hoặc ban công. Và khi hết giờ làm việc, người Đức bước vào trạng thái "Feierabend" tuyệt đối.',
        examples: [
          ['Schönen Feierabend! Bis morgen!', 'Chúc bạn có buổi tối nghỉ ngơi vui vẻ sau giờ làm! Hẹn gặp lại ngày mai!'],
          ['Am Wochenende schmeißen wir den Grill an. Kommst du auch vorbei?', 'Cuối tuần này bọn mình nhóm bếp nướng thịt ngoài trời đấy. Bạn có ghé qua không?']
        ],
        note: 'Feierabend là ranh giới bất khả xâm phạm giữa công việc và đời sống cá nhân. Đồng nghiệp và sếp thường không nhắn tin, gọi điện công việc trong khung giờ này.'
      },
      {
        title: 'Tôn trọng quyền riêng tư & Bảo mật dữ liệu (Datenschutz & Privatsphäre)',
        rule: 'Người Đức cực kỳ nhạy cảm với việc chia sẻ thông tin cá nhân, hình ảnh và dữ liệu riêng tư.',
        examples: [
          ['Darf ich ein Foto von uns machen und online stellen?', 'Tôi có thể chụp một bức ảnh của chúng ta và đăng lên mạng xã hội không?'],
          ['Datenschutz ist mir sehr wichtig.', 'Bảo mật dữ liệu cá nhân là điều vô cùng quan trọng đối với tôi.']
        ],
        note: 'Luôn xin phép trước khi chụp ảnh người khác, đặc biệt là trẻ em, và trước khi đăng tải bất kỳ hình ảnh nào có mặt người khác lên mạng xã hội.'
      }
    ],
    quiz: {
      question: 'Tại Đức, hành động nào sau đây bị coi là vi phạm nghiêm trọng quy định giờ yên tĩnh (Ruhezeit) vào ngày Chủ Nhật?',
      options: [
        'Khoan tường sửa chữa nhà hoặc dùng máy cắt cỏ gây ồn ào.',
        'Đi dạo trong công viên cùng gia đình.',
        'Đọc sách và nấu ăn trong bếp.'
      ],
      answer: 0,
      explanation: 'Vào ngày Chủ Nhật và các ngày nghỉ lễ, luật pháp Đức nghiêm cấm các hoạt động phát ra tiếng ồn lớn như khoan đục, cắt cỏ, gây ảnh hưởng đến sự nghỉ ngơi của hàng xóm.'
    },
    sources: [
      { title: 'Goethe-Institut · Mein Weg nach Deutschland (Sống và làm việc tại Đức)', url: 'https://www.goethe.de/prj/mwd/de/index.html' },
      { title: 'Tatsachen über Deutschland · Cổng thông tin chính thức về xã hội & văn hóa Đức', url: 'https://www.tatsachen-ueber-deutschland.de/' }
    ]
  },
  {
    id: 'study',
    title: 'Cách tự học',
    intro: 'Các phương pháp học ngoại ngữ khoa học dựa trên nghiên cứu não bộ và kinh nghiệm thực chiến: Spaced Repetition, học theo cụm (Chunks), Shadowing nhại giọng và tư duy bằng tiếng Đức.',
    cards: [
      {
        title: 'Học từ theo cụm ngữ cảnh (Chunks & Kollokationen)',
        rule: 'Đừng bao giờ học từ vựng đơn lẻ không kèm ngữ cảnh. Não bộ con người ghi nhớ và tái hiện ngôn ngữ qua các "khối" (Chunks) gồm: mạo từ + danh từ + động từ đi kèm + giới từ.',
        examples: [
          ['Thay vì chỉ học "Termin" (lịch hẹn), hãy học trọn vẹn: "einen Termin vereinbaren" (đặt lịch hẹn) hoặc "den Termin absagen" (hủy lịch hẹn).', 'Dùng được ngay vào câu thực tế mà không cần suy nghĩ chia cách.'],
          ['Thay vì học "Entscheidung", hãy học: "eine Entscheidung treffen" (đưa ra một quyết định).', 'Động từ cố định đi kèm giúp bạn nói tự nhiên như người bản xứ.']
        ],
        note: 'Viết cả câu ví dụ ngắn của riêng bạn cho mỗi cụm từ mới. Não bộ nhớ sâu sắc hơn 300% khi thông tin liên quan trực tiếp đến cuộc sống của bạn.'
      },
      {
        title: 'Hệ thống Lặp lại ngắt quãng (Spaced Repetition System - SRS)',
        rule: 'Dựa trên Đường cong quên lãng Ebbinghaus, bạn cần ôn lại từ vựng ngay trước thời điểm não bộ chuẩn bị quên nó: ngày 1 -> ngày 3 -> ngày 7 -> ngày 14 -> ngày 30.',
        examples: [
          ['Ôn tập chủ động (Active Recall): Nhìn từ tiếng Việt, tự nói to câu tiếng Đức trước khi lật thẻ xem đáp án.', 'Kích hoạt đường dẫn nơ-ron mạnh mẽ gấp 5 lần so với đọc lướt thụ động.'],
          ['Phân loại độ khó: Thẻ nào khó nhớ thì hệ thống sẽ tự động xuất hiện thường xuyên hơn.', 'Tiết kiệm thời gian ôn tập, tập trung tối đa vào điểm yếu.']
        ],
        note: 'Chỉ cần 15-20 phút duy trì ôn thẻ flashcard mỗi ngày hiệu quả hơn gấp nhiều lần việc ngồi cày dồn 5 tiếng vào một ngày cuối tuần.'
      },
      {
        title: 'Kỹ thuật nhại giọng Shadowing để chuẩn hóa phát âm',
        rule: 'Nghe người bản xứ nói một câu ngắn (từ video, podcast hoặc audio chậm), sau đó lập tức nói nhại lại theo đúng ngữ điệu, nhịp điệu và cảm xúc của họ như một chiếc bóng (Shadow).',
        examples: [
          ['Bước 1: Nghe và đọc phụ đề để hiểu rõ nghĩa trọn vẹn của câu.', 'Đảm bảo hiểu đúng ngữ cảnh.'],
          ['Bước 2: Tắt phụ đề, nghe từng câu, bấm tạm dừng và lặp lại thật to rõ ràng.', 'Mô phỏng cả tiếng thở và trọng âm từ.'],
          ['Bước 3: Ghi âm lại giọng của chính mình và đối chiếu trực tiếp với file gốc.', 'Nhận ra ngay các âm cuối mình vô tình nuốt mất.']
        ],
        note: 'Luyện 5-10 phút Shadowing mỗi ngày sẽ giải quyết triệt để vấn đề "nghe hiểu nhưng mở miệng ra nói thì ngắc ngứ".'
      },
      {
        title: 'Tự độc thoại & Tư duy bằng tiếng Đức (Immer auf Deutsch denken)',
        rule: 'Hãy tập thói quen chuyển đổi suy nghĩ thầm trong đầu sang tiếng Đức về những việc bạn đang làm xung quanh căn phòng.',
        examples: [
          ['Khi pha cà phê: "Jetzt koche ich mir einen Kaffee. Die Milch steht im Kühlschrank."', 'Bây giờ tôi pha một ly cà phê. Sữa nằm trong tủ lạnh.'],
          ['Khi nhìn ra cửa sổ: "Heute ist das Wetter ziemlich grau. Ich glaube, es wird bald regnen."', 'Hôm nay thời tiết khá âm u. Tôi nghĩ trời sắp mưa rồi.']
        ],
        note: 'Loại bỏ bước trung gian dịch xuôi ngược Việt - Đức trong đầu giúp tốc độ phản xạ giao tiếp tăng lên vượt bậc.'
      },
      {
        title: 'Viết nhật ký ngắn 3-5 câu mỗi ngày (Micro-Journaling)',
        rule: 'Mỗi tối trước khi đi ngủ, dành đúng 5 phút viết 3 câu đơn giản về ngày hôm nay: 1 việc đã làm, 1 cảm xúc và 1 kế hoạch ngày mai.',
        examples: [
          ['Heute habe ich lange gearbeitet, aber die Arbeit hat Spaß gemacht.', 'Hôm nay tôi đã làm việc nhiều giờ, nhưng công việc rất vui.'],
          ['Am Abend bin ich mit einem Freund spazieren gegangen.', 'Vào buổi tối tôi đã đi dạo cùng một người bạn.'],
          ['Morgen möchte ich früh aufstehen und für die Prüfung lernen.', 'Ngày mai tôi muốn dậy sớm và học bài cho kỳ thi.']
        ],
        note: 'Sử dụng cấu trúc Perfekt đã học để diễn đạt quá khứ. Việc viết thường xuyên giúp biến ngữ pháp lý thuyết thành phản xạ cơ bắp.'
      },
      {
        title: 'Tắm ngôn ngữ thụ động có chủ đích (Passive Immersion)',
        rule: 'Tận dụng các khoảng thời gian chết trong ngày (khi rửa bát, nấu ăn, chạy bộ, đi tàu xe) để bật radio hoặc podcast tiếng Đức làm nền âm thanh.',
        examples: [
          ['Các kênh podcast dễ tiếp cận: "Slow German" của Annik Rubens, "Easy German" trên YouTube/Spotify.', 'Nói tốc độ vừa phải, từ ngữ chuẩn chỉ.'],
          ['Đài radio tin tức thực tế: Deutschlandfunk (DLF), DW Deutsch lernen.', 'Làm quen với nhịp điệu báo chí và thông tin thời sự Đức.']
        ],
        note: 'Không cần hiểu 100% từng từ. Mục tiêu của việc tắm âm là giúp tai quen với tần số âm thanh, ngữ điệu lên xuống và ngắt nhịp tự nhiên của tiếng Đức.'
      },
      {
        title: 'Quy tắc nguyên tử: 20 phút liên tục mỗi ngày (Micro-Habits)',
        rule: 'Não bộ học ngoại ngữ qua tần suất xuất hiện lặp lại hàng ngày, không phải qua những buổi học dồn dập rồi bỏ bẵng cả tuần.',
        examples: [
          ['Chia thời gian biểu mẫu 20 phút: 7 phút ôn 20 thẻ từ vựng SRS + 8 phút đọc hiểu một đoạn văn ngắn + 5 phút luyện nói to 3 câu mới.', 'Nhẹ nhàng, không gây áp lực tinh thần.'],
          ['Duy trì chuỗi ngày học liên tục (Streak): Thà học 15 phút mỗi ngày còn hơn 1 tuần chỉ học 1 lần vào Chủ Nhật.']
        ],
        note: 'Sự kiên trì đều đặn (Konsistenz) chính là yếu tố số một phân định giữa người nói tiếng Đức trôi chảy và người bỏ cuộc giữa chừng.'
      }
    ],
    quiz: {
      question: 'Phương pháp nào sau đây giúp bạn nhớ từ vựng sâu sắc và ứng dụng ngay vào giao tiếp tự nhiên nhất?',
      options: [
        'Học từ theo cụm ngữ cảnh hoàn chỉnh (Chunks) kèm câu ví dụ cụ thể.',
        'Học danh sách từ vựng đơn lẻ không mạo từ và không câu ví dụ.',
        'Đọc lướt qua một lần và không bao giờ ôn tập lại.'
      ],
      answer: 0,
      explanation: 'Học từ theo cụm ngữ cảnh (Chunks) cung cấp đầy đủ mạo từ, giới từ và động từ đi kèm, giúp não bộ phản xạ câu nói hoàn chỉnh mà không cần lắp ghép từng từ đơn lẻ.'
    },
    sources: [
      { title: 'Goethe-Institut · Phương pháp tự học tiếng Đức hiệu quả', url: 'https://www.goethe.de/de/spr/ueb/sst.html' },
      { title: 'Easy German · Kênh học tiếng Đức qua hội thoại đường phố thực tế', url: 'https://www.easygerman.org/' }
    ]
  },
  {
    id: 'advanced',
    title: 'Luyện nâng cao C1',
    intro: 'Luyện diễn đạt chính xác và nối lập luận. Một cấu trúc dài chỉ hữu ích khi nghĩa, quan hệ logic và văn phong đều phù hợp.',
    cards: [
      {
        title: 'Danh từ hóa',
        rule: 'Có thể chuyển một mệnh đề sang cụm danh từ với giới từ. Khi chuyển, phải giữ đúng quan hệ nguyên nhân, thời gian hoặc nhượng bộ.',
        examples: [
          ['Weil die Kosten steigen, muss die Firma sparen.', 'Vì chi phí tăng, công ty phải tiết kiệm.'],
          ['Wegen des Anstiegs der Kosten muss die Firma sparen.', 'Do sự gia tăng chi phí, công ty phải tiết kiệm.']
        ],
        note: 'Wegen dùng Genitiv trong văn viết chuẩn. Không bỏ mất chủ thể hoặc ý phủ định khi chuyển cấu trúc.'
      },
      {
        title: 'Thuộc ngữ phân từ',
        rule: 'Partizip I thường gợi hành động đang diễn ra hoặc tính chất chủ động. Partizip II thường diễn tả kết quả hoặc nghĩa bị động với nhiều động từ chuyển tiếp.',
        examples: [
          ['die steigenden Preise', 'những mức giá đang tăng'],
          ['die gestern veröffentlichte Studie', 'nghiên cứu được công bố hôm qua']
        ],
        note: 'Tính từ hóa phân từ đứng trước danh từ vẫn phải có đuôi tính từ. Tránh kéo thuộc ngữ quá dài khiến câu khó đọc.'
      },
      {
        title: 'Tường thuật bằng Konjunktiv I',
        rule: 'Trong văn phong báo chí, Konjunktiv I thường đánh dấu lời được thuật lại. Dạng er/sie sei hoặc habe giúp phân biệt với lời khẳng định trực tiếp của người viết.',
        examples: [
          ['Die Sprecherin erklärt, die Lage sei stabil.', 'Người phát ngôn giải thích rằng tình hình ổn định.'],
          ['Er berichtet, er habe die Unterlagen bereits geschickt.', 'Anh ấy cho biết đã gửi hồ sơ rồi.']
        ],
        note: 'Konjunktiv I không đồng nghĩa người viết khẳng định lời đó là sai.'
      },
      {
        title: 'Nhượng bộ và đánh giá',
        rule: 'Obwohl dẫn câu phụ. Dennoch hoặc trotzdem nối ý ở câu chính. Bạn có thể vừa công nhận một điểm vừa nêu hạn chế.',
        examples: [
          ['Obwohl die Lösung teuer ist, bietet sie langfristige Vorteile.', 'Dù giải pháp đắt, nó đem lại lợi ích lâu dài.'],
          ['Die Lösung ist teuer. Dennoch halte ich sie für sinnvoll.', 'Giải pháp đắt. Tuy vậy, tôi cho rằng nó hợp lý.']
        ]
      }
    ],
    quiz: {
      question: 'Chọn câu đúng.',
      options: ['Dennoch ich halte sie für sinnvoll.', 'Dennoch halte ich sie für sinnvoll.'],
      answer: 1,
      explanation: 'Dennoch chiếm vị trí đầu của câu chính, động từ chia halte đứng thứ hai.'
    },
    sources: [
      { title: 'Deutsche Grammatik 2.0 · Các chủ điểm nâng cao', url: 'https://deutschegrammatik20.de/grammatik-ubungen/' },
      { title: 'Deutsche Grammatik 2.0 · Thuộc ngữ phân từ', url: 'https://deutschegrammatik20.de/komplexer-satz/partizipialkonstruktionen-2/' },
      { title: 'Deutsche Grammatik 2.0 · Konjunktiv quá khứ', url: 'https://deutschegrammatik20.de/konjunktiv/ubersicht-die-formen-des-konjunktivs-i-und-ii-vergangenheit-aktiv/' }
    ]
  },
  {
    id: 'dictionary',
    title: 'Tra từ',
    intro: 'Tra nghĩa theo ngữ cảnh, kiểm tra mạo từ và ví dụ, rồi lưu những từ bạn thực sự muốn ôn.',
    route: '/vocabulary/dictionary',
    action: 'Mở từ điển'
  },
  {
    id: 'games',
    title: 'Trò chơi',
    intro: 'Luyện phản xạ mạo từ với những danh từ đang học. Sau mỗi lượt, quay lại kiểm tra các từ bị nhầm.',
    route: '/game',
    action: 'Mở trò chơi'
  },
  {
    id: 'progress',
    title: 'Tiến độ cá nhân',
    intro: 'Xem các kết quả học đã được ghi nhận để chọn phần cần ôn tiếp.',
    route: '/progress',
    action: 'Xem tiến độ'
  }
];
