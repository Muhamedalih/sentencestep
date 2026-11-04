/**
 * The colours of the Home cards (permission "homeCards"), all in this one file so they can be changed
 * without touching a layout.
 *
 * A card is nearly black like the page: one very dark, almost neutral base (a hair of its section's
 * hue), a wash of that hue in the top corner that is barely there, and a neutral white hairline, so
 * nothing on the page glows. The bright colours live in the art on the card (white paper sheets with
 * real shadows, a story page, an audio orb, the YouTube player), which is drawn from the `PAPER`,
 * `ORB`, `STORY_PAGE` and `VIDEO_SCENE` groups below. `TINT` scales the wash of every card at once
 * (1 = as built, 0 = flat dark).
 */
export interface CardColors {
  /** The card's flat base colour (the colour a shade has to fade into). */
  base: string;
  /** The card's background: the wash of its hue over the base (a CSS `background` value). */
  background: string;
  /** The hairline round the card. */
  edge: string;
  /** The small tag in the card's corner: its fill and its hairline. */
  chip: string;
  chipEdge: string;
  /** Small print on the card (the line under the title, the «next» label). */
  soft: string;
  /** A light tone of the card's hue, for dots, the tag's text and small marks. */
  accent: string;
}

/** How strongly a card's corner wash shows (see above). */
const TINT = 1;

function alpha(value: number): number {
  return Math.round(value * TINT * 1000) / 1000;
}

/** A card: its near-black base, the hue of its corner wash and how much of it shows (a few percent), and a muted light tone for the tag's text and the small dot. */
function tone(hue: string, base: string, accent: string, wash = 0.045): CardColors {
  return {
    base,
    background: `radial-gradient(110% 125% at 0% 0%,rgba(${hue},${alpha(wash)}) 0%,rgba(${hue},0) 62%),${base}`,
    edge: "rgba(255,255,255,0.085)",
    chip: "rgba(255,255,255,0.055)",
    chipEdge: "rgba(255,255,255,0.11)",
    soft: "rgba(255,255,255,0.58)",
    accent,
  };
}

export const HOME_CARD_COLORS = {
  /** Passages: black with a trace of blue. */
  passages: tone("120,150,230", "#0c0d10", "#a7b0c6"),
  /** Stories: black with a trace of plum. */
  stories: tone("180,130,200", "#0e0c0f", "#b9a7c4"),
  /** Video: YouTube's own dark grey, no wash. */
  video: tone("255,255,255", "#0e0e0e", "#c4c4c4", 0.025),
  /** Words: black with a trace of indigo, the site's own brand hue. */
  words: tone("124,131,240", "#0d0d11", "#b0b3d3"),
  /** The daily lesson side of the «keep learning» card, and the daily-tasks box. */
  lesson: tone("124,131,240", "#0c0c0f", "#b0b3d3"),
} as const satisfies Record<string, CardColors>;

export type HomeCardColorKey = keyof typeof HOME_CARD_COLORS;

/** The white paper of the art: sheets, the word cards, the question box and the marks drawn on them. */
export const PAPER = {
  /** A sheet's face, and the two sheets stacked behind it. */
  sheet: "linear-gradient(180deg,#fcfbf7 0%,#f2f0e9 100%)",
  back1: "#e3e0d7",
  back2: "#cdc9be",
  /** The shadow of the top sheet, and of the ones behind it. */
  shadow: "0 26px 44px -16px rgba(0,0,0,0.78),0 2px 6px rgba(0,0,0,0.4)",
  stackShadow: "0 14px 26px -10px rgba(0,0,0,0.6)",
  /** Ink for titles and words on paper. */
  ink: "#1a2236",
  /** The short rule under a sheet's title. */
  rule: "#5b7cfa",
  /** A line of text, and the same line when it is the highlighted one. */
  line: "#cfd4de",
  lineMarked: "#aab5cc",
  /** The highlighter (pale blue, never yellow). */
  highlight: "#c3d6ff",
  /** The question box on the sheet. */
  box: "#f8f6ef",
  boxEdge: "#e1ded4",
  boxLabel: "#8a90a3",
  boxTick: "#b7bdcc",
  boxRight: "#26a269",
  boxOption: "#d7dbe4",
  boxOptionRight: "#a9dcc2",
  /** A word card: the Arabic meaning under the word, and (with no meaning) the two lines in its place (the first one tinted). */
  wordMeaning: "#56607a",
  wordLine: "#aab1fb",
  wordLineSoft: "#d9dce6",
  wordShadow: "0 14px 22px -10px rgba(0,0,0,0.75),0 2px 4px rgba(0,0,0,0.35)",
} as const;

/** The round audio mark on the Passages sheet. */
export const ORB = {
  background: "radial-gradient(circle at 32% 26%,#6c94ff,#3058dc 58%,#2241b0)",
  shadow: "0 0 0 7px rgba(80,120,255,0.16),0 16px 30px -6px rgba(20,40,150,0.75)",
  bar: "#ffffff",
} as const;

/**
 * The story's picture: a hardcover book standing on the Stories card (the Passages card keeps white
 * paper sheets, so the two cards no longer share a silhouette). A dusty-raspberry cover shaded
 * towards the spine, a cream frame, the story's first letter in cream, two cream lines, and the
 * block of pages showing at the edge and the foot.
 */
