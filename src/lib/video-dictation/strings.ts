/**
 * The words Video dictation shows. Arabic only for now (the section is open to admins only): the
 * function already takes the locale, so Spanish and Turkish can be added here without touching the
 * shared dictionaries, the way the rule of the day does it (see daily-rule/strings.ts).
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { VideoKind } from "./types";

export interface VideoStrings {
  navLabel: string;
  libraryTitle: string;
  librarySubtitle: string;
  levelAll: string;
  libraryEmpty: string;
  /** "{n}" sentences. */
  sentenceCount: string;
  start: string;
  carryOn: string;
  finished: string;
  back: string;
  pressPlay: string;
  pressPlayHint: string;
  replay: string;
  slow: string;
  hideWords: string;
  showWords: string;
  continueNow: string;
  resumingSoon: string;
  adPlaying: string;
  /** Under the quiet wave while the speakers are silent. */
  listeningHint: string;
  /** "{n}" of "{total}". */
  progress: string;
  finishTitle: string;
  /** "{percent}" accuracy, "{count}" sentences. */
  accuracyLine: string;
  reviewWords: string;
  nextVideo: string;
  watchFull: string;
  backToLibrary: string;
  /** The new finish screen (the "videoFinish" permission). "{clean}" of "{total}" sentences without a mistake. */
  finishCleanLine: string;
  /** The same line when every sentence was typed without a mistake. */
  finishAllClean: string;
  finishWordsLabel: string;
  finishStatSentences: string;
  finishStatClean: string;
  finishStatWords: string;
  /** Put before the next video's title (the title follows in its own element). */
  finishNext: string;
  finishWatch: string;
  /** The look of the finish page in the "videoFinishLook" permission. */
  finishAccuracy: string;
  finishWords: string;
  finishBarLabel: string;
  finishBarGreat: string;
  finishBarKeep: string;
  /** The training on the video's words. */
  trainButton: string;
  trainListen: string;
  trainReplay: string;
  trainDone: string;
  trainBack: string;
  /** "{channel}" */
  videoFrom: string;
  watchOnYouTube: string;
  unavailableTitle: string;
  unavailableBody: string;
  blockedBody: string;
  /** The «جديد» line on Home (the "videoNews" permission). */
  newsTitle: string;
  newsBody: string;
  newsOpen: string;
  newsDismiss: string;
  /** The names of the sections of the library, one per kind of video. */
  kinds: Record<VideoKind, string>;
  /** The shelves look of the library (the "videoShelves" permission): its header, its section names with one line each, and the shelf controls. */
  shelfEyebrow: string;
  shelfTitle: string;
  shelfSubtitle: string;
  shelfKinds: Record<VideoKind, { name: string; line: string }>;
  shelfShowAll: string;
  shelfShowLess: string;
  shelfPrevious: string;
  shelfNext: string;
  /** The Admin's arrange mode of the library. */
  arrange: string;
  arrangeHint: string;
  arrangeSave: string;
  arrangeSaving: string;
  arrangeCancel: string;
  arrangeReset: string;
  arrangeResetConfirm: string;
  arrangeEmptySection: string;
  /** Deleting a video in the arrange mode: the trash button's label ("{title}" follows), the list of deleted videos, restoring one. */
  removeVideo: string;
  removedTitle: string;
  removedHint: string;
  restoreVideo: string;
  moveUp: string;
  moveDown: string;
  moveSectionUp: string;
  moveSectionDown: string;
  /** The label of the list that moves a video to another section: "{title}". */
  sectionOf: string;
  arrangeSaved: string;
  arrangeResetDone: string;
  arrangeFailed: string;
  arrangeNotAllowed: string;
  arrangeInvalid: string;
  arrangeNoTable: string;
  /** The Admin's editor of where each sentence starts and where the video stops. */
  stopsOpen: string;
  stopsTitle: string;
  stopsHint: string;
  stopsStart: string;
  stopsEnd: string;
  stopsNow: string;
  stopsTest: string;
  stopsSave: string;
  stopsSaving: string;
  stopsReset: string;
  stopsResetConfirm: string;
  stopsClose: string;
  stopsSaved: string;
  stopsResetDone: string;
  stopsFailed: string;
  stopsNotAllowed: string;
  stopsInvalid: string;
  stopsNoTable: string;
  /** The editor's status line: what is on screen is what everyone plays / is not saved yet / could not be saved. */
  stopsStateSaved: string;
  stopsStateUnsaved: string;
  stopsStateFailed: string;
  /** The editor's note on how late this device stops: "{s}" seconds. */
  stopsDeviceLead: string;
  /** The editor's by-ear offset for this device: label, what it does, and the button that sets it back to zero. */
  stopsOffsetLabel: string;
  stopsOffsetHint: string;
  stopsOffsetZero: string;
}

