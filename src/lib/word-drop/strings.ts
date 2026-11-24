/**
 * The words Word Drop shows, in the three languages the site offers (Arabic, Spanish, Turkish).
 * Kept in this folder so the game can ship without touching the shared dictionaries.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface WordDropStrings {
  navLabel: string;
  headline1: string;
  headline2: string;
  easy: string;
  easyHint: string;
  mid: string;
  midHint: string;
  hard: string;
  hardHint: string;
  hardUnavailable: string;
  source: string;
  start: string;
  exit: string;
  points: string;
  placeholder: string;
  switchKeyboard: string;
  roundEnd: string;
  accuracy: string;
  accuracyLine: string;
  wordsPerMinute: string;
  wordsTyped: string;
  bestCombo: string;
  /** "{n}" points above the previous best. */
  newBest: string;
  missedTitle: string;
  tapToSave: string;
  saved: string;
  noMisses: string;
  again: string;
  back: string;
  soundLabel: string;
  /** The daily challenge card on the start page. */
  dailyTitle: string;
  dailyLine: string;
  dailyStart: string;
  /** The heading of the countries list. */
  countriesTitle: string;
  /** "{n}" players. */
  playersCount: string;
  /** The start page of the daily challenge itself. */
  dailyHeadline1: string;
  dailyHeadline2: string;
  dailyMode: string;
  /** The start page of a friend's challenge: "{n}" is the score to beat. */
  friendHeadline1: string;
  friendHeadline2: string;
  friendMode: string;
  /** "{n}" points: what to beat. */
  toBeat: string;
  /** End page of a challenge, "{n}" points. */
  beatFriend: string;
  missFriend: string;
  tieFriend: string;
  /** End page of the daily challenge: "{rank}" of "{total}" players of the level. */
  yourPlace: string;
  /** "{n}" points: the day's best, shown when this round did not beat it. */
  dayBest: string;
  rankSaved: string;
  signInToRank: string;
  challengeFriend: string;
  shareResult: string;
  linkCopied: string;
  cardSaved: string;
  challengeText: string;
  shareText: string;
  cardScore: string;
  cardAccuracy: string;
  cardSpeed: string;
  cardTagline: string;
  /** Sentences mode (level 2 and 3): short sentences fall and are typed whole. */
  sentences: string;
  sentencesHint: string;
  /** The switch that puts the learner's own words and mistakes first in a free round: "{n}" words. */
  myWordsTitle: string;
  myWordsLine: string;
  /** Said on the start page when the pool has no word to drop. */
  emptyPool: string;
  /** Shown when the Hard-mode / Sentences pool is too small. */
  tooFewSentences: string;
  /** Notices of things that did not work. */
  saveFailed: string;
  shareFailed: string;
  rankFailed: string;
  rankLimit: string;
  /** Said under the end page's buttons for a round of the learner's own words, which cannot be sent as a challenge. */
  noChallengeOwn: string;
  /** The small card on Home: one line about the game and the button's words. */
  homeLine: string;
  homeCta: string;
  /** The side list of the words caught this round (laptop), with its empty line and the level label ("{n}"). */
  caughtTitle: string;
  caughtEmpty: string;
  levelLabel: string;
  /** The freeze power-up button, and the notes that flash on the field: a streak ("{n}" in a row) and a freeze earned. */
  freezeLabel: string;
  bannerStreak: string;
  bannerFreezeGain: string;
  /** The tag before a word that fell, under the typing line. */
  missedTag: string;
  /** The end page's pace chart. */
  rhythmTitle: string;
  rhythmHint: string;
  soundToggle: string;
  /** The sample on the mode cards of the start page: the meaning of "spouse", and a short sentence with its meaning. */
  sampleMeaning: string;
  sampleSentence: string;
  sampleSentenceMeaning: string;
}

