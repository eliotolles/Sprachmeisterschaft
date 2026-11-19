// ====================================================================
// SITUATION TOPICS C — Mẫu câu giao tiếp tiếng Đức (trình độ B1)
// 4 chủ đề x 6 mẫu câu = 24 mẫu câu.
// Mỗi mẫu câu: formula + note + vocab + 6 examples + 4 exercises
// + dialogue 2 câu + 1 câu trắc nghiệm (mcq).
// ====================================================================

export const SITUATION_TOPICS_C = [
  {
    id: 'wohnen',
    title: 'Nhà ở & hàng xóm',
    icon: '🏠',
    patterns: [
      {
        id: 'leiser-sein',
        formula: 'Kannst du bitte leiser sein?',
        vi: 'Cậu nói nhỏ lại được không?',
        note: 'Câu nhờ vả lịch sự với hàng xóm hoặc bạn cùng phòng. Thêm "bitte" làm câu nhẹ nhàng hơn, "leiser" là dạng so sánh của "leise" (nhỏ tiếng).',
        vocab: [['leise', 'nhỏ tiếng'], ['bitte', 'làm ơn'], ['laut', 'ồn ào']],
        examples: [
          { de: 'Kannst du bitte leiser sein? Ich muss morgen früh aufstehen.', vi: 'Cậu nói nhỏ lại được không? Sáng mai tớ phải dậy sớm.' },
          { de: 'Kannst du bitte etwas leiser sein? Das Baby schläft.', vi: 'Cậu nói nhỏ hơn một chút được không? Em bé đang ngủ.' },
          { de: 'Kannst du bitte leiser sein? Ich lerne gerade für die Prüfung.', vi: 'Cậu nói nhỏ lại được không? Tớ đang ôn thi.' },
          { de: 'Es ist schon nach 22 Uhr. Kannst du bitte leiser sein?', vi: 'Đã sau 10 giờ tối rồi. Cậu nói nhỏ lại được không?' },
          { de: 'Kannst du bitte leiser sein? Mein Nachbar arbeitet im Nachtdienst.', vi: 'Cậu nói nhỏ lại được không? Hàng xóm nhà tớ làm ca đêm.' },
          { de: 'Kannst du bitte leiser sein, wenn du nach Hause kommst?', vi: 'Cậu nói nhỏ lại khi về nhà được không?' }
        ],
        exercises: [
          { vi: 'Cậu nói nhỏ lại được không? Tớ đang làm việc.', de: 'Kannst du bitte leiser sein? Ich arbeite gerade.', hint: 'kannst • leiser • sein' },
          { vi: 'Các cậu nói nhỏ lại được không? Tớ muốn ngủ.', de: 'Könnt ihr bitte leiser sein? Ich möchte schlafen.', hint: 'könnt • leiser • schlafen' },
          { vi: 'Cậu nói nhỏ lại được không? Đã khuya rồi.', de: 'Kannst du bitte leiser sein? Es ist schon spät.', hint: 'leiser • schon • spät' },
          { vi: 'Cậu nói nhỏ lại khi nghe nhạc được không?', de: 'Kannst du bitte leiser sein, wenn du Musik hörst?', hint: 'leiser • wenn • Musik' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du bitte leiser sein? Ich lese gerade.', vi: 'Cậu nói nhỏ lại được không? Tớ đang đọc sách.' },
          { who: 'Ben', de: 'Entschuldigung! Ich mache die Musik leiser.', vi: 'Xin lỗi nhé! Tớ vặn nhạc nhỏ lại đây.' }
        ],
        mcq: {
          q: 'Es ist 23 Uhr. Dein Mitbewohner hört laute Musik. Was sagst du höflich?',
          qVi: 'Đã 11 giờ đêm. Bạn cùng phòng nghe nhạc to. Cậu nói gì cho lịch sự?',
          options: ['Kannst du bitte leiser sein?', 'Sei leise, sofort!', 'Mach die Musik aus!', 'Ich gehe jetzt schlafen.'],
          answer: 'Kannst du bitte leiser sein?',
          why: '"Kannst du bitte leiser sein?" là câu nhờ vả lịch sự, phù hợp khi muốn bạn cùng phòng nói nhỏ lại.'
        }
      },
      {
        id: 'heizung-kaputt',
        formula: 'Die Heizung funktioniert nicht.',
        vi: 'Máy sưởi hỏng rồi.',
        note: '"funktionieren" nghĩa là hoạt động, "nicht" phủ định. Khi đồ đạc trong nhà hỏng, người Đức thường báo cho Hausmeister (quản gia) hoặc Vermieter (chủ nhà).',
        vocab: [['die Heizung', 'máy sưởi'], ['funktionieren', 'hoạt động'], ['kaputt', 'hỏng']],
        examples: [
          { de: 'Die Heizung funktioniert nicht. Es ist so kalt hier.', vi: 'Máy sưởi hỏng rồi. Trong này lạnh quá.' },
          { de: 'Seit gestern funktioniert die Heizung nicht mehr.', vi: 'Từ hôm qua máy sưởi không hoạt động nữa rồi.' },
          { de: 'Die Heizung funktioniert nicht. Kannst du den Hausmeister anrufen?', vi: 'Máy sưởi hỏng rồi. Cậu gọi bác quản gia giúp tớ được không?' },
          { de: 'Im Winter ist es schlimm, wenn die Heizung nicht funktioniert.', vi: 'Mùa đông mà máy sưởi không hoạt động thì khổ lắm.' },
          { de: 'Die Heizung funktioniert nicht, aber das warme Wasser geht noch.', vi: 'Máy sưởi hỏng rồi, nhưng nước nóng vẫn còn.' },
          { de: 'Ich habe schon alles versucht, aber die Heizung funktioniert nicht.', vi: 'Tớ đã thử hết mọi cách rồi mà máy sưởi vẫn không hoạt động.' }
        ],
        exercises: [
          { vi: 'Máy sưởi hỏng rồi. Trong phòng lạnh quá.', de: 'Die Heizung funktioniert nicht. Es ist so kalt im Zimmer.', hint: 'Heizung • funktioniert • kalt' },
          { vi: 'Từ sáng nay máy sưởi không hoạt động nữa.', de: 'Seit heute Morgen funktioniert die Heizung nicht mehr.', hint: 'seit • heute Morgen • nicht mehr' },
          { vi: 'Máy sưởi hỏng rồi, chúng ta phải báo cho chủ nhà.', de: 'Die Heizung funktioniert nicht. Wir müssen den Vermieter informieren.', hint: 'Heizung • Vermieter • informieren' },
          { vi: 'Máy sưởi không hoạt động, nhưng đèn vẫn sáng.', de: 'Die Heizung funktioniert nicht, aber das Licht geht noch.', hint: 'Heizung • aber • Licht' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Die Heizung funktioniert nicht. Mir ist so kalt!', vi: 'Máy sưởi hỏng rồi. Tớ lạnh quá!' },
          { who: 'Ben', de: 'Ich rufe sofort den Hausmeister an.', vi: 'Tớ gọi bác quản gia ngay đây.' }
        ],
        mcq: {
          q: 'Im Winter ist deine Wohnung kalt. Die Heizung geht nicht. Was sagst du zum Hausmeister?',
          qVi: 'Mùa đông phòng cậu lạnh. Máy sưởi không chạy. Cậu nói gì với bác quản gia?',
          options: ['Die Heizung funktioniert nicht.', 'Die Heizung ist sehr schön.', 'Ich mag die Heizung.', 'Die Heizung kostet viel Geld.'],
          answer: 'Die Heizung funktioniert nicht.',
          why: 'Muốn báo máy sưởi hỏng thì dùng "funktioniert nicht" — không hoạt động, các đáp án khác không nói lên sự cố.'
        }
      },
      {
        id: 'schluessel-verloren',
        formula: 'Ich habe den Schlüssel verloren.',
        vi: 'Tôi mất chìa khóa rồi.',
        note: '"verlieren" là ngoại động từ, dùng Perfekt với "haben". "den Schlüssel" ở Akkusativ vì là tân ngữ trực tiếp.',
        vocab: [['der Schlüssel', 'chìa khóa'], ['verlieren', 'đánh mất'], ['der Ersatzschlüssel', 'chìa khóa dự phòng']],
        examples: [
          { de: 'Ich habe den Schlüssel verloren. Kannst du mir die Tür öffnen?', vi: 'Tớ mất chìa khóa rồi. Cậu mở cửa giúp tớ được không?' },
          { de: 'Oh nein, ich habe den Schlüssel verloren!', vi: 'Ôi không, tớ mất chìa khóa rồi!' },
          { de: 'Ich habe den Schlüssel im Bus verloren.', vi: 'Tớ đánh mất chìa khóa trên xe buýt.' },
          { de: 'Hast du den Schlüssel verloren oder liegt er zu Hause?', vi: 'Cậu mất chìa khóa rồi hay để quên ở nhà?' },
          { de: 'Ich habe meinen Schlüssel verloren und muss jetzt einen neuen machen lassen.', vi: 'Tớ mất chìa khóa rồi nên giờ phải đi làm chìa mới.' },
          { de: 'Zum Glück habe ich den Schlüssel nicht verloren, er war nur in meiner Jacke.', vi: 'May mà tớ không mất chìa khóa, nó chỉ nằm trong áo khoác thôi.' }
        ],
        exercises: [
          { vi: 'Tớ mất chìa khóa rồi, tớ không vào nhà được.', de: 'Ich habe den Schlüssel verloren. Ich kann nicht in die Wohnung.', hint: 'Schlüssel • verloren • Wohnung' },
          { vi: 'Cậu mất chìa khóa ở đâu vậy?', de: 'Wo hast du den Schlüssel verloren?', hint: 'wo • Schlüssel • verloren' },
          { vi: 'Tớ đánh mất chìa khóa ở công viên.', de: 'Ich habe den Schlüssel im Park verloren.', hint: 'Schlüssel • Park • verloren' },
          { vi: 'May mà tớ không mất chìa khóa, nó ở trong túi tớ.', de: 'Zum Glück habe ich den Schlüssel nicht verloren, er war in meiner Tasche.', hint: 'Glück • nicht verloren • Tasche' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich habe den Schlüssel verloren! Was soll ich tun?', vi: 'Tớ mất chìa khóa rồi! Tớ phải làm sao đây?' },
          { who: 'Ben', de: 'Ruf den Hausmeister an. Er hat einen Ersatzschlüssel.', vi: 'Gọi bác quản gia đi. Bác ấy có chìa dự phòng.' }
        ],
        mcq: {
          q: 'Du stehst vor deiner Wohnungstür und findest deinen Schlüssel nicht. Was ist passiert?',
          qVi: 'Cậu đứng trước cửa nhà mà không tìm thấy chìa khóa. Chuyện gì đã xảy ra?',
          options: ['Ich habe den Schlüssel verloren.', 'Ich habe den Schlüssel gefunden.', 'Ich habe den Schlüssel gekauft.', 'Ich habe den Schlüssel verkauft.'],
          answer: 'Ich habe den Schlüssel verloren.',
          why: '"verlieren" nghĩa là đánh mất, phù hợp với tình huống không tìm thấy chìa khóa; "gefunden" là đã tìm thấy, ngược nghĩa.'
        }
      },
      {
        id: 'hausmeister-wann',
        formula: 'Wann kommt der Hausmeister?',
        vi: 'Khi nào bác quản gia đến?',
        note: '"der Hausmeister" là người quản lý tòa nhà, sửa chữa những hỏng hóc nhỏ. Câu hỏi với "wann" hỏi về thời gian.',
        vocab: [['der Hausmeister', 'bác quản gia'], ['kommen', 'đến'], ['reparieren', 'sửa chữa']],
        examples: [
          { de: 'Wann kommt der Hausmeister? Die Heizung funktioniert nicht.', vi: 'Khi nào bác quản gia đến? Máy sưởi hỏng rồi.' },
          { de: 'Weißt du, wann der Hausmeister kommt?', vi: 'Cậu biết khi nào bác quản gia đến không?' },
          { de: 'Der Hausmeister kommt morgen um 9 Uhr.', vi: 'Bác quản gia đến lúc 9 giờ sáng mai.' },
          { de: 'Wann kommt der Hausmeister, um die Tür zu reparieren?', vi: 'Khi nào bác quản gia đến sửa cửa vậy?' },
          { de: 'Ich habe den Hausmeister angerufen. Er kommt heute Nachmittag.', vi: 'Tớ đã gọi bác quản gia rồi. Bác ấy đến chiều nay.' },
          { de: 'Der Hausmeister kommt nur am Montag und am Donnerstag.', vi: 'Bác quản gia chỉ đến vào thứ Hai và thứ Năm thôi.' }
        ],
        exercises: [
          { vi: 'Bác quản gia đến lúc mấy giờ?', de: 'Um wie viel Uhr kommt der Hausmeister?', hint: 'Uhr • kommt • Hausmeister' },
          { vi: 'Bác quản gia đến vào chiều nay.', de: 'Der Hausmeister kommt heute Nachmittag.', hint: 'Hausmeister • heute • Nachmittag' },
          { vi: 'Tớ đã gọi bác quản gia rồi, bác ấy đến lúc 9 giờ.', de: 'Ich habe den Hausmeister angerufen. Er kommt um 9 Uhr.', hint: 'angerufen • kommt • 9 Uhr' },
          { vi: 'Khi nào bác quản gia đến sửa vòi nước vậy?', de: 'Wann kommt der Hausmeister, um den Wasserhahn zu reparieren?', hint: 'wann • Hausmeister • reparieren' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Wann kommt der Hausmeister? Das Wasser läuft nicht.', vi: 'Khi nào bác quản gia đến? Nước không chảy.' },
          { who: 'Ben', de: 'Er kommt heute um 15 Uhr.', vi: 'Bác ấy đến lúc 3 giờ chiều nay.' }
        ],
        mcq: {
          q: 'Der Wasserhahn tropft. Du willst wissen, wann jemand kommt, um ihn zu reparieren. Was fragst du?',
          qVi: 'Vòi nước bị rỉ. Cậu muốn biết khi nào có người đến sửa. Cậu hỏi thế nào?',
          options: ['Wann kommt der Hausmeister?', 'Wo wohnt der Hausmeister?', 'Wie heißt der Hausmeister?', 'Warum kommt der Hausmeister?'],
          answer: 'Wann kommt der Hausmeister?',
          why: '"Wann" hỏi về thời gian, đúng với điều cậu muốn biết; các từ hỏi khác hỏi về nơi chốn, tên và lý do.'
        }
      },
      {
        id: 'wlan-benutzen',
        formula: 'Kann ich kurz dein WLAN benutzen?',
        vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút được không?',
        note: '"kurz" làm câu nhờ vả nghe nhẹ nhàng hơn — chỉ một chút thôi. "benutzen" đi với Akkusativ: "dein WLAN".',
        vocab: [['das WLAN', 'Wi-Fi'], ['benutzen', 'sử dụng'], ['das Passwort', 'mật khẩu']],
        examples: [
          { de: 'Kann ich kurz dein WLAN benutzen? Mein Internet geht nicht.', vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút được không? Mạng nhà tớ bị hỏng.' },
          { de: 'Kann ich kurz dein WLAN benutzen, um eine E-Mail zu schicken?', vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút để gửi email được không?' },
          { de: 'Natürlich! Das Passwort ist "Sommer2026".', vi: 'Tất nhiên rồi! Mật khẩu là "Sommer2026".' },
          { de: 'Entschuldigung, kann ich kurz dein WLAN benutzen? Ich muss etwas herunterladen.', vi: 'Xin lỗi, tớ dùng nhờ Wi-Fi của cậu một chút được không? Tớ cần tải một thứ.' },
          { de: 'Kann ich kurz dein WLAN benutzen? Mein Handy hat kein Guthaben mehr.', vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút được không? Điện thoại tớ hết tiền rồi.' },
          { de: 'Ja, klar! Benutz einfach mein WLAN.', vi: 'Ừ, được chứ! Cứ dùng Wi-Fi của tớ thoải mái.' }
        ],
        exercises: [
          { vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút để gửi tin nhắn được không?', de: 'Kann ich kurz dein WLAN benutzen, um eine Nachricht zu schicken?', hint: 'kurz • WLAN • Nachricht' },
          { vi: 'Mật khẩu Wi-Fi của cậu là gì vậy?', de: 'Wie ist dein WLAN-Passwort?', hint: 'wie • WLAN • Passwort' },
          { vi: 'Cảm ơn cậu, tớ chỉ dùng Wi-Fi một chút thôi.', de: 'Danke, ich benutze dein WLAN nur kurz.', hint: 'danke • WLAN • nur kurz' },
          { vi: 'Tớ có thể dùng Wi-Fi của cậu để tải tài liệu không?', de: 'Kann ich dein WLAN benutzen, um ein Dokument herunterzuladen?', hint: 'WLAN • benutzen • herunterzuladen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kann ich kurz dein WLAN benutzen? Mein Internet ist weg.', vi: 'Tớ dùng nhờ Wi-Fi của cậu một chút được không? Mạng nhà tớ mất rồi.' },
          { who: 'Ben', de: 'Klar! Das Passwort steht auf dem Zettel an der Tür.', vi: 'Được chứ! Mật khẩu ghi trên tờ giấy ở cửa kìa.' }
        ],
        mcq: {
          q: 'Dein Internet funktioniert nicht. Du bist bei einem Freund zu Besuch. Was sagst du?',
          qVi: 'Mạng nhà cậu bị hỏng. Cậu đang chơi nhà bạn. Cậu nói gì?',
          options: ['Kann ich kurz dein WLAN benutzen?', 'Kann ich dein Auto benutzen?', 'Kann ich dein Handy kaufen?', 'Kann ich bei dir wohnen?'],
          answer: 'Kann ich kurz dein WLAN benutzen?',
          why: 'Cậu chỉ cần dùng nhờ Wi-Fi một chút, nên "kurz dein WLAN benutzen" là câu phù hợp nhất; các đáp án khác không liên quan đến mạng.'
        }
      },
      {
        id: 'nachbarn-laut',
        formula: 'Die Nachbarn sind zu laut.',
        vi: 'Hàng xóm ồn quá.',
        note: '"zu laut" nghĩa là quá ồn. Câu này dùng để phàn nàn nhẹ, thường nói với bạn cùng phòng hoặc khi kể lại cho người khác.',
        vocab: [['der Nachbar', 'hàng xóm (nam)'], ['laut', 'ồn ào'], ['die Musik', 'nhạc']],
        examples: [
          { de: 'Die Nachbarn sind zu laut. Ich kann nicht schlafen.', vi: 'Hàng xóm ồn quá. Tớ không ngủ được.' },
          { de: 'Die Nachbarn sind zu laut, sie feiern schon wieder eine Party.', vi: 'Hàng xóm ồn quá, họ lại đang tiệc tùng.' },
          { de: 'Jeden Samstag sind die Nachbarn zu laut.', vi: 'Cứ thứ Bảy nào hàng xóm cũng ồn ào.' },
          { de: 'Die Nachbarn sind zu laut. Soll ich mich beschweren?', vi: 'Hàng xóm ồn quá. Tớ có nên phàn nàn không?' },
          { de: 'Die Musik von den Nachbarn ist zu laut.', vi: 'Nhạc nhà hàng xóm to quá.' },
          { de: 'Die Nachbarn oben sind zu laut. Ich höre jeden Schritt.', vi: 'Hàng xóm tầng trên ồn quá. Tớ nghe thấy từng bước chân.' }
        ],
        exercises: [
          { vi: 'Hàng xóm ồn quá, tớ không tập trung học được.', de: 'Die Nachbarn sind zu laut. Ich kann mich nicht konzentrieren.', hint: 'Nachbarn • laut • konzentrieren' },
          { vi: 'Hàng xóm tầng trên ồn quá, họ đang sửa nhà.', de: 'Die Nachbarn oben sind zu laut. Sie renovieren die Wohnung.', hint: 'Nachbarn • oben • renovieren' },
          { vi: 'Cứ cuối tuần nào hàng xóm cũng ồn ào.', de: 'Jedes Wochenende sind die Nachbarn zu laut.', hint: 'Wochenende • Nachbarn • laut' },
          { vi: 'Hàng xóm ồn quá, tớ phải nói chuyện với họ.', de: 'Die Nachbarn sind zu laut. Ich muss mit ihnen sprechen.', hint: 'Nachbarn • laut • sprechen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Die Nachbarn sind zu laut. Ich kann nicht lernen.', vi: 'Hàng xóm ồn quá. Tớ không học được.' },
          { who: 'Ben', de: 'Dann sag es ihnen einfach. Oder ruf den Hausmeister an.', vi: 'Vậy cậu cứ nói thẳng với họ. Hoặc gọi bác quản gia.' }
        ],
        mcq: {
          q: 'Es ist 1 Uhr nachts und die Nachbarn feiern laut. Was ist das Problem?',
          qVi: 'Đã 1 giờ sáng mà hàng xóm vẫn tiệc tùng ầm ĩ. Vấn đề là gì?',
          options: ['Die Nachbarn sind zu laut.', 'Die Nachbarn sind sehr nett.', 'Die Nachbarn sind im Urlaub.', 'Die Nachbarn sind sehr leise.'],
          answer: 'Die Nachbarn sind zu laut.',
          why: '"zu laut" nghĩa là quá ồn, đúng với tình huống tiệc tùng lúc 1 giờ sáng; "leise" là yên tĩnh, ngược nghĩa.'
        }
      }
    ]
  },
  {
    id: 'reisen',
    title: 'Du lịch & khách sạn',
    icon: '✈️',
    patterns: [
      {
        id: 'zimmer-reserviert',
        formula: 'Ich habe ein Zimmer reserviert.',
        vi: 'Tôi đã đặt phòng rồi.',
        note: '"reservieren" dùng Perfekt với "haben". Ở quầy lễ tân, câu này thường đi kèm tên người đặt phòng.',
        vocab: [['reservieren', 'đặt trước'], ['das Zimmer', 'phòng'], ['die Rezeption', 'lễ tân']],
        examples: [
          { de: 'Guten Tag! Ich habe ein Zimmer reserviert.', vi: 'Chào chị! Tôi đã đặt phòng rồi ạ.' },
          { de: 'Ich habe ein Zimmer für zwei Nächte reserviert.', vi: 'Tôi đã đặt phòng hai đêm.' },
          { de: 'Ich habe ein Zimmer reserviert. Mein Name ist Nguyen.', vi: 'Tôi đã đặt phòng rồi. Tôi tên là Nguyen.' },
          { de: 'Wir haben ein Doppelzimmer reserviert.', vi: 'Chúng tôi đã đặt một phòng đôi.' },
          { de: 'Ich habe ein Zimmer mit Meerblick reserviert.', vi: 'Tôi đã đặt một phòng nhìn ra biển.' },
          { de: 'Entschuldigung, ich habe ein Zimmer reserviert, aber ich finde die Bestätigung nicht.', vi: 'Xin lỗi, tôi đã đặt phòng rồi nhưng tôi không tìm thấy xác nhận đặt phòng.' }
        ],
        exercises: [
          { vi: 'Tôi đã đặt phòng ba đêm.', de: 'Ich habe ein Zimmer für drei Nächte reserviert.', hint: 'Zimmer • drei • Nächte' },
          { vi: 'Chúng tôi đã đặt một phòng đơn.', de: 'Wir haben ein Einzelzimmer reserviert.', hint: 'wir • Einzelzimmer • reserviert' },
          { vi: 'Tôi đã đặt phòng rồi, tên tôi là Lan.', de: 'Ich habe ein Zimmer reserviert. Mein Name ist Lan.', hint: 'Zimmer • reserviert • Name' },
          { vi: 'Tôi đã đặt một phòng nhìn ra thành phố.', de: 'Ich habe ein Zimmer mit Stadtblick reserviert.', hint: 'Zimmer • Stadtblick • reserviert' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Guten Abend! Ich habe ein Zimmer reserviert.', vi: 'Chào buổi tối! Tôi đã đặt phòng rồi ạ.' },
          { who: 'Ben', de: 'Guten Tag! Wie ist Ihr Name, bitte?', vi: 'Chào chị! Chị tên là gì ạ?' }
        ],
        mcq: {
          q: 'Du kommst im Hotel an. Du hast schon online gebucht. Was sagst du an der Rezeption?',
          qVi: 'Cậu đến khách sạn. Cậu đã đặt phòng online rồi. Cậu nói gì ở lễ tân?',
          options: ['Ich habe ein Zimmer reserviert.', 'Ich möchte ein Zimmer kaufen.', 'Ich habe ein Zimmer verloren.', 'Ich möchte ein Zimmer bauen.'],
          answer: 'Ich habe ein Zimmer reserviert.',
          why: '"reservieren" là đặt trước, đúng với việc cậu đã đặt phòng online; mua, mất hay xây phòng đều không hợp lý ở đây.'
        }
      },
      {
        id: 'zimmer-preis',
        formula: 'Wie viel kostet eine Nacht?',
        vi: 'Một đêm giá bao nhiêu?',
        note: '"Wie viel kostet...?" là câu hỏi giá quen thuộc. "eine Nacht" ở Akkusativ sau "kosten".',
        vocab: [['kosten', 'tốn (tiền)'], ['die Nacht', 'đêm'], ['der Preis', 'giá']],
        examples: [
          { de: 'Wie viel kostet eine Nacht in diesem Hotel?', vi: 'Một đêm ở khách sạn này giá bao nhiêu?' },
          { de: 'Wie viel kostet eine Nacht mit Frühstück?', vi: 'Một đêm kèm bữa sáng giá bao nhiêu?' },
          { de: 'Entschuldigung, wie viel kostet eine Nacht im Doppelzimmer?', vi: 'Xin lỗi, một đêm phòng đôi giá bao nhiêu ạ?' },
          { de: 'Eine Nacht kostet 80 Euro.', vi: 'Một đêm giá 80 euro.' },
          { de: 'Wie viel kostet eine Nacht für zwei Personen?', vi: 'Một đêm cho hai người giá bao nhiêu?' },
          { de: 'Das ist zu teuer. Wie viel kostet eine Nacht ohne Frühstück?', vi: 'Đắt quá. Một đêm không kèm bữa sáng giá bao nhiêu?' }
        ],
        exercises: [
          { vi: 'Một đêm ở đây giá bao nhiêu ạ?', de: 'Wie viel kostet eine Nacht hier?', hint: 'wie viel • kostet • Nacht' },
          { vi: 'Một đêm phòng đơn giá bao nhiêu?', de: 'Wie viel kostet eine Nacht im Einzelzimmer?', hint: 'Nacht • Einzelzimmer • kostet' },
          { vi: 'Một đêm giá 120 euro, đã bao gồm bữa sáng.', de: 'Eine Nacht kostet 120 Euro, inklusive Frühstück.', hint: 'Nacht • kostet • Frühstück' },
          { vi: 'Một đêm không kèm bữa sáng thì rẻ hơn phải không?', de: 'Eine Nacht ohne Frühstück ist billiger, oder?', hint: 'Nacht • ohne • billiger' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Wie viel kostet eine Nacht mit Meerblick?', vi: 'Một đêm phòng nhìn ra biển giá bao nhiêu ạ?' },
          { who: 'Ben', de: 'Eine Nacht mit Frühstück kostet 95 Euro.', vi: 'Một đêm kèm bữa sáng giá 95 euro ạ.' }
        ],
        mcq: {
          q: 'Du bist im Hotel und willst den Preis wissen. Was fragst du?',
          qVi: 'Cậu đang ở khách sạn và muốn biết giá. Cậu hỏi thế nào?',
          options: ['Wie viel kostet eine Nacht?', 'Wie spät ist eine Nacht?', 'Wie alt ist eine Nacht?', 'Wie groß ist eine Nacht?'],
          answer: 'Wie viel kostet eine Nacht?',
          why: 'Hỏi giá thì dùng "Wie viel kostet...?", các từ hỏi "wie spät", "wie alt", "wie groß" hỏi về giờ, tuổi và kích thước.'
        }
      },
      {
        id: 'rezeption-wo',
        formula: 'Wo ist die Rezeption?',
        vi: 'Lễ tân ở đâu ạ?',
        note: '"Wo" hỏi về vị trí. Ở khách sạn, hỏi đường bằng "Wo ist...?" rất lịch sự, có thể thêm "Entschuldigung" ở đầu.',
        vocab: [['die Rezeption', 'lễ tân'], ['wo', 'ở đâu'], ['der Aufzug', 'thang máy']],
        examples: [
          { de: 'Entschuldigung, wo ist die Rezeption?', vi: 'Xin lỗi, lễ tân ở đâu ạ?' },
          { de: 'Wo ist die Rezeption? Ich möchte auschecken.', vi: 'Lễ tân ở đâu ạ? Tôi muốn trả phòng.' },
          { de: 'Die Rezeption ist gleich links.', vi: 'Lễ tân ở ngay bên trái.' },
          { de: 'Wo ist die Rezeption? Ich habe eine Frage zu meiner Rechnung.', vi: 'Lễ tân ở đâu ạ? Tôi có câu hỏi về hóa đơn của tôi.' },
          { de: 'Die Rezeption ist rund um die Uhr geöffnet.', vi: 'Lễ tân mở cửa 24 giờ.' },
          { de: 'Die Rezeption ist im Erdgeschoss, neben dem Aufzug.', vi: 'Lễ tân ở tầng trệt, bên cạnh thang máy.' }
        ],
        exercises: [
          { vi: 'Xin lỗi, thang máy ở đâu ạ?', de: 'Entschuldigung, wo ist der Aufzug?', hint: 'Entschuldigung • wo • Aufzug' },
          { vi: 'Lễ tân ở ngay bên phải, cạnh nhà hàng.', de: 'Die Rezeption ist gleich rechts, neben dem Restaurant.', hint: 'Rezeption • rechts • Restaurant' },
          { vi: 'Tôi có câu hỏi về hóa đơn, lễ tân ở đâu ạ?', de: 'Ich habe eine Frage zu meiner Rechnung. Wo ist die Rezeption?', hint: 'Frage • Rechnung • Rezeption' },
          { vi: 'Lễ tân đóng cửa lúc mấy giờ?', de: 'Um wie viel Uhr schließt die Rezeption?', hint: 'Uhr • schließt • Rezeption' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Wo ist bitte die Rezeption?', vi: 'Cho hỏi lễ tân ở đâu ạ?' },
          { who: 'Ben', de: 'Die Rezeption ist gleich links, neben dem Aufzug.', vi: 'Lễ tân ở ngay bên trái, cạnh thang máy ạ.' }
        ],
        mcq: {
          q: 'Du bist neu im Hotel und suchst die Rezeption. Was fragst du?',
          qVi: 'Cậu mới đến khách sạn và đang tìm lễ tân. Cậu hỏi thế nào?',
          options: ['Wo ist die Rezeption?', 'Wie ist die Rezeption?', 'Wann ist die Rezeption?', 'Warum ist die Rezeption?'],
          answer: 'Wo ist die Rezeption?',
          why: 'Tìm vị trí thì hỏi "Wo...?", còn "Wie" hỏi như thế nào, "Wann" hỏi khi nào, "Warum" hỏi tại sao.'
        }
      },
      {
        id: 'auschecken',
        formula: 'Ich möchte auschecken, bitte.',
        vi: 'Tôi muốn trả phòng ạ.',
        note: '"auschecken" là động từ tách: "Ich checke aus". Với "möchte" thì động từ nguyên thể đứng cuối câu. Nói thêm "bitte" cho lịch sự.',
        vocab: [['auschecken', 'trả phòng'], ['die Rechnung', 'hóa đơn'], ['das Gepäck', 'hành lý']],
        examples: [
          { de: 'Guten Morgen! Ich möchte auschecken, bitte.', vi: 'Chào buổi sáng! Tôi muốn trả phòng ạ.' },
          { de: 'Ich möchte jetzt auschecken. Hier ist der Schlüssel.', vi: 'Tôi muốn trả phòng bây giờ. Đây là chìa khóa.' },
          { de: 'Kann ich bitte auschecken? Mein Zug fährt um 10 Uhr.', vi: 'Tôi trả phòng được không ạ? Tàu của tôi chạy lúc 10 giờ.' },
          { de: 'Ich möchte auschecken und die Rechnung bezahlen.', vi: 'Tôi muốn trả phòng và thanh toán hóa đơn.' },
          { de: 'Bis wann muss ich auschecken?', vi: 'Tôi phải trả phòng trước mấy giờ?' },
          { de: 'Wir möchten auschecken. Können Sie bitte das Gepäck nach unten bringen?', vi: 'Chúng tôi muốn trả phòng. Anh có thể mang hành lý xuống giúp chúng tôi không?' }
        ],
        exercises: [
          { vi: 'Chúng tôi muốn trả phòng, cảm ơn anh.', de: 'Wir möchten auschecken, danke.', hint: 'wir • möchten • auschecken' },
          { vi: 'Tôi có thể trả phòng muộn được không?', de: 'Kann ich später auschecken?', hint: 'kann • später • auschecken' },
          { vi: 'Tôi muốn trả phòng, tôi thanh toán bằng thẻ được không?', de: 'Ich möchte auschecken. Kann ich mit Karte bezahlen?', hint: 'auschecken • Karte • bezahlen' },
          { vi: 'Tôi trả phòng lúc 11 giờ được không?', de: 'Kann ich um 11 Uhr auschecken?', hint: 'kann • 11 Uhr • auschecken' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich möchte auschecken, bitte. Können Sie mir ein Taxi rufen?', vi: 'Tôi muốn trả phòng ạ. Anh gọi giúp tôi một chiếc taxi được không?' },
          { who: 'Ben', de: 'Guten Morgen! Gerne. Die Rechnung, bitte?', vi: 'Chào buổi sáng! Vâng ạ. Chị thanh toán hóa đơn nhé?' }
        ],
        mcq: {
          q: 'Du verlässt das Hotel am Morgen. Was sagst du an der Rezeption?',
          qVi: 'Buổi sáng cậu rời khách sạn. Cậu nói gì ở lễ tân?',
          options: ['Ich möchte auschecken, bitte.', 'Ich möchte einchecken, bitte.', 'Ich möchte frühstücken, bitte.', 'Ich möchte schlafen, bitte.'],
          answer: 'Ich möchte auschecken, bitte.',
          why: 'Rời khách sạn là "auschecken" (trả phòng); "einchecken" là nhận phòng, ngược lại hoàn toàn.'
        }
      },
      {
        id: 'schluessel-haben',
        formula: 'Kann ich den Schlüssel haben?',
        vi: 'Cho tôi xin chìa khóa phòng được không ạ?',
        note: '"Kann ich... haben?" là cách xin thứ gì đó lịch sự. "den Schlüssel" ở Akkusativ vì là tân ngữ của "haben".',
        vocab: [['der Schlüssel', 'chìa khóa'], ['die Zimmernummer', 'số phòng'], ['haben', 'có']],
        examples: [
          { de: 'Kann ich den Schlüssel haben? Ich wohne in Zimmer 205.', vi: 'Cho tôi xin chìa khóa phòng được không ạ? Tôi ở phòng 205.' },
          { de: 'Entschuldigung, kann ich den Schlüssel für Zimmer 301 haben?', vi: 'Xin lỗi, cho tôi xin chìa khóa phòng 301 được không ạ?' },
          { de: 'Hier ist Ihr Schlüssel. Zimmer 205, zweiter Stock.', vi: 'Đây là chìa khóa của chị. Phòng 205, tầng hai.' },
          { de: 'Kann ich bitte den Schlüssel haben? Ich muss noch etwas aus dem Zimmer holen.', vi: 'Cho tôi xin chìa khóa được không ạ? Tôi còn phải lấy đồ trong phòng.' },
          { de: 'Kann ich den Schlüssel haben? Ich habe ihn im Zimmer vergessen.', vi: 'Cho tôi xin chìa khóa được không ạ? Tôi để quên chìa trong phòng rồi.' },
          { de: 'Zwei Schlüssel, bitte. Kann ich den zweiten Schlüssel haben?', vi: 'Hai chìa khóa ạ. Cho tôi xin chìa thứ hai được không?' }
        ],
        exercises: [
          { vi: 'Cho tôi xin chìa khóa được không ạ? Tôi vừa nhận phòng.', de: 'Kann ich den Schlüssel haben? Ich habe gerade eingecheckt.', hint: 'Schlüssel • haben • eingecheckt' },
          { vi: 'Tôi ở phòng 205, cho tôi xin chìa khóa được không?', de: 'Ich wohne in Zimmer 205. Kann ich den Schlüssel haben?', hint: 'Zimmer • 205 • Schlüssel' },
          { vi: 'Cho tôi xin chìa khóa thứ hai được không?', de: 'Kann ich den zweiten Schlüssel haben?', hint: 'zweiten • Schlüssel • haben' },
          { vi: 'Đây là chìa khóa của anh, phòng 301, tầng ba.', de: 'Hier ist Ihr Schlüssel. Zimmer 301, dritter Stock.', hint: 'Schlüssel • Zimmer • Stock' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kann ich den Schlüssel haben? Ich wohne in Zimmer 301.', vi: 'Cho tôi xin chìa khóa phòng được không ạ? Tôi ở phòng 301.' },
          { who: 'Ben', de: 'Natürlich! Hier ist Ihr Schlüssel.', vi: 'Tất nhiên rồi ạ! Đây là chìa khóa của chị.' }
        ],
        mcq: {
          q: 'Du bist an der Rezeption und willst deinen Zimmerschlüssel. Was sagst du?',
          qVi: 'Cậu đang ở lễ tân và muốn lấy chìa khóa phòng. Cậu nói gì?',
          options: ['Kann ich den Schlüssel haben?', 'Kann ich den Schlüssel kaufen?', 'Kann ich den Schlüssel kochen?', 'Kann ich den Schlüssel waschen?'],
          answer: 'Kann ich den Schlüssel haben?',
          why: 'Muốn nhận chìa khóa thì nói "Kann ich den Schlüssel haben?"; mua, nấu hay giặt chìa khóa đều vô nghĩa.'
        }
      },
      {
        id: 'zimmer-schoen',
        formula: 'Das Zimmer ist sehr schön.',
        vi: 'Phòng đẹp quá.',
        note: '"sehr" nhấn mạnh tính từ "schön". Khen phòng là cách lịch sự khi nói chuyện với lễ tân hoặc chủ nhà.',
        vocab: [['schön', 'đẹp'], ['das Zimmer', 'phòng'], ['der Blick', 'tầm nhìn']],
        examples: [
          { de: 'Das Zimmer ist sehr schön. Vielen Dank!', vi: 'Phòng đẹp quá. Cảm ơn chị nhiều!' },
          { de: 'Das Zimmer ist sehr schön und sehr ruhig.', vi: 'Phòng đẹp quá mà lại rất yên tĩnh.' },
          { de: 'Das Zimmer ist sehr schön. Der Blick auf die Berge ist toll!', vi: 'Phòng đẹp quá. Nhìn ra núi tuyệt vời!' },
          { de: 'Das Zimmer ist sehr schön, aber das Bett ist zu klein.', vi: 'Phòng đẹp quá, nhưng giường hơi nhỏ.' },
          { de: 'Das Zimmer ist sehr schön, ich bleibe gern eine Nacht länger.', vi: 'Phòng đẹp quá, tôi muốn ở thêm một đêm nữa.' },
          { de: 'Das Zimmer ist sehr schön und sauber.', vi: 'Phòng đẹp quá mà lại sạch sẽ.' }
        ],
        exercises: [
          { vi: 'Phòng đẹp quá, tôi rất thích!', de: 'Das Zimmer ist sehr schön, es gefällt mir sehr!', hint: 'Zimmer • schön • gefällt' },
          { vi: 'Phòng đẹp quá, nhìn ra biển thật tuyệt!', de: 'Das Zimmer ist sehr schön. Der Blick aufs Meer ist toll!', hint: 'Zimmer • Blick • Meer' },
          { vi: 'Phòng đẹp nhưng hơi nhỏ.', de: 'Das Zimmer ist schön, aber ein bisschen klein.', hint: 'Zimmer • schön • klein' },
          { vi: 'Phòng sạch sẽ và đẹp quá!', de: 'Das Zimmer ist sauber und sehr schön!', hint: 'Zimmer • sauber • schön' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Das Zimmer ist wirklich sehr schön. Danke!', vi: 'Phòng đẹp thật đấy. Cảm ơn chị!' },
          { who: 'Ben', de: 'Freut mich! Ich wünsche Ihnen einen schönen Aufenthalt.', vi: 'Nghe vậy tôi mừng lắm! Chúc chị ở đây vui vẻ.' }
        ],
        mcq: {
          q: 'Du kommst in dein Hotelzimmer und es gefällt dir sehr. Was sagst du?',
          qVi: 'Cậu vào phòng khách sạn và rất thích. Cậu nói gì?',
          options: ['Das Zimmer ist sehr schön.', 'Das Zimmer ist sehr hässlich.', 'Das Zimmer ist sehr teuer.', 'Das Zimmer ist sehr klein.'],
          answer: 'Das Zimmer ist sehr schön.',
          why: '"schön" nghĩa là đẹp, đúng với cảm giác thích phòng; "hässlich" là xấu, ngược nghĩa.'
        }
      }
    ]
  },
  {
    id: 'schule-pruefung',
    title: 'Trường học & thi cử',
    icon: '🎓',
    patterns: [
      {
        id: 'helfen-bitte',
        formula: 'Kannst du mir bitte helfen?',
        vi: 'Cậu giúp tớ được không?',
        note: '"helfen" đi với Dativ: "mir". Câu nhờ vả này dùng được ở trường, ở nhà hay ở chỗ làm.',
        vocab: [['helfen', 'giúp đỡ'], ['mir', 'tớ (Dativ)'], ['die Hausaufgaben', 'bài tập về nhà']],
        examples: [
          { de: 'Kannst du mir bitte helfen? Ich verstehe die Aufgabe nicht.', vi: 'Cậu giúp tớ được không? Tớ không hiểu bài này.' },
          { de: 'Kannst du mir bitte bei den Hausaufgaben helfen?', vi: 'Cậu giúp tớ làm bài tập về nhà được không?' },
          { de: 'Natürlich helfe ich dir gern!', vi: 'Tất nhiên rồi, tớ giúp cậu ngay!' },
          { de: 'Kannst du mir bitte helfen? Ich muss den Text übersetzen.', vi: 'Cậu giúp tớ được không? Tớ phải dịch đoạn văn này.' },
          { de: 'Entschuldigung, kannst du mir bitte helfen? Ich finde den Raum nicht.', vi: 'Xin lỗi, cậu giúp tớ được không? Tớ không tìm thấy phòng học.' },
          { de: 'Kannst du mir bitte helfen, den Tisch zu tragen?', vi: 'Cậu giúp tớ khiêng cái bàn được không?' }
        ],
        exercises: [
          { vi: 'Cậu giúp tớ được không? Tớ không tìm thấy lớp học.', de: 'Kannst du mir bitte helfen? Ich finde den Klassenraum nicht.', hint: 'helfen • finde • Klassenraum' },
          { vi: 'Cậu giúp tớ dịch câu này được không?', de: 'Kannst du mir bitte helfen, diesen Satz zu übersetzen?', hint: 'helfen • Satz • übersetzen' },
          { vi: 'Cậu giúp tớ mang cái hộp này được không?', de: 'Kannst du mir bitte helfen, diese Kiste zu tragen?', hint: 'helfen • Kiste • tragen' },
          { vi: 'Cậu giúp tớ ôn thi được không?', de: 'Kannst du mir bitte helfen, für die Prüfung zu lernen?', hint: 'helfen • Prüfung • lernen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du mir bitte helfen? Ich verstehe diese Grammatik nicht.', vi: 'Cậu giúp tớ được không? Tớ không hiểu ngữ pháp này.' },
          { who: 'Ben', de: 'Klar! Zeig mal, wo ist das Problem?', vi: 'Được chứ! Đâu, chỗ nào cậu không hiểu?' }
        ],
        mcq: {
          q: 'Du verstehst eine Aufgabe in der Schule nicht. Was sagst du zu deinem Freund?',
          qVi: 'Cậu không hiểu một bài tập ở trường. Cậu nói gì với bạn?',
          options: ['Kannst du mir bitte helfen?', 'Kannst du mir bitte schaden?', 'Kannst du mir bitte wehtun?', 'Kannst du mich bitte ignorieren?'],
          answer: 'Kannst du mir bitte helfen?',
          why: '"helfen" nghĩa là giúp đỡ; "schaden" là gây hại, "wehtun" là làm đau, "ignorieren" là làm ngơ — đều ngược với điều cậu muốn.'
        }
      },
      {
        id: 'pruefung-bestanden',
        formula: 'Ich habe die Prüfung bestanden!',
        vi: 'Tớ thi đậu rồi!',
        note: '"bestehen" dùng Perfekt với "haben": "habe bestanden". Nói câu này với giọng vui mừng, thường kèm dấu chấm than.',
        vocab: [['die Prüfung', 'kỳ thi'], ['bestehen', 'thi đậu'], ['stolz', 'tự hào']],
        examples: [
          { de: 'Ich habe die Prüfung bestanden! Ich bin so glücklich!', vi: 'Tớ thi đậu rồi! Tớ vui quá!' },
          { de: 'Ich habe die B2-Prüfung bestanden!', vi: 'Tớ thi đậu B2 rồi!' },
          { de: 'Endlich! Ich habe die Prüfung bestanden.', vi: 'Cuối cùng thì! Tớ thi đậu rồi.' },
          { de: 'Ich habe die Prüfung beim ersten Mal bestanden.', vi: 'Tớ thi đậu ngay lần đầu tiên.' },
          { de: 'Meine Freundin hat die Prüfung auch bestanden.', vi: 'Bạn gái tớ cũng thi đậu rồi.' },
          { de: 'Ich habe die Prüfung bestanden, obwohl sie sehr schwer war.', vi: 'Tớ thi đậu rồi, dù kỳ thi rất khó.' }
        ],
        exercises: [
          { vi: 'Cậu thi đậu chưa?', de: 'Hast du die Prüfung bestanden?', hint: 'hast • Prüfung • bestanden' },
          { vi: 'Bạn tớ cũng thi đậu rồi.', de: 'Mein Freund hat die Prüfung auch bestanden.', hint: 'Freund • Prüfung • bestanden' },
          { vi: 'Cuối cùng tớ cũng thi đậu!', de: 'Endlich habe ich die Prüfung bestanden!', hint: 'endlich • Prüfung • bestanden' },
          { vi: 'Chúc mừng! Cậu thi đậu rồi à?', de: 'Glückwunsch! Hast du die Prüfung bestanden?', hint: 'Glückwunsch • Prüfung • bestanden' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich habe die Prüfung bestanden! Endlich!', vi: 'Tớ thi đậu rồi! Cuối cùng thì!' },
          { who: 'Ben', de: 'Super! Herzlichen Glückwunsch! Lass uns feiern!', vi: 'Tuyệt quá! Chúc mừng cậu nhé! Mình đi ăn mừng thôi!' }
        ],
        mcq: {
          q: 'Dein Freund hat gute Nachrichten: Er hat die Prüfung geschafft. Was sagt er?',
          qVi: 'Bạn cậu có tin vui: cậu ấy thi xong và đậu. Cậu ấy nói gì?',
          options: ['Ich habe die Prüfung bestanden!', 'Ich habe die Prüfung vergessen!', 'Ich habe die Prüfung verloren!', 'Ich habe die Prüfung verkauft!'],
          answer: 'Ich habe die Prüfung bestanden!',
          why: '"bestehen" nghĩa là thi đậu; quên, mất hay bán kỳ thi đều không hợp lý.'
        }
      },
      {
        id: 'pruefung-wann',
        formula: 'Wann ist die Prüfung?',
        vi: 'Khi nào thi vậy?',
        note: '"Wann" hỏi về thời gian. Trong trường học, câu này thường dùng khi hỏi lịch thi hoặc giờ thi.',
        vocab: [['die Prüfung', 'kỳ thi'], ['wann', 'khi nào'], ['der Termin', 'ngày hẹn / lịch']],
        examples: [
          { de: 'Wann ist die Prüfung? Ich muss noch viel lernen.', vi: 'Khi nào thi vậy? Tớ vẫn còn phải học nhiều lắm.' },
          { de: 'Weißt du, wann die Prüfung ist?', vi: 'Cậu biết khi nào thi không?' },
          { de: 'Die Prüfung ist am Freitag um 9 Uhr.', vi: 'Kỳ thi vào thứ Sáu lúc 9 giờ.' },
          { de: 'Wann ist die mündliche Prüfung?', vi: 'Khi nào thi nói vậy?' },
          { de: 'Die schriftliche Prüfung ist nächste Woche.', vi: 'Thi viết vào tuần sau.' },
          { de: 'Wann ist die Prüfung? Ich habe den Termin vergessen.', vi: 'Khi nào thi vậy? Tớ quên mất lịch rồi.' }
        ],
        exercises: [
          { vi: 'Kỳ thi bắt đầu lúc mấy giờ?', de: 'Um wie viel Uhr beginnt die Prüfung?', hint: 'Uhr • beginnt • Prüfung' },
          { vi: 'Thi nói vào thứ Hai.', de: 'Die mündliche Prüfung ist am Montag.', hint: 'mündliche • Prüfung • Montag' },
          { vi: 'Khi nào thi viết vậy?', de: 'Wann ist die schriftliche Prüfung?', hint: 'wann • schriftliche • Prüfung' },
          { vi: 'Tớ quên mất lịch thi rồi.', de: 'Ich habe den Termin vergessen.', hint: 'Termin • vergessen • habe' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Weißt du, wann die Prüfung ist? Ich habe den Termin vergessen.', vi: 'Cậu biết khi nào thi không? Tớ quên mất lịch rồi.' },
          { who: 'Ben', de: 'Am Freitag um 9 Uhr. Keine Panik!', vi: 'Thứ Sáu lúc 9 giờ. Đừng lo!' }
        ],
        mcq: {
          q: 'Du willst wissen, an welchem Tag die Prüfung ist. Was fragst du?',
          qVi: 'Cậu muốn biết kỳ thi vào ngày nào. Cậu hỏi thế nào?',
          options: ['Wann ist die Prüfung?', 'Wo ist die Prüfung?', 'Wie ist die Prüfung?', 'Warum ist die Prüfung?'],
          answer: 'Wann ist die Prüfung?',
          why: '"Wann" hỏi về thời gian (ngày, giờ); "Wo" hỏi ở đâu, "Wie" hỏi như thế nào, "Warum" hỏi tại sao.'
        }
      },
      {
        id: 'nicht-verstehen',
        formula: 'Ich verstehe das nicht.',
        vi: 'Tớ không hiểu chỗ này.',
        note: '"verstehen" là động từ thường, "das" ở Akkusativ. Câu này rất lịch sự khi nói với giáo viên — không ai chê cậu vì không hiểu.',
        vocab: [['verstehen', 'hiểu'], ['die Aufgabe', 'bài tập'], ['erklären', 'giải thích']],
        examples: [
          { de: 'Ich verstehe das nicht. Kannst du es mir erklären?', vi: 'Tớ không hiểu chỗ này. Cậu giải thích giúp tớ được không?' },
          { de: 'Entschuldigung, ich verstehe das nicht. Können Sie das bitte wiederholen?', vi: 'Xin lỗi thầy, em không hiểu. Thầy nhắc lại giúp em được không?' },
          { de: 'Ich verstehe das Wort nicht. Was bedeutet "Prüfung"?', vi: 'Tớ không hiểu từ này. "Prüfung" nghĩa là gì?' },
          { de: 'Ich verstehe die Aufgabe nicht. Sie ist zu schwer.', vi: 'Tớ không hiểu bài này. Nó khó quá.' },
          { de: 'Ich verstehe das nicht, obwohl ich es zweimal gelesen habe.', vi: 'Tớ không hiểu, dù đã đọc hai lần rồi.' },
          { de: 'Keine Sorge, wenn du das nicht verstehst. Frag einfach!', vi: 'Đừng lo nếu cậu không hiểu. Cứ hỏi đi!' }
        ],
        exercises: [
          { vi: 'Tớ không hiểu từ này, nó nghĩa là gì?', de: 'Ich verstehe dieses Wort nicht. Was bedeutet es?', hint: 'verstehe • Wort • bedeutet' },
          { vi: 'Xin lỗi cô, em không hiểu bài này.', de: 'Entschuldigung, ich verstehe die Aufgabe nicht.', hint: 'Entschuldigung • verstehe • Aufgabe' },
          { vi: 'Tớ không hiểu ngữ pháp này.', de: 'Ich verstehe diese Grammatik nicht.', hint: 'verstehe • Grammatik • nicht' },
          { vi: 'Đừng lo, cứ hỏi nếu cậu không hiểu.', de: 'Keine Sorge, frag einfach, wenn du etwas nicht verstehst.', hint: 'Sorge • frag • verstehst' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich verstehe den Text nicht. Kannst du mir helfen?', vi: 'Tớ không hiểu đoạn văn này. Cậu giúp tớ được không?' },
          { who: 'Ben', de: 'Klar! Pass auf, das geht so...', vi: 'Được chứ! Nghe này, nó như thế này...' }
        ],
        mcq: {
          q: 'Der Lehrer erklärt etwas, aber du verstehst es nicht. Was sagst du höflich?',
          qVi: 'Thầy đang giảng mà cậu không hiểu. Cậu nói gì cho lịch sự?',
          options: ['Ich verstehe das nicht.', 'Ich verstehe alles.', 'Ich weiß alles.', 'Ich höre nichts.'],
          answer: 'Ich verstehe das nicht.',
          why: 'Muốn nói mình không hiểu thì dùng "Ich verstehe das nicht"; "Ich verstehe alles" là tớ hiểu hết, ngược nghĩa.'
        }
      },
      {
        id: 'wiederholen-bitte',
        formula: 'Kannst du das bitte wiederholen?',
        vi: 'Cậu nhắc lại giúp tớ được không?',
        note: '"wiederholen" nghĩa là nhắc lại. Câu này dùng khi nghe không kịp — rất bình thường trong lớp học, đừng ngại dùng.',
        vocab: [['wiederholen', 'nhắc lại'], ['langsam', 'chậm'], ['der Satz', 'câu']],
        examples: [
          { de: 'Kannst du das bitte wiederholen? Ich habe es nicht gehört.', vi: 'Cậu nhắc lại giúp tớ được không? Tớ không nghe thấy.' },
          { de: 'Entschuldigung, können Sie das bitte wiederholen?', vi: 'Xin lỗi thầy, thầy nhắc lại giúp em được không?' },
          { de: 'Kannst du das bitte langsamer wiederholen?', vi: 'Cậu nhắc lại chậm hơn giúp tớ được không?' },
          { de: 'Kannst du den Satz bitte wiederholen?', vi: 'Cậu nhắc lại câu đó giúp tớ được không?' },
          { de: 'Ich habe das nicht verstanden. Kannst du das bitte wiederholen?', vi: 'Tớ không hiểu. Cậu nhắc lại giúp tớ được không?' },
          { de: 'Könnten Sie das bitte noch einmal wiederholen?', vi: 'Thầy nhắc lại một lần nữa giúp em được không ạ?' }
        ],
        exercises: [
          { vi: 'Thầy nhắc lại giúp em được không?', de: 'Können Sie das bitte wiederholen?', hint: 'können • bitte • wiederholen' },
          { vi: 'Cậu nhắc lại câu đó chậm hơn được không?', de: 'Kannst du den Satz bitte langsamer wiederholen?', hint: 'Satz • langsamer • wiederholen' },
          { vi: 'Cậu nhắc lại tên cậu được không?', de: 'Kannst du deinen Namen bitte wiederholen?', hint: 'Namen • bitte • wiederholen' },
          { vi: 'Cậu nhắc lại giúp tớ, tớ chưa nghe rõ.', de: 'Kannst du das bitte wiederholen? Ich habe es nicht richtig gehört.', hint: 'wiederholen • nicht • gehört' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du das bitte noch einmal wiederholen? Ich war kurz abgelenkt.', vi: 'Cậu nhắc lại giúp tớ được không? Tớ vừa mất tập trung một chút.' },
          { who: 'Ben', de: 'Klar! Ich habe gesagt, die Prüfung ist am Freitag.', vi: 'Được chứ! Tớ nói là kỳ thi vào thứ Sáu.' }
        ],
        mcq: {
          q: 'Dein Freund sagt etwas, aber du hörst es nicht richtig. Was sagst du?',
          qVi: 'Bạn cậu nói gì đó mà cậu nghe không rõ. Cậu nói gì?',
          options: ['Kannst du das bitte wiederholen?', 'Kannst du das bitte vergessen?', 'Kannst du das bitte verkaufen?', 'Kannst du das bitte kochen?'],
          answer: 'Kannst du das bitte wiederholen?',
          why: 'Nghe không rõ thì nhờ nhắc lại — "wiederholen"; quên, bán hay nấu đều không liên quan.'
        }
      },
      {
        id: 'viel-lernen',
        formula: 'Ich muss noch viel lernen.',
        vi: 'Tớ vẫn còn phải học nhiều lắm.',
        note: '"müssen" là động từ khiếm khuyết, động từ chính "lernen" đứng cuối câu ở dạng nguyên thể. "noch viel" nhấn mạnh là còn nhiều lắm.',
        vocab: [['müssen', 'phải'], ['lernen', 'học'], ['viel', 'nhiều']],
        examples: [
          { de: 'Ich muss noch viel lernen. Die Prüfung ist schon nächste Woche!', vi: 'Tớ vẫn còn phải học nhiều lắm. Tuần sau thi rồi!' },
          { de: 'Ich muss noch viel lernen, aber ich habe keine Zeit.', vi: 'Tớ vẫn còn phải học nhiều lắm mà chẳng có thời gian.' },
          { de: 'Du musst noch viel lernen? Dann fang am besten heute an!', vi: 'Cậu vẫn còn phải học nhiều à? Vậy bắt đầu ngay hôm nay đi!' },
          { de: 'Ich muss noch viel für die B2-Prüfung lernen.', vi: 'Tớ vẫn còn phải học nhiều cho kỳ thi B2.' },
          { de: 'Ich muss noch viel lernen, sonst bestehe ich die Prüfung nicht.', vi: 'Tớ vẫn còn phải học nhiều, không thì không đậu được.' },
          { de: 'Ich muss noch viele Vokabeln lernen.', vi: 'Tớ vẫn còn phải học nhiều từ vựng lắm.' }
        ],
        exercises: [
          { vi: 'Tớ vẫn còn phải học nhiều lắm, nhưng tớ mệt rồi.', de: 'Ich muss noch viel lernen, aber ich bin müde.', hint: 'muss • viel • lernen' },
          { vi: 'Cậu vẫn còn phải học nhiều à?', de: 'Musst du noch viel lernen?', hint: 'musst • viel • lernen' },
          { vi: 'Tớ vẫn còn phải học nhiều từ mới lắm.', de: 'Ich muss noch viele neue Wörter lernen.', hint: 'muss • viele • Wörter' },
          { vi: 'Tớ phải học nhiều, không thì không đậu được.', de: 'Ich muss viel lernen, sonst bestehe ich die Prüfung nicht.', hint: 'muss • lernen • bestehen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich muss noch viel lernen, aber ich bin so müde.', vi: 'Tớ vẫn còn phải học nhiều lắm, nhưng tớ mệt quá.' },
          { who: 'Ben', de: 'Dann lernen wir zusammen! Heute Abend bei mir?', vi: 'Vậy mình học chung nhé! Tối nay qua nhà tớ nhé?' }
        ],
        mcq: {
          q: 'Die Prüfung ist in einer Woche und du bist noch nicht fertig mit Lernen. Was sagst du?',
          qVi: 'Một tuần nữa thi mà cậu vẫn chưa học xong. Cậu nói gì?',
          options: ['Ich muss noch viel lernen.', 'Ich muss noch viel schlafen.', 'Ich muss noch viel essen.', 'Ich muss noch viel spielen.'],
          answer: 'Ich muss noch viel lernen.',
          why: 'Chưa học xong thì phải học — "lernen"; ngủ, ăn hay chơi đều không giúp cậu thi đậu.'
        }
      }
    ]
  },
  {
    id: 'telefon-chat',
    title: 'Điện thoại & tin nhắn',
    icon: '📱',
    patterns: [
      {
        id: 'anrufen-bitte',
        formula: 'Kannst du mich anrufen?',
        vi: 'Cậu gọi lại cho tớ được không?',
        note: '"anrufen" là động từ tách: "Ich rufe dich an". "mich" ở Akkusativ vì là tân ngữ trực tiếp.',
        vocab: [['anrufen', 'gọi điện'], ['mich', 'tớ (Akkusativ)'], ['die Nummer', 'số điện thoại']],
        examples: [
          { de: 'Kannst du mich anrufen? Ich habe eine Frage.', vi: 'Cậu gọi lại cho tớ được không? Tớ có câu hỏi.' },
          { de: 'Kannst du mich heute Abend anrufen?', vi: 'Tối nay cậu gọi cho tớ được không?' },
          { de: 'Ruf mich bitte an, wenn du Zeit hast!', vi: 'Gọi cho tớ nhé khi cậu rảnh!' },
          { de: 'Kannst du mich anrufen? Ich warte auf deine Antwort.', vi: 'Cậu gọi cho tớ được không? Tớ đang chờ câu trả lời của cậu.' },
          { de: 'Kannst du mich bitte anrufen? Es ist wichtig!', vi: 'Cậu gọi cho tớ được không? Việc này quan trọng lắm!' },
          { de: 'Ich kann dich nicht anrufen, ich habe deine Nummer nicht.', vi: 'Tớ không gọi cho cậu được, tớ không có số của cậu.' }
        ],
        exercises: [
          { vi: 'Cậu gọi cho tớ lúc 8 giờ được không?', de: 'Kannst du mich um 8 Uhr anrufen?', hint: 'kannst • 8 Uhr • anrufen' },
          { vi: 'Tớ không có số của cậu, cậu gọi cho tớ nhé.', de: 'Ich habe deine Nummer nicht. Kannst du mich anrufen?', hint: 'Nummer • nicht • anrufen' },
          { vi: 'Cậu gọi cho tớ được không? Tớ đang chờ cậu.', de: 'Kannst du mich anrufen? Ich warte auf dich.', hint: 'anrufen • warte • dich' },
          { vi: 'Gọi cho tớ ngay nhé, gấp lắm!', de: 'Ruf mich sofort an, es ist dringend!', hint: 'ruf • sofort • dringend' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du mich morgen früh anrufen? Ich habe eine Frage.', vi: 'Sáng mai cậu gọi cho tớ được không? Tớ có câu hỏi.' },
          { who: 'Ben', de: 'Klar, ich rufe dich in fünf Minuten an.', vi: 'Được chứ, tớ gọi lại trong năm phút nhé.' }
        ],
        mcq: {
          q: 'Du hast eine Frage und willst, dass dein Freund dich anruft. Was schreibst du ihm?',
          qVi: 'Cậu có câu hỏi và muốn bạn gọi lại cho mình. Cậu nhắn gì?',
          options: ['Kannst du mich anrufen?', 'Kannst du mich vergessen?', 'Kannst du mich verkaufen?', 'Kannst du mich ignorieren?'],
          answer: 'Kannst du mich anrufen?',
          why: 'Muốn bạn gọi lại thì dùng "anrufen"; quên, bán hay làm ngơ đều không phải điều cậu muốn.'
        }
      },
      {
        id: 'spaeter-anrufen',
        formula: 'Ich rufe dich später an.',
        vi: 'Tớ gọi lại cho cậu sau nhé.',
        note: '"später" là trạng từ chỉ thời gian, đứng sau động từ chia. Động từ tách "anrufen" chia thành "rufe... an".',
        vocab: [['später', 'sau'], ['anrufen', 'gọi điện'], ['die Besprechung', 'cuộc họp']],
        examples: [
          { de: 'Ich rufe dich später an. Ich bin gerade in einer Besprechung.', vi: 'Tớ gọi lại cho cậu sau nhé. Tớ đang họp.' },
          { de: 'Ich rufe dich später an, versprochen!', vi: 'Tớ gọi lại cho cậu sau nhé, tớ hứa đấy!' },
          { de: 'Entschuldigung, ich rufe dich später an. Ich muss jetzt los.', vi: 'Xin lỗi, tớ gọi lại cho cậu sau nhé. Tớ phải đi ngay bây giờ.' },
          { de: 'Ich rufe dich heute Abend an.', vi: 'Tớ gọi cho cậu tối nay nhé.' },
          { de: 'Ich rufe dich später an, wenn ich zu Hause bin.', vi: 'Tớ gọi lại cho cậu sau nhé, khi tớ về đến nhà.' },
          { de: 'Kein Problem, ruf mich einfach später an!', vi: 'Không sao đâu, cứ gọi lại cho tớ sau nhé!' }
        ],
        exercises: [
          { vi: 'Tớ gọi lại cho cậu sau, tớ phải đi ngay bây giờ.', de: 'Ich rufe dich später an. Ich muss jetzt los.', hint: 'rufe • später • los' },
          { vi: 'Tớ gọi lại cho cậu khi về đến nhà.', de: 'Ich rufe dich an, wenn ich zu Hause bin.', hint: 'rufe • wenn • Hause' },
          { vi: 'Tớ gọi lại cho cậu sau 5 phút nhé.', de: 'Ich rufe dich in fünf Minuten an.', hint: 'rufe • fünf • Minuten' },
          { vi: 'Tớ đang bận, tớ gọi lại sau nhé.', de: 'Ich bin gerade beschäftigt. Ich rufe dich später an.', hint: 'beschäftigt • rufe • später' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Kannst du mich bitte anrufen?', vi: 'Cậu gọi cho tớ được không?' },
          { who: 'Ben', de: 'Ich rufe dich heute Abend an, versprochen!', vi: 'Tớ gọi cho cậu tối nay nhé, tớ hứa đấy!' }
        ],
        mcq: {
          q: 'Dein Handy klingelt, aber du bist in einer Besprechung. Was sagst du?',
          qVi: 'Điện thoại cậu đổ chuông nhưng cậu đang họp. Cậu nói gì?',
          options: ['Ich rufe dich später an.', 'Ich rufe dich nie an.', 'Ich rufe dich gestern an.', 'Ich rufe dich gar nicht an.'],
          answer: 'Ich rufe dich später an.',
          why: 'Đang bận thì hẹn gọi lại sau — "später anrufen"; "nie" là không bao giờ, "gestern" là hôm qua, đều sai ngữ cảnh.'
        }
      },
      {
        id: 'nachricht-schreiben',
        formula: 'Schreib mir bitte eine Nachricht.',
        vi: 'Cậu nhắn tin cho tớ nhé.',
        note: '"schreiben" đi với Dativ "mir". "eine Nachricht" là tân ngữ Akkusativ. Câu này dùng khi cậu muốn bạn nhắn tin thay vì gọi.',
        vocab: [['die Nachricht', 'tin nhắn'], ['schreiben', 'viết / nhắn'], ['mir', 'tớ (Dativ)']],
        examples: [
          { de: 'Schreib mir bitte eine Nachricht, wenn du ankommst!', vi: 'Nhắn cho tớ một tin khi cậu đến nơi nhé!' },
          { de: 'Schreib mir bitte eine Nachricht. Ich bin gerade beschäftigt.', vi: 'Nhắn tin cho tớ nhé. Tớ đang bận.' },
          { de: 'Schreib mir einfach eine Nachricht auf WhatsApp!', vi: 'Cứ nhắn cho tớ một tin trên WhatsApp!' },
          { de: 'Schreib mir bitte eine Nachricht mit der Adresse!', vi: 'Nhắn cho tớ địa chỉ qua tin nhắn nhé!' },
          { de: 'Ich schreibe dir gleich eine Nachricht.', vi: 'Tớ nhắn tin cho cậu ngay đây.' },
          { de: 'Schreib mir bitte eine Nachricht, wenn du den Zug verpasst!', vi: 'Nhắn cho tớ nhé nếu cậu lỡ tàu!' }
        ],
        exercises: [
          { vi: 'Nhắn cho tớ thời gian nhé!', de: 'Schreib mir bitte eine Nachricht mit der Uhrzeit!', hint: 'schreib • Nachricht • Uhrzeit' },
          { vi: 'Cậu nhắn cho tớ số phòng nhé!', de: 'Schreib mir bitte eine Nachricht mit der Zimmernummer!', hint: 'Nachricht • Zimmernummer • schreib' },
          { vi: 'Nhắn cho tớ nhé nếu cậu đến muộn!', de: 'Schreib mir bitte eine Nachricht, wenn du zu spät kommst!', hint: 'Nachricht • wenn • spät' },
          { vi: 'Tớ sẽ nhắn tin cho cậu tối nay.', de: 'Ich schreibe dir heute Abend eine Nachricht.', hint: 'schreibe • heute Abend • Nachricht' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Schreib mir bitte eine Nachricht, wenn du zu Hause bist!', vi: 'Nhắn cho tớ một tin khi cậu về đến nhà nhé!' },
          { who: 'Ben', de: 'Mach ich! Bis später!', vi: 'Ok! Hẹn gặp lại sau nhé!' }
        ],
        mcq: {
          q: 'Du bist beschäftigt und kannst nicht telefonieren. Was sagst du zu deinem Freund?',
          qVi: 'Cậu đang bận và không nghe điện thoại được. Cậu nói gì với bạn?',
          options: ['Schreib mir bitte eine Nachricht.', 'Ruf mich bitte hundertmal an.', 'Komm bitte sofort zu mir.', 'Schrei bitte ganz laut.'],
          answer: 'Schreib mir bitte eine Nachricht.',
          why: 'Bận không nghe máy được thì nhờ bạn nhắn tin — "eine Nachricht schreiben"; gọi trăm lần hay hét lên đều không hợp lý.'
        }
      },
      {
        id: 'nachricht-nicht-bekommen',
        formula: 'Ich habe deine Nachricht nicht bekommen.',
        vi: 'Tớ không nhận được tin nhắn của cậu.',
        note: '"bekommen" dùng Perfekt với "haben". "nicht" đứng trước động từ chính ở cuối câu trong Perfekt.',
        vocab: [['bekommen', 'nhận được'], ['die Nachricht', 'tin nhắn'], ['schicken', 'gửi']],
        examples: [
          { de: 'Ich habe deine Nachricht nicht bekommen. Kannst du sie noch einmal schicken?', vi: 'Tớ không nhận được tin nhắn của cậu. Cậu gửi lại giúp tớ được không?' },
          { de: 'Ich habe deine Nachricht nicht bekommen. Mein Handy war aus.', vi: 'Tớ không nhận được tin nhắn của cậu. Điện thoại tớ hết pin.' },
          { de: 'Hast du meine Nachricht bekommen?', vi: 'Cậu nhận được tin nhắn của tớ chưa?' },
          { de: 'Ich habe deine Nachricht erst heute Morgen bekommen.', vi: 'Tớ mới nhận được tin nhắn của cậu sáng nay.' },
          { de: 'Ich habe deine Nachricht nicht bekommen, weil ich kein Internet hatte.', vi: 'Tớ không nhận được tin nhắn của cậu vì tớ không có mạng.' },
          { de: 'Entschuldigung, ich habe deine Nachricht nicht bekommen. Schick sie mir bitte noch einmal!', vi: 'Xin lỗi, tớ không nhận được tin nhắn của cậu. Gửi lại cho tớ nhé!' }
        ],
        exercises: [
          { vi: 'Tớ mới nhận được tin nhắn của cậu lúc nãy.', de: 'Ich habe deine Nachricht erst gerade bekommen.', hint: 'Nachricht • gerade • bekommen' },
          { vi: 'Cậu gửi lại tin nhắn giúp tớ được không?', de: 'Kannst du mir die Nachricht noch einmal schicken?', hint: 'Nachricht • noch einmal • schicken' },
          { vi: 'Tớ không nhận được tin nhắn nào hôm nay.', de: 'Ich habe heute keine Nachricht bekommen.', hint: 'heute • keine • bekommen' },
          { vi: 'Cậu có nhận được tin nhắn của tớ hôm qua không?', de: 'Hast du meine Nachricht gestern bekommen?', hint: 'hast • Nachricht • gestern' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Ich habe deine Nachricht nicht bekommen. Hast du sie wirklich geschickt?', vi: 'Tớ không nhận được tin nhắn của cậu. Cậu đã gửi thật chưa đấy?' },
          { who: 'Ben', de: 'Klar, ich schicke sie dir gleich noch einmal!', vi: 'Được chứ, tớ gửi lại cho cậu ngay đây!' }
        ],
        mcq: {
          q: 'Dein Freund fragt, ob du seine Nachricht gelesen hast. Du hast nichts erhalten. Was sagst du?',
          qVi: 'Bạn cậu hỏi cậu đã đọc tin nhắn chưa. Cậu không nhận được gì. Cậu nói gì?',
          options: ['Ich habe deine Nachricht nicht bekommen.', 'Ich habe deine Nachricht schon gelesen.', 'Ich habe deine Nachricht schon beantwortet.', 'Ich habe deine Nachricht schon gelöscht.'],
          answer: 'Ich habe deine Nachricht nicht bekommen.',
          why: 'Không nhận được tin nhắn thì nói "nicht bekommen"; đã đọc, đã trả lời hay đã xóa đều có nghĩa là cậu đã nhận được.'
        }
      },
      {
        id: 'gerade-frei',
        formula: 'Bist du gerade frei?',
        vi: 'Cậu đang rảnh không?',
        note: '"gerade" nghĩa là ngay lúc này. Câu hỏi ngắn gọn này dùng trước khi nhờ vả hay rủ ai đó làm gì.',
        vocab: [['frei', 'rảnh'], ['gerade', 'ngay lúc này'], ['beschäftigt', 'bận']],
        examples: [
          { de: 'Bist du gerade frei? Ich brauche deine Hilfe.', vi: 'Cậu đang rảnh không? Tớ cần cậu giúp.' },
          { de: 'Bist du gerade frei? Lass uns einen Kaffee trinken!', vi: 'Cậu đang rảnh không? Mình đi uống cà phê nhé!' },
          { de: 'Nein, ich bin gerade nicht frei. Ich arbeite noch.', vi: 'Không, tớ đang không rảnh. Tớ vẫn đang làm việc.' },
          { de: 'Bist du heute Abend frei?', vi: 'Tối nay cậu rảnh không?' },
          { de: 'Bist du gerade frei? Ich habe eine kurze Frage.', vi: 'Cậu đang rảnh không? Tớ có câu hỏi ngắn thôi.' },
          { de: 'Ja, ich bin gerade frei. Was gibt es?', vi: 'Ừ, tớ đang rảnh. Có chuyện gì vậy?' }
        ],
        exercises: [
          { vi: 'Chiều nay cậu rảnh không?', de: 'Bist du heute Nachmittag frei?', hint: 'bist • Nachmittag • frei' },
          { vi: 'Tớ đang bận, cậu gọi lại sau nhé.', de: 'Ich bin gerade beschäftigt. Ruf mich später an!', hint: 'beschäftigt • ruf • später' },
          { vi: 'Cậu rảnh vào cuối tuần không?', de: 'Bist du am Wochenende frei?', hint: 'bist • Wochenende • frei' },
          { vi: 'Cậu đang rảnh không? Tớ muốn hỏi cậu một chuyện.', de: 'Bist du gerade frei? Ich möchte dich etwas fragen.', hint: 'frei • möchte • fragen' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Bist du morgen frei? Ich brauche deine Hilfe.', vi: 'Ngày mai cậu rảnh không? Tớ cần cậu giúp.' },
          { who: 'Ben', de: 'Ja, klar! Was gibt es?', vi: 'Ừ, rảnh mà! Có chuyện gì vậy?' }
        ],
        mcq: {
          q: 'Du willst deinen Freund um Hilfe bitten, weißt aber nicht, ob er Zeit hat. Was fragst du zuerst?',
          qVi: 'Cậu muốn nhờ bạn giúp nhưng không biết bạn có rảnh không. Cậu hỏi gì trước?',
          options: ['Bist du gerade frei?', 'Bist du gerade müde?', 'Bist du gerade hungrig?', 'Bist du gerade krank?'],
          answer: 'Bist du gerade frei?',
          why: 'Muốn biết bạn có thời gian không thì hỏi "frei"; mệt, đói hay ốm đều không liên quan đến việc có rảnh hay không.'
        }
      },
      {
        id: 'morgen-telefonieren',
        formula: 'Lass uns morgen telefonieren.',
        vi: 'Mai mình gọi điện cho nhau nhé.',
        note: '"Lass uns..." là cách rủ ai đó làm gì cùng nhau, thân mật và tự nhiên. "telefonieren" là động từ không tách.',
        vocab: [['telefonieren', 'gọi điện thoại'], ['morgen', 'ngày mai'], ['besprechen', 'bàn bạc']],
        examples: [
          { de: 'Lass uns morgen telefonieren. Dann besprechen wir alles.', vi: 'Mai mình gọi điện cho nhau nhé. Rồi mình bàn hết mọi chuyện.' },
          { de: 'Lass uns morgen um 10 Uhr telefonieren!', vi: 'Mai mình gọi điện lúc 10 giờ nhé!' },
          { de: 'Lass uns morgen telefonieren, ich bin heute zu müde.', vi: 'Mai mình gọi điện nhé, hôm nay tớ mệt quá.' },
          { de: 'Ruf mich morgen an, dann telefonieren wir in Ruhe.', vi: 'Mai cậu gọi cho tớ nhé, rồi mình nói chuyện thoải mái.' },
          { de: 'Lass uns morgen telefonieren. Ich habe eine gute Idee!', vi: 'Mai mình gọi điện nhé. Tớ có ý hay lắm!' },
          { de: 'Wir telefonieren morgen, okay?', vi: 'Mai mình gọi điện nhé, được không?' }
        ],
        exercises: [
          { vi: 'Mai mình gọi điện nhé, rồi mình bàn mọi chuyện.', de: 'Lass uns morgen telefonieren und alles besprechen.', hint: 'morgen • telefonieren • besprechen' },
          { vi: 'Mai cậu gọi cho tớ nhé, rồi mình nói chuyện.', de: 'Ruf mich morgen an, dann telefonieren wir.', hint: 'ruf • morgen • telefonieren' },
          { vi: 'Mai mình gọi điện lúc 8 giờ tối nhé.', de: 'Lass uns morgen um 20 Uhr telefonieren!', hint: 'morgen • 20 Uhr • telefonieren' },
          { vi: 'Tớ sẽ gọi cho cậu vào sáng mai.', de: 'Ich rufe dich morgen früh an.', hint: 'rufe • morgen • früh' }
        ],
        dialogue: [
          { who: 'Anna', de: 'Lass uns morgen Nachmittag telefonieren, dann habe ich Zeit.', vi: 'Chiều mai mình gọi điện nhé, lúc đó tớ rảnh.' },
          { who: 'Ben', de: 'Gute Idee! Morgen um 10 Uhr?', vi: 'Ý hay đấy! Mai lúc 10 giờ nhé?' }
        ],
        mcq: {
          q: 'Du bist heute müde und willst das Gespräch auf morgen verschieben. Was sagst du?',
          qVi: 'Hôm nay cậu mệt và muốn dời cuộc nói chuyện sang ngày mai. Cậu nói gì?',
          options: ['Lass uns morgen telefonieren.', 'Lass uns gestern telefonieren.', 'Lass uns nie telefonieren.', 'Lass uns morgen schlafen.'],
          answer: 'Lass uns morgen telefonieren.',
          why: 'Muốn nói chuyện vào ngày mai thì dùng "morgen telefonieren"; "gestern" là hôm qua, "nie" là không bao giờ, đều sai.'
        }
      }
    ]
  }
];
