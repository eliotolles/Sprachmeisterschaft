// ====================================================================
// SITUATION TOPICS A — Mẫu câu giao tiếp tiếng Đức (trình độ B1)
// 3 chủ đề x 6 mẫu câu = 18 mẫu câu.
// Mỗi mẫu câu: formula + note + vocab + 6 examples + 4 exercises
// + dialogue 2 câu + 1 câu trắc nghiệm (mcq).
// ====================================================================

export const SITUATION_TOPICS_A = [
  {
    id: 'freunde-familie',
    title: 'Bạn bè & gia đình',
    icon: '👨‍👩‍👧',
    patterns: [
      {
        id: 'warum-nicht-einfach',
        formula: 'Warum … nicht einfach …?',
        vi: 'Sao cậu không … luôn đi?',
        note: 'Dùng để gợi ý một cách nhẹ nhàng, kiểu "sao không làm thế cho tiện". Sau Warum là câu hỏi với động từ chia ở vị trí thứ 2, còn "nicht einfach" đứng trước động từ chính ở cuối câu.',
        vocab: [['einfach', 'đơn giản, luôn'], ['frei nehmen', 'xin nghỉ'], ['sich ausruhen', 'nghỉ ngơi'], ['anrufen', 'gọi điện']],
        examples: [
          { de: 'Warum nimmst du nicht einfach einen Tag frei?', vi: 'Sao cậu không xin nghỉ một ngày luôn đi?' },
          { de: 'Warum rufst du ihn nicht einfach an?', vi: 'Sao cậu không gọi điện cho anh ấy luôn đi?' },
          { de: 'Warum legst du dich nicht einfach ein bisschen hin?', vi: 'Sao cậu không nằm nghỉ một chút luôn đi?' },
          { de: 'Warum fragst du nicht einfach deine Mutter?', vi: 'Sao cậu không hỏi mẹ cậu luôn đi?' },
          { de: 'Warum kochst du nicht einfach etwas Einfaches?', vi: 'Sao cậu không nấu món gì đơn giản luôn đi?' },
          { de: 'Warum bleibst du heute nicht einfach zu Hause und ruhst dich aus?', vi: 'Sao hôm nay cậu không ở nhà nghỉ ngơi luôn đi?' }
        ],
        exercises: [
          { vi: 'Sao cậu không đi ngủ sớm luôn đi?', de: 'Warum gehst du nicht einfach früher ins Bett?', hint: 'Warum • früher • ins Bett' },
          { vi: 'Sao cậu không nhắn tin cho cô ấy luôn đi?', de: 'Warum schreibst du ihr nicht einfach eine Nachricht?', hint: 'Warum • ihr • einfach • Nachricht' },
          { vi: 'Sao cậu không nghỉ ngơi một chút luôn đi?', de: 'Warum ruhst du dich nicht einfach ein bisschen aus?', hint: 'Warum • dich • einfach • ausruhen' },
          { vi: 'Sao cậu không mua vé tàu luôn đi?', de: 'Warum kaufst du nicht einfach eine Fahrkarte?', hint: 'Warum • einfach • Fahrkarte' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Ich bin total müde, aber ich muss noch so viel machen.', vi: 'Tớ mệt rã rời, mà vẫn còn bao nhiêu việc phải làm.' },
          { who: 'Lena', de: 'Warum ruhst du dich nicht einfach ein bisschen aus? Die Arbeit kann warten.', vi: 'Sao cậu không nghỉ ngơi một chút luôn đi? Việc thì để sau cũng được.' }
        ],
        mcq: {
          q: 'Ich bin so müde, ich kann kaum noch die Augen offen halten.',
          qVi: 'Tớ mệt quá, mắt díu lại rồi.',
          options: ['Warum schläfst du nicht einfach ein bisschen länger?', 'Das Wetter ist heute schön.', 'Ich habe gestern einen Film gesehen.', 'Die U-Bahn kommt in fünf Minuten.'],
          answer: 'Warum schläfst du nicht einfach ein bisschen länger?',
          why: 'Câu này dùng đúng mẫu "Warum … nicht einfach …?" để gợi ý bạn mình ngủ thêm, còn các đáp án khác không liên quan đến tình huống.'
        }
      },
      {
        id: 'mist-vergessen',
        formula: 'Mist, ich hab … vergessen!',
        vi: 'Chết, tớ quên … rồi!',
        note: 'Kể chuyện lỡ, sự cố — Mist! (chết thật!) thường đi kèm Ich hab … vergessen / verloren; Mir ist … runtergefallen là "tớ lỡ làm rơi …" (nhấn là không cố ý).',
        vocab: [['Mist', 'chết thật!'], ['vergessen', 'quên'], ['das Portemonnaie', 'cái ví'], ['runterfallen', 'rơi xuống']],
        examples: [
          { de: 'Mist, ich hab meinen Ausweis vergessen!', vi: 'Chết, tớ quên chứng minh thư rồi!' },
          { de: 'Mist, ich hab mein Portemonnaie zu Hause vergessen!', vi: 'Chết, tớ để quên ví ở nhà rồi!' },
          { de: 'Mist, ich hab Mamas Geburtstag vergessen!', vi: 'Chết, tớ quên mất sinh nhật của mẹ rồi!' },
          { de: 'Mist, mir ist deine Tasse runtergefallen!', vi: 'Chết, tớ lỡ làm rơi cốc của cậu rồi!' },
          { de: 'Mist, ich hab das Handy im Bus verloren!', vi: 'Chết, tớ làm mất điện thoại trên xe buýt rồi!' },
          { de: 'Mist, ich hab den Termin total vergessen!', vi: 'Chết, tớ quên béng mất cuộc hẹn rồi!' }
        ],
        exercises: [
          { vi: 'Chết, tớ quên mất tên anh ấy rồi!', de: 'Mist, ich hab seinen Namen vergessen!', hint: 'Mist • seinen Namen • vergessen' },
          { vi: 'Chết, tớ để quên ô ở nhà rồi!', de: 'Mist, ich hab den Regenschirm zu Hause vergessen!', hint: 'Mist • Regenschirm • zu Hause • vergessen' },
          { vi: 'Chết, tớ lỡ làm rơi điện thoại rồi!', de: 'Mist, mir ist das Handy runtergefallen!', hint: 'Mist • mir ist • Handy • runtergefallen' },
          { vi: 'Chết, tớ quên sạc điện thoại rồi!', de: 'Mist, ich hab vergessen, das Handy aufzuladen!', hint: 'Mist • vergessen • Handy • aufzuladen' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Mist, ich hab mein Ticket zu Hause vergessen!', vi: 'Chết, tớ để quên vé ở nhà rồi!' },
          { who: 'Lena', de: 'Kein Problem, wir kaufen einfach ein neues Ticket am Automaten.', vi: 'Không sao đâu, mình mua vé mới ở máy bán vé là được.' }
        ],
        mcq: {
          q: 'Tim steht vor der Haustür und kann nicht rein. Er sagt:',
          qVi: 'Tim đứng trước cửa nhà mà không vào được. Cậu ấy nói:',
          options: ['Mist, ich hab den Schlüssel vergessen!', 'Ich freue mich auf das Wochenende.', 'Das Wetter ist heute super.', 'Ich habe einen Hund.'],
          answer: 'Mist, ich hab den Schlüssel vergessen!',
          why: 'Tim không vào được nhà vì quên chìa khóa nên câu "Mist, ich hab den Schlüssel vergessen!" là phù hợp nhất, các đáp án khác không liên quan.'
        }
      },
      {
        id: 'kannst-du-mir-helfen',
        formula: 'Kannst du mir mal kurz helfen?',
        vi: 'Cậu giúp tớ một chút được không?',
        note: 'Câu nhờ vả lịch sự, thân mật. "mal kurz" làm câu nói nhẹ nhàng hơn — như "giúp tớ một tẹo thôi". Sau helfen là Dativ (mir / dir / ihm …).',
        vocab: [['helfen', 'giúp đỡ'], ['mal kurz', 'một chút, một tẹo'], ['die Tasche', 'cái túi'], ['tragen', 'mang, xách']],
        examples: [
          { de: 'Kannst du mir mal kurz helfen? Die Tasche ist so schwer.', vi: 'Cậu giúp tớ một chút được không? Cái túi này nặng quá.' },
          { de: 'Kannst du mir bitte beim Umzug helfen?', vi: 'Cậu giúp tớ chuyển nhà được không?' },
          { de: 'Kannst du mir mal kurz die Tür aufmachen?', vi: 'Cậu mở cửa giúp tớ một chút được không?' },
          { de: 'Kannst du mir mit den Hausaufgaben helfen?', vi: 'Cậu giúp tớ làm bài tập được không?' },
          { de: 'Kannst du mir mal kurz dein Handy leihen?', vi: 'Cậu cho tớ mượn điện thoại một chút được không?' },
          { de: 'Kannst du mir bitte den Salat rüberreichen?', vi: 'Cậu đưa giúp tớ đĩa salad được không?' }
        ],
        exercises: [
          { vi: 'Cậu giúp tớ mang cái hộp này được không?', de: 'Kannst du mir mal kurz die Kiste tragen?', hint: 'Kannst du • mir • Kiste • tragen' },
          { vi: 'Cậu giúp tớ dọn phòng được không?', de: 'Kannst du mir bitte beim Aufräumen helfen?', hint: 'Kannst du • mir • Aufräumen • helfen' },
          { vi: 'Cậu mở cửa sổ giúp tớ được không?', de: 'Kannst du mir mal kurz das Fenster aufmachen?', hint: 'Kannst du • mir • Fenster • aufmachen' },
          { vi: 'Cậu giúp tớ tìm chìa khóa được không?', de: 'Kannst du mir helfen, den Schlüssel zu finden?', hint: 'Kannst du • mir • Schlüssel • finden' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Kannst du mir mal kurz helfen? Ich kriege den Deckel nicht auf.', vi: 'Cậu giúp tớ một chút được không? Tớ mở nắp này không được.' },
          { who: 'Lena', de: 'Klar, gib her! Ich mach das schon.', vi: 'Được thôi, đưa đây! Tớ mở cho.' }
        ],
        mcq: {
          q: 'Lena trägt zwei schwere Taschen. Was sagt sie zu Tim?',
          qVi: 'Lena đang xách hai cái túi nặng. Cô ấy nói gì với Tim?',
          options: ['Kannst du mir mal kurz mit den Taschen helfen?', 'Ich habe gestern gut geschlafen.', 'Mein Bruder wohnt in Berlin.', 'Es ist schon spät.'],
          answer: 'Kannst du mir mal kurz mit den Taschen helfen?',
          why: 'Lena đang xách đồ nặng nên cần nhờ Tim giúp, câu này dùng đúng mẫu nhờ vả "Kannst du mir mal kurz … helfen?", các đáp án khác không liên quan.'
        }
      },
      {
        id: 'was-machst-du-am-wochenende',
        formula: 'Was machst du am Wochenende?',
        vi: 'Cuối tuần cậu làm gì?',
        note: 'Câu hỏi mở đầu quen thuộc để rủ rê hoặc bắt chuyện. Trả lời thường bắt đầu bằng "Am Wochenende …" hoặc "Ich …".',
        vocab: [['das Wochenende', 'cuối tuần'], ['am Wochenende', 'vào cuối tuần'], ['spazieren gehen', 'đi dạo'], ['sich treffen', 'gặp nhau']],
        examples: [
          { de: 'Was machst du am Wochenende? Hast du schon Pläne?', vi: 'Cuối tuần cậu làm gì? Cậu có kế hoạch gì chưa?' },
          { de: 'Was macht ihr am Wochenende? Fahrt ihr weg?', vi: 'Cuối tuần các cậu làm gì? Các cậu có đi đâu không?' },
          { de: 'Was machst du am Samstagabend? Kommst du mit ins Kino?', vi: 'Tối thứ Bảy cậu làm gì? Cậu đi xem phim cùng tớ không?' },
          { de: 'Was machst du am Sonntag? Wir könnten zusammen kochen.', vi: 'Chủ nhật cậu làm gì? Mình cùng nấu ăn nhé.' },
          { de: 'Was machst du in den Ferien? Fährst du nach Hause?', vi: 'Kỳ nghỉ cậu làm gì? Cậu có về nhà không?' },
          { de: 'Was machst du heute Abend? Hast du Lust auf einen Spaziergang?', vi: 'Tối nay cậu làm gì? Cậu có muốn đi dạo không?' }
        ],
        exercises: [
          { vi: 'Cuối tuần này cậu làm gì?', de: 'Was machst du dieses Wochenende?', hint: 'Was • machst du • dieses Wochenende' },
          { vi: 'Tối thứ Sáu cậu làm gì?', de: 'Was machst du am Freitagabend?', hint: 'Was • machst du • Freitagabend' },
          { vi: 'Ngày mai cậu làm gì? Cậu có rảnh không?', de: 'Was machst du morgen? Hast du Zeit?', hint: 'Was • machst du • morgen • Zeit' },
          { vi: 'Chủ nhật cậu làm gì? Mình đi bơi nhé.', de: 'Was machst du am Sonntag? Gehen wir schwimmen?', hint: 'Was • machst du • Sonntag • schwimmen' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Was machst du am Samstag? Ich will grillen.', vi: 'Thứ Bảy cậu làm gì? Tớ định nướng thịt.' },
          { who: 'Lena', de: 'Super Idee! Ich bringe den Salat mit.', vi: 'Ý hay đấy! Tớ mang salad đến nhé.' }
        ],
        mcq: {
          q: 'Es ist Freitag. Tim will wissen, was Lena am Samstag macht. Was fragt er?',
          qVi: 'Hôm nay là thứ Sáu. Tim muốn biết Lena làm gì vào thứ Bảy. Cậu ấy hỏi gì?',
          options: ['Was machst du am Samstag?', 'Wie spät ist es?', 'Wo wohnst du?', 'Wo ist die Bushaltestelle?'],
          answer: 'Was machst du am Samstag?',
          why: 'Tim muốn hỏi về kế hoạch thứ Bảy của Lena nên câu "Was machst du am Samstag?" là phù hợp nhất, các đáp án khác hỏi chuyện khác.'
        }
      },
      {
        id: 'ich-freu-mich-schon-auf',
        formula: 'Ich freu mich schon auf …!',
        vi: 'Tớ mong … lắm rồi!',
        note: 'Diễn tả sự háo hức, mong chờ. Sau "auf" là Akkusativ. "schon" nhấn mạnh là đã mong từ bây giờ rồi.',
        vocab: [['sich freuen auf', 'mong chờ, háo hức'], ['der Urlaub', 'kỳ nghỉ'], ['schon', 'đã, rồi'], ['das Wiedersehen', 'cuộc gặp lại']],
        examples: [
          { de: 'Ich freu mich schon auf den Urlaub!', vi: 'Tớ mong kỳ nghỉ lắm rồi!' },
          { de: 'Ich freu mich schon auf das Konzert!', vi: 'Tớ mong buổi hòa nhạc lắm rồi!' },
          { de: 'Ich freu mich schon auf das Wochenende!', vi: 'Tớ mong cuối tuần lắm rồi!' },
          { de: 'Ich freu mich schon auf das Essen bei Oma!', vi: 'Tớ mong bữa ăn ở nhà bà lắm rồi!' },
          { de: 'Ich freu mich schon auf die Party am Samstag!', vi: 'Tớ mong buổi tiệc thứ Bảy lắm rồi!' },
          { de: 'Wir freuen uns schon auf das Wiedersehen!', vi: 'Chúng tớ mong ngày gặp lại lắm rồi!' }
        ],
        exercises: [
          { vi: 'Tớ mong sinh nhật của cậu lắm rồi!', de: 'Ich freu mich schon auf deinen Geburtstag!', hint: 'Ich freu mich • schon • Geburtstag' },
          { vi: 'Tớ mong kỳ nghỉ hè lắm rồi!', de: 'Ich freu mich schon auf die Sommerferien!', hint: 'Ich freu mich • schon • Sommerferien' },
          { vi: 'Chúng tớ mong chuyến đi chơi lắm rồi!', de: 'Wir freuen uns schon auf den Ausflug!', hint: 'Wir freuen uns • schon • Ausflug' },
          { vi: 'Tớ mong được gặp lại cậu lắm rồi!', de: 'Ich freu mich schon darauf, dich wiederzusehen!', hint: 'Ich freu mich • darauf • wiederzusehen' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Ich freu mich schon auf den Urlaub! Nur noch zwei Tage!', vi: 'Tớ mong kỳ nghỉ lắm rồi! Chỉ còn hai ngày nữa thôi!' },
          { who: 'Lena', de: 'Ich auch! Ich hab schon alles gepackt.', vi: 'Tớ cũng vậy! Tớ đã gói đồ xong hết rồi.' }
        ],
        mcq: {
          q: 'Lenas beste Freundin kommt nächste Woche zu Besuch. Was sagt Lena?',
          qVi: 'Bạn thân của Lena tuần sau đến chơi. Lena nói gì?',
          options: ['Ich freu mich schon auf deinen Besuch!', 'Ich habe keine Zeit.', 'Das Wetter ist schlecht.', 'Ich muss noch einkaufen.'],
          answer: 'Ich freu mich schon auf deinen Besuch!',
          why: 'Lena háo hức vì bạn thân sắp đến chơi nên câu "Ich freu mich schon auf deinen Besuch!" là phù hợp nhất, các đáp án khác không thể hiện sự mong chờ.'
        }
      },
      {
        id: 'lass-uns-doch-mal',
        formula: 'Lass uns doch mal …!',
        vi: 'Mình … đi!',
        note: 'Câu rủ rê thân mật, nhẹ nhàng. "Lass uns" + động từ nguyên thể — như "mình cùng … nhé". "doch mal" làm câu nói mềm hơn, không ép buộc.',
        vocab: [['lass uns', 'mình cùng … nhé'], ['doch mal', 'cứ … đi, thử … đi'], ['spazieren gehen', 'đi dạo'], ['einen Film schauen', 'xem phim']],
        examples: [
          { de: 'Lass uns doch mal in den Park gehen!', vi: 'Mình vào công viên đi!' },
          { de: 'Lass uns doch mal einen Film schauen!', vi: 'Mình xem phim đi!' },
          { de: 'Lass uns doch mal zusammen kochen!', vi: 'Mình cùng nấu ăn đi!' },
          { de: 'Lass uns doch mal ins Café gehen!', vi: 'Mình vào quán cà phê đi!' },
          { de: 'Lass uns doch mal einen Ausflug machen!', vi: 'Mình đi chơi xa một chuyến đi!' },
          { de: 'Lass uns doch mal früher schlafen gehen!', vi: 'Mình đi ngủ sớm đi!' }
        ],
        exercises: [
          { vi: 'Mình đi bơi đi!', de: 'Lass uns doch mal schwimmen gehen!', hint: 'Lass uns • doch mal • schwimmen' },
          { vi: 'Mình cùng học tiếng Đức đi!', de: 'Lass uns doch mal zusammen Deutsch lernen!', hint: 'Lass uns • doch mal • Deutsch lernen' },
          { vi: 'Mình đi dạo quanh hồ đi!', de: 'Lass uns doch mal um den See spazieren!', hint: 'Lass uns • doch mal • um den See • spazieren' },
          { vi: 'Mình thử nhà hàng mới đi!', de: 'Lass uns doch mal das neue Restaurant ausprobieren!', hint: 'Lass uns • doch mal • Restaurant • ausprobieren' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Lass uns doch mal Eis essen gehen! Es ist so heiß heute.', vi: 'Mình đi ăn kem đi! Hôm nay nóng quá.' },
          { who: 'Lena', de: 'Gute Idee! Ich hole schnell meine Jacke.', vi: 'Ý hay đấy! Tớ lấy áo khoác nhanh đây.' }
        ],
        mcq: {
          q: 'Das Wetter ist super und Tim hat Lust auf einen Spaziergang. Was sagt er zu Lena?',
          qVi: 'Thời tiết đẹp và Tim muốn đi dạo. Cậu ấy nói gì với Lena?',
          options: ['Lass uns doch mal spazieren gehen!', 'Ich habe Hunger.', 'Der Film war langweilig.', 'Ich muss arbeiten.'],
          answer: 'Lass uns doch mal spazieren gehen!',
          why: 'Tim muốn rủ Lena đi dạo nên câu "Lass uns doch mal spazieren gehen!" là phù hợp nhất, các đáp án khác không phải lời rủ rê.'
        }
      }
    ]
  },
  {
    id: 'arbeit',
    title: 'Công ty & công việc',
    icon: '💼',
    patterns: [
      {
        id: 'machst-du-heute-ueberstunden',
        formula: 'Machst du heute Überstunden?',
        vi: 'Hôm nay cậu làm thêm giờ à?',
        note: 'Câu hỏi đồng nghiệp hay hỏi nhau gần giờ tan làm. "Überstunden machen" là làm thêm giờ — ở Đức giờ làm thêm thường được ghi lại (Zeiterfassung) để bù nghỉ hoặc trả lương.',
        vocab: [['die Überstunden', 'giờ làm thêm'], ['Feierabend machen', 'tan làm, nghỉ'], ['die Zeiterfassung', 'việc chấm công, ghi giờ làm'], ['heute', 'hôm nay']],
        examples: [
          { de: 'Machst du heute Überstunden? Es ist schon fast sechs.', vi: 'Hôm nay cậu làm thêm giờ à? Gần sáu giờ rồi đấy.' },
          { de: 'Machst du morgen auch Überstunden?', vi: 'Ngày mai cậu cũng làm thêm giờ à?' },
          { de: 'Musst du heute Überstunden machen?', vi: 'Hôm nay cậu phải làm thêm giờ à?' },
          { de: 'Wie viele Überstunden hast du diese Woche gemacht?', vi: 'Tuần này cậu làm thêm bao nhiêu giờ rồi?' },
          { de: 'Ich mache heute keine Überstunden, ich habe schon Feierabend.', vi: 'Hôm nay tớ không làm thêm giờ, tớ tan làm rồi.' },
          { de: 'Machst du oft Überstunden oder nur diese Woche?', vi: 'Cậu có hay làm thêm giờ không, hay chỉ tuần này thôi?' }
        ],
        exercises: [
          { vi: 'Hôm nay cậu làm thêm giờ à? Hay cậu về luôn?', de: 'Machst du heute Überstunden? Oder gehst du gleich nach Hause?', hint: 'Machst du • heute • Überstunden • nach Hause' },
          { vi: 'Tuần này cậu làm thêm nhiều giờ không?', de: 'Machst du diese Woche viele Überstunden?', hint: 'Machst du • diese Woche • viele • Überstunden' },
          { vi: 'Cậu có phải làm thêm giờ vào thứ Bảy không?', de: 'Musst du am Samstag Überstunden machen?', hint: 'Musst du • Samstag • Überstunden • machen' },
          { vi: 'Hôm qua cậu làm thêm giờ à?', de: 'Hast du gestern Überstunden gemacht?', hint: 'Hast du • gestern • Überstunden • gemacht' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Machst du heute Überstunden oder hast du schon Feierabend?', vi: 'Hôm nay cậu làm thêm giờ à, hay cậu tan làm rồi?' },
          { who: 'Lena', de: 'Nein, ich trinke nur noch meinen Kaffee aus, dann mache ich Feierabend.', vi: 'Không, tớ chỉ uống nốt cà phê rồi về.' }
        ],
        mcq: {
          q: 'Es ist 17:30 Uhr. Lena sitzt noch am Computer. Was fragt Tim sie?',
          qVi: 'Bây giờ là 17:30. Lena vẫn ngồi làm việc ở máy tính. Tim hỏi cô ấy gì?',
          options: ['Machst du heute noch Überstunden?', 'Wie heißt du?', 'Wo ist die Toilette?', 'Was kostet das Ticket?'],
          answer: 'Machst du heute noch Überstunden?',
          why: 'Đã 17:30 mà Lena vẫn ngồi làm việc nên Tim hỏi cô ấy có làm thêm giờ không, các đáp án khác không liên quan đến tình huống.'
        }
      },
      {
        id: 'nein-nur-noch-feierabend',
        formula: 'Nein, ich + V + nur noch …, dann mache ich Feierabend.',
        vi: 'Không, tôi chỉ làm nốt … rồi về.',
        note: 'Mẫu trả lời khi ai đó hỏi có làm thêm giờ không. "nur noch" = chỉ còn, làm nốt; "dann mache ich Feierabend" = rồi tôi tan làm. Thay V bằng động từ của việc còn dở, ví dụ schicken, schreiben, lesen.',
        vocab: [['nur noch', 'chỉ còn, chỉ nốt'], ['Feierabend machen', 'tan làm'], ['die Mail', 'email'], ['fertig machen', 'làm xong']],
        examples: [
          { de: 'Nein, ich schicke nur noch die Mail, dann mache ich Feierabend.', vi: 'Không, tôi chỉ gửi nốt cái email rồi về.' },
          { de: 'Nein, ich schreibe nur noch den Bericht fertig, dann mache ich Feierabend.', vi: 'Không, tôi chỉ viết nốt báo cáo rồi về.' },
          { de: 'Nein, ich lese nur noch diese E-Mail, dann mache ich Feierabend.', vi: 'Không, tôi chỉ đọc nốt cái email này rồi về.' },
          { de: 'Nein, ich räume nur noch meinen Schreibtisch auf, dann mache ich Feierabend.', vi: 'Không, tôi chỉ dọn nốt bàn làm việc rồi về.' },
          { de: 'Nein, ich rufe nur noch den Kunden an, dann mache ich Feierabend.', vi: 'Không, tôi chỉ gọi nốt cho khách hàng rồi về.' },
          { de: 'Nein, ich speichere nur noch die Datei, dann mache ich Feierabend.', vi: 'Không, tôi chỉ lưu nốt file rồi về.' }
        ],
        exercises: [
          { vi: 'Không, tôi chỉ trả lời nốt email này rồi về.', de: 'Nein, ich beantworte nur noch diese E-Mail, dann mache ich Feierabend.', hint: 'Nein • beantworte • E-Mail • Feierabend' },
          { vi: 'Không, tôi chỉ in nốt tài liệu rồi về.', de: 'Nein, ich drucke nur noch die Unterlagen aus, dann mache ich Feierabend.', hint: 'Nein • drucke • Unterlagen • aus • Feierabend' },
          { vi: 'Không, tôi chỉ ký nốt hợp đồng rồi về.', de: 'Nein, ich unterschreibe nur noch den Vertrag, dann mache ich Feierabend.', hint: 'Nein • unterschreibe • Vertrag • Feierabend' },
          { vi: 'Không, tôi chỉ đóng nốt cửa sổ này rồi về.', de: 'Nein, ich schließe nur noch dieses Fenster, dann mache ich Feierabend.', hint: 'Nein • schließe • Fenster • Feierabend' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Bist du noch lange hier? Es ist schon spät.', vi: 'Cậu còn ở đây lâu không? Muộn rồi đấy.' },
          { who: 'Lena', de: 'Nein, ich packe nur noch meine Tasche, dann mache ich Feierabend.', vi: 'Không, tớ chỉ gói nốt đồ vào túi rồi về.' }
        ],
        mcq: {
          q: 'Es ist fast Feierabend. Lena sagt:',
          qVi: 'Sắp đến giờ tan làm. Lena nói:',
          options: ['Nein, ich schreibe nur noch diese eine Mail, dann mache ich Feierabend.', 'Ja, ich arbeite die ganze Nacht.', 'Ich habe keine Ahnung.', 'Das Wetter ist schön.'],
          answer: 'Nein, ich schreibe nur noch diese eine Mail, dann mache ich Feierabend.',
          why: 'Lena chỉ còn một việc nhỏ nữa rồi về nên mẫu "Nein, ich … nur noch …, dann mache ich Feierabend." là phù hợp nhất, các đáp án khác không đúng tình huống.'
        }
      },
      {
        id: 'bist-du-noch-nicht-weg',
        formula: 'Bist du noch nicht weg?',
        vi: 'Cậu vẫn chưa về à?',
        note: 'Câu hỏi ngạc nhiên khi thấy đồng nghiệp vẫn ở văn phòng dù đã muộn. "noch nicht" = vẫn chưa. Trả lời thường là "Nein, ich … nur noch …, dann mache ich Feierabend."',
        vocab: [['noch nicht', 'vẫn chưa'], ['weg sein', 'đi khỏi, về rồi'], ['spät', 'muộn'], ['der Feierabend', 'giờ tan làm']],
        examples: [
          { de: 'Bist du noch nicht weg? Es ist schon halb sieben!', vi: 'Cậu vẫn chưa về à? Đã sáu rưỡi rồi đấy!' },
          { de: 'Bist du immer noch hier? Ich dachte, du bist schon weg.', vi: 'Cậu vẫn còn ở đây à? Tớ tưởng cậu về rồi.' },
          { de: 'Bist du noch nicht im Urlaub? Ich dachte, du fährst heute los.', vi: 'Cậu vẫn chưa đi nghỉ à? Tớ tưởng hôm nay cậu đi rồi.' },
          { de: 'Bist du noch nicht fertig? Wir warten schon auf dich.', vi: 'Cậu vẫn chưa xong à? Bọn tớ đang đợi cậu đấy.' },
          { de: 'Bist du noch nicht zu Hause? Es ist schon spät.', vi: 'Cậu vẫn chưa về nhà à? Muộn lắm rồi.' },
          { de: 'Bist du noch nicht weg? Der Bus fährt gleich ab.', vi: 'Cậu vẫn chưa đi à? Xe buýt sắp chạy rồi.' }
        ],
        exercises: [
          { vi: 'Cậu vẫn chưa đi à? Mọi người đang đợi cậu đấy.', de: 'Bist du noch nicht weg? Alle warten schon auf dich.', hint: 'Bist du • noch nicht • weg • warten' },
          { vi: 'Cậu vẫn chưa ngủ à? Đã nửa đêm rồi.', de: 'Bist du noch nicht im Bett? Es ist schon Mitternacht.', hint: 'Bist du • noch nicht • Bett • Mitternacht' },
          { vi: 'Cậu vẫn chưa xong à? Họp sắp bắt đầu rồi.', de: 'Bist du noch nicht fertig? Das Meeting fängt gleich an.', hint: 'Bist du • noch nicht • fertig • Meeting' },
          { vi: 'Anh vẫn chưa đi làm à? Đã tám giờ rồi.', de: 'Bist du noch nicht bei der Arbeit? Es ist schon acht Uhr.', hint: 'Bist du • noch nicht • Arbeit • acht Uhr' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Bist du noch nicht weg? Ich dachte, du hast schon Feierabend.', vi: 'Cậu vẫn chưa về à? Tớ tưởng cậu tan làm rồi.' },
          { who: 'Lena', de: 'Nein, gleich! Ich muss nur noch kurz etwas ausdrucken.', vi: 'Không, tớ về ngay đây! Tớ chỉ cần in nhanh cái này nữa thôi.' }
        ],
        mcq: {
          q: 'Es ist 18 Uhr. Tim sieht Lena noch im Büro. Was fragt er?',
          qVi: 'Bây giờ là 18 giờ. Tim thấy Lena vẫn còn ở văn phòng. Cậu ấy hỏi gì?',
          options: ['Bist du etwa noch nicht weg?', 'Wie alt bist du?', 'Wo ist mein Handy?', 'Was kostet der Kaffee?'],
          answer: 'Bist du etwa noch nicht weg?',
          why: 'Đã 18 giờ mà Lena vẫn ở văn phòng nên Tim ngạc nhiên hỏi cô ấy vẫn chưa về à, các đáp án khác không liên quan.'
        }
      },
      {
        id: 'kannst-du-mir-die-datei-schicken',
        formula: 'Kannst du mir die Datei schicken?',
        vi: 'Cậu gửi file cho tớ được không?',
        note: 'Câu nhờ vả phổ biến nhất ở văn phòng. Sau schicken là Akkusativ (die Datei / den Link) và Dativ (mir / dir). Thêm "bitte" và "kurz" cho lịch sự.',
        vocab: [['die Datei', 'tệp tin, file'], ['schicken', 'gửi'], ['der Link', 'đường link'], ['die E-Mail', 'email']],
        examples: [
          { de: 'Kannst du mir die Datei schicken? Ich brauche sie für das Meeting.', vi: 'Cậu gửi file cho tớ được không? Tớ cần nó cho cuộc họp.' },
          { de: 'Kannst du mir den Link zur Präsentation schicken?', vi: 'Cậu gửi link bài thuyết trình cho tớ được không?' },
          { de: 'Kannst du mir die E-Mail bitte weiterleiten?', vi: 'Cậu chuyển tiếp email đó cho tớ được không?' },
          { de: 'Kannst du mir die Unterlagen bis morgen schicken?', vi: 'Cậu gửi tài liệu cho tớ trước ngày mai được không?' },
          { de: 'Kannst du mir kurz das Passwort schicken?', vi: 'Cậu gửi mật khẩu cho tớ nhanh được không?' },
          { de: 'Kannst du mir die Fotos von gestern schicken?', vi: 'Cậu gửi ảnh hôm qua cho tớ được không?' }
        ],
        exercises: [
          { vi: 'Cậu gửi báo cáo cho tớ được không?', de: 'Kannst du mir den Bericht schicken?', hint: 'Kannst du • mir • Bericht • schicken' },
          { vi: 'Cậu gửi địa chỉ cho tớ được không?', de: 'Kannst du mir die Adresse schicken?', hint: 'Kannst du • mir • Adresse • schicken' },
          { vi: 'Cậu chuyển tiếp tin nhắn đó cho tớ được không?', de: 'Kannst du mir die Nachricht weiterleiten?', hint: 'Kannst du • mir • Nachricht • weiterleiten' },
          { vi: 'Cậu gửi số điện thoại của anh ấy cho tớ được không?', de: 'Kannst du mir seine Telefonnummer schicken?', hint: 'Kannst du • mir • Telefonnummer • schicken' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Kannst du mir die Datei schicken? Ich finde sie nicht mehr.', vi: 'Cậu gửi file cho tớ được không? Tớ tìm không thấy nữa.' },
          { who: 'Lena', de: 'Klar, ich schicke sie dir gleich per E-Mail.', vi: 'Được thôi, tớ gửi ngay cho cậu qua email đây.' }
        ],
        mcq: {
          q: 'Tim braucht die Präsentation für sein Meeting. Was fragt er Lena?',
          qVi: 'Tim cần bài thuyết trình cho cuộc họp của mình. Cậu ấy hỏi Lena gì?',
          options: ['Kannst du mir die Präsentation schicken?', 'Wie geht es dir?', 'Wo ist der Drucker?', 'Hast du heute Zeit?'],
          answer: 'Kannst du mir die Präsentation schicken?',
          why: 'Tim cần bài thuyết trình nên câu nhờ gửi file là phù hợp nhất, các đáp án khác không liên quan đến nhu cầu của cậu ấy.'
        }
      },
      {
        id: 'ich-bin-heute-im-homeoffice',
        formula: 'Ich bin heute im Homeoffice.',
        vi: 'Hôm nay tôi làm việc ở nhà.',
        note: 'Câu thông báo ngắn gọn khi làm việc từ xa. "im Homeoffice" (in + dem) — ở Đức làm việc ở nhà rất phổ biến, thường nói tắt là "Ich bin heute im HO."',
        vocab: [['das Homeoffice', 'làm việc ở nhà'], ['heute', 'hôm nay'], ['das Meeting', 'cuộc họp'], ['erreichbar sein', 'có thể liên lạc được']],
        examples: [
          { de: 'Ich bin heute im Homeoffice, aber ich bin per E-Mail erreichbar.', vi: 'Hôm nay tôi làm việc ở nhà, nhưng vẫn liên lạc được qua email.' },
          { de: 'Ich bin morgen im Homeoffice, das Meeting machen wir online.', vi: 'Ngày mai tôi làm việc ở nhà, cuộc họp mình làm trực tuyến nhé.' },
          { de: 'Bist du heute im Büro oder im Homeoffice?', vi: 'Hôm nay cậu ở văn phòng hay làm việc ở nhà?' },
          { de: 'Ich arbeite heute von zu Hause aus.', vi: 'Hôm nay tôi làm việc từ nhà.' },
          { de: 'Ich bin heute im Homeoffice, mein Internet ist aber ziemlich langsam.', vi: 'Hôm nay tôi làm việc ở nhà, nhưng mạng nhà tôi chậm lắm.' },
          { de: 'Am Freitag bin ich immer im Homeoffice.', vi: 'Thứ Sáu nào tôi cũng làm việc ở nhà.' }
        ],
        exercises: [
          { vi: 'Hôm nay tôi làm việc ở nhà, cậu gọi cho tôi nhé.', de: 'Ich bin heute im Homeoffice, ruf mich einfach an.', hint: 'Ich bin • heute • Homeoffice • ruf mich an' },
          { vi: 'Ngày mai cậu ở văn phòng hay làm việc ở nhà?', de: 'Bist du morgen im Büro oder im Homeoffice?', hint: 'Bist du • morgen • Büro • Homeoffice' },
          { vi: 'Tuần này tôi làm việc ở nhà hai ngày.', de: 'Ich bin diese Woche zwei Tage im Homeoffice.', hint: 'Ich bin • diese Woche • zwei Tage • Homeoffice' },
          { vi: 'Hôm nay tôi làm việc từ nhà và liên lạc được dễ dàng.', de: 'Ich arbeite heute von zu Hause aus und bin gut erreichbar.', hint: 'Ich arbeite • heute • von zu Hause • erreichbar' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Bist du heute im Büro? Ich wollte dich kurz sprechen.', vi: 'Hôm nay cậu ở văn phòng à? Tớ muốn nói chuyện với cậu một chút.' },
          { who: 'Lena', de: 'Nein, ich bin heute im Homeoffice, aber ruf mich einfach an.', vi: 'Không, hôm nay tớ làm việc ở nhà, nhưng cậu cứ gọi cho tớ.' }
        ],
        mcq: {
          q: 'Lena arbeitet heute nicht im Büro. Was sagt sie zu Tim?',
          qVi: 'Hôm nay Lena không làm việc ở văn phòng. Cô ấy nói gì với Tim?',
          options: ['Ich bin heute im Homeoffice und nicht im Büro.', 'Ich bin krank.', 'Ich muss zum Arzt.', 'Ich fahre in den Urlaub.'],
          answer: 'Ich bin heute im Homeoffice und nicht im Büro.',
          why: 'Lena làm việc ở nhà hôm nay nên câu này là phù hợp nhất, các đáp án khác không nói về nơi làm việc.'
        }
      },
      {
        id: 'lass-uns-das-morgen-besprechen',
        formula: 'Lass uns das morgen im Meeting besprechen.',
        vi: 'Để mai mình bàn trong cuộc họp nhé.',
        note: 'Câu hoãn việc bàn bạc sang lúc khác một cách lịch sự. "besprechen" (bàn bạc) đi với Akkusativ; "im Meeting" (in + dem) là trong cuộc họp.',
        vocab: [['besprechen', 'bàn bạc, thảo luận'], ['das Meeting', 'cuộc họp'], ['morgen', 'ngày mai'], ['der Vorschlag', 'đề xuất']],
        examples: [
          { de: 'Wir besprechen das morgen im Meeting, okay?', vi: 'Ngày mai mình bàn việc này trong cuộc họp nhé.' },
          { de: 'Lass uns das nach dem Mittagessen besprechen.', vi: 'Để sau bữa trưa mình bàn nhé.' },
          { de: 'Können wir das kurz im Meeting besprechen?', vi: 'Mình bàn nhanh việc này trong cuộc họp được không?' },
          { de: 'Ich würde den Vorschlag gern mit dem Team besprechen.', vi: 'Tôi muốn bàn đề xuất này với cả nhóm.' },
          { de: 'Lass uns das am Montag in Ruhe besprechen.', vi: 'Để thứ Hai mình bàn kỹ việc này nhé.' },
          { de: 'Wir besprechen das morgen um zehn Uhr.', vi: 'Ngày mai lúc mười giờ mình bàn việc này nhé.' }
        ],
        exercises: [
          { vi: 'Để mình bàn việc này vào ngày mai nhé.', de: 'Lass uns das morgen besprechen.', hint: 'Lass uns • das • morgen • besprechen' },
          { vi: 'Mình bàn đề xuất này trong cuộc họp nhé.', de: 'Lass uns den Vorschlag im Meeting besprechen.', hint: 'Lass uns • Vorschlag • Meeting • besprechen' },
          { vi: 'Để cuối tuần mình bàn kỹ nhé.', de: 'Lass uns das am Wochenende in Ruhe besprechen.', hint: 'Lass uns • Wochenende • in Ruhe • besprechen' },
          { vi: 'Chúng ta sẽ bàn việc này sau bữa trưa.', de: 'Wir besprechen das nach dem Mittagessen.', hint: 'Wir • besprechen • nach • Mittagessen' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Ich habe eine Idee für das Projekt. Hast du kurz Zeit?', vi: 'Tớ có ý tưởng cho dự án này. Cậu có chút thời gian không?' },
          { who: 'Lena', de: 'Lass uns das morgen im Meeting besprechen, dann sind alle dabei.', vi: 'Để mai mình bàn trong cuộc họp nhé, lúc đó mọi người đều có mặt.' }
        ],
        mcq: {
          q: 'Tim hat eine Idee, aber das Team ist heute nicht da. Was sagt Lena?',
          qVi: 'Tim có một ý tưởng nhưng hôm nay cả nhóm không có mặt. Lena nói gì?',
          options: ['Lass uns das morgen im Team-Meeting besprechen.', 'Ich habe keine Lust.', 'Das ist mir egal.', 'Ich gehe jetzt nach Hause.'],
          answer: 'Lass uns das morgen im Team-Meeting besprechen.',
          why: 'Cả nhóm hôm nay không có mặt nên hoãn sang cuộc họp ngày mai là hợp lý nhất, các đáp án khác không giải quyết được việc.'
        }
      }
    ]
  },
  {
    id: 'einkaufen',
    title: 'Mua sắm & chợ',
    icon: '🛒',
    patterns: [
      {
        id: 'was-darfs-sein',
        formula: 'Was darf\'s sein?',
        vi: 'Anh/chị lấy gì ạ?',
        note: 'Câu người bán hàng hỏi khách ở quầy thịt, bánh mì, chợ. "darf" ở đây là cách nói lịch sự cho "möchten Sie". Trả lời bằng "Ich hätte gern …" hoặc "Ich nehme …".',
        vocab: [['dürfen', 'được phép, muốn (lịch sự)'], ['Ich hätte gern', 'tôi muốn lấy'], ['das Brötchen', 'bánh mì cuộn'], ['der Schinken', 'thịt giăm bông']],
        examples: [
          { de: 'Was darf\'s denn sein?', vi: 'Anh lấy gì ạ?' },
          { de: 'Was darf\'s sein? Wir haben heute frische Brötchen.', vi: 'Anh lấy gì ạ? Hôm nay chúng tôi có bánh mì mới ra lò.' },
          { de: 'Ich hätte gern 200 Gramm Schinken, bitte.', vi: 'Cho tôi 200 gam giăm bông ạ.' },
          { de: 'Ich nehme drei Brötchen und ein Croissant.', vi: 'Tôi lấy ba cái bánh mì cuộn và một cái bánh sừng bò.' },
          { de: 'Ich hätte gern ein Kilo Kartoffeln.', vi: 'Cho tôi một cân khoai tây ạ.' },
          { de: 'Ich nehme das Brot da vorne, bitte.', vi: 'Tôi lấy ổ bánh mì đằng trước kia ạ.' }
        ],
        exercises: [
          { vi: 'Cho tôi 300 gam phô mai ạ.', de: 'Ich hätte gern 300 Gramm Käse, bitte.', hint: 'Ich hätte gern • 300 Gramm • Käse' },
          { vi: 'Tôi lấy hai ổ bánh mì ạ.', de: 'Ich nehme zwei Brote, bitte.', hint: 'Ich nehme • zwei • Brote' },
          { vi: 'Cho tôi nửa cân cà chua ạ.', de: 'Ich hätte gern ein halbes Kilo Tomaten.', hint: 'Ich hätte gern • halbes Kilo • Tomaten' },
          { vi: 'Tôi lấy cái bánh này ạ.', de: 'Ich nehme diesen Kuchen hier, bitte.', hint: 'Ich nehme • diesen Kuchen • hier' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Guten Tag! Was darf\'s sein?', vi: 'Chào anh! Anh lấy gì ạ?' },
          { who: 'Lena', de: 'Ich hätte gern vier Brötchen und ein Brot, bitte.', vi: 'Cho tôi bốn cái bánh mì cuộn và một ổ bánh mì ạ.' }
        ],
        mcq: {
          q: 'Lena steht an der Theke beim Bäcker. Was fragt der Verkäufer?',
          qVi: 'Lena đang đứng ở quầy bánh mì. Người bán hàng hỏi gì?',
          options: ['Was darf es denn sein?', 'Wo ist der Bahnhof?', 'Wie geht es Ihnen?', 'Ist heute Sonntag?'],
          answer: 'Was darf es denn sein?',
          why: 'Lena đang đứng ở quầy bánh mì nên người bán hàng hỏi cô ấy lấy gì, các đáp án khác không phù hợp với tình huống mua hàng.'
        }
      },
      {
        id: 'moechten-sie-mal-probieren',
        formula: 'Möchten Sie mal probieren?',
        vi: 'Anh/chị có muốn ăn thử không ạ?',
        note: 'Câu mời nếm thử ở chợ, siêu thị, quầy hàng. "mal" làm câu nhẹ nhàng. Trả lời: "Gerne, danke!" (vâng, cảm ơn!) hoặc "Nein, danke!" (không, cảm ơn!).',
        vocab: [['probieren', 'nếm thử, thử'], ['möchten', 'muốn (lịch sự)'], ['lecker', 'ngon'], ['der Käse', 'phô mai']],
        examples: [
          { de: 'Möchten Sie mal probieren? Der Käse ist ganz frisch.', vi: 'Anh có muốn ăn thử không ạ? Phô mai này mới lắm ạ.' },
          { de: 'Möchten Sie mal probieren? Die Wurst ist hausgemacht.', vi: 'Chị có muốn ăn thử không ạ? Xúc xích này nhà làm đấy ạ.' },
          { de: 'Möchten Sie die Marmelade mal probieren?', vi: 'Chị có muốn nếm thử mứt này không ạ?' },
          { de: 'Ja, gern! Das schmeckt super!', vi: 'Vâng, cảm ơn ạ! Ngon tuyệt!' },
          { de: 'Nein, danke! Ich habe schon gegessen.', vi: 'Không, cảm ơn ạ! Tôi ăn rồi.' },
          { de: 'Möchten Sie mal probieren? Das Brot ist noch warm.', vi: 'Anh có muốn ăn thử không ạ? Bánh mì vẫn còn ấm đấy ạ.' }
        ],
        exercises: [
          { vi: 'Anh có muốn nếm thử phô mai không ạ?', de: 'Möchten Sie den Käse mal probieren?', hint: 'Möchten Sie • Käse • probieren' },
          { vi: 'Vâng, cảm ơn ạ! Tôi lấy một ít.', de: 'Gerne, danke! Ich nehme ein bisschen.', hint: 'Gerne • danke • ein bisschen' },
          { vi: 'Không, cảm ơn ạ! Tôi không ăn thịt.', de: 'Nein, danke! Ich esse kein Fleisch.', hint: 'Nein • danke • kein Fleisch' },
          { vi: 'Chị có muốn nếm thử bánh này không ạ?', de: 'Möchten Sie den Kuchen mal probieren?', hint: 'Möchten Sie • Kuchen • probieren' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Möchten Sie mal probieren? Wir haben heute eine neue Sorte.', vi: 'Anh có muốn ăn thử không ạ? Hôm nay chúng tôi có loại mới.' },
          { who: 'Lena', de: 'Gerne, danke! Lecker! Ich nehme 200 Gramm.', vi: 'Vâng, cảm ơn ạ! Ngon quá! Tôi lấy 200 gam.' }
        ],
        mcq: {
          q: 'Der Verkäufer bietet Lena ein Stück Käse an. Was sagt er?',
          qVi: 'Người bán mời Lena một miếng phô mai. Anh ấy nói gì?',
          options: ['Möchten Sie mal ein Stück probieren?', 'Was kostet der Käse?', 'Wo ist die Kasse?', 'Haben Sie einen Bon?'],
          answer: 'Möchten Sie mal ein Stück probieren?',
          why: 'Người bán đang mời nếm thử nên câu "Möchten Sie mal ein Stück probieren?" là phù hợp nhất, các đáp án khác không phải lời mời nếm thử.'
        }
      },
      {
        id: 'darf-ich-vielleicht-vor',
        formula: 'Darf ich vielleicht vor? Ich hab nur das hier.',
        vi: 'Tôi lên trước được không? Tôi chỉ có mỗi cái này.',
        note: 'Câu xin chen lên trước ở hàng chờ siêu thị khi mình chỉ có một món. "vielleicht" làm câu xin phép nhẹ nhàng hơn. Trả lời thường là "Ja, klar, gehen Sie vor!"',
        vocab: [['vielleicht', 'có lẽ, biết đâu'], ['vor', 'lên trước'], ['nur das hier', 'chỉ mỗi cái này'], ['die Schlange', 'hàng chờ, hàng người']],
        examples: [
          { de: 'Darf ich vielleicht kurz vor? Ich hab nur das hier.', vi: 'Tôi lên trước một chút được không? Tôi chỉ có mỗi cái này.' },
          { de: 'Darf ich vielleicht vor? Ich habe es eilig.', vi: 'Tôi lên trước được không? Tôi đang vội.' },
          { de: 'Ja, klar, gehen Sie vor!', vi: 'Vâng, mời anh lên trước ạ!' },
          { de: 'Entschuldigung, darf ich vielleicht vor? Ich habe nur eine Flasche Wasser.', vi: 'Xin lỗi, tôi lên trước được không? Tôi chỉ có một chai nước thôi.' },
          { de: 'Klar, kein Problem! Gehen Sie nur vor.', vi: 'Được thôi, không sao đâu ạ! Anh cứ lên trước đi.' },
          { de: 'Darf ich vielleicht vor? Mein Bus fährt gleich ab.', vi: 'Tôi lên trước được không? Xe buýt của tôi sắp chạy rồi.' }
        ],
        exercises: [
          { vi: 'Tôi lên trước được không? Tôi chỉ có một món thôi.', de: 'Darf ich vielleicht vor? Ich habe nur eine Sache.', hint: 'Darf ich • vielleicht • vor • eine Sache' },
          { vi: 'Được thôi, chị cứ lên trước đi!', de: 'Klar, gehen Sie nur vor!', hint: 'Klar • gehen Sie • vor' },
          { vi: 'Xin lỗi, tôi lên trước được không? Tôi đang vội lắm.', de: 'Entschuldigung, darf ich vielleicht vor? Ich habe es sehr eilig.', hint: 'Entschuldigung • darf ich • vor • eilig' },
          { vi: 'Tôi lên trước được không? Tôi chỉ có một ổ bánh mì thôi.', de: 'Darf ich vielleicht vor? Ich habe nur ein Brot.', hint: 'Darf ich • vielleicht • vor • ein Brot' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Entschuldigung, darf ich vielleicht vor? Mein Bus fährt gleich ab.', vi: 'Xin lỗi, tôi lên trước được không? Xe buýt của tôi sắp chạy rồi.' },
          { who: 'Lena', de: 'Ja, natürlich! Kein Problem.', vi: 'Vâng, tất nhiên rồi ạ! Không sao đâu.' }
        ],
        mcq: {
          q: 'Tim hat nur eine Flasche Wasser und bittet die Frau vor ihm. Was antwortet sie?',
          qVi: 'Tim chỉ có một chai nước và xin người phụ nữ đứng trước mình. Cô ấy trả lời gì?',
          options: ['Ja, klar, gehen Sie nur vor!', 'Nein, leider besetzt.', 'Ja, ab drei Stück.', 'Moment, ich schaue mal nach.'],
          answer: 'Ja, klar, gehen Sie nur vor!',
          why: 'Người kia chỉ có một món và xin lên trước nên câu đồng ý "Ja, klar, gehen Sie nur vor!" là phù hợp nhất, các đáp án khác không phải câu trả lời cho lời xin chen hàng.'
        }
      },
      {
        id: 'was-kostet-das',
        formula: 'Was kostet das?',
        vi: 'Cái này bao nhiêu tiền?',
        note: 'Câu hỏi giá đơn giản nhất khi mua sắm. Trả lời thường là "Das kostet … Euro." hoặc "Das macht … Euro." (tổng cộng là …).',
        vocab: [['kosten', 'có giá, tốn'], ['der Euro', 'đồng euro'], ['das macht', 'tổng cộng là'], ['der Preis', 'giá cả']],
        examples: [
          { de: 'Was kostet das? Das sieht aber teuer aus.', vi: 'Cái này bao nhiêu tiền? Nhìn đắt quá.' },
          { de: 'Was kostet das Kilo Äpfel?', vi: 'Một cân táo bao nhiêu tiền?' },
          { de: 'Das kostet drei Euro.', vi: 'Cái này ba euro ạ.' },
          { de: 'Was kosten die Tomaten?', vi: 'Cà chua bao nhiêu tiền?' },
          { de: 'Das macht zusammen zwölf Euro fünfzig.', vi: 'Tổng cộng là mười hai euro năm mươi ạ.' },
          { de: 'Was kostet das Brot heute?', vi: 'Hôm nay bánh mì bao nhiêu tiền?' }
        ],
        exercises: [
          { vi: 'Cái này bao nhiêu tiền ạ?', de: 'Was kostet das, bitte?', hint: 'Was • kostet • das • bitte' },
          { vi: 'Một cân khoai tây bao nhiêu tiền?', de: 'Was kostet ein Kilo Kartoffeln?', hint: 'Was • kostet • Kilo • Kartoffeln' },
          { vi: 'Cái áo phông này năm mươi euro.', de: 'Das T-Shirt kostet fünfzig Euro.', hint: 'T-Shirt • kostet • fünfzig Euro' },
          { vi: 'Tổng cộng là tám euro ạ.', de: 'Das macht acht Euro.', hint: 'Das macht • acht Euro' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Was kosten die Äpfel heute?', vi: 'Hôm nay táo bao nhiêu tiền?' },
          { who: 'Lena', de: 'Das Kilo kostet zwei Euro fünfzig.', vi: 'Một cân hai euro năm mươi ạ.' }
        ],
        mcq: {
          q: 'Lena zeigt auf ein Brot. Was fragt sie?',
          qVi: 'Lena chỉ vào một ổ bánh mì. Cô ấy hỏi gì?',
          options: ['Was kostet das Brot?', 'Wie ist das Wetter heute?', 'Wann schließt der Markt?', 'Wo kann ich parken?'],
          answer: 'Was kostet das Brot?',
          why: 'Lena muốn biết giá ổ bánh mì nên câu "Was kostet das Brot?" là phù hợp nhất, các đáp án khác không liên quan đến việc mua hàng.'
        }
      },
      {
        id: 'ich-haette-gern-einkaufen',
        formula: 'Ich hätte gern …',
        vi: 'Tôi muốn lấy …',
        note: 'Câu gọi món / mua hàng lịch sự nhất, dùng ở chợ, tiệm bánh, quán ăn. "hätte gern" là Konjunktiv II của "haben" — nhẹ nhàng hơn "ich will". Sau đó là Akkusativ.',
        vocab: [['hätte gern', 'muốn lấy (lịch sự)'], ['der Kaffee', 'cà phê'], ['das Brötchen', 'bánh mì cuộn'], ['ein Kilo', 'một cân']],
        examples: [
          { de: 'Ich hätte gern ein Kilo Äpfel, bitte.', vi: 'Cho tôi một cân táo ạ.' },
          { de: 'Ich hätte gern zwei Brötchen mit Käse.', vi: 'Cho tôi hai cái bánh mì cuộn với phô mai ạ.' },
          { de: 'Ich hätte gern ein Stück Kuchen, bitte.', vi: 'Cho tôi một miếng bánh ạ.' },
          { de: 'Ich hätte gern ein Brot und vier Brötchen.', vi: 'Cho tôi một ổ bánh mì và bốn cái bánh mì cuộn ạ.' },
          { de: 'Ich hätte gern eine Tasse Tee.', vi: 'Cho tôi một tách trà ạ.' },
          { de: 'Ich hätte gern fünf Äpfel, bitte.', vi: 'Cho tôi năm quả táo ạ.' }
        ],
        exercises: [
          { vi: 'Cho tôi một ly nước cam ạ.', de: 'Ich hätte gern ein Glas Orangensaft, bitte.', hint: 'Ich hätte gern • Glas • Orangensaft' },
          { vi: 'Cho tôi ba cái bánh mì cuộn ạ.', de: 'Ich hätte gern drei Brötchen, bitte.', hint: 'Ich hätte gern • drei • Brötchen' },
          { vi: 'Cho tôi một miếng bánh sô cô la ạ.', de: 'Ich hätte gern ein Stück Schokoladenkuchen, bitte.', hint: 'Ich hätte gern • Stück • Schokoladenkuchen' },
          { vi: 'Cho tôi hai cân khoai tây ạ.', de: 'Ich hätte gern zwei Kilo Kartoffeln.', hint: 'Ich hätte gern • zwei Kilo • Kartoffeln' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Ich hätte gern ein Wasser, bitte.', vi: 'Cho tôi một chai nước ạ.' },
          { who: 'Lena', de: 'Gern! Sonst noch etwas?', vi: 'Vâng ạ! Anh còn lấy gì nữa không?' }
        ],
        mcq: {
          q: 'Lena steht beim Bäcker. Was sagt sie?',
          qVi: 'Lena đang đứng ở tiệm bánh mì. Cô ấy nói gì?',
          options: ['Ich hätte gern vier Brötchen, bitte.', 'Ich bin spät dran.', 'Es regnet heute.', 'Ich muss noch arbeiten.'],
          answer: 'Ich hätte gern vier Brötchen, bitte.',
          why: 'Lena đang mua bánh mì nên câu gọi món lịch sự "Ich hätte gern vier Brötchen, bitte." là phù hợp nhất, các đáp án khác không phải câu mua hàng.'
        }
      },
      {
        id: 'kann-ich-mit-karte-zahlen',
        formula: 'Kann ich mit Karte zahlen?',
        vi: 'Tôi trả bằng thẻ được không?',
        note: 'Câu hỏi khi thanh toán ở Đức — nhiều cửa hàng nhỏ vẫn chỉ nhận tiền mặt. Trả lời thường là "Ja, natürlich!" hoặc "Nein, leider nur bar."',
        vocab: [['mit Karte zahlen', 'trả bằng thẻ'], ['bar zahlen', 'trả bằng tiền mặt'], ['die Karte', 'thẻ'], ['leider', 'tiếc là']],
        examples: [
          { de: 'Kann ich hier mit Karte zahlen?', vi: 'Ở đây tôi trả bằng thẻ được không?' },
          { de: 'Kann ich mit Karte zahlen oder nur bar?', vi: 'Tôi trả bằng thẻ được không, hay chỉ nhận tiền mặt?' },
          { de: 'Ja, natürlich! Sie können mit Karte zahlen.', vi: 'Vâng, tất nhiên rồi ạ! Anh có thể trả bằng thẻ.' },
          { de: 'Nein, leider nur bar.', vi: 'Không, tiếc là chỉ nhận tiền mặt ạ.' },
          { de: 'Ich zahle mit Karte, bitte.', vi: 'Tôi trả bằng thẻ ạ.' },
          { de: 'Kann ich auch mit dem Handy zahlen?', vi: 'Tôi trả bằng điện thoại được không ạ?' }
        ],
        exercises: [
          { vi: 'Tôi trả bằng thẻ được không ạ?', de: 'Kann ich mit Karte zahlen, bitte?', hint: 'Kann ich • mit Karte • zahlen' },
          { vi: 'Tôi trả bằng tiền mặt ạ.', de: 'Ich zahle bar, bitte.', hint: 'Ich zahle • bar' },
          { vi: 'Ở đây có trả bằng thẻ được không?', de: 'Kann man hier mit Karte zahlen?', hint: 'Kann man • hier • mit Karte • zahlen' },
          { vi: 'Không, tiếc là chúng tôi chỉ nhận tiền mặt.', de: 'Nein, leider nehmen wir nur Bargeld.', hint: 'Nein • leider • nur Bargeld' }
        ],
        dialogue: [
          { who: 'Tim', de: 'Entschuldigung, kann ich mit Karte zahlen?', vi: 'Xin lỗi, tôi trả bằng thẻ được không ạ?' },
          { who: 'Lena', de: 'Ja, natürlich! Gern.', vi: 'Vâng, tất nhiên rồi ạ!' }
        ],
        mcq: {
          q: 'Tim will an der Kasse mit Karte zahlen. Was fragt er?',
          qVi: 'Tim muốn trả bằng thẻ ở quầy thu ngân. Cậu ấy hỏi gì?',
          options: ['Kann ich bitte mit Karte zahlen?', 'Wo ist der Ausgang?', 'Wie viel Uhr ist es?', 'Kann ich hier parken?'],
          answer: 'Kann ich bitte mit Karte zahlen?',
          why: 'Tim muốn trả bằng thẻ nên câu hỏi này là phù hợp nhất, các đáp án khác không liên quan đến việc thanh toán.'
        }
      }
    ]
  }
];
