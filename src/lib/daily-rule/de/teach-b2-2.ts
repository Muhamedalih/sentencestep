/** German rules de-b2-16 ... de-b2-30 (Konjunktiv, reported speech, linking clauses). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_B2_2: Readonly<Record<string, RuleTeach>> = {
  "de-b2-16": {
    idea: lines(
      "For something that did not happen, use hätte / wäre + participle: Wenn ich das gewusst hätte, wäre ich geblieben.",
      "لما لم يحدث استعمل hätte / wäre + اسم المفعول: Wenn ich das gewusst hätte, wäre ich geblieben.",
      "Para algo que no ocurrió usa hätte / wäre + participio: Wenn ich das gewusst hätte, wäre ich geblieben.",
      "Olmayan bir şey için hätte / wäre + ortaç kullan: Wenn ich das gewusst hätte, wäre ich geblieben.",
    ),
    right: "Wenn ich das gewusst [hätte], wäre ich geblieben.",
    wrong: "Wenn ich das gewusst [habe], wäre ich geblieben.",
    notes: [
      note(
        "detail",
        lines(
          "It is the Perfekt with the helper in the unreal form: hätte + participle (haben verbs), wäre + participle (sein verbs). The result clause uses the same pattern.",
          "إنه الـ Perfekt مع الفعل المساعد في صيغة غير الواقع: hätte + اسم المفعول (أفعال haben)، وwäre + اسم المفعول (أفعال sein). وجملة النتيجة تستعمل النمط نفسه.",
          "Es el Perfekt con el auxiliar en forma irreal: hätte + participio (verbos con haben), wäre + participio (verbos con sein). La oración de resultado usa el mismo patrón.",
          "Yardımcı fiilin gerçek dışı biçimde olduğu Perfekt'tir: hätte + ortaç (haben fiilleri), wäre + ortaç (sein fiilleri). Sonuç cümlesi de aynı kalıbı kullanır.",
        ),
        ["Er [wäre] fast gefallen."],
      ),
    ],
    items: [
      "Ich [hätte] das nie gedacht.",
      "Er [wäre] fast gefallen.",
      "Wenn du angerufen [hättest], wäre ich gekommen.",
      "[Hätte] ich das gewusst, wäre ich geblieben.",
      "Sie [wäre] gern mitgekommen.",
      "Wir [hätten] mehr Zeit gehabt.",
    ],
  },
  "de-b2-17": {
    idea: lines(
      "With a modal verb, hätte + two infinitives at the end: Ich hätte früher kommen müssen. The modal is not a participle here.",
      "مع الفعل المساعد: hätte + مصدران في الآخر: Ich hätte früher kommen müssen. ولا يكون الفعل المساعد اسم مفعول هنا.",
      "Con un verbo modal: hätte + dos infinitivos al final: Ich hätte früher kommen müssen. El modal no es participio aquí.",
      "Kipli fiille: hätte + sonda iki mastar: Ich hätte früher kommen müssen. Kipli fiil burada ortaç değildir.",
    ),
    right: "Ich [hätte] früher kommen müssen.",
    wrong: "Ich [hätte] früher kommen gemusst.",
    notes: [
      note(
        "exception",
        lines(
          "The modal stays an infinitive (müssen, not gemusst) when another verb is with it: hätte kommen müssen, hätte helfen können. Only alone is it gemusst, gekonnt.",
          "يبقى الفعل المساعد مصدراً (müssen وليس gemusst) عندما يرافقه فعل آخر: hätte kommen müssen، hätte helfen können. ولا يكون gemusst أو gekonnt إلا وحده.",
          "El modal sigue en infinitivo (müssen, no gemusst) cuando va con otro verbo: hätte kommen müssen, hätte helfen können. Solo, es gemusst, gekonnt.",
          "Başka bir fiille birlikte kipli fiil mastar kalır (müssen, gemusst değil): hätte kommen müssen, hätte helfen können. Tek başına gemusst, gekonnt olur.",
        ),
        ["Du [hättest] mich anrufen können."],
      ),
    ],
    items: [
      "Ich [hätte] mehr lernen sollen.",
      "Du [hättest] mich anrufen können.",
      "Wir [hätten] früher gehen müssen.",
      "Er [hätte] das wissen müssen.",
      "Ihr [hättet] uns helfen können.",
      "Sie [hätte] gern kommen wollen.",
    ],
  },
  "de-b2-18": {
    idea: lines(
      "als ob (as if) compares with something unreal. The verb is in the Konjunktiv II and goes to the end: Er tut so, als ob er krank wäre.",
      "als ob (كأنّ) تقارن بشيء غير واقعي. ويكون الفعل في الـ Konjunktiv II ويذهب إلى الآخر: Er tut so, als ob er krank wäre.",
      "als ob (como si) compara con algo irreal. El verbo va en Konjunktiv II y al final: Er tut so, als ob er krank wäre.",
      "als ob (sanki) gerçek dışı bir şeyle karşılaştırır. Fiil Konjunktiv II'dedir ve sona gider: Er tut so, als ob er krank wäre.",
    ),
    right: "Er tut so, als [ob] er krank wäre.",
    wrong: "Er tut so, als [ob] er krank ist.",
    notes: [
      note(
        "detail",
        lines(
          "A shorter form puts the verb right after als: Er tut so, als wäre er krank. You can also use als wenn.",
          "وهناك صيغة أقصر تضع الفعل بعد als مباشرة: Er tut so, als wäre er krank. ويمكن استعمال als wenn أيضاً.",
          "Una forma más corta pone el verbo justo tras als: Er tut so, als wäre er krank. También puedes usar als wenn.",
          "Daha kısa biçim fiili als'tan hemen sonra koyar: Er tut so, als wäre er krank. als wenn de kullanılabilir.",
        ),
        ["Er tut so, [als] wäre er krank."],
      ),
    ],
    items: [
      "Er tut so, als [ob] er krank wäre.",
      "Sie spricht, als [ob] sie alles wüsste.",
      "Es sieht aus, als [ob] es regnen würde.",
      "Er benimmt sich, als [ob] er der Chef wäre.",
      "Du siehst aus, als [ob] du nicht geschlafen hättest.",
      "Das Kind lacht, als [ob] nichts passiert wäre.",
    ],
  },
  "de-b2-19": {
    idea: lines(
      "The Konjunktiv I is used to report what someone said. For er / sie / es it is the stem + -e: er gehe, sie komme, er habe. The verb sein is special: er sei.",
      "الـ Konjunktiv I يُستعمل لنقل ما قاله شخص. مع er / sie / es هو الجذر + -e: er gehe، sie komme، er habe. والفعل sein خاص: er sei.",
      "El Konjunktiv I sirve para contar lo que alguien dijo. Para er / sie / es es la raíz + -e: er gehe, sie komme, er habe. El verbo sein es especial: er sei.",
      "Konjunktiv I, birinin söylediğini aktarmak için kullanılır. er / sie / es için kök + -e'dir: er gehe, sie komme, er habe. sein özeldir: er sei.",
    ),
    right: "Er sagt, sie [sei] krank.",
    wrong: "Er sagt, sie [ist] krank.",
    notes: [
      note(
        "detail",
        lines(
          "Modals: er könne, müsse, wolle, solle, dürfe, wisse. Konjunktiv I is formal: you find it in newspapers and reports, less in conversation.",
          "الأفعال المساعدة: er könne وmüsse وwolle وsolle وdürfe وwisse. والـ Konjunktiv I رسمي: تجده في الصحف والتقارير أكثر منه في الحديث.",
          "Modales: er könne, müsse, wolle, solle, dürfe, wisse. El Konjunktiv I es formal: se ve en periódicos e informes, menos en conversación.",
          "Kipli fiiller: er könne, müsse, wolle, solle, dürfe, wisse. Konjunktiv I resmîdir: gazete ve raporlarda görülür, konuşmada daha az.",
        ),
        ["Sie meint, er [könne] nicht kommen."],
      ),
    ],
    items: [
      "Er sagt, sie [sei] krank.",
      "Sie meint, er [könne] nicht kommen.",
      "Der Arzt sagt, ich [müsse] mehr schlafen.",
      "Er behauptet, er [wolle] helfen.",
      "Sie sagte, sie [dürfe] nicht gehen.",
      "Er erklärt, er [wisse] das nicht.",
    ],
  },
  "de-b2-20": {
    idea: lines(
      "In reported speech the Konjunktiv I shows that you repeat someone's words without saying they are true: Er sagte, er habe keine Zeit.",
      "في الكلام المنقول يبيّن الـ Konjunktiv I أنك تنقل كلام شخص دون أن تؤكد صحته: Er sagte, er habe keine Zeit.",
      "En el estilo indirecto el Konjunktiv I muestra que repites las palabras de alguien sin decir que sean ciertas: Er sagte, er habe keine Zeit.",
      "Dolaylı anlatımda Konjunktiv I, birinin sözlerini doğru olduğunu söylemeden aktardığını gösterir: Er sagte, er habe keine Zeit.",
    ),
    right: "Er sagte, er [habe] keine Zeit.",
    wrong: "Er sagte, er [hat] keine Zeit.",
    notes: [
      note(
        "detail",
        lines(
          "For the past use habe / sei + participle: Er sagte, er sei krank gewesen. In everyday speech people often use the normal Indikativ or wäre / hätte.",
          "للماضي استعمل habe / sei + اسم المفعول: Er sagte, er sei krank gewesen. وفي الكلام اليومي يستعمل الناس غالباً الـ Indikativ العادي أو wäre / hätte.",
          "Para el pasado usa habe / sei + participio: Er sagte, er sei krank gewesen. En el habla diaria se suele usar el Indikativ normal o wäre / hätte.",
          "Geçmiş için habe / sei + ortaç kullan: Er sagte, er sei krank gewesen. Günlük konuşmada çoğu zaman normal Indikativ veya wäre / hätte kullanılır.",
        ),
        ["Er sagte, er [sei] krank gewesen."],
      ),
    ],
    items: [
      "Er sagte, er [habe] keine Zeit.",
      "Sie berichtete, das Wetter [sei] schlecht.",
      "Der Lehrer erklärte, die Aufgabe [sei] leicht.",
      "Er meinte, er [habe] das Buch gelesen.",
      "Er schrieb, es [gehe] ihm gut.",
      "Sie sagte, sie [komme] morgen.",
    ],
  },
  "de-b2-21": {
    idea: lines(
      "When the Konjunktiv I looks like the normal present (ich habe, wir haben, sie haben), use the Konjunktiv II instead: Sie sagten, sie hätten keine Zeit.",
      "عندما يشبه الـ Konjunktiv I المضارع العادي (ich habe وwir haben وsie haben) استعمل الـ Konjunktiv II بدلاً منه: Sie sagten, sie hätten keine Zeit.",
      "Cuando el Konjunktiv I es igual al presente normal (ich habe, wir haben, sie haben), usa el Konjunktiv II: Sie sagten, sie hätten keine Zeit.",
      "Konjunktiv I normal şimdiki zamana benziyorsa (ich habe, wir haben, sie haben) onun yerine Konjunktiv II kullan: Sie sagten, sie hätten keine Zeit.",
    ),
    right: "Sie sagten, sie [hätten] keine Zeit.",
    wrong: "Sie sagten, sie [haben] keine Zeit.",
    notes: [
      note(
        "detail",
        lines(
          "Only er / sie / es has its own Konjunktiv I form (er habe). For ich, wir, ihr and sie it equals the Indikativ, so you switch to hätte, wäre, würde.",
          "وحده er / sie / es له صيغة Konjunktiv I خاصة (er habe). أما ich وwir وihr وsie فتتطابق مع الـ Indikativ، فتنتقل إلى hätte وwäre وwürde.",
          "Solo er / sie / es tiene forma propia de Konjunktiv I (er habe). Para ich, wir, ihr y sie coincide con el Indikativ, así que se cambia a hätte, wäre, würde.",
          "Sadece er / sie / es'in kendi Konjunktiv I biçimi vardır (er habe). ich, wir, ihr ve sie için Indikativ ile aynıdır; bu yüzden hätte, wäre, würde'ye geçilir.",
        ),
        ["Ich sagte, ich [hätte] kein Geld."],
      ),
    ],
    items: [
      "Sie sagten, sie [hätten] keine Zeit.",
      "Wir sagten, wir [wären] müde.",
      "Er sagte, die Kinder [würden] kommen.",
      "Ich sagte, ich [hätte] kein Geld.",
      "Sie meinten, sie [wären] zu spät.",
      "Ihr sagtet, ihr [hättet] Hunger.",
    ],
  },
  "de-b2-22": {
    idea: lines(
      "You can leave out wenn and put the verb first: Wäre ich reich, würde ich reisen. The main clause then also starts with its verb.",
      "يمكنك حذف wenn ووضع الفعل أولاً: Wäre ich reich, würde ich reisen. وتبدأ الجملة الرئيسية أيضاً بفعلها.",
      "Puedes omitir wenn y poner el verbo primero: Wäre ich reich, würde ich reisen. La oración principal también empieza por su verbo.",
      "wenn'i atıp fiili başa koyabilirsin: Wäre ich reich, würde ich reisen. Ana cümle de fiille başlar.",
    ),
    right: "[Wäre] ich reich, würde ich reisen.",
    wrong: "Wäre ich reich, [ich würde] reisen.",
    notes: [
      note(
        "detail",
        lines(
          "It sounds more formal and elegant. It works with hätte, wäre, würde and modals: Hätte ich mehr Zeit, würde ich lesen. Könnte ich fliegen, wäre ich schon dort.",
          "وتبدو أكثر رسمية وأناقة. وتعمل مع hätte وwäre وwürde والأفعال المساعدة: Hätte ich mehr Zeit, würde ich lesen. Könnte ich fliegen, wäre ich schon dort.",
          "Suena más formal y elegante. Funciona con hätte, wäre, würde y modales: Hätte ich mehr Zeit, würde ich lesen. Könnte ich fliegen, wäre ich schon dort.",
          "Daha resmî ve şık duyulur. hätte, wäre, würde ve kipli fiillerle çalışır: Hätte ich mehr Zeit, würde ich lesen. Könnte ich fliegen, wäre ich schon dort.",
        ),
        ["[Hätte] ich mehr Zeit, würde ich lesen."],
      ),
    ],
    items: [
      "[Wäre] ich reich, würde ich reisen.",
      "[Hätte] ich mehr Zeit, würde ich lesen.",
      "[Wüsste] ich das, würde ich helfen.",
      "[Würde] es regnen, bliebe ich zu Hause.",
      "[Könnte] ich fliegen, wäre ich schon dort.",
      "[Hätten] wir Geld, würden wir reisen.",
    ],
  },
  "de-b2-23": {
    idea: lines(
      "Sollte (or falls) opens a condition that is possible but not likely: Sollte er kommen, sag mir Bescheid. Falls es regnet, nehmen wir den Bus.",
      "Sollte (أو falls) تفتح شرطاً ممكناً لكنه غير مرجّح: Sollte er kommen, sag mir Bescheid. Falls es regnet, nehmen wir den Bus.",
      "Sollte (o falls) abre una condición posible pero poco probable: Sollte er kommen, sag mir Bescheid. Falls es regnet, nehmen wir den Bus.",
      "Sollte (veya falls) mümkün ama olası olmayan bir koşul açar: Sollte er kommen, sag mir Bescheid. Falls es regnet, nehmen wir den Bus.",
    ),
    right: "[Sollte] er kommen, sag mir Bescheid.",
    wrong: "[Soll] er kommen, sag mir Bescheid.",
    notes: [
      note(
        "detail",
        lines(
          "With falls the verb goes to the end: Falls du Zeit hast, ruf an. With sollte the verb is first and the main clause follows with its normal verb-first order.",
          "مع falls يذهب الفعل إلى الآخر: Falls du Zeit hast, ruf an. ومع sollte يأتي الفعل أولاً وتتبعها الجملة الرئيسية بفعلها أولاً.",
          "Con falls el verbo va al final: Falls du Zeit hast, ruf an. Con sollte el verbo va primero y la oración principal sigue con su verbo en primer lugar.",
          "falls ile fiil sona gider: Falls du Zeit hast, ruf an. sollte ile fiil başta olur ve ana cümle de fiille başlar.",
        ),
        ["[Falls] du Zeit hast, ruf an."],
      ),
    ],
    items: [
      "[Sollte] es regnen, bleiben wir zu Hause.",
      "[Falls] du Zeit hast, ruf mich an.",
      "[Sollten] Sie Fragen haben, rufen Sie mich an.",
      "[Falls] es regnet, nehmen wir den Bus.",
      "[Sollte] er kommen, sag mir Bescheid.",
      "[Falls] du ihn siehst, grüß ihn.",
    ],
  },
  "de-b2-24": {
    idea: lines(
      "obwohl (although) opens a subordinate clause with a surprising contrast. The verb goes to the end: Obwohl es regnet, gehen wir spazieren.",
      "obwohl (رغم أنّ) تفتح جملة تابعة فيها تناقض مفاجئ. ويذهب الفعل إلى الآخر: Obwohl es regnet, gehen wir spazieren.",
      "obwohl (aunque) abre una oración subordinada con un contraste sorprendente. El verbo va al final: Obwohl es regnet, gehen wir spazieren.",
      "obwohl (-e rağmen) şaşırtıcı bir karşıtlıkla yan cümle açar. Fiil sona gider: Obwohl es regnet, gehen wir spazieren.",
    ),
    right: "[Obwohl] es regnet, gehen wir spazieren.",
    wrong: "[Weil] es regnet, gehen wir spazieren.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not mix obwohl and weil. weil gives the reason (we stay because it rains), obwohl gives something against it (we go although it rains).",
          "لا تخلط بين obwohl وweil. weil تعطي السبب (نبقى لأنها تمطر)، وobwohl تعطي ما يخالفه (نذهب رغم أنها تمطر).",
          "No mezcles obwohl y weil. weil da la razón (nos quedamos porque llueve), obwohl da algo en contra (vamos aunque llueve).",
          "obwohl ile weil'i karıştırma. weil nedeni verir (yağmur yağdığı için kalırız), obwohl karşıtı verir (yağmura rağmen gideriz).",
        ),
        ["Wir bleiben, [weil] es regnet."],
      ),
    ],
    items: [
      "[Obwohl] es regnet, gehen wir spazieren.",
      "Er geht zur Arbeit, [obwohl] er krank ist.",
      "[Obwohl] ich müde war, habe ich gelernt.",
      "Sie lacht, [obwohl] sie traurig ist.",
      "Wir bleiben, [obwohl] es spät ist.",
      "[Obwohl] er Geld hat, ist er nicht glücklich.",
    ],
  },
  "de-b2-25": {
    idea: lines(
      "trotzdem (nevertheless) joins two sentences. It counts as the first idea, so the verb comes right after it: Es regnet, trotzdem gehen wir spazieren.",
      "trotzdem (مع ذلك) تربط جملتين. وتُحسب الفكرة الأولى، فيأتي الفعل بعدها مباشرة: Es regnet, trotzdem gehen wir spazieren.",
      "trotzdem (a pesar de eso) une dos frases. Cuenta como la primera idea, así que el verbo va justo detrás: Es regnet, trotzdem gehen wir spazieren.",
      "trotzdem (yine de) iki cümleyi bağlar. İlk fikir sayılır, fiil hemen arkasından gelir: Es regnet, trotzdem gehen wir spazieren.",
    ),
    right: "Es regnet, [trotzdem] gehen wir spazieren.",
    wrong: "Es regnet, trotzdem [wir gehen] spazieren.",
    notes: [
      note(
        "detail",
        lines(
          "Compare obwohl (verb at the end) and trotzdem (verb second): Obwohl es regnet, gehen wir. Es regnet, trotzdem gehen wir. Same meaning, different order.",
          "قارن obwohl (الفعل في الآخر) وtrotzdem (الفعل ثانياً): Obwohl es regnet, gehen wir. Es regnet, trotzdem gehen wir. المعنى واحد والترتيب مختلف.",
          "Compara obwohl (verbo al final) y trotzdem (verbo en segundo lugar): Obwohl es regnet, gehen wir. Es regnet, trotzdem gehen wir. Mismo sentido, distinto orden.",
          "obwohl (fiil sonda) ile trotzdem'i (fiil ikinci) karşılaştır: Obwohl es regnet, gehen wir. Es regnet, trotzdem gehen wir. Anlam aynı, sıra farklı.",
        ),
        ["[Obwohl] es regnet, gehen wir."],
      ),
    ],
    items: [
      "Es regnet, [trotzdem] gehen wir spazieren.",
      "Ich bin müde, [trotzdem] lerne ich.",
      "Er ist krank, [trotzdem] arbeitet er.",
      "Das Essen war teuer, [trotzdem] hat es geschmeckt.",
      "Sie hat wenig Zeit, [trotzdem] hilft sie.",
      "Es ist kalt, [trotzdem] schwimmt er.",
    ],
  },
  "de-b2-26": {
    idea: lines(
      "damit (so that) gives a purpose, usually when the subject changes. The verb goes to the end: Ich spreche langsam, damit du mich verstehst.",
      "damit (كي) تعطي الغاية، غالباً عندما يتغيّر الفاعل. ويذهب الفعل إلى الآخر: Ich spreche langsam, damit du mich verstehst.",
      "damit (para que) da una finalidad, normalmente cuando cambia el sujeto. El verbo va al final: Ich spreche langsam, damit du mich verstehst.",
      "damit (-sın diye) amaç verir, genellikle özne değiştiğinde. Fiil sona gider: Ich spreche langsam, damit du mich verstehst.",
    ),
    right: "Ich lerne Deutsch, [damit] ich eine Arbeit finde.",
    wrong: "Ich lerne Deutsch, [damit] ich [finde] eine Arbeit.",
    notes: [
      note(
        "detail",
        lines(
          "If the subject stays the same, um ... zu is simpler: Ich lerne Deutsch, um eine Arbeit zu finden. damit is the way when the subject changes.",
          "إذا بقي الفاعل نفسه فـ um ... zu أبسط: Ich lerne Deutsch, um eine Arbeit zu finden. وdamit هي الطريقة عندما يتغيّر الفاعل.",
          "Si el sujeto es el mismo, um ... zu es más sencillo: Ich lerne Deutsch, um eine Arbeit zu finden. damit se usa cuando cambia el sujeto.",
          "Özne aynıysa um ... zu daha basittir: Ich lerne Deutsch, um eine Arbeit zu finden. Özne değiştiğinde damit kullanılır.",
        ),
        ["Sie spricht langsam, [damit] wir sie verstehen."],
      ),
    ],
    items: [
      "Ich lerne Deutsch, [damit] ich eine Arbeit finde.",
      "Sie spricht langsam, [damit] wir sie verstehen.",
      "Ich rufe an, [damit] er kommt.",
      "Wir sparen Geld, [damit] wir reisen können.",
      "Er erklärt es, [damit] alle es verstehen.",
      "Ich schreibe es auf, [damit] ich es nicht vergesse.",
    ],
  },
  "de-b2-27": {
    idea: lines(
      "um ... zu + infinitive also gives a purpose, when the subject of both parts is the same: Ich lerne Deutsch, um in Berlin zu arbeiten.",
      "um ... zu + المصدر تعطي أيضاً الغاية عندما يكون فاعل الجزأين واحداً: Ich lerne Deutsch, um in Berlin zu arbeiten.",
      "um ... zu + infinitivo también da una finalidad, cuando el sujeto de las dos partes es el mismo: Ich lerne Deutsch, um in Berlin zu arbeiten.",
      "um ... zu + mastar de amaç verir; iki bölümün öznesi aynıysa: Ich lerne Deutsch, um in Berlin zu arbeiten.",
    ),
    right: "Ich lerne Deutsch, [um] in Berlin zu arbeiten.",
    wrong: "Ich lerne Deutsch, [für] in Berlin zu arbeiten.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use für or damit when the subject is the same. And with a separable verb, zu goes inside: um die Mutter abzuholen, um früh aufzustehen.",
          "لا تستعمل für أو damit عندما يكون الفاعل نفسه. ومع الفعل المنفصل تدخل zu في الداخل: um die Mutter abzuholen، um früh aufzustehen.",
          "No uses für ni damit cuando el sujeto es el mismo. Y con un verbo separable, zu va dentro: um die Mutter abzuholen, um früh aufzustehen.",
          "Özne aynıyken für veya damit kullanma. Ayrılabilen fiilde zu içeri girer: um die Mutter abzuholen, um früh aufzustehen.",
        ),
        ["Er geht zum Bahnhof, [um] seine Mutter abzuholen."],
      ),
    ],
    items: [
      "Ich lerne Deutsch, [um] in Berlin zu arbeiten.",
      "Er geht zum Bahnhof, [um] seine Mutter abzuholen.",
      "Wir sparen, [um] ein Haus zu kaufen.",
      "Sie fährt nach Wien, [um] ihre Freundin zu besuchen.",
      "Ich nehme ein Taxi, [um] pünktlich zu sein.",
      "Er steht früh auf, [um] zu lernen.",
    ],
  },
  "de-b2-28": {
    idea: lines(
      "indem (by + -ing) says how something is done. The verb goes to the end: Man lernt Deutsch, indem man viel liest.",
      "indem (بـ) تقول كيف يتم الشيء. ويذهب الفعل إلى الآخر: Man lernt Deutsch, indem man viel liest.",
      "indem (al + infinitivo) dice cómo se hace algo. El verbo va al final: Man lernt Deutsch, indem man viel liest.",
      "indem (-erek) bir şeyin nasıl yapıldığını söyler. Fiil sona gider: Man lernt Deutsch, indem man viel liest.",
    ),
    right: "Man lernt Deutsch, [indem] man viel liest.",
    wrong: "Man lernt Deutsch, [damit] man viel liest.",
    notes: [
      note(
        "detail",
        lines(
          "indem answers «wie?» (how?), damit answers «wozu?» (what for?). The subject of both parts is the same.",
          "indem تجيب عن «wie؟» (كيف؟)، وdamit تجيب عن «wozu؟» (لماذا / لأي غاية؟). وفاعل الجزأين واحد.",
          "indem responde a «¿wie?» (¿cómo?), damit a «¿wozu?» (¿para qué?). El sujeto de las dos partes es el mismo.",
          "indem «wie?» (nasıl?) sorusuna, damit «wozu?» (ne için?) sorusuna cevap verir. İki bölümün öznesi aynıdır.",
        ),
        ["Er spart Geld, [indem] er kein Auto kauft."],
      ),
    ],
    items: [
      "Man lernt, [indem] man viel liest.",
      "Er spart Geld, [indem] er kein Auto kauft.",
      "Sie verbessert ihr Deutsch, [indem] sie Filme sieht.",
      "Ich lerne Wörter, [indem] ich sie aufschreibe.",
      "Man bleibt fit, [indem] man jeden Tag läuft.",
      "Er löste das Problem, [indem] er Hilfe holte.",
    ],
  },
  "de-b2-29": {
    idea: lines(
      "während (while) joins two things that happen at the same time. The verb goes to the end: Ich koche, während du liest.",
      "während (بينما) تربط شيئين يحدثان في الوقت نفسه. ويذهب الفعل إلى الآخر: Ich koche, während du liest.",
      "während (mientras) une dos cosas que ocurren a la vez. El verbo va al final: Ich koche, während du liest.",
      "während (-ken) aynı anda olan iki şeyi bağlar. Fiil sona gider: Ich koche, während du liest.",
    ),
    right: "[Während] ich koche, liest du.",
    wrong: "[Während] ich koche, du liest.",
    notes: [
      note(
        "detail",
        lines(
          "während is also a preposition with the genitive: während des Essens (during the meal). With a clause it is a conjunction: während wir essen.",
          "وwährend أيضاً حرف جر مع الإضافة: während des Essens (أثناء الوجبة). ومع جملة تكون أداة ربط: während wir essen.",
          "während también es una preposición con genitivo: während des Essens (durante la comida). Con una oración es conjunción: während wir essen.",
          "während aynı zamanda Genitiv alan bir edattır: während des Essens (yemek sırasında). Cümleyle bağlaçtır: während wir essen.",
        ),
        ["[Während] des Essens spricht niemand."],
      ),
    ],
    items: [
      "[Während] ich koche, liest du.",
      "Er hört Musik, [während] er arbeitet.",
      "[Während] wir essen, spricht niemand.",
      "Sie telefoniert, [während] sie kocht.",
      "Ich lese, [während] du schläfst.",
      "[Während] es regnet, bleiben wir hier.",
    ],
  },
  "de-b2-30": {
    idea: lines(
      "nachdem (after) opens a clause about the earlier event. The earlier event is one tense earlier: Nachdem ich gegessen hatte, ging ich spazieren.",
      "nachdem (بعد أن) تفتح جملة عن الحدث الأسبق. والحدث الأسبق في زمن أسبق بدرجة: Nachdem ich gegessen hatte, ging ich spazieren.",
      "nachdem (después de que) abre una oración sobre el hecho anterior. El hecho anterior va un tiempo antes: Nachdem ich gegessen hatte, ging ich spazieren.",
      "nachdem (-dıktan sonra) önceki olayla ilgili cümle açar. Önceki olay bir zaman daha geridedir: Nachdem ich gegessen hatte, ging ich spazieren.",
    ),
    right: "[Nachdem] ich gegessen hatte, ging ich spazieren.",
    wrong: "Nachdem ich [aß], ging ich spazieren.",
    notes: [
      note(
        "detail",
        lines(
          "Two pairs: Perfekt in the nachdem-clause with the present in the main clause (Nachdem er angerufen hat, komme ich), Plusquamperfekt with the Präteritum (Nachdem er angerufen hatte, kam ich).",
          "زوجان: Perfekt في جملة nachdem مع المضارع في الرئيسية (Nachdem er angerufen hat, komme ich)، وPlusquamperfekt مع Präteritum (Nachdem er angerufen hatte, kam ich).",
          "Dos parejas: Perfekt en la oración con nachdem y presente en la principal (Nachdem er angerufen hat, komme ich), Plusquamperfekt con Präteritum (Nachdem er angerufen hatte, kam ich).",
          "İki çift: nachdem cümlesinde Perfekt, ana cümlede şimdiki zaman (Nachdem er angerufen hat, komme ich); Plusquamperfekt ile Präteritum (Nachdem er angerufen hatte, kam ich).",
        ),
        ["[Nachdem] er angerufen hat, komme ich."],
      ),
    ],
    items: [
      "[Nachdem] ich gegessen hatte, ging ich spazieren.",
      "Ich ging nach Hause, [nachdem] ich gearbeitet hatte.",
      "[Nachdem] er angerufen hat, komme ich.",
      "Sie lächelte, [nachdem] sie das Geschenk bekommen hatte.",
      "[Nachdem] wir gegessen haben, gehen wir.",
      "Ich schlief, [nachdem] ich gelesen hatte.",
    ],
  },
};
