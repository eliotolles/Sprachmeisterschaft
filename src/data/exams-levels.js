export const EXAMS_LEVELS = [
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
            "options": [
              "Um 12:00 Uhr",
              "Um 14:00 Uhr",
              "Um 18:00 Uhr",
              "Gar nicht"
            ],
            "answer": "Um 14:00 Uhr"
          }
        ]
      }
    ],
    "listening": [
      {
        "script": "Frau Nguyen, bitte kommen Sie in das Behandlungszimmer 3. Der Arzt erwartet Sie.",
        "question": "In welches Zimmer soll Frau Nguyen gehen?",
        "options": [
          "Zimmer 1",
          "Zimmer 2",
          "Zimmer 3",
          "Zimmer 4"
        ],
        "answer": "Zimmer 3"
      }
    ],
    "writing": {
      "task": "Schreiben Sie eine kurze SMS (ca. 30 Wörter) an Ihre Freundin Lisa. Sie können heute leider nicht zum Deutschlernen kommen, weil Sie bis 18 Uhr arbeiten müssen.",
      "hints": [
        "Entschuldigung",
        "Grund (Arbeit)",
        "Neuen Termin vorschlagen"
      ]
    },
    "speaking": [
      {
        "part": "Teil 1: Sich vorstellen",
        "prompt": "Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby.",
        "tips": [
          "In ganzen Sätzen sprechen"
        ]
      },
      {
        "part": "Teil 2: Um Informationen bitten",
        "prompt": "Stellen Sie eine Frage mit einer Wortkarte (Thema: Einkaufen, Wort: Brot).",
        "tips": [
          "Höfliche Frage formulieren"
        ]
      }
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
            "options": [
              "Am nächsten Freitag ab 17 Uhr",
              "Am Samstagmorgen",
              "Am Mittwoch",
              "In zwei Wochen"
            ],
            "answer": "Am nächsten Freitag ab 17 Uhr"
          }
        ]
      }
    ],
    "listening": [
      {
        "script": "Hier ist das Fundbüro der Stadt Köln. Ihr gefundener Schlüsselbund wurde bei uns abgegeben. Sie können ihn von Montag bis Freitag zwischen 8 und 12 Uhr abholen.",
        "question": "Wann kann der Schlüssel abgeholt werden?",
        "options": [
          "Nur samstags",
          "Montag bis Freitag von 8 bis 12 Uhr",
          "Am Sonntagabend",
          "Jederzeit rund um die Uhr"
        ],
        "answer": "Montag bis Freitag von 8 bis 12 Uhr"
      }
    ],
    "writing": {
      "task": "Schreiben Sie eine E-Mail (ca. 50 Wörter) an Ihren Kollegen Markus. Bedanken Sie sich für seine Unterstützung beim Projekt und laden Sie ihn zu einem Kaffee ein.",
      "hints": [
        "Dank aussprechen",
        "Einladung zum Kaffee",
        "Zeitpunkt vorschlagen"
      ]
    },
    "speaking": [
      {
        "part": "Teil 1: Fragen zur Person",
        "prompt": "Beantworten Sie Fragen zu Ihrem Alltag und Ihren Hobbys.",
        "tips": [
          "Ausführlich antworten"
        ]
      },
      {
        "part": "Teil 2: Aus dem Leben erzählen",
        "prompt": "Erzählen Sie von Ihrem letzten Urlaub.",
        "tips": [
          "Vergangenheit Perfekt verwenden"
        ]
      }
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
            "options": [
              "Um ein Schulfest zu feiern",
              "Um über die schulische Entwicklung des Kindes zu sprechen",
              "Um Geld für neue Bücher zu sammeln",
              "Um neue Schüler anzumelden"
            ],
            "answer": "Um über die schulische Entwicklung des Kindes zu sprechen"
          }
        ]
      }
    ],
    "listening": [
      {
        "script": "Agentur für Arbeit Berlin: Guten Tag Herr Nguyen. Wir haben ein passendes Stellenangebot als Elektriker für Sie. Bitte kommen Sie morgen um 10 Uhr zu Ihrem Sachbearbeiter Herrn Hoffmann in Zimmer 204.",
        "question": "Warum ruft die Arbeitsagentur an?",
        "options": [
          "Weil Herr Nguyen einen Kurs bezahlen muss",
          "Weil ein passendes Stellenangebot vorliegt",
          "Weil die Agentur geschlossen ist",
          "Weil die Papiere fehlen"
        ],
        "answer": "Weil ein passendes Stellenangebot vorliegt"
      }
    ],
    "writing": {
      "task": "Schreiben Sie eine Mitteilung (ca. 80 Wörter) an die Klassenlehrerin Ihres Sohnes. Ihr Sohn ist erkrankt và kann drei Tage nicht in die Schule kommen. Bitten Sie um die Hausaufgaben.",
      "hints": [
        "Entschuldigung für das Fehlen wegen Krankheit",
        "Voraussichtliche Dauer der Abwesenheit",
        "Bitte um Zusendung der Hausaufgaben"
      ]
    },
    "speaking": [
      {
        "part": "Teil 1: Sich vorstellen",
        "prompt": "Stellen Sie sich vor: Herkunft, Familie, Beruf in Deutschland.",
        "tips": [
          "Flüssig und selbstsicher vorstellen"
        ]
      },
      {
        "part": "Teil 2: Über Erfahrungen sprechen",
        "prompt": "Sprechen Sie über ein Foto zum Thema 'Berufsausbildung in Deutschland'.",
        "tips": [
          "Erfahrungen verknüpfen"
        ]
      },
      {
        "part": "Teil 3: Ein Problem lösen",
        "prompt": "Sie möchten mit Ihrem Nachbarn einen Gemeinschaftsgarten anlegen. Planen Sie die Schritte.",
        "tips": [
          "Kompromisse schließen"
        ]
      }
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
            "options": [
              "Rein repetitive manuelle Tätigkeiten",
              "Soziale Intelligenz, Urteilsvermögen và Problemlösungskompetenz",
              "Auswendiglernen alter Formeln",
              "Verzicht auf Technologie"
            ],
            "answer": "Soziale Intelligenz, Urteilsvermögen und Problemlösungskompetenz"
          }
        ]
      }
    ],
    "listening": [
      {
        "script": "Deutschlandfunk Kultur: In unserem heutigen Wissenschaftsmagazin diskutieren wir mit Prof. Dr. Becker über die ethischen Implikationen generativer KI in der Hochschullehre und die Notwendigkeit transparenter Bewertungsmaßstäbe.",
        "question": "Was ist das Hauptthema des Radiobeitrags?",
        "options": [
          "Neuerungen bei Sportübertragungen",
          "Ethische Fragen beim Einsatz von KI in der Hochschullehre",
          "Die Erhöhung von Studiengebühren",
          "Der Bau eines neuen Radiosenders"
        ],
        "answer": "Ethische Fragen beim Einsatz von KI in der Hochschullehre"
      }
    ],
    "writing": {
      "task": "Verfassen Sie einen argumentativen Kommentar (ca. 150 Wörter) zur Fragestellung: 'Sollte die Vier-Tage-Woche bei vollem Lohnausgleich gesetzlich eingeführt werden?'",
      "hints": [
        "Einleitung mit aktuellem Bezug",
        "Argumentation Pro (Produktivität, Gesundheit) vs. Kontra (Fachkräftemangel)",
        "Eigenes differenziertes Fazit"
      ]
    },
    "speaking": [
      {
        "part": "Teil 1: Vortrag halten",
        "prompt": "Halten Sie einen strukturierten Kurzvortrag über 'Herausforderungen der Energiewende'.",
        "tips": [
          "Akademischen Wortschatz nutzen"
        ]
      },
      {
        "part": "Teil 2: Fachdiskussion",
        "prompt": "Führen Sie eine kontroverse Diskussion über wirtschaftliche Folgen mit dem Prüfer.",
        "tips": [
          "Differenziert argumentieren"
        ]
      }
    ]
  }
];
