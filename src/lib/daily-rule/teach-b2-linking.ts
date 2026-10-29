/**
 * What the rules of the B2 syllabus teach in its last two units: verb patterns (b2-36 ... b2-38) and linking,
 * emphasis and structure (b2-39 ... b2-45). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_B2_LINKING: Readonly<Record<string, RuleTeach>> = {
  "b2-36": {
    idea: lines(
      "Stop, remember, forget and try change meaning: -ing for what happened (I remember locking it), to for what to do (Remember to lock it).",
      "stop وremember وforget وtry يتغير معناها: ‏-ing لما حدث (I remember locking it)، وto لما يجب فعله (Remember to lock it).",
      "Stop, remember, forget y try cambian de significado: -ing para lo que pasó (I remember locking it), to para lo que hay que hacer (Remember to lock it).",
      "Stop, remember, forget ve try anlam değiştirir: -ing olanı (I remember locking it), to yapılacak olanı (Remember to lock it) anlatır.",
    ),
    right: "I stopped [smoking] last year.",
    wrong: "I stopped [to smoke] last year.",
    notes: [
      note(
        "detail",
        lines(
          "Stop to + verb means stop in order to do it: I stopped to buy water. Try + -ing means experiment; try to means make an effort.",
          "stop to + فعل تعني توقفتُ لأفعل: I stopped to buy water. وtry + ‏-ing تعني جرّب؛ أما try to فتعني حاول.",
          "Stop to + verbo significa parar para hacerlo: I stopped to buy water. Try + -ing significa probar; try to significa esforzarse.",
          "Stop to + fiil, yapmak için durmak demektir: I stopped to buy water. Try + -ing denemek; try to çabalamak demektir.",
        ),
        ["I stopped [to] buy water.", "Try [turning] it off and on."],
      ),
    ],
    items: [
      "I stopped [smoking] two years ago.{smoke}",
      "I stopped [to] buy some water on the way.",
      "Remember [to] lock the door when you leave.",
      "I remember [meeting] him at the party last year.{meet}",
      "I forgot [to] call my mother, so she was worried.",
      "If the screen is black, try [restarting] the phone.{restart}",
    ],
  },
  "b2-37": {
    idea: lines(
      "After see, hear, watch and notice, put the person and the -ing form to say what they were doing: I saw him running.",
      "بعد see وhear وwatch وnotice نضع الشخص ثم صيغة ‏-ing لنقول ماذا كان يفعل: I saw him running.",
      "Después de see, hear, watch y notice pon a la persona y la forma -ing para decir qué hacía: I saw him running.",
      "see, hear, watch ve notice'ten sonra kişiyi ve -ing biçimini koy: I saw him running.",
    ),
    right: "I saw him [running] in the park.",
    wrong: "I saw him [to run] in the park.",
    notes: [
      note(
        "detail",
        lines(
          "With the base verb (I saw her cross the road) you saw the whole action. With -ing you saw part of it.",
          "مع الفعل الأساسي (I saw her cross the road) رأيت الفعل كله. ومع ‏-ing رأيت جزءاً منه.",
          "Con el verbo base (I saw her cross the road) viste toda la acción. Con -ing viste una parte.",
          "Yalın fiille (I saw her cross the road) eylemin tamamını gördün. -ing ile bir kısmını gördün.",
        ),
        ["I saw her [cross] the road.", "I saw her [crossing] the road."],
      ),
    ],
    items: [
      "I saw him [running] in the park.{run}",
      "We heard them [singing] in the garden.{sing}",
      "She watched the children [playing] football.{play}",
      "I noticed a man [standing] by the door.{stand}",
      "Did you hear the baby [crying]?{cry}",
      "I can smell something [burning].{burn}",
    ],
  },
  "b2-38": {
    idea: lines(
      "Make and let take a person and the base verb with no to: She made me wait. He let us go. But allow needs to: She allowed us to go.",
      "بعد make وlet نضع الشخص ثم الفعل الأساسي بلا to: She made me wait. He let us go. لكن allow تحتاج to: She allowed us to go.",
      "Make y let llevan una persona y el verbo base sin to: She made me wait. He let us go. Pero allow lleva to: She allowed us to go.",
      "Make ve let'ten sonra kişi ve to'suz yalın fiil gelir: She made me wait. He let us go. Ama allow to alır: She allowed us to go.",
    ),
    right: "She made me [wait].",
    wrong: "She made me [to wait].",
    notes: [
      note(
        "exception",
        lines(
          "In the passive, make takes to: I was made to wait. Let has no passive; use be allowed to.",
          "في المبني للمجهول تأخذ make كلمة to: I was made to wait. ولا مبني للمجهول لـ let فنستعمل be allowed to.",
          "En pasiva, make lleva to: I was made to wait. Let no tiene pasiva; usa be allowed to.",
          "Edilgende make to alır: I was made to wait. Let'in edilgeni yoktur; be allowed to kullan.",
        ),
        ["I was made [to] wait.", "We were [allowed to] go."],
      ),
    ],
    items: [
      "My boss made me [work] late yesterday.{work}",
      "Her parents let her [go] to the party.{go}",
      "The film made us [laugh] a lot.{laugh}",
      "Please let me [know] when you arrive.{know}",
      "The teacher allowed us [to] use dictionaries.",
      "They don't let children [enter] the building.{enter}",
    ],
  },
  "b2-39": {
    idea: lines(
      "Despite and in spite of are followed by a noun or -ing, not a clause: Despite the rain, we went out. Although is followed by a clause.",
      "بعد despite وin spite of يأتي اسم أو ‏-ing لا جملة: Despite the rain, we went out. أما although فيأتي بعدها جملة.",
      "Despite e in spite of van seguidos de un sustantivo o -ing, no de una oración: Despite the rain, we went out. Although va con oración.",
      "Despite ve in spite of'tan sonra isim veya -ing gelir, cümle gelmez: Despite the rain, we went out. Although'tan sonra cümle gelir.",
    ),
    right: "[Despite] the rain, we went out.",
    wrong: "[Despite] it was raining, we went out.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not say despite of. Say despite, or in spite of.",
          "لا نقول despite of. نقول despite أو in spite of.",
          "No digas despite of. Di despite o in spite of.",
          "Despite of deme. Despite ya da in spite of de.",
        ),
        ["[Despite] being tired, he worked.", "[In spite of] the rain, we went out."],
      ),
    ],
    items: [
      "[Despite] the rain, we went to the park.",
      "He went to work [in spite of] his headache.",
      "[Despite] being tired, she finished the work.{be}",
      "She passed the exam [despite|in spite of] not studying much.",
      "[Although|Though] it was late, we kept talking.",
      "They enjoyed the trip [despite|in spite of] the bad weather.",
    ],
  },
  "b2-40": {
    idea: lines(
      "Formal linkers connect ideas: however (contrast), moreover (addition), therefore (result), whereas (contrast inside one sentence).",
      "أدوات الربط الرسمية تصل الأفكار: however (تعارض) وmoreover (إضافة) وtherefore (نتيجة) وwhereas (تعارض داخل الجملة الواحدة).",
      "Los conectores formales unen ideas: however (contraste), moreover (adición), therefore (resultado), whereas (contraste dentro de una frase).",
      "Resmî bağlaçlar fikirleri bağlar: however (karşıtlık), moreover (ekleme), therefore (sonuç), whereas (tek cümlede karşıtlık).",
    ),
    right: "The car is cheap. [Moreover], it is reliable.",
    wrong: "The car is cheap. [Whereas], it is reliable.",
    notes: [
      note(
        "detail",
        lines(
          "At the start of a sentence, put a comma after the linker: Moreover, it is strong. Whereas joins two clauses: He is tall, whereas she is short.",
          "في بداية الجملة نضع فاصلة بعد الرابط: Moreover, it is strong. وwhereas تربط جملتين: He is tall, whereas she is short.",
          "Al principio de una frase, pon coma tras el conector: Moreover, it is strong. Whereas une dos oraciones: He is tall, whereas she is short.",
          "Cümle başında bağlaçtan sonra virgül koy: Moreover, it is strong. Whereas iki cümleyi bağlar: He is tall, whereas she is short.",
        ),
        ["It is cheap. [Moreover], it is strong.", "He is tall, [whereas] she is short."],
      ),
    ],
    items: [
      "The hotel was cheap. [Moreover|Furthermore], it was clean.",
      "He studied hard. [Therefore|Consequently], he passed the exam.",
      "My brother loves sport, [whereas] I prefer reading.",
      "The plan is good. [However|Nevertheless], it is expensive.",
      "It was raining. [Nevertheless|However], we went out.",
      "She is kind and funny. [Moreover|Furthermore], she is very clever.",
    ],
  },
  "b2-41": {
    idea: lines(
      "To stress one part, use It is … that/who or What … is: It was Ali who broke the window. What I need is a rest.",
      "للتأكيد على جزء من الجملة نستعمل It is … that/who أو What … is: It was Ali who broke the window. What I need is a rest.",
      "Para destacar una parte, usa It is … that/who o What … is: It was Ali who broke the window. What I need is a rest.",
      "Bir bölümü vurgulamak için It is … that/who veya What … is kullan: It was Ali who broke the window. What I need is a rest.",
    ),
    right: "It was Ali [who] broke the window.",
    wrong: "It was Ali [which] broke the window.",
    notes: [
      note(
        "detail",
        lines(
          "Use who for a person and that for anything else. After What … is you can put a noun or to + verb: What I want is to sleep.",
          "نستعمل who للشخص وthat لغيره. وبعد What … is يأتي اسم أو to + فعل: What I want is to sleep.",
          "Usa who para una persona y that para lo demás. Tras What … is puede ir un sustantivo o to + verbo: What I want is to sleep.",
          "Kişi için who, diğer her şey için that kullan. What … is'ten sonra isim ya da to + fiil gelebilir: What I want is to sleep.",
        ),
        ["[What] I need is a rest.", "It was yesterday [that] I called."],
      ),
    ],
    items: [
      "It was Ali [who|that] broke the window.",
      "It was yesterday [that] we met.",
      "[What] I need is a long holiday.",
      "It is my sister [who|that] cooks dinner every day.",
      "[What] she wants is to be alone.",
      "It was in Basra [that] I first tried this dish.",
    ],
  },
  "b2-42": {
    idea: lines(
      "After never, rarely, seldom, hardly or not only, put the helper verb before the subject: Never have I seen such a view.",
      "بعد never وrarely وseldom وhardly وnot only نضع الفعل المساعد قبل الفاعل: Never have I seen such a view.",
      "Después de never, rarely, seldom, hardly o not only, pon el auxiliar antes del sujeto: Never have I seen such a view.",
      "never, rarely, seldom, hardly veya not only'den sonra yardımcı fiili özneden önce koy: Never have I seen such a view.",
    ),
    right: "Never [have] I seen such a view.",
    wrong: "Never [I have] seen such a view.",
    notes: [
      note(
        "detail",
        lines(
          "This style is formal and strong. Not only … but also follows the same pattern: Not only did he win, but he also broke the record.",
          "هذا الأسلوب رسمي وقوي. وnot only … but also تتبع النمط نفسه: Not only did he win, but he also broke the record.",
          "Este estilo es formal y enfático. Not only … but also sigue el mismo patrón: Not only did he win, but he also broke the record.",
          "Bu üslup resmî ve güçlüdür. Not only … but also aynı kalıbı izler: Not only did he win, but he also broke the record.",
        ),
        ["Not only [did] he win, but he also broke the record.", "Rarely [do] we eat out."],
      ),
    ],
    items: [
      "Never [have] I seen such a beautiful view.",
      "Rarely [do] we eat out on weekdays.",
      "Hardly [had] she left when it started to rain.",
      "Not only [did] he win, but he also broke the record.",
      "Seldom [does] he complain about anything.",
      "Never [will] I forget this day.",
    ],
  },
  "b2-43": {
    idea: lines(
      "Use fewer with countable nouns (fewer cars) and less with uncountable ones (less traffic). A number of + plural verb; the number of + singular verb.",
      "fewer مع المعدود (fewer cars) وless مع غير المعدود (less traffic). a number of + فعل جمع، وthe number of + فعل مفرد.",
      "Fewer con contables (fewer cars) y less con incontables (less traffic). A number of + verbo plural; the number of + verbo singular.",
      "Sayılabilenlerle fewer (fewer cars), sayılamayanlarla less (less traffic). A number of + çoğul fiil; the number of + tekil fiil.",
    ),
    right: "There are [fewer] cars today.",
    wrong: "There are [less] cars today.",
    notes: [
      note(
        "detail",
        lines(
          "A number of means several: A number of students are absent. The number of means the total: The number of students is thirty.",
          "a number of تعني «عدداً من»: A number of students are absent. وthe number of تعني العدد الإجمالي: The number of students is thirty.",
          "A number of significa varios: A number of students are absent. The number of significa el total: The number of students is thirty.",
          "A number of birkaç demektir: A number of students are absent. The number of toplam sayıdır: The number of students is thirty.",
        ),
        ["[A number of] students are absent.", "[The number of] students is thirty."],
      ),
    ],
    items: [
      "There are [fewer] cars on the road today.",
      "I drink [less] coffee than before.",
      "A [number] of students were absent.",
      "The number of students [is] thirty.",
      "We have [fewer] problems this year.",
      "She spends [less] time on her phone now.",
    ],
  },
  "b2-44": {
    idea: lines(
      "Use the + comparative, the + comparative for two things that change together: The more you practise, the better you get.",
      "نستعمل the + المقارنة، the + المقارنة لشيئين يتغيران معاً: The more you practise, the better you get.",
      "Usa the + comparativo, the + comparativo para dos cosas que cambian juntas: The more you practise, the better you get.",
      "Birlikte değişen iki şey için the + comparative, the + comparative kullan: The more you practise, the better you get.",
    ),
    right: "The more you practise, the [better] you get.",
    wrong: "The more you practise, the [more good] you get.",
    notes: [
      note(
        "detail",
        lines(
          "Much, far and a lot show how big the difference is: She is far taller than me. It is much cheaper here.",
          "much وfar وa lot تبيّن حجم الفرق: She is far taller than me. It is much cheaper here.",
          "Much, far y a lot muestran lo grande que es la diferencia: She is far taller than me. It is much cheaper here.",
          "Much, far ve a lot farkın ne kadar büyük olduğunu gösterir: She is far taller than me. It is much cheaper here.",
        ),
        ["She is [far] taller than me.", "It is [much] cheaper here."],
      ),
    ],
    items: [
      "The more you practise, the [better] you get.{good}",
      "The earlier you leave, the [sooner] you arrive.{soon}",
      "The [more] I read, the more I learn.",
      "The older he gets, the [wiser] he becomes.{wise}",
      "The [harder] you study, the higher your marks will be.{hard}",
      "The less you eat, the [hungrier] you feel.{hungry}",
    ],
  },
  "b2-45": {
    idea: lines(
      "Many adjectives and verbs go with a fixed preposition: afraid of, good at, interested in, depend on, listen to, wait for.",
      "كثير من الصفات والأفعال تأتي مع حرف جر ثابت: afraid of وgood at وinterested in وdepend on وlisten to وwait for.",
      "Muchos adjetivos y verbos van con una preposición fija: afraid of, good at, interested in, depend on, listen to, wait for.",
      "Birçok sıfat ve fiil sabit bir edatla kullanılır: afraid of, good at, interested in, depend on, listen to, wait for.",
    ),
    right: "She is good [at] maths.",
    wrong: "She is good [in] maths.",
    notes: [
      note(
        "mistake",
        lines(
          "Learn the pair together. Prepositions rarely match between languages, so do not translate them word for word.",
          "احفظ الزوج معاً. فحروف الجر العربية لا تطابق الإنجليزية فلا تترجمها حرفاً بحرف.",
          "Aprende la pareja completa. Las preposiciones rara vez coinciden entre idiomas, así que no las traduzcas palabra por palabra.",
          "Çifti birlikte öğren. Edatlar diller arasında nadiren örtüşür, kelime kelime çevirme.",
        ),
        ["I am afraid [of] dogs.", "We are waiting [for] the bus."],
      ),
      note(
        "detail",
        lines(
          "After a preposition use a noun or -ing: She is good at drawing (not good at draw).",
          "بعد حرف الجر نستعمل اسماً أو ‏-ing: She is good at drawing (وليس good at draw).",
          "Después de una preposición usa un sustantivo o -ing: She is good at drawing (no good at draw).",
          "Edattan sonra isim ya da -ing kullan: She is good at drawing (good at draw değil).",
        ),
        ["He is interested in [learning] Spanish."],
      ),
    ],
    items: [
      "I am afraid [of] dogs.",
      "She is good [at] drawing.",
      "We are waiting [for] the bus.",
      "He is interested [in] learning Spanish.",
      "It depends [on] the weather.",
      "Please listen [to] the teacher.",
    ],
  },
};
