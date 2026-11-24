/**
 * Where a German rule's pattern sits in a sentence: the candidate word indexes, in reading order, like the English
 * matchers (../matchers.ts). The first candidate becomes the blank. Each matcher is a small, explicit rule with
 * word lists written out; a sentence that does not match cleanly is simply not asked, and a rule no word shows
 * ("none" in the syllabus) is taught from its prepared sentences. German nouns start with a capital letter, so
 * a word written with a small letter after the first word is never a noun: several matchers use that.
 */

import type { Token } from "../tokens";

interface Ctx {
  /** Lower-case words. */
  w: string[];
  /** The words as written. */
  t: string[];
  text: string;
  tokens: readonly Token[];
}

const set = (words: string): ReadonlySet<string> => new Set(words.split(/\s+/).filter(Boolean));

const DAT_PREPS = set("mit bei zu von aus nach seit gegenüber");
const PREPS_ALL = set(
  "mit für in an auf von bei zu über um aus nach durch gegen ohne unter vor hinter neben zwischen seit",
);
const WEEKDAYS = set(
  "montag dienstag mittwoch donnerstag freitag samstag sonntag wochenende morgen abend mittag nachmittag vormittag",
);
const MONTHS = set(
  "januar februar märz april mai juni juli august september oktober november dezember sommer winter frühling herbst jahr",
);
const TIME_WORDS = set(
  "zwei drei vier fünf sechs sieben acht zehn zwölf einem einer einigen langem kurzem ein eine mehreren vielen",
);
const NOT_PARTICIPLE = set(
  "gebiet gesicht gedicht gewicht gericht gerät gehalt gewalt gerecht gesetz gebäude gebt geht gesamt gesund gering geschäft gewiss gewöhnt gespannt gestern",
);
const NO_GE_PARTICIPLE = set(
  "bekommen besucht bezahlt bestellt verstanden verkauft vergessen verloren versucht verbracht erzählt erklärt erlebt entschieden entdeckt entwickelt begonnen beschlossen besprochen benutzt beantwortet gefallen",
);
const SEPARABLE_PREFIX = set(
  "an auf aus ein mit vor zurück ab fest weg her hin nach weiter vorbei los fern um zu",
);
const SPEECH_VERBS = set(
  "sagte sagt sagten meinte meint erklärte behauptete berichtete erzählte fragte antwortete schrieb",
);

function pos(w: string[], words: ReadonlySet<string>): number[] {
  const out: number[] = [];
  for (let i = 0; i < w.length; i++) if (words.has(w[i]!)) out.push(i);
  return out;
}

function isCapitalAt(c: Ctx, i: number): boolean {
  const first = c.t[i]?.[0];
  return first !== undefined && first === first.toUpperCase() && first !== first.toLowerCase();
}

function isParticiple(c: Ctx, i: number): boolean {
  const word = c.w[i] ?? "";
  if (i === 0 || isCapitalAt(c, i) || NOT_PARTICIPLE.has(word)) return false;
  if (NO_GE_PARTICIPLE.has(word)) return true;
  if (word.length > 6 && word.endsWith("iert")) return true;
  if (/^(an|auf|aus|ein|mit|vor|zu|zurück|ab|fest|weg|her|hin|nach|um)ge[a-zäöüß]+(t|en)$/.test(word)) return true;
  return /^ge[a-zäöüß]{2,}(t|en)$/.test(word);
}

function hasParticiple(c: Ctx): number {
  for (let i = 0; i < c.w.length; i++) if (isParticiple(c, i)) return i;
  return -1;
}

function lastWordIndex(c: Ctx): number {
  return c.w.length - 1;
}

/** Whether a comma stands in the text shortly before the token (a clause begins there). */
function afterComma(c: Ctx, i: number, gap = 14): boolean {
  const start = c.tokens[i]?.start ?? 0;
  const before = c.text.slice(Math.max(0, start - gap), start);
  return before.includes(",");
}

function precededByDativePrep(c: Ctx, i: number): boolean {
  return i > 0 && DAT_PREPS.has(c.w[i - 1]!);
}

const isQuestion = (c: Ctx) => c.text.trim().endsWith("?");

