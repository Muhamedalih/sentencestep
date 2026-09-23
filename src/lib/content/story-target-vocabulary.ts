/**
 * Curated target vocabulary for the redesigned short-format Stories catalog
 * (story-79 through story-198) — 2-3 words per lesson, authored directly
 * alongside the lessons themselves rather than algorithmically derived (see
 * applyCuratedStoryVocabulary in story-vocabulary.ts for how this plugs
 * into the normal buildStoryVocabulary path). Every `en` value is a literal
 * word that appears in that lesson's own sentences (verified against the
 * live content); `ar` is a short dictionary-style gloss, not pulled
 * verbatim from any one sentence's inflected form.
 */
export const STORY_TARGET_VOCABULARY: Record<string, { en: string; ar: string }[]> = {
  // Level 1 — Gentle Beginnings, batch 1
  "story-79": [
    { en: "balloon", ar: "بالون" },
    { en: "fly", ar: "يطير" },
  ],
  "story-80": [
    { en: "phone", ar: "هاتف" },
    { en: "drops", ar: "يسقط" },
  ],
  "story-81": [
    { en: "rain", ar: "مطر" },
    { en: "wait", ar: "ينتظر" },
  ],
  "story-82": [
    { en: "fall", ar: "يسقط" },
    { en: "try", ar: "يحاول" },
  ],
  "story-83": [
    { en: "dog", ar: "كلب" },
    { en: "run", ar: "يركض" },
  ],
  "story-84": [
    { en: "cake", ar: "كيكة" },
    { en: "bake", ar: "يخبز" },
  ],
  "story-85": [
    { en: "umbrella", ar: "مظلة" },
    { en: "breaks", ar: "ينكسر" },
  ],
  "story-86": [
    { en: "star", ar: "نجمة" },
    { en: "wish", ar: "يتمنى" },
  ],
  "story-87": [
    { en: "snow", ar: "ثلج" },
    { en: "build", ar: "يبني" },
  ],
  "story-88": [
    { en: "fish", ar: "سمكة" },
    { en: "catch", ar: "يصطاد" },
  ],
  "story-89": [
    { en: "light", ar: "ضوء" },
    { en: "dark", ar: "ظلام" },
  ],
  "story-90": [
    { en: "plant", ar: "نبتة" },
    { en: "grows", ar: "ينمو" },
  ],
  "story-91": [
    { en: "shoe", ar: "حذاء" },
    { en: "lose", ar: "يفقد" },
  ],
  "story-92": [
    { en: "song", ar: "أغنية" },
    { en: "sing", ar: "يغني" },
  ],
  "story-93": [
    { en: "box", ar: "صندوق" },
    { en: "open", ar: "يفتح" },
  ],
  "story-94": [
    { en: "cookie", ar: "كوكيز" },
    { en: "half", ar: "نصف" },
  ],
  "story-95": [
    { en: "race", ar: "سباق" },
    { en: "win", ar: "يفوز" },
  ],
  "story-96": [
    { en: "nap", ar: "قيلولة" },
    { en: "snore", ar: "يشخر" },
  ],
  "story-97": [
    { en: "kite", ar: "طائرة ورقية" },
    { en: "wind", ar: "ريح" },
  ],
  "story-98": [
    { en: "spider", ar: "عنكبوت" },
    { en: "scream", ar: "يصرخ" },
  ],
  // Level 2 — New Chapters, batch 1
  "story-99": [
    { en: "key", ar: "مفتاح" },
    { en: "searching", ar: "يبحث" },
    { en: "lose", ar: "يفقد" },
  ],
  "story-100": [
    { en: "forget", ar: "ينسى" },
    { en: "pretend", ar: "يتظاهر" },
  ],
  "story-101": [
    { en: "miss", ar: "يفتقد" },
    { en: "used", ar: "اعتاد" },
  ],
  "story-102": [
    { en: "give", ar: "يستسلم" },
    { en: "worth", ar: "يستحق" },
  ],
  "story-103": [
    { en: "apply", ar: "يتقدم" },
    { en: "reject", ar: "يرفض" },
  ],
  "story-104": [
    { en: "argue", ar: "يتجادل" },
    { en: "apologize", ar: "يعتذر" },
  ],
  "story-105": [
    { en: "borrow", ar: "يستعير" },
    { en: "return", ar: "يعيد" },
  ],
  "story-106": [
    { en: "nervous", ar: "متوتر" },
    { en: "perform", ar: "يؤدي" },
  ],
  "story-107": [
    { en: "save", ar: "يدخر" },
    { en: "spend", ar: "ينفق" },
  ],
  "story-108": [
    { en: "late", ar: "متأخر" },
    { en: "rush", ar: "يهرع" },
  ],
  "story-109": [
    { en: "breaks", ar: "ينكسر" },
    { en: "fix", ar: "يصلح" },
  ],
  "story-110": [
    { en: "convince", ar: "يقنع" },
    { en: "agree", ar: "يوافق" },
  ],
  "story-111": [
    { en: "lie", ar: "يكذب" },
    { en: "confess", ar: "يعترف" },
  ],
  "story-112": [
    { en: "compete", ar: "يتنافس" },
    { en: "tie", ar: "يتعادل" },
  ],
  "story-113": [
    { en: "move", ar: "ينتقل" },
    { en: "adjust", ar: "يتأقلم" },
  ],
  "story-114": [
    { en: "surprise", ar: "مفاجأة" },
    { en: "react", ar: "يتصرف" },
  ],
  "story-115": [
    { en: "complain", ar: "يتذمر" },
    { en: "appreciate", ar: "يقدّر" },
  ],
  "story-116": [
    { en: "interrupt", ar: "يقاطع" },
    { en: "listen", ar: "يستمع" },
  ],
  "story-117": [
    { en: "doubt", ar: "يشك" },
    { en: "prove", ar: "يثبت" },
  ],
  "story-118": [
    { en: "gossip", ar: "نميمة" },
    { en: "regret", ar: "يندم" },
  ],
  // Level 3 — Everyday Adventures, batch 1
  "story-119": [
    { en: "overthink", ar: "يفرط بالتفكير" },
    { en: "assume", ar: "يفترض" },
  ],
  "story-120": [
    { en: "nostalgic", ar: "حنين" },
    { en: "go", ar: "التخلي" },
  ],
  "story-121": [
    { en: "burnout", ar: "إرهاق تام" },
    { en: "unplug", ar: "ينقطع عن الإنترنت" },
  ],
  "story-122": [
    { en: "impulsive", ar: "متهور" },
    { en: "regret", ar: "ندم" },
  ],
  "story-123": [
    { en: "estranged", ar: "متقاطع" },
    { en: "reconcile", ar: "يتصالح" },
  ],
  "story-124": [
    { en: "procrastinate", ar: "يسوّف" },
    { en: "deadline", ar: "الموعد النهائي" },
  ],
  "story-125": [{ en: "underestimates", ar: "يستهين" }],
  "story-126": [
    { en: "heartbroken", ar: "قلب محطم" },
    { en: "moved", ar: "تجاوز الأمر" },
  ],
  "story-127": [
    { en: "skeptical", ar: "متشكك" },
    { en: "convinced", ar: "مقتنع" },
  ],
  "story-128": [
    { en: "exhausted", ar: "منهك" },
    { en: "persevere", ar: "يثابر" },
  ],
  "story-129": [
    { en: "jealous", ar: "غيور" },
    { en: "admit", ar: "يعترف" },
  ],
  "story-130": [
    { en: "homesick", ar: "حنين للوطن" },
    { en: "adapt", ar: "يتأقلم" },
  ],
  "story-131": [
    { en: "resented", ar: "استاء" },
    { en: "forgive", ar: "يسامح" },
  ],
  "story-132": [
    { en: "insecure", ar: "غير واثق" },
    { en: "confident", ar: "واثق" },
  ],
  "story-133": [
    { en: "betrayed", ar: "خيانة" },
    { en: "trust", ar: "ثقة" },
  ],
  "story-134": [
    { en: "spontaneous", ar: "عفوي" },
    { en: "adventure", ar: "مغامرة" },
  ],
  "story-135": [
    { en: "grieve", ar: "يحزن" },
    { en: "heal", ar: "يشفى" },
  ],
  "story-136": [
    { en: "overwhelmed", ar: "مرهق" },
    { en: "prioritize", ar: "يرتب الأولويات" },
  ],
  "story-137": [
    { en: "cynical", ar: "متشكك" },
    { en: "inspired", ar: "ملهم" },
  ],
  "story-138": [
    { en: "reckless", ar: "متهور" },
    { en: "responsible", ar: "مسؤول" },
  ],
  // Level 1 — Gentle Beginnings, batch 2
  "story-139": [
    { en: "melts", ar: "يذوب" },
    { en: "drip", ar: "يقطر" },
  ],
  "story-140": [
    { en: "bird", ar: "طائر" },
    { en: "sing", ar: "يغني" },
  ],
  "story-141": [
    { en: "bubble", ar: "فقاعة" },
    { en: "pops", ar: "تنفجر" },
  ],
  "story-142": [
    { en: "puddle", ar: "بركة ماء" },
    { en: "jump", ar: "يقفز" },
  ],
  "story-143": [
    { en: "candles", ar: "شموع" },
    { en: "blow", ar: "ينفخ" },
  ],
  "story-144": [
    { en: "sandcastle", ar: "قلعة رملية" },
    { en: "wave", ar: "موجة" },
  ],
  "story-145": [
    { en: "leaf", ar: "ورقة شجر" },
    { en: "catch", ar: "يمسك" },
  ],
  "story-146": [
    { en: "fireflies", ar: "يراعات" },
    { en: "jar", ar: "جرة" },
  ],
  "story-147": [
    { en: "sock", ar: "جورب" },
    { en: "disappears", ar: "يختفي" },
  ],
  "story-148": [
    { en: "alarm", ar: "منبه" },
    { en: "snooze", ar: "غفوة" },
  ],
  "story-149": [
    { en: "puzzle", ar: "أحجية" },
    { en: "piece", ar: "قطعة" },
  ],
  "story-150": [
    { en: "paint", ar: "طلاء" },
    { en: "spill", ar: "ينسكب" },
  ],
  "story-151": [
    { en: "swing", ar: "أرجوحة" },
    { en: "push", ar: "يدفع" },
  ],
  "story-152": [
    { en: "hiccups", ar: "فواق" },
    { en: "scare", ar: "يخيف" },
  ],
  "story-153": [
    { en: "lemonade", ar: "عصير ليمون" },
    { en: "customers", ar: "زبائن" },
  ],
  "story-154": [
    { en: "flashlight", ar: "مصباح يدوي" },
    { en: "battery", ar: "بطارية" },
  ],
  "story-155": [
    { en: "mirror", ar: "مرآة" },
    { en: "cracks", ar: "يتصدع" },
  ],
  "story-156": [
    { en: "turtle", ar: "سلحفاة" },
    { en: "races", ar: "يتسابق" },
  ],
  "story-157": [
    { en: "whistle", ar: "صفير" },
    { en: "practice", ar: "يتدرب" },
  ],
  "story-158": [
    { en: "balloon", ar: "بالون" },
    { en: "throw", ar: "يرمي" },
  ],
  // Level 2 — New Chapters, batch 2
  "story-159": [
    { en: "trip", ar: "يتعثر" },
    { en: "laughing", ar: "يضحك" },
  ],
  "story-160": [
    { en: "promoted", ar: "ترقية" },
    { en: "celebrate", ar: "يحتفل" },
  ],
  "story-161": [
    { en: "chores", ar: "مهام منزلية" },
    { en: "negotiate", ar: "يتفاوض" },
  ],
  "story-162": [
    { en: "distracts", ar: "يشتت" },
    { en: "focus", ar: "يركز" },
  ],
  "story-163": [
    { en: "exaggerate", ar: "يبالغ" },
    { en: "admit", ar: "يعترف" },
  ],
  "story-164": [
    { en: "volunteer", ar: "يتطوع" },
    { en: "regret", ar: "يندم" },
  ],
  "story-165": [
    { en: "criticize", ar: "ينتقد" },
    { en: "defend", ar: "يدافع" },
  ],
  "story-166": [
    { en: "panic", ar: "ذعر" },
    { en: "calm", ar: "يهدأ" },
  ],
  "story-167": [
    { en: "compare", ar: "يقارن" },
    { en: "scroll", ar: "يمرر" },
  ],
  "story-168": [
    { en: "blame", ar: "يلوم" },
    { en: "guilt", ar: "ذنب" },
  ],
  "story-169": [
    { en: "hesitate", ar: "يتردد" },
    { en: "commit", ar: "يلتزم" },
  ],
  "story-170": [
    { en: "mock", ar: "يسخر" },
    { en: "apologize", ar: "يعتذر" },
  ],
  "story-171": [
    { en: "postpone", ar: "يؤجل" },
    { en: "dentist", ar: "طبيب أسنان" },
  ],
  "story-172": [
    { en: "assume", ar: "يفترض" },
    { en: "correct", ar: "يصحح" },
  ],
  "story-173": [
    { en: "flirt", ar: "يغازل" },
    { en: "awkward", ar: "محرج" },
  ],
  "story-174": [
    { en: "warns", ar: "يحذر" },
    { en: "ignore", ar: "يتجاهل" },
  ],
  "story-175": [
    { en: "reward", ar: "يكافئ" },
    { en: "earn", ar: "يكسب" },
  ],
  "story-176": [
    { en: "whisper", ar: "يهمس" },
    { en: "overhears", ar: "يسترق السمع" },
  ],
  "story-177": [
    { en: "rehearse", ar: "يتدرب" },
    { en: "blank", ar: "فارغ" },
  ],
  "story-178": [
    { en: "rumor", ar: "شائعة" },
    { en: "trust", ar: "يثق" },
  ],
  // Level 3 — Everyday Adventures, batch 2
  "story-179": [
    { en: "sabotage", ar: "تخريب ذاتي" },
    { en: "breakthrough", ar: "اختراق" },
  ],
  "story-180": [
    { en: "complacent", ar: "راضٍ عن ذاته بإفراط" },
    { en: "reignites", ar: "يشعل من جديد" },
  ],
  "story-181": [
    { en: "vulnerable", ar: "منكشف عاطفياً" },
    { en: "wall", ar: "جدار" },
  ],
  "story-182": [
    { en: "validation", ar: "تقدير الآخرين" },
    { en: "worth", ar: "قيمة" },
  ],
  "story-183": [
    { en: "numb", ar: "مخدر المشاعر" },
    { en: "feeling", ar: "الشعور" },
  ],
  "story-184": [
    { en: "sacrificed", ar: "ضحّى" },
    { en: "worthwhile", ar: "يستحق العناء" },
  ],
  "story-185": [
    { en: "disillusioned", ar: "فاقد الحماس" },
    { en: "renewed", ar: "متجدد" },
  ],
  "story-186": [
    { en: "petty", ar: "تافه" },
    { en: "rising", ar: "الارتقاء" },
  ],
  "story-187": [
    { en: "stagnant", ar: "راكد" },
    { en: "momentum", ar: "زخم" },
  ],
  "story-188": [
    { en: "aloof", ar: "متحفظ وبعيد" },
    { en: "guarded", ar: "حذر" },
  ],
  "story-189": [
    { en: "relapse", ar: "انتكاسة" },
    { en: "resilience", ar: "صمود" },
  ],
  "story-190": [
    { en: "entitled", ar: "يشعر بالاستحقاق" },
    { en: "humbled", ar: "متواضع" },
  ],
  "story-191": [
    { en: "apathetic", ar: "لامبالٍ" },
    { en: "captivated", ar: "مفتون" },
  ],
  "story-192": [
    { en: "defensive", ar: "دفاعي" },
    { en: "receptive", ar: "منفتح" },
  ],
  "story-193": [
    { en: "depleted", ar: "مستنزف" },
    { en: "replenish", ar: "يجدد طاقته" },
  ],
  "story-194": [
    { en: "martyr", ar: "دور الضحية" },
    { en: "boundaries", ar: "حدود شخصية" },
  ],
  "story-195": [
    { en: "paranoid", ar: "مرتاب" },
    { en: "reassured", ar: "مطمئن" },
  ],
  "story-196": [
    { en: "complicit", ar: "متواطئ" },
    { en: "accountable", ar: "مسؤول" },
  ],
  "story-197": [
    { en: "detached", ar: "منفصل ذهنياً" },
    { en: "present", ar: "حاضر بالكامل" },
  ],
  "story-198": [
    { en: "resigned", ar: "مستسلم" },
    { en: "reclaiming", ar: "يستعيد" },
  ],
};
