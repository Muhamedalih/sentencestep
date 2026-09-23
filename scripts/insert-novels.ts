/**
 * Adds the first 6 Novels to the Library (Section: Library -> Novels
 * rollout) — original, condensed SentenceStep retellings of 6 widely loved
 * classic novels, never the original text (same copyright-safe convention
 * insert-books.ts already established for nonfiction: "An original
 * SentenceStep summary of..." in every description, original prose in
 * every sentence, no text copied from the source novel).
 *
 * Each section runs 8 sentences (not the Book catalog's usual 5) —
 * deliberately longer than a bare plot outline, adding scene-setting,
 * sensory detail, and secondary character beats so the retelling keeps
 * real narrative "flavor" instead of reading like a synopsis. `books`/
 * `categories`/`book_categories` stay `ignoreDuplicates: true` (never
 * clobber a status or metadata edit made by hand in /admin/library since
 * the first pass), but `book_sections`/`book_sentences` upsert as a real
 * overwrite — this script is the source of truth for the retelling's
 * prose, and a second run is expected to replace earlier, shorter text at
 * the same ids with this longer version.
 *
 * Inserted as status 'draft' on first insert — reviewable from
 * /admin/library (filter Type: Novel) before anyone flips them to
 * 'published'. Until a novel is actually published, RLS keeps it
 * invisible everywhere on the learner-facing site (see
 * 20250127000000_library_foundation.sql's "Published books are public;
 * admins see all" policy) — including on /learn/library/novels itself,
 * which reads through the anonymous public client (see fetchAllNovels),
 * not the session-aware admin one. That route is separately gated to
 * admins only for now (see its page.tsx) while this catalog is reviewed.
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

export const NOVELS: Novel[] = [
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
          "Their comfortable country house sat quietly among green fields not far from the small town of Meryton",
          "Elizabeth was the second daughter known for her quick wit and independent mind",
          "Jane the eldest was gentle and kind and saw the best in almost everyone she met",
          "The youngest sisters Kitty and Lydia cared mostly about officers dances and new ribbons",
          "Mrs Bennet's only goal in life was to see all five daughters married well",
          "Mr Bennet found his wife's constant matchmaking both tiresome and quietly amusing",
        ],
      },
      {
        title: "A Ball at Netherfield",
        description: "Mr Bingley's charm, Mr Darcy's pride, and an overheard insult",
        sentences: [
          "At a local ball Mr Bingley proved cheerful friendly and instantly popular with everyone",
          "The candlelit assembly room buzzed with music laughter and careful watchful gossip",
          "His friend Mr Darcy seemed proud distant and unwilling to dance with strangers",
          "Elizabeth overheard Darcy calling her merely tolerable and not handsome enough to tempt him",
          "The insult stung her pride though she later turned it into a private joke",
          "She retold the story to her friends with a sharp playful humor that hid her true hurt",
          "Bingley danced twice with Jane and the whole neighborhood began to notice",
          "Mrs Bennet could already picture a wedding and could barely contain her excitement",
        ],
      },
      {
        title: "Jane and Bingley",
        description: "A growing attachment, an illness, and Darcy's reluctant admiration",
        sentences: [
          "Jane and Bingley's mutual affection grew quickly over the following weeks",
          "They exchanged shy glances and gentle conversation at every gathering that followed",
          "Jane fell seriously ill while visiting Bingley's sisters and had to stay at Netherfield",
          "Elizabeth walked three miles through the mud to nurse her sister back to health",
          "Her muddy hem and windblown hair scandalized Bingley's elegant judgmental sisters",
          "Darcy found himself unexpectedly drawn to Elizabeth's intelligence and lively conversation",
          "He admired the warmth in her eyes even while telling himself he should not",
          "He fought against the attraction believing her family connections were far beneath him",
        ],
      },
      {
        title: "Mr Collins Proposes",
        description: "A ridiculous cousin, a refusal, and a friend's practical marriage",
        sentences: [
          "Mr Collins a pompous clergyman arrived planning to marry one of the Bennet sisters",
          "He spoke constantly and proudly about his wealthy patroness Lady Catherine de Bourgh",
          "He proposed to Elizabeth listing practical reasons rather than any real affection",
          "Elizabeth refused him firmly despite her mother's horror at losing a secure marriage",
          "Mrs Bennet begged and scolded but Elizabeth would not change her mind",
          "Elizabeth's close friend Charlotte Lucas accepted Mr Collins instead for financial security",
          "Charlotte admitted plainly that she wanted only a comfortable settled home not romance",
          "Elizabeth was privately disappointed that her friend would marry without any real love",
        ],
      },
      {
        title: "Darcy's Hidden Feelings",
        description: "Wickham's story, Elizabeth's growing dislike, and Darcy's private admiration",
        sentences: [
          "Elizabeth met the charming officer Wickham who told her a damaging story about Darcy",
          "He spoke softly and convincingly making himself sound like the wronged party",
          "Wickham claimed Darcy had cheated him out of an inheritance he was promised",
          "Elizabeth believed the story completely and her dislike of Darcy grew even stronger",
          "She began repeating his complaints to friends without pausing to question them",
          "Meanwhile Darcy admired Elizabeth more with every conversation despite his own resistance",
          "He watched her across crowded rooms though he rarely let himself approach her",
          "He tried to convince himself that her low connections made a match impossible",
        ],
      },
      {
        title: "The First Proposal",
        description: "A proud proposal, and a furious refusal",
        sentences: [
          "While visiting Charlotte Elizabeth was startled when Darcy suddenly proposed marriage to her",
          "He paced the small parlor nervously before finally speaking his feelings aloud",
          "His proposal was full of pride mentioning her inferior family as an obstacle he had overcome",
          "Elizabeth refused him angrily accusing him of ruining Jane's happiness and mistreating Wickham",
          "Her voice shook with anger though she stood perfectly straight and unafraid",
          "Darcy left shaken by accusations he had never expected to hear about himself",
          "Rain fell outside as he walked slowly away into the darkening evening",
          "Elizabeth's anger did not fade even after he walked away in silence",
        ],
      },
      {
        title: "The Letter",
        description: "Darcy explains himself, and Elizabeth's judgment begins to change",
        sentences: [
          "The next morning Darcy delivered a long letter explaining his side of both accusations",
          "Elizabeth's hands trembled slightly as she broke the seal and began to read",
          "He had separated Bingley from Jane only because he doubted her feelings were sincere",
          "Wickham he explained had actually tried to elope with Darcy's own young sister",
          "Elizabeth reread the letter many times and slowly realized her judgment had been wrong",
          "She sat alone on a quiet path replaying every conversation she had ever had with him",
          "She felt deep shame for trusting Wickham's charm over Darcy's honest character",
          "For the first time she wondered how badly her own pride had misled her",
        ],
      },
      {
        title: "Pemberley",
        description: "A visit to Darcy's estate reveals a different man entirely",
        sentences: [
          "Months later Elizabeth toured Derbyshire and visited Darcy's grand estate called Pemberley",
          "The grounds were beautiful with wide lawns a clear stream and old graceful trees",
          "The housekeeper praised Darcy warmly describing him as the kindest most generous master",
          "Elizabeth listened in quiet surprise unable to match this portrait with her old opinion",
          "Darcy arrived unexpectedly and treated Elizabeth with a new gentleness and respect",
          "He introduced her warmly to his shy young sister Georgiana without a trace of his old pride",
          "Elizabeth began to see a version of Darcy completely different from her first impression",
          "She started to wonder whether her early judgment of him had been badly mistaken",
        ],
      },
      {
        title: "Lydia's Scandal",
        description: "A family disgrace, and Darcy's quiet, generous rescue",
        sentences: [
          "News arrived that Elizabeth's youngest sister Lydia had run off with Wickham unmarried",
          "The family read the letter in stunned silence broken only by Mrs Bennet's cries",
          "The scandal threatened to ruin the reputation of the entire Bennet family",
          "Elizabeth feared that Darcy would now want nothing more to do with her family",
          "Darcy secretly tracked down the couple and paid Wickham to finally marry Lydia",
          "He settled Wickham's debts quietly and arranged the wedding without seeking any praise",
          "He asked everyone involved to keep his generous involvement completely a secret",
          "Elizabeth eventually learned the truth and was deeply moved by his quiet kindness",
        ],
      },
      {
        title: "A Second Proposal",
        description: "Two couples, and hearts that finally match",
        sentences: [
          "Bingley returned to the neighborhood and soon proposed happily to a joyful Jane",
          "The whole household filled with laughter and relief at the long awaited news",
          "Darcy visited again and Elizabeth found her feelings for him had completely changed",
          "They walked together along a quiet lane both too nervous to speak at first",
          "He asked once more whether her feelings toward him had changed at all",
          "Elizabeth confessed that her opinion of him had reversed entirely since his letter",
          "Both admitted that pride and hasty judgment had nearly cost them their happiness",
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
          "The bay sparkled below rows of grand houses built for the newly and enormously rich",
          "His mysterious neighbor was a wealthy man named Jay Gatsby that nobody truly knew",
          "Nick had grown up modestly and found himself surrounded by careless enormous wealth",
          "Bright lights and faint music drifted nightly from Gatsby's mansion across the lawn",
          "Across the bay lived his cousin Daisy and her arrogant husband Tom Buchanan",
          "Their white mansion overlooked the water with an easy confident elegance",
          "Nick soon realized this glittering world hid far more sadness than it first appeared",
        ],
      },
      {
        title: "The Mysterious Neighbor",
        description: "Wild rumors, endless parties, and a quiet host",
        sentences: [
          "Gatsby hosted enormous parties every weekend filled with strangers nobody had personally invited",
          "Cars lined the long driveway and lights blazed from every window until dawn",
          "Guests traded wild rumors claiming he was a spy a killer or a secret prince",
          "Champagne flowed all night while an orchestra played until the very early morning",
          "Laughter and music spilled out over the lawn and down toward the dark water",
          "Despite owning the mansion Gatsby rarely seemed to enjoy his own famous parties",
          "He often stood apart watching quietly instead of joining the noisy crowd himself",
          "His eyes seemed fixed on something far across the bay that only he could see",
        ],
      },
      {
        title: "Daisy and Tom",
        description: "An unhappy marriage across the bay",
        sentences: [
          "Nick visited his cousin Daisy who lived in a beautiful house with her husband Tom",
          "Daisy's voice was soft and musical yet carried a strange restless sadness",
          "Tom was physically powerful arrogant and openly unfaithful to his unhappy wife",
          "He spoke loudly about his own opinions and rarely let anyone finish a sentence",
          "A phone call interrupted dinner and everyone clearly knew it was Tom's mistress",
          "Daisy laughed lightly to cover her discomfort though her hands trembled slightly",
          "Daisy seemed bored and restless trapped inside a marriage that brought her little joy",
          "Nick left the visit uneasy sensing deep unhappiness hidden beneath their polished lifestyle",
        ],
      },
      {
        title: "An Invitation",
        description: "Nick finally meets the man behind the parties",
        sentences: [
          "Nick received a rare personal invitation to one of Gatsby's famous extravagant parties",
          "He wandered through crowded rooms full of strangers who barely knew their host",
          "He finally met his neighbor a charming man with a strange practiced smile",
          "Gatsby called everyone old sport and seemed eager yet oddly nervous around Nick",
          "His smile seemed to promise that he understood exactly how you wished to be seen",
          "Rumors about Gatsby's past continued swirling even as Nick got to know him",
          "Some guests claimed he had killed a man others said he was secretly royalty",
          "Nick began to suspect the parties existed for one very specific hidden purpose",
        ],
      },
      {
        title: "Gatsby's Request",
        description: "A confession of old love, and a favor Nick cannot refuse",
        sentences: [
          "Gatsby finally admitted he had once loved Daisy years before she married Tom",
          "He described their brief romance with a longing that had never once faded",
          "He had built his entire fortune and mansion hoping to eventually win her back",
          "Gatsby asked Nick to arrange a quiet reunion between himself and Daisy",
          "His usual confident charm briefly cracked revealing how nervous he truly was",
          "Nick agreed feeling swept into a romantic dream that felt both foolish and moving",
          "Gatsby prepared nervously rearranging flowers and clothes for the important meeting",
          "He paced his enormous house unable to sit still as the appointed hour approached",
        ],
      },
      {
        title: "Reunited",
        description: "Five years apart, and a dream within reach",
        sentences: [
          "Daisy and Gatsby met again for the first time in exactly five long years",
          "The reunion was awkward at first but soon warmed into genuine emotion",
          "Rain tapped softly against the windows as old feelings slowly returned",
          "Gatsby proudly showed Daisy his enormous mansion and his closets full of shirts",
          "He threw the colorful shirts across the bed simply to watch her reaction",
          "Daisy suddenly began crying overwhelmed by the beauty and effort behind it all",
          "She had never seen such beautiful things she whispered through her tears",
          "For a brief moment Gatsby's long impossible dream finally seemed within his reach",
        ],
      },
      {
        title: "The Truth About Gatsby",
        description: "A poor boy reinvented, all for the sake of one love",
        sentences: [
          "Nick eventually learned Gatsby's real name was James Gatz born into a poor family",
          "As a teenager he had quietly reinvented himself imagining a grander future for himself",
          "As a young man he had reinvented himself completely to chase wealth and status",
          "He earned his fortune through shady illegal business dealings that stayed carefully hidden",
          "He never spoke openly about these dealings even with people he trusted",
          "Everything Gatsby built existed for one single purpose winning Daisy's love again",
          "His mansion his parties and his fortune were all part of one long performance",
          "His entire glamorous identity was really just a devoted very fragile performance",
        ],
      },
      {
        title: "Confrontation in New York",
        description: "Tom exposes Gatsby, and Daisy hesitates between two men",
        sentences: [
          "Tom grew suspicious and confronted Gatsby directly about his feelings for Daisy",
          "Their argument grew heated inside a stifling hotel room on a blisteringly hot afternoon",
          "He exposed Gatsby's criminal business dealings in front of everyone at the hotel",
          "Gatsby insisted desperately that Daisy had never truly loved her own husband",
          "Daisy grew flustered and could not fully commit to leaving Tom for Gatsby",
          "She looked helplessly between the two men unable to choose either one fully",
          "Gatsby's confident image cracked as Daisy hesitated between the two rival men",
          "The tense afternoon ended with no clear winner and growing bitterness on the drive home",
        ],
      },
      {
        title: "Tragedy on the Road",
        description: "A fatal accident, and a lie of loyalty",
        sentences: [
          "Driving home Daisy accidentally struck and killed Tom's mistress Myrtle on the road",
          "The car did not even slow down as it vanished into the gathering darkness",
          "Gatsby loyally decided to take the blame to protect Daisy from any consequences",
          "He waited outside her house all night just to be sure she was safe",
          "Myrtle's grieving husband believed Gatsby's car had deliberately killed his wife",
          "Grief and rage consumed him until he could think of little else",
          "Tom quietly told the husband exactly where to find Gatsby's house that night",
          "Nick sensed the entire tragedy was about to end in something far worse",
        ],
      },
      {
        title: "The End of Gatsby",
        description: "A lonely death, and a story of empty wealth",
        sentences: [
          "Myrtle's husband arrived at Gatsby's mansion and shot him beside his own pool",
          "The water slowly turned red as the enormous house stood silent behind him",
          "Gatsby died still waiting hopefully for a phone call from Daisy that never came",
          "Almost none of his many party guests bothered attending his small quiet funeral",
          "Only Nick Gatsby's father and a handful of servants stood beside the grave",
          "Daisy and Tom quietly left town together leaving no address or explanation behind",
          "No flowers no letters and no word ever came from the woman he had loved so long",
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
          "Endless dunes stretched in every direction under a vast burning silent sky",
          "He was alone with barely enough water and no way to call for help",
          "At sunrise a strange small voice asked him politely to draw a sheep",
          "Startled the pilot looked up and saw a serious little boy standing before him",
          "The boy's golden hair caught the early light as he waited patiently for an answer",
          "The boy did not seem lost at all despite the endless empty sand around them",
          "Curious the pilot set aside his broken engine and reached for a pencil",
        ],
      },
      {
        title: "A Drawing of a Sheep",
        description: "A box, a hidden sheep, and a childhood memory",
        sentences: [
          "The pilot tried several drawings of sheep but the boy rejected every single one",
          "One looked too sickly another too old and one had horns like a ram",
          "Frustrated the pilot drew a simple box and said the sheep was hidden inside",
          "The boy smiled brightly and declared that this drawing was exactly what he wanted",
          "He peered through the tiny drawn windows as if truly checking on his sheep",
          "The pilot recalled as a child drawing a snake that had swallowed an elephant",
          "Every adult he had shown it to only ever saw a plain ordinary hat",
          "He had given up drawing entirely believing grown ups never truly understood anything",
        ],
      },
      {
        title: "The Prince's Tiny Planet",
        description: "Baobabs, volcanoes, and forty-four sunsets",
        sentences: [
          "The boy explained he came from a planet so small it was barely a house",
          "It was called Asteroid B 612 though few people had ever taken it seriously",
          "He carefully pulled up baobab sprouts every day before their roots could split his planet",
          "Left unchecked the growing roots could crack his tiny world completely apart",
          "His tiny world had two small volcanoes he used gently for cooking each morning",
          "He swept them out carefully each week the same way one sweeps a chimney",
          "He loved watching the sunset and once watched it forty four times in one day",
          "The pilot slowly realized this strange visitor truly was a prince from another world",
        ],
      },
      {
        title: "The Rose",
        description: "A proud flower, and the reason he left home",
        sentences: [
          "On his planet grew one single proud and rather demanding rose he deeply loved",
          "She had appeared suddenly from a seed and bloomed with astonishing careful beauty",
          "The rose boasted about her beauty and often exaggerated small imaginary complaints",
          "She coughed dramatically and claimed drafts and tigers were a constant danger to her",
          "The prince cared for her patiently even when her pride frustrated him constantly",
          "He watered her sheltered her from wind and admired her more than he ever said aloud",
          "Hurt by one especially cruel comment he eventually decided to leave his planet",
          "He later realized he still loved her deeply despite her difficult prideful nature",
        ],
      },
      {
        title: "The King",
        description: "A ruler with no subjects at all",
        sentences: [
          "Traveling between planets the prince visited a king who ruled over absolutely no one",
          "His entire kingdom was one tiny planet with barely enough room for his throne",
          "The king insisted every single thing in the universe obeyed his royal commands",
          "He proudly claimed authority even over the stars the sun and the endless sky",
          "He cleverly only ever ordered things that were already certain to happen anyway",
          "In this way he never once had to admit his royal orders could ever fail",
          "The prince found the king's empty lonely authority both strange and rather sad",
          "He quickly left concluding that grown ups were truly very peculiar indeed",
        ],
      },
      {
        title: "The Vain Man and the Drunkard",
        description: "Two small, sad planets",
        sentences: [
          "The next planet held a vain man who wanted only constant praise and admiration",
          "He wore a fine hat purely so he could tip it whenever anyone applauded him",
          "He asked the prince to clap simply so he could tip his hat proudly",
          "The prince clapped politely though he could not understand what the man truly wanted",
          "Another planet held a drunkard who drank purely to forget the shame of drinking",
          "Round and round his sad little reasoning went with no way out at all",
          "The prince found both grown ups sad and utterly confusing in their small habits",
          "He continued his journey more puzzled than ever by the strange adult world",
        ],
      },
      {
        title: "The Businessman and the Lamplighter",
        description: "Counting stars, and one small planet of faithful duty",
        sentences: [
          "A businessman spent every waking moment counting stars he claimed personally to own",
          "He wrote each number carefully on paper and locked the paper inside a drawer",
          "The prince questioned what practical use owning distant stars could possibly serve",
          "The businessman only replied that owning them made him important and very rich",
          "On a tiny planet a lamplighter lit and extinguished his lamp every single minute",
          "His planet spun so quickly that day and night arrived within moments of each other",
          "Of every grown up he had met the prince respected the lamplighter's loyalty most",
          "The lamplighter at least worked faithfully for something beyond only himself",
        ],
      },
      {
        title: "Arriving on Earth",
        description: "A snake, a garden of roses, and a heartbreak",
        sentences: [
          "The prince finally landed alone on the vast and unfamiliar desert of planet Earth",
          "He expected to meet people immediately but found only silent empty sand",
          "A yellow snake spoke to him and hinted quietly it could send him home",
          "Its voice was calm and riddling like something older than the desert itself",
          "Wandering further he discovered an entire garden full of roses just like his own",
          "Five thousand identical flowers bloomed there without a single one being unique",
          "He felt suddenly heartbroken believing his beloved rose was never truly unique after all",
          "Just then a quiet clever fox appeared and offered him some unexpected wisdom",
        ],
      },
      {
        title: "The Fox's Secret",
        description: "Taming, and what is truly essential",
        sentences: [
          "The fox asked the prince to gently tame him by visiting at the very same hour daily",
          "He explained that taming meant slowly creating real invisible ties between two hearts",
          "Through patience and routine the fox explained a real invisible bond slowly forms",
          "Each day the fox grew a little more excited as the familiar hour drew near",
          "Once tamed the fox explained the color of wheat fields would always remind him of the prince",
          "The wind in golden wheat he said would forever sound like the prince's own laughter",
          "The fox shared his secret that what is truly essential is invisible to the eye",
          "The prince finally understood that his rose was unique simply because he had loved her",
        ],
      },
      {
        title: "Returning Home",
        description: "A final goodbye, and a promise kept among the stars",
        sentences: [
          "The pilot finally repaired his plane after many days stranded together in the desert",
          "Water grew dangerously low as their small shared adventure neared its final end",
          "The prince explained sadly that his body was too heavy to carry back to his star",
          "He promised gently that he would seem to laugh among the stars every single night",
          "He let the yellow snake bite him gently so his spirit alone could return home",
          "He fell without a sound as softly as a tree falling slowly in the sand",
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
          "Every wall seemed to carry the same enormous eyes and the same three grim slogans",
          "Telescreens in every room monitored citizens day and night with no real privacy",
          "Even in his own apartment Winston could never be fully certain he was alone",
          "The ruling Party controlled nearly every part of daily life speech and thought itself",
          "Even a suspicious facial expression alone could be reported as a serious thoughtcrime",
          "Neighbors watched neighbors and children were taught to report their own parents",
          "Winston quietly hated the Party though he had learned never to show it",
        ],
      },
      {
        title: "The Ministry of Truth",
        description: "Rewriting history to fit whatever the Party now says",
        sentences: [
          "Winston worked at the Ministry of Truth rewriting old newspapers to fit new lies",
          "Each day brought a fresh stack of documents that needed quiet careful correction",
          "Whenever the Party changed its story the past was quietly rewritten to match it",
          "An enemy of yesterday could become a hero of today with a single edited sentence",
          "Historical facts figures and famous names vanished the moment they became inconvenient",
          "Entire people seemed to disappear from history as if they had never existed",
          "Winston understood the disturbing party slogan that whoever controls the past controls the future",
          "Secretly this constant rewriting of truth filled him with quiet growing anger",
        ],
      },
      {
        title: "A Forbidden Diary",
        description: "A dangerous notebook, and a small act of honesty",
        sentences: [
          "Winston bought a small forbidden notebook to secretly record his private true thoughts",
          "He hid it carefully in a small alcove just out of a telescreen's watching reach",
          "Writing anything personal at all was considered a serious extremely dangerous crime",
          "His hand trembled the first time he pressed pen to the blank waiting page",
          "He wrote the words down with Big Brother trembling with fear as he did",
          "Once written the words felt impossible to take back or ever fully erase",
          "Just owning the diary alone could eventually lead to his arrest or worse",
          "Still he felt a small fragile sense of freedom in finally being honest",
        ],
      },
      {
        title: "Julia",
        description: "A secret note, and a forbidden romance",
        sentences: [
          "A young woman named Julia secretly slipped Winston a note reading I love you",
          "His heart pounded as he read the message hidden inside his closed fist",
          "They began meeting in hidden quiet corners away from any telescreen's watching eye",
          "A crowded market a quiet church ruin a rented room all became careful hiding places",
          "Julia rebelled against the Party in her own quiet defiant physical way",
          "She seemed unafraid in a way Winston had almost forgotten was even possible",
          "Their forbidden romance felt like a small dangerous act of true human freedom",
          "Winston felt more alive with Julia than he had in many long gray years",
        ],
      },
      {
        title: "A Secret Room",
        description: "A hidden hideaway, and a fragile hope",
        sentences: [
          "Winston rented a small room above an old shop that seemed to have no telescreen",
          "Faded furniture and a ticking clock made the room feel oddly gentle and old fashioned",
          "He and Julia met there secretly believing they had finally found true privacy",
          "For a while they lived almost normally sharing food conversation and real affection",
          "They spoke openly of small ordinary things they could never mention anywhere else",
          "Winston began to hope quietly that resistance against the Party was truly possible",
          "He imagined a distant future where such fear no longer ruled every single thought",
          "Neither of them yet realized their secret hideaway was not nearly as safe as it seemed",
        ],
      },
      {
        title: "O'Brien's Trap",
        description: "A trusted official, and a forbidden book",
        sentences: [
          "A Party official named O'Brien hinted he secretly belonged to a resistance group",
          "His calm confident manner made Winston trust him almost immediately and completely",
          "Winston and Julia visited him hoping to join the mysterious group called the Brotherhood",
          "O'Brien asked whether they were willing to commit any act at all against the Party",
          "They answered yes to every terrible question without a single moment of hesitation",
          "He gave Winston a forbidden book explaining the Party's true hidden methods and goals",
          "Winston hid the heavy dangerous book carefully beneath his coat as he left",
          "Winston trusted O'Brien completely never suspecting this trust was itself a careful trap",
        ],
      },
      {
        title: "The Book",
        description: "Understanding the machine that controls him",
        sentences: [
          "The forbidden book explained the Party sought power for its own endless sake alone",
          "Unlike past tyrannies it wanted no comfort or progress only total lasting control",
          "It explained how constant war controlled and distracted the exhausted worn down population",
          "Enemies changed overnight yet the war itself somehow always quietly continued",
          "Winston read late into the night finally understanding the full machinery of his oppression",
          "Each new page seemed to explain some fear he had carried without ever naming it",
          "Julia fell asleep while he kept reading hungry for the truth he had always sensed",
          "For a brief moment understanding the system felt like its own quiet form of power",
        ],
      },
      {
        title: "Betrayal",
        description: "The Thought Police arrive",
        sentences: [
          "Suddenly armed Thought Police broke into their secret hidden room without warning",
          "A voice from behind an old painting calmly announced that they were now the dead",
          "Mr Charrington the shopkeeper revealed himself as a Thought Police agent all along",
          "His kindly landlord's face hardened instantly into something cold and official",
          "Winston realized with horror that O'Brien too had never truly been on their side",
          "Every hopeful word O'Brien had spoken had simply been part of the trap",
          "Winston and Julia were violently dragged away separately toward the terrifying Ministry of Love",
          "Everything they had secretly built together collapsed within only a few terrifying minutes",
        ],
      },
      {
        title: "Room 101",
        description: "A worst fear, and a final betrayal",
        sentences: [
          "At the Ministry of Love O'Brien personally oversaw Winston's long brutal interrogation",
          "Pain exhaustion and endless questioning slowly wore down Winston's last resistance",
          "He explained the Party wanted total belief not simply forced silent obedience",
          "Two plus two must truly feel like five he said not merely be repeated aloud",
          "Winston was finally threatened with Room 101 containing his own personal worst fear",
          "A cage of rats moved slowly closer while Winston's courage completely collapsed",
          "Facing that unbearable fear directly Winston finally broke and betrayed Julia completely",
          "He begged desperately for the punishment to fall on her instead of himself",
        ],
      },
      {
        title: "Victory Over Himself",
        description: "A hollow ending, and a defeated mind",
        sentences: [
          "Released back into society Winston felt hollow and completely emotionally changed",
          "He drifted through his days with no real feeling left for anything at all",
          "He met Julia briefly again and both coldly admitted they had betrayed each other",
          "Neither one could quite remember why they had once cared so deeply",
          "Winston now spent his empty days quietly drinking at a nearly deserted cafe",
          "The old gin numbed the last faint traces of feeling he had left",
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
          "Long dusty streets and old porches gave the whole town a slow unhurried rhythm",
          "Their father Atticus was a thoughtful respected lawyer who raised them mostly alone",
          "He answered even their strangest questions calmly and always completely honestly",
          "Long hot summers were filled with imaginative games and endless childhood curiosity",
          "Their friend Dill visited every summer bringing wild stories and even wilder ideas",
          "Atticus taught his children to treat every single person with patience and fairness",
          "Scout often got into trouble for her stubborn strong willed and honest personality",
        ],
      },
      {
        title: "Boo Radley",
        description: "A mysterious neighbor, and childhood dares",
        sentences: [
          "Nearby lived a mysterious neighbor named Boo Radley who never left his house",
          "His shuttered windows and silent yard fascinated and frightened the neighborhood children",
          "Wild rumors claimed Boo was dangerous violent and possibly not entirely human",
          "Some children swore he ate raw squirrels and prowled the yard alone at night",
          "Scout Jem and their friend Dill dared each other to approach his spooky house",
          "They crept closer at night hearts pounding at every creak of the old fence",
          "Small strange gifts began mysteriously appearing inside a hollow tree near his yard",
          "The children slowly grew curious about the quiet man hidden behind the rumors",
        ],
      },
      {
        title: "Atticus Takes a Case",
        description: "A false accusation, and a father's difficult choice",
        sentences: [
          "Atticus agreed to defend Tom Robinson a Black man falsely accused of a serious crime",
          "Few lawyers in town would have taken such a case so openly or so seriously",
          "Tom was accused of assaulting a young white woman named Mayella Ewell",
          "The accusation alone was enough to convince most of Maycomb before any trial began",
          "Atticus believed deeply that every person deserved a fair and honest defense",
          "He explained patiently to Scout that real courage meant doing right despite the cost",
          "He knew clearly that defending Tom would bring real anger from their town",
          "Scout and Jem soon felt that same anger directed painfully toward their own family",
        ],
      },
      {
        title: "Town Reaction",
        description: "Hostility at school, and a tense night at the jail",
        sentences: [
          "Classmates taunted Scout at school for having a father who defended a Black man",
          "She clenched her fists more than once but remembered her father's quiet advice",
          "A hostile crowd once gathered outside the jail threatening to harm Tom Robinson",
          "Atticus sat alone reading calmly on the jailhouse steps waiting for whatever might come",
          "Scout unknowingly diffused the tense crowd by innocently talking to a familiar neighbor",
          "Her small ordinary questions reminded the angry men of their own quiet decency",
          "Atticus remained calm and dignified despite the mounting pressure from angry neighbors",
          "The children slowly began to understand the real courage behind their father's quiet choice",
        ],
      },
      {
        title: "The Trial Begins",
        description: "A crowded courtroom, and conflicting testimony",
        sentences: [
          "The whole town crowded into the courthouse eager to watch the dramatic trial",
          "Families packed picnics and waited outside as if for a fair rather than a trial",
          "Mayella Ewell testified nervously offering a story that did not fully add up",
          "Her eyes darted anxiously toward her father seated watchful in the crowded room",
          "Her father Bob Ewell testified with obvious anger and clear open hostility",
          "His crude language and sneering manner unsettled even some of his own neighbors",
          "Scout and Jem watched secretly from the balcony reserved for Black townspeople",
          "The tense courtroom grew quiet as Atticus rose calmly to begin his defense",
        ],
      },
      {
        title: "Atticus's Defense",
        description: "Careful evidence, and an argument about prejudice",
        sentences: [
          "Atticus proved clearly that Tom's supposedly injured arm was permanently and completely disabled",
          "He asked Tom simply to raise both arms so the whole courtroom could plainly see",
          "He showed Mayella's injuries matched someone who led mostly with their strong left hand",
          "Bob Ewell it was gently but firmly implied was himself left handed",
          "Tom testified honestly explaining he had only ever tried to kindly help Mayella",
          "His quiet respectful answers contrasted sharply with the ugly accusations against him",
          "Atticus argued passionately that prejudice alone was clearly driving this unjust accusation",
          "He reminded the jury softly that in a courtroom every man is truly equal",
        ],
      },
      {
        title: "An Unjust Verdict",
        description: "A guilty verdict, despite the evidence",
        sentences: [
          "Despite clear compelling evidence the all white jury still found Tom guilty",
          "The word guilty landed on the silent courtroom like a physical blow",
          "Scout and Jem were shattered watching such obvious injustice happen right before them",
          "Jem could not understand how such clear proof had changed nothing at all",
          "The Black community in the balcony rose silently and respectfully as Atticus left",
          "Their quiet standing tribute meant more to Scout than any words could have",
          "Atticus remained hopeful about pursuing a formal legal appeal for Tom's case",
          "The unjust verdict permanently changed how Scout viewed fairness within her own town",
        ],
      },
      {
        title: "Tragedy for Tom",
        description: "A desperate escape, and a senseless death",
        sentences: [
          "While awaiting his appeal Tom attempted a desperate escape from the prison yard",
          "He had lost hope that any court would ever truly treat him fairly",
          "Guards shot and killed him during the attempt to escape before any appeal could happen",
          "The news reached Maycomb quietly and spread from porch to porch like a slow chill",
          "Atticus delivered the tragic news gently to Tom's grieving devastated family",
          "He sat with them quietly offering what small comfort words alone could give",
          "The senseless death deeply shook both the wider town and Atticus's own two children",
          "Scout began to fully understand the terrible real cost of prejudice around her",
        ],
      },
      {
        title: "Bob Ewell's Revenge",
        description: "A dark night, and an unexpected rescuer",
        sentences: [
          "Humiliated by the trial Bob Ewell grew bitter and quietly plotted his revenge",
          "He muttered threats around town that most neighbors chose simply to ignore",
          "One dark night he attacked Scout and Jem as they walked home alone",
          "The dark path suddenly filled with heavy footsteps and Scout's own frightened heartbeat",
          "Jem's arm was badly broken during the sudden terrifying struggle in the darkness",
          "Scout trapped inside her stiff ham costume could barely see or move at all",
          "A mysterious stranger suddenly appeared and fought Ewell fiercely off in the dark",
          "Scout realized with shock that their rescuer was the reclusive neighbor Boo Radley",
        ],
      },
      {
        title: "Boo Radley's Rescue",
        description: "A quiet meeting, and a lesson in compassion",
        sentences: [
          "Boo Radley had quietly carried the injured Jem safely back home himself that very night",
          "He stood pale and silent in the corner of Jem's room clearly unused to company",
          "Scout finally met her mysterious neighbor gently guiding him shyly back to his own porch",
          "His hand felt thin and gentle as she walked him carefully home in the dark",
          "Standing on his porch she saw the whole neighborhood exactly as Boo always had",
          "From there the whole street looked smaller quieter and strangely full of memory",
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
          "He slept beneath old trees and woke each morning to the same wide open sky",
          "He kept having the same recurring dream about treasure hidden near the Egyptian pyramids",
          "The dream returned again and again each time feeling more vivid than before",
          "An old gypsy woman told him the dream was a sign he must follow",
          "She asked only a small coin for advice that felt strangely far more valuable",
          "Santiago hesitated at first unsure whether to trust a dream over his simple comfortable life",
          "Still something deep inside him quietly urged him toward this unexpected new journey",
        ],
      },
      {
        title: "The Old King",
        description: "A Personal Legend, and two small stones",
        sentences: [
          "A mysterious old man named Melchizedek soon appeared and called himself a king",
          "His eyes seemed to know things about Santiago that Santiago had never spoken aloud",
          "He spoke of something he called each person's own unique Personal Legend",
          "Everyone he said secretly knows their own dream but few ever dare to follow it",
          "He explained that pursuing a true dream was every person's deepest real purpose",
          "He gave Santiago two small stones named Urim and Thummim to guide difficult decisions",
          "They were only for moments he warned when the path ahead felt truly unclear",
          "Inspired Santiago sold his sheep and set off toward Africa the very next day",
        ],
      },
      {
        title: "Robbed in Tangier",
        description: "A theft, and an unexpected job",
        sentences: [
          "In the unfamiliar city of Tangier a stranger quickly stole every coin Santiago owned",
          "The crowded market swallowed the thief before Santiago even understood what had happened",
          "Alone frightened and penniless he wondered if the whole journey had been a mistake",
          "For a moment he considered giving up and simply finding his way back home",
          "He found work instead at a small struggling local crystal shop nearby",
          "Dust covered shelves and a slow trickle of customers told their own quiet story",
          "The shop's tired owner had long ago given up on his own personal dreams",
          "He spoke of Mecca often but always found a reason never actually to go",
        ],
      },
      {
        title: "The Crystal Shop",
        description: "A year of patience, and a choice to keep going",
        sentences: [
          "Over one full year Santiago worked hard and carefully saved his modest earnings",
          "He learned patience discipline and the quiet true value of honest daily effort",
          "Santiago suggested small clever improvements that slowly brought new customers to the shop",
          "A simple display near the road doubled their sales within only a few weeks",
          "Eventually he had saved enough money to buy sheep and return safely home",
          "For one evening he genuinely believed his adventure could end there and be enough",
          "Yet he realized the pyramids and his treasure still quietly called him onward",
          "He chose the uncertain dream instead of the safe comfortable option before him",
        ],
      },
      {
        title: "Joining the Caravan",
        description: "Crossing the desert, and learning to read its signs",
        sentences: [
          "Santiago joined a large trading caravan crossing the vast dangerous Sahara Desert",
          "Camels swayed slowly beneath an endless sky of blinding heat and silence",
          "There he met a curious Englishman traveling to study the secrets of true alchemy",
          "He carried heavy books and asked Santiago endless questions about the desert's signs",
          "The Englishman carried many books but strangely little practical desert experience",
          "Santiago began noticing that the desert itself constantly spoke through small quiet signs",
          "Wind sand and the flight of birds all seemed to carry a quiet hidden message",
          "He slowly learned to read wind sand and stars as the Englishman read his books",
        ],
      },
      {
        title: "The Oasis and Fatima",
        description: "A sudden love, and a warning that saves lives",
        sentences: [
          "The caravan stopped safely at a peaceful oasis while tribal wars raged nearby",
          "Palm trees and cool water felt like a small miracle after weeks of endless sand",
          "There Santiago instantly fell in love with a young woman named Fatima",
          "Her dark eyes seemed to hold the same quiet certainty as the desert itself",
          "She encouraged him gently to continue pursuing his treasure rather than staying only for her",
          "Real love she told him would never ask him to abandon his own true path",
          "Watching two fighting hawks Santiago suddenly sensed a coming surprise attack",
          "His warning saved the oasis and earned him the elders' great respect and trust",
        ],
      },
      {
        title: "The Alchemist",
        description: "A guide, and the Soul of the World",
        sentences: [
          "Because of his warning Santiago finally met a real mysterious desert alchemist",
          "Dressed in black and carrying no visible supplies he seemed to need nothing at all",
          "The alchemist agreed to guide him personally the rest of the way toward the pyramids",
          "He tested Santiago constantly with riddles silence and small unexpected demands",
          "He taught Santiago that all things share one single connected Soul of the World",
          "A grain of sand he said carries within it the memory of all creation",
          "Listening carefully to his own heart he explained was the truest form of real wisdom",
          "Under his patient guidance Santiago's courage and quiet understanding grew stronger daily",
        ],
      },
      {
        title: "Tested by the Desert Tribes",
        description: "A capture, and a test of true belief",
        sentences: [
          "Suspicious desert tribesmen captured both Santiago and the alchemist as they traveled",
          "Rifles and hard suspicious eyes surrounded them beneath the darkening evening sky",
          "To prove his worth Santiago was challenged to transform himself into the wind",
          "The tribal chief watched closely arms crossed clearly expecting him to fail completely",
          "Terrified at first he closed his eyes and spoke quietly and directly to the desert",
          "He asked the wind the sun and the sky themselves for their patient help",
          "Focusing completely he successfully summoned a powerful sudden sandstorm around himself",
          "Deeply impressed the tribesmen respectfully released both travelers to continue their journey",
        ],
      },
      {
        title: "Reaching the Pyramids",
        description: "A beating, and an unexpected revelation",
        sentences: [
          "Santiago finally reached the towering ancient pyramids he had dreamed about for so long",
          "Moonlight spilled silver across the endless dunes stretching out before him",
          "While digging hopefully for treasure he was suddenly attacked and badly beaten by thieves",
          "They left him bruised breathless and empty handed beside his own unfinished hole",
          "One thief mockingly described his own recurring dream about treasure buried elsewhere entirely",
          "He laughed describing an old ruined church and a sycamore tree far across the sea",
          "The thief's dream pointed unknowingly back toward Santiago's own original starting point",
          "Santiago realized with quiet astonishment that his treasure had been near home all along",
        ],
      },
      {
        title: "Returning Home",
        description: "A treasure found, and a journey's true meaning",
        sentences: [
          "Santiago journeyed all the way back to the very same field where he once slept",
          "The old church ruins stood exactly as he remembered beneath the same wide sky",
          "Digging beneath an old sycamore tree he finally discovered a real hidden treasure chest",
          "Gold coins and jewels caught the early morning light as he lifted the heavy lid",
          "He understood at last that the journey itself had truly shaped and changed him completely",
          "The treasure alone he realized could never have meant as much without the long road behind it",
          "The treasure represented both real material wealth and the deeper wisdom Santiago had gained",
          "The Alchemist ends with Santiago finally ready to return once more to find Fatima",
        ],
      },
    ],
  },
  {
    id: "book-novel-frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    description:
      "An original SentenceStep summary of Mary Shelley's story of Victor Frankenstein's forbidden creation and the lonely creature he could never truly escape — a personal retelling, not the original text.",
    difficultyLevel: 2,
    order: 6,
    isFeatured: false,
    sections: [
      {
        title: "Victor's Obsession",
        description: "A brilliant student's dangerous fascination with the secret of life",
        sentences: [
          "Victor Frankenstein grew up in Geneva fascinated by science and the mysteries of life itself",
          "He left home for university burning with ambition to uncover nature's deepest hidden secrets",
          "Alone in his small apartment he studied anatomy chemistry and the fragile boundary between life and death",
          "Days and nights blurred together as his single obsessive goal consumed him completely",
          "He became convinced he could discover the secret spark that gives lifeless matter breath",
          "Slowly and secretly he began collecting materials for an experiment no one else would dare attempt",
          "His professors and friends noticed his growing exhaustion but he brushed off every gentle warning",
          "Victor pressed on alone believing he stood at the edge of humanity's greatest discovery",
        ],
      },
      {
        title: "The Creation",
        description: "A stormy night, and the spark of life",
        sentences: [
          "Victor assembled a large human form piece by piece working through long isolated nights",
          "He chose each part carefully hoping their combined size and strength would make his creation flawless",
          "Lightning flashed outside his laboratory window on the night he finally attempted the spark of life",
          "His instruments hummed and crackled as electricity surged through the still enormous body",
          "Suddenly its yellow eyes opened and its chest rose with one long ragged breath",
          "The creature stirred clumsily reaching toward its creator with an innocent trembling hand",
          "Instead of triumph Victor felt only sudden overwhelming horror at what he had truly made",
          "He stared at the twitching creature realizing beauty had somehow become something monstrous",
        ],
      },
      {
        title: "Abandonment",
        description: "A creator's flight, and a creature left utterly alone",
        sentences: [
          "Unable to bear the sight of his creation Victor fled the laboratory in blind panic",
          "He wandered the streets all night trying desperately to outrun what he had just done",
          "When he finally returned home the creature had already vanished without a single trace",
          "Victor told no one the truth burying his terrible secret deep within himself",
          "He fell seriously ill for weeks tormented by guilt fever and constant nightmares",
          "Meanwhile the abandoned creature wandered alone confused frightened and completely friendless",
          "Villagers who saw him screamed and drove him away with stones and burning torches",
          "The creature slowly learned that his very appearance alone was enough to inspire only hatred",
        ],
      },
      {
        title: "The Creature Learns",
        description: "Watching a family in secret, and a hope for acceptance",
        sentences: [
          "Hiding near a small isolated cottage the creature secretly observed a poor kind family",
          "Watching through a crack in the wall he slowly learned their language day after day",
          "He admired their gentle affection for one another and quietly longed for that same connection",
          "Secretly he gathered firewood for them at night wanting desperately to earn their trust",
          "He read books left nearby learning not just words but ideas of loss and belonging",
          "One day he finally gathered his courage and gently approached the family's blind old father",
          "Just as they began to speak kindly the other family members returned and saw his face",
          "They screamed in terror and drove him violently away exactly like everyone else before",
        ],
      },
      {
        title: "A Request for a Companion",
        description: "A confrontation in the mountains, and a demand",
        sentences: [
          "Heartbroken and enraged the creature tracked Victor down high in the icy mountains",
          "He confronted his creator demanding to finally be heard after so much cruel suffering",
          "He described his loneliness his rejection and his desperate hunger for simple companionship",
          "He argued that Victor bore full responsibility for the misery of his own abandoned creation",
          "The creature demanded that Victor create one single companion just as lonely as himself",
          "He promised that with a companion he would vanish forever into some distant wilderness",
          "Moved despite himself by the creature's raw pain Victor reluctantly agreed to try",
          "He returned home troubled already dreading the terrible task now waiting before him",
        ],
      },
      {
        title: "Victor's Refusal",
        description: "A broken promise, and a vow of revenge",
        sentences: [
          "Victor traveled to a remote cottage and secretly began building a second living creature",
          "Doubt crept in steadily as he imagined an entire new race of powerful monstrous beings",
          "Fear of what such creatures might someday do overwhelmed his earlier reluctant promise",
          "One dark night Victor destroyed the unfinished companion right before the creature's own eyes",
          "The creature watched in disbelief as his one hope for companionship was torn apart",
          "His grief twisted instantly into a cold and terrible vow of complete revenge",
          "He swore that Victor would suffer just as deeply as he himself had suffered",
          "Victor barely registered the creature's chilling warning before he vanished into the night",
        ],
      },
      {
        title: "The Creature's Revenge",
        description: "A murdered friend, and a wedding night tragedy",
        sentences: [
          "Soon after Victor's dear friend Henry Clerval was found murdered under mysterious circumstances",
          "Victor immediately suspected the creature though no one else would ever believe his story",
          "Grief stricken and exhausted he finally married his beloved Elizabeth hoping for some peace",
          "On their wedding night Victor searched every room certain danger was somehow near",
          "He stepped outside for a moment and heard a single terrible scream from their bedroom",
          "Rushing back he found Elizabeth lifeless with the creature's monstrous shape fleeing the window",
          "Overwhelming grief and rage replaced whatever peace Victor had briefly allowed himself to feel",
          "He resolved then and there to hunt the creature to the very ends of the earth",
        ],
      },
      {
        title: "Grief and Pursuit",
        description: "A father's death, and a chase across the world",
        sentences: [
          "Victor's own father soon died brokenhearted from the family's endless string of tragedies",
          "Alone now with nothing left to lose Victor devoted every remaining ounce of himself to revenge",
          "He tracked the creature's trail across countries surviving on rage rather than any real hope",
          "The creature always stayed just out of reach leaving taunting notes carved into trees and stone",
          "Villagers along the way spoke fearfully of a huge swift figure moving through the night",
          "Victor's health steadily crumbled but his obsessive pursuit only ever grew stronger",
          "Eventually the trail led him into the vast frozen wastes of the endless Arctic north",
          "There by chance a passing ship's captain named Walton finally pulled him from the ice",
        ],
      },
      {
        title: "The Arctic Chase",
        description: "A dying man's confession, aboard a ship trapped in ice",
        sentences: [
          "Captain Walton nursed the exhausted dying Victor aboard his ship trapped deep in the ice",
          "Victor told his entire strange tragic story to Walton over many long freezing nights",
          "He warned Walton urgently against chasing forbidden knowledge as recklessly as he once had",
          "Walton listened with growing horror and quiet sympathy for the broken man before him",
          "Victor's health continued failing rapidly despite the crew's every desperate careful effort",
          "He spoke of the creature constantly certain it was still somewhere out there watching",
          "Even now consumed by fever Victor swore he would finish his terrible hunt if he could",
          "Walton promised solemnly to record every word of Victor's extraordinary confession faithfully",
        ],
      },
      {
        title: "Victor's Death and the Creature's Farewell",
        description: "A final death, and a creature's own quiet ending",
        sentences: [
          "Despite everyone's best efforts Victor finally died quietly aboard the frozen trapped ship",
          "Walton grieved a man he had known for only the briefest and strangest of times",
          "That very night Walton discovered the creature grieving silently over Victor's still body",
          "The creature spoke of his own endless suffering and his complicated twisted love for his creator",
          "He explained that revenge had brought him no true peace only deeper hollow emptiness",
          "Walton listened in stunned silence unable to fully hate the sorrowful trembling figure",
          "The creature declared he would now finally end his own long tortured existence completely",
          "He vanished alone across the ice never to be seen again by anyone at all",
        ],
      },
    ],
  },
  {
    id: "book-novel-old-man-sea",
    title: "The Old Man and the Sea",
    author: "Ernest Hemingway",
    description:
      "An original SentenceStep summary of Ernest Hemingway's story of Santiago, an old fisherman locked in a three-day battle with the greatest catch of his life — a personal retelling, not the original text.",
    difficultyLevel: 1,
    order: 7,
    isFeatured: false,
    sections: [
      {
        title: "Santiago the Old Fisherman",
        description: "An unlucky streak, and a devoted young friend",
        sentences: [
          "Santiago was an old fisherman who had gone eighty four days without catching a single real fish",
          "His sail was patched so many times it looked like a flag of complete defeat",
          "Villagers openly called him unlucky though he never once let their words truly wound him",
          "A young boy named Manolin had fished with him since childhood and loved him deeply",
          "Manolin's parents had forbidden the boy from joining Santiago's unlucky little skiff any longer",
          "Still the boy visited every evening bringing food and helping mend the old man's gear",
          "Santiago spoke often and warmly of baseball especially the great player Joe DiMaggio",
          "Despite his poverty and age Santiago's confidence in his own skill never truly faded",
        ],
      },
      {
        title: "Setting Out Alone",
        description: "Before dawn, rowing farther than anyone else dares",
        sentences: [
          "Long before sunrise Santiago quietly rowed his small skiff far out into the dark gulf",
          "He passed the other fishing boats determined to try his luck farther out than anyone else",
          "The stars still hung overhead as gentle waves rocked his tiny wooden boat steadily onward",
          "He baited his lines carefully setting them at different careful depths beneath the surface",
          "Birds and drifting seaweed told him quietly where the larger fish might be hiding",
          "He spoke softly to himself and to the sea the way an old friend speaks to another",
          "By midmorning he had drifted farther from shore than he had gone in many long months",
          "Something deep in his tired old bones told him today would finally be different",
        ],
      },
      {
        title: "The Marlin Bites",
        description: "A sudden pull, and the fight of a lifetime begins",
        sentences: [
          "Suddenly one of his lines pulled taut with a force unlike anything he had felt in years",
          "Santiago's heart raced as he realized the size of the creature far below his boat",
          "He held the line firmly letting it run gently through his calloused weathered hands",
          "The great fish pulled his entire skiff steadily farther out into the open endless sea",
          "Santiago braced his body against the wood determined not to lose this one chance",
          "He talked to the unseen fish calling it brother and admiring its incredible hidden strength",
          "Hours passed as the marlin swam steadily onward pulling the small boat behind it",
          "Santiago realized with growing awe that this might be the largest fish of his entire life",
        ],
      },
      {
        title: "Two Days at Sea",
        description: "Raw hands, aching muscles, and a stubborn refusal to quit",
        sentences: [
          "The struggle stretched through an entire day and then deep into a second long night",
          "Santiago's hands grew raw and bleeding from the constant unrelenting pressure of the line",
          "He rationed his small store of water and fish carefully unsure exactly how long this would last",
          "Exhaustion pulled at him constantly yet he refused to let himself sleep for more than moments",
          "He respected the marlin deeply seeing in it a strength and dignity matching his own",
          "Cramps seized his hands painfully but he forced himself to keep working through the pain",
          "He spoke aloud often reminding himself firmly that a man is never truly defeated by pain",
          "The line never slackened and neither man nor fish showed even the smallest sign of surrender",
        ],
      },
      {
        title: "Memories and Solitude",
        description: "Thoughts of youth, baseball, and a boy waiting at home",
        sentences: [
          "Alone on the endless water Santiago's mind drifted back often to his younger stronger years",
          "He remembered arm wrestling contests he had once won through sheer stubborn will alone",
          "Thoughts of Manolin's loyalty comforted him through the loneliest hardest hours at sea",
          "He imagined what the great DiMaggio would think of his own long incredible struggle",
          "Seabirds circled curiously overhead as if watching this strange lonely contest unfold",
          "He spoke gently to his own tired hands encouraging them the way he once encouraged Manolin",
          "Despite his exhaustion he never once seriously considered simply cutting the line free",
          "His solitude out on the water felt vast but never once completely empty of meaning",
        ],
      },
      {
        title: "The Marlin Surfaces",
        description: "A first full glimpse, and a final desperate strike",
        sentences: [
          "On the third day the great marlin finally began circling slowly closer to the small boat",
          "Santiago caught his very first full glimpse of the fish and gasped at its incredible size",
          "Its silver body stretched far longer than his entire skiff gleaming brightly in the sun",
          "Summoning every remaining ounce of strength he pulled the marlin steadily nearer the boat",
          "With a final desperate effort he drove his harpoon deep into the great fish's side",
          "The marlin leapt once violently against the sky before finally growing completely still",
          "Santiago wept quietly from exhaustion relief and something close to genuine grief",
          "He had won yet he felt strangely humbled by the magnificent creature he had just killed",
        ],
      },
      {
        title: "Tying the Marlin",
        description: "The journey home begins, and blood draws unwanted attention",
        sentences: [
          "Santiago lashed the enormous marlin securely alongside his small aging wooden skiff",
          "Blood from the great fish spread slowly staining the clear water a deep dark red",
          "He began the long exhausted journey back toward the distant shore he had left behind",
          "Every muscle in his body ached fiercely but pride carried him steadily onward regardless",
          "He imagined proudly the astonished faces of the villagers who had once mocked his luck",
          "The scent of blood however carried far across the water into the deeper open sea",
          "Santiago noticed the first distant shape cutting swiftly through the waves toward him",
          "He gripped his harpoon tightly sensing that his hardest struggle might not yet be over",
        ],
      },
      {
        title: "The Sharks Attack",
        description: "The first shark, and a prize slowly stripped away",
        sentences: [
          "A powerful shark tore suddenly and viciously into the trailing marlin's exposed flesh",
          "Santiago fought back fiercely stabbing at the attacking shark with everything he had left",
          "He killed it eventually but not before it had stolen a large piece of his prized catch",
          "More sharks soon followed drawn hungrily by the same relentless trail of blood",
          "Santiago fought each one desperately though his harpoon was now completely lost to the sea",
          "He improvised weapons from a knife lashed to an oar and even his own bare exhausted hands",
          "Each new attack stripped away more of the marlin he had fought so hard to win",
          "Santiago refused to surrender even as his once magnificent prize slowly disappeared",
        ],
      },
      {
        title: "Losing the Fight",
        description: "Darkness, more sharks, and a skeleton left behind",
        sentences: [
          "Night fell and still more sharks arrived drawn by the ever weakening scent of blood",
          "Santiago fought on grimly by feel alone in the near total darkness surrounding his boat",
          "He spoke bitterly to the sharks calling them thieves and cursing his own terrible luck",
          "By the time the worst of the attacks finally ended almost nothing edible remained",
          "Only the marlin's long white skeleton still trailed uselessly behind his battered skiff",
          "Santiago felt hollowed out completely as if the fish's fate had somehow become his own",
          "Still he guided his small boat steadily homeward refusing to give up even now",
          "Exhaustion finally overtook him and he slept slumped heavily over the tiller",
        ],
      },
      {
        title: "Returning Home",
        description: "A village amazed, a boy's devotion, and a well-earned rest",
        sentences: [
          "Other fishermen gathered in stunned silence around the enormous skeleton still lashed to his boat",
          "Word spread quickly through the village of the marlin's astonishing incredible size",
          "Manolin found Santiago sleeping deeply exhausted and wept quietly at his torn bleeding hands",
          "The boy fetched coffee and newspapers determined to care for the old man himself",
          "Santiago woke slowly still aching everywhere but strangely at peace with everything that happened",
          "Manolin promised firmly that they would fish together again soon no matter what others said",
          "Tourists mistook the giant skeleton for a shark and marveled at its incredible length",
          "Santiago slept once more dreaming peacefully of lions on faraway sunlit African beaches",
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
    .upsert(sectionRows, { onConflict: "id" });
  if (sectionError) throw sectionError;
  console.log(`Inserted/updated ${sectionRows.length} book_sections.`);

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
    .upsert(sentenceRows, { onConflict: "id" });
  if (sentenceError) throw sentenceError;
  console.log(`Inserted/updated ${sentenceRows.length} book_sentences.`);
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
