/**
 * What the rules of the A2–B1 syllabus teach in its first three units: present and past (a2-09 ... a2-15) and
 * the present perfect (a2-16 ... a2-20). Same shape as teach.ts; the prepared sentences are in `items`.
 */

import { lines, note, type RuleTeach } from "./teach-types";

export const TEACH_A2_TENSES: Readonly<Record<string, RuleTeach>> = {
  "a2-09": {
    idea: lines(
      "Use the present simple for habits and facts. Use the present continuous for what is happening now.",
      "المضارع البسيط للعادات والحقائق، والمضارع المستمر لما يحدث الآن.",
      "Usa el presente simple para hábitos y hechos. Usa el presente continuo para lo que pasa ahora.",
      "Alışkanlıklar ve genel doğrular için geniş zamanı, şu anda olanlar için şimdiki zamanı kullan.",
    ),
    right: "Look! It [is raining].",
    wrong: "Look! It [rains].",
    notes: [
      note(
        "detail",
        lines(
          "Signal words help: always, usually, every day → present simple. Now, at the moment, today → present continuous.",
          "كلمات تساعدك: always وusually وevery day مع المضارع البسيط، وnow وat the moment وtoday مع المستمر.",
          "Las palabras clave ayudan: always, usually, every day → presente simple. Now, at the moment, today → presente continuo.",
          "İpucu sözcükler: always, usually, every day → geniş zaman. Now, at the moment, today → şimdiki zaman.",
        ),
        ["She [plays] tennis every Friday.", "She [is playing] tennis now."],
      ),
    ],
    items: [
      "Sara usually [drinks] tea in the morning.{drink}",
      "Be quiet! The baby [is sleeping].{sleep}",
      "I [go] to work by bus every day.{go}",
      "Right now, we [are watching|'re watching] a film.{watch}",
      "My brother [plays] football on Saturdays.{play}",
      "Listen! Someone [is knocking|'s knocking] at the door.{knock}",
    ],
  },
  "a2-10": {
    idea: lines(
      "Some verbs are not used in the continuous: know, like, love, want, need, understand, believe. Say I know, not I am knowing.",
      "بعض الأفعال لا تُستعمل في الزمن المستمر: know وlike وlove وwant وneed وunderstand وbelieve. نقول I know وليس I am knowing.",
      "Algunos verbos no se usan en continuo: know, like, love, want, need, understand, believe. Di I know, no I am knowing.",
      "Bazı fiiller şimdiki zamanda kullanılmaz: know, like, love, want, need, understand, believe. I know de, I am knowing deme.",
    ),
    right: "I [know] the answer.",
    wrong: "I [am knowing] the answer.",
    notes: [
      note(
        "exception",
        lines(
          "A few of these verbs can be continuous when the meaning changes: I am having lunch (have = eat). I am thinking about it (think = use my mind).",
          "بعض هذه الأفعال تأتي في المستمر حين يتغير معناها: I am having lunch (بمعنى أتناول). I am thinking about it (أفكّر فيه).",
          "Algunos de estos verbos pueden ir en continuo cuando cambia el significado: I am having lunch (have = comer). I am thinking about it (think = pensar).",
          "Bu fiillerden bazıları anlam değişince şimdiki zamanda kullanılabilir: I am having lunch (have = yemek yemek). I am thinking about it (düşünmek).",
        ),
        ["I [am having] lunch now.", "I [have] a new phone."],
      ),
    ],
    items: [
      "I [know] your brother. He lives near us.{know}",
      "She [likes] chocolate ice cream.{like}",
      "Right now, I [need] some help.{need}",
      "We [love] this song. It is so beautiful.{love}",
      "He [believes] you. You are a good friend.{believe}",
      "Do you [understand] the question?{understand}",
    ],
  },
  "a2-11": {
    idea: lines(
      "Spelling before -ing and -ed: drop a silent e (make → making), double the last letter after one vowel (run → running), change y to i (study → studied).",
      "إملاء -ing و-ed: نحذف e الصامتة (make → making)، ونضاعف الحرف الأخير بعد حرف علة واحد (run → running)، ونغيّر y إلى i (study → studied).",
      "Ortografía antes de -ing y -ed: quita la e muda (make → making), duplica la última letra tras una vocal (run → running), cambia y por i (study → studied).",
      "-ing ve -ed öncesi yazım: sessiz e düşer (make → making), tek ünlüden sonra son harf ikilenir (run → running), y, i olur (study → studied).",
    ),
    right: "He is runn[ing] in the park.",
    wrong: "He is run[ing] in the park.",
    notes: [
      note(
        "exception",
        lines(
          "Do not double w, x or y: playing, fixing, showing. And -ie becomes -ying: die → dying, lie → lying.",
          "لا نضاعف w وx وy: playing وfixing وshowing. وتصير -ie إلى -ying: die → dying وlie → lying.",
          "No dupliques w, x ni y: playing, fixing, showing. Y -ie pasa a -ying: die → dying, lie → lying.",
          "w, x, y ikilenmez: playing, fixing, showing. -ie ise -ying olur: die → dying, lie → lying.",
        ),
        ["She is play[ing] outside.", "He is fix[ing] the car."],
      ),
      note(
        "detail",
        lines(
          "With -ed, y after a vowel stays (play → played). After a consonant it changes (study → studied, cry → cried).",
          "مع -ed تبقى y بعد حرف العلة (play → played)، وبعد الحرف الساكن تتغير (study → studied وcry → cried).",
          "Con -ed, la y tras vocal se queda (play → played). Tras consonante cambia (study → studied, cry → cried).",
          "-ed ile ünlüden sonra y kalır (play → played). Ünsüzden sonra değişir (study → studied, cry → cried).",
        ),
        ["He play[ed] all day.", "She studi[ed] hard."],
      ),
    ],
    items: [
      "He is [running] in the park.{run}",
      "She is [making] a cake for her mother.{make}",
      "We [stopped] at the shop on our way home.{stop}",
      "I [studied] English last night.{study}",
      "They are [sitting] on the grass.{sit}",
      "She [liked] the film a lot.{like}",
    ],
  },
  "a2-12": {
    idea: lines(
      "Use the past continuous for the longer action and the past simple for the shorter one that interrupts it: I was cooking when she called.",
      "الماضي المستمر للفعل الأطول، والماضي البسيط للفعل الأقصر الذي يقاطعه: I was cooking when she called.",
      "Usa el pasado continuo para la acción más larga y el pasado simple para la corta que la interrumpe: I was cooking when she called.",
      "Uzun süren eylem için past continuous, onu kesen kısa eylem için past simple kullan: I was cooking when she called.",
    ),
    right: "I was cooking [when] she called.",
    wrong: "I was cooking [while] she called.",
    notes: [
      note(
        "detail",
        lines(
          "While goes with the longer action, when with the short one. Two long actions together: use while for both.",
          "while مع الفعل الطويل وwhen مع الفعل القصير. وإن كان الفعلان طويلين معاً نستعمل while.",
          "While va con la acción larga y when con la corta. Con dos acciones largas a la vez, usa while.",
          "While uzun eylemle, when kısa eylemle gelir. İki uzun eylem birlikteyse while kullan.",
        ),
        ["I was cooking [while] she was reading.", "[When] he arrived, I was cooking."],
      ),
    ],
    items: [
      "I was walking home [when] it started to rain.",
      "She was reading [while] her brother was watching TV.",
      "We were having dinner [when] the phone rang.",
      "He listened to music [while|when] he was driving.",
      "The children were playing outside [when] their mother called them.",
      "My father was sleeping [while] we were cleaning the house.",
    ],
  },
  "a2-13": {
    idea: lines(
      "Use used to for a habit or a state in the past that is not true now: I used to live in Mosul. (I don't live there now.)",
      "نستعمل used to لعادة أو حالة في الماضي لم تعد صحيحة الآن: I used to live in Mosul (أي لم أعد أسكن فيها).",
      "Usa used to para un hábito o un estado del pasado que ya no es verdad: I used to live in Mosul. (Ya no vivo allí.)",
      "Geçmişte olan ama artık doğru olmayan bir alışkanlık veya durum için used to kullan: I used to live in Mosul. (Artık orada yaşamıyorum.)",
    ),
    right: "I [used to] live in Mosul.",
    wrong: "I [use to] live in Mosul.",
    notes: [
      note(
        "detail",
        lines(
          "In questions and negatives, did shows the past, so we write use to: Did you use to swim? I didn't use to like fish.",
          "في الأسئلة والنفي تدلّ did على الماضي فنكتب use to: Did you use to swim؟ I didn't use to like fish.",
          "En preguntas y negaciones did marca el pasado, así que se escribe use to: Did you use to swim? I didn't use to like fish.",
          "Soru ve olumsuzda did geçmişi gösterir, bu yüzden use to yazılır: Did you use to swim? I didn't use to like fish.",
        ),
        ["Did you [use to] swim?", "I didn't [use to] like fish."],
      ),
      note(
        "mistake",
        lines(
          "Do not use used to for one event. Use the past simple: I went there yesterday (not I used to go there yesterday).",
          "لا نستعمل used to لحدث واحد. نستعمل الماضي البسيط: I went there yesterday.",
          "No uses used to para un solo hecho. Usa el pasado simple: I went there yesterday.",
          "Tek bir olay için used to kullanma. Past simple kullan: I went there yesterday.",
        ),
        ["I [went] there yesterday."],
      ),
    ],
    items: [
      "When I was a child, I [used to] play in the street.",
      "My grandfather [used to] have a small shop.",
      "We [used to] live in Baghdad, but now we live in Erbil.",
      "Did you [use to] walk to school?",
      "She didn't [use to] like coffee, but now she loves it.",
      "There [used to] be a cinema here.",
    ],
  },
  "a2-14": {
    idea: lines(
      "Many verbs have an irregular past participle that you must learn: do → done, see → seen, go → gone, write → written.",
      "كثير من الأفعال لها تصريف ثالث (past participle) شاذ يجب حفظه: do → done وsee → seen وgo → gone وwrite → written.",
      "Muchos verbos tienen un participio irregular que hay que aprender: do → done, see → seen, go → gone, write → written.",
      "Birçok fiilin düzensiz bir past participle biçimi vardır ve ezberlenmelidir: do → done, see → seen, go → gone, write → written.",
    ),
    right: "I have [seen] that film.",
    wrong: "I have [saw] that film.",
    notes: [
      note(
        "mistake",
        lines(
          "After have or has, do not use the past simple form: I have eaten (not I have ate).",
          "بعد have أو has لا نستعمل صيغة الماضي البسيط: I have eaten (وليس I have ate).",
          "Después de have o has no uses el pasado simple: I have eaten (no I have ate).",
          "have veya has'tan sonra past simple biçimini kullanma: I have eaten (I have ate değil).",
        ),
        ["I have [eaten] already."],
      ),
      note(
        "detail",
        lines(
          "Some participles equal the past simple (made, bought, had). Others are different (saw, seen). Learn them in pairs.",
          "بعض الأشكال الثالثة تساوي الماضي البسيط (made وbought وhad)، وبعضها يختلف (saw وseen). احفظها مع بعضها.",
          "Algunos participios son iguales al pasado simple (made, bought, had). Otros son distintos (saw, seen). Apréndelos en pares.",
          "Bazı participle'lar past simple ile aynıdır (made, bought, had). Bazıları farklıdır (saw, seen). Çiftler hâlinde öğren.",
        ),
        ["I have [made] tea.", "She has [bought] a car."],
      ),
    ],
    items: [
      "I have [seen] that film twice.{see}",
      "She has [written] a long letter.{write}",
      "They have [gone] to the market.{go}",
      "Have you [eaten] breakfast?{eat}",
      "He has [taken] my pen.{take}",
      "We have [done] our homework.{do}",
    ],
  },
  "a2-15": {
    idea: lines(
      "A time word joins two actions, and a full clause follows it: I wash my hands before I eat. (not before eat)",
      "كلمة الوقت تربط بين فعلين ويأتي بعدها فاعل وفعل: I wash my hands before I eat (وليس before eat).",
      "Una palabra de tiempo une dos acciones y después va una oración completa: I wash my hands before I eat. (no before eat)",
      "Zaman sözcüğü iki eylemi bağlar ve ardından tam bir cümle gelir: I wash my hands before I eat. (before eat değil)",
    ),
    right: "I wash my hands [before] I eat.",
    wrong: "I wash my hands before [eat].",
    notes: [
      note(
        "detail",
        lines(
          "The time clause can come first, with a comma: Before I eat, I wash my hands. Until means up to that time.",
          "يمكن أن تأتي جملة الوقت أولاً مع فاصلة: Before I eat, I wash my hands. وتعني until إلى ذلك الوقت.",
          "La oración de tiempo puede ir primero, con coma: Before I eat, I wash my hands. Until significa hasta ese momento.",
          "Zaman cümlesi başa gelebilir, virgülle: Before I eat, I wash my hands. Until, o ana kadar demektir.",
        ),
        ["[Before] I eat, I wash my hands.", "I wait [until] she comes."],
      ),
    ],
    items: [
      "I always brush my teeth [before] I go to bed.",
      "She waited [until|till] the bus came.",
      "We went home [after|when] the film finished.",
      "[When|After] I get home, I make tea.",
      "He listens to music [while|when] he works.",
      "Don't open the door [until|before] I tell you.",
    ],
  },
  "a2-16": {
    idea: lines(
      "Use for with a length of time (for two years). Use since with the starting point (since 2020).",
      "نستعمل for مع مدة زمنية (for two years)، وsince مع نقطة البداية (since 2020).",
      "Usa for con una duración (for two years). Usa since con el punto de partida (since 2020).",
      "Süre için for kullan (for two years). Başlangıç noktası için since kullan (since 2020).",
    ),
    right: "I have lived here [for] five years.",
    wrong: "I have lived here [since] five years.",
    notes: [
      note(
        "detail",
        lines(
          "Since + a point in time (Monday, 2019, I was ten). For + a period (a week, ten minutes, ages).",
          "since + نقطة في الزمن (Monday و‏2019 وI was ten). وfor + مدة (a week وten minutes وages).",
          "Since + un punto en el tiempo (Monday, 2019, I was ten). For + un periodo (a week, ten minutes, ages).",
          "Since + zamanda bir nokta (Monday, 2019, I was ten). For + bir süre (a week, ten minutes, ages).",
        ),
        ["I have known her [since] 2019.", "I have known her [for] six years."],
      ),
      note(
        "mistake",
        lines(
          "Decide first: is it a point in time (since) or a period (for)? Some languages use one word for both.",
          "العربية تستعمل «منذ» للاثنين، أما الإنجليزية ففيها كلمتان: نقطة (since) أو مدة (for).",
          "Decide primero: ¿es un punto en el tiempo (since) o un periodo (for)?",
          "Önce karar ver: zamanda bir nokta mı (since), yoksa bir süre mi (for)?",
        ),
        ["It has rained [since] morning.", "It has rained [for] hours."],
      ),
    ],
    items: [
      "I have lived in Basra [for] ten years.",
      "She has worked here [since] 2018.",
      "We have been friends [since] we were children.",
      "He has studied English [for] two months.",
      "They haven't seen us [for] a long time.",
      "I have had this phone [since] Monday.",
    ],
  },
  "a2-17": {
    idea: lines(
      "Just: a moment ago. Already: sooner than expected. Yet: until now, in questions and negatives.",
      "just: قبل لحظة. already: أبكر مما نتوقع. yet: حتى الآن، في الأسئلة والنفي.",
      "Just: hace un momento. Already: antes de lo esperado. Yet: hasta ahora, en preguntas y negaciones.",
      "Just: az önce. Already: beklenenden önce. Yet: şimdiye kadar, soru ve olumsuz cümlelerde.",
    ),
    right: "I have [just] finished.",
    wrong: "I haven't finished [already].",
    notes: [
      note(
        "detail",
        lines(
          "Just and already go between have and the participle. Yet goes at the end.",
          "just وalready تأتيان بين have والتصريف الثالث. وyet تأتي في آخر الجملة.",
          "Just y already van entre have y el participio. Yet va al final.",
          "Just ve already, have ile participle arasına girer. Yet sona gelir.",
        ),
        ["She has [already] left.", "Have you finished [yet]?"],
      ),
    ],
    items: [
      "I have [already] done it. You asked me yesterday.",
      "Have you finished your homework [yet]?",
      "She has [just] left. She is still on the stairs.",
      "I haven't read the message [yet].",
      "We have [already|just] eaten, thank you.",
      "He has [just] arrived. He is still taking off his coat.",
    ],
  },
  "a2-18": {
    idea: lines(
      "Use the past simple for a finished time (yesterday, in 2020, last week). Use the present perfect when the time is not said.",
      "الماضي البسيط لوقت انتهى (yesterday وin 2020 وlast week). وpresent perfect حين لا نذكر الوقت.",
      "Usa el pasado simple para un tiempo terminado (yesterday, in 2020, last week). Usa el present perfect cuando no se dice el momento.",
      "Bitmiş bir zaman için past simple kullan (yesterday, in 2020, last week). Zaman söylenmediğinde present perfect kullan.",
    ),
    right: "I [saw] him yesterday.",
    wrong: "I [have seen] him yesterday.",
    notes: [
      note(
        "mistake",
        lines(
          "With yesterday, last year or ago a finished time is named, so use the past simple, not the present perfect.",
          "في العربية يكفي فعل ماضٍ واحد للحالتين. أما في الإنجليزية فمع yesterday وlast year وago نستعمل الماضي البسيط.",
          "Con yesterday, last year o ago se nombra un tiempo terminado: usa el pasado simple, no el present perfect.",
          "Yesterday, last year veya ago ile bitmiş bir zaman söylenir: past simple kullan, present perfect değil.",
        ),
        ["She [visited] Erbil last year.", "She [has visited] Erbil twice."],
      ),
    ],
    items: [
      "I [saw] that film last week.{see}",
      "I [have seen] that film three times.{see}",
      "She [went] to Basra in 2019.{go}",
      "She [has been] to Basra twice.{be}",
      "We [met] two years ago.{meet}",
      "He [has lost] his keys, so he can't open the door.{lose}",
    ],
  },
  "a2-19": {
    idea: lines(
      "How long…? asks for a length of time. Been means went and came back. Gone means went and is still away.",
      "How long…؟ تسأل عن المدة. been تعني ذهب وعاد. وgone تعني ذهب وما زال هناك.",
      "How long…? pregunta por una duración. Been significa fue y volvió. Gone significa fue y sigue allí.",
      "How long…? bir süreyi sorar. Been, gidip geri geldi demektir. Gone, gitti ve hâlâ orada demektir.",
    ),
    right: "She has [gone] to Paris. She is not here.",
    wrong: "She has [been] to Paris. She is not here.",
    notes: [
      note(
        "detail",
        lines(
          "Ask how long with the present perfect: How long have you lived here? Answer with for or since.",
          "نسأل عن المدة بالـ present perfect: How long have you lived here؟ ونجيب بـ for أو since.",
          "Pregunta por la duración con el present perfect: How long have you lived here? Responde con for o since.",
          "Süreyi present perfect ile sor: How long have you lived here? for veya since ile yanıtla.",
        ),
        ["[How long] have you lived here?", "I have [been] to Erbil."],
      ),
    ],
    items: [
      "Where is Ali? He has [gone] to the shop. He will be back soon.",
      "I have [been] to Istanbul. It is a beautiful city.",
      "How long have you [lived] here?{live}",
      "She isn't at home. She has [gone] out.",
      "Have you ever [been] to London?",
      "They have [been] to the cinema. They are home again now.",
    ],
  },
  "a2-20": {
    idea: lines(
      "Ask about life experience with Have you ever + past participle? Answer: Yes, I have. / No, I haven't. / No, never.",
      "نسأل عن التجارب في الحياة بـ Have you ever + التصريف الثالث؟ والجواب: Yes, I have. أو No, I haven't. أو No, never.",
      "Pregunta por experiencias de la vida con Have you ever + participio? Responde: Yes, I have. / No, I haven't. / No, never.",
      "Yaşam deneyimlerini Have you ever + participle? ile sor. Yanıt: Yes, I have. / No, I haven't. / No, never.",
    ),
    right: "Have you [ever] eaten sushi?",
    wrong: "Have you ever [ate] sushi?",
    notes: [
      note(
        "detail",
        lines(
          "Ever means at any time in your life. In a positive answer we do not use it; for none we say never: I have never eaten sushi.",
          "ever تعني في أي وقت من حياتك. في الجواب المثبت لا نستعملها، وللنفي نقول never: I have never eaten sushi.",
          "Ever significa en cualquier momento de tu vida. En una respuesta afirmativa no se usa; para ninguna vez se dice never: I have never eaten sushi.",
          "Ever, hayatının herhangi bir anı demektir. Olumlu yanıtta kullanılmaz; hiç olmadıysa never denir: I have never eaten sushi.",
        ),
        ["I have [never] eaten sushi.", "Have you [ever] been to Turkey?"],
      ),
    ],
    items: [
      "Have you [ever] been to Istanbul?",
      "Have you ever [eaten] Chinese food?{eat}",
      "[Has] she ever visited Basra?",
      "I have [never] seen snow.",
      "Have you ever [met] a famous person?{meet}",
      "Have you ever tried sushi? No, I [haven't|have not].",
    ],
  },
};