export const STORY_BOOK = {
  cover: "linear-gradient(135deg,#ac4e73 0%,#933f64 55%,#7c3454 100%)",
  coverEdge: "inset 0 0 0 1px rgba(255,255,255,0.07)",
  /** The spine's shading, from the binding out. */
  spine: "linear-gradient(90deg,rgba(0,0,0,0.3),rgba(255,255,255,0.1) 55%,rgba(0,0,0,0.12))",
  /** The cream of the letter, the frame and the lines on the cover. */
  ink: "#f6ead6",
  frame: "rgba(246,234,214,0.5)",
  line: "rgba(246,234,214,0.5)",
  /** The page block under the cover (thin alternating leaves) and the book's shadow. */
  pages: "repeating-linear-gradient(90deg,#f1ebde 0 2px,#d8d1c2 2px 3px)",
  shadow: "0 26px 44px -16px rgba(0,0,0,0.85)",
} as const;

/**
 * The achievements panel: one small tile per number, tinted with the hue of the section it counts
 * (Stories plum, Video YouTube red, sentences the Passages blue, words the brand indigo). `rgb` is
 * the tint, `ink` the icon's colour on it.
 */
export const STATS = {
  hairline: "rgba(255,255,255,0.08)",
  /** The bar toward the next level: its track (the fill is the site's own primary colour). */
  track: "rgba(255,255,255,0.1)",
  tiles: {
    stories: { rgb: "180,130,200", ink: "#dcb8ea" },
    videos: { rgb: "255,82,72", ink: "#ff8d85" },
    lines: { rgb: "120,150,230", ink: "#a9c0ff" },
    words: { rgb: "124,131,240", ink: "#bfc2ff" },
  },
} as const;

/**
 * The Video card's frame, drawn as a YouTube player: a quiet shot (sky, hills, water), the title strip
 * on top, the dark play button that turns red under the pointer, the red progress line with its dot
 * and the control row. The red is YouTube's own and is the only saturated colour on the card.
 */
export const VIDEO_SCENE = {
  scene:
    "linear-gradient(180deg,#19505b 0%,#348a92 30%,#86cbc9 50%,#cdeee4 58%,#379099 58.4%,#1b6169 100%)",
  hillNear: "#0f3f3c",
  hillFar: "#14554c",
  rain: "repeating-linear-gradient(105deg,rgba(255,255,255,0.065) 0 1px,transparent 1px 11px)",
  water: "repeating-linear-gradient(180deg,rgba(255,255,255,0.08) 0 2px,transparent 2px 8px)",
  /** The fades that carry the title strip (top) and the controls (bottom). */
  fadeTop: "linear-gradient(180deg,rgba(0,0,0,0.62),transparent)",
  fadeBottom: "linear-gradient(0deg,rgba(0,0,0,0.7),transparent)",
  /** YouTube's red: the progress line, its dot, the big play button under the pointer, the logo. */
  red: "#ff0000",
  /** The big play button at rest (YouTube's dark rounded rectangle). */
  playRest: "rgba(33,33,33,0.82)",
  /** The line under the played part of the progress line. */
  track: "rgba(255,255,255,0.3)",
  /** The round mark beside the title (the channel's picture). */
  avatar: "linear-gradient(135deg,#5b6770,#2f373d)",
  shadow: "0 26px 44px -16px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.1)",
} as const;

/**
 * The daily-tasks box (the strip and the card that opens under it): indigo like the lesson card, with
 * the next task's tile, the three-part tracker, the freeze pill, and, once opened, the step rail
 * (a green disc for a finished step, an indigo ring for the current one, a grey ring for the rest).
 */
export const TASKS = {
  /** The hairline between the strip's groups, and the one under each row of the opened card. */
  hairline: "rgba(255,255,255,0.08)",
  rowLine: "rgba(255,255,255,0.07)",
  /** The tile with the next task's icon (green with a tick once the day is done). */
  tile: {
    background: "linear-gradient(160deg,rgba(124,131,240,0.26),rgba(124,131,240,0.1))",
    border: "rgba(124,131,240,0.34)",
    ink: "#c3c6ff",
  },
  tileDone: {
    background: "linear-gradient(160deg,rgba(62,194,122,0.24),rgba(62,194,122,0.08))",
    border: "rgba(62,194,122,0.38)",
    ink: "#6fe6a4",
  },
  /** The tracker: one part per task. */
  segment: {
    idle: "rgba(255,255,255,0.12)",
    fill: "var(--primary)",
    current: "rgba(124,131,240,0.55)",
  },
  /** The «streak freezes left» pill. */
  freeze: { background: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.28)", ink: "#7dd3fc" },
  /** The round button that opens the box. */
  chevron: { border: "rgba(255,255,255,0.12)", hover: "rgba(255,255,255,0.06)" },
  /** The step rail of the opened card. */
  disc: {
    idle: { border: "rgba(255,255,255,0.16)", background: "transparent", ink: "#8e8e99" },
    current: {
      border: "var(--primary)",
      background: "rgba(124,131,240,0.2)",
      ink: "#d3d5ff",
      halo: "rgba(124,131,240,0.1)",
    },
    done: { border: "rgba(62,194,122,0.5)", background: "rgba(62,194,122,0.16)", ink: "#6fe6a4" },
  },
  rail: { idle: "rgba(255,255,255,0.1)", done: "rgba(62,194,122,0.5)" },
  /** The XP pill at a row's end. */
  xp: {
    idle: { background: "rgba(255,255,255,0.06)", ink: "#9a9aa3" },
    current: { background: "rgba(124,131,240,0.16)", ink: "#c9cbff" },
    done: { background: "rgba(62,194,122,0.14)", ink: "#6fe6a4" },
  },
  /** The level mark («A2») in a row's detail line. */
  level: { border: "rgba(255,255,255,0.16)", ink: "#c8c8cf" },
  /** A finished row's title, and the line saying why the current step matters. */
  doneTitle: "#b7bac6",
  why: "#b9bbd6",
  /** The small print of the opened card's heading line. */
  reward: "#a3a6d6",
} as const;
