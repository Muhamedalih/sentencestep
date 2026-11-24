/** German rules de-a2-16 ... de-a2-30 (adjectives, comparison, subordinate clauses). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A2_2: Readonly<Record<string, RuleTeach>> = {
  "de-a2-16": {
    idea: lines(
      "After der, die, das an adjective takes -e or -en. -e: nominative singular and feminine / neuter accusative. -en: everywhere else.",
      "بعد der وdie وdas تأخذ الصفة -e أو -en. تكون -e في المرفوع المفرد وفي المفعول به للمؤنث والمحايد، و-en في كل ما عداه.",
      "Tras der, die, das el adjetivo toma -e o -en. -e: nominativo singular y acusativo femenino / neutro. -en: en todo lo demás.",
      "der, die, das'tan sonra sıfat -e veya -en alır. -e: yalın tekil ve dişil / nötr Akkusativ. -en: geri kalan her yerde.",
    ),
    right: "Der [alte] Mann liest.",
    wrong: "Der [alter] Mann liest.",
    notes: [
      note(
        "detail",
        lines(
          "Examples: der alte Mann, die alte Frau, das alte Haus, die alten Leute; den alten Mann, dem alten Mann, der alten Frau.",
          "أمثلة: der alte Mann، die alte Frau، das alte Haus، die alten Leute؛ den alten Mann، dem alten Mann، der alten Frau.",
          "Ejemplos: der alte Mann, die alte Frau, das alte Haus, die alten Leute; den alten Mann, dem alten Mann, der alten Frau.",
          "Örnekler: der alte Mann, die alte Frau, das alte Haus, die alten Leute; den alten Mann, dem alten Mann, der alten Frau.",
        ),
        ["Ich sehe den [alten] Mann.", "Ich helfe der [alten] Frau."],
      ),
    ],
    items: [
      "Der [alte] Mann liest eine Zeitung.",
      "Ich sehe den [alten] Mann.",
      "Die [kleine] Katze schläft.",
      "Das [neue] Auto ist schnell.",
      "Ich helfe der [alten] Frau.",
      "Wir mögen die [großen] Städte.",
    ],
  },
  "de-a2-17": {
    idea: lines(
      "After ein, eine, kein the adjective shows the gender where the article does not: ein alter Mann, eine alte Frau, ein altes Haus.",
      "بعد ein وeine وkein وmein تُظهر الصفة الجنس حيث لا تُظهره الأداة: ein alter Mann (-er)، eine alte Frau (-e)، ein altes Haus (-es). وفي الحالات الأخرى تأخذ -e أو -en.",
      "Tras ein, eine, kein, mein el adjetivo muestra el género donde el artículo no lo hace: ein alter Mann (-er), eine alte Frau (-e), ein altes Haus (-es). En los demás casos toma -e o -en.",
      "ein, eine, kein, mein'den sonra, artikelin göstermediği yerde sıfat cinsiyeti gösterir: ein alter Mann (-er), eine alte Frau (-e), ein altes Haus (-es). Diğer durumlarda -e veya -en alır.",
    ),
    right: "Das ist ein [alter] Mann.",
    wrong: "Das ist ein [alte] Mann.",
    notes: [
      note(
        "detail",
        lines(
          "Only three endings are special: nominative masculine -er, nominative neuter -es, accusative neuter -es. All the rest is -e or -en.",
          "ثلاث نهايات فقط خاصة: المرفوع المذكر -er، والمرفوع المحايد -es، والمفعول به المحايد -es. وكل ما عداها -e أو -en.",
          "Solo tres terminaciones son especiales: nominativo masculino -er, nominativo neutro -es, acusativo neutro -es. El resto es -e o -en.",
          "Sadece üç ek özeldir: yalın eril -er, yalın nötr -es, nötr Akkusativ -es. Geri kalanı -e veya -en'dir.",
        ),
        ["Er hat ein [altes] Auto.", "Wir haben einen [großen] Garten."],
      ),
    ],
    items: [
      "Das ist ein [guter] Freund.",
      "Ich habe eine [neue] Wohnung.",
      "Er hat ein [altes] Auto.",
      "Wir haben einen [großen] Garten.",
      "Sie wohnt in einem [kleinen] Haus.",
      "Das ist keine [schlechte] Idee.",
    ],
  },
  "de-a2-18": {
    idea: lines(
      "With no article, the adjective itself shows the case, with the endings of der / die / das: guter Kaffee, kalte Milch, frisches Brot, gute Freunde.",
      "بلا أداة تُظهر الصفة نفسها الحالة بنهايات der / die / das: guter Kaffee، kalte Milch، frisches Brot، gute Freunde.",
      "Sin artículo, el propio adjetivo muestra el caso, con las terminaciones de der / die / das: guter Kaffee, kalte Milch, frisches Brot, gute Freunde.",
      "Artikel yoksa sıfatın kendisi hâli gösterir, der / die / das'ın ekleriyle: guter Kaffee, kalte Milch, frisches Brot, gute Freunde.",
    ),
    right: "Ich trinke [kalte] Milch.",
    wrong: "Ich trinke [kalt] Milch.",
    notes: [
      note(
        "detail",
        lines(
          "Think of it as the missing article moving onto the adjective: der Kaffee → guter Kaffee, das Brot → frisches Brot, die Milch → kalte Milch.",
          "فكّر فيها كأن الأداة المفقودة انتقلت إلى الصفة: der Kaffee ← guter Kaffee، das Brot ← frisches Brot، die Milch ← kalte Milch.",
          "Piensa que el artículo que falta pasa al adjetivo: der Kaffee → guter Kaffee, das Brot → frisches Brot, die Milch → kalte Milch.",
          "Eksik artikelin sıfata geçtiğini düşün: der Kaffee → guter Kaffee, das Brot → frisches Brot, die Milch → kalte Milch.",
        ),
        ["Ich mag [guten] Kaffee.", "Wir essen [frisches] Brot."],
      ),
    ],
    items: [
      "Ich trinke [kalte] Milch.",
      "Wir essen [frisches] Brot.",
      "Sie hat [schöne] Augen.",
      "Ich mag [guten] Kaffee.",
      "Das sind [nette] Leute.",
      "Ich brauche [warme] Kleidung.",
    ],
  },
  "de-a2-19": {
    idea: lines(
      "To compare, add -er to the adjective and use als: Mein Bruder ist größer als ich. Short adjectives often get an umlaut: alt → älter.",
      "للمقارنة أضف -er إلى الصفة واستعمل als: Mein Bruder ist größer als ich. والصفات القصيرة تأخذ غالباً نقطتين: alt ← älter.",
      "Para comparar, añade -er al adjetivo y usa als: Mein Bruder ist größer als ich. Los adjetivos cortos suelen llevar diéresis: alt → älter.",
      "Karşılaştırmak için sıfata -er ekle ve als kullan: Mein Bruder ist größer als ich. Kısa sıfatlar çoğu zaman ünlü değiştirir: alt → älter.",
    ),
    right: "Mein Bruder ist [größer] als ich.",
    wrong: "Mein Bruder ist [mehr groß] als ich.",
    notes: [
      note(
        "exception",
        lines(
          "Adjectives ending in -el, -er, -en lose an e: teuer → teurer, dunkel → dunkler. Many short ones add an umlaut: alt, groß, jung, kalt, warm, lang.",
          "الصفات المنتهية بـ -el أو -er أو -en تفقد حرف e: teuer ← teurer، dunkel ← dunkler. وكثير من القصيرة تأخذ نقطتين: alt وgroß وjung وkalt وwarm وlang.",
          "Los adjetivos en -el, -er, -en pierden una e: teuer → teurer, dunkel → dunkler. Muchos cortos añaden diéresis: alt, groß, jung, kalt, warm, lang.",
          "-el, -er, -en ile biten sıfatlar bir e kaybeder: teuer → teurer, dunkel → dunkler. Birçok kısa sıfat ünlü değiştirir: alt, groß, jung, kalt, warm, lang.",
        ),
        ["Der Zug ist [teurer] als der Bus.", "Heute ist es [kälter] als gestern."],
      ),
    ],
    items: [
      "Das Auto ist [schneller] als das Fahrrad.{schnell}",
      "Berlin ist [größer] als Bonn.{groß}",
      "Mein Vater ist [älter] als meine Mutter.{alt}",
      "Der Zug ist [teurer] als der Bus.{teuer}",
      "Heute ist es [kälter] als gestern.{kalt}",
      "Sie ist [jünger] als er.{jung}",
    ],
  },
  "de-a2-20": {
    idea: lines(
      "The superlative (the most) after am ends in -sten: am schnellsten, am teuersten. After a -d, -t, -s, -ß or -z the ending is -esten: am ältesten, am heißesten.",
      "صيغة التفضيل (الأكثر) بعد am تنتهي بـ -sten: am schnellsten، am teuersten. وبعد -d أو -t أو -s أو -ß أو -z تكون النهاية -esten: am ältesten، am heißesten.",
      "El superlativo con am acaba en -sten: am schnellsten, am teuersten. Tras -d, -t, -s, -ß o -z la terminación es -esten: am ältesten, am heißesten.",
      "am ile enüstünlük -sten ile biter: am schnellsten, am teuersten. -d, -t, -s, -ß veya -z'den sonra ek -esten olur: am ältesten, am heißesten.",
    ),
    right: "Er läuft am [schnellsten].",
    wrong: "Er läuft am [schnellster].",
    notes: [
      note(
        "detail",
        lines(
          "Before a noun the superlative works like any adjective: Er ist der schnellste Läufer. Irregular ones are in the next rules: gut → am besten.",
          "قبل الاسم تعمل مثل أي صفة: Er ist der schnellste Läufer. وغير المنتظمة في قاعدة لاحقة: gut ← am besten.",
          "Antes de un sustantivo funciona como cualquier adjetivo: Er ist der schnellste Läufer. Los irregulares están en otra regla: gut → am besten.",
          "İsimden önce her sıfat gibi çalışır: Er ist der schnellste Läufer. Düzensizler başka bir kuralda: gut → am besten.",
        ),
        ["Er ist der [schnellste] Läufer."],
      ),
    ],
    items: [
      "Er läuft am [schnellsten].{schnell}",
      "Das ist am [teuersten].{teuer}",
      "Sie ist am [jüngsten].{jung}",
      "Mein Bruder ist am [ältesten].{alt}",
      "Im Sommer ist es am [wärmsten].{warm}",
      "Dieses Auto ist am [schönsten].{schön}",
    ],
  },
  "de-a2-21": {
    idea: lines(
      "A few common words are irregular: gut – besser – am besten, viel – mehr – am meisten, gern – lieber – am liebsten, hoch – höher – am höchsten.",
      "بضع كلمات شائعة شاذة: gut – besser – am besten، viel – mehr – am meisten، gern – lieber – am liebsten، hoch – höher – am höchsten.",
      "Unas pocas palabras comunes son irregulares: gut – besser – am besten, viel – mehr – am meisten, gern – lieber – am liebsten, hoch – höher – am höchsten.",
      "Birkaç yaygın sözcük düzensizdir: gut – besser – am besten, viel – mehr – am meisten, gern – lieber – am liebsten, hoch – höher – am höchsten.",
    ),
    right: "Das Buch ist [besser] als der Film.",
    wrong: "Das Buch ist [guter] als der Film.",
    notes: [
      note(
        "detail",
        lines(
          "lieber and am liebsten say what you prefer: Ich trinke lieber Tee als Kaffee. Am liebsten trinke ich Wasser.",
          "lieber وam liebsten تقولان ما تفضّله: Ich trinke lieber Tee als Kaffee. Am liebsten trinke ich Wasser.",
          "lieber y am liebsten dicen lo que prefieres: Ich trinke lieber Tee als Kaffee. Am liebsten trinke ich Wasser.",
          "lieber ve am liebsten tercihini söyler: Ich trinke lieber Tee als Kaffee. Am liebsten trinke ich Wasser.",
        ),
        ["Ich trinke [lieber] Tee als Kaffee.", "Am [liebsten] trinke ich Wasser."],
      ),
    ],
    items: [
      "Ich trinke [lieber] Tee als Kaffee.{gern}",
      "Das Buch ist [besser] als der Film.{gut}",
      "Ich habe [mehr] Zeit als du.{viel}",
      "Tee schmeckt mir am [besten].{gut}",
      "Ich fahre am [liebsten] mit dem Zug.{gern}",
      "Er hat am [meisten] Geld.{viel}",
    ],
  },
  "de-a2-22": {
    idea: lines(
      "To say two things are equal, use so + adjective + wie: Er ist so groß wie ich. For different, use the comparative + als.",
      "للمساواة بين شيئين نستعمل so + الصفة + wie: Er ist so groß wie ich. وللاختلاف نستعمل المقارنة + als.",
      "Para decir que dos cosas son iguales usa so + adjetivo + wie: Er ist so groß wie ich. Para lo distinto, el comparativo + als.",
      "İki şeyin eşit olduğunu söylemek için so + sıfat + wie kullan: Er ist so groß wie ich. Farklıysa karşılaştırma + als kullan.",
    ),
    right: "Er ist so groß [wie] ich.",
    wrong: "Er ist so groß [als] ich.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not mix als and wie: größer als (different), so groß wie (equal). Some languages use one word for both, so watch the German pair.",
          "لا تخلط بين als وwie: größer als (مختلف)، so groß wie (متساوٍ). راقب هذا الزوج الألماني.",
          "No mezcles als y wie: größer als (distinto), so groß wie (igual). Vigila este par del alemán.",
          "als ile wie'yi karıştırma: größer als (farklı), so groß wie (eşit). Bu Almanca çifte dikkat et.",
        ),
        ["Er ist größer [als] ich.", "Er ist so groß [wie] ich."],
      ),
    ],
    items: [
      "Mein Bruder ist so groß [wie] ich.",
      "Berlin ist nicht so teuer [wie] München.",
      "Das Auto ist genauso schnell [wie] der Zug.",
      "Sie ist so alt [wie] ich.",
      "Heute ist es nicht so kalt [wie] gestern.",
      "Er spricht so gut Deutsch [wie] seine Frau.",
    ],
  },
  "de-a2-23": {
    idea: lines(
      "weil (because) starts a subordinate clause, and in it the verb goes to the very end: Ich bleibe zu Hause, weil ich krank bin.",
      "weil (لأن) تفتح جملة تابعة، ويذهب فيها الفعل إلى آخر الجملة: Ich bleibe zu Hause, weil ich krank bin.",
      "weil (porque) abre una oración subordinada y en ella el verbo va al final: Ich bleibe zu Hause, weil ich krank bin.",
      "weil (çünkü) yan cümle başlatır ve bu cümlede fiil en sona gider: Ich bleibe zu Hause, weil ich krank bin.",
    ),
    right: "Ich bleibe zu Hause, weil ich krank [bin].",
    wrong: "Ich bleibe zu Hause, weil ich [bin] krank.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not keep the usual order after weil. Arabic and English put the verb after the subject; German sends it to the end: weil ich Hunger habe.",
          "لا تُبقِ الترتيب المعتاد بعد weil. العربية والإنكليزية تضعان الفعل بعد الفاعل، أما الألمانية فترسله إلى الآخر: weil ich Hunger habe.",
          "No mantengas el orden habitual tras weil. En español el verbo va tras el sujeto; en alemán va al final: weil ich Hunger habe.",
          "weil'den sonra olağan sırayı koruma. Almanca fiili sona atar: weil ich Hunger habe.",
        ),
        ["Er lernt, weil er in Berlin [arbeitet]."],
      ),
      note(
        "detail",
        lines(
          "With the Perfekt the helper verb is the very last word: weil ich krank gewesen bin. A comma stands before weil. If the weil-clause comes first, the main clause starts with its verb: Weil ich Hunger habe, esse ich einen Apfel.",
          "مع الـ Perfekt يكون الفعل المساعد آخر كلمة: weil ich krank gewesen bin. وتوضع فاصلة قبل weil. وإذا جاءت جملة weil أولاً بدأت الجملة الرئيسية بالفعل: Weil ich Hunger habe, esse ich einen Apfel.",
          "Con el Perfekt el verbo auxiliar es la última palabra: weil ich krank gewesen bin. Hay coma antes de weil. Si la oración con weil va primero, la principal empieza por el verbo: Weil ich Hunger habe, esse ich einen Apfel.",
          "Perfekt'te yardımcı fiil son sözcüktür: weil ich krank gewesen bin. weil'den önce virgül konur. weil cümlesi önce gelirse ana cümle fiille başlar: Weil ich Hunger habe, esse ich einen Apfel.",
        ),
        ["Weil ich Hunger [habe], esse ich einen Apfel."],
      ),
    ],
    items: [
      "Ich bleibe zu Hause, weil ich krank [bin].{sein}",
      "Er lernt Deutsch, weil er in Berlin [arbeitet].{arbeiten}",
      "Ich komme nicht, weil ich keine Zeit [habe].{haben}",
      "Wir fahren nicht, weil es [regnet].{regnen}",
      "Weil ich Hunger [habe], esse ich einen Apfel.{haben}",
      "Ich lerne Deutsch, weil ich in Wien [wohne].{wohnen}",
    ],
  },
  "de-a2-24": {
    idea: lines(
      "dass (that) opens a subordinate clause after verbs like wissen, glauben, sagen, hoffen: Ich weiß, dass er krank ist. The verb goes to the end.",
      "dass (أنّ) تفتح جملة تابعة بعد أفعال مثل wissen وglauben وsagen وhoffen: Ich weiß, dass er krank ist. ويذهب الفعل إلى الآخر.",
      "dass (que) abre una oración subordinada tras verbos como wissen, glauben, sagen, hoffen: Ich weiß, dass er krank ist. El verbo va al final.",
      "dass (ki), wissen, glauben, sagen, hoffen gibi fiillerden sonra yan cümle açar: Ich weiß, dass er krank ist. Fiil sona gider.",
    ),
    right: "Ich weiß, dass er krank [ist].",
    wrong: "Ich weiß, dass er [ist] krank.",
    notes: [
      note(
        "mistake",
        lines(
          "dass with two s is the conjunction «that»; das with one s is the article or «which / that thing». Ich glaube, dass das Buch gut ist.",
          "dass بحرفي s هي أداة الربط «أنّ»، أما das بحرف s واحد فهي الأداة أو «ذلك / الذي». Ich glaube, dass das Buch gut ist.",
          "dass con dos s es la conjunción «que»; das con una s es el artículo o «eso / lo que». Ich glaube, dass das Buch gut ist.",
          "İki s'li dass bağlaçtır; tek s'li das artikel veya «bu / ki o»dur. Ich glaube, dass das Buch gut ist.",
        ),
        ["Ich glaube, [dass] das Buch gut ist."],
      ),
    ],
    items: [
      "Ich glaube, dass es morgen [regnet].{regnen}",
      "Ich weiß, dass du Deutsch [lernst].{lernen}",
      "Er sagt, dass er keine Zeit [hat].{haben}",
      "Es ist schön, dass du [kommst].{kommen}",
      "Ich hoffe, dass wir uns bald [sehen].{sehen}",
      "Sie sagt, dass sie nach Hause [geht].{gehen}",
    ],
  },
  "de-a2-25": {
    idea: lines(
      "wenn (if, when) opens a subordinate clause for a condition or something that happens again: Wenn es regnet, bleibe ich zu Hause.",
      "wenn (إذا / عندما) تفتح جملة تابعة للشرط أو لما يتكرر: Wenn es regnet, bleibe ich zu Hause.",
      "wenn (si, cuando) abre una oración subordinada para una condición o algo que se repite: Wenn es regnet, bleibe ich zu Hause.",
      "wenn (eğer, -dığında) bir koşul veya tekrarlanan şey için yan cümle açar: Wenn es regnet, bleibe ich zu Hause.",
    ),
    right: "Wenn es [regnet], bleibe ich zu Hause.",
    wrong: "Wenn es regnet, [ich bleibe] zu Hause.",
    notes: [
      note(
        "detail",
        lines(
          "When the wenn-clause comes first, the whole clause counts as one idea, so the main clause starts with its verb: Wenn es regnet, bleibe ich zu Hause (not ich bleibe).",
          "عندما تأتي جملة wenn أولاً فإنها كلها تُحسب فكرة واحدة، فتبدأ الجملة الرئيسية بالفعل: Wenn es regnet, bleibe ich zu Hause (وليس ich bleibe).",
          "Cuando la oración con wenn va primero, toda ella cuenta como una idea, así que la principal empieza por el verbo: Wenn es regnet, bleibe ich zu Hause (no ich bleibe).",
          "wenn cümlesi önce gelince bütün cümle tek fikir sayılır, ana cümle fiille başlar: Wenn es regnet, bleibe ich zu Hause (ich bleibe değil).",
        ),
        ["Wenn ich Zeit [habe], rufe ich dich an."],
      ),
    ],
    items: [
      "Wenn es [regnet], bleibe ich zu Hause.{regnen}",
      "Ich gehe spazieren, wenn die Sonne [scheint].{scheinen}",
      "Wenn ich Zeit [habe], rufe ich dich an.{haben}",
      "Ruf mich an, wenn du Hilfe [brauchst].{brauchen}",
      "Wenn wir Hunger [haben], essen wir.{haben}",
      "Wenn er [kommt], freuen wir uns.{kommen}",
    ],
  },
  "de-a2-26": {
    idea: lines(
      "ob (if, whether) opens a subordinate clause for a yes/no question: Ich weiß nicht, ob er kommt. The verb goes to the end.",
      "ob (هل) تفتح جملة تابعة لسؤال نعم/لا: Ich weiß nicht, ob er kommt. ويذهب الفعل إلى الآخر.",
      "ob (si) abre una oración subordinada para una pregunta de sí o no: Ich weiß nicht, ob er kommt. El verbo va al final.",
      "ob (-ip -mediğini) evet/hayır sorusu için yan cümle açar: Ich weiß nicht, ob er kommt. Fiil sona gider.",
    ),
    right: "Ich weiß nicht, ob er [kommt].",
    wrong: "Ich weiß nicht, ob [kommt er].",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use wenn for «whether». ob = whether (a question), wenn = if or when: Ich frage, ob du kommst. Ich komme, wenn ich Zeit habe.",
          "لا تستعمل wenn بمعنى «هل». ob = هل (سؤال)، wenn = إذا أو عندما: Ich frage, ob du kommst. Ich komme, wenn ich Zeit habe.",
          "No uses wenn para «si» interrogativo. ob = si (pregunta), wenn = si o cuando: Ich frage, ob du kommst. Ich komme, wenn ich Zeit habe.",
          "«Olup olmadığını» için wenn kullanma. ob = soru, wenn = eğer veya -dığında: Ich frage, ob du kommst. Ich komme, wenn ich Zeit habe.",
        ),
        ["Ich frage, [ob] du kommst.", "Ich komme, [wenn] ich Zeit habe."],
      ),
    ],
    items: [
      "Ich weiß nicht, ob er [kommt].{kommen}",
      "Frag ihn, ob er Zeit [hat].{haben}",
      "Ich möchte wissen, ob du müde [bist].{sein}",
      "Sie fragt, ob wir Hunger [haben].{haben}",
      "Weißt du, ob der Laden noch offen [ist]?{sein}",
      "Ich frage mich, ob sie [schläft].{schlafen}",
    ],
  },
  "de-a2-27": {
    idea: lines(
      "Use als for one event in the past: Als ich klein war, ... Use wenn for something that happens again, or in the present and future: Wenn ich Zeit habe, ...",
      "نستعمل als لحدث واحد في الماضي: Als ich klein war, ... ونستعمل wenn لما يتكرر أو في الحاضر والمستقبل: Wenn ich Zeit habe, ...",
      "Usa als para un hecho único del pasado: Als ich klein war, ... Usa wenn para lo que se repite, o en presente y futuro: Wenn ich Zeit habe, ...",
      "als'ı geçmişteki tek bir olay için kullan: Als ich klein war, ... wenn'i tekrarlanan şey veya şimdiki ve gelecek için kullan: Wenn ich Zeit habe, ...",
    ),
    right: "[Als] ich ein Kind war, wohnte ich in Basra.",
    wrong: "[Wenn] ich ein Kind war, wohnte ich in Basra.",
    notes: [
      note(
        "detail",
        lines(
          "For a habit in the past, use wenn too: Wenn ich Zeit hatte, ging ich spazieren (every time). Als is for one time.",
          "للعادة في الماضي نستعمل wenn أيضاً: Wenn ich Zeit hatte, ging ich spazieren (كل مرة). أما als فلمرة واحدة.",
          "Para una costumbre en el pasado, usa también wenn: Wenn ich Zeit hatte, ging ich spazieren (cada vez). Als es para una vez.",
          "Geçmişteki bir alışkanlık için de wenn kullan: Wenn ich Zeit hatte, ging ich spazieren (her seferinde). als bir kereliktir.",
        ),
        ["[Wenn] ich Zeit hatte, ging ich spazieren."],
      ),
    ],
    items: [
      "[Als] ich klein war, spielte ich viel.",
      "[Wenn] ich Zeit habe, lese ich.",
      "[Als] wir in Berlin waren, regnete es.",
      "Jedes Mal, [wenn] ich ihn sehe, lächelt er.",
      "[Wenn] du willst, kannst du kommen.",
      "Gestern, [als] ich nach Hause kam, war niemand da.",
    ],
  },
  "de-a2-28": {
    idea: lines(
      "deshalb, darum and deswegen mean «for this reason». They count as the first idea, so the verb comes right after them: Ich bin müde, deshalb gehe ich ins Bett.",
      "deshalb وdarum وdeswegen تعني «لهذا السبب». وتُحسب الفكرة الأولى، فيأتي الفعل بعدها مباشرة: Ich bin müde, deshalb gehe ich ins Bett.",
      "deshalb, darum y deswegen significan «por eso». Cuentan como la primera idea, así que el verbo va justo detrás: Ich bin müde, deshalb gehe ich ins Bett.",
      "deshalb, darum ve deswegen «bu yüzden» demektir. İlk fikir sayılır, fiil hemen arkasından gelir: Ich bin müde, deshalb gehe ich ins Bett.",
    ),
    right: "Ich bin müde, deshalb [gehe ich] ins Bett.",
    wrong: "Ich bin müde, deshalb [ich gehe] ins Bett.",
    notes: [
      note(
        "mistake",
        lines(
          "Compare weil and deshalb. With weil the verb goes to the end, with deshalb it comes second: Ich gehe ins Bett, weil ich müde bin. Ich bin müde, deshalb gehe ich ins Bett.",
          "قارن بين weil وdeshalb. مع weil يذهب الفعل إلى الآخر، ومع deshalb يأتي ثانياً: Ich gehe ins Bett, weil ich müde bin. Ich bin müde, deshalb gehe ich ins Bett.",
          "Compara weil y deshalb. Con weil el verbo va al final, con deshalb va en segundo lugar: Ich gehe ins Bett, weil ich müde bin. Ich bin müde, deshalb gehe ich ins Bett.",
          "weil ile deshalb'i karşılaştır. weil ile fiil sona, deshalb ile ikinci sıraya gider: Ich gehe ins Bett, weil ich müde bin. Ich bin müde, deshalb gehe ich ins Bett.",
        ),
        ["Es regnet, [deshalb] bleibe ich zu Hause."],
      ),
    ],
    items: [
      "Es regnet, [deshalb] bleibe ich zu Hause.",
      "Ich bin krank, [darum] komme ich nicht.",
      "Er hat Hunger, [deswegen] kocht er.",
      "Wir haben Zeit, [deshalb] gehen wir ins Kino.",
      "Sie lernt viel, [deshalb] spricht sie gut Deutsch.",
      "Es ist kalt, [darum] trage ich eine Jacke.",
    ],
  },
  "de-a2-29": {
    idea: lines(
      "denn (because) joins two main sentences and does not change the word order: Ich bleibe hier, denn es regnet.",
      "denn (لأن) تربط جملتين رئيسيتين ولا تغيّر ترتيب الكلمات: Ich bleibe hier, denn es regnet.",
      "denn (porque) une dos oraciones principales y no cambia el orden: Ich bleibe hier, denn es regnet.",
      "denn (çünkü) iki ana cümleyi bağlar ve sözcük sırasını değiştirmez: Ich bleibe hier, denn es regnet.",
    ),
    right: "Ich komme nicht, [denn] ich bin müde.",
    wrong: "Ich komme nicht, [denn] bin ich müde.",
    notes: [
      note(
        "detail",
        lines(
          "denn can only stand between two sentences, never at the start of the whole sentence. weil can start a sentence: Weil ich müde bin, komme ich nicht.",
          "تقف denn بين جملتين فقط، ولا تبدأ الجملة كلها أبداً. أما weil فيمكنها أن تبدأ الجملة: Weil ich müde bin, komme ich nicht.",
          "denn solo va entre dos oraciones, nunca al inicio de toda la frase. weil sí puede iniciarla: Weil ich müde bin, komme ich nicht.",
          "denn sadece iki cümlenin arasında durur, bütün cümlenin başında asla. weil cümleyi başlatabilir: Weil ich müde bin, komme ich nicht.",
        ),
        ["Weil ich müde [bin], komme ich nicht."],
      ),
    ],
    items: [
      "Ich komme nicht, [denn] ich bin müde.",
      "Er geht früh nach Hause, [denn] er ist müde.",
      "Ich trinke Tee, [denn] ich mag keinen Kaffee.",
      "Wir bleiben hier, [denn] es regnet.",
      "Sie lacht, [denn] der Film ist lustig.",
      "Ich lerne viel, [denn] ich will Arzt werden.",
    ],
  },
  "de-a2-30": {
    idea: lines(
      "A question word can open a subordinate clause: Ich weiß nicht, wo er wohnt. The verb goes to the end, like after weil.",
      "يمكن لأداة السؤال أن تفتح جملة تابعة: Ich weiß nicht, wo er wohnt. ويذهب الفعل إلى الآخر مثل ما بعد weil.",
      "Una palabra interrogativa puede abrir una oración subordinada: Ich weiß nicht, wo er wohnt. El verbo va al final, como tras weil.",
      "Bir soru sözcüğü yan cümle açabilir: Ich weiß nicht, wo er wohnt. Fiil weil'den sonra olduğu gibi sona gider.",
    ),
    right: "Ich weiß nicht, wo er [wohnt].",
    wrong: "Ich weiß nicht, wo [wohnt er].",
    notes: [
      note(
        "detail",
        lines(
          "Compare a direct and an indirect question: Wo wohnt er? → Ich weiß nicht, wo er wohnt. A polite question often starts like this: Können Sie mir sagen, wo der Bahnhof ist?",
          "قارن بين السؤال المباشر وغير المباشر: Wo wohnt er؟ ← Ich weiß nicht, wo er wohnt. والسؤال المهذّب يبدأ هكذا غالباً: Können Sie mir sagen, wo der Bahnhof ist؟",
          "Compara la pregunta directa y la indirecta: Wo wohnt er? → Ich weiß nicht, wo er wohnt. Una pregunta cortés suele empezar así: Können Sie mir sagen, wo der Bahnhof ist?",
          "Doğrudan ve dolaylı soruyu karşılaştır: Wo wohnt er? → Ich weiß nicht, wo er wohnt. Kibar bir soru çoğu zaman şöyle başlar: Können Sie mir sagen, wo der Bahnhof ist?",
        ),
        ["Können Sie mir sagen, wo der Bahnhof [ist]?"],
      ),
    ],
    items: [
      "Ich weiß nicht, wo er [wohnt].{wohnen}",
      "Weißt du, wann der Zug [kommt]?{kommen}",
      "Sie fragt, wie viel das [kostet].{kosten}",
      "Ich möchte wissen, warum du [lachst].{lachen}",
      "Er fragt, wer das [macht].{machen}",
      "Kannst du mir sagen, was das [ist]?{sein}",
    ],
  },
};
