/**
 * Six new emotional Normal lessons (normal-37..normal-42), two per level, shorter sentences than
 * the lessons already live, each told in the first person by a man (narrated by Christopher) or a
 * woman (narrated by Jessa) — both ElevenLabs voices. Inserted as DRAFT + premium, so only an admin
 * sees them, with `voice_generation_excluded` on so the Cartesia cron sweep never narrates them.
 *
 *   npx tsx --env-file=.env.local scripts/insert-emotional-normal-lessons.ts          (dry run)
 *   npx tsx --env-file=.env.local scripts/insert-emotional-normal-lessons.ts --apply  (writes)
 *
 * Re-runnable: a lesson that already exists is left alone.
 */
import { createClient } from "@supabase/supabase-js";

import { REQUIRED_SENTENCE_COUNT } from "../src/lib/admin/validation";
import type { Database } from "../src/types/database";

const CHRISTOPHER = "elevenlabs-ssfu0elfp3qeur4j2bwd";
const JESSA = "elevenlabs-https-elevenlabs-io-voices-yj30vwtgjxshezdagsv9";

const LEVEL_ID: Record<1 | 2 | 3, string> = {
  1: "c358850c-bc55-4867-9d0b-1fd77ce5244c",
  2: "5f2d679d-c0b6-4f58-8378-52ef78f45648",
  3: "dc1f8d84-0999-4fad-8b37-6872f8263e9b",
};

interface S {
  en: string;
  ar: string;
  es: string;
  tr: string;
  /** One Arabic gloss per English token (split on spaces), joined by "|". */
  w: string;
}

interface L {
  id: string;
  level: 1 | 2 | 3;
  order: number;
  voiceId: string;
  title: string;
  titleAr: string;
  titleEs: string;
  titleTr: string;
  desc: string;
  descAr: string;
  descEs: string;
  descTr: string;
  sentences: S[];
}

