/** German rules de-a1-16 ... de-a1-30 (nouns, questions and negation, the first verbs). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A1_2: Readonly<Record<string, RuleTeach>> = {
  "de-a1-16": {
    idea: lines(
      "For a woman, many job and nationality words add -in: der Lehrer → die Lehrerin, der Student → die Studentin.",
      "للمرأة نضيف -in إلى كثير من أسماء المهن والجنسيات: der Lehrer ← die Lehrerin، der Student ← die Studentin.",
      "Para una mujer, muchas profesiones añaden -in: der Lehrer → die Lehrerin, der Student → die Studentin.",
      "Kadınlar için birçok meslek adına -in eklenir: der Lehrer → die Lehrerin, der Student → die Studentin.",
    ),
    right: "Sie ist [Lehrerin].",
    wrong: "Sie ist [Lehrer].",
    notes: [
      note(
        "detail",
        lines(
          "The plural of the -in words is -innen: die Lehrerinnen. A few words change the vowel: der Arzt → die Ärztin.",
          "جمع كلمات -in هو -innen: die Lehrerinnen. وبعض الكلمات تغيّر الحرف: der Arzt ← die Ärztin.",
          "El plural de las palabras en -in es -innen: die Lehrerinnen. Algunas cambian la vocal: der Arzt → die Ärztin.",
          "-in'li sözcüklerin çoğulu -innen'dir: die Lehrerinnen. Bazılarında ünlü değişir: der Arzt → die Ärztin.",
        ),
        ["Die [Lehrerinnen] sind nett.", "Meine Mutter ist [Ärztin]."],
      ),
    ],
    items: [
      "Anna ist [Lehrerin].{Lehrer}",
      "Meine Schwester ist [Studentin].{Student}",
      "Sie ist [Köchin].{Koch}",
      "Meine Mutter ist [Ärztin].{Arzt}",
      "Sie ist [Sängerin].{Sänger}",
      "Die [Nachbarin] ist nett.{Nachbar}",
    ],
  },
  "de-a1-17": {
    idea: lines(
      "After sein, an adjective never changes: Das Haus ist groß. Die Häuser sind groß.",
      "بعد sein لا تتغيّر الصفة أبداً: Das Haus ist groß. Die Häuser sind groß.",
      "Después de sein, el adjetivo nunca cambia: Das Haus ist groß. Die Häuser sind groß.",
      "sein'dan sonra sıfat hiç değişmez: Das Haus ist groß. Die Häuser sind groß.",
    ),
    right: "Das Haus ist [groß].",
    wrong: "Das Haus ist [große].",
    notes: [
      note(
        "mistake",
        lines(
          "In Arabic and Spanish the adjective agrees with the noun. In German it stays the same after sein: Das Auto ist neu, die Autos sind neu.",
          "في العربية تتبع الصفة الاسم (كبير، كبيرة، كبيرات). أما في الألمانية فتبقى كما هي بعد sein: Das Auto ist neu، die Autos sind neu.",
          "En español el adjetivo concuerda (grande, grandes). En alemán no cambia después de sein: Das Auto ist neu, die Autos sind neu.",
          "Almancada sıfat sein'dan sonra olduğu gibi kalır: Das Auto ist neu, die Autos sind neu.",
        ),
        ["Die Autos sind [neu].", "Meine Schwester ist [klein]."],
      ),
    ],
    items: [
      "Das Wetter ist [schön].{beautiful}",
      "Die Suppe ist [heiß].{hot}",
      "Mein Bruder ist [klein].{small}",
      "Die Kinder sind [müde].{tired}",
      "Der Kaffee ist [kalt].{cold}",
      "Wir sind [glücklich].{happy}",
    ],
  },
  "de-a1-18": {
    idea: lines(
      "A question with was, wo, wer or wie starts with the question word, and the verb comes right after it.",
      "السؤال بـ was أو wo أو wer أو wie يبدأ بأداة السؤال ثم يأتي الفعل مباشرة بعدها.",
      "Una pregunta con was, wo, wer o wie empieza con la palabra interrogativa y el verbo va justo después.",
      "was, wo, wer veya wie ile başlayan soruda soru sözcüğü başa gelir, fiil hemen arkasından gelir.",
    ),
    right: "[Wo] wohnst du?",
    wrong: "Wo [du] wohnst?",
    notes: [
      note(
        "detail",
        lines(
          "wer = who (a person), was = what, wo = where, wie = how: Wie heißt du? Wer ist das? Was ist das?",
          "wer = من، was = ماذا، wo = أين، wie = كيف: Wie heißt du؟ Wer ist das؟ Was ist das؟",
          "wer = quién, was = qué, wo = dónde, wie = cómo: Wie heißt du? Wer ist das? Was ist das?",
          "wer = kim, was = ne, wo = nerede, wie = nasıl: Wie heißt du? Wer ist das? Was ist das?",
        ),
        ["[Wie] heißt du?", "[Wer] ist das?"],
      ),
    ],
    items: [
      "[Wo] wohnst du?",
      "[Was] machst du?",
      "[Wer] ist das?",
      "[Wie] heißt du?",
      "[Wie] geht es dir?",
      "[Was] ist das?",
    ],
  },
  "de-a1-19": {
    idea: lines(
      "German splits «where»: wo (where is it?), woher (where from?), wohin (where to?). warum is why, wann is when.",
      "الألمانية تقسم «أين»: wo (أين؟)، woher (من أين؟)، wohin (إلى أين؟). وwarum تعني لماذا، وwann تعني متى.",
      "El alemán divide «dónde»: wo (dónde está), woher (de dónde), wohin (adónde). warum es por qué, wann es cuándo.",
      "Almanca «nerede»yi böler: wo (nerede), woher (nereden), wohin (nereye). warum neden, wann ne zaman demektir.",
    ),
    right: "[Woher] kommst du?",
    wrong: "[Wo] kommst du?",
    notes: [
      note(
        "mistake",
        lines(
          "Do not mix wann (when, a question) with wenn (if, or whenever): Wann kommst du? Ich komme, wenn ich Zeit habe.",
          "لا تخلط بين wann (متى، للسؤال) وwenn (إذا / عندما): Wann kommst du؟ Ich komme, wenn ich Zeit habe.",
          "No mezcles wann (cuándo, pregunta) con wenn (si, cuando): Wann kommst du? Ich komme, wenn ich Zeit habe.",
          "wann (ne zaman, soru) ile wenn (eğer, -dığında) karıştırma: Wann kommst du? Ich komme, wenn ich Zeit habe.",
        ),
        ["[Wann] kommst du?", "Ich komme, [wenn] ich Zeit habe."],
      ),
    ],
    items: [
      "[Woher] kommst du?",
      "[Wohin] gehst du?",
      "[Warum] lernst du Deutsch?",
      "[Wann] kommt der Bus?",
      "[Wohin] fährt der Zug?",
      "[Woher] ist sie?",
    ],
  },
  "de-a1-20": {
    idea: lines(
      "A yes/no question starts with the verb: Kommst du aus Syrien? Hast du Zeit?",
      "سؤال نعم/لا يبدأ بالفعل: Kommst du aus Syrien؟ Hast du Zeit؟",
      "Una pregunta de sí o no empieza con el verbo: Kommst du aus Syrien? Hast du Zeit?",
      "Evet/hayır sorusu fiille başlar: Kommst du aus Syrien? Hast du Zeit?",
    ),
    right: "[Kommst] du aus Syrien?",
    wrong: "[Du] kommst aus Syrien?",
    notes: [
      note(
        "mistake",
        lines(
          "Do not start with the subject and only raise your voice. Put the verb first: Hast du Hunger? (not Du hast Hunger?)",
          "لا تبدأ بالفاعل وترفع صوتك فقط. ضع الفعل أولاً: Hast du Hunger؟ (وليس Du hast Hunger؟)",
          "No empieces por el sujeto subiendo solo la voz. Pon el verbo primero: Hast du Hunger? (no Du hast Hunger?)",
          "Özneyle başlayıp sadece sesini yükseltme. Fiili başa koy: Hast du Hunger? (Du hast Hunger? değil)",
        ),
        ["[Hast] du Hunger?", "[Ist] das dein Buch?"],
      ),
    ],
    items: [
      "[Kommst] du aus Syrien?",
      "[Hast] du Hunger?",
      "[Ist] das dein Buch?",
      "[Spielst] du Gitarre?",
      "[Wohnen] Sie hier?",
      "[Sind] Sie müde?",
    ],
  },
  "de-a1-21": {
    idea: lines(
      "Answer ja or nein. But to say yes to a question that has nicht or kein, use doch.",
      "نجيب بـ ja أو nein. لكن للإجابة بـ «بلى» عن سؤال فيه nicht أو kein نستعمل doch.",
      "Responde ja o nein. Pero para decir que sí a una pregunta con nicht o kein, usa doch.",
      "ja veya nein ile cevap verirsin. Ama nicht veya kein içeren bir soruya «evet» demek için doch kullanılır.",
    ),
    right: "Hast du keine Zeit? – [Doch], ich habe Zeit.",
    wrong: "Hast du keine Zeit? – [Ja], ich habe Zeit.",
    notes: [
      note(
        "detail",
        lines(
          "doch is the Arabic word for «yes, on the contrary»: it answers a negative question with yes. Du kommst nicht? – Doch!",
          "doch هي «بلى» العربية: تجيب عن سؤال منفي بالإيجاب. Du kommst nicht؟ – Doch!",
          "doch sirve para decir que sí a una pregunta negativa, como el «sí» enfático: Du kommst nicht? – Doch!",
          "doch, olumsuz soruya «hayır, öyle değil» anlamında evet demektir: Du kommst nicht? – Doch!",
        ),
        ["Kommst du nicht? – [Doch]!"],
      ),
    ],
    items: [
      "Kommst du? – [Ja], ich komme.",
      "Bist du müde? – [Nein], ich bin fit.",
      "Hast du keinen Hunger? – [Doch], ich habe Hunger.",
      "Ist das nicht dein Auto? – [Doch], das ist mein Auto.",
      "Bist du nicht müde? – [Nein], ich bin nicht müde.",
      "Magst du keinen Tee? – [Doch], sehr gern.",
    ],
  },
  "de-a1-22": {
    idea: lines(
      "nicht makes a verb, an adjective or a place negative. It usually stands at the end, or before the word it negates.",
      "نستعمل nicht لنفي الفعل أو الصفة أو المكان. وتقف غالباً في آخر الجملة أو قبل الكلمة التي تنفيها.",
      "nicht niega un verbo, un adjetivo o un lugar. Suele ir al final o delante de la palabra que niega.",
      "nicht fiili, sıfatı veya yeri olumsuz yapar. Genellikle sonda ya da olumsuzladığı sözcüğün önünde durur.",
    ),
    right: "Ich komme heute [nicht].",
    wrong: "Ich [nicht] komme heute.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not put nicht before the verb. Say Ich verstehe das nicht, not Ich nicht verstehe das.",
          "لا تضع nicht قبل الفعل. قل Ich verstehe das nicht وليس Ich nicht verstehe das.",
          "No pongas nicht antes del verbo. Di Ich verstehe das nicht, no Ich nicht verstehe das.",
          "nicht'i fiilin önüne koyma. Ich verstehe das nicht de, Ich nicht verstehe das deme.",
        ),
        ["Ich verstehe das [nicht].", "Das ist [nicht] teuer."],
      ),
    ],
    items: [
      "Ich komme heute [nicht].",
      "Das ist [nicht] teuer.",
      "Er arbeitet heute [nicht].",
      "Wir gehen [nicht] ins Kino.",
      "Ich verstehe das [nicht].",
      "Sie ist [nicht] müde.",
    ],
  },
  "de-a1-23": {
    idea: lines(
      "Use kein / keine for a noun with ein or no article. Use nicht for everything else.",
      "نستعمل kein / keine مع الاسم الذي يسبقه ein أو لا أداة. ونستعمل nicht لكل ما عدا ذلك.",
      "Usa kein / keine con un sustantivo que lleva ein o ningún artículo. Usa nicht para todo lo demás.",
      "ein'lı veya artikelsiz isimde kein / keine kullan. Geri kalan her şey için nicht kullan.",
    ),
    right: "Ich habe [keine] Zeit.",
    wrong: "Ich habe [nicht] Zeit.",
    notes: [
      note(
        "detail",
        lines(
          "If the noun has der / die / das or mein, use nicht: Das ist nicht mein Auto. Das ist kein Auto.",
          "إذا كان الاسم مسبوقاً بـ der / die / das أو mein فنستعمل nicht: Das ist nicht mein Auto. Das ist kein Auto.",
          "Si el sustantivo lleva der / die / das o mein, usa nicht: Das ist nicht mein Auto. Das ist kein Auto.",
          "İsimden önce der / die / das veya mein varsa nicht kullan: Das ist nicht mein Auto. Das ist kein Auto.",
        ),
        ["Das ist [nicht] mein Auto.", "Das ist [kein] Auto."],
      ),
    ],
    items: [
      "Das ist [kein] Auto.",
      "Das Auto ist [nicht] neu.",
      "Ich habe [keine] Katze.",
      "Er kommt [nicht] aus Berlin.",
      "Wir haben [keine] Zeit.",
      "Sie ist [nicht] zu Hause.",
    ],
  },
  "de-a1-24": {
    idea: lines(
      "es gibt means «there is» or «there are». The verb is always gibt, for one thing or many.",
      "es gibt تعني «يوجد». والفعل دائماً gibt سواء كان الشيء واحداً أو أكثر.",
      "es gibt significa «hay». El verbo es siempre gibt, para una cosa o para muchas.",
      "es gibt «vardır / bulunur» demektir. Fiil bir şey de olsa çok şey de olsa hep gibt'tir.",
    ),
    right: "Es [gibt] hier ein Café.",
    wrong: "Es [ist] hier ein Café.",
    notes: [
      note(
        "detail",
        lines(
          "Do not use es sind: Es gibt viele Bücher. In a question the verb comes first: Gibt es hier eine Bank?",
          "لا تستعمل es sind: Es gibt viele Bücher. وفي السؤال يأتي الفعل أولاً: Gibt es hier eine Bank؟",
          "No uses es sind: Es gibt viele Bücher. En la pregunta el verbo va primero: Gibt es hier eine Bank?",
          "es sind kullanma: Es gibt viele Bücher. Soruda fiil başa gelir: Gibt es hier eine Bank?",
        ),
        ["Es [gibt] viele Bücher.", "[Gibt] es hier eine Bank?"],
      ),
    ],
    items: [
      "[Gibt] es hier eine Apotheke?",
      "Es [gibt] viele Parks in Berlin.",
      "Heute [gibt] es Fisch.",
      "In der Stadt [gibt] es ein Kino.",
      "Hier [gibt] es keinen Supermarkt.",
      "Es [gibt] heute keinen Bus.",
    ],
  },
  "de-a1-25": {
    idea: lines(
      "Some verbs change e to i with du and er / sie / es: sprechen → du sprichst, er spricht.",
      "بعض الأفعال تغيّر e إلى i مع du وer / sie / es: sprechen ← du sprichst، er spricht.",
      "Algunos verbos cambian e por i con du y er / sie / es: sprechen → du sprichst, er spricht.",
      "Bazı fiiller du ve er / sie / es ile e'yi i'ye çevirir: sprechen → du sprichst, er spricht.",
    ),
    right: "Er [spricht] Deutsch.",
    wrong: "Er [sprecht] Deutsch.",
    notes: [
      note(
        "detail",
        lines(
          "Only du and er / sie / es change. ich, wir, ihr and sie stay normal: ich spreche, wir sprechen.",
          "التغيير يحدث مع du وer / sie / es فقط. أما ich وwir وihr وsie فتبقى عادية: ich spreche، wir sprechen.",
          "Solo cambian du y er / sie / es. ich, wir, ihr y sie son normales: ich spreche, wir sprechen.",
          "Sadece du ve er / sie / es değişir. ich, wir, ihr ve sie normal kalır: ich spreche, wir sprechen.",
        ),
        ["Ich [spreche] Deutsch.", "Wir [sprechen] Deutsch."],
      ),
      note(
        "exception",
        lines(
          "nehmen also changes a consonant: du nimmst, er nimmt. And with essen the du form is du isst (one s).",
          "الفعل nehmen يغيّر أيضاً حرفاً صامتاً: du nimmst، er nimmt. ومع essen تكون صيغة du هي du isst (حرف s واحد).",
          "nehmen cambia también una consonante: du nimmst, er nimmt. Y con essen la forma de du es du isst (una sola s).",
          "nehmen ayrıca bir ünsüzü de değiştirir: du nimmst, er nimmt. essen'de du biçimi du isst'tir (tek s).",
        ),
        ["Anna [nimmt] den Bus.", "Du [isst] gern Fisch."],
      ),
    ],
    items: [
      "Du [sprichst] gut Deutsch.{sprechen}",
      "Er [isst] gern Fisch.{essen}",
      "Sie [gibt] mir das Buch.{geben}",
      "Anna [nimmt] den Bus.{nehmen}",
      "Er [hilft] viel.{helfen}",
      "Du [triffst] heute Tom.{treffen}",
    ],
  },
  "de-a1-26": {
    idea: lines(
      "Some verbs change e to ie with du and er / sie / es: sehen → du siehst, er sieht; lesen → du liest, er liest.",
      "بعض الأفعال تغيّر e إلى ie مع du وer / sie / es: sehen ← du siehst، er sieht؛ lesen ← du liest، er liest.",
      "Algunos verbos cambian e por ie con du y er / sie / es: sehen → du siehst, er sieht; lesen → du liest, er liest.",
      "Bazı fiiller du ve er / sie / es ile e'yi ie'ye çevirir: sehen → du siehst, er sieht; lesen → du liest, er liest.",
    ),
    right: "Er [liest] ein Buch.",
    wrong: "Er [lest] ein Buch.",
    notes: [
      note(
        "exception",
        lines(
          "With lesen, du and er / sie / es have the same form: du liest, er liest (no extra s).",
          "مع lesen تكون صيغة du وer / sie / es واحدة: du liest، er liest (بلا s إضافية).",
          "Con lesen, du y er / sie / es tienen la misma forma: du liest, er liest (sin s extra).",
          "lesen'de du ve er / sie / es aynı biçimdedir: du liest, er liest (fazladan s yok).",
        ),
        ["Du [liest] gern Bücher.", "Sie [liest] viel."],
      ),
    ],
    items: [
      "Du [siehst] den Bus.{sehen}",
      "Sie [liest] viel.{lesen}",
      "Er [sieht] fern.{sehen}",
      "Du [liest] gern Bücher.{lesen}",
      "Was [siehst] du?{sehen}",
      "Anna [liest] eine Zeitung.{lesen}",
    ],
  },
  "de-a1-27": {
    idea: lines(
      "Some verbs add an umlaut (a → ä) with du and er / sie / es: fahren → du fährst, er fährt.",
      "بعض الأفعال تضيف نقطتين (a ← ä) مع du وer / sie / es: fahren ← du fährst، er fährt.",
      "Algunos verbos añaden diéresis (a → ä) con du y er / sie / es: fahren → du fährst, er fährt.",
      "Bazı fiiller du ve er / sie / es ile ünlü değişimi (a → ä) yapar: fahren → du fährst, er fährt.",
    ),
    right: "Er [fährt] nach Berlin.",
    wrong: "Er [fahrt] nach Berlin.",
    notes: [
      note(
        "detail",
        lines(
          "Common ones: fahren, schlafen, laufen, tragen, waschen. ich, wir, ihr and sie have no umlaut: ich fahre, wir fahren.",
          "أشهرها: fahren وschlafen وlaufen وtragen وwaschen. ولا نقطتان مع ich وwir وihr وsie: ich fahre، wir fahren.",
          "Los más comunes: fahren, schlafen, laufen, tragen, waschen. Con ich, wir, ihr y sie no hay diéresis: ich fahre, wir fahren.",
          "En yaygınları: fahren, schlafen, laufen, tragen, waschen. ich, wir, ihr ve sie ile ünlü değişmez: ich fahre, wir fahren.",
        ),
        ["Ich [fahre] nach Berlin.", "Du [schläfst] lange."],
      ),
    ],
    items: [
      "Er [fährt] nach Berlin.{fahren}",
      "Du [schläfst] zu lange.{schlafen}",
      "Sie [läuft] schnell.{laufen}",
      "Er [trägt] eine Jacke.{tragen}",
      "Du [fährst] mit dem Bus.{fahren}",
      "Anna [wäscht] das Auto.{waschen}",
    ],
  },
  "de-a1-28": {
    idea: lines(
      "wissen (to know) and werden (to become) are irregular: ich weiß, du weißt, er weiß; ich werde, du wirst, er wird.",
      "wissen (يعرف) وwerden (يصبح) فعلان شاذان: ich weiß، du weißt، er weiß؛ ich werde، du wirst، er wird.",
      "wissen (saber) y werden (llegar a ser) son irregulares: ich weiß, du weißt, er weiß; ich werde, du wirst, er wird.",
      "wissen (bilmek) ve werden (olmak) düzensizdir: ich weiß, du weißt, er weiß; ich werde, du wirst, er wird.",
    ),
    right: "Ich [weiß] das nicht.",
    wrong: "Ich [wisse] das nicht.",
    notes: [
      note(
        "exception",
        lines(
          "wissen: ich and er have the same form (weiß). werden: du wirst and er wird (not wirdst, not werdt).",
          "wissen: ich وer لهما الصيغة نفسها (weiß). werden: du wirst وer wird (وليس wirdst ولا werdt).",
          "wissen: ich y er tienen la misma forma (weiß). werden: du wirst y er wird (no wirdst).",
          "wissen: ich ve er aynı biçimdedir (weiß). werden: du wirst ve er wird (wirdst değil).",
        ),
        ["Du [weißt] viel.", "Es [wird] dunkel."],
      ),
    ],
    items: [
      "Ich [weiß] es nicht.{wissen}",
      "Du [weißt] viel.{wissen}",
      "Er [wird] Arzt.{werden}",
      "Ich [werde] müde.{werden}",
      "Wir [werden] Freunde.{werden}",
      "Es [wird] dunkel.{werden}",
    ],
  },
  "de-a1-29": {
    idea: lines(
      "A separable verb has a prefix that splits off: aufstehen → Ich stehe um sieben Uhr auf. The prefix goes to the end.",
      "الفعل المنفصل له بادئة تنفصل عنه: aufstehen ← Ich stehe um sieben Uhr auf. وتذهب البادئة إلى آخر الجملة.",
      "Un verbo separable tiene un prefijo que se separa: aufstehen → Ich stehe um sieben Uhr auf. El prefijo va al final.",
      "Ayrılabilen fiilin öneki ayrılır: aufstehen → Ich stehe um sieben Uhr auf. Önek cümlenin sonuna gider.",
    ),
    right: "Ich stehe um sieben Uhr [auf].",
    wrong: "Ich [aufstehe] um sieben Uhr.",
    notes: [
      note(
        "detail",
        lines(
          "Common prefixes: an, auf, aus, ein, mit, zu, ab. Look for them at the end of the sentence: Kommst du mit? Der Zug kommt an.",
          "بادئات شائعة: an وauf وaus وein وmit وzu وab. ابحث عنها في آخر الجملة: Kommst du mit؟ Der Zug kommt an.",
          "Prefijos comunes: an, auf, aus, ein, mit, zu, ab. Búscalos al final de la frase: Kommst du mit? Der Zug kommt an.",
          "Sık önekler: an, auf, aus, ein, mit, zu, ab. Onları cümlenin sonunda ara: Kommst du mit? Der Zug kommt an.",
        ),
        ["Kommst du [mit]?", "Der Zug kommt um acht Uhr [an]."],
      ),
    ],
    items: [
      "Ich stehe um sieben Uhr [auf].{aufstehen}",
      "Der Zug kommt um acht Uhr [an].{ankommen}",
      "Wir kaufen heute [ein].{einkaufen}",
      "Kommst du [mit]?{mitkommen}",
      "Er ruft seine Mutter [an].{anrufen}",
      "Die Schule fängt um neun [an].{anfangen}",
    ],
  },
  "de-a1-30": {
    idea: lines(
      "können (can): ich kann, du kannst, er kann, wir können, ihr könnt. The second verb goes to the end in the infinitive.",
      "الفعل können (يستطيع): ich kann، du kannst، er kann، wir können، ihr könnt. والفعل الثاني يذهب إلى آخر الجملة بصيغة المصدر.",
      "können (poder): ich kann, du kannst, er kann, wir können, ihr könnt. El segundo verbo va al final, en infinitivo.",
      "können (-ebilmek): ich kann, du kannst, er kann, wir können, ihr könnt. İkinci fiil mastar olarak sona gider.",
    ),
    right: "Ich [kann] schwimmen.",
    wrong: "Ich [können] schwimmen.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not add zu after a modal verb: Ich kann schwimmen (not Ich kann zu schwimmen). And ich and er have the same form: ich kann, er kann.",
          "لا تضف zu بعد الفعل المساعد: Ich kann schwimmen (وليس Ich kann zu schwimmen). وصيغة ich وer واحدة: ich kann، er kann.",
          "No añadas zu tras un verbo modal: Ich kann schwimmen (no Ich kann zu schwimmen). Y ich y er tienen la misma forma: ich kann, er kann.",
          "Kipli fiilden sonra zu ekleme: Ich kann schwimmen (Ich kann zu schwimmen değil). ich ve er aynı biçimdedir: ich kann, er kann.",
        ),
        ["Er [kann] gut kochen.", "Wir [können] helfen."],
      ),
    ],
    items: [
      "Ich [kann] gut schwimmen.",
      "Du [kannst] hier warten.",
      "Er [kann] nicht kommen.",
      "Wir [können] morgen helfen.",
      "Ihr [könnt] hier sitzen.",
      "[Kannst] du mir helfen?",
    ],
  },
};
