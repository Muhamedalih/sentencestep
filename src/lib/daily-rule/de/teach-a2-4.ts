/** German rules de-a2-46 ... de-a2-60 (this / every / which, polite and unreal, useful patterns). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A2_4: Readonly<Record<string, RuleTeach>> = {
  "de-a2-46": {
    idea: lines(
      "dieser (this), jeder (every) and welcher (which) take the endings of der / die / das: dieser Mann, diese Frau, dieses Haus; jeder Tag; welches Buch?",
      "dieser (هذا) وjeder (كل) وwelcher (أيّ) تأخذ نهايات der / die / das: dieser Mann، diese Frau، dieses Haus؛ jeder Tag؛ welches Buch؟",
      "dieser (este), jeder (cada) y welcher (cuál) toman las terminaciones de der / die / das: dieser Mann, diese Frau, dieses Haus; jeder Tag; welches Buch?",
      "dieser (bu), jeder (her) ve welcher (hangi) der / die / das'ın eklerini alır: dieser Mann, diese Frau, dieses Haus; jeder Tag; welches Buch?",
    ),
    right: "[Dieser] Mann ist nett.",
    wrong: "[Diese] Mann ist nett.",
    notes: [
      note(
        "detail",
        lines(
          "jeder is always singular: Jeder Tag ist anders. For more than one thing use alle: Alle Tage sind anders.",
          "jeder مفرد دائماً: Jeder Tag ist anders. وللأكثر من شيء نستعمل alle: Alle Tage sind anders.",
          "jeder es siempre singular: Jeder Tag ist anders. Para varias cosas usa alle: Alle Tage sind anders.",
          "jeder her zaman tekildir: Jeder Tag ist anders. Birden çok şey için alle kullan: Alle Tage sind anders.",
        ),
        ["[Jeder] Tag ist anders.", "[Alle] Tage sind anders."],
      ),
    ],
    items: [
      "[Dieser] Tisch ist neu.",
      "[Diese] Frau kenne ich.",
      "[Dieses] Buch ist gut.",
      "[Jeder] Tag ist anders.",
      "[Welches] Buch möchtest du?",
      "[Welche] Farbe magst du?",
    ],
  },
  "de-a2-47": {
    idea: lines(
      "würde + infinitive at the end is the easy way to say what you would do, or to be polite: Ich würde gern nach Spanien reisen. Würdest du mir helfen?",
      "würde + المصدر في الآخر هي الطريقة السهلة لقول ما كنت ستفعله أو للتهذيب: Ich würde gern nach Spanien reisen. Würdest du mir helfen؟",
      "würde + infinitivo al final es la forma fácil de decir lo que harías o de ser cortés: Ich würde gern nach Spanien reisen. Würdest du mir helfen?",
      "würde + sonda mastar, ne yapacağını söylemenin veya kibar olmanın kolay yoludur: Ich würde gern nach Spanien reisen. Würdest du mir helfen?",
    ),
    right: "Ich [würde] gern nach Spanien reisen.",
    wrong: "Ich [wurde] gern nach Spanien reisen.",
    notes: [
      note(
        "exception",
        lines(
          "Do not mix würde (would) with wurde (became). For sein, haben and the modals use wäre, hätte, könnte instead of würde.",
          "لا تخلط بين würde (كان سيفعل) وwurde (أصبح). ومع sein وhaben والأفعال المساعدة استعمل wäre وhätte وkönnte بدل würde.",
          "No mezcles würde (haría) con wurde (se hizo). Con sein, haben y los modales usa wäre, hätte, könnte en vez de würde.",
          "würde (-erdim) ile wurde (oldu) karıştırma. sein, haben ve kipli fiillerde würde yerine wäre, hätte, könnte kullan.",
        ),
        ["Das [wäre] schön.", "Ich [hätte] gern einen Tee."],
      ),
    ],
    items: [
      "Ich [würde] gern Pizza essen.",
      "[Würdest] du mir bitte helfen?",
      "Ich [würde] das nicht machen.",
      "Wir [würden] gern kommen.",
      "[Würden] Sie bitte das Fenster öffnen?",
      "An deiner Stelle [würde] ich warten.",
    ],
  },
  "de-a2-48": {
    idea: lines(
      "hätte and wäre are the polite or unreal forms of haben and sein: Ich hätte gern einen Kaffee. Das wäre schön.",
      "hätte وwäre هما صيغتا الأدب أو غير الواقع لـ haben وsein: Ich hätte gern einen Kaffee. Das wäre schön.",
      "hätte y wäre son las formas corteses o irreales de haben y sein: Ich hätte gern einen Kaffee. Das wäre schön.",
      "hätte ve wäre, haben ve sein'in kibar veya gerçek dışı biçimleridir: Ich hätte gern einen Kaffee. Das wäre schön.",
    ),
    right: "Ich [hätte] gern einen Kaffee.",
    wrong: "Ich [hatte] gern einen Kaffee.",
    notes: [
      note(
        "mistake",
        lines(
          "The umlaut matters: hatte (had) and hätte (would have), war and wäre. Write the dots, even if the answer box accepts a plain a.",
          "النقطتان مهمتان: hatte (كان لديه) وhätte (لَوَدَّ / سيكون لديه)، وwar وwäre. اكتب النقطتين حتى لو قبل مربع الإجابة a عادية.",
          "La diéresis importa: hatte (tenía) y hätte (tendría), war y wäre. Escribe los puntos, aunque la casilla acepte una a normal.",
          "Noktalar önemlidir: hatte (vardı) ve hätte (olurdu), war ve wäre. Cevap kutusu düz a'yı kabul etse de noktaları yaz.",
        ),
        ["Ich [hätte] gern Zeit.", "Das [wäre] schön."],
      ),
    ],
    items: [
      "Ich [hätte] gern einen Tee.",
      "Das [wäre] schön.",
      "Es [wäre] besser zu gehen.",
      "[Hättest] du Lust auf Kino?",
      "Wir [wären] gern dabei.",
      "Das [hätte] ich nicht gedacht.",
    ],
  },
  "de-a2-49": {
    idea: lines(
      "könnte and dürfte make a request polite, or say that something is possible: Könntest du mir helfen? Dürfte ich fragen? Es könnte regnen.",
      "könnte وdürfte تجعلان الطلب مهذّباً أو تقولان إن شيئاً ممكن: Könntest du mir helfen؟ Dürfte ich fragen؟ Es könnte regnen.",
      "könnte y dürfte vuelven cortés una petición o dicen que algo es posible: Könntest du mir helfen? Dürfte ich fragen? Es könnte regnen.",
      "könnte ve dürfte bir isteği kibar yapar veya bir şeyin mümkün olduğunu söyler: Könntest du mir helfen? Dürfte ich fragen? Es könnte regnen.",
    ),
    right: "[Könnten] Sie mir helfen?",
    wrong: "[Konnten] Sie mir helfen?",
    notes: [
      note(
        "detail",
        lines(
          "Compare: Kannst du mir helfen? (normal), Könntest du mir helfen? (more polite). konnte is the past: Ich konnte nicht kommen.",
          "قارن: Kannst du mir helfen؟ (عادي)، Könntest du mir helfen؟ (أكثر تهذيباً). وkonnte ماضٍ: Ich konnte nicht kommen.",
          "Compara: Kannst du mir helfen? (normal), Könntest du mir helfen? (más cortés). konnte es el pasado: Ich konnte nicht kommen.",
          "Karşılaştır: Kannst du mir helfen? (normal), Könntest du mir helfen? (daha kibar). konnte geçmiştir: Ich konnte nicht kommen.",
        ),
        ["[Könntest] du mir helfen?"],
      ),
    ],
    items: [
      "[Könntest] du mir helfen?",
      "[Könnten] Sie das wiederholen?",
      "[Dürfte] ich Sie etwas fragen?",
      "[Könnte] ich ein Glas Wasser haben?",
      "Das [könnte] morgen regnen.",
      "[Könnten] wir später sprechen?",
    ],
  },
  "de-a2-50": {
    idea: lines(
      "For an unreal condition use wenn + hätte / wäre in the wenn-clause and würde in the main clause: Wenn ich Zeit hätte, würde ich reisen.",
      "للشرط غير الواقعي استعمل wenn + hätte / wäre في جملة الشرط وwürde في الجملة الرئيسية: Wenn ich Zeit hätte, würde ich reisen.",
      "Para una condición irreal usa wenn + hätte / wäre en la oración con wenn y würde en la principal: Wenn ich Zeit hätte, würde ich reisen.",
      "Gerçek dışı koşul için wenn cümlesinde hätte / wäre, ana cümlede würde kullan: Wenn ich Zeit hätte, würde ich reisen.",
    ),
    right: "Wenn ich viel Geld [hätte], würde ich reisen.",
    wrong: "Wenn ich viel Geld [habe], würde ich reisen.",
    notes: [
      note(
        "detail",
        lines(
          "Avoid würde in the wenn-clause: Wenn ich reisen könnte (not Wenn ich reisen würde). The wenn-clause often uses hätte, wäre or a modal like könnte.",
          "تجنّب würde في جملة wenn: Wenn ich reisen könnte (وليس Wenn ich reisen würde). وغالباً تستعمل جملة wenn كلمة hätte أو wäre أو فعلاً مثل könnte.",
          "Evita würde en la oración con wenn: Wenn ich reisen könnte (no Wenn ich reisen würde). Esa oración suele usar hätte, wäre o un modal como könnte.",
          "wenn cümlesinde würde'den kaçın: Wenn ich reisen könnte (Wenn ich reisen würde değil). Bu cümlede çoğunlukla hätte, wäre veya könnte gibi kipli fiil kullanılır.",
        ),
        ["Wenn ich reisen [könnte], wäre ich glücklich."],
      ),
    ],
    items: [
      "Wenn ich viel Geld [hätte], würde ich reisen.",
      "Wenn ich du [wäre], würde ich lernen.",
      "Wenn wir Zeit [hätten], würden wir kommen.",
      "Wenn er hier [wäre], würden wir feiern.",
      "Wenn sie mehr Zeit [hätte], würde sie mehr lesen.",
      "Wenn es wärmer [wäre], würden wir schwimmen.",
    ],
  },
  "de-a2-51": {
    idea: lines(
      "To express a wish that is not true, use ich wünschte + a clause with hätte, wäre or könnte: Ich wünschte, ich hätte mehr Zeit.",
      "للتعبير عن أمنية غير محققة استعمل ich wünschte + جملة فيها hätte أو wäre أو könnte: Ich wünschte, ich hätte mehr Zeit.",
      "Para expresar un deseo que no es real, usa ich wünschte + una oración con hätte, wäre o könnte: Ich wünschte, ich hätte mehr Zeit.",
      "Gerçek olmayan bir dilek için ich wünschte + hätte, wäre veya könnte içeren bir cümle kullan: Ich wünschte, ich hätte mehr Zeit.",
    ),
    right: "Ich [wünschte], ich hätte mehr Zeit.",
    wrong: "Ich [wünsche], ich habe mehr Zeit.",
    notes: [
      note(
        "detail",
        lines(
          "A short form is also common: Hätte ich doch mehr Zeit! or Wenn ich doch mehr Zeit hätte! The word doch adds feeling.",
          "وتوجد صيغة أقصر شائعة أيضاً: Hätte ich doch mehr Zeit! أو Wenn ich doch mehr Zeit hätte! وكلمة doch تضيف الشعور.",
          "También es común una forma corta: Hätte ich doch mehr Zeit! o Wenn ich doch mehr Zeit hätte! La palabra doch añade emoción.",
          "Kısa biçim de yaygındır: Hätte ich doch mehr Zeit! veya Wenn ich doch mehr Zeit hätte! doch sözcüğü duygu katar.",
        ),
        ["[Hätte] ich doch mehr Zeit!"],
      ),
    ],
    items: [
      "Ich [wünschte], ich hätte mehr Zeit.",
      "Ich [wünschte], es wäre Sommer.",
      "Er [wünschte], er könnte fliegen.",
      "Wir [wünschten], wir wären dort.",
      "Sie [wünschte], sie hätte ein Haus.",
      "Ich [wünschte], ich wüsste mehr.",
    ],
  },
  "de-a2-52": {
    idea: lines(
      "Some conjunctions come in pairs: nicht nur ... sondern auch, sowohl ... als auch, entweder ... oder, weder ... noch.",
      "بعض أدوات الربط تأتي أزواجاً: nicht nur ... sondern auch وsowohl ... als auch وentweder ... oder وweder ... noch.",
      "Algunas conjunciones vienen en pareja: nicht nur ... sondern auch, sowohl ... als auch, entweder ... oder, weder ... noch.",
      "Bazı bağlaçlar çift gelir: nicht nur ... sondern auch, sowohl ... als auch, entweder ... oder, weder ... noch.",
    ),
    right: "Er spricht nicht nur Deutsch, [sondern] auch Englisch.",
    wrong: "Er spricht nicht nur Deutsch, [aber] auch Englisch.",
    notes: [
      note(
        "mistake",
        lines(
          "sondern is for correcting something negative: Nicht rot, sondern blau. aber just adds a contrast: Ich bin müde, aber ich komme.",
          "sondern لتصحيح ما نُفي: Nicht rot, sondern blau. أما aber فتضيف تناقضاً فقط: Ich bin müde, aber ich komme.",
          "sondern sirve para corregir algo negado: Nicht rot, sondern blau. aber solo añade un contraste: Ich bin müde, aber ich komme.",
          "sondern olumsuzu düzeltmek içindir: Nicht rot, sondern blau. aber sadece karşıtlık ekler: Ich bin müde, aber ich komme.",
        ),
        ["Nicht rot, [sondern] blau.", "Ich bin müde, [aber] ich komme."],
      ),
    ],
    items: [
      "Sie ist nicht nur klug, [sondern] auch nett.",
      "Ich spreche [sowohl] Arabisch als auch Deutsch.",
      "Wir fahren [entweder] mit dem Bus oder mit dem Zug.",
      "Er hat [weder] Zeit noch Geld.",
      "Ich mag nicht nur Tee, [sondern] auch Kaffee.",
      "Sie spricht [sowohl] Englisch als auch Spanisch.",
    ],
  },
  "de-a2-53": {
    idea: lines(
      "zwar ... aber admits one thing and then adds a contrast: Das Hotel ist zwar teuer, aber sehr schön.",
      "zwar ... aber تقرّ بأمر ثم تضيف تناقضاً: Das Hotel ist zwar teuer, aber sehr schön.",
      "zwar ... aber admite una cosa y luego añade un contraste: Das Hotel ist zwar teuer, aber sehr schön.",
      "zwar ... aber bir şeyi kabul eder, sonra karşıtlık ekler: Das Hotel ist zwar teuer, aber sehr schön.",
    ),
    right: "Das Hotel ist [zwar] teuer, aber sehr schön.",
    wrong: "Das Hotel ist [zwar] teuer, [sondern] sehr schön.",
    notes: [
      note(
        "detail",
        lines(
          "zwar goes in the first part, usually after the verb, and aber starts the second part. aber does not change the word order.",
          "تقع zwar في الجزء الأول، غالباً بعد الفعل، وتبدأ aber الجزء الثاني. وaber لا تغيّر ترتيب الكلمات.",
          "zwar va en la primera parte, normalmente tras el verbo, y aber abre la segunda. aber no cambia el orden de las palabras.",
          "zwar ilk bölümde, genellikle fiilden sonra durur; aber ikinci bölümü başlatır. aber sözcük sırasını değiştirmez.",
        ),
        ["Ich bin [zwar] müde, aber ich komme."],
      ),
    ],
    items: [
      "Das Hotel ist [zwar] teuer, aber sehr schön.",
      "Ich bin [zwar] müde, aber ich komme.",
      "Er ist [zwar] klein, aber stark.",
      "Das Essen war [zwar] gut, aber zu teuer.",
      "Sie hat [zwar] wenig Zeit, aber sie hilft.",
      "Es ist [zwar] kalt, aber die Sonne scheint.",
    ],
  },
  "de-a2-54": {
    idea: lines(
      "wegen (because of), trotz (despite) and statt (instead of) take the genitive: wegen des Wetters, trotz des Regens, statt des Autos.",
      "wegen (بسبب) وtrotz (رغم) وstatt (بدلاً من) تأخذ الإضافة (Genitiv): wegen des Wetters، trotz des Regens، statt des Autos.",
      "wegen (a causa de), trotz (a pesar de) y statt (en lugar de) llevan genitivo: wegen des Wetters, trotz des Regens, statt des Autos.",
      "wegen (yüzünden), trotz (rağmen) ve statt (yerine) Genitiv alır: wegen des Wetters, trotz des Regens, statt des Autos.",
    ),
    right: "[Wegen] des Regens bleiben wir hier.",
    wrong: "[Weil] des Regens bleiben wir hier.",
    notes: [
      note(
        "mistake",
        lines(
          "weil starts a clause with a verb: weil es regnet. wegen goes before a noun: wegen des Regens. In speech people often say wegen dem Wetter, but the genitive is correct.",
          "weil تبدأ جملة فيها فعل: weil es regnet. وwegen تأتي قبل اسم: wegen des Regens. وفي الكلام يقول الناس wegen dem Wetter، لكن الإضافة هي الصحيحة.",
          "weil abre una oración con verbo: weil es regnet. wegen va delante de un sustantivo: wegen des Regens. Al hablar se oye wegen dem Wetter, pero lo correcto es el genitivo.",
          "weil fiilli bir cümle açar: weil es regnet. wegen isimden önce gelir: wegen des Regens. Konuşmada wegen dem Wetter de duyulur, ama doğrusu Genitiv'dir.",
        ),
        ["[Weil] es regnet, bleiben wir hier.", "[Wegen] des Regens bleiben wir hier."],
      ),
    ],
    items: [
      "[Wegen] des Wetters bleiben wir zu Hause.",
      "[Trotz] des Regens gehen wir spazieren.",
      "Ich nehme den Bus [statt] des Autos.",
      "[Wegen] der Kälte trage ich eine Jacke.",
      "[Trotz] der Kälte schwimmt er.",
      "Sie kommt [wegen] ihres Bruders.",
    ],
  },
  "de-a2-55": {
    idea: lines(
      "Ordinal numbers (first, second ...) end in -te up to 19 and -ste from 20: der erste, zweite, dritte, vierte ... zwanzigste. They take adjective endings.",
      "الأعداد الترتيبية (الأول، الثاني ...) تنتهي بـ -te حتى 19 وبـ -ste من 20: der erste، zweite، dritte، vierte ... zwanzigste. وتأخذ نهايات الصفات.",
      "Los ordinales (primero, segundo ...) acaban en -te hasta 19 y en -ste desde 20: der erste, zweite, dritte, vierte ... zwanzigste. Toman terminaciones de adjetivo.",
      "Sıra sayıları (birinci, ikinci ...) 19'a kadar -te, 20'den sonra -ste ile biter: der erste, zweite, dritte, vierte ... zwanzigste. Sıfat ekleri alır.",
    ),
    right: "Heute ist der [erste] Mai.",
    wrong: "Heute ist der [eins] Mai.",
    notes: [
      note(
        "exception",
        lines(
          "Four are irregular: erste, dritte, siebte, achte. For dates use am + dative: am ersten Mai, am dritten Juni.",
          "أربعة منها شاذة: erste وdritte وsiebte وachte. وللتواريخ نستعمل am + حالة الجر: am ersten Mai، am dritten Juni.",
          "Cuatro son irregulares: erste, dritte, siebte, achte. Para fechas usa am + dativo: am ersten Mai, am dritten Juni.",
          "Dördü düzensizdir: erste, dritte, siebte, achte. Tarihler için am + Dativ kullan: am ersten Mai, am dritten Juni.",
        ),
        ["Mein Geburtstag ist am [dritten] Juni."],
      ),
    ],
    items: [
      "Heute ist der [erste] Mai.",
      "Mein Geburtstag ist am [dritten] Juni.",
      "Wir fahren am [zehnten] August.",
      "Er wohnt im [zweiten] Stock.",
      "Das ist das [vierte] Mal.",
      "Am [zwanzigsten] Mai ist die Party.",
    ],
  },
  "de-a2-56": {
    idea: lines(
      "seit (since, for) and vor (ago) take the dative: seit zwei Jahren, vor zwei Tagen. bis means until and ab means from: bis Montag, ab Montag.",
      "seit (منذ) وvor (قبل) تأخذان حالة الجر: seit zwei Jahren، vor zwei Tagen. وbis تعني حتى وab تعني ابتداءً من: bis Montag، ab Montag.",
      "seit (desde, hace) y vor (hace) llevan dativo: seit zwei Jahren, vor zwei Tagen. bis significa hasta y ab desde: bis Montag, ab Montag.",
      "seit (-den beri) ve vor (önce) Dativ alır: seit zwei Jahren, vor zwei Tagen. bis -e kadar, ab -den itibaren demektir: bis Montag, ab Montag.",
    ),
    right: "Ich wohne [seit] zwei Jahren hier.",
    wrong: "Ich wohne [vor] zwei Jahren hier.",
    notes: [
      note(
        "exception",
        lines(
          "With seit, use the present when it is still true: Ich wohne seit zwei Jahren hier (not Ich habe seit zwei Jahren gewohnt).",
          "مع seit استعمل المضارع إذا كان الأمر مستمراً: Ich wohne seit zwei Jahren hier (وليس Ich habe seit zwei Jahren gewohnt).",
          "Con seit usa el presente si sigue siendo verdad: Ich wohne seit zwei Jahren hier (no Ich habe seit zwei Jahren gewohnt).",
          "seit ile hâlâ geçerliyse şimdiki zamanı kullan: Ich wohne seit zwei Jahren hier (Ich habe seit zwei Jahren gewohnt değil).",
        ),
        ["Ich lerne [seit] einem Jahr Deutsch."],
      ),
    ],
    items: [
      "Ich lerne [seit] einem Jahr Deutsch.",
      "Er ist [vor] zwei Tagen gekommen.",
      "Wir bleiben [bis] Montag.",
      "[Ab] Montag arbeite ich.",
      "Sie wohnt [seit] 2020 hier.",
      "Das war [vor] drei Wochen.",
    ],
  },
  "de-a2-57": {
    idea: lines(
      "nicht usually stands at the end of the sentence. It moves in front of the part it negates: an adjective, a place, a participle, or the prefix of a separable verb.",
      "تقف nicht غالباً في آخر الجملة. وتنتقل قبل الجزء الذي تنفيه: صفة أو مكان أو اسم مفعول أو بادئة فعل منفصل.",
      "nicht suele ir al final de la frase. Pasa delante de lo que niega: un adjetivo, un lugar, un participio o el prefijo de un verbo separable.",
      "nicht genellikle cümlenin sonunda durur. Olumsuzladığı şeyin önüne geçer: bir sıfat, bir yer, bir ortaç veya ayrılabilen fiilin öneki.",
    ),
    right: "Ich habe das Buch [nicht] gelesen.",
    wrong: "Ich habe das Buch gelesen [nicht].",
    notes: [
      note(
        "detail",
        lines(
          "Examples: Ich komme nicht. (end) Das ist nicht gut. (before an adjective) Wir fahren nicht nach Berlin. (before a place) Ich rufe ihn nicht an. (before the prefix)",
          "أمثلة: Ich komme nicht. (في الآخر) Das ist nicht gut. (قبل صفة) Wir fahren nicht nach Berlin. (قبل مكان) Ich rufe ihn nicht an. (قبل البادئة)",
          "Ejemplos: Ich komme nicht. (al final) Das ist nicht gut. (antes de un adjetivo) Wir fahren nicht nach Berlin. (antes de un lugar) Ich rufe ihn nicht an. (antes del prefijo)",
          "Örnekler: Ich komme nicht. (sonda) Das ist nicht gut. (sıfattan önce) Wir fahren nicht nach Berlin. (yerden önce) Ich rufe ihn nicht an. (önekten önce)",
        ),
        ["Ich rufe ihn [nicht] an.", "Das ist [nicht] gut."],
      ),
    ],
    items: [
      "Ich habe das Buch [nicht] gelesen.",
      "Er ist [nicht] gekommen.",
      "Wir fahren [nicht] nach Berlin.",
      "Ich gehe heute [nicht] ins Kino.",
      "Das Essen ist [nicht] gut.",
      "Sie hat [nicht] angerufen.",
    ],
  },
  "de-a2-58": {
    idea: lines(
      "In a subordinate clause with the Perfekt, the participle comes first and the helper verb last: weil ich spät aufgestanden bin.",
      "في الجملة التابعة مع الـ Perfekt يأتي الـ Partizip أولاً ثم الفعل المساعد في آخر الجملة: weil ich spät aufgestanden bin.",
      "En una oración subordinada con Perfekt, el participio va primero y el verbo auxiliar al final: weil ich spät aufgestanden bin.",
      "Perfekt'li yan cümlede önce ortaç, en sonda yardımcı fiil gelir: weil ich spät aufgestanden bin.",
    ),
    right: "Ich komme nicht, weil ich krank gewesen [bin].",
    wrong: "Ich komme nicht, weil ich krank [bin] gewesen.",
    notes: [
      note(
        "detail",
        lines(
          "Main clause: Ich bin spät aufgestanden. Subordinate clause: ..., weil ich spät aufgestanden bin. The two verbs swap places.",
          "في الجملة الرئيسية: Ich bin spät aufgestanden. وفي التابعة: ..., weil ich spät aufgestanden bin. يتبادل الفعلان موقعيهما.",
          "Oración principal: Ich bin spät aufgestanden. Subordinada: ..., weil ich spät aufgestanden bin. Los dos verbos intercambian el lugar.",
          "Ana cümle: Ich bin spät aufgestanden. Yan cümle: ..., weil ich spät aufgestanden bin. İki fiil yer değiştirir.",
        ),
        ["Er ist müde, weil er lange gearbeitet [hat]."],
      ),
    ],
    items: [
      "Ich komme nicht, weil ich spät aufgestanden [bin].",
      "Er ist müde, weil er lange gearbeitet [hat].",
      "Ich weiß, dass sie schon gegangen [ist].",
      "Sie sagt, dass wir viel gelernt [haben].",
      "Wir wissen, dass du gestern hier gewesen [bist].",
      "Es ist schade, dass du nicht gekommen [bist].",
    ],
  },
  "de-a2-59": {
    idea: lines(
      "hier means here, dort and da mean there. For movement use hierher (to here) and dorthin (to there).",
      "hier تعني هنا، وdort وda تعنيان هناك. وللحركة نستعمل hierher (إلى هنا) وdorthin (إلى هناك).",
      "hier significa aquí, dort y da significan allí. Para el movimiento usa hierher (hacia aquí) y dorthin (hacia allí).",
      "hier burada, dort ve da orada demektir. Hareket için hierher (buraya) ve dorthin (oraya) kullan.",
    ),
    right: "[Dort] wohnt meine Tante.",
    wrong: "[Dorthin] wohnt meine Tante.",
    notes: [
      note(
        "detail",
        lines(
          "Like wo, wohin, woher: hier – hierher; dort – dorthin; and from there: von hier, von dort. Komm hierher! Ich gehe dorthin.",
          "كما في wo وwohin وwoher: hier – hierher؛ dort – dorthin؛ ومن هناك: von hier وvon dort. Komm hierher! Ich gehe dorthin.",
          "Como wo, wohin, woher: hier – hierher; dort – dorthin; y desde allí: von hier, von dort. Komm hierher! Ich gehe dorthin.",
          "wo, wohin, woher gibi: hier – hierher; dort – dorthin; oradan: von hier, von dort. Komm hierher! Ich gehe dorthin.",
        ),
        ["Komm [hierher]!", "Ich gehe [dorthin]."],
      ),
    ],
    items: [
      "Ich wohne [hier].{here}",
      "[Dort] steht ein Haus.",
      "Ist [da] jemand?",
      "Komm [hierher]!{here (to)}",
      "Ich gehe [dorthin].{there (to)}",
      "Die Bücher liegen [hier].",
    ],
  },
  "de-a2-60": {
    idea: lines(
      "wissen is to know a fact; kennen is to know a person, a place or a thing (to be familiar with): Ich weiß, dass er krank ist. Ich kenne Anna.",
      "wissen هي معرفة معلومة؛ وkennen هي معرفة شخص أو مكان أو شيء (الإلمام به): Ich weiß, dass er krank ist. Ich kenne Anna.",
      "wissen es saber un dato; kennen es conocer a una persona, un lugar o una cosa: Ich weiß, dass er krank ist. Ich kenne Anna.",
      "wissen bir bilgiyi bilmektir; kennen bir kişiyi, yeri ya da şeyi tanımaktır: Ich weiß, dass er krank ist. Ich kenne Anna.",
    ),
    right: "Ich [kenne] Anna.",
    wrong: "Ich [weiß] Anna.",
    notes: [
      note(
        "mistake",
        lines(
          "Some languages use one verb for both. German has two, like Spanish saber / conocer and Turkish bilmek / tanımak. Ask yourself: a fact (wissen) or someone / something (kennen)?",
          "بعض اللغات تستعمل فعلاً واحداً للمعنيين، أما الألمانية ففيها فعلان. اسأل نفسك: معلومة (wissen) أم شخص / شيء (kennen)؟",
          "Como en español saber / conocer: wissen es para un dato, kennen para alguien o algo. Pregúntate: ¿un dato (wissen) o alguien / algo (kennen)?",
          "Türkçedeki bilmek / tanımak gibi: wissen bilgi için, kennen biri veya bir şey için. Kendine sor: bilgi mi (wissen) kişi / şey mi (kennen)?",
        ),
        ["Ich [weiß], wo er wohnt.", "Ich [kenne] diese Stadt."],
      ),
    ],
    items: [
      "Ich [kenne] diesen Mann nicht.",
      "Ich [weiß] seine Adresse nicht.",
      "[Kennst] du Berlin?",
      "Ich [weiß], dass er krank ist.",
      "Sie [kennt] viele Leute.",
      "[Weißt] du, wo er wohnt?",
    ],
  },
};