const AR: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "اكتب الكلمة",
  headline2: "قبل ما تسقط",
  easy: "سهل",
  easyHint: "ترى الكلمة وتكتبها",
  mid: "متوسط",
  midHint: "ترى المعنى بالعربي وتكتب الإنجليزي",
  hard: "صعب",
  hardHint: "تسمع الكلمة فقط وتكتب ما سمعت",
  hardUnavailable: "غير متاح لهذا المستوى بعد",
  source: "الكلمات من قوائم مستواك · دقيقتان",
  start: "ابدأ الجولة",
  exit: "خروج",
  points: "نقطة",
  placeholder: "اكتب هنا",
  switchKeyboard: "بدّل الكيبورد إلى الإنجليزي",
  roundEnd: "انتهت الجولة",
  accuracy: "الدقة",
  accuracyLine: "حروف كتبتها صح من أول مرة",
  wordsPerMinute: "كلمة بالدقيقة",
  wordsTyped: "كلمة كتبتها",
  bestCombo: "أعلى كومبو",
  newBest: "أفضل من جولتك السابقة بـ {n} نقطة.",
  missedTitle: "كلمات فاتتك",
  tapToSave: "اضغط الكلمة لتضيفها إلى كلماتي",
  saved: "في كلماتي",
  noMisses: "ما فاتتك ولا كلمة.",
  again: "جولة أخرى",
  back: "العودة",
  soundLabel: "أعد الصوت",
  dailyTitle: "تحدي اليوم",
  dailyLine: "نفس الكلمات للجميع بمستواك، والترتيب حسب الدولة",
  dailyStart: "ابدأ تحدي اليوم",
  countriesTitle: "الدول اليوم",
  playersCount: "{n} لاعب",
  dailyHeadline1: "تحدي اليوم",
  dailyHeadline2: "نفس الكلمات للجميع",
  dailyMode: "متوسط · المعنى بالعربي وتكتب الإنجليزي",
  friendHeadline1: "تحدّاك صديق",
  friendHeadline2: "تغلّب على نتيجته",
  friendMode: "نفس كلمات صديقك وبنفس الترتيب",
  toBeat: "المطلوب أكثر من {n} نقطة",
  beatFriend: "تغلبت على صديقك بـ {n} نقطة.",
  missFriend: "بقي لك {n} نقطة لتتغلب عليه.",
  tieFriend: "تعادلتما.",
  yourPlace: "مركزك {rank} من {total} بمستواك",
  dayBest: "أفضل نتيجة لك اليوم {n}",
  rankSaved: "تم حفظ نتيجتك في ترتيب اليوم",
  signInToRank: "سجّل دخولك لتدخل الترتيب",
  challengeFriend: "تحدَّ صديقك",
  shareResult: "شارك النتيجة",
  linkCopied: "نُسخ رابط التحدي",
  cardSaved: "نزلت البطاقة",
  challengeText: "تغلّب على نتيجتي في Word Drop: {n} نقطة",
  shareText: "نتيجتي في Word Drop: {n} نقطة",
  cardScore: "نقطة",
  cardAccuracy: "دقة",
  cardSpeed: "كلمة/دقيقة",
  cardTagline: "اكتب الكلمة قبل ما تسقط",
  sentences: "جمل",
  sentencesHint: "جمل قصيرة تسقط وتكتبها كاملة",
  myWordsTitle: "كلماتي أولاً",
  myWordsLine: "تبدأ الجولة بكلماتك الضعيفة والمحفوظة ({n})",
  emptyPool: "ما توفرت كلمات لهذه الجولة. جرّب لاحقاً.",
  tooFewSentences: "لا توجد جمل كافية بعد",
  saveFailed: "ما قدرنا نحفظ الكلمة. جرّب مرة ثانية.",
  shareFailed: "ما تم المشاركة. جرّب مرة ثانية.",
  rankFailed: "ما قدرنا نسجّل نتيجتك في الترتيب.",
  rankLimit: "لم تُسجَّل هذه النتيجة: انتظر قليلاً بين جولتين من التحدي.",
  noChallengeOwn: "جولة كلماتك لا تُرسل كتحدي؛ العب جولة عادية لتتحدى صديقك.",
  homeLine: "كلمات تسقط من فوق، اكتبها قبل ما تنزل",
  homeCta: "العب",
  caughtTitle: "صدتها",
  caughtEmpty: "الكلمات اللي تصيدها تظهر هنا بمعناها. اضغط على أي كلمة لتسمعها مرة ثانية.",
  levelLabel: "المستوى {n}",
  freezeLabel: "تجميد",
  bannerStreak: "سلسلة ×{n}",
  bannerFreezeGain: "+1 تجميد",
  missedTag: "فاتتك",
  rhythmTitle: "إيقاعك في الجولة",
  rhythmHint: "كلما ارتفع العمود كنت أسرع، والنقطة الحمراء كلمة فاتتك",
  soundToggle: "الصوت",
  sampleMeaning: "الزوج",
  sampleSentence: "my aunt is a nurse",
  sampleSentenceMeaning: "عمتي ممرضة",
};

