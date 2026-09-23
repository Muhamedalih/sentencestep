/**
 * Adds the first 6 Novels to the Library (Section: Library -> Novels
 * rollout) — original, condensed SentenceStep retellings of 6 widely loved
 * classic novels, never the original text (same copyright-safe convention
 * insert-books.ts already established for nonfiction: "An original
 * SentenceStep summary of..." in every description, original prose in
 * every sentence, no text copied from the source novel).
 *
 * Inserted as status 'draft' on purpose — reviewable from /admin/library
 * (filter Type: Novel) before anyone flips them to 'published'. Until a
 * novel is actually published, RLS keeps it invisible everywhere on the
 * learner-facing site (see 20250127000000_library_foundation.sql's
 * "Published books are public; admins see all" policy) — including on
 * /learn/library/novels itself, which reads through the anonymous public
 * client (see fetchAllNovels), not the session-aware admin one. That route
 * is separately gated to admins only for now (see its page.tsx) while this
 * catalog is reviewed.
 *
 * Every novel is assigned one shared, permanently-inactive "Fiction
 * Summaries" category — it exists only so re-saving a novel through the
 * admin Book form (which requires at least one category, see
 * validateBookInput) doesn't demand picking one of the nonfiction Book
 * categories. Being inactive, it never appears in any category nav or
 * section on the Library or Novels page.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-novels.ts
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

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  difficultyLevel: 1 | 2 | 3;
  order: number;
  isFeatured: boolean;
  sections: Section[];
}

const HIDDEN_CATEGORY = { id: "category-fiction-summaries", name: "Fiction Summaries", order: 99 };

const NOVELS: Novel[] = [
  {
    id: "book-novel-pride-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description:
      "An original SentenceStep summary of Jane Austen's story of pride, first impressions, and the slow-changing hearts of Elizabeth Bennet and Mr Darcy — a personal retelling, not the original text.",
    difficultyLevel: 2,
    order: 0,
    isFeatured: false,
    sections: [
      {
        title: "The Bennet Family",
        description: "Mrs Bennet's excitement over a wealthy new neighbor, and her five daughters",
        sentences: [
          "Mrs Bennet was thrilled when a wealthy young gentleman rented the nearby estate of Netherfield",
          "The Bennet family had five daughters and no son to inherit their home",
          "Elizabeth was the second daughter known for her quick wit and independent mind",
          "Mrs Bennet's only goal in life was to see all five daughters married well",
          "Mr Bennet found his wife's constant matchmaking both tiresome and quietly amusing",
        ],
      },
      {
        title: "A Ball at Netherfield",
        description: "Mr Bingley's charm, Mr Darcy's pride, and an overheard insult",
        sentences: [
          "At a local ball Mr Bingley proved cheerful friendly and instantly popular with everyone",
          "His friend Mr Darcy seemed proud distant and unwilling to dance with strangers",
          "Elizabeth overheard Darcy calling her merely tolerable and not handsome enough to tempt him",
          "The insult stung her pride though she later turned it into a private joke",
          "Bingley danced twice with Jane and the whole neighborhood began to notice",
        ],
      },
      {
        title: "Jane and Bingley",
        description: "A growing attachment, an illness, and Darcy's reluctant admiration",
        sentences: [
          "Jane and Bingley's mutual affection grew quickly over the following weeks",
          "Jane fell seriously ill while visiting Bingley's sisters and had to stay at Netherfield",
          "Elizabeth walked three miles through the mud to nurse her sister back to health",
          "Darcy found himself unexpectedly drawn to Elizabeth's intelligence and lively conversation",
          "He fought against the attraction believing her family connections were far beneath him",
        ],
      },
      {
        title: "Mr Collins Proposes",
        description: "A ridiculous cousin, a refusal, and a friend's practical marriage",
        sentences: [
          "Mr Collins a pompous clergyman arrived planning to marry one of the Bennet sisters",
          "He proposed to Elizabeth listing practical reasons rather than any real affection",
          "Elizabeth refused him firmly despite her mother's horror at losing a secure marriage",
          "Elizabeth's close friend Charlotte Lucas accepted Mr Collins instead for financial security",
          "Elizabeth was privately disappointed that her friend would marry without any real love",
        ],
      },
      {
        title: "Darcy's Hidden Feelings",
        description: "Wickham's story, Elizabeth's growing dislike, and Darcy's private admiration",
        sentences: [
          "Elizabeth met the charming officer Wickham who told her a damaging story about Darcy",
          "Wickham claimed Darcy had cheated him out of an inheritance he was promised",
          "Elizabeth believed the story completely and her dislike of Darcy grew even stronger",
          "Meanwhile Darcy admired Elizabeth more with every conversation despite his own resistance",
          "He tried to convince himself that her low connections made a match impossible",
        ],
      },
      {
        title: "The First Proposal",
        description: "A proud proposal, and a furious refusal",
        sentences: [
          "While visiting Charlotte Elizabeth was startled when Darcy suddenly proposed marriage to her",
          "His proposal was full of pride mentioning her inferior family as an obstacle he had overcome",
          "Elizabeth refused him angrily accusing him of ruining Jane's happiness and mistreating Wickham",
          "Darcy left shaken by accusations he had never expected to hear about himself",
          "Elizabeth's anger did not fade even after he walked away in silence",
        ],
      },
      {
        title: "The Letter",
        description: "Darcy explains himself, and Elizabeth's judgment begins to change",
        sentences: [
          "The next morning Darcy delivered a long letter explaining his side of both accusations",
          "He had separated Bingley from Jane only because he doubted her feelings were sincere",
          "Wickham he explained had actually tried to elope with Darcy's own young sister",
          "Elizabeth reread the letter many times and slowly realized her judgment had been wrong",
          "She felt deep shame for trusting Wickham's charm over Darcy's honest character",
        ],
      },
      {
        title: "Pemberley",
        description: "A visit to Darcy's estate reveals a different man entirely",
        sentences: [
          "Months later Elizabeth toured Derbyshire and visited Darcy's grand estate called Pemberley",
          "The housekeeper praised Darcy warmly describing him as the kindest most generous master",
          "Darcy arrived unexpectedly and treated Elizabeth with a new gentleness and respect",
          "Elizabeth began to see a version of Darcy completely different from her first impression",
          "She started to wonder whether her early judgment of him had been badly mistaken",
        ],
      },
      {
        title: "Lydia's Scandal",
        description: "A family disgrace, and Darcy's quiet, generous rescue",
        sentences: [
          "News arrived that Elizabeth's youngest sister Lydia had run off with Wickham unmarried",
          "The scandal threatened to ruin the reputation of the entire Bennet family",
          "Darcy secretly tracked down the couple and paid Wickham to finally marry Lydia",
          "He asked everyone involved to keep his generous involvement completely a secret",
          "Elizabeth eventually learned the truth and was deeply moved by his quiet kindness",
        ],
      },
      {
        title: "A Second Proposal",
        description: "Two couples, and hearts that finally match",
        sentences: [
          "Bingley returned to the neighborhood and soon proposed happily to a joyful Jane",
          "Darcy visited again and Elizabeth found her feelings for him had completely changed",
          "He asked once more whether her feelings toward him had changed at all",
          "Elizabeth confessed that her opinion of him had reversed entirely since his letter",
          "Pride and Prejudice ends with both Elizabeth and Jane marrying the men they truly love",
        ],
      },
    ],
  },
  {
    id: "book-novel-great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description:
      "An original SentenceStep summary of F. Scott Fitzgerald's story of Jay Gatsby's glittering parties and his obsessive love for Daisy Buchanan — a personal retelling, not the original text.",
    difficultyLevel: 2,
    order: 1,
    isFeatured: false,
    sections: [
      {
        title: "Arriving in West Egg",
        description: "Nick Carraway settles beside a mysterious, wealthy neighbor",
        sentences: [
          "Nick Carraway moved to a small house on Long Island right next to a mansion",
          "His mysterious neighbor was a wealthy man named Jay Gatsby that nobody truly knew",
          "Nick had grown up modestly and found himself surrounded by careless enormous wealth",
          "Across the bay lived his cousin Daisy and her arrogant husband Tom Buchanan",
          "Nick soon realized this glittering world hid far more sadness than it first appeared",
        ],
      },
      {
        title: "The Mysterious Neighbor",
        description: "Wild rumors, endless parties, and a quiet host",
        sentences: [
          "Gatsby hosted enormous parties every weekend filled with strangers nobody had personally invited",
          "Guests traded wild rumors claiming he was a spy a killer or a secret prince",
          "Champagne flowed all night while an orchestra played until the very early morning",
          "Despite owning the mansion Gatsby rarely seemed to enjoy his own famous parties",
          "He often stood apart watching quietly instead of joining the noisy crowd himself",
        ],
      },
      {
        title: "Daisy and Tom",
        description: "An unhappy marriage across the bay",
        sentences: [
          "Nick visited his cousin Daisy who lived in a beautiful house with her husband Tom",
          "Tom was physically powerful arrogant and openly unfaithful to his unhappy wife",
          "A phone call interrupted dinner and everyone clearly knew it was Tom's mistress",
          "Daisy seemed bored and restless trapped inside a marriage that brought her little joy",
          "Nick left the visit uneasy sensing deep unhappiness hidden beneath their polished lifestyle",
        ],
      },
      {
        title: "An Invitation",
        description: "Nick finally meets the man behind the parties",
        sentences: [
          "Nick received a rare personal invitation to one of Gatsby's famous extravagant parties",
          "He finally met his neighbor a charming man with a strange practiced smile",
          "Gatsby called everyone old sport and seemed eager yet oddly nervous around Nick",
          "Rumors about Gatsby's past continued swirling even as Nick got to know him",
          "Nick began to suspect the parties existed for one very specific hidden purpose",
        ],
      },
      {
        title: "Gatsby's Request",
        description: "A confession of old love, and a favor Nick cannot refuse",
        sentences: [
          "Gatsby finally admitted he had once loved Daisy years before she married Tom",
          "He had built his entire fortune and mansion hoping to eventually win her back",
          "Gatsby asked Nick to arrange a quiet reunion between himself and Daisy",
          "Nick agreed feeling swept into a romantic dream that felt both foolish and moving",
          "Gatsby prepared nervously rearranging flowers and clothes for the important meeting",
        ],
      },
      {
        title: "Reunited",
        description: "Five years apart, and a dream within reach",
        sentences: [
          "Daisy and Gatsby met again for the first time in exactly five long years",
          "The reunion was awkward at first but soon warmed into genuine emotion",
          "Gatsby proudly showed Daisy his enormous mansion and his closets full of shirts",
          "Daisy suddenly began crying overwhelmed by the beauty and effort behind it all",
          "For a brief moment Gatsby's long impossible dream finally seemed within his reach",
        ],
      },
      {
        title: "The Truth About Gatsby",
        description: "A poor boy reinvented, all for the sake of one love",
        sentences: [
          "Nick eventually learned Gatsby's real name was James Gatz born into a poor family",
          "As a young man he had reinvented himself completely to chase wealth and status",
          "He earned his fortune through shady illegal business dealings that stayed carefully hidden",
          "Everything Gatsby built existed for one single purpose winning Daisy's love again",
          "His entire glamorous identity was really just a devoted very fragile performance",
        ],
      },
      {
        title: "Confrontation in New York",
        description: "Tom exposes Gatsby, and Daisy hesitates between two men",
        sentences: [
          "Tom grew suspicious and confronted Gatsby directly about his feelings for Daisy",
          "He exposed Gatsby's criminal business dealings in front of everyone at the hotel",
          "Daisy grew flustered and could not fully commit to leaving Tom for Gatsby",
          "Gatsby's confident image cracked as Daisy hesitated between the two rival men",
          "The tense afternoon ended with no clear winner and growing bitterness on the drive home",
        ],
      },
      {
        title: "Tragedy on the Road",
        description: "A fatal accident, and a lie of loyalty",
        sentences: [
          "Driving home Daisy accidentally struck and killed Tom's mistress Myrtle on the road",
          "Gatsby loyally decided to take the blame to protect Daisy from any consequences",
          "Myrtle's grieving husband believed Gatsby's car had deliberately killed his wife",
          "Tom quietly told the husband exactly where to find Gatsby's house that night",
          "Nick sensed the entire tragedy was about to end in something far worse",
        ],
      },
      {
        title: "The End of Gatsby",
        description: "A lonely death, and a story of empty wealth",
        sentences: [
          "Myrtle's husband arrived at Gatsby's mansion and shot him beside his own pool",
          "Gatsby died still waiting hopefully for a phone call from Daisy that never came",
          "Almost none of his many party guests bothered attending his small quiet funeral",
          "Daisy and Tom quietly left town together leaving no address or explanation behind",
          "Nick left New York disillusioned by the emptiness hidden behind so much glittering wealth",
        ],
      },
    ],
  },
  {
    id: "book-novel-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    description:
      "An original SentenceStep summary of Antoine de Saint-Exupéry's story of a stranded pilot and a small prince who teaches him what truly matters — a personal retelling, not the original text.",
    difficultyLevel: 1,
    order: 2,
    isFeatured: true,
    sections: [
      {
        title: "The Pilot in the Desert",
        description: "A crash landing, and an unexpected small visitor",
        sentences: [
          "A pilot crash landed his small airplane deep in the empty Sahara Desert",
          "He was alone with barely enough water and no way to call for help",
          "At sunrise a strange small voice asked him politely to draw a sheep",
          "Startled the pilot looked up and saw a serious little boy standing before him",
          "The boy did not seem lost at all despite the endless empty sand around them",
        ],
      },
      {
        title: "A Drawing of a Sheep",
        description: "A box, a hidden sheep, and a childhood memory",
        sentences: [
          "The pilot tried several drawings of sheep but the boy rejected every single one",
          "Frustrated the pilot drew a simple box and said the sheep was hidden inside",
          "The boy smiled brightly and declared that this drawing was exactly what he wanted",
          "The pilot recalled as a child drawing a snake that had swallowed an elephant",
          "Every adult he had shown it to only ever saw a plain ordinary hat",
        ],
      },
      {
        title: "The Prince's Tiny Planet",
        description: "Baobabs, volcanoes, and forty-four sunsets",
        sentences: [
          "The boy explained he came from a planet so small it was barely a house",
          "He carefully pulled up baobab sprouts every day before their roots could split his planet",
          "His tiny world had two small volcanoes he used gently for cooking each morning",
          "He loved watching the sunset and once watched it forty four times in one day",
          "The pilot slowly realized this strange visitor truly was a prince from another world",
        ],
      },
      {
        title: "The Rose",
        description: "A proud flower, and the reason he left home",
        sentences: [
          "On his planet grew one single proud and rather demanding rose he deeply loved",
          "The rose boasted about her beauty and often exaggerated small imaginary complaints",
          "The prince cared for her patiently even when her pride frustrated him constantly",
          "Hurt by one especially cruel comment he eventually decided to leave his planet",
          "He later realized he still loved her deeply despite her difficult prideful nature",
        ],
      },
      {
        title: "The King",
        description: "A ruler with no subjects at all",
        sentences: [
          "Traveling between planets the prince visited a king who ruled over absolutely no one",
          "The king insisted every single thing in the universe obeyed his royal commands",
          "He cleverly only ever ordered things that were already certain to happen anyway",
          "The prince found the king's empty lonely authority both strange and rather sad",
          "He quickly left concluding that grown ups were truly very peculiar indeed",
        ],
      },
      {
        title: "The Vain Man and the Drunkard",
        description: "Two small, sad planets",
        sentences: [
          "The next planet held a vain man who wanted only constant praise and admiration",
          "He asked the prince to clap simply so he could tip his hat proudly",
          "Another planet held a drunkard who drank purely to forget the shame of drinking",
          "The prince found both grown ups sad and utterly confusing in their small habits",
          "He continued his journey more puzzled than ever by the strange adult world",
        ],
      },
      {
        title: "The Businessman and the Lamplighter",
        description: "Counting stars, and one small planet of faithful duty",
        sentences: [
          "A businessman spent every waking moment counting stars he claimed personally to own",
          "The prince questioned what practical use owning distant stars could possibly serve",
          "On a tiny planet a lamplighter lit and extinguished his lamp every single minute",
          "Of every grown up he had met the prince respected the lamplighter's loyalty most",
          "The lamplighter at least worked faithfully for something beyond only himself",
        ],
      },
      {
        title: "Arriving on Earth",
        description: "A snake, a garden of roses, and a heartbreak",
        sentences: [
          "The prince finally landed alone on the vast and unfamiliar desert of planet Earth",
          "A yellow snake spoke to him and hinted quietly it could send him home",
          "Wandering further he discovered an entire garden full of roses just like his own",
          "He felt suddenly heartbroken believing his beloved rose was never truly unique after all",
          "Just then a quiet clever fox appeared and offered him some unexpected wisdom",
        ],
      },
      {
        title: "The Fox's Secret",
        description: "Taming, and what is truly essential",
        sentences: [
          "The fox asked the prince to gently tame him by visiting at the very same hour daily",
          "Through patience and routine the fox explained a real invisible bond slowly forms",
          "Once tamed the fox explained the color of wheat fields would always remind him of the prince",
          "The fox shared his secret that what is truly essential is invisible to the eye",
          "The prince finally understood that his rose was unique simply because he had loved her",
        ],
      },
      {
        title: "Returning Home",
        description: "A final goodbye, and a promise kept among the stars",
        sentences: [
          "The pilot finally repaired his plane after many days stranded together in the desert",
          "The prince explained sadly that his body was too heavy to carry back to his star",
          "He let the yellow snake bite him gently so his spirit alone could return home",
          "The pilot grieved deeply but understood this final quiet goodbye had to happen",
          "Years later he still watches the stars fondly remembering his small remarkable friend",
        ],
      },
    ],
  },
  {
    id: "book-novel-1984",
    title: "1984",
    author: "George Orwell",
    description:
      "An original SentenceStep summary of George Orwell's story of Winston Smith's quiet rebellion against a Party that controls truth itself — a personal retelling, not the original text.",
    difficultyLevel: 3,
    order: 3,
    isFeatured: false,
    sections: [
      {
        title: "Life in Oceania",
        description: "A gray city watched by Big Brother",
        sentences: [
          "Winston Smith lived in a gray city constantly watched by posters of Big Brother",
          "Telescreens in every room monitored citizens day and night with no real privacy",
          "The ruling Party controlled nearly every part of daily life speech and thought itself",
          "Even a suspicious facial expression alone could be reported as a serious thoughtcrime",
          "Winston quietly hated the Party though he had learned never to show it",
        ],
      },
      {
        title: "The Ministry of Truth",
        description: "Rewriting history to fit whatever the Party now says",
        sentences: [
          "Winston worked at the Ministry of Truth rewriting old newspapers to fit new lies",
          "Whenever the Party changed its story the past was quietly rewritten to match it",
          "Historical facts figures and famous names vanished the moment they became inconvenient",
          "Winston understood the disturbing party slogan that whoever controls the past controls the future",
          "Secretly this constant rewriting of truth filled him with quiet growing anger",
        ],
      },
      {
        title: "A Forbidden Diary",
        description: "A dangerous notebook, and a small act of honesty",
        sentences: [
          "Winston bought a small forbidden notebook to secretly record his private true thoughts",
          "Writing anything personal at all was considered a serious extremely dangerous crime",
          "He wrote the words down with Big Brother trembling with fear as he did",
          "Just owning the diary alone could eventually lead to his arrest or worse",
          "Still he felt a small fragile sense of freedom in finally being honest",
        ],
      },
      {
        title: "Julia",
        description: "A secret note, and a forbidden romance",
        sentences: [
          "A young woman named Julia secretly slipped Winston a note reading I love you",
          "They began meeting in hidden quiet corners away from any telescreen's watching eye",
          "Julia rebelled against the Party in her own quiet defiant physical way",
          "Their forbidden romance felt like a small dangerous act of true human freedom",
          "Winston felt more alive with Julia than he had in many long gray years",
        ],
      },
      {
        title: "A Secret Room",
        description: "A hidden hideaway, and a fragile hope",
        sentences: [
          "Winston rented a small room above an old shop that seemed to have no telescreen",
          "He and Julia met there secretly believing they had finally found true privacy",
          "For a while they lived almost normally sharing food conversation and real affection",
          "Winston began to hope quietly that resistance against the Party was truly possible",
          "Neither of them yet realized their secret hideaway was not nearly as safe as it seemed",
        ],
      },
      {
        title: "O'Brien's Trap",
        description: "A trusted official, and a forbidden book",
        sentences: [
          "A Party official named O'Brien hinted he secretly belonged to a resistance group",
          "Winston and Julia visited him hoping to join the mysterious group called the Brotherhood",
          "O'Brien asked whether they were willing to commit any act at all against the Party",
          "He gave Winston a forbidden book explaining the Party's true hidden methods and goals",
          "Winston trusted O'Brien completely never suspecting this trust was itself a careful trap",
        ],
      },
      {
        title: "The Book",
        description: "Understanding the machine that controls him",
        sentences: [
          "The forbidden book explained the Party sought power for its own endless sake alone",
          "It explained how constant war controlled and distracted the exhausted worn down population",
          "Winston read late into the night finally understanding the full machinery of his oppression",
          "Julia fell asleep while he kept reading hungry for the truth he had always sensed",
          "For a brief moment understanding the system felt like its own quiet form of power",
        ],
      },
      {
        title: "Betrayal",
        description: "The Thought Police arrive",
        sentences: [
          "Suddenly armed Thought Police broke into their secret hidden room without warning",
          "Mr Charrington the shopkeeper revealed himself as a Thought Police agent all along",
          "Winston realized with horror that O'Brien too had never truly been on their side",
          "Winston and Julia were violently dragged away separately toward the terrifying Ministry of Love",
          "Everything they had secretly built together collapsed within only a few terrifying minutes",
        ],
      },
      {
        title: "Room 101",
        description: "A worst fear, and a final betrayal",
        sentences: [
          "At the Ministry of Love O'Brien personally oversaw Winston's long brutal interrogation",
          "He explained the Party wanted total belief not simply forced silent obedience",
          "Winston was finally threatened with Room 101 containing his own personal worst fear",
          "Facing that unbearable fear directly Winston finally broke and betrayed Julia completely",
          "He begged desperately for the punishment to fall on her instead of himself",
        ],
      },
      {
        title: "Victory Over Himself",
        description: "A hollow ending, and a defeated mind",
        sentences: [
          "Released back into society Winston felt hollow and completely emotionally changed",
          "He met Julia briefly again and both coldly admitted they had betrayed each other",
          "Winston now spent his empty days quietly drinking at a nearly deserted cafe",
          "Watching a giant poster of Big Brother he finally felt only love toward the Party",
          "1984 ends with Winston's mind and remaining spirit completely and quietly defeated",
        ],
      },
    ],
  },
  {
    id: "book-novel-mockingbird",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description:
      "An original SentenceStep summary of Harper Lee's story of Scout Finch, her father Atticus, and a trial that exposes her town's deepest prejudice — a personal retelling, not the original text.",
    difficultyLevel: 2,
    order: 4,
    isFeatured: false,
    sections: [
      {
        title: "Scout and Jem",
        description: "A small Alabama town, and a thoughtful father",
        sentences: [
          "Scout Finch lived in the sleepy small town of Maycomb Alabama with her older brother Jem",
          "Their father Atticus was a thoughtful respected lawyer who raised them mostly alone",
          "Long hot summers were filled with imaginative games and endless childhood curiosity",
          "Atticus taught his children to treat every single person with patience and fairness",
          "Scout often got into trouble for her stubborn strong willed and honest personality",
        ],
      },
      {
        title: "Boo Radley",
        description: "A mysterious neighbor, and childhood dares",
        sentences: [
          "Nearby lived a mysterious neighbor named Boo Radley who never left his house",
          "Wild rumors claimed Boo was dangerous violent and possibly not entirely human",
          "Scout Jem and their friend Dill dared each other to approach his spooky house",
          "Small strange gifts began mysteriously appearing inside a hollow tree near his yard",
          "The children slowly grew curious about the quiet man hidden behind the rumors",
        ],
      },
      {
        title: "Atticus Takes a Case",
        description: "A false accusation, and a father's difficult choice",
        sentences: [
          "Atticus agreed to defend Tom Robinson a Black man falsely accused of a serious crime",
          "Tom was accused of assaulting a young white woman named Mayella Ewell",
          "Atticus believed deeply that every person deserved a fair and honest defense",
          "He knew clearly that defending Tom would bring real anger from their town",
          "Scout and Jem soon felt that same anger directed painfully toward their own family",
        ],
      },
      {
        title: "Town Reaction",
        description: "Hostility at school, and a tense night at the jail",
        sentences: [
          "Classmates taunted Scout at school for having a father who defended a Black man",
          "A hostile crowd once gathered outside the jail threatening to harm Tom Robinson",
          "Scout unknowingly diffused the tense crowd by innocently talking to a familiar neighbor",
          "Atticus remained calm and dignified despite the mounting pressure from angry neighbors",
          "The children slowly began to understand the real courage behind their father's quiet choice",
        ],
      },
      {
        title: "The Trial Begins",
        description: "A crowded courtroom, and conflicting testimony",
        sentences: [
          "The whole town crowded into the courthouse eager to watch the dramatic trial",
          "Mayella Ewell testified nervously offering a story that did not fully add up",
          "Her father Bob Ewell testified with obvious anger and clear open hostility",
          "Scout and Jem watched secretly from the balcony reserved for Black townspeople",
          "The tense courtroom grew quiet as Atticus rose calmly to begin his defense",
        ],
      },
      {
        title: "Atticus's Defense",
        description: "Careful evidence, and an argument about prejudice",
        sentences: [
          "Atticus proved clearly that Tom's supposedly injured arm was permanently and completely disabled",
          "He showed Mayella's injuries matched someone who led mostly with their strong left hand",
          "Bob Ewell it was gently but firmly implied was himself left handed",
          "Tom testified honestly explaining he had only ever tried to kindly help Mayella",
          "Atticus argued passionately that prejudice alone was clearly driving this unjust accusation",
        ],
      },
      {
        title: "An Unjust Verdict",
        description: "A guilty verdict, despite the evidence",
        sentences: [
          "Despite clear compelling evidence the all white jury still found Tom guilty",
          "Scout and Jem were shattered watching such obvious injustice happen right before them",
          "The Black community in the balcony rose silently and respectfully as Atticus left",
          "Atticus remained hopeful about pursuing a formal legal appeal for Tom's case",
          "The unjust verdict permanently changed how Scout viewed fairness within her own town",
        ],
      },
      {
        title: "Tragedy for Tom",
        description: "A desperate escape, and a senseless death",
        sentences: [
          "While awaiting his appeal Tom attempted a desperate escape from the prison yard",
          "Guards shot and killed him during the attempt to escape before any appeal could happen",
          "Atticus delivered the tragic news gently to Tom's grieving devastated family",
          "The senseless death deeply shook both the wider town and Atticus's own two children",
          "Scout began to fully understand the terrible real cost of prejudice around her",
        ],
      },
      {
        title: "Bob Ewell's Revenge",
        description: "A dark night, and an unexpected rescuer",
        sentences: [
          "Humiliated by the trial Bob Ewell grew bitter and quietly plotted his revenge",
          "One dark night he attacked Scout and Jem as they walked home alone",
          "Jem's arm was badly broken during the sudden terrifying struggle in the darkness",
          "A mysterious stranger suddenly appeared and fought Ewell fiercely off in the dark",
          "Scout realized with shock that their rescuer was the reclusive neighbor Boo Radley",
        ],
      },
      {
        title: "Boo Radley's Rescue",
        description: "A quiet meeting, and a lesson in compassion",
        sentences: [
          "Boo Radley had quietly carried the injured Jem safely back home himself that very night",
          "Scout finally met her mysterious neighbor gently guiding him shyly back to his own porch",
          "Standing on his porch she saw the whole neighborhood exactly as Boo always had",
          "The sheriff quietly decided to report Ewell's death as an accidental unfortunate fall",
          "To Kill a Mockingbird ends with Scout gaining real deep unforgettable lessons in compassion",
        ],
      },
    ],
  },
  {
    id: "book-novel-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    description:
      "An original SentenceStep summary of Paulo Coelho's story of Santiago, a shepherd who crosses the desert in search of a treasure — and of himself — a personal retelling, not the original text.",
    difficultyLevel: 1,
    order: 5,
    isFeatured: false,
    sections: [
      {
        title: "Santiago the Shepherd",
        description: "A recurring dream, and a restless heart",
        sentences: [
          "Santiago was a young shepherd boy who wandered the hills of Spain with his sheep",
          "He kept having the same recurring dream about treasure hidden near the Egyptian pyramids",
          "An old gypsy woman told him the dream was a sign he must follow",
          "Santiago hesitated at first unsure whether to trust a dream over his simple comfortable life",
          "Still something deep inside him quietly urged him toward this unexpected new journey",
        ],
      },
      {
        title: "The Old King",
        description: "A Personal Legend, and two small stones",
        sentences: [
          "A mysterious old man named Melchizedek soon appeared and called himself a king",
          "He spoke of something he called each person's own unique Personal Legend",
          "He explained that pursuing a true dream was every person's deepest real purpose",
          "He gave Santiago two small stones named Urim and Thummim to guide difficult decisions",
          "Inspired Santiago sold his sheep and set off toward Africa the very next day",
        ],
      },
      {
        title: "Robbed in Tangier",
        description: "A theft, and an unexpected job",
        sentences: [
          "In the unfamiliar city of Tangier a stranger quickly stole every coin Santiago owned",
          "Alone frightened and penniless he wondered if the whole journey had been a mistake",
          "He found work instead at a small struggling local crystal shop nearby",
          "The shop's tired owner had long ago given up on his own personal dreams",
          "Santiago suggested small clever improvements that slowly brought new customers to the shop",
        ],
      },
      {
        title: "The Crystal Shop",
        description: "A year of patience, and a choice to keep going",
        sentences: [
          "Over one full year Santiago worked hard and carefully saved his modest earnings",
          "He learned patience discipline and the quiet true value of honest daily effort",
          "Eventually he had saved enough money to buy sheep and return safely home",
          "Yet he realized the pyramids and his treasure still quietly called him onward",
          "He chose the uncertain dream instead of the safe comfortable option before him",
        ],
      },
      {
        title: "Joining the Caravan",
        description: "Crossing the desert, and learning to read its signs",
        sentences: [
          "Santiago joined a large trading caravan crossing the vast dangerous Sahara Desert",
          "There he met a curious Englishman traveling to study the secrets of true alchemy",
          "The Englishman carried many books but strangely little practical desert experience",
          "Santiago began noticing that the desert itself constantly spoke through small quiet signs",
          "He slowly learned to read wind sand and stars as the Englishman read his books",
        ],
      },
      {
        title: "The Oasis and Fatima",
        description: "A sudden love, and a warning that saves lives",
        sentences: [
          "The caravan stopped safely at a peaceful oasis while tribal wars raged nearby",
          "There Santiago instantly fell in love with a young woman named Fatima",
          "She encouraged him gently to continue pursuing his treasure rather than staying only for her",
          "Watching two fighting hawks Santiago suddenly sensed a coming surprise attack",
          "His warning saved the oasis and earned him the elders' great respect and trust",
        ],
      },
      {
        title: "The Alchemist",
        description: "A guide, and the Soul of the World",
        sentences: [
          "Because of his warning Santiago finally met a real mysterious desert alchemist",
          "The alchemist agreed to guide him personally the rest of the way toward the pyramids",
          "He taught Santiago that all things share one single connected Soul of the World",
          "Listening carefully to his own heart he explained was the truest form of real wisdom",
          "Under his patient guidance Santiago's courage and quiet understanding grew stronger daily",
        ],
      },
      {
        title: "Tested by the Desert Tribes",
        description: "A capture, and a test of true belief",
        sentences: [
          "Suspicious desert tribesmen captured both Santiago and the alchemist as they traveled",
          "To prove his worth Santiago was challenged to transform himself into the wind",
          "Terrified at first he closed his eyes and spoke quietly and directly to the desert",
          "Focusing completely he successfully summoned a powerful sudden sandstorm around himself",
          "Deeply impressed the tribesmen respectfully released both travelers to continue their journey",
        ],
      },
      {
        title: "Reaching the Pyramids",
        description: "A beating, and an unexpected revelation",
        sentences: [
          "Santiago finally reached the towering ancient pyramids he had dreamed about for so long",
          "While digging hopefully for treasure he was suddenly attacked and badly beaten by thieves",
          "One thief mockingly described his own recurring dream about treasure buried elsewhere entirely",
          "The thief's dream pointed unknowingly back toward Santiago's own original starting point",
          "Santiago realized with quiet astonishment that his treasure had been near home all along",
        ],
      },
      {
        title: "Returning Home",
        description: "A treasure found, and a journey's true meaning",
        sentences: [
          "Santiago journeyed all the way back to the very same field where he once slept",
          "Digging beneath an old sycamore tree he finally discovered a real hidden treasure chest",
          "He understood at last that the journey itself had truly shaped and changed him completely",
          "The treasure represented both real material wealth and the deeper wisdom Santiago had gained",
          "The Alchemist ends with Santiago finally ready to return once more to find Fatima",
        ],
      },
    ],
  },
];

async function main() {
  const { error: categoryError } = await supabase.from("categories").upsert(
    [
      {
        id: HIDDEN_CATEGORY.id,
        name: HIDDEN_CATEGORY.name,
        order_index: HIDDEN_CATEGORY.order,
        is_active: false,
      },
    ],
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (categoryError) throw categoryError;
  console.log("Inserted/confirmed 1 hidden category.");

  const novelRows = NOVELS.map((n) => ({
    id: n.id,
    title: n.title,
    author: n.author,
    description: n.description,
    difficulty_level: n.difficultyLevel,
    is_featured: n.isFeatured,
    is_free: true,
    status: "draft" as const,
    order_index: n.order,
    type: "novel" as const,
  }));
  const { error: novelError } = await supabase
    .from("books")
    .upsert(novelRows, { onConflict: "id", ignoreDuplicates: true });
  if (novelError) throw novelError;
  console.log(`Inserted/confirmed ${novelRows.length} novels.`);

  const categoryRows = NOVELS.map((n) => ({
    book_id: n.id,
    category_id: HIDDEN_CATEGORY.id,
    is_primary: true,
  }));
  const { error: bcError } = await supabase
    .from("book_categories")
    .upsert(categoryRows, { onConflict: "book_id,category_id", ignoreDuplicates: true });
  if (bcError) throw bcError;
  console.log(`Inserted/confirmed ${categoryRows.length} book_categories rows.`);

  const sectionRows = NOVELS.flatMap((n) =>
    n.sections.map((s, index) => ({
      id: `${n.id}-sec${index + 1}`,
      book_id: n.id,
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

  const sentenceRows = NOVELS.flatMap((n) =>
    n.sections.flatMap((s, secIndex) =>
      s.sentences.map((en, sentIndex) => ({
        id: `${n.id}-sec${secIndex + 1}-s${sentIndex + 1}`,
        section_id: `${n.id}-sec${secIndex + 1}`,
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
