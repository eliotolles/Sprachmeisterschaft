# -*- coding: utf-8 -*-
import json
import os

OUT_DIR = r"C:\Users\datnv\.gemini\antigravity\scratch\sprachmeisterschaft\src\data"
os.makedirs(OUT_DIR, exist_ok=True)

TOPICS = [
    "alltag", "familie", "arbeit", "wohnen", "essen", "einkaufen", "gesundheit", "reisen",
    "verkehr", "bildung", "behoerden", "geld", "umwelt", "freizeit", "medien", "meinung",
    "gefuehle", "technik", "arbeitssuche", "interkulturell"
]

# Generate 122 A1 words
a1_raw = [
    # alltag
    ("der", "Tag", "noun", "ngày, ban ngày", "Guten Tag, wie geht es Ihnen?", "Chào buổi sáng, bạn khỏe không?", "alltag"),
    ("die", "Woche", "noun", "tuần", "Eine Woche hat sieben Tage.", "Một tuần có bảy ngày.", "alltag"),
    ("der", "Monat", "noun", "tháng", "Der Monat Mai ist wunderschön.", "Tháng năm thật đẹp.", "alltag"),
    ("das", "Jahr", "noun", "năm", "Ich lerne seit einem Jahr Deutsch.", "Tôi học tiếng Đức được một năm rồi.", "alltag"),
    ("die", "Uhr", "noun", "đồng hồ, giờ", "Wie viel Uhr ist es jetzt?", "Bây giờ là mấy giờ?", "alltag"),
    ("die", "Zeit", "noun", "thời gian", "Ich habe heute leider keine Zeit.", "Hôm nay tôi tiếc là không có thời gian.", "alltag"),
    ("", "heute", "adv", "hôm nay", "Heute ist das Wetter sehr schön.", "Hôm nay thời tiết rất đẹp.", "alltag"),
    ("", "morgen", "adv", "ngày mai", "Wir treffen uns morgen um acht Uhr.", "Chúng ta gặp nhau sáng mai lúc tám giờ.", "alltag"),
    ("", "gestern", "adv", "hôm qua", "Gestern war ich zu Hause.", "Hôm qua tôi ở nhà.", "alltag"),
    ("", "aufstehen", "verb", "thức dậy", "Ich stehe jeden Tag um sechs Uhr auf.", "Tôi thức dậy lúc sáu giờ mỗi ngày.", "alltag"),
    ("", "schlafen", "verb", "ngủ", "Die Kinder schlafen schon seit einer Stunde.", "Lũ trẻ đã ngủ được một tiếng rồi.", "alltag"),
    ("der", "Morgen", "noun", "buổi sáng", "Am Morgen trinke ich gern einen Kaffee.", "Buổi sáng tôi thích uống cà phê.", "alltag"),
    ("der", "Abend", "noun", "buổi tối", "Guten Abend, meine Damen und Herren!", "Kính chào quý vị buổi tối!", "alltag"),
    ("die", "Nacht", "noun", "ban đêm", "Gute Nacht und schlaf gut!", "Chúc ngủ ngon và ngủ say nhé!", "alltag"),
    # familie
    ("die", "Mutter", "noun", "mẹ", "Meine Mutter kocht sehr gut.", "Mẹ tôi nấu ăn rất ngon.", "familie"),
    ("der", "Vater", "noun", "cha, bố", "Mein Vater arbeitet in einer Firma.", "Bố tôi làm việc trong một công ty.", "familie"),
    ("die", "Eltern", "noun", "bố mẹ, phụ huynh", "Meine Eltern wohnen in Hanoi.", "Bố mẹ tôi sống ở Hà Nội.", "familie"),
    ("der", "Sohn", "noun", "con trai", "Ihr Sohn geht schon in die Schule.", "Con trai cô ấy đã đi học rồi.", "familie"),
    ("die", "Tochter", "noun", "con gái", "Meine Tochter ist fünf Jahre alt.", "Con gái tôi năm tuổi.", "familie"),
    ("der", "Bruder", "noun", "anh/em trai", "Mein Bruder studiert Medizin in Berlin.", "Anh trai tôi học y khoa ở Berlin.", "familie"),
    ("die", "Schwester", "noun", "chị/em gái", "Ich habe eine ältere Schwester.", "Tôi có một người chị gái.", "familie"),
    ("das", "Kind", "noun", "đứa trẻ, con cái", "Das Kind spielt gern im Garten.", "Đứa trẻ thích chơi trong vườn.", "familie"),
    ("der", "Freund", "noun", "bạn bè, bạn trai", "Thomas ist mein bester Freund.", "Thomas là bạn thân nhất của tôi.", "familie"),
    ("die", "Freundin", "noun", "bạn gái (nữ)", "Ich gehe mit meiner Freundin ins Kino.", "Tôi đi xem phim cùng bạn gái.", "familie"),
    ("die", "Familie", "noun", "gia đình", "Meine Familie ist sehr groß.", "Gia đình tôi rất đông người.", "familie"),
    ("der", "Mann", "noun", "người đàn ông, người chồng", "Mein Mann kommt heute später nach Hause.", "Chồng tôi hôm nay về nhà muộn hơn.", "familie"),
    ("die", "Frau", "noun", "người phụ nữ, người vợ", "Frau Müller ist unsere Lehrerin.", "Bà Müller là giáo viên của chúng tôi.", "familie"),
    # arbeit
    ("die", "Arbeit", "noun", "công việc", "Ich fahre um sieben Uhr zur Arbeit.", "Tôi đi làm lúc bảy giờ.", "arbeit"),
    ("der", "Beruf", "noun", "nghề nghiệp", "Was sind Sie von Beruf?", "Nghề nghiệp của bạn là gì?", "arbeit"),
    ("der", "Arzt", "noun", "bác sĩ (nam)", "Der Arzt untersucht den Patienten.", "Bác sĩ đang khám cho bệnh nhân.", "arbeit"),
    ("die", "Ärztin", "noun", "bác sĩ (nữ)", "Die Ärztin verschreibt ein Medikament.", "Nữ bác sĩ kê một đơn thuốc.", "arbeit"),
    ("der", "Lehrer", "noun", "giáo viên (nam)", "Unser Deutschlehrer kommt aus München.", "Thầy giáo tiếng Đức của chúng tôi đến từ München.", "arbeit"),
    ("die", "Lehrerin", "noun", "giáo viên (nữ)", "Die Lehrerin erklärt die Grammatik sehr gut.", "Cô giáo giải thích ngữ pháp rất dễ hiểu.", "arbeit"),
    ("der", "Kollege", "noun", "đồng nghiệp (nam)", "Mein Kollege hilft mir bei der Arbeit.", "Đồng nghiệp giúp tôi trong công việc.", "arbeit"),
    ("das", "Büro", "noun", "văn phòng", "Wir arbeiten heute alle im Büro.", "Hôm nay tất cả chúng tôi đều làm việc ở văn phòng.", "arbeit"),
    ("der", "Chef", "noun", "sếp, cấp trên", "Mein Chef ist sehr freundlich.", "Sếp của tôi rất thân thiện.", "arbeit"),
    ("", "arbeiten", "verb", "làm việc", "Ich arbeite als Ingenieur in Frankfurt.", "Tôi làm kỹ sư ở Frankfurt.", "arbeit"),
    # wohnen
    ("die", "Wohnung", "noun", "căn hộ", "Ich suche eine neue Wohnung in Berlin.", "Tôi đang tìm một căn hộ mới ở Berlin.", "wohnen"),
    ("das", "Haus", "noun", "ngôi nhà", "Das Haus hat einen schönen Garten.", "Ngôi nhà có một khu vườn đẹp.", "wohnen"),
    ("das", "Zimmer", "noun", "căn phòng", "Mein Zimmer ist hell und gemütlich.", "Phòng của tôi sáng sủa và ấm cúng.", "wohnen"),
    ("die", "Küche", "noun", "nhà bếp", "In der Küche kochen wir zusammen.", "Chúng tôi cùng nhau nấu nướng trong bếp.", "wohnen"),
    ("das", "Bad", "noun", "phòng tắm", "Das Bad ist modern renoviert.", "Phòng tắm được tân trang hiện đại.", "wohnen"),
    ("der", "Tisch", "noun", "cái bàn", "Das Buch liegt auf dem Tisch.", "Quyển sách nằm trên bàn.", "wohnen"),
    ("der", "Stuhl", "noun", "cái ghế", "Bitte nehmen Sie auf dem Stuhl Platz.", "Xin mời ngồi vào ghế này.", "wohnen"),
    ("das", "Bett", "noun", "cái giường", "Das Bett im Hotel ist sehr bequem.", "Chiếc giường trong khách sạn rất êm ái.", "wohnen"),
    ("die", "Miete", "noun", "tiền thuê nhà", "Die Miete kostet 600 Euro im Monat.", "Tiền thuê nhà là 600 Euro mỗi tháng.", "wohnen"),
    ("", "wohnen", "verb", "sinh sống, cư ngụ", "Wo wohnen Sie zurzeit?", "Hiện tại bạn đang sống ở đâu?", "wohnen"),
    # essen
    ("das", "Essen", "noun", "thức ăn, bữa ăn", "Das Essen schmeckt wirklich lecker.", "Món ăn có vị thật là ngon.", "essen"),
    ("das", "Wasser", "noun", "nước uống", "Ein Glas Wasser bitte!", "Làm ơn cho tôi một ly nước!", "essen"),
    ("das", "Brot", "noun", "bánh mì", "Deutsches Brot ist weltweit bekannt.", "Bánh mì Đức nổi tiếng khắp thế giới.", "essen"),
    ("der", "Kaffee", "noun", "cà phê", "Trinken Sie gern Kaffee mit Milch?", "Bạn có thích uống cà phê sữa không?", "essen"),
    ("der", "Tee", "noun", "trà", "Eine Tasse Tee wärmt an kalten Tagen.", "Một tách trà làm ấm những ngày lạnh.", "essen"),
    ("das", "Fleisch", "noun", "thịt", "Ich esse lieber Fisch als Fleisch.", "Tôi thích ăn cá hơn ăn thịt.", "essen"),
    ("das", "Gemüse", "noun", "rau củ", "Frisches Gemüse ist sehr gesund.", "Rau củ tươi rất tốt cho sức khỏe.", "essen"),
    ("das", "Obst", "noun", "trái cây, hoa quả", "Obst kaufen wir immer auf dem Markt.", "Chúng tôi luôn mua hoa quả ở chợ.", "essen"),
    ("der", "Apfel", "noun", "quả táo", "Ein Apfel am Tag hält gesund.", "Một quả táo mỗi ngày giúp khỏe mạnh.", "essen"),
    ("die", "Milch", "noun", "sữa", "Die Milch steht im Kühlschrank.", "Sữa đang để trong tủ lạnh.", "essen"),
    ("", "trinken", "verb", "uống", "Was möchten Sie trinken?", "Bạn muốn uống gì nào?", "essen"),
    ("", "essen", "verb", "ăn", "Wir essen heute zusammen zu Mittag.", "Hôm nay chúng tôi ăn trưa cùng nhau.", "essen"),
    # einkaufen
    ("der", "Supermarkt", "noun", "siêu thị", "Der Supermarkt öffnet um acht Uhr.", "Siêu thị mở cửa lúc tám giờ.", "einkaufen"),
    ("das", "Geschäft", "noun", "cửa hàng", "Dieses Geschäft verkauft schöne Kleidung.", "Cửa hàng này bán quần áo đẹp.", "einkaufen"),
    ("der", "Preis", "noun", "giá cả", "Der Preis für dieses Hemd ist günstig.", "Giá của chiếc áo sơ mi này rất phải chăng.", "einkaufen"),
    ("", "kaufen", "verb", "mua", "Ich möchte ein neues Wörterbuch kaufen.", "Tôi muốn mua một cuốn từ điển mới.", "einkaufen"),
    ("", "kosten", "verb", "có giá là", "Wie viel kostet dieses Buch?", "Cuốn sách này giá bao nhiêu?", "einkaufen"),
    ("", "billig", "adj", "rẻ", "Auf dem Flohmarkt sind die Sachen billig.", "Đồ ở chợ trời khá rẻ.", "einkaufen"),
    ("", "teuer", "adj", "đắt đỏ", "Die Wohnung im Zentrum ist zu teuer.", "Căn hộ ở trung tâm đắt quá.", "einkaufen"),
    # gesundheit
    ("der", "Kopf", "noun", "cái đầu", "Mein Kopf tut heute weh.", "Hôm nay đầu tôi bị đau.", "gesundheit"),
    ("das", "Auge", "noun", "con mắt", "Meine Augen sind müde von der Bildschirmarbeit.", "Mắt tôi mỏi vì làm việc với màn hình.", "gesundheit"),
    ("die", "Hand", "noun", "bàn tay", "Bitte waschen Sie sich die Hände.", "Xin hãy rửa sạch tay của bạn.", "gesundheit"),
    ("das", "Krankenhaus", "noun", "bệnh viện", "Er liegt seit drei Tagen im Krankenhaus.", "Anh ấy nằm viện được ba ngày rồi.", "gesundheit"),
    ("", "krank", "adj", "bị ốm, bị bệnh", "Heute bin ich leider krank.", "Hôm nay tôi tiếc là bị ốm.", "gesundheit"),
    ("", "gesund", "adj", "khỏe mạnh", "Ich wünsche Ihnen, dass Sie gesund bleiben.", "Chúc bạn luôn giữ được sức khỏe tốt.", "gesundheit"),
    # reisen
    ("die", "Reise", "noun", "chuyến đi, du lịch", "Gute Reise nach Deutschland!", "Chúc chuyến đi đến Đức thuận buồm xuôi gió!", "reisen"),
    ("der", "Urlaub", "noun", "kỳ nghỉ phép", "Im August haben wir zwei Wochen Urlaub.", "Vào tháng Tám chúng tôi có hai tuần nghỉ phép.", "reisen"),
    ("das", "Hotel", "noun", "khách sạn", "Das Hotel liegt direkt am Meer.", "Khách sạn nằm ngay cạnh biển.", "reisen"),
    ("das", "Ticket", "noun", "vé (xe, tàu, máy bay)", "Ich habe mein Ticket online gebucht.", "Tôi đã đặt vé của mình trực tuyến.", "reisen"),
    ("", "reisen", "verb", "đi du lịch", "Ich reise sehr gern in neue Länder.", "Tôi rất thích đi du lịch đến các đất nước mới.", "reisen"),
    # verkehr
    ("der", "Zug", "noun", "tàu hỏa", "Der Zug nach München fährt um neun Uhr ab.", "Tàu hỏa đi Munich khởi hành lúc chín giờ.", "verkehr"),
    ("der", "Bus", "noun", "xe buýt", "Ich fahre jeden Tag mit dem Bus.", "Tôi đi làm bằng xe buýt mỗi ngày.", "verkehr"),
    ("das", "Auto", "noun", "xe hơi, ô tô", "Er fährt ein deutsches Auto.", "Anh ấy lái một chiếc xe hơi Đức.", "verkehr"),
    ("das", "Fahrrad", "noun", "xe đạp", "In Deutschland fahren viele Leute Fahrrad.", "Ở Đức rất nhiều người đi xe đạp.", "verkehr"),
    ("der", "Bahnhof", "noun", "nhà ga xe lửa", "Wir treffen uns vor dem Hauptbahnhof.", "Chúng ta gặp nhau trước nhà ga trung tâm.", "verkehr"),
    ("", "fahren", "verb", "lái xe, đi bằng xe", "Fährst du morgen mit dem Zug?", "Ngày mai bạn có đi bằng tàu không?", "verkehr"),
    # bildung
    ("die", "Schule", "noun", "trường học", "Die Kinder gehen um acht Uhr in die Schule.", "Lũ trẻ đến trường lúc tám giờ.", "bildung"),
    ("das", "Buch", "noun", "cuốn sách", "Ich lese jeden Tag ein deutsches Buch.", "Tôi đọc một cuốn sách tiếng Đức mỗi ngày.", "bildung"),
    ("die", "Sprache", "noun", "ngôn ngữ", "Deutsch ist eine interessante Sprache.", "Tiếng Đức là một ngôn ngữ thú vị.", "bildung"),
    ("das", "Wort", "noun", "từ ngữ", "Wie heißt dieses Wort auf Deutsch?", "Từ này trong tiếng Đức gọi là gì?", "bildung"),
    ("", "lernen", "verb", "học tập", "Wir lernen Deutsch für die B1-Prüfung.", "Chúng tôi học tiếng Đức cho kỳ thi B1.", "bildung"),
    ("", "sprechen", "verb", "nói chuyện", "Sprechen Sie bitte etwas langsamer!", "Xin hãy nói chậm lại một chút!", "bildung"),
    ("", "verstehen", "verb", "hiểu được", "Ich verstehe diesen Satz nicht ganz.", "Tôi không hiểu trọn vẹn câu này.", "bildung"),
    # behoerden
    ("der", "Pass", "noun", "hộ chiếu", "Zeigen Sie mir bitte Ihren Pass!", "Xin vui lòng cho tôi xem hộ chiếu của bạn!", "behoerden"),
    ("das", "Formular", "noun", "mẫu đơn, tờ khai", "Bitte füllen Sie dieses Formular aus.", "Vui lòng điền vào tờ khai này.", "behoerden"),
    ("der", "Name", "noun", "tên gọi", "Mein Name ist Nguyen Van Dat.", "Tên tôi là Nguyễn Văn Đạt.", "behoerden"),
    ("die", "Adresse", "noun", "địa chỉ", "Bitte schreiben Sie Ihre Adresse hier auf.", "Vui lòng ghi địa chỉ của bạn vào đây.", "behoerden"),
    # geld
    ("das", "Geld", "noun", "tiền bạc", "Ich habe leider kein Bargeld dabei.", "Tôi tiếc là không mang theo tiền mặt.", "geld"),
    ("der", "Euro", "noun", "đồng Euro", "Das kostet fünf Euro und zwanzig Cent.", "Cái đó giá năm Euro và hai mươi Cent.", "geld"),
    ("die", "Bank", "noun", "ngân hàng", "Die Bank hat bis 16 Uhr geöffnet.", "Ngân hàng mở cửa đến 16 giờ.", "geld"),
    ("", "bezahlen", "verb", "thanh toán", "Kann ich hier mit Karte bezahlen?", "Tôi có thể thanh toán bằng thẻ ở đây không?", "geld"),
    # umwelt
    ("das", "Wetter", "noun", "thời tiết", "Das Wetter ist heute sonnig und warm.", "Thời tiết hôm nay nắng ráo và ấm áp.", "umwelt"),
    ("die", "Sonne", "noun", "mặt trời", "Die Sonne scheint den ganzen Tag.", "Mặt trời chiếu sáng suốt cả ngày.", "umwelt"),
    ("der", "Regen", "noun", "cơn mưa", "Bei Regen nehme ich den Regenschirm mit.", "Trời mưa thì tôi mang theo ô dù.", "umwelt"),
    # freizeit
    ("das", "Hobby", "noun", "sở thích", "Mein Hobby ist Gitarre spielen.", "Sở thích của tôi là chơi đàn ghi-ta.", "freizeit"),
    ("der", "Sport", "noun", "thể thao", "Ich treibe zweimal pro Woche Sport.", "Tôi tập thể thao hai lần mỗi tuần.", "freizeit"),
    ("die", "Musik", "noun", "âm nhạc", "Ich höre gern klassische Musik.", "Tôi thích nghe nhạc cổ điển.", "freizeit"),
    ("", "spielen", "verb", "chơi (thể thao, nhạc cụ)", "Am Wochenende spielen wir Fußball.", "Cuối tuần chúng tôi chơi bóng đá.", "freizeit"),
    # medien
    ("das", "Handy", "noun", "điện thoại di động", "Mein Handy klingelt gerade.", "Điện thoại của tôi đang đổ chuông.", "medien"),
    ("der", "Computer", "noun", "máy vi tính", "Ich arbeite acht Stunden am Computer.", "Tôi làm việc tám tiếng trên máy vi tính.", "medien"),
    ("die", "E-Mail", "noun", "thư điện tử", "Ich schreibe dir heute noch eine E-Mail.", "Tôi sẽ gửi email cho bạn trong hôm nay.", "medien"),
    # meinung
    ("", "gut", "adj", "tốt, hay", "Das ist eine sehr gute Idee!", "Đó là một ý tưởng rất hay!", "meinung"),
    ("", "schlecht", "adj", "tồi tệ, xấu", "Das Wetter heute ist leider schlecht.", "Thời tiết hôm nay tiếc là xấu.", "meinung"),
    ("", "richtig", "adj", "đúng đắn", "Ihre Antwort ist absolut richtig.", "Câu trả lời của bạn hoàn toàn chính xác.", "meinung"),
    ("", "falsch", "adj", "sai lầm", "Das ist leider die falsche Nummer.", "Tiếc là bạn bấm nhầm số rồi.", "meinung"),
    # gefuehle
    ("", "glücklich", "adj", "hạnh phúc", "Ich bin sehr glücklich über die Nachricht.", "Tôi rất hạnh phúc khi nhận được tin này.", "gefuehle"),
    ("", "traurig", "adj", "buồn bã", "Warum bist du heute so traurig?", "Tại sao hôm nay bạn lại buồn thế?", "gefuehle"),
    ("", "müde", "adj", "mệt mỏi", "Nach der Arbeit bin ich ziemlich müde.", "Sau giờ làm tôi khá mệt mỏi.", "gefuehle"),
    # technik
    ("die", "Maschine", "noun", "máy móc", "Die Kaffeemaschine ist kaputt.", "Máy pha cà phê bị hỏng rồi.", "technik"),
    ("das", "Licht", "noun", "ánh sáng, đèn", "Schalten Sie bitte das Licht an!", "Làm ơn hãy bật đèn lên!", "technik"),
    # arbeitssuche
    ("die", "Stelle", "noun", "vị trí làm việc", "Er sucht eine neue Stelle als Koch.", "Anh ấy đang tìm một vị trí làm đầu bếp mới.", "arbeitssuche"),
    ("der", "Lebenslauf", "noun", "sơ yếu lý lịch (CV)", "Bitte senden Sie Ihren Lebenslauf per Mail.", "Vui lòng gửi CV của bạn qua email.", "arbeitssuche"),
    # interkulturell
    ("das", "Land", "noun", "đất nước, quốc gia", "Deutschland ist ein schönes Land.", "Nước Đức là một đất nước tươi đẹp.", "interkulturell"),
    ("die", "Stadt", "noun", "thành phố", "Berlin ist die Hauptstadt von Deutschland.", "Berlin là thủ đô của nước Đức.", "interkulturell"),
    ("die", "Leute", "noun", "mọi người, người dân", "Die Leute hier sind sehr hilfsbereit.", "Người dân ở đây rất nhiệt tình giúp đỡ.", "interkulturell"),
    ("", "willkommen", "adj", "hoan nghênh, chào đón", "Herzlich willkommen in Deutschland!", "Nhiệt liệt chào mừng bạn đến với nước Đức!", "interkulturell"),
    # additional to reach 122
    ("die", "Frage", "noun", "câu hỏi", "Darf ich Ihnen eine Frage stellen?", "Tôi có thể hỏi bạn một câu được không?", "bildung"),
    ("die", "Antwort", "noun", "câu trả lời", "Das ist die richtige Antwort.", "Đó là câu trả lời chính xác.", "bildung"),
    ("der", "Schüler", "noun", "học sinh", "Die Schüler machen ihre Hausaufgaben.", "Học sinh đang làm bài tập về nhà.", "bildung"),
    ("das", "Beispiel", "noun", "ví dụ", "Können Sie mir ein Beispiel geben?", "Bạn có thể cho tôi một ví dụ được không?", "bildung"),
    ("das", "Problem", "noun", "vấn đề", "Kein Problem, das schaffe ich schon!", "Không vấn đề gì, tôi sẽ làm được thôi!", "alltag"),
    ("die", "Hilfe", "noun", "sự giúp đỡ", "Vielen Dank für Ihre Hilfe!", "Cảm ơn bạn rất nhiều vì sự giúp đỡ!", "alltag"),
    ("der", "Schlüssel", "noun", "chìa khóa", "Wo ist mein Wohnungsschlüssel?", "Chìa khóa căn hộ của tôi ở đâu rồi?", "wohnen"),
    ("die", "Tür", "noun", "cánh cửa", "Bitte schließen Sie die Tür leise.", "Xin vui lòng đóng cửa nhẹ nhàng.", "wohnen"),
    ("das", "Fenster", "noun", "cửa sổ", "Öffnen Sie bitte das Fenster!", "Làm ơn hãy mở cửa sổ ra!", "wohnen"),
    ("der", "Kuchen", "noun", "bánh ngọt", "Möchten Sie ein Stück Kuchen?", "Bạn có muốn một miếng bánh ngọt không?", "essen"),
    ("das", "Ei", "noun", "quả trứng", "Zum Frühstück esse ich zwei Eier.", "Bữa sáng tôi ăn hai quả trứng.", "essen"),
    ("die", "Suppe", "noun", "món súp, canh", "Die heiße Suppe schmeckt köstlich.", "Bát súp nóng hổi ăn rất ngon.", "essen"),
    ("der", "Zucker", "noun", "đường", "Trinken Sie den Kaffee mit Zucker?", "Bạn có uống cà phê với đường không?", "essen"),
    ("das", "Salz", "noun", "muối", "Geben Sie mir bitte das Salz!", "Làm ơn đưa giúp tôi lọ muối!", "essen"),
    ("die", "Tasche", "noun", "cái túi, cặp xách", "Meine Tasche ist ziemlich schwer.", "Chiếc túi của tôi khá nặng.", "einkaufen"),
    ("die", "Rechnung", "noun", "hóa đơn", "Die Rechnung bitte, Herr Ober!", "Làm ơn tính tiền, bạn phục vụ ơi!", "geld"),
    ("der", "Katalog", "noun", "danh mục sản phẩm", "Ich schaue mir den Katalog an.", "Tôi đang xem qua danh mục sản phẩm.", "einkaufen")
]

# Ensure exactly 122 A1
assert len(a1_raw) == 122, f"A1 count is {len(a1_raw)}"

# Transform to standard object
def to_items(raw_list, level):
    items = []
    for art, de, wtype, vi, ex, ex_vi, topic in raw_list:
        items.append({
            "german": de,
            "article": art,
            "word_type": wtype,
            "vietnamese": vi,
            "example_de": ex,
            "example_vi": ex_vi,
            "topic": topic,
            "level": level
        })
    return items

a1_items = to_items(a1_raw, "A1")

print(f"Generated A1: {len(a1_items)} words")

# Save vocabulary-a1.js
with open(os.path.join(OUT_DIR, "vocabulary-a1.js"), "w", encoding="utf-8") as f:
    f.write(f"export const VOCABULARY_A1 = {json.dumps(a1_items, ensure_ascii=False, indent=2)};\n")

print("vocabulary-a1.js written successfully.")
