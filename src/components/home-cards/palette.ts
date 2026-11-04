/**
 * The colours of the Home cards (permission "homeCards"), all in this one file so they can be changed
 * without touching a layout.
 *
 * A card is nearly the page colour: one dark base, a single soft wash of its section's hue in the top
 * corner and a hairline of the same hue, so nothing on the page hits the eye. The bright colours live
 * in the art on the card (white paper sheets with real shadows, a story page, an audio orb, a video
 * frame, white word cards), which is drawn from the `PAPER`, `ORB`, `STORY_PAGE` and `VIDEO_SCENE`
 * groups below. `TINT` scales the wash and the hairline of every card at once (1 = near the page
 * colour, about 2 = clearly tinted).
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

/** How strongly a card is tinted (see above). */
const TINT = 1;

function alpha(value: number): number {
  return Math.round(value * TINT * 1000) / 1000;
}

function tone(hue: string, base: string, accent: string): CardColors {
  return {
    base,
    background: `radial-gradient(110% 125% at 0% 0%,rgba(${hue},${alpha(0.14)}) 0%,rgba(${hue},0) 62%),${base}`,
    edge: `rgba(${hue},${alpha(0.17)})`,
    chip: `rgba(${hue},0.12)`,
    chipEdge: `rgba(${hue},0.34)`,
    soft: "rgba(255,255,255,0.62)",
    accent,
  };
}

export const HOME_CARD_COLORS = {
  /** Passages: navy. */
  passages: tone("96,140,240", "#0e1730", "#9fbdff"),
  /** Stories: plum. */
  stories: tone("178,104,204", "#170f1e", "#e2a6f0"),
  /** Video: deep pine. */
  video: tone("46,190,164", "#0a1c1d", "#8be8d4"),
  /** Words: indigo, the site's own brand hue. */
  words: tone("124,131,240", "#12132f", "#b9bdff"),
  /** The daily lesson side of the «keep learning» card. */
  lesson: tone("124,131,240", "#101124", "#b9bdff"),
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
  /** A word card: the translation lines under the word (the first one tinted). */
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

/** The story's page: the big letter's ink, the ribbon, and the page's face (shaded at the spine). */
export const STORY_PAGE = {
  face: "linear-gradient(90deg,#e8e5dc 0,#fbfaf6 7%,#f5f3ec 100%)",
  ink: "#2b1a3d",
  ribbon: "linear-gradient(180deg,#ea5a82,#c43b65)",
  line: "#d0ccc2",
  back1: "#e2ded4",
  back2: "#c9c4b8",
  shadow: "0 30px 50px -18px rgba(0,0,0,0.8),0 2px 7px rgba(0,0,0,0.4)",
  stackShadow: "0 18px 30px -12px rgba(0,0,0,0.65)",
} as const;

/** The Video card's frame: a quiet shot (sky, hills, water), the glass play button and the player bar. */
export const VIDEO_SCENE = {
  scene:
    "linear-gradient(180deg,#19505b 0%,#348a92 30%,#86cbc9 50%,#cdeee4 58%,#379099 58.4%,#1b6169 100%)",
  hillNear: "#0f3f3c",
  hillFar: "#14554c",
  rain: "repeating-linear-gradient(105deg,rgba(255,255,255,0.065) 0 1px,transparent 1px 11px)",
  water: "repeating-linear-gradient(180deg,rgba(255,255,255,0.08) 0 2px,transparent 2px 8px)",
  bar: "rgba(6,22,24,0.55)",
  progress: "#4fe0b5",
  shadow: "0 26px 44px -16px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.13)",
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
