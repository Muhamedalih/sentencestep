/**
 * Adds 3 new books to the Library, pushed live to Supabase — deliberately
 * diversifying away from the existing 16 (which skew almost entirely
 * self-development/psychology/productivity, with the Business category
 * completely empty and no history/big-picture nonfiction at all — see the
 * content audit this follows) while staying genuinely popular, in-demand
 * titles, not obscure picks.
 *
 * Each new book is fully complete (every section has real sentences) —
 * deliberately shorter than the catalog's longest entries (Atomic Habits'
 * 201 sentences) rather than risk landing in the same broken state the
 * audit found on 6 of the 16 existing published books (sections with zero
 * sentences, silently unreadable). ~45-51 sentences across 9-10 sections
 * each, matching the catalog's smaller complete examples (How to Win
 * Friends, Man's Search for Meaning).
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-books.ts
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

// One new category — History & Society — since none of the existing 7
// (self-development, business, psychology, money-finance, productivity,
// biography, philosophy) fit a big-picture civilizational book like Sapiens.
const NEW_CATEGORY = { id: "category-history", name: "History & Society", order: 7 };

const BOOKS: Book[] = [
  {
    id: "book-sapiens",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    description:
      "An original SentenceStep summary exploring how Homo sapiens rose from an unremarkable ape to reshape the planet through shared myths, cooperation, and the revolutions in thinking, farming, and science that followed",
    difficultyLevel: 3,
    order: 16,
    categories: [
      { id: "category-history", isPrimary: true },
      { id: "category-philosophy", isPrimary: false },
    ],
    sections: [
      {
        title: "An Unremarkable Ape",
        description:
          "How Homo sapiens started out as just one modest species among several human relatives",
        sentences: [
          "Two hundred thousand years ago Homo sapiens was just one of several human species walking the earth",
          "Physically weaker than many predators our ancestors survived mostly through social cooperation",
          "Neanderthals were often stronger and had bigger brains yet they eventually disappeared",
          "For most of that early history humans occupied a modest middle place in the food chain",
          "Nothing about our biology alone explains why one particular ape species eventually dominated the planet",
        ],
      },
      {
        title: "The Cognitive Revolution",
        description:
          "The sudden shift in thinking and language that set Sapiens apart from every other species",
        sentences: [
          "Around seventy thousand years ago something shifted in how Sapiens thought and communicated",
          "New tools art and long-distance trade appeared in the archaeological record almost suddenly",
          "Language itself was not unique to humans but the content of that language changed everything",
          "Sapiens gained the rare ability to talk about things that do not physically exist at all",
          "That single ability to imagine fictions turned out to be the real turning point of the species",
          "Gossip and shared belief let far larger groups trust and organize with total strangers",
        ],
      },
      {
        title: "The Power of Shared Myths",
        description:
          "Why money, nations, and corporations are all stories that exist only because people believe them",
        sentences: [
          "Money nations and corporations are all stories that exist only because enough people believe in them together",
          "A dollar bill has no real value on its own only the shared trust behind it",
          "These shared fictions let thousands of strangers cooperate toward a common goal without ever meeting",
          "No other animal on earth can organize flexibly around an idea that isn't physically real",
          "Every large human institution from religion to law ultimately rests on this same kind of agreement",
        ],
      },
      {
        title: "Bands to Villages",
        description:
          "What everyday life actually looked like for tens of thousands of years of foraging",
        sentences: [
          "For most of human history people lived in small foraging bands that moved with the seasons",
          "Hunter-gatherers often worked fewer hours and ate a more varied diet than early farmers did",
          "Knowledge in these bands was broad since survival depended on understanding the entire local environment",
          "Social bonds were tight because everyone's cooperation was necessary for the group to survive",
          "This way of life shaped human bodies and minds for tens of thousands of years",
        ],
      },
      {
        title: "The Agricultural Trap",
        description: "Why Harari calls the shift to farming history's biggest fraud",
        sentences: [
          "About twelve thousand years ago humans began domesticating wheat rice and other crops",
          "Farming produced more food per acre but often meant far harder and more repetitive labor",
          "Diets actually narrowed and health often declined as people depended on just a few crops",
          "Harari calls this shift history's biggest fraud since it looked like progress but cost so much",
          "Once a population grew dependent on farming there was rarely any real way back",
        ],
      },
      {
        title: "Myths That Build Empires",
        description:
          "How writing, hierarchy, and shared stories scaled cooperation up to entire empires",
        sentences: [
          "Larger farming populations needed writing to record debts laws and harvests accurately",
          "Writing made complex bureaucracies and eventually entire empires possible for the first time",
          "Hierarchies of kings priests and social classes were justified through more shared stories",
          "Empires spread not only through force but by offering shared laws currency and identity",
          "Nearly every culture alive today is a descendant of some empire's long-forgotten myths",
        ],
      },
      {
        title: "The Scientific Revolution",
        description: "How admitting ignorance, backed by capital and empire, exploded human power",
        sentences: [
          "Around five hundred years ago European thinkers began admitting how much they did not yet know",
          "That admission of ignorance was the spark that launched modern science forward",
          "Governments and investors realized that funding discovery could produce real practical power",
          "Science capital and empire reinforced each other and accelerated at an unprecedented pace",
          "Within a few centuries humanity's control over nature grew more than in all previous history",
        ],
      },
      {
        title: "The Capitalist Engine",
        description: "Why modern economies run on credit — a shared belief in tomorrow's growth",
        sentences: [
          "Modern economies run on credit which is really just a shared belief in future growth",
          "Investors lend money today only because they trust the economy will be bigger tomorrow",
          "That trust fueled exploration invention and industry on a scale never seen before",
          "Growth became almost a religion of its own expected and demanded every single year",
          "Capitalism's core promise is that tomorrow's pie will always be larger than today's",
        ],
      },
      {
        title: "Reshaping Life Itself",
        description: "From muscle power to machines, and now to editing biology directly",
        sentences: [
          "Industrial technology moved humanity from muscle power to machines almost overnight",
          "Factories reorganized daily life around the clock rather than around the sun and seasons",
          "Modern science now edits genes extends lifespans and reshapes bodies directly",
          "Humans are no longer just changing their environment but starting to change biology itself",
          "The line between natural evolution and deliberate human design is growing thinner every year",
        ],
      },
      {
        title: "Are We Happier",
        description: "Harari's closing question: has all this power actually made us happier",
        sentences: [
          "Humanity has more power wealth and knowledge today than at any point in its history",
          "Yet Harari asks whether any of this has reliably made individual people happier",
          "Stress anxiety and dissatisfaction remain common even in the wealthiest societies on earth",
          "Progress solved many old problems while quietly creating new ones nobody had chosen",
          "The book closes by asking what humanity actually wants to become next now that it finally can",
        ],
      },
    ],
  },
  {
    id: "book-cant-hurt-me",
    title: "Can't Hurt Me",
    author: "David Goggins",
    description:
      "An original SentenceStep summary of David Goggins' account of transforming from an overweight, abused childhood into a Navy SEAL and ultra-endurance athlete through relentless mental toughness",
    difficultyLevel: 2,
    order: 17,
    categories: [
      { id: "category-biography", isPrimary: true },
      { id: "category-self-development", isPrimary: false },
    ],
    sections: [
      {
        title: "A Childhood Built on Fear",
        description: "Growing up under an abusive father, poverty, and a severe stutter",
        sentences: [
          "David Goggins grew up in a home ruled by his abusive and controlling father",
          "Poverty racism and a severe stutter made school feel like its own daily battle",
          "He struggled to read and was placed in special education classes throughout childhood",
          "His mother eventually gathered the courage to leave moving them to a safer town",
          "That escape gave him a chance at a normal life but left deep invisible scars",
        ],
      },
      {
        title: "The Overweight Recruit",
        description: "The night a television segment about Navy SEALs changed everything",
        sentences: [
          "Years later Goggins weighed nearly three hundred pounds and worked exterminating pests",
          "He felt directionless unhealthy and quietly ashamed of the life he had settled into",
          "One night he saw a television segment about Navy SEAL training and felt something shift",
          "He decided almost instantly that this impossible goal was exactly what he needed",
          "The Navy's own recruiter told him he had only a few months to lose enough weight",
        ],
      },
      {
        title: "Losing a Hundred Pounds",
        description: "Racing against the clock and his own body to qualify in time",
        sentences: [
          "Goggins had roughly three months to lose over a hundred pounds to even qualify",
          "He trained obsessively swimming and running far more than his body was ready for",
          "Stress fractures in both legs threatened to end the attempt before it truly began",
          "He pushed forward anyway treating the pain as information rather than a stop sign",
          "Against nearly every expectation he made the required weight in time",
        ],
      },
      {
        title: "Hell Week",
        description:
          "Five days of continuous punishment, and the bell that ends it for those who quit",
        sentences: [
          "Navy SEAL training includes Hell Week five days of nearly continuous physical punishment",
          "A brass bell sits nearby that any recruit can ring at any moment to quit",
          "Goggins watched dozens of stronger looking recruits ring that bell around him",
          "He focused only on surviving the next few minutes rather than the entire week",
          "He completed Hell Week and would go on to complete it two more times in his life",
        ],
      },
      {
        title: "The 40% Rule",
        description:
          "Goggins' core idea: when your mind says you're done, you're really only 40% done",
        sentences: [
          "Goggins developed a personal theory he calls the 40 Percent Rule",
          "When your mind insists you are completely finished you have usually used only 40 percent of your ability",
          "The remaining 60 percent is hidden behind discomfort the brain tries to avoid",
          "Recognizing this gap became his method for pushing past what felt like a hard limit",
          "He argues most people quit long before their bodies actually run out of capacity",
        ],
      },
      {
        title: "The Accountability Mirror",
        description: "A daily ritual of brutal self-honesty, written down and faced every morning",
        sentences: [
          "Goggins created a practice he calls the Accountability Mirror for total self-honesty",
          "He wrote his weaknesses and goals on sticky notes stuck directly to his mirror",
          "Every morning he faced those notes instead of avoiding uncomfortable truths about himself",
          "This ritual replaced excuses with a clear specific plan for improvement",
          "He credits this daily honesty as the real engine behind his transformation",
        ],
      },
      {
        title: "Callousing the Mind",
        description:
          "Building mental toughness on purpose, the same way skin calluses from friction",
        sentences: [
          "Goggins compares mental toughness to a callus that forms only through repeated friction",
          "He deliberately sought out difficult uncomfortable challenges to build that toughness on purpose",
          "He describes a mental cookie jar of past hard moments he survived and overcame",
          "In new difficult moments he reaches back into that jar for proof he can endure",
          "Comfort he argues quietly weakens people while chosen difficulty strengthens them",
        ],
      },
      {
        title: "Becoming an Ultra-Endurance Athlete",
        description: "From the military into ultra-marathons and a pull-up world record",
        sentences: [
          "After the military Goggins turned to ultra-marathons some over a hundred miles long",
          "He often trained and competed while still recovering from serious injuries",
          "He broke the world record for pull-ups completed within twenty-four hours",
          "Each new extreme challenge became another test of the mindset he had built",
          "His body kept failing in small ways yet his will kept finding a way through",
        ],
      },
      {
        title: "Taking Souls",
        description: "Turning other people's doubt into fuel, and the philosophy readers take away",
        sentences: [
          "Goggins uses the phrase taking souls to describe outworking people who underestimate him",
          "Other people's doubt became fuel rather than discouragement throughout his story",
          "His core message is that most limits people accept are mental not truly physical",
          "He urges readers to stop negotiating with themselves during difficult moments",
          "Can't Hurt Me ultimately argues that anyone can build extraordinary toughness through daily discipline",
        ],
      },
    ],
  },
  {
    id: "book-zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel",
    description:
      "An original SentenceStep summary of Peter Thiel's argument that true progress means creating something new rather than copying what already works, and how startups can build monopolies through unique value",
    difficultyLevel: 2,
    order: 18,
    categories: [
      { id: "category-business", isPrimary: true },
      { id: "category-self-development", isPrimary: false },
    ],
    sections: [
      {
        title: "Copying Versus Creating",
        description: "The difference between going from one to many and going from zero to one",
        sentences: [
          "Peter Thiel opens with a question he asks every job candidate about a truth few agree with him on",
          "He divides progress into two kinds going from one to many or from zero to one",
          "Copying an existing idea takes it from one to many spreading what already works",
          "Creating something genuinely new takes the world from zero to one for the first time",
          "Thiel argues real progress depends far more on the rarer zero to one kind of leap",
        ],
      },
      {
        title: "The Myth of Competition",
        description: "Why Thiel thinks competition is overrated and mostly destroys value",
        sentences: [
          "Business schools often praise competition as the engine that keeps companies sharp",
          "Thiel argues intense competition mostly destroys profits and distracts founders from real value",
          "Companies trapped in competition end up copying rivals instead of building something new",
          "He points to Silicon Valley successes that avoided direct competition almost entirely",
          "Chasing competitors in his view is usually a sign of a weak underlying business idea",
        ],
      },
      {
        title: "Why Monopolies Are Good",
        description: "The difference between a destructive monopoly and a creative one",
        sentences: [
          "Thiel distinguishes between destructive monopolies and what he calls creative monopolies",
          "A creative monopoly earns its position by offering something genuinely better than any alternative",
          "Such companies can reinvest their profits into further innovation instead of price wars",
          "Perfectly competitive markets by contrast often leave no one with resources to innovate",
          "He argues every truly successful company is in some sense its own kind of monopoly",
        ],
      },
      {
        title: "Escaping Competition",
        description: "Starting small, dominating a niche, then expanding outward",
        sentences: [
          "Thiel recommends starting in a deliberately small specific market rather than a huge one",
          "A small market is easier to dominate completely before facing serious competition",
          "Once a company owns its small niche it can expand outward into adjacent markets",
          "He points to Amazon starting narrowly with books before expanding into nearly everything",
          "Trying to win a huge market immediately usually spreads a young company far too thin",
        ],
      },
      {
        title: "The Power of Secrets",
        description: "Why every great company is built around a truth almost no one else sees yet",
        sentences: [
          "Thiel believes every great company is built around a secret almost no one else sees yet",
          "A secret here means an important truth that is hard to discover but not impossible",
          "Society often discourages this kind of contrarian thinking in favor of safe consensus",
          "Founders willing to search for overlooked secrets can find extraordinary opportunities",
          "He argues that believing few unclaimed secrets remain is itself a limiting belief",
        ],
      },
      {
        title: "Building for the Future",
        description: "Definite optimism versus vague, indefinite drifting",
        sentences: [
          "Thiel contrasts definite thinking a clear vision of the future with vague indefinite drifting",
          "Definite optimism means believing the future can be better and planning specifically for it",
          "Many modern institutions default to indefinite plans hedging instead of truly committing",
          "He argues bold definite plans though riskier produce far more meaningful progress",
          "A startup in his view needs a specific concrete vision rather than a flexible vague one",
        ],
      },
      {
        title: "The Founder's Paradox",
        description: "The unusual, even contradictory qualities that make founders effective",
        sentences: [
          "Thiel describes founders as often possessing unusual extreme even contradictory qualities",
          "The same intensity that drives extraordinary success can also alienate people around them",
          "History often treats such unusual founders with a strange mix of admiration and suspicion",
          "He argues boards and investors should protect founders rather than sanding down their edges",
          "Removing what makes a founder unusual can accidentally remove what makes them effective",
        ],
      },
      {
        title: "People Matter More Than Perks",
        description: "Why a small, mission-aligned team beats a large disorganized one",
        sentences: [
          "Thiel emphasizes hiring a small number of people fully committed to one shared mission",
          "He is skeptical of lavish office perks used to substitute for genuine purpose",
          "Every early employee in his view meaningfully shapes a young company's culture",
          "He recommends hiring people who are genuinely excited by the specific mission itself",
          "A tightly aligned founding team can outperform a much larger disorganized one",
        ],
      },
      {
        title: "The Question Every Founder Should Answer",
        description:
          "Returning to Thiel's opening question, and the challenge he leaves readers with",
        sentences: [
          "Thiel returns to his opening question about an important truth few people agree with you on",
          "Answering it honestly requires real independent thought rather than comfortable consensus",
          "He argues the best startups are built around convictions the rest of the world hasn't seen yet",
          "Zero to One ultimately urges founders to imagine genuinely new futures not just copy the present",
          "The book closes by challenging readers to find their own overlooked zero to one idea",
        ],
      },
    ],
  },
];

async function main() {
  const { error: categoryError } = await supabase
    .from("categories")
    .upsert(
      [
        {
          id: NEW_CATEGORY.id,
          name: NEW_CATEGORY.name,
          order_index: NEW_CATEGORY.order,
          is_active: true,
        },
      ],
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (categoryError) throw categoryError;
  console.log("Inserted/confirmed 1 category.");

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
