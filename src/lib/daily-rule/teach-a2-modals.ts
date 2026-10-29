/**
 * What the rules of the A2–B1 syllabus teach in its next three units: the future (a2-21 ... a2-25), the modal
 * verbs (a2-26 ... a2-31) and comparison and degree (a2-32 ... a2-37). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_A2_MODALS: Readonly<Record<string, RuleTeach>> = {
  "a2-21": {
    idea: lines(
      "Use the present continuous with a future time word for a fixed plan: I am meeting Ali tomorrow.",
      "نستعمل المضارع المستمر مع وقت في المستقبل لخطة مرتَّبة: I am meeting Ali tomorrow.",
      "Usa el presente continuo con una palabra de tiempo futuro para un plan ya organizado: I am meeting Ali tomorrow.",
      "Planlanmış bir gelecek için gelecek zaman sözcüğüyle birlikte şimdiki zamanı kullan: I am meeting Ali tomorrow.",
    ),
    right: "I am [meeting] Ali tomorrow.",
    wrong: "I am [meet] Ali tomorrow.",
    notes: [
      note(
        "detail",
        lines(
          "The plan is already arranged: a time, a place, a person. For a plan without details, use going to.",
          "الخطة مرتَّبة من قبل: وقت ومكان وشخص. وللخطة التي بلا تفاصيل نستعمل going to.",
          "El plan ya está organizado: una hora, un lugar, una persona. Para un plan sin detalles, usa going to.",
          "Plan zaten hazırdır: bir saat, bir yer, bir kişi. Ayrıntısız bir plan için going to kullan.",
        ),
        ["We are [flying] to Dubai next week.", "Are you [coming] tonight?"],
      ),
    ],
    items: [
      "I [am meeting|'m meeting] my teacher tomorrow at ten.{meet}",
      "We [are flying|'re flying] to Istanbul next week.{fly}",
      "She [is visiting|'s visiting] her aunt tonight.{visit}",
      "What time are you [leaving] tomorrow?{leave}",
      "They [are having|'re having] a party on Friday.{have}",
      "He [is starting|'s starting] his new job next Monday.{start}",
    ],
  },
  "a2-22": {
    idea: lines(
      "Use will + the base verb for predictions, offers, promises and quick decisions: It will rain. I will help you.",
      "نستعمل will + الفعل الأساسي للتوقعات والعروض والوعود والقرارات السريعة: It will rain. I will help you.",
      "Usa will + verbo base para predicciones, ofrecimientos, promesas y decisiones rápidas: It will rain. I will help you.",
      "Tahmin, teklif, söz ve ani karar için will + yalın fiil kullan: It will rain. I will help you.",
    ),
    right: "I [will] help you.",
    wrong: "I will [to] help you.",
    notes: [
      note(
        "detail",
        lines(
          "Will has no -s and no to. Short form: I'll, she'll. Negative: won't.",
          "will لا تأخذ -s ولا to. الاختصار: I'll وshe'll. والنفي: won't.",
          "Will no lleva -s ni to. Forma corta: I'll, she'll. Negativa: won't.",
          "Will -s ve to almaz. Kısa biçim: I'll, she'll. Olumsuz: won't.",
        ),
        ["She [will] call you.", "I [won't] be late."],
      ),
    ],
    items: [
      "Don't worry. I [will|'ll] help you with your homework.",
      "I think it [will|'ll] rain tomorrow.",
      "I'm hungry. I [will|'ll] make a sandwich.",
      "She [will] be very happy when she sees this.",
      "I promise I [won't|will not] be late.",
      "[Will] you help me carry this bag?",
    ],
  },
  "a2-23": {
    idea: lines(
      "Use going to for a plan you already made, or when you can see it will happen. Use will for a decision made now, or a guess.",
      "going to لخطة جاهزة من قبل أو لشيء نرى علاماته الآن. وwill لقرار نتخذه الآن أو لتخمين.",
      "Usa going to para un plan ya hecho o cuando ves que va a pasar. Usa will para una decisión del momento o una suposición.",
      "Önceden yapılmış plan ya da olacağı görülen şey için going to; o anda verilen karar veya tahmin için will kullan.",
    ),
    right: "It's cold. I [will] close the window.",
    wrong: "It's cold. I [am going to] close the window.",
    notes: [
      note(
        "detail",
        lines(
          "Going to: I decided before (I'm going to buy a car in May). Will: I decide now (The phone is ringing. I'll answer it).",
          "going to: قرّرتُ من قبل (I'm going to buy a car in May). وwill: أقرّر الآن (The phone is ringing. I'll answer it).",
          "Going to: lo decidí antes (I'm going to buy a car in May). Will: lo decido ahora (The phone is ringing. I'll answer it).",
          "Going to: önceden karar verdim (I'm going to buy a car in May). Will: şimdi karar veriyorum (The phone is ringing. I'll answer it).",
        ),
        ["I [am going to] buy a car in May.", "The phone is ringing. I [will] answer it."],
      ),
    ],
    items: [
      "Look at those clouds! It [is going to|'s going to] rain.",
      "I have decided. I [am going to|'m going to] learn Spanish.",
      "Oh, I forgot my wallet. I [will|'ll] go back and get it.",
      "We have tickets. We [are going to|'re going to] watch the match tonight.",
      "I'm thirsty. Wait here. I [will|'ll] bring you some water.",
      "She is pregnant. She [is going to|'s going to] have a baby in June.",
    ],
  },
  "a2-24": {
    idea: lines(
      "Use the present simple for fixed timetables, even in the future: The train leaves at six. The film starts at eight.",
      "نستعمل المضارع البسيط لجداول ثابتة حتى لو كانت في المستقبل: The train leaves at six. The film starts at eight.",
      "Usa el presente simple para horarios fijos, aunque sean futuros: The train leaves at six. The film starts at eight.",
      "Sabit tarifeler için gelecek olsa bile geniş zaman kullan: The train leaves at six. The film starts at eight.",
    ),
    right: "The train [leaves] at six tomorrow.",
    wrong: "The train [leave] at six tomorrow.",
    notes: [
      note(
        "detail",
        lines(
          "This is only for fixed times: trains, classes, films, shops. For personal plans use going to or the present continuous.",
          "هذا للمواعيد الثابتة فقط: القطارات والدروس والأفلام والمحلات. وللخطط الشخصية نستعمل going to أو المضارع المستمر.",
          "Solo para horarios fijos: trenes, clases, películas, tiendas. Para planes personales usa going to o el presente continuo.",
          "Yalnızca sabit saatler için: tren, ders, film, mağaza. Kişisel planlar için going to veya şimdiki zaman kullan.",
        ),
        ["The shop [opens] at nine.", "My class [starts] at ten."],
      ),
    ],
    items: [
      "The train [leaves] at six tomorrow morning.{leave}",
      "The film [starts] at eight tonight.{start}",
      "Our class [begins] at nine on Sunday.{begin}",
      "The bank [closes] at four every day.{close}",
      "What time [does] the bus leave tomorrow?",
      "The plane [arrives] at noon.{arrive}",
    ],
  },
  "a2-25": {
    idea: lines(
      "After when, before, after, until and as soon as, use the present simple for the future: I will call you when I arrive.",
      "بعد when وbefore وafter وuntil وas soon as نستعمل المضارع البسيط للمستقبل: I will call you when I arrive.",
      "Después de when, before, after, until y as soon as usa el presente simple para el futuro: I will call you when I arrive.",
      "when, before, after, until ve as soon as'ten sonra gelecek için geniş zaman kullan: I will call you when I arrive.",
    ),
    right: "I will call you when I [arrive].",
    wrong: "I will call you when I [will arrive].",
    notes: [
      note(
        "detail",
        lines(
          "The will stays in the main part, never in the time part: I will tell her before she leaves.",
          "تبقى will في الجملة الرئيسية ولا تدخل في جملة الوقت: I will tell her before she leaves.",
          "El will se queda en la parte principal, nunca en la de tiempo: I will tell her before she leaves.",
          "Will ana cümlede kalır, zaman cümlesine girmez: I will tell her before she leaves.",
        ),
        ["I'll wait until she [comes].", "As soon as he [arrives], I'll call you."],
      ),
    ],
    items: [
      "I will call you when I [arrive].{arrive}",
      "She will cook dinner after she [gets] home.{get}",
      "We will wait here until the rain [stops].{stop}",
      "I will tell him before he [leaves].{leave}",
      "Call me as soon as you [finish].{finish}",
      "When I [see] her, I will give her the book.{see}",
    ],
  },
  "a2-26": {
    idea: lines(
      "Use should + the base verb to give advice: You should rest. Use shouldn't for the opposite: You shouldn't eat so much.",
      "نستعمل should + الفعل الأساسي لإعطاء نصيحة: You should rest. وshouldn't لعكسها: You shouldn't eat so much.",
      "Usa should + verbo base para dar un consejo: You should rest. Usa shouldn't para lo contrario: You shouldn't eat so much.",
      "Tavsiye için should + yalın fiil kullan: You should rest. Tersi için shouldn't: You shouldn't eat so much.",
    ),
    right: "You [should] rest.",
    wrong: "You should [to] rest.",
    notes: [
      note(
        "mistake",
        lines(
          "No to and no -s after should: she should go (not she should to go, not she shoulds go).",
          "لا to ولا -s بعد should: she should go (وليس she should to go ولا she shoulds go).",
          "Ni to ni -s después de should: she should go (no she should to go, no she shoulds go).",
          "should'dan sonra to da -s de yok: she should go (she should to go ya da she shoulds go değil).",
        ),
        ["She [should] go home.", "You [shouldn't] drive so fast."],
      ),
    ],
    items: [
      "You look tired. You [should] go to bed early.",
      "You [shouldn't] eat so much sugar.",
      "She has a bad cough. She [should] see a doctor.",
      "[Should] I call him now?",
      "We [shouldn't] be late for the exam.",
      "You [should] drink more water.",
    ],
  },
  "a2-27": {
    idea: lines(
      "Have to means it is necessary: I have to work. Don't have to means it is not necessary: I don't have to work on Friday.",
      "have to تعني أنه ضروري: I have to work. وdon't have to تعني أنه غير ضروري: I don't have to work on Friday.",
      "Have to significa que es necesario: I have to work. Don't have to significa que no es necesario: I don't have to work on Friday.",
      "Have to gerekli demektir: I have to work. Don't have to gerekli değil demektir: I don't have to work on Friday.",
    ),
    right: "She [has to] work today.",
    wrong: "She [have to] work today.",
    notes: [
      note(
        "exception",
        lines(
          "Don't have to is not the same as mustn't. Mustn't means it is forbidden.",
          "don't have to ليست مثل mustn't. فـ mustn't تعني أنه ممنوع.",
          "Don't have to no es lo mismo que mustn't. Mustn't significa que está prohibido.",
          "Don't have to ile mustn't aynı değildir. Mustn't yasak demektir.",
        ),
        ["You [don't have to] come.", "You [mustn't] come."],
      ),
      note(
        "detail",
        lines(
          "With he, she, it use has to. In the past use had to. Questions use do, does or did.",
          "مع he وshe وit نقول has to. وفي الماضي had to. والأسئلة بـ do أو does أو did.",
          "Con he, she, it usa has to. En pasado usa had to. Las preguntas usan do, does o did.",
          "he, she, it ile has to; geçmişte had to. Sorularda do, does veya did kullan.",
        ),
        ["He [has to] go.", "I [had to] wait."],
      ),
    ],
    items: [
      "I [have to] get up at six on school days.",
      "She [has to] wear a uniform at work.",
      "It's Friday. We [don't have to] go to school.",
      "[Do] you have to work on Saturday?",
      "Yesterday I [had to] stay at home.",
      "He [doesn't have to|does not have to] pay. It is free.",
    ],
  },
  "a2-28": {
    idea: lines(
      "May and might show a possibility, not sure: It may rain. She might come. The base verb follows them.",
      "may وmight تدلان على احتمال غير مؤكد: It may rain. She might come. ويأتي بعدهما الفعل الأساسي.",
      "May y might indican una posibilidad, sin certeza: It may rain. She might come. Después va el verbo base.",
      "May ve might kesin olmayan bir olasılığı gösterir: It may rain. She might come. Ardından yalın fiil gelir.",
    ),
    right: "It [might] rain tomorrow.",
    wrong: "It might [to] rain tomorrow.",
    notes: [
      note(
        "detail",
        lines(
          "May also asks permission politely: May I come in? Might is a little less sure than may.",
          "تُستعمل may أيضاً لطلب الإذن بأدب: May I come in؟ وmight أقلّ تأكيداً قليلاً من may.",
          "May también pide permiso con cortesía: May I come in? Might es un poco menos seguro que may.",
          "May, izni kibarca istemek için de kullanılır: May I come in? Might, may'den biraz daha belirsizdir.",
        ),
        ["[May] I come in?", "She [might] be late."],
      ),
    ],
    items: [
      "Take an umbrella. It [may|might] rain later.",
      "I'm not sure. He [might|may] be at home.",
      "[May] I use your phone, please?",
      "We [might|may] go to the beach on Friday.",
      "She [might not|may not] come. She is very busy.",
      "[May] I sit here?",
    ],
  },
  "a2-29": {
    idea: lines(
      "Could is the past of can: I could swim when I was five. Could also asks politely: Could you help me?",
      "could هي ماضي can: I could swim when I was five. وتُستعمل أيضاً للطلب بأدب: Could you help me؟",
      "Could es el pasado de can: I could swim when I was five. También pide con cortesía: Could you help me?",
      "Could, can'in geçmişidir: I could swim when I was five. Kibar rica için de kullanılır: Could you help me?",
    ),
    right: "I [could] swim when I was five.",
    wrong: "I [can] swim when I was five.",
    notes: [
      note(
        "detail",
        lines(
          "Couldn't is the negative: I couldn't open the door. In a question: Could you swim at five?",
          "couldn't هي النفي: I couldn't open the door. وفي السؤال: Could you swim at five؟",
          "Couldn't es la negación: I couldn't open the door. En pregunta: Could you swim at five?",
          "Couldn't olumsuzdur: I couldn't open the door. Soruda: Could you swim at five?",
        ),
        ["I [couldn't] open the door.", "[Could] you swim at five?"],
      ),
    ],
    items: [
      "When I was young, I [could] run very fast.",
      "I [couldn't] hear you. The music was loud.",
      "She [could] speak English when she was ten.",
      "[Could] you swim when you were a child?",
      "We [couldn't] find the key yesterday.",
      "He [couldn't] come because he was ill.",
    ],
  },
  "a2-30": {
    idea: lines(
      "Be able to means can, and it works in every tense: I will be able to drive next year. I wasn't able to come.",
      "be able to بمعنى can، وتصلح لكل الأزمنة: I will be able to drive next year. I wasn't able to come.",
      "Be able to significa can y sirve en todos los tiempos: I will be able to drive next year. I wasn't able to come.",
      "Be able to, can anlamındadır ve her zamanda kullanılır: I will be able to drive next year. I wasn't able to come.",
    ),
    right: "I will be [able to] drive next year.",
    wrong: "I will [can] drive next year.",
    notes: [
      note(
        "detail",
        lines(
          "Use was able to for one success in the past: I was able to finish the test.",
          "نستعمل was able to لنجاح واحد في الماضي: I was able to finish the test.",
          "Usa was able to para un éxito concreto en el pasado: I was able to finish the test.",
          "Geçmişte tek bir başarı için was able to kullan: I was able to finish the test.",
        ),
        ["She was [able to] fix it.", "They won't be [able to] come."],
      ),
    ],
    items: [
      "I will be [able to] speak English better next year.",
      "She wasn't [able to] come to the party.",
      "Are you [able to] help me tomorrow?",
      "After the operation, he was [able to] walk again.",
      "We will be [able to] see the sea from the hotel.",
      "I haven't been [able to] sleep well this week.",
    ],
  },
  "a2-31": {
    idea: lines(
      "Need to means it is necessary: I need to go. Don't need to or needn't means it is not necessary: You don't need to wait.",
      "need to تعني أنه ضروري: I need to go. وdon't need to أو needn't تعني أنه غير ضروري: You don't need to wait.",
      "Need to significa que es necesario: I need to go. Don't need to o needn't significa que no hace falta: You don't need to wait.",
      "Need to gerekli demektir: I need to go. Don't need to veya needn't gerekli değil demektir: You don't need to wait.",
    ),
    right: "I [need to] go now.",
    wrong: "I [need] go now.",
    notes: [
      note(
        "detail",
        lines(
          "Needn't takes the base verb with no to: You needn't wait. Don't need to keeps to: You don't need to wait.",
          "needn't يأخذ الفعل الأساسي بلا to: You needn't wait. أما don't need to فتبقى معها to: You don't need to wait.",
          "Needn't lleva el verbo base sin to: You needn't wait. Don't need to conserva to: You don't need to wait.",
          "Needn't, to olmadan yalın fiil alır: You needn't wait. Don't need to, to'yu korur: You don't need to wait.",
        ),
        ["You [needn't] wait.", "You [don't need to] wait."],
      ),
    ],
    items: [
      "I [need to] buy some bread.",
      "She [needs to] study for the exam.",
      "You [don't need to|needn't] bring anything. We have food.",
      "Do we [need to] leave now?",
      "He [doesn't need to|does not need to] wear a tie.",
      "We [need to] talk about the trip.",
    ],
  },
  "a2-32": {
    idea: lines(
      "Use the + -est (short words) or the most + word (long words) for the top one: the tallest, the most beautiful.",
      "نستعمل the + ‏-est (للكلمات القصيرة) أو the most + الكلمة (للطويلة) لما هو في القمة: the tallest وthe most beautiful.",
      "Usa the + -est (palabras cortas) o the most + palabra (largas) para el número uno: the tallest, the most beautiful.",
      "En üstteki için the + -est (kısa sözcükler) veya the most + sözcük (uzun sözcükler) kullan: the tallest, the most beautiful.",
    ),
    right: "He is the tall[est] boy in the class.",
    wrong: "He is the [most tall] boy in the class.",
    notes: [
      note(
        "exception",
        lines(
          "Irregular: good → the best, bad → the worst, far → the furthest.",
          "غير المنتظمة: good → the best وbad → the worst وfar → the furthest.",
          "Irregulares: good → the best, bad → the worst, far → the furthest.",
          "Düzensizler: good → the best, bad → the worst, far → the furthest.",
        ),
        ["She is the [best] teacher.", "It was the [worst] day."],
      ),
      note(
        "detail",
        lines(
          "Spelling: big → the biggest, happy → the happiest, nice → the nicest.",
          "الإملاء: big → the biggest وhappy → the happiest وnice → the nicest.",
          "Ortografía: big → the biggest, happy → the happiest, nice → the nicest.",
          "Yazım: big → the biggest, happy → the happiest, nice → the nicest.",
        ),
        ["He is the bigg[est].", "She is the happi[est]."],
      ),
    ],
    items: [
      "Mount Everest is the [highest] mountain in the world.{high}",
      "This is the [most expensive] phone in the shop.{expensive}",
      "She is the [best] student in our class.{good}",
      "It was the [worst] film I have ever seen.{bad}",
      "Today is the [hottest] day of the year.{hot}",
      "He is the [funniest] person I know.{funny}",
    ],
  },
  "a2-33": {
    idea: lines(
      "Use as + adjective + as to say two things are equal: She is as tall as me. Use not as … as for less.",
      "نستعمل as + صفة + as للدلالة على التساوي: She is as tall as me. وnot as … as لما هو أقل.",
      "Usa as + adjetivo + as para decir que dos cosas son iguales: She is as tall as me. Usa not as … as para menos.",
      "İki şeyin eşit olduğunu söylemek için as + sıfat + as kullan: She is as tall as me. Daha az için not as … as.",
    ),
    right: "She is [as] tall as me.",
    wrong: "She is as tall [than] me.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use than with as: as tall as (not as tall than).",
          "لا نستعمل than مع as: as tall as (وليس as tall than).",
          "No uses than con as: as tall as (no as tall than).",
          "as ile than kullanma: as tall as (as tall than değil).",
        ),
        ["He is as old [as] me."],
      ),
      note(
        "detail",
        lines(
          "Say the same as and different from: My bag is the same as yours. My bag is different from yours.",
          "نقول the same as وdifferent from: My bag is the same as yours. My bag is different from yours.",
          "Se dice the same as y different from: My bag is the same as yours. My bag is different from yours.",
          "the same as ve different from denir: My bag is the same as yours. My bag is different from yours.",
        ),
        ["It is [the same as] mine.", "It is [different from] mine."],
      ),
    ],
    items: [
      "My phone is as expensive [as] yours.",
      "He is not as tall [as] his brother.",
      "This exam is [as] difficult as the last one.",
      "My bag is the same [as] yours.",
      "Her house is different [from|to] mine.",
      "I am as happy [as] a child today.",
    ],
  },
  "a2-34": {
    idea: lines(
      "Too means more than you want: too hot. Enough means as much as you need: hot enough. Enough comes after an adjective.",
      "too تعني أكثر مما نريد: too hot. وenough تعني بالقدر الكافي: hot enough. وتأتي enough بعد الصفة.",
      "Too significa más de lo deseado: too hot. Enough significa lo necesario: hot enough. Enough va después del adjetivo.",
      "Too, istenenden fazla demektir: too hot. Enough, yeterli demektir: hot enough. Enough sıfattan sonra gelir.",
    ),
    right: "The water is warm [enough].",
    wrong: "The water is [enough] warm.",
    notes: [
      note(
        "detail",
        lines(
          "Too + adjective, adjective + enough, enough + noun: too cold, cold enough, enough money.",
          "too + صفة، وصفة + enough، وenough + اسم: too cold وcold enough وenough money.",
          "Too + adjetivo, adjetivo + enough, enough + sustantivo: too cold, cold enough, enough money.",
          "Too + sıfat, sıfat + enough, enough + isim: too cold, cold enough, enough money.",
        ),
        ["It is [too] cold to swim.", "We have [enough] money."],
      ),
      note(
        "detail",
        lines(
          "With nouns: too much for things you cannot count, too many for things you can.",
          "مع الأسماء: too much لما لا نعدّه، وtoo many لما نعدّه.",
          "Con sustantivos: too much para lo incontable, too many para lo contable.",
          "İsimlerle: sayılamayanlar için too much, sayılabilenler için too many.",
        ),
        ["There is [too much] noise.", "There are [too many] people."],
      ),
    ],
    items: [
      "I can't carry this bag. It is [too] heavy.",
      "The soup is not hot [enough].",
      "She is not old [enough] to drive.",
      "It is [too] late to call him now.",
      "We have [enough] chairs for everyone.",
      "This room is [too] small for ten people.",
    ],
  },
  "a2-35": {
    idea: lines(
      "Use so before an adjective: so big. Use such before a noun: such a big house.",
      "نستعمل so قبل الصفة: so big. ونستعمل such قبل الاسم: such a big house.",
      "Usa so antes de un adjetivo: so big. Usa such antes de un sustantivo: such a big house.",
      "Sıfattan önce so kullan: so big. İsimden önce such kullan: such a big house.",
    ),
    right: "It was [such] a big house.",
    wrong: "It was [so] a big house.",
    notes: [
      note(
        "detail",
        lines(
          "Such a/an + adjective + noun; so + adjective alone. Add that for a result: so tired that I slept.",
          "such a/an + صفة + اسم، وso + صفة وحدها. ونضيف that للنتيجة: so tired that I slept.",
          "Such a/an + adjetivo + sustantivo; so + adjetivo solo. Añade that para el resultado: so tired that I slept.",
          "Such a/an + sıfat + isim; so + yalnız sıfat. Sonuç için that ekle: so tired that I slept.",
        ),
        ["The film was [so] long.", "It was [such] a long film."],
      ),
    ],
    items: [
      "The film was [so] boring that I fell asleep.",
      "It was [such] a boring film.",
      "She is [so] kind. Everyone likes her.",
      "He is [such] a kind man.",
      "I was [so] tired that I went to bed early.",
      "They live in [such] a beautiful house.",
    ],
  },
  "a2-36": {
    idea: lines(
      "-ing describes the thing that causes the feeling (a boring film). -ed describes the person who has it (I am bored).",
      "‏-ing تصف الشيء الذي يسبب الشعور (a boring film)، و‏-ed تصف الشخص الذي يشعر به (I am bored).",
      "-ing describe lo que causa el sentimiento (a boring film). -ed describe a la persona que lo siente (I am bored).",
      "-ing duyguya yol açan şeyi anlatır (a boring film). -ed duyguyu hisseden kişiyi anlatır (I am bored).",
    ),
    right: "The film is bor[ing].",
    wrong: "The film is bor[ed].",
    notes: [
      note(
        "detail",
        lines(
          "Same pairs: interested / interesting, excited / exciting, tired / tiring, surprised / surprising.",
          "أزواج مثلها: interested / interesting وexcited / exciting وtired / tiring وsurprised / surprising.",
          "Más pares iguales: interested / interesting, excited / exciting, tired / tiring, surprised / surprising.",
          "Benzer çiftler: interested / interesting, excited / exciting, tired / tiring, surprised / surprising.",
        ),
        ["I am interest[ed].", "It is interest[ing]."],
      ),
    ],
    items: [
      "This film is very [boring]. I want to leave.{bore}",
      "I am [bored]. There is nothing to do.{bore}",
      "The match was [exciting]. Everybody was shouting.{excite}",
      "She is [excited] about the trip.{excite}",
      "The news is [surprising].{surprise}",
      "We were [tired] after the long walk.{tire}",
    ],
  },
  "a2-37": {
    idea: lines(
      "Adverbs compare too. Short ones add -er: faster. Longer ones use more: more carefully. Irregular: well → better.",
      "الظروف تُقارَن أيضاً. القصيرة تأخذ ‏-er: faster. والطويلة تستعمل more: more carefully. وغير المنتظمة: well → better.",
      "Los adverbios también se comparan. Los cortos añaden -er: faster. Los largos usan more: more carefully. Irregular: well → better.",
      "Zarflar da karşılaştırılır. Kısalar -er alır: faster. Uzunlar more kullanır: more carefully. Düzensiz: well → better.",
    ),
    right: "She drives [more carefully] than me.",
    wrong: "She drives [carefuller] than me.",
    notes: [
      note(
        "exception",
        lines(
          "Irregular: well → better → the best; badly → worse → the worst.",
          "غير المنتظمة: well → better → the best وbadly → worse → the worst.",
          "Irregulares: well → better → the best; badly → worse → the worst.",
          "Düzensizler: well → better → the best; badly → worse → the worst.",
        ),
        ["She sings [better] than me.", "He plays [worse] than me."],
      ),
    ],
    items: [
      "My brother runs [faster] than me.{fast}",
      "She speaks English [more slowly] than he does.{slowly}",
      "He drives [more carefully] than his father.{carefully}",
      "You sing [better] than I do.{well}",
      "I got up [earlier] than usual today.{early}",
      "Please speak [more quietly]. The baby is sleeping.{quietly}",
    ],
  },
};
