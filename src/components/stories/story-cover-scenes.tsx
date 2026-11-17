import type { ReactNode } from "react";

import { fill, palette, type Palette } from "@/components/words/word-cover-kit";
import { PROPS } from "@/components/stories/story-cover-props";

/**
 * The drawing on each story's cover: a ground (see BACKGROUNDS), then a few small drawings from
 * story-cover-props.tsx placed on it, all in one of the calm palettes below. A story is found by
 * its English title, like a Word List topic is. A story with no entry here gets a soft
 * level-coloured ground with a book (see StoryCoverArt), never an empty box.
 */

export const PALETTES: Record<string, Palette> = {
  lilac: palette(["#e3def3", "#d3cbe9", "#3b3466", "#e76f51", "#3a86c8", "#fbf9ff", "#35a98d"]),
  peach: palette(["#f2dccf", "#ebc6b3", "#2f3354", "#4b5a8f", "#e07a5f", "#fbefe6", "#7fb59a"]),
  sky: palette(["#cfe5f6", "#bad7ee", "#26466e", "#ef6a4c", "#3d78b8", "#ffffff", "#4f86c8"]),
  mint: palette(["#d9ebdf", "#c3dccb", "#3a2f2c", "#e0733f", "#8fb89c", "#fcf3e8", "#3b6e57"]),
  rose: palette(["#f7dcdd", "#f0c8cb", "#6b2a37", "#e0465a", "#3a9890", "#fff6f6", "#3a9890"]),
  green: palette(["#d5eadf", "#c1ddcf", "#1f5a45", "#2e8f6c", "#7cc2a3", "#f2f9f5", "#e25d45"]),
  blue: palette(["#d6e1f6", "#c2d2ef", "#22305f", "#4a6fd1", "#8aa6e6", "#eef3fd", "#e5588a"]),
  teal: palette(["#d4e6e3", "#bfd9d5", "#1f4a52", "#e0735a", "#3c7f86", "#fbf6ee", "#8bb8c2"]),
  orchid: palette(["#efdcec", "#e4c7dd", "#4a2a4f", "#2f9aa0", "#1f6f77", "#fbf2f8", "#e86d8f"]),
  coral: palette(["#f8dcd5", "#f0c6bb", "#4a2f2b", "#d9694a", "#6fa37a", "#fff7ee", "#3f6f8f"]),
  steel: palette(["#d9e8ee", "#c4dce5", "#23455a", "#4a7fb5", "#2f5e8c", "#f6fbfd", "#e5588a"]),
  indigo: palette(["#dde0f3", "#cdd2ec", "#2b2f6b", "#4b5fc0", "#8a93e0", "#fbfbff", "#e8694d"]),
  cherry: palette(["#f2dce6", "#e8c8d8", "#2e2340", "#c64f7a", "#7a5fa8", "#fff5fa", "#ef6a4c"]),
  aqua: palette(["#d2e9ec", "#bddde2", "#1f4f58", "#2fa39a", "#3d78b8", "#f2fbfc", "#e5588a"]),
  forest: palette(["#d6e9d2", "#c3dfbd", "#2a4a2d", "#3f9a5a", "#2a6b3f", "#f6fbf3", "#3aa0a8"]),
  sandy: palette(["#efe2d6", "#e4d1c2", "#3b2f2a", "#c06a4b", "#5f8f8a", "#fbf4ec", "#4a6fd1"]),
};

/** The ground of a story with no drawing, by level (1 beginner, 2 intermediate, 3 advanced). */
export const FALLBACK_PALETTE: Record<number, string> = { 1: "green", 2: "sky", 3: "lilac" };

type Prop = readonly [name: string, x: number, y: number, scale?: number, rotate?: number];
type Scene = { pal: string; bg: string; props: Prop[] };

const GROUND = <rect y="250" width="400" height="50" style={fill("tint")} />;