const ES: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "Escribe la palabra",
  headline2: "antes de que caiga",
  easy: "Fácil",
  easyHint: "Ves la palabra y la escribes",
  mid: "Medio",
  midHint: "Ves el significado y escribes la palabra en inglés",
  hard: "Difícil",
  hardHint: "Solo oyes la palabra y escribes lo que oyes",
  hardUnavailable: "Aún no disponible para tu nivel",
  source: "Palabras de las listas de tu nivel · 2 minutos",
  start: "Empezar la ronda",
  exit: "Salir",
  points: "puntos",
  placeholder: "Escribe aquí",
  switchKeyboard: "Cambia el teclado a inglés",
  roundEnd: "Ronda terminada",
  accuracy: "Precisión",
  accuracyLine: "Letras escritas bien a la primera",
  wordsPerMinute: "palabras por minuto",
  wordsTyped: "palabras escritas",
  bestCombo: "Mejor combo",
  newBest: "{n} puntos más que tu ronda anterior.",
  missedTitle: "Palabras que fallaste",
  tapToSave: "Toca una palabra para guardarla en Mis palabras",
  saved: "En Mis palabras",
  noMisses: "No fallaste ninguna palabra.",
  again: "Otra ronda",
  back: "Volver",
  soundLabel: "Repetir el sonido",
  dailyTitle: "Reto del día",
  dailyLine: "Las mismas palabras para todos en tu nivel, con clasificación por país",
  dailyStart: "Empezar el reto del día",
  countriesTitle: "Países hoy",
  playersCount: "{n} jugadores",
  dailyHeadline1: "Reto del día",
  dailyHeadline2: "Las mismas palabras para todos",
  dailyMode: "Medio · ves el significado y escribes en inglés",
  friendHeadline1: "Un amigo te reta",
  friendHeadline2: "Supera su resultado",
  friendMode: "Las mismas palabras de tu amigo, en el mismo orden",
  toBeat: "Necesitas más de {n} puntos",
  beatFriend: "Superaste a tu amigo por {n} puntos.",
  missFriend: "Te faltan {n} puntos para superarlo.",
  tieFriend: "Empate.",
  yourPlace: "Vas {rank} de {total} en tu nivel",
  dayBest: "Tu mejor resultado de hoy: {n}",
  rankSaved: "Tu resultado quedó en la clasificación del día",
  signInToRank: "Inicia sesión para entrar en la clasificación",
  challengeFriend: "Reta a un amigo",
  shareResult: "Compartir resultado",
  linkCopied: "Enlace del reto copiado",
  cardSaved: "Tarjeta guardada",
  challengeText: "Supera mi resultado en Word Drop: {n} puntos",
  shareText: "Mi resultado en Word Drop: {n} puntos",
  cardScore: "puntos",
  cardAccuracy: "precisión",
  cardSpeed: "pal./min",
  cardTagline: "Escribe la palabra antes de que caiga",
  sentences: "Frases",
  sentencesHint: "Caen frases cortas y las escribes enteras",
  myWordsTitle: "Mis palabras primero",
  myWordsLine: "La ronda empieza con tus palabras débiles y guardadas ({n})",
  emptyPool: "No hay palabras para esta ronda. Inténtalo más tarde.",
  tooFewSentences: "Aún no hay frases suficientes",
  saveFailed: "No pudimos guardar la palabra. Inténtalo de nuevo.",
  shareFailed: "No se pudo compartir. Inténtalo de nuevo.",
  rankFailed: "No pudimos registrar tu resultado en la clasificación.",
  rankLimit: "Este resultado no se registró: espera un poco entre dos rondas del reto.",
  noChallengeOwn:
    "Una ronda con tus palabras no se envía como reto; juega una ronda normal para retar a un amigo.",
  homeLine: "Las palabras caen: escríbelas antes de que bajen",
  homeCta: "Jugar",
  caughtTitle: "Atrapadas",
  caughtEmpty:
    "Las palabras que atrapes aparecen aquí con su significado. Toca una para oírla otra vez.",
  levelLabel: "Nivel {n}",
  freezeLabel: "Congelar",
  bannerStreak: "Racha ×{n}",
  bannerFreezeGain: "+1 congelar",
  missedTag: "Perdida",
  rhythmTitle: "Tu ritmo en la ronda",
  rhythmHint: "Cuanto más alta la barra, más rápido fuiste; el punto rojo es una palabra perdida",
  soundToggle: "Sonido",
  sampleMeaning: "el cónyuge",
  sampleSentence: "my aunt is a nurse",
  sampleSentenceMeaning: "mi tía es enfermera",
};

