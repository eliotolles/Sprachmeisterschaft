const LESEN1_HEADINGS = [
  "1. Immer mehr Menschen arbeiten im Homeoffice",
  "2. Warum Radfahren in der Stadt gef\xE4hrlicher wird",
  "3. Gesunde Ern\xE4hrung muss nicht teuer sein",
  "4. Neue Regeln f\xFCr den F\xFChrerschein ab 60",
  "5. Lernen im Alter h\xE4lt das Gehirn fit",
  "6. Weniger Plastik: Superm\xE4rkte \xE4ndern ihre Verpackungen",
  "7. Fernreisen werden immer billiger",
  "8. Warum junge Leute wieder \xF6fter B\xFCcher lesen"
];
const LESEN1_TEXTS = [
  {
    id: "l1a",
    label: "Text A",
    text: "Eine neue Studie zeigt: Wer auch mit \xFCber 60 Jahren noch eine Fremdsprache lernt oder ein Instrument spielt, bleibt geistig l\xE4nger leistungsf\xE4hig. Die Forscher begleiteten 2.000 Senioren \xFCber zehn Jahre. Entscheidend sei nicht die Leistung, sondern die Regelm\xE4\xDFigkeit: Schon 30 Minuten \xDCbung am Tag zeigen Wirkung.",
    correct: 4,
    explain: "C\u1EA3 \u0111o\u1EA1n n\xF3i v\u1EC1 h\u1ECDc t\u1EADp \u1EDF tu\u1ED5i gi\xE0 gi\xFAp tr\xED n\xE3o kh\u1ECFe \u2014 ti\xEAu \u0111\u1EC1 5. Ti\xEAu \u0111\u1EC1 4 (F\xFChrerschein ab 60) l\xE0 b\u1EABy: c\xF9ng nh\u1EAFc \u0111\u1EBFn tu\u1ED5i 60 nh\u01B0ng n\u1ED9i dung ho\xE0n to\xE0n kh\xE1c."
  },
  {
    id: "l1b",
    label: "Text B",
    text: "Mehrere gro\xDFe Supermarktketten haben angek\xFCndigt, Obst und Gem\xFCse ab dem kommenden Jahr weitgehend ohne Kunststofffolie zu verkaufen. Stattdessen sollen Pappschalen und kompostierbare Netze zum Einsatz kommen. Die Ketten reagieren damit auf Kundenw\xFCnsche und neue EU-Vorgaben.",
    correct: 5,
    explain: "N\u1ED9i dung ch\xEDnh: si\xEAu th\u1ECB thay \u0111\u1ED5i bao b\xEC \u0111\u1EC3 gi\u1EA3m nh\u1EF1a \u2014 ti\xEAu \u0111\u1EC1 6. Ti\xEAu \u0111\u1EC1 3 (\u0103n u\u1ED1ng l\xE0nh m\u1EA1nh) l\xE0 b\u1EABy v\xEC c\xF9ng b\u1ED1i c\u1EA3nh si\xEAu th\u1ECB/th\u1EF1c ph\u1EA9m."
  },
  {
    id: "l1c",
    label: "Text C",
    text: "Entgegen dem allgemeinen Trend melden Buchhandlungen in Gro\xDFst\xE4dten steigende Verkaufszahlen bei Kunden unter 30. Als Gr\xFCnde nennen H\xE4ndler soziale Medien, in denen junge Leser ihre Lieblingsb\xFCcher vorstellen, sowie den Wunsch nach einer Pause vom Bildschirm.",
    correct: 7,
    explain: "Gi\u1EDBi tr\u1EBB \u0111\u1ECDc s\xE1ch nhi\u1EC1u tr\u1EDF l\u1EA1i \u2014 ti\xEAu \u0111\u1EC1 8. Ch\xFA \xFD 'Entgegen dem allgemeinen Trend' (ng\u01B0\u1EE3c v\u1EDBi xu h\u01B0\u1EDBng chung) l\xE0 c\xE2u m\u1EDF kh\xF3a \xFD ch\xEDnh."
  },
  {
    id: "l1d",
    label: "Text D",
    text: "Drei Jahre nach der Pandemie ist das Arbeiten von zu Hause f\xFCr viele Angestellte Normalit\xE4t geworden. Laut einer Umfrage arbeiten 40 Prozent der B\xFCroangestellten mindestens zwei Tage pro Woche daheim. Viele Firmen verkleinern deshalb ihre B\xFCros und sparen Miete.",
    correct: 0,
    explain: "Ch\u1EE7 \u0111\u1EC1 xuy\xEAn su\u1ED1t l\xE0 l\xE0m vi\u1EC7c t\u1EA1i nh\xE0 ng\xE0y c\xE0ng ph\u1ED5 bi\u1EBFn \u2014 ti\xEAu \u0111\u1EC1 1."
  },
  {
    id: "l1e",
    label: "Text E",
    text: "Wer sich ausgewogen ern\xE4hren will, muss daf\xFCr nicht tief in die Tasche greifen. Ern\xE4hrungsexperten raten zu saisonalem Gem\xFCse, H\xFClsenfr\xFCchten und Leitungswasser statt teurer Spezialprodukte. Ein Wochenplan helfe au\xDFerdem, weniger Lebensmittel wegzuwerfen und Geld zu sparen.",
    correct: 2,
    explain: "\u0102n l\xE0nh m\u1EA1nh kh\xF4ng c\u1EA7n \u0111\u1EAFt \u2014 ti\xEAu \u0111\u1EC1 3. C\xE2u \u0111\u1EA7u ti\xEAn \u0111\xE3 n\xEAu th\u1EB3ng \xFD ch\xEDnh: 'muss nicht tief in die Tasche greifen'."
  }
];
const LESEN2_TEXT = `Immer mehr Berufst\xE4tige entscheiden sich f\xFCr eine Auszeit vom Job, ein sogenanntes Sabbatjahr. Dabei verlassen sie ihren Arbeitsplatz f\xFCr mehrere Monate, um zu reisen, sich weiterzubilden oder einfach neue Kraft zu tanken. Eine aktuelle Umfrage unter 500 Unternehmen zeigt: Inzwischen bietet fast jeder dritte Arbeitgeber diese M\xF6glichkeit an \u2013 vor zehn Jahren war es nur jeder zehnte.

\u201EFr\xFCher galt eine l\xE4ngere Pause im Lebenslauf als Schw\xE4che\u201C, sagt Personalexpertin Claudia Berger. \u201EHeute sehen viele Firmen darin ein Zeichen von Eigenverantwortung.\u201C Tats\xE4chlich kehren die meisten Mitarbeiter nach ihrer Auszeit motivierter zur\xFCck und bleiben ihrem Arbeitgeber l\xE4nger treu. Studien zeigen au\xDFerdem, dass die Zahl der Krankheitstage nach einem Sabbatjahr deutlich sinkt.

Trotzdem ist eine Auszeit kein Selbstl\xE4ufer. Experten raten, die Pause mindestens ein Jahr im Voraus zu planen. Wichtig ist vor allem die finanzielle Seite: W\xE4hrend des Sabbatjahres zahlt der Arbeitgeber in der Regel kein Gehalt, manche Firmen bieten aber Modelle an, bei denen man vorher weniger Gehalt bekommt und daf\xFCr w\xE4hrend der Pause weiterbezahlt wird. Auch die R\xFCckkehr an den alten Arbeitsplatz sollte schriftlich vereinbart werden, damit es sp\xE4ter keine b\xF6sen \xDCberraschungen gibt.

Nicht jeder kann sich eine lange Auszeit leisten. Kritiker weisen darauf hin, dass vor allem gut verdienende Angestellte in gro\xDFen Firmen von solchen Angeboten profitieren. F\xFCr Mitarbeiter kleiner Betriebe bleibe das Sabbatjahr oft nur ein Traum.`;
const LESEN2_ITEMS = [
  {
    id: "l2-1",
    question: "Was zeigt die aktuelle Umfrage unter 500 Unternehmen?",
    options: [
      "Die meisten Arbeitgeber lehnen ein Sabbatjahr ab.",
      "Immer mehr Firmen erm\xF6glichen ihren Mitarbeitern eine Auszeit.",
      "Nur jeder zehnte Arbeitgeber kennt das Sabbatjahr."
    ],
    correct: 1,
    explain: "\u0110o\u1EA1n 1: 'fast jeder dritte Arbeitgeber bietet diese M\xF6glichkeit an \u2013 vor zehn Jahren war es nur jeder zehnte'. \u0110\xE1p \xE1n C \u0111\u1EA3o ng\u01B0\u1EE3c s\u1ED1 li\u1EC7u qu\xE1 kh\u1EE9/thi\u1EC7n t\u1EA1i \u2014 b\u1EABy kinh \u0111i\u1EC3n c\u1EE7a telc."
  },
  {
    id: "l2-2",
    question: "Wie werden Mitarbeiter nach einem Sabbatjahr von den Firmen gesehen?",
    options: [
      "Sie gelten als weniger leistungsf\xE4hig.",
      "Sie wechseln h\xE4ufiger den Arbeitgeber.",
      "Sie sind motivierter und bleiben l\xE4nger in der Firma."
    ],
    correct: 2,
    explain: "\u0110o\u1EA1n 2: 'kehren motivierter zur\xFCck und bleiben ihrem Arbeitgeber l\xE4nger treu'. \u0110\xE1p \xE1n B n\xF3i ng\u01B0\u1EE3c ho\xE0n to\xE0n ('wechseln h\xE4ufiger')."
  },
  {
    id: "l2-3",
    question: "Welche Wirkung eines Sabbatjahres wird durch Studien belegt?",
    options: [
      "Die Mitarbeiter verdienen danach mehr Geld.",
      "Die Zahl der Krankheitstage geht zur\xFCck.",
      "Die Mitarbeiter machen weniger \xDCberstunden."
    ],
    correct: 1,
    explain: "C\xE2u cu\u1ED1i \u0111o\u1EA1n 2: 'die Zahl der Krankheitstage nach einem Sabbatjahr deutlich sinkt'. Hai \u0111\xE1p \xE1n c\xF2n l\u1EA1i kh\xF4ng h\u1EC1 xu\u1EA5t hi\u1EC7n trong b\xE0i."
  },
  {
    id: "l2-4",
    question: "Was raten Experten bei der Planung einer Auszeit?",
    options: [
      "Man sollte die Pause m\xF6glichst kurzfristig antreten.",
      "Man sollte nur reisen und sich nicht weiterbilden.",
      "Man sollte die R\xFCckkehr an den Arbeitsplatz schriftlich festhalten."
    ],
    correct: 2,
    explain: "\u0110o\u1EA1n 3: 'die R\xFCckkehr an den alten Arbeitsplatz sollte schriftlich vereinbart werden'. \u0110\xE1p \xE1n A ng\u01B0\u1EE3c v\u1EDBi l\u1EDDi khuy\xEAn 'mindestens ein Jahr im Voraus planen'."
  },
  {
    id: "l2-5",
    question: "Was kritisieren die Gegner des Sabbatjahres?",
    options: [
      "Dass vor allem Gutverdienende in gro\xDFen Firmen davon profitieren.",
      "Dass die Auszeit f\xFCr die Firmen zu teuer ist.",
      "Dass Mitarbeiter danach nicht mehr arbeiten wollen."
    ],
    correct: 0,
    explain: "\u0110o\u1EA1n cu\u1ED1i: 'vor allem gut verdienende Angestellte in gro\xDFen Firmen profitieren'. \u0110\xE2y l\xE0 c\xE2u h\u1ECFi v\u1EC1 th\xE1i \u0111\u1ED9 c\u1EE7a Kritiker \u2014 ph\u1EA3i \u0111\u1ECDc \u0111\xFAng ch\u1EE7 th\u1EC3 c\u1EE7a c\xE2u."
  }
];
const LESEN3_SITUATIONS = [
  {
    id: "l3-1",
    text: "Situation 1: Frau Yilmaz arbeitet im Schichtdienst und kann nur abends nach 19 Uhr Sport machen. Sie sucht ein Fitnessstudio, das lange ge\xF6ffnet hat und keine lange Vertragsbindung verlangt.",
    correct: "c",
    explain: "Qu\u1EA3ng c\xE1o c \u0111\xE1p \u1EE9ng c\u1EA3 hai \u0111i\u1EC1u ki\u1EC7n: m\u1EDF c\u1EEDa \u0111\u1EBFn 23h v\xE0 h\u1EE7y h\u1EE3p \u0111\u1ED3ng theo th\xE1ng. Qu\u1EA3ng c\xE1o a r\u1EBB nh\u01B0ng \u0111\xF3ng c\u1EEDa l\xFAc 21h v\xE0 h\u1EE3p \u0111\u1ED3ng 24 th\xE1ng \u2014 '\u0111\xFAng m\u1ED9t n\u1EEDa' l\xE0 b\u1EABy quen thu\u1ED9c."
  },
  {
    id: "l3-2",
    text: "Situation 2: Herr Novak m\xF6chte mit seinen zwei Kindern (7 und 10 Jahre) am Wochenende etwas unternehmen, auch bei schlechtem Wetter. Es soll nicht zu teuer sein.",
    correct: "f",
    explain: "Qu\u1EA3ng c\xE1o f: b\u1EA3o t\xE0ng tr\u1EA3i nghi\u1EC7m trong nh\xE0 (kh\xF4ng lo m\u01B0a), tr\u1EBB em d\u01B0\u1EDBi 12 tu\u1ED5i mi\u1EC5n ph\xED. Qu\u1EA3ng c\xE1o d l\xE0 c\xF4ng vi\xEAn ngo\xE0i tr\u1EDDi \u2014 sai \u0111i\u1EC1u ki\u1EC7n th\u1EDDi ti\u1EBFt."
  },
  {
    id: "l3-3",
    text: "Situation 3: Eine Studentin sucht f\xFCr ein Semester ein ruhiges Zimmer in der N\xE4he der Universit\xE4t. Sie hat kein Auto und nur wenig Geld.",
    correct: "a",
    explain: "Qu\u1EA3ng c\xE1o a: ph\xF2ng trong WG g\u1EA7n tr\u01B0\u1EDDng, gi\xE1 g\u1ED3m chi ph\xED ph\u1EE5, ph\xF9 h\u1EE3p sinh vi\xEAn \xEDt ti\u1EC1n. Qu\u1EA3ng c\xE1o b l\xE0 c\u0103n h\u1ED9 2 ph\xF2ng \u0111\u1EAFt h\u01A1n nhi\u1EC1u v\xE0 \u1EDF ngo\u1EA1i \xF4."
  },
  {
    id: "l3-4",
    text: "Situation 4: Herr und Frau Costa m\xF6chten ihren 20. Hochzeitstag in einem besonderen Restaurant feiern. Sie essen kein Fleisch und w\xFCnschen sich einen ruhigen, festlichen Abend.",
    correct: "h",
    explain: "Qu\u1EA3ng c\xE1o h: nh\xE0 h\xE0ng chay cao c\u1EA5p, kh\xF4ng gian y\xEAn t\u0129nh, c\xF3 th\u1EF1c \u0111\u01A1n l\u1EC5. Qu\u1EA3ng c\xE1o e l\xE0 qu\xE1n steak \u2014 sai ho\xE0n to\xE0n \u0111i\u1EC1u ki\u1EC7n '\u0103n chay'."
  },
  {
    id: "l3-5",
    text: "Situation 5: Ein junger Koch sucht eine Weiterbildung am Wochenende, weil er unter der Woche arbeitet. Er m\xF6chte mehr \xFCber internationale K\xFCche lernen.",
    correct: "d",
    explain: "Qu\u1EA3ng c\xE1o d: kh\xF3a n\u1EA5u \u0103n cu\u1ED1i tu\u1EA7n v\u1EC1 \u1EA9m th\u1EF1c qu\u1ED1c t\u1EBF. Qu\u1EA3ng c\xE1o g l\xE0 kh\xF3a h\u1ECDc bu\u1ED5i t\u1ED1i ng\xE0y th\u01B0\u1EDDng \u2014 sai \u0111i\u1EC1u ki\u1EC7n th\u1EDDi gian d\xF9 c\xF9ng ch\u1EE7 \u0111\u1EC1 n\u1EA5u \u0103n."
  }
];
const LESEN3_ADS = [
  { id: "a", text: "Anzeige a \u2014 Zimmer in Studenten-WG frei: Ruhiges Zimmer, 5 Minuten zur Uni, 390 \u20AC warm. Ideal f\xFCr Studenten mit kleinem Budget. Ab sofort, mindestens 6 Monate." },
  { id: "b", text: "Anzeige b \u2014 Moderne 2-Zimmer-Wohnung am Stadtrand: 75 m\xB2, Balkon, Garage, 980 \u20AC kalt. Ruhige Lage, gute Anbindung mit dem Auto." },
  { id: "c", text: "Anzeige c \u2014 Fitnessstudio AktivPlus: T\xE4glich 6\u201323 Uhr ge\xF6ffnet! Monatlich k\xFCndbar, keine Anmeldegeb\xFChr. Kurse auch am sp\xE4ten Abend." },
  { id: "d", text: "Anzeige d \u2014 Kochkurse am Wochenende: Internationale K\xFCche entdecken \u2014 jeden Samstag und Sonntag, f\xFCr Anf\xE4nger und Profis. Jetzt Platz sichern!" },
  { id: "e", text: "Anzeige e \u2014 Steakhaus 'Zum Ochsen': Die besten Steaks der Stadt, gro\xDFe Portionen, rustikale Atmosph\xE4re. T\xE4glich ab 17 Uhr." },
  { id: "f", text: "Anzeige f \u2014 Erlebnismuseum TechnoWelt: Entdecken und Ausprobieren f\xFCr die ganze Familie \u2014 wetterunabh\xE4ngig! Kinder unter 12 Jahren zahlen keinen Eintritt." },
  { id: "g", text: "Anzeige g \u2014 Abendkochschule Genuss: Kochkurse f\xFCr Berufst\xE4tige, Montag bis Donnerstag ab 18 Uhr. Schwerpunkt: italienische K\xFCche." },
  { id: "h", text: "Anzeige h \u2014 Restaurant Gr\xFCne Oase: Vegetarische Gourmetk\xFCche in ruhiger, festlicher Atmosph\xE4re. Spezielle Men\xFCs f\xFCr besondere Anl\xE4sse." }
];
const HOEREN_TEILE = [
  {
    teil: "H\xF6ren Teil 1a \u2014 Th\xF4ng b\xE1o \u1EDF nh\xE0 ga",
    instruction: "Nghe th\xF4ng b\xE1o, ch\u1ECDn Richtig (\u0111\xFAng) ho\u1EB7c Falsch (sai). Ch\u1EC9 nghe 1 l\u1EA7n.",
    audioKey: "h1a",
    script: "Achtung, eine Durchsage: Der Regionalexpress nach Hamburg, planm\xE4\xDFige Abfahrt 14 Uhr 20, f\xE4hrt heute von Gleis 7 statt von Gleis 5 ab. Der Zug ist bereits eingetroffen. Wir bitten um Ihr Verst\xE4ndnis.",
    items: [
      {
        id: "h1a-1",
        question: "Der Zug nach Hamburg f\xE4hrt heute von einem anderen Gleis ab.",
        options: ["Richtig", "Falsch"],
        correct: 0,
        explain: "Th\xF4ng b\xE1o n\xF3i r\xF5: 'von Gleis 7 statt von Gleis 5' \u2014 \u0111\u1ED5i s\xE2n ga, n\xEAn c\xE2u n\xE0y Richtig."
      }
    ]
  },
  {
    teil: "H\xF6ren Teil 1b \u2014 Tin nh\u1EAFn tho\u1EA1i c\u1EE7a ph\xF2ng kh\xE1m",
    instruction: "Nghe tin nh\u1EAFn, ch\u1ECDn Richtig ho\u1EB7c Falsch. Ch\u1EC9 nghe 1 l\u1EA7n.",
    audioKey: "h1b",
    script: "Guten Tag, hier ist die Zahnarztpraxis Dr. Sommer. Frau Lehmann, Ihr Termin am Dienstag um 10 Uhr muss leider verschoben werden. Wir bieten Ihnen stattdessen Donnerstag um 15 Uhr 30 an. Bitte rufen Sie uns zur Best\xE4tigung zur\xFCck.",
    items: [
      {
        id: "h1b-1",
        question: "Frau Lehmann soll am Dienstag um 10 Uhr in die Praxis kommen.",
        options: ["Richtig", "Falsch"],
        correct: 1,
        explain: "L\u1ECBch th\u1EE9 Ba 10h b\u1ECB H\u1EE6Y ('muss verschoben werden'), chuy\u1EC3n sang th\u1EE9 N\u0103m 15h30. Nghe th\u1EA5y gi\u1EDD c\u0169 trong b\u0103ng l\xE0 b\u1EABy \u2014 ph\u1EA3i nghe c\u1EA3 c\xE2u."
      }
    ]
  },
  {
    teil: "H\xF6ren Teil 1c \u2014 Th\xF4ng b\xE1o th\u1EDDi ti\u1EBFt giao th\xF4ng",
    instruction: "Nghe b\u1EA3n tin giao th\xF4ng, ch\u1ECDn Richtig ho\u1EB7c Falsch. Ch\u1EC9 nghe 1 l\u1EA7n.",
    audioKey: "h1c",
    script: "Und nun der Verkehrsdienst: Auf der A 8 Richtung M\xFCnchen gibt es wegen Bauarbeiten einen Stau von etwa f\xFCnf Kilometern. Die Bauarbeiten dauern voraussichtlich bis zum Ende der Woche. Autofahrern wird empfohlen, die Autobahn bei der Ausfahrt Ulm zu verlassen.",
    items: [
      {
        id: "h1c-1",
        question: "Die Bauarbeiten auf der A 8 sind morgen beendet.",
        options: ["Richtig", "Falsch"],
        correct: 1,
        explain: "B\u0103ng n\xF3i c\xF4ng tr\xECnh k\xE9o d\xE0i 'bis zum Ende der Woche' (\u0111\u1EBFn cu\u1ED1i tu\u1EA7n), kh\xF4ng ph\u1EA3i ng\xE0y mai \u2014 Falsch."
      }
    ]
  },
  {
    teil: "H\xF6ren Teil 2 \u2014 Ph\u1ECFng v\u1EA5n: ngh\u1EC1 \u0111i\u1EC1u d\u01B0\u1EE1ng",
    instruction: "Nghe b\xE0i ph\u1ECFng v\u1EA5n v\u1EDBi m\u1ED9t \u0111i\u1EC1u d\u01B0\u1EE1ng vi\xEAn, ch\u1ECDn \u0111\xE1p \xE1n \u0111\xFAng. Ch\u1EC9 nghe 1 l\u1EA7n \u2014 h\xE3y ghi t\u1EEB kh\xF3a khi nghe.",
    audioKey: "h2",
    script: "Moderatorin: Guten Tag, Frau Aksoy. Sie arbeiten seit zw\xF6lf Jahren als Krankenschwester. Was gef\xE4llt Ihnen an Ihrem Beruf am besten? \u2014 Frau Aksoy: Am besten gef\xE4llt mir der Kontakt zu den Patienten. Kein Tag ist wie der andere, und man bekommt viel Dankbarkeit zur\xFCck. \u2014 Moderatorin: Und was ist f\xFCr Sie am schwierigsten? \u2014 Frau Aksoy: Die Nachtschichten sind k\xF6rperlich sehr anstrengend. Und wir haben zu wenig Personal, deshalb bleibt oft zu wenig Zeit f\xFCr jeden einzelnen Patienten. \u2014 Moderatorin: Viele junge Leute wollen heute nicht mehr in der Pflege arbeiten. Woran liegt das Ihrer Meinung nach? \u2014 Frau Aksoy: Ich denke, das liegt vor allem an der Bezahlung und an den Arbeitszeiten. Am Wochenende und an Feiertagen zu arbeiten, ist f\xFCr viele junge Menschen unattraktiv. \u2014 Moderatorin: Was m\xFCsste sich \xE4ndern? \u2014 Frau Aksoy: Wir brauchen mehr Kollegen und eine bessere Bezahlung. Aber auch mehr Anerkennung in der Gesellschaft w\xE4re wichtig. Der Beruf ist anspruchsvoll und verdient mehr Respekt.",
    items: [
      {
        id: "h2-1",
        question: "Was gef\xE4llt Frau Aksoy an ihrem Beruf am besten?",
        options: [
          "Die guten Arbeitszeiten.",
          "Der Kontakt zu den Patienten.",
          "Die moderne Technik im Krankenhaus."
        ],
        correct: 1,
        explain: "C\xF4 \u1EA5y n\xF3i ngay c\xE2u \u0111\u1EA7u: 'Am besten gef\xE4llt mir der Kontakt zu den Patienten.' Gi\u1EDD gi\u1EA5c l\xE0m vi\u1EC7c ng\u01B0\u1EE3c l\u1EA1i l\xE0 \u0111i\u1EC1u c\xF4 \u1EA5y ch\xEA."
      },
      {
        id: "h2-2",
        question: "Was ist f\xFCr Frau Aksoy am schwierigsten?",
        options: [
          "Die Nachtschichten und der Personalmangel.",
          "Die langen Wege zur Arbeit.",
          "Die schwierigen Patienten."
        ],
        correct: 0,
        explain: "'Die Nachtschichten sind k\xF6rperlich sehr anstrengend. Und wir haben zu wenig Personal...' \u2014 hai \xFD \u0111\u1EC1u n\u1EB1m trong m\u1ED9t l\u01B0\u1EE3t tr\u1EA3 l\u1EDDi."
      },
      {
        id: "h2-3",
        question: "Warum wollen viele junge Leute laut Frau Aksoy nicht in der Pflege arbeiten?",
        options: [
          "Weil die Ausbildung zu lang ist.",
          "Weil Bezahlung und Arbeitszeiten unattraktiv sind.",
          "Weil der Beruf langweilig ist."
        ],
        correct: 1,
        explain: "'Das liegt vor allem an der Bezahlung und an den Arbeitszeiten.' Th\u1EDDi gian \u0111\xE0o t\u1EA1o kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EAFc \u0111\u1EBFn."
      },
      {
        id: "h2-4",
        question: "Was fordert Frau Aksoy am Ende des Interviews?",
        options: [
          "K\xFCrzere Nachtschichten nur f\xFCr \xE4ltere Mitarbeiter.",
          "Mehr Personal, bessere Bezahlung und mehr Anerkennung.",
          "Ein neues Krankenhaus in ihrer Stadt."
        ],
        correct: 1,
        explain: "C\xE2u tr\u1EA3 l\u1EDDi cu\u1ED1i li\u1EC7t k\xEA \u0111\xFAng 3 \u0111i\u1EC3m: 'mehr Kollegen, eine bessere Bezahlung, mehr Anerkennung in der Gesellschaft'."
      }
    ]
  },
  {
    teil: "H\xF6ren Teil 3 \u2014 B\u1EA3n tin radio: th\u01B0 vi\u1EC7n th\xE0nh ph\u1ED1",
    instruction: "Nghe b\u1EA3n tin radio, ch\u1ECDn \u0111\xE1p \xE1n \u0111\xFAng. Ch\u1EC9 nghe 1 l\u1EA7n.",
    audioKey: "h3",
    script: "Die Stadtbibliothek in Freiburg erweitert ab dem kommenden Monat ihre \xD6ffnungszeiten. K\xFCnftig ist die Bibliothek auch sonntags von 10 bis 16 Uhr ge\xF6ffnet. Grund daf\xFCr ist die gro\xDFe Nachfrage von Sch\xFClern und Studenten, die sich auf Pr\xFCfungen vorbereiten. Au\xDFerdem bietet die Bibliothek ab sofort kostenlose Lernr\xE4ume f\xFCr Gruppen an. Diese m\xFCssen allerdings vorher online reserviert werden. Die Leiterin der Bibliothek erkl\xE4rte, dass die Zahl der Besucher im letzten Jahr um 20 Prozent gestiegen sei. Besonders beliebt seien die neuen Arbeitspl\xE4tze mit Computern und der kostenlose Internetzugang.",
    items: [
      {
        id: "h3-1",
        question: "Was \xE4ndert sich bei der Stadtbibliothek?",
        options: [
          "Sie ist k\xFCnftig auch sonntags ge\xF6ffnet.",
          "Sie zieht in ein neues Geb\xE4ude um.",
          "Sie verlangt ab sofort Eintritt."
        ],
        correct: 0,
        explain: "C\xE2u \u0111\u1EA7u ti\xEAn c\u1EE7a b\u1EA3n tin: 'erweitert ihre \xD6ffnungszeiten... auch sonntags von 10 bis 16 Uhr ge\xF6ffnet'."
      },
      {
        id: "h3-2",
        question: "Warum werden die \xD6ffnungszeiten erweitert?",
        options: [
          "Weil ein neues Gesetz das verlangt.",
          "Weil viele Sch\xFCler und Studenten dort f\xFCr Pr\xFCfungen lernen.",
          "Weil die Bibliothek mehr B\xFCcher verkaufen will."
        ],
        correct: 1,
        explain: "'Grund daf\xFCr ist die gro\xDFe Nachfrage von Sch\xFClern und Studenten, die sich auf Pr\xFCfungen vorbereiten.'"
      },
      {
        id: "h3-3",
        question: "Was muss man f\xFCr die Gruppenlernr\xE4ume tun?",
        options: [
          "Man muss eine Geb\xFChr bezahlen.",
          "Man muss sie vorher online reservieren.",
          "Man muss Mitglied der Bibliothek sein."
        ],
        correct: 1,
        explain: "Ph\xF2ng h\u1ECDc nh\xF3m MI\u1EC4N PH\xCD ('kostenlose Lernr\xE4ume') nh\u01B0ng 'm\xFCssen vorher online reserviert werden' \u2014 \u0111\xE1p \xE1n A l\xE0 b\u1EABy v\xEC nghe th\u1EA5y ch\u1EEF 'kostenlos' m\xE0 kh\xF4ng nghe h\u1EBFt c\xE2u."
      }
    ]
  }
];
const LESEN_MAX = 15;
const HOEREN_MAX = 10;
const LESEN_TIME_SEC = 40 * 60;
const HOEREN_TIME_SEC = 20 * 60;
export {
  HOEREN_MAX,
  HOEREN_TEILE,
  HOEREN_TIME_SEC,
  LESEN1_HEADINGS,
  LESEN1_TEXTS,
  LESEN2_ITEMS,
  LESEN2_TEXT,
  LESEN3_ADS,
  LESEN3_SITUATIONS,
  LESEN_MAX,
  LESEN_TIME_SEC
};
