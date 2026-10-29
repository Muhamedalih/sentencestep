/**
 * "Rule of the day" (قاعدة اليوم): the A1 ladder, in the order it is taught. Each rule is one English
 * grammar point written in A1 words, with its Arabic gloss, one right and one wrong sentence side by
 * side, and the exception learners actually trip on (the -es / -ies endings, "its" and "it's", the
 * order of a question, and so on: those are taught as rules, not left to be discovered by mistake).
 *
 * The ladder holds text only. Which sentences show a rule is decided by the matchers in matchers.ts,
 * from whatever the learner is reading, so the same rule is asked from today's story and from the
 * stories the learner has finished before. Rules whose sentences are rare in the catalogue are kept
 * here anyway: a rule is simply not asked on a day when no text of the learner's shows it.
 */

export type RuleFamily =
  | "be"
  | "determiner"
  | "pronoun"
  | "present"
  | "past"
  | "question"
  | "negative"
  | "preposition"
  | "quantity"
  | "modal"
  | "frequency"
  | "perfect"
  | "future"
  | "comparison"
  | "conditional"
  | "passive"
  | "verb-pattern";

/** Which sentence pattern a rule looks for (see matchers.ts). */
export type MatchKind =
  | "be"
  | "article"
  | "possessive"
  | "he-she-it-s"
  | "present-base"
  | "regular-past"
  | "irregular-past"
  | "place"
  | "wh-start"
  | "plural"
  | "this-that"
  | "possessive-s"
  | "imperative"
  | "object-pronoun"
  | "was-were"
  | "did-question"
  | "didnt"
  | "dont-doesnt"
  | "do-does-question"
  | "can"
  | "there-is"
  | "time-prep"
  | "frequency"
  | "some-any"
  | "present-continuous"
  | "past-continuous"
  | "present-perfect"
  | "going-to"
  | "comparative"
  | "must"
  | "first-conditional"
  | "much-many"
  | "second-conditional"
  | "perfect-continuous"
  | "past-perfect"
  | "passive"
  | "wish-past"
  | "should-have"
  | "gerund-after";

/** The level a rule belongs to: A1, A2–B1 (level 2 in Looma) or B2 (level 3). */
export type RuleLevel = "A1" | "A2-B1" | "B2";

export interface RuleSpec {
  /** Stable id stored per learner ("a1-01" ... "a1-24"); never reused for another rule. */
  id: string;
  /** Position on the ladder (1 = taught first). */
  order: number;
  level: RuleLevel;
  /** The title shown on the card, exactly as written here. */
  title: string;
  family: RuleFamily;
  match: MatchKind;
  /** The rule in one or two English sentences, A1 words. */
  rule: string;
  /** The same rule in Arabic, for Arabic speakers. */
  gloss: string;
  /** The words the rule names (the verbs a verb pattern takes), shown in a row of their own; absent when it names none. */
  words?: readonly string[];
  right: string;
  wrong: string;
  /** The exception learners trip on, in English. */
  exception: string;
  exceptionGloss: string;
}

