/**
 * What the rules added to the A1 syllabus teach (syllabus.ts: a1-25 ... a1-45), in the same shape as the
 * first 39 (teach.ts): the idea in simple English and in Arabic, Spanish and Turkish, a right and a wrong
 * sentence with the grammar part in [brackets], the notes of page two, and the prepared sentences a rule is
 * taught and practised with when the learner's story does not show it (items: see items.ts).
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_A1: Readonly<Record<string, RuleTeach>> = {
  "a1-25": {
    idea: lines(
      "A subject pronoun says who does the action: I, you, he, she, it, we, they.",
      "ضمير الفاعل يقول من يفعل الفعل: I وyou وhe وshe وit وwe وthey.",
      "El pronombre sujeto dice quién hace la acción: I, you, he, she, it, we, they.",
      "Özne zamiri eylemi kimin yaptığını söyler: I, you, he, she, it, we, they.",
    ),
    right: "[She] is a teacher.",
    wrong: "[Is] a teacher.",
    notes: [
      note(
        "mistake",
        lines(
          "Always say the subject. Some languages can leave it out, English cannot: She is happy (not Is happy).",
          "لا بدّ من ذكر الفاعل. العربية قد تحذفه أما الإنجليزية فلا: She is happy (وليس Is happy).",
          "Di siempre el sujeto. En español se puede omitir, en inglés no: She is happy (no Is happy).",
          "Özneyi her zaman söyle. Türkçede düşebilir, İngilizcede düşmez: She is happy (Is happy değil).",
        ),
        ["[She] is happy.", "[They] live here."],
      ),
    ],
    items: [
      "Sara is my sister. [She] is a nurse.",
      "Ali is my brother. [He] is a student.",
      "I have a cat. [It] is white.",
      "Layla and I are friends. [We] study together.",
      "My parents live in Basra. [They] are happy there.",
      "Are you hungry? Yes, [I] am.",
    ],
  },
  "a1-26": {
    idea: lines(
      "To say no with be, put not after it: I am not, he is not (isn't), they are not (aren't).",
      "للنفي مع be نضع not بعدها: I am not، وhe is not (isn't)، وthey are not (aren't).",
      "Para negar con be, pon not después: I am not, he is not (isn't), they are not (aren't).",
      "be ile olumsuz yapmak için arkasına not koy: I am not, he is not (isn't), they are not (aren't).",
    ),
    right: "She [isn't] at home.",
    wrong: "She [no] at home.",
    notes: [
      note(
        "exception",
        lines(
          "There is no amn't. Say I'm not.",
          "لا توجد amn't. نقول I'm not.",
          "No existe amn't. Di I'm not.",
          "amn't diye bir şey yok. I'm not de.",
        ),
        ["[I'm not] tired."],
      ),
      note(
        "mistake",
        lines(
          "Do not use don't with be: She isn't tired (not She doesn't tired).",
          "لا نستعمل don't مع be: She isn't tired (وليس She doesn't tired).",
          "No uses don't con be: She isn't tired (no She doesn't tired).",
          "be ile don't kullanma: She isn't tired (She doesn't tired değil).",
        ),
        ["She [isn't] tired."],
      ),
    ],
    items: [
      "Ali is at school. He [isn't|is not] at home.",
      "The shops are closed. They [aren't|are not] open.",
      "[I am not|I'm not] hungry. I want some tea.",
      "My sister is a nurse. She [isn't|is not] a teacher.",
      "We [aren't|are not] late. The class starts at nine.",
      "It [isn't|is not] cold today.",
    ],
  },
  "a1-27": {
    idea: lines(
      "To ask a question with be, put am, is or are first: Are you ready? A short answer: Yes, I am. No, I'm not.",
      "للسؤال مع be نضع am أو is أو are في البداية: Are you ready؟ والجواب القصير: Yes, I am. أو No, I'm not.",
      "Para preguntar con be, pon am, is o are al principio: Are you ready? Respuesta corta: Yes, I am. No, I'm not.",
      "be ile soru için am, is veya are'ı başa koy: Are you ready? Kısa yanıt: Yes, I am. No, I'm not.",
    ),
    right: "[Are] you ready?",
    wrong: "You [are] ready?",
    notes: [
      note(
        "detail",
        lines(
          "In a short answer with yes, do not shorten: Yes, I am (not Yes, I'm).",
          "في الجواب القصير بـ yes لا نختصر: Yes, I am (وليس Yes, I'm).",
          "En una respuesta corta con yes no se contrae: Yes, I am (no Yes, I'm).",
          "yes ile kısa yanıtta kısaltma yapılmaz: Yes, I am (Yes, I'm değil).",
        ),
        ["Are you tired? Yes, I [am]."],
      ),
    ],
    items: [
      "[Are] you from Iraq?",
      "[Is] she a doctor?",
      "[Am] I late?",
      "[Are] they at school today?",
      "Is he your brother? Yes, he [is].",
      "Are you tired? No, [I'm not|I am not].",
    ],
  },
  "a1-28": {
    idea: lines(
      "Every English sentence needs a verb. Do not drop be: She is at home, not She at home.",
      "كل جملة إنجليزية تحتاج فعلاً. لا نحذف be: She is at home (وليس She at home).",
      "Toda frase en inglés necesita un verbo. No omitas be: She is at home (no She at home).",
      "Her İngilizce cümlenin bir fiili olmalı. be'yi atma: She is at home (She at home değil).",
    ),
    right: "She [is] at home.",
    wrong: "[She at] home.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not drop be. Some languages leave it out in the present, but English needs it: The house is big (not The house big).",
          "العربية لا تقول «is» في المضارع: هي في البيت. أما الإنجليزية فتحتاجها: She is in the house.",
          "No omitas be. En otros idiomas se omite en presente, pero el inglés lo necesita: The house is big (no The house big).",
          "be'yi atma. Bazı dillerde şimdiki zamanda düşer ama İngilizcede gerekir: The house is big (The house big değil).",
        ),
        ["The house [is] big.", "We [are] happy."],
      ),
    ],
    items: [
      "My mother [is] in the kitchen.",
      "The children [are] at school.",
      "I [am] very tired today.",
      "Baghdad [is] a big city.",
      "You [are] right.",
      "The tea [is] hot.",
    ],
  },
  "a1-29": {
    idea: lines(
      "Use be for age and feelings: I am 20. I am hungry. (not I have 20, not I have hunger).",
      "نستعمل be للعمر والمشاعر: I am 20، I am hungry (وليس I have).",
      "Usa be para la edad y las sensaciones: I am 20. I am hungry. (no I have 20).",
      "Yaş ve duygular için be kullan: I am 20. I am hungry. (I have 20 değil).",
    ),
    right: "I [am] hungry.",
    wrong: "I [have] hungry.",
    notes: [
      note(
        "mistake",
        lines(
          "Many languages say «I have 20 years» or «I have hunger». English uses be: I am 20. I am hungry.",
          "بالعربية نقول «عندي 20 سنة» أما بالإنجليزية فنقول I am 20.",
          "En español se dice «tengo 20 años» o «tengo hambre», pero en inglés se usa be: I am 20. I am hungry.",
          "İngilizcede yaş ve duygular için have değil, be kullanılır: I am 20. I am hungry.",
        ),
        ["I [am] twenty years old.", "She [is] thirsty."],
      ),
    ],
    items: [
      "Layla [is] ten years old.",
      "I [am] thirsty. I want some water.",
      "It is winter and we [are] cold.",
      "My brother [is] afraid of dogs.",
      "[Are] you hungry?",
      "They [are] tired after the trip.",
    ],
  },
  "a1-30": {
    idea: lines(
      "Use it for things, animals and weather: It is a table. It is a cat. It is cold.",
      "نستعمل it للأشياء والحيوانات والطقس: It is a table. It is a cat. It is cold.",
      "Usa it para cosas, animales y el tiempo: It is a table. It is a cat. It is cold.",
      "Eşyalar, hayvanlar ve hava durumu için it kullan: It is a table. It is a cat. It is cold.",
    ),
    right: "I have a car. [It] is old.",
    wrong: "I have a car. [She] is old.",
    notes: [
      note(
        "mistake",
        lines(
          "Some languages call every thing he or she. In English a thing is it, not he or she.",
          "في العربية كل شيء هو «هو» أو «هي». أما في الإنجليزية فالشيء it وليس he أو she.",
          "En español las cosas son «él» o «ella» (el libro, la mesa). En inglés una cosa es it, no he ni she.",
          "İngilizcede bir şey it'tir. He ve she yalnızca kişiler için kullanılır.",
        ),
        ["The sun is hot. [It] is big.", "This is my phone. [It] is new."],
      ),
    ],
    items: [
      "I have a laptop. [It] is new.",
      "Look at the moon. [It] is beautiful.",
      "My cat is small. [It] sleeps all day.",
      "The weather is nice. [It] is sunny.",
      "I like this book. [It] is very interesting.",
      "We have a garden. [It] is behind the house.",
    ],
  },
  "a1-31": {
    idea: lines(
      "Countable nouns can be counted: one apple, two apples. Uncountable nouns cannot: water, rice, money, music. They have no plural and no a/an.",
      "الأسماء المعدودة نعدّها: one apple وtwo apples. وغير المعدودة لا نعدّها: water وrice وmoney وmusic. ليس لها جمع ولا a/an.",
      "Los sustantivos contables se cuentan: one apple, two apples. Los incontables no: water, rice, money, music. No tienen plural ni a/an.",
      "Sayılabilen isimler sayılır: one apple, two apples. Sayılamayanlar sayılmaz: water, rice, money, music. Çoğulları ve a/an'ları yoktur.",
    ),
    right: "I have two [apples].",
    wrong: "I have two [waters].",
    notes: [
      note(
        "exception",
        lines(
          "Some nouns look plural but are uncountable: news, homework, information, furniture. They take is, not are.",
          "بعض الأسماء تبدو جمعاً لكنها غير معدودة: news وhomework وinformation وfurniture. وتأخذ is وليس are.",
          "Algunos sustantivos parecen plurales pero son incontables: news, homework, information, furniture. Llevan is, no are.",
          "Bazı isimler çoğul gibi görünür ama sayılamaz: news, homework, information, furniture. is alır, are almaz.",
        ),
        ["The [news] is good.", "My [homework] is easy."],
      ),
      note(
        "mistake",
        lines(
          "Do not add -s to an uncountable noun: I need some information (not informations).",
          "لا نضيف -s لغير المعدود: I need some information (وليس informations).",
          "No añadas -s a un sustantivo incontable: I need some information (no informations).",
          "Sayılamayan isme -s ekleme: I need some information (informations değil).",
        ),
        ["I need some [information]."],
      ),
    ],
    items: [
      "The news [is] very good today.",
      "The money [is] in my bag.",
      "My homework [is] difficult.",
      "Rice [is] cheap in Iraq.",
      "The furniture [is] new.",
      "I have three [books].{book}",
    ],
  },
  "a1-32": {
    idea: lines(
      "A possessive pronoun stands alone and shows who owns something: mine, yours, his, hers, ours, theirs. It is mine.",
      "ضمير الملكية يقف وحده ويبيّن لمن الشيء: mine وyours وhis وhers وours وtheirs. It is mine.",
      "El pronombre posesivo va solo y muestra de quién es algo: mine, yours, his, hers, ours, theirs. It is mine.",
      "İyelik zamiri tek başına durur ve bir şeyin kime ait olduğunu gösterir: mine, yours, his, hers, ours, theirs. It is mine.",
    ),
    right: "This bag is [mine].",
    wrong: "This bag is [my].",
    notes: [
      note(
        "mistake",
        lines(
          "Do not put a noun after mine or yours: It is my bag, or It is mine (not It is mine bag).",
          "لا نضع اسماً بعد mine وyours: It is my bag أو It is mine (وليس It is mine bag).",
          "No pongas un sustantivo después de mine o yours: It is my bag, o It is mine (no It is mine bag).",
          "mine ya da yours'tan sonra isim koyma: It is my bag ya da It is mine (It is mine bag değil).",
        ),
        ["It is [my] bag.", "It is [mine]."],
      ),
    ],
    items: [
      "This is my phone. It is [mine].",
      "That is your coat. It is [yours].",
      "We bought this car. It is [ours].",
      "Sara has a red bag. The red bag is [hers].",
      "Ali and Omar have a dog. The dog is [theirs].",
      "Tom has a new bike. The new bike is [his].",
    ],
  },
  "a1-33": {
    idea: lines(
      "An adjective goes before the noun and never changes: a big house, two big houses.",
      "الصفة تأتي قبل الاسم ولا تتغير: a big house وtwo big houses.",
      "El adjetivo va antes del sustantivo y no cambia: a big house, two big houses.",
      "Sıfat ismin önüne gelir ve değişmez: a big house, two big houses.",
    ),
    right: "I have a [big] house.",
    wrong: "I have a house [big].",
    notes: [
      note(
        "mistake",
        lines(
          "In some languages the adjective comes after the noun. In English it comes before: a big house (not a house big).",
          "في العربية تأتي الصفة بعد الاسم (بيت كبير). أما في الإنجليزية فقبله: a big house.",
          "En español el adjetivo suele ir después del sustantivo (una casa grande). En inglés va antes: a big house.",
          "İngilizcede sıfat her zaman isimden önce gelir: a big house (a house big değil).",
        ),
        ["She has a [new] car.", "They live in a [small] city."],
      ),
      note(
        "exception",
        lines(
          "An adjective has no plural: two big houses (not two bigs houses).",
          "الصفة بلا جمع: two big houses (وليس two bigs houses).",
          "El adjetivo no tiene plural: two big houses (no two bigs houses).",
          "Sıfatın çoğulu yoktur: two big houses (two bigs houses değil).",
        ),
        ["Two [tall] men."],
      ),
    ],
    items: [
      "The house is big. It is a [big] house.",
      "The tea is hot. I drink [hot] tea.",
      "My sister is young. She is a [young] teacher.",
      "The car is red. We have a [red] car.",
      "These shoes are new. I like my [new] shoes.",
      "The city is old. It is an [old] city.",
    ],
  },
  "a1-34": {
    idea: lines(
      "An adverb of manner says how we do something. Add -ly to the adjective: slow → slowly. Good → well.",
      "ظرف الحال يقول كيف نفعل الشيء. نضيف -ly للصفة: slow → slowly. والاستثناء good → well.",
      "Un adverbio de modo dice cómo hacemos algo. Añade -ly al adjetivo: slow → slowly. Good → well.",
      "Tarz zarfı bir şeyi nasıl yaptığımızı söyler. Sıfata -ly ekle: slow → slowly. Good → well.",
    ),
    right: "She speaks slow[ly].",
    wrong: "She speaks [slow].",
    notes: [
      note(
        "exception",
        lines(
          "Good becomes well, not goodly: She sings well.",
          "good تصير well وليس goodly: She sings well.",
          "Good pasa a well, no goodly: She sings well.",
          "good, well olur, goodly olmaz: She sings well.",
        ),
        ["She sings [well].", "He plays [well]."],
      ),
      note(
        "detail",
        lines(
          "Some adverbs have the same form as the adjective: fast, hard, early, late.",
          "بعض الظروف بنفس شكل الصفة: fast وhard وearly وlate.",
          "Algunos adverbios tienen la misma forma que el adjetivo: fast, hard, early, late.",
          "Bazı zarflar sıfatla aynı biçimdedir: fast, hard, early, late.",
        ),
        ["He runs [fast]."],
      ),
    ],
    items: [
      "He is a careful driver. He drives [carefully].",
      "She is a quiet girl. She speaks [quietly].",
      "My brother is a good player. He plays [well].",
      "The teacher is slow. He writes [slowly].",
      "They are happy. They sing [happily].",
      "The test is easy. I answer [easily].",
    ],
  },
  "a1-35": {
    idea: lines(
      "Have got means have. Use have got with I, you, we, they and has got with he, she, it: I have got a car. She has got a dog.",
      "have got بمعنى have. نستعمل have got مع I وyou وwe وthey وhas got مع he وshe وit: I have got a car. She has got a dog.",
      "Have got significa have. Usa have got con I, you, we, they y has got con he, she, it: I have got a car. She has got a dog.",
      "Have got, have ile aynı anlamdadır. I, you, we, they ile have got; he, she, it ile has got kullan: I have got a car. She has got a dog.",
    ),
    right: "She [has] got a dog.",
    wrong: "She [have] got a dog.",
    notes: [
      note(
        "detail",
        lines(
          "Short forms: I've got, she's got. For no: I haven't got, she hasn't got.",
          "الاختصارات: I've got وshe's got. والنفي: I haven't got وshe hasn't got.",
          "Formas cortas: I've got, she's got. Para negar: I haven't got, she hasn't got.",
          "Kısa biçimler: I've got, she's got. Olumsuz: I haven't got, she hasn't got.",
        ),
        ["She['s] got a cat.", "I [haven't] got a car."],
      ),
    ],
    items: [
      "I [have] got two brothers.",
      "She [has] got a new phone.",
      "We walk to work. We [haven't|have not] got a car.",
      "[Have] you got a pen?",
      "He is poor. He [hasn't|has not] got any money.",
      "They [have] got a big house.",
    ],
  },
  "a1-36": {
    idea: lines(
      "Use when for time, why for a reason and how for the way: When do you start? Why are you late? How are you?",
      "when للوقت وwhy للسبب وhow للطريقة أو الحال: When do you start؟ Why are you late؟ How are you؟",
      "Usa when para el tiempo, why para la razón y how para el modo: When do you start? Why are you late? How are you?",
      "when zaman, why neden, how nasıl için: When do you start? Why are you late? How are you?",
    ),
    right: "[When] do you start?",
    wrong: "When [you start]?",
    notes: [
      note(
        "detail",
        lines(
          "Answer why with because: Why are you late? Because the bus was slow.",
          "نجيب عن why بـ because: Why are you late؟ Because the bus was slow.",
          "Responde a why con because: Why are you late? Because the bus was slow.",
          "why'a because ile cevap ver: Why are you late? Because the bus was slow.",
        ),
        ["Why are you sad? [Because] I am tired."],
      ),
    ],
    items: [
      "[When] does the film start? At eight o'clock.",
      "[Why] are you sad? Because I lost my phone.",
      "[How] are you? I am fine, thank you.",
      "[When] is your birthday? In May.",
      "[Why] is he late? Because the bus is slow.",
      "[How] do you go to school? By bus.",
    ],
  },
  "a1-37": {
    idea: lines(
      "Put do or does after the question word, then the subject and the base verb: Where do you live? What does she do?",
      "بعد كلمة السؤال نضع do أو does ثم الفاعل والفعل الأساسي: Where do you live؟ What does she do؟",
      "Después de la palabra interrogativa pon do o does, luego el sujeto y el verbo base: Where do you live? What does she do?",
      "Soru sözcüğünden sonra do veya does, sonra özne ve yalın fiil gelir: Where do you live? What does she do?",
    ),
    right: "Where [do] you live?",
    wrong: "Where [you live]?",
    notes: [
      note(
        "exception",
        lines(
          "Use does with he, she and it, and the verb has no -s: Where does he live? (not Where does he lives?)",
          "نستعمل does مع he وshe وit والفعل بلا s: Where does he live؟ (وليس Where does he lives؟)",
          "Usa does con he, she e it, y el verbo no lleva -s: Where does he live? (no Where does he lives?)",
          "he, she, it ile does kullan, fiil -s almaz: Where does he live? (Where does he lives? değil)",
        ),
        ["Where [does] he work?"],
      ),
    ],
    items: [
      "Where [do] you live?",
      "What time [does] the class start?",
      "Where [do] they work?",
      "What [does] she want?",
      "Why [do] you study English?",
      "Who [does] he know here?",
    ],
  },
  "a1-38": {
    idea: lines(
      "Use how many with things you can count and how much with things you cannot count, and for prices: How many books? How much water? How much is it?",
      "how many مع ما نعدّه وhow much مع ما لا نعدّه وللأسعار: How many books؟ How much water؟ How much is it؟",
      "Usa how many con cosas que se cuentan y how much con las que no, y para precios: How many books? How much water? How much is it?",
      "Sayılabilenlerle how many, sayılamayanlarla ve fiyat için how much: How many books? How much water? How much is it?",
    ),
    right: "How [many] books do you have?",
    wrong: "How [much] books do you have?",
    notes: [
      note(
        "mistake",
        lines(
          "Do not say how many money: money is uncountable, so how much money.",
          "لا نقول how many money: المال غير معدود فنقول how much money.",
          "No digas how many money: money es incontable, así que how much money.",
          "how many money deme: money sayılamaz, how much money de.",
        ),
        ["How [much] money do you have?"],
      ),
    ],
    items: [
      "How [many] students are in your class?",
      "How [much] is this phone?",
      "How [much] water do you drink?",
      "How [many] brothers do you have?",
      "How [much] sugar do you want in your tea?",
      "How [many] eggs do we need?",
    ],
  },
  "a1-39": {
    idea: lines(
      "Use Can I…? to ask for something, Could you…? to ask someone politely, and Would you like…? to offer: Can I have water? Could you help me? Would you like tea?",
      "Can I…؟ لنطلب شيئاً، وCould you…؟ لنطلب من أحد بأدب، وWould you like…؟ لنعرض شيئاً: Can I have water؟ Could you help me؟ Would you like tea؟",
      "Can I…? para pedir algo, Could you…? para pedir con cortesía y Would you like…? para ofrecer: Can I have water? Could you help me? Would you like tea?",
      "Can I…? bir şey istemek, Could you…? kibarca rica etmek, Would you like…? ikram etmek için: Can I have water? Could you help me? Would you like tea?",
    ),
    right: "[Could] you open the window?",
    wrong: "Do you [could] open the window?",
    notes: [
      note(
        "detail",
        lines(
          "Add please to be more polite: Could you help me, please?",
          "نضيف please لنكون أكثر أدباً: Could you help me, please؟",
          "Añade please para ser más amable: Could you help me, please?",
          "Daha kibar olmak için please ekle: Could you help me, please?",
        ),
        ["Could you help me, [please]?"],
      ),
      note(
        "mistake",
        lines(
          "After can and could use the base verb, with no to: Can I go? (not Can I to go?)",
          "بعد can وcould نستعمل الفعل بلا to: Can I go؟ (وليس Can I to go؟)",
          "Después de can y could usa el verbo base, sin to: Can I go? (no Can I to go?)",
          "can ve could'dan sonra to olmadan yalın fiil kullan: Can I go? (Can I to go? değil)",
        ),
        ["Can I [go] home?"],
      ),
    ],
    items: [
      "[Can|Could] I have a glass of water?",
      "[Could|Can] you help me, please?",
      "[Would] you like some tea?",
      "[Can|Could] I sit here?",
      "[Could|Can] you speak slowly, please?",
      "[Would] you like to come with us?",
    ],
  },
  "a1-40": {
    idea: lines(
      "Use Let's and the base verb to suggest something: Let's go. Let's eat.",
      "نستعمل Let's مع الفعل الأساسي للاقتراح: Let's go. Let's eat.",
      "Usa Let's y el verbo base para proponer algo: Let's go. Let's eat.",
      "Bir öneri için Let's ve yalın fiil kullan: Let's go. Let's eat.",
    ),
    right: "[Let's] go to the park.",
    wrong: "Let's [to] go to the park.",
    notes: [
      note(
        "detail",
        lines(
          "Let's is short for let us. You can answer Yes, let's! or No, let's not.",
          "Let's اختصار let us. والجواب: Yes, let's! أو No, let's not.",
          "Let's es la forma corta de let us. Puedes responder Yes, let's! o No, let's not.",
          "Let's, let us'ın kısaltmasıdır. Yanıt: Yes, let's! ya da No, let's not.",
        ),
        ["Yes, [let's]!"],
      ),
    ],
    items: [
      "[Let's] have lunch now.",
      "It is hot. [Let's] go to the river.",
      "I am tired. [Let's] sit here.",
      "We have time. [Let's] watch a film.",
      "The shop is open. [Let's] buy some bread.",
      "[Let's] not be late.",
    ],
  },
  "a1-41": {
    idea: lines(
      "After like, love and hate, use the -ing form to talk about things you enjoy or do not enjoy: I like swimming. She hates cooking.",
      "بعد like وlove وhate نستعمل صيغة -ing لما نحبه أو نكرهه: I like swimming. She hates cooking.",
      "Después de like, love y hate usa la forma -ing para hablar de lo que te gusta o no: I like swimming. She hates cooking.",
      "like, love ve hate'ten sonra sevdiğin ya da sevmediğin şeyler için -ing kullan: I like swimming. She hates cooking.",
    ),
    right: "I like swimm[ing].",
    wrong: "I like [swim].",
    notes: [
      note(
        "detail",
        lines(
          "Spelling: swim → swimming, make → making, run → running.",
          "الإملاء: swim → swimming، make → making، run → running.",
          "Ortografía: swim → swimming, make → making, run → running.",
          "Yazım: swim → swimming, make → making, run → running.",
        ),
        ["She loves mak[ing] cakes."],
      ),
    ],
    items: [
      "I like [swimming] in the summer.{swim}",
      "My father loves [cooking] for us.{cook}",
      "She hates [getting] up early.{get}",
      "We like [playing] football on Friday.{play}",
      "He loves [listening] to old songs.{listen}",
      "They hate [waiting] for the bus.{wait}",
    ],
  },
  "a1-42": {
    idea: lines(
      "After want, need and would like, use to and the base verb: I want to learn English. She needs to go. I would like to sit.",
      "بعد want وneed وwould like نستعمل to ثم الفعل الأساسي: I want to learn English. She needs to go. I would like to sit.",
      "Después de want, need y would like usa to y el verbo base: I want to learn English. She needs to go. I would like to sit.",
      "want, need ve would like'tan sonra to ve yalın fiil gelir: I want to learn English. She needs to go. I would like to sit.",
    ),
    right: "I want [to] learn English.",
    wrong: "I want [learn] English.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not add -s or -ing to the verb after to: She wants to go (not She wants to goes).",
          "لا نضيف -s أو -ing للفعل بعد to: She wants to go (وليس She wants to goes).",
          "No añadas -s ni -ing al verbo después de to: She wants to go (no She wants to goes).",
          "to'dan sonra fiile -s ya da -ing ekleme: She wants to go (She wants to goes değil).",
        ),
        ["She wants [to] go home."],
      ),
    ],
    items: [
      "I want [to] learn English.",
      "She needs [to] go to the doctor.",
      "We would like [to] visit Basra.",
      "He wants [to] buy a new phone.",
      "I need [to] sleep early tonight.",
      "They would like [to] sit near the window.",
    ],
  },
  "a1-43": {
    idea: lines(
      "Next to, between, behind and in front of say where something is: The bank is next to the shop. The cat is behind the door.",
      "next to وbetween وbehind وin front of تبيّن مكان الشيء: The bank is next to the shop. The cat is behind the door.",
      "Next to, between, behind e in front of dicen dónde está algo: The bank is next to the shop. The cat is behind the door.",
      "Next to, between, behind ve in front of bir şeyin yerini söyler: The bank is next to the shop. The cat is behind the door.",
    ),
    right: "The cat is [behind] the door.",
    wrong: "The cat is behind [of] the door.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not add of after behind, between or next to: next to the bank (not next to of the bank).",
          "لا نضيف of بعد behind أو between أو next to: next to the bank (وليس next to of the bank).",
          "No añadas of después de behind, between o next to: next to the bank (no next to of the bank).",
          "behind, between ya da next to'dan sonra of ekleme: next to the bank (next to of the bank değil).",
        ),
        ["It is [next to] the bank.", "The ball is [between] the chairs."],
      ),
    ],
    items: [
      "The bank is on the left and the shop is on the right. The cafe is [between] them.",
      "The garden is at the back of the house. It is [behind] the house.",
      "The car is at the front of the house. It is [in front of] the house.",
      "We sit side by side. I sit [next to] my friend.",
      "The school is not far. It is [near] my house.",
      "The cat is hiding at the back of the sofa. It is [behind] the sofa.",
    ],
  },
  "a1-44": {
    idea: lines(
      "Use and to add, but for a difference, or for a choice, because for a reason and so for a result: I was tired, so I slept.",
      "and للإضافة وbut للمخالفة وor للاختيار وbecause للسبب وso للنتيجة: I was tired, so I slept.",
      "Usa and para añadir, but para contrastar, or para elegir, because para la razón y so para el resultado: I was tired, so I slept.",
      "and eklemek, but karşıtlık, or seçenek, because neden, so sonuç için: I was tired, so I slept.",
    ),
    right: "I stayed home [because] it was raining.",
    wrong: "I stayed home [so] it was raining.",
    notes: [
      note(
        "detail",
        lines(
          "Because gives the reason, so gives the result: I was late because the bus was slow. The bus was slow, so I was late.",
          "because تعطي السبب وso تعطي النتيجة: I was late because the bus was slow. The bus was slow, so I was late.",
          "Because da la razón y so da el resultado: I was late because the bus was slow. The bus was slow, so I was late.",
          "because nedeni, so sonucu verir: I was late because the bus was slow. The bus was slow, so I was late.",
        ),
        ["I was late [because] the bus was slow.", "The bus was slow, [so] I was late."],
      ),
    ],
    items: [
      "I have a brother [and] a sister.",
      "I like tea, [but] I do not like coffee.",
      "Do you want tea [or] coffee?",
      "I was hungry, [so] I ate a sandwich.",
      "She stayed at home [because] she was ill.",
      "It was raining, [so] we took an umbrella.",
    ],
  },
  "a1-45": {
    idea: lines(
      "There was and there were talk about the past: There was a book on the table. There were two cars outside.",
      "there was وthere were للحديث عن الماضي: There was a book on the table. There were two cars outside.",
      "There was y there were hablan del pasado: There was a book on the table. There were two cars outside.",
      "There was ve there were geçmişi anlatır: There was a book on the table. There were two cars outside.",
    ),
    right: "There [was] a book on the table.",
    wrong: "There [were] a book on the table.",
    notes: [
      note(
        "detail",
        lines(
          "Use was with one thing and were with more than one. For no: There wasn't, There weren't. For a question: Was there…? Were there…?",
          "was مع شيء واحد وwere مع أكثر. للنفي: There wasn't وThere weren't. وللسؤال: Was there…؟ Were there…؟",
          "Usa was con una cosa y were con más de una. Para negar: There wasn't, There weren't. Para preguntar: Was there…? Were there…?",
          "Tek şey için was, birden fazla şey için were. Olumsuz: There wasn't, There weren't. Soru: Was there…? Were there…?",
        ),
        ["[Was] there a bank here?", "There [weren't] any seats."],
      ),
    ],
    items: [
      "Last year there [was] a small shop here.",
      "There [were] two cars outside last night.",
      "Yesterday there [wasn't|was not] any bread.",
      "[Were] there many people at the party last night?",
      "There [was] a big tree in our garden when I was a child.",
      "There [were] ten students in the class yesterday.",
    ],
  },
};