export const emotionalLessons: L[] = [
  {
    id: "normal-37",
    level: 1,
    order: 44,
    voiceId: CHRISTOPHER,
    title: "The Old Radio",
    titleAr: "الراديو القديم",
    titleEs: "La Radio Vieja",
    titleTr: "Eski Radyo",
    desc: "A son turns on his father's old radio and feels him close again",
    descAr: "يشغّل ابنٌ راديو أبيه القديم فيشعر بقربه من جديد.",
    descEs: "Un hijo enciende la vieja radio de su padre y vuelve a sentirlo cerca.",
    descTr: "Bir oğul babasının eski radyosunu açar ve onu yeniden yakınında hisseder.",
    sentences: [
      {
        en: "My father had an old radio",
        ar: "كان لأبي راديو قديم.",
        es: "Mi padre tenía una radio vieja",
        tr: "Babamın eski bir radyosu vardı",
        w: "لي|أبي|كان عنده|واحد|قديم|راديو",
      },
      {
        en: "It stayed on his kitchen shelf",
        ar: "كان على رف مطبخه.",
        es: "Estaba en el estante de su cocina",
        tr: "Mutfağındaki rafta dururdu",
        w: "هو|بقي|على|له|مطبخ|رف",
      },
      {
        en: "Every morning, he played soft music",
        ar: "كل صباح كان يشغّل موسيقى هادئة.",
        es: "Cada mañana ponía música suave",
        tr: "Her sabah yumuşak bir müzik çalardı",
        w: "كل|صباح|هو|شغّل|هادئة|موسيقى",
      },
      {
        en: "Last year, my father died",
        ar: "في العام الماضي توفي أبي.",
        es: "El año pasado, mi padre murió",
        tr: "Geçen yıl babam öldü",
        w: "الماضي|سنة|لي|أبي|توفي",
      },
      {
        en: "I took the radio to my home",
        ar: "أخذت الراديو إلى بيتي.",
        es: "Llevé la radio a mi casa",
        tr: "Radyoyu evime götürdüm",
        w: "أنا|أخذت|ال|راديو|إلى|لي|بيت",
      },
      {
        en: "Today I turned it on",
        ar: "اليوم شغّلته.",
        es: "Hoy la encendí",
        tr: "Bugün onu açtım",
        w: "اليوم|أنا|شغّلت|هو|تشغيل",
      },
      {
        en: "The same soft music filled the room",
        ar: "ملأت الموسيقى الهادئة نفسها الغرفة.",
        es: "La misma música suave llenó la habitación",
        tr: "Aynı yumuşak müzik odayı doldurdu",
        w: "ال|نفس|هادئة|موسيقى|ملأت|ال|غرفة",
      },
      {
        en: "I closed my eyes and smiled",
        ar: "أغمضت عينيّ وابتسمت.",
        es: "Cerré los ojos y sonreí",
        tr: "Gözlerimi kapattım ve gülümsedim",
        w: "أنا|أغمضت|لي|عيني|و|ابتسمت",
      },
      {
        en: "It felt like he was here",
        ar: "شعرت كأنه هنا.",
        es: "Sentí como si él estuviera aquí",
        tr: "Sanki buradaymış gibi hissettim",
        w: "هو|شعر|مثل|هو|كان|هنا",
      },
    ],
  },
  {
    id: "normal-38",
    level: 1,
    order: 45,
    voiceId: JESSA,
    title: "The School Gate",
    titleAr: "بوابة المدرسة",
    titleEs: "La Puerta de la Escuela",
    titleTr: "Okul Kapısı",
    desc: "A mother lets go of her daughter's hand on the first day of school",
    descAr: "تترك أمٌّ يد ابنتها في أول يوم دراسي.",
    descEs: "Una madre suelta la mano de su hija el primer día de colegio.",
    descTr: "Bir anne okulun ilk gününde kızının elini bırakır.",
    sentences: [
      {
        en: "Today was my daughter's first day",
        ar: "كان اليوم أول يوم لابنتي في المدرسة.",
        es: "Hoy fue el primer día de mi hija",
        tr: "Bugün kızımın ilk günüydü",
        w: "اليوم|كان|لي|ابنتي|أول|يوم",
      },
      {
        en: "She held my hand very tight",
        ar: "أمسكت يدي بقوة.",
        es: "Me agarró la mano muy fuerte",
        tr: "Elimi çok sıkı tuttu",
        w: "هي|أمسكت|لي|يد|جداً|بإحكام",
      },
      {
        en: "At the school gate, she stopped",
        ar: "عند بوابة المدرسة توقفت.",
        es: "En la puerta de la escuela, se detuvo",
        tr: "Okul kapısında durdu",
        w: "عند|ال|مدرسة|بوابة|هي|توقفت",
      },
      {
        en: "I bent down and hugged her",
        ar: "انحنيت واحتضنتها.",
        es: "Me agaché y la abracé",
        tr: "Eğilip ona sarıldım",
        w: "أنا|انحنيت|للأسفل|و|احتضنت|ها",
      },
      {
        en: "She whispered that she was scared",
        ar: "همست بأنها خائفة.",
        es: "Susurró que tenía miedo",
        tr: "Korktuğunu fısıldadı",
        w: "هي|همست|أن|هي|كانت|خائفة",
      },
      {
        en: "I told her I was scared too",
        ar: "قلت لها إنني خائفة أيضاً.",
        es: "Le dije que yo también tenía miedo",
        tr: "Ona benim de korktuğumu söyledim",
        w: "أنا|قلت|لها|أنا|كنت|خائفة|أيضاً",
      },
      {
        en: "Then she smiled and walked inside",
        ar: "ثم ابتسمت ودخلت.",
        es: "Entonces sonrió y entró",
        tr: "Sonra gülümsedi ve içeri yürüdü",
        w: "ثم|هي|ابتسمت|و|مشت|إلى الداخل",
      },
      {
        en: "I stood there and cried quietly",
        ar: "وقفت هناك وبكيت بهدوء.",
        es: "Me quedé allí y lloré en silencio",
        tr: "Orada durup sessizce ağladım",
        w: "أنا|وقفت|هناك|و|بكيت|بهدوء",
      },
      {
        en: "At three, she ran into my arms",
        ar: "في الثالثة ركضت إلى حضني.",
        es: "A las tres, corrió a mis brazos",
        tr: "Saat üçte koşarak kollarıma atıldı",
        w: "في|الثالثة|هي|ركضت|إلى|لي|ذراعي",
      },
    ],
  },
  {
    id: "normal-39",
    level: 2,
    order: 46,
    voiceId: CHRISTOPHER,
    title: "The Door Was Open",
    titleAr: "كان الباب مفتوحاً",
    titleEs: "La Puerta Estaba Abierta",
    titleTr: "Kapı Açıktı",
    desc: "A son comes home after two years away and finds his mother waiting",
    descAr: "يعود ابنٌ إلى بيته بعد عامين من الغياب فيجد أمه بانتظاره.",
    descEs: "Un hijo vuelve a casa tras dos años fuera y encuentra a su madre esperándolo.",
    descTr: "Bir oğul iki yıl sonra eve döner ve annesini onu beklerken bulur.",
    sentences: [
      {
        en: "I worked far from home for two years",
        ar: "عملت بعيداً عن البيت لمدة سنتين.",
        es: "Trabajé lejos de casa durante dos años",
        tr: "İki yıl evden uzakta çalıştım",
        w: "أنا|عملت|بعيداً|عن|البيت|لمدة|اثنين|سنوات",
      },
      {
        en: "I always told my mother I was busy",
        ar: "كنت أقول لأمي دائماً إنني مشغول.",
        es: "Siempre le decía a mi madre que estaba ocupado",
        tr: "Anneme hep meşgul olduğumu söylerdim",
        w: "أنا|دائماً|قلت|لي|أمي|أنا|كنت|مشغولاً",
      },
      {
        en: "The truth was, I missed her terribly",
        ar: "الحقيقة أنني اشتقت إليها بشدة.",
        es: "La verdad es que la extrañaba muchísimo",
        tr: "Gerçek şu ki onu çok özlüyordum",
        w: "ال|حقيقة|كانت|أنا|اشتقت|لها|بشدة",
      },
      {
        en: "Last week, I finally bought a ticket",
        ar: "الأسبوع الماضي اشتريت تذكرة أخيراً.",
        es: "La semana pasada, por fin compré un billete",
        tr: "Geçen hafta sonunda bir bilet aldım",
        w: "الماضي|أسبوع|أنا|أخيراً|اشتريت|واحدة|تذكرة",
      },
      {
        en: "I didn't tell her I was coming",
        ar: "لم أخبرها أنني قادم.",
        es: "No le dije que iba a ir",
        tr: "Geleceğimi ona söylemedim",
        w: "أنا|لم|أخبر|ها|أنا|كنت|قادماً",
      },
      {
        en: "The door was already open when I arrived",
        ar: "كان الباب مفتوحاً أصلاً حين وصلت.",
        es: "La puerta ya estaba abierta cuando llegué",
        tr: "Vardığımda kapı zaten açıktı",
        w: "ال|باب|كان|بالفعل|مفتوحاً|عندما|أنا|وصلت",
      },
      {
        en: "She stood there smiling, as if she knew",
        ar: "وقفت هناك مبتسمة كأنها تعرف.",
        es: "Estaba allí sonriendo, como si lo supiera",
        tr: "Sanki biliyormuş gibi gülümseyerek orada duruyordu",
        w: "هي|وقفت|هناك|مبتسمة|كما|لو|هي|عرفت",
      },
      {
        en: "She said she left it open every night",
        ar: "قالت إنها تتركه مفتوحاً كل ليلة.",
        es: "Dijo que lo dejaba abierto cada noche",
        tr: "Onu her gece açık bıraktığını söyledi",
        w: "هي|قالت|هي|تركت|هو|مفتوحاً|كل|ليلة",
      },
      {
        en: "I hugged her and could not speak",
        ar: "عانقتها ولم أستطع الكلام.",
        es: "La abracé y no pude hablar",
        tr: "Ona sarıldım ve konuşamadım",
        w: "أنا|عانقت|ها|و|استطعت|لا|أتكلم",
      },
    ],
  },
  {
    id: "normal-40",
    level: 2,
    order: 47,
    voiceId: JESSA,
    title: "Grandma's Voice Message",
    titleAr: "رسالة جدتي الصوتية",
    titleEs: "El Mensaje de Voz de la Abuela",
    titleTr: "Büyükannemin Sesli Mesajı",
    desc: "An old voice message from a grandmother says what she never got to say",
    descAr: "رسالة صوتية قديمة من الجدة تقول ما لم تتح لها فرصة قوله.",
    descEs: "Un viejo mensaje de voz de una abuela dice lo que no llegó a decir.",
    descTr: "Bir büyükannenin eski sesli mesajı, söyleyemediklerini söyler.",
    sentences: [
      {
        en: "Yesterday, I was cleaning my old phone",
        ar: "كنت أمس أنظف هاتفي القديم.",
        es: "Ayer estaba limpiando mi teléfono viejo",
        tr: "Dün eski telefonumu temizliyordum",
        w: "أمس|أنا|كنت|أنظف|لي|قديم|هاتف",
      },
      {
        en: "I found a voice message from my grandmother",
        ar: "وجدت رسالة صوتية من جدتي.",
        es: "Encontré un mensaje de voz de mi abuela",
        tr: "Büyükannemden bir sesli mesaj buldum",
        w: "أنا|وجدت|واحدة|صوت|رسالة|من|لي|جدتي",
      },
      {
        en: "She sent it a month before she died",
        ar: "أرسلتها قبل وفاتها بشهر.",
        es: "Me lo envió un mes antes de morir",
        tr: "Ölmeden bir ay önce göndermişti",
        w: "هي|أرسلت|ها|واحد|شهر|قبل|هي|توفيت",
      },
      {
        en: "I was too busy to listen then",
        ar: "كنت مشغولة جداً فلم أستمع حينها.",
        es: "Estaba demasiado ocupada para escucharlo entonces",
        tr: "O zaman dinleyemeyecek kadar meşguldüm",
        w: "أنا|كنت|جداً|مشغولة|لـ|أستمع|حينها",
      },
      {
        en: "Her voice was soft and a little tired",
        ar: "كان صوتها ناعماً ومتعباً قليلاً.",
        es: "Su voz era suave y un poco cansada",
        tr: "Sesi yumuşak ve biraz yorgundu",
        w: "لها|صوت|كان|ناعماً|و|واحد|قليل|متعباً",
      },
      {
        en: "She said she was proud of me",
        ar: "قالت إنها فخورة بي.",
        es: "Dijo que estaba orgullosa de mí",
        tr: "Benimle gurur duyduğunu söyledi",
        w: "هي|قالت|هي|كانت|فخورة|بـ|أنا",
      },
      {
        en: "She asked me to eat well and sleep early",
        ar: "طلبت مني أن آكل جيداً وأنام مبكراً.",
        es: "Me pidió que comiera bien y durmiera temprano",
        tr: "Benden iyi yemek yememi ve erken uyumamı istedi",
        w: "هي|طلبت|مني|أن|آكل|جيداً|و|أنام|مبكراً",
      },
      {
        en: "I played it again and again that night",
        ar: "شغّلتها مراراً تلك الليلة.",
        es: "La escuché una y otra vez esa noche",
        tr: "O gece onu defalarca dinledim",
        w: "أنا|شغّلت|ها|مرة|و|مرة|تلك|ليلة",
      },
      {
        en: "It is the one message I will never delete",
        ar: "إنها الرسالة الوحيدة التي لن أحذفها أبداً.",
        es: "Es el único mensaje que nunca borraré",
        tr: "Asla silmeyeceğim tek mesaj bu",
        w: "هي|هي|ال|واحدة|رسالة|أنا|سوف|أبداً|أحذف",
      },
    ],
  },
  {
    id: "normal-41",
    level: 3,
    order: 48,
    voiceId: CHRISTOPHER,
    title: "Dad Learns to Text",
    titleAr: "أبي يتعلّم الرسائل",
    titleEs: "Papá Aprende a Escribir Mensajes",
    titleTr: "Babam Mesaj Yazmayı Öğreniyor",
    desc: "A son teaches his father to send a text, and gets one back he will never forget",
    descAr: "يعلّم ابنٌ أباه كتابة الرسائل فيصله منه رد لن ينساه أبداً.",
    descEs: "Un hijo enseña a su padre a mandar mensajes y recibe uno que nunca olvidará.",
    descTr: "Bir oğul babasına mesaj atmayı öğretir ve asla unutamayacağı bir mesaj alır.",
    sentences: [
      {
        en: "My father had never used a smartphone before",
        ar: "لم يستخدم أبي هاتفاً ذكياً من قبل.",
        es: "Mi padre nunca había usado un teléfono inteligente",
        tr: "Babam daha önce hiç akıllı telefon kullanmamıştı",
        w: "لي|أبي|كان|أبداً|استخدم|واحد|هاتف ذكي|قبل",
      },
      {
        en: "Last month, I finally taught him how to text",
        ar: "الشهر الماضي علّمته أخيراً كيف يرسل رسالة.",
        es: "El mes pasado, por fin le enseñé a mandar mensajes",
        tr: "Geçen ay sonunda ona mesaj atmayı öğrettim",
        w: "الماضي|شهر|أنا|أخيراً|علّمت|ه|كيف|أن|يرسل رسالة",
      },
      {
        en: "His big fingers pressed the tiny keys very slowly",
        ar: "ضغطت أصابعه الكبيرة الأزرار الصغيرة ببطء شديد.",
        es: "Sus dedos grandes pulsaban las teclas diminutas muy despacio",
        tr: "Büyük parmakları küçücük tuşlara çok yavaş basıyordu",
        w: "له|كبيرة|أصابع|ضغطت|ال|صغيرة|أزرار|جداً|ببطء",
      },
      {
        en: "He kept apologizing for being such a slow student",
        ar: "ظل يعتذر لأنه طالب بطيء.",
        es: "No dejaba de disculparse por ser un alumno tan lento",
        tr: "Bu kadar yavaş bir öğrenci olduğu için sürekli özür diliyordu",
        w: "هو|ظل|يعتذر|عن|كونه|مثل|واحد|بطيء|طالب",
      },
      {
        en: "I reminded him he once taught me to walk",
        ar: "ذكّرته بأنه علّمني المشي ذات يوم.",
        es: "Le recordé que él me enseñó a caminar",
        tr: "Ona bir zamanlar bana yürümeyi öğrettiğini hatırlattım",
        w: "أنا|ذكّرت|ه|هو|ذات مرة|علّم|ني|أن|أمشي",
      },
      {
        en: "Three days later, my phone buzzed during a meeting",
        ar: "بعد ثلاثة أيام اهتز هاتفي أثناء اجتماع.",
        es: "Tres días después, mi teléfono vibró durante una reunión",
        tr: "Üç gün sonra bir toplantı sırasında telefonum titredi",
        w: "ثلاثة|أيام|لاحقاً|لي|هاتف|اهتز|أثناء|واحد|اجتماع",
      },
      {
        en: "The message was short, with three spelling mistakes",
        ar: "كانت الرسالة قصيرة وفيها ثلاثة أخطاء إملائية.",
        es: "El mensaje era corto, con tres faltas de ortografía",
        tr: "Mesaj kısaydı ve üç yazım hatası vardı",
        w: "ال|رسالة|كانت|قصيرة|مع|ثلاثة|إملاء|أخطاء",
      },
      {
        en: "It simply said: I love you, my son",
        ar: "كان فيها فقط: أحبك يا ابني.",
        es: "Solo decía: te quiero, hijo mío",
        tr: "Sadece şunu yazıyordu: Seni seviyorum oğlum",
        w: "هو|ببساطة|قال|أنا|أحب|ك|لي|ابني",
      },
      {
        en: "I read it twice, then stepped out to call him",
        ar: "قرأتها مرتين ثم خرجت لأتصل به.",
        es: "La leí dos veces y salí a llamarlo",
        tr: "İki kez okudum, sonra onu aramak için dışarı çıktım",
        w: "أنا|قرأت|ها|مرتين|ثم|خرجت|للخارج|لـ|أتصل|به",
      },
    ],
  },
  {
    id: "normal-42",
    level: 3,
    order: 49,
    voiceId: JESSA,
    title: "The Friend Who Kept Coming",
    titleAr: "الصديقة التي ظلّت تأتي",
    titleEs: "La Amiga Que Siguió Viniendo",
    titleTr: "Gelmeye Devam Eden Arkadaş",
    desc: "When she lost her job and shut everyone out, one friend refused to disappear",
    descAr: "حين فقدت وظيفتها وأغلقت الباب على الجميع، رفضت صديقة واحدة أن تختفي.",
    descEs: "Cuando perdió su trabajo y se aisló de todos, una amiga se negó a desaparecer.",
    descTr: "İşini kaybedip herkesi uzaklaştırdığında, bir arkadaşı kaybolmayı reddetti.",
    sentences: [
      {
        en: "When I lost my job, I stopped answering calls",
        ar: "عندما فقدت وظيفتي توقفت عن الرد على المكالمات.",
        es: "Cuando perdí mi trabajo, dejé de contestar las llamadas",
        tr: "İşimi kaybedince telefonlara bakmayı bıraktım",
        w: "عندما|أنا|فقدت|لي|وظيفة|أنا|توقفت|أرد على|مكالمات",
      },
      {
        en: "I was too embarrassed to explain what had happened",
        ar: "كنت محرجة جداً من أن أشرح ما حدث.",
        es: "Me daba demasiada vergüenza explicar lo que había pasado",
        tr: "Ne olduğunu açıklayamayacak kadar utanıyordum",
        w: "أنا|كنت|جداً|محرجة|لـ|أشرح|ما|قد|حدث",
      },
      {
        en: "Most friends slowly stopped calling after a few weeks",
        ar: "توقف معظم أصدقائي عن الاتصال ببطء بعد أسابيع قليلة.",
        es: "La mayoría de mis amigos fue dejando de llamar tras unas semanas",
        tr: "Arkadaşlarımın çoğu birkaç hafta sonra yavaş yavaş aramayı bıraktı",
        w: "معظم|أصدقاء|ببطء|توقفوا|الاتصال|بعد|واحدة|قليلة|أسابيع",
      },
      {
        en: "Only Hana kept knocking on my door every Friday",
        ar: "هناء وحدها ظلت تطرق بابي كل جمعة.",
        es: "Solo Hana siguió llamando a mi puerta cada viernes",
        tr: "Yalnızca Hana her cuma kapımı çalmaya devam etti",
        w: "فقط|هناء|ظلت|تطرق|على|لي|باب|كل|جمعة",
      },
      {
        en: "She never asked questions and just brought dinner",
        ar: "لم تسأل عن شيء وكانت تحضر العشاء فقط.",
        es: "Nunca hacía preguntas y solo traía la cena",
        tr: "Hiç soru sormadı, sadece yemek getirdi",
        w: "هي|أبداً|سألت|أسئلة|و|فقط|أحضرت|عشاء",
      },
      {
        en: "For weeks, I pretended not to be home",
        ar: "تظاهرت لأسابيع بأنني لست في البيت.",
        es: "Durante semanas fingí no estar en casa",
        tr: "Haftalarca evde değilmişim gibi davrandım",
        w: "لمدة|أسابيع|أنا|تظاهرت|لا|أن|أكون|في البيت",
      },
      {
        en: "One evening, I opened the door and started crying",
        ar: "في مساء ما فتحت الباب وبدأت أبكي.",
        es: "Una tarde abrí la puerta y empecé a llorar",
        tr: "Bir akşam kapıyı açtım ve ağlamaya başladım",
        w: "واحد|مساء|أنا|فتحت|ال|باب|و|بدأت|بالبكاء",
      },
      {
        en: "She hugged me and said she wasn't going anywhere",
        ar: "عانقتني وقالت إنها لن تذهب إلى أي مكان.",
        es: "Me abrazó y dijo que no se iba a ninguna parte",
        tr: "Bana sarıldı ve hiçbir yere gitmeyeceğini söyledi",
        w: "هي|عانقت|ني|و|قالت|هي|ليست|ذاهبة|إلى أي مكان",
      },
      {
        en: "I learned that real friendship is simply staying",
        ar: "تعلمت أن الصداقة الحقيقية هي أن تبقى فقط.",
        es: "Aprendí que la verdadera amistad es simplemente quedarse",
        tr: "Gerçek dostluğun sadece yanında kalmak olduğunu öğrendim",
        w: "أنا|تعلمت|أن|حقيقية|صداقة|هي|ببساطة|البقاء",
      },
    ],
  },
];