/**
 * The last word of the clause that starts at token i (up to the next comma, or the end of the sentence): in a
 * subordinate clause this is where the verb stands. -1 when the clause has no word after its first.
 */
function clauseEnd(c: Ctx, i: number): number {
  const from = c.tokens[i]?.start ?? 0;
  const comma = c.text.indexOf(",", from);
  let end = c.w.length - 1;
  if (comma >= 0) {
    end = i;
    for (let k = i + 1; k < c.w.length && c.tokens[k]!.start < comma; k++) end = k;
  }
  return end > i + 1 ? end : -1;
}

/** The final verbs of the clauses that a word of `starters` opens. */
function finalVerbs(c: Ctx, starters: ReadonlySet<string>, from = 0): number[] {
  return pos(c.w, starters)
    .filter((i) => i >= from)
    .map((i) => clauseEnd(c, i))
    .filter((i) => i >= 0);
}

const PERFECT_AUX = set("habe hast hat haben habt bin bist ist sind seid");
const HABEN = set("habe hast hat haben habt");
const SEIN = set("bin bist ist sind seid");

function perfectWith(c: Ctx, aux: ReadonlySet<string>): number[] {
  if (hasParticiple(c) < 0) return [];
  return pos(c.w, aux).filter((i) => i < hasParticiple(c));
}

const WRITTEN_ARTICLE_STOP = set("der die das ein eine");

function adjectiveAfter(c: Ctx, articles: ReadonlySet<string>, endings: RegExp): number[] {
  const out: number[] = [];
  for (let i = 0; i + 2 < c.w.length; i++) {
    if (!articles.has(c.w[i]!)) continue;
    const next = c.w[i + 1]!;
    if (isCapitalAt(c, i + 1) || !isCapitalAt(c, i + 2) || !endings.test(next)) continue;
    if (WRITTEN_ARTICLE_STOP.has(next) || next.length < 4) continue;
    out.push(i + 1);
  }
  return out;
}

const PRAET_REGULAR = set(
  "machte machten sagte sagten lebte lebten wohnte wohnten arbeitete arbeiteten spielte spielten lernte lernten kaufte kauften glaubte fragte antwortete kochte liebte brauchte wartete öffnete zeigte suchte hörte folgte lachte weinte tanzte reiste studierte telefonierte besuchte kostete passierte erzählte träumte wünschte holte",
);
const PRAET_IRREGULAR = set(
  "ging gingen kam kamen sah sahen nahm nahmen gab gaben fand fanden blieb blieben lief liefen fuhr fuhren schrieb schrieben las lasen sprach sprachen aß aßen trank tranken schlief schliefen stand standen saß saßen lag lagen hielt hielten rief riefen zog zogen traf trafen bekam verstand begann hieß half halfen schien verlor",
);
const PRAET_MIXED = set(
  "brachte brachten dachte dachten kannte kannten nannte nannten wusste wussten rannte rannten wandte brannte sandte",
);

const KONJ1 = set("sei seien seiest könne müsse wolle solle dürfe wisse");
const KONJ2 = set(
  "wäre wären wärst wärt hätte hätten hättest hättet würde würden würdest würdet könnte könnten könntest dürfte dürften müsste müssten wüsste wüssten sollte sollten wollte",
);

const ADJ_PREP: Readonly<Record<string, ReadonlySet<string>>> = {
  stolz: set("auf"),
  abhängig: set("von"),
  zufrieden: set("mit"),
  interessiert: set("an"),
  bereit: set("zu"),
  verantwortlich: set("für"),
  gespannt: set("auf"),
  fähig: set("zu"),
  neugierig: set("auf"),
  enttäuscht: set("von über"),
  verliebt: set("in"),
  überzeugt: set("von"),
  typisch: set("für"),
  bekannt: set("für aus"),
  glücklich: set("über"),
  eifersüchtig: set("auf"),
  müde: set("von"),
  verheiratet: set("mit"),
  besorgt: set("um"),
};