export const A1_LADDER: readonly RuleSpec[] = [
  {
    id: "a1-01",
    order: 1,
    level: "A1",
    title: "am / is / are",
    family: "be",
    match: "be",
    rule: "Use am with I. Use is with he, she and it. Use are with you, we and they.",
    gloss: "نستعمل am مع I، و is مع he وshe وit، و are مع you وwe وthey.",
    right: "She is at home.",
    wrong: "She are at home.",
    exception: "In a question the order changes: Are you ready? Is she here?",
    exceptionGloss: "في السؤال نقلب الترتيب: Are you ready؟ Is she here؟",
  },
  {
    id: "a1-02",
    order: 2,
    level: "A1",
    title: "a / an / the",
    family: "determiner",
    match: "article",
    rule: "Use a or an for one thing we do not know yet. Use the for a thing we already know.",
    gloss: "a وan لشيء لم نعرفه بعد، وthe لشيء نعرفه.",
    right: "It is an apple.",
    wrong: "It is a apple.",
    exception: "Use an before a vowel sound: an apple, an hour.",
    exceptionGloss: "نستعمل an قبل صوت حرف العلة: an apple، an hour.",
  },
  {
    id: "a1-03",
    order: 3,
    level: "A1",
    title: "my / your / his / her",
    family: "determiner",
    match: "possessive",
    rule: "These words come before a noun and show who has it: my book, your bag.",
    gloss: "هذه الكلمات تأتي قبل الاسم وتدل على الملكية: my book.",
    right: "This is my book.",
    wrong: "This is me book.",
    exception: "Its (no apostrophe) means belonging to it. It's means it is.",
    exceptionGloss: "its بلا apostrophe تعني الملكية، أما it's فتعني it is.",
  },
  {
    id: "a1-04",
    order: 4,
    level: "A1",
    title: "he / she / it + -s",
    family: "present",
    match: "he-she-it-s",
    rule: "With he, she and it, add -s to the present verb: She works. It starts at nine.",
    gloss: "مع he وshe وit نضيف -s للفعل في المضارع.",
    right: "She works here.",
    wrong: "She work here.",
    exception:
      "Verbs ending in o, s, sh, ch or x add -es (goes, watches). Consonant + y becomes -ies (study, studies).",
    exceptionGloss: "المنتهي بـ o أو s أو sh أو ch أو x يأخذ es، والمنتهي بساكن + y يصير ies.",
  },
  {
    id: "a1-05",
    order: 5,
    level: "A1",
    title: "I / you / we / they",
    family: "present",
    match: "present-base",
    rule: "With I, you, we and they, use the base verb with no -s: I work. They live here.",
    gloss: "مع I وyou وwe وthey نستعمل الفعل بدون -s.",
    right: "We live here.",
    wrong: "We lives here.",
    exception: "The verb be is different: I am, we are, they are.",
    exceptionGloss: "الفعل be مختلف: I am، we are، they are.",
  },
  {
    id: "a1-06",
    order: 6,
    level: "A1",
    title: "this / that / these / those",
    family: "determiner",
    match: "this-that",
    rule: "This and that are for one thing, these and those for more than one. This and these are near; that and those are far.",
    gloss:
      "this وthat للشيء الواحد، وthese وthose للأكثر. this وthese قريبان، وthat وthose بعيدان.",
    right: "These shoes are new.",
    wrong: "This shoes are new.",
    exception: "Alone they are pronouns: This is my pen. These are mine.",
    exceptionGloss: "وحدها تصير ضمائر: This is my pen. These are mine.",
  },
  {
    id: "a1-07",
    order: 7,
    level: "A1",
    title: "what / where / who",
    family: "question",
    match: "wh-start",
    rule: "Start a question with what (things), where (places) or who (people), then change the order: Where is she?",
    gloss: "نبدأ السؤال بـ what للأشياء وwhere للأماكن وwho للأشخاص، ثم نقلب الترتيب.",
    right: "Where is the bus?",
    wrong: "Where the bus is?",
    exception: "When who is the subject, the order does not change: Who is at the door?",
    exceptionGloss: "إذا كان who هو الفاعل لا نقلب الترتيب: Who is at the door؟",
  },
  {
    id: "a1-08",
    order: 8,
    level: "A1",
    title: "in / on / under",
    family: "preposition",
    match: "place",
    rule: "Use in for inside, on for a surface, and under for below: in the box, on the table, under the bed.",
    gloss: "in للداخل، وon للسطح، وunder للأسفل.",
    right: "The cup is on the table.",
    wrong: "The cup is in the table.",
    exception: "We say at home, at school and at work, without in.",
    exceptionGloss: "نقول at home وat school وat work بلا in.",
  },
  {
    id: "a1-09",
    order: 9,
    level: "A1",
    title: "possessive 's",
    family: "determiner",
    match: "possessive-s",
    rule: "Add 's to a name or a person to show who owns a thing: Tom's bag, my mother's car.",
    gloss: "نضيف 's للاسم أو الشخص لنبيّن من يملك الشيء: Tom's bag.",
    right: "This is Tom's bag.",
    wrong: "This is Toms bag.",
    exception: "After a plural that ends in s, add only an apostrophe: the girls' room.",
    exceptionGloss: "إذا كان الجمع ينتهي بـ s نضع apostrophe فقط: the girls' room.",
  },
  {
    id: "a1-10",
    order: 10,
    level: "A1",
    title: "plural nouns",
    family: "quantity",
    match: "plural",
    rule: "Add -s to most nouns after two, three, some or many: two cars, some apples.",
    gloss: "نضيف -s لأغلب الأسماء بعد two وthree وsome وmany.",
    right: "Two cars are here.",
    wrong: "Two car are here.",
    exception:
      "Some plurals change: child becomes children, man becomes men, person becomes people.",
    exceptionGloss: "بعض الجموع تتغير: child تصير children، و man تصير men.",
  },
  {
    id: "a1-11",
    order: 11,
    level: "A1",
    title: "imperatives",
    family: "present",
    match: "imperative",
    rule: "To give an order or advice, start with the base verb: Open the door. Please sit down.",
    gloss: "للأمر والنصيحة نبدأ بالفعل مباشرة: Open the door.",
    right: "Open the window, please.",
    wrong: "Opens the window.",
    exception: "For a negative order use Don't and the base verb: Don't open the door.",
    exceptionGloss: "للنهي نضع Don't قبل الفعل: Don't open the door.",
  },
  {
    id: "a1-12",
    order: 12,
    level: "A1",
    title: "object pronouns",
    family: "pronoun",
    match: "object-pronoun",
    rule: "After a verb or a preposition use me, you, him, her, us and them: Call me. I see her.",
    gloss: "بعد الفعل أو حرف الجر نستعمل me وhim وher وus وthem.",
    right: "Call me tomorrow.",
    wrong: "Call I tomorrow.",
    exception: "You and it do not change: I see you. I like it.",
    exceptionGloss: "you وit لا تتغيران: I see you. I like it.",
  },
  {
    id: "a1-13",
    order: 13,
    level: "A1",
    title: "regular past (-ed)",
    family: "past",
    match: "regular-past",
    rule: "For most verbs add -ed to show a finished action: I worked yesterday. We walked home.",
    gloss: "لأغلب الأفعال نضيف -ed لفعل انتهى في الماضي: I worked yesterday.",
    right: "I worked yesterday.",
    wrong: "I work yesterday.",
    exception:
      "A verb that ends in e adds only -d (like, liked). Consonant + y becomes -ied (study, studied).",
    exceptionGloss: "المنتهي بـ e يأخذ d فقط، والمنتهي بساكن + y يصير ied.",
  },
  {
    id: "a1-14",
    order: 14,
    level: "A1",
    title: "irregular past",
    family: "past",
    match: "irregular-past",
    rule: "Many common verbs change in the past. Learn them one by one: go, went. see, saw. take, took.",
    gloss: "أفعال شائعة كثيرة تتغير في الماضي، نحفظها واحداً واحداً: go، went.",
    right: "I went home.",
    wrong: "I goed home.",
    exception: "A few keep the same form: put, cut, hit.",
    exceptionGloss: "بعض الأفعال تبقى كما هي: put، cut، hit.",
  },
  {
    id: "a1-15",
    order: 15,
    level: "A1",
    title: "was / were",
    family: "past",
    match: "was-were",
    rule: "Use was with I, he, she and it. Use were with you, we and they. They are the past of am, is and are.",
    gloss: "was مع I وhe وshe وit، وwere مع you وwe وthey، وهما ماضي am وis وare.",
    right: "They were late.",
    wrong: "They was late.",
    exception: "In questions and negatives: Was she tired? They weren't here.",
    exceptionGloss: "في السؤال والنفي: Was she tired؟ They weren't here.",
  },
  {
    id: "a1-16",
    order: 16,
    level: "A1",
    title: "did (questions)",
    family: "question",
    match: "did-question",
    rule: "For a question about the past, start with did and use the base verb: Did you call? Where did you go?",
    gloss: "للسؤال عن الماضي نبدأ بـ did ونستعمل الفعل الأساسي: Did you call؟",
    right: "Did you call me?",
    wrong: "Did you called me?",
    exception: "After did the verb has no -ed.",
    exceptionGloss: "بعد did لا نضيف -ed للفعل.",
  },
  {
    id: "a1-17",
    order: 17,
    level: "A1",
    title: "didn't",
    family: "negative",
    match: "didnt",
    rule: "For a negative in the past use didn't and the base verb: I didn't call. She didn't come.",
    gloss: "للنفي في الماضي نستعمل didn't مع الفعل الأساسي.",
    right: "I didn't call you.",
    wrong: "I didn't called you.",
    exception: "Use didn't with every subject: he didn't, we didn't.",
    exceptionGloss: "نستعمل didn't مع كل الفاعلين.",
  },
  {
    id: "a1-18",
    order: 18,
    level: "A1",
    title: "don't / doesn't",
    family: "negative",
    match: "dont-doesnt",
    rule: "For a negative in the present use don't with I, you, we and they, and doesn't with he, she and it.",
    gloss: "للنفي في المضارع: don't مع I وyou وwe وthey، وdoesn't مع he وshe وit.",
    right: "She doesn't like tea.",
    wrong: "She don't like tea.",
    exception: "After doesn't the verb has no -s: He doesn't work.",
    exceptionGloss: "بعد doesn't لا نضيف -s للفعل: He doesn't work.",
  },
  {
    id: "a1-19",
    order: 19,
    level: "A1",
    title: "do / does (questions)",
    family: "question",
    match: "do-does-question",
    rule: "For a present question start with do (I, you, we, they) or does (he, she, it): Do you work? Does she work?",
    gloss: "للسؤال في المضارع نبدأ بـ do مع I وyou وwe وthey، وdoes مع he وshe وit.",
    right: "Does she work here?",
    wrong: "Does she works here?",
    exception: "After does the verb has no -s.",
    exceptionGloss: "بعد does لا نضيف -s للفعل.",
  },
  {
    id: "a1-20",
    order: 20,
    level: "A1",
    title: "can",
    family: "modal",
    match: "can",
    rule: "Use can with the base verb for ability or to ask permission: I can swim. Can you help?",
    gloss: "can مع الفعل الأساسي للقدرة أو الإذن: I can swim.",
    right: "I can swim.",
    wrong: "I can swims.",
    exception: "Can has no -s and no to: I can to swim is wrong.",
    exceptionGloss: "can لا تأخذ -s ولا to.",
  },
  {
    id: "a1-21",
    order: 21,
    level: "A1",
    title: "there is / there are",
    family: "present",
    match: "there-is",
    rule: "Use there is for one thing and there are for more than one: There is a bag. There are two cats.",
    gloss: "there is لشيء واحد، وthere are لأكثر من شيء.",
    right: "There are two cats.",
    wrong: "There is two cats.",
    exception: "In questions the order changes: Is there a bank near here? Are there any cats?",
    exceptionGloss: "في السؤال: Is there؟ Are there؟",
  },
  {
    id: "a1-22",
    order: 22,
    level: "A1",
    title: "in / on / at (time)",
    family: "preposition",
    match: "time-prep",
    rule: "Use in for parts of the day (in the morning), on for days (on Monday), and at for clock times (at five).",
    gloss: "in لأجزاء اليوم، وon للأيام، وat للساعة.",
    right: "We meet on Monday.",
    wrong: "We meet in Monday.",
    exception: "We say at night, not in the night.",
    exceptionGloss: "نقول at night لا in the night.",
  },
  {
    id: "a1-23",
    order: 23,
    level: "A1",
    title: "always / usually / never",
    family: "frequency",
    match: "frequency",
    rule: "These words say how often we do something. They come before the main verb: I always walk.",
    gloss: "هذه الكلمات تدل على التكرار، وتأتي قبل الفعل الأساسي.",
    right: "She never drinks coffee.",
    wrong: "She drinks never coffee.",
    exception: "With am, is and are they come after the verb: I am always late.",
    exceptionGloss: "مع am وis وare تأتي بعد الفعل: I am always late.",
  },
  {
    id: "a1-24",
    order: 24,
    level: "A1",
    title: "some / any",
    family: "quantity",
    match: "some-any",
    rule: "Use some in positive sentences and any in questions and negatives: I have some water. Do you have any?",
    gloss: "some في الجمل المثبتة، وany في السؤال والنفي.",
    right: "I have some water.",
    wrong: "I have any water.",
    exception: "Some and any also go with plural nouns: some apples, any apples.",
    exceptionGloss: "some وany تأتيان مع الجمع أيضاً: some apples.",
  },
];

const BY_ID = new Map(A1_LADDER.map((rule) => [rule.id, rule]));

/** The rule with that id, or undefined for an id that is not on the ladder. */
export function ruleById(id: string): RuleSpec | undefined {
  return BY_ID.get(id);
}