const ar: VideoStrings = {
  navLabel: "فيديو",
  libraryTitle: "فيديو",
  librarySubtitle: "اسمع الجملة من فيديو حقيقي واكتبها. الفيديو يُعرض من يوتيوب مباشرة.",
  levelAll: "الكل",
  libraryEmpty: "لا توجد فيديوهات جاهزة بعد.",
  sentenceCount: "{n} جمل",
  start: "ابدأ",
  carryOn: "تابع",
  finished: "أنهيته",
  back: "رجوع",
  pressPlay: "اضغط زر التشغيل داخل الفيديو",
  pressPlayHint: "ثم اكتب الجملة بعد ما تسمعها",
  replay: "إعادة",
  slow: "بطيء",
  hideWords: "إخفاء الكلمات",
  showWords: "إظهار الكلمات",
  continueNow: "كمّل الآن",
  resumingSoon: "يكمل الفيديو بعد لحظة…",
  adPlaying: "إعلان من يوتيوب… يكمل الفيديو بعده",
  listeningHint: "استمع…",
  progress: "{n} / {total}",
  finishTitle: "أنهيت الفيديو",
  accuracyLine: "دقة الكتابة {percent}% · {count} جمل",
  reviewWords: "كلمات للمراجعة",
  nextVideo: "الفيديو التالي",
  watchFull: "شاهد الفيديو كاملاً على يوتيوب",
  backToLibrary: "العودة إلى الفيديوهات",
  finishCleanLine: "دقة الكتابة · {clean} من {total} جمل بلا أخطاء",
  finishAllClean: "دقة الكتابة · كل الجمل بلا أخطاء",
  finishWordsLabel: "كلمات أخطأت فيها · اضغط الكلمة لتسمعها",
  finishStatSentences: "جمل كتبتها",
  finishStatClean: "بلا أخطاء",
  finishStatWords: "كلمة كتبتها",
  finishNext: "التالي:",
  finishWatch: "شاهده على يوتيوب",
  finishAccuracy: "الدقة",
  finishWords: "كلمة كتبتها",
  finishBarLabel: "كلمات كتبتها صح من أول مرة",
  finishBarGreat: "كتابة ممتازة. كلماتك بدأت تثبت",
  finishBarKeep: "كل كلمة تكتبها تقرّبك أكثر. جرّب التدريب لتثبّتها",
  trainButton: "تدرّب على كلمات الفيديو",
  trainListen: "استمع إلى الكلمة واكتبها",
  trainReplay: "أعد الصوت",
  trainDone: "أتقنت كلمات الفيديو",
  trainBack: "رجوع",
  videoFrom: "الفيديو من قناة {channel}، ويُعرض من يوتيوب",
  watchOnYouTube: "Watch on YouTube",
  unavailableTitle: "الفيديو غير متاح حالياً",
  unavailableBody: "صاحب الفيديو منع عرضه هنا أو حذفه. جرّب فيديو آخر.",
  blockedBody: "تعذّر تحميل مشغّل يوتيوب. تأكد من الاتصال وجرّب مرة ثانية.",
  newsTitle: "جديد: قسم «فيديو»",
  newsBody: "اسمع الجملة من مقطع حقيقي واكتبها",
  newsOpen: "جرّب الآن",
  newsDismiss: "إغلاق",
  kinds: {
    comedy: "كوميدي",
    english: "تعلّم الإنجليزية",
    science: "علوم وبيئة",
    animals: "حيوانات",
    motivation: "تحفيزي",
    other: "أخرى",
  },
  shelfEyebrow: "فيديو",
  shelfTitle: "الإنجليزي كما يتكلّمه أهله",
  shelfSubtitle: "مقاطع قصيرة من يوتيوب، وكل رفّ مرتّب من الأسهل إلى الأصعب.",
  shelfKinds: {
    comedy: { name: "مواقف تضحك", line: "حوارات قصيرة ومضحكة بالإنجليزي اليومي" },
    science: { name: "حقائق في دقيقة", line: "راوٍ واحد بصوت واضح، ومعلومة غريبة في كل مقطع" },
    motivation: { name: "حكايات قصيرة", line: "قصة كاملة لها بداية ونهاية، في أقل من دقيقة" },
    english: { name: "إنجليزي واضح", line: "نطق هادئ وواضح من دروس ونشرات حقيقية" },
    animals: { name: "عالم الحيوان", line: "حقائق عن الحيوانات بصوت راوٍ واضح" },
    other: { name: "منوّعات", line: "مقاطع من كل نوع" },
  },
  shelfShowAll: "عرض الكل",
  shelfShowLess: "عرض أقل",
  shelfPrevious: "السابق",
  shelfNext: "التالي",
  arrange: "ترتيب الفيديوهات",
  arrangeHint:
    "اسحب الفيديو لتغيير مكانه، أو استعمل الأسهم والقائمة. زر السلة يحذف الفيديو من الموقع عند الحفظ.",
  arrangeSave: "حفظ الترتيب",
  arrangeSaving: "جارٍ الحفظ…",
  arrangeCancel: "إلغاء",
  arrangeReset: "العودة للترتيب الافتراضي",
  arrangeResetConfirm:
    "ترجع الأقسام والفيديوهات إلى ترتيبها الافتراضي، ويُحذف ترتيبك المحفوظ؟ (الفيديوهات المحذوفة تبقى محذوفة.)",
  arrangeEmptySection: "لا توجد فيديوهات هنا. انقل فيديو إليه من قائمة القسم.",
  removeVideo: "حذف الفيديو",
  removedTitle: "فيديوهات محذوفة",
  removedHint: "لا تظهر لأحد بعد الحفظ. اضغط «استرجاع» لتعيد الفيديو إلى قسمه.",
  restoreVideo: "استرجاع",
  moveUp: "أعلى",
  moveDown: "أسفل",
  moveSectionUp: "نقل القسم للأعلى",
  moveSectionDown: "نقل القسم للأسفل",
  sectionOf: "قسم الفيديو: {title}",
  arrangeSaved: "تم حفظ الترتيب.",
  arrangeResetDone: "رجع الترتيب إلى الافتراضي.",
  arrangeFailed: "تعذّر الحفظ. جرّب مرة ثانية.",
  arrangeNotAllowed: "هذا الخيار للأدمن فقط.",
  arrangeInvalid: "الترتيب غير صالح، لم يُحفظ شيء.",
  arrangeNoTable:
    "تعذّر الحفظ: جدول الترتيب غير موجود بعد في قاعدة البيانات (الملف 20250353000000).",
  stopsOpen: "ضبط التوقف",
  stopsTitle: "ضبط توقف الفيديو",
  stopsHint:
    "البداية: من أين تُعاد الجملة. التوقف: أين يقف الفيديو بعدها. حرّك بالأزرار أو قف بالفيديو على اللحظة واضغط «الآن»، ثم جرّب. كل تعديل يُحفظ للجميع تلقائيًا بعد لحظة.",
  stopsStart: "البداية",
  stopsEnd: "التوقف",
  stopsNow: "الآن",
  stopsTest: "جرّب",
  stopsSave: "حفظ التوقف",
  stopsSaving: "جارٍ الحفظ…",
  stopsReset: "الرجوع للأصلي",
  stopsResetConfirm: "ترجع كل أوقات هذا الفيديو إلى الأصلية ويُحذف ما حفظته؟",
  stopsClose: "إغلاق",
  stopsSaved: "تم حفظ التوقف، ويظهر للجميع.",
  stopsResetDone: "رجعت الأوقات إلى الأصلية.",
  stopsFailed: "تعذّر الحفظ. جرّب مرة ثانية.",
  stopsNotAllowed: "هذا الخيار للأدمن فقط.",
  stopsInvalid: "الأوقات غير صالحة (جملة أقصر من 0.3 ثانية أو توقفات غير مرتبة)، لم يُحفظ شيء.",
  stopsNoTable: "تعذّر الحفظ: جدول الأوقات غير موجود بعد في قاعدة البيانات (الملف 20250354000000).",
  stopsStateSaved: "ما تراه الآن محفوظ، ويشاهده الجميع هكذا.",
  stopsStateUnsaved: "تعديلاتك لم تُحفظ بعد، ولا يراها غير حسابك. تُحفظ تلقائيًا بعد لحظة.",
  stopsStateFailed: "لم تُحفظ تعديلاتك، ولا يراها غير حسابك.",
  stopsDeviceLead:
    "هذا الجهاز يطلب التوقف قبل نهاية الجملة بـ {s} ثانية ليعوّض تأخره، ويتعلّمها وحده من توقفاته.",
  stopsOffsetLabel: "تعويض بالأذن",
  stopsOffsetHint:
    "لهذا الجهاز فقط وكل الفيديوهات عليه: إن دخل صوت الجملة التالية قبل التوقف فزِد (+)، وإن قُطعت نهاية الجملة فانقص (−). جرّب جملة بزر «جرّب» بعد كل خطوة.",
  stopsOffsetZero: "صفر",
};

