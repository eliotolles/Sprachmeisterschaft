const B1_TOPICS = [
  {
    id: "kasus",
    name: "Kasus \u2014 4 c\xE1ch",
    nameVi: "Nominativ \xB7 Akkusativ \xB7 Dativ \xB7 Genitiv",
    explain: "Kasus l\xE0 \u201Cc\xE1ch\u201D \u2014 vai tr\xF2 c\u1EE7a danh t\u1EEB trong c\xE2u, th\u1EC3 hi\u1EC7n qua m\u1EA1o t\u1EEB bi\u1EBFn h\xECnh (der \u2192 den \u2192 dem \u2192 des). \u0110\xE2y l\xE0 g\u1ED1c c\u1EE7a g\u1EA7n nh\u01B0 m\u1ECDi l\u1ED7i chia m\u1EA1o t\u1EEB: mu\u1ED1n \u0111\xFAng, m\u1ED7i l\u1EA7n d\xF9ng m\u1ED9t danh t\u1EEB ph\u1EA3i t\u1EF1 h\u1ECFi \u201Cn\xF3 \u0111ang \u1EDF c\xE1ch n\xE0o, v\xEC sao?\u201D. Nominativ = ch\u1EE7 ng\u1EEF (ai l\xE0m?), Akkusativ = t\xE2n ng\u1EEF tr\u1EF1c ti\u1EBFp (b\u1ECB t\xE1c \u0111\u1ED9ng l\xEAn c\xE1i g\xEC?), Dativ = t\xE2n ng\u1EEF gi\xE1n ti\u1EBFp (cho ai? v\u1EDBi ai?), Genitiv = s\u1EDF h\u1EEFu (c\u1EE7a ai?).",
    points: [
      "Nominativ: ch\u1EE7 ng\u1EEF. H\u1ECFi Wer? (ng\u01B0\u1EDDi) / Was? (v\u1EADt). M\u1EA1o t\u1EEB gi\u1EEF nguy\xEAn: der Mann, die Frau, das Kind, die Leute.",
      "Akkusativ: t\xE2n ng\u1EEF tr\u1EF1c ti\u1EBFp + sau f\xFCr, um, durch, gegen, ohne. Ch\u1EC9 gi\u1ED1ng \u0111\u1EF1c \u0111\u1ED5i: der \u2192 den, ein \u2192 einen. Gi\u1ED1ng c\xE1i/trung/s\u1ED1 nhi\u1EC1u gi\u1EEF nguy\xEAn.",
      "Dativ: t\xE2n ng\u1EEF gi\xE1n ti\u1EBFp (\u0111\u01B0a/n\xF3i/gi\xFAp CHO ai) + sau mit, nach, von, zu, bei, aus, seit. der \u2192 dem, die \u2192 der, das \u2192 dem; s\u1ED1 nhi\u1EC1u: den + danh t\u1EEB th\xEAm \u0111u\xF4i -n (den Kindern). M\u1ED9t s\u1ED1 \u0111\u1ED9ng t\u1EEB lu\xF4n \u0111i v\u1EDBi Dativ: helfen, danken, gefallen, geh\xF6ren, folgen.",
      "Genitiv: s\u1EDF h\u1EEFu + sau wegen, w\xE4hrend, trotz, statt. der/das \u2192 des v\xE0 danh t\u1EEB th\xEAm -(e)s: des Mannes, des Kindes. die/s\u1ED1 nhi\u1EC1u \u2192 der: der Frau, der Kinder."
    ],
    examples: [
      {
        de: "Der Lehrer erkl\xE4rt dem Sch\xFCler die Aufgabe.",
        note: "M\u1ED9t c\xE2u \u0111\u1EE7 3 c\xE1ch: der Lehrer = Nominativ (ch\u1EE7 ng\u1EEF), dem Sch\xFCler = Dativ (gi\u1EA3i th\xEDch CHO ai), die Aufgabe = Akkusativ (gi\u1EA3i th\xEDch C\xC1I G\xCC)."
      },
      {
        de: "Ich kaufe einen Computer f\xFCr meinen Bruder.",
        note: "f\xFCr + Akkusativ, gi\u1ED1ng \u0111\u1EF1c n\xEAn einen/meinen."
      },
      {
        de: "Das Auto meines Vaters ist schon alt.",
        note: "meines Vaters = Genitiv s\u1EDF h\u1EEFu: \u201Cxe c\u1EE7a b\u1ED1 t\xF4i\u201D."
      },
      {
        de: "Sie hilft ihrer Freundin beim Umzug.",
        note: "helfen lu\xF4n \u0111i v\u1EDBi Dativ \u2014 ihrer Freundin, kh\xF4ng ph\u1EA3i \u201Csie\u201D."
      }
    ],
    exercise: "\u0110i\u1EC1n m\u1EA1o t\u1EEB \u0111\xFAng: 1) Ich sehe ___ Film. (der \u2014 t\xE2n ng\u1EEF c\u1EE7a \u201Csehen\u201D) 2) Er gibt ___ Kind ein Buch. (das \u2014 \u0111\u01B0a CHO ai) 3) Wir fahren mit ___ Bus. (der \u2014 sau \u201Cmit\u201D) 4) Das ist das Haus ___ Lehrerin. (die \u2014 nh\xE0 C\u1EE6A c\xF4 gi\xE1o)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) den (Akkusativ, gi\u1ED1ng \u0111\u1EF1c \u0111\u1ED5i der \u2192 den) \xB7 2) dem (Dativ \u2014 t\xE2n ng\u1EEF gi\xE1n ti\u1EBFp) \xB7 3) dem (mit lu\xF4n + Dativ) \xB7 4) der (Genitiv c\u1EE7a die l\xE0 der). T\u1EF1 ki\u1EC3m tra: m\u1ED7i \xF4 \u0111i\u1EC1n xong ph\u1EA3i n\xF3i \u0111\u01B0\u1EE3c l\xFD do \u2014 c\xE1ch n\xE0o, do \u0111\xE2u (ch\u1EE7 ng\u1EEF / t\xE2n ng\u1EEF / gi\u1EDBi t\u1EEB / s\u1EDF h\u1EEFu)."
  },
  {
    id: "adjektivdeklination",
    name: "Adjektivdeklination \u2014 \u0110u\xF4i t\xEDnh t\u1EEB",
    nameVi: "t\xEDnh t\u1EEB \u0111\u1EE9ng tr\u01B0\u1EDBc danh t\u1EEB ph\u1EA3i c\xF3 \u0111u\xF4i",
    explain: "T\xEDnh t\u1EEB \u0111\u1EE9ng TR\u01AF\u1EDAC danh t\u1EEB lu\xF4n ph\u1EA3i c\xF3 \u0111u\xF4i, v\xE0 c\xE1i \u0111u\xF4i \u0111\xF3 \u201Cg\xE1nh\u201D th\xF4ng tin gi\u1ED1ng/c\xE1ch khi m\u1EA1o t\u1EEB ch\u01B0a th\u1EC3 hi\u1EC7n r\xF5. Nguy\xEAn t\u1EAFc v\xE0ng: th\xF4ng tin gi\u1ED1ng/c\xE1ch ch\u1EC9 c\u1EA7n xu\u1EA5t hi\u1EC7n \u0111\xFAng 1 l\u1EA7n \u2014 ho\u1EB7c \u1EDF m\u1EA1o t\u1EEB, ho\u1EB7c \u1EDF \u0111u\xF4i t\xEDnh t\u1EEB. Ch\u1EC9 c\xF3 3 t\xECnh hu\u1ED1ng: sau m\u1EA1o t\u1EEB x\xE1c \u0111\u1ECBnh (der/die/das...), sau m\u1EA1o t\u1EEB kh\xF4ng x\xE1c \u0111\u1ECBnh (ein/kein/mein...), v\xE0 kh\xF4ng c\xF3 m\u1EA1o t\u1EEB. T\xEDnh t\u1EEB \u0111\u1EE9ng sau \u0111\u1ED9ng t\u1EEB (sein, werden) th\xEC KH\xD4NG chia: \u201CDas Auto ist neu.\u201D",
    points: [
      "Sau der/die/das (v\xE0 dieser, jeder, alle...): m\u1EA1o t\u1EEB \u0111\xE3 r\xF5 gi\u1ED1ng/c\xE1ch \u2192 t\xEDnh t\u1EEB nh\u1EB9: Nominativ s\u1ED1 \xEDt m\u1ECDi gi\u1ED1ng v\xE0 Akkusativ gi\u1ED1ng c\xE1i/trung th\xEAm -e (der alte Mann, die kleine Frau, das neue Auto), m\u1ECDi tr\u01B0\u1EDDng h\u1EE3p c\xF2n l\u1EA1i th\xEAm -en (den alten Mann, mit dem kleinen Kind, die neuen B\xFCcher).",
      "Sau ein/kein/mein: \u1EDF Nominativ gi\u1ED1ng \u0111\u1EF1c/trung v\xE0 Akkusativ trung, \u201Cein\u201D kh\xF4ng l\u1ED9 gi\u1ED1ng \u2192 t\xEDnh t\u1EEB g\xE1nh \u0111u\xF4i m\u1EA1nh: ein alter Mann (-er), ein neues Auto (-es). C\xE1c \xF4 c\xF2n l\u1EA1i gi\u1ED1ng nh\xF3m tr\xEAn (-e / -en): einen alten Mann, einer kleinen Frau.",
      "Kh\xF4ng c\xF3 m\u1EA1o t\u1EEB: t\xEDnh t\u1EEB g\xE1nh to\xE0n b\u1ED9, \u0111u\xF4i gi\u1ED1ng h\u1EC7t m\u1EA1o t\u1EEB x\xE1c \u0111\u1ECBnh: kaltes Wasser (nh\u01B0 das), mit hei\xDFem Kaffee (nh\u01B0 dem), frische Milch (nh\u01B0 die).",
      "M\u1EB9o khi b\xED trong ph\xF2ng thi: n\u1EBFu \u0111\xE3 th\u1EA5y m\u1EA1o t\u1EEB chia r\xF5 (den, dem, der, einem...) th\xEC c\u1EE9 -en m\xE0 \u0111i\u1EC1n \u2014 \u0111\xFAng trong \u0111a s\u1ED1 tr\u01B0\u1EDDng h\u1EE3p."
    ],
    examples: [
      {
        de: "Der junge Mann lernt sehr schnell.",
        note: "der + Nominativ \u0111\u1EF1c \u2192 -e: junge."
      },
      {
        de: "Ich trinke einen hei\xDFen Kaffee.",
        note: "einen \u0111\xE3 r\xF5 Akkusativ \u0111\u1EF1c \u2192 t\xEDnh t\u1EEB ch\u1EC9 th\xEAm -en: hei\xDFen."
      },
      {
        de: "Ein kleines Kind spielt im Garten.",
        note: "ein trung Nominativ kh\xF4ng l\u1ED9 gi\u1ED1ng \u2192 t\xEDnh t\u1EEB g\xE1nh -es: kleines."
      },
      {
        de: "Sie wohnt in einem kleinen Dorf.",
        note: "einem (Dativ trung) \u0111\xE3 r\xF5 \u2192 -en: kleinen."
      }
    ],
    exercise: "\u0110i\u1EC1n \u0111u\xF4i t\xEDnh t\u1EEB: 1) Das ist ein interessant___ Buch. (das, Nominativ, sau ein) 2) Ich lese einen spannend___ Roman. (der, Akkusativ, sau einen) 3) Mit mein___ alt___ Handy kann ich nicht mehr arbeiten. (das, sau mit) 4) Die neu___ Studentin kommt aus Hanoi. (die, Nominativ, sau die)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) interessantes (ein + trung Nominativ \u2192 t\xEDnh t\u1EEB g\xE1nh -es) \xB7 2) spannenden (einen \u0111\xE3 r\xF5 \u2192 -en) \xB7 3) meinem alten (mit + Dativ: meinem \u0111\xE3 r\xF5 c\xE1ch \u2192 alten th\xEAm -en) \xB7 4) neue (die + Nominativ c\xE1i \u2192 -e)."
  },
  {
    id: "zeiten",
    name: "Die Zeiten \u2014 C\xE1c th\xEC qu\xE1 kh\u1EE9 & t\u01B0\u01A1ng lai",
    nameVi: "Perfekt \xB7 Pr\xE4teritum \xB7 Plusquamperfekt \xB7 Futur I",
    explain: "Ti\u1EBFng \u0110\u1EE9c ch\u1ECDn th\xEC theo \u201Ck\xEAnh\u201D n\xF3i hay vi\u1EBFt nhi\u1EC1u h\u01A1n theo \u0111\u1ED9 xa c\u1EE7a th\u1EDDi gian: n\xF3i chuy\u1EC7n h\u1EB1ng ng\xE0y v\u1EC1 qu\xE1 kh\u1EE9 th\xEC d\xF9ng Perfekt; Pr\xE4teritum l\xE0 k\xEAnh c\u1EE7a v\u0103n vi\u1EBFt/k\u1EC3 chuy\u1EC7n \u2014 nh\u01B0ng ri\xEAng sein, haben v\xE0 Modalverben th\xEC n\xF3i c\u0169ng d\xF9ng Pr\xE4teritum. Plusquamperfekt ch\u1EC9 c\xF3 m\u1ED9t vi\u1EC7c: \u0111\xE1nh d\u1EA5u vi\u1EC7c x\u1EA3y ra TR\u01AF\u1EDAC m\u1ED9t m\u1ED1c qu\xE1 kh\u1EE9 kh\xE1c. Futur I d\xF9ng cho d\u1EF1 \u0111o\xE1n/d\u1EF1 \u0111\u1ECBnh ch\u01B0a ch\u1ED1t \u2014 c\xF2n l\u1ECBch tr\xECnh \u0111\xE3 c\u1ED1 \u0111\u1ECBnh th\xEC c\u1EE9 Pr\xE4sens + m\u1ED1c th\u1EDDi gian.",
    points: [
      "Perfekt = haben/sein + Partizip II \u1EDF cu\u1ED1i c\xE2u \u2014 k\xEAnh N\xD3I v\u1EC1 qu\xE1 kh\u1EE9. \u0110\u1ED9ng t\u1EEB chuy\u1EC3n \u0111\u1ED9ng ho\u1EB7c \u0111\u1ED5i tr\u1EA1ng th\xE1i \u0111i v\u1EDBi sein (fahren, gehen, aufstehen, sterben...): Ich bin gestern gefahren. C\xF2n l\u1EA1i \u0111a s\u1ED1 \u0111i v\u1EDBi haben: Ich habe den Film gesehen.",
      "Pr\xE4teritum: war (sein), hatte (haben), ging, sagte, kam... D\xF9ng khi vi\u1EBFt/k\u1EC3 chuy\u1EC7n; khi n\xF3i ch\u1EC9 th\u01B0\u1EDDng d\xF9ng v\u1EDBi sein, haben, Modalverben (musste, konnte, wollte).",
      "Plusquamperfekt = war/hatte + Partizip II: vi\u1EC7c XONG TR\u01AF\u1EDAC m\u1ED9t vi\u1EC7c qu\xE1 kh\u1EE9 kh\xE1c, hay \u0111i c\xF9ng nachdem: Nachdem ich gegessen hatte, ging ich spazieren.",
      "Futur I = werden + Infinitiv \u1EDF cu\u1ED1i c\xE2u: Ich werde dich morgen anrufen. (d\u1EF1 \u0111\u1ECBnh/l\u1EDDi h\u1EE9a/d\u1EF1 \u0111o\xE1n). L\u1ECBch c\u1ED1 \u0111\u1ECBnh: Der Zug f\xE4hrt morgen um 8 Uhr ab. \u2014 Pr\xE4sens l\xE0 \u0111\u1EE7."
    ],
    examples: [
      {
        de: "Gestern habe ich meine Gro\xDFmutter besucht.",
        note: "Perfekt \u2014 c\xE1ch n\xF3i t\u1EF1 nhi\xEAn khi k\u1EC3 chuy\u1EC7n mi\u1EC7ng."
      },
      {
        de: "Er war krank und hatte keine Zeit.",
        note: "Pr\xE4teritum c\u1EE7a sein/haben \u2014 n\xF3i hay vi\u1EBFt \u0111\u1EC1u t\u1EF1 nhi\xEAn."
      },
      {
        de: "Nachdem wir angekommen waren, haben wir zuerst gegessen.",
        note: "angekommen waren = Plusquamperfekt: \u0111\u1EBFn TR\u01AF\u1EDAC, \u0103n SAU."
      },
      {
        de: "N\xE4chstes Jahr werde ich die B2-Pr\xFCfung machen.",
        note: "Futur I \u2014 d\u1EF1 \u0111\u1ECBnh cho n\u0103m sau."
      }
    ],
    exercise: "Ch\u1ECDn th\xEC \u0111\xFAng: 1) (\u0110ang n\xF3i chuy\u1EC7n) \u201CGestern ___ ich einen interessanten Film ___.\u201D (sehen) 2) \u201CAls Kind ___ er oft krank.\u201D (sein) 3) \u201CNachdem sie die Pr\xFCfung bestanden ___, feierte sie mit Freunden.\u201D (haben + Partizip II c\u1EE7a bestehen l\xE0 bestanden) 4) \u201CDer Bus ___ morgen um 7 Uhr ___.\u201D (abfahren \u2014 l\u1ECBch c\u1ED1 \u0111\u1ECBnh)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) habe ... gesehen (Perfekt \u2014 k\xEAnh n\xF3i) \xB7 2) war (Pr\xE4teritum c\u1EE7a sein) \xB7 3) hatte (Plusquamperfekt: bestanden hatte \u2014 vi\u1EC7c \u0111\u1ED7 x\u1EA3y ra tr\u01B0\u1EDBc vi\u1EC7c \u0103n m\u1EEBng) \xB7 4) f\xE4hrt ... ab (Pr\xE4sens + morgen cho l\u1ECBch c\u1ED1 \u0111\u1ECBnh, kh\xF4ng c\u1EA7n Futur I)."
  },
  {
    id: "modalverben",
    name: "Modalverben \u2014 \u0110\u1ED9ng t\u1EEB khuy\u1EBFt thi\u1EBFu",
    nameVi: "k\xF6nnen \xB7 m\xFCssen \xB7 d\xFCrfen \xB7 wollen \xB7 sollen \xB7 m\xF6gen",
    explain: "6 \u0111\u1ED9ng t\u1EEB khuy\u1EBFt thi\u1EBFu di\u1EC5n t\u1EA3 kh\u1EA3 n\u0103ng, ngh\u0129a v\u1EE5, ph\xE9p t\u1EAFc, \xFD mu\u1ED1n: k\xF6nnen (c\xF3 th\u1EC3 / bi\u1EBFt l\xE0m), m\xFCssen (ph\u1EA3i), d\xFCrfen (\u0111\u01B0\u1EE3c ph\xE9p), wollen (mu\u1ED1n \u2014 \xFD ch\xED m\u1EA1nh), sollen (n\xEAn / \u0111\u01B0\u1EE3c d\u1EB7n l\xE0 ph\u1EA3i), m\xF6gen (th\xEDch) v\xE0 m\xF6chten (mu\u1ED1n \u2014 d\u1EA1ng l\u1ECBch s\u1EF1 c\u1EE7a m\xF6gen). C\u1EA5u tr\xFAc kh\xF4ng \u0111\u1ED5i: Modalverb chia \u0111\u1EE9ng \u1EDF v\u1ECB tr\xED 2, \u0111\u1ED9ng t\u1EEB ch\xEDnh v\u1EC1 nguy\xEAn th\u1EC3 \u1EDF CU\u1ED0I c\xE2u.",
    points: [
      "Chia hi\u1EC7n t\u1EA1i c\xF3 \u0111i\u1EC3m l\u1EA1: ich v\xE0 er/sie/es gi\u1ED1ng h\u1EC7t nhau, kh\xF4ng c\xF3 \u0111u\xF4i -t: ich kann = er kann, ich muss = er muss, ich will = er will. S\u1ED1 nhi\u1EC1u chia b\xECnh th\u01B0\u1EDDng: wir k\xF6nnen, sie m\xFCssen.",
      "\u0110\u1ED5i \xE2m s\u1EAFc \u1EDF s\u1ED1 \xEDt: k\xF6nnen \u2192 kann, m\xFCssen \u2192 muss, d\xFCrfen \u2192 darf, m\xF6gen \u2192 mag/m\xF6chte. wollen v\xE0 sollen kh\xF4ng \u0111\u1ED5i: will, soll.",
      "C\u1EB7p d\u1EC5 nh\u1EA7m nh\u1EA5t khi thi: nicht m\xFCssen = KH\xD4NG C\u1EA6N (kh\xF4ng b\u1EAFt bu\u1ED9c) \u2260 nicht d\xFCrfen = KH\xD4NG \u0110\u01AF\u1EE2C (c\u1EA5m). \u201CDu musst nicht kommen\u201D l\xE0 \u201Canh kh\xF4ng c\u1EA7n \u0111\u1EBFn\u201D, kh\xF4ng ph\u1EA3i c\u1EA5m \u0111\u1EBFn.",
      "Qu\xE1 kh\u1EE9 khi n\xF3i d\xF9ng Pr\xE4teritum: konnte, musste, durfte, wollte, sollte \u2014 Gestern konnte ich nicht kommen. Xin ph\xE9p/\u0111\u1EC1 ngh\u1ECB l\u1ECBch s\u1EF1 d\xF9ng Konjunktiv II: K\xF6nnten Sie mir helfen? Ich m\xF6chte einen Termin."
    ],
    examples: [
      {
        de: "Ich muss heute l\xE4nger arbeiten.",
        note: "muss \u1EDF v\u1ECB tr\xED 2, arbeiten nguy\xEAn th\u1EC3 \u1EDF cu\u1ED1i c\xE2u."
      },
      {
        de: "Hier darf man nicht rauchen.",
        note: "nicht d\xFCrfen = c\u1EA5m: \u201C\u1EDE \u0111\xE2y kh\xF4ng \u0111\u01B0\u1EE3c h\xFAt thu\u1ED1c.\u201D"
      },
      {
        de: "Du musst nicht alles allein machen.",
        note: "nicht m\xFCssen = kh\xF4ng c\u1EA7n \u2014 s\u1EAFc th\xE1i ng\u01B0\u1EE3c h\u1EB3n c\xE2u tr\xEAn."
      },
      {
        de: "M\xF6chten Sie einen Kaffee?",
        note: "m\xF6chten \u2014 l\u1EDDi m\u1EDDi l\u1ECBch s\u1EF1, thay cho \u201CWollen Sie...?\u201D th\xF4 h\u01A1n."
      }
    ],
    exercise: "\u0110i\u1EC1n Modalverb \u0111\xFAng theo ngh\u0129a trong ngo\u1EB7c: 1) Man ___ im Krankenhaus nicht rauchen. (c\u1EA5m) 2) ___ du schwimmen? \u2014 Ja, sehr gut. (kh\u1EA3 n\u0103ng) 3) Du ___ nicht extra kommen, ich schaffe das allein. (kh\xF4ng c\u1EA7n) 4) Ich ___ gern einen Termin am Montag. (mu\u1ED1n, l\u1ECBch s\u1EF1)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) darf (nicht d\xFCrfen = c\u1EA5m) \xB7 2) Kannst (k\xF6nnen \u2014 kh\u1EA3 n\u0103ng) \xB7 3) musst (nicht m\xFCssen = kh\xF4ng c\u1EA7n) \xB7 4) m\xF6chte (mu\u1ED1n l\u1ECBch s\u1EF1). Ki\u1EC3m tra th\xEAm: \u1EDF c\u1EA3 4 c\xE2u, \u0111\u1ED9ng t\u1EEB ch\xEDnh (n\u1EBFu c\xF3) ph\u1EA3i \u1EDF nguy\xEAn th\u1EC3 cu\u1ED1i c\xE2u."
  },
  {
    id: "infinitiv-zu",
    name: "Infinitiv mit zu \u2014 \u0110\u1ED9ng t\u1EEB nguy\xEAn th\u1EC3 v\u1EDBi zu",
    nameVi: "versuchen zu ... \xB7 um ... zu ...",
    explain: "Nhi\u1EC1u \u0111\u1ED9ng t\u1EEB ti\u1EBFng \u0110\u1EE9c n\u1ED1i v\u1EDBi \u0111\u1ED9ng t\u1EEB th\u1EE9 hai b\u1EB1ng \u201Czu + nguy\xEAn th\u1EC3\u201D thay v\xEC m\u1ED9t c\xE2u ph\u1EE5: Ich versuche, jeden Tag zu \xFCben. Ba \xFD ph\u1EA3i n\u1EAFm: nh\u1EEFng \u0111\u1ED9ng t\u1EEB n\xE0o \u0111\xF2i zu, c\u1EE5m \u201Cum ... zu\u201D ch\u1EC9 m\u1EE5c \u0111\xEDch (ch\u1EC9 khi hai v\u1EBF c\xF9ng ch\u1EE7 ng\u1EEF), v\xE0 v\u1ECB tr\xED c\u1EE7a zu v\u1EDBi \u0111\u1ED9ng t\u1EEB t\xE1ch \u2014 zu chui v\xE0o gi\u1EEFa ti\u1EC1n t\u1ED1 v\xE0 g\u1ED1c, vi\u1EBFt li\u1EC1n m\u1ED9t t\u1EEB.",
    points: [
      "\u0110\u1ED9ng t\u1EEB/c\u1EA5u tr\xFAc hay \u0111i v\u1EDBi zu: anfangen, aufh\xF6ren, versuchen, vergessen, vorhaben, planen, hoffen, bitten, helfen (\u0111\xF4i khi kh\xF4ng zu \u1EDF B1 c\u01A1 b\u1EA3n th\xEC c\xF3), v\xE0 sau t\xEDnh t\u1EEB: Es ist wichtig/schwer/leicht, ... zu ... \u2014 Vergiss nicht, mich anzurufen!",
      "um ... zu = \u0110\u1EC2 (m\u1EE5c \u0111\xEDch), ch\u1EC9 khi ch\u1EE7 ng\u1EEF hai v\u1EBF gi\u1ED1ng nhau: Ich lerne Deutsch, um in Deutschland zu arbeiten. Ch\u1EE7 ng\u1EEF kh\xE1c nhau th\xEC ph\u1EA3i d\xF9ng damit + c\xE2u ph\u1EE5: Ich spreche langsam, damit alle mich verstehen.",
      "ohne ... zu = m\xE0 kh\xF4ng; (an)statt ... zu = thay v\xEC: Er ging, ohne ein Wort zu sagen. / Statt zu lernen, spielte er am Handy.",
      "\u0110\u1ED9ng t\u1EEB t\xE1ch: zu \u0111\u1EE9ng GI\u1EEEA, vi\u1EBFt li\u1EC1n: einkaufen \u2192 einzukaufen, aufstehen \u2192 aufzustehen, mitnehmen \u2192 mitzunehmen. Sau Modalverben th\xEC KH\xD4NG c\xF3 zu: Ich muss gehen. (kh\xF4ng ph\u1EA3i \u201Czu gehen\u201D)"
    ],
    examples: [
      {
        de: "Ich habe vor, n\xE4chstes Jahr die Pr\xFCfung zu machen.",
        note: "vorhaben + zu \u2014 \u201Ct\xF4i d\u1EF1 \u0111\u1ECBnh...\u201D."
      },
      {
        de: "Sie spart Geld, um ein Auto zu kaufen.",
        note: "um ... zu: m\u1EE5c \u0111\xEDch, c\xF9ng ch\u1EE7 ng\u1EEF \u201Csie\u201D \u1EDF c\u1EA3 hai v\u1EBF."
      },
      {
        de: "Er ist gegangen, ohne sich zu verabschieden.",
        note: "ohne ... zu: \u201Cra \u0111i m\xE0 kh\xF4ng ch\xE0o\u201D."
      },
      {
        de: "Denk daran, den Pass mitzunehmen!",
        note: "mitzunehmen: zu chui v\xE0o gi\u1EEFa mit- v\xE0 nehmen, vi\u1EBFt li\u1EC1n."
      }
    ],
    exercise: "N\u1ED1i hai c\xE2u th\xE0nh m\u1ED9t c\xE2u c\xF3 zu / um ... zu: 1) Ich versuche es. Ich \xFCbe jeden Tag. 2) Er spart Geld. Er will ein Haus kaufen. (m\u1EE5c \u0111\xEDch) 3) Vergiss nicht: Schlie\xDFe das Fenster! 4) Sie f\xE4ngt an. Sie lernt Klavier.",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) Ich versuche, jeden Tag zu \xFCben. \xB7 2) Er spart Geld, um ein Haus zu kaufen. \xB7 3) Vergiss nicht, das Fenster zu schlie\xDFen! \xB7 4) Sie f\xE4ngt an, Klavier zu lernen. T\u1EF1 ki\u1EC3m tra: c\xE2u 2 d\xF9ng \u0111\u01B0\u1EE3c um ... zu v\xEC c\xF9ng ch\u1EE7 ng\u1EEF \u201Cer\u201D; zu lu\xF4n \u0111\u1EE9ng s\xE1t tr\u01B0\u1EDBc \u0111\u1ED9ng t\u1EEB nguy\xEAn th\u1EC3 \u1EDF cu\u1ED1i."
  },
  {
    id: "komparativ",
    name: "Komparativ & Superlativ \u2014 So s\xE1nh h\u01A1n / nh\u1EA5t",
    nameVi: "gr\xF6\xDFer als ... \xB7 am gr\xF6\xDFten",
    explain: "So s\xE1nh l\xE0 c\xF4ng c\u1EE5 b\u1EAFt bu\u1ED9c c\u1EE7a N\xF3i Teil 2 (c\xE2n nh\u1EAFc hai l\u1EF1a ch\u1ECDn) v\xE0 r\u1EA5t hay xu\u1EA5t hi\u1EC7n trong \u0111\u1EC1 \u0110\u1ECDc. C\xF4ng th\u1EE9c g\u1ECDn: so s\xE1nh h\u01A1n = t\xEDnh t\u1EEB + -er, \u0111i v\u1EDBi als; so s\xE1nh nh\u1EA5t = am + t\xEDnh t\u1EEB + -sten. Ba l\u1ED7i gi\u1EBFt \u0111i\u1EC3m: d\xF9ng \u201Cwie\u201D thay cho \u201Cals\u201D \u1EDF so s\xE1nh h\u01A1n, vi\u1EBFt \u201Cmehr besser\u201D, v\xE0 qu\xEAn c\xE1c d\u1EA1ng b\u1EA5t quy t\u1EAFc gut/viel/g gern.",
    points: [
      "So s\xE1nh h\u01A1n: Adjektiv + -er + als: Berlin ist gr\xF6\xDFer als M\xFCnchen. T\xEDnh t\u1EEB m\u1ED9t \xE2m ti\u1EBFt th\u01B0\u1EDDng \u0111\u1ED5i \xE2m s\u1EAFc: alt \u2192 \xE4lter, gro\xDF \u2192 gr\xF6\xDFer, jung \u2192 j\xFCnger, kurz \u2192 k\xFCrzer, warm \u2192 w\xE4rmer.",
      "So s\xE1nh nh\u1EA5t: am + -sten khi \u0111\u1EE9ng m\u1ED9t m\xECnh/l\xE0m tr\u1EA1ng t\u1EEB: Er l\xE4uft am schnellsten. \u0110\u1EE9ng tr\u01B0\u1EDBc danh t\u1EEB th\xEC chia nh\u01B0 t\xEDnh t\u1EEB th\u01B0\u1EDDng: der schnellste Zug, die beste L\xF6sung.",
      "B\u1EA5t quy t\u1EAFc \u2014 thu\u1ED9c l\xF2ng: gut \u2192 besser \u2192 am besten; viel \u2192 mehr \u2192 am meisten; gern \u2192 lieber \u2192 am liebsten; hoch \u2192 h\xF6her \u2192 am h\xF6chsten; nah \u2192 n\xE4her \u2192 am n\xE4chsten.",
      "So s\xE1nh b\u1EB1ng: so + t\xEDnh t\u1EEB + wie: Er ist so gro\xDF wie ich. Kh\xE1c bi\u1EC7t: anders als ...; nhi\u1EC1u/\xEDt h\u01A1n: mehr/weniger ... als."
    ],
    examples: [
      {
        de: "Heute ist es k\xE4lter als gestern.",
        note: "k\xE4lter + als \u2014 so s\xE1nh h\u01A1n lu\xF4n \u0111i v\u1EDBi als."
      },
      {
        de: "Von allen F\xE4chern lerne ich Deutsch am liebsten.",
        note: "gern \u2192 lieber \u2192 am liebsten (b\u1EA5t quy t\u1EAFc)."
      },
      {
        de: "Diese L\xF6sung ist besser als die erste.",
        note: "gut \u2192 besser \u2014 kh\xF4ng bao gi\u1EDD \u201Cmehr gut / mehr besser\u201D."
      },
      {
        de: "Mein neues Handy ist so schnell wie deins.",
        note: "so ... wie: so s\xE1nh b\u1EB1ng nhau."
      }
    ],
    exercise: "\u0110i\u1EC1n d\u1EA1ng \u0111\xFAng: 1) Mein Bruder ist ___ als ich. (alt) 2) Das ist das ___ Buch im Regal. (gut \u2014 \u0111\u1EE9ng tr\u01B0\u1EDBc danh t\u1EEB \u201CBuch\u201D) 3) Im Winter ist es in Berlin ___ als in Saigon. (kalt) 4) Sie spricht Deutsch ___ als Englisch. (gern)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) \xE4lter \xB7 2) beste (sau das, Nominativ trung \u2192 \u0111u\xF4i -e) \xB7 3) k\xE4lter \xB7 4) lieber. T\u1EF1 ki\u1EC3m tra: so s\xE1nh h\u01A1n \u2192 als; so s\xE1nh b\u1EB1ng \u2192 wie; kh\xF4ng c\xF3 \u201Cmehr\u201D \u0111\u1EE9ng tr\u01B0\u1EDBc d\u1EA1ng -er."
  },
  {
    id: "trennbare-verben",
    name: "Trennbare & untrennbare Verben \u2014 \u0110\u1ED9ng t\u1EEB t\xE1ch / kh\xF4ng t\xE1ch",
    nameVi: "aufstehen \u2192 ich stehe auf \xB7 verstehen \u2192 ich verstehe",
    explain: "\u0110\u1ED9ng t\u1EEB c\xF3 ti\u1EC1n t\u1ED1 chia hai phe: ti\u1EC1n t\u1ED1 T\xC1CH \u0111\u01B0\u1EE3c th\xEC khi chia, ti\u1EC1n t\u1ED1 ch\u1EA1y v\u1EC1 cu\u1ED1i c\xE2u; ti\u1EC1n t\u1ED1 KH\xD4NG t\xE1ch th\xEC d\xEDnh ch\u1EB7t v\xE0o g\u1ED1c m\xE3i m\xE3i. Nh\u1EADn di\u1EC7n sai phe l\xE0 sai c\u1EA3 c\xE2u. D\u1EA5u hi\u1EC7u nghe: tr\u1ECDng \xE2m r\u01A1i v\xE0o ti\u1EC1n t\u1ED1 \u2192 t\xE1ch \u0111\u01B0\u1EE3c (\xC1UFstehen); tr\u1ECDng \xE2m r\u01A1i v\xE0o g\u1ED1c \u2192 kh\xF4ng t\xE1ch (verST\xC9Hen).",
    points: [
      "Ti\u1EC1n t\u1ED1 T\xC1CH (tr\u1ECDng \xE2m tr\xEAn ti\u1EC1n t\u1ED1): ab-, an-, auf-, aus-, ein-, mit-, nach-, vor-, zu-, weg-, weiter-... C\xE2u ch\xEDnh: Ich stehe um 6 Uhr auf. C\xE2u ph\u1EE5 th\xEC d\xEDnh l\u1EA1i: ..., weil ich um 6 Uhr aufstehe.",
      "Ti\u1EC1n t\u1ED1 KH\xD4NG t\xE1ch (tr\u1ECDng \xE2m tr\xEAn g\u1ED1c): be-, ge-, er-, ver-, zer-, ent-, emp-, miss-: Ich verstehe dich. \u2014 c\xE2u g\u1ECDn, kh\xF4ng c\xF3 g\xEC ch\u1EA1y v\u1EC1 cu\u1ED1i.",
      "H\u1EC7 qu\u1EA3 \u1EDF Perfekt: \u0111\u1ED9ng t\u1EEB kh\xF4ng t\xE1ch KH\xD4NG c\xF3 ge- trong Partizip II: verstanden, besucht, erkl\xE4rt. \u0110\u1ED9ng t\u1EEB t\xE1ch th\xEC ge- chui v\xE0o gi\u1EEFa: aufgestanden, eingekauft, angerufen.",
      "V\xE0i ti\u1EC1n t\u1ED1 l\u01B0\u1EE1ng t\xEDnh (durch-, \xFCber-, um-, unter-, wieder-) t\xE1ch hay kh\xF4ng t\xF9y ngh\u0129a \u2014 \u0111\u1EC3 sau; \u1EDF giai \u0111o\u1EA1n n\xE0y ch\u1EC9 c\u1EA7n ch\u1EAFc hai nh\xF3m ch\xEDnh \u1EDF tr\xEAn."
    ],
    examples: [
      {
        de: "Ich rufe dich morgen an.",
        note: "anrufen t\xE1ch: an- ch\u1EA1y v\u1EC1 cu\u1ED1i c\xE2u."
      },
      {
        de: "Der Zug f\xE4hrt um 8 Uhr ab.",
        note: "abfahren t\xE1ch: ab- \u1EDF cu\u1ED1i c\xE2u."
      },
      {
        de: "Sie versteht die Frage nicht.",
        note: "verstehen kh\xF4ng t\xE1ch \u2014 kh\xF4ng c\xF3 ti\u1EC1n t\u1ED1 n\xE0o \u1EDF cu\u1ED1i c\xE2u."
      },
      {
        de: "Wir sind gestern fr\xFCh aufgestanden.",
        note: "Perfekt c\u1EE7a aufstehen: auf-ge-standen \u2014 ge- chui v\xE0o gi\u1EEFa ti\u1EC1n t\u1ED1 v\xE0 g\u1ED1c."
      }
    ],
    exercise: "Vi\u1EBFt c\xE2u \u1EDF Pr\xE4sens, r\u1ED3i \u0111\u1ED5i sang Perfekt: 1) einkaufen \u2014 \u201CIch ___ heute ___.\u201D (Pr\xE4sens) 2) besuchen \u2014 \u201CEr ___ seine Oma.\u201D r\u1ED3i \u201CEr hat seine Oma ___.\u201D 3) anfangen \u2014 \u201CDer Kurs ___ um 9 Uhr ___.\u201D (Pr\xE4sens)",
    exerciseAnswer: "\u0110\xE1p \xE1n: 1) kaufe ... ein \u2014 Perfekt: Ich habe heute eingekauft. \xB7 2) besucht \u2014 Perfekt: Er hat seine Oma besucht. (besuchen kh\xF4ng t\xE1ch n\xEAn Partizip II kh\xF4ng c\xF3 ge-) \xB7 3) f\xE4ngt ... an \u2014 Perfekt: Der Kurs hat um 9 Uhr angefangen. Quy t\u1EAFc t\u1EF1 ki\u1EC3m tra: th\u1EA5y be-/ver-/er-/ent- \u1EDF \u0111\u1EA7u \u0111\u1ED9ng t\u1EEB \u2192 kh\xF4ng t\xE1ch, kh\xF4ng ge-."
  }
];
export {
  B1_TOPICS
};
