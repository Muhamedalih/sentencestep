import type { LearningMode, Unit } from "@/types/content";

/**
 * Named units, one per difficulty level within a mode. Purely descriptive —
 * which lessons belong to a unit is still derived from LessonUnit.level, so
 * adding a new level to a lesson data file is enough to place it in a unit;
 * add a matching entry here to give that level a name.
 *
 * title/titleAr/titleEs and description/descriptionAr/descriptionEs are all
 * hand-authored directly here rather than via content_translations — these
 * 9 curriculum-tier labels have no `levels` table row backing them at all
 * (see fetchLevelNames's doc comment), so this file is already their one
 * and only source of truth in every language, Arabic included.
 */
export const unitsByMode: Record<LearningMode, Unit[]> = {
  normal: [
    {
      id: "normal-unit-1",
      mode: "normal",
      level: 1,
      title: "Beginner A1",
      titleAr: "مبتدئ — A1",
      titleEs: "Principiante — A1",
      description: "Short real-life sentences to get comfortable with English",
      descriptionAr: "جمل قصيرة من الحياة الواقعية لتكتسب الثقة في اللغة الإنجليزية.",
      descriptionEs: "Oraciones cortas y realistas para sentirte cómodo con el inglés.",
      previewSentences: [
        {
          en: "My phone died right before my bus arrived",
          ar: "توقف هاتفي عن العمل قبل وصول الحافلة مباشرة.",
          es: "Mi teléfono se quedó sin batería justo antes de que llegara mi autobús.",
        },
        {
          en: "I ordered coffee but they gave me tea",
          ar: "طلبت قهوة، لكنهم أعطوني شايًا.",
          es: "Pedí café, pero me dieron té.",
        },
        {
          en: "She found ten dollars on the street",
          ar: "وجدت عشرة دولارات في الشارع.",
          es: "Encontró diez dólares en la calle.",
        },
        {
          en: "We waited an hour for a table",
          ar: "انتظرنا ساعة للحصول على طاولة.",
          es: "Esperamos una hora para conseguir una mesa.",
        },
        {
          en: "He forgot his password again",
          ar: "نسي كلمة المرور مرة أخرى.",
          es: "Olvidó su contraseña otra vez.",
        },
      ],
    },
    {
      id: "normal-unit-2",
      mode: "normal",
      level: 2,
      title: "Intermediate A2-B1",
      titleAr: "متوسط — A2-B1",
      titleEs: "Intermedio — A2-B1",
      description: "Everyday situations told with more natural connected phrasing",
      descriptionAr: "مواقف يومية معبَّر عنها بأسلوب أكثر طبيعية وتماسكًا.",
      descriptionEs: "Situaciones cotidianas contadas con un lenguaje más natural y fluido.",
      previewSentences: [
        {
          en: "I almost missed my flight because of the traffic",
          ar: "كدت أفوت رحلتي بسبب الازدحام المروري.",
          es: "Casi perdí mi vuelo por el tráfico.",
        },
        {
          en: "She's been learning English for six months now",
          ar: "إنها تتعلم الإنجليزية منذ ستة أشهر الآن.",
          es: "Ella lleva seis meses aprendiendo inglés.",
        },
        {
          en: "We couldn't agree on where to go for dinner",
          ar: "لم نستطع الاتفاق على أين نذهب لتناول العشاء.",
          es: "No nos pusimos de acuerdo sobre dónde ir a cenar.",
        },
        {
          en: "He quit his job to travel for a year",
          ar: "استقال من وظيفته ليسافر لمدة عام.",
          es: "Renunció a su trabajo para viajar durante un año.",
        },
        {
          en: "I've started saving money instead of spending it all",
          ar: "بدأت أدخر المال بدلاً من إنفاقه كله.",
          es: "He empezado a ahorrar dinero en lugar de gastarlo todo.",
        },
      ],
    },
    {
      id: "normal-unit-3",
      mode: "normal",
      level: 3,
      title: "Advanced B2",
      titleAr: "متقدم — B2+",
      titleEs: "Avanzado — B2+",
      description: "Richer vocabulary and natural expressions for real conversation",
      descriptionAr: "مفردات أغنى وتعبيرات طبيعية لمحادثات حقيقية.",
      descriptionEs: "Vocabulario más rico y expresiones naturales para conversaciones reales.",
      previewSentences: [
        {
          en: "I used to dread public speaking but I've slowly gotten the hang of it",
          ar: "كنت أخشى التحدث أمام الجمهور، لكنني أتقنت الأمر تدريجيًا.",
          es: "Antes hablar en público me daba pánico, pero poco a poco he ido mejorando.",
        },
        {
          en: "Looking back quitting that job was the best decision I ever made",
          ar: "بالنظر إلى الماضي، كانت الاستقالة من تلك الوظيفة أفضل قرار اتخذته في حياتي.",
          es: "Mirando atrás, dejar ese trabajo fue la mejor decisión que he tomado en mi vida.",
        },
        {
          en: "She has a knack for turning awkward situations into something funny",
          ar: "لديها موهبة في تحويل المواقف المحرجة إلى شيء مضحك.",
          es: "Tiene un don para convertir las situaciones incómodas en algo gracioso.",
        },
        {
          en: "The plan sounded great on paper but it fell apart within a week",
          ar: "بدت الخطة رائعة على الورق، لكنها انهارت خلال أسبوع.",
          es: "El plan sonaba genial sobre el papel, pero se vino abajo en una semana.",
        },
        {
          en: "He's not lazy exactly he just prioritizes things differently than most people",
          ar: "إنه ليس كسولًا بالضبط، بل يرتب أولوياته بشكل مختلف عن معظم الناس.",
          es: "No es que sea perezoso exactamente: simplemente prioriza las cosas de forma distinta a la mayoría de la gente.",
        },
      ],
    },
  ],
  stories: [
    {
      id: "stories-unit-1",
      mode: "stories",
      level: 1,
      title: "Gentle Beginnings",
      titleAr: "بدايات هادئة",
      titleEs: "Comienzos Sencillos",
      description: "Short easy stories to build reading confidence",
      descriptionAr: "قصص قصيرة وسهلة لبناء الثقة في القراءة.",
      descriptionEs: "Historias cortas y sencillas para ganar confianza en la lectura.",
    },
    {
      id: "stories-unit-2",
      mode: "stories",
      level: 2,
      title: "New Chapters",
      titleAr: "فصول جديدة",
      titleEs: "Nuevos Capítulos",
      description: "Everyday moments with a bit more detail",
      descriptionAr: "لحظات يومية بمزيد من التفاصيل.",
      descriptionEs: "Momentos cotidianos con un poco más de detalle.",
    },
    {
      id: "stories-unit-3",
      mode: "stories",
      level: 3,
      title: "Everyday Adventures",
      titleAr: "مغامرات يومية",
      titleEs: "Aventuras Cotidianas",
      description: "Fuller scenes with richer vocabulary",
      descriptionAr: "مشاهد أكثر تفصيلاً ومفردات أغنى.",
      descriptionEs: "Escenas más completas con vocabulario más rico.",
    },
  ],
  conversation: [
    {
      id: "conversation-unit-1",
      mode: "conversation",
      level: 1,
      title: "Getting Started",
      titleAr: "البداية",
      titleEs: "Primeros Pasos",
      description: "Simple common exchanges",
      descriptionAr: "حوارات بسيطة وشائعة.",
      descriptionEs: "Intercambios simples y comunes.",
    },
    {
      id: "conversation-unit-2",
      mode: "conversation",
      level: 2,
      title: "Getting Around",
      titleAr: "التنقل",
      titleEs: "Cómo Desplazarse",
      description: "Practical conversations for everyday situations",
      descriptionAr: "محادثات عملية لمواقف يومية.",
      descriptionEs: "Conversaciones prácticas para situaciones cotidianas.",
    },
    {
      id: "conversation-unit-3",
      mode: "conversation",
      level: 3,
      title: "Real Situations",
      titleAr: "مواقف حقيقية",
      titleEs: "Situaciones Reales",
      description: "Longer more natural dialogue",
      descriptionAr: "حوارات أطول وأكثر طبيعية.",
      descriptionEs: "Diálogos más largos y naturales.",
    },
  ],
};