/** What the one-time rating card after a finished video asks, in the learner's own language (null is English). */
export interface VideoRatingCopy {
  headline: string;
  subtitle: string;
  commentPlaceholder: string;
  thanksTitle: string;
  thanksBody: string;
}

const ratingAr: VideoRatingCopy = {
  headline: "ما رأيك في قسم الفيديو الجديد؟",
  subtitle:
    "أضفنا هذا القسم ليكون تعلّم الإنجليزية من مقاطع حقيقية أمتع وأقرب إلى الواقع، ورأيك الصادق هو ما يهدينا إلى تحسينه. اختر عدد النجوم، وأخبرنا بما أعجبك وبما ينبغي أن نطوّره في الموقع. التقييم اختياري ولا يستغرق سوى ثوانٍ، ولن تظهر لك هذه الرسالة مرة أخرى.",
  commentPlaceholder: "ما رأيك في قسم الفيديو، وكيف نطوّر الموقع ليكون أفضل لك؟ (اختياري)",
  thanksTitle: "شكرًا لك على مشاركتنا رأيك",
  thanksBody: "وصل تقييمك، وسيكون جزءًا من مسيرة تطوير قسم الفيديو والموقع.",
};

const ratingEn: VideoRatingCopy = {
  headline: "What do you think of the new Video section?",
  subtitle:
    "We added it to make learning English from real clips more enjoyable, and your honest opinion is what guides us in improving it. Choose a star rating and tell us what you liked and how we should develop the site. It is optional, takes only seconds, and this message will not appear again.",
  commentPlaceholder:
    "What do you think of Video, and how can we make the site better for you? (optional)",
  thanksTitle: "Thank you for sharing your opinion",
  thanksBody: "Your rating has arrived and will shape how we develop Video and the site.",
};