const BACKGROUNDS: Record<string, () => ReactNode> = {
  halo: () => (
    <>
      <circle cx="200" cy="146" r="116" style={fill("tint")} />
      {GROUND}
    </>
  ),
  sun: () => (
    <>
      <circle cx="304" cy="82" r="58" style={fill("tint")} />
      {GROUND}
    </>
  ),
  room: () => (
    <>
      <rect y="228" width="400" height="72" style={fill("tint")} />
      <rect y="222" width="400" height="8" style={fill("tint")} opacity=".6" />
    </>
  ),
  night: () => (
    <>
      <circle cx="318" cy="76" r="44" style={fill("tint")} />
      <circle cx="60" cy="50" r="4" style={fill("soft")} />
      <circle cx="140" cy="86" r="3" style={fill("soft")} />
      <circle cx="232" cy="40" r="3.5" style={fill("soft")} />
      <circle cx="372" cy="170" r="3" style={fill("soft")} />
      <circle cx="30" cy="150" r="3" style={fill("soft")} />
      {GROUND}
    </>
  ),
  rain: () => (
    <>
      <ellipse cx="200" cy="40" rx="190" ry="44" style={fill("tint")} />
      {GROUND}
    </>
  ),
  sea: () => (
    <>
      <circle cx="300" cy="84" r="52" style={fill("tint")} />
      <path d="M0 232q50 -22 100 0t100 0t100 0t100 0V300H0z" style={fill("tint")} />
    </>
  ),
  street: () => (
    <>
      <rect x="20" y="130" width="64" height="120" style={fill("tint")} />
      <rect x="96" y="90" width="52" height="160" style={fill("tint")} />
      <rect x="262" y="110" width="58" height="140" style={fill("tint")} />
      <rect x="332" y="150" width="56" height="100" style={fill("tint")} />
      {GROUND}
    </>
  ),
  hills: () => (
    <>
      <circle cx="90" cy="76" r="44" style={fill("tint")} />
      <path d="M0 236Q100 170 210 226T400 210V300H0z" style={fill("tint")} />
    </>
  ),
  sunset: () => (
    <>
      <path d="M96 250a104 104 0 0 1 208 0z" style={fill("tint")} />
      {GROUND}
    </>
  ),
  plain: () => (
    <>
      <circle cx="120" cy="170" r="110" style={fill("tint")} opacity=".7" />
      {GROUND}
    </>
  ),
};

const p = (name: string, x: number, y: number, scale = 1, rotate = 0): Prop => [
  name,
  x,
  y,
  scale,
  rotate,
];

