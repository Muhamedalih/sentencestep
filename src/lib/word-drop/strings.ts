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
  friendMode: "جولة جديدة بكلمات مستواه",
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
  friendMode: "Una ronda nueva con palabras de su nivel",
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
  friendMode: "Onun seviyesindeki kelimelerle yeni bir tur",
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
};

export function wordDropStrings(locale: SupportLocale | null): WordDropStrings {
  if (locale === "es") return ES;
  if (locale === "tr") return TR;
  return AR;
}
