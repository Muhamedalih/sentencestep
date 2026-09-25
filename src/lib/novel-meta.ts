import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Static, presentation-only metadata for the 20 curated Novels — a genre tag
 * (shown instead of the Beginner/Intermediate tier the nonfiction Book
 * catalog uses, which reads oddly on a classic novel), a real reading-time
 * estimate (computed once from the actual sentence content via the same
 * formula as estimateMinutes in lib/levels.ts, not fetched live), and a
 * short teaser line pulled verbatim from each novel's own retelling for the
 * Featured card. Hardcoded rather than a new DB column/table: exactly 20
 * known ids, changes only when new novels are curated by hand alongside
 * their content, and every string already has to be written and reviewed
 * directly regardless of where it lives.
 */

interface LocalizedText {
  en: string;
  ar: string;
  es: string;
  tr: string;
}

export interface NovelMeta {
  genre: LocalizedText;
  /** A real sentence from the novel's own retelling, chosen to read well standalone without spoiling the ending. */
  teaser: LocalizedText;
  /** Minutes at the app's own reading+typing pace (see estimateMinutes) — computed once from this novel's actual sentence content. */
  estimatedMinutes: number;
}

export const NOVEL_META: Record<string, NovelMeta> = {
  "book-novel-pride-prejudice": {
    genre: {
      en: "Classic romance",
      ar: "رومانسية كلاسيكية",
      es: "Romance clásico",
      tr: "Klasik romantizm",
    },
    teaser: {
      en: "He admired the warmth in her eyes even while telling himself he should not",
      ar: "أعجب بالدفء في عينيها حتى وهو يقنع نفسه بأنه لا ينبغي له ذلك",
      es: "Admiraba la calidez de sus ojos incluso mientras se decía que no debía hacerlo",
      tr: "Kendine bunu yapmaması gerektiğini söylerken bile gözlerindeki sıcaklığa hayran kalıyordu",
    },
    estimatedMinutes: 53,
  },
  "book-novel-great-gatsby": {
    genre: {
      en: "American classic",
      ar: "كلاسيكية أمريكية",
      es: "Clásico estadounidense",
      tr: "Amerikan klasiği",
    },
    teaser: {
      en: "His eyes seemed fixed on something far across the bay that only he could see",
      ar: "بدت عيناه ثابتتين على شيء بعيد عبر الخليج لا يراه سواه",
      es: "Sus ojos parecían fijos en algo lejano al otro lado de la bahía que solo él podía ver",
      tr: "Gözleri, yalnızca kendisinin görebildiği körfezin karşısındaki uzak bir şeye takılı kalmış gibiydi",
    },
    estimatedMinutes: 53,
  },
  "book-novel-little-prince": {
    genre: {
      en: "Philosophical fable",
      ar: "حكاية فلسفية",
      es: "Fábula filosófica",
      tr: "Felsefi masal",
    },
    teaser: {
      en: "The fox shared his secret that what is truly essential is invisible to the eye",
      ar: "شارك الثعلب سره وهو أن ما هو أساسي حقًا غير مرئي للعين",
      es: "El zorro compartió su secreto: lo verdaderamente esencial es invisible a los ojos",
      tr: "Tilki sırrını paylaştı: gerçekten önemli olan şey gözle görülemez",
    },
    estimatedMinutes: 55,
  },
  "book-novel-1984": {
    genre: {
      en: "Dystopian",
      ar: "ديستوبيا",
      es: "Distopía",
      tr: "Distopya",
    },
    teaser: {
      en: "Winston understood the disturbing party slogan that whoever controls the past controls the future",
      ar: "فهم وينستون الشعار المزعج للحزب بأن من يتحكم بالماضي يتحكم بالمستقبل",
      es: "Winston entendía el inquietante lema del Partido: quien controla el pasado controla el futuro",
      tr: "Winston, Parti'nin rahatsız edici sloganını anlıyordu: geçmişi kontrol eden geleceği kontrol eder",
    },
    estimatedMinutes: 53,
  },
  "book-novel-mockingbird": {
    genre: {
      en: "Coming-of-age classic",
      ar: "كلاسيكية نضج",
      es: "Clásico de iniciación",
      tr: "Büyüme hikayesi klasiği",
    },
    teaser: {
      en: "He reminded the jury softly that in a courtroom every man is truly equal",
      ar: "ذكّر هيئة المحلفين بلطف أن كل إنسان متساوٍ حقًا داخل قاعة المحكمة",
      es: "Recordó suavemente al jurado que dentro de un tribunal, todo hombre es verdaderamente igual",
      tr: "Jüriye, mahkeme salonunda her insanın gerçekten eşit olduğunu nazikçe hatırlattı",
    },
    estimatedMinutes: 53,
  },
  "book-novel-alchemist": {
    genre: {
      en: "Inspirational fable",
      ar: "حكاية ملهمة",
      es: "Fábula inspiradora",
      tr: "İlham verici masal",
    },
    teaser: {
      en: "Listening carefully to his own heart he explained was the truest form of real wisdom",
      ar: "أوضح أن الإصغاء بعناية لقلبك هو أصدق أشكال الحكمة الحقيقية",
      es: "Explicó que escuchar atentamente al propio corazón era la forma más verdadera de sabiduría real",
      tr: "Kendi kalbini dikkatle dinlemenin gerçek bilgeliğin en doğru biçimi olduğunu açıkladı",
    },
    estimatedMinutes: 54,
  },
  "book-novel-frankenstein": {
    genre: {
      en: "Gothic science fiction",
      ar: "خيال علمي قوطي",
      es: "Ciencia ficción gótica",
      tr: "Gotik bilim kurgu",
    },
    teaser: {
      en: "Instead of triumph Victor felt only sudden overwhelming horror at what he had truly made",
      ar: "بدلًا من الانتصار شعر فيكتور فقط برعب مفاجئ طاغٍ مما صنعه بالفعل",
      es: "En lugar de triunfo, Victor solo sintió un horror súbito y abrumador por lo que realmente había creado",
      tr: "Zafer yerine Victor, gerçekten yarattığı şeyden ani ve ezici bir dehşet duydu",
    },
    estimatedMinutes: 57,
  },
  "book-novel-old-man-sea": {
    genre: {
      en: "Literary adventure",
      ar: "مغامرة أدبية",
      es: "Aventura literaria",
      tr: "Edebi macera",
    },
    teaser: {
      en: "He talked to the unseen fish calling it brother and admiring its incredible hidden strength",
      ar: "تحدث إلى السمكة غير المرئية مناديًا إياها أخاه ومعجبًا بقوتها الخفية المذهلة",
      es: "Le hablaba al pez invisible llamándolo hermano y admirando su increíble fuerza oculta",
      tr: "Görünmeyen balığa kardeşim diyerek seslendi ve onun inanılmaz gizli gücüne hayran kaldı",
    },
    estimatedMinutes: 58,
  },
  "book-novel-alice-wonderland": {
    genre: {
      en: "Whimsical fantasy",
      ar: "خيال طريف",
      es: "Fantasía disparatada",
      tr: "Tuhaf fantastik",
    },
    teaser: {
      en: "The Caterpillar told her one side of the mushroom would make her grow and the other shrink",
      ar: "أخبرها اليسروع أن جانبًا من الفطر سيجعلها تكبر والجانب الآخر سيجعلها تصغر",
      es: "La oruga le dijo que un lado del hongo la haría crecer y el otro la haría encoger",
      tr: "Tırtıl ona mantarın bir tarafının onu büyüteceğini, diğer tarafının ise küçülteceğini söyledi",
    },
    estimatedMinutes: 57,
  },
  "book-novel-dracula": {
    genre: {
      en: "Gothic horror",
      ar: "رعب قوطي",
      es: "Terror gótico",
      tr: "Gotik korku",
    },
    teaser: {
      en: "From his window he once saw Dracula crawling headfirst down the outer castle wall",
      ar: "من نافذته رأى مرة دراكولا يزحف رأسًا على عقب أسفل الجدار الخارجي للقلعة",
      es: "Desde su ventana vio una vez a Drácula arrastrándose cabeza abajo por el muro exterior del castillo",
      tr: "Penceresinden bir keresinde Drakula'yı şatonun dış duvarından baş aşağı sürünerek inerken gördü",
    },
    estimatedMinutes: 54,
  },
  "book-novel-hound-baskervilles": {
    genre: {
      en: "Detective mystery",
      ar: "لغز بوليسي",
      es: "Misterio detectivesco",
      tr: "Polisiye gizem",
    },
    teaser: {
      en: "Strangely large paw prints were discovered in the mud near his lifeless body",
      ar: "اكتُشفت آثار مخالب كبيرة بشكل غريب في الطين بالقرب من جثته",
      es: "Se descubrieron extrañamente grandes huellas de garras en el barro cerca de su cuerpo sin vida",
      tr: "Cansız bedeninin yakınındaki çamurda tuhaf derecede büyük pençe izleri keşfedildi",
    },
    estimatedMinutes: 53,
  },
  "book-novel-crime-punishment": {
    genre: {
      en: "Psychological drama",
      ar: "دراما نفسية",
      es: "Drama psicológico",
      tr: "Psikolojik dram",
    },
    teaser: {
      en: "He pawned a small silver watch just to study her apartment and her habits closely",
      ar: "رهن ساعة فضية صغيرة لمجرد دراسة شقتها وعاداتها عن كثب",
      es: "Empeñó un pequeño reloj de plata solo para estudiar de cerca su apartamento y sus costumbres",
      tr: "Sadece dairesini ve alışkanlıklarını yakından incelemek için küçük gümüş bir saati rehine verdi",
    },
    estimatedMinutes: 62,
  },
  "book-novel-karamazov": {
    genre: {
      en: "Philosophical drama",
      ar: "دراما فلسفية",
      es: "Drama filosófico",
      tr: "Felsefi dram",
    },
    teaser: {
      en: "He told Alyosha a poem he had written about a returning Christ and a stern old Grand Inquisitor",
      ar: "أخبر أليوشا بقصيدة كتبها عن عودة المسيح ومحقق أكبر عجوز صارم",
      es: "Le contó a Aliosha un poema que había escrito sobre el regreso de Cristo y un severo y anciano Gran Inquisidor",
      tr: "Alyoşa'ya, geri dönen İsa ve sert, yaşlı bir Büyük Engizisyoncu hakkında yazdığı bir şiiri anlattı",
    },
    estimatedMinutes: 67,
  },
  "book-novel-idiot": {
    genre: {
      en: "Tragic romance",
      ar: "رومانسية مأساوية",
      es: "Romance trágico",
      tr: "Trajik romantizm",
    },
    teaser: {
      en: "Rogozhin burst in dramatically and offered her a staggering hundred thousand rubles on the spot",
      ar: "اقتحم روغوجين المكان بشكل درامي وعرض عليها على الفور مئة ألف روبل مذهلة",
      es: "Rogozhin irrumpió dramáticamente y le ofreció en el acto la asombrosa suma de cien mil rublos",
      tr: "Rogojin dramatik bir şekilde içeri daldı ve ona anında baş döndürücü yüz bin ruble teklif etti",
    },
    estimatedMinutes: 60,
  },
  "book-novel-hundred-years-solitude": {
    genre: {
      en: "Magical realism",
      ar: "واقعية سحرية",
      es: "Realismo mágico",
      tr: "Büyülü gerçekçilik",
    },
    teaser: {
      en: "She ascended calmly past the treetops, waving gently, and was never seen again by anyone",
      ar: "صعدت بهدوء متجاوزة قمم الأشجار، تلوّح برفق، ولم يرها أحد مرة أخرى قط",
      es: "Ascendió tranquilamente por encima de las copas de los árboles, saludando con la mano, y nadie volvió a verla jamás",
      tr: "Ağaç tepelerinin üzerinden sakince yükseldi, hafifçe el salladı ve bir daha kimse tarafından görülmedi",
    },
    estimatedMinutes: 66,
  },
  "book-novel-memory-of-flesh": {
    genre: {
      en: "Literary romance",
      ar: "رومانسية أدبية",
      es: "Romance literario",
      tr: "Edebi romantizm",
    },
    teaser: {
      en: "She embodied his lost homeland, his lost youth, his lost arm, and his lost commander all at once",
      ar: "جسّدت وطنه المفقود وشبابه المفقود وذراعه المفقودة وقائده المفقود كلهم في آن واحد",
      es: "Ella encarnaba a la vez su patria perdida, su juventud perdida, su brazo perdido y su comandante perdido",
      tr: "Kaybettiği vatanını, gençliğini, kolunu ve komutanını aynı anda somutlaştırıyordu",
    },
    estimatedMinutes: 53,
  },
  "book-novel-animal-farm": {
    genre: {
      en: "Political satire",
      ar: "سخرية سياسية",
      es: "Sátira política",
      tr: "Siyasi hiciv",
    },
    teaser: {
      en: "He taught them a stirring song called Beasts of England about that imagined animal paradise",
      ar: "علّمهم أغنية مؤثرة اسمها وحوش إنجلترا عن تلك الجنة الحيوانية المتخيلة",
      es: "Les enseñó una conmovedora canción llamada Bestias de Inglaterra sobre ese imaginado paraíso animal",
      tr: "Onlara hayal edilen o hayvan cennetiyle ilgili İngiltere'nin Hayvanları adında etkileyici bir şarkı öğretti",
    },
    estimatedMinutes: 41,
  },
  "book-novel-letters-to-milena": {
    genre: {
      en: "Real correspondence",
      ar: "مراسلات حقيقية",
      es: "Correspondencia real",
      tr: "Gerçek mektuplaşma",
    },
    teaser: {
      en: "He once wrote that her letters were the only real air he had to breathe that week",
      ar: "كتب مرة أن رسائلها كانت الهواء الحقيقي الوحيد الذي تنفسه ذلك الأسبوع",
      es: "Una vez escribió que sus cartas eran el único aire real que tenía para respirar esa semana",
      tr: "Bir keresinde onun mektuplarının o hafta solumak için sahip olduğu tek gerçek hava olduğunu yazdı",
    },
    estimatedMinutes: 42,
  },
  "book-novel-dear-theo": {
    genre: {
      en: "Artist's real letters",
      ar: "رسائل فنان حقيقية",
      es: "Cartas reales de un artista",
      tr: "Bir Sanatçının Gerçek Mektupları",
    },
    teaser: {
      en: "There he created Starry Night, its sky churning with the restless energy he felt inside himself",
      ar: "هناك رسم ليلة النجوم، بسمائها المضطربة بالطاقة القلقة التي شعر بها في داخله",
      es: "Allí creó La noche estrellada, con su cielo agitado por la energía inquieta que sentía en su interior",
      tr: "Orada, içinde hissettiği huzursuz enerjiyle çalkalanan gökyüzüyle Yıldızlı Gece'yi yarattı",
    },
    estimatedMinutes: 44,
  },
  "book-novel-les-miserables": {
    genre: {
      en: "Epic redemption",
      ar: "ملحمة خلاص",
      es: "Épica de redención",
      tr: "Destansı kurtuluş",
    },
    teaser: {
      en: "Alone with Valjean, the bishop quietly told him his soul had just been bought for God",
      ar: "بمفرده مع فالجان، أخبره الأسقف بهدوء أن روحه اشتُريت للتو من أجل الله",
      es: "A solas con Valjean, el obispo le dijo en voz baja que su alma acababa de ser comprada para Dios",
      tr: "Valjean'la yalnız kalan piskopos, ona ruhunun az önce Tanrı için satın alındığını sessizce söyledi",
    },
    estimatedMinutes: 65,
  },
};

/** Resolves a novel's metadata text for the current locale, English when no support locale is active — same fallback convention as tierLabel/tierSupportLabel. */
export function novelMetaText(text: LocalizedText, locale: SupportLocale | null): string {
  return locale ? text[locale] : text.en;
}
