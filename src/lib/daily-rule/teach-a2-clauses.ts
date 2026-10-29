/**
 * What the rules of the A2–B1 syllabus teach in its last two units: clauses and linking (a2-50 ... a2-56) and
 * verb patterns (a2-57 ... a2-60). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_A2_CLAUSES: Readonly<Record<string, RuleTeach>> = {
  "a2-50": {
    idea: lines(
      "Use if + present simple, present simple for things that are always true: If you heat ice, it melts.",
      "نستعمل if + المضارع البسيط، والمضارع البسيط لما هو صحيح دائماً: If you heat ice, it melts.",
      "Usa if + presente simple, presente simple para lo que siempre es verdad: If you heat ice, it melts.",
      "Her zaman doğru olanlar için if + geniş zaman, geniş zaman kullan: If you heat ice, it melts.",
    ),
    right: "If you heat ice, it [melts].",
    wrong: "If you heat ice, it [will melt].",
    notes: [
      note(
        "detail",
        lines(
          "When can replace if here: When you heat ice, it melts. No will in either part.",
          "يمكن أن تحل when محل if هنا: When you heat ice, it melts. ولا will في أي من الجزأين.",
          "When puede sustituir a if aquí: When you heat ice, it melts. Sin will en ninguna de las dos partes.",
          "Burada when, if yerine kullanılabilir: When you heat ice, it melts. İki bölümde de will yok.",
        ),
        ["If it rains, the road [gets] wet.", "[When] I am tired, I sleep."],
      ),
    ],
    items: [
      "If you heat water to 100 degrees, it [boils].{boil}",
      "If I drink coffee at night, I [don't|do not] sleep well.",
      "If you mix red and blue, you [get] purple.{get}",
      "Plants [die] if they get no water.{die}",
      "If it is cold, my brother always [wears] a hat.{wear}",
      "If you press this button, the door [opens].{open}",
    ],
  },
  "a2-51": {
    idea: lines(
      "Unless means if not: Unless you hurry, you will be late. (= If you don't hurry, you will be late.)",
      "unless تعني if not: Unless you hurry, you will be late. (= If you don't hurry, you will be late.)",
      "Unless significa if not: Unless you hurry, you will be late. (= If you don't hurry, you will be late.)",
      "Unless, if not demektir: Unless you hurry, you will be late. (= If you don't hurry, you will be late.)",
    ),
    right: "[Unless] you hurry, you will be late.",
    wrong: "Unless you [don't] hurry, you will be late.",
    notes: [
      note(
        "mistake",
        lines(
          "Unless already has the meaning of not, so the verb after it is positive: unless you study (not unless you don't study).",
          "unless تحمل معنى النفي أصلاً فالفعل بعدها مثبت: unless you study (وليس unless you don't study).",
          "Unless ya lleva el sentido de not, así que el verbo después es afirmativo: unless you study (no unless you don't study).",
          "Unless zaten not anlamı taşır, bu yüzden ardından olumlu fiil gelir: unless you study (unless you don't study değil).",
        ),
        ["Unless you [study], you will fail."],
      ),
    ],
    items: [
      "[Unless] you study, you will fail the test.",
      "I won't go out [unless] the rain stops.",
      "[Unless] you leave now, you will miss the bus.",
      "She will be angry [unless] you say sorry.",
      "We can't start [unless] everyone is here.",
      "He won't help you [unless] you ask him.",
    ],
  },
  "a2-52": {
    idea: lines(
      "Use who for people and which for things to say more about a noun: The man who lives next door is a doctor. That works for both.",
      "نستعمل who للأشخاص وwhich للأشياء لنضيف معلومة عن الاسم: The man who lives next door is a doctor. وthat تصلح للاثنين.",
      "Usa who para personas y which para cosas para decir más de un sustantivo: The man who lives next door is a doctor. That sirve para ambos.",
      "Bir isim hakkında bilgi vermek için kişilerde who, şeylerde which kullan: The man who lives next door is a doctor. That ikisi için de olur.",
    ),
    right: "The man [who] lives next door is a doctor.",
    wrong: "The man [which] lives next door is a doctor.",
    notes: [
      note(
        "detail",
        lines(
          "Who and which replace the subject, so do not add he or it: the book which is on the table (not which it is).",
          "تحل who وwhich محل الفاعل فلا نضيف he أو it: the book which is on the table (وليس which it is).",
          "Who y which sustituyen al sujeto, así que no añadas he ni it: the book which is on the table (no which it is).",
          "Who ve which öznenin yerini tutar, bu yüzden he ya da it ekleme: the book which is on the table (which it is değil).",
        ),
        ["The girl [who] won is my cousin.", "The bag [which] is red is mine."],
      ),
    ],
    items: [
      "The woman [who] teaches us English is very kind.",
      "I like the book [which|that] you gave me.",
      "The boy [who] lives next door plays the guitar.",
      "This is the phone [which|that] I bought yesterday.",
      "People [who] exercise are usually healthier.",
      "The restaurant [which|that] we visited was excellent.",
    ],
  },
  "a2-53": {
    idea: lines(
      "Use where for a place and whose for belonging: This is the school where I studied. She is the girl whose father is a pilot.",
      "نستعمل where للمكان وwhose للملكية: This is the school where I studied. She is the girl whose father is a pilot.",
      "Usa where para un lugar y whose para la posesión: This is the school where I studied. She is the girl whose father is a pilot.",
      "Yer için where, aitlik için whose kullan: This is the school where I studied. She is the girl whose father is a pilot.",
    ),
    right: "This is the school [where] I studied.",
    wrong: "This is the school [whose] I studied.",
    notes: [
      note(
        "detail",
        lines(
          "Whose is followed by a noun: the man whose car is red. It means his, her or their.",
          "يأتي بعد whose اسم: the man whose car is red. وتعني his أو her أو their.",
          "Después de whose va un sustantivo: the man whose car is red. Significa his, her o their.",
          "Whose'tan sonra isim gelir: the man whose car is red. His, her ya da their anlamındadır.",
        ),
        ["I know a man [whose] son is famous.", "This is the town [where] I was born."],
      ),
    ],
    items: [
      "This is the school [where] I studied.",
      "She is the girl [whose] father is a pilot.",
      "I know a shop [where] you can buy cheap shoes.",
      "He is the man [whose] car was stolen.",
      "The city [where] I live is very old.",
      "That is the teacher [whose] class I love.",
    ],
  },
  "a2-54": {
    idea: lines(
      'To report what someone said, the verb usually goes one step back: She said, "I am tired" → She said that she was tired.',
      'لننقل ما قاله شخص نرجع بالفعل خطوة إلى الماضي عادة: She said, "I am tired" → She said that she was tired.',
      'Para contar lo que alguien dijo, el verbo suele retroceder un paso: She said, "I am tired" → She said that she was tired.',
      'Birinin söylediğini aktarırken fiil genelde bir adım geriye gider: She said, "I am tired" → She said that she was tired.',
    ),
    right: "She said that she [was] tired.",
    wrong: "She said that she [is] tired.",
    notes: [
      note(
        "detail",
        lines(
          "Present → past, will → would, can → could. The pronouns change too: I → she. That is optional: She said she was tired.",
          "المضارع → الماضي، وwill → would، وcan → could. وتتغير الضمائر أيضاً: I → she. وthat اختيارية: She said she was tired.",
          "Presente → pasado, will → would, can → could. Los pronombres también cambian: I → she. That es opcional: She said she was tired.",
          "Geniş zaman → geçmiş, will → would, can → could. Zamirler de değişir: I → she. That isteğe bağlıdır: She said she was tired.",
        ),
        ["He said he [would] come.", "She told me she [could] swim."],
      ),
    ],
    items: [
      "He said that he [was] hungry.{am}",
      "She said that she [liked] this song.{like}",
      "He said that he [would] call me.{will}",
      "They said that they [could] help us.{can}",
      "She said that she [lived] in Erbil.{live}",
      "He said that he [didn't|did not] know.{don't}",
    ],
  },
  "a2-55": {
    idea: lines(
      "Although and though join two opposite ideas in one sentence: Although it was cold, we went out. However starts a new sentence.",
      "although وthough تجمعان فكرتين متعاكستين في جملة واحدة: Although it was cold, we went out. أما However فتبدأ جملة جديدة.",
      "Although y though unen dos ideas opuestas en una frase: Although it was cold, we went out. However empieza una frase nueva.",
      "Although ve though iki zıt fikri tek cümlede birleştirir: Although it was cold, we went out. However yeni bir cümle başlatır.",
    ),
    right: "[Although] it was cold, we went out.",
    wrong: "Although it was cold, [but] we went out.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use although and but together. One is enough: Although it was cold, we went out.",
          "لا نجمع although وbut معاً، تكفي واحدة منهما: Although it was cold, we went out.",
          "No uses although y but juntos. Basta con uno: Although it was cold, we went out.",
          "Although ile but'ı birlikte kullanma. Biri yeter: Although it was cold, we went out.",
        ),
        ["Although he was tired, he [worked]."],
      ),
      note(
        "detail",
        lines(
          "However goes at the start of a new sentence, with a comma: It was cold. However, we went out.",
          "تأتي however في بداية جملة جديدة وبعدها فاصلة: It was cold. However, we went out.",
          "However va al principio de una frase nueva, con coma: It was cold. However, we went out.",
          "However yeni bir cümlenin başında, virgülle gelir: It was cold. However, we went out.",
        ),
        ["It was cold. [However], we went out."],
      ),
    ],
    items: [
      "[Although] it was raining, we went to the park.",
      "She passed the exam, [although|though] she did not study much.",
      "It was a long trip. [However], we enjoyed it.",
      "[Although] he is rich, he is not happy.",
      "The food was cheap. [However], it was not good.",
      "I like the flat, [although|though] it is small.",
    ],
  },
  "a2-56": {
    idea: lines(
      "Say why with to + verb (I went out to buy bread), for + noun (for bread) or so that + a clause (so that I wouldn't be late).",
      "نذكر السبب بـ to + فعل (I went out to buy bread) أو for + اسم (for bread) أو so that + جملة (so that I wouldn't be late).",
      "Di para qué con to + verbo (I went out to buy bread), for + sustantivo (for bread) o so that + oración (so that I wouldn't be late).",
      "Amacı to + fiil (I went out to buy bread), for + isim (for bread) veya so that + cümle (so that I wouldn't be late) ile söyle.",
    ),
    right: "I left early [in order to] be on time.",
    wrong: "I left early [for] be on time.",
    notes: [
      note(
        "mistake",
        lines(
          "Use to + verb, or for + noun: I went to the shop to buy bread / for bread. Not for buy.",
          "نستعمل to + فعل أو for + اسم: I went to the shop to buy bread / for bread. وليس for buy.",
          "Usa to + verbo o for + sustantivo: I went to the shop to buy bread / for bread. No for buy.",
          "to + fiil ya da for + isim kullan: I went to the shop to buy bread / for bread. For buy değil.",
        ),
        ["I use a phone [to] take photos.", "I went there [for] bread."],
      ),
      note(
        "detail",
        lines(
          "In order to means the same as to, but it is a little more formal: I left early in order to be on time.",
          "in order to بمعنى to نفسه لكنها أكثر رسمية قليلاً: I left early in order to be on time.",
          "In order to significa lo mismo que to, pero es algo más formal: I left early in order to be on time.",
          "In order to, to ile aynı anlamdadır ama biraz daha resmîdir: I left early in order to be on time.",
        ),
        ["He saved money [in order to] buy a car."],
      ),
    ],
    items: [
      "I went to the shop [to] buy some milk.",
      "She studies hard [so that] she can pass the exam.",
      "He called me [to] say hello.",
      "We left early [so that] we wouldn't be late.",
      "I use this app [to] learn new words.",
      "I went to the bank [for] some money.",
    ],
  },
  "a2-57": {
    idea: lines(
      "After want, hope, plan, decide, promise and learn, use to + the base verb: I hope to travel. She decided to stay.",
      "بعد want وhope وplan وdecide وpromise وlearn نستعمل to + الفعل الأساسي: I hope to travel. She decided to stay.",
      "Después de want, hope, plan, decide, promise y learn usa to + verbo base: I hope to travel. She decided to stay.",
      "want, hope, plan, decide, promise ve learn'den sonra to + yalın fiil kullan: I hope to travel. She decided to stay.",
    ),
    right: "I hope [to] travel next year.",
    wrong: "I hope [travel] next year.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not use -ing after these verbs: I decided to go (not I decided going).",
          "لا نستعمل ‏-ing بعد هذه الأفعال: I decided to go (وليس I decided going).",
          "No uses -ing después de estos verbos: I decided to go (no I decided going).",
          "Bu fiillerden sonra -ing kullanma: I decided to go (I decided going değil).",
        ),
        ["He decided [to] leave.", "We plan [to] visit Basra."],
      ),
    ],
    items: [
      "I hope [to] see you soon.",
      "She decided [to] stay at home.",
      "We plan [to] visit Erbil in the summer.",
      "He promised [to] call me.",
      "They agreed [to] help us.",
      "She learned [to] swim when she was five.",
    ],
  },
  "a2-58": {
    idea: lines(
      "After tell, ask, want, advise, allow and invite, put a person and then to + verb: She told me to wait. I want you to come.",
      "بعد tell وask وwant وadvise وallow وinvite نضع الشخص ثم to + فعل: She told me to wait. I want you to come.",
      "Después de tell, ask, want, advise, allow e invite pon una persona y luego to + verbo: She told me to wait. I want you to come.",
      "tell, ask, want, advise, allow ve invite'tan sonra bir kişi, sonra to + fiil koy: She told me to wait. I want you to come.",
    ),
    right: "She told me [to] wait.",
    wrong: "She told [to] me wait.",
    notes: [
      note(
        "detail",
        lines(
          "The person goes before to: want him to come, ask her to help. Do not say want that he comes.",
          "يأتي الشخص قبل to: want him to come وask her to help. ولا نقول want that he comes.",
          "La persona va antes de to: want him to come, ask her to help. No digas want that he comes.",
          "Kişi to'dan önce gelir: want him to come, ask her to help. Want that he comes deme.",
        ),
        ["I want you [to] come.", "He asked her [to] help."],
      ),
    ],
    items: [
      "My mother told me [to] clean my room.",
      "I want you [to] come to my party.",
      "The teacher asked us [to] open the books.",
      "They invited me [to] join them.",
      "The doctor advised him [to] rest.",
      "She allowed the children [to] play outside.",
    ],
  },
  "a2-59": {
    idea: lines(
      "After like, love, hate and prefer you can use -ing or to + verb with almost the same meaning: I like swimming. I like to swim.",
      "بعد like وlove وhate وprefer يمكن استعمال ‏-ing أو to + فعل بالمعنى نفسه تقريباً: I like swimming. I like to swim.",
      "Después de like, love, hate y prefer puedes usar -ing o to + verbo con casi el mismo significado: I like swimming. I like to swim.",
      "like, love, hate ve prefer'den sonra -ing ya da to + fiil neredeyse aynı anlamda kullanılabilir: I like swimming. I like to swim.",
    ),
    right: "I prefer [to] walk.",
    wrong: "I prefer [walk].",
    notes: [
      note(
        "detail",
        lines(
          "With would like and would prefer, use only to: I would like to go. Not I would like going.",
          "مع would like وwould prefer نستعمل to فقط: I would like to go. وليس I would like going.",
          "Con would like y would prefer usa solo to: I would like to go. No I would like going.",
          "would like ve would prefer ile yalnızca to kullan: I would like to go. I would like going değil.",
        ),
        ["I would like [to] sit here.", "She would prefer [to] stay."],
      ),
    ],
    items: [
      "I prefer [to] walk rather than drive.",
      "She loves [to] sing in the shower.",
      "I would like [to] have some water.",
      "He hates [to] wait in a queue.",
      "I'd prefer [to] stay at home tonight.",
      "They like [to] play football on Fridays.",
    ],
  },
  "a2-60": {
    idea: lines(
      "A phrasal verb is a verb + a small word with its own meaning: look up = search, give up = stop, turn on = start a machine.",
      "الـ phrasal verb هو فعل + كلمة صغيرة لها معنى خاص: look up = يبحث وgive up = يتوقف عن المحاولة وturn on = يشغّل جهازاً.",
      "Un phrasal verb es un verbo + una palabra pequeña con significado propio: look up = buscar, give up = rendirse, turn on = encender.",
      "Phrasal verb, fiil + kendine özgü anlamı olan küçük bir sözcüktür: look up = aramak, give up = vazgeçmek, turn on = açmak.",
    ),
    right: "Please turn [on] the light.",
    wrong: "Please turn [in] the light.",
    notes: [
      note(
        "detail",
        lines(
          "Some phrasal verbs can be split by a noun: turn the light on. With a pronoun the pronoun must go in the middle: turn it on.",
          "بعض الـ phrasal verbs يمكن فصلها باسم: turn the light on. ومع الضمير يجب أن يكون في الوسط: turn it on.",
          "Algunos phrasal verbs se pueden separar con un sustantivo: turn the light on. Con un pronombre, este va en medio: turn it on.",
          "Bazı phrasal verb'ler isimle ayrılabilir: turn the light on. Zamirle zamir ortaya girer: turn it on.",
        ),
        ["Turn the light [on].", "Turn it [on]."],
      ),
      note(
        "detail",
        lines(
          "Learn the whole phrase as one word: get up, wake up, sit down, come back, look for, pick up.",
          "احفظ العبارة كاملة كأنها كلمة واحدة: get up وwake up وsit down وcome back وlook for وpick up.",
          "Aprende la frase entera como una sola palabra: get up, wake up, sit down, come back, look for, pick up.",
          "İfadeyi tek sözcük gibi bütün olarak öğren: get up, wake up, sit down, come back, look for, pick up.",
        ),
        ["I get [up] at six.", "Please sit [down]."],
      ),
    ],
    items: [
      "Please turn [on] the light. It is dark.",
      "I get [up] at six every morning.",
      "Can you look [after] my cat while I'm away?",
      "Please sit [down] and wait here.",
      "She is looking [for] her keys.",
      "He gave [up] smoking last year.",
    ],
  },
};