const ratingEs: VideoRatingCopy = {
  headline: "¿Qué te parece la nueva sección de Video?",
  subtitle:
    "La añadimos para que aprender inglés con clips reales sea más ameno, y tu opinión sincera es lo que nos guía para mejorarla. Elige las estrellas y cuéntanos qué te gustó y cómo debemos desarrollar el sitio. Es opcional, solo lleva unos segundos y este mensaje no volverá a aparecer.",
  commentPlaceholder: "¿Qué opinas del Video y cómo podemos mejorar el sitio para ti? (opcional)",
  thanksTitle: "Gracias por compartir tu opinión",
  thanksBody: "Tu valoración llegó y nos ayudará a desarrollar Video y el sitio.",
};

const ratingTr: VideoRatingCopy = {
  headline: "Yeni Video bölümü hakkında ne düşünüyorsun?",
  subtitle:
    "Gerçek kliplerle İngilizce öğrenmeyi daha keyifli hale getirmek için ekledik; içten görüşün onu geliştirmemizde bize yol gösteriyor. Yıldız ver, neyi beğendiğini ve siteyi nasıl geliştirmemiz gerektiğini yaz. İsteğe bağlıdır, yalnızca birkaç saniye sürer ve bu mesaj bir daha görünmez.",
  commentPlaceholder:
    "Video bölümü hakkında ne düşünüyorsun, siteyi senin için nasıl geliştirelim? (isteğe bağlı)",
  thanksTitle: "Görüşünü paylaştığın için teşekkürler",
  thanksBody: "Değerlendirmen ulaştı; Video bölümünü ve siteyi geliştirmemize katkı sağlayacak.",
};

export function videoRatingCopy(locale: SupportLocale | null): VideoRatingCopy {
  if (locale === "ar") return ratingAr;
  if (locale === "es") return ratingEs;
  if (locale === "tr") return ratingTr;
  return ratingEn;
}

/** The little «new» word on the Video button, in the learner's own language (null is English). */
export function videoNewLabel(locale: SupportLocale | null): string {
  if (locale === "ar") return "جديد";
  if (locale === "es") return "Nuevo";
  if (locale === "tr") return "Yeni";
  return "New";
}