/** Structural checks shared by the dry run and the real run. */
export function validate(lessons: L[]): string[] {
  const problems: string[] = [];
  for (const lesson of lessons) {
    if (lesson.sentences.length !== REQUIRED_SENTENCE_COUNT.normal) {
      problems.push(`${lesson.id}: ${lesson.sentences.length} sentences`);
    }
    for (const [i, s] of lesson.sentences.entries()) {
      const tokens = s.en.split(" ").length;
      const glosses = s.w.split("|").length;
      if (tokens !== glosses)
        problems.push(`${lesson.id}-s${i + 1}: ${tokens} words, ${glosses} glosses`);
      if (/[A-Z]{2,}/.test(s.en) === false && /[^\x20-\x7E]/.test(s.en)) {
        problems.push(`${lesson.id}-s${i + 1}: non-ASCII in English`);
      }
    }
  }
  return problems;
}

async function main() {
  const problems = validate(emotionalLessons);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  for (const lesson of emotionalLessons) {
    const words = lesson.sentences.map((s) => s.en.split(" ").length);
    console.log(
      `${lesson.id} L${lesson.level} "${lesson.title}" avg ${(words.reduce((a, b) => a + b, 0) / words.length).toFixed(1)} words, voice ${lesson.voiceId === CHRISTOPHER ? "Christopher" : "Jessa"}`,
    );
  }
  if (!process.argv.includes("--apply")) {
    console.log("\nDry run only. Add --apply to write.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = () => new Date().toISOString();

  async function tr(
    locale: "es" | "ar" | "tr",
    contentType: "lesson" | "sentence",
    contentId: string,
    field: string,
    value: string,
    source: string,
  ) {
    const { error } = await supabase.from("content_translations").upsert(
      {
        content_type: contentType,
        content_id: contentId,
        field,
        locale,
        value: value.trim(),
        status: "approved",
        is_stale: false,
        source_snapshot: source.trim(),
        previous_value: null,
        updated_at: now(),
      },
      { onConflict: "content_type,content_id,field,locale" },
    );
    if (error) throw new Error(`translation ${contentId}/${field}/${locale}: ${error.message}`);
  }

  for (const lesson of emotionalLessons) {
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lesson.id)
      .maybeSingle();
    if (existing) {
      console.log(`${lesson.id} already exists, left alone.`);
      continue;
    }
    const { error: lessonError } = await supabase.from("lessons").insert({
      id: lesson.id,
      mode: "normal",
      level_id: LEVEL_ID[lesson.level],
      order_index: lesson.order,
      title: lesson.title,
      title_ar: lesson.titleAr,
      description: lesson.desc,
      description_ar: lesson.descAr,
      is_free: false,
      status: "draft",
      voice_id: lesson.voiceId,
      voice_generation_excluded: true,
      created_at: now(),
      updated_at: now(),
    });
    if (lessonError) throw new Error(`lesson ${lesson.id}: ${lessonError.message}`);

    const rows = lesson.sentences.map((s, i) => {
      const tokens = s.en.split(" ");
      const glosses = s.w.split("|");
      return {
        id: `${lesson.id}-s${i + 1}`,
        lesson_id: lesson.id,
        order_index: i,
        en: s.en,
        ar: s.ar,
        speaker: null,
        audio_url: null,
        word_translations: tokens.map((en, k) => ({ en, ar: glosses[k]! })),
        created_at: now(),
        updated_at: now(),
      };
    });
    const { error: sentenceError } = await supabase.from("sentences").insert(rows);
    if (sentenceError) throw new Error(`sentences ${lesson.id}: ${sentenceError.message}`);

    await tr("es", "lesson", lesson.id, "title", lesson.titleEs, lesson.title);
    await tr("ar", "lesson", lesson.id, "title", lesson.titleAr, lesson.title);
    await tr("tr", "lesson", lesson.id, "title", lesson.titleTr, lesson.title);
    await tr("es", "lesson", lesson.id, "description", lesson.descEs, lesson.desc);
    await tr("ar", "lesson", lesson.id, "description", lesson.descAr, lesson.desc);
    await tr("tr", "lesson", lesson.id, "description", lesson.descTr, lesson.desc);
    for (const [i, s] of lesson.sentences.entries()) {
      const id = rows[i]!.id;
      await tr("es", "sentence", id, "text", s.es, s.en);
      await tr("ar", "sentence", id, "text", s.ar, s.en);
      await tr("tr", "sentence", id, "text", s.tr, s.en);
    }
    console.log(`${lesson.id} inserted (draft, premium).`);
  }
}

if (process.argv[1] && /insert-emotional-normal-lessons/.test(process.argv[1])) {
  main().catch((error) => {
    console.error("FAILED:", error);
    process.exit(1);
  });
}
