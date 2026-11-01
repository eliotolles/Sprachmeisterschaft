# -*- coding: utf-8 -*-
import json
import os

OUT_DIR = r"C:\Users\datnv\.gemini\antigravity\scratch\sprachmeisterschaft\src\data"

# ==========================================
# 4. EXAMS GENERATION (9 EXAMS)
# ==========================================
# 1. Goethe-Zertifikat B1 Modelltest 1
# 2. Goethe-Zertifikat B1 Modelltest 2
# 3. Goethe-Zertifikat B1 Modelltest 3
# 4. telc Deutsch B1
# 5. ÖSD Zertifikat B1
# 6. Goethe-Zertifikat A1: Start Deutsch 1
# 7. Goethe-Zertifikat A2
# 8. Deutsch-Test für Zuwanderer (DTZ) B1
# 9. Goethe-Zertifikat B2 / C1 / C2

exams_core = [
    {
        "id": "goethe_b1_m1",
        "title": "Goethe-Zertifikat B1 — Modelltest 1",
        "provider": "Goethe",
        "level": "B1",
        "minutes": 65,
        "intro": "Đề thi mô phỏng chính thức chuẩn viện Goethe cho trình độ B1. Bao gồm 4 phần: Đọc hiểu, Nghe hiểu, Viết luận và Nói.",
        "description": "Kiểm tra toàn diện năng lực tiếng Đức độc lập: hiểu thông điệp chính trong công việc, học tập, du lịch DACH.",
        "reading": [
            {
                "title": "Teil 1: Blogbeitrag zum Thema 'Freiwilligenarbeit im Ausland'",
                "text": "Viele junge Menschen in Deutschland entscheiden sich nach dem Abitur für einen Freiwilligendienst im Ausland. Anna (19) verbrachte ein ganzes Jahr in einem Waisenhaus in Vietnam. 'Am Anfang war die Umstellung nicht leicht', berichtet sie. 'Das tropische Klima, das fremde Essen und vor allem die Sprachbarriere machten mir zu schaffen. Doch durch die herzliche Aufnahme der Gastfamilie fühlte ich mich schon nach wenigen Wochen wie zu Hause.' Für Anna war diese Erfahrung eine Bereicherung fürs Leben. Sie lernte Selbstständigkeit, Problemlösungskompetenz und Toleranz. Zurück in Deutschland studiert sie nun Asienwissenschaften.",
                "questions": [
                    {
                        "q": "Warum ging Anna nach Vietnam?",
                        "options": ["Um ein Jahr lang Urlaub zu machen", "Um einen Freiwilligendienst in einem Waisenhaus zu leisten", "Um an einer Universität Asienwissenschaften zu studieren", "Um eine Gastfamilie zu adoptieren"],
                        "answer": "Um einen Freiwilligendienst in einem Waisenhaus zu leisten"
                    },
                    {
                        "q": "Was war für Anna am Anfang besonders herausfordernd?",
                        "options": ["Sie fand kein Hotel in der Stadt", "Das tropische Klima, das Essen und die Sprachbarriere", "Die Menschen waren unhöflich zu ihr", "Sie musste jeden Tag 12 Stunden studieren"],
                        "answer": "Das tropische Klima, das Essen và die Sprachbarriere"
                    },
                    {
                        "q": "Welche persönliche Eigenschaft hat Anna vor allem gestärkt?",
                        "options": ["Kochkünste im Restaurant", "Selbstständigkeit và Toleranz", "Fahrradfahren im Verkehr", "Schwimmfähigkeiten im Meer"],
                        "answer": "Selbstständigkeit und Toleranz"
                    }
                ]
            },
            {
                "title": "Teil 2: Artikel aus einer Fachzeitschrift 'Homeoffice — Fluch oder Segen?'",
                "text": "Seit der Pandemie hat das Arbeiten von zu Hause aus in vielen deutschen Betrieben Einzug gehalten. Laut einer aktuellen Umfrage schätzen 72 Prozent der Angestellten die gewonnene zeitliche Flexibilität und den Wegfall des täglichen Arbeitswegs. Allerdings warnen Psychologen vor einer Verwischung der Grenzen zwischen Arbeits- und Freizeit. Viele Mitarbeiter neigen dazu, auch am späten Abend noch geschäftliche E-Mails zu beantworten. Experten raten daher zu festen Arbeitszeiten und einem räumlich abgetrennten Arbeitsbereich in der Wohnung.",
                "questions": [
                    {
                        "q": "Was schätzen die meisten Angestellten am Homeoffice am meisten?",
                        "options": ["Dass sie nie wieder arbeiten müssen", "Die zeitliche Flexibilität và das Wegfallen des Arbeitswegs", "Kostenlose Mahlzeiten von der Firma", "Bessere Computerhardware zu Hause"],
                        "answer": "Die zeitliche Flexibilität und das Wegfallen des Arbeitswegs"
                    },
                    {
                        "q": "Wovor warnen Psychologen beim Arbeiten von zu Hause?",
                        "options": ["Vor zu viel Schlaf am Morgen", "Vor der Verwischung der Grenzen zwischen Arbeit và Freizeit", "Vor teuren Stromkosten im Winter", "Vor schlechtem Internet im Büro"],
                        "answer": "Vor der Verwischung der Grenzen zwischen Arbeit und Freizeit"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Achtung an Gleis 7! Der Intercity-Express 584 nach Hamburg-Altona über Hannover, planmäßige Abfahrt 14:15 Uhr, fährt heute abweichend von Gleis 9 ein. Wir bitten alle Fahrgäste nach Hannover und Hamburg, sich zu Gleis 9 zu begeben. Der Zug hat voraussichtlich zehn Minuten Verspätung.",
                "question": "Von welchem Gleis fährt der Zug nach Hamburg heute ab?",
                "options": ["Von Gleis 7", "Von Gleis 9", "Von Gleis 14", "Der Zug fällt heute aus"],
                "answer": "Von Gleis 9"
            },
            {
                "script": "Guten Tag, hier ist die Praxis Dr. Weber. Frau Schmidt, wir rufen an wegen Ihres Termins zur Blutuntersuchung morgen um 9 Uhr. Herr Dr. Weber ist leider kurzfristig erkrankt. Könnten Sie stattdessen am Donnerstag um 11 Uhr kommen? Bitte rufen Sie uns bis heute 18 Uhr zurück.",
                "question": "Warum ruft die Arztpraxis an?",
                "options": ["Um die Ergebnisse der Blutuntersuchung mitzuteilen", "Weil der Termin verschoben werden muss, da der Arzt krank ist", "Um ein neues Medikament zu verkaufen", "Weil Frau Schmidt den Termin vergessen hat"],
                "answer": "Weil der Termin verschoben werden muss, da der Arzt krank ist"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine E-Mail (ca. 80 Wörter) an Ihren Vermieter, Herrn Meyer. Seit zwei Tagen funktioniert die Heizung in Ihrer Wohnung nicht mehr và es ist sehr kalt. Bitten Sie um dringende Reparatur und vereinbaren Sie einen Termin.",
            "hints": ["Höfliche Anrede und Grund des Schreibens", "Beschreibung des Problems (Kälte, Ausfall der Heizung)", "Dringende Bitte um Reparatur und Terminvorschlag"]
        },
        "speaking": [
            {"part": "Teil 1: Gemeinsam etwas planen", "prompt": "Sie und Ihr Partner möchten am kommenden Wochenende eine Überraschungsparty für einen gemeinsamen Freund organisieren. Planen Sie: Wann? Wo? Was zu essen/trinken? Wer besorgt das Geschenk?", "tips": ["Vorschläge machen", "Zustimmen oder ablehnen mit Begründung"]},
            {"part": "Teil 2: Ein Thema präsentieren", "prompt": "Präsentieren Sie das Thema: 'Brauchen Kinder schon in der Grundschule ein Smartphone?'. Berichten Sie über Ihre Erfahrungen, die Situation in Ihrem Heimatland, Vor- und Nachteile.", "tips": ["Klare Struktur: Einleitung, Erfahrung, Vor/Nachteile, Fazit"]},
            {"part": "Teil 3: Auf Fragen reagieren", "prompt": "Beantworten Sie Fragen des Prüfers zu Ihrer Präsentation und stellen Sie dem Partner eine Frage.", "tips": ["Spontan und begründet auf Fragen antworten"]}
        ]
    },
    {
        "id": "goethe_b1_m2",
        "title": "Goethe-Zertifikat B1 — Modelltest 2",
        "provider": "Goethe",
        "level": "B1",
        "minutes": 65,
        "intro": "Mô phỏng đề thi Goethe B1 số 2. Chủ đề: Bảo vệ môi trường, dinh dưỡng lành mạnh và giao thông công cộng.",
        "description": "Luyện tập kỹ năng phân tích biểu đồ, email phản hồi lịch sự và lập luận tranh biện trong hội thoại.",
        "reading": [
            {
                "title": "Teil 1: 'Weniger Fleisch, mehr Zukunft' — Ein Trend in deutschen Städten",
                "text": "Immer mehr Menschen in Deutschland ernähren sich vegetarisch oder vegan. In Supermärkten wächst das Angebot an pflanzlichen Alternativen rasant. Neben ethischen Gründen zum Tierwohl spielt vor allem der Umweltschutz eine zentrale Rolle. Die Produktion von einem Kilogramm Rindfleisch verbraucht über 15.000 Liter Wasser và verursacht erhebliche Mengen an Treibhausgasen. Immer mehr Kantinen führen daher 'Veggie-Days' ein.",
                "questions": [
                    {
                        "q": "Was ist laut Text ein Hauptgrund für den zunehmenden Fleischverzicht?",
                        "options": ["Fleisch ist in Deutschland gesetzlich verboten", "Der Schutz von Umwelt và Tieren", "Gemüse ist billiger als Brot", "Ärzte verbieten Fleisch generell"],
                        "answer": "Der Schutz von Umwelt und Tieren"
                    },
                    {
                        "q": "Was führen viele Betriebskantinen ein?",
                        "options": ["Einen freien Tag für alle Mitarbeiter", "Tage mit rein vegetarischem Angebot ('Veggie-Days')", "Kostenloses Rindfleisch für jeden", "Pflichtkurse im Kochen"],
                        "answer": "Tage mit rein vegetarischem Angebot ('Veggie-Days')"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Sehr geehrte Fahrgäste der U-Bahnlinie U2. Wegen Bauarbeiten an den Gleisen ist die Strecke zwischen Alexanderplatz und Potsdamer Platz für das gesamte Wochenende gesperrt. Bitte nutzen Sie die Buslinien M48 oder die S-Bahn als Ausweichmöglichkeit.",
                "question": "Was wird den Fahrgästen empfohlen?",
                "options": ["Zu Fuß zu gehen", "Die Buslinie M48 oder die S-Bahn zu nutzen", "Bis Montag am Bahnhof zu warten", "Ein Taxi auf Kosten der Bahn zu rufen"],
                "answer": "Die Buslinie M48 oder die S-Bahn zu nutzen"
            }
        ],
        "writing": {
            "task": "Sie haben vor einer Woche eine neue Waschmaschine online gekauft. Das Gerät kam beschädigt an und schleudert nicht. Schreiben Sie eine Beschwerde-E-Mail (ca. 80 Wörter) an den Kundendienst.",
            "hints": ["Bestellnummer und Kaufdatum nennen", "Mängel detailliert schildern", "Umtausch oder Rückerstattung fordern"]
        },
        "speaking": [
            {"part": "Teil 1: Sprachreise planen", "prompt": "Planen Sie mit Ihrem Partner eine einwöchige Sprachreise nach Heidelberg.", "tips": ["Unterkunft, Kurs, Budget besprechen"]},
            {"part": "Teil 2: Präsentation", "prompt": "Thema: 'Sollte der öffentliche Nahverkehr für alle kostenlos sein?'", "tips": ["Pro- und Kontra-Argumente abwägen"]},
            {"part": "Teil 3: Diskussion", "prompt": "Diskutieren Sie mit dem Prüfer über Vor- und Nachteile von kostenlosem Nahverkehr.", "tips": ["Eigene Meinung verteidigen"]}
        ]
    },
    {
        "id": "goethe_b1_m3",
        "title": "Goethe-Zertifikat B1 — Modelltest 3",
        "provider": "Goethe",
        "level": "B1",
        "minutes": 65,
        "intro": "Đề thi mô phỏng Goethe B1 số 3: Tác động của công nghệ và trí tuệ nhân tạo đối với việc học ngoại ngữ.",
        "description": "Đo lường năng lực diễn đạt ý kiến chuyên sâu, hiểu các thông báo phức tạp và viết thư xin lỗi chuyên nghiệp.",
        "reading": [
            {
                "title": "Teil 1: 'Künstliche Intelligenz im Sprachunterricht'",
                "text": "Moderne Sprach-Apps und KI-Tutoren revolutionieren das Lernen. Schüler können rund um die Uhr ihre Aussprache trainieren und individuelle Korrekturen erhalten. Trotzdem betonen Pädagogen, dass die künstliche Intelligenz den menschlichen Lehrer nicht vollständig ersetzen kann. Der emotionale Austausch, das gemeinsame Lachen in der Gruppe und das spontane Reagieren auf Mimik bleiben unersetzbar menschlich.",
                "questions": [
                    {
                        "q": "Was ist der größte Vorteil von KI beim Sprachenlernen?",
                        "options": ["Dass man keine Prüfungen mehr machen muss", "Dass man rund um die Uhr individuell üben và Korrekturen erhalten kann", "Dass man keine Bücher mehr kaufen muss", "Dass man in zwei Tagen fließend Deutsch spricht"],
                        "answer": "Dass man rund um die Uhr individuell üben und Korrekturen erhalten kann"
                    },
                    {
                        "q": "Was kann laut Pädagogen die KI nicht ersetzen?",
                        "options": ["Grammatiktabellen im Buch", "Den menschlichen emotionalen Austausch und das gemeinsame Lernen", "Den Computerbildschirm", "Das Wörterbuch im Internet"],
                        "answer": "Den menschlichen emotionalen Austausch und das gemeinsame Lernen"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Hier ist der Anrufbeantworter von Stefan. Hallo Thomas! Du, ich muss mich entschuldigen. Ich habe mir beim Fußballspielen den Knöchel verstaucht und kann heute Abend leider nicht zu deinem Geburtstagsessen kommen. Lass uns das nächste Woche nachholen, wenn ich wieder laufen kann. Feiert schön!",
                "question": "Warum kann Stefan nicht zur Feier kommen?",
                "options": ["Er hat keine Lust", "Er hat sich beim Sport verletzt", "Er muss lange im Büro arbeiten", "Er hat den Geburtstag vergessen"],
                "answer": "Er hat sich beim Sport verletzt"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine E-Mail an Ihre Kursleiterin Frau Bergmann. Sie konnten gestern wegen eines dringenden Arztbesuchs nicht am Unterricht teilnehmen. Bitten Sie um Entschuldigung und fragen Sie nach den Hausaufgaben.",
            "hints": ["Höfliche Entschuldigung für die Abwesenheit", "Grund des Fehlens (Arztbesuch)", "Bitte um Zusendung der Hausaufgaben"]
        },
        "speaking": [
            {"part": "Teil 1: Deutsch-Klub gründen", "prompt": "Überlegen Sie gemeinsam, wie Sie einen wöchentlichen Deutsch-Stammtisch organisieren können.", "tips": ["Treffpunkt, Themen, Werbung planen"]},
            {"part": "Teil 2: Präsentation", "prompt": "Thema: 'Einkaufen im Internet oder im Geschäft vor Ort?'", "tips": ["Eigene Konsumgewohnheiten schildern"]},
            {"part": "Teil 3: Fragen", "prompt": "Beantworten Sie Rückfragen des Prüfungspartners.", "tips": ["Präzise und gelassen antworten"]}
        ]
    },
    {
        "id": "telc_b1",
        "title": "telc Deutsch B1 — Zertifikat Deutsch",
        "provider": "telc",
        "level": "B1",
        "minutes": 70,
        "intro": "Đề thi telc B1 chính thức theo cấu trúc bài thi của Hiệp hội Khảo thí Ngôn ngữ Châu Âu telc gGmbH.",
        "description": "Bám sát các chủ đề đời sống thực tế, giải quyết xung đột hàng xóm, viết thư trang trọng và đàm phán giải pháp.",
        "reading": [
            {
                "title": "Leseverstehen Teil 1: Hausordnung und Müllentsorgung",
                "text": "Liebe Mieterinnen und Mieter, aus gegebenem Anlass möchten wir Sie an die geltende Hausordnung erinnern. Abfälle dürfen ausschließlich in den dafür vorgesehenen Tonnen im Hof entsorgt werden. Biomüll gehört in die braune Tonne, Plastikverpackungen mit dem grünen Punkt in den gelben Sack. Das Abstellen von Sperrmüll im Treppenhaus ist aus Brandschutzgründen strengstens untersagt.",
                "questions": [
                    {
                        "q": "Wohin gehören Verpackungen aus Kunststoff?",
                        "options": ["In die braune Tonne", "In den gelben Sack", "Einfach ins Treppenhaus", "In die Papiertonne"],
                        "answer": "In den gelben Sack"
                    },
                    {
                        "q": "Warum darf im Treppenhaus kein Sperrmüll gelagert werden?",
                        "options": ["Aus Brandschutzgründen", "Weil die Vermieterin die Sachen verkaufen will", "Weil kein Platz für Fahrräder ist", "Aus Kostengründen"],
                        "answer": "Aus Brandschutzgründen"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Radio Berlin aktuell: Aufgrund eines schweren Unfalls auf der Stadtautobahn A100 zwischen Dreieck Funkturm und Kurfürstendamm staut sich der Verkehr auf über sieben Kilometern. Die Polizei leitet den Verkehr über die Ausfahrt Kaiserdamm um. Bitte fahren Sie vorsichtig.",
                "question": "Was meldet der Verkehrsfunk?",
                "options": ["Freie Fahrt auf allen Autobahnen", "Einen schweren Unfall und langen Stau auf der A100", "Schneefall im Stadtzentrum", "Die Eröffnung einer neuen Schnellstraße"],
                "answer": "Einen schweren Unfall und langen Stau auf der A100"
            }
        ],
        "writing": {
            "task": "Sie haben sich für ein Praktikum beworben, aber nach drei Wochen noch keine Antwort erhalten. Schreiben Sie eine förmliche Nachfrage (ca. 80 Wörter) an die Personalabteilung der Firma TechNord GmbH.",
            "hints": ["Höfliche Anrede (Sehr geehrte Damen und Herren)", "Bezugnahme auf die Bewerbung vom vorigen Monat", "Höfliche Bitte um Auskunft über den aktuellen Stand"]
        },
        "speaking": [
            {"part": "Teil 1: Kontaktaufnahme", "prompt": "Stellen Sie sich Ihrem Prüfungspartner vor und stellen Sie ihm Fragen zu seinem Werdegang.", "tips": ["Offene Fragen stellen"]},
            {"part": "Teil 2: Gespräch über ein Thema", "prompt": "Lesen Sie einen kurzen Zeitungstext zum Thema 'Haustiere in der Mietwohnung' und tauschen Sie Ihre Meinungen aus.", "tips": ["Argumente austauschen"]},
            {"part": "Teil 3: Gemeinsame Aufgabe", "prompt": "Planen Sie ein Sommerfest für die Nachbarschaft im Innenhof.", "tips": ["Aufgaben verteilen"]}
        ]
    },
    {
        "id": "oesd_b1",
        "title": "ÖSD Zertifikat B1 — Österreichisches Sprachdiplom",
        "provider": "ÖSD",
        "level": "B1",
        "minutes": 65,
        "intro": "Đề thi ÖSD B1 chuẩn hóa quốc tế của Cộng hòa Áo. Đề thi phản ánh phương ngữ chuẩn Áo-Đức-Thụy Sĩ (DACH).",
        "description": "Kiểm tra kỹ năng hiểu văn bản văn hóa Áo, cách dùng từ vựng vùng DACH (Paradeiser, Jause, Spital) và giao tiếp xã hội.",
        "reading": [
            {
                "title": "Teil 1: Wiener Kaffeehauskultur — Ein Erbe der UNESCO",
                "text": "Das Wiener Kaffeehaus ist weltberühmt für seine einzigartige Atmosphäre. Man bestellt eine 'Melange' oder einen 'Kleinen Schwarzen', liest stundenlang in bereitliegenden Tageszeitungen und beobachtet das Geschehen, ohne dass man nach der ersten Tasse gedrängt wird, das Lokal zu verlassen. Seit 2011 gehört die traditionelle Wiener Kaffeehauskultur sogar zum immateriellen Kulturerbe der UNESCO.",
                "questions": [
                    {
                        "q": "Was ist das Besondere am Wiener Kaffeehaus?",
                        "options": ["Dass es dort keinen Kaffee gibt", "Die entspannte Atmosphäre, wo man stundenlang Zeitung lesen kann", "Dass man nach zehn Minuten gehen muss", "Dass nur Politiker dort hineindürfen"],
                        "answer": "Die entspannte Atmosphäre, wo man stundenlang Zeitung lesen kann"
                    },
                    {
                        "q": "Was ist eine 'Melange' in Wien?",
                        "options": ["Ein traditionelles Kaffeegetränk mit geschäumter Milch", "Ein süßer Kuchen mit Schokolade", "Eine österreichische Tageszeitung", "Ein berühmter Tanz"],
                        "answer": "Ein traditionelles Kaffeegetränk mit geschäumter Milch"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Wien Hauptbahnhof: Der Railjet 65 nach Graz Hauptbahnhof über Wiener Neustadt und Bruck an der Mur steht bereit auf Bahnsteig 8. Abfahrt um 10:25 Uhr. Der Speisewagen befindet sich in der Zugmitte.",
                "question": "Wohin fährt der Railjet 65?",
                "options": ["Nach Berlin", "Nach Graz Hauptbahnhof", "Nach Salzburg", "Nach Zürich"],
                "answer": "Nach Graz Hauptbahnhof"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine E-Mail (ca. 80 Wörter) an ein Hotel in Salzburg. Sie möchten im nächsten Monat für 4 Tage mit Ihrer Familie (2 Erwachsene, 1 Kind) ein Zimmer buchen. Fragen Sie nach Verfügbarkeit, Preisen und Familienermäßigung.",
            "hints": ["Reisezeitraum und Personenanzahl angeben", "Frage nach Preisen inklusive Frühstück", "Frage nach Ermäßigung für das Kind"]
        },
        "speaking": [
            {"part": "Teil 1: Sich vorstellen", "prompt": "Stellen Sie sich vor und sprechen Sie über Ihre Zukunftspläne in Österreich.", "tips": ["Klar und flüssig sprechen"]},
            {"part": "Teil 2: Ein Bild beschreiben", "prompt": "Beschreiben Sie ein Foto, das eine Familie beim gemeinsamen Wandern in den Tiroler Bergen zeigt.", "tips": ["Vordergrund, Hintergrund, Stimmung schildern"]},
            {"part": "Teil 3: Gemeinsam planen", "prompt": "Organisieren Sie eine Exkursion zum Schloss Schönbrunn in Wien.", "tips": ["Ticketkauf und Route abstimmen"]}
        ]
    }
]

# Write exams.js
with open(os.path.join(OUT_DIR, "exams.js"), "w", encoding="utf-8") as f:
    f.write(f"export const EXAMS_CORE = {json.dumps(exams_core, ensure_ascii=False, indent=2)};\n")

# ==========================================
# 5. EXAMS LEVELS (A1, A2, DTZ B1, B2/C1/C2)
# ==========================================

exams_levels = [
    {
        "id": "goethe_a1",
        "title": "Goethe-Zertifikat A1 — Start Deutsch 1",
        "provider": "Goethe",
        "level": "A1",
        "minutes": 45,
        "intro": "Kỳ thi A1 tiêu chuẩn dành cho người mới bắt đầu hoặc người cần chứng chỉ đoàn tụ gia đình tại Đức.",
        "description": "Kiểm tra khả năng hiểu các biển báo, thông báo ngắn, điền mẫu đơn và viết tin nhắn đơn giản.",
        "reading": [
            {
                "title": "Teil 1: Schilder und kurze Mitteilungen",
                "text": "Sehr geehrte Kundinnen und Kunden, wegen Inventur schließt unser Supermarkt am Samstag bereits um 14:00 Uhr. Am Montag öffnen wir wieder wie gewohnt um 08:00 Uhr für Sie.",
                "questions": [
                    {
                        "q": "Wann schließt der Supermarkt am Samstag?",
                        "options": ["Um 12:00 Uhr", "Um 14:00 Uhr", "Um 18:00 Uhr", "Gar nicht"],
                        "answer": "Um 14:00 Uhr"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Frau Nguyen, bitte kommen Sie in das Behandlungszimmer 3. Der Arzt erwartet Sie.",
                "question": "In welches Zimmer soll Frau Nguyen gehen?",
                "options": ["Zimmer 1", "Zimmer 2", "Zimmer 3", "Zimmer 4"],
                "answer": "Zimmer 3"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine kurze SMS (ca. 30 Wörter) an Ihre Freundin Lisa. Sie können heute leider nicht zum Deutschlernen kommen, weil Sie bis 18 Uhr arbeiten müssen.",
            "hints": ["Entschuldigung", "Grund (Arbeit)", "Neuen Termin vorschlagen"]
        },
        "speaking": [
            {"part": "Teil 1: Sich vorstellen", "prompt": "Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby.", "tips": ["In ganzen Sätzen sprechen"]},
            {"part": "Teil 2: Um Informationen bitten", "prompt": "Stellen Sie eine Frage mit einer Wortkarte (Thema: Einkaufen, Wort: Brot).", "tips": ["Höfliche Frage formulieren"]}
        ]
    },
    {
        "id": "goethe_a2",
        "title": "Goethe-Zertifikat A2",
        "provider": "Goethe",
        "level": "A2",
        "minutes": 55,
        "intro": "Đề thi Goethe A2 chính thức: giao tiếp cơ bản trong công việc và các tình huống hàng ngày tại Đức.",
        "description": "Luyện tập nghe hiểu thông báo tàu xe, đọc email công việc và viết thư cảm ơn.",
        "reading": [
            {
                "title": "Teil 1: Einladung zur Abteilungsfeier",
                "text": "Liebe Kolleginnen und Kollegen, um das erfolgreiche Quartal zu feiern, lädt die Geschäftsführung alle Mitarbeiter am nächsten Freitag ab 17 Uhr zu einem Grillfest im Garten ein. Für Essen und Getränke ist gesorgt. Bitte gebt bis Mittwoch Bescheid, ob ihr vegetarisch esst.",
                "questions": [
                    {
                        "q": "Wann findet das Grillfest statt?",
                        "options": ["Am nächsten Freitag ab 17 Uhr", "Am Samstagmorgen", "Am Mittwoch", "In zwei Wochen"],
                        "answer": "Am nächsten Freitag ab 17 Uhr"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Hier ist das Fundbüro der Stadt Köln. Ihr gefundener Schlüsselbund wurde bei uns abgegeben. Sie können ihn von Montag bis Freitag zwischen 8 und 12 Uhr abholen.",
                "question": "Wann kann der Schlüssel abgeholt werden?",
                "options": ["Nur samstags", "Montag bis Freitag von 8 bis 12 Uhr", "Am Sonntagabend", "Jederzeit rund um die Uhr"],
                "answer": "Montag bis Freitag von 8 bis 12 Uhr"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine E-Mail (ca. 50 Wörter) an Ihren Kollegen Markus. Bedanken Sie sich für seine Unterstützung beim Projekt und laden Sie ihn zu einem Kaffee ein.",
            "hints": ["Dank aussprechen", "Einladung zum Kaffee", "Zeitpunkt vorschlagen"]
        },
        "speaking": [
            {"part": "Teil 1: Fragen zur Person", "prompt": "Beantworten Sie Fragen zu Ihrem Alltag und Ihren Hobbys.", "tips": ["Ausführlich antworten"]},
            {"part": "Teil 2: Aus dem Leben erzählen", "prompt": "Erzählen Sie von Ihrem letzten Urlaub.", "tips": ["Vergangenheit Perfekt verwenden"]}
        ]
    },
    {
        "id": "dtz_b1",
        "title": "Deutsch-Test für Zuwanderer (DTZ) A2–B1",
        "provider": "DTZ",
        "level": "B1",
        "minutes": 65,
        "intro": "Kỳ thi DTZ bắt buộc trong khóa học hội nhập (Integrationskurs) để xin định cư vĩnh viễn (Niederlassungserlaubnis) và nhập quốc tịch Đức.",
        "description": "Nội dung gắn liền 100% với đời sống người nhập cư: trường học của con, thư từ bảo hiểm, khám bệnh và thủ tục cư trú.",
        "reading": [
            {
                "title": "Teil 1: Elternbrief der Grundschule",
                "text": "Liebe Eltern, am kommenden Donnerstag, den 15. November, findet unser diesjähriger Elternsprechtag statt. Sie haben die Gelegenheit, mit den Klassenlehrerinnen und Fachlehrern über die schulische Entwicklung Ihres Kindes zu sprechen. Bitte tragen Sie sich bis Dienstag in die Terminlisten im Foyer ein.",
                "questions": [
                    {
                        "q": "Wozu dient der Elternsprechtag?",
                        "options": ["Um ein Schulfest zu feiern", "Um über die schulische Entwicklung des Kindes zu sprechen", "Um Geld für neue Bücher zu sammeln", "Um neue Schüler anzumelden"],
                        "answer": "Um über die schulische Entwicklung des Kindes zu sprechen"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Agentur für Arbeit Berlin: Guten Tag Herr Nguyen. Wir haben ein passendes Stellenangebot als Elektriker für Sie. Bitte kommen Sie morgen um 10 Uhr zu Ihrem Sachbearbeiter Herrn Hoffmann in Zimmer 204.",
                "question": "Warum ruft die Arbeitsagentur an?",
                "options": ["Weil Herr Nguyen einen Kurs bezahlen muss", "Weil ein passendes Stellenangebot vorliegt", "Weil die Agentur geschlossen ist", "Weil die Papiere fehlen"],
                "answer": "Weil ein passendes Stellenangebot vorliegt"
            }
        ],
        "writing": {
            "task": "Schreiben Sie eine Mitteilung (ca. 80 Wörter) an die Klassenlehrerin Ihres Sohnes. Ihr Sohn ist erkrankt và kann drei Tage nicht in die Schule kommen. Bitten Sie um die Hausaufgaben.",
            "hints": ["Entschuldigung für das Fehlen wegen Krankheit", "Voraussichtliche Dauer der Abwesenheit", "Bitte um Zusendung der Hausaufgaben"]
        },
        "speaking": [
            {"part": "Teil 1: Sich vorstellen", "prompt": "Stellen Sie sich vor: Herkunft, Familie, Beruf in Deutschland.", "tips": ["Flüssig und selbstsicher vorstellen"]},
            {"part": "Teil 2: Über Erfahrungen sprechen", "prompt": "Sprechen Sie über ein Foto zum Thema 'Berufsausbildung in Deutschland'.", "tips": ["Erfahrungen verknüpfen"]},
            {"part": "Teil 3: Ein Problem lösen", "prompt": "Sie möchten mit Ihrem Nachbarn einen Gemeinschaftsgarten anlegen. Planen Sie die Schritte.", "tips": ["Kompromisse schließen"]}
        ]
    },
    {
        "id": "goethe_b2_c2",
        "title": "Goethe-Zertifikat B2 / C1 / C2 — Höhere Sprachstufen",
        "provider": "Goethe",
        "level": "B2",
        "minutes": 80,
        "intro": "Đề thi mô phỏng cấp độ nâng cao (B2/C1/C2) dành cho ứng viên đại học, bác sĩ, kỹ sư làm việc chuyên môn tại Đức.",
        "description": "Phân tích văn bản học thuật chuyên sâu, lập luận hùng biện đa chiều và đánh giá phê bình.",
        "reading": [
            {
                "title": "Wissenschaftlicher Fachaufsatz: 'Automatisierung und die Zukunft der Arbeit'",
                "text": "Die fortschreitende Digitalisierung verändert die Struktur moderner Volkswirtschaften tiefgreifend. Während repetitive Tätigkeiten zunehmend von Algorithmen übernommen werden, gewinnen soziale Intelligenz, Urteilsvermögen und interdisziplinäre Problemlösungskompetenz dramatisch an Wert. Ökonomen betonen, dass Bildungssysteme reformiert werden müssen, um lebenslanges Lernen als Kernqualifikation zu verankern.",
                "questions": [
                    {
                        "q": "Welche Kompetenzen gewinnen laut Aufsatz künftig an Wert?",
                        "options": ["Rein repetitive manuelle Tätigkeiten", "Soziale Intelligenz, Urteilsvermögen và Problemlösungskompetenz", "Auswendiglernen alter Formeln", "Verzicht auf Technologie"],
                        "answer": "Soziale Intelligenz, Urteilsvermögen und Problemlösungskompetenz"
                    }
                ]
            }
        ],
        "listening": [
            {
                "script": "Deutschlandfunk Kultur: In unserem heutigen Wissenschaftsmagazin diskutieren wir mit Prof. Dr. Becker über die ethischen Implikationen generativer KI in der Hochschullehre und die Notwendigkeit transparenter Bewertungsmaßstäbe.",
                "question": "Was ist das Hauptthema des Radiobeitrags?",
                "options": ["Neuerungen bei Sportübertragungen", "Ethische Fragen beim Einsatz von KI in der Hochschullehre", "Die Erhöhung von Studiengebühren", "Der Bau eines neuen Radiosenders"],
                "answer": "Ethische Fragen beim Einsatz von KI in der Hochschullehre"
            }
        ],
        "writing": {
            "task": "Verfassen Sie einen argumentativen Kommentar (ca. 150 Wörter) zur Fragestellung: 'Sollte die Vier-Tage-Woche bei vollem Lohnausgleich gesetzlich eingeführt werden?'",
            "hints": ["Einleitung mit aktuellem Bezug", "Argumentation Pro (Produktivität, Gesundheit) vs. Kontra (Fachkräftemangel)", "Eigenes differenziertes Fazit"]
        },
        "speaking": [
            {"part": "Teil 1: Vortrag halten", "prompt": "Halten Sie einen strukturierten Kurzvortrag über 'Herausforderungen der Energiewende'.", "tips": ["Akademischen Wortschatz nutzen"]},
            {"part": "Teil 2: Fachdiskussion", "prompt": "Führen Sie eine kontroverse Diskussion über wirtschaftliche Folgen mit dem Prüfer.", "tips": ["Differenziert argumentieren"]}
        ]
    }
]

# Write exams-levels.js
with open(os.path.join(OUT_DIR, "exams-levels.js"), "w", encoding="utf-8") as f:
    f.write(f"export const EXAMS_LEVELS = {json.dumps(exams_levels, ensure_ascii=False, indent=2)};\n")

# Combine in exams.js aggregator
with open(os.path.join(OUT_DIR, "all-exams.js"), "w", encoding="utf-8") as f:
    f.write("""import { EXAMS_CORE } from './exams';
import { EXAMS_LEVELS } from './exams-levels';

export const ALL_EXAMS = [...EXAMS_CORE, ...EXAMS_LEVELS];

export function getExamById(id) {
  return ALL_EXAMS.find((e) => e.id === id) || ALL_EXAMS[0];
}

export function examsByLevel(levelId) {
  return ALL_EXAMS.filter((e) => e.level === levelId);
}

export function examsByProvider(provider) {
  return ALL_EXAMS.filter((e) => e.provider.toLowerCase() === provider.toLowerCase());
}
""")

print("Exams data generated successfully! 5 core + 4 level exams = 9 exams total!")

# ==========================================
# 6. SKILLS GENERATION (7 SKILLS + GAME)
# ==========================================

skills_data = [
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
]

# Extra practice pools for skills
skills_pools = {
    "dictation": [
        {"de": "Guten Tag, wie kann ich Ihnen heute helfen?", "vi": "Xin chào, hôm nay tôi có thể giúp gì cho bạn?", "level": "A1"},
        {"de": "Ich möchte mich für den B1-Deutschkurs anmelden.", "vi": "Tôi muốn đăng ký khóa học tiếng Đức B1.", "level": "A2"},
        {"de": "Der Zug nach Frankfurt hat heute leider fünfzehn Minuten Verspätung.", "vi": "Tàu đi Frankfurt hôm nay tiếc là bị trễ mười lăm phút.", "level": "B1"},
        {"de": "Pünktlichkeit und Zuverlässigkeit spielen im deutschen Berufsleben eine zentrale Rolle.", "vi": "Sự đúng giờ và đáng tin cậy đóng vai trò chủ chốt trong công việc tại Đức.", "level": "B1"},
        {"de": "Nachhaltige Entwicklungen erfordern ein Umdenken in unserer gesamten Gesellschaft.", "vi": "Sự phát triển bền vững đòi hỏi một sự thay đổi tư duy trong toàn xã hội chúng ta.", "level": "B2"}
    ],
    "shadowing": [
        {"de": "Es freut mich sehr, Sie persönlich kennenzulernen.", "vi": "Tôi rất vui mừng được làm quen trực tiếp với bạn.", "level": "A1"},
        {"de": "Könnten Sie mir bitte sagen, wo der nächste Bahnhof liegt?", "vi": "Bạn có thể vui lòng chỉ giúp tôi nhà ga gần nhất nằm ở đâu không?", "level": "A2"},
        {"de": "Meiner Meinung nach ist die Vereinbarkeit von Familie und Beruf besonders wichtig.", "vi": "Theo ý kiến của tôi, sự cân bằng giữa gia đình và công việc là đặc biệt quan trọng.", "level": "B1"},
        {"de": "Obwohl die Aufgabe anspruchsvoll war, haben wir das Projekt erfolgreich abgeschlossen.", "vi": "Mặc dù nhiệm vụ đầy thách thức, chúng tôi đã hoàn thành dự án thành công.", "level": "B2"}
    ],
    "pronunciation_words": [
        {"word": "das Mädchen", "ipa": "/ˈmɛːtçən/", "meaning": "cô bé", "tip": "Âm /ç/ phát âm mềm như 'ich', môi hơi bè ra.", "level": "A1"},
        {"word": "die Übung", "ipa": "/ˈyːbʊŋ/", "meaning": "bài tập", "tip": "Chu môi tròn như đọc 'u' nhưng phát âm 'i'.", "level": "A1"},
        {"word": "schön", "ipa": "/ʃøːn/", "meaning": "xinh đẹp", "tip": "Môi tròn như đọc 'o' nhưng lưỡi phát âm 'ê'.", "level": "A1"},
        {"word": "der Zweck", "ipa": "/tsvɛk/", "meaning": "mục đích", "tip": "Âm 'z' đọc dứt khoát như 'ts' không rung cổ.", "level": "B1"},
        {"word": "die Aussprache", "ipa": "/ˈaʊ̯sˌʃpʁaːχə/", "meaning": "sự phát âm", "tip": "Âm 'sp' đọc là 'shp', âm 'ch' sau 'a' đọc khè sâu ở cổ họng.", "level": "B1"}
    ],
    "writing_tasks": [
        {"id": "w_a1", "level": "A1", "title": "Lời nhắn cho bạn bè về buổi học", "prompt": "Bạn không thể đến lớp tiếng Đức hôm nay vì bị cảm cúm. Hãy viết tin nhắn ngắn (ca. 30 từ) cho bạn cùng lớp.", "hints": ["Nói lý do bị ốm", "Hỏi bài tập về nhà", "Hẹn gặp vào buổi sau"]},
        {"id": "w_b1_email", "level": "B1", "title": "Thư xin nghỉ phép gửi cấp trên", "prompt": "Viết email (khoảng 80 từ) gửi sếp của bạn (ông Schmidt) xin nghỉ phép 3 ngày vào tuần tới vì có việc gia đình quan trọng.", "hints": ["Lý do xin nghỉ phép", "Thời gian cụ thể", "Bàn giao công việc cho đồng nghiệp trong thời gian vắng mặt"]},
        {"id": "w_b1_opinion", "level": "B1", "title": "Ý kiến diễn đàn: Học online hay học trực tiếp?", "prompt": "Viết một bài đóng góp ý kiến (khoảng 80 từ) cho diễn đàn học tập về chủ đề: 'Nên học tiếng Đức trực tuyến hay đến lớp truyền thống?'", "hints": ["Nêu trải nghiệm cá nhân", "Ưu điểm và nhược điểm của học trực tuyến", "Đưa ra lời khuyên"]}
    ]
}

with open(os.path.join(OUT_DIR, "skills.js"), "w", encoding="utf-8") as f:
    f.write(f"export const SKILLS = {json.dumps(skills_data, ensure_ascii=False, indent=2)};\n")
    f.write(f"export const SKILL_POOLS = {json.dumps(skills_pools, ensure_ascii=False, indent=2)};\n")

print("skills.js written successfully!")

# ==========================================
# 7. SITUATIONS GENERATION (8 SITUATIONS)
# ==========================================

situations_data = [
    {
        "id": "restaurant",
        "title_de": "Im Restaurant",
        "title_vi": "Tại nhà hàng",
        "desc": "Cách gọi món, hỏi về nguyên liệu, yêu cầu hóa đơn và để lại tiền tip.",
        "icon": "Utensils",
        "phrases": [
            {"de": "Einen Tisch für zwei Personen bitte.", "vi": "Làm ơn cho tôi một bàn dành cho hai người.", "note": "Dùng khi vừa bước vào nhà hàng."},
            {"de": "Könnten Sie uns bitte die Speisekarte bringen?", "vi": "Bạn có thể vui lòng mang thực đơn cho chúng tôi xem được không?", "note": "Yêu cầu lịch sự với Konjunktiv II."},
            {"de": "Ich hätte gern das Schnitzel mit Kartoffelsalat.", "vi": "Tôi muốn dùng món thịt chiên giòn kèm salad khoai tây.", "note": "Cách gọi món chuẩn xác 'Ich hätte gern...'"},
            {"de": "Ist dieses Gericht vegetarisch oder enthält es Fleisch?", "vi": "Món này là đồ chay hay có chứa thịt vậy?", "note": "Hỏi thông tin nguyên liệu."},
            {"de": "Wir möchten bitte zahlen. Zusammen oder getrennt? - Getrennt bitte.", "vi": "Chúng tôi muốn tính tiền. Chung hay riêng? - Tính riêng giúp tôi.", "note": "Người Đức thường thanh toán riêng từng người (getrennt)."},
            {"de": "Stimmt so, vielen Dank!", "vi": "Khỏi cần thối lại, cảm ơn bạn rất nhiều!", "note": "Cách tip tiền thừa cho người phục vụ."}
        ]
    },
    {
        "id": "clinic",
        "title_de": "Beim Arzt / In der Praxis",
        "title_vi": "Tại phòng khám / Bác sĩ",
        "desc": "Mô tả triệu chứng bệnh, đặt lịch hẹn và hiểu lời dặn của bác sĩ.",
        "icon": "Activity",
        "phrases": [
            {"de": "Guten Tag, ich möchte einen Termin vereinbaren. Ich habe starke Halsschmerzen.", "vi": "Xin chào, tôi muốn đặt một lịch khám. Tôi bị đau họng dữ dội.", "note": "Đặt hẹn khám bệnh tại quầy lễ tân."},
            {"de": "Seit wann haben Sie diese Beschwerden und haben Sie Fieber?", "vi": "Bạn bị các triệu chứng này từ khi nào và bạn có bị sốt không?", "note": "Bác sĩ hỏi về thời gian và triệu chứng."},
            {"de": "Ich fühle mich seit gestern sehr schwach và mir ist schwindelig.", "vi": "Từ hôm qua tôi cảm thấy trong người rất yếu và bị chóng mặt.", "note": "Mô tả cảm giác toàn thân."},
            {"de": "Bitte machen Sie den Oberkörper frei và atmen Sie tief ein.", "vi": "Xin vui lòng cởi áo ngoài và hít thở thật sâu.", "note": "Yêu cầu khi bác sĩ nghe tim phổi."},
            {"de": "Hier ist Ihr Rezept. Nehmen Sie die Tabletten dreimal täglich nach dem Essen.", "vi": "Đây là đơn thuốc của bạn. Hãy uống thuốc này ba lần mỗi ngày sau bữa ăn.", "note": "Lời dặn dò sử dụng thuốc."},
            {"de": "Ich schreibe Sie für drei Tage krank. Gute Besserung!", "vi": "Tôi sẽ cấp giấy chứng nhận nghỉ ốm cho bạn trong 3 ngày. Chúc mau khỏi bệnh!", "note": "Cấp giấy nghỉ ốm (Krankschreibung/AU)."}
        ]
    },
    {
        "id": "office",
        "title_de": "Auf dem Amt / Bürgeramt",
        "title_vi": "Tại cơ quan công quyền / Bürgeramt",
        "desc": "Đăng ký hộ khẩu (Anmeldung), nộp hồ sơ visa và làm thủ tục hành chính.",
        "icon": "Building",
        "phrases": [
            {"de": "Ich habe einen Termin um 10 Uhr zur Anmeldung meines Wohnsitzes.", "vi": "Tôi có lịch hẹn lúc 10 giờ để đăng ký địa chỉ thường trú.", "note": "Xuất trình khi đến quầy giao dịch."},
            {"de": "Haben Sie Ihren Reisepass và die Wohnungsgeberbestätigung dabei?", "vi": "Bạn có mang theo hộ chiếu và giấy xác nhận của chủ nhà không?", "note": "Hai giấy tờ bắt buộc khi làm Anmeldung."},
            {"de": "Hier sind alle meine Unterlagen im Original.", "vi": "Đây là toàn bộ hồ sơ bản gốc của tôi.", "note": "Nộp hồ sơ cho cán bộ tiếp nhận."},
            {"de": "Bitte unterschreiben Sie hier unten rechts auf dem Formular.", "vi": "Vui lòng ký tên vào góc dưới bên phải tờ khai này.", "note": "Ký xác nhận thủ tục."},
            {"de": "Wie lange dauert die Bearbeitung meines Antrags voraussichtlich?", "vi": "Dự kiến thời gian xử lý đơn yêu cầu của tôi mất bao lâu?", "note": "Hỏi về tiến độ xử lý hồ sơ."},
            {"de": "Sie erhalten die Bestätigung in etwa zwei Wochen per Post.", "vi": "Bạn sẽ nhận được giấy xác nhận gửi qua đường bưu điện sau khoảng hai tuần.", "note": "Thư xác nhận chính thức gửi về nhà."}
        ]
    },
    {
        "id": "station",
        "title_de": "Am Bahnhof / Reiseverkehr",
        "title_vi": "Tại nhà ga xe lửa / Bến xe",
        "desc": "Mua vé, hỏi giờ khởi hành, chuyển tàu và xử lý sự cố trễ giờ.",
        "icon": "Train",
        "phrases": [
            {"de": "Einmal hin und zurück nach München, zweite Klasse bitte.", "vi": "Cho tôi một vé khứ hồi đi Munich, khoang hạng hai.", "note": "Mua vé trực tiếp tại quầy vé Deutsche Bahn."},
            {"de": "Fährt dieser Zug direkt durch oder muss ich irgendwo umsteigen?", "vi": "Tàu này đi thẳng hay tôi phải chuyển tàu ở đâu không?", "note": "Hỏi về việc đổi tàu (umsteigen)."},
            {"de": "Auf welchem Gleis fährt der ICE nach Berlin ab?", "vi": "Tàu cao tốc ICE đi Berlin sẽ khởi hành từ đường ray số mấy?", "note": "Kiểm tra số đường ray."},
            {"de": "Wegen einer Stellwerkstörung hat dieser Zug 25 Minuten Verspätung.", "vi": "Do sự cố hệ thống tín hiệu, chuyến tàu này bị trễ 25 phút.", "note": "Thông báo lý do hoãn tàu quen thuộc ở Đức."},
            {"de": "Habe ich mit dieser Fahrkarte eine Sitzplatzreservierung?", "vi": "Với chiếc vé này tôi đã có đặt chỗ ngồi trước chưa?", "note": "Kiểm tra đặt chỗ (Sitzplatzreservierung)."},
            {"de": "Kann ich meinen Anschlusszug noch erreichen?", "vi": "Tôi có còn kịp đón chuyến tàu nối tiếp không?", "note": "Hỏi khi tàu trước bị trễ."}
        ]
    },
    {
        "id": "bank",
        "title_de": "In der Bank / Finanzen",
        "title_vi": "Tại ngân hàng / Tài chính",
        "desc": "Mở tài khoản vãng lai (Girokonto), làm thẻ và chuyển khoản.",
        "icon": "CreditCard",
        "phrases": [
            {"de": "Guten Tag, ich möchte ein Girokonto für mein Gehalt eröffnen.", "vi": "Xin chào, tôi muốn mở một tài khoản thanh toán để nhận lương.", "note": "Nhu cầu mở tài khoản cơ bản."},
            {"de": "Welche Gebühren fallen für die Kontoführung monatlich an?", "vi": "Phí quản lý tài khoản hàng tháng là bao nhiêu tiền?", "note": "Hỏi chi phí phí duy trì."},
            {"de": "Ich möchte bitte 500 Euro von meinem Sparkonto abheben.", "vi": "Tôi muốn rút 500 Euro từ tài khoản tiết kiệm của mình.", "note": "Rút tiền tại quầy."},
            {"de": "Wie kann ich das Online-Banking auf meinem Smartphone aktivieren?", "vi": "Làm thế nào để tôi có thể kích hoạt dịch vụ ngân hàng trực tuyến trên điện thoại?", "note": "Kích hoạt ứng dụng ngân hàng."},
            {"de": "Meine Girokarte ist leider verloren gegangen. Ich möchte sie sperren lassen.", "vi": "Thẻ của tôi tiếc là bị mất rồi. Tôi muốn yêu cầu khóa thẻ ngay.", "note": "Gọi hotline khóa thẻ khẩn cấp (116 116)."},
            {"de": "Hier ist Ihre IBAN-Nummer für künftige Überweisungen.", "vi": "Đây là số tài khoản IBAN của bạn để thực hiện các giao dịch chuyển tiền sau này.", "note": "Mã định danh tài khoản ngân hàng Châu Âu."}
        ]
    },
    {
        "id": "renting",
        "title_de": "Wohnungssuche & Miete",
        "title_vi": "Tìm thuê nhà & Thuê căn hộ",
        "desc": "Liên hệ chủ nhà, hỏi điều kiện thuê, xem nhà và ký hợp đồng thuê.",
        "icon": "Home",
        "phrases": [
            {"de": "Guten Tag, ich interessiere mich für Ihre 2-Zimmer-Wohnung in der Schillerstraße.", "vi": "Xin chào, tôi rất quan tâm đến căn hộ 2 phòng của bạn ở phố Schiller.", "note": "Lời mở đầu thư ứng tuyển thuê nhà."},
            {"de": "Wie hoch ist die Warmmiete und was ist in den Nebenkosten enthalten?", "vi": "Tiền thuê trọn gói là bao nhiêu và chi phí phụ bao gồm những gì?", "note": "Phân biệt Kaltmiete và Warmmiete."},
            {"de": "Wäre eine Besichtigung am kommenden Wochenende möglich?", "vi": "Tôi có thể đến xem căn hộ vào cuối tuần tới được không?", "note": "Hẹn lịch xem nhà (Besichtigungstermin)."},
            {"de": "Ich habe ein festes Arbeitsverhältnis và kann Ihnen meine Schufa-Auskunft vorlegen.", "vi": "Tôi có công việc ổn định và có thể xuất trình phiếu thông tin tín dụng Schufa cho bạn.", "note": "Yếu tố quyết định để chủ nhà chọn bạn."},
            {"de": "Wie viele Monatsmieten beträgt die Kaution?", "vi": "Tiền đặt cọc nhà bằng bao nhiêu tháng tiền thuê?", "note": "Thông thường là 2-3 tháng Kaltmiete."},
            {"de": "Ab welchem Datum ist die Wohnung bezugsfrei?", "vi": "Căn hộ có thể dọn vào ở từ ngày nào?", "note": "Thời điểm nhận bàn giao nhà."}
        ]
    },
    {
        "id": "shopping",
        "title_de": "Beim Einkaufen & Geschäft",
        "title_vi": "Khi mua sắm & Cửa hàng",
        "desc": "Hỏi kích cỡ quần áo, thử đồ, hỏi giá và đổi trả hàng hóa.",
        "icon": "ShoppingBag",
        "phrases": [
            {"de": "Entschuldigung, haben Sie diese Jacke auch in einer Nummer größer?", "vi": "Xin lỗi, bạn có chiếc áo khoác này ở cỡ to hơn một số không?", "note": "Hỏi kích cỡ quần áo."},
            {"de": "Wo finde ich bitte die Umkleidekabinen?", "vi": "Làm ơn cho tôi hỏi phòng thay đồ thử đồ ở đâu?", "note": "Tìm phòng thử đồ."},
            {"de": "Das Hemd gefällt mir gut, aber die Ärmel sind etwas zu lang.", "vi": "Tôi rất thích chiếc áo sơ mi này, nhưng ống tay áo hơi dài một chút.", "note": "Nhận xét độ vừa vặn."},
            {"de": "Ist dieser Artikel zurzeit im Angebot?", "vi": "Mặt hàng này hiện tại có đang trong chương trình giảm giá không?", "note": "Hỏi về khuyến mãi."},
            {"de": "Kann ich die Ware innerhalb von 14 Tagen umtauschen, wenn sie nicht passt?", "vi": "Tôi có thể đổi lại hàng trong vòng 14 ngày nếu không vừa không?", "note": "Chính sách đổi trả hàng."},
            {"de": "Ich bezahle kontaktlos mit dem Smartphone, danke!", "vi": "Tôi thanh toán không tiếp xúc qua điện thoại thông minh, cảm ơn bạn!", "note": "Thanh toán Apple Pay/Google Pay."}
        ]
    },
    {
        "id": "phone",
        "title_de": "Am Telefon & Termine",
        "title_vi": "Gọi điện thoại & Đặt hẹn",
        "desc": "Chào hỏi qua điện thoại, xin nối máy, để lại tin nhắn và xác nhận hẹn.",
        "icon": "Phone",
        "phrases": [
            {"de": "Guten Tag, mein Name ist Nguyen. Ich rufe an wegen Ihrer Anzeige.", "vi": "Xin chào, tên tôi là Nguyễn. Tôi gọi điện tới vì mẩu tin thông báo của bạn.", "note": "Xưng danh và nêu lý do gọi điện thoại."},
            {"de": "Könnten Sie mich bitte mit Herrn Müller aus der Buchhaltung verbinden?", "vi": "Bạn có thể vui lòng nối máy giúp tôi tới ông Müller phòng kế toán được không?", "note": "Yêu cầu chuyển máy."},
            {"de": "Er ist zurzeit leider nicht am Platz. Kann er Sie später zurückrufen?", "vi": "Tiếc là hiện tại anh ấy không có ở bàn làm việc. Anh ấy có thể gọi lại cho bạn sau được không?", "note": "Lời báo khi người cần gặp vắng mặt."},
            {"de": "Könnten Sie bitte Ihren Nachnamen buchstabieren?", "vi": "Bạn có thể vui lòng đánh vần họ của mình được không?", "note": "Đánh vần tên (Buchstabieren)."},
            {"de": "Ich melde mich morgen noch einmal vormittags bei Ihnen.", "vi": "Tôi sẽ liên lạc lại với bạn vào sáng mai một lần nữa.", "note": "Hẹn thời gian gọi lại."},
            {"de": "Vielen Dank für Ihre Auskunft und auf Wiederhören!", "vi": "Cảm ơn bạn rất nhiều vì thông tin và xin chào tạm biệt qua điện thoại!", "note": "Lời chào tạm biệt chuẩn khi kết thúc cuộc gọi ('Auf Wiederhören')."}
        ]
    }
]

with open(os.path.join(OUT_DIR, "situations.js"), "w", encoding="utf-8") as f:
    f.write(f"export const SITUATIONS = {json.dumps(situations_data, ensure_ascii=False, indent=2)};\n")

print("situations.js written successfully! All 8 situations generated!")
