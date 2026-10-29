/**
 * What the rules of the B2 syllabus teach in the units on the passive and the causative (b2-21 ... b2-24),
 * reported speech (b2-25 ... b2-28), modal verbs (b2-29 ... b2-32) and relative and participle clauses
 * (b2-33 ... b2-35). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_B2_PASSIVE: Readonly<Record<string, RuleTeach>> = {
  "b2-21": {
    idea: lines(
      "With a modal verb, use the modal + be + past participle: The work must be finished today. It can be done.",
      "مع الأفعال المساعدة نستعمل modal + be + التصريف الثالث: The work must be finished today. It can be done.",
      "Con un verbo modal usa modal + be + participio: The work must be finished today. It can be done.",
      "Kip fiiliyle modal + be + participle kullan: The work must be finished today. It can be done.",
    ),
    right: "The door must be [locked] at night.",
    wrong: "The door must be [lock] at night.",
    notes: [
      note(
        "detail",
        lines(
          "Negatives and questions follow the modal: The door can't be opened. Should it be locked?",
          "النفي والأسئلة يتبعان الفعل المساعد: The door can't be opened. Should it be locked؟",
          "Las negaciones y preguntas siguen al modal: The door can't be opened. Should it be locked?",
          "Olumsuz ve soru kip fiilini izler: The door can't be opened. Should it be locked?",
        ),
        ["It can't be [fixed].", "Should it be [done] today?"],
      ),
    ],
    items: [
      "The report must be [finished] by Friday.{finish}",
      "This door can't be [opened] from outside.{open}",
      "The windows should be [cleaned] every week.{clean}",
      "Children must be [taught] to read.{teach}",
      "Can this phone be [repaired]?{repair}",
      "The room will be [cleaned] tomorrow.{clean}",
    ],
  },
  "b2-22": {
    idea: lines(
      "Perfect passive: has/have been + participle (The house has been sold). Continuous passive: is/are being + participle (The house is being painted).",
      "المبني للمجهول التام: has/have been + التصريف الثالث (The house has been sold). والمستمر: is/are being + التصريف الثالث (The house is being painted).",
      "Pasiva perfecta: has/have been + participio (The house has been sold). Pasiva continua: is/are being + participio (The house is being painted).",
      "Perfect edilgen: has/have been + participle (The house has been sold). Sürekli edilgen: is/are being + participle (The house is being painted).",
    ),
    right: "The house has been [sold].",
    wrong: "The house has been [sell].",
    notes: [
      note(
        "detail",
        lines(
          "Being shows that the action is in progress now: The road is being repaired (the work is happening now).",
          "being تدل على أن الفعل جارٍ الآن: The road is being repaired (العمل يجري الآن).",
          "Being muestra que la acción está en curso ahora: The road is being repaired (el trabajo se hace ahora).",
          "Being, eylemin şu anda sürdüğünü gösterir: The road is being repaired (iş şu anda yapılıyor).",
        ),
        ["The road is being [repaired].", "My car has been [stolen]."],
      ),
    ],
    items: [
      "My bike has been [stolen]!{steal}",
      "The new bridge is being [built] now.{build}",
      "The letters have been [sent].{send}",
      "The patient is being [examined] by the doctor.{examine}",
      "The room has not been [cleaned] yet.{clean}",
      "Dinner is being [prepared] in the kitchen.{prepare}",
    ],
  },
  "b2-23": {
    idea: lines(
      "To report what people say or believe, use It is said that… or He is said to…: He is said to be very rich.",
      "لنقل ما يقوله الناس أو يعتقدونه نستعمل It is said that… أو He is said to…: He is said to be very rich.",
      "Para contar lo que dice o cree la gente, usa It is said that… o He is said to…: He is said to be very rich.",
      "İnsanların söylediğini ya da inandığını aktarmak için It is said that… veya He is said to… kullan: He is said to be very rich.",
    ),
    right: "He is [said] to be very rich.",
    wrong: "He is [say] to be very rich.",
    notes: [
      note(
        "detail",
        lines(
          "Common verbs: said, believed, thought, known, expected, reported. Two patterns: It is believed that he is rich. He is believed to be rich.",
          "أفعال شائعة: said وbelieved وthought وknown وexpected وreported. نمطان: It is believed that he is rich. He is believed to be rich.",
          "Verbos comunes: said, believed, thought, known, expected, reported. Dos estructuras: It is believed that he is rich. He is believed to be rich.",
          "Yaygın fiiller: said, believed, thought, known, expected, reported. İki kalıp: It is believed that he is rich. He is believed to be rich.",
        ),
        ["It is [believed] that he is rich.", "He is [believed] to be rich."],
      ),
    ],
    items: [
      "He is [said] to be the richest man in town.{say}",
      "It is [believed] that the old castle is haunted.{believe}",
      "The company is [expected] to hire fifty people.{expect}",
      "She is [known] to be very generous.{know}",
      "It is [thought] that the meeting will start late.{think}",
      "The film is [considered] to be a masterpiece.{consider}",
    ],
  },
  "b2-24": {
    idea: lines(
      "Use have / get + object + past participle when someone else does a job for you: I had my car repaired.",
      "نستعمل have / get + مفعول + التصريف الثالث حين يقوم شخص آخر بعمل لنا: I had my car repaired.",
      "Usa have / get + objeto + participio cuando otra persona hace un trabajo por ti: I had my car repaired.",
      "Bir işi başkası senin için yaptığında have / get + nesne + participle kullan: I had my car repaired.",
    ),
    right: "I had my car [repaired].",
    wrong: "I had my car [repair].",
    notes: [
      note(
        "detail",
        lines(
          "It is also used for bad things that happen to you: He had his wallet stolen. Get is more informal.",
          "وتُستعمل أيضاً للأشياء السيئة التي تحدث لنا: He had his wallet stolen. وget أقل رسمية.",
          "También se usa para cosas malas que te pasan: He had his wallet stolen. Get es más informal.",
          "Başına gelen kötü şeyler için de kullanılır: He had his wallet stolen. Get daha günlüktür.",
        ),
        ["He had his bag [stolen].", "I got my hair [cut]."],
      ),
    ],
    items: [
      "I had my car [repaired] last week.{repair}",
      "She is having her hair [cut] today.{cut}",
      "We had the house [painted] in June.{paint}",
      "He got his phone [fixed] at the shop.{fix}",
      "I need to have my eyes [tested].{test}",
      "They had their bags [stolen] at the station.{steal}",
    ],
  },
  "b2-25": {
    idea: lines(
      "In reported speech, tenses go one step back: am/is → was, do → did, did → had done, will → would, can → could, have → had.",
      "في الكلام المنقول ترجع الأزمنة خطوة: am/is → was وdo → did وdid → had done وwill → would وcan → could وhave → had.",
      "En el estilo indirecto los tiempos retroceden un paso: am/is → was, do → did, did → had done, will → would, can → could, have → had.",
      "Dolaylı anlatımda zamanlar bir adım geri gider: am/is → was, do → did, did → had done, will → would, can → could, have → had.",
    ),
    right: "He said he [had seen] the film.",
    wrong: "He said he [has seen] the film.",
    notes: [
      note(
        "exception",
        lines(
          "No step back is needed when the reporting verb is in the present or the fact is still true: She says she is tired.",
          "لا نرجع خطوة إذا كان فعل النقل مضارعاً أو كان الأمر ما زال صحيحاً: She says she is tired.",
          "No hace falta retroceder si el verbo de reporte está en presente o el hecho sigue siendo verdad: She says she is tired.",
          "Aktarma fiili şimdiki zamandaysa ya da bilgi hâlâ doğruysa geri gitmeye gerek yok: She says she is tired.",
        ),
        ["She says she [is] tired.", "He said the sun [rises] in the east."],
      ),
    ],
    items: [
      "He said he [had lost] his keys.{have lost}",
      "She said she [would] call him later.{will}",
      "They said they [could] not find the house.{can}",
      "He told me he [had finished] the work.{finished}",
      "She explained that she [had been working] all day.{have been working}",
      "He said he [had seen] the film before.{saw}",
    ],
  },
  "b2-26": {
    idea: lines(
      "In a reported question, use normal word order with no do/does/did and no question mark: She asked where I lived.",
      "في السؤال المنقول نستعمل الترتيب العادي دون do/does/did ودون علامة استفهام: She asked where I lived.",
      "En una pregunta indirecta usa el orden normal, sin do/does/did y sin signo de interrogación: She asked where I lived.",
      "Dolaylı soruda normal sözcük sırası kullan; do/does/did ve soru işareti yok: She asked where I lived.",
    ),
    right: "She asked where I [lived].",
    wrong: "She asked where [did I live].",
    notes: [
      note(
        "detail",
        lines(
          "For yes/no questions use if or whether: He asked if I was ready. The tense goes one step back.",
          "لأسئلة نعم/لا نستعمل if أو whether: He asked if I was ready. ويرجع الزمن خطوة.",
          "Para preguntas de sí/no usa if o whether: He asked if I was ready. El tiempo retrocede un paso.",
          "Evet/hayır soruları için if ya da whether kullan: He asked if I was ready. Zaman bir adım geri gider.",
        ),
        ["He asked [if] I was ready.", "She asked [whether] he came."],
      ),
    ],
    items: [
      "She asked me where I [lived].{live}",
      "He asked what time the film [started].{start}",
      "They asked [if|whether] I was ready.",
      "I asked her why she [was] crying.{is}",
      "He wanted to know how much the ticket [cost].{cost}",
      "She asked me [whether|if] I could help.",
    ],
  },
  "b2-27": {
    idea: lines(
      "Report an order or request with told / asked + person + to + verb: She told me to sit down. Negative: not to.",
      "ننقل الأمر أو الطلب بـ told / asked + الشخص + to + فعل: She told me to sit down. والنفي: not to.",
      "Cuenta una orden o petición con told / asked + persona + to + verbo: She told me to sit down. Negativo: not to.",
      "Emir ya da ricayı told / asked + kişi + to + fiil ile aktar: She told me to sit down. Olumsuz: not to.",
    ),
    right: "She told me [to] sit down.",
    wrong: "She told me [sit] down.",
    notes: [
      note(
        "detail",
        lines(
          "Negative: not to + verb. He told us not to worry. Do not use don't in the report.",
          "النفي: not to + فعل. He told us not to worry. ولا نستعمل don't في النقل.",
          "Negativo: not to + verbo. He told us not to worry. No uses don't en el reporte.",
          "Olumsuz: not to + fiil. He told us not to worry. Aktarımda don't kullanma.",
        ),
        ["He told us [not to] worry.", "She asked me [to] help."],
      ),
    ],
    items: [
      "The teacher told us [to] open the books.",
      "My mother asked me [to] buy some bread.",
      "He told them [not to] make noise.",
      "The police ordered him [to] stop the car.",
      "She asked him [not to] be late.",
      "The doctor advised me [to] drink more water.",
    ],
  },
  "b2-28": {
    idea: lines(
      "Some reporting verbs have their own pattern: admit / deny / suggest + -ing, promise / refuse / offer + to, warn + person + not to.",
      "لبعض أفعال النقل نمطها الخاص: admit / deny / suggest + ‏-ing وpromise / refuse / offer + to وwarn + شخص + not to.",
      "Algunos verbos de reporte tienen su propia estructura: admit / deny / suggest + -ing, promise / refuse / offer + to, warn + persona + not to.",
      "Bazı aktarma fiillerinin kendi kalıbı vardır: admit / deny / suggest + -ing, promise / refuse / offer + to, warn + kişi + not to.",
    ),
    right: "He admitted [stealing] the money.",
    wrong: "He admitted [to steal] the money.",
    notes: [
      note(
        "mistake",
        lines(
          "After suggest do not add a person + to: She suggested going out (not She suggested me to go out).",
          "بعد suggest لا نضيف شخصاً + to: She suggested going out (وليس She suggested me to go out).",
          "Después de suggest no añadas persona + to: She suggested going out (no She suggested me to go out).",
          "Suggest'ten sonra kişi + to ekleme: She suggested going out (She suggested me to go out değil).",
        ),
        ["She suggested [going] out.", "He denied [taking] it."],
      ),
      note(
        "detail",
        lines(
          "Promise, refuse, offer and agree take to + verb: He promised to call.",
          "promise وrefuse وoffer وagree تأخذ to + فعل: He promised to call.",
          "Promise, refuse, offer y agree llevan to + verbo: He promised to call.",
          "Promise, refuse, offer ve agree to + fiil alır: He promised to call.",
        ),
        ["He promised [to] call.", "She refused [to] help."],
      ),
    ],
    items: [
      "He admitted [stealing] the money.{steal}",
      "She suggested [going] to the park.{go}",
      "He promised [to] call me tonight.",
      "They refused [to] pay the bill.",
      "She denied [breaking] the window.{break}",
      "The guide warned us [not to] touch the paintings.",
    ],
  },
  "b2-29": {
    idea: lines(
      "Must = sure it is true (He must be tired). Can't = sure it is not true (She can't be at home). Might / could = maybe.",
      "must = متأكد أنه صحيح (He must be tired). وcan't = متأكد أنه غير صحيح (She can't be at home). وmight / could = ربما.",
      "Must = seguro de que es verdad (He must be tired). Can't = seguro de que no es verdad (She can't be at home). Might / could = quizá.",
      "Must = doğru olduğundan eminsin (He must be tired). Can't = doğru olmadığından eminsin (She can't be at home). Might / could = belki.",
    ),
    right: "He has been working all day. He [must] be tired.",
    wrong: "He has been working all day. He [can't] be tired.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use mustn't for a guess. Use can't: That can't be true (not That mustn't be true).",
          "لا نستعمل mustn't للتخمين بل can't: That can't be true (وليس That mustn't be true).",
          "No uses mustn't para una suposición. Usa can't: That can't be true (no That mustn't be true).",
          "Tahmin için mustn't kullanma. Can't kullan: That can't be true (That mustn't be true değil).",
        ),
        ["That [can't] be true.", "He [might] be late."],
      ),
    ],
    items: [
      "He has been working all day. He [must] be tired.",
      "She is at the airport now, so she [can't] be at home.",
      "I'm not sure where he is. He [might|may|could] be in the library.",
      "The lights are on. Someone [must] be inside.",
      "That [can't] be Ali. He is in Dubai.",
      "Listen to that noise. It [must] be the neighbours.",
    ],
  },
  "b2-30": {
    idea: lines(
      "Use must have / can't have / might have + past participle to guess about the past: He must have forgotten. She can't have left.",
      "نستعمل must have / can't have / might have + التصريف الثالث لتخمين عن الماضي: He must have forgotten. She can't have left.",
      "Usa must have / can't have / might have + participio para una suposición sobre el pasado: He must have forgotten. She can't have left.",
      "Geçmiş hakkında tahmin için must have / can't have / might have + participle kullan: He must have forgotten. She can't have left.",
    ),
    right: "He [must have] forgotten.",
    wrong: "He [must] forgot.",
    notes: [
      note(
        "detail",
        lines(
          "Must have = sure it happened. Can't have = sure it did not. Might have = maybe it happened.",
          "must have = متأكد أنه حدث. وcan't have = متأكد أنه لم يحدث. وmight have = ربما حدث.",
          "Must have = seguro de que pasó. Can't have = seguro de que no pasó. Might have = quizá pasó.",
          "Must have = olduğundan eminsin. Can't have = olmadığından eminsin. Might have = belki oldu.",
        ),
        ["She [can't have] left.", "He [might have] missed the bus."],
      ),
    ],
    items: [
      "The ground is wet. It [must have] rained during the night.",
      "He isn't answering. He [might have] fallen asleep.",
      "She [can't have] seen me. She walked past without a word.",
      "The door is open. Someone [must have] come in.",
      "I can't find my phone. I [might have] left it at the office.",
      "He [can't have] gone home. His car is still here.",
    ],
  },
  "b2-31": {
    idea: lines(
      "Had better + base verb is strong advice with a warning: You had better hurry. Ought to + verb is like should: You ought to rest.",
      "had better + الفعل الأساسي نصيحة قوية مع تحذير: You had better hurry. وought to + فعل قريبة من should: You ought to rest.",
      "Had better + verbo base es un consejo fuerte con aviso: You had better hurry. Ought to + verbo se parece a should: You ought to rest.",
      "Had better + yalın fiil uyarılı güçlü tavsiyedir: You had better hurry. Ought to + fiil, should gibidir: You ought to rest.",
    ),
    right: "You had [better] hurry.",
    wrong: "You had [better to] hurry.",
    notes: [
      note(
        "detail",
        lines(
          "Negative: had better not. Short form: You'd better. It is about now or the future, not the past.",
          "النفي: had better not. الاختصار: You'd better. وهي عن الحاضر أو المستقبل لا الماضي.",
          "Negativo: had better not. Forma corta: You'd better. Habla del presente o futuro, no del pasado.",
          "Olumsuz: had better not. Kısa biçim: You'd better. Şimdi ya da gelecek içindir, geçmiş için değil.",
        ),
        ["You'd better [not] be late.", "You [ought to] see a doctor."],
      ),
    ],
    items: [
      "You had [better] hurry, or you will miss the bus.",
      "You'd better [not] touch that. It's hot.",
      "We [ought to] leave now. It's late.",
      "You [ought to] apologise to her.",
      "He had better [study] harder if he wants to pass.{study}",
      "You [had better|'d better] take a coat. It's cold.",
    ],
  },
  "b2-32": {
    idea: lines(
      "Be supposed to means it is expected or the rule: You are supposed to be here at nine. Be allowed to means permission: We are allowed to park here.",
      "be supposed to تعني المتوقع أو القاعدة: You are supposed to be here at nine. وbe allowed to تعني السماح: We are allowed to park here.",
      "Be supposed to significa lo esperado o la norma: You are supposed to be here at nine. Be allowed to significa permiso: We are allowed to park here.",
      "Be supposed to beklenen ya da kural olanı anlatır: You are supposed to be here at nine. Be allowed to izin demektir: We are allowed to park here.",
    ),
    right: "You are [supposed to] be here at nine.",
    wrong: "You are [suppose to] be here at nine.",
    notes: [
      note(
        "mistake",
        lines(
          "Write supposed with -d: I was supposed to call (not I was suppose to call).",
          "نكتب supposed بالـ d: I was supposed to call (وليس I was suppose to call).",
          "Escribe supposed con -d: I was supposed to call (no I was suppose to call).",
          "Supposed'ı -d ile yaz: I was supposed to call (I was suppose to call değil).",
        ),
        ["I was [supposed to] call.", "Children aren't [allowed to] enter."],
      ),
    ],
    items: [
      "You are [supposed to] be at school at eight.",
      "We are not [allowed to] use phones in the exam.",
      "I was [supposed to] call her, but I forgot.",
      "Visitors are [allowed to] take photos here.",
      "He is [supposed to] arrive at noon.",
      "Students aren't [allowed to] eat in the library.",
    ],
  },
  "b2-33": {
    idea: lines(
      "A non-defining clause adds extra information between commas with who, which or where (never that): My brother, who lives in Erbil, is a doctor.",
      "الجملة الموصولة غير المحدِّدة تضيف معلومة إضافية بين فاصلتين بـ who أو which أو where (لا that): My brother, who lives in Erbil, is a doctor.",
      "Una oración de relativo explicativa añade información extra entre comas con who, which o where (nunca that): My brother, who lives in Erbil, is a doctor.",
      "Açıklayıcı yan cümle virgüller arasında who, which veya where ile ek bilgi verir (that olmaz): My brother, who lives in Erbil, is a doctor.",
    ),
    right: "My brother, [who] lives in Erbil, is a doctor.",
    wrong: "My brother, [that] lives in Erbil, is a doctor.",
    notes: [
      note(
        "detail",
        lines(
          "Take the clause out and the sentence still makes sense: My brother is a doctor. The commas show it is extra.",
          "إن حذفت الجملة بقي المعنى سليماً: My brother is a doctor. والفاصلتان تدلان على أنها إضافية.",
          "Si quitas la oración, la frase sigue teniendo sentido: My brother is a doctor. Las comas indican que es extra.",
          "Yan cümleyi çıkarsan cümle hâlâ anlamlıdır: My brother is a doctor. Virgüller bunun ek bilgi olduğunu gösterir.",
        ),
        ["Basra, [which] is in the south, is hot.", "My teacher, [who] is kind, helped me."],
      ),
    ],
    items: [
      "My brother, [who] lives in Erbil, is a doctor.",
      "Basra, [which] is in the south of Iraq, is very hot.",
      "The Tigris, [which] flows through Baghdad, is a long river.",
      "My teacher, [who] is very kind, helped me a lot.",
      "We visited Mosul, [where] my father was born.",
      "Ali, [whose] car is red, lives next door.",
    ],
  },
  "b2-34": {
    idea: lines(
      "A preposition can go before whom or which (formal), or stay at the end (everyday): the man with whom I work / the man I work with.",
      "يمكن أن يأتي حرف الجر قبل whom أو which (رسمي) أو يبقى في آخر الجملة (عادي): the man with whom I work / the man I work with.",
      "La preposición puede ir antes de whom o which (formal) o quedarse al final (cotidiano): the man with whom I work / the man I work with.",
      "Edat whom ya da which'ten önce gelebilir (resmî) ya da sonda kalabilir (günlük): the man with whom I work / the man I work with.",
    ),
    right: "This is the man with [whom] I work.",
    wrong: "This is the man with [who] I work.",
    notes: [
      note(
        "mistake",
        lines(
          "After a preposition use whom for people and which for things, never who or that.",
          "بعد حرف الجر نستعمل whom للأشخاص وwhich للأشياء، ولا نستعمل who أو that.",
          "Después de una preposición usa whom para personas y which para cosas, nunca who ni that.",
          "Edattan sonra kişiler için whom, şeyler için which kullan; who ya da that kullanma.",
        ),
        ["The house in [which] I live is old.", "The person to [whom] I spoke was kind."],
      ),
    ],
    items: [
      "This is the man with [whom] I work.",
      "The house in [which] I live is very old.",
      "The woman to [whom] I spoke was very kind.",
      "The chair on [which] he sat was broken.",
      "The people with [whom] we travelled were friendly.",
      "The city in [which] I was born is near the sea.",
    ],
  },
  "b2-35": {
    idea: lines(
      "Use an -ing clause for two actions by the same person: Walking home, I met a friend. (= While I was walking home, …)",
      "نستعمل جملة ‏-ing لفعلين لشخص واحد: Walking home, I met a friend. (= While I was walking home, …)",
      "Usa una cláusula con -ing para dos acciones de la misma persona: Walking home, I met a friend. (= While I was walking home, …)",
      "Aynı kişinin iki eylemi için -ing yan cümlesi kullan: Walking home, I met a friend. (= While I was walking home, …)",
    ),
    right: "[Walking] home, I met a friend.",
    wrong: "[Walk] home, I met a friend.",
    notes: [
      note(
        "mistake",
        lines(
          "The -ing part and the main part must have the same subject: Walking home, I met a friend (I was walking and I met).",
          "يجب أن يكون فاعل جزء ‏-ing هو نفسه فاعل الجملة الرئيسية: Walking home, I met a friend (أنا من مشى وأنا من قابل).",
          "La parte con -ing y la principal deben tener el mismo sujeto: Walking home, I met a friend (yo caminaba y yo encontré).",
          "-ing bölümü ile ana bölümün öznesi aynı olmalı: Walking home, I met a friend (ben yürüyordum ve ben karşılaştım).",
        ),
        ["[Having] eaten, we left.", "[Opening] the door, he smiled."],
      ),
    ],
    items: [
      "[Walking] home, I met an old friend.{walk}",
      "[Feeling] tired, she went to bed early.{feel}",
      "[Having] finished the work, he went home.{have}",
      "[Opening] the door, he saw a cat.{open}",
      "[Waiting] for the bus, she read a book.{wait}",
      "[Looking] out of the window, I saw a bird.{look}",
    ],
  },
};
