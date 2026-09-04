/**
 * Speaking-character gender per Stories lesson, for the admin narration
 * dashboard's voice picker (Story audio status). Stories have no
 * speaker/character field in the schema (book_sentences and the "stories"
 * lessons are plain narrative text), so this was determined by close
 * reading of each story's English AND Arabic text — not by counting
 * pronouns across the whole story, which double-counts supporting
 * characters and misreads first-person narration.
 *
 * Method: for a third-person story, the gender is the named protagonist's
 * (the person the title/description centers on) — a supporting character's
 * pronouns don't change the call even if they carry some dialogue. For a
 * first-person ("I") story, English never marks the narrator's own gender,
 * so any "he"/"she" in the story almost always belongs to someone else the
 * narrator is talking about (a friend, parent, coworker) and must be
 * ignored; the narrator's own gender was read off the Arabic translation
 * instead, which — unlike English — grammatically marks gender on
 * predicate adjectives/participles ("كنت متأخراً" vs "متأخرة") and on
 * "both of us" (كلانا vs كلتينا). Only a marker attached to the narrator
 * specifically counts; the same word describing another character (e.g. a
 * feminine adjective agreeing with a grammatically-feminine noun like
 * "الشكوى") does not. Where no such marker exists anywhere in a
 * first-person story, the narrator's gender is genuinely unstated in the
 * source content, and that is recorded as "neutral" rather than guessed
 * from a secondary character. "mixed" is reserved for a story with two
 * genuinely co-equal narrating protagonists of different genders — none of
 * the 62 stories currently need it.
 */
export type StoryCharacterGender = "male" | "female" | "neutral" | "mixed";

