/**
 * Adds 4 more books to the Library, pushed live to Supabase — one more
 * Business title, one more Biography title, and two more History & Society
 * titles (the three gaps identified in the last round), all genuinely
 * famous, widely loved books, none overlapping the existing 19.
 *
 * Same shape/scope decision as scripts/insert-books.ts: complete rather
 * than exhaustive — every section fully populated, ~45-50 sentences across
 * 9-10 sections per book.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-books-2.ts
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
    id: "book-the-lean-startup",
    title: "The Lean Startup",
    author: "Eric Ries",
    description:
      "An original SentenceStep summary of Eric Ries' methodology for building startups through rapid experimentation, validated learning, and a build-measure-learn loop instead of guessing what customers want",
    difficultyLevel: 2,
    order: 19,
    categories: [
      { id: "category-business", isPrimary: true },
      { id: "category-productivity", isPrimary: false },
    ],
    sections: [
      {
        title: "Why Most Startups Fail",
        description:
          "Ries' core claim: startups fail from building the wrong thing, not building it badly",
        sentences: [
          "Most startups fail not because they build a bad product but because they build something nobody actually wants",
          "Founders often spend months perfecting a plan before ever testing it against a real customer",
          "Ries argues that a startup is fundamentally an experiment not a smaller version of a big company",
          "Traditional business planning assumes a stable market that a young startup rarely actually has",
          "The real danger is building something efficiently that turns out to be entirely the wrong thing",
        ],
      },
      {
        title: "The Build-Measure-Learn Loop",
        description: "The repeating cycle at the center of the whole method",
        sentences: [
          "Ries proposes a simple repeating cycle called build measure learn",
          "A team builds a small piece of the product measures how real customers respond then learns from the result",
          "Each loop should be completed as quickly as possible rather than perfected before release",
          "Speed through this loop matters more than the size or polish of any single version",
          "Startups that loop faster than competitors gain a genuine learning advantage over time",
        ],
      },
      {
        title: "The Minimum Viable Product",
        description: "The smallest experiment that still teaches something real",
        sentences: [
          "A minimum viable product is the smallest version of an idea that still teaches something real",
          "It is not a low-quality product but a deliberately limited experiment",
          "Ries describes early MVPs that were barely more than a landing page or a manual process",
          "The goal is gathering real evidence not impressing early users with polish",
          "Many founders resist releasing something so incomplete fearing it will damage their reputation",
        ],
      },
      {
        title: "Validated Learning",
        description: "Measuring progress by what you've actually proven, not by activity",
        sentences: [
          "Progress in a startup should be measured by validated learning not by activity or output",
          "A team can stay extremely busy while learning almost nothing useful about its customers",
          "Validated learning means testing a specific hypothesis and honestly recording what happened",
          "Vanity metrics like total signups can rise while the underlying business quietly fails",
          "Ries insists founders track numbers that actually predict future customer behavior",
        ],
      },
      {
        title: "Actionable Metrics vs Vanity Metrics",
        description:
          "Numbers tied to a real, controllable cause versus numbers that just look good",
        sentences: [
          "Vanity metrics look impressive on a slide but rarely explain what caused them to change",
          "Actionable metrics are tied clearly to a specific cause the team can influence directly",
          "Ries recommends cohort analysis tracking how each group of new users behaves over time",
          "This approach reveals whether real product changes are actually improving customer behavior",
          "Founders who chase vanity metrics often celebrate growth that never becomes a real business",
        ],
      },
      {
        title: "The Pivot",
        description: "Why changing direction is a normal, expected part of the process",
        sentences: [
          "A pivot is a structured change in strategy while keeping what has already been validated",
          "Ries argues that pivoting is not failure but a normal expected part of building something new",
          "Teams that never consider pivoting often keep pouring resources into a proven dead end",
          "Common pivots include changing the target customer the core feature or the entire business model",
          "Recognizing the right moment to pivot depends on honestly reviewing the loop's own data",
        ],
      },
      {
        title: "Innovation Accounting",
        description: "Turning vague optimism into concrete, testable milestones",
        sentences: [
          "Ries proposes innovation accounting a way to measure progress inside deep uncertainty",
          "Traditional accounting assumes a predictable business which an early startup rarely has",
          "Instead teams set a baseline then test specific changes meant to move it in one direction",
          "This turns vague optimism into a series of concrete falsifiable experiments",
          "Investors and teams can then judge progress by real evidence instead of by confident storytelling",
        ],
      },
      {
        title: "Small Batches",
        description: "Why releasing tiny changes often beats releasing big ones",
        sentences: [
          "Ries borrows the idea of small batch production from lean manufacturing",
          "Releasing tiny changes frequently surfaces problems faster than releasing large batches rarely",
          "Small batches shrink the distance between a mistake and the feedback that reveals it",
          "This approach feels slower at first but usually prevents much larger wasted efforts later",
          "Teams working in small batches can also change direction far more quickly when needed",
        ],
      },
      {
        title: "Building an Adaptive Organization",
        description: "Why the method is a way of running a company, not just launching one",
        sentences: [
          "The Lean Startup is not just a launch strategy but a way of running an ongoing organization",
          "Ries argues large companies can use these same methods to keep innovating internally",
          "Building adaptive processes matters more than any single brilliant idea a team starts with",
          "Discipline around experimentation not raw inspiration is what sustains innovation over years",
          "The book closes by urging every team large or small to treat uncertainty as something to test not guess",
        ],
      },
    ],
  },
  {
    id: "book-steve-jobs",
    title: "Steve Jobs",
    author: "Walter Isaacson",
    description:
      "An original SentenceStep summary of Walter Isaacson's biography of Steve Jobs, tracing his unconventional upbringing, obsessive perfectionism, and the highs and lows of building Apple into one of the world's most valuable companies",
    difficultyLevel: 2,
    order: 20,
    categories: [
      { id: "category-biography", isPrimary: true },
      { id: "category-business", isPrimary: false },
    ],
    sections: [
      {
        title: "An Adopted Child With Big Questions",
        description: "Jobs' early life, his adoption, and an intensity that unsettled his teachers",
        sentences: [
          "Steve Jobs was given up for adoption at birth and raised by Paul and Clara Jobs in California",
          "Knowing he was adopted shaped a lifelong sense of being chosen but also somehow apart",
          "He showed an early intensity and impatience that unsettled many of his teachers",
          "His adoptive father's careful garage craftsmanship left a lasting impression on him",
          "Even as a child Jobs expected the people and things around him to meet his own high standards",
        ],
      },
      {
        title: "Dropping Out, Dropping In",
        description:
          "College, calligraphy, and a search for meaning that later shaped his design instincts",
        sentences: [
          "Jobs enrolled at Reed College but dropped out after only one semester",
          "He kept auditing classes he found interesting including a calligraphy course",
          "That calligraphy class later shaped his obsession with beautiful typography on the Macintosh",
          "He experimented with a strict diet meditation and a trip to India seeking deeper meaning",
          "These wandering years exposed him to ideas about simplicity that never really left him",
        ],
      },
      {
        title: "Building Apple in a Garage",
        description: "How Jobs and Steve Wozniak turned very different talents into one company",
        sentences: [
          "Jobs partnered with his friend Steve Wozniak a brilliant and quieter engineer",
          "Wozniak built the technical genius behind the Apple I and Apple II computers",
          "Jobs supplied the relentless drive salesmanship and design instincts the young company needed",
          "Apple grew explosively turning both founders into visible symbols of the new computer age",
          "Their partnership combined two very different temperaments into one unusually effective team",
        ],
      },
      {
        title: "Reality Distortion Field",
        description:
          "The intensity that produced extraordinary results and exhausted people around him",
        sentences: [
          "Colleagues described Jobs as having a reality distortion field around difficult conversations",
          "Through sheer conviction he could persuade people that an impossible deadline was still doable",
          "This intensity produced extraordinary results but also left many collaborators exhausted",
          "Jobs was famous for blunt sometimes harsh feedback he considered simply being honest",
          "Isaacson presents both the brilliance and real personal cost behind that same relentless drive",
        ],
      },
      {
        title: "Exile From Apple",
        description: "Losing his own company, and the quiet years that reshaped his thinking",
        sentences: [
          "A power struggle with Apple's board eventually pushed Jobs out of his own company",
          "He described the experience as devastating even though it later reshaped his whole outlook",
          "Jobs founded NeXT a new computer company built around his exacting standards",
          "He also purchased a small animation studio that would eventually become Pixar",
          "These years outside Apple quietly prepared the ideas he would later bring back with him",
        ],
      },
      {
        title: "Pixar and a Different Kind of Storytelling",
        description: "A second identity built on patience and long-term creative investment",
        sentences: [
          "Under Jobs' ownership Pixar developed groundbreaking computer animated films",
          "Toy Story became the first entirely computer animated feature film ever released",
          "Pixar's success gave Jobs a rare second identity beyond the world of computers",
          "He learned patient long-term investment in a creative vision that took years to pay off",
          "This experience deepened his belief that great products come from genuine artistic care",
        ],
      },
      {
        title: "The Return to Apple",
        description: "Coming back to a struggling company and radically simplifying it",
        sentences: [
          "Apple struggling badly by the mid-1990s acquired NeXT and brought Jobs back",
          "He quickly moved from advisor to interim then permanent chief executive again",
          "Jobs radically simplified Apple's confusing product line down to a handful of focused products",
          "The colorful iMac signaled a dramatic turnaround in both design and company morale",
          "His return marked the beginning of Apple's transformation into a design-driven company",
        ],
      },
      {
        title: "iPod, iPhone, and Reinventing Industries",
        description: "Products that didn't just sell well but reshaped entire industries",
        sentences: [
          "The iPod combined hardware software and the iTunes store into one seamless experience",
          "Jobs insisted on controlling every detail from the chip inside to the packaging outside",
          "The iPhone later merged a phone an iPod and an internet device into a single product",
          "Each launch followed the same pattern obsessive secrecy followed by a dramatic public reveal",
          "These products didn't just sell well they reshaped entire industries around Apple's vision",
        ],
      },
      {
        title: "Perfectionism as Both Gift and Cost",
        description:
          "The uncompromising nature that produced beloved products and strained relationships",
        sentences: [
          "Jobs' insistence on simplicity often meant removing features that seemed obviously convenient",
          "He would reject nearly finished designs at the last moment over details others considered minor",
          "This perfectionism frustrated many engineers even as it consistently produced beloved products",
          "Isaacson shows how the same uncompromising nature strained Jobs' relationships throughout his life",
          "Colleagues often said working with him was simultaneously the hardest and most rewarding experience of their careers",
        ],
      },
      {
        title: "A Legacy Built on Intersection",
        description:
          "Technology and the liberal arts, and a legacy weighed against real personal flaws",
        sentences: [
          "Jobs often described his best work as sitting at the intersection of technology and the liberal arts",
          "He battled cancer for years while continuing to lead Apple through major product launches",
          "Even in his final years he remained deeply involved in Apple's design decisions",
          "Isaacson's biography closes by weighing his enormous impact against his considerable personal flaws",
          "Jobs left behind not just products but a lasting standard for combining engineering with genuine beauty",
        ],
      },
    ],
  },
  {
    id: "book-guns-germs-and-steel",
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    description:
      "An original SentenceStep summary of Jared Diamond's Pulitzer Prize winning explanation for why some societies conquered others, arguing that geography, agriculture, and disease shaped history far more than any innate difference between peoples",
    difficultyLevel: 3,
    order: 21,
    categories: [
      { id: "category-history", isPrimary: true },
      { id: "category-philosophy", isPrimary: false },
    ],
    sections: [
      {
        title: "Yali's Question",
        description: "The simple question that launched Diamond's search for an honest answer",
        sentences: [
          "Diamond opens with a question a New Guinean politician named Yali once asked him directly",
          "Yali wanted to know why Europeans had so much cargo while his own people had comparatively little",
          "The book is Diamond's attempt to answer that deceptively simple question honestly",
          "He firmly rejects the old racist idea that some peoples are simply more capable than others",
          "Instead he searches for environmental factors that shaped different societies' historical paths",
        ],
      },
      {
        title: "The Head Start of Farming",
        description: "Why a handful of regions got an early agricultural advantage",
        sentences: [
          "Diamond argues that farming not intelligence gave certain regions an early historical head start",
          "Only a small number of wild plant and animal species were ever suitable for domestication",
          "The Fertile Crescent happened to contain an unusually rich concentration of these species",
          "Early farming allowed populations to grow denser and store surplus food for the first time",
          "That surplus eventually freed some people to specialize in tools writing and government",
        ],
      },
      {
        title: "Domesticable Animals",
        description: "Why only a handful of large mammals could ever be domesticated at all",
        sentences: [
          "Diamond explains why only a handful of large mammal species were ever successfully domesticated",
          "A domesticable animal needed the right temperament diet growth rate and social structure",
          "Regions like Eurasia happened to have far more of these suitable animal candidates",
          "Domesticated animals provided meat labor transportation and fertilizer for growing farms",
          "Societies without domesticable animals faced real unavoidable limits on their own development",
        ],
      },
      {
        title: "Continental Axes",
        description: "How the shape of a continent quietly decided how fast crops could spread",
        sentences: [
          "Diamond highlights the different shapes of Eurasia Africa and the Americas as continents",
          "Eurasia's east-west axis let crops and livestock spread easily across similar climates",
          "Africa and the Americas stretch north-south crossing many very different climate zones",
          "Crops adapted to one region often failed when carried across these harsher climate boundaries",
          "This simple geographic difference slowed the spread of agriculture on some continents significantly",
        ],
      },
      {
        title: "Germs as an Unintended Weapon",
        description: "How disease, not weapons, decided the outcome of entire conquests",
        sentences: [
          "Living closely with domesticated animals exposed farming societies to many new diseases",
          "Over centuries these populations built up partial immunity to smallpox measles and more",
          "When Europeans reached the Americas they carried these diseases to populations with no immunity",
          "Diamond argues these germs killed far more people than any European weapon ever did",
          "This devastating largely accidental biological advantage reshaped the outcome of entire conquests",
        ],
      },
      {
        title: "Writing and the Spread of Knowledge",
        description: "Why so few societies ever invented writing completely from scratch",
        sentences: [
          "Dense agricultural societies eventually developed writing to track debts trade and history",
          "Written knowledge could travel and accumulate across many more generations than spoken memory alone",
          "Diamond traces how few independent centers ever invented writing completely from scratch",
          "Once invented writing systems often spread rapidly to neighboring societies through contact",
          "Literate societies could coordinate plan and later document conquest more effectively than others",
        ],
      },
      {
        title: "From Villages to States",
        description: "The rough path from small bands to organized, centralized states",
        sentences: [
          "Diamond traces a rough pattern from small bands to villages chiefdoms and eventually states",
          "Denser populations required new forms of organization to manage conflict and resources fairly",
          "Centralized states could raise armies taxes and public projects far beyond a village's ability",
          "This organizational advantage compounded alongside the advantages of farming animals and germs",
          "Societies that reached statehood earlier gained a further head start over their neighbors",
        ],
      },
      {
        title: "Steel and the Tools of Conquest",
        description: "How access to metal ore closed the loop of guns, germs, and steel",
        sentences: [
          "Access to metal ores and the resources to smelt them shaped which societies developed steel weapons",
          "Steel tools and weapons gave a decisive practical advantage in both farming and warfare",
          "Diamond connects this technological edge back to the same earlier agricultural and geographic advantages",
          "Societies without steel weapons faced conquerors whose equipment they simply could not match",
          "None of this reflected any difference in intelligence between the peoples involved",
        ],
      },
      {
        title: "Rejecting Simple Explanations",
        description: "Replacing old prejudice with a more honest, evidence-based explanation",
        sentences: [
          "Diamond closes by insisting environmental history explains far more than any racial theory ever could",
          "He acknowledges his framework as one important lens rather than a complete final answer",
          "The book argues history's big winners benefited enormously from accidents of geography and biology",
          "Understanding these historical accidents replaces old prejudice with a more honest explanation",
          "Guns Germs and Steel ultimately asks readers to rethink assumptions about why history unfolded as it did",
        ],
      },
    ],
  },
  {
    id: "book-outliers",
    title: "Outliers",
    author: "Malcolm Gladwell",
    description:
      "An original SentenceStep summary of Malcolm Gladwell's argument that extraordinary success comes less from raw individual talent and more from hidden advantages, timing, culture, and thousands of hours of practice",
    difficultyLevel: 2,
    order: 22,
    categories: [
      { id: "category-history", isPrimary: true },
      { id: "category-psychology", isPrimary: false },
    ],
    sections: [
      {
        title: "The Matthew Effect",
        description: "How a birthday can quietly decide a hockey career before it starts",
        sentences: [
          "Gladwell opens with Canadian hockey players noticing many share birthdays early in the year",
          "Youth hockey cutoff dates meant older kids within an age group looked more physically developed",
          "Coaches picked these slightly older kids for elite teams giving them better coaching early on",
          "That early advantage compounded over years into a real measurable difference in skill",
          "Small initial advantages Gladwell argues often snowball into outcomes that look purely like talent",
        ],
      },
      {
        title: "The 10,000 Hour Rule",
        description:
          "Why mastery needs both real ability and thousands of hours of rare opportunity",
        sentences: [
          "Gladwell popularizes research suggesting true mastery often requires around ten thousand hours of practice",
          "He traces how The Beatles played thousands of grueling hours in Hamburg clubs before fame",
          "Bill Gates gained rare early access to computer programming time most teenagers never had",
          "Neither raw talent nor sheer luck alone explained these outcomes without also examining opportunity",
          "Extraordinary achievement in this view requires both real ability and unusually favorable circumstances",
        ],
      },
      {
        title: "The Trouble With Geniuses",
        description: "Why being merely smart enough, plus the right social skills, often wins",
        sentences: [
          "Gladwell examines Christopher Langan a man with an extraordinarily high measured IQ",
          "Despite his brilliance Langan struggled to navigate universities and secure institutional support",
          "Gladwell contrasts him with Robert Oppenheimer who effectively charmed his way past serious trouble",
          "Practical intelligence often shaped by upbringing mattered as much as raw analytical intelligence",
          "Being merely smart enough paired with the right social skills often outperforms pure genius alone",
        ],
      },
      {
        title: "The Importance of Where You're From",
        description:
          "How family background quietly teaches children different scripts for confidence",
        sentences: [
          "Gladwell explores how family background quietly shapes a child's practical confidence",
          "Wealthier parents often taught children to negotiate comfortably with teachers and institutions",
          "Poorer families frequently taught respectful deference that could limit opportunities later on",
          "These inherited habits learned early shaped very different paths through school and career",
          "Cultural legacies of this kind often outlast the specific circumstances that first created them",
        ],
      },
      {
        title: "Rice Paddies and Math",
        description: "A farming tradition's surprising echo in a modern classroom",
        sentences: [
          "Gladwell links strong math performance among some Asian students to a rice farming heritage",
          "Rice cultivation traditionally demanded extraordinary sustained effort across the entire year",
          "This cultural legacy of tireless persistent work he argues transferred naturally into schooling",
          "Meaningful demanding work historically shaped cultural attitudes toward effort and persistence",
          "Success again reflects inherited cultural patterns as much as any purely individual trait",
        ],
      },
      {
        title: "The Culture of Honor",
        description: "How an old herding tradition still echoes generations later",
        sentences: [
          "Gladwell examines patterns of violence in parts of the American South tied to herding traditions",
          "Herding communities historically needed to defend livestock fiercely without relying on formal law",
          "That inherited culture of honor persisted long after the original herding economy had disappeared",
          "He connects this cultural legacy to a real tragic airline disaster involving communication failures",
          "Deeply ingrained cultural habits Gladwell shows can quietly shape behavior generations later",
        ],
      },
      {
        title: "Korean Air and the Power of Hierarchy",
        description: "How reshaping communication style measurably saved lives",
        sentences: [
          "Gladwell examines a period when Korean Air experienced an unusually high rate of plane crashes",
          "Cultural deference toward senior pilots sometimes discouraged junior crew from voicing urgent concerns",
          "Investigators found this hierarchy occasionally delayed critical safety warnings during real emergencies",
          "The airline eventually retrained crews specifically to communicate more directly regardless of rank",
          "Crash rates dropped sharply afterward showing how cultural patterns can be deliberately reshaped",
        ],
      },
      {
        title: "The Legacy of Meaningful Work",
        description:
          "Why work that connects effort to reward shapes generations, not just individuals",
        sentences: [
          "Gladwell argues satisfying work generally combines autonomy complexity and a clear connection between effort and reward",
          "Immigrant garment workers he profiles found real pride and eventual success through demanding structured labor",
          "That same combination he argues predicts long-term satisfaction across very different occupations",
          "Meaningful work not merely well-paid work shapes families' opportunities across later generations",
          "These patterns often echo forward shaping the outlooks of children who never did that original work themselves",
        ],
      },
      {
        title: "Rethinking the Self-Made Story",
        description: "Why every outlier's story is really about circumstance as much as character",
        sentences: [
          "Gladwell closes by questioning the popular myth of the purely self-made individual success story",
          "Every outlier he profiles benefited from specific often overlooked advantages of timing and culture",
          "None of this diminishes real talent and effort both of which clearly still matter enormously",
          "Recognizing hidden advantages he argues could help societies extend similar opportunities more widely",
          "Outliers ultimately reframes extraordinary success as a story about circumstance as much as character",
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
