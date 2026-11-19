// ====================================================================
// SITUATION_TOPICS_B — Mẫu câu giao tiếp tiếng Đức theo chủ đề (phần B)
// Mỗi mẫu câu: 1 công thức + 6 ví dụ + 4 bài dịch Việt → Đức
// + 2 câu hội thoại + 1 trắc nghiệm (1 câu hỏi + 4 lựa chọn).
// Tổng: 3 chủ đề × 6 mẫu câu = 18 mẫu câu, 324 câu tiếng Đức.
// ====================================================================

export const SITUATION_TOPICS_B = [
  {
    id: 'restaurant',
    title: 'Nhà hàng & quán ăn',
    icon: '🍽️',
    patterns: [
      {
        id: 'ich-haette-gern',
        formula: 'Ich hätte gern …',
        vi: 'Tôi muốn …',
        note: 'Cách gọi món lịch sự nhất trong nhà hàng hay quán cà phê. „Ich hätte gern“ + danh từ ở dạng Akkusativ, lịch sự hơn „Ich will“ rất nhiều.',
        vocab: [['hätte gern', 'muốn (cách nói lịch sự)'], ['die Speisekarte', 'thực đơn'], ['der Kaffee', 'cà phê'], ['bestellen', 'gọi món']],
        examples: [
          { de: 'Ich hätte gern einen Kaffee, bitte.', vi: 'Cho tôi một ly cà phê.' },
          { de: 'Ich hätte gern die Tomatensuppe als Vorspeise.', vi: 'Tôi muốn dùng súp cà chua làm món khai vị.' },
          { de: 'Ich hätte gern ein Glas Wasser ohne Eis.', vi: 'Cho tôi một ly nước không đá.' },
          { de: 'Ich hätte gern das Schnitzel mit Pommes.', vi: 'Tôi muốn món thịt chiên với khoai tây chiên.' },
          { de: 'Ich hätte gern noch ein Stück Kuchen.', vi: 'Cho tôi thêm một miếng bánh nữa.' },
          { de: 'Ich hätte gern zwei Brötchen zum Mitnehmen.', vi: 'Tôi muốn hai cái bánh mì mang về.' }
        ],
        exercises: [
          { vi: 'Cho tôi một ly trà, làm ơn.', de: 'Ich hätte gern einen Tee, bitte.', hint: 'Ich hätte gern • einen Tee • bitte' },
          { vi: 'Tôi muốn món cá với cơm.', de: 'Ich hätte gern den Fisch mit Reis.', hint: 'Ich hätte gern • den Fisch • mit Reis' },
          { vi: 'Cho tôi thêm một ly nước cam.', de: 'Ich hätte gern noch ein Glas Orangensaft.', hint: 'Ich hätte gern • noch • ein Glas Orangensaft' },
          { vi: 'Tôi muốn một cái bánh sô-cô-la mang về.', de: 'Ich hätte gern einen Schokokuchen zum Mitnehmen.', hint: 'Ich hätte gern • einen Schokokuchen • zum Mitnehmen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich hätte gern einen Salat mit Hähnchen.', vi: 'Tôi muốn một đĩa salad với thịt gà.' },
          { who: 'Ben', de: 'Gern. Möchten Sie dazu ein Getränk?', vi: 'Được ạ. Chị có muốn gọi thêm đồ uống không?' }
        ],
        mcq: {
          q: 'Du bist im Restaurant und willst höflich ein Schnitzel bestellen. Was sagst du?',
          qVi: 'Bạn đang ở nhà hàng và muốn gọi món thịt chiên một cách lịch sự. Bạn nói gì?',
          options: ['Ich will ein Schnitzel.', 'Ich hätte gern ein Schnitzel.', 'Gib mir ein Schnitzel.', 'Ein Schnitzel, aber schnell!'],
          answer: 'Ich hätte gern ein Schnitzel.',
          why: '„Ich hätte gern“ là cách gọi món lịch sự nhất, còn „Ich will“ và „Gib mir“ nghe thô lỗ như ra lệnh.'
        }
      },
      {
        id: 'rechnung-bitte',
        formula: 'Die Rechnung, bitte!',
        vi: 'Cho tôi thanh toán!',
        note: 'Ở Đức bạn phải gọi nhân viên để xin hóa đơn, họ không tự mang ra. Nói „Die Rechnung, bitte!“ là đủ, ngắn gọn và lịch sự.',
        vocab: [['die Rechnung', 'hóa đơn'], ['zahlen', 'trả tiền'], ['getrennt', 'riêng (mỗi người trả phần mình)'], ['zusammen', 'chung (một hóa đơn)']],
        examples: [
          { de: 'Entschuldigung, wir möchten bitte zahlen.', vi: 'Xin lỗi, chúng tôi muốn thanh toán.' },
          { de: 'Könnten wir bitte die Rechnung haben?', vi: 'Chúng tôi có thể xin hóa đơn được không?' },
          { de: 'Wir möchten bitte getrennt zahlen.', vi: 'Chúng tôi muốn thanh toán riêng.' },
          { de: 'Kann ich bitte noch ein Glas Wasser haben?', vi: 'Cho tôi thêm một ly nước được không?' },
          { de: 'Stimmt so!', vi: 'Khỏi cần thối lại ạ!' },
          { de: 'Die Rechnung für Tisch fünf, bitte.', vi: 'Hóa đơn cho bàn số năm ạ.' }
        ],
        exercises: [
          { vi: 'Chúng tôi muốn thanh toán riêng.', de: 'Wir möchten getrennt zahlen.', hint: 'Wir möchten • getrennt • zahlen' },
          { vi: 'Tôi có thể trả bằng thẻ không?', de: 'Kann ich mit Karte bezahlen?', hint: 'Kann ich • mit Karte • bezahlen' },
          { vi: 'Cho tôi xin hóa đơn cho bàn số ba.', de: 'Die Rechnung für Tisch drei, bitte.', hint: 'Die Rechnung • für Tisch drei • bitte' },
          { vi: 'Tôi muốn trả tiền mặt.', de: 'Ich möchte bar zahlen.', hint: 'Ich möchte • bar • zahlen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Entschuldigung, die Rechnung, bitte!', vi: 'Xin lỗi, cho tôi thanh toán!' },
          { who: 'Ben', de: 'Gern. Zusammen oder getrennt?', vi: 'Được ạ. Thanh toán chung hay riêng ạ?' }
        ],
        mcq: {
          q: 'Ihr habt fertig gegessen und wollt bezahlen. Was sagst du zum Kellner?',
          qVi: 'Các bạn đã ăn xong và muốn thanh toán. Bạn nói gì với nhân viên phục vụ?',
          options: ['Ich möchte bitte zahlen.', 'Ich habe Hunger!', 'Noch einen Kaffee, bitte!', 'Wo ist die Toilette?'],
          answer: 'Ich möchte bitte zahlen.',
          why: 'Muốn thanh toán thì nói „Ich möchte bitte zahlen“ hoặc „Die Rechnung, bitte!“; các câu còn lại là than đói, gọi thêm cà phê hoặc hỏi nhà vệ sinh.'
        }
      },
      {
        id: 'schmeckt-es-dir',
        formula: 'Schmeckt es dir?',
        vi: 'Cậu thấy ngon không?',
        note: '„Schmecken“ là động từ chỉ vị ngon, dùng với Dativ: „Es schmeckt mir / dir / ihm“. Hỏi người khác món ăn có ngon không thì dùng „Schmeckt es dir?“ hoặc „Schmeckt dir das Essen?“.',
        vocab: [['schmecken', 'ngon, hợp vị'], ['lecker', 'ngon'], ['das Essen', 'món ăn, bữa ăn'], ['probieren', 'nếm thử']],
        examples: [
          { de: 'Schmeckt es euch?', vi: 'Các cậu thấy ngon không?' },
          { de: 'Schmeckt dir die Suppe?', vi: 'Cậu thấy súp ngon không?' },
          { de: 'Das Essen schmeckt mir sehr gut.', vi: 'Món này ngon lắm, tôi rất thích.' },
          { de: 'Schmeckt dir der Kuchen? Er ist selbst gemacht.', vi: 'Cậu thấy bánh ngon không? Bánh này tự làm đấy.' },
          { de: 'Mir schmeckt der Salat nicht so gut.', vi: 'Tôi thấy salad không ngon lắm.' },
          { de: 'Probier mal den Kuchen!', vi: 'Nếm thử bánh đi!' }
        ],
        exercises: [
          { vi: 'Bạn thấy món cá ngon không?', de: 'Schmeckt dir der Fisch?', hint: 'Schmeckt • dir • der Fisch' },
          { vi: 'Tôi thấy bánh này rất ngon.', de: 'Der Kuchen schmeckt mir sehr gut.', hint: 'Der Kuchen • schmeckt mir • sehr gut' },
          { vi: 'Cậu thấy trà ngon không?', de: 'Schmeckt dir der Tee?', hint: 'Schmeckt • dir • der Tee' },
          { vi: 'Tôi không thấy món súp ngon lắm.', de: 'Mir schmeckt die Suppe nicht so gut.', hint: 'Mir schmeckt • die Suppe • nicht so gut' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Schmeckt dir das Schnitzel?', vi: 'Cậu thấy thịt chiên ngon không?' },
          { who: 'Ben', de: 'Ja, es schmeckt sehr gut!', vi: 'Ừ, ngon lắm!' }
        ],
        mcq: {
          q: 'Dein Freund probiert dein Essen. Was fragst du ihn?',
          qVi: 'Bạn của bạn nếm món ăn của bạn. Bạn hỏi cậu ấy điều gì?',
          options: ['Schmeckt dir das Essen?', 'Wie heißt du?', 'Wo wohnst du?', 'Was kostet das?'],
          answer: 'Schmeckt dir das Essen?',
          why: 'Muốn hỏi người khác món ăn có ngon không thì dùng động từ „schmecken“ với Dativ; các câu còn lại hỏi tên, chỗ ở và giá tiền.'
        }
      },
      {
        id: 'tisch-reserviert',
        formula: 'Ich habe einen Tisch reserviert.',
        vi: 'Tôi đã đặt bàn.',
        note: '„Einen Tisch reservieren“ là đặt bàn trước. Khi đến nhà hàng, bạn nói câu này rồi đọc tên mình để nhân viên tìm bàn cho bạn.',
        vocab: [['reservieren', 'đặt trước'], ['der Tisch', 'cái bàn'], ['für zwei Personen', 'cho hai người'], ['der Name', 'tên']],
        examples: [
          { de: 'Ich habe einen Tisch für heute Abend reserviert.', vi: 'Tôi đã đặt bàn cho tối nay.' },
          { de: 'Wir haben einen Tisch für vier Personen reserviert.', vi: 'Chúng tôi đã đặt bàn cho bốn người.' },
          { de: 'Der Tisch ist auf den Namen Müller reserviert.', vi: 'Bàn được đặt dưới tên Müller.' },
          { de: 'Ich möchte einen Tisch für morgen Abend reservieren.', vi: 'Tôi muốn đặt bàn cho tối mai.' },
          { de: 'Haben Sie noch einen freien Tisch für zwei?', vi: 'Anh/chị còn bàn trống cho hai người không?' },
          { de: 'Unser Tisch ist am Fenster.', vi: 'Bàn của chúng tôi ở cạnh cửa sổ.' }
        ],
        exercises: [
          { vi: 'Tôi đã đặt bàn cho hai người.', de: 'Ich habe einen Tisch für zwei Personen reserviert.', hint: 'Ich habe • einen Tisch • für zwei Personen reserviert' },
          { vi: 'Tôi muốn đặt bàn cho tối nay.', de: 'Ich möchte einen Tisch für heute Abend reservieren.', hint: 'Ich möchte • einen Tisch • für heute Abend reservieren' },
          { vi: 'Bàn được đặt dưới tên Anna.', de: 'Der Tisch ist auf den Namen Anna reserviert.', hint: 'Der Tisch • auf den Namen Anna • reserviert' },
          { vi: 'Chúng tôi đã đặt bàn cho sáu người.', de: 'Wir haben einen Tisch für sechs Personen reserviert.', hint: 'Wir haben • einen Tisch • für sechs Personen reserviert' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Guten Abend, ich habe einen Tisch reserviert.', vi: 'Chào buổi tối, tôi đã đặt bàn.' },
          { who: 'Ben', de: 'Gern. Auf welchen Namen?', vi: 'Được ạ. Bàn đặt dưới tên gì ạ?' }
        ],
        mcq: {
          q: 'Du kommst ins Restaurant und hast vorher einen Tisch gebucht. Was sagst du?',
          qVi: 'Bạn vào nhà hàng và đã đặt bàn trước. Bạn nói gì?',
          options: ['Guten Abend, ich habe einen Tisch für zwei Personen reserviert.', 'Ich bin sehr müde.', 'Ich möchte die Speisekarte sehen.', 'Ich möchte nach Hause gehen.'],
          answer: 'Guten Abend, ich habe einen Tisch für zwei Personen reserviert.',
          why: 'Vào nhà hàng có đặt bàn trước thì báo tên và nói đã đặt bàn; các câu còn lại là than mệt, xin thực đơn hoặc muốn về nhà.'
        }
      },
      {
        id: 'menue-bitte',
        formula: 'Kann ich bitte das Menü haben?',
        vi: 'Cho tôi xem thực đơn được không?',
        note: 'Ở Đức thực đơn thường gọi là „die Speisekarte“, còn „das Menü“ hay dùng để chỉ suất ăn trọn gói. Câu này vẫn được hiểu và rất lịch sự.',
        vocab: [['das Menü', 'thực đơn / suất ăn'], ['die Speisekarte', 'thực đơn'], ['die Vorspeise', 'món khai vị'], ['die Hauptspeise', 'món chính']],
        examples: [
          { de: 'Kann ich bitte die Speisekarte haben?', vi: 'Cho tôi xem thực đơn được không?' },
          { de: 'Haben Sie auch eine vegetarische Speisekarte?', vi: 'Anh/chị có thực đơn chay không?' },
          { de: 'Was empfehlen Sie heute?', vi: 'Hôm nay anh/chị gợi ý món gì?' },
          { de: 'Gibt es auch ein Tagesmenü?', vi: 'Ở đây có suất ăn trong ngày không?' },
          { de: 'Ich brauche noch einen Moment, um zu wählen.', vi: 'Tôi cần thêm chút thời gian để chọn món.' },
          { de: 'Die Speisekarte ist auf dem Tisch.', vi: 'Thực đơn ở trên bàn rồi ạ.' }
        ],
        exercises: [
          { vi: 'Tôi có thể xem thực đơn được không?', de: 'Darf ich bitte die Speisekarte sehen?', hint: 'Darf ich • bitte • die Speisekarte sehen' },
          { vi: 'Món nào ngon nhất ở đây?', de: 'Was ist hier am besten?', hint: 'Was ist • hier • am besten' },
          { vi: 'Ở đây có suất ăn trưa không?', de: 'Gibt es hier ein Mittagsmenü?', hint: 'Gibt es • hier • ein Mittagsmenü' },
          { vi: 'Tôi cần thêm một chút thời gian.', de: 'Ich brauche noch einen Moment.', hint: 'Ich brauche • noch • einen Moment' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Entschuldigung, kann ich bitte die Speisekarte haben?', vi: 'Xin lỗi, cho tôi xem thực đơn được không?' },
          { who: 'Ben', de: 'Natürlich, hier ist sie.', vi: 'Tất nhiên, đây ạ.' }
        ],
        mcq: {
          q: 'Du sitzt im Restaurant, aber es liegt keine Speisekarte auf dem Tisch. Was sagst du zum Kellner?',
          qVi: 'Bạn ngồi trong nhà hàng nhưng trên bàn không có thực đơn. Bạn nói gì với nhân viên?',
          options: ['Könnte ich bitte die Speisekarte bekommen?', 'Ich habe keinen Hunger.', 'Das Essen ist kalt.', 'Ich möchte nach Hause.'],
          answer: 'Könnte ich bitte die Speisekarte bekommen?',
          why: 'Muốn xin thực đơn thì hỏi lịch sự „Könnte ich bitte die Speisekarte bekommen?“; các câu còn lại than không đói, chê món lạnh hoặc muốn về nhà.'
        }
      },
      {
        id: 'schmeckt-lecker',
        formula: 'Das schmeckt lecker!',
        vi: 'Ngon quá!',
        note: '„Lecker“ là từ khen món ăn ngon, rất thông dụng trong đời thường. Nói „Das schmeckt lecker!“ là cách khen tự nhiên nhất.',
        vocab: [['lecker', 'ngon'], ['köstlich', 'ngon tuyệt'], ['der Nachtisch', 'món tráng miệng'], ['selbst gemacht', 'tự làm']],
        examples: [
          { de: 'Das Essen schmeckt wirklich lecker!', vi: 'Món này ngon thật đấy!' },
          { de: 'Der Kuchen schmeckt köstlich!', vi: 'Bánh ngon tuyệt!' },
          { de: 'Das war sehr lecker, danke!', vi: 'Ngon lắm, cảm ơn nhé!' },
          { de: 'Die Suppe schmeckt heute besonders gut.', vi: 'Hôm nay súp ngon đặc biệt.' },
          { de: 'Mmm, das schmeckt fantastisch!', vi: 'Ừm, ngon tuyệt vời!' },
          { de: 'Das Eis schmeckt nach Erdbeeren.', vi: 'Kem này có vị dâu.' }
        ],
        exercises: [
          { vi: 'Bánh này ngon tuyệt!', de: 'Der Kuchen schmeckt fantastisch!', hint: 'Der Kuchen • schmeckt • fantastisch' },
          { vi: 'Món súp này ngon lắm!', de: 'Die Suppe schmeckt sehr lecker!', hint: 'Die Suppe • schmeckt • sehr lecker' },
          { vi: 'Món tráng miệng ngon tuyệt vời!', de: 'Der Nachtisch schmeckt fantastisch!', hint: 'Der Nachtisch • schmeckt • fantastisch' },
          { vi: 'Thịt này ngon quá!', de: 'Das Fleisch schmeckt sehr gut!', hint: 'Das Fleisch • schmeckt • sehr gut' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Das schmeckt lecker, oder?', vi: 'Ngon quá, phải không?' },
          { who: 'Ben', de: 'Ja, der Koch kann wirklich gut kochen!', vi: 'Ừ, đầu bếp nấu giỏi thật!' }
        ],
        mcq: {
          q: 'Du isst bei Freunden und das Essen ist sehr gut. Was sagst du?',
          qVi: 'Bạn ăn ở nhà bạn bè và món ăn rất ngon. Bạn nói gì?',
          options: ['Das Essen schmeckt wunderbar!', 'Ich bin schon satt.', 'Ich muss jetzt gehen.', 'Mir ist kalt.'],
          answer: 'Das Essen schmeckt wunderbar!',
          why: 'Khen món ăn ngon thì nói „Das Essen schmeckt wunderbar!“; các câu còn lại là than no, muốn đi hoặc than lạnh.'
        }
      }
    ]
  },
  {
    id: 'unterwegs',
    title: 'Đi lại & giao thông',
    icon: '🚆',
    patterns: [
      {
        id: 'wie-komme-ich-zum',
        formula: 'Wie komme ich zum Bahnhof?',
        vi: 'Làm sao tôi ra ga được?',
        note: '„Wie komme ich zu …?“ là câu hỏi đường thông dụng nhất. „Zum“ = „zu dem“, dùng trước danh từ giống đực hoặc trung tính ở Dativ.',
        vocab: [['der Bahnhof', 'nhà ga'], ['zu Fuß', 'đi bộ'], ['die U-Bahn', 'tàu điện ngầm'], ['die Richtung', 'hướng']],
        examples: [
          { de: 'Wie komme ich zum Flughafen?', vi: 'Làm sao tôi ra sân bay được?' },
          { de: 'Wie komme ich zur Post?', vi: 'Làm sao tôi đến bưu điện được?' },
          { de: 'Wie komme ich am schnellsten zum Hotel?', vi: 'Đi đến khách sạn nhanh nhất bằng cách nào?' },
          { de: 'Gehen Sie geradeaus, dann links.', vi: 'Bác đi thẳng, rồi rẽ trái.' },
          { de: 'Nehmen Sie die U-Bahn bis zum Hauptbahnhof.', vi: 'Bác đi tàu điện ngầm đến ga trung tâm.' },
          { de: 'Es ist zu Fuß nur fünf Minuten.', vi: 'Đi bộ chỉ mất năm phút.' }
        ],
        exercises: [
          { vi: 'Làm sao tôi đến trung tâm thành phố được?', de: 'Wie komme ich ins Stadtzentrum?', hint: 'Wie komme ich • ins • Stadtzentrum' },
          { vi: 'Làm sao tôi đến bảo tàng được?', de: 'Wie komme ich zum Museum?', hint: 'Wie komme ich • zum • Museum' },
          { vi: 'Đi bộ đến đó mất bao lâu?', de: 'Wie lange braucht man zu Fuß dorthin?', hint: 'Wie lange • braucht man • zu Fuß' },
          { vi: 'Tôi đi tàu điện ngầm đến ga trung tâm.', de: 'Ich fahre mit der U-Bahn zum Hauptbahnhof.', hint: 'Ich fahre • mit der U-Bahn • zum Hauptbahnhof' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Entschuldigung, wie komme ich zum Bahnhof?', vi: 'Xin lỗi, làm sao tôi ra ga được?' },
          { who: 'Ben', de: 'Gehen Sie geradeaus und dann rechts.', vi: 'Bác đi thẳng rồi rẽ phải.' }
        ],
        mcq: {
          q: 'Du bist in einer fremden Stadt und suchst den Bahnhof. Was fragst du einen Passanten?',
          qVi: 'Bạn đang ở thành phố lạ và tìm nhà ga. Bạn hỏi người qua đường điều gì?',
          options: ['Können Sie mir sagen, wie ich zum Bahnhof komme?', 'Wie spät ist es?', 'Wie heißt diese Straße?', 'Ist hier ein Restaurant in der Nähe?'],
          answer: 'Können Sie mir sagen, wie ich zum Bahnhof komme?',
          why: 'Hỏi đường thì dùng câu „Können Sie mir sagen, wie ich zum Bahnhof komme?“; các câu còn lại hỏi giờ, tên đường hoặc tìm nhà hàng.'
        }
      },
      {
        id: 'entschuldigung-wo-ist',
        formula: 'Entschuldigung, wo ist …?',
        vi: 'Xin lỗi, … ở đâu?',
        note: 'Mở đầu bằng „Entschuldigung“ rất lịch sự khi hỏi người lạ. „Wo ist …?“ dùng với danh từ số ít; số nhiều thì dùng „Wo sind …?“.',
        vocab: [['entschuldigen', 'xin lỗi'], ['die Apotheke', 'hiệu thuốc'], ['der Ausgang', 'lối ra'], ['in der Nähe', 'ở gần đây']],
        examples: [
          { de: 'Entschuldigung, wo ist die Toilette?', vi: 'Xin lỗi, nhà vệ sinh ở đâu?' },
          { de: 'Entschuldigung, wo ist der Ausgang?', vi: 'Xin lỗi, lối ra ở đâu?' },
          { de: 'Entschuldigung, wo ist die nächste Apotheke?', vi: 'Xin lỗi, hiệu thuốc gần nhất ở đâu?' },
          { de: 'Wo sind die Gepäckfächer?', vi: 'Tủ gửi hành lý ở đâu?' },
          { de: 'Ist hier in der Nähe ein Supermarkt?', vi: 'Gần đây có siêu thị không?' },
          { de: 'Entschuldigung, wo kann ich ein Taxi finden?', vi: 'Xin lỗi, tôi có thể bắt taxi ở đâu?' }
        ],
        exercises: [
          { vi: 'Xin lỗi, lối vào ở đâu?', de: 'Entschuldigung, wo ist der Eingang?', hint: 'Entschuldigung • wo ist • der Eingang' },
          { vi: 'Xin lỗi, bến xe buýt ở đâu?', de: 'Entschuldigung, wo ist die Bushaltestelle?', hint: 'Entschuldigung • wo ist • die Bushaltestelle' },
          { vi: 'Gần đây có quán cà phê không?', de: 'Ist hier in der Nähe ein Café?', hint: 'Ist hier • in der Nähe • ein Café' },
          { vi: 'Phòng chờ ở đâu?', de: 'Wo ist der Warteraum?', hint: 'Wo ist • der • Warteraum' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Entschuldigung, wo ist der Fahrkartenautomat?', vi: 'Xin lỗi, máy bán vé ở đâu?' },
          { who: 'Ben', de: 'Dort drüben, neben dem Eingang.', vi: 'Ở đằng kia, cạnh lối vào.' }
        ],
        mcq: {
          q: 'Du suchst die Toilette am Bahnhof. Was sagst du zu einer Passantin?',
          qVi: 'Bạn tìm nhà vệ sinh ở ga. Bạn nói gì với một người phụ nữ qua đường?',
          options: ['Entschuldigung, wo ist hier die Toilette?', 'Ich brauche einen Kaffee.', 'Können Sie mir helfen?', 'Ich muss nach Hause.'],
          answer: 'Entschuldigung, wo ist hier die Toilette?',
          why: 'Hỏi đường thì mở đầu bằng „Entschuldigung“ rồi hỏi „wo ist …?“; các câu còn lại là xin cà phê, xin giúp đỡ chung chung hoặc muốn về nhà.'
        }
      },
      {
        id: 'faehrt-dieser-bus',
        formula: 'Fährt dieser Bus zum …?',
        vi: 'Xe buýt này có đi đến … không?',
        note: 'Hỏi tài xế hoặc hành khách trước khi lên xe để khỏi đi nhầm. „Fahren“ là động từ bất quy tắc: ich fahre, du fährst, er fährt.',
        vocab: [['fahren', 'đi (xe)'], ['der Bus', 'xe buýt'], ['die Haltestelle', 'trạm dừng'], ['umsteigen', 'đổi xe']],
        examples: [
          { de: 'Fährt dieser Bus zum Hauptbahnhof?', vi: 'Xe buýt này có đi đến ga trung tâm không?' },
          { de: 'Fährt dieser Zug nach Berlin?', vi: 'Tàu này có đi Berlin không?' },
          { de: 'Muss ich hier umsteigen?', vi: 'Tôi có phải đổi xe ở đây không?' },
          { de: 'Fährt der Bus auch am Sonntag?', vi: 'Xe buýt có chạy cả chủ nhật không?' },
          { de: 'Wann fährt der nächste Bus?', vi: 'Xe buýt tiếp theo chạy lúc mấy giờ?' },
          { de: 'Dieser Bus fährt direkt zum Flughafen.', vi: 'Xe buýt này chạy thẳng ra sân bay.' }
        ],
        exercises: [
          { vi: 'Xe buýt này có đi đến trung tâm thành phố không?', de: 'Fährt dieser Bus ins Stadtzentrum?', hint: 'Fährt • dieser Bus • ins Stadtzentrum' },
          { vi: 'Tàu này có đi Hamburg không?', de: 'Fährt dieser Zug nach Hamburg?', hint: 'Fährt • dieser Zug • nach Hamburg' },
          { vi: 'Tôi phải đổi xe ở ga nào?', de: 'Wo muss ich umsteigen?', hint: 'Wo • muss ich • umsteigen' },
          { vi: 'Chuyến tàu tiếp theo chạy lúc mấy giờ?', de: 'Wann fährt der nächste Zug?', hint: 'Wann fährt • der nächste • Zug' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Fährt dieser Bus zum Flughafen?', vi: 'Xe buýt này có đi ra sân bay không?' },
          { who: 'Ben', de: 'Ja, er fährt direkt dorthin.', vi: 'Có, xe chạy thẳng ra đó.' }
        ],
        mcq: {
          q: 'Du stehst an der Haltestelle und willst zum Flughafen. Was fragst du den Fahrer?',
          qVi: 'Bạn đứng ở trạm xe và muốn ra sân bay. Bạn hỏi tài xế điều gì?',
          options: ['Fährt dieser Bus zum Flughafen oder muss ich umsteigen?', 'Wie viel kostet ein Kaffee?', 'Ich möchte ein Ticket kaufen.', 'Ich suche den Ausgang.'],
          answer: 'Fährt dieser Bus zum Flughafen oder muss ich umsteigen?',
          why: 'Muốn biết xe có đi đúng nơi mình cần thì hỏi „Fährt dieser Bus zum …?“; các câu còn lại hỏi giá cà phê, mua vé hoặc tìm lối ra.'
        }
      },
      {
        id: 'ich-habe-mich-verfahren',
        formula: 'Ich habe mich verfahren.',
        vi: 'Tôi đi lạc đường rồi.',
        note: '„Sich verfahren“ là đi lạc khi lái xe hoặc đi xe đạp; đi bộ lạc đường thì nói „Ich habe mich verlaufen“. Động từ phản thân, Perfekt dùng „haben“.',
        vocab: [['sich verfahren', 'đi lạc (khi lái xe)'], ['sich verlaufen', 'đi lạc (khi đi bộ)'], ['die Karte', 'bản đồ'], ['das Navi', 'thiết bị dẫn đường']],
        examples: [
          { de: 'Ich glaube, ich habe mich verfahren.', vi: 'Tôi nghĩ mình đi lạc rồi.' },
          { de: 'Ich habe mich verlaufen. Kannst du mir helfen?', vi: 'Tôi đi lạc rồi. Cậu giúp tôi được không?' },
          { de: 'Wir haben uns in der Stadt verlaufen.', vi: 'Chúng tôi đã đi lạc trong thành phố.' },
          { de: 'Mein Navi hat mich in die falsche Richtung geschickt.', vi: 'Thiết bị dẫn đường đã chỉ tôi đi sai hướng.' },
          { de: 'Ich kenne mich hier gar nicht aus.', vi: 'Tôi hoàn toàn không biết đường ở đây.' },
          { de: 'Kannst du mir den Weg zum Hotel zeigen?', vi: 'Cậu chỉ đường đến khách sạn cho tôi được không?' }
        ],
        exercises: [
          { vi: 'Chúng tôi đi lạc trong rừng rồi.', de: 'Wir haben uns im Wald verlaufen.', hint: 'Wir haben uns • im Wald • verlaufen' },
          { vi: 'Tôi không biết đường ở đây.', de: 'Ich kenne mich hier nicht aus.', hint: 'Ich kenne mich • hier • nicht aus' },
          { vi: 'Cậu có thể chỉ đường cho tôi không?', de: 'Kannst du mir den Weg zeigen?', hint: 'Kannst du • mir • den Weg zeigen' },
          { vi: 'Bản đồ của tôi đã cũ.', de: 'Meine Karte ist schon alt.', hint: 'Meine Karte • ist • schon alt' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich glaube, wir haben uns verfahren.', vi: 'Tôi nghĩ chúng ta đi lạc rồi.' },
          { who: 'Ben', de: 'Kein Problem, ich schalte das Navi ein.', vi: 'Không sao, tôi bật thiết bị dẫn đường lên.' }
        ],
        mcq: {
          q: 'Du fährst mit dem Auto und merkst, dass du falsch abgebogen bist. Was sagst du?',
          qVi: 'Bạn đang lái xe và nhận ra mình đã rẽ nhầm. Bạn nói gì?',
          options: ['Oh nein, ich habe mich verfahren!', 'Ich habe Durst.', 'Das Wetter ist schön.', 'Ich liebe Berlin.'],
          answer: 'Oh nein, ich habe mich verfahren!',
          why: 'Đi lạc khi lái xe thì nói „Ich habe mich verfahren“; các câu còn lại than khát, khen thời tiết hoặc khen thành phố.'
        }
      },
      {
        id: 'kannst-du-mich-abholen',
        formula: 'Kannst du mich abholen?',
        vi: 'Cậu đón tôi được không?',
        note: '„Abholen“ là đón ai đó (từ ga, sân bay, nhà). Động từ tách: „abholen, holt ab, hat abgeholt“. Khi nhờ người khác, thêm „bitte“ cho lịch sự.',
        vocab: [['abholen', 'đón'], ['der Bahnhof', 'nhà ga'], ['der Flughafen', 'sân bay'], ['pünktlich', 'đúng giờ']],
        examples: [
          { de: 'Kannst du mich vom Bahnhof abholen?', vi: 'Cậu đón tôi ở ga được không?' },
          { de: 'Kannst du mich um acht Uhr abholen?', vi: 'Cậu đón tôi lúc tám giờ được không?' },
          { de: 'Mein Vater holt mich vom Flughafen ab.', vi: 'Bố tôi đón tôi ở sân bay.' },
          { de: 'Ich hole dich nach der Arbeit ab.', vi: 'Tôi sẽ đón cậu sau giờ làm.' },
          { de: 'Kannst du mich bitte um halb sieben abholen?', vi: 'Cậu đón tôi lúc sáu rưỡi được không?' },
          { de: 'Wir holen die Kinder von der Schule ab.', vi: 'Chúng tôi đón bọn trẻ ở trường.' }
        ],
        exercises: [
          { vi: 'Cậu đón tôi ở sân bay được không?', de: 'Kannst du mich vom Flughafen abholen?', hint: 'Kannst du mich • vom Flughafen • abholen' },
          { vi: 'Tôi sẽ đón cậu lúc bảy giờ.', de: 'Ich hole dich um sieben Uhr ab.', hint: 'Ich hole dich • um sieben Uhr • ab' },
          { vi: 'Mẹ tôi đón tôi ở ga.', de: 'Meine Mutter holt mich vom Bahnhof ab.', hint: 'Meine Mutter • holt mich • vom Bahnhof ab' },
          { vi: 'Cậu đón tôi lúc sáu rưỡi được không?', de: 'Kannst du mich um halb sieben abholen?', hint: 'Kannst du mich • um halb sieben • abholen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du mich morgen vom Bahnhof abholen?', vi: 'Ngày mai cậu đón tôi ở ga được không?' },
          { who: 'Ben', de: 'Klar, um wie viel Uhr kommst du an?', vi: 'Được chứ, cậu đến lúc mấy giờ?' }
        ],
        mcq: {
          q: 'Du kommst am Bahnhof an und brauchst jemanden, der dich abholt. Was schreibst du deinem Freund?',
          qVi: 'Bạn đến ga và cần ai đó đón. Bạn nhắn gì cho bạn mình?',
          options: ['Kannst du mich bitte vom Bahnhof abholen?', 'Ich habe keine Zeit.', 'Wo bist du?', 'Ich bin müde.'],
          answer: 'Kannst du mich bitte vom Bahnhof abholen?',
          why: 'Muốn nhờ đón ở ga thì hỏi „Kannst du mich bitte vom Bahnhof abholen?“; các câu còn lại than bận, hỏi bạn đang ở đâu hoặc than mệt.'
        }
      },
      {
        id: 'zug-verspaetung',
        formula: 'Der Zug hat Verspätung.',
        vi: 'Tàu bị trễ.',
        note: '„Verspätung haben“ là cụm cố định: tàu hay xe buýt bị trễ. Thêm số phút: „Der Zug hat zehn Minuten Verspätung.“. Ngược lại là „pünktlich“ (đúng giờ).',
        vocab: [['die Verspätung', 'sự trễ'], ['der Zug', 'tàu hỏa'], ['pünktlich', 'đúng giờ'], ['das Gleis', 'đường ray / sân ga']],
        examples: [
          { de: 'Der Zug hat zehn Minuten Verspätung.', vi: 'Tàu trễ mười phút.' },
          { de: 'Der Bus hat leider Verspätung.', vi: 'Xe buýt tiếc là bị trễ.' },
          { de: 'Unser Zug ist pünktlich.', vi: 'Tàu của chúng tôi đúng giờ.' },
          { de: 'Der Zug nach München fährt von Gleis fünf ab.', vi: 'Tàu đi Munich khởi hành từ đường ray số năm.' },
          { de: 'Wegen der Verspätung verpasse ich meinen Anschluss.', vi: 'Vì tàu trễ nên tôi lỡ chuyến nối tiếp.' },
          { de: 'Der Zug hat schon zwanzig Minuten Verspätung.', vi: 'Tàu đã trễ hai mươi phút rồi.' }
        ],
        exercises: [
          { vi: 'Tàu trễ năm phút.', de: 'Der Zug hat fünf Minuten Verspätung.', hint: 'Der Zug • fünf Minuten • Verspätung' },
          { vi: 'Xe buýt bị trễ.', de: 'Der Bus hat Verspätung.', hint: 'Der Bus • hat • Verspätung' },
          { vi: 'Chuyến tàu này đúng giờ.', de: 'Dieser Zug ist pünktlich.', hint: 'Dieser Zug • ist • pünktlich' },
          { vi: 'Vì tàu trễ nên tôi lỡ chuyến bay.', de: 'Wegen der Verspätung verpasse ich meinen Flug.', hint: 'Wegen der Verspätung • verpasse ich • meinen Flug' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Der Zug hat Verspätung, wir müssen warten.', vi: 'Tàu bị trễ, chúng ta phải đợi.' },
          { who: 'Ben', de: 'Wie lange noch? Ich habe einen Termin.', vi: 'Còn đợi bao lâu nữa? Tôi có hẹn.' }
        ],
        mcq: {
          q: 'Der Zug sollte um 10 Uhr kommen, aber es ist schon 10:15 Uhr. Was sagst du?',
          qVi: 'Tàu đáng lẽ đến lúc 10 giờ, nhưng giờ đã 10:15. Bạn nói gì?',
          options: ['Der Zug hat fünfzehn Minuten Verspätung.', 'Der Zug ist pünktlich.', 'Ich warte schon lange.', 'Es ist kalt hier.'],
          answer: 'Der Zug hat fünfzehn Minuten Verspätung.',
          why: 'Tàu đến muộn 15 phút thì nói „Der Zug hat fünfzehn Minuten Verspätung“; câu „Der Zug ist pünktlich“ nghĩa ngược lại, các câu còn lại không liên quan.'
        }
      }
    ]
  },
  {
    id: 'gesundheit',
    title: 'Sức khỏe & bác sĩ',
    icon: '🏥',
    patterns: [
      {
        id: 'mir-ist-schlecht',
        formula: 'Mir ist schlecht.',
        vi: 'Tôi thấy buồn nôn / không khỏe.',
        note: '„Mir ist schlecht“ nghĩa là buồn nôn hoặc thấy khó chịu trong người. Cũng có thể nói „Mir geht es nicht gut“ khi không khỏe nói chung.',
        vocab: [['schlecht', 'khó chịu, tệ'], ['übel', 'buồn nôn'], ['mir geht es nicht gut', 'tôi không khỏe'], ['sich hinlegen', 'nằm nghỉ']],
        examples: [
          { de: 'Mir ist schlecht, ich muss mich hinlegen.', vi: 'Tôi thấy khó chịu, tôi phải nằm nghỉ.' },
          { de: 'Mir ist übel, seit ich im Bus sitze.', vi: 'Tôi buồn nôn từ lúc ngồi trên xe buýt.' },
          { de: 'Heute geht es mir nicht so gut.', vi: 'Hôm nay tôi không khỏe lắm.' },
          { de: 'Mir ist schwindlig.', vi: 'Tôi thấy chóng mặt.' },
          { de: 'Nach dem Essen wurde mir schlecht.', vi: 'Sau khi ăn xong tôi thấy khó chịu.' },
          { de: 'Mir ist schlecht, ich brauche frische Luft.', vi: 'Tôi thấy khó chịu, tôi cần không khí trong lành.' }
        ],
        exercises: [
          { vi: 'Tôi thấy không khỏe.', de: 'Mir geht es nicht gut.', hint: 'Mir geht es • nicht • gut' },
          { vi: 'Tôi thấy buồn nôn và chóng mặt.', de: 'Mir ist übel und schwindlig.', hint: 'Mir ist • übel • und schwindlig' },
          { vi: 'Tôi phải nằm nghỉ một chút.', de: 'Ich muss mich ein bisschen hinlegen.', hint: 'Ich muss mich • ein bisschen • hinlegen' },
          { vi: 'Tôi cần không khí trong lành.', de: 'Ich brauche frische Luft.', hint: 'Ich brauche • frische • Luft' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Mir ist schlecht. Ich bleibe heute zu Hause.', vi: 'Tôi thấy không khỏe. Hôm nay tôi ở nhà.' },
          { who: 'Ben', de: 'Oh, dann ruh dich gut aus!', vi: 'Ồ, vậy cậu nghỉ ngơi cho tốt nhé!' }
        ],
        mcq: {
          q: 'Dir ist übel und du fühlst dich krank. Was sagst du?',
          qVi: 'Bạn buồn nôn và thấy mình bị ốm. Bạn nói gì?',
          options: ['Mir geht es heute nicht gut.', 'Mir geht es super!', 'Ich bin glücklich.', 'Ich bin fit.'],
          answer: 'Mir geht es heute nicht gut.',
          why: 'Thấy không khỏe thì nói „Mir geht es heute nicht gut“ hoặc „Mir ist schlecht“; các câu còn lại đều nói mình khỏe hoặc vui.'
        }
      },
      {
        id: 'kopfschmerzen',
        formula: 'Ich habe Kopfschmerzen.',
        vi: 'Tôi bị đau đầu.',
        note: '„Schmerzen haben“ + bộ phận cơ thể: „Ich habe Kopfschmerzen / Bauchschmerzen / Zahnschmerzen“. „Kopfschmerzen“ luôn ở dạng số nhiều.',
        vocab: [['die Kopfschmerzen', 'chứng đau đầu'], ['die Bauchschmerzen', 'chứng đau bụng'], ['die Tablette', 'viên thuốc'], ['die Schmerzen', 'cơn đau']],
        examples: [
          { de: 'Ich habe schlimme Kopfschmerzen.', vi: 'Tôi bị đau đầu kinh khủng.' },
          { de: 'Ich habe seit gestern Kopfschmerzen.', vi: 'Tôi bị đau đầu từ hôm qua.' },
          { de: 'Ich habe Bauchschmerzen.', vi: 'Tôi bị đau bụng.' },
          { de: 'Ich brauche eine Tablette gegen Kopfschmerzen.', vi: 'Tôi cần một viên thuốc đau đầu.' },
          { de: 'Hast du auch Kopfschmerzen?', vi: 'Cậu cũng bị đau đầu à?' },
          { de: 'Die Kopfschmerzen sind jetzt weg.', vi: 'Cơn đau đầu giờ đã hết.' }
        ],
        exercises: [
          { vi: 'Tôi bị đau răng dữ dội.', de: 'Ich habe starke Zahnschmerzen.', hint: 'Ich habe • starke • Zahnschmerzen' },
          { vi: 'Tôi bị đau đầu từ sáng nay.', de: 'Ich habe seit heute Morgen Kopfschmerzen.', hint: 'Ich habe • seit heute Morgen • Kopfschmerzen' },
          { vi: 'Tôi cần một viên thuốc.', de: 'Ich brauche eine Tablette.', hint: 'Ich brauche • eine • Tablette' },
          { vi: 'Cơn đau bụng đã hết rồi.', de: 'Die Bauchschmerzen sind jetzt weg.', hint: 'Die Bauchschmerzen • sind • jetzt weg' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich habe Kopfschmerzen. Hast du eine Tablette?', vi: 'Tôi bị đau đầu. Cậu có thuốc không?' },
          { who: 'Ben', de: 'Ja, hier. Trink viel Wasser dazu.', vi: 'Có, đây. Cậu uống nhiều nước vào nhé.' }
        ],
        mcq: {
          q: 'Dein Kopf tut sehr weh. Was sagst du?',
          qVi: 'Đầu bạn đau dữ dội. Bạn nói gì?',
          options: ['Ich habe starke Kopfschmerzen.', 'Ich habe gute Laune.', 'Ich fühle mich toll.', 'Alles ist in Ordnung.'],
          answer: 'Ich habe starke Kopfschmerzen.',
          why: 'Đau đầu thì nói „Ich habe starke Kopfschmerzen“; các câu còn lại đều nói mình đang vui vẻ, khỏe mạnh.'
        }
      },
      {
        id: 'fieber',
        formula: 'Ich habe Fieber.',
        vi: 'Tôi bị sốt.',
        note: '„Fieber haben“ là bị sốt. Thường kèm theo nhiệt độ: „Ich habe 39 Grad Fieber.“. Khi sốt cao thì nên đi khám bác sĩ.',
        vocab: [['das Fieber', 'cơn sốt'], ['der Husten', 'cơn ho'], ['die Erkältung', 'cảm lạnh'], ['messen', 'đo (nhiệt độ)']],
        examples: [
          { de: 'Ich habe 38,5 Grad Fieber.', vi: 'Tôi sốt 38,5 độ.' },
          { de: 'Ich habe Fieber und Husten.', vi: 'Tôi bị sốt và ho.' },
          { de: 'Ich habe eine Erkältung.', vi: 'Tôi bị cảm lạnh.' },
          { de: 'Ich muss mein Fieber messen.', vi: 'Tôi phải đo nhiệt độ.' },
          { de: 'Seit gestern habe ich hohes Fieber.', vi: 'Từ hôm qua tôi sốt cao.' },
          { de: 'Bei Fieber sollte man viel trinken.', vi: 'Khi bị sốt nên uống nhiều nước.' }
        ],
        exercises: [
          { vi: 'Tôi sốt 38 độ.', de: 'Ich habe 38 Grad Fieber.', hint: 'Ich habe • 38 Grad • Fieber' },
          { vi: 'Tôi bị ho và sốt.', de: 'Ich habe Husten und Fieber.', hint: 'Ich habe • Husten • und Fieber' },
          { vi: 'Tôi phải uống thuốc.', de: 'Ich muss eine Tablette nehmen.', hint: 'Ich muss • eine Tablette • nehmen' },
          { vi: 'Khi bị sốt nên nằm nghỉ.', de: 'Bei Fieber sollte man sich ausruhen.', hint: 'Bei Fieber • sollte man • sich ausruhen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich habe Fieber. Ich bleibe heute im Bett.', vi: 'Tôi bị sốt. Hôm nay tôi nằm trên giường.' },
          { who: 'Ben', de: 'Gute Besserung! Trink viel Tee.', vi: 'Chúc mau khỏe! Cậu uống nhiều trà vào nhé.' }
        ],
        mcq: {
          q: 'Du fühlst dich heiß, das Thermometer zeigt 39 Grad. Was sagst du?',
          qVi: 'Bạn thấy người nóng, nhiệt kế chỉ 39 độ. Bạn nói gì?',
          options: ['Ich habe 39 Grad Fieber.', 'Mir ist warm.', 'Ich bin gesund.', 'Ich habe keine Schmerzen.'],
          answer: 'Ich habe 39 Grad Fieber.',
          why: 'Nhiệt kế 39 độ nghĩa là bị sốt: „Ich habe 39 Grad Fieber“; các câu còn lại nói mình ấm, khỏe hoặc không đau.'
        }
      },
      {
        id: 'termin-beim-arzt',
        formula: 'Ich brauche einen Termin beim Arzt.',
        vi: 'Tôi cần đặt lịch khám bác sĩ.',
        note: 'Ở Đức khám bác sĩ thường phải đặt lịch trước („einen Termin machen“). Câu này dùng khi gọi điện cho phòng khám.',
        vocab: [['der Termin', 'lịch hẹn'], ['der Arzt', 'bác sĩ'], ['die Praxis', 'phòng khám'], ['dringend', 'gấp, khẩn cấp']],
        examples: [
          { de: 'Ich brauche dringend einen Termin beim Arzt.', vi: 'Tôi cần đặt lịch khám bác sĩ gấp.' },
          { de: 'Ich möchte einen Termin für morgen machen.', vi: 'Tôi muốn đặt lịch cho ngày mai.' },
          { de: 'Haben Sie noch einen freien Termin diese Woche?', vi: 'Tuần này anh/chị còn lịch trống không?' },
          { de: 'Der Termin ist am Dienstag um zehn Uhr.', vi: 'Lịch hẹn là thứ Ba lúc mười giờ.' },
          { de: 'Ich muss meinen Termin absagen.', vi: 'Tôi phải hủy lịch hẹn của mình.' },
          { de: 'Die Praxis ist von acht bis zwölf Uhr geöffnet.', vi: 'Phòng khám mở cửa từ tám giờ đến mười hai giờ.' }
        ],
        exercises: [
          { vi: 'Tôi muốn đặt lịch cho thứ Sáu.', de: 'Ich möchte einen Termin für Freitag machen.', hint: 'Ich möchte • einen Termin • für Freitag machen' },
          { vi: 'Tôi cần một lịch hẹn sớm.', de: 'Ich brauche einen frühen Termin.', hint: 'Ich brauche • einen frühen • Termin' },
          { vi: 'Tôi phải dời lịch hẹn của mình.', de: 'Ich muss meinen Termin verschieben.', hint: 'Ich muss • meinen Termin • verschieben' },
          { vi: 'Lịch hẹn là thứ Tư lúc chín giờ.', de: 'Der Termin ist am Mittwoch um neun Uhr.', hint: 'Der Termin • am Mittwoch • um neun Uhr' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich möchte gern einen Termin beim Arzt machen.', vi: 'Tôi muốn đặt lịch khám bác sĩ.' },
          { who: 'Ben', de: 'Rufen Sie am besten morgen früh an.', vi: 'Tốt nhất cậu gọi điện vào sáng mai.' }
        ],
        mcq: {
          q: 'Du bist krank und willst zum Arzt gehen. Was sagst du am Telefon zur Praxis?',
          qVi: 'Bạn bị ốm và muốn đi khám bác sĩ. Bạn nói gì qua điện thoại với phòng khám?',
          options: ['Guten Tag, ich brauche einen Termin beim Arzt.', 'Ich möchte einen Tisch reservieren.', 'Ich möchte ein Taxi bestellen.', 'Wo ist der Bahnhof?'],
          answer: 'Guten Tag, ich brauche einen Termin beim Arzt.',
          why: 'Gọi điện đặt lịch khám thì nói „Guten Tag, ich brauche einen Termin beim Arzt“; các câu còn lại là đặt bàn, gọi taxi hoặc hỏi đường ra ga.'
        }
      },
      {
        id: 'seit-wann-schmerzen',
        formula: 'Seit wann haben Sie die Schmerzen?',
        vi: 'Anh/chị bị đau từ khi nào?',
        note: 'Câu bác sĩ hay hỏi bệnh nhân. „Seit wann“ = từ khi nào; trả lời bằng „Seit gestern / seit zwei Tagen …“. Lưu ý dùng „Sie“ lịch sự với bác sĩ.',
        vocab: [['seit wann', 'từ khi nào'], ['die Schmerzen', 'cơn đau'], ['seit gestern', 'từ hôm qua'], ['der Patient', 'bệnh nhân']],
        examples: [
          { de: 'Seit wann haben Sie diese Schmerzen?', vi: 'Anh/chị bị đau như thế này từ khi nào?' },
          { de: 'Seit wann haben Sie den Husten?', vi: 'Anh/chị bị ho từ khi nào?' },
          { de: 'Ich habe die Schmerzen seit gestern.', vi: 'Tôi bị đau từ hôm qua.' },
          { de: 'Seit drei Tagen habe ich Halsschmerzen.', vi: 'Tôi bị đau họng ba ngày nay.' },
          { de: 'Wo genau tut es weh?', vi: 'Đau chính xác ở chỗ nào?' },
          { de: 'Die Schmerzen sind nachts schlimmer.', vi: 'Cơn đau nặng hơn vào ban đêm.' }
        ],
        exercises: [
          { vi: 'Anh bị sốt từ khi nào?', de: 'Seit wann haben Sie Fieber?', hint: 'Seit wann • haben Sie • Fieber' },
          { vi: 'Tôi bị đau họng hai ngày nay.', de: 'Seit zwei Tagen habe ich Halsschmerzen.', hint: 'Seit zwei Tagen • habe ich • Halsschmerzen' },
          { vi: 'Chỗ nào đau nhất?', de: 'Wo tut es am meisten weh?', hint: 'Wo tut es • am meisten • weh' },
          { vi: 'Cơn đau nhẹ hơn vào buổi sáng.', de: 'Die Schmerzen sind morgens leichter.', hint: 'Die Schmerzen • sind • morgens leichter' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Sagen Sie mir, seit wann haben Sie die Schmerzen?', vi: 'Anh cho tôi biết anh bị đau từ khi nào?' },
          { who: 'Ben', de: 'Seit gestern Abend.', vi: 'Từ tối hôm qua.' }
        ],
        mcq: {
          q: 'Ein Arzt fragt einen Patienten nach dem Beginn der Schmerzen. Was sagt der Arzt?',
          qVi: 'Bác sĩ hỏi bệnh nhân về thời điểm bắt đầu đau. Bác sĩ nói gì?',
          options: ['Seit wann haben Sie denn die Schmerzen?', 'Wie geht es dir?', 'Was ist dein Lieblingsessen?', 'Wie alt bist du?'],
          answer: 'Seit wann haben Sie denn die Schmerzen?',
          why: 'Bác sĩ hỏi bệnh nhân bị đau từ khi nào thì dùng „Seit wann haben Sie … die Schmerzen?“; các câu còn lại hỏi sức khỏe chung, món ăn yêu thích hoặc tuổi.'
        }
      },
      {
        id: 'gute-besserung',
        formula: 'Gute Besserung!',
        vi: 'Chúc mau khỏe!',
        note: 'Câu chúc người ốm rất thông dụng ở Đức, dùng khi biết ai đó bị bệnh. Có thể nói thêm: „Gute Besserung und ruh dich gut aus!“',
        vocab: [['die Besserung', 'sự hồi phục'], ['sich ausruhen', 'nghỉ ngơi'], ['krank', 'ốm'], ['das Bett', 'giường']],
        examples: [
          { de: 'Gute Besserung! Ruh dich gut aus.', vi: 'Chúc mau khỏe! Cậu nghỉ ngơi cho tốt nhé.' },
          { de: 'Gute Besserung, Anna! Ich denke an dich.', vi: 'Chúc mau khỏe nhé Anna! Tôi luôn nghĩ đến cậu.' },
          { de: 'Ich wünsche dir eine gute Besserung!', vi: 'Tôi chúc cậu mau khỏe!' },
          { de: 'Bleib im Bett und trink viel Tee.', vi: 'Cậu cứ nằm trên giường và uống nhiều trà vào.' },
          { de: 'Gute Besserung! Wir sehen uns nächste Woche.', vi: 'Chúc mau khỏe! Tuần sau gặp lại nhé.' },
          { de: 'Melde dich, wenn du etwas brauchst!', vi: 'Cần gì thì cứ gọi tôi nhé!' }
        ],
        exercises: [
          { vi: 'Chúc cậu mau khỏe, Anna!', de: 'Gute Besserung, Anna!', hint: 'Gute • Besserung • Anna' },
          { vi: 'Cậu nghỉ ngơi cho tốt nhé!', de: 'Ruh dich gut aus!', hint: 'Ruh dich • gut • aus' },
          { vi: 'Uống nhiều nước vào nhé!', de: 'Trink viel Wasser!', hint: 'Trink • viel • Wasser' },
          { vi: 'Tuần sau gặp lại nhé!', de: 'Wir sehen uns nächste Woche.', hint: 'Wir sehen uns • nächste • Woche' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Gute Besserung! Ich bringe dir Suppe vorbei.', vi: 'Chúc mau khỏe! Tôi mang súp qua cho cậu nhé.' },
          { who: 'Ben', de: 'Danke, das ist sehr lieb von dir.', vi: 'Cảm ơn, cậu tốt quá.' }
        ],
        mcq: {
          q: 'Deine Freundin ist krank und liegt im Bett. Was schreibst du ihr?',
          qVi: 'Bạn gái của bạn bị ốm và đang nằm trên giường. Bạn nhắn gì cho cô ấy?',
          options: ['Ich wünsche dir gute Besserung!', 'Guten Appetit!', 'Viel Spaß!', 'Gute Nacht!'],
          answer: 'Ich wünsche dir gute Besserung!',
          why: 'Chúc người ốm mau khỏe thì nói „Ich wünsche dir gute Besserung!“; các câu còn lại chúc ngon miệng, chúc vui vẻ hoặc chúc ngủ ngon.'
        }
      }
    ]
  }
];
