/**
 * The German word lists (permission germanTrack) are the same 24 topics as the English ones, so they
 * wear the same drawing, icon and book colour. Those are all keyed by the English topic title; this
 * maps a German title to its English twin (any other title comes back as it is).
 */
const GERMAN_TO_ENGLISH: Record<string, string> = {
  Familie: "Family",
  Farben: "Colors",
  Tiere: "Animals",
  Freundschaft: "Friendship",
  Reisen: "Travel",
  Gesundheit: "Health",
  Politik: "Politics",
  Finanzen: "Finance",
  Technologie: "Technology",
  Essen: "Food",
  Haus: "House",
  Kleidung: "Clothes",
  Einkaufen: "Shopping",
  Wetter: "Weather",
  Arbeit: "Work",
  Umwelt: "Environment",
  Bildung: "Education",
  Medien: "Media",
  Körper: "Body",
  Verkehr: "Transportation",
  Sport: "Sports",
  Gefühle: "Emotions",
  Recht: "Law",
  Wissenschaft: "Science",
};

export function englishTopicTitle(title: string): string {
  return Object.prototype.hasOwnProperty.call(GERMAN_TO_ENGLISH, title)
    ? GERMAN_TO_ENGLISH[title]!
    : title;
}
