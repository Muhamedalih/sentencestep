/**
 * What the rules of the B2 syllabus teach in its first two units: advanced tenses (b2-08 ... b2-14) and
 * conditionals and wishes (b2-15 ... b2-20). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_B2_TENSES: Readonly<Record<string, RuleTeach>> = {
  "b2-08": {
    idea: lines(
      "Use the simple for a result or a number (I have written three emails). Use the continuous for the activity itself (I have been writing all morning).",
      "البسيط للنتيجة أو العدد (I have written three emails)، والمستمر للنشاط نفسه ومدته (I have been writing all morning).",
      "Usa el simple para un resultado o una cantidad (I have written three emails). Usa el continuo para la actividad misma (I have been writing all morning).",
      "Sonuç ya da sayı için basit biçimi (I have written three emails), etkinliğin kendisi için sürekli biçimi (I have been writing all morning) kullan.",
    ),
    right: "I [have been writing] all morning.",
    wrong: "I [have written] all morning.",
    notes: [
      note(
        "detail",
        lines(
          "How many or how much asks for the simple. How long, all day or since asks for the continuous.",
          "How many أو how much تطلب البسيط، وhow long أو all day أو since تطلب المستمر.",
          "How many o how much piden el simple. How long, all day o since piden el continuo.",
          "How many ya da how much basit biçim ister. How long, all day ya da since sürekli biçim ister.",
        ),
        ["I have read [three] books.", "I have been reading [all day]."],
      ),
      note(
        "exception",
        lines(
          "Verbs like know, like and want stay simple, even with for: I have known him for years.",
          "أفعال مثل know وlike وwant تبقى بسيطة حتى مع for: I have known him for years.",
          "Verbos como know, like y want siguen en simple, incluso con for: I have known him for years.",
          "Know, like ve want gibi fiiller for ile bile basit kalır: I have known him for years.",
        ),
        ["I [have known] him for years."],
      ),
    ],
    items: [
      "I [have been waiting|'ve been waiting] for the bus for an hour.{wait}",
      "She [has written|'s written] three emails today.{write}",
      "They [have been playing|'ve been playing] football since morning.{play}",
      "I [have read|'ve read] five chapters of this book.{read}",
      "He is tired. He [has been working|'s been working] all day.{work}",
      "We [have known|'ve known] each other for ten years.{know}",
    ],
  },
  "b2-09": {
    idea: lines(
      "Use had been + -ing for an action that was going on before another past moment: She was tired because she had been working all day.",
      "نستعمل had been + ‏-ing لفعل كان مستمراً قبل لحظة أخرى في الماضي: She was tired because she had been working all day.",
      "Usa had been + -ing para una acción que duraba antes de otro momento del pasado: She was tired because she had been working all day.",
      "Başka bir geçmiş andan önce süren eylem için had been + -ing kullan: She was tired because she had been working all day.",
    ),
    right: "She was tired because she had been [working] all day.",
    wrong: "She was tired because she had been [worked] all day.",
    notes: [
      note(
        "detail",
        lines(
          "It explains a result you can see in the past: His eyes were red. He had been crying.",
          "تشرح نتيجة ظاهرة في الماضي: His eyes were red. He had been crying.",
          "Explica un resultado visible en el pasado: His eyes were red. He had been crying.",
          "Geçmişte görülen bir sonucu açıklar: His eyes were red. He had been crying.",
        ),
        ["He had been [crying].", "They had been [waiting] for hours."],
      ),
    ],
    items: [
      "His eyes were red because he had been [crying].{cry}",
      "We were exhausted. We had been [walking] for hours.{walk}",
      "She had been [studying] all night, so she fell asleep in class.{study}",
      "It had been [raining] for days before the river rose.{rain}",
      "How long had you been [waiting] when the bus came?{wait}",
      "The floor was wet. Someone had been [cleaning] it.{clean}",
    ],
  },
  "b2-10": {
    idea: lines(
      "In a story use the past simple for the main events, the past continuous for the scene, and the past perfect for what happened earlier.",
      "في السرد نستعمل الماضي البسيط للأحداث الرئيسية، والماضي المستمر للمشهد، والماضي التام لما حدث قبل ذلك.",
      "En un relato usa el pasado simple para los hechos principales, el continuo para la escena y el past perfect para lo anterior.",
      "Bir hikâyede ana olaylar için past simple, ortam için past continuous, daha önce olanlar için past perfect kullan.",
    ),
    right: "When I arrived, the film [had started].",
    wrong: "When I arrived, the film [starts].",
    notes: [
      note(
        "detail",
        lines(
          "The past perfect is the earlier event: the film started first, then I arrived.",
          "الماضي التام هو الحدث الأسبق: بدأ الفيلم أولاً ثم وصلت أنا.",
          "El past perfect es el hecho anterior: la película empezó primero y luego llegué yo.",
          "Past perfect önce olan olaydır: film önce başladı, sonra ben geldim.",
        ),
        ["The film [had started] when I arrived.", "It [was raining] when I left."],
      ),
    ],
    items: [
      "When we got to the station, the train [had left|had already left].{leave}",
      "I was walking home when I [saw] an accident.{see}",
      "She [had finished] her homework before dinner.{finish}",
      "It was a cold night. The wind [was blowing] and the stars were bright.{blow}",
      "He [opened] the door and walked in.{open}",
      "By the time I arrived, everyone [had gone|had left] home.{go}",
    ],
  },
  "b2-11": {
    idea: lines(
      "Use will be + -ing for an action in progress at a future time: This time tomorrow I will be flying to Dubai.",
      "نستعمل will be + ‏-ing لفعل سيكون جارياً في وقت مستقبلي: This time tomorrow I will be flying to Dubai.",
      "Usa will be + -ing para una acción en curso en un momento futuro: This time tomorrow I will be flying to Dubai.",
      "Gelecekte belli bir anda sürüyor olacak eylem için will be + -ing kullan: This time tomorrow I will be flying to Dubai.",
    ),
    right: "This time tomorrow I will be [flying] to Dubai.",
    wrong: "This time tomorrow I will [flying] to Dubai.",
    notes: [
      note(
        "detail",
        lines(
          "It also asks politely about plans: Will you be using the car tonight?",
          "وتُستعمل لسؤال مهذب عن الخطط: Will you be using the car tonight؟",
          "También sirve para preguntar con cortesía por los planes: Will you be using the car tonight?",
          "Planlar hakkında kibarca sormak için de kullanılır: Will you be using the car tonight?",
        ),
        ["Will you be [using] the car?", "I'll be [working] at nine."],
      ),
    ],
    items: [
      "This time tomorrow I will be [flying] to Dubai.{fly}",
      "Don't call at eight. I will be [having] dinner.{have}",
      "In ten years, she will be [working] as a doctor.{work}",
      "Will you be [using] the car tonight?{use}",
      "At noon tomorrow we will be [sitting] in the exam hall.{sit}",
      "Next summer they will be [travelling|traveling] around Turkey.{travel}",
    ],
  },
  "b2-12": {
    idea: lines(
      "Use will have + past participle for an action that will be finished before a future time: By June I will have finished my course.",
      "نستعمل will have + التصريف الثالث لفعل سينتهي قبل وقت مستقبلي: By June I will have finished my course.",
      "Usa will have + participio para una acción que habrá terminado antes de un momento futuro: By June I will have finished my course.",
      "Gelecekteki bir zamandan önce bitmiş olacak eylem için will have + participle kullan: By June I will have finished my course.",
    ),
    right: "By June I will have [finished] my course.",
    wrong: "By June I will have [finish] my course.",
    notes: [
      note(
        "detail",
        lines(
          "It often comes with by + a time (by Friday, by 2030) or by the time: By the time you arrive, I will have left.",
          "تأتي غالباً مع by + وقت (by Friday وby 2030) أو by the time: By the time you arrive, I will have left.",
          "Suele ir con by + un momento (by Friday, by 2030) o by the time: By the time you arrive, I will have left.",
          "Genelde by + zaman (by Friday, by 2030) ya da by the time ile gelir: By the time you arrive, I will have left.",
        ),
        ["By Friday she will have [left].", "By 2030 we will have [moved]."],
      ),
    ],
    items: [
      "By next year, I will have [finished] university.{finish}",
      "She will have [left] by the time you arrive.{leave}",
      "By 2030, they will have [built] a new bridge.{build}",
      "In June, we will have [lived] here for ten years.{live}",
      "Don't worry. I will have [cleaned] the house by six.{clean}",
      "By the time we get there, the film will have [started].{start}",
    ],
  },
  "b2-13": {
    idea: lines(
      "For past habits, used to and would both work. For past states (be, have, know, live) only used to works: I used to live there.",
      "للعادات الماضية يصلح used to وwould معاً. أما للحالات الماضية (be وhave وknow وlive) فيصلح used to فقط: I used to live there.",
      "Para hábitos del pasado valen used to y would. Para estados del pasado (be, have, know, live) solo used to: I used to live there.",
      "Geçmiş alışkanlıklar için used to ve would olur. Geçmiş durumlar (be, have, know, live) için yalnızca used to olur: I used to live there.",
    ),
    right: "We [used to] live near the sea.",
    wrong: "We [would] live near the sea.",
    notes: [
      note(
        "detail",
        lines(
          "Would needs a past time in the context (When I was young…). Without it, use used to.",
          "تحتاج would إلى وقت ماضٍ في السياق (When I was young…). ومن دونه نستعمل used to.",
          "Would necesita un tiempo pasado en el contexto (When I was young…). Sin él, usa used to.",
          "Would için bağlamda geçmiş bir zaman gerekir (When I was young…). Yoksa used to kullan.",
        ),
        ["When I was young, we [would] swim every day.", "I [used to] be shy."],
      ),
    ],
    items: [
      "When I was a child, we [would|used to] visit my grandmother every Friday.",
      "I [used to] have long hair, but I cut it last year.",
      "He [used to] be afraid of dogs.",
      "Every summer, my father [would|used to] take us to the river.",
      "There [used to] be a big tree in front of our house.",
      "She [used to] live in Mosul before she moved to Erbil.",
    ],
  },
  "b2-14": {
    idea: lines(
      "Be used to + -ing means you are familiar with it: I am used to getting up early. Get used to means to become familiar.",
      "be used to + ‏-ing تعني أنك معتاد عليه: I am used to getting up early. وget used to تعني أن تعتاد.",
      "Be used to + -ing significa estar acostumbrado: I am used to getting up early. Get used to significa acostumbrarse.",
      "Be used to + -ing alışık olmak demektir: I am used to getting up early. Get used to alışmak demektir.",
    ),
    right: "I am used to [getting] up early.",
    wrong: "I am used to [get] up early.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not mix used to + verb (a past habit) with be used to + -ing (familiar now).",
          "لا تخلط بين used to + فعل (عادة ماضية) وbe used to + ‏-ing (معتاد الآن).",
          "No confundas used to + verbo (hábito pasado) con be used to + -ing (acostumbrado ahora).",
          "Used to + fiil (geçmiş alışkanlık) ile be used to + -ing (şimdi alışık) karıştırma.",
        ),
        ["I [used to] live in Mosul.", "I am [used to] living in Erbil."],
      ),
    ],
    items: [
      "I'm used to [getting] up early.{get}",
      "She is not used to [driving] on the left.{drive}",
      "It took me a month to get used to [living] in a big city.{live}",
      "He is used to [working] at night.{work}",
      "We aren't used to [eating] so late.{eat}",
      "Are you used to [speaking] English every day?{speak}",
    ],
  },
  "b2-15": {
    idea: lines(
      "Use if + past perfect, would have + past participle for an unreal past: If I had studied, I would have passed.",
      "نستعمل if + الماضي التام، would have + التصريف الثالث لماضٍ لم يحدث: If I had studied, I would have passed.",
      "Usa if + past perfect, would have + participio para un pasado irreal: If I had studied, I would have passed.",
      "Gerçekleşmemiş geçmiş için if + past perfect, would have + participle kullan: If I had studied, I would have passed.",
    ),
    right: "If I had studied, I [would have] passed.",
    wrong: "If I [would have] studied, I would have passed.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not put would have in the if part. The if part has had, the result part has would have.",
          "لا نضع would have في جزء if. جزء if فيه had، وجزء النتيجة فيه would have.",
          "No pongas would have en la parte del if. El if lleva had y el resultado lleva would have.",
          "Would have'i if bölümüne koyma. If bölümünde had, sonuç bölümünde would have olur.",
        ),
        ["If she had known, she [would have] helped."],
      ),
      note(
        "detail",
        lines(
          "It talks about a past that did not happen, often with regret: If I had left earlier, I would have caught the train.",
          "تتحدث عن ماضٍ لم يحدث، وغالباً مع ندم: If I had left earlier, I would have caught the train.",
          "Habla de un pasado que no ocurrió, a menudo con pesar: If I had left earlier, I would have caught the train.",
          "Gerçekleşmemiş bir geçmişten, çoğu zaman pişmanlıkla söz eder: If I had left earlier, I would have caught the train.",
        ),
        ["If I [had left] earlier, I would have caught it."],
      ),
    ],
    items: [
      "If I had studied, I [would have|'d have] passed the exam.",
      "If she had known, she [would have|'d have] helped us.",
      "If we had left earlier, we [would have|'d have] caught the train.",
      "If it had not rained, we [would have|'d have] gone to the beach.",
      "If he had [studied] harder, he would have passed.{study}",
      "They would have won if they had [played] better.{play}",
    ],
  },
  "b2-16": {
    idea: lines(
      "Mix the times: if + past perfect, would + verb for a past action with a result now: If I had studied medicine, I would be a doctor now.",
      "نخلط الزمنين: if + الماضي التام، would + فعل لفعل ماضٍ بنتيجة الآن: If I had studied medicine, I would be a doctor now.",
      "Mezcla los tiempos: if + past perfect, would + verbo para una acción pasada con resultado ahora: If I had studied medicine, I would be a doctor now.",
      "Zamanları karıştır: şimdiki sonucu olan geçmiş eylem için if + past perfect, would + fiil: If I had studied medicine, I would be a doctor now.",
    ),
    right: "If I had studied medicine, I [would be] a doctor now.",
    wrong: "If I had studied medicine, I [would have been] a doctor now.",
    notes: [
      note(
        "detail",
        lines(
          "It works the other way too: if + past, would have + participle (a present state explains the past): If I weren't so shy, I would have asked her.",
          "وتعمل بالعكس أيضاً: if + الماضي، would have + التصريف الثالث (حالة حاضرة تفسّر الماضي): If I weren't so shy, I would have asked her.",
          "También al revés: if + pasado, would have + participio (un estado presente explica el pasado): If I weren't so shy, I would have asked her.",
          "Tersi de olur: if + past, would have + participle (şimdiki durum geçmişi açıklar): If I weren't so shy, I would have asked her.",
        ),
        ["If I were braver, I [would have] spoken.", "If he had slept, he [would be] fresh now."],
      ),
    ],
    items: [
      "If I had studied medicine, I [would be|'d be] a doctor now.",
      "If she had taken the job, she [would live|'d live] in London now.{live}",
      "If we had left earlier, we [would be|'d be] at the beach now.",
      "If he had listened to me, he [wouldn't be|would not be] in trouble now.",
      "If I weren't so tired, I [would have|'d have] gone to the party.",
      "If you had slept well last night, you [would feel|'d feel] better now.{feel}",
    ],
  },
  "b2-17": {
    idea: lines(
      "Use wish / if only + past perfect for a regret about the past: I wish I had studied more. If only I had listened.",
      "نستعمل wish / if only + الماضي التام للندم على الماضي: I wish I had studied more. If only I had listened.",
      "Usa wish / if only + past perfect para lamentar el pasado: I wish I had studied more. If only I had listened.",
      "Geçmişe pişmanlık için wish / if only + past perfect kullan: I wish I had studied more. If only I had listened.",
    ),
    right: "I wish I [had studied] more.",
    wrong: "I wish I [have studied] more.",
    notes: [
      note(
        "detail",
        lines(
          "Wish + past is about now (I wish I had a car). Wish + past perfect is about the past (I wish I had bought it).",
          "wish + الماضي عن الحاضر (I wish I had a car). وwish + الماضي التام عن الماضي (I wish I had bought it).",
          "Wish + pasado habla del presente (I wish I had a car). Wish + past perfect habla del pasado (I wish I had bought it).",
          "Wish + past şimdi hakkındadır (I wish I had a car). Wish + past perfect geçmiş hakkındadır (I wish I had bought it).",
        ),
        ["I wish I [had] a car.", "I wish I [had bought] it."],
      ),
    ],
    items: [
      "I wish I [had studied] harder at school.{study}",
      "If only I [had listened] to my mother.{listen}",
      "She wishes she [had taken] the other road.{take}",
      "I wish we [had left] earlier. We missed the train.{leave}",
      "If only he [had told] me the truth.{tell}",
      "They wish they [had bought] the house.{buy}",
    ],
  },
  "b2-18": {
    idea: lines(
      "Use wish + would to complain about something that annoys you, or to want someone else to change: I wish you would stop talking.",
      "نستعمل wish + would للشكوى من شيء يزعجنا أو لنتمنى أن يتغير غيرنا: I wish you would stop talking.",
      "Usa wish + would para quejarte de algo que te molesta o para querer que otra persona cambie: I wish you would stop talking.",
      "Seni rahatsız eden bir şeyden yakınmak ya da başkasının değişmesini istemek için wish + would kullan: I wish you would stop talking.",
    ),
    right: "I wish you [would] stop talking.",
    wrong: "I wish you [will] stop talking.",
    notes: [
      note(
        "exception",
        lines(
          "Do not use wish + would about yourself. Use could: I wish I could swim (not I wish I would swim).",
          "لا نستعمل wish + would عن أنفسنا بل could: I wish I could swim (وليس I wish I would swim).",
          "No uses wish + would para ti mismo. Usa could: I wish I could swim (no I wish I would swim).",
          "Kendin için wish + would kullanma. Could kullan: I wish I could swim (I wish I would swim değil).",
        ),
        ["I wish I [could] swim.", "I wish he [would] listen."],
      ),
    ],
    items: [
      "I wish you [would] stop making noise.",
      "I wish it [would] stop raining.",
      "She wishes her brother [would] help more at home.",
      "I wish the bus [would] come. I'm cold.",
      "I wish I [could] fly like a bird.",
      "They wish their neighbours [would] be quieter.",
    ],
  },
  "b2-19": {
    idea: lines(
      "Provided and as long as mean only if. In case means because it may happen. Otherwise means if not.",
      "provided وas long as بمعنى «بشرط أن». وin case بمعنى «تحسباً لـ». وotherwise بمعنى «وإلا».",
      "Provided y as long as significan solo si. In case significa por si acaso. Otherwise significa si no.",
      "Provided ve as long as yalnızca eğer demektir. In case olur da diye demektir. Otherwise yoksa demektir.",
    ),
    right: "You can go out [provided] you finish your homework.",
    wrong: "You can go out [in case] you finish your homework.",
    notes: [
      note(
        "mistake",
        lines(
          "In case is not if: Take an umbrella in case it rains (before the rain). If it rains, I'll take it (after).",
          "in case ليست if: Take an umbrella in case it rains (قبل المطر). أما If it rains, I'll take it (بعد المطر).",
          "In case no es if: Take an umbrella in case it rains (antes de la lluvia). If it rains, I'll take it (después).",
          "In case, if değildir: Take an umbrella in case it rains (yağmurdan önce). If it rains, I'll take it (yağmurdan sonra).",
        ),
        ["Take a coat [in case] it gets cold.", "[If] it gets cold, I'll wear it."],
      ),
    ],
    items: [
      "You can borrow my car [provided|providing|as long as] you drive carefully.",
      "Take an umbrella [in case] it rains.",
      "Hurry up, [otherwise] we will miss the bus.",
      "I'll lend you the book [as long as|provided|providing] you give it back.",
      "Write it down [in case] you forget.",
      "Wear a helmet, [otherwise] you could get hurt.",
    ],
  },
  "b2-20": {
    idea: lines(
      "Would rather + base verb says what you prefer: I'd rather stay. For another person use the past: I'd rather you stayed. It's time we left.",
      "would rather + الفعل الأساسي لما نفضّله: I'd rather stay. ومع شخص آخر نستعمل الماضي: I'd rather you stayed. It's time we left.",
      "Would rather + verbo base dice lo que prefieres: I'd rather stay. Con otra persona usa el pasado: I'd rather you stayed. It's time we left.",
      "Would rather + yalın fiil tercihini söyler: I'd rather stay. Başka biri için past kullan: I'd rather you stayed. It's time we left.",
    ),
    right: "I would [rather] stay at home.",
    wrong: "I would [rather to] stay at home.",
    notes: [
      note(
        "detail",
        lines(
          "When the person changes, use the past form, but the meaning is now: I'd rather you stayed. It's time we went home.",
          "حين يتغير الشخص نستعمل صيغة الماضي والمعنى للحاضر: I'd rather you stayed. It's time we went home.",
          "Cuando cambia la persona, usa el pasado, aunque el significado es ahora: I'd rather you stayed. It's time we went home.",
          "Kişi değişince past kullan, anlam şimdidir: I'd rather you stayed. It's time we went home.",
        ),
        ["I'd rather you [stayed].", "It's time we [went] home."],
      ),
    ],
    items: [
      "I'd [rather] stay at home tonight.",
      "I'd rather you [stayed] here with me.{stay}",
      "It's time we [left]. It's very late.{leave}",
      "She would rather [walk] than take a taxi.{walk}",
      "I'd rather you [didn't] tell anyone.{don't}",
      "It's time you [went] to bed.{go}",
    ],
  },
};
