/**
 * What a rule card TEACHES, in the order a learner takes it in: page one is the idea in a line or two of
 * very simple English and in the learner's own language (Arabic, Spanish or Turkish), with one right and
 * one wrong sentence; page two holds what to watch for (the exceptions, and the details the first page
 * left out). The learner's language comes first on the card because the English of a rule is hard to read
 * for someone who is still learning the language the rule is about.
 *
 * The right and wrong sentences are written with the part the rule is about in [brackets]: the card shows it in colour, so the learner sees the grammar
 * letters ("read[ing]") and not just a whole sentence. In the wrong sentence the brackets hold the part
 * that is wrong. The sentences of a learner's own story are marked by marks.ts instead.
 *
 * Text and prepared sentences only: which sentences of a story show a rule is decided by the matchers
 * (matchers.ts, matchers-more.ts). The rules added after the first 39 live in teach-a1.ts, teach-a2.ts and
 * teach-b2.ts, one file per level. Keyed by rule id, and the ids never change (they are stored per learner).
 */

import { TEACH_A1 } from "./teach-a1";
import { TEACH_A2 } from "./teach-a2";
import { TEACH_B2 } from "./teach-b2";
import { ITEMS_FIRST_39 } from "./teach-items";
import { inLocale, lines, type Lines, type RuleNote, type RuleTeach } from "./teach-types";

export { inLocale };
export type { Lines, RuleNote, RuleTeach };