// Standing things sit on the ground (y = 250): a person at scale 1.2 is drawn at y = 173.
const SCENES: Record<string, Scene> = {
  // ---------------------------------------------------------------- beginner
  "Waiting in the Rain": {
    pal: "sky",
    bg: "rain",
    props: [
      p("rain", 200, 150),
      p("busstop", 96, 180, 1.2),
      p("personAlt", 250, 176, 1.15),
      p("umbrella", 250, 100, 1.15),
      p("puddle", 300, 246, 0.8),
    ],
  },
  "My Phone Hates Me": {
    pal: "lilac",
    bg: "halo",
    props: [
      p("phone", 200, 146, 1.5, -14),
      p("puddle", 200, 244, 1.1),
      p("sparkle", 296, 96, 0.8),
      p("sparkle", 100, 120, 0.6),
    ],
  },
  "Fourth Try": {
    pal: "mint",
    bg: "sun",
    props: [p("bike", 190, 188, 1.55), p("star", 316, 64, 0.8)],
  },
  "Loose Dog": {
    pal: "peach",
    bg: "street",
    props: [p("gate", 90, 184, 0.9), p("dog", 262, 196, 1.3)],
  },
  "The Leaning Cake": {
    pal: "coral",
    bg: "halo",
    props: [p("cakeLean", 200, 176, 1.5), p("sparkle", 320, 90, 0.7)],
  },
  "Inside Out": {
    pal: "steel",
    bg: "rain",
    props: [
      p("wind", 150, 130, 1),
      p("umbrellaAlt", 230, 120, 1.2, 150),
      p("person", 130, 176, 1.1),
    ],
  },
  "One Wish": {
    pal: "indigo",
    bg: "night",
    props: [p("star", 200, 90, 1.6), p("bike", 200, 198, 1.1)],
  },
  "One Warm Day": {
    pal: "steel",
    bg: "sun",
    props: [p("snowman", 180, 188, 1.5), p("sun", 320, 72, 0.9)],
  },
  "Nothing But Stories": {
    pal: "aqua",
    bg: "sea",
    props: [
      p("dock", 120, 220, 1.1),
      p("rod", 170, 150, 1.2),
      p("personAlt", 150, 168, 1),
      p("fish", 296, 238, 0.7),
    ],
  },
  "The Hallway Light": {
    pal: "indigo",
    bg: "night",
    props: [p("door", 100, 164, 1.2), p("lamp", 260, 170, 1.4)],
  },
  "Still Nothing": {
    pal: "green",
    bg: "sun",
    props: [p("sprout", 200, 176, 1.9), p("sun", 320, 70, 0.7)],
  },
  "One Missing Shoe": {
    pal: "rose",
    bg: "halo",
    props: [p("shoe", 190, 200, 1.5), p("balloon", 90, 130, 1), p("balloonAlt", 310, 120, 1)],
  },
  "The Last Verse": {
    pal: "cherry",
    bg: "halo",
    props: [p("mic", 190, 156, 1.6), p("note", 100, 110, 0.9), p("note", 300, 130, 0.8)],
  },
  "The Mystery Box": {
    pal: "orchid",
    bg: "halo",
    props: [p("box", 190, 180, 1.5), p("question", 300, 96, 0.8), p("sparkle", 90, 110, 0.7)],
  },
  "The Last Cookie": { pal: "sandy", bg: "plain", props: [p("cookie", 200, 156, 1.6)] },
  "Second Place": {
    pal: "blue",
    bg: "halo",
    props: [p("medal", 200, 150, 1.8), p("sparkle", 320, 90, 0.7)],
  },
  "The Couch Nap": {
    pal: "teal",
    bg: "room",
    props: [p("sofa", 200, 190, 1.5), p("sleeper", 200, 160, 0.9), p("zzz", 300, 110, 1.1)],
  },
  "Waiting for Wind": {
    pal: "sky",
    bg: "hills",
    props: [p("kite", 200, 110, 1.6), p("cloud", 90, 70, 0.7)],
  },
  "The Bathroom Visitor": { pal: "aqua", bg: "room", props: [p("spider", 200, 110, 1.7)] },
  "Too Slow": { pal: "rose", bg: "sun", props: [p("icecream", 200, 160, 1.6)] },
  "The Morning Visitor": {
    pal: "peach",
    bg: "sun",
    props: [p("bird", 200, 178, 1.6), p("sun", 320, 70, 0.7)],
  },
  "The Giant Bubble": {
    pal: "sky",
    bg: "hills",
    props: [p("bubble", 200, 130, 2.1), p("bubble", 320, 80, 0.7)],
  },
  "Puddle Jumping": {
    pal: "steel",
    bg: "rain",
    props: [p("rain", 200, 150), p("boots", 190, 190, 1.4), p("puddle", 200, 244, 1.5)],
  },
  "Three Tries": { pal: "cherry", bg: "halo", props: [p("cakeCandles", 200, 176, 1.5)] },
  "The Sandcastle": {
    pal: "sandy",
    bg: "sea",
    props: [p("sandcastle", 190, 180, 1.5), p("wave", 270, 220, 0.9)],
  },
  "One Golden Leaf": {
    pal: "peach",
    bg: "hills",
    props: [p("treeAlt", 100, 176, 1.1), p("leaf", 270, 150, 1.25, 20)],
  },
  "Jar of Light": { pal: "indigo", bg: "night", props: [p("jar", 200, 170, 1.7)] },
  "The Sock Mystery": {
    pal: "lilac",
    bg: "room",
    props: [p("sock", 200, 160, 1.7, 8), p("question", 310, 110, 0.7)],
  },
  "One More Minute": {
    pal: "coral",
    bg: "room",
    props: [p("alarm", 200, 160, 1.7), p("zzz", 310, 90, 0.8)],
  },
  "The Missing Piece": { pal: "orchid", bg: "halo", props: [p("puzzle", 180, 160, 1.4)] },
  "Happy Accident": { pal: "cherry", bg: "halo", props: [p("splash", 200, 160, 1.5)] },
  "Just Ask": { pal: "forest", bg: "hills", props: [p("swing", 200, 170, 1.7)] },
  "The Hiccup Cure": {
    pal: "aqua",
    bg: "halo",
    props: [p("glass", 150, 170, 1.5), p("speechDots", 280, 110, 0.9)],
  },
  "Grand Opening": {
    pal: "mint",
    bg: "sun",
    props: [p("stand", 200, 180, 1.5), p("banner", 200, 80, 1.1)],
  },
  "Lights Out": {
    pal: "indigo",
    bg: "night",
    props: [p("darkCloud", 120, 70, 1), p("flashlight", 170, 186, 1.3)],
  },
  "Seven Years": {
    pal: "lilac",
    bg: "halo",
    props: [p("mirror", 200, 160, 1.5), p("sparkle", 310, 90, 0.7)],
  },
  "Slow and Steady": { pal: "green", bg: "hills", props: [p("turtle", 200, 196, 1.9)] },
  Finally: {
    pal: "sky",
    bg: "sun",
    props: [p("whistle", 190, 166, 1.8), p("note", 316, 100, 0.8), p("note", 92, 90, 0.6)],
  },
  "Direct Hit": {
    pal: "aqua",
    bg: "sun",
    props: [p("waterball", 200, 150, 1.8), p("sun", 70, 70, 0.6)],
  },
  "The 8:15 Bus": {
    pal: "peach",
    bg: "street",
    props: [p("bus", 200, 194, 1.45), p("clock", 330, 70, 0.6)],
  },
  "Wrong Number": {
    pal: "orchid",
    bg: "halo",
    props: [p("phone", 150, 150, 1.5), p("speechQuestion", 290, 110, 0.9)],
  },
  "The Mailbox": {
    pal: "sandy",
    bg: "street",
    props: [p("mailbox", 160, 176, 1.5), p("envelope", 296, 130, 0.9, 10)],
  },
  "The Loudest Sneeze": {
    pal: "teal",
    bg: "room",
    props: [p("books", 110, 190, 1.2), p("person", 250, 176, 1.2), p("speechMain", 320, 90, 0.6)],
  },
  "The Runaway Balloon": {
    pal: "sky",
    bg: "hills",
    props: [p("house", 110, 200, 1.1), p("balloon", 270, 110, 1.6)],
  },
  // ---------------------------------------------------------------- intermediate
  "The Search": {
    pal: "teal",
    bg: "room",
    props: [p("key", 190, 170, 1.6, -12), p("magnifier", 270, 150, 1)],
  },
  "I Forgot Your Name": {
    pal: "rose",
    bg: "halo",
    props: [p("nametag", 190, 150, 1.5), p("questionPop", 310, 90, 0.8)],
  },
  "The Empty Seat": {
    pal: "steel",
    bg: "room",
    props: [p("desk", 190, 180, 1.3), p("chair", 120, 174, 1.3)],
  },
  "Almost Gave Up": {
    pal: "mint",
    bg: "hills",
    props: [p("track", 200, 220, 1), p("shoe", 200, 170, 1.6)],
  },
  "Third Application": {
    pal: "blue",
    bg: "halo",
    props: [p("envelope", 190, 160, 1.7), p("speechCheck", 300, 90, 0.7)],
  },
  "The Remote Control War": {
    pal: "cherry",
    bg: "room",
    props: [p("tv", 170, 160, 1.4), p("remote", 310, 170, 1.3, -14)],
  },
  "Six Months Late": {
    pal: "sandy",
    bg: "room",
    props: [p("books", 200, 180, 1.6), p("calendar", 320, 80, 0.55)],
  },
  "Line Forgotten": {
    pal: "lilac",
    bg: "halo",
    props: [p("curtains", 200, 150, 1.4), p("speechBlank", 200, 140, 0.8)],
  },
  "The Shoes I Didn't Buy": {
    pal: "coral",
    bg: "halo",
    props: [p("shoe", 180, 190, 1.5), p("tag", 300, 110, 1.1, 10)],
  },
  "Two Minutes": {
    pal: "peach",
    bg: "street",
    props: [p("runner", 170, 184, 1.4), p("alarm", 310, 100, 0.8)],
  },
  "The Vase": {
    pal: "orchid",
    bg: "room",
    props: [p("vase", 110, 176, 1.3), p("vaseBroken", 280, 186, 1.3), p("clock", 200, 76, 0.5)],
  },
  "The New Place Downtown": { pal: "teal", bg: "street", props: [p("shop", 200, 180, 1.5)] },
  "The Small Lie": {
    pal: "lilac",
    bg: "halo",
    props: [p("speechX", 190, 150, 1.6), p("sparkle", 90, 90, 0.6)],
  },
  "All Night": { pal: "indigo", bg: "night", props: [p("controller", 200, 180, 1.8)] },
  "New City, New Rules": {
    pal: "blue",
    bg: "sunset",
    props: [p("skyline", 200, 190, 1.45), p("suitcase", 330, 206, 0.6)],
  },
  "Too Early": {
    pal: "cherry",
    bg: "halo",
    props: [
      p("balloon", 110, 130, 1.1),
      p("balloonAlt", 200, 110, 1.3),
      p("balloonPop", 290, 130, 1.1),
      p("cake", 200, 218, 0.7),
    ],
  },
  "The Sunny Day": {
    pal: "sky",
    bg: "sun",
    props: [p("sun", 280, 90, 1.5), p("cloud", 110, 140, 0.9)],
  },
  "Let Her Finish": {
    pal: "rose",
    bg: "halo",
    props: [p("speech", 140, 120, 1.1), p("speechMain", 270, 190, 1.1)],
  },
  "26.2": {
    pal: "green",
    bg: "hills",
    props: [p("flag", 200, 170, 1.4), p("runner", 200, 200, 0.7)],
  },
  "It Got Back to Her": {
    pal: "orchid",
    bg: "halo",
    props: [
      p("speechDots", 120, 120, 0.9),
      p("phone", 270, 156, 1.3),
      p("speechHeart", 130, 210, 0.7),
    ],
  },
  "Face First": {
    pal: "coral",
    bg: "plain",
    props: [p("shoe", 190, 190, 1.4, -24), p("sparkle", 300, 100, 0.8), p("sparkle", 90, 120, 0.6)],
  },
  "The Promotion I Forgot": {
    pal: "blue",
    bg: "halo",
    props: [p("briefcase", 160, 190, 1.4), p("trophy", 290, 160, 1.1)],
  },
  "The Chore Wheel": { pal: "mint", bg: "halo", props: [p("wheel", 200, 160, 1.7)] },
  "The Phone Drawer": {
    pal: "teal",
    bg: "room",
    props: [p("drawer", 190, 180, 1.5), p("phone", 290, 120, 0.8, 14)],
  },
  "The Fish Story": { pal: "aqua", bg: "sea", props: [p("fish", 200, 150, 2.1)] },
  "Event Planner": {
    pal: "cherry",
    bg: "halo",
    props: [p("banner", 200, 90, 1.7), p("checklist", 200, 190, 0.9)],
  },
  "Eating My Words": {
    pal: "coral",
    bg: "room",
    props: [p("plate", 200, 190, 1.4), p("speechMain", 200, 120, 0.8)],
  },
  "Passport Panic": {
    pal: "sky",
    bg: "halo",
    props: [
      p("suitcase", 150, 190, 1.4),
      p("plane", 290, 100, 0.9, -14),
      p("questionPop", 280, 190, 0.7),
    ],
  },
  "The Scroll": {
    pal: "lilac",
    bg: "halo",
    props: [p("phone", 200, 150, 1.6), p("heart", 300, 90, 0.6), p("heartAlt", 100, 110, 0.5)],
  },
  "The Broken Mug": {
    pal: "sandy",
    bg: "room",
    props: [p("cup", 150, 186, 1.4), p("vaseBroken", 290, 190, 0.9)],
  },
  "Sign-Up Sheet": {
    pal: "orchid",
    bg: "room",
    props: [p("paper", 190, 150, 1.7), p("shoe", 300, 206, 0.7)],
  },
  "Just Kidding": { pal: "rose", bg: "halo", props: [p("speechHeart", 190, 150, 1.7)] },
  "The Dentist": { pal: "aqua", bg: "halo", props: [p("tooth", 200, 160, 1.9)] },
  "Wrong Assumption": {
    pal: "steel",
    bg: "halo",
    props: [p("magnifier", 190, 150, 1.8), p("questionPop", 310, 90, 0.7)],
  },
  "Coffee Shop": {
    pal: "sandy",
    bg: "street",
    props: [p("cup", 190, 170, 1.7), p("heart", 310, 100, 0.6)],
  },
  "The Shortcut": {
    pal: "forest",
    bg: "hills",
    props: [p("mountain", 190, 190, 1.4), p("trailsign", 320, 200, 0.9)],
  },
  "Dessert First": { pal: "rose", bg: "halo", props: [p("cupcake", 200, 170, 1.8)] },
  "The Whisper": {
    pal: "indigo",
    bg: "halo",
    props: [p("speechDots", 130, 130, 1), p("speechDots", 270, 170, 0.8)],
  },
  "Blank Mind": {
    pal: "lilac",
    bg: "halo",
    props: [p("mic", 150, 170, 1.4), p("speechBlank", 280, 110, 1)],
  },
  "The Rumor": {
    pal: "cherry",
    bg: "halo",
    props: [p("megaphone", 190, 150, 1.6), p("speechQuestion", 320, 80, 0.5)],
  },
  "The Group Project": {
    pal: "blue",
    bg: "room",
    props: [p("desk", 200, 190, 1.4), p("laptop", 150, 160, 0.9), p("notebook", 270, 150, 0.9)],
  },
  "Long Distance": {
    pal: "sky",
    bg: "halo",
    props: [p("globe", 200, 160, 1.5), p("plane", 300, 70, 0.6, -12), p("heart", 90, 100, 0.5)],
  },
  "The Anniversary Surprise": {
    pal: "rose",
    bg: "night",
    props: [p("candle", 130, 180, 1.4), p("candle", 270, 180, 1.4), p("heart", 200, 120, 1.1)],
  },
  "The Blind Date Disaster": {
    pal: "cherry",
    bg: "room",
    props: [p("cup", 120, 186, 1.2), p("cup", 280, 186, 1.2), p("speechX", 200, 100, 0.8)],
  },
  // ---------------------------------------------------------------- advanced
  "Three Dots": {
    pal: "lilac",
    bg: "halo",
    props: [p("phone", 150, 150, 1.4), p("speechDots", 290, 130, 1.1)],
  },
  "Old Photos": { pal: "sandy", bg: "room", props: [p("photos", 200, 160, 1.5)] },
  "The Weekend Offline": {
    pal: "green",
    bg: "hills",
    props: [p("phone", 150, 170, 1.3, -10), p("sprout", 290, 190, 1.3), p("sun", 310, 60, 0.5)],
  },
  "The Return Line": {
    pal: "rose",
    bg: "halo",
    props: [p("bag", 140, 170, 1.4), p("receipt", 290, 160, 1.3)],
  },
  "The Grocery Aisle": {
    pal: "mint",
    bg: "room",
    props: [p("shelves", 200, 130, 1.3), p("cart", 200, 200, 1.1)],
  },
  "3 A.M.": {
    pal: "indigo",
    bg: "night",
    props: [p("laptop", 130, 190, 1.2), p("cup", 270, 190, 1), p("clock", 330, 70, 0.7)],
  },
  "The Quiet One": {
    pal: "steel",
    bg: "room",
    props: [p("personAlt", 200, 176, 1.3), p("speechDots", 310, 100, 0.8)],
  },
  "Small Joys": {
    pal: "peach",
    bg: "sun",
    props: [p("cup", 150, 180, 1.3), p("sprout", 290, 190, 1.2), p("sun", 320, 60, 0.5)],
  },
  "Fine, I'll Try It": { pal: "orchid", bg: "room", props: [p("yoga", 200, 170, 1.7)] },
  "Mile Eighteen": {
    pal: "green",
    bg: "hills",
    props: [p("shoe", 190, 190, 1.5), p("flag", 300, 130, 0.6)],
  },
  "Her Promotion": {
    pal: "blue",
    bg: "halo",
    props: [p("stairs", 200, 190, 1.6), p("star", 290, 90, 1)],
  },
  "Six Time Zones Away": {
    pal: "sky",
    bg: "halo",
    props: [p("globe", 200, 150, 1.3), p("clock", 90, 110, 0.7), p("clock", 320, 190, 0.7)],
  },
  "The Missed Birthday": {
    pal: "cherry",
    bg: "room",
    props: [p("cake", 150, 190, 1.2), p("calendarX", 300, 150, 1.1)],
  },
  "Five Minutes Before": {
    pal: "lilac",
    bg: "halo",
    props: [p("clock", 130, 170, 1.4), p("laptop", 290, 180, 1.1)],
  },
  "The Secret": {
    pal: "indigo",
    bg: "halo",
    props: [p("envelope", 190, 160, 1.7), p("sparkle", 310, 90, 0.7)],
  },
  "One-Way Ticket": { pal: "sky", bg: "sunset", props: [p("plane", 200, 130, 1.6, -10)] },
  "His Favorite Spot": {
    pal: "forest",
    bg: "hills",
    props: [p("bench", 130, 200, 1.3), p("dog", 280, 196, 1.2), p("tree", 60, 150, 0.8)],
  },
  "The List": { pal: "teal", bg: "halo", props: [p("checklist", 200, 160, 1.8)] },
  "One More Chapter": {
    pal: "indigo",
    bg: "night",
    props: [p("openBook", 200, 190, 1.5), p("lamp", 320, 160, 0.9)],
  },
  "The Twenties Version of Me": {
    pal: "mint",
    bg: "halo",
    props: [p("coins", 170, 190, 1.4), p("bag", 300, 170, 0.9)],
  },
  "The Pattern": { pal: "lilac", bg: "halo", props: [p("loop", 200, 160, 2)] },
  "The Spark": { pal: "blue", bg: "halo", props: [p("bulb", 200, 160, 1.8)] },
  "The Wall": {
    pal: "sandy",
    bg: "plain",
    props: [p("bricks", 200, 160, 1.3), p("sprout", 330, 210, 0.7)],
  },
  "No Applause": {
    pal: "steel",
    bg: "room",
    props: [p("chair", 110, 180, 1), p("chair", 200, 180, 1), p("chair", 290, 180, 1)],
  },
  Thaw: { pal: "steel", bg: "rain", props: [p("window", 200, 150, 1.6), p("rain", 200, 150, 0.7)] },
  "Five Years": { pal: "orchid", bg: "halo", props: [p("calendar", 200, 160, 1.7)] },
  "The Dream Job": {
    pal: "blue",
    bg: "sunset",
    props: [p("briefcase", 190, 190, 1.5), p("cloud", 300, 90, 0.8)],
  },
  "The Group Chat": { pal: "cherry", bg: "halo", props: [p("chats", 200, 160, 1.5)] },
  "One Small Push": {
    pal: "green",
    bg: "halo",
    props: [p("stairs", 200, 190, 1.5), p("runner", 90, 186, 0.8)],
  },
  "The Quiet Neighbor": {
    pal: "indigo",
    bg: "night",
    props: [p("door", 110, 164, 1.1), p("door", 290, 164, 1.1), p("lamp", 200, 170, 1)],
  },
  "One Bad Day": { pal: "rose", bg: "halo", props: [p("calendarX", 200, 160, 1.7)] },
  "The Corner Office": {
    pal: "teal",
    bg: "room",
    props: [p("window", 110, 130, 1.1), p("desk", 250, 190, 1.1), p("sprout", 330, 190, 0.9)],
  },
  "The Old Hobby": { pal: "sandy", bg: "room", props: [p("pottery", 200, 160, 1.7)] },
  "The Feedback": { pal: "coral", bg: "halo", props: [p("paper", 200, 160, 1.8)] },
  "Empty Cup": { pal: "aqua", bg: "halo", props: [p("cupEmpty", 200, 160, 1.8)] },
  "No, Thank You": {
    pal: "rose",
    bg: "halo",
    props: [p("speechX", 190, 140, 1.6), p("person", 310, 190, 0.8)],
  },
  "Left on Read": {
    pal: "lilac",
    bg: "halo",
    props: [p("phone", 170, 150, 1.5), p("ticks", 300, 110, 1)],
  },
  "The Group Decision": { pal: "blue", bg: "room", props: [p("ballot", 200, 170, 1.7)] },
  "The Family Dinner": {
    pal: "peach",
    bg: "room",
    props: [p("dinner", 200, 180, 1.5), p("lamp", 330, 150, 0.7)],
  },
  "Sunday Mornings": {
    pal: "sandy",
    bg: "sun",
    props: [p("guitar", 200, 160, 1.5), p("sun", 320, 70, 0.6)],
  },
  "Falling for My Best Friend": {
    pal: "rose",
    bg: "halo",
    props: [p("person", 130, 180, 1.2), p("personAlt", 270, 180, 1.2), p("heart", 200, 90, 0.8)],
  },
  "Choosing You Again": { pal: "cherry", bg: "halo", props: [p("rings", 200, 160, 1.9)] },
  "The Last Day": {
    pal: "peach",
    bg: "sunset",
    props: [p("calendar", 190, 160, 1.4), p("sun", 320, 80, 0.5)],
  },
  "Revenge of the Foil Desk": {
    pal: "steel",
    bg: "room",
    props: [p("desk", 200, 190, 1.4), p("foilcube", 170, 140, 1), p("sticky", 290, 150, 0.8)],
  },
  "Mama's Tired Hands": {
    pal: "peach",
    bg: "room",
    props: [
      p("person", 140, 176, 1.25),
      p("personAlt", 262, 206, 0.8),
      p("heart", 200, 92, 0.75),
      p("cup", 330, 212, 0.7),
    ],
  },
  "The Dog Ate the Ring": {
    pal: "rose",
    bg: "halo",
    props: [
      p("dog", 140, 198, 1.35),
      p("rings", 290, 184, 1.1),
      p("heart", 330, 80, 0.5),
      p("sparkle", 80, 90, 0.6),
    ],
  },
  "My Mother's Four Words": {
    pal: "cherry",
    bg: "halo",
    props: [
      p("person", 135, 178, 1.3),
      p("personAlt", 268, 182, 1.15),
      p("gradCap", 268, 116, 0.8),
      p("heart", 200, 78, 0.6),
    ],
  },
};

export function hasStoryScene(title: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, title);
}

export function storyScene(title: string): { palette: Palette; draw: () => ReactNode } | null {
  if (!hasStoryScene(title)) return null;
  const scene = SCENES[title]!;
  const tones = PALETTES[scene.pal] ?? PALETTES.lilac!;
  const draw = () => (
    <>
      {(BACKGROUNDS[scene.bg] ?? BACKGROUNDS.halo!)()}
      {scene.props.map(([name, x, y, s = 1, r = 0], index) => {
        const art = PROPS[name];
        if (!art) return null;
        return (
          <g key={`${name}-${index}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
            {art()}
          </g>
        );
      })}
    </>
  );
  return { palette: tones, draw };
}

export const STORY_SCENE_TITLES = Object.keys(SCENES);
