const GRAMMAR_TOPICS_FULL = [
  {
    id: 1,
    name: "Nebens\xE4tze \u2014 C\xE2u ph\u1EE5",
    nameVi: "weil \xB7 dass \xB7 obwohl \xB7 wenn",
    week: 1,
    intro: "\u0110\xE2y l\xE0 n\u1EC1n c\u1EE7a m\u1ECDi c\xE2u B2: gi\xE1m kh\u1EA3o ch\u1EA5m Vi\u1EBFt v\xE0 N\xF3i d\u1EF1a nhi\u1EC1u v\xE0o vi\u1EC7c anh c\xF3 n\xF3i \u0111\u01B0\u1EE3c c\xE2u ph\u1EE5 hay ch\u1EC9 n\xF3i c\xE2u \u0111\u01A1n ng\u1EAFn ki\u1EC3u A2. H\u1ECDc t\u1EEB \u0111\u1EA7u: c\xE2u ph\u1EE5 l\xE0 c\xE2u c\xF3 li\xEAn t\u1EEB (weil, dass, obwohl, wenn...) v\xE0 \u0111\u1ED9ng t\u1EEB chia b\u1ECB \u0111\u1EA9y v\u1EC1 CU\u1ED0I c\xE2u. Thu\u1ED9c \u0111\u01B0\u1EE3c c\u01A1 ch\u1EBF n\xE0y th\xEC 7 ch\u1EE7 \u0111i\u1EC3m c\xF2n l\u1EA1i \u0111\u1EC1u nh\u1EB9 \u0111i.",
    rules: [
      "C\xE2u ch\xEDnh: \u0111\u1ED9ng t\u1EEB chia \u0111\u1EE9ng \u1EDF v\u1ECB tr\xED 2. C\xE2u ph\u1EE5: li\xEAn t\u1EEB m\u1EDF \u0111\u1EA7u, \u0111\u1ED9ng t\u1EEB chia v\u1EC1 cu\u1ED1i c\xE2u.",
      "weil = v\xEC (nguy\xEAn nh\xE2n) \xB7 dass = r\u1EB1ng (sau \u0111\u1ED9ng t\u1EEB n\xF3i/ngh\u0129/bi\u1EBFt) \xB7 obwohl = m\u1EB7c d\xF9 (nh\u01B0\u1EE3ng b\u1ED9, \xFD ng\u01B0\u1EE3c v\u1EDBi c\xE2u ch\xEDnh) \xB7 wenn = khi/n\u1EBFu (\u0111i\u1EC1u ki\u1EC7n, th\xF3i quen l\u1EB7p l\u1EA1i).",
      "N\u1EBFu c\xE2u ph\u1EE5 \u0111\u1EE9ng tr\u01B0\u1EDBc, c\xE2u ch\xEDnh b\u1EAFt \u0111\u1EA7u b\u1EB1ng \u0111\u1ED9ng t\u1EEB: Weil ich m\xFCde bin, gehe ich fr\xFCh ins Bett. (\u0110\u1ED9ng t\u1EEB 'gehe' \u0111\u1EE9ng ngay sau d\u1EA5u ph\u1EA9y.)",
      "Ph\xE2n bi\u1EC7t weil (\u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i) v\u1EDBi denn (\u0111\u1ED9ng t\u1EEB \u1EDF v\u1ECB tr\xED 2, kh\xF4ng \u0111\u1EA3o): Ich bleibe zu Hause, denn ich bin krank."
    ],
    examples: [
      { de: "Ich lerne Deutsch, weil ich in Deutschland arbeiten m\xF6chte.", note: "weil \u2014 \u0111\u1ED9ng t\u1EEB 'm\xF6chte' v\u1EC1 cu\u1ED1i." },
      { de: "Ich glaube, dass der Kurs sehr n\xFCtzlich ist.", note: "dass \u2014 sau \u0111\u1ED9ng t\u1EEB 'glauben'." },
      { de: "Obwohl der Kurs teuer ist, lohnt er sich.", note: "obwohl \u2014 c\xE2u ph\u1EE5 \u0111\u1EE9ng tr\u01B0\u1EDBc, c\xE2u ch\xEDnh \u0111\u1EA3o \u0111\u1ED9ng t\u1EEB l\xEAn \u0111\u1EA7u." },
      { de: "Wenn ich Zeit habe, rufe ich dich an.", note: "wenn \u2014 \u0111i\u1EC1u ki\u1EC7n/th\xF3i quen." }
    ],
    pitfall: "L\u1ED7i gi\u1EBFt \u0111i\u1EC3m s\u1ED1 1 \u1EDF B2: \u0111\u1EC3 \u0111\u1ED9ng t\u1EEB \u1EDF v\u1ECB tr\xED 2 trong c\xE2u ph\u1EE5 (weil ich bin m\xFCde). M\u1ED7i khi n\xF3i/vi\u1EBFt c\xE2u ph\u1EE5, t\u1EF1 h\u1ECFi: \u201C\u0111\u1ED9ng t\u1EEB \u0111\xE3 v\u1EC1 cu\u1ED1i ch\u01B0a?\u201D",
    applyWriting: "Vi\u1EBFt l\u1EA1i b\xE0i email g\u1EA7n nh\u1EA5t: g\u1EA1ch ch\xE2n m\u1ECDi c\xE2u c\xF3 weil/dass/obwohl, ki\u1EC3m tra \u0111\u1ED9ng t\u1EEB t\u1EEBng c\xE2u. Sau \u0111\xF3 vi\u1EBFt th\xEAm 3 c\xE2u m\u1EDBi: 1 c\xE2u weil (l\xFD do vi\u1EBFt th\u01B0), 1 c\xE2u dass (sau 'ich hoffe'), 1 c\xE2u obwohl (nh\u01B0\u1EE3ng b\u1ED9 l\u1ECBch s\u1EF1).",
    applySpeaking: "Tr\u1EA3 l\u1EDDi 3 c\xE2u h\u1ECFi Teil 1 b\u1EB1ng c\xE2u ph\u1EE5, thu \xE2m: Warum lernen Sie Deutsch? (weil...) \xB7 Was denken Sie \xFCber Ihr Hobby? (Ich finde, dass...) \xB7 Feiern Sie Tet gern? (Obwohl..., ...)."
  },
  {
    id: 2,
    name: "Passiv \u2014 Th\u1EC3 b\u1ECB \u0111\u1ED9ng",
    nameVi: "werden + Partizip II",
    week: 2,
    intro: "B\u1ECB \u0111\u1ED9ng l\xE0 c\xE1ch n\xF3i trang tr\u1ECDng, kh\xE1ch quan \u2014 r\u1EA5t hay g\u1EB7p trong \u0111\u1EC1 \u0110\u1ECDc v\xE0 Sprachbausteine, v\xE0 l\xE0 d\u1EA5u hi\u1EC7u B2 r\xF5 r\u1EC7t khi Vi\u1EBFt (m\xF4 t\u1EA3 quy tr\xECnh, s\u1EF1 vi\u1EC7c kh\xF4ng c\u1EA7n n\xEAu ng\u01B0\u1EDDi l\xE0m). H\u1ECDc t\u1EEB c\xF4ng th\u1EE9c g\u1ED1c, ch\u1EC9 c\u1EA7n v\u1EEFng Pr\xE4sens v\xE0 Pr\xE4teritum l\xE0 \u0111\u1EE7 d\xF9ng cho k\u1EF3 thi.",
    rules: [
      "C\xF4ng th\u1EE9c: werden (chia theo th\xEC) + Partizip II \u1EDF cu\u1ED1i c\xE2u. T\xE2n ng\u1EEF c\u1EE7a c\xE2u ch\u1EE7 \u0111\u1ED9ng th\xE0nh ch\u1EE7 ng\u1EEF c\u1EE7a c\xE2u b\u1ECB \u0111\u1ED9ng.",
      "Pr\xE4sens: Das Formular wird online ausgef\xFCllt. \xB7 Pr\xE4teritum: Das Formular wurde gestern abgeschickt.",
      "Ng\u01B0\u1EDDi th\u1EF1c hi\u1EC7n (n\u1EBFu c\u1EA7n n\xEAu): von + Dativ \u2014 Der Brief wurde von der Sekret\xE4rin geschrieben. Th\u01B0\u1EDDng th\xEC b\u1ECF qua lu\xF4n.",
      "Kh\xF4ng ph\u1EA3i \u0111\u1ED9ng t\u1EEB n\xE0o c\u0169ng b\u1ECB \u0111\u1ED9ng \u0111\u01B0\u1EE3c: ph\u1EA3i l\xE0 \u0111\u1ED9ng t\u1EEB c\xF3 t\xE2n ng\u1EEF Akkusativ (transitiv)."
    ],
    examples: [
      { de: "Die Anmeldung wird online ausgef\xFCllt.", note: "Pr\xE4sens \u2014 '\u0111\u01A1n \u0111\u0103ng k\xFD \u0111\u01B0\u1EE3c \u0111i\u1EC1n tr\u1EF1c tuy\u1EBFn'." },
      { de: "Das Paket wurde gestern abgeschickt.", note: "Pr\xE4teritum \u2014 'g\xF3i h\xE0ng \u0111\xE3 \u0111\u01B0\u1EE3c g\u1EEDi \u0111i h\xF4m qua'." },
      { de: "In Vietnam wird viel Reis gegessen.", note: "Ch\u1EE7 ng\u1EEF 'es' b\u1ECB l\u01B0\u1EE3c \u2014 c\xE1ch n\xF3i kh\xE1ch quan r\u1EA5t B2." },
      { de: "Der Kurs wird von einem erfahrenen Lehrer geleitet.", note: "von + Dativ khi c\u1EA7n n\xEAu ng\u01B0\u1EDDi th\u1EF1c hi\u1EC7n." }
    ],
    pitfall: "Nh\u1EA7m werden c\u1EE7a b\u1ECB \u0111\u1ED9ng v\u1EDBi werden c\u1EE7a t\u01B0\u01A1ng lai/qu\xE1 tr\xECnh, v\xE0 qu\xEAn Partizip II \u1EDF cu\u1ED1i. C\u1EE9 th\u1EA5y 'wird/wurde + ... + Partizip II cu\u1ED1i c\xE2u' l\xE0 b\u1ECB \u0111\u1ED9ng.",
    applyWriting: "Trong th\u01B0 khi\u1EBFu n\u1EA1i, \u0111\u1ED5i 3 c\xE2u ch\u1EE7 \u0111\u1ED9ng th\xE0nh b\u1ECB \u0111\u1ED9ng \u0111\u1EC3 gi\u1ECDng v\u0103n kh\xE1ch quan h\u01A1n: 'Man hat mir ein falsches Zimmer gegeben' \u2192 'Mir wurde ein falsches Zimmer gegeben.' Vi\u1EBFt th\xEAm 2 c\xE2u m\xF4 t\u1EA3 quy tr\xECnh \u0111\u0103ng k\xFD kh\xF3a h\u1ECDc b\u1EB1ng b\u1ECB \u0111\u1ED9ng.",
    applySpeaking: "M\xF4 t\u1EA3 1 quy tr\xECnh b\u1EB1ng b\u1ECB \u0111\u1ED9ng khi n\xF3i Teil 1/Teil 3: c\xE1ch t\u1ED5 ch\u1EE9c T\u1EBFt (Das Haus wird geputzt, Banh Chung wird gekocht...) ho\u1EB7c c\xE1ch l\xE0m 1 m\xF3n \u0103n. M\u1EE5c ti\xEAu: 4 c\xE2u b\u1ECB \u0111\u1ED9ng li\u1EC1n m\u1EA1ch."
  },
  {
    id: 3,
    name: "Konjunktiv II",
    nameVi: "l\u1ECBch s\u1EF1 \xB7 gi\u1EA3 \u0111\u1ECBnh \xB7 l\u1EDDi khuy\xEAn",
    week: 3,
    intro: "Konjunktiv II l\xE0 'ch\u1EBF \u0111\u1ED9 m\u1EC1m' c\u1EE7a ti\u1EBFng \u0110\u1EE9c: n\xF3i l\u1ECBch s\u1EF1 (xin ph\xE9p, \u0111\u1EC1 ngh\u1ECB), n\xF3i \u0111i\u1EC1u kh\xF4ng c\xF3 th\u1EADt (gi\u1EA3 \u0111\u1ECBnh) v\xE0 \u0111\u01B0a l\u1EDDi khuy\xEAn. Trong email thi telc, ch\u1EC9 1-2 c\xE2u Konjunktiv II l\u1ECBch s\u1EF1 \u0111\xE3 n\xE2ng h\u1EB3n \u1EA5n t\u01B0\u1EE3ng \u0111\u1ED9 ch\xEDnh x\xE1c; trong N\xF3i, \u0111\xE2y l\xE0 c\xF4ng c\u1EE5 tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi ph\u1EE5 'Was w\xFCrden Sie heute anders machen?'.",
    rules: [
      "D\u1EA1ng c\u1ED1t l\xF5i c\u1EA7n thu\u1ED9c: h\xE4tte (c\xF3), w\xE4re (th\xEC/l\xE0), w\xFCrde + Infinitiv (s\u1EBD \u2014 d\xF9ng cho h\u1EA7u h\u1EBFt \u0111\u1ED9ng t\u1EEB), k\xF6nnte (c\xF3 th\u1EC3), sollte (n\xEAn).",
      "L\u1ECBch s\u1EF1: Ich h\xE4tte gern mehr Informationen. / K\xF6nnten Sie mir sagen, ob...? / Ich w\xFCrde mich freuen, wenn...",
      "Gi\u1EA3 \u0111\u1ECBnh: Wenn ich mehr Zeit h\xE4tte, w\xFCrde ich jeden Tag \xFCben. (\u0110i\u1EC1u ki\u1EC7n kh\xF4ng c\xF3 th\u1EADt \u1EDF hi\u1EC7n t\u1EA1i: h\xE4tte/w\xE4re + w\xFCrde.)",
      "L\u1EDDi khuy\xEAn: An deiner Stelle w\xFCrde ich fr\xFCher anfangen. / Du solltest mehr sprechen."
    ],
    examples: [
      { de: "Ich h\xE4tte gern einen Termin am Vormittag.", note: "L\u1ECBch s\u1EF1 \u2014 thay cho 'ich will' th\xF4." },
      { de: "Es w\xE4re besser, wenn der Kurs abends stattf\xE4nde.", note: "\u0110\u1EC1 xu\u1EA5t nh\u1EB9 nh\xE0ng \u2014 m\u1EABu c\xE2u ru\u1ED9t cho email." },
      { de: "Wenn ich reich w\xE4re, w\xFCrde ich um die Welt reisen.", note: "Gi\u1EA3 \u0111\u1ECBnh tr\xE1i v\u1EDBi hi\u1EC7n t\u1EA1i." },
      { de: "K\xF6nnten Sie mir bitte die Unterlagen schicken?", note: "Nh\u1EDD v\u1EA3 l\u1ECBch s\u1EF1 \u2014 d\xF9ng th\u1EB3ng trong th\u01B0 h\u1ECFi th\xF4ng tin." }
    ],
    pitfall: "D\xF9ng w\xFCrde cho c\u1EA3 haben/sein (sai: w\xFCrde haben \u2192 \u0111\xFAng: h\xE4tte; w\xFCrde sein \u2192 w\xE4re). V\xE0 qu\xEAn r\u1EB1ng sau 'wenn' gi\u1EA3 \u0111\u1ECBnh, \u0111\u1ED9ng t\u1EEB v\u1EABn v\u1EC1 cu\u1ED1i c\xE2u nh\u01B0 m\u1ECDi c\xE2u ph\u1EE5.",
    applyWriting: "So\u1EA1n s\u1EB5n 3 c\xE2u Konjunktiv II 'ru\u1ED9t' cho email v\xE0 d\xF9ng trong m\u1ECDi b\xE0i vi\u1EBFt tu\u1EA7n n\xE0y: c\xE2u m\u1EDF (Ich schreibe Ihnen, weil ich mich f\xFCr ... interessiere \u2014 th\xEAm: Ich h\xE4tte noch einige Fragen), c\xE2u h\u1ECFi l\u1ECBch s\u1EF1 (K\xF6nnten Sie mir sagen, ob...?), c\xE2u k\u1EBFt (\xDCber eine baldige Antwort w\xFCrde ich mich sehr freuen).",
    applySpeaking: "Chu\u1EA9n b\u1ECB c\xE2u tr\u1EA3 l\u1EDDi cho c\xE2u h\u1ECFi ph\u1EE5 kinh \u0111i\u1EC3n: 'Was w\xFCrden Sie heute anders machen?' \u2192 'Heute w\xFCrde ich fr\xFCher anfangen und weniger Angst vor Fehlern haben.' Th\xEAm 1 gi\u1EA3 \u0111\u1ECBnh v\u1EC1 ch\u1EE7 \u0111\u1EC1 b\xE0i n\xF3i c\u1EE7a ng\xE0y (Wenn ich mehr Geld h\xE4tte, w\xFCrde ich...)."
  },
  {
    id: 4,
    name: "Relativs\xE4tze \u2014 M\u1EC7nh \u0111\u1EC1 quan h\u1EC7",
    nameVi: "der \xB7 die \xB7 das n\u1ED1i hai c\xE2u th\xE0nh m\u1ED9t",
    week: 4,
    intro: "Thay v\xEC n\xF3i hai c\xE2u ng\u1EAFn r\u1EDDi r\u1EA1c ('Das ist mein Lehrer. Er hilft mir viel.'), ng\u01B0\u1EDDi B2 g\u1ED9p th\xE0nh m\u1ED9t c\xE2u c\xF3 m\u1EC7nh \u0111\u1EC1 quan h\u1EC7. \u0110\xE2y l\xE0 c\xE1ch nhanh nh\u1EA5t \u0111\u1EC3 c\xE2u v\u0103n/c\xE2u n\xF3i 'd\xE0i v\xE0 x\u1ECBn' h\u01A1n m\xE0 kh\xF4ng c\u1EA7n t\u1EEB kh\xF3 \u2014 ch\u1EC9 c\u1EA7n thu\u1ED9c b\u1EA3ng \u0111\u1EA1i t\u1EEB quan h\u1EC7 theo gi\u1ED1ng v\xE0 c\xE1ch (Kasus).",
    rules: [
      "\u0110\u1EA1i t\u1EEB quan h\u1EC7 gi\u1ED1ng h\u1EC7t m\u1EA1o t\u1EEB x\xE1c \u0111\u1ECBnh (der/die/das, s\u1ED1 nhi\u1EC1u die), nh\u01B0ng \u1EDF Genitiv v\xE0 Dativ s\u1ED1 nhi\u1EC1u th\xEC kh\xE1c: dessen/deren, denen.",
      "Ch\u1ECDn \u0111\u1EA1i t\u1EEB theo GI\u1ED0NG c\u1EE7a danh t\u1EEB \u0111\u1EE9ng tr\u01B0\u1EDBc + C\xC1CH c\u1EE7a n\xF3 trong m\u1EC7nh \u0111\u1EC1 quan h\u1EC7 (n\xF3 l\xE0m ch\u1EE7 ng\u1EEF \u2192 Nominativ, t\xE2n ng\u1EEF \u2192 Akkusativ, sau gi\u1EDBi t\u1EEB/Dativ \u2192 Dativ).",
      "\u0110\u1ED9ng t\u1EEB c\u1EE7a m\u1EC7nh \u0111\u1EC1 quan h\u1EC7 v\u1EC1 cu\u1ED1i c\xE2u, nh\u01B0 m\u1ECDi c\xE2u ph\u1EE5. M\u1EC7nh \u0111\u1EC1 quan h\u1EC7 \u0111\u1EE9ng ngay sau danh t\u1EEB n\xF3 b\u1ED5 ngh\u0129a, ng\u0103n c\xE1ch b\u1EB1ng d\u1EA5u ph\u1EA9y.",
      "C\xF3 gi\u1EDBi t\u1EEB th\xEC gi\u1EDBi t\u1EEB \u0111i c\xF9ng \u0111\u1EA1i t\u1EEB: der Kurs, f\xFCr den ich mich interessiere / die Kollegin, mit der ich arbeite."
    ],
    examples: [
      { de: "Das ist der Lehrer, der uns am besten geholfen hat.", note: "der = Nominativ, l\xE0m ch\u1EE7 ng\u1EEF trong m\u1EC7nh \u0111\u1EC1." },
      { de: "Das Buch, das ich gerade lese, ist sehr spannend.", note: "das = Akkusativ, t\xE2n ng\u1EEF c\u1EE7a 'lese'." },
      { de: "Die Frau, mit der ich gesprochen habe, war sehr nett.", note: "mit + Dativ \u2192 mit der." },
      { de: "Der Kurs, f\xFCr den ich mich angemeldet habe, beginnt im M\xE4rz.", note: "Gi\u1EDBi t\u1EEB f\xFCr \u0111i k\xE8m \u0111\u1EA1i t\u1EEB quan h\u1EC7." }
    ],
    pitfall: "Ch\u1ECDn \u0111\u1EA1i t\u1EEB theo gi\u1ED1ng c\u1EE7a danh t\u1EEB ti\u1EBFng Vi\u1EC7t trong \u0111\u1EA7u thay v\xEC danh t\u1EEB ti\u1EBFng \u0110\u1EE9c \u0111\u1EE9ng tr\u01B0\u1EDBc n\xF3 (das Buch \u2192 das, d\xF9 ti\u1EBFng Vi\u1EC7t kh\xF4ng c\xF3 gi\u1ED1ng). V\xE0 qu\xEAn \u0111\u1EA9y \u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i m\u1EC7nh \u0111\u1EC1.",
    applyWriting: "N\xE2ng c\u1EA5p b\xE0i email: g\u1ED9p 3 c\u1EB7p c\xE2u \u0111\u01A1n th\xE0nh c\xE2u c\xF3 m\u1EC7nh \u0111\u1EC1 quan h\u1EC7, v\xED d\u1EE5 m\xF4 t\u1EA3 kh\xF3a h\u1ECDc/kh\xE1ch s\u1EA1n: 'Ich habe Ihre Anzeige gelesen. Sie stand in der Zeitung.' \u2192 'Ich habe Ihre Anzeige gelesen, die in der Zeitung stand.'",
    applySpeaking: "Trong b\xE0i Teil 1, m\u1ED7i b\xE0i m\u1EABu th\xEAm \u0111\xFAng 1 c\xE2u quan h\u1EC7: B\xE0i Buch \u2014 'das Buch, das ich zweimal gelesen habe...'; B\xE0i Person \u2014 'meine Mutter, die als Lehrerin arbeitet...'. N\xF3i ch\u1EADm, \u0111\u1EC3 \u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i cho \u0111\xFAng."
  },
  {
    id: 5,
    name: "Nominalisierung \u2014 Danh t\u1EEB h\xF3a",
    nameVi: "bi\u1EBFn \u0111\u1ED9ng t\u1EEB/th\xE0nh ng\u1EEF th\xE0nh danh t\u1EEB",
    week: 5,
    intro: "V\u0103n phong B2 (v\xE0 \u0111\u1EB7c bi\u1EC7t l\xE0 \u0111\u1EC1 \u0110\u1ECDc + th\u01B0 trang tr\u1ECDng) chu\u1ED9ng danh t\u1EEB h\u01A1n \u0111\u1ED9ng t\u1EEB: thay v\xEC 'weil man sich anmeldet' ng\u01B0\u1EDDi ta vi\u1EBFt 'bei der Anmeldung'. Ch\u1EE7 \u0111i\u1EC3m n\xE0y d\u1EA1y anh \u0111\u1ECDc hi\u1EC3u nhanh c\xE1c c\u1EE5m danh t\u1EEB d\xE0i trong \u0111\u1EC1 thi, v\xE0 d\xF9ng v\xE0i m\u1EABu danh t\u1EEB h\xF3a ru\u1ED9t \u0111\u1EC3 b\xE0i vi\u1EBFt trang tr\u1ECDng h\u01A1n \u2014 kh\xF4ng c\u1EA7n h\u1ECDc tr\xE0n lan.",
    rules: [
      "\u0110\u1ED9ng t\u1EEB \u2192 danh t\u1EEB: sich anmelden \u2192 die Anmeldung; teilnehmen \u2192 die Teilnahme; sich entscheiden \u2192 die Entscheidung; wachsen \u2192 das Wachstum. Danh t\u1EEB h\xF3a lu\xF4n vi\u1EBFt hoa, th\u01B0\u1EDDng c\xF3 \u0111u\xF4i -ung (gi\u1ED1ng c\xE1i).",
      "C\u1EE5m gi\u1EDBi t\u1EEB + danh t\u1EEB thay cho c\u1EA3 c\xE2u ph\u1EE5: bei der Anmeldung (khi \u0111\u0103ng k\xFD), vor der Pr\xFCfung (tr\u01B0\u1EDBc k\u1EF3 thi), zur Vorbereitung (\u0111\u1EC3 chu\u1EA9n b\u1ECB), wegen des Wetters (v\xEC th\u1EDDi ti\u1EBFt).",
      "\u0110\u1ECDc \u0111\u1EC1 thi: g\u1EB7p c\u1EE5m danh t\u1EEB d\xE0i, t\u1EF1 d\u1ECBch ng\u01B0\u1EE3c v\u1EC1 \u0111\u1ED9ng t\u1EEB \u0111\u1EC3 hi\u1EC3u: 'die Verbesserung der Luftqualit\xE4t' = 'man verbessert die Luft' \u2192 hi\u1EC3u ngay.",
      "Ch\u1EC9 d\xF9ng 5-7 c\u1EE5m ru\u1ED9t trong b\xE0i vi\u1EBFt c\u1EE7a m\xECnh; \u0111\u1EEBng c\u1ED1 danh t\u1EEB h\xF3a m\u1ECDi c\xE2u \u2014 gi\xE1m kh\u1EA3o c\u1EA7n c\xE2u r\xF5 r\xE0ng, kh\xF4ng c\u1EA7n v\u0103n phong h\xE0nh ch\xEDnh."
    ],
    examples: [
      { de: "Bei der Anmeldung m\xFCssen Sie dieses Formular ausf\xFCllen.", note: "= Wenn Sie sich anmelden, ... \u2014 m\u1EABu ru\u1ED9t cho email." },
      { de: "Zur Vorbereitung auf die Pr\xFCfung lerne ich jeden Tag.", note: "zur Vorbereitung auf + Akkusativ." },
      { de: "Die Zahl der Autos f\xFChrt zu einer Verschlechterung der Luft.", note: "C\u1EE5m danh t\u1EEB \u0111i\u1EC3n h\xECnh trong \u0111\u1EC1 \u0110\u1ECDc v\u1EC1 Umwelt/Verkehr." },
      { de: "Ich schreibe Ihnen wegen meiner Anmeldung zum B2-Kurs.", note: "wegen + Genitiv \u2014 m\u1EDF th\u01B0 r\u1EA5t trang tr\u1ECDng." }
    ],
    pitfall: "Qu\xEAn vi\u1EBFt hoa danh t\u1EEB h\xF3a, v\xE0 sai gi\u1ED1ng (\u0111a s\u1ED1 danh t\u1EEB -ung l\xE0 gi\u1ED1ng c\xE1i 'die'). Khi \u0111\u1ECDc, \u0111\u1EEBng ho\u1EA3ng tr\u01B0\u1EDBc c\u1EE5m danh t\u1EEB d\xE0i \u2014 b\xF3c t\u1EEBng l\u1EDBp t\u1EEB ph\u1EA3i sang tr\xE1i.",
    applyWriting: "Vi\u1EBFt l\u1EA1i Betreff v\xE0 c\xE2u m\u1EDF \u0111\u1EA7u email theo phong c\xE1ch danh t\u1EEB h\xF3a: 'Betreff: Anfrage zur Anmeldung zum Deutschkurs B2' + 'Ich schreibe Ihnen wegen der Anmeldung zu Ihrem Abendkurs.' Th\xEAm 1 c\u1EE5m 'bei der...' v\xE0 1 c\u1EE5m 'zur...' v\xE0o th\xE2n b\xE0i.",
    applySpeaking: "N\xF3i kh\xF4ng c\u1EA7n danh t\u1EEB h\xF3a n\u1EB7ng \u2014 ch\u1EC9 luy\u1EC7n nghe-hi\u1EC3u: t\u1EF1 \u0111\u1ECDc to 5 c\u1EE5m danh t\u1EEB trong v\xED d\u1EE5 v\xE0 d\u1ECBch ng\u01B0\u1EE3c th\xE0nh c\xE2u \u0111\u1ED9ng t\u1EEB. Khi th\u1EA3o lu\u1EADn Teil 2, d\xF9ng 1 c\u1EE5m ru\u1ED9t: 'Ein Grund daf\xFCr ist die Verbesserung...' l\xE0 \u0111\u1EE7 ghi \u0111i\u1EC3m."
  },
  {
    id: 6,
    name: "Konnektoren \u2014 T\u1EEB n\u1ED1i n\xE2ng c\u1EA5p",
    nameVi: "n\u1ED1i \xFD \u1EDF t\u1EA7m B2 thay cho und/aber/denn",
    week: 6,
    intro: "\u1EDE B1 anh n\u1ED1i c\xE2u b\u1EB1ng und, aber, denn \u2014 \u0111\xFAng nh\u01B0ng 'ph\u1EB3ng'. B2 c\u1EA7n n\u1ED1i \xFD c\xF3 t\u1EA7ng b\u1EADc: th\xEAm \xFD (au\xDFerdem, dar\xFCber hinaus), nh\u01B0\u1EE3ng b\u1ED9 (trotzdem, dennoch), nguy\xEAn nh\xE2n trang tr\u1ECDng (deshalb, aus diesem Grund), \u0111\u1ED1i l\u1EADp (jedoch, im Gegensatz dazu). \u0110\xE2y l\xE0 ch\u1EE7 \u0111i\u1EC3m \u0103n \u0111i\u1EC3m tr\u1EF1c ti\u1EBFp nh\u1EA5t cho c\u1EA3 khung tri\u1EC3n khai \xFD 5 b\u01B0\u1EDBc.",
    rules: [
      "T\u1EEB n\u1ED1i tr\u1EA1ng ng\u1EEF (deshalb, trotzdem, au\xDFerdem, jedoch...) \u0111\u1EE9ng \u1EDF v\u1ECB tr\xED 1 ho\u1EB7c gi\u1EEFa c\xE2u, v\xE0 \u0111\u1ED9ng t\u1EEB chia \u0111\u1EA3o l\xEAn v\u1ECB tr\xED 2 ngay sau n\xF3: Der Kurs ist teuer. Trotzdem lohnt er sich.",
      "Li\xEAn t\u1EEB ph\u1EE5 (obwohl, weil, dass) \u0111\u1EA9y \u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i \u2014 \u0111\u1EEBng tr\u1ED9n hai c\u01A1 ch\u1EBF: 'trotzdem' KH\xD4NG \u0111\u1EA9y \u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i nh\u01B0 'obwohl'.",
      "C\u1EB7p \u0111\xF4i ph\u1EA3i thu\u1ED9c: einerseits ... andererseits (m\u1ED9t m\u1EB7t... m\u1EB7t kh\xE1c), nicht nur ... sondern auch (kh\xF4ng ch\u1EC9... m\xE0 c\xF2n), sowohl ... als auch (c\u1EA3... l\u1EABn).",
      "M\u1ED7i \u0111o\u1EA1n v\u0103n/c\xE2u tr\u1EA3 l\u1EDDi ch\u1EC9 c\u1EA7n 2-3 t\u1EEB n\u1ED1i kh\xE1c nhau, d\xF9ng \u0111\xFAng \u2014 nh\u1ED3i nh\xE9t m\u1ECDi c\xE2u m\u1ED9t t\u1EEB n\u1ED1i l\u1EA1i th\xE0nh l\u1ED7i phong c\xE1ch."
    ],
    examples: [
      { de: "Der Kurs ist teuer. Trotzdem lohnt er sich, weil man viel lernt.", note: "trotzdem (\u0111\u1EA3o ng\u1EEF) + weil (\u0111\u1ED9ng t\u1EEB cu\u1ED1i) trong c\xF9ng m\u1ED9t \xFD." },
      { de: "Einerseits ist Homeoffice praktisch, andererseits fehlt der Kontakt zu Kollegen.", note: "C\u1EB7p \u0111\u1ED1i l\u1EADp \u2014 x\u01B0\u01A1ng s\u1ED1ng c\u1EE7a Teil 2 Diskussion." },
      { de: "Die Stadt ist laut und au\xDFerdem sehr teuer.", note: "au\xDFerdem th\xEAm \xFD c\xF9ng chi\u1EC1u." },
      { de: "Er hat wenig Zeit. Aus diesem Grund \xFCbt er nur am Wochenende.", note: "aus diesem Grund = v\xEC l\xFD do \u0111\xF3, trang tr\u1ECDng h\u01A1n 'deshalb'." }
    ],
    pitfall: "D\xF9ng 'trotzdem' nh\u01B0 'obwohl' (\u0111\u1EA9y \u0111\u1ED9ng t\u1EEB v\u1EC1 cu\u1ED1i) \u2014 sai c\u01A1 ch\u1EBF. Nh\u1EDB: trotzdem l\xE0 tr\u1EA1ng ng\u1EEF, \u0111\u1ED9ng t\u1EEB v\u1EABn \u1EDF v\u1ECB tr\xED 2 ngay sau n\xF3 ho\u1EB7c sau ch\u1EE7 ng\u1EEF.",
    applyWriting: "L\u1EA5y b\xE0i email c\u0169, thay m\u1ECDi 'und/aber' n\u1ED1i \u0111o\u1EA1n b\u1EB1ng t\u1EEB n\u1ED1i B2: \u0111o\u1EA1n 1 Zun\xE4chst..., \u0111o\u1EA1n 2 Au\xDFerdem..., \u0111o\u1EA1n 3 Schlie\xDFlich...; th\xEAm 1 c\xE2u c\xF3 'trotzdem' v\xE0 1 c\xE2u 'nicht nur..., sondern auch...'. M\u1EE5c ti\xEAu: m\u1ED7i \u0111o\u1EA1n \xEDt nh\u1EA5t 2 t\u1EEB n\u1ED1i kh\xE1c nhau.",
    applySpeaking: "Luy\u1EC7n Teil 2 theo khung: m\u1EDF b\u1EB1ng 'Meiner Meinung nach...', th\xEAm \xFD b\u1EB1ng 'Dar\xFCber hinaus...', nh\u01B0\u1EE3ng b\u1ED9 b\u1EB1ng 'Trotzdem muss man bedenken, dass...', ch\u1ED1t b\u1EB1ng 'Insgesamt...'. Thu \xE2m 2 ph\xFAt, \u0111\u1EBFm xem \u0111\u1EE7 4 t\u1EEB n\u1ED1i ch\u01B0a."
  },
  {
    id: 7,
    name: "Pr\xE4positionen + Kasus",
    nameVi: "gi\u1EDBi t\u1EEB \u0111i v\u1EDBi c\xE1ch n\xE0o",
    week: 7,
    intro: "Gi\u1EDBi t\u1EEB sai c\xE1ch l\xE0 l\u1ED7i l\u1ED9 r\xF5 nh\u1EA5t \u1EDF ng\u01B0\u1EDDi h\u1ECDc B1 ch\u01B0a ch\u1EAFc \u2014 v\xE0 Sprachbausteine ch\u1EA5m \u0111\xFAng ch\u1ED7 n\xE0y. H\u1ECDc theo 3 nh\xF3m c\u1ED1 \u0111\u1ECBnh (lu\xF4n Akkusativ / lu\xF4n Dativ / hai chi\u1EC1u) c\u1ED9ng v\u1EDBi nh\xF3m \u0111\u1ED9ng t\u1EEB + gi\u1EDBi t\u1EEB c\u1ED1 \u0111\u1ECBnh (warten auf, sich interessieren f\xFCr...). \u0110\xE2y l\xE0 ph\u1EA7n h\u1ECDc thu\u1ED9c l\xF2ng thu\u1EA7n t\xFAy, h\u1ECDc m\u1ED9t l\u1EA7n d\xF9ng c\u1EA3 \u0111\u1EDDi.",
    rules: [
      "Lu\xF4n + Akkusativ: f\xFCr, um, durch, gegen, ohne \u2014 Ich kaufe ein Geschenk f\xFCr meinen Bruder.",
      "Lu\xF4n + Dativ: mit, nach, von, zu, bei, aus, seit, gegen\xFCber \u2014 Ich fahre mit dem Bus zur Arbeit.",
      "Hai chi\u1EC1u (wo? \u2192 Dativ, wohin? \u2192 Akkusativ): in, an, auf, \xFCber, unter, vor, hinter, neben, zwischen \u2014 Ich sitze auf dem Stuhl (wo) / Ich setze mich auf den Stuhl (wohin).",
      "\u0110\u1ED9ng t\u1EEB + gi\u1EDBi t\u1EEB c\u1ED1 \u0111\u1ECBnh ph\u1EA3i h\u1ECDc c\u1EA3 c\u1EE5m: warten auf + Akk, sich interessieren f\xFCr + Akk, sich beschweren \xFCber + Akk, teilnehmen an + Dat, sich freuen auf/\xFCber + Akk, denken an + Akk."
    ],
    examples: [
      { de: "Ich warte seit einer Stunde auf den Bus.", note: "seit + Dativ (einer Stunde) v\xE0 warten auf + Akkusativ trong c\xF9ng 1 c\xE2u." },
      { de: "Er interessiert sich f\xFCr Geschichte.", note: "sich interessieren f\xFCr \u2014 c\u1EE5m c\u1ED1 \u0111\u1ECBnh, kh\xF4ng d\u1ECBch t\u1EEBng ch\u1EEF." },
      { de: "Wir nehmen an dem Kurs teil.", note: "teilnehmen an + Dativ." },
      { de: "Sie beschwert sich \xFCber das laute Zimmer.", note: "sich beschweren \xFCber + Akkusativ \u2014 m\u1EABu ru\u1ED9t cho th\u01B0 khi\u1EBFu n\u1EA1i." }
    ],
    pitfall: "D\u1ECBch gi\u1EDBi t\u1EEB t\u1EEB ti\u1EBFng Vi\u1EC7t ('ch\u1EDD = warten f\xFCr' \u2014 sai, ph\u1EA3i l\xE0 warten auf). Gi\u1EDBi t\u1EEB c\u1EE7a \u0111\u1ED9ng t\u1EEB kh\xF4ng suy lu\u1EADn \u0111\u01B0\u1EE3c, ch\u1EC9 c\xF3 h\u1ECDc thu\u1ED9c theo c\u1EE5m, gi\u1ED1ng nh\u01B0 h\u1ECDc t\u1EEB v\u1EF1ng.",
    applyWriting: "R\xE0 so\xE1t b\xE0i email g\u1EA7n nh\u1EA5t ch\u1EC9 v\u1EDBi 1 ti\xEAu ch\xED: khoanh m\u1ECDi gi\u1EDBi t\u1EEB, ki\u1EC3m tra c\xE1ch c\u1EE7a danh t\u1EEB theo sau. Vi\u1EBFt th\xEAm 3 c\xE2u d\xF9ng c\u1EE5m c\u1ED1 \u0111\u1ECBnh: sich bewerben um (xin vi\u1EC7c/\u0111\u0103ng k\xFD), sich erkundigen nach (h\u1ECFi th\u0103m v\u1EC1), bitten um (\u0111\u1EC1 ngh\u1ECB).",
    applySpeaking: "T\u1EF1 h\u1ECFi-\u0111\xE1p nhanh 6 c\u1EE5m c\u1ED1 \u0111\u1ECBnh trong 3 ph\xFAt, kh\xF4ng nh\xECn gi\u1EA5y: Worauf wartest du? \u2014 Ich warte auf... / Wof\xFCr interessierst du dich? \u2014 Ich interessiere mich f\xFCr... \u0110\xE2y c\u0169ng l\xE0 d\u1EA1ng c\xE2u h\u1ECFi ph\u1EE5 gi\xE1m kh\u1EA3o hay d\xF9ng."
  },
  {
    id: 8,
    name: "Wortbildung \u2014 C\u1EA5u t\u1EA1o t\u1EEB",
    nameVi: "ti\u1EC1n t\u1ED1 \xB7 h\u1EADu t\u1ED1 \xB7 t\u1EEB gh\xE9p",
    week: 8,
    intro: "V\u1ED1n t\u1EEB B2 kh\xF4ng th\u1EC3 h\u1ECDc t\u1EEBng t\u1EEB m\u1ED9t \u2014 ph\u1EA3i h\u1ECDc c\xE1ch 'gi\u1EA3i m\xE3' t\u1EEB m\u1EDBi: bi\u1EBFt ti\u1EC1n t\u1ED1/h\u1EADu t\u1ED1 l\xE0 \u0111o\xE1n \u0111\u01B0\u1EE3c ngh\u0129a c\u1EE7a h\xE0ng tr\u0103m t\u1EEB ch\u01B0a g\u1EB7p trong \u0111\u1EC1 \u0110\u1ECDc. Ch\u1EE7 \u0111i\u1EC3m cu\u1ED1i n\xE0y bi\u1EBFn v\u1ED1n 180 c\u1EE5m c\u1EE7a anh th\xE0nh kh\u1EA3 n\u0103ng t\u1EF1 m\u1EDF r\u1ED9ng: g\u1EB7p t\u1EEB l\u1EA1, b\xF3c ti\u1EC1n t\u1ED1 - g\u1ED1c - h\u1EADu t\u1ED1 l\xE0 hi\u1EC3u.",
    rules: [
      "H\u1EADu t\u1ED1 t\xEDnh t\u1EEB: -bar (machbar = l\xE0m \u0111\u01B0\u1EE3c), -los (arbeitslos = kh\xF4ng c\xF3 vi\u1EC7c), -reich (erfolgreich = \u0111\u1EA7y th\xE0nh c\xF4ng), -lich/-ig (t\xE4glich, wichtig). H\u1EADu t\u1ED1 danh t\u1EEB: -ung, -heit/-keit (Gesundheit, M\xF6glichkeit), -schaft (Freundschaft).",
      "Ti\u1EC1n t\u1ED1 \u0111\u1ED5i ngh\u0129a \u0111\u1ED9ng t\u1EEB: ver- (verstehen, verbessern), be- (beantworten), er- (erkl\xE4ren), ent- (entscheiden), zer- (zerbrechen = v\u1EE1 tan), miss- (missverstehen = hi\u1EC3u nh\u1EA7m).",
      "T\u1EEB gh\xE9p (Komposita): danh t\u1EEB cu\u1ED1i quy\u1EBFt \u0111\u1ECBnh gi\u1ED1ng v\xE0 ngh\u0129a ch\xEDnh, c\xE1c t\u1EEB tr\u01B0\u1EDBc b\u1ED5 ngh\u0129a: der Arbeitsplatz (Arbeits + Platz), die Umweltschutzma\xDFnahme. \u0110\u1ECDc t\u1EEB ph\u1EA3i sang tr\xE1i.",
      "Danh t\u1EEB h\xF3a t\u1EEB \u0111\u1ED9ng t\u1EEB (n\u1ED1i v\u1EDBi ch\u1EE7 \u0111i\u1EC3m 5): lernen \u2192 das Lernen; anmelden \u2192 die Anmeldung. G\u1EB7p danh t\u1EEB l\u1EA1, t\xECm \u0111\u1ED9ng t\u1EEB g\u1ED1c b\xEAn trong."
    ],
    examples: [
      { de: "umweltfreundlich = Umwelt + Freund + -lich", note: "'th\xE2n thi\u1EC7n v\u1EDBi m\xF4i tr\u01B0\u1EDDng' \u2014 b\xF3c \u0111\u01B0\u1EE3c c\u1EA3 t\u1EEB ch\u01B0a h\u1ECDc." },
      { de: "die Entscheidung kommt von entscheiden (ent- + scheiden).", note: "Ti\u1EC1n t\u1ED1 ent- th\u01B0\u1EDDng mang ngh\u0129a quy\u1EBFt/\u0111\u1ECBnh h\u01B0\u1EDBng ra k\u1EBFt qu\u1EA3." },
      { de: "hoffnungslos = Hoffnung + -los", note: "-los = 'kh\xF4ng c\xF3' \u2192 v\xF4 v\u1ECDng. Ng\u01B0\u1EE3c l\u1EA1i -voll: hoffnungsvoll." },
      { de: "der Feierabendverkehr = Feierabend + Verkehr", note: "T\u1EEB gh\xE9p 3 l\u1EDBp: Verkehr l\xE0 g\u1ED1c ch\xEDnh (gi\u1ED1ng \u0111\u1EF1c, ngh\u0129a giao th\xF4ng gi\u1EDD tan t\u1EA7m)." }
    ],
    pitfall: "\u0110o\xE1n ngh\u0129a t\u1EEB gh\xE9p t\u1EEB tr\xE1i sang ph\u1EA3i (s\u1EBD ng\u01B0\u1EE3c ngh\u0129a ch\xEDnh), v\xE0 tra t\u1EEB \u0111i\u1EC3n t\u1EEBng t\u1EEB l\u1EA1 trong \u0111\u1EC1 \u0110\u1ECDc \u2014 m\u1EA5t th\u1EDDi gian. Quy t\u1EAFc thi: b\xF3c c\u1EA5u t\u1EA1o tr\u01B0\u1EDBc, ch\u1EC9 tra t\u1EEB n\xE0o xu\u1EA5t hi\u1EC7n trong c\xE2u h\u1ECFi.",
    applyWriting: "Trong b\xE0i vi\u1EBFt tu\u1EA7n n\xE0y, ch\u1EE7 \u0111\u1ED9ng d\xF9ng 5 t\u1EEB 't\u1EF1 ch\u1EBF' \u0111\xFAng quy t\u1EAFc thay cho c\xE1ch n\xF3i v\xF2ng: l\xF6sbar (gi\u1EA3i quy\u1EBFt \u0111\u01B0\u1EE3c), verst\xE4ndlich (d\u1EC5 hi\u1EC3u), kostenlos (mi\u1EC5n ph\xED), zeitaufwendig (t\u1ED1n th\u1EDDi gian), empfehlenswert (\u0111\xE1ng gi\u1EDBi thi\u1EC7u) \u2014 m\u1ED7i t\u1EEB 1 c\xE2u.",
    applySpeaking: "Luy\u1EC7n k\u1EF9 n\u0103ng 'n\xF3i v\xF2ng khi b\xED t\u1EEB' cho Teil 1-2: khi qu\xEAn 1 t\u1EEB, m\xF4 t\u1EA3 b\u1EB1ng c\u1EA5u t\u1EA1o \u2014 qu\xEAn 'der Aufzug' th\xEC n\xF3i 'die Maschine, mit der man nach oben f\xE4hrt'. \u0110\xE2y l\xE0 chi\u1EBFn thu\u1EADt c\u1EE9u \u0111i\u1EC3m l\u01B0u lo\xE1t khi thi\u1EBFu t\u1EEB."
  }
];
function grammarTopicForDay(day) {
  const week = Math.ceil(day / 7);
  if (week >= 1 && week <= 8) return GRAMMAR_TOPICS_FULL[week - 1] ?? null;
  return null;
}
export {
  GRAMMAR_TOPICS_FULL,
  grammarTopicForDay
};
