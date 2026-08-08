import type { Lesson } from "@/types/content";

/**
 * Conversation mode: practical dialogue lines grouped by real-life
 * situation. This is the initial content set (~30 sentences across 5
 * situations).
 */
export const conversationLessons: Lesson[] = [
  {
    id: "conversation-1",
    mode: "conversation",
    level: 1,
    order: 1,
    title: "At a Café",
    titleAr: "في المقهى",
    isFree: true,
    sentences: [
      {
        id: "conversation-1-s1",
        speaker: "A",
        en: "Hello, welcome! What would you like to order?",
        ar: "مرحبًا بك! ماذا تود أن تطلب؟",
      },
      {
        id: "conversation-1-s2",
        speaker: "B",
        en: "Hi, can I have a cup of coffee, please?",
        ar: "مرحبًا، هل يمكنني الحصول على فنجان قهوة؟",
      },
      {
        id: "conversation-1-s3",
        speaker: "A",
        en: "Sure, would you like it hot or iced?",
        ar: "بالتأكيد، هل تفضلها ساخنة أم مثلجة؟",
      },
      {
        id: "conversation-1-s4",
        speaker: "B",
        en: "Hot, please. And a small cake too.",
        ar: "ساخنة من فضلك. وقطعة كيك صغيرة أيضًا.",
      },
      {
        id: "conversation-1-s5",
        speaker: "A",
        en: "No problem. That will be five dollars.",
        ar: "لا مشكلة. المجموع خمسة دولارات.",
      },
      {
        id: "conversation-1-s6",
        speaker: "B",
        en: "Here you go. Thank you very much.",
        ar: "تفضل. شكرًا جزيلاً لك.",
      },
    ],
    vocabulary: [
      { id: "conversation-1-v1", en: "coffee", ar: "قهوة" },
      { id: "conversation-1-v2", en: "please", ar: "من فضلك" },
      { id: "conversation-1-v3", en: "order", ar: "طلب" },
    ],
  },
  {
    id: "conversation-2",
    mode: "conversation",
    level: 1,
    order: 2,
    title: "Asking for Directions",
    titleAr: "السؤال عن الاتجاهات",
    isFree: true,
    sentences: [
      {
        id: "conversation-2-s1",
        speaker: "A",
        en: "Excuse me, how can I get to the train station?",
        ar: "المعذرة، كيف يمكنني الوصول إلى محطة القطار؟",
      },
      {
        id: "conversation-2-s2",
        speaker: "B",
        en: "Go straight ahead and turn left at the light.",
        ar: "اذهب مباشرة وانعطف يسارًا عند الإشارة.",
      },
      {
        id: "conversation-2-s3",
        speaker: "A",
        en: "Is it far from here?",
        ar: "هل هي بعيدة من هنا؟",
      },
      {
        id: "conversation-2-s4",
        speaker: "B",
        en: "No, it's about five minutes on foot.",
        ar: "لا، إنها على بعد خمس دقائق سيرًا على الأقدام.",
      },
      {
        id: "conversation-2-s5",
        speaker: "A",
        en: "Thank you so much for your help.",
        ar: "شكرًا جزيلاً لمساعدتك.",
      },
      {
        id: "conversation-2-s6",
        speaker: "B",
        en: "You're welcome. Have a safe trip.",
        ar: "على الرحب والسعة. رحلة آمنة.",
      },
    ],
  },
  {
    id: "conversation-3",
    mode: "conversation",
    level: 2,
    order: 3,
    title: "At the Airport",
    titleAr: "في المطار",
    isFree: false,
    sentences: [
      {
        id: "conversation-3-s1",
        speaker: "A",
        en: "Good morning, may I see your passport, please?",
        ar: "صباح الخير، هل يمكنني رؤية جواز سفرك؟",
      },
      {
        id: "conversation-3-s2",
        speaker: "B",
        en: "Of course, here it is.",
        ar: "بالتأكيد، تفضل.",
      },
      {
        id: "conversation-3-s3",
        speaker: "A",
        en: "Are you traveling for business or vacation?",
        ar: "هل تسافر من أجل العمل أم الإجازة؟",
      },
      {
        id: "conversation-3-s4",
        speaker: "B",
        en: "I'm traveling for vacation with my family.",
        ar: "أنا أسافر في إجازة مع عائلتي.",
      },
      {
        id: "conversation-3-s5",
        speaker: "A",
        en: "Enjoy your trip! Your gate is number twelve.",
        ar: "استمتع برحلتك! بوابتك رقم اثني عشر.",
      },
      {
        id: "conversation-3-s6",
        speaker: "B",
        en: "Thank you, have a nice day.",
        ar: "شكرًا لك، أتمنى لك يومًا سعيدًا.",
      },
    ],
  },
  {
    id: "conversation-4",
    mode: "conversation",
    level: 2,
    order: 4,
    title: "Making Small Talk",
    titleAr: "حديث عابر",
    isFree: false,
    sentences: [
      {
        id: "conversation-4-s1",
        speaker: "A",
        en: "It's a beautiful day today, isn't it?",
        ar: "إنه يوم جميل اليوم، أليس كذلك؟",
      },
      {
        id: "conversation-4-s2",
        speaker: "B",
        en: "Yes, it really is. Perfect for a walk.",
        ar: "نعم، حقًا. مثالي للمشي.",
      },
      {
        id: "conversation-4-s3",
        speaker: "A",
        en: "Do you come to this park often?",
        ar: "هل تأتي إلى هذه الحديقة كثيرًا؟",
      },
      {
        id: "conversation-4-s4",
        speaker: "B",
        en: "Actually, this is my first time here.",
        ar: "في الواقع، هذه أول مرة لي هنا.",
      },
      {
        id: "conversation-4-s5",
        speaker: "A",
        en: "Well, I hope you enjoy it.",
        ar: "حسنًا، أتمنى أن تستمتع بوقتك.",
      },
      {
        id: "conversation-4-s6",
        speaker: "B",
        en: "Thank you, I'm sure I will.",
        ar: "شكرًا لك، أنا متأكد من أنني سأستمتع.",
      },
    ],
  },
  {
    id: "conversation-5",
    mode: "conversation",
    level: 3,
    order: 5,
    title: "At the Doctor",
    titleAr: "عند الطبيب",
    isFree: false,
    sentences: [
      {
        id: "conversation-5-s1",
        speaker: "A",
        en: "Good afternoon, what seems to be the problem?",
        ar: "مساء الخير، ما هي المشكلة؟",
      },
      {
        id: "conversation-5-s2",
        speaker: "B",
        en: "I've had a headache for the past two days.",
        ar: "أعاني من صداع منذ يومين.",
      },
      {
        id: "conversation-5-s3",
        speaker: "A",
        en: "Have you taken any medicine for it?",
        ar: "هل تناولت أي دواء له؟",
      },
      {
        id: "conversation-5-s4",
        speaker: "B",
        en: "Just some water, but it didn't help much.",
        ar: "فقط بعض الماء، لكنه لم يساعد كثيرًا.",
      },
      {
        id: "conversation-5-s5",
        speaker: "A",
        en: "I'll prescribe something and you should rest well.",
        ar: "سأصف لك دواء ويجب أن ترتاح جيدًا.",
      },
      {
        id: "conversation-5-s6",
        speaker: "B",
        en: "Thank you, doctor. I appreciate your help.",
        ar: "شكرًا لك يا دكتور. أقدر مساعدتك.",
      },
    ],
  },
];