/** The classic Home's Video box: its quiet tag ("type what you hear") and its button, in the learner's own language. */
export function videoHomeCopy(locale: SupportLocale | null): { tag: string; cta: string } {
  if (locale === "ar") return { tag: "اكتب ما تسمع", cta: "شاهد واكتب" };
  if (locale === "es") return { tag: "Escribe lo que oyes", cta: "Mira y escribe" };
  if (locale === "tr") return { tag: "Duyduğunu yaz", cta: "İzle ve yaz" };
  return { tag: "Type what you hear", cta: "Watch and type" };
}

const es: VideoStrings = {
  navLabel: "Video",
  libraryTitle: "Video",
  librarySubtitle:
    "Escucha la frase de un video real y escríbela. El video se reproduce directamente desde YouTube.",
  levelAll: "Todos",
  libraryEmpty: "Todavía no hay videos listos.",
  sentenceCount: "{n} frases",
  start: "Empezar",
  carryOn: "Continuar",
  finished: "Terminado",
  back: "Volver",
  pressPlay: "Pulsa el botón de reproducir dentro del video",
  pressPlayHint: "Luego escribe la frase después de oírla",
  replay: "Repetir",
  slow: "Lento",
  hideWords: "Ocultar palabras",
  showWords: "Mostrar palabras",
  continueNow: "Continuar ahora",
  resumingSoon: "El video continúa en un momento…",
  adPlaying: "Anuncio de YouTube… el video continúa después",
  listeningHint: "Escucha…",
  progress: "{n} / {total}",
  finishTitle: "Terminaste el video",
  accuracyLine: "Precisión al escribir {percent}% · {count} frases",
  reviewWords: "Palabras para repasar",
  nextVideo: "Siguiente video",
  watchFull: "Ver el video completo en YouTube",
  backToLibrary: "Volver a los videos",
  finishCleanLine: "Precisión al escribir · {clean} de {total} frases sin errores",
  finishAllClean: "Precisión al escribir · todas las frases sin errores",
  finishWordsLabel: "Palabras en las que fallaste · toca una palabra para oírla",
  finishStatSentences: "frases escritas",
  finishStatClean: "sin errores",
  finishStatWords: "palabras escritas",
  finishNext: "Siguiente:",
  finishWatch: "Míralo en YouTube",
  finishAccuracy: "Precisión",
  finishWords: "palabras escritas",
  finishBarLabel: "Palabras escritas bien a la primera",
  finishBarGreat: "Escribes de maravilla. Tus palabras ya se están afianzando",
  finishBarKeep:
    "Cada palabra que escribes te acerca más. Prueba el entrenamiento para afianzarlas",
  trainButton: "Practica las palabras del video",
  trainListen: "Escucha la palabra y escríbela",
  trainReplay: "Repetir el audio",
  trainDone: "Dominaste las palabras del video",
  trainBack: "Volver",
  videoFrom: "Video del canal {channel}, reproducido desde YouTube",
  watchOnYouTube: "Ver en YouTube",
  unavailableTitle: "El video no está disponible por ahora",
  unavailableBody: "Su autor impidió que se muestre aquí o lo eliminó. Prueba con otro video.",
  blockedBody:
    "No se pudo cargar el reproductor de YouTube. Comprueba tu conexión e inténtalo de nuevo.",
  newsTitle: "Novedad: la sección «Video»",
  newsBody: "Escucha la frase de un clip real y escríbela",
  newsOpen: "Pruébalo ahora",
  newsDismiss: "Cerrar",
  kinds: {
    comedy: "Comedia",
    english: "Aprende inglés",
    science: "Ciencia y naturaleza",
    animals: "Animales",
    motivation: "Motivación",
    other: "Otros",
  },
  shelfEyebrow: "Video",
  shelfTitle: "El inglés como lo hablan sus hablantes",
  shelfSubtitle: "Clips cortos de YouTube, cada estante ordenado de lo más fácil a lo más difícil.",
  shelfKinds: {
    comedy: {
      name: "Situaciones graciosas",
      line: "Diálogos cortos y divertidos en inglés cotidiano",
    },
    science: {
      name: "Datos en un minuto",
      line: "Un narrador con voz clara y un dato curioso en cada clip",
    },
    motivation: {
      name: "Historias cortas",
      line: "Una historia completa, con principio y final, en menos de un minuto",
    },
    english: {
      name: "Inglés claro",
      line: "Pronunciación pausada y clara de clases y noticieros reales",
    },
    animals: { name: "Mundo animal", line: "Datos sobre animales con un narrador de voz clara" },
    other: { name: "Variado", line: "Clips de todo tipo" },
  },
  shelfShowAll: "Ver todo",
  shelfShowLess: "Ver menos",
  shelfPrevious: "Anterior",
  shelfNext: "Siguiente",
  arrange: "Ordenar videos",
  arrangeHint:
    "Arrastra un video para cambiarlo de lugar, o usa las flechas y el menú. El botón de la papelera elimina el video del sitio al guardar.",
  arrangeSave: "Guardar orden",
  arrangeSaving: "Guardando…",
  arrangeCancel: "Cancelar",
  arrangeReset: "Volver al orden predeterminado",
  arrangeResetConfirm:
    "¿Las secciones y los videos vuelven a su orden predeterminado y se borra tu orden guardado? (Los videos eliminados siguen eliminados.)",
  arrangeEmptySection: "No hay videos aquí. Mueve uno desde el menú de su sección.",
  removeVideo: "Eliminar video",
  removedTitle: "Videos eliminados",
  removedHint:
    "Nadie los ve después de guardar. Pulsa «Restaurar» para devolver el video a su sección.",
  restoreVideo: "Restaurar",
  moveUp: "Subir",
  moveDown: "Bajar",
  moveSectionUp: "Subir la sección",
  moveSectionDown: "Bajar la sección",
  sectionOf: "Sección del video: {title}",
  arrangeSaved: "Orden guardado.",
  arrangeResetDone: "El orden volvió al predeterminado.",
  arrangeFailed: "No se pudo guardar. Inténtalo de nuevo.",
  arrangeNotAllowed: "Esta opción es solo para administradores.",
  arrangeInvalid: "El orden no es válido; no se guardó nada.",
  arrangeNoTable:
    "No se pudo guardar: la tabla de orden aún no existe en la base de datos (archivo 20250353000000).",
  stopsOpen: "Ajustar pausas",
  stopsTitle: "Ajustar las pausas del video",
  stopsHint:
    "Inicio: desde dónde se repite la frase. Pausa: dónde se detiene el video después. Mueve con los botones o detén el video en el momento justo y pulsa «Ahora»; luego pruébalo. Cada cambio se guarda automáticamente para todos al cabo de un momento.",
  stopsStart: "Inicio",
  stopsEnd: "Pausa",
  stopsNow: "Ahora",
  stopsTest: "Probar",
  stopsSave: "Guardar pausa",
  stopsSaving: "Guardando…",
  stopsReset: "Volver al original",
  stopsResetConfirm:
    "¿Todos los tiempos de este video vuelven a los originales y se borra lo que guardaste?",
  stopsClose: "Cerrar",
  stopsSaved: "Pausa guardada; todos la ven.",
  stopsResetDone: "Los tiempos volvieron a los originales.",
  stopsFailed: "No se pudo guardar. Inténtalo de nuevo.",
  stopsNotAllowed: "Esta opción es solo para administradores.",
  stopsInvalid:
    "Los tiempos no son válidos (una frase de menos de 0,3 segundos o pausas desordenadas); no se guardó nada.",
  stopsNoTable:
    "No se pudo guardar: la tabla de tiempos aún no existe en la base de datos (archivo 20250354000000).",
  stopsStateSaved: "Lo que ves ahora está guardado y todos lo ven así.",
  stopsStateUnsaved:
    "Tus cambios aún no se han guardado y solo los ve tu cuenta. Se guardan automáticamente en un momento.",
  stopsStateFailed: "Tus cambios no se guardaron y solo los ve tu cuenta.",
  stopsDeviceLead:
    "Este dispositivo pide la pausa {s} segundos antes del final de la frase para compensar su retraso, y lo aprende por sí solo a partir de tus pausas.",
  stopsOffsetLabel: "Compensación de oído",
  stopsOffsetHint:
    "Solo para este dispositivo y todos los videos en él: si entra el sonido de la frase siguiente antes de la pausa, súmale (+); si se corta el final de la frase, réstale (−). Prueba una frase con el botón «Probar» después de cada paso.",
  stopsOffsetZero: "Cero",
};