const TR: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "Kelimeyi yaz",
  headline2: "düşmeden önce",
  easy: "Kolay",
  easyHint: "Kelimeyi görür ve yazarsın",
  mid: "Orta",
  midHint: "Anlamı görür, İngilizcesini yazarsın",
  hard: "Zor",
  hardHint: "Kelimeyi yalnızca duyar ve duyduğunu yazarsın",
  hardUnavailable: "Bu seviye için henüz yok",
  source: "Seviyenin kelime listelerinden · 2 dakika",
  start: "Turu başlat",
  exit: "Çık",
  points: "puan",
  placeholder: "Buraya yaz",
  switchKeyboard: "Klavyeyi İngilizceye çevir",
  roundEnd: "Tur bitti",
  accuracy: "Doğruluk",
  accuracyLine: "İlk seferde doğru yazdığın harfler",
  wordsPerMinute: "dakikada kelime",
  wordsTyped: "yazdığın kelime",
  bestCombo: "En yüksek kombo",
  newBest: "Önceki turundan {n} puan fazla.",
  missedTitle: "Kaçırdığın kelimeler",
  tapToSave: "Kelimelerime eklemek için kelimeye dokun",
  saved: "Kelimelerimde",
  noMisses: "Hiç kelime kaçırmadın.",
  again: "Bir tur daha",
  back: "Geri",
  soundLabel: "Sesi tekrar çal",
  dailyTitle: "Günün meydan okuması",
  dailyLine: "Seviyendeki herkes için aynı kelimeler, ülkelere göre sıralama",
  dailyStart: "Günün meydan okumasını başlat",
  countriesTitle: "Bugün ülkeler",
  playersCount: "{n} oyuncu",
  dailyHeadline1: "Günün meydan okuması",
  dailyHeadline2: "Herkes için aynı kelimeler",
  dailyMode: "Orta · anlamı görür, İngilizcesini yazarsın",
  friendHeadline1: "Bir arkadaşın sana meydan okudu",
  friendHeadline2: "Sonucunu geç",
  friendMode: "Arkadaşınla aynı kelimeler, aynı sırada",
  toBeat: "{n} puandan fazlası gerekiyor",
  beatFriend: "Arkadaşını {n} puanla geçtin.",
  missFriend: "Onu geçmek için {n} puan kaldı.",
  tieFriend: "Berabere.",
  yourPlace: "Seviyende {total} kişi arasında {rank}. sıradasın",
  dayBest: "Bugünkü en iyi sonucun: {n}",
  rankSaved: "Sonucun günün sıralamasına kaydedildi",
  signInToRank: "Sıralamaya girmek için giriş yap",
  challengeFriend: "Arkadaşına meydan oku",
  shareResult: "Sonucu paylaş",
  linkCopied: "Meydan okuma bağlantısı kopyalandı",
  cardSaved: "Kart kaydedildi",
  challengeText: "Word Drop'ta sonucumu geç: {n} puan",
  shareText: "Word Drop sonucum: {n} puan",
  cardScore: "puan",
  cardAccuracy: "doğruluk",
  cardSpeed: "kelime/dk",
  cardTagline: "Kelimeyi düşmeden önce yaz",
  sentences: "Cümleler",
  sentencesHint: "Kısa cümleler düşer, hepsini yazarsın",
  myWordsTitle: "Önce kelimelerim",
  myWordsLine: "Tur, zayıf ve kayıtlı kelimelerinle başlar ({n})",
  emptyPool: "Bu tur için kelime yok. Sonra tekrar dene.",
  tooFewSentences: "Henüz yeterli cümle yok",
  saveFailed: "Kelime kaydedilemedi. Tekrar dene.",
  shareFailed: "Paylaşılamadı. Tekrar dene.",
  rankFailed: "Sonucun sıralamaya kaydedilemedi.",
  rankLimit: "Bu sonuç kaydedilmedi: meydan okuma turları arasında biraz bekle.",
  noChallengeOwn:
    "Kendi kelimelerinle oynanan tur meydan okuma olarak gönderilmez; arkadaşına meydan okumak için normal bir tur oyna.",
  homeLine: "Kelimeler düşer, inmeden önce yaz",
  homeCta: "Oyna",
  caughtTitle: "Yakalananlar",
  caughtEmpty: "Yakaladığın kelimeler anlamıyla burada görünür. Tekrar dinlemek için birine dokun.",
  levelLabel: "Seviye {n}",
  freezeLabel: "Dondur",
  bannerStreak: "Seri ×{n}",
  bannerFreezeGain: "+1 dondur",
  missedTag: "Kaçtı",
  rhythmTitle: "Turdaki ritmin",
  rhythmHint: "Çubuk yükseldikçe daha hızlıydın; kırmızı nokta kaçan kelime",
  soundToggle: "Ses",
  sampleMeaning: "eş",
  sampleSentence: "my aunt is a nurse",
  sampleSentenceMeaning: "teyzem hemşire",
};

export function wordDropStrings(locale: SupportLocale | null): WordDropStrings {
  if (locale === "es") return ES;
  if (locale === "tr") return TR;
  return AR;
}
