/**
 * What the rules of the A2–B1 syllabus teach in the units on quantity, nouns and pronouns (a2-38 ... a2-44)
 * and on questions and replies (a2-45 ... a2-49). Same shape as teach.ts.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_A2_NOUNS: Readonly<Record<string, RuleTeach>> = {
  "a2-38": {
    idea: lines(
      "Use a few with things you can count (a few books). Use a little with things you cannot count (a little water).",
      "a few مع ما نعدّه (a few books)، وa little مع ما لا نعدّه (a little water).",
      "Usa a few con lo que se cuenta (a few books). Usa a little con lo incontable (a little water).",
      "Sayılabilenlerle a few kullan (a few books). Sayılamayanlarla a little kullan (a little water).",
    ),
    right: "I have [a few] books.",
    wrong: "I have [a little] books.",
    notes: [
      note(
        "exception",
        lines(
          "Without a, few and little mean almost none, and they sound negative: Few people came.",
          "من دون a تعني few وlittle «تقريباً لا شيء» ولها معنى سلبي: Few people came.",
          "Sin a, few y little significan casi nada y suenan negativos: Few people came.",
          "a olmadan few ve little hemen hemen hiç demektir ve olumsuz duyulur: Few people came.",
        ),
        ["[Few] people came.", "I have [little] time."],
      ),
    ],
    items: [
      "There are [a few] eggs in the fridge.",
      "I need [a little] sugar for my tea.",
      "She has [a few] friends in this city.",
      "Can I have [a little] water, please?",
      "We have [a few] minutes before the bus comes.",
      "There is [a little] milk left.",
    ],
  },
  "a2-39": {
    idea: lines(
      "Join some-, any-, no- or every- with -one, -body, -thing or -where: something, anyone, nobody, everywhere. Write them as one word.",
      "نضم some- وany- وno- وevery- إلى ‏-one أو ‏-body أو ‏-thing أو ‏-where: something وanyone وnobody وeverywhere. ونكتبها كلمة واحدة.",
      "Une some-, any-, no- o every- con -one, -body, -thing o -where: something, anyone, nobody, everywhere. Se escriben juntas.",
      "some-, any-, no- veya every- ile -one, -body, -thing veya -where birleşir: something, anyone, nobody, everywhere. Tek sözcük yazılır.",
    ),
    right: "I want to drink [something].",
    wrong: "I want to drink [some thing].",
    notes: [
      note(
        "detail",
        lines(
          "Some- in positive sentences and offers, any- in questions and negatives: I need something. Do you need anything?",
          "some- في الجمل المثبتة والعروض، وany- في الأسئلة والنفي: I need something. Do you need anything؟",
          "Some- en frases afirmativas y ofrecimientos, any- en preguntas y negaciones: I need something. Do you need anything?",
          "Some- olumlu cümle ve tekliflerde, any- soru ve olumsuzda: I need something. Do you need anything?",
        ),
        ["I saw [someone].", "I didn't see [anyone]."],
      ),
      note(
        "mistake",
        lines(
          "Nobody and nothing are already negative, so do not add not: I know nothing (not I don't know nothing).",
          "nobody وnothing منفيتان أصلاً فلا نضيف not: I know nothing (وليس I don't know nothing).",
          "Nobody y nothing ya son negativos, no añadas not: I know nothing (no I don't know nothing).",
          "Nobody ve nothing zaten olumsuzdur, not ekleme: I know nothing (I don't know nothing değil).",
        ),
        ["I know [nothing].", "[Nobody] came."],
      ),
    ],
    items: [
      "I'm thirsty. I want to drink [something].",
      "Is there [anyone|anybody] at home?",
      "[Nobody|No one] knows the answer. It is too difficult.",
      "I didn't see [anything] at the shop.",
      "[Everyone|Everybody] is here. Let's start.",
      "I can't find my keys [anywhere].",
    ],
  },
  "a2-40": {
    idea: lines(
      "All and most go with plural nouns (all students). Both is for two. Every and each go with a singular noun: every day.",
      "all وmost مع الجمع (all students). وboth للاثنين. وevery وeach مع المفرد: every day.",
      "All y most van con plurales (all students). Both es para dos. Every y each van con singular: every day.",
      "All ve most çoğul isimle gelir (all students). Both ikisi içindir. Every ve each tekil isimle gelir: every day.",
    ),
    right: "[Every] student has a book.",
    wrong: "Every [students] have a book.",
    notes: [
      note(
        "detail",
        lines(
          "Every and each take a singular verb: every day is new. Both takes a plural verb: both brothers are here.",
          "every وeach يأخذان فعلاً مفرداً: every day is new. وboth تأخذ فعلاً جمعاً: both brothers are here.",
          "Every y each llevan verbo singular: every day is new. Both lleva verbo plural: both brothers are here.",
          "Every ve each tekil fiil alır: every day is new. Both çoğul fiil alır: both brothers are here.",
        ),
        ["[Both] brothers are here.", "[All] my friends came."],
      ),
    ],
    items: [
      "[Every|Each] morning I drink a glass of water.",
      "[Both] my parents work in a hospital.",
      "[All] the students passed the exam.",
      "[Most] people like music.",
      "[Each|Every] student has a different book.",
      "She has two sisters. [Both] are teachers.",
    ],
  },
  "a2-41": {
    idea: lines(
      "Do not use the or a with general plural and uncountable nouns: I like music. Dogs are loyal. Also: at school, by bus, in bed.",
      "لا نستعمل the أو a مع الجمع العام وغير المعدود: I like music. Dogs are loyal. وكذلك: at school وby bus وin bed.",
      "No uses the ni a con plurales generales ni incontables: I like music. Dogs are loyal. También: at school, by bus, in bed.",
      "Genel çoğul ve sayılamayan isimlerle the veya a kullanma: I like music. Dogs are loyal. Ayrıca: at school, by bus, in bed.",
    ),
    right: "I like [music].",
    wrong: "I like [the music].",
    notes: [
      note(
        "mistake",
        lines(
          "Some languages use the for general things. English does not: I like music (not I like the music).",
          "العربية تستعمل «ال» للأشياء العامة (أحب الموسيقى). أما الإنجليزية فلا: I like music (وليس I like the music).",
          "El español usa el artículo para lo general (me gusta la música). El inglés no: I like music (no I like the music).",
          "Genel şeyler için the kullanılmaz: I like music (I like the music değil).",
        ),
        ["I like [music].", "[Dogs] are loyal."],
      ),
      note(
        "detail",
        lines(
          "Fixed phrases have no the: go to school, go to bed, go by bus, at home, at work.",
          "عبارات ثابتة بلا the: go to school وgo to bed وgo by bus وat home وat work.",
          "Expresiones fijas sin the: go to school, go to bed, go by bus, at home, at work.",
          "Sabit kalıplarda the yoktur: go to school, go to bed, go by bus, at home, at work.",
        ),
        ["She is at [school].", "I go to work by [bus]."],
      ),
    ],
    items: [
      "I love [music]. I listen to it every day.{music}",
      "I like [dogs], but I don't like cats.{dog}",
      "My sister is at [school] now.{school}",
      "We go to work by [bus].{bus}",
      "He is in [bed]. He is ill.{bed}",
      "[Water] is important for life.{water}",
    ],
  },
  "a2-42": {
    idea: lines(
      "Use the for things there is only one of: the sun, the moon, the world, the internet. Also with names like the UK.",
      "نستعمل the لما هو وحيد: the sun وthe moon وthe world وthe internet. وكذلك مع أسماء مثل the UK.",
      "Usa the para cosas únicas: the sun, the moon, the world, the internet. También con nombres como the UK.",
      "Tek olan şeyler için the kullan: the sun, the moon, the world, the internet. the UK gibi adlarda da kullanılır.",
    ),
    right: "[The] sun is very hot today.",
    wrong: "[A] sun is very hot today.",
    notes: [
      note(
        "detail",
        lines(
          "No the for most countries and cities (Iraq, Basra). But the for plural names and unions: the Netherlands, the UK, the United States.",
          "بلا the مع معظم الدول والمدن (Iraq وBasra). لكن مع the الأسماء الجمع والاتحادات: the Netherlands وthe UK وthe United States.",
          "Sin the con la mayoría de países y ciudades (Iraq, Basra). Pero con the los nombres plurales y uniones: the Netherlands, the UK, the United States.",
          "Çoğu ülke ve şehirde the yoktur (Iraq, Basra). Ama çoğul adlarda ve birliklerde the vardır: the Netherlands, the UK, the United States.",
        ),
        ["I live in [Iraq].", "She lives in [the] UK."],
      ),
    ],
    items: [
      "[The] moon goes around the Earth.",
      "I look for information on [the] internet.",
      "Many people live in [the] UK.",
      "[The] sun rises in the east.",
      "Look at the stars. [The] sky is clear tonight.",
      "She wants to travel around [the] world.",
    ],
  },
  "a2-43": {
    idea: lines(
      "Use myself, himself, themselves… when the doer and the receiver are the same person. Each other means one another.",
      "نستعمل myself وhimself وthemselves… حين يكون الفاعل والمفعول شخصاً واحداً. وeach other تعني «بعضهم بعضاً».",
      "Usa myself, himself, themselves… cuando quien hace y quien recibe es la misma persona. Each other significa el uno al otro.",
      "Yapan ve eylemden etkilenen aynı kişiyse myself, himself, themselves… kullan. Each other karşılıklı demektir.",
    ),
    right: "She cut [herself].",
    wrong: "She cut [her].",
    notes: [
      note(
        "detail",
        lines(
          "Each other is for two or more people doing the same thing to one another: They love each other.",
          "each other لشخصين أو أكثر يفعل كلٌّ منهم الشيء للآخر: They love each other.",
          "Each other es para dos o más personas que se hacen lo mismo entre sí: They love each other.",
          "Each other, aynı şeyi birbirine yapan iki ya da daha fazla kişi içindir: They love each other.",
        ),
        ["They love [each other].", "We help [each other]."],
      ),
    ],
    items: [
      "Be careful! You will hurt [yourself].",
      "She looked at [herself] in the mirror.",
      "I taught [myself] to play the guitar.",
      "The children enjoyed [themselves] at the park.",
      "They love [each other|one another] very much.",
      "We made dinner [ourselves].",
    ],
  },
  "a2-44": {
    idea: lines(
      "Use one or ones so you do not repeat a noun: I like the red one. I prefer the blue ones.",
      "نستعمل one أو ones لئلا نكرر الاسم: I like the red one. I prefer the blue ones.",
      "Usa one u ones para no repetir un sustantivo: I like the red one. I prefer the blue ones.",
      "Bir ismi tekrar etmemek için one veya ones kullan: I like the red one. I prefer the blue ones.",
    ),
    right: "I like the red [one].",
    wrong: "I like the red [ones].",
    notes: [
      note(
        "detail",
        lines(
          "One replaces a singular noun and ones replaces a plural one: Which shoes? The black ones.",
          "one تحل محل اسم مفرد وones تحل محل اسم جمع: Which shoes؟ The black ones.",
          "One sustituye a un sustantivo singular y ones a uno plural: Which shoes? The black ones.",
          "One tekil, ones çoğul ismin yerini tutar: Which shoes? The black ones.",
        ),
        ["Which shoes? The black [ones].", "Which bag? The big [one]."],
      ),
    ],
    items: [
      "I don't like this shirt. I prefer the blue [one].",
      "These apples are old. Please give me the fresh [ones].",
      "My car is old, but my brother has a new [one].",
      "Which cup is yours? The small [one].",
      "I don't like these shoes. I like the black [ones].",
      "Do you want the big pizza or the small [one]?",
    ],
  },
  "a2-45": {
    idea: lines(
      "A tag asks for agreement. Positive sentence → negative tag: It's cold, isn't it? Negative sentence → positive tag: You can't swim, can you?",
      "الـ tag في آخر الجملة يطلب الموافقة. جملة مثبتة → tag منفي: It's cold, isn't it؟ جملة منفية → tag مثبت: You can't swim, can you؟",
      "Un tag al final pide acuerdo. Frase afirmativa → tag negativo: It's cold, isn't it? Frase negativa → tag positivo: You can't swim, can you?",
      "Sondaki tag onay ister. Olumlu cümle → olumsuz tag: It's cold, isn't it? Olumsuz cümle → olumlu tag: You can't swim, can you?",
    ),
    right: "It's cold, [isn't] it?",
    wrong: "It's cold, [is] it?",
    notes: [
      note(
        "detail",
        lines(
          "The tag repeats the helper verb of the sentence: is → isn't, can → can't. With I am the tag is aren't I?",
          "يكرر الـ tag الفعل المساعد في الجملة: is → isn't وcan → can't. ومع I am يكون الـ tag هو aren't I؟",
          "El tag repite el auxiliar de la frase: is → isn't, can → can't. Con I am el tag es aren't I?",
          "Tag, cümlenin yardımcı fiilini tekrarlar: is → isn't, can → can't. I am ile tag aren't I? olur.",
        ),
        ["She can swim, [can't] she?", "I'm late, [aren't] I?"],
      ),
      note(
        "detail",
        lines(
          "After a plain verb use do, does or did: You like tea, don't you? He left, didn't he?",
          "بعد فعل عادي نستعمل do أو does أو did: You like tea, don't you؟ He left, didn't he؟",
          "Después de un verbo normal usa do, does o did: You like tea, don't you? He left, didn't he?",
          "Düz bir fiilden sonra do, does veya did kullan: You like tea, don't you? He left, didn't he?",
        ),
        ["You like tea, [don't] you?", "He left, [didn't] he?"],
      ),
    ],
    items: [
      "It's a nice day, [isn't] it?",
      "You like coffee, [don't] you?",
      "She can drive, [can't] she?",
      "They aren't here, [are] they?",
      "He lives in Erbil, [doesn't] he?",
      "You didn't call him, [did] you?",
    ],
  },
  "a2-46": {
    idea: lines(
      "To be polite, start with Could you tell me… or Do you know… and keep the normal word order: Do you know where the bank is?",
      "لنكون مهذبين نبدأ بـ Could you tell me… أو Do you know… ونبقي ترتيب الجملة العادي: Do you know where the bank is؟",
      "Para ser cortés, empieza con Could you tell me… o Do you know… y mantén el orden normal: Do you know where the bank is?",
      "Kibar olmak için Could you tell me… veya Do you know… ile başla ve normal sözcük sırasını koru: Do you know where the bank is?",
    ),
    right: "Do you know where [the bank is]?",
    wrong: "Do you know where [is the bank]?",
    notes: [
      note(
        "detail",
        lines(
          "No do/does/did after the question word: I don't know what she wants (not what does she want). For yes/no questions use if.",
          "لا do/does/did بعد كلمة السؤال: I don't know what she wants (وليس what does she want). ولأسئلة نعم/لا نستعمل if.",
          "Sin do/does/did tras la palabra interrogativa: I don't know what she wants (no what does she want). Para sí/no usa if.",
          "Soru sözcüğünden sonra do/does/did yok: I don't know what she wants (what does she want değil). Evet/hayır soruları için if kullan.",
        ),
        ["I don't know what she [wants].", "Do you know [if] she is here?"],
      ),
    ],
    items: [
      "Do you know where she [lives]?{live}",
      "Could you tell me what time the film [starts]?{start}",
      "I don't know why he [is] late.",
      "Can you tell me how much this [costs]?{cost}",
      "Do you know [if|whether] she is at home?",
      "Could you tell me where the toilets [are]?",
    ],
  },
  "a2-47": {
    idea: lines(
      "When the question word is the subject, do not use do/does/did: Who called you? When it is the object, use them: Who did you call?",
      "إذا كانت كلمة السؤال هي الفاعل فلا نستعمل do/does/did: Who called you؟ وإذا كانت المفعول نستعملها: Who did you call؟",
      "Si la palabra interrogativa es el sujeto, no uses do/does/did: Who called you? Si es el objeto, sí: Who did you call?",
      "Soru sözcüğü özneyse do/does/did kullanma: Who called you? Nesneyse kullan: Who did you call?",
    ),
    right: "Who [called] you?",
    wrong: "Who [did call] you?",
    notes: [
      note(
        "detail",
        lines(
          "Subject question: the answer is the doer (Ali called me). Object question: the answer is the receiver (I called Ali).",
          "سؤال عن الفاعل: الجواب هو من فعل (Ali called me). وسؤال عن المفعول: الجواب هو من وقع عليه الفعل (I called Ali).",
          "Pregunta por el sujeto: la respuesta es quien hace (Ali called me). Pregunta por el objeto: la respuesta es quien recibe (I called Ali).",
          "Özne sorusu: yanıt yapan kişidir (Ali called me). Nesne sorusu: yanıt eylemi alan kişidir (I called Ali).",
        ),
        ["Who [lives] here?", "Who [does] she love?"],
      ),
    ],
    items: [
      "Who [called] you last night?{call}",
      "Who did you [call] last night?{call}",
      "What [happened] at the party?{happen}",
      "What did he [say] to you?{say}",
      "Who [lives] in that house?{live}",
      "Who did she [meet] at the airport?{meet}",
    ],
  },
  "a2-48": {
    idea: lines(
      "Agree with a positive sentence by So + helper verb + I: I like tea. So do I. Agree with a negative one by Neither + helper verb + I.",
      "نوافق على جملة مثبتة بـ So + فعل مساعد + I: I like tea. So do I. وعلى جملة منفية بـ Neither + فعل مساعد + I.",
      "Se está de acuerdo con una frase afirmativa con So + auxiliar + I: I like tea. So do I. Con una negativa: Neither + auxiliar + I.",
      "Olumlu cümleye So + yardımcı fiil + I ile katıl: I like tea. So do I. Olumsuz cümleye Neither + yardımcı fiil + I ile katıl.",
    ),
    right: "I like tea. [So] do I.",
    wrong: "I like tea. [Neither] do I.",
    notes: [
      note(
        "detail",
        lines(
          "Use the same helper verb as the first sentence: I am happy. So am I. I can swim. So can I. I went. So did I.",
          "نستعمل الفعل المساعد نفسه في الجملة الأولى: I am happy. So am I. I can swim. So can I. I went. So did I.",
          "Usa el mismo auxiliar de la primera frase: I am happy. So am I. I can swim. So can I. I went. So did I.",
          "İlk cümledeki yardımcı fiili kullan: I am happy. So am I. I can swim. So can I. I went. So did I.",
        ),
        ["I am happy. [So] am I.", "I can't swim. [Neither] can I."],
      ),
    ],
    items: [
      "I love football. [So] do I.",
      "I don't like coffee. [Neither] do I.",
      "She is tired. [So] am I.",
      "I can't swim. [Neither] can she.",
      "He went to Basra. [So] did I.",
      "We haven't finished. [Neither] have they.",
    ],
  },
  "a2-49": {
    idea: lines(
      "Make a suggestion with Why don't we + verb, How about + -ing, or What about + -ing: Why don't we go out? How about going out?",
      "نقترح بـ Why don't we + فعل أو How about + ‏-ing أو What about + ‏-ing: Why don't we go out؟ How about going out؟",
      "Haz una sugerencia con Why don't we + verbo, How about + -ing o What about + -ing: Why don't we go out? How about going out?",
      "Öneri için Why don't we + fiil, How about + -ing veya What about + -ing kullan: Why don't we go out? How about going out?",
    ),
    right: "How about [going] out?",
    wrong: "How about [go] out?",
    notes: [
      note(
        "detail",
        lines(
          "After How about and What about, use -ing or a noun: How about eating out? What about pizza?",
          "بعد How about وWhat about نستعمل ‏-ing أو اسماً: How about eating out؟ What about pizza؟",
          "Después de How about y What about, usa -ing o un sustantivo: How about eating out? What about pizza?",
          "How about ve What about'tan sonra -ing ya da isim kullan: How about eating out? What about pizza?",
        ),
        ["How about [eating] out?", "What about [pizza]?"],
      ),
    ],
    items: [
      "How about [going] to the cinema tonight?{go}",
      "Why don't we [have|eat] lunch together?",
      "What about [asking] Sara for help?{ask}",
      "Why [don't] we visit the museum?",
      "How [about] a cup of tea?",
      "Why don't we [try] the new restaurant?{try}",
    ],
  },
};