const tr: VideoStrings = {
  navLabel: "Video",
  libraryTitle: "Video",
  librarySubtitle:
    "Gerçek bir videodan cümleyi dinle ve yaz. Video doğrudan YouTube'dan oynatılır.",
  levelAll: "Tümü",
  libraryEmpty: "Henüz hazır video yok.",
  sentenceCount: "{n} cümle",
  start: "Başla",
  carryOn: "Devam et",
  finished: "Bitirdim",
  back: "Geri",
  pressPlay: "Videonun içindeki oynat düğmesine bas",
  pressPlayHint: "Sonra cümleyi duyduktan sonra yaz",
  replay: "Tekrar",
  slow: "Yavaş",
  hideWords: "Kelimeleri gizle",
  showWords: "Kelimeleri göster",
  continueNow: "Şimdi devam et",
  resumingSoon: "Video birazdan devam edecek…",
  adPlaying: "YouTube reklamı… video bundan sonra devam eder",
  listeningHint: "Dinle…",
  progress: "{n} / {total}",
  finishTitle: "Videoyu bitirdin",
  accuracyLine: "Yazım doğruluğu %{percent} · {count} cümle",
  reviewWords: "Tekrar edilecek kelimeler",
  nextVideo: "Sonraki video",
  watchFull: "Videonun tamamını YouTube'da izle",
  backToLibrary: "Videolara dön",
  finishCleanLine: "Yazım doğruluğu · {total} cümlenin {clean} tanesi hatasız",
  finishAllClean: "Yazım doğruluğu · tüm cümleler hatasız",
  finishWordsLabel: "Yanlış yazdığın kelimeler · duymak için kelimeye dokun",
  finishStatSentences: "yazdığın cümle",
  finishStatClean: "hatasız",
  finishStatWords: "yazdığın kelime",
  finishNext: "Sıradaki:",
  finishWatch: "YouTube'da izle",
  finishAccuracy: "Doğruluk",
  finishWords: "yazdığın kelime",
  finishBarLabel: "İlk seferde doğru yazdığın kelimeler",
  finishBarGreat: "Harika yazıyorsun. Kelimelerin yerine oturmaya başladı",
  finishBarKeep:
    "Yazdığın her kelime seni biraz daha yaklaştırır. Pekiştirmek için alıştırmayı dene",
  trainButton: "Videonun kelimelerini çalış",
  trainListen: "Kelimeyi dinle ve yaz",
  trainReplay: "Sesi tekrar çal",
  trainDone: "Videonun kelimelerinde ustalaştın",
  trainBack: "Geri",
  videoFrom: "Video {channel} kanalına ait, YouTube'dan oynatılıyor",
  watchOnYouTube: "YouTube'da izle",
  unavailableTitle: "Video şu anda kullanılamıyor",
  unavailableBody:
    "Video sahibi burada gösterilmesini engelledi ya da videoyu sildi. Başka bir video dene.",
  blockedBody: "YouTube oynatıcısı yüklenemedi. Bağlantını kontrol edip tekrar dene.",
  newsTitle: "Yeni: «Video» bölümü",
  newsBody: "Gerçek bir klipten cümleyi dinle ve yaz",
  newsOpen: "Şimdi dene",
  newsDismiss: "Kapat",
  kinds: {
    comedy: "Komedi",
    english: "İngilizce öğren",
    science: "Bilim ve doğa",
    animals: "Hayvanlar",
    motivation: "Motivasyon",
    other: "Diğer",
  },
  shelfEyebrow: "Video",
  shelfTitle: "İngilizce, anadili olanların konuştuğu gibi",
  shelfSubtitle: "YouTube'dan kısa klipler; her raf kolaydan zora doğru sıralı.",
  shelfKinds: {
    comedy: {
      name: "Güldüren anlar",
      line: "Günlük İngilizceyle kısa ve komik diyaloglar",
    },
    science: {
      name: "Bir dakikada gerçekler",
      line: "Net sesli tek bir anlatıcı ve her klipte ilginç bir bilgi",
    },
    motivation: {
      name: "Kısa hikâyeler",
      line: "Başı ve sonu olan bütün bir hikâye, bir dakikadan kısa",
    },
    english: {
      name: "Anlaşılır İngilizce",
      line: "Gerçek derslerden ve haberlerden sakin, net telaffuz",
    },
    animals: {
      name: "Hayvanlar alemi",
      line: "Hayvanlar hakkında, net sesli bir anlatıcıyla bilgiler",
    },
    other: { name: "Karışık", line: "Her türden klipler" },
  },
  shelfShowAll: "Tümünü göster",
  shelfShowLess: "Daha az göster",
  shelfPrevious: "Önceki",
  shelfNext: "Sonraki",
  arrange: "Videoları sırala",
  arrangeHint:
    "Bir videonun yerini değiştirmek için sürükle ya da oklarla menüyü kullan. Çöp kutusu düğmesi, kaydedince videoyu siteden siler.",
  arrangeSave: "Sıralamayı kaydet",
  arrangeSaving: "Kaydediliyor…",
  arrangeCancel: "İptal",
  arrangeReset: "Varsayılan sıraya dön",
  arrangeResetConfirm:
    "Bölümler ve videolar varsayılan sıralarına dönsün ve kayıtlı sıran silinsin mi? (Silinen videolar silinmiş kalır.)",
  arrangeEmptySection: "Burada video yok. Bölüm menüsünden buraya bir video taşı.",
  removeVideo: "Videoyu sil",
  removedTitle: "Silinen videolar",
  removedHint:
    "Kaydettikten sonra kimse görmez. Videoyu bölümüne geri koymak için «Geri yükle»ye bas.",
  restoreVideo: "Geri yükle",
  moveUp: "Yukarı",
  moveDown: "Aşağı",
  moveSectionUp: "Bölümü yukarı taşı",
  moveSectionDown: "Bölümü aşağı taşı",
  sectionOf: "Videonun bölümü: {title}",
  arrangeSaved: "Sıralama kaydedildi.",
  arrangeResetDone: "Sıralama varsayılana döndü.",
  arrangeFailed: "Kaydedilemedi. Tekrar dene.",
  arrangeNotAllowed: "Bu seçenek yalnızca yöneticiler içindir.",
  arrangeInvalid: "Sıralama geçerli değil, hiçbir şey kaydedilmedi.",
  arrangeNoTable:
    "Kaydedilemedi: sıralama tablosu veritabanında henüz yok (20250353000000 dosyası).",
  stopsOpen: "Duraklamayı ayarla",
  stopsTitle: "Videonun duraklamasını ayarla",
  stopsHint:
    "Başlangıç: cümlenin nereden tekrar çalacağı. Duraklama: videonun ondan sonra nerede duracağı. Düğmelerle ilerlet ya da videoyu o ana getirip «Şimdi»ye bas, sonra dene. Her değişiklik kısa bir süre sonra herkes için otomatik kaydedilir.",
  stopsStart: "Başlangıç",
  stopsEnd: "Duraklama",
  stopsNow: "Şimdi",
  stopsTest: "Dene",
  stopsSave: "Duraklamayı kaydet",
  stopsSaving: "Kaydediliyor…",
  stopsReset: "Orijinale dön",
  stopsResetConfirm: "Bu videonun tüm zamanları orijinaline dönsün ve kaydettiklerin silinsin mi?",
  stopsClose: "Kapat",
  stopsSaved: "Duraklama kaydedildi, herkes görür.",
  stopsResetDone: "Zamanlar orijinale döndü.",
  stopsFailed: "Kaydedilemedi. Tekrar dene.",
  stopsNotAllowed: "Bu seçenek yalnızca yöneticiler içindir.",
  stopsInvalid:
    "Zamanlar geçerli değil (0,3 saniyeden kısa bir cümle ya da sırasız duraklamalar), hiçbir şey kaydedilmedi.",
  stopsNoTable: "Kaydedilemedi: zamanlar tablosu veritabanında henüz yok (20250354000000 dosyası).",
  stopsStateSaved: "Şu an gördüğün kayıtlı ve herkes böyle görüyor.",
  stopsStateUnsaved:
    "Değişikliklerin henüz kaydedilmedi ve yalnızca hesabın görüyor. Kısa süre sonra otomatik kaydedilir.",
  stopsStateFailed: "Değişikliklerin kaydedilmedi ve yalnızca hesabın görüyor.",
  stopsDeviceLead:
    "Bu cihaz, gecikmesini telafi etmek için duraklamayı cümlenin bitişinden {s} saniye önce ister ve bunu duraklamalarından kendi başına öğrenir.",
  stopsOffsetLabel: "Kulakla telafi",
  stopsOffsetHint:
    "Yalnızca bu cihaz ve üzerindeki tüm videolar için: sonraki cümlenin sesi duraklamadan önce giriyorsa artır (+), cümlenin sonu kesiliyorsa azalt (−). Her adımdan sonra «Dene» düğmesiyle bir cümleyi dene.",
  stopsOffsetZero: "Sıfır",
};

export function videoStrings(locale: SupportLocale | null): VideoStrings {
  if (locale === "es") return es;
  if (locale === "tr") return tr;
  return ar;
}

/** Fills "{name}" holes in one of the strings above. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));
}