export const STORY_CHARACTER_GENDER: Record<string, StoryCharacterGender> = {
  "story-1": "female", // A New Neighbor — Layla (3rd person, protagonist)
  "story-2": "male", // The Job Interview — Ahmed (3rd person, protagonist)
  "story-3": "male", // The Missing Shoe — Ali (3rd person, protagonist)
  "story-5": "male", // The Old Photograph — 1st person; "غادرت... مدركاً" (masc participle)
  "story-6": "male", // A Very Bad First Date — 1st person; "كنت متوتراً" (masc)
  "story-7": "male", // The Wrong Coffee — Yusuf (3rd person, protagonist)
  "story-9": "male", // The Strange Package — Tariq (3rd person, protagonist)
  "story-12": "female", // A Seat at the Cafe — Noor (3rd person, protagonist)
  "story-13": "male", // The Wrong Apartment — Omar (3rd person, protagonist)
  "story-14": "female", // The Restaurant That Wasn't on the Map — Lina (3rd person, protagonist)
  "story-15": "neutral", // I Left My Wallet at Home — 1st person, no narrator-gender marker
  "story-16": "female", // A Friend I Hadn't Seen in Years — 1st person; "كلتينا" (fem dual, both female)
  "story-17": "neutral", // The Day My Internet Stopped Working — 1st person, no marker
  "story-18": "female", // A Very Strange First Day at Work — Yara (3rd person, protagonist)
  "story-19": "neutral", // The Decision I Kept Avoiding — 1st person, no marker
  "story-20": "neutral", // A Conversation I Didn't Expect — 1st person; "he" is the other man, not the narrator
  "story-22": "neutral", // The Stranger Who Remembered Me — 1st person; "he" is the stranger, not the narrator
  "story-23": "neutral", // The Message I Almost Didn't Send — 1st person, no marker
  "story-25": "female", // The Wrong Group Chat — Sara (3rd person, protagonist)
  "story-26": "male", // The Note on the Door — Karim (3rd person, protagonist)
  "story-27": "male", // The Guitar Lesson — Yusuf (3rd person, protagonist)
  "story-28": "female", // The Extra Change — Rana (3rd person, protagonist)
  "story-29": "neutral", // Wrong Number — 1st person; "he" is the caller, not the narrator
  "story-30": "male", // The Return Policy — 1st person; "مستعداً"/"محاولاً"/"صبوراً" (masc)
  "story-31": "neutral", // The Raise — 1st person; "she" is the manager, not the narrator
  "story-32": "neutral", // The Wrong Reply-All — 1st person, no narrator-gender marker
  "story-33": "male", // The Neighbor's Key — 1st person; "مقنعاً نفسي" (masc)
  "story-34": "neutral", // The Cat Who Chose Me — 1st person, no marker
  "story-35": "neutral", // Grandpa's Radio — 1st person; "he" is the grandfather, not the narrator
  "story-36": "male", // The Last Slice — 1st person; "كلانا" with a definitely-female sister implies a mixed (not both-female) pair
  "story-37": "neutral", // The Shirt Was Inside Out — 1st person; "he" is the old man, not the narrator
  "story-38": "neutral", // The Painting Class — 1st person; "she" is the teacher, not the narrator
  "story-39": "female", // A Seat Saved for No One — unnamed woman (3rd person, protagonist)
  "story-40": "neutral", // The Loudest Table — 1st person plural, group of friends
  "story-41": "neutral", // The Recipe with No Name — 1st person; "she" is the narrator's mother, not the narrator
  "story-42": "neutral", // Three Stops Too Far — 1st person, no marker
  "story-43": "neutral", // The Umbrella That Wasn't Mine — 1st person; "she" is the umbrella's owner, not the narrator
  "story-44": "neutral", // My Neighbor's Rooster — 1st person plural, whole-building story
  "story-45": "male", // The Question I Wasn't Ready For — title itself: "لم أكن مستعداً له" (masc)
  "story-46": "neutral", // The Piano at the Secondhand Shop — 1st person, no narrator-gender marker
  "story-47": "neutral", // The Uncle Who Never Called — 1st person; "he"/"she" are the uncle and mother, not the narrator
  "story-48": "neutral", // The Group Trip Nobody Agreed On — 1st person plural, group of friends
  "story-49": "neutral", // The Coworker Who Knew Too Much — 1st person; "he" is the coworker, not the narrator
  "story-50": "female", // The Recipe App Disaster — 1st person; "حاملة"/"مذعورة" (fem)
  "story-51": "female", // Letters for a Stranger — 1st person; "غير متأكدة" (fem)
  "story-52": "neutral", // The Language Exchange — 1st person; partner is male either way, so "كلانا" doesn't disambiguate the narrator
  "story-53": "female", // The Photographer Who Never Smiles in Photos — 1st person; "متوقعة مزحة" (fem); friend Tariq is a separate, male, character
  "story-54": "male", // The Bill That Was Too Small — 1st person; "متأكداً من وجود خطأ" (masc)
  "story-55": "neutral", // Two Weeks Without a Phone — 1st person, no marker
  "story-56": "female", // The Understudy — 1st person; "إن كنت جيدة" (fem)
  "story-57": "neutral", // The Mediator — 1st person, no narrator-gender marker
  "story-58": "male", // The Two-Star Review — 1st person; "لم أكن متأكداً" (masc); the reviewer is a separate, female, character
  "story-59": "male", // The House Sitter — 1st person; "كنت متأكداً" (masc)
  "story-60": "male", // The Translator — 1st person; "كنت الوحيد" (masc)
  "story-61": "male", // The Apology That Wasn't — 1st person; "كلينا" with a definitely-female friend implies a mixed (not both-female) pair
  "story-62": "neutral", // The Substitute — 1st person, no marker
  "story-63": "neutral", // The Auction — 1st person, no marker
  "story-64": "neutral", // The Voicemail — 1st person; "she" is the friend, not the narrator
  "story-65": "neutral", // The Negotiation — 1st person; "she" is the client, not the narrator
  "story-66": "male", // The Neighbor Downstairs — 1st person; "مستعداً لجدال" (masc)
  "stories-8249d07a": "female", // At the Pharmacy — Maya (3rd person, protagonist)
  "stories-3d5f4e74": "female", // The Right Person — Maya (3rd person, protagonist)
};

const LABELS_AR: Record<StoryCharacterGender, string> = {
  male: "ذكر",
  female: "أنثى",
  neutral: "محايد",
  mixed: "كلا الجنسين",
};

export function getStoryCharacterGenderLabelAr(id: string): string | null {
  const gender = STORY_CHARACTER_GENDER[id];
  return gender ? LABELS_AR[gender] : null;
}
