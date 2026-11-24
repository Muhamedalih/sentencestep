/** German rules de-a1-31 ... de-a1-45 (modals, imperative, the accusative, prepositions, time, linking). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A1_3: Readonly<Record<string, RuleTeach>> = {
  "de-a1-31": {
    idea: lines(
      "müssen (must, have to) and wollen (to want): ich muss / will, du musst / willst, er muss / will, wir müssen / wollen.",
      "الفعلان müssen (يجب) وwollen (يريد): ich muss / will، du musst / willst، er muss / will، wir müssen / wollen.",
      "müssen (tener que) y wollen (querer): ich muss / will, du musst / willst, er muss / will, wir müssen / wollen.",
      "müssen (-meli) ve wollen (istemek): ich muss / will, du musst / willst, er muss / will, wir müssen / wollen.",
    ),
    right: "Ich [muss] arbeiten.",
    wrong: "Ich [müssen] arbeiten.",
    notes: [
      note(
        "exception",
        lines(
          "nicht müssen does not mean «must not». Er muss nicht kommen = he does not have to come. For «not allowed» use darf nicht.",
          "nicht müssen لا تعني «يُمنع». Er muss nicht kommen = ليس مضطراً أن يأتي. وللمنع نستعمل darf nicht.",
          "nicht müssen no significa «no debe». Er muss nicht kommen = no tiene que venir. Para «prohibido» usa darf nicht.",
          "nicht müssen «yapmamalı» demek değildir. Er muss nicht kommen = gelmek zorunda değil. «Yasak» için darf nicht kullan.",
        ),
        ["Er [muss] nicht kommen.", "Hier [darf] man nicht rauchen."],
      ),
    ],
    items: [
      "Ich [muss] heute arbeiten.",
      "Du [musst] mehr lernen.",
      "Wir [müssen] jetzt gehen.",
      "Ich [will] Deutsch lernen.",
      "Er [will] nach Hause.",
      "[Willst] du einen Tee?",
    ],
  },
  "de-a1-32": {
    idea: lines(
      "möchten is a polite «would like»: ich möchte. dürfen means «may»: ich darf. sollen means «should»: ich soll.",
      "möchten تعني «أودّ» بأدب: ich möchte. وdürfen تعني «يُسمح»: ich darf. وsollen تعني «ينبغي»: ich soll.",
      "möchten es un «quisiera» cortés: ich möchte. dürfen significa «poder (permiso)»: ich darf. sollen significa «deber»: ich soll.",
      "möchten kibar bir «istiyorum»dur: ich möchte. dürfen «izin var» demektir: ich darf. sollen «-meli» demektir: ich soll.",
    ),
    right: "Ich [möchte] einen Kaffee.",
    wrong: "Ich [möchten] einen Kaffee.",
    notes: [
      note(
        "detail",
        lines(
          "möchte is the best way to order or ask politely: Ich möchte einen Tee, bitte. dürfen and sollen work like können: ich darf, er darf; ich soll, er soll.",
          "möchte أفضل طريقة للطلب بأدب: Ich möchte einen Tee, bitte. وdürfen وsollen يعملان مثل können: ich darf، er darf؛ ich soll، er soll.",
          "möchte es la mejor forma de pedir con cortesía: Ich möchte einen Tee, bitte. dürfen y sollen funcionan como können: ich darf, er darf; ich soll, er soll.",
          "möchte kibarca istemenin en iyi yoludur: Ich möchte einen Tee, bitte. dürfen ve sollen, können gibi çalışır: ich darf, er darf; ich soll, er soll.",
        ),
        ["[Möchten] Sie Tee?", "Du [darfst] gehen."],
      ),
    ],
    items: [
      "Ich [möchte] einen Kaffee.",
      "[Möchten] Sie Tee?",
      "Hier [darf] man nicht rauchen.",
      "Du [darfst] jetzt gehen.",
      "Du [sollst] mehr schlafen.",
      "Wir [sollen] leise sein.",
    ],
  },
  "de-a1-33": {
    idea: lines(
      "The imperative gives an order or advice. For du use the stem (Komm!), for ihr stem + t (Kommt!), for Sie the infinitive + Sie (Kommen Sie!).",
      "الأمر للطلب أو النصيحة. مع du نستعمل الجذر (Komm!)، ومع ihr الجذر + t (Kommt!)، ومع Sie المصدر + Sie (Kommen Sie!).",
      "El imperativo da una orden o un consejo. Con du, la raíz (Komm!); con ihr, raíz + t (Kommt!); con Sie, infinitivo + Sie (Kommen Sie!).",
      "Emir kipi emir veya öğüt verir. du için kök (Komm!), ihr için kök + t (Kommt!), Sie için mastar + Sie (Kommen Sie!).",
    ),
    right: "[Komm] bitte her!",
    wrong: "[Kommst] bitte her!",
    notes: [
      note(
        "exception",
        lines(
          "Verbs that change e to i keep it in the du form: nimm!, sprich!, lies! (not nehm!). And sein is irregular: sei!, seid!, seien Sie!",
          "الأفعال التي تغيّر e إلى i تحتفظ بذلك في أمر du: nimm! وsprich! وlies! (وليس nehm!). وsein شاذ: sei! وseid! وseien Sie!",
          "Los verbos que cambian e por i lo mantienen con du: nimm!, sprich!, lies! (no nehm!). Y sein es irregular: sei!, seid!, seien Sie!",
          "e'yi i'ye çeviren fiiller du emrinde bunu korur: nimm!, sprich!, lies! (nehm! değil). sein düzensizdir: sei!, seid!, seien Sie!",
        ),
        ["[Nimm] einen Apfel!", "[Sei] leise!"],
      ),
    ],
    items: [
      "[Komm] bitte her!{kommen}",
      "[Lies] den Text!{lesen}",
      "[Warte] hier!{warten}",
      "[Seid] leise!{sein}",
      "[Sprechen] Sie bitte langsam!{sprechen}",
      "[Nimm] einen Apfel!{nehmen}",
    ],
  },
  "de-a1-34": {
    idea: lines(
      "gern says you like doing something. Put it after the verb: Ich spiele gern Fußball.",
      "تعبّر gern عن حبّ فعل شيء. ضعها بعد الفعل: Ich spiele gern Fußball.",
      "gern dice que te gusta hacer algo. Va después del verbo: Ich spiele gern Fußball.",
      "gern bir şeyi yapmaktan hoşlandığını söyler. Fiilden sonra gelir: Ich spiele gern Fußball.",
    ),
    right: "Ich spiele [gern] Fußball.",
    wrong: "Ich [gern] spiele Fußball.",
    notes: [
      note(
        "detail",
        lines(
          "For a noun you like, use mögen: Ich mag Kaffee. For an activity use gern: Ich trinke gern Kaffee. To say you do not like it: nicht gern.",
          "لشيء تحبه (اسم) استعمل mögen: Ich mag Kaffee. ولنشاط استعمل gern: Ich trinke gern Kaffee. وللنفي: nicht gern.",
          "Para un sustantivo que te gusta usa mögen: Ich mag Kaffee. Para una actividad usa gern: Ich trinke gern Kaffee. Para negar: nicht gern.",
          "Sevdiğin bir isim için mögen kullan: Ich mag Kaffee. Bir etkinlik için gern: Ich trinke gern Kaffee. Olumsuz: nicht gern.",
        ),
        ["Ich trinke [gern] Kaffee.", "Er spielt nicht [gern] Fußball."],
      ),
    ],
    items: [
      "Ich esse [gern] Pizza.",
      "Er spielt [gern] Fußball.",
      "Wir lesen [gern] Bücher.",
      "Sie singt [gern].",
      "Trinkst du [gern] Tee?",
      "Ich fahre [gern] Rad.",
    ],
  },
  "de-a1-35": {
    idea: lines(
      "If the stem ends in -t or -d, add an e before -st and -t: du arbeitest, er arbeitet, ihr arbeitet.",
      "إذا انتهى الجذر بـ -t أو -d نضيف e قبل -st و-t: du arbeitest، er arbeitet، ihr arbeitet.",
      "Si la raíz acaba en -t o -d, añade una e antes de -st y -t: du arbeitest, er arbeitet, ihr arbeitet.",
      "Kök -t veya -d ile bitiyorsa -st ve -t'den önce e eklenir: du arbeitest, er arbeitet, ihr arbeitet.",
    ),
    right: "Er [arbeitet] hier.",
    wrong: "Er [arbeitt] hier.",
    notes: [
      note(
        "detail",
        lines(
          "The extra e makes the word easy to say. It is only for du, er / sie / es and ihr: ich arbeite, wir arbeiten.",
          "الـ e الزائدة تسهّل النطق. وهي فقط مع du وer / sie / es وihr: ich arbeite، wir arbeiten.",
          "La e extra facilita la pronunciación. Solo con du, er / sie / es e ihr: ich arbeite, wir arbeiten.",
          "Fazladan e okunmayı kolaylaştırır. Sadece du, er / sie / es ve ihr ile: ich arbeite, wir arbeiten.",
        ),
        ["Du [arbeitest] viel.", "Ihr [arbeitet] heute."],
      ),
    ],
    items: [
      "Du [arbeitest] viel.{arbeiten}",
      "Er [arbeitet] in einer Bank.{arbeiten}",
      "Ihr [arbeitet] heute.{arbeiten}",
      "Du [badest] gern.{baden}",
      "Er [wartet] auf den Bus.{warten}",
      "Du [findest] das gut.{finden}",
    ],
  },
  "de-a1-36": {
    idea: lines(
      "The accusative is the form of the object, what the action is done to. Only the masculine changes: der → den, ein → einen.",
      "المفعول به (Akkusativ) هو ما يقع عليه الفعل. والمذكر وحده يتغيّر: der ← den، ein ← einen.",
      "El acusativo es la forma del objeto, lo que recibe la acción. Solo cambia el masculino: der → den, ein → einen.",
      "Akkusativ, eylemin yöneldiği nesnenin biçimidir. Sadece eril değişir: der → den, ein → einen.",
    ),
    right: "Ich sehe [den] Hund.",
    wrong: "Ich sehe [der] Hund.",
    notes: [
      note(
        "detail",
        lines(
          "die Frau, das Haus and the plural stay the same: Ich sehe die Frau, das Haus, die Kinder. Ask: wen oder was? (whom or what?)",
          "die Frau وdas Haus والجمع تبقى كما هي: Ich sehe die Frau، das Haus، die Kinder. اسأل: wen oder was؟ (من أو ماذا؟)",
          "die Frau, das Haus y el plural no cambian: Ich sehe die Frau, das Haus, die Kinder. Pregunta: wen oder was? (¿a quién o qué?)",
          "die Frau, das Haus ve çoğul aynı kalır: Ich sehe die Frau, das Haus, die Kinder. Sor: wen oder was? (kimi ya da neyi?)",
        ),
        ["Ich sehe [die] Frau.", "Ich habe [einen] Bruder."],
      ),
      note(
        "mistake",
        lines(
          "Arabic marks the object with a fatha and German marks it on the article of masculine nouns. Think of der → den as the same idea.",
          "العربية تُعلّم المفعول به بالفتحة، والألمانية تُعلّمه بتغيير أداة المذكر. فكّر في der ← den على أنها الفكرة نفسها.",
          "En español el objeto no cambia la forma del artículo, pero en alemán el masculino sí: der → den. Acostúmbrate a esta señal.",
          "Türkçedeki -ı / -i hâl eki gibi, Almancada da nesne belirtilir: eril isimde der → den olur.",
        ),
        ["Ich kenne [den] Lehrer.", "Er kauft [einen] Tisch."],
      ),
    ],
    items: [
      "Ich kenne [den] Lehrer.",
      "Er kauft [einen] Tisch.",
      "Wir sehen [den] Bus.",
      "Ich habe [einen] Bruder.",
      "Sie liebt [den] Mann.",
      "Hast du [einen] Stift?",
    ],
  },
  "de-a1-37": {
    idea: lines(
      "As an object, ich becomes mich, du becomes dich, er becomes ihn, wir becomes uns, ihr becomes euch.",
      "عندما تكون الضمائر مفعولاً به: ich ← mich، du ← dich، er ← ihn، wir ← uns، ihr ← euch.",
      "Como objeto, ich pasa a mich, du a dich, er a ihn, wir a uns, ihr a euch.",
      "Nesne olduğunda ich → mich, du → dich, er → ihn, wir → uns, ihr → euch olur.",
    ),
    right: "Ich liebe [dich].",
    wrong: "Ich liebe [du].",
    notes: [
      note(
        "detail",
        lines(
          "sie, es and Sie do not change: Ich sehe sie. Ich sehe es.",
          "sie وes وSie لا تتغيّر: Ich sehe sie. Ich sehe es.",
          "sie, es y Sie no cambian: Ich sehe sie. Ich sehe es.",
          "sie, es ve Sie değişmez: Ich sehe sie. Ich sehe es.",
        ),
        ["Ich sehe [sie].", "Ich sehe [es]."],
      ),
    ],
    items: [
      "Kennst du [mich]?",
      "Ich sehe [dich].",
      "Der Hund ist süß. Ich mag [ihn].",
      "Anna ruft [mich] an.",
      "Ich besuche [ihn] morgen.",
      "Wir lieben [dich].",
    ],
  },
  "de-a1-38": {
    idea: lines(
      "für, ohne, durch and gegen are always followed by the accusative: für mich, ohne ihn, durch den Park, gegen die Wand.",
      "بعد für وohne وdurch وgegen يأتي المفعول به (Akkusativ) دائماً: für mich، ohne ihn، durch den Park، gegen die Wand.",
      "Tras für, ohne, durch y gegen va siempre el acusativo: für mich, ohne ihn, durch den Park, gegen die Wand.",
      "für, ohne, durch ve gegen'den sonra hep Akkusativ gelir: für mich, ohne ihn, durch den Park, gegen die Wand.",
    ),
    right: "Das Geschenk ist [für] dich.",
    wrong: "Das Geschenk ist [mit] dich.",
    notes: [
      note(
        "detail",
        lines(
          "um (around, at) takes the accusative too. Remember them as: für, ohne, gegen, durch, um.",
          "وum (حول، في) تأخذ الحالة نفسها. احفظها هكذا: für وohne وgegen وdurch وum.",
          "um (alrededor, a las) también lleva acusativo. Recuérdalas así: für, ohne, gegen, durch, um.",
          "um (etrafında, saat) de Akkusativ alır. Şöyle ezberle: für, ohne, gegen, durch, um.",
        ),
        ["Wir gehen [durch] den Park.", "Kaffee [ohne] Zucker, bitte."],
      ),
    ],
    items: [
      "Das ist ein Geschenk [für] dich.",
      "Ich gehe [ohne] ihn.",
      "Wir gehen [durch] den Park.",
      "Er spielt [gegen] mich.",
      "Kaffee [ohne] Zucker, bitte.",
      "Das Buch ist [für] meinen Bruder.",
    ],
  },
  "de-a1-39": {
    idea: lines(
      "aus, bei, mit, nach, von, zu (and seit) are always followed by the dative: mit dem Bus, aus der Stadt, zu mir.",
      "بعد aus وbei وmit وnach وvon وzu (وseit) تأتي حالة الجر (Dativ) دائماً: mit dem Bus، aus der Stadt، zu mir.",
      "Tras aus, bei, mit, nach, von, zu (y seit) va siempre el dativo: mit dem Bus, aus der Stadt, zu mir.",
      "aus, bei, mit, nach, von, zu (ve seit)'den sonra hep Dativ gelir: mit dem Bus, aus der Stadt, zu mir.",
    ),
    right: "Ich fahre [mit] dem Bus.",
    wrong: "Ich fahre [für] dem Bus.",
    notes: [
      note(
        "detail",
        lines(
          "Some join the article: zu dem = zum, zu der = zur, bei dem = beim, von dem = vom. Learn aus, bei, mit, nach, seit, von, zu as one list.",
          "بعضها يندمج مع الأداة: zu dem = zum، zu der = zur، bei dem = beim، von dem = vom. احفظ aus وbei وmit وnach وseit وvon وzu كقائمة واحدة.",
          "Algunas se funden con el artículo: zu dem = zum, zu der = zur, bei dem = beim, von dem = vom. Aprende aus, bei, mit, nach, seit, von, zu como una lista.",
          "Bazıları artikelle kaynaşır: zu dem = zum, zu der = zur, bei dem = beim, von dem = vom. aus, bei, mit, nach, seit, von, zu'yu tek liste olarak öğren.",
        ),
        ["Ich gehe [zum] Arzt.", "Er wohnt [beim] Bahnhof."],
      ),
    ],
    items: [
      "Ich fahre [mit] dem Bus.",
      "Er kommt [aus] Syrien.",
      "Ich gehe [zu] Anna.",
      "Wir wohnen [bei] meinen Eltern.",
      "Das ist ein Brief [von] meiner Mutter.",
      "Ich fahre [nach] Berlin.",
    ],
  },
  "de-a1-40": {
    idea: lines(
      "in, an, auf, unter, vor, hinter, neben, über, zwischen answer «wo?» (where is it?) with the dative: auf dem Tisch, in der Schule.",
      "in وan وauf وunter وvor وhinter وneben وüber وzwischen تجيب عن «أين؟» مع حالة الجر (Dativ): auf dem Tisch، in der Schule.",
      "in, an, auf, unter, vor, hinter, neben, über y zwischen responden a «¿dónde?» con el dativo: auf dem Tisch, in der Schule.",
      "in, an, auf, unter, vor, hinter, neben, über ve zwischen «nerede?» sorusuna Dativ ile cevap verir: auf dem Tisch, in der Schule.",
    ),
    right: "Das Buch liegt auf [dem] Tisch.",
    wrong: "Das Buch liegt auf [den] Tisch.",
    notes: [
      note(
        "detail",
        lines(
          "dem is for masculine and neuter, der for feminine. in dem = im, an dem = am: Ich bin im Park, am Fenster.",
          "dem للمذكر والمحايد، وder للمؤنث. in dem = im، an dem = am: Ich bin im Park، am Fenster.",
          "dem es para masculino y neutro, der para femenino. in dem = im, an dem = am: Ich bin im Park, am Fenster.",
          "dem eril ve nötr, der dişil içindir. in dem = im, an dem = am: Ich bin im Park, am Fenster.",
        ),
        ["Ich bin [im] Park.", "Er steht [am] Fenster."],
      ),
    ],
    items: [
      "Das Buch liegt auf [dem] Tisch.",
      "Ich bin in [der] Schule.",
      "Er steht an [der] Tür.",
      "Die Katze sitzt auf [dem] Sofa.",
      "Wir sind in [der] Stadt.",
      "Das Bild hängt an [der] Wand.",
    ],
  },
  "de-a1-41": {
    idea: lines(
      "The same prepositions answer «wohin?» (where to?) with the accusative: in die Schule, auf den Tisch.",
      "حروف الجر نفسها تجيب عن «wohin؟» (إلى أين؟) مع المفعول به (Akkusativ): in die Schule، auf den Tisch.",
      "Las mismas preposiciones responden a «¿adónde?» con el acusativo: in die Schule, auf den Tisch.",
      "Aynı edatlar «wohin?» (nereye?) sorusuna Akkusativ ile cevap verir: in die Schule, auf den Tisch.",
    ),
    right: "Ich gehe in [die] Schule.",
    wrong: "Ich gehe in [der] Schule.",
    notes: [
      note(
        "mistake",
        lines(
          "The only difference is movement. Staying in a place (wo?) takes the dative, going to a place (wohin?) takes the accusative: Ich bin in der Schule, Ich gehe in die Schule.",
          "الفرق الوحيد هو الحركة. البقاء في مكان (wo؟) يأخذ حالة الجر (Dativ)، والذهاب إلى مكان (wohin؟) يأخذ المفعول به (Akkusativ): Ich bin in der Schule، Ich gehe in die Schule.",
          "La única diferencia es el movimiento. Estar en un lugar (wo?) lleva dativo, ir a un lugar (wohin?) lleva acusativo: Ich bin in der Schule, Ich gehe in die Schule.",
          "Tek fark harekettir. Bir yerde olmak (wo?) Dativ, bir yere gitmek (wohin?) Akkusativ alır: Ich bin in der Schule, Ich gehe in die Schule.",
        ),
        ["Ich bin in [der] Schule.", "Ich gehe in [die] Schule."],
      ),
    ],
    items: [
      "Ich gehe in [die] Schule.",
      "Ich lege das Buch auf [den] Tisch.",
      "Wir fahren in [die] Stadt.",
      "Sie geht in [den] Park.",
      "Ich hänge das Bild an [die] Wand.",
      "Die Katze springt auf [das] Sofa.",
    ],
  },
  "de-a1-42": {
    idea: lines(
      "Use um for clock times (um acht Uhr), am for days and parts of the day (am Montag, am Abend), im for months and seasons (im Mai, im Sommer).",
      "نستعمل um لساعات الوقت (um acht Uhr)، وam للأيام وأوقات اليوم (am Montag، am Abend)، وim للشهور والفصول (im Mai، im Sommer).",
      "Usa um para la hora (um acht Uhr), am para días y momentos del día (am Montag, am Abend), im para meses y estaciones (im Mai, im Sommer).",
      "Saat için um (um acht Uhr), günler ve gün bölümleri için am (am Montag, am Abend), aylar ve mevsimler için im (im Mai, im Sommer) kullan.",
    ),
    right: "Der Film beginnt [um] acht Uhr.",
    wrong: "Der Film beginnt [am] acht Uhr.",
    notes: [
      note(
        "exception",
        lines(
          "Night and weekend are special: in der Nacht (not am Nacht), am Wochenende.",
          "الليل ونهاية الأسبوع حالتان خاصتان: in der Nacht (وليس am Nacht)، وam Wochenende.",
          "La noche y el fin de semana son especiales: in der Nacht (no am Nacht), am Wochenende.",
          "Gece ve hafta sonu özeldir: in der Nacht (am Nacht değil), am Wochenende.",
        ),
        ["Ich schlafe [in] der Nacht.", "Wir fahren [am] Wochenende weg."],
      ),
    ],
    items: [
      "Der Kurs beginnt [um] neun Uhr.",
      "[Am] Montag habe ich frei.",
      "[Im] Juli ist es heiß.",
      "Ich stehe [um] sieben Uhr auf.",
      "Wir fahren [im] Sommer ans Meer.",
      "Er kommt [am] Freitag.",
    ],
  },
  "de-a1-43": {
    idea: lines(
      "Days, months and seasons are all masculine and start with a capital: der Montag, der Mai, der Sommer.",
      "الأيام والشهور والفصول كلها مذكرة وتبدأ بحرف كبير: der Montag، der Mai، der Sommer.",
      "Los días, los meses y las estaciones son masculinos y llevan mayúscula: der Montag, der Mai, der Sommer.",
      "Günler, aylar ve mevsimler eril olup büyük harfle başlar: der Montag, der Mai, der Sommer.",
    ),
    right: "Heute ist [Montag].",
    wrong: "Heute ist [montag].",
    notes: [
      note(
        "detail",
        lines(
          "Days: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag. Seasons: Frühling, Sommer, Herbst, Winter.",
          "الأيام: Montag وDienstag وMittwoch وDonnerstag وFreitag وSamstag وSonntag. الفصول: Frühling وSommer وHerbst وWinter.",
          "Días: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag. Estaciones: Frühling, Sommer, Herbst, Winter.",
          "Günler: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag. Mevsimler: Frühling, Sommer, Herbst, Winter.",
        ),
        ["Im [Winter] ist es kalt.", "Im [Sommer] ist es heiß."],
      ),
    ],
    items: [
      "Nach Montag kommt [Dienstag].{Tuesday}",
      "Das Wochenende hat Samstag und [Sonntag].{Sunday}",
      "Der erste Monat ist [Januar].{January}",
      "Im [Winter] ist es kalt.{winter}",
      "Im [Sommer] ist es heiß.{summer}",
      "Der zwölfte Monat ist [Dezember].{December}",
    ],
  },
  "de-a1-44": {
    idea: lines(
      "When a sentence has several details, the usual order is: when (time), how (manner), where (place).",
      "عندما تحمل الجملة عدة تفاصيل فالترتيب المعتاد: متى (الزمان) ثم كيف (الطريقة) ثم أين (المكان).",
      "Cuando una frase tiene varios datos, el orden habitual es: cuándo (tiempo), cómo (modo), dónde (lugar).",
      "Cümlede birden çok ayrıntı varsa olağan sıra: ne zaman (zaman), nasıl (biçim), nerede (yer).",
    ),
    right: "Ich fahre [morgen] mit dem Bus nach Berlin.",
    wrong: "Ich fahre nach Berlin [morgen] mit dem Bus.",
    notes: [
      note(
        "detail",
        lines(
          "Time can also start the sentence: Morgen fahre ich mit dem Bus nach Berlin. The verb stays second.",
          "ويمكن أن يبدأ الزمان الجملة: Morgen fahre ich mit dem Bus nach Berlin. ويبقى الفعل ثانياً.",
          "El tiempo también puede abrir la frase: Morgen fahre ich mit dem Bus nach Berlin. El verbo sigue en segundo lugar.",
          "Zaman cümleyi de başlatabilir: Morgen fahre ich mit dem Bus nach Berlin. Fiil yine ikinci kalır.",
        ),
        ["[Morgen] fahre ich mit dem Bus nach Berlin."],
      ),
    ],
    items: [
      "Ich gehe [heute] ins Kino.{when?}",
      "Wir fahren [morgen] mit dem Zug nach Köln.{when?}",
      "Er arbeitet [jetzt] in Berlin.{when?}",
      "Sie fliegt [am] Montag nach Wien.{when?}",
      "Ich fahre [heute] mit dem Auto nach Hause.{when?}",
      "Wir essen [abends] im Restaurant.{when?}",
    ],
  },
  "de-a1-45": {
    idea: lines(
      "und, aber, oder and denn join two sentences without changing the word order: the verb stays second.",
      "und وaber وoder وdenn تربط جملتين دون أن تغيّر ترتيب الكلمات: يبقى الفعل ثانياً.",
      "und, aber, oder y denn unen dos frases sin cambiar el orden: el verbo sigue en segundo lugar.",
      "und, aber, oder ve denn iki cümleyi sözcük sırasını değiştirmeden bağlar: fiil ikinci kalır.",
    ),
    right: "Ich bleibe zu Hause, denn [ich bin] krank.",
    wrong: "Ich bleibe zu Hause, denn [bin ich] krank.",
    notes: [
      note(
        "detail",
        lines(
          "und = and, aber = but, oder = or, denn = because. Use denn with a normal sentence, not weil (weil sends the verb to the end).",
          "und = و، aber = لكن، oder = أو، denn = لأن. استعمل denn مع جملة عادية لا weil (لأن weil ترسل الفعل إلى آخر الجملة).",
          "und = y, aber = pero, oder = o, denn = porque. Usa denn con una frase normal, no weil (weil manda el verbo al final).",
          "und = ve, aber = ama, oder = veya, denn = çünkü. denn'i normal cümleyle kullan, weil ile değil (weil fiili sona atar).",
        ),
        ["Ich komme nicht, [denn] ich bin krank.", "Es ist kalt, [aber] die Sonne scheint."],
      ),
    ],
    items: [
      "Ich mag Tee, [aber] ich trinke lieber Kaffee.",
      "Möchtest du Tee [oder] Kaffee?",
      "Ich komme nicht, [denn] ich bin krank.",
      "Tom [und] Anna lernen Deutsch.",
      "Es ist kalt, [aber] die Sonne scheint.",
      "Wir gehen ins Kino [oder] wir bleiben zu Hause.",
    ],
  },
};
