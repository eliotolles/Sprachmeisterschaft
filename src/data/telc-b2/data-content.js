const PLAN_START = "2026-11-16";
const PLAN_DAYS = 60;
const STUDY_BLOCKS = [
  {
    id: "vocab",
    name: "T\u1EEB v\u1EF1ng",
    minutes: 35,
    what: "H\u1ECDc 18 c\u1EE5m c\u1EE7a 1 ch\u1EE7 \u0111\u1EC1 b\u1EB1ng th\u1EBB ghi nh\u1EDB, \u0111\u1ECDc to th\xE0nh ti\u1EBFng, \u0111\u1EB7t 5 c\xE2u mi\u1EC7ng v\u1EDBi 5 c\u1EE5m kh\xF3 nh\u1EA5t. 10 ph\xFAt \u0111\u1EA7u \xF4n c\u1EE5m c\u1EE7a 2 ng\xE0y tr\u01B0\u1EDBc.",
    output: "18 c\u1EE5m thu\u1ED9c m\u1EE9c: nh\xECn ti\u1EBFng Vi\u1EC7t n\xF3i ra \u0111\u01B0\u1EE3c ti\u1EBFng \u0110\u1EE9c."
  },
  {
    id: "reading",
    name: "\u0110\u1ECDc",
    minutes: 25,
    what: "L\xE0m b\xE0i \u0111\u1ECDc d\u1EA1ng telc (xoay v\xF2ng Teil 1\u20132\u20133), b\u1EA5m gi\u1EDD nh\u01B0 thi th\u1EADt. Ch\u1EEFa b\xE0i b\u1EB1ng c\xE1ch t\xECm b\u1EB1ng ch\u1EE9ng trong b\xE0i cho t\u1EEBng \u0111\xE1p \xE1n.",
    output: "Ghi s\u1ED1 c\xE2u \u0111\xFAng; ch\xE9p t\u1ED1i \u0111a 10 c\u1EE5m m\u1EDBi v\xE0o s\u1ED5 l\u1ED7i."
  },
  {
    id: "listening",
    name: "Nghe",
    minutes: 45,
    what: "20 ph\xFAt l\xE0m b\xE0i nghe d\u1EA1ng telc, ch\u1EC9 nghe 1 l\u1EA7n. 25 ph\xFAt c\xF2n l\u1EA1i: nghe l\u1EA1i k\xE8m l\u1EDDi tho\u1EA1i (Transkript), ch\xE9p ch\xEDnh t\u1EA3 5 c\xE2u kh\xF3, nghe l\u1EA1i kh\xF4ng nh\xECn ch\u1EEF.",
    output: "Ph\xE2n bi\u1EC7t \u0111\u01B0\u1EE3c m\xECnh m\u1EA5t \u0111i\u1EC3m v\xEC thi\u1EBFu t\u1EEB hay v\xEC nghe kh\xF4ng k\u1ECBp \u2014 hai l\u1ED7i ch\u1EEFa kh\xE1c nhau."
  },
  {
    id: "writing",
    name: "Ng\u1EEF ph\xE1p + Vi\u1EBFt",
    minutes: 75,
    what: "30 ph\xFAt: 1 chuy\xEAn \u0111\u1EC1 ng\u1EEF ph\xE1p B2 + 10 c\xE2u Sprachbausteine. 45 ph\xFAt vi\u1EBFt: 10 ph\xFAt d\xE0n \xFD, 30 ph\xFAt vi\u1EBFt b\u1EA5m gi\u1EDD, 5 ph\xFAt soi l\u1ED7i b\u1EB1ng checklist.",
    output: "M\u1ED7i ng\xE0y 1 b\xE0i vi\u1EBFt ho\xE0n ch\u1EC9nh (t\u1EEB tu\u1EA7n 3), ho\u1EB7c 1 d\xE0n \xFD + 1 \u0111o\u1EA1n th\xE2n b\xE0i (tu\u1EA7n 1\u20132)."
  },
  {
    id: "speaking",
    name: "N\xF3i",
    minutes: 60,
    what: "20 ph\xFAt Teil 1 (xoay v\xF2ng 7 b\xE0i m\u1EABu, ghi \xE2m). 20 ph\xFAt Teil 2: t\u1EF1 tranh lu\u1EADn 2 chi\u1EC1u. 20 ph\xFAt Teil 3 + \xF4n c\u1EE5m t\u1EEB n\u1ED1i \xFD.",
    output: "1 file ghi \xE2m m\u1ED7i ng\xE0y; ghi 3 l\u1ED7i l\u1EB7p l\u1EA1i nh\u1EA5t v\xE0o s\u1ED5 l\u1ED7i."
  }
];
const PHASES = [
  {
    name: "Giai \u0111o\u1EA1n 1 \xB7 V\xE1 B1",
    from: 1,
    to: 14,
    goal: "Bi\u1EBFt \u0111i\u1EC3m xu\u1EA5t ph\xE1t b\u1EB1ng \u0111\u1EC1 m\u1EABu. H\u1ECDc 4 ch\u1EE7 \u0111\u1EC1 t\u1EEB v\u1EF1ng \u0111\u1EA7u (72 c\u1EE5m), n\u1EAFm khung tri\u1EC3n khai \xFD, vi\u1EBFt \u0111\u01B0\u1EE3c email \u0111\u1EE7 b\u1ED1 c\u1EE5c."
  },
  {
    name: "Giai \u0111o\u1EA1n 2 \xB7 K\u1EF9 thu\u1EADt",
    from: 15,
    to: 35,
    goal: "X\u1EED l\xFD s\xE2u t\u1EEBng ph\u1EA7n thi. H\u1ECDc \u0111\u1EE7 10 ch\u1EE7 \u0111\u1EC1 (180 c\u1EE5m), thu\u1ED9c khung email v\xE0 7 b\xE0i n\xF3i Teil 1. \u0110\u1ECDc + Nghe \u0111\u1EA1t 55\u201360% khi b\u1EA5m gi\u1EDD."
  },
  {
    name: "Giai \u0111o\u1EA1n 3 \xB7 \u0110\u1EC1 th\u1EADt",
    from: 36,
    to: 49,
    goal: "2 \u0111\u1EC1 thi th\u1EED tr\u1ECDn v\u1EB9n m\u1ED7i tu\u1EA7n, ch\u1EEFa k\u1EF9, h\u1ECDc l\u1EA1i \u0111\xFAng l\u1ED7i l\u1EB7p l\u1EA1i. N\xF3i \u0111\u1EE7 15 ph\xFAt kh\xF4ng b\xED \xFD."
  },
  {
    name: "Giai \u0111o\u1EA1n 4 \xB7 N\u01B0\u1EDBc r\xFAt",
    from: 50,
    to: 60,
    goal: "Ch\u1EC9 \xF4n \u0111i\u1EC3m y\u1EBFu v\xE0 l\u1ED7i l\u1EB7p l\u1EA1i, kh\xF4ng h\u1ECDc m\u1EDBi sau Ng\xE0y 54. Thi th\u1EED cu\u1ED1i Ng\xE0y 57. Ng\xE0y 59\u201360 h\u1ECDc nh\u1EB9, ng\u1EE7 \u0111\u1EE7."
  }
];
const EXAM_PARTS = [
  { part: "Lesen (\u0110\u1ECDc)", time: "90 ph\xFAt chung", points: 75, note: "3 ph\u1EA7n, 20 c\xE2u: n\u1ED1i ti\xEAu \u0111\u1EC1, tr\u1EAFc nghi\u1EC7m chi ti\u1EBFt, n\u1ED1i th\xF4ng tin." },
  { part: "Sprachbausteine", time: "chung kh\u1ED1i \u0110\u1ECDc", points: 30, note: "2 \u0111o\u1EA1n \u0111i\u1EC1n t\u1EEB: 10 c\xE2u ng\u1EEF ph\xE1p + 10 c\xE2u t\u1EEB v\u1EF1ng. Ph\u1EA7n d\u1EC5 l\u1EA5y \u0111i\u1EC3m nh\u1EA5t." },
  { part: "H\xF6ren (Nghe)", time: "kho\u1EA3ng 20 ph\xFAt", points: 75, note: "3 ph\u1EA7n, 20 c\xE2u. M\u1ED7i b\xE0i ch\u1EC9 nghe 1 l\u1EA7n duy nh\u1EA5t." },
  { part: "Schreiben (Vi\u1EBFt)", time: "30 ph\xFAt", points: 45, note: "1 email b\xE1n trang tr\u1ECDng, ch\u1ECDn \u0111\u1EC1 A ho\u1EB7c B, t\u1ED1i thi\u1EC3u 150 t\u1EEB, x\u1EED l\xFD 3 \xFD g\u1EE3i \xFD (Leitpunkte)." },
  { part: "Sprechen (N\xF3i)", time: "15 ph\xFAt + 20 ph\xFAt chu\u1EA9n b\u1ECB", points: 75, note: "Thi theo c\u1EB7p, 3 ph\u1EA7n, m\u1ED7i ph\u1EA7n 25 \u0111i\u1EC3m: k\u1EC3 v\u1EC1 tr\u1EA3i nghi\u1EC7m \u2014 th\u1EA3o lu\u1EADn \u2014 c\xF9ng l\xEAn k\u1EBF ho\u1EA1ch." }
];
const IDEA_FRAMEWORK = [
  { step: "1. Meinung \u2014 N\xEAu \xFD ki\u1EBFn", sample: "Ich bin der Meinung, dass... / Meiner Meinung nach ist es sinnvoll, dass...", fn: "M\u1EDF \u0111\u1EA7u r\xF5 r\xE0ng, gi\xE1m kh\u1EA3o bi\u1EBFt ngay l\u1EADp tr\u01B0\u1EDDng c\u1EE7a m\xECnh." },
  { step: "2. Grund 1 + Beispiel", sample: "Ein wichtiger Grund daf\xFCr ist, dass... Zum Beispiel... / Das sieht man daran, dass...", fn: "L\xFD do m\u1EA1nh nh\u1EA5t + 1 v\xED d\u1EE5 c\u1EE5 th\u1EC3 (s\u1ED1 li\u1EC7u, tr\u1EA3i nghi\u1EC7m c\xE1 nh\xE2n \u0111\u1EC1u \u0111\u01B0\u1EE3c)." },
  { step: "3. Grund 2", sample: "Au\xDFerdem spielt es eine gro\xDFe Rolle, dass... / Ein weiterer Vorteil ist, dass...", fn: "L\xFD do th\u1EE9 hai, nh\xECn t\u1EEB g\xF3c kh\xE1c: ti\u1EC1n b\u1EA1c, th\u1EDDi gian, s\u1EE9c kh\u1ECFe, x\xE3 h\u1ED9i." },
  { step: "4. Gegenargument", sample: "Andererseits muss man bedenken, dass... Trotzdem \xFCberwiegen f\xFCr mich die Vorteile.", fn: "Nh\u1EAFc m\u1EB7t tr\xE1i r\u1ED3i quay l\u1EA1i l\u1EADp tr\u01B0\u1EDDng \u2014 \u0111\xE2y l\xE0 d\u1EA5u hi\u1EC7u B2 m\xE0 gi\xE1m kh\u1EA3o t\xECm." },
  { step: "5. Fazit \u2014 K\u1EBFt lu\u1EADn", sample: "Insgesamt denke ich, dass... / Aus diesen Gr\xFCnden bin ich daf\xFCr, dass...", fn: "Ch\u1ED1t l\u1EA1i 1 c\xE2u, nh\u1EAFc l\u1EA1i \xFD ki\u1EBFn \u1EDF b\u01B0\u1EDBc 1 b\u1EB1ng t\u1EEB kh\xE1c." }
];
const CONNECTORS = [
  "zun\xE4chst",
  "au\xDFerdem",
  "dar\xFCber hinaus",
  "jedoch",
  "trotzdem",
  "deshalb",
  "aus diesem Grund",
  "im Gegensatz dazu",
  "einerseits \u2013 andererseits",
  "zum Beispiel",
  "meiner Meinung nach",
  "insgesamt",
  "abschlie\xDFend",
  "im Vergleich zu",
  "nicht nur \u2013 sondern auch"
];
const GRAMMAR_TOPICS = [
  { topic: "Nebensatz: weil, dass, obwohl, wenn, als, w\xE4hrend, damit", example: "Obwohl der Kurs teuer ist, lohnt er sich, weil man viel lernt." },
  { topic: "Passiv (hi\u1EC7n t\u1EA1i + qu\xE1 kh\u1EE9)", example: "Die Anmeldung wird online ausgef\xFCllt. Das Formular wurde gestern abgeschickt." },
  { topic: "Konjunktiv II (l\u1ECBch s\u1EF1, gi\u1EA3 \u0111\u1ECBnh)", example: "Ich h\xE4tte gern mehr Informationen. Es w\xE4re besser, wenn der Kurs abends stattf\xE4nde." },
  { topic: "Relativsatz", example: "Das ist der Lehrer, der uns am besten geholfen hat." },
  { topic: "\u0110\u1ED9ng t\u1EEB + gi\u1EDBi t\u1EEB c\u1ED1 \u0111\u1ECBnh", example: "sich interessieren f\xFCr, warten auf, sich beschweren \xFCber, teilnehmen an, sich freuen auf/\xFCber" },
  { topic: "Infinitiv mit zu / um... zu / ohne... zu", example: "Ich lerne Deutsch, um in Deutschland zu arbeiten." },
  { topic: "So s\xE1nh: je... desto, als ob", example: "Je mehr man \xFCbt, desto sicherer wird man." },
  { topic: "Gi\xE1n ti\u1EBFp: c\xE2u h\u1ECFi kh\xF4ng c\xF3 t\u1EEB h\u1ECFi", example: "K\xF6nnten Sie mir sagen, ob der Kurs noch Pl\xE4tze frei hat?" }
];
const EMAIL_FRAME = [
  { part: "1. Betreff", sample: "Betreff: Anfrage zu... / Beschwerde \xFCber..." },
  { part: "2. Anrede", sample: "Sehr geehrte Damen und Herren, (ch\u01B0a bi\u1EBFt t\xEAn) / Sehr geehrte Frau ..., / Sehr geehrter Herr ...," },
  { part: "3. L\xFD do vi\u1EBFt", sample: "Ich schreibe Ihnen, weil... / Mit gro\xDFem Interesse habe ich Ihre Anzeige gelesen und..." },
  { part: "4. Th\xE2n b\xE0i", sample: "M\u1ED7i Leitpunkt = 1 \u0111o\u1EA1n 2\u20133 c\xE2u. B\u1EAFt \u0111\u1EA7u \u0111o\u1EA1n b\u1EB1ng: Zun\xE4chst m\xF6chte ich fragen, ob... / Au\xDFerdem interessiert mich, ob... / Schlie\xDFlich w\xE4re es wichtig zu wissen, ob..." },
  { part: "5. C\xE2u k\u1EBFt", sample: "\xDCber eine baldige Antwort w\xFCrde ich mich sehr freuen. F\xFCr Ihre Bem\xFChungen danke ich Ihnen im Voraus." },
  { part: "6. Gru\xDFformel", sample: "Mit freundlichen Gr\xFC\xDFen + h\u1ECD t\xEAn \u0111\u1EA7y \u0111\u1EE7" }
];
const EMAIL_SAMPLES = [
  {
    title: "B\xE0i m\u1EABu 1 \u2014 Th\u01B0 h\u1ECFi th\xF4ng tin (Anfrage)",
    words: "kho\u1EA3ng 185 t\u1EEB",
    situation: "B\u1EA1n \u0111\u1ECDc \u0111\u01B0\u1EE3c qu\u1EA3ng c\xE1o kh\xF3a h\u1ECDc ti\u1EBFng \u0110\u1EE9c bu\u1ED5i t\u1ED1i c\u1EE7a m\u1ED9t trung t\xE2m v\xE0 mu\u1ED1n h\u1ECFi th\xF4ng tin tr\u01B0\u1EDBc khi \u0111\u0103ng k\xFD. Leitpunkte: (1) h\u1ECFi l\u1ECBch h\u1ECDc v\xE0 th\u1EDDi l\u01B0\u1EE3ng kh\xF3a h\u1ECDc, (2) h\u1ECFi h\u1ECDc ph\xED v\xE0 t\xE0i li\u1EC7u, (3) h\u1ECFi kh\u1EA3 n\u0103ng h\u1ECDc th\u1EED.",
    body: `Betreff: Anfrage zum Deutschkurs am Abend

Sehr geehrte Damen und Herren,

mit gro\xDFem Interesse habe ich Ihre Anzeige f\xFCr den Deutschkurs auf dem Niveau B2 gelesen. Da ich mich zurzeit auf eine Pr\xFCfung vorbereite, schreibe ich Ihnen, weil ich noch einige Fragen zu diesem Kurs habe.

Zun\xE4chst m\xF6chte ich fragen, an welchen Tagen der Kurs stattfindet und wie lange er insgesamt dauert. Ich arbeite bis 17 Uhr, deshalb w\xE4re es f\xFCr mich wichtig zu wissen, ob der Unterricht wirklich erst um 18 Uhr beginnt.

Au\xDFerdem interessiert mich, wie viel der Kurs kostet und ob die B\xFCcher im Preis enthalten sind. Gibt es vielleicht eine Erm\xE4\xDFigung, wenn man den ganzen Kurs im Voraus bezahlt?

Schlie\xDFlich w\xFCrde ich gern wissen, ob ich vor der Anmeldung an einer kostenlosen Probestunde teilnehmen kann. So k\xF6nnte ich besser entscheiden, ob der Kurs zu meinem Lernziel passt.

\xDCber eine baldige Antwort w\xFCrde ich mich sehr freuen. F\xFCr Ihre Bem\xFChungen danke ich Ihnen im Voraus.

Mit freundlichen Gr\xFC\xDFen
Nguyen Van An`,
    note: "\u0110i\u1EC3m m\u1EA1nh: \u0111\u1EE7 3 Leitpunkte th\xE0nh 3 \u0111o\u1EA1n ri\xEAng, c\xF3 c\xE2u gi\xE1n ti\u1EBFp (ob...), Konjunktiv II l\u1ECBch s\u1EF1 (w\xFCrde ich gern wissen), t\u1EEB n\u1ED1i zun\xE4chst / au\xDFerdem / schlie\xDFlich / deshalb. Khi thi, gi\u1EEF nguy\xEAn b\u1ED9 khung c\xE2u n\xE0y, ch\u1EC9 thay n\u1ED9i dung Leitpunkte. T\xEAn k\xFD \u201CNguyen Van An\u201D l\xE0 t\xEAn m\u1EABu trong l\u1ED9 tr\xECnh \u2014 thay b\u1EB1ng t\xEAn c\u1EE7a anh khi luy\u1EC7n."
  },
  {
    title: "B\xE0i m\u1EABu 2 \u2014 Th\u01B0 khi\u1EBFu n\u1EA1i (Beschwerde)",
    words: "kho\u1EA3ng 190 t\u1EEB",
    situation: "B\u1EA1n \u0111\u1EB7t 3 \u0111\xEAm t\u1EA1i m\u1ED9t kh\xE1ch s\u1EA1n nh\u01B0ng ph\xF2ng \u1ED3n, n\u01B0\u1EDBc n\xF3ng kh\xF4ng c\xF3 v\xE0 b\u1EEFa s\xE1ng kh\xF4ng \u0111\xFAng nh\u01B0 qu\u1EA3ng c\xE1o. Leitpunkte: (1) m\xF4 t\u1EA3 nh\u1EEFng v\u1EA5n \u0111\u1EC1 g\u1EB7p ph\u1EA3i, (2) n\xF3i r\xF5 \u0111i\u1EC1u \u0111\xF3 \u1EA3nh h\u01B0\u1EDFng th\u1EBF n\xE0o \u0111\u1EBFn k\u1EF3 ngh\u1EC9, (3) y\xEAu c\u1EA7u h\u01B0\u1EDBng gi\u1EA3i quy\u1EBFt.",
    body: `Betreff: Beschwerde \xFCber meinen Aufenthalt vom 10. bis 13. Oktober

Sehr geehrte Damen und Herren,

vom 10. bis 13. Oktober war ich Gast in Ihrem Hotel. Leider muss ich mich \xFCber mehrere Probleme beschweren, die in Ihrer Werbung ganz anders beschrieben waren.

Zun\xE4chst war mein Zimmer direkt an einer lauten Stra\xDFe, obwohl ich bei der Buchung ausdr\xFCcklich um ein ruhiges Zimmer gebeten hatte. Au\xDFerdem gab es zwei Tage lang kein warmes Wasser, und das Fr\xFChst\xFCck bestand nur aus Brot und Kaffee, obwohl ein gro\xDFes Buffet versprochen worden war.

Wie Sie sich vorstellen k\xF6nnen, konnte ich mich in diesen drei Tagen kaum erholen. Ich bin extra in Ihr Hotel gekommen, um mich nach einer anstrengenden Arbeitszeit zu entspannen. Stattdessen war ich jeden Morgen m\xFCde und ver\xE4rgert.

Aus diesen Gr\xFCnden bitte ich Sie um eine Preiserm\xE4\xDFigung von 30 Prozent f\xFCr meinen Aufenthalt. Ich hoffe, dass wir eine faire L\xF6sung finden und ich auf eine Klage verzichten kann.

\xDCber eine Antwort innerhalb von zwei Wochen w\xFCrde ich mich freuen.

Mit freundlichen Gr\xFC\xDFen
Nguyen Van An`,
    note: "C\u1EE5m t\u1EEB ru\u1ED9t cho th\u01B0 khi\u1EBFu n\u1EA1i: leider muss ich mich beschweren \xFCber... / entgegen der Beschreibung... / obwohl ich ausdr\xFCcklich darum gebeten hatte... / statt dessen... / aus diesen Gr\xFCnden bitte ich Sie um... / ich erwarte eine L\xF6sung bis... / f\xFCr Ihr Verst\xE4ndnis danke ich Ihnen."
  }
];
const WRITING_CHECKLIST = [
  "\u0110\u1EE7 3 Leitpunkte ch\u01B0a? \u0110\xE1nh tick t\u1EEBng \xFD ngay tr\xEAn \u0111\u1EC1.",
  "\u0110\u1EE7 150 t\u1EEB ch\u01B0a? (M\u1EE5c ti\xEAu an to\xE0n: 170\u2013200 t\u1EEB.)",
  "C\xF3 Betreff, Anrede, Gru\xDFformel \u0111\xFAng chu\u1EA9n b\xE1n trang tr\u1ECDng ch\u01B0a?",
  "M\u1ED7i c\xE2u ph\u1EE5 (weil, dass, ob, obwohl...): \u0111\u1ED9ng t\u1EEB \u0111\xE3 v\u1EC1 cu\u1ED1i ch\u01B0a?",
  "C\xF3 \xEDt nh\u1EA5t 3 t\u1EEB n\u1ED1i kh\xE1c nhau v\xE0 1 c\xE2u Konjunktiv II l\u1ECBch s\u1EF1 ch\u01B0a?",
  "T\xEAn ng\u01B0\u1EDDi nh\u1EADn v\xE0 x\u01B0ng h\xF4 c\xF3 nh\u1EA5t qu\xE1n t\u1EEB \u0111\u1EA7u \u0111\u1EBFn cu\u1ED1i kh\xF4ng?"
];
const WRITING_TIMING = [
  { minutes: "0\u20133", task: "\u0110\u1ECDc c\u1EA3 2 \u0111\u1EC1, ch\u1ECDn \u0111\u1EC1 quen h\u01A1n. G\u1EA1ch ch\xE2n Leitpunkte, \u0111\xE1nh s\u1ED1 1-2-3." },
  { minutes: "3\u20136", task: "V\u1EA1ch d\xE0n \xFD: m\u1ED7i Leitpunkt 2 \xFD nh\u1ECF, ghi t\u1EEB kh\xF3a \u2014 kh\xF4ng vi\u1EBFt c\xE2u ho\xE0n ch\u1EC9nh." },
  { minutes: "6\u201326", task: "Vi\u1EBFt theo khung 6 ph\u1EA7n. B\xED \xFD n\xE0o th\xEC b\u1ECF qua, quay l\u1EA1i sau \u2014 \u0111\u1EEBng d\u1EEBng qu\xE1 1 ph\xFAt." },
  { minutes: "26\u201330", task: "Soi l\u1ED7i b\u1EB1ng checklist, \u0111\u1EBFm s\u1ED1 t\u1EEB." }
];
const SPEAKING_PARTS = [
  {
    teil: "Teil 1 \u2014 \xDCber Erfahrungen sprechen",
    req: "Ch\u1ECDn 1 ch\u1EE7 \u0111\u1EC1 trong c\xE1c ch\u1EE7 \u0111\u1EC1 gi\xE1m kh\u1EA3o \u0111\u01B0a, tr\xECnh b\xE0y kho\u1EA3ng 1,5\u20132 ph\xFAt, sau \u0111\xF3 tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi ph\u1EE5.",
    tip: "Ph\u1EA7n n\xE0y chu\u1EA9n b\u1ECB tr\u01B0\u1EDBc \u0111\u01B0\u1EE3c 100%. H\u1ECDc thu\u1ED9c 7 b\xE0i m\u1EABu, b\u1ED1c th\u0103m b\xE0i n\xE0o n\xF3i b\xE0i \u0111\xF3."
  },
  {
    teil: "Teil 2 \u2014 Diskussion",
    req: "Th\u1EA3o lu\u1EADn v\u1EDBi b\u1EA1n thi v\u1EC1 1 ch\u1EE7 \u0111\u1EC1 c\xF3 2 m\u1EB7t (th\u01B0\u1EDDng k\xE8m 1 \u0111o\u1EA1n tr\xEDch ng\u1EAFn).",
    tip: "D\xF9ng khung tri\u1EC3n khai \xFD 5 b\u01B0\u1EDBc + c\u1EE5m t\u1EEB tranh lu\u1EADn. Ph\u1EA3i ph\u1EA3n h\u1ED3i l\u1EA1i \xFD c\u1EE7a b\u1EA1n thi, kh\xF4ng n\xF3i \u0111\u1ED9c tho\u1EA1i."
  },
  {
    teil: "Teil 3 \u2014 Gemeinsam etwas planen",
    req: "C\xF9ng b\u1EA1n thi l\xEAn k\u1EBF ho\u1EA1ch cho 1 vi\u1EC7c c\u1EE5 th\u1EC3 (t\u1ED5 ch\u1EE9c s\u1EF1 ki\u1EC7n, gi\xFAp \u0111\u1EE1 ai \u0111\xF3, chuy\u1EBFn \u0111i...).",
    tip: "\u0110\u1EC1 xu\u1EA5t \u2014 h\u1ECFi \xFD ki\u1EBFn \u2014 th\u1ECFa thu\u1EADn \u2014 ch\u1ED1t l\u1EA1i. Ng\u01B0\u1EDDi ch\u1ED1t \u0111\u01B0\u1EE3c k\u1EBF ho\u1EA1ch r\xF5 r\xE0ng l\xE0 ng\u01B0\u1EDDi l\u1EA5y \u0111i\u1EC3m."
  }
];
const PHRASES_TEIL2 = [
  { group: "N\xEAu \xFD ki\u1EBFn", phrases: "Ich bin der Meinung, dass... / Meiner Erfahrung nach... / Ich finde es wichtig, dass..." },
  { group: "\u0110\u1ED3ng \xFD", phrases: "Da hast du recht. / Das sehe ich auch so. / Genau, au\xDFerdem..." },
  { group: "Ph\u1EA3n \u0111\u1ED1i l\u1ECBch s\u1EF1", phrases: "Das stimmt zwar, aber... / Ich sehe das ein bisschen anders, weil... / Bist du sicher, dass...?" },
  { group: "K\xE9o d\xE0i th\u1EDDi gian khi b\xED", phrases: "Das ist eine gute Frage. Lass mich kurz \xFCberlegen... / Wie soll ich das sagen... / Ein Beispiel daf\xFCr w\xE4re..." }
];
const PHRASES_TEIL3 = [
  { group: "\u0110\u1EC1 xu\u1EA5t", phrases: "Ich schlage vor, dass wir... / Wie w\xE4re es, wenn wir...? / Was h\xE4ltst du davon, wenn...?" },
  { group: "H\u1ECFi \xFD ki\u1EBFn", phrases: "Was meinst du dazu? / Passt dir der Termin? / Hast du eine bessere Idee?" },
  { group: "Th\u1ECFa thu\u1EADn v\xE0 ch\u1ED1t", phrases: "Gut, dann machen wir es so: ... / Zusammengefasst: Du \xFCbernimmst..., und ich k\xFCmmere mich um... / Abgemacht!" }
];
const SPEAKING_SAMPLES = [
  {
    title: "B\xE0i 1 \u2014 Ein Buch, das ich gelesen habe",
    body: `Ich m\xF6chte \xFCber ein Buch sprechen, das ich vor zwei Jahren gelesen habe. Es hei\xDFt \u201EDer kleine Prinz" und wurde von Antoine de Saint-Exup\xE9ry geschrieben.

In dem Buch geht es um einen kleinen Prinzen, der von einem fremden Planeten kommt und auf die Erde reist. Unterwegs trifft er viele verschiedene Menschen und lernt dabei, was im Leben wirklich wichtig ist: Freundschaft, Liebe und Verantwortung.

Am besten hat mir eine Aussage gefallen: Man sieht nur mit dem Herzen gut. Obwohl das Buch wie ein Kinderbuch aussieht, stecken sehr tiefe Gedanken darin. Ich habe es schon zweimal gelesen, und jedes Mal habe ich etwas Neues entdeckt.

Ich kann dieses Buch jedem empfehlen, weil es kurz, leicht zu lesen und trotzdem sehr bewegend ist.`
  },
  {
    title: "B\xE0i 2 \u2014 Ein Film, der mich beeindruckt hat",
    body: `Ich erz\xE4hle gern von einem Film, der mich sehr beeindruckt hat. Er hei\xDFt \u201EZiemlich beste Freunde" und kommt aus Frankreich.

Der Film erz\xE4hlt die wahre Geschichte eines reichen Mannes, der nach einem Unfall im Rollstuhl sitzt. Er stellt einen jungen Mann aus einem armen Viertel als Pfleger ein, obwohl dieser gar keine Erfahrung hat. Am Anfang sind die beiden sehr unterschiedlich, aber mit der Zeit werden sie enge Freunde und ver\xE4ndern das Leben des anderen.

Besonders gut gefallen hat mir, dass der Film traurige und lustige Szenen verbindet. Man muss lachen und gleichzeitig nachdenken.

Meiner Meinung nach zeigt der Film, dass Freundschaft keine Grenzen kennt \u2014 weder Geld noch Herkunft spielen eine Rolle. Deshalb geh\xF6rt er zu meinen Lieblingsfilmen.`
  },
  {
    title: "B\xE0i 3 \u2014 Eine Reise, die ich nie vergesse",
    body: `Ich m\xF6chte \xFCber eine Reise sprechen, die ich nie vergessen werde. Vor drei Jahren bin ich mit zwei Freunden nach Da Lat gefahren, eine Stadt in den Bergen von Vietnam.

Wir sind fr\xFCh am Morgen losgefahren und haben unterwegs Wasserf\xE4lle, Kaffeeplantagen und alte franz\xF6sische H\xE4user besichtigt. Das Wetter war k\xFChl und angenehm, ganz anders als in meiner Heimatstadt. Am Abend sind wir \xFCber den Nachtmarkt gelaufen und haben gegrillte Spezialit\xE4ten probiert.

Besonders sch\xF6n war ein Morgen, an dem wir \xFCber den Wolken standen und den Sonnenaufgang beobachtet haben. In diesem Moment habe ich mich unglaublich frei gef\xFChlt.

Diese Reise werde ich nie vergessen, weil ich dort nicht nur die Natur, sondern auch die gemeinsame Zeit mit meinen Freunden genossen habe.`
  },
  {
    title: "B\xE0i 4 \u2014 Eine Person, die mich beeinflusst hat",
    body: `Die Person, die mich am meisten beeinflusst hat, ist meine Mutter. Sie arbeitet als Lehrerin und hat \xFCber drei\xDFig Jahre lang Kinder unterrichtet.

Von ihr habe ich gelernt, dass man f\xFCr seine Ziele Geduld braucht. Als ich ein Kind war, hatte ich oft schnell aufgegeben, wenn etwas schwierig wurde. Meine Mutter hat dann immer gesagt: Niemand ist von Anfang an gut, man wird nur durch \xDCbung besser. Sie selbst hat mit vierzig Jahren noch einen Computerkurs besucht, obwohl sie Angst davor hatte.

Dieses Vorbild hilft mir heute noch, zum Beispiel beim Deutschlernen. Wenn ich keine Fortschritte sehe, erinnere ich mich an ihre Worte und mache weiter.

Ich bin sehr dankbar, dass ich so eine Mutter habe, und ich hoffe, dass ich sp\xE4ter genauso geduldig mit meinen Kindern sein kann.`
  },
  {
    title: "B\xE0i 5 \u2014 Ein Fest, das ich gern feiere",
    body: `Ich m\xF6chte \xFCber das wichtigste Fest in meinem Land sprechen: das Tet-Fest, also das vietnamesische Neujahrsfest. Es findet meistens Ende Januar oder Anfang Februar statt.

Schon Wochen vorher bereiten sich die Familien vor: Das Haus wird geputzt, es wird viel eingekauft, und man kocht traditionelle Gerichte wie den Klebreiskuchen Banh Chung. Am Festtag selbst besucht man Verwandte, w\xFCnscht sich gegenseitig Gesundheit und Gl\xFCck, und die Kinder bekommen Geld in roten Umschl\xE4gen.

F\xFCr mich ist Tet besonders, weil die ganze Familie zusammenkommt. Viele meiner Verwandten leben weit weg, aber zu Tet sitzen wir alle an einem Tisch, essen gemeinsam und erz\xE4hlen von fr\xFCher.

Obwohl die Vorbereitung anstrengend ist, m\xF6chte ich dieses Fest nie missen, denn es verbindet die Familie und die Tradition miteinander.`
  },
  {
    title: "B\xE0i 6 \u2014 Mein Hobby",
    body: `Mein gr\xF6\xDFtes Hobby ist Radfahren. Ich fahre seit ungef\xE4hr f\xFCnf Jahren regelm\xE4\xDFig Rad, meistens am Wochenende mit einer kleinen Gruppe von Freunden.

Angefangen habe ich, weil ich nach der Arbeit zu viel sa\xDF und mich oft m\xFCde f\xFChlte. Am Anfang war schon eine Stunde anstrengend, aber heute schaffe ich Strecken von f\xFCnfzig Kilometern ohne gro\xDFe Probleme. Unterwegs entdecken wir neue Wege, kleine D\xF6rfer und sch\xF6ne Landschaften, die man mit dem Auto nie sehen w\xFCrde.

Radfahren ist f\xFCr mich mehr als Sport. Es h\xE4lt mich gesund, baut Stress ab, und ich habe dadurch viele neue Freunde kennengelernt.

Ich kann dieses Hobby jedem empfehlen, der sich mehr bewegen m\xF6chte. Man braucht kein teures Rad \u2014 wichtig ist nur, dass man anf\xE4ngt.`
  },
  {
    title: "B\xE0i 7 \u2014 Eine Erfahrung beim Lernen",
    body: `Ich m\xF6chte \xFCber eine Erfahrung sprechen, die ich beim Deutschlernen gemacht habe. Als ich angefangen habe, dachte ich, dass Grammatik das Wichtigste ist. Deshalb habe ich monatelang nur Regeln gelernt und fast nie gesprochen.

Eines Tages wollte ich in einem deutschen Caf\xE9 etwas bestellen, aber ich konnte keinen einzigen Satz frei sagen. In diesem Moment habe ich verstanden, dass eine Sprache nur lebt, wenn man sie benutzt. Von da an habe ich meine Methode ge\xE4ndert: Ich habe jeden Tag laut gesprochen, Fehler akzeptiert und mir deutsche Videos angesehen.

Diese Erfahrung hat mir gezeigt, dass Fehler kein Problem sind. Im Gegenteil: Sie zeigen, wo man noch lernen muss.

Heute plane ich sogar, eine B2-Pr\xFCfung zu machen. Darauf bin ich stolz, weil ich meinen eigenen Lernweg gefunden habe.`
  }
];
const FOLLOWUP_QUESTIONS = [
  { q: "Warum haben Sie gerade dieses Thema gew\xE4hlt?", a: "N\xF3i l\xFD do c\xE1 nh\xE2n + 1 k\u1EF7 ni\u1EC7m ng\u1EAFn. \u0110\xE2y l\xE0 c\xE2u g\u1EA7n nh\u01B0 ch\u1EAFc ch\u1EAFn xu\u1EA5t hi\u1EC7n." },
  { q: "Hat sich Ihre Meinung dazu im Laufe der Zeit ge\xE4ndert?", a: "D\xF9ng m\u1EABu: Fr\xFCher dachte ich..., aber heute sehe ich das anders, weil..." },
  { q: "K\xF6nnen Sie das auch anderen empfehlen?", a: "\u0110\u1ED3ng \xFD ho\u1EB7c \u0111\u1ED3ng \xFD c\xF3 \u0111i\u1EC1u ki\u1EC7n + l\xFD do. D\xF9ng l\u1EA1i b\u01B0\u1EDBc 2 v\xE0 4 c\u1EE7a khung tri\u1EC3n khai \xFD." },
  { q: "Was w\xFCrden Sie heute anders machen?", a: "D\xF9ng Konjunktiv II: Heute w\xFCrde ich fr\xFCher anfangen und weniger Angst vor Fehlern haben." }
];
const SCORE_MILESTONES = [
  { label: "Ng\xE0y 1 (ch\u1EA9n \u0111o\xE1n)", day: 1 },
  { label: "Ng\xE0y 14 (m\u1ED1c 1)", day: 14 },
  { label: "Ng\xE0y 28 (m\u1ED1c 2)", day: 28 },
  { label: "Ng\xE0y 36\u201337 (thi th\u1EED 1)", day: 36 },
  { label: "Ng\xE0y 43\u201344 (thi th\u1EED 2)", day: 43 },
  { label: "Ng\xE0y 48\u201349 (thi th\u1EED 3)", day: 48 },
  { label: "Ng\xE0y 57 (thi th\u1EED cu\u1ED1i)", day: 57 }
];
const EXAM_CHECKLIST = [
  "Thu\u1ED9c khung email v\xE0 vi\u1EBFt xong 1 email trong 28 ph\xFAt khi b\u1EA5m gi\u1EDD.",
  "N\xF3i \u0111\u01B0\u1EE3c c\u1EA3 7 b\xE0i Teil 1 m\xE0 kh\xF4ng nh\xECn gi\u1EA5y, m\u1ED7i b\xE0i 1,5\u20132 ph\xFAt.",
  "N\xF3i Teil 2 v\xE0 Teil 3 li\u1EC1n m\u1EA1ch 5 ph\xFAt kh\xF4ng kh\u1EF1ng qu\xE1 3 gi\xE2y.",
  "\xD4n h\u1EBFt s\u1ED5 l\u1ED7i \xEDt nh\u1EA5t 2 l\u01B0\u1EE3t trong tu\u1EA7n cu\u1ED1i.",
  "Ng\u1EE7 \u0111\u1EE7 7\u20138 ti\u1EBFng trong 2 \u0111\xEAm tr\u01B0\u1EDBc ng\xE0y thi.",
  "Mang theo gi\u1EA5y t\u1EDD t\xF9y th\xE2n, th\u01B0 m\u1EDDi thi, 2 c\xE2y b\xFAt, \u0111\u1ED3ng h\u1ED3 \u0111eo tay (\u0111i\u1EC7n tho\u1EA1i b\u1ECB c\u1EA5m trong ph\xF2ng thi)."
];
const EXAM_DAY_TIPS = [
  "Kh\u1ED1i \u0110\u1ECDc + Sprachbausteine c\xF3 90 ph\xFAt chung \u2014 t\u1EF1 chia gi\u1EDD nh\u01B0 Ng\xE0y 15 \u0111\xE3 luy\u1EC7n, kh\xF4ng sa \u0111\xE0 v\xE0o 1 c\xE2u kh\xF3 qu\xE1 2 ph\xFAt.",
  "Ph\u1EA7n Nghe ch\u1EC9 ph\xE1t 1 l\u1EA7n \u2014 b\u1ECF qua c\xE2u l\u1EE1, t\u1EADp trung c\xE2u ti\u1EBFp theo.",
  "Ph\u1EA7n Vi\u1EBFt: d\xE0nh 3 ph\xFAt \u0111\u1EA7u g\u1EA1ch ch\xE2n v\xE0 \u0111\xE1nh s\u1ED1 c\xE1c Leitpunkte tr\u01B0\u1EDBc khi vi\u1EBFt ch\u1EEF \u0111\u1EA7u ti\xEAn.",
  "Ba quy t\u1EAFc kh\xF4ng ph\xE1: (1) M\u1ED7i ng\xE0y ph\u1EA3i c\xF3 s\u1EA3n ph\u1EA9m ra \u2014 1 b\xE0i vi\u1EBFt ho\u1EB7c 1 file ghi \xE2m. (2) S\u1ED5 l\u1ED7i l\xE0 t\xE0i li\u1EC7u quan tr\u1ECDng nh\u1EA5t \u2014 \xF4n l\u1EA1i m\u1ED7i Ch\u1EE7 nh\u1EADt. (3) Kh\xF4ng h\u1ECDc t\xE0i li\u1EC7u m\u1EDBi sau Ng\xE0y 49 \u2014 ch\u1EC9 \u0111\u1EC1 m\u1EABu telc v\xE0 s\u1ED5 l\u1ED7i."
];
export {
  CONNECTORS,
  EMAIL_FRAME,
  EMAIL_SAMPLES,
  EXAM_CHECKLIST,
  EXAM_DAY_TIPS,
  EXAM_PARTS,
  FOLLOWUP_QUESTIONS,
  GRAMMAR_TOPICS,
  IDEA_FRAMEWORK,
  PHASES,
  PHRASES_TEIL2,
  PHRASES_TEIL3,
  PLAN_DAYS,
  PLAN_START,
  SCORE_MILESTONES,
  SPEAKING_PARTS,
  SPEAKING_SAMPLES,
  STUDY_BLOCKS,
  WRITING_CHECKLIST,
  WRITING_TIMING
};