const VERB_PREP_VERBS = set(
  "warte wartet warten denke denkt denken freue freut freuen spreche spricht sprechen träumt träume träumen interessiert interessiere ärgert ärgere hoffe hofft hoffen frage fragt fragen erzähle erzählt erzählen erinnere erinnert erinnern",
);
const VERB_PREPS = set("auf an über von für nach um");

const MATCHERS = {
  "de-subject-sg": (c) => (set("ich du er es").has(c.w[0] ?? "") ? [0] : []),
  "de-subject-pl": (c) => (set("wir ihr").has(c.w[0] ?? "") ? [0] : []),
  "de-sein-sg": (c) => pos(c.w, set("bin bist ist")).filter((i) => i < 3),
  "de-sein-pl": (c) => pos(c.w, set("sind seid")).filter((i) => i < 3),
  "de-haben": (c) => (hasParticiple(c) >= 0 ? [] : pos(c.w, HABEN)),
  "de-article-def": (c) =>
    pos(c.w, set("der die das")).filter(
      (i) => !precededByDativePrep(c, i) && !afterComma(c, i, 3) && c.w[i - 1] !== "und",
    ),
  "de-article-indef": (c) =>
    pos(c.w, set("ein eine")).filter((i) => !precededByDativePrep(c, i) && !afterComma(c, i, 3)),
  "de-kein": (c) => pos(c.w, set("kein keine")),
  "de-possessive": (c) => pos(c.w, set("mein meine dein deine seine ihre")),
  "de-possessive-pl": (c) => pos(c.w, set("unser unsere euer eure")),
  "de-w-question": (c) => (isQuestion(c) && set("was wo wer wie").has(c.w[0] ?? "") ? [0] : []),
  "de-w-question-more": (c) =>
    isQuestion(c) && set("woher wohin warum wann wieso").has(c.w[0] ?? "") ? [0] : [],
  "de-yes-no-question": (c) =>
    isQuestion(c) &&
    set(
      "ist bist sind hast hat haben kann kannst kommst kommt möchtest magst gehst spielst wohnst sprichst brauchst willst musst gibt arbeitest lernst",
    ).has(c.w[0] ?? "")
      ? [0]
      : [],
  "de-ja-nein-doch": (c) =>
    pos(c.w, set("ja nein doch")).filter((i) => i === 0 || c.text.slice(0, c.tokens[i]!.start).includes("?")),
  "de-nicht": (c) => pos(c.w, set("nicht")),
  "de-nicht-kein": (c) => pos(c.w, set("kein keine keinen nicht")),
  "de-es-gibt": (c) => pos(c.w, set("gibt")).filter((i) => c.w[i - 1] === "es" || c.w[i + 1] === "es"),
  "de-vowel-i": (c) =>
    pos(c.w, set("isst sprichst spricht gibst gibt nimmst nimmt hilfst hilft triffst trifft")),
  "de-vowel-ie": (c) => pos(c.w, set("siehst sieht liest siehst")),
  "de-vowel-ae": (c) =>
    pos(c.w, set("fährst fährt schläfst schläft läufst läuft trägst trägt wäschst wäscht hältst hält")),
  "de-wissen-werden": (c) => pos(c.w, set("weiß weißt wisst wissen wirst werdet")),
  "de-separable-end": (c) => {
    const last = lastWordIndex(c);
    return c.w.length >= 3 && last > 0 && SEPARABLE_PREFIX.has(c.w[last]!) && !set("zu um").has(c.w[last]!)
      ? [last]
      : [];
  },
  "de-koennen": (c) => pos(c.w, set("kann kannst können könnt")),
  "de-muessen-wollen": (c) => pos(c.w, set("muss musst müssen müsst will willst wollen wollt")),
  "de-moechten-duerfen-sollen": (c) =>
    pos(c.w, set("möchte möchtest möchten möchtet darf darfst dürfen dürft soll sollst sollen sollt")),
  "de-gern": (c) => pos(c.w, set("gern gerne")),
  "de-akk-article": (c) =>
    pos(c.w, set("den einen keinen meinen deinen")).filter((i) => !precededByDativePrep(c, i)),
  "de-akk-pronoun": (c) => pos(c.w, set("mich dich ihn")),
  "de-prep-akk": (c) => pos(c.w, set("für ohne durch gegen")),
  "de-prep-dat": (c) => pos(c.w, set("mit bei zu aus von nach")),
  "de-two-way-wo": (c) =>
    pos(c.w, set("in an auf unter über vor hinter neben zwischen"))
      .filter((i) => set("dem der einem einer meinem meiner deinem ihrem seinem").has(c.w[i + 1] ?? ""))
      .map((i) => i + 1),
  "de-two-way-wohin": (c) =>
    pos(c.w, set("in an auf unter über vor hinter neben zwischen"))
      .filter((i) => set("das die den ein eine einen mein meine meinen").has(c.w[i + 1] ?? ""))
      .map((i) => i + 1),
  "de-time-prep": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length - 1; i++) {
      const next = c.w[i + 1]!;
      if (c.w[i] === "um" && (/^\d/.test(next) || c.w.slice(i + 1, i + 4).includes("uhr"))) out.push(i);
      if (c.w[i] === "am" && WEEKDAYS.has(next)) out.push(i);
      if (c.w[i] === "im" && MONTHS.has(next)) out.push(i);
    }
    return out;
  },
  "de-conjunction": (c) => pos(c.w, set("und aber oder denn")).filter((i) => i > 0),

  "de-perfekt-haben": (c) => perfectWith(c, HABEN),
  "de-participle-t": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length; i++)
      if (isParticiple(c, i) && /^ge[a-zäöüß]{2,}t$/.test(c.w[i]!)) out.push(i);
    return out;
  },
  "de-participle-en": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length; i++)
      if (isParticiple(c, i) && /^ge[a-zäöüß]{2,}en$/.test(c.w[i]!)) out.push(i);
    return out;
  },
  "de-perfekt-sein": (c) => perfectWith(c, SEIN),
  "de-participle-no-ge": (c) => {
    if (pos(c.w, PERFECT_AUX).length === 0) return [];
    const out: number[] = [];
    for (let i = 0; i < c.w.length; i++)
      if (isParticiple(c, i) && !c.w[i]!.startsWith("ge")) out.push(i);
    return out;
  },
  "de-participle-separable": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length; i++)
      if (/^(an|auf|aus|ein|mit|vor|zu|zurück|ab|fest|weg|her|hin|nach|um)ge[a-zäöüß]+(t|en)$/.test(c.w[i]!) && i > 0)
        out.push(i);
    return out;
  },
  "de-participle-end": (c) => {
    const last = lastWordIndex(c);
    return last > 1 && isParticiple(c, last) && pos(c.w, PERFECT_AUX).length > 0 ? [last] : [];
  },
  "de-war-hatte": (c) => pos(c.w, set("war warst waren wart hatte hattest hatten hattet")),
  "de-dat-article": (c) => pos(c.w, set("dem einem keinem meinem deinem seinem ihrem unserem")),
  "de-dat-pronoun": (c) => pos(c.w, set("mir dir ihm ihnen")),
  // The word after the verb: the dative pronoun or article that the verb takes.
  "de-dat-verbs": (c) =>
    pos(
      c.w,
      set(
        "hilft hilfst helfe helfen gefällt gefallen gehört gehören dankt danken schmeckt fehlt passt antwortet gratuliere gratuliert",
      ),
    )
      .map((i) => i + 1)
      .filter((i) => set("mir dir ihm ihr uns euch ihnen dem der den").has(c.w[i] ?? "")),
  "de-prep-dat-article": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length - 1; i++)
      if (
        set("aus bei mit nach seit von zu").has(c.w[i]!) &&
        set("dem der einem einer meinem meiner deinem ihrem seinem unserem").has(c.w[i + 1]!)
      )
        out.push(i + 1);
    return out;
  },
  "de-dat-possessive": (c) => pos(c.w, set("meinem meiner deinem deiner seinem ihrem unserem eurem")),
  "de-adj-definite": (c) => adjectiveAfter(c, set("der die das den dem des"), /(e|en)$/),
  "de-adj-indefinite": (c) =>
    adjectiveAfter(
      c,
      set("ein eine einen einem einer kein keine keinen mein meine meinen meinem"),
      /(er|es|e|en|em)$/,
    ),
  "de-comparative": (c) =>
    pos(c.w, set("als")).flatMap((i) => (i > 0 && /er$/.test(c.w[i - 1]!) && c.w[i - 1]!.length > 4 ? [i - 1] : [])),
  "de-superlative": (c) =>
    pos(c.w, set("am")).flatMap((i) => (/(sten|ten|esten)$/.test(c.w[i + 1] ?? "") ? [i + 1] : [])),
  "de-irregular-comparison": (c) =>
    pos(c.w, set("besser besten lieber liebsten mehr meisten höher höchsten näher nächsten")),
  "de-so-wie": (c) => pos(c.w, set("wie")).filter((i) => c.w.slice(Math.max(0, i - 3), i).some((x) => set("so genauso ebenso").has(x))),
  // The rules about a subordinate clause blank its final verb, where the clause puts it.
  "de-weil": (c) => finalVerbs(c, set("weil")),
  "de-dass": (c) => finalVerbs(c, set("dass")),
  "de-wenn": (c) => finalVerbs(c, set("wenn")),
  "de-ob": (c) => finalVerbs(c, set("ob")),
  "de-als-wenn": (c) =>
    pos(c.w, set("als wenn")).filter((i) => (i === 0 || afterComma(c, i, 3)) && c.w[i + 1] !== "ob"),
  "de-deshalb": (c) => pos(c.w, set("deshalb darum deswegen")),
  "de-denn": (c) => pos(c.w, set("denn")).filter((i) => i > 0 && afterComma(c, i, 3)),
  "de-indirect-question": (c) =>
    finalVerbs(c, set("wo wer was wann warum wie wohin woher"), 1).filter((i) => c.text.includes(",")),
  "de-zu-infinitive": (c) =>
    pos(c.w, set("zu")).filter((i) => {
      const next = c.w[i + 1] ?? "";
      return (
        next.length >= 5 &&
        next.endsWith("en") &&
        !isCapitalAt(c, i + 1) &&
        !set("einen keinen meinen deinen seinen unseren ihren vielen allen diesen jenen den").has(next)
      );
    }),
  "de-modal-past": (c) =>
    pos(c.w, set("konnte konntest konnten musste musstest mussten wollte wollten durfte durften sollte sollten mochte")),
  "de-reflexive": (c) => pos(c.w, set("sich")).concat(pos(c.w, set("mich dich")).filter((i) => c.w[0] === "ich" || c.w[0] === "du")),
  "de-reflexive-dative": (c) =>
    pos(c.w, set("mir dir")).filter((i) => set("die das den meine meinen deine").has(c.w[i + 1] ?? "")),
  "de-future": (c) => {
    const last = lastWordIndex(c);
    return last > 1 && c.w[last]!.endsWith("en") && !isParticiple(c, last)
      ? pos(c.w, set("werde wirst wird werden werdet")).filter((i) => i < last)
      : [];
  },
  "de-lassen": (c) => pos(c.w, set("lasse lässt lassen lasst ließ ließen")),
  "de-verb-prep": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length; i++) {
      if (!VERB_PREP_VERBS.has(c.w[i]!)) continue;
      for (let j = i + 1; j <= Math.min(i + 3, c.w.length - 1); j++)
        if (VERB_PREPS.has(c.w[j]!)) {
          out.push(j);
          break;
        }
    }
    return out;
  },
  "de-da-compound": (c) =>
    pos(c.w, set("darauf daran darüber davon dafür dazu womit wofür worauf woran worüber wovon wozu")),
  "de-genitive-article": (c) => pos(c.w, set("des eines meines deines seines ihres unseres")),
  "de-n-declension": (c) => {
    const names = set(
      "jungen menschen herrn kollegen studenten nachbarn namen kunden polizisten affen bären löwen franzosen touristen patienten journalisten",
    );
    return c.w.map((x, i) => (names.has(x) && isCapitalAt(c, i) && i > 0 ? i : -1)).filter((i) => i >= 0);
  },
  "de-relative-nom": (c) => pos(c.w, set("der die das")).filter((i) => i > 0 && afterComma(c, i, 3)),
  "de-relative-akk": (c) => pos(c.w, set("den")).filter((i) => i > 0 && afterComma(c, i, 3)),
  "de-relative-dat": (c) =>
    pos(c.w, set("dem denen")).filter((i) => i > 0 && afterComma(c, i, 14) && !isCapitalAt(c, i)),
  "de-indefinite": (c) => pos(c.w, set("man jemand niemand etwas nichts alles")),
  "de-demonstrative": (c) =>
    pos(
      c.w,
      set("dieser diese dieses diesen diesem jeder jede jedes jeden jedem welcher welche welches welchen"),
    ),
  "de-wuerde": (c) => pos(c.w, set("würde würdest würden würdet")),
  "de-haette-waere": (c) => pos(c.w, set("hätte hättest hätten hättet wäre wärst wären wärt")),
  "de-koennte": (c) => pos(c.w, set("könnte könntest könnten dürfte dürftest dürften")),
  "de-unreal-condition": (c) => {
    if (!c.w.includes("wenn")) return [];
    return pos(c.w, set("würde würdest würden hätte wäre wären hätten"));
  },
  "de-wish": (c) => pos(c.w, set("wünschte wünschten")),
  "de-pair-conjunction": (c) => pos(c.w, set("sondern sowohl entweder weder")).slice(0, 1),
  "de-zwar": (c) => pos(c.w, set("zwar")),
  "de-prep-genitive": (c) => pos(c.w, set("wegen trotz statt anstatt innerhalb außerhalb")),
  "de-ordinal": (c) =>
    pos(
      c.w,
      set(
        "erste ersten zweite zweiten dritte dritten vierte vierten fünfte fünften sechste sechsten siebte siebten achte achten neunte neunten zehnte zehnten zwanzigsten",
      ),
    ),
  "de-time-span": (c) =>
    pos(c.w, set("seit vor bis ab")).filter((i) => {
      const next = c.w[i + 1] ?? "";
      return /^\d/.test(next) || TIME_WORDS.has(next) || WEEKDAYS.has(next);
    }),
  "de-clause-final-aux": (c) => {
    const last = lastWordIndex(c);
    return last > 2 && c.text.includes(",") && PERFECT_AUX.has(c.w[last]!) && isParticiple(c, last - 1)
      ? [last]
      : [];
  },
  "de-place-adverb": (c) => pos(c.w, set("hier dort da dorthin hierher dahin")),
  "de-wissen-kennen": (c) => pos(c.w, set("kenne kennst kennt kennen weiß weißt wisst wissen")),

  "de-praet-regular": (c) => pos(c.w, PRAET_REGULAR),
  "de-praet-irregular": (c) => pos(c.w, PRAET_IRREGULAR),
  "de-praet-mixed": (c) => pos(c.w, PRAET_MIXED),
  "de-plusquam": (c) =>
    hasParticiple(c) >= 0 ? pos(c.w, set("hatte hattest hatten hattet war warst waren wart")) : [],
  "de-future-guess": (c) =>
    c.w.some((x) => set("wohl sicher bestimmt vermutlich wahrscheinlich").has(x))
      ? pos(c.w, set("wird werden wirst"))
      : [],
  "de-future-two": (c) => {
    const last = lastWordIndex(c);
    return last > 2 && set("haben sein").has(c.w[last]!) && isParticiple(c, last - 1)
      ? pos(c.w, set("wird werde werden wirst werdet"))
      : [];
  },
  "de-passive-present": (c) => {
    const last = lastWordIndex(c);
    return last > 1 && isParticiple(c, last) ? pos(c.w, set("wird werden wirst werdet")) : [];
  },
  "de-passive-past": (c) => pos(c.w, set("wurde wurden wurdest wurdet worden")),
  "de-passive-modal": (c) => {
    const last = lastWordIndex(c);
    if (last < 3 || c.w[last] !== "werden" || !isParticiple(c, last - 1)) return [];
    // The blank is the final werden, once a modal verb stands earlier in the sentence.
    return pos(c.w, set("kann muss soll darf will können müssen sollen dürfen wollen könnte musste sollte")).length > 0
      ? [last]
      : [];
  },
  "de-passive-agent": (c) =>
    pos(c.w, set("wurde wurden wird werden worden")).length > 0 ? pos(c.w, set("von durch")) : [],
  "de-state-passive": (c) => {
    const states = set(
      "geschlossen geöffnet gebaut repariert verboten erlaubt geplant gedeckt besetzt ausverkauft reserviert organisiert eingeladen gesperrt beendet erledigt vorbereitet",
    );
    // The blank is the sein before the participle (sein = a state, werden = a process).
    return c.w
      .map((x, i) => (states.has(x) && set("ist sind war waren").has(c.w[i - 1] ?? "") ? i - 1 : -1))
      .filter((i) => i >= 0);
  },
  "de-passive-substitute": (c) => {
    const out = pos(c.w, set("lässt lassen ließ")).filter((i) => c.w[i + 1] === "sich" || c.w[i + 2] === "sich");
    for (let i = 0; i < c.w.length; i++)
      if (/bar$/.test(c.w[i]!) && c.w[i]!.length > 6 && !isCapitalAt(c, i)) out.push(i);
    return out.sort((a, b) => a - b);
  },
  "de-sein-zu": (c) =>
    pos(c.w, set("zu")).filter(
      (i) => set("ist sind war waren").has(c.w[i - 1] ?? "") || set("ist sind war waren").has(c.w[i - 2] ?? ""),
    ),
  "de-impersonal-passive": (c) =>
    c.w[0] === "es" && set("wird wurde").has(c.w[1] ?? "") ? [1] : [],
  "de-konj2-past": (c) => {
    const last = lastWordIndex(c);
    return last > 2 && isParticiple(c, last) ? pos(c.w, set("hätte hättest hätten wäre wärst wären")) : [];
  },
  "de-konj2-modal": (c) => {
    const modals = set("gekonnt gemusst gewollt gedurft gesollt können müssen wollen dürfen sollen");
    const last = lastWordIndex(c);
    return last > 2 && modals.has(c.w[last]!) ? pos(c.w, set("hätte hättest hätten hättet")) : [];
  },
  "de-als-ob": (c) => pos(c.w, set("ob")).filter((i) => c.w[i - 1] === "als"),
  "de-konj1": (c) => pos(c.w, KONJ1),
  "de-reported-speech": (c) => {
    if (!c.w.some((x) => SPEECH_VERBS.has(x))) return [];
    return pos(c.w, set("sei seien habe hätte wäre könne müsse wolle solle dürfe wisse werde")).filter((i) => i > 1);
  },
  "de-reported-konj2": (c) => {
    if (!c.w.some((x) => SPEECH_VERBS.has(x))) return [];
    return pos(c.w, set("würde würden hätten wären hätte wäre")).filter((i) => i > 1);
  },
  "de-inverted-condition": (c) =>
    c.text.includes(",") && set("wäre hätte würde könnte wüsste hätten wären").has(c.w[0] ?? "") ? [0] : [],
  "de-sollte": (c) => (set("sollte sollten falls").has(c.w[0] ?? "") && c.text.includes(",") ? [0] : []),
  "de-obwohl": (c) => pos(c.w, set("obwohl")),
  "de-trotzdem": (c) => pos(c.w, set("trotzdem")),
  "de-damit": (c) => pos(c.w, set("damit")).filter((i) => i > 0 && afterComma(c, i, 3)),
  "de-um-zu": (c) =>
    pos(c.w, set("um")).filter((i) => {
      const toZu = c.w.indexOf("zu", i + 1);
      return toZu > i + 1 && toZu - i <= 8 && afterComma(c, i, 3) && !/^\d/.test(c.w[i + 1] ?? "");
    }),
  "de-indem": (c) => pos(c.w, set("indem")),
  "de-waehrend": (c) =>
    pos(c.w, set("während")).filter(
      (i) => afterComma(c, i, 3) || set("ich du er sie es wir ihr man der die das").has(c.w[i + 1] ?? ""),
    ),
  "de-nachdem": (c) => pos(c.w, set("nachdem")),
  "de-bevor": (c) => pos(c.w, set("bevor ehe")),
  "de-sobald": (c) => pos(c.w, set("sobald solange seitdem seit sooft")).filter((i) => c.w[i] !== "seit" || set("ich du er sie es wir ihr man").has(c.w[i + 1] ?? "")),
  "de-sodass": (c) => pos(c.w, set("sodass")),
  "de-dessen": (c) => pos(c.w, set("dessen deren")),
  "de-relative-prep": (c) => {
    const preps = set("mit für in an auf von bei zu über um aus nach durch gegen ohne");
    const out: number[] = [];
    for (let i = 1; i < c.w.length - 1; i++)
      if (preps.has(c.w[i]!) && afterComma(c, i, 3) && set("dem der denen den die das").has(c.w[i + 1]!)) out.push(i + 1);
    return out;
  },
  "de-relative-was-wo": (c) => pos(c.w, set("was wo")).filter((i) => i > 0 && afterComma(c, i, 3)),
  "de-participle-one": (c) => {
    const out: number[] = [];
    for (let i = 1; i < c.w.length; i++)
      if (!isCapitalAt(c, i) && /[a-zäöüß]{4,}ende[rsnm]?$/.test(c.w[i]!) && c.w[i]!.length >= 8) out.push(i);
    return out;
  },
  "de-participle-adjective": (c) => {
    const out: number[] = [];
    for (let i = 1; i < c.w.length - 1; i++)
      if (
        !isCapitalAt(c, i) &&
        isCapitalAt(c, i + 1) &&
        set("der die das den dem des ein eine einen einem einer").has(c.w[i - 1]!) &&
        /^ge[a-zäöüß]{3,}(t|en)(e|er|es|en|em)$/.test(c.w[i]!)
      )
        out.push(i);
    return out;
  },
  "de-extended-attribute": (c) => {
    const out: number[] = [];
    const articles = set("der die das den dem des ein eine einen einem einer");
    const preps = set("von vom im in aus auf an mit durch");
    for (let i = 0; i < c.w.length; i++) {
      if (!articles.has(c.w[i]!)) continue;
      for (let j = i + 3; j <= Math.min(i + 6, c.w.length - 1); j++)
        if (
          !isCapitalAt(c, j) &&
          /^ge[a-zäöüß]{3,}(t|en)(e|er|es|en|em)$/.test(c.w[j]!) &&
          c.w.slice(i + 1, j).some((x) => preps.has(x))
        ) {
          out.push(j);
          break;
        }
    }
    return out;
  },
  "de-prep-genitive-b2": (c) => pos(c.w, set("wegen trotz statt anstatt innerhalb außerhalb aufgrund anlässlich")),
  "de-nominalization": (c) => {
    const out: number[] = [];
    for (let i = 1; i < c.w.length; i++)
      if (isCapitalAt(c, i) && /(ung|keit|heit|schaft|tion|ität)(en)?$/.test(c.w[i]!) && c.w[i]!.length > 6) out.push(i);
    return out;
  },
  "de-da-dass": (c) =>
    c.w.includes("dass")
      ? pos(c.w, set("darauf daran darüber davon dafür dagegen dazu darum"))
      : [],
  "de-particles": (c) => pos(c.w, set("doch mal eben halt eigentlich bloß ruhig wohl")).filter((i) => i > 0),
  "de-adjective-prep": (c) => {
    const out: number[] = [];
    for (let i = 0; i < c.w.length - 1; i++) {
      const preps = ADJ_PREP[c.w[i]!];
      if (preps?.has(c.w[i + 1]!)) out.push(i + 1);
    }
    return out;
  },
} satisfies Record<string, (c: Ctx) => number[]>;

export type DeMatchKind = keyof typeof MATCHERS;

export function isDeMatchKind(kind: string): kind is DeMatchKind {
  return kind in MATCHERS;
}

/** The candidate indexes for one German rule in one sentence (`text`: the whole sentence; `tokens`: its words). */
export function deCandidates(kind: DeMatchKind, tokens: readonly Token[], text: string): number[] {
  const ctx: Ctx = { w: tokens.map((t) => t.lower), t: tokens.map((t) => t.text), text, tokens };
  return (MATCHERS[kind] as (c: Ctx) => number[])(ctx);
}