/** The first 39 rules (a1-01 ... a1-24, a2-01 ... a2-08, b2-01 ... b2-07), written before the syllabus grew. */
const FIRST_39: Readonly<Record<string, RuleTeach>> = {
  // ---------------------------------------------------------------- A1
  "a1-01": {
    idea: lines(
      "With I, use am. With he, she or it, use is. With you, we or they, use are.",
      "مع I نقول am. ومع he وshe وit نقول is. ومع you وwe وthey نقول are.",
      "Con I usa am. Con he, she o it usa is. Con you, we o they usa are.",
      "I ile am kullan. He, she veya it ile is kullan. You, we veya they ile are kullan.",
    ),
    right: "She [is] at home.",
    wrong: "She [are] at home.",
    notes: [
      {
        kind: "detail",
        say: lines(
          "In a question, the verb goes first.",
          "في السؤال يأتي الفعل أولاً.",
          "En una pregunta, el verbo va primero.",
          "Soruda fiil başa gelir.",
        ),
        examples: ["[Are] you ready?", "[Is] she here?"],
      },
    ],
  },
  "a1-02": {
    idea: lines(
      "Use a or an for one thing we do not know yet. Use the for a thing we already know.",
      "نستعمل a أو an لشيء واحد لم نتكلم عنه من قبل. ونستعمل the لشيء معروف لنا.",
      "Usa a o an para una cosa que aún no conocemos. Usa the para una cosa que ya conocemos.",
      "Henüz bilmediğimiz tek bir şey için a veya an kullan. Zaten bildiğimiz şey için the kullan.",
    ),
    right: "It is [an] apple.",
    wrong: "It is [a] apple.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Use an before a vowel sound: an apple, an hour.",
          "نستعمل an قبل صوت حرف العلة: an apple، an hour.",
          "Usa an antes de un sonido de vocal: an apple, an hour.",
          "Ünlü sesinden önce an kullan: an apple, an hour.",
        ),
        examples: ["I eat [an] apple.", "I wait for [an] hour."],
      },
      {
        kind: "exception",
        say: lines(
          "It is about the sound, not the letter: a university starts with a consonant sound.",
          "المهم هو الصوت وليس الحرف: كلمة university تبدأ بصوت ساكن لذلك نقول a.",
          "Importa el sonido, no la letra: university empieza con un sonido de consonante.",
          "Önemli olan harf değil, sestir: university ünsüz sesiyle başlar.",
        ),
        examples: ["She goes to [a] university."],
      },
    ],
  },
  "a1-03": {
    idea: lines(
      "These words go before a noun. They show who has something: my book, your bag.",
      "هذه الكلمات تأتي قبل الاسم وتبيّن لمن الشيء: my book، your bag.",
      "Estas palabras van antes de un sustantivo. Muestran de quién es algo: my book, your bag.",
      "Bu sözcükler bir ismin önüne gelir. Bir şeyin kime ait olduğunu gösterir: my book, your bag.",
    ),
    right: "This is [my] book.",
    wrong: "This is [me] book.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Its (no apostrophe) means belonging to it. It's means it is.",
          "its بدون فاصلة تعني «يخصّه». أما it's فتعني it is.",
          "Its (sin apóstrofo) significa «de ello». It's significa it is.",
          "Its (kesme işaretsiz) «ona ait» demektir. It's ise it is demektir.",
        ),
        examples: ["The dog likes [its] bed.", "[It's] a nice day."],
      },
    ],
  },
  "a1-04": {
    idea: lines(
      "With he, she and it, add -s to the verb: she works, it starts.",
      "مع he وshe وit نضيف s في آخر الفعل: she works، it starts.",
      "Con he, she e it, añade -s al verbo: she works, it starts.",
      "He, she ve it ile fiile -s ekle: she works, it starts.",
    ),
    right: "She work[s] here.",
    wrong: "She [work] here.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After o, s, sh, ch or x, add -es: go → goes, watch → watches.",
          "بعد o أو s أو sh أو ch أو x نضيف es: go → goes، watch → watches.",
          "Después de o, s, sh, ch o x, añade -es: go → goes, watch → watches.",
          "o, s, sh, ch veya x'ten sonra -es ekle: go → goes, watch → watches.",
        ),
        examples: ["He go[es] home.", "She watch[es] TV."],
      },
      {
        kind: "exception",
        say: lines(
          "After a consonant + y, change y to -ies: study → studies.",
          "بعد حرف ساكن + y نغيّر y إلى ies: study → studies.",
          "Después de consonante + y, cambia la y por -ies: study → studies.",
          "Ünsüz + y'den sonra y'yi -ies yap: study → studies.",
        ),
        examples: ["She stud[ies] English."],
      },
    ],
  },
  "a1-05": {
    idea: lines(
      "With I, you, we and they, use the verb as it is, with no -s: I work, they live.",
      "مع I وyou وwe وthey نستعمل الفعل كما هو بدون s: I work، they live.",
      "Con I, you, we y they usa el verbo tal cual, sin -s: I work, they live.",
      "I, you, we ve they ile fiili olduğu gibi, -s olmadan kullan: I work, they live.",
    ),
    right: "We [live] here.",
    wrong: "We [lives] here.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "The verb be is different: I am, we are, they are.",
          "الفعل be مختلف: I am، we are، they are.",
          "El verbo be es distinto: I am, we are, they are.",
          "be fiili farklıdır: I am, we are, they are.",
        ),
        examples: ["I [am] tired.", "They [are] here."],
      },
    ],
  },
  "a1-06": {
    idea: lines(
      "This and that are for one thing. These and those are for more than one. This and these are near. That and those are far.",
      "this وthat لشيء واحد. وthese وthose لأكثر من شيء. this وthese للقريب. وthat وthose للبعيد.",
      "This y that son para una cosa. These y those son para más de una. This y these indican cerca. That y those indican lejos.",
      "This ve that tek bir şey için. These ve those birden fazla şey için. This ve these yakın, that ve those uzak şeyler için.",
    ),
    right: "[These] shoes are new.",
    wrong: "[This] shoes are new.",
    notes: [
      {
        kind: "detail",
        say: lines(
          "They can also stand alone, with no noun after them: This is my pen. These are mine.",
          "وتأتي أيضاً وحدها بدون اسم بعدها: This is my pen. These are mine.",
          "También pueden ir solas, sin sustantivo: This is my pen. These are mine.",
          "İsim olmadan tek başlarına da kullanılabilirler: This is my pen. These are mine.",
        ),
        examples: ["[This] is my pen.", "[These] are mine."],
      },
    ],
  },
  "a1-07": {
    idea: lines(
      "Start a question with what (things), where (places) or who (people). The verb comes next: Where is she?",
      "نبدأ السؤال بـ what للأشياء أو where للأماكن أو who للأشخاص. ثم يأتي الفعل بعدها مباشرة: Where is she؟",
      "Empieza la pregunta con what (cosas), where (lugares) o who (personas). El verbo va a continuación: Where is she?",
      "Soruyu what (şeyler), where (yerler) veya who (kişiler) ile başlat. Fiil hemen ardından gelir: Where is she?",
    ),
    right: "Where [is] the bus?",
    wrong: "Where the bus [is]?",
    notes: [
      {
        kind: "exception",
        say: lines(
          "When who is the subject, the order does not change: Who is at the door?",
          "إذا كان who هو الفاعل لا يتغيّر الترتيب: Who is at the door؟",
          "Cuando who es el sujeto, el orden no cambia: Who is at the door?",
          "who özne olduğunda sıra değişmez: Who is at the door?",
        ),
        examples: ["[Who] is at the door?"],
      },
    ],
  },
  "a1-08": {
    idea: lines(
      "Use in for inside. Use on for a surface. Use under for below.",
      "نستعمل in لما هو داخل شيء. وon لما هو فوق سطح. وunder لما هو تحت.",
      "Usa in para dentro. Usa on para una superficie. Usa under para debajo.",
      "İçi için in kullan. Bir yüzeyin üstü için on kullan. Altı için under kullan.",
    ),
    right: "The cup is [on] the table.",
    wrong: "The cup is [in] the table.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "We say at home, at school and at work, with at (not in).",
          "نقول at home وat school وat work بـ at (وليس in).",
          "Decimos at home, at school y at work, con at (no in).",
          "at home, at school ve at work deriz, at ile (in ile değil).",
        ),
        examples: ["I am [at] home.", "She is [at] work."],
      },
    ],
  },
  "a1-09": {
    idea: lines(
      "Add 's to a name or a person to show who owns something: Tom's bag.",
      "نضيف 's إلى الاسم أو الشخص لنبيّن من يملك الشيء: Tom's bag.",
      "Añade 's a un nombre o a una persona para mostrar de quién es algo: Tom's bag.",
      "Bir şeyin kime ait olduğunu göstermek için isme ya da kişiye 's ekle: Tom's bag.",
    ),
    right: "This is Tom['s] bag.",
    wrong: "This is [Toms] bag.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After a plural that ends in s, add only an apostrophe: the girls' room.",
          "بعد جمع ينتهي بـ s نضع الفاصلة العليا فقط: the girls' room.",
          "Después de un plural que termina en s, añade solo el apóstrofo: the girls' room.",
          "s ile biten bir çoğuldan sonra yalnızca kesme işareti koy: the girls' room.",
        ),
        examples: ["This is the girls['] room."],
      },
    ],
  },
  "a1-10": {
    idea: lines(
      "For more than one thing, add -s to the noun: two cars, some apples.",
      "لأكثر من شيء نضيف s في آخر الاسم: two cars، some apples.",
      "Para más de una cosa, añade -s al sustantivo: two cars, some apples.",
      "Birden fazla şey için isme -s ekle: two cars, some apples.",
    ),
    right: "Two car[s] are here.",
    wrong: "Two [car] are here.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After s, x, ch or sh, add -es: box → boxes, bus → buses.",
          "بعد s أو x أو ch أو sh نضيف es: box → boxes، bus → buses.",
          "Después de s, x, ch o sh, añade -es: box → boxes, bus → buses.",
          "s, x, ch veya sh'den sonra -es ekle: box → boxes, bus → buses.",
        ),
        examples: ["Three box[es] are here."],
      },
      {
        kind: "exception",
        say: lines(
          "Some plurals change completely: child → children, man → men, person → people.",
          "بعض الجموع تتغيّر كلياً: child → children، man → men، person → people.",
          "Algunos plurales cambian por completo: child → children, man → men, person → people.",
          "Bazı çoğullar tamamen değişir: child → children, man → men, person → people.",
        ),
        examples: ["Two [children] are here.", "Three [men] are here."],
      },
    ],
  },
  "a1-11": {
    idea: lines(
      "To tell someone to do something, start with the verb: Open the door. Add please to be polite.",
      "لنطلب من أحد أن يفعل شيئاً نبدأ بالفعل مباشرة: Open the door. ونضيف please للتأدب.",
      "Para decirle a alguien que haga algo, empieza con el verbo: Open the door. Añade please para ser amable.",
      "Birine bir şey yaptırmak için fiille başla: Open the door. Kibar olmak için please ekle.",
    ),
    right: "[Open] the window, please.",
    wrong: "[Opens] the window.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "To say no, put Don't before the verb: Don't open the door.",
          "للنهي نضع Don't قبل الفعل: Don't open the door.",
          "Para decir que no, pon Don't antes del verbo: Don't open the door.",
          "Yasaklamak için fiilin önüne Don't koy: Don't open the door.",
        ),
        examples: ["[Don't] open the door."],
      },
    ],
  },
  "a1-12": {
    idea: lines(
      "After a verb, or after a word like to, with or for, use me, you, him, her, us or them.",
      "بعد الفعل، أو بعد كلمة مثل to وwith وfor، نستعمل me وyou وhim وher وus وthem.",
      "Después de un verbo, o de palabras como to, with o for, usa me, you, him, her, us o them.",
      "Bir fiilden ya da to, with, for gibi sözcüklerden sonra me, you, him, her, us veya them kullan.",
    ),
    right: "Call [me] tomorrow.",
    wrong: "Call [I] tomorrow.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "You and it do not change: I see you. I like it.",
          "you وit لا تتغيّران: I see you. I like it.",
          "You e it no cambian: I see you. I like it.",
          "You ve it değişmez: I see you. I like it.",
        ),
        examples: ["I see [you].", "I like [it]."],
      },
    ],
  },
  "a1-13": {
    idea: lines(
      "For a finished action in the past, add -ed to the verb: work → worked.",
      "للفعل الذي انتهى في الماضي نضيف ed في آخره: work → worked.",
      "Para una acción terminada en el pasado, añade -ed al verbo: work → worked.",
      "Geçmişte bitmiş bir eylem için fiile -ed ekle: work → worked.",
    ),
    right: "I work[ed] yesterday.",
    wrong: "I [work] yesterday.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "If the verb ends in e, add only -d: like → liked.",
          "إذا انتهى الفعل بحرف e نضيف d فقط: like → liked.",
          "Si el verbo termina en e, añade solo -d: like → liked.",
          "Fiil e ile bitiyorsa yalnızca -d ekle: like → liked.",
        ),
        examples: ["I like[d] it."],
      },
      {
        kind: "exception",
        say: lines(
          "After a consonant + y, change y to -ied: study → studied.",
          "بعد حرف ساكن + y نغيّر y إلى ied: study → studied.",
          "Después de consonante + y, cambia la y por -ied: study → studied.",
          "Ünsüz + y'den sonra y'yi -ied yap: study → studied.",
        ),
        examples: ["I stud[ied] English."],
      },
    ],
  },
  "a1-14": {
    idea: lines(
      "Some common verbs change in a special way in the past. Learn them one by one: go → went, see → saw.",
      "بعض الأفعال الشائعة تتغيّر بشكل خاص في الماضي. نحفظها واحداً واحداً: go → went، see → saw.",
      "Algunos verbos comunes cambian de forma especial en el pasado. Apréndelos uno por uno: go → went, see → saw.",
      "Bazı yaygın fiiller geçmişte özel bir şekilde değişir. Onları tek tek öğren: go → went, see → saw.",
    ),
    right: "I [went] home.",
    wrong: "I [goed] home.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "A few verbs do not change: put, cut, hit.",
          "بعض الأفعال لا تتغيّر: put، cut، hit.",
          "Algunos verbos no cambian: put, cut, hit.",
          "Bazı fiiller değişmez: put, cut, hit.",
        ),
        examples: ["I [put] it here yesterday."],
      },
    ],
  },
  "a1-15": {
    idea: lines(
      "Was and were are the past of am, is and are. Use was with I, he, she and it. Use were with you, we and they.",
      "was وwere هما ماضي am وis وare. نستعمل was مع I وhe وshe وit، وwere مع you وwe وthey.",
      "Was y were son el pasado de am, is y are. Usa was con I, he, she e it. Usa were con you, we y they.",
      "Was ve were, am, is ve are'in geçmişidir. I, he, she ve it ile was kullan. You, we ve they ile were kullan.",
    ),
    right: "They [were] late.",
    wrong: "They [was] late.",
    notes: [
      {
        kind: "detail",
        say: lines(
          "In a question, the verb goes first. To say no, add n't: Was she tired? They weren't here.",
          "في السؤال يأتي الفعل أولاً. وللنفي نضيف n't: Was she tired؟ They weren't here.",
          "En una pregunta, el verbo va primero. Para negar, añade n't: Was she tired? They weren't here.",
          "Soruda fiil başa gelir. Olumsuz için n't ekle: Was she tired? They weren't here.",
        ),
        examples: ["[Was] she tired?", "They [weren't] here."],
      },
    ],
  },
  "a1-16": {
    idea: lines(
      "To ask about the past, start the question with did: Did you call me?",
      "للسؤال عن الماضي نبدأ السؤال بـ did: Did you call me؟",
      "Para preguntar por el pasado, empieza la pregunta con did: Did you call me?",
      "Geçmişi sormak için soruyu did ile başlat: Did you call me?",
    ),
    right: "[Did] you [call] me?",
    wrong: "Did you [called] me?",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After did, use the plain verb. Never add -ed: Did you call? (not Did you called?)",
          "بعد did نستعمل الفعل كما هو. لا نضيف ed أبداً: Did you call؟ (وليس Did you called؟)",
          "Después de did, usa el verbo sin cambios. Nunca añadas -ed: Did you call? (no Did you called?)",
          "did'den sonra fiili yalın kullan. Asla -ed ekleme: Did you call? (Did you called? değil)",
        ),
        examples: ["Did you [call] me?"],
      },
    ],
  },
  "a1-17": {
    idea: lines(
      "To say no about the past, use didn't before the verb: I didn't call you.",
      "للنفي في الماضي نضع didn't قبل الفعل: I didn't call you.",
      "Para negar en el pasado, pon didn't antes del verbo: I didn't call you.",
      "Geçmişte olumsuz yapmak için fiilden önce didn't koy: I didn't call you.",
    ),
    right: "I [didn't call] you.",
    wrong: "I didn't [called] you.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After didn't, use the plain verb. Never add -ed. Didn't is the same for every person: he didn't, we didn't.",
          "بعد didn't نستعمل الفعل كما هو بدون ed. وdidn't واحدة لكل الأشخاص: he didn't، we didn't.",
          "Después de didn't, usa el verbo sin cambios. Nunca añadas -ed. Didn't es igual para todas las personas: he didn't, we didn't.",
          "didn't'ten sonra fiili yalın kullan. Asla -ed ekleme. didn't her özne için aynıdır: he didn't, we didn't.",
        ),
        examples: ["He [didn't] come.", "We [didn't] stay."],
      },
    ],
  },
  "a1-18": {
    idea: lines(
      "To say no in the present, use don't with I, you, we and they. Use doesn't with he, she and it.",
      "للنفي في المضارع: don't مع I وyou وwe وthey، وdoesn't مع he وshe وit.",
      "Para negar en presente, usa don't con I, you, we y they. Usa doesn't con he, she e it.",
      "Şimdiki zamanda olumsuz için I, you, we ve they ile don't kullan. He, she ve it ile doesn't kullan.",
    ),
    right: "She [doesn't] like tea.",
    wrong: "She [don't] like tea.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After doesn't, the verb has no -s: He doesn't work. (not He doesn't works.)",
          "بعد doesn't لا نضيف s للفعل: He doesn't work. (وليس He doesn't works.)",
          "Después de doesn't, el verbo no lleva -s: He doesn't work. (no He doesn't works.)",
          "doesn't'ten sonra fiil -s almaz: He doesn't work. (He doesn't works. değil)",
        ),
        examples: ["He doesn't [work] here."],
      },
    ],
  },
  "a1-19": {
    idea: lines(
      "To ask a question in the present, start with do (I, you, we, they) or does (he, she, it).",
      "للسؤال في المضارع نبدأ بـ do مع I وyou وwe وthey، وبـ does مع he وshe وit.",
      "Para preguntar en presente, empieza con do (I, you, we, they) o does (he, she, it).",
      "Şimdiki zamanda soru için do (I, you, we, they) veya does (he, she, it) ile başla.",
    ),
    right: "[Does] she work here?",
    wrong: "Does she [works] here?",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After does, the verb has no -s: Does she work? (not Does she works?)",
          "بعد does لا نضيف s للفعل: Does she work؟ (وليس Does she works؟)",
          "Después de does, el verbo no lleva -s: Does she work? (no Does she works?)",
          "does'tan sonra fiil -s almaz: Does she work? (Does she works? değil)",
        ),
        examples: ["Does she [work] here?"],
      },
    ],
  },
  "a1-20": {
    idea: lines(
      "Use can with the plain verb for something you are able to do, or to ask for permission.",
      "نستعمل can مع الفعل كما هو للقدرة على فعل شيء، أو لطلب الإذن.",
      "Usa can con el verbo sin cambios para algo que puedes hacer, o para pedir permiso.",
      "Yapabildiğin bir şey için ya da izin istemek için can + yalın fiil kullan.",
    ),
    right: "I [can] swim.",
    wrong: "I can [swims].",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Can has no -s and no to: He can swim. (not He cans swim, not He can to swim.)",
          "can لا تأخذ s ولا to: He can swim. (وليس He cans swim ولا He can to swim.)",
          "Can no lleva -s ni to: He can swim. (no He cans swim, no He can to swim.)",
          "can -s veya to almaz: He can swim. (He cans swim ya da He can to swim değil.)",
        ),
        examples: ["He [can] swim."],
      },
    ],
  },
  "a1-21": {
    idea: lines(
      "Use there is for one thing. Use there are for more than one.",
      "نستعمل there is لشيء واحد. ونستعمل there are لأكثر من شيء.",
      "Usa there is para una cosa. Usa there are para más de una.",
      "Tek şey için there is kullan. Birden fazla şey için there are kullan.",
    ),
    right: "There [are] two cats.",
    wrong: "There [is] two cats.",
    notes: [
      {
        kind: "detail",
        say: lines(
          "In a question, the verb goes first: Is there a bank near here? Are there any cats?",
          "في السؤال يأتي الفعل أولاً: Is there a bank near here؟ Are there any cats؟",
          "En una pregunta, el verbo va primero: Is there a bank near here? Are there any cats?",
          "Soruda fiil başa gelir: Is there a bank near here? Are there any cats?",
        ),
        examples: ["[Is] there a bank near here?", "[Are] there any cats?"],
      },
    ],
  },
  "a1-22": {
    idea: lines(
      "Use in for parts of the day (in the morning), on for days (on Monday), and at for clock times (at five).",
      "نستعمل in لأجزاء اليوم (in the morning)، وon للأيام (on Monday)، وat للساعة (at five).",
      "Usa in para partes del día (in the morning), on para días (on Monday) y at para horas (at five).",
      "Günün bölümleri için in (in the morning), günler için on (on Monday), saatler için at (at five) kullan.",
    ),
    right: "We meet [on] Monday.",
    wrong: "We meet [in] Monday.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "We say at night, not in the night.",
          "نقول at night وليس in the night.",
          "Decimos at night, no in the night.",
          "at night deriz, in the night değil.",
        ),
        examples: ["I sleep [at] night."],
      },
    ],
  },
  "a1-23": {
    idea: lines(
      "These words say how often. They go before the main verb: I always walk.",
      "هذه الكلمات تقول كم مرة نفعل الشيء. وتأتي قبل الفعل الأساسي: I always walk.",
      "Estas palabras dicen con qué frecuencia. Van antes del verbo principal: I always walk.",
      "Bu sözcükler ne sıklıkla yapıldığını söyler. Ana fiilden önce gelir: I always walk.",
    ),
    right: "She [never] drinks coffee.",
    wrong: "She drinks [never] coffee.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After am, is and are, they go after the verb: I am always late.",
          "بعد am وis وare تأتي بعد الفعل: I am always late.",
          "Con am, is y are van después del verbo: I am always late.",
          "am, is ve are ile fiilden sonra gelir: I am always late.",
        ),
        examples: ["I am [always] late."],
      },
    ],
  },
  "a1-24": {
    idea: lines(
      "Use some in sentences with yes. Use any in questions and in sentences with no.",
      "نستعمل some في الجمل المثبتة. ونستعمل any في الأسئلة والجمل المنفية.",
      "Usa some en frases afirmativas. Usa any en preguntas y frases negativas.",
      "Olumlu cümlelerde some kullan. Sorularda ve olumsuz cümlelerde any kullan.",
    ),
    right: "I have [some] water.",
    wrong: "I have [any] water.",
    notes: [
      {
        kind: "detail",
        say: lines(
          "Some and any go with plural nouns (some apples) and with things you cannot count (some water).",
          "some وany تأتيان مع الجمع (some apples) ومع ما لا يُعدّ (some water).",
          "Some y any van con sustantivos plurales (some apples) y con cosas que no se cuentan (some water).",
          "Some ve any, çoğul isimlerle (some apples) ve sayılamayan şeylerle (some water) kullanılır.",
        ),
        examples: ["I have [some] apples.", "Do you have [any] water?"],
      },
    ],
  },

  // ------------------------------------------------------------- A2–B1
  "a2-01": {
    idea: lines(
      "For something happening now, use am, is or are + verb-ing.",
      "للشيء الذي يحدث الآن نستعمل am أو is أو are مع الفعل وفي آخره ing.",
      "Para algo que pasa ahora, usa am, is o are + verbo con -ing.",
      "Şu anda olan bir şey için am, is veya are + fiil-ing kullan.",
    ),
    right: "She is work[ing] now.",
    wrong: "She is [work] now.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Some verbs do not use -ing for now: know, like, want. Say I know it, not I am knowing it.",
          "بعض الأفعال لا تأخذ ing للحاضر: know وlike وwant. نقول I know it وليس I am knowing it.",
          "Algunos verbos no usan -ing para el presente: know, like, want. Di I know it, no I am knowing it.",
          "Bazı fiiller şimdiki zamanda -ing almaz: know, like, want. I know it de, I am knowing it deme.",
        ),
        examples: ["I [know] it."],
      },
    ],
  },
  "a2-02": {
    idea: lines(
      "For an action that was in progress in the past, use was or were + verb-ing.",
      "للفعل الذي كان مستمراً في الماضي نستعمل was أو were مع الفعل وفي آخره ing.",
      "Para una acción que estaba en curso en el pasado, usa was o were + verbo con -ing.",
      "Geçmişte devam eden bir eylem için was veya were + fiil-ing kullan.",
    ),
    right: "I was read[ing] when you called.",
    wrong: "I was [read] when you called.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "For a short action that finished, use the simple past: I read the message at nine.",
          "للفعل القصير الذي انتهى نستعمل الماضي البسيط: I read the message at nine.",
          "Para una acción corta que terminó, usa el pasado simple: I read the message at nine.",
          "Biten kısa bir eylem için basit geçmiş zaman kullan: I read the message at nine.",
        ),
        examples: ["I [read] the message at nine."],
      },
    ],
  },
  "a2-03": {
    idea: lines(
      "Use have or has + the third form of the verb (been, done, seen). It links the past to now: an experience, or something that still matters.",
      "نستعمل have أو has مع التصريف الثالث للفعل (been, done, seen). يربط الماضي بالحاضر: تجربة في الحياة، أو شيء مازال يهمّنا الآن.",
      "Usa have o has + la tercera forma del verbo (been, done, seen). Une el pasado con el presente: una experiencia, o algo que todavía importa.",
      "have veya has + fiilin üçüncü hâli (been, done, seen) kullan. Geçmişi bugüne bağlar: bir deneyim ya da hâlâ önemli olan bir şey.",
    ),
    right: "I have never [been] to Japan.",
    wrong: "I have never [go] to Japan.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "When you say a finished time (yesterday, in 2019), use the simple past: I went to Japan in 2019.",
          "إذا ذكرنا وقتاً منتهياً (yesterday، in 2019) نستعمل الماضي البسيط: I went to Japan in 2019.",
          "Si dices un tiempo terminado (yesterday, in 2019), usa el pasado simple: I went to Japan in 2019.",
          "Bitmiş bir zaman söylersen (yesterday, in 2019) basit geçmiş zaman kullan: I went to Japan in 2019.",
        ),
        examples: ["I [went] to Japan in 2019."],
      },
    ],
  },
  "a2-04": {
    idea: lines(
      "For a plan or a clear prediction, use am, is or are + going to + verb.",
      "للخطة أو التوقع الواضح نستعمل am أو is أو are + going to + الفعل.",
      "Para un plan o una predicción clara, usa am, is o are + going to + verbo.",
      "Bir plan ya da açık bir tahmin için am, is veya are + going to + fiil kullan.",
    ),
    right: "We are going [to] visit Rome in May.",
    wrong: "We are going [visit] Rome in May.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "For a decision you make while you are speaking, use will: I will call you back.",
          "للقرار الذي نتخذه لحظة الكلام نستعمل will: I will call you back.",
          "Para una decisión que tomas mientras hablas, usa will: I will call you back.",
          "Konuşurken verdiğin bir karar için will kullan: I will call you back.",
        ),
        examples: ["I [will] call you back."],
      },
    ],
  },
  "a2-05": {
    idea: lines(
      "To compare two things: short words take -er (taller), long words take more (more expensive). Then say than.",
      "لمقارنة شيئين: الكلمة القصيرة نضيف لها er (taller)، والكلمة الطويلة نضع قبلها more (more expensive). ثم نقول than.",
      "Para comparar dos cosas: las palabras cortas llevan -er (taller), las largas llevan more (more expensive). Después di than.",
      "İki şeyi karşılaştırmak için: kısa sözcükler -er alır (taller), uzun sözcüklerin önüne more gelir (more expensive). Sonra than de.",
    ),
    right: "She is tall[er] than her brother.",
    wrong: "She is [more tall] than her brother.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Some words change completely: good → better, bad → worse.",
          "بعض الكلمات تتغيّر كلياً: good → better، bad → worse.",
          "Algunas palabras cambian por completo: good → better, bad → worse.",
          "Bazı sözcükler tamamen değişir: good → better, bad → worse.",
        ),
        examples: ["Today is [better] than yesterday."],
      },
    ],
  },
  "a2-06": {
    idea: lines(
      "Use must for something very important. Use mustn't for something that is not allowed.",
      "نستعمل must لشيء مهم جداً. ونستعمل mustn't لشيء غير مسموح.",
      "Usa must para algo muy importante. Usa mustn't para algo que no está permitido.",
      "Çok önemli bir şey için must kullan. İzin verilmeyen bir şey için mustn't kullan.",
    ),
    right: "You [must] wear a seat belt.",
    wrong: "You must [to] wear a seat belt.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After must, use the plain verb with no to: He must go. (not He must to go.)",
          "بعد must نستعمل الفعل كما هو بدون to: He must go. (وليس He must to go.)",
          "Después de must, usa el verbo sin cambios y sin to: He must go. (no He must to go.)",
          "must'tan sonra fiili yalın, to olmadan kullan: He must go. (He must to go. değil)",
        ),
        examples: ["He [must] go."],
      },
    ],
  },
  "a2-07": {
    idea: lines(
      "For something that can really happen, use if + the present. Then use will + verb.",
      "لشيء يمكن أن يحدث فعلاً: if مع المضارع، ثم will مع الفعل.",
      "Para algo que de verdad puede pasar, usa if + el presente. Después will + verbo.",
      "Gerçekten olabilecek bir şey için if + şimdiki zaman kullan. Sonra will + fiil.",
    ),
    right: "If it [rains], we [will] stay home.",
    wrong: "If it [will rain], we stay home.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After if, use the present, even for the future: If it rains, not If it will rain.",
          "بعد if نستعمل المضارع حتى لو كان الحدث في المستقبل: If it rains وليس If it will rain.",
          "Después de if, usa el presente, incluso para el futuro: If it rains, no If it will rain.",
          "if'ten sonra gelecek için bile şimdiki zaman kullan: If it rains, If it will rain değil.",
        ),
        examples: ["If it [rains], we will stay home."],
      },
    ],
  },
  "a2-08": {
    idea: lines(
      "Use many with things you can count (cars, people). Use much with things you cannot count (water, money).",
      "نستعمل many مع ما يمكن عدّه (cars, people). ونستعمل much مع ما لا يمكن عدّه (water, money).",
      "Usa many con cosas que se pueden contar (cars, people). Usa much con cosas que no se pueden contar (water, money).",
      "Sayılabilen şeylerle many kullan (cars, people). Sayılamayan şeylerle much kullan (water, money).",
    ),
    right: "There are [many] cars here.",
    wrong: "There are [much] cars here.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "A lot of works with both: a lot of cars, a lot of water.",
          "a lot of تصلح للنوعين: a lot of cars وa lot of water.",
          "A lot of sirve para los dos: a lot of cars, a lot of water.",
          "A lot of ikisiyle de kullanılır: a lot of cars, a lot of water.",
        ),
        examples: ["There is [a lot of] water here."],
      },
    ],
  },

  // ---------------------------------------------------------------- B2
  "b2-01": {
    idea: lines(
      "For something unreal or not likely, use if + the past. Then use would + verb.",
      "لموقف غير حقيقي أو بعيد الاحتمال: if مع الماضي البسيط، ثم would مع الفعل.",
      "Para algo irreal o poco probable, usa if + el pasado. Después would + verbo.",
      "Gerçek olmayan ya da pek olası olmayan bir durum için if + geçmiş zaman kullan. Sonra would + fiil.",
    ),
    right: "If I [had] more time, I [would] travel.",
    wrong: "If I [would have] more time, I travel.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After I, he, she and it, many people say were: If I were you, I would wait.",
          "بعد I وhe وshe وit يقول كثيرون were: If I were you, I would wait.",
          "Después de I, he, she e it, mucha gente dice were: If I were you, I would wait.",
          "I, he, she ve it'ten sonra pek çok kişi were der: If I were you, I would wait.",
        ),
        examples: ["If I [were] you, I would wait."],
      },
    ],
  },
  "b2-02": {
    idea: lines(
      "For an action that started in the past and is still going on, use have been + verb-ing.",
      "للفعل الذي بدأ في الماضي ومازال مستمراً نستعمل have been مع الفعل وفي آخره ing.",
      "Para una acción que empezó en el pasado y sigue ahora, usa have been + verbo con -ing.",
      "Geçmişte başlayıp hâlâ süren bir eylem için have been + fiil-ing kullan.",
    ),
    right: "I have been wait[ing] for an hour.",
    wrong: "I have been [wait] for an hour.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "With verbs like know, like and live, use the simple form: I have known him for years.",
          "مع أفعال مثل know وlike وlive نستعمل الصيغة البسيطة: I have known him for years.",
          "Con verbos como know, like y live, usa la forma simple: I have known him for years.",
          "know, like ve live gibi fiillerle basit biçimi kullan: I have known him for years.",
        ),
        examples: ["I have [known] him for years."],
      },
    ],
  },
  "b2-03": {
    idea: lines(
      "Use had + the third form of the verb for an action that finished before another action in the past.",
      "نستعمل had مع التصريف الثالث لفعل انتهى قبل فعل آخر في الماضي.",
      "Usa had + la tercera forma del verbo para una acción que terminó antes de otra acción en el pasado.",
      "Geçmişte başka bir eylemden önce biten bir eylem için had + fiilin üçüncü hâli kullan.",
    ),
    right: "When I arrived, the film [had] already start[ed].",
    wrong: "When I arrived, the film had [start].",
    notes: [
      {
        kind: "exception",
        say: lines(
          "When the order is clear (after, before), the simple past is enough: I ate after I finished work.",
          "إذا كان الترتيب واضحاً (after، before) يكفي الماضي البسيط: I ate after I finished work.",
          "Si el orden está claro (after, before), basta el pasado simple: I ate after I finished work.",
          "Sıra açıksa (after, before) basit geçmiş zaman yeter: I ate after I finished work.",
        ),
        examples: ["I ate after I [finished] work."],
      },
    ],
  },
  "b2-04": {
    idea: lines(
      "Use be + the third form of the verb when the action matters more than the person who did it.",
      "نستعمل be مع التصريف الثالث حين يهمنا الفعل أكثر من الشخص الذي قام به.",
      "Usa be + la tercera forma del verbo cuando importa más la acción que quien la hizo.",
      "Eylem, onu yapan kişiden daha önemliyse be + fiilin üçüncü hâli kullan.",
    ),
    right: "The bridge was [built] in 1932.",
    wrong: "The bridge was [build] in 1932.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "Add by only when it matters who did it: The novel was written by a famous writer.",
          "نضيف by فقط إذا كان الفاعل مهماً: The novel was written by a famous writer.",
          "Añade by solo cuando importa quién lo hizo: The novel was written by a famous writer.",
          "by'ı yalnızca kimin yaptığı önemliyse ekle: The novel was written by a famous writer.",
        ),
        examples: ["It was written [by] a famous writer."],
      },
    ],
  },
  "b2-05": {
    idea: lines(
      "After wish, use the past for something you want to be different now.",
      "بعد wish نستعمل الماضي لشيء نتمنى أن يكون مختلفاً الآن.",
      "Después de wish, usa el pasado para algo que quieres que sea distinto ahora.",
      "Şu anda farklı olmasını istediğin bir şey için wish'ten sonra geçmiş zaman kullan.",
    ),
    right: "I wish I [had] more free time.",
    wrong: "I wish I [have] more free time.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After I, he, she and it, many people say were: I wish I were taller.",
          "بعد I وhe وshe وit يقول كثيرون were: I wish I were taller.",
          "Después de I, he, she e it, mucha gente dice were: I wish I were taller.",
          "I, he, she ve it'ten sonra pek çok kişi were der: I wish I were taller.",
        ),
        examples: ["I wish I [were] taller."],
      },
    ],
  },
  "b2-06": {
    idea: lines(
      "Use should have + the third form of the verb for a mistake or a regret in the past.",
      "نستعمل should have مع التصريف الثالث لخطأ حدث في الماضي أو لشيء نندم عليه.",
      "Usa should have + la tercera forma del verbo para un error o un arrepentimiento del pasado.",
      "Geçmişteki bir hata ya da pişmanlık için should have + fiilin üçüncü hâli kullan.",
    ),
    right: "You should have call[ed] me.",
    wrong: "You should have [call] me.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "For a mistake that happened, use shouldn't have: I shouldn't have said that.",
          "للخطأ الذي حدث فعلاً نستعمل shouldn't have: I shouldn't have said that.",
          "Para un error que ocurrió, usa shouldn't have: I shouldn't have said that.",
          "Gerçekleşmiş bir hata için shouldn't have kullan: I shouldn't have said that.",
        ),
        examples: ["I [shouldn't] have said that."],
      },
    ],
  },
  "b2-07": {
    idea: lines(
      "After some verbs, the next verb ends in -ing, not to.",
      "بعد بعض الأفعال، الفعل التالي ينتهي بـ ing وليس مع to.",
      "Después de algunos verbos, el siguiente verbo termina en -ing, no lleva to.",
      "Bazı fiillerden sonra gelen fiil -ing alır, to almaz.",
    ),
    right: "I enjoy read[ing] in the evening.",
    wrong: "I enjoy [to read] in the evening.",
    notes: [
      {
        kind: "exception",
        say: lines(
          "After want, decide, hope and plan, use to: I decided to leave.",
          "بعد want وdecide وhope وplan نستعمل to: I decided to leave.",
          "Después de want, decide, hope y plan, usa to: I decided to leave.",
          "want, decide, hope ve plan'dan sonra to kullan: I decided to leave.",
        ),
        examples: ["I decided [to] leave."],
      },
    ],
  },
};

/** The first 39 rules with their prepared sentences (teach-items.ts), so every rule has both. */
const FIRST_39_WITH_ITEMS: Readonly<Record<string, RuleTeach>> = Object.fromEntries(
  Object.entries(FIRST_39).map(([id, teach]) => [id, { ...teach, items: ITEMS_FIRST_39[id] }]),
);

/** What every rule of the syllabus teaches, by rule id: the first 39 and the rules of each level added to the syllabus. */
export const TEACH: Readonly<Record<string, RuleTeach>> = {
  ...FIRST_39_WITH_ITEMS,
  ...TEACH_A1,
  ...TEACH_A2,
  ...TEACH_B2,
};

/** What a rule card teaches, by rule id; undefined for an id the ladders do not have. */
export function teachFor(ruleId: string): RuleTeach | undefined {
  return TEACH[ruleId];
}
