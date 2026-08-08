import type { Lesson } from "@/types/content";

/**
 * Stories mode: longer narratives split into sentence-by-sentence units.
 * This is the initial content set (~24 sentences across 3 stories).
 */
export const storyLessons: Lesson[] = [
  {
    id: "story-1",
    mode: "stories",
    level: 1,
    order: 1,
    title: "A Morning Walk",
    titleAr: "نزهة صباحية",
    isFree: true,
    sentences: [
      {
        id: "story-1-s1",
        en: "Sarah woke up early in the morning.",
        ar: "استيقظت سارة مبكرًا في الصباح.",
      },
      { id: "story-1-s2", en: "The sky was clear and blue.", ar: "كانت السماء صافية وزرقاء." },
      { id: "story-1-s3", en: "She decided to go for a walk.", ar: "قررت أن تخرج في نزهة." },
      { id: "story-1-s4", en: "The street was quiet and calm.", ar: "كان الشارع هادئًا وساكنًا." },
      {
        id: "story-1-s5",
        en: "She saw a small cat near the park.",
        ar: "رأت قطة صغيرة بالقرب من الحديقة.",
      },
      {
        id: "story-1-s6",
        en: "Birds were singing in the trees.",
        ar: "كانت الطيور تغرد في الأشجار.",
      },
      {
        id: "story-1-s7",
        en: "Sarah smiled and felt very happy.",
        ar: "ابتسمت سارة وشعرت بسعادة كبيرة.",
      },
      {
        id: "story-1-s8",
        en: "She walked home slowly and made coffee.",
        ar: "مشت إلى المنزل ببطء وحضّرت القهوة.",
      },
    ],
    vocabulary: [
      { id: "story-1-v1", en: "morning", ar: "صباح" },
      { id: "story-1-v2", en: "walk", ar: "نزهة" },
      { id: "story-1-v3", en: "early", ar: "مبكرًا" },
    ],
  },
  {
    id: "story-2",
    mode: "stories",
    level: 2,
    order: 2,
    title: "The New Job",
    titleAr: "الوظيفة الجديدة",
    isFree: true,
    sentences: [
      {
        id: "story-2-s1",
        en: "Omar got a new job at a big company.",
        ar: "حصل عمر على وظيفة جديدة في شركة كبيرة.",
      },
      {
        id: "story-2-s2",
        en: "He was excited but a little nervous.",
        ar: "كان متحمسًا لكنه كان متوترًا قليلاً.",
      },
      {
        id: "story-2-s3",
        en: "On his first day, he arrived early.",
        ar: "في يومه الأول، وصل مبكرًا.",
      },
      { id: "story-2-s4", en: "His manager welcomed him warmly.", ar: "رحّب به مديره بحرارة." },
      {
        id: "story-2-s5",
        en: "He met his new team in the office.",
        ar: "قابل فريقه الجديد في المكتب.",
      },
      {
        id: "story-2-s6",
        en: "The work was difficult but interesting.",
        ar: "كان العمل صعبًا لكنه مثير للاهتمام.",
      },
      {
        id: "story-2-s7",
        en: "By the end of the day, he felt confident.",
        ar: "بنهاية اليوم، شعر بالثقة.",
      },
      {
        id: "story-2-s8",
        en: "Omar called his family to share the good news.",
        ar: "اتصل عمر بعائلته ليشاركهم الخبر السعيد.",
      },
    ],
  },
  {
    id: "story-3",
    mode: "stories",
    level: 3,
    order: 3,
    title: "A Trip to the Market",
    titleAr: "رحلة إلى السوق",
    isFree: false,
    sentences: [
      {
        id: "story-3-s1",
        en: "Layla needed to buy vegetables for dinner.",
        ar: "احتاجت ليلى لشراء الخضروات للعشاء.",
      },
      {
        id: "story-3-s2",
        en: "She walked to the local market near her home.",
        ar: "مشت إلى السوق المحلي بالقرب من منزلها.",
      },
      {
        id: "story-3-s3",
        en: "The market was full of colors and sounds.",
        ar: "كان السوق مليئًا بالألوان والأصوات.",
      },
      {
        id: "story-3-s4",
        en: "She bought tomatoes, onions, and fresh bread.",
        ar: "اشترت الطماطم والبصل والخبز الطازج.",
      },
      {
        id: "story-3-s5",
        en: "A vendor offered her a taste of sweet dates.",
        ar: "عرض عليها بائع تذوق التمر الحلو.",
      },
      {
        id: "story-3-s6",
        en: "Layla negotiated a better price politely.",
        ar: "تفاوضت ليلى على سعر أفضل بأدب.",
      },
      {
        id: "story-3-s7",
        en: "She packed everything carefully into her bag.",
        ar: "وضعت كل شيء بعناية في حقيبتها.",
      },
      {
        id: "story-3-s8",
        en: "On her way home, she thought about what to cook.",
        ar: "في طريقها إلى المنزل، فكرت فيما ستطبخه.",
      },
    ],
  },
];
