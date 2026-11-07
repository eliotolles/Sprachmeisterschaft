const grammarRoot='https://www.deutschakademie.de/online-deutschkurs/deutsche-grammatik/';
const phonetics='https://www.goethe.de/ins/vn/de/spr/unt/for/gia/ltb.html';
export const EXPLORE_LESSONS=[
 {
  id:'sentence',title:'Cấu trúc câu',intro:'Xây một câu đúng bằng cách xác định động từ chia trước, rồi đặt các thành phần còn lại vào khung câu.',
  cards:[
   {title:'Câu kể và vị trí thứ hai',rule:'Động từ chia đứng ở vị trí thứ hai. Một cụm như Heute Morgen vẫn chỉ chiếm một vị trí. Nếu đưa thời gian lên đầu, chủ ngữ chuyển ra sau động từ.',
    examples:[['Ich lerne heute Deutsch.','Hôm nay tôi học tiếng Đức.'],['Heute Morgen lerne ich zu Hause.','Sáng nay tôi học ở nhà.']],note:'Không viết Heute ich lerne. Vị trí được tính theo thành phần câu, không theo số từ.'},
   {title:'Khung động từ',rule:'Với động từ khuyết thiếu, Perfekt hoặc động từ tách, phần đã chia ở vị trí hai, phần còn lại thường ở cuối câu.',
    examples:[['Ich muss morgen früh arbeiten.','Ngày mai tôi phải làm việc sớm.'],['Ich habe gestern meine Mutter angerufen.','Hôm qua tôi đã gọi cho mẹ.']],note:'Đánh dấu hai đầu khung trước khi thêm thời gian, địa điểm hoặc tân ngữ.'},
   {title:'Câu phụ',rule:'Sau weil, dass, wenn hoặc obwohl, động từ chia thường về cuối mệnh đề. Nếu câu phụ đứng đầu, động từ của câu chính đứng ngay sau dấu phẩy.',
    examples:[['Ich bleibe zu Hause, weil ich krank bin.','Tôi ở nhà vì bị ốm.'],['Wenn ich Zeit habe, besuche ich dich.','Nếu có thời gian, tôi sẽ đến thăm bạn.']],note:'Denn nối hai mệnh đề chính nên giữ trật tự động từ ở vị trí hai.'},
   {title:'Đặt câu hỏi',rule:'Câu hỏi có/không bắt đầu bằng động từ chia. Câu hỏi có từ để hỏi thường đặt từ để hỏi trước động từ.',
    examples:[['Hast du morgen Zeit?','Ngày mai bạn có thời gian không?'],['Wann beginnt der Kurs?','Khóa học bắt đầu khi nào?']]}
  ],
  quiz:{question:'Chọn câu đúng.',options:['Morgen ich muss arbeiten.','Morgen muss ich arbeiten.'],answer:1,explanation:'Morgen là vị trí đầu. Muss đứng thứ hai, arbeiten ở cuối.'},
  sources:[{title:'DeutschAkademie · Hauptsatz',url:grammarRoot+'satzbau/hauptsatz/'},{title:'DeutschAkademie · Satzklammer',url:grammarRoot+'satzbau/hauptsatz/satzklammer/'},{title:'DeutschAkademie · Satzbau',url:grammarRoot+'satzbau/'}]
 },
 {
  id:'articles',title:'Der · Die · Das',intro:'Học danh từ cùng mạo từ, dạng số nhiều và một cụm thường dùng. Đuôi từ là dấu hiệu hỗ trợ, cần kiểm tra từng từ.',
  cards:[
   {title:'Những đuôi thường gặp',rule:'Các danh từ tận cùng bằng -ung, -heit, -keit, -schaft thường là die. Dạng thu nhỏ với -chen hoặc -lein là das. Danh từ với -ling thường là der.',
    examples:[['die Ausbildung, die Möglichkeit, die Freundschaft','việc đào tạo, khả năng, tình bạn'],['das Mädchen, das Büchlein, der Lehrling','cô bé, quyển sách nhỏ, người học nghề']],note:'Mädchen dùng das theo cấu tạo từ. Giống ngữ pháp không luôn trùng giới tính tự nhiên.'},
   {title:'Danh từ ghép',rule:'Trong một danh từ ghép, thành phần cuối quyết định giống và nghĩa chính.',
    examples:[['das Haus → die Haustür','ngôi nhà → cửa ra vào của ngôi nhà'],['der Tisch → die Tischlampe','cái bàn → đèn bàn']],note:'Ghi die Tür và die Lampe để nhớ vì sao hai từ ghép này dùng die.'},
   {title:'Học cả số nhiều',rule:'Ở Nominativ và Akkusativ, mạo từ xác định số nhiều là die. Hình thức của danh từ vẫn phải học riêng.',
    examples:[['das Buch – die Bücher','quyển sách – những quyển sách'],['der Tisch – die Tische','cái bàn – những cái bàn']],note:'Khi viết câu, phải biến đổi mạo từ theo cách. Der Tisch có thể thành den Tisch hoặc dem Tisch.'}
  ],
  quiz:{question:'Từ Haustür dùng mạo từ nào?',options:['der','die','das'],answer:1,explanation:'Thành phần cuối là die Tür nên dùng die Haustür.'},
  sources:[{title:'DeutschAkademie · Ngữ pháp tiếng Đức',url:grammarRoot}]
 },
 {
  id:'participle',title:'Partizip II',intro:'Partizip II dùng trong Perfekt và nhiều cấu trúc khác. Tách việc tạo Partizip II khỏi việc chọn haben hoặc sein.',
  cards:[
   {title:'Động từ đều',rule:'Mẫu thường gặp là ge- + gốc động từ + -t. Với gốc khó phát âm, thường thêm -et.',
    examples:[['machen → gemacht; lernen → gelernt','làm → đã làm; học → đã học'],['arbeiten → gearbeitet','làm việc → đã làm việc']],note:'Động từ mạnh cần học cả ba dạng, chẳng hạn gehen – ging – gegangen.'},
   {title:'Tiền tố và -ieren',rule:'Động từ tách đặt ge- giữa tiền tố và gốc. Động từ không tách với be-, emp-, ent-, er-, ge-, miss-, ver-, zer- không thêm ge-. Động từ tận cùng bằng -ieren cũng không thêm ge-.',
    examples:[['einkaufen → eingekauft; anrufen → angerufen','mua sắm; gọi điện'],['besuchen → besucht; studieren → studiert','thăm; học đại học']],note:'Nhớ sự khác nhau giữa động từ tách và không tách, không chỉ nhìn chiều dài của từ.'},
   {title:'Dùng trong câu',rule:'Perfekt gồm haben/sein đã chia và Partizip II ở cuối. Nhiều động từ chỉ di chuyển hoặc thay đổi trạng thái dùng sein, nhưng không áp dụng máy móc cho mọi động từ có chuyển động.',
    examples:[['Wir haben zusammen gekocht.','Chúng tôi đã nấu ăn cùng nhau.'],['Sie ist nach Hause gefahren.','Cô ấy đã đi về nhà.']],note:'Học trợ động từ cùng động từ. Bleiben dùng sein dù không chỉ chuyển động.'},
   {title:'Partizip II làm tính từ',rule:'Khi đứng trước danh từ, Partizip II nhận đuôi tính từ theo mạo từ và cách.',
    examples:[['die geschlossene Tür','cánh cửa đã đóng'],['Ich öffne das gekaufte Buch.','Tôi mở quyển sách đã mua.']]}
  ],
  quiz:{question:'Partizip II của besuchen là gì?',options:['gebesucht','besucht','besuchen'],answer:1,explanation:'Be- là tiền tố không tách nên không thêm ge-.'},
  sources:[{title:'DeutschAkademie · Partizip II',url:grammarRoot+'wortarten/verben/partizip-2/'},{title:'DeutschAkademie · Perfekt',url:grammarRoot+'wortarten/verben/deutsche-zeitformen/perfekt/'},{title:'Deutsche Grammatik 2.0 · Dùng Partizip II',url:'https://deutschegrammatik20.de/verbformen/das-partizip-ii/partizip-ii/die-verwendung-des-partizips-ii/'}]
 },
 {
  id:'daily',title:'Giao tiếp đời sống',intro:'Dùng các mẫu ngắn theo tình huống, sau đó thay thông tin để nói về việc của bạn.',
  cards:[
   {title:'Đặt và đổi lịch',rule:'Nói mục đích trước, hỏi lịch trống rồi xác nhận thời gian.',
    examples:[['Ich möchte einen Termin vereinbaren. Haben Sie am Freitag noch etwas frei?','Tôi muốn đặt lịch hẹn. Thứ Sáu còn giờ trống không?'],['Könnten wir den Termin auf Montag verschieben?','Chúng ta có thể chuyển lịch sang thứ Hai không?']]},
   {title:'Mua hàng và hỏi thông tin',rule:'Dùng könnten hoặc hätte gern để yêu cầu lịch sự. Thêm thông tin cụ thể về cỡ, màu hoặc số lượng.',
    examples:[['Ich hätte diese Jacke gern eine Nummer größer.','Tôi muốn chiếc áo khoác này lớn hơn một cỡ.'],['Könnte ich das kurz anprobieren?','Tôi có thể thử nó một chút không?']]},
   {title:'Báo vấn đề và nhờ giúp',rule:'Mô tả điều quan sát được, rồi nói rõ bạn cần gì.',
    examples:[['Die Heizung funktioniert seit gestern nicht. Könnten Sie bitte jemanden schicken?','Máy sưởi không hoạt động từ hôm qua. Anh/chị có thể cử người đến không?'],['Entschuldigung, könnten Sie das bitte langsamer wiederholen?','Xin lỗi, anh/chị có thể nhắc lại chậm hơn không?']],note:'Khi chưa hiểu, hỏi lại một chi tiết cụ thể thay vì chỉ gật đầu.'}
  ],
  quiz:{question:'Bạn cần đổi lịch sang thứ Hai. Chọn mẫu phù hợp.',options:['Könnten wir den Termin auf Montag verschieben?','Ich bin seit Montag hier.'],answer:0,explanation:'Verschieben là dời hoặc đổi lịch. Auf Montag nêu thời điểm mới.'},
  sources:[{title:'Goethe-Institut · Tự học và giao tiếp đời sống',url:'https://www.goethe.de/de/spr/ueb/sst.html'}]
 },
 {
  id:'colloquial',title:'Khẩu ngữ',intro:'Các từ nhỏ như mal hoặc doch thường thể hiện thái độ của người nói. Không thể dịch cố định từng từ sang tiếng Việt.',
  cards:[
   {title:'Mal trong lời nhờ',rule:'Mal thường làm lời yêu cầu bớt nặng hoặc mang sắc thái thân mật. Sự lịch sự còn phụ thuộc ngữ điệu và quan hệ giữa hai người.',
    examples:[['Kannst du mir mal helfen?','Bạn giúp mình một chút được không?'],['Schau mal!','Nhìn này!']],note:'Trong thư trang trọng, ưu tiên câu yêu cầu rõ ràng với bitte hoặc könnten.'},
   {title:'Doch và câu phủ định',rule:'Doch có thể dùng để phản bác một ý phủ định. Trong câu khác, nó còn thể hiện nhắc lại hoặc khuyến khích.',
    examples:[['Du kommst nicht? – Doch, ich komme!','Bạn không đến à? – Có chứ, mình đến!'],['Komm doch mit!','Đi cùng nhé!']],note:'Không thay doch bằng ja khi cần bác bỏ một câu phủ định.'},
   {title:'Biểu thức thường nghe',rule:'Học cụm khẩu ngữ cùng tình huống và mức độ thân mật.',
    examples:[['Alles klar, ich melde mich später.','Được rồi, lát nữa mình liên lạc.'],['Das klappt schon.','Việc đó rồi sẽ ổn thôi.'],['Na ja, ganz einfach ist es nicht.','Ừm, chuyện đó cũng không hoàn toàn dễ.']],note:'Halt và eben có thể thể hiện việc chấp nhận một tình huống. Lạm dụng chúng dễ làm lời giải thích nghe hời hợt.'}
  ],
  quiz:{question:'Du hast keine Zeit? Bạn có thời gian và muốn phản bác. Dùng gì?',options:['Doch, ich habe Zeit.','Nein, ich habe Zeit.'],answer:0,explanation:'Doch bác bỏ nội dung phủ định của câu hỏi.'},
  sources:[{title:'IDS grammis · Hệ thống ngữ pháp tiếng Đức',url:'https://grammis.ids-mannheim.de/'}]
 },
 {
  id:'idioms',title:'Thành ngữ & tục ngữ',intro:'Thành ngữ cần hiểu theo nghĩa của cả cụm. Phân biệt cụm dùng trong hội thoại với tục ngữ diễn đạt một nhận xét chung.',
  cards:[
   {title:'Chúc may mắn',rule:'Jemandem die Daumen drücken dùng để chúc ai đó gặp may hoặc đạt điều đang mong đợi.',
    examples:[['Du hast morgen eine Prüfung? Ich drücke dir die Daumen!','Mai bạn thi à? Mình chúc bạn may mắn!']],note:'Người được chúc ở Dativ, chẳng hạn dir hoặc Ihnen.'},
   {title:'Không hiểu hoặc gặp khó',rule:'Ich verstehe nur Bahnhof nghĩa là không hiểu gì. Auf dem Schlauch stehen diễn tả lúc chưa nghĩ ra hoặc chưa hiểu một việc.',
    examples:[['Bei dieser Erklärung verstehe ich nur Bahnhof.','Nghe cách giải thích này tôi chẳng hiểu gì.'],['Warte kurz, ich stehe gerade auf dem Schlauch.','Đợi một chút, lúc này mình chưa nghĩ ra.']]},
   {title:'Luyện tập và thói quen',rule:'Übung macht den Meister nhấn mạnh vai trò của luyện tập. Aller Anfang ist schwer nói rằng lúc bắt đầu thường khó.',
    examples:[['Am Anfang war das Sprechen schwierig. Aber Übung macht den Meister.','Ban đầu nói rất khó. Nhưng luyện tập sẽ giúp thành thạo.']],note:'Trong bài viết, chỉ dùng thành ngữ khi phù hợp nội dung và văn phong. Không chèn chỉ để làm câu dài hơn.'}
  ],
  quiz:{question:'Ich drücke dir die Daumen có nghĩa gì?',options:['Tôi chúc bạn may mắn.','Tôi không hiểu bạn.'],answer:0,explanation:'Đây là lời chúc may mắn, thường dùng trước một kỳ thi hoặc sự kiện quan trọng.'},
  sources:[{title:'DW · Ich drücke dir die Daumen',url:'https://www.dw.com/downloads/46261679/ich-drcke-dir-die-daumenmanuskript.pdf'},{title:'DW · Ich verstehe nur Bahnhof',url:'https://amp.dw.com/en/why-germans-love-to-complain-about-trains/a-47441119'}]
 },
 {
  id:'ipa',title:'IPA & phát âm',intro:'IPA biểu diễn âm, không phải cách viết. Dấu ː chỉ nguyên âm dài, dấu ˈ đứng trước âm tiết mang trọng âm chính.',
  cards:[
   {title:'Nguyên âm dài và ngắn',rule:'Phân biệt cả độ dài lẫn chất lượng nguyên âm. Miệng và lưỡi của âm ngắn có thể khác âm dài.',
    examples:[['bieten [ˈbiːtən] – bitten [ˈbɪtən]','đề nghị – yêu cầu'],['schon [ʃoːn] – schön [ʃøːn]','đã – đẹp']],note:'Không thêm dấu tiếng Việt vào IPA để tạo cách đọc gần đúng.'},
   {title:'Ü và Ö',rule:'Để tập ü, bắt đầu từ âm i rồi tròn môi, giữ lưỡi ở phía trước. Với ö, bắt đầu từ âm e rồi tròn môi.',
    examples:[['fühlen [ˈfyːlən] – füllen [ˈfʏlən]','cảm thấy – đổ đầy'],['schön [ʃøːn] – können [ˈkœnən]','đẹp – có thể']],note:'Ü và ö không phải u hoặc o. Cần luyện nghe phân biệt trước khi tăng tốc nói.'},
   {title:'Ich-Laut và Ach-Laut',rule:'Âm ch trong ich là [ç], còn trong Bach là [x]. Nguyên âm trước ch là một dấu hiệu quan trọng, nhưng từ vay mượn có thể theo cách đọc khác.',
    examples:[['ich [ɪç] – Bach [bax]','tôi – con suối'],['nicht [nɪçt] – Buch [buːx]','không – quyển sách']],note:'Chú ý giữ phụ âm cuối. Không đọc ich thành ích với âm bật cuối tiếng Việt.'},
   {title:'Âm cuối và trọng âm',rule:'Trong tiếng Đức chuẩn, b/d/g ở cuối âm tiết thường thành [p]/[t]/[k]. Trọng âm từ và nhịp cả câu cũng ảnh hưởng độ dễ hiểu.',
    examples:[['Tag [taːk] – Tage [ˈtaːɡə]','ngày – những ngày'],['Ich möchte einen Termin vereinbaren.','Tôi muốn đặt lịch hẹn.']],note:'Nghe một cụm ngắn, nói theo, ghi âm và đối chiếu cả phụ âm cuối lẫn từ được nhấn.'}
  ],
  quiz:{question:'Dấu ː trong [biː] cho biết điều gì?',options:['Nguyên âm dài.','Phải nhấn thật to.'],answer:0,explanation:'ː là dấu độ dài. Trọng âm chính dùng ký hiệu ˈ trước âm tiết.'},
  sources:[{title:'Goethe-Institut Việt Nam · Laute(r) bitte!',url:phonetics},{title:'Goethe-Institut · Wie bitte?',url:'https://www.goethe.de/prj/dlp/de/magazin-sprache/20749839.html'},{title:'Goethe-Institut · Aussprachetutorials',url:'https://www.goethe.de/prj/dlp/de/unterrichtsmaterial/aussprachetutorials'}]
 },
 {
  id:'culture',title:'Văn hóa Đức',intro:'Quan sát tình huống cụ thể và hỏi khi chưa rõ quy ước. Thói quen có thể khác nhau giữa gia đình, nơi làm việc và từng vùng.',
  cards:[
   {title:'Du và Sie',rule:'Với người chưa quen trong bối cảnh trang trọng, Sie thường là lựa chọn phù hợp. Ở một số nơi làm việc, mọi người dùng du ngay từ đầu, nên có thể hỏi cách xưng hô.',
    examples:[['Darf ich Sie etwas fragen?','Tôi có thể hỏi anh/chị một việc không?'],['Sollen wir uns duzen?','Chúng ta xưng du với nhau nhé?']],note:'Sie trang trọng viết hoa. Trong thư trang trọng, dùng Ihr/Ihre tương ứng.'},
   {title:'Hẹn giờ và báo trễ',rule:'Xác nhận rõ ngày, giờ và địa điểm. Nếu không đến đúng hẹn, liên lạc sớm và nói thời gian dự kiến.',
    examples:[['Ich komme voraussichtlich zehn Minuten später.','Dự kiến tôi đến muộn mười phút.'],['Passt Ihnen Dienstag um halb drei?','Thứ Ba lúc hai giờ rưỡi có phù hợp với anh/chị không?']],note:'Halb drei là 14 giờ 30 trong ngữ cảnh buổi chiều, không phải 15 giờ 30.'},
   {title:'Hỏi để hiểu quy định',rule:'Đọc thông báo tại nơi ở hoặc cơ quan và hỏi về cách làm cụ thể. Các quy định địa phương không nên được suy ra từ một thói quen chung.',
    examples:[['Wie wird der Müll hier getrennt?','Ở đây phân loại rác như thế nào?'],['Welche Regeln gelten in diesem Haus?','Tòa nhà này áp dụng những quy định nào?']]}
  ],
  quiz:{question:'Bạn sắp trễ lịch hẹn. Câu nào nói rõ tình huống?',options:['Ich komme voraussichtlich zehn Minuten später.','Ich komme irgendwann.'],answer:0,explanation:'Câu đầu đưa ra thời gian dự kiến cụ thể để người kia chủ động sắp xếp.'},
  sources:[{title:'Goethe-Institut · Mein Weg nach Deutschland',url:'https://www.goethe.de/prj/mwd/de/index.html'}]
 },
 {
  id:'study',title:'Cách tự học',intro:'Dùng một vòng học ngắn mà bạn có thể lặp lại dù lịch sinh hoạt thay đổi.',
  cards:[
   {title:'Học từ theo cụm',rule:'Mỗi lượt chọn một ít từ từ bài đang học. Ghi mạo từ hoặc cấu trúc đi kèm, một nghĩa đúng ngữ cảnh và một câu do bạn tự đặt.',
    examples:[['einen Termin vereinbaren','đặt một lịch hẹn'],['Ich möchte einen Termin beim Arzt vereinbaren.','Tôi muốn đặt lịch hẹn với bác sĩ.']],note:'Với động từ, ghi cả giới từ hoặc cách của tân ngữ nếu có. Đừng chỉ học nghĩa tiếng Việt.'},
   {title:'Tự nhớ trước khi xem',rule:'Che đáp án rồi nói hoặc viết lại. Sau đó đối chiếu, sửa lỗi cụ thể và ôn các mục đến hạn trong SRS.',
    examples:[['Was habe ich gestern gemacht?','Hôm qua tôi đã làm gì?'],['Gestern habe ich eingekauft und gekocht.','Hôm qua tôi đã đi mua sắm và nấu ăn.']],note:'Một mục bị sai cần được luyện lại bằng cách dùng nó trong câu khác.'},
   {title:'Vòng luyện linh hoạt',rule:'Có 15 phút thì ôn từ đến hạn, đọc hoặc nghe một đoạn ngắn, rồi tự nói vài câu tóm tắt. Có thêm thời gian thì viết lại và sửa một nhóm lỗi.',
    examples:[['Heute übe ich fünf Sätze mit weil.','Hôm nay tôi luyện năm câu với weil.']],note:'Ghi một kết quả quan sát được, chẳng hạn nói trọn một phút hoặc sửa đúng vị trí động từ. Không chỉ ghi số giờ đã ngồi học.'}
  ],
  quiz:{question:'Cách nào kiểm tra được bạn đã nhớ cụm từ?',options:['Che đáp án và tự dùng cụm đó trong một câu.','Đọc lại cùng một dòng mà không tự nhớ.'],answer:0,explanation:'Tự gọi lại và dùng cụm từ cho thấy rõ bạn còn thiếu phần nào để sửa.'},
  sources:[{title:'Goethe-Institut · Tự học tiếng Đức',url:'https://www.goethe.de/de/spr/ueb/sst.html'}]
 },
 {
  id:'advanced',title:'Luyện nâng cao C1',intro:'Luyện diễn đạt chính xác và nối lập luận. Một cấu trúc dài chỉ hữu ích khi nghĩa, quan hệ logic và văn phong đều phù hợp.',
  cards:[
   {title:'Danh từ hóa',rule:'Có thể chuyển một mệnh đề sang cụm danh từ với giới từ. Khi chuyển, phải giữ đúng quan hệ nguyên nhân, thời gian hoặc nhượng bộ.',
    examples:[['Weil die Kosten steigen, muss die Firma sparen.','Vì chi phí tăng, công ty phải tiết kiệm.'],['Wegen des Anstiegs der Kosten muss die Firma sparen.','Do sự gia tăng chi phí, công ty phải tiết kiệm.']],note:'Wegen dùng Genitiv trong văn viết chuẩn. Không bỏ mất chủ thể hoặc ý phủ định khi chuyển cấu trúc.'},
   {title:'Thuộc ngữ phân từ',rule:'Partizip I thường gợi hành động đang diễn ra hoặc tính chất chủ động. Partizip II thường diễn tả kết quả hoặc nghĩa bị động với nhiều động từ chuyển tiếp.',
    examples:[['die steigenden Preise','những mức giá đang tăng'],['die gestern veröffentlichte Studie','nghiên cứu được công bố hôm qua']],note:'Tính từ hóa phân từ đứng trước danh từ vẫn phải có đuôi tính từ. Tránh kéo thuộc ngữ quá dài khiến câu khó đọc.'},
   {title:'Tường thuật bằng Konjunktiv I',rule:'Trong văn phong báo chí, Konjunktiv I thường đánh dấu lời được thuật lại. Dạng er/sie sei hoặc habe giúp phân biệt với lời khẳng định trực tiếp của người viết.',
    examples:[['Die Sprecherin erklärt, die Lage sei stabil.','Người phát ngôn giải thích rằng tình hình ổn định.'],['Er berichtet, er habe die Unterlagen bereits geschickt.','Anh ấy cho biết đã gửi hồ sơ rồi.']],note:'Konjunktiv I không đồng nghĩa người viết khẳng định lời đó là sai.'},
   {title:'Nhượng bộ và đánh giá',rule:'Obwohl dẫn câu phụ. Dennoch hoặc trotzdem nối ý ở câu chính. Bạn có thể vừa công nhận một điểm vừa nêu hạn chế.',
    examples:[['Obwohl die Lösung teuer ist, bietet sie langfristige Vorteile.','Dù giải pháp đắt, nó đem lại lợi ích lâu dài.'],['Die Lösung ist teuer. Dennoch halte ich sie für sinnvoll.','Giải pháp đắt. Tuy vậy, tôi cho rằng nó hợp lý.']]}
  ],
  quiz:{question:'Chọn câu đúng.',options:['Dennoch ich halte sie für sinnvoll.','Dennoch halte ich sie für sinnvoll.'],answer:1,explanation:'Dennoch chiếm vị trí đầu của câu chính, động từ chia halte đứng thứ hai.'},
  sources:[{title:'Deutsche Grammatik 2.0 · Các chủ điểm nâng cao',url:'https://deutschegrammatik20.de/grammatik-ubungen/'},{title:'Deutsche Grammatik 2.0 · Thuộc ngữ phân từ',url:'https://deutschegrammatik20.de/komplexer-satz/partizipialkonstruktionen-2/'},{title:'Deutsche Grammatik 2.0 · Konjunktiv quá khứ',url:'https://deutschegrammatik20.de/konjunktiv/ubersicht-die-formen-des-konjunktivs-i-und-ii-vergangenheit-aktiv/'}]
 },
 {id:'dictionary',title:'Tra từ',intro:'Tra nghĩa theo ngữ cảnh, kiểm tra mạo từ và ví dụ, rồi lưu những từ bạn thực sự muốn ôn.',route:'/vocabulary/dictionary',action:'Mở từ điển'},
 {id:'games',title:'Trò chơi',intro:'Luyện phản xạ mạo từ với những danh từ đang học. Sau mỗi lượt, quay lại kiểm tra các từ bị nhầm.',route:'/game',action:'Mở trò chơi'},
 {id:'progress',title:'Tiến độ cá nhân',intro:'Xem các kết quả học đã được ghi nhận để chọn phần cần ôn tiếp.',route:'/progress',action:'Xem tiến độ'}
];
