/**
 * Adds 2 beginner-level (L1) books to the Library — filling the complete
 * absence of L1 content found in the audit (16 books at L2, 7 at L3, zero
 * at L1). Both are globally famous, widely loved titles whose own prose
 * style is naturally simple, matching the level rather than fighting it.
 *
 * Same shape/scope as scripts/insert-books.ts and insert-books-2.ts.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-books-3.ts
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Section {
  title: string;
  description: string;
  sentences: string[];
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  difficultyLevel: 1 | 2 | 3;
  order: number;
  categories: { id: string; isPrimary: boolean }[];
  sections: Section[];
}

const BOOKS: Book[] = [
  {
    id: "book-the-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupery",
    description:
      "An original SentenceStep summary of Antoine de Saint-Exupery's beloved story about a young prince who travels from planet to planet, learning simple truths about love, loneliness, and what truly matters in life",
    difficultyLevel: 1,
    order: 23,
    categories: [
      { id: "category-philosophy", isPrimary: true },
      { id: "category-self-development", isPrimary: false },
    ],
    sections: [
      {
        title: "A Pilot in the Desert",
        description: "A pilot crashes in the Sahara and meets a strange little boy",
        sentences: [
          "A pilot crash-lands his plane alone in the Sahara Desert",
          "He has very little water and must fix his engine fast",
          "A strange small boy appears and asks him to draw a sheep",
          "The pilot is surprised because no one lives near this empty place",
          "The boy says he has come from a very small planet far away",
        ],
      },
      {
        title: "The Little Prince's Planet",
        description: "A tiny planet with three volcanoes, a proud flower, and daily chores",
        sentences: [
          "The little prince lives on a tiny planet called Asteroid B-612",
          "His planet is so small he can watch the sunset many times a day",
          "Three small volcanoes and one proud flower grow on his planet",
          "Every morning he pulls out small trees called baobabs before they grow too big",
          "He takes great care of his tiny world every single day",
        ],
      },
      {
        title: "The Rose He Loved",
        description: "A beautiful, proud rose, and the sadness of leaving her behind",
        sentences: [
          "One day a beautiful rose grows on the little prince's planet",
          "The rose is proud and often says unkind things to him",
          "He loves her deeply but her words hurt his feelings often",
          "He decides one day to leave his planet and see other worlds",
          "Leaving the rose behind makes him feel both free and very sad",
        ],
      },
      {
        title: "Strange Grown-Ups on Other Planets",
        description: "A king, a vain man, and a businessman who all seem stranger than the last",
        sentences: [
          "The little prince visits several planets before reaching Earth",
          "On one planet a king rules over nobody but still gives orders",
          "On another planet a man only cares about being admired by others",
          "A businessman spends all day counting stars he believes he owns",
          "The little prince finds each grown-up stranger than the one before",
        ],
      },
      {
        title: "The Fox and Its Secret",
        description: "A clever fox teaches him what it means to truly see",
        sentences: [
          "On Earth the little prince meets a clever fox in a field",
          "The fox asks the prince to tame him so they can become friends",
          "Taming means slowly building trust and understanding between two hearts",
          "The fox shares a secret, what matters most is invisible to the eye",
          "He says people only truly see well with their heart, not their eyes",
        ],
      },
      {
        title: "Remembering the Rose",
        description: "Why his one rose matters more than any other flower",
        sentences: [
          "The fox tells him his rose is special because of the time he gave her",
          "The little prince finally understands why she matters more than any other flower",
          "He realizes love means the time and care we choose to give",
          "This simple idea changes how the little prince sees his whole journey",
          "He now understands his rose was never like any other flower at all",
        ],
      },
      {
        title: "Meeting the Pilot",
        description: "A quiet friendship grows in the desert",
        sentences: [
          "The little prince finally meets the tired pilot fixing his plane",
          "They talk every day while the pilot searches for water and parts",
          "The little prince asks the pilot to draw him many more sheep",
          "Slowly the pilot begins to understand the boy's strange gentle world",
          "Their friendship grows stronger with every quiet conversation in the desert",
        ],
      },
      {
        title: "Going Home to the Stars",
        description: "A gentle goodbye, and a reminder to look closely at what matters",
        sentences: [
          "The little prince says it is time for him to return to his planet",
          "He tells the pilot not to feel sad when he is gone",
          "He explains that his star will be like a small laughing bell for the pilot",
          "The pilot finishes fixing his plane and watches the sky every night after",
          "The story ends by asking us to always look closely for what truly matters",
        ],
      },
    ],
  },
  {
    id: "book-who-moved-my-cheese",
    title: "Who Moved My Cheese?",
    author: "Spencer Johnson",
    description:
      "An original SentenceStep summary of Spencer Johnson's simple parable about four characters in a maze, and what their search for cheese teaches about handling change with less fear",
    difficultyLevel: 1,
    order: 24,
    categories: [
      { id: "category-self-development", isPrimary: true },
      { id: "category-business", isPrimary: false },
    ],
    sections: [
      {
        title: "Four Characters in a Maze",
        description: "Two mice and two tiny people, all searching for cheese",
        sentences: [
          "Two mice named Sniff and Scurry live inside a large maze",
          "Two tiny people named Hem and Haw also live in the very same maze",
          "All four spend their days searching the maze for cheese to eat",
          "Cheese in this story stands for anything we want in our life",
          "Each character searches for cheese in their own very different way",
        ],
      },
      {
        title: "Finding Cheese Station C",
        description: "A big supply of cheese, and two very different reactions to it",
        sentences: [
          "One day all four finally find a big supply of cheese",
          "They find it waiting for them inside a place called Cheese Station C",
          "The mice, Sniff and Scurry, keep their simple daily routine unchanged",
          "Hem and Haw grow comfortable and begin to relax completely",
          "They soon believe the cheese will always be there for them",
        ],
      },
      {
        title: "The Cheese Disappears",
        description: "One morning, the cheese is simply gone",
        sentences: [
          "One morning the cheese at Station C is completely gone",
          "Sniff and Scurry are not surprised and quickly start searching again",
          "Hem and Haw are shocked and feel deeply upset by the sudden change",
          "Hem shouts angrily, certain that this change is simply not fair",
          "Haw feels scared but quietly begins to wonder what they should do next",
        ],
      },
      {
        title: "Fear of the Unknown",
        description: "One friend waits, the other decides to search again",
        sentences: [
          "Hem refuses to leave Station C, hoping the cheese will simply return",
          "Haw grows hungrier and slowly realizes that waiting will not help them",
          "He understands that fear of change is often worse than change itself",
          "Haw finally decides to step back into the maze and search again",
          "He writes messages on the maze walls to help guide his friend Hem",
        ],
      },
      {
        title: "Writing on the Wall",
        description: "Small written reminders that slowly build his courage",
        sentences: [
          "Haw writes simple short sayings on the walls as he explores further",
          "One message reads plainly, if you do not change, you can become extinct",
          "Another message asks him what he would do if he were not afraid",
          "These small written reminders slowly help him feel braver each day",
          "He begins to imagine finding new cheese somewhere further in the maze",
        ],
      },
      {
        title: "Enjoying the Journey",
        description: "Why imagining success early makes the search feel lighter",
        sentences: [
          "As Haw explores he notices he actually enjoys searching again",
          "He imagines himself already enjoying new cheese, even before finding it",
          "This small imagined picture in his mind helps him keep moving forward",
          "He realizes that moving forward, even slowly, feels better than standing still",
          "Haw begins smiling more, even while he is still searching the maze",
        ],
      },
      {
        title: "Finding New Cheese",
        description: "A wonderful discovery, and a wish that his friend had come too",
        sentences: [
          "Eventually Haw discovers a wonderful new supply of cheese in the maze",
          "Sniff and Scurry are already there, having arrived much earlier than him",
          "Haw finally understands why moving quickly with change matters so much",
          "He wishes his friend Hem had come with him to see this new place",
          "He leaves signs behind, hoping Hem will one day follow his path too",
        ],
      },
      {
        title: "What the Cheese Really Means",
        description: "The lesson Haw leaves behind for whoever follows",
        sentences: [
          "Haw writes his biggest lesson clearly on the new station's wall",
          "He notes that change keeps happening whether we expect it or not",
          "Watching for small changes early can help us adapt before it's too late",
          "Moving in a new direction can actually feel exciting instead of frightening",
          "The story ends by reminding us that new cheese is always somewhere out there",
        ],
      },
    ],
  },
];

async function main() {
  const bookRows = BOOKS.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description,
    difficulty_level: b.difficultyLevel,
    is_featured: false,
    is_free: true,
    status: "published" as const,
    order_index: b.order,
  }));
  const { error: bookError } = await supabase
    .from("books")
    .upsert(bookRows, { onConflict: "id", ignoreDuplicates: true });
  if (bookError) throw bookError;
  console.log(`Inserted/confirmed ${bookRows.length} books.`);

  const categoryRows = BOOKS.flatMap((b) =>
    b.categories.map((c) => ({ book_id: b.id, category_id: c.id, is_primary: c.isPrimary })),
  );
  const { error: bcError } = await supabase
    .from("book_categories")
    .upsert(categoryRows, { onConflict: "book_id,category_id", ignoreDuplicates: true });
  if (bcError) throw bcError;
  console.log(`Inserted/confirmed ${categoryRows.length} book_categories rows.`);

  const sectionRows = BOOKS.flatMap((b) =>
    b.sections.map((s, index) => ({
      id: `${b.id}-sec${index + 1}`,
      book_id: b.id,
      order_index: index + 1,
      title: s.title,
      description: s.description,
    })),
  );
  const { error: sectionError } = await supabase
    .from("book_sections")
    .upsert(sectionRows, { onConflict: "id", ignoreDuplicates: true });
  if (sectionError) throw sectionError;
  console.log(`Inserted/confirmed ${sectionRows.length} book_sections.`);

  const sentenceRows = BOOKS.flatMap((b) =>
    b.sections.flatMap((s, secIndex) =>
      s.sentences.map((en, sentIndex) => ({
        id: `${b.id}-sec${secIndex + 1}-s${sentIndex + 1}`,
        section_id: `${b.id}-sec${secIndex + 1}`,
        order_index: sentIndex + 1,
        en,
      })),
    ),
  );
  const { error: sentenceError } = await supabase
    .from("book_sentences")
    .upsert(sentenceRows, { onConflict: "id", ignoreDuplicates: true });
  if (sentenceError) throw sentenceError;
  console.log(`Inserted/confirmed ${sentenceRows.length} book_sentences.`);
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
