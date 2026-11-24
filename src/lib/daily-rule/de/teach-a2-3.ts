/** German rules de-a2-31 ... de-a2-45 (zu + infinitive, more about verbs, nouns and pronouns, relative clauses). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A2_3: Readonly<Record<string, RuleTeach>> = {
  "de-a2-31": {
    idea: lines(
      "After many verbs and adjectives the second verb is an infinitive with zu at the end: Es ist schön, dich zu sehen. Ich habe keine Lust, früh aufzustehen.",
      "بعد كثير من الأفعال والصفات يأتي الفعل الثاني مصدراً مع zu في آخر الجملة: Es ist schön, dich zu sehen. Ich habe keine Lust, früh aufzustehen.",
      "Tras muchos verbos y adjetivos el segundo verbo es un infinitivo con zu al final: Es ist schön, dich zu sehen. Ich habe keine Lust, früh aufzustehen.",
      "Birçok fiil ve sıfattan sonra ikinci fiil, sonda zu ile mastar olur: Es ist schön, dich zu sehen. Ich habe keine Lust, früh aufzustehen.",
    ),
    right: "Es ist schön, dich [zu] sehen.",
    wrong: "Es ist schön, dich [sehen].",
    notes: [
      note(
        "exception",
        lines(
          "A separable verb puts zu in the middle: aufstehen → aufzustehen, anrufen → anzurufen. And there is no zu after a modal verb: Ich kann schwimmen.",
          "الفعل المنفصل يضع zu في الوسط: aufstehen ← aufzustehen، anrufen ← anzurufen. ولا نضع zu بعد الفعل المساعد: Ich kann schwimmen.",
          "Un verbo separable pone zu en medio: aufstehen → aufzustehen, anrufen → anzurufen. Y no hay zu tras un verbo modal: Ich kann schwimmen.",
          "Ayrılabilen fiil zu'yu ortaya koyar: aufstehen → aufzustehen, anrufen → anzurufen. Kipli fiilden sonra zu olmaz: Ich kann schwimmen.",
        ),
        ["Ich habe vergessen, ihn [anzurufen].", "Ich kann [schwimmen]."],
      ),
    ],
    items: [
      "Es ist schön, dich [zu] sehen.",
      "Ich habe keine Lust, [zu] arbeiten.",
      "Ich versuche, Deutsch [zu] lernen.",
      "Er hat vergessen, mich [zu] besuchen.",
      "Es ist wichtig, viel [zu] schlafen.",
      "Ich fange an, Deutsch [zu] lernen.",
    ],
  },
  "de-a2-32": {
    idea: lines(
      "The simple past of the modal verbs is used in speech too: konnte, musste, wollte, durfte, sollte. They lose the umlaut and add -te.",
      "الماضي البسيط للأفعال المساعدة يُستعمل في الكلام أيضاً: konnte وmusste وwollte وdurfte وsollte. تفقد النقطتين وتأخذ -te.",
      "El pasado simple de los verbos modales se usa también al hablar: konnte, musste, wollte, durfte, sollte. Pierden la diéresis y añaden -te.",
      "Kipli fiillerin yalın geçmişi konuşmada da kullanılır: konnte, musste, wollte, durfte, sollte. Ünlü değişimini kaybeder ve -te alır.",
    ),
    right: "Ich [konnte] nicht kommen.",
    wrong: "Ich [kannte] nicht kommen.",
    notes: [
      note(
        "exception",
        lines(
          "ich and er / sie / es have the same form (ich konnte, er konnte). Do not confuse können and kennen: konnte = could, kannte = knew (a person).",
          "ich وer / sie / es لهما الصيغة نفسها (ich konnte، er konnte). ولا تخلط بين können وkennen: konnte = استطاع، kannte = عرف (شخصاً).",
          "ich y er / sie / es tienen la misma forma (ich konnte, er konnte). No confundas können y kennen: konnte = pudo, kannte = conocía (a alguien).",
          "ich ve er / sie / es aynı biçimdedir (ich konnte, er konnte). können ile kennen'i karıştırma: konnte = -ebildi, kannte = tanıyordu.",
        ),
        ["Er [konnte] nicht kommen.", "Ich [kannte] ihn."],
      ),
    ],
    items: [
      "Gestern [konnte] ich nicht kommen.{können}",
      "Er [musste] arbeiten.{müssen}",
      "Wir [wollten] ins Kino gehen.{wollen}",
      "Als Kind [durfte] ich nicht fernsehen.{dürfen}",
      "Sie [mussten] früh aufstehen.{müssen}",
      "Ich [wollte] dich anrufen.{wollen}",
    ],
  },
  "de-a2-33": {
    idea: lines(
      "A reflexive verb has a pronoun that points back to the subject: ich wasche mich, du wäschst dich, er wäscht sich, wir waschen uns, ihr wascht euch, sie waschen sich.",
      "الفعل الانعكاسي له ضمير يعود على الفاعل: ich wasche mich، du wäschst dich، er wäscht sich، wir waschen uns، ihr wascht euch، sie waschen sich.",
      "Un verbo reflexivo lleva un pronombre que remite al sujeto: ich wasche mich, du wäschst dich, er wäscht sich, wir waschen uns, ihr wascht euch, sie waschen sich.",
      "Dönüşlü fiilin özneye dönen bir zamiri vardır: ich wasche mich, du wäschst dich, er wäscht sich, wir waschen uns, ihr wascht euch, sie waschen sich.",
    ),
    right: "Ich freue [mich] auf das Wochenende.",
    wrong: "Ich freue [sich] auf das Wochenende.",
    notes: [
      note(
        "mistake",
        lines(
          "Many German verbs are reflexive where yours is not: sich freuen, sich beeilen, sich setzen, sich treffen. Learn them with sich.",
          "كثير من الأفعال الألمانية انعكاسية بينما ما يقابلها عندك ليس كذلك: sich freuen وsich beeilen وsich setzen وsich treffen. تعلّمها مع sich.",
          "Muchos verbos alemanes son reflexivos donde el tuyo no lo es: sich freuen, sich beeilen, sich setzen, sich treffen. Apréndelos con sich.",
          "Birçok Almanca fiil, seninkinde olmadığı hâlde dönüşlüdür: sich freuen, sich beeilen, sich setzen, sich treffen. Onları sich ile öğren.",
        ),
        ["Du musst [dich] beeilen.", "Er setzt [sich] auf den Stuhl."],
      ),
    ],
    items: [
      "Ich freue [mich] auf den Urlaub.",
      "Er setzt [sich] auf den Stuhl.",
      "Wir treffen [uns] am Bahnhof.",
      "Du musst [dich] beeilen.",
      "Sie ärgert [sich] über den Lärm.",
      "Ich wasche [mich] jeden Morgen.",
    ],
  },
  "de-a2-34": {
    idea: lines(
      "When the verb already has an object (a body part, a thing), the reflexive pronoun is dative: mir, dir. Ich wasche mir die Hände. Ich kaufe mir ein Eis.",
      "عندما يكون للفعل مفعول به (جزء من الجسم أو شيء) يكون الضمير الانعكاسي في حالة الجر: mir وdir. Ich wasche mir die Hände. Ich kaufe mir ein Eis.",
      "Cuando el verbo ya tiene un objeto (una parte del cuerpo, una cosa), el pronombre reflexivo va en dativo: mir, dir. Ich wasche mir die Hände. Ich kaufe mir ein Eis.",
      "Fiilin zaten bir nesnesi varsa (bir vücut parçası, bir şey) dönüşlü zamir Dativ olur: mir, dir. Ich wasche mir die Hände. Ich kaufe mir ein Eis.",
    ),
    right: "Ich wasche [mir] die Hände.",
    wrong: "Ich wasche [mich] die Hände.",
    notes: [
      note(
        "detail",
        lines(
          "Only ich and du differ: mich / mir, dich / dir. For er, sie, es, wir, ihr and sie the form sich, uns, euch is the same in both cases.",
          "الاختلاف فقط في ich وdu: mich / mir، dich / dir. أما er وsie وes وwir وihr وsie فالصيغة sich وuns وeuch واحدة في الحالتين.",
          "Solo ich y du difieren: mich / mir, dich / dir. Para er, sie, es, wir, ihr y sie, sich, uns, euch es igual en los dos casos.",
          "Sadece ich ve du farklıdır: mich / mir, dich / dir. er, sie, es, wir, ihr ve sie için sich, uns, euch iki hâlde de aynıdır.",
        ),
        ["Er wäscht [sich] die Hände.", "Du putzt [dir] die Zähne."],
      ),
    ],
    items: [
      "Ich putze [mir] die Zähne.",
      "Du kämmst [dir] die Haare.",
      "Ich wasche [mir] die Hände.",
      "Ich kaufe [mir] ein Eis.",
      "Sie zieht [sich] eine Jacke an.",
      "Ich wünsche [mir] ein Fahrrad.",
    ],
  },
  "de-a2-35": {
    idea: lines(
      "The future is werden + infinitive at the end: Ich werde nächstes Jahr nach Berlin ziehen. werden: ich werde, du wirst, er wird, wir werden.",
      "المستقبل هو werden + المصدر في الآخر: Ich werde nächstes Jahr nach Berlin ziehen. werden: ich werde، du wirst، er wird، wir werden.",
      "El futuro es werden + infinitivo al final: Ich werde nächstes Jahr nach Berlin ziehen. werden: ich werde, du wirst, er wird, wir werden.",
      "Gelecek zaman werden + sonda mastardır: Ich werde nächstes Jahr nach Berlin ziehen. werden: ich werde, du wirst, er wird, wir werden.",
    ),
    right: "Ich [werde] nächstes Jahr nach Berlin ziehen.",
    wrong: "Ich [wurde] nächstes Jahr nach Berlin ziehen.",
    notes: [
      note(
        "detail",
        lines(
          "Germans often use the present with a time word instead: Ich fahre morgen nach Berlin. Use werden for plans, promises and guesses: Es wird bald regnen.",
          "كثيراً ما يستعمل الألمان المضارع مع كلمة زمن بدلاً من ذلك: Ich fahre morgen nach Berlin. واستعمل werden للخطط والوعود والتوقعات: Es wird bald regnen.",
          "Los alemanes suelen usar el presente con una palabra de tiempo: Ich fahre morgen nach Berlin. Usa werden para planes, promesas y predicciones: Es wird bald regnen.",
          "Almanlar çoğu zaman bunun yerine zaman sözcüğüyle şimdiki zamanı kullanır: Ich fahre morgen nach Berlin. werden'i plan, söz ve tahmin için kullan: Es wird bald regnen.",
        ),
        ["Es [wird] bald regnen.", "Du [wirst] das schaffen."],
      ),
    ],
    items: [
      "Ich [werde] morgen anrufen.",
      "Es [wird] bald regnen.",
      "Wir [werden] nächstes Jahr heiraten.",
      "Du [wirst] das schaffen.",
      "Sie [werden] uns besuchen.",
      "Ich [werde] dir helfen.",
    ],
  },
  "de-a2-36": {
    idea: lines(
      "lassen means to let, to leave, or to have something done: Ich lasse mein Auto reparieren. Forms: ich lasse, du lässt, er lässt, wir lassen.",
      "lassen تعني يترك أو يسمح أو يُجري شيئاً عند غيره: Ich lasse mein Auto reparieren. صيغها: ich lasse، du lässt، er lässt، wir lassen.",
      "lassen significa dejar, permitir o hacer que otro haga algo: Ich lasse mein Auto reparieren. Formas: ich lasse, du lässt, er lässt, wir lassen.",
      "lassen bırakmak, izin vermek veya bir şeyi yaptırmak demektir: Ich lasse mein Auto reparieren. Biçimler: ich lasse, du lässt, er lässt, wir lassen.",
    ),
    right: "Er [lässt] sein Auto reparieren.",
    wrong: "Er [lasst] sein Auto reparieren.",
    notes: [
      note(
        "detail",
        lines(
          "With another verb the Perfekt uses lassen twice: Ich habe ihn gehen lassen. Alone it is gelassen: Ich habe den Schlüssel zu Hause gelassen.",
          "مع فعل آخر يستعمل الـ Perfekt كلمة lassen مرتين: Ich habe ihn gehen lassen. وحدها تكون gelassen: Ich habe den Schlüssel zu Hause gelassen.",
          "Con otro verbo, el Perfekt usa lassen dos veces: Ich habe ihn gehen lassen. Solo es gelassen: Ich habe den Schlüssel zu Hause gelassen.",
          "Başka bir fiille Perfekt'te lassen iki kez geçer: Ich habe ihn gehen lassen. Tek başına gelassen olur: Ich habe den Schlüssel zu Hause gelassen.",
        ),
        ["Ich habe ihn gehen [lassen]."],
      ),
    ],
    items: [
      "Ich [lasse] mein Handy reparieren.",
      "Er [lässt] die Kinder spielen.",
      "Wir [lassen] uns die Haare schneiden.",
      "Du [lässt] mich nie ausreden.",
      "Sie [lässt] das Auto waschen.",
      "Ich [lasse] den Hund draußen.",
    ],
  },
  "de-a2-37": {
    idea: lines(
      "More imperative forms: du uses the stem (Steh auf!), ihr stem + t (Steht auf!), Sie the infinitive + Sie (Stehen Sie auf!). The prefix of a separable verb goes to the end.",
      "المزيد من صيغ الأمر: مع du الجذر (Steh auf!)، ومع ihr الجذر + t (Steht auf!)، ومع Sie المصدر + Sie (Stehen Sie auf!). وبادئة الفعل المنفصل تذهب إلى الآخر.",
      "Más formas del imperativo: con du la raíz (Steh auf!), con ihr raíz + t (Steht auf!), con Sie infinitivo + Sie (Stehen Sie auf!). El prefijo del verbo separable va al final.",
      "Emir kipinin diğer biçimleri: du için kök (Steh auf!), ihr için kök + t (Steht auf!), Sie için mastar + Sie (Stehen Sie auf!). Ayrılabilen fiilin öneki sona gider.",
    ),
    right: "Steh bitte [auf]!",
    wrong: "[Aufsteh] bitte!",
    notes: [
      note(
        "detail",
        lines(
          "Add bitte to be polite: Komm bitte her! Kommen Sie bitte her! And sein is irregular: Sei leise! Seid leise! Seien Sie leise!",
          "أضف bitte للتهذيب: Komm bitte her! Kommen Sie bitte her! وsein شاذ: Sei leise! Seid leise! Seien Sie leise!",
          "Añade bitte para ser cortés: Komm bitte her! Kommen Sie bitte her! Y sein es irregular: Sei leise! Seid leise! Seien Sie leise!",
          "Kibar olmak için bitte ekle: Komm bitte her! Kommen Sie bitte her! sein düzensizdir: Sei leise! Seid leise! Seien Sie leise!",
        ),
        ["Mach die Tür [zu]!", "[Seien] Sie leise!"],
      ),
    ],
    items: [
      "Steh bitte [auf]!{aufstehen}",
      "[Kommt] bitte alle her!{kommen}",
      "[Seien] Sie bitte leise!{sein}",
      "Mach die Tür [zu]!{zumachen}",
      "[Wartet] hier!{warten}",
      "Ruf mich bitte [an]!{anrufen}",
    ],
  },
  "de-a2-38": {
    idea: lines(
      "Many verbs go with a fixed preposition: warten auf, denken an, sich freuen auf, sich interessieren für, träumen von, sich ärgern über. Learn them as a pair.",
      "كثير من الأفعال يرتبط بحرف جر ثابت: warten auf وdenken an وsich freuen auf وsich interessieren für وträumen von وsich ärgern über. تعلّمها كزوج.",
      "Muchos verbos van con una preposición fija: warten auf, denken an, sich freuen auf, sich interessieren für, träumen von, sich ärgern über. Apréndelos como pareja.",
      "Birçok fiil sabit bir edatla kullanılır: warten auf, denken an, sich freuen auf, sich interessieren für, träumen von, sich ärgern über. Onları çift olarak öğren.",
    ),
    right: "Ich warte [auf] den Bus.",
    wrong: "Ich warte [für] den Bus.",
    notes: [
      note(
        "mistake",
        lines(
          "The preposition often differs from your language: warten auf (not für), denken an, interessiert sein an / sich interessieren für. Write the pair in your notebook.",
          "حرف الجر يختلف غالباً عن لغتك: warten auf (وليس für)، denken an، sich interessieren für. اكتب الزوج في دفترك.",
          "La preposición suele diferir de tu idioma: warten auf (no für), denken an, sich interessieren für. Anota la pareja en tu cuaderno.",
          "Edat çoğu zaman kendi dilinden farklıdır: warten auf (für değil), denken an, sich interessieren für. Çifti defterine yaz.",
        ),
        ["Ich denke oft [an] meine Familie.", "Er interessiert sich [für] Musik."],
      ),
    ],
    items: [
      "Ich warte [auf] den Bus.",
      "Ich denke oft [an] meine Familie.",
      "Wir freuen uns [auf] den Urlaub.",
      "Er interessiert sich [für] Musik.",
      "Sie träumt [von] einem Haus.",
      "Ich ärgere mich [über] den Lärm.",
    ],
  },
  "de-a2-39": {
    idea: lines(
      "For things, a preposition + es becomes da- + preposition (darauf, daran, dafür), and a question becomes wo- + preposition (worauf, woran, wofür).",
      "للأشياء تتحول «حرف جر + es» إلى da- + حرف الجر (darauf وdaran وdafür)، ويتحول السؤال إلى wo- + حرف الجر (worauf وworan وwofür).",
      "Para cosas, una preposición + es pasa a da- + preposición (darauf, daran, dafür) y la pregunta pasa a wo- + preposición (worauf, woran, wofür).",
      "Şeyler için «edat + es», da- + edat olur (darauf, daran, dafür); soru ise wo- + edat olur (worauf, woran, wofür).",
    ),
    right: "Ich warte [darauf].",
    wrong: "Ich warte [auf es].",
    notes: [
      note(
        "exception",
        lines(
          "If the preposition starts with a vowel, add an r: da-r-auf, da-r-an, da-r-über, wo-r-auf. For people use the preposition + pronoun: Ich warte auf ihn. Auf wen wartest du?",
          "إذا بدأ حرف الجر بحرف علة فأضف r: da-r-auf وda-r-an وda-r-über وwo-r-auf. وللأشخاص استعمل حرف الجر + الضمير: Ich warte auf ihn. Auf wen wartest du؟",
          "Si la preposición empieza por vocal, añade una r: da-r-auf, da-r-an, da-r-über, wo-r-auf. Para personas usa preposición + pronombre: Ich warte auf ihn. Auf wen wartest du?",
          "Edat ünlüyle başlıyorsa r eklenir: da-r-auf, da-r-an, da-r-über, wo-r-auf. Kişiler için edat + zamir kullan: Ich warte auf ihn. Auf wen wartest du?",
        ),
        ["Ich warte auf [ihn].", "[Woran] denkst du?"],
      ),
    ],
    items: [
      "Ich freue mich [darauf].{auf + es}",
      "[Woran] denkst du?{an + was}",
      "Er interessiert sich [dafür].{für + es}",
      "[Wovon] träumst du?{von + was}",
      "Wir sprechen [darüber].{über + es}",
      "Ich denke [daran].{an + es}",
    ],
  },
  "de-a2-40": {
    idea: lines(
      "The genitive shows who something belongs to. Masculine and neuter: des + noun with -(e)s; feminine and plural: der: das Auto des Mannes, die Tasche der Frau.",
      "الإضافة (Genitiv) تبيّن لمن يعود الشيء. المذكر والمحايد: des + الاسم مع -(e)s؛ والمؤنث والجمع: der: das Auto des Mannes، die Tasche der Frau.",
      "El genitivo muestra a quién pertenece algo. Masculino y neutro: des + sustantivo con -(e)s; femenino y plural: der: das Auto des Mannes, die Tasche der Frau.",
      "Tamlayan hâli (Genitiv) bir şeyin kime ait olduğunu gösterir. Eril ve nötr: des + isim -(e)s ile; dişil ve çoğul: der: das Auto des Mannes, die Tasche der Frau.",
    ),
    right: "Das ist das Auto [des] Mannes.",
    wrong: "Das ist das Auto [dem] Mannes.",
    notes: [
      note(
        "detail",
        lines(
          "In everyday speech you will also hear von + dative: das Auto von meinem Vater. The genitive is more common in writing.",
          "في الكلام اليومي تسمع أيضاً von + حالة الجر: das Auto von meinem Vater. والإضافة أكثر شيوعاً في الكتابة.",
          "En el habla diaria también oirás von + dativo: das Auto von meinem Vater. El genitivo es más común por escrito.",
          "Günlük konuşmada von + Dativ de duyarsın: das Auto von meinem Vater. Genitiv yazıda daha yaygındır.",
        ),
        ["Das ist das Auto [von] meinem Vater."],
      ),
    ],
    items: [
      "Das ist das Auto [des] Lehrers.",
      "Das ist der Name [meines] Bruders.",
      "Die Tür [des] Hauses ist offen.",
      "Das ist die Tasche [meiner] Mutter.",
      "Das Ende [des] Films war schön.",
      "Das Buch [eines] Freundes ist neu.",
    ],
  },
  "de-a2-41": {
    idea: lines(
      "A small group of masculine nouns (der Junge, der Mensch, der Student, der Kollege, der Nachbar, der Herr) take -n or -en in every case except the nominative.",
      "مجموعة صغيرة من الأسماء المذكرة (der Junge وder Mensch وder Student وder Kollege وder Nachbar وder Herr) تأخذ -n أو -en في كل الحالات ما عدا المرفوع.",
      "Un pequeño grupo de sustantivos masculinos (der Junge, der Mensch, der Student, der Kollege, der Nachbar, der Herr) toma -n o -en en todos los casos salvo el nominativo.",
      "Küçük bir eril isim grubu (der Junge, der Mensch, der Student, der Kollege, der Nachbar, der Herr) yalın hâl dışında her yerde -n veya -en alır.",
    ),
    right: "Ich kenne den [Studenten].",
    wrong: "Ich kenne den [Student].",
    notes: [
      note(
        "exception",
        lines(
          "These are mostly people and animals: der Löwe, der Affe, der Kunde, der Polizist, der Tourist. And der Herr is special: den Herrn (-n only).",
          "هي في الغالب أشخاص وحيوانات: der Löwe وder Affe وder Kunde وder Polizist وder Tourist. وder Herr خاص: den Herrn (-n فقط).",
          "Son sobre todo personas y animales: der Löwe, der Affe, der Kunde, der Polizist, der Tourist. Y der Herr es especial: den Herrn (solo -n).",
          "Çoğunlukla kişi ve hayvanlardır: der Löwe, der Affe, der Kunde, der Polizist, der Tourist. der Herr özeldir: den Herrn (sadece -n).",
        ),
        ["Sie kennt den [Herrn].", "Wir helfen dem [Kunden]."],
      ),
    ],
    items: [
      "Ich sehe den [Jungen].",
      "Wir helfen dem [Nachbarn].",
      "Sie kennt den [Herrn].",
      "Ich frage den [Kollegen].",
      "Das ist das Auto des [Studenten].",
      "Er dankt dem [Menschen].",
    ],
  },
  "de-a2-42": {
    idea: lines(
      "A relative clause tells more about a noun. It starts with der, die, das (die in the plural), which matches the noun, and the verb goes to the end: Der Mann, der dort steht, ist mein Vater.",
      "الجملة الموصولة تزيد معلومات عن اسم. تبدأ بـ der أو die أو das (وdie للجمع) حسب الاسم، ويذهب الفعل إلى الآخر: Der Mann, der dort steht, ist mein Vater.",
      "Una oración de relativo da más información sobre un sustantivo. Empieza con der, die, das (die en plural) según el sustantivo y el verbo va al final: Der Mann, der dort steht, ist mein Vater.",
      "İlgi cümlesi bir isim hakkında bilgi verir. İsme uyan der, die, das (çoğulda die) ile başlar ve fiil sona gider: Der Mann, der dort steht, ist mein Vater.",
    ),
    right: "Der Mann, [der] dort steht, ist mein Vater.",
    wrong: "Der Mann, [die] dort steht, ist mein Vater.",
    notes: [
      note(
        "mistake",
        lines(
          "Some languages use one word for «who / which». German picks the pronoun by the gender and number of the noun, and puts commas around the clause.",
          "العربية تستعمل الاسم الموصول نفسه (الذي، التي) بحسب الجنس. والألمانية تختار الضمير حسب جنس الاسم وعدده، وتضع فاصلتين حول الجملة.",
          "El alemán elige el pronombre por el género y el número del sustantivo, y pone comas alrededor de la oración: Die Frau, die hier arbeitet, ist nett.",
          "Almanca zamiri ismin cinsiyetine ve sayısına göre seçer ve cümlenin iki yanına virgül koyar: Die Frau, die hier arbeitet, ist nett.",
        ),
        ["Die Frau, [die] hier arbeitet, ist nett."],
      ),
    ],
    items: [
      "Der Mann, [der] dort steht, ist mein Vater.",
      "Die Frau, [die] hier arbeitet, ist nett.",
      "Das Kind, [das] dort spielt, ist mein Neffe.",
      "Ich kenne den Mann, [der] hier wohnt.",
      "Das ist das Mädchen, [das] gestern angerufen hat.",
      "Die Kinder, [die] hier spielen, sind laut.",
    ],
  },
  "de-a2-43": {
    idea: lines(
      "When the relative pronoun is the object, only the masculine changes: den. Der Mann, den ich kenne. Die Frau, die ich kenne. Das Buch, das ich lese.",
      "عندما يكون ضمير الوصل مفعولاً به يتغيّر المذكر وحده: den. Der Mann, den ich kenne. Die Frau, die ich kenne. Das Buch, das ich lese.",
      "Cuando el pronombre relativo es el objeto, solo cambia el masculino: den. Der Mann, den ich kenne. Die Frau, die ich kenne. Das Buch, das ich lese.",
      "İlgi zamiri nesne olduğunda sadece eril değişir: den. Der Mann, den ich kenne. Die Frau, die ich kenne. Das Buch, das ich lese.",
    ),
    right: "Der Mann, [den] ich kenne, wohnt hier.",
    wrong: "Der Mann, [der] ich kenne, wohnt hier.",
    notes: [
      note(
        "detail",
        lines(
          "To choose the pronoun, ask two questions: which noun does it refer to (gender and number), and what job does it do in its own clause (subject or object)?",
          "لاختيار الضمير اسأل سؤالين: إلى أي اسم يعود (جنسه وعدده)، وما وظيفته في جملته (فاعل أم مفعول)؟",
          "Para elegir el pronombre pregunta dos cosas: ¿a qué sustantivo se refiere (género y número) y qué función tiene en su oración (sujeto u objeto)?",
          "Zamiri seçmek için iki soru sor: hangi isme gönderiyor (cinsiyet ve sayı) ve kendi cümlesinde ne iş görüyor (özne mi nesne mi)?",
        ),
        ["Das Buch, [das] ich lese, ist spannend."],
      ),
    ],
    items: [
      "Das ist der Film, [den] ich gestern gesehen habe.",
      "Der Hund, [den] ich habe, ist klein.",
      "Das Buch, [das] ich lese, ist spannend.",
      "Die Frau, [die] ich gestern getroffen habe, ist nett.",
      "Wie heißt der Mann, [den] du gestern angerufen hast?",
      "Das ist die Tasche, [die] ich gekauft habe.",
    ],
  },
  "de-a2-44": {
    idea: lines(
      "When the relative pronoun is dative, it is dem (masculine, neuter), der (feminine) and denen (plural): Der Mann, dem ich helfe.",
      "عندما يكون ضمير الوصل في حالة الجر فهو dem (للمذكر والمحايد) وder (للمؤنث) وdenen (للجمع): Der Mann, dem ich helfe.",
      "Cuando el pronombre relativo va en dativo es dem (masculino, neutro), der (femenino) y denen (plural): Der Mann, dem ich helfe.",
      "İlgi zamiri Dativ olduğunda dem (eril, nötr), der (dişil) ve denen (çoğul) olur: Der Mann, dem ich helfe.",
    ),
    right: "Der Mann, [dem] ich helfe, ist alt.",
    wrong: "Der Mann, [den] ich helfe, ist alt.",
    notes: [
      note(
        "exception",
        lines(
          "The plural dative is denen (not den): Die Kinder, denen wir helfen, sind klein. Verbs that take the dative (helfen, danken, gehören) need a dative pronoun.",
          "جمع حالة الجر هو denen (وليس den): Die Kinder, denen wir helfen, sind klein. والأفعال التي تأخذ حالة الجر (helfen وdanken وgehören) تحتاج ضميراً في هذه الحالة.",
          "El dativo plural es denen (no den): Die Kinder, denen wir helfen, sind klein. Los verbos con dativo (helfen, danken, gehören) necesitan un pronombre en dativo.",
          "Çoğul Dativ denen'dir (den değil): Die Kinder, denen wir helfen, sind klein. Dativ alan fiiller (helfen, danken, gehören) Dativ zamir ister.",
        ),
        ["Die Kinder, [denen] wir helfen, sind klein."],
      ),
    ],
    items: [
      "Der Mann, [dem] ich helfe, ist alt.",
      "Das Kind, [dem] die Mütze gehört, weint.",
      "Die Kinder, [denen] wir helfen, sind klein.",
      "Der Freund, [dem] ich schreibe, wohnt in Wien.",
      "Das ist der Lehrer, [dem] ich danke.",
      "Die Nachbarn, [denen] das Haus gehört, sind nett.",
    ],
  },
  "de-a2-45": {
    idea: lines(
      "man means «one» or «people» in general: Man spricht hier Deutsch. jemand is somebody, niemand nobody, etwas something, nichts nothing, alles everything.",
      "man تعني «المرء» أو «الناس» عموماً: Man spricht hier Deutsch. وjemand = شخص ما، niemand = لا أحد، etwas = شيء ما، nichts = لا شيء، alles = كل شيء.",
      "man significa «uno» o «la gente» en general: Man spricht hier Deutsch. jemand es alguien, niemand nadie, etwas algo, nichts nada, alles todo.",
      "man «insan» veya «herkes» anlamında genel bir öznedir: Man spricht hier Deutsch. jemand biri, niemand kimse, etwas bir şey, nichts hiçbir şey, alles her şey demektir.",
    ),
    right: "[Man] spricht hier Deutsch.",
    wrong: "[Es] spricht hier Deutsch.",
    notes: [
      note(
        "mistake",
        lines(
          "man (one) is not der Mann (the man). It always takes the er-form of the verb: Man kann hier parken. In English «you» is used this way too.",
          "man (المرء) ليست der Mann (الرجل). وتأخذ دائماً صيغة er للفعل: Man kann hier parken. وفي الإنكليزية يُستعمل «you» بالمعنى نفسه.",
          "man (uno) no es der Mann (el hombre). Siempre lleva la forma er del verbo: Man kann hier parken. En español se dice «se puede aparcar aquí».",
          "man (insan) der Mann (adam) değildir. Fiilin er biçimini alır: Man kann hier parken. Türkçede «burada park edilir» gibi.",
        ),
        ["[Man] kann hier parken.", "Hier wohnt [niemand]."],
      ),
    ],
    items: [
      "[Man] spricht hier Deutsch.",
      "Ist [jemand] da?",
      "Hier wohnt [niemand].",
      "Ich brauche [etwas] zu trinken.",
      "Er sagt [nichts].",
      "Hast du [alles] verstanden?",
    ],
  },
};
