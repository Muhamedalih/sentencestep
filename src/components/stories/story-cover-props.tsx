import type { ReactNode } from "react";

import { fill, stroke, type Tone } from "@/components/words/word-cover-kit";

/**
 * The small drawings a story's cover is built from (see story-cover-scenes.tsx): each one is a flat
 * vector shape group drawn around the point (0, 0), about 120 units across, painted only with the
 * seven tones of the cover (bg, tint, ink, main, alt, soft, pop), so any palette can wear it.
 * Nothing here is yellow.
 */

// ---- shape helpers ----------------------------------------------------------------------------

const pa = (d: string, t: Tone, o?: number) => <path d={d} style={fill(t)} opacity={o} />;
const li = (d: string, t: Tone, w = 6, o?: number, dash?: string) => (
  <path
    d={d}
    fill="none"
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray={dash}
    style={stroke(t)}
    opacity={o}
  />
);
const ci = (x: number, y: number, r: number, t: Tone, o?: number) => (
  <circle cx={x} cy={y} r={r} style={fill(t)} opacity={o} />
);
const re = (x: number, y: number, w: number, h: number, t: Tone, r = 0, o?: number) => (
  <rect x={x} y={y} width={w} height={h} rx={r} style={fill(t)} opacity={o} />
);
const el = (x: number, y: number, rx: number, ry: number, t: Tone, o?: number) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} style={fill(t)} opacity={o} />
);
const ring = (x: number, y: number, r: number, t: Tone, w = 6, o?: number) => (
  <circle cx={x} cy={y} r={r} fill="none" strokeWidth={w} style={stroke(t)} opacity={o} />
);

const STAR = "0,-32 9,-11 32,-10 14,5 20,28 0,15 -20,28 -14,5 -32,-10 -9,-11";

// ---- people and animals -----------------------------------------------------------------------

function Person({ body = "main" }: { body?: Tone }) {
  return (
    <>
      {pa("M-34 64V6a34 34 0 0 1 68 0v58z", body)}
      {ci(0, -30, 20, "soft")}
      {pa("M-20 -36A20 20 0 0 1 20 -36Q0 -50 -20 -36z", "ink")}
    </>
  );
}

function Dog() {
  return (
    <>
      {li("M-48 6Q-74 -4 -66 -32", "alt", 9)}
      {pa("M-48 44V0Q-48 -26 -20 -26H20Q40 -26 40 -4V44z", "alt")}
      {re(-34, 34, 16, 14, "ink", 4)}
      {re(16, 34, 16, 14, "ink", 4)}
      {ci(40, -34, 24, "alt")}
      {pa("M24 -52Q10 -32 26 -18Q38 -30 34 -52z", "ink")}
      {el(60, -26, 12, 9, "soft")}
      {ci(68, -30, 4, "ink")}
      {ci(44, -40, 3.5, "ink")}
      {li("M24 -10L42 -8", "pop", 6)}
    </>
  );
}

function Bird() {
  return (
    <>
      {li("M-70 44H80", "ink", 7)}
      {pa("M-30 6L-60 -8L-58 14z", "alt")}
      {el(0, 4, 34, 26, "main")}
      {ci(30, -14, 18, "main")}
      {pa("M46 -16L66 -10L46 -5z", "alt")}
      {ci(35, -18, 3.2, "ink")}
      {pa("M-18 2Q4 -20 26 6Q4 20 -18 2z", "alt")}
      {li("M-8 30V44M10 30V44", "ink", 4)}
    </>
  );
}

function Turtle() {
  return (
    <>
      {re(-44, 16, 22, 22, "alt", 8)}
      {re(20, 16, 22, 22, "alt", 8)}
      {ci(62, 8, 17, "alt")}
      {ci(67, 3, 3.4, "ink")}
      {pa("M-58 24A58 58 0 0 1 58 24z", "main")}
      {li("M-30 22Q-24 -4 0 -12Q24 -4 30 22", "soft", 4)}
      {li("M0 -12V22", "soft", 4)}
      {pa("M-58 24H58L50 32H-50z", "ink")}
    </>
  );
}

function Fish() {
  return (
    <>
      {pa("M-54 0Q-12 -44 40 -6L66 -26V26L40 6Q-12 44 -54 0z", "main")}
      {pa("M-10 -22L10 -44L24 -14z", "alt")}
      {ci(-32, -4, 4.5, "ink")}
      {li("M-14 -10Q-8 0 -14 10", "soft", 3)}
    </>
  );
}

function Spider() {
  return (
    <>
      {li("M0 -22V-96", "soft", 2.5)}
      {li("M-14 6L-40 -8L-54 16M-14 12L-40 24L-48 46M14 6L40 -8L54 16M14 12L40 24L48 46", "ink", 4)}
      {ci(0, 12, 17, "ink")}
      {ci(0, -10, 11, "ink")}
      {ci(-4, -12, 2.4, "soft")}
      {ci(4, -12, 2.4, "soft")}
    </>
  );
}

// ---- nature -----------------------------------------------------------------------------------

function Sun() {
  return (
    <>
      {ci(0, 0, 50, "soft", 0.35)}
      {ci(0, 0, 30, "soft")}
      {li(
        "M0 -64V-80M0 64V80M-64 0H-80M64 0H80M-46 -46l-12 -12M46 46l12 12M-46 46l-12 12M46 -46l12 -12",
        "soft",
        6,
      )}
    </>
  );
}

function Moon() {
  return pa("M12 -52A54 54 0 1 0 44 30A44 44 0 0 1 12 -52z", "soft");
}

function Cloud({ tone = "soft" }: { tone?: Tone }) {
  return (
    <>
      {ci(-36, 4, 26, tone)}
      {ci(-4, -14, 36, tone)}
      {ci(36, 2, 28, tone)}
      {re(-62, 4, 126, 26, tone, 13)}
    </>
  );
}

function Tree({ crown = "main" }: { crown?: Tone }) {
  return (
    <>
      {re(-8, 0, 16, 66, "ink", 4)}
      {ci(0, -28, 46, crown)}
      {ci(-34, 0, 30, crown)}
      {ci(34, 0, 30, crown)}
      {ci(-12, -38, 10, "soft", 0.35)}
    </>
  );
}

function Leaf() {
  return (
    <>
      {pa("M0 -56Q54 -22 42 30Q10 62 -32 42Q-54 0 0 -56z", "alt")}
      {li("M0 -44Q4 0 -24 42", "soft", 3.5)}
      {li("M-24 42L-34 60", "ink", 5)}
    </>
  );
}

function Sprout() {
  return (
    <>
      {li("M0 14V-34", "ink", 6)}
      {pa("M0 -14Q-38 -22 -44 -52Q-8 -54 0 -14z", "alt")}
      {pa("M0 -30Q36 -36 44 -66Q8 -68 0 -30z", "main")}
      {pa("M-32 18H32L24 66H-24z", "pop")}
      {re(-36, 10, 72, 14, "alt", 5)}
    </>
  );
}

function Mountain() {
  return (
    <>
      {pa("M-110 70L-34 -44L8 18L40 -20L110 70z", "main")}
      {pa("M-34 -44L-48 -20L-34 -28L-22 -20z", "soft")}
      {pa("M40 -20L30 -4L40 -10L50 -4z", "soft")}
    </>
  );
}

// ---- weather ----------------------------------------------------------------------------------

function Rain() {
  const drops: ReactNode[] = [];
  let n = 0;
  for (const y of [-100, -52, -4, 44, 92]) {
    for (let x = -170 + (n % 2) * 24; x < 190; x += 48) {
      drops.push(
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y}l-8 20`}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          style={stroke("soft")}
          opacity=".85"
        />,
      );
    }
    n += 1;
  }
  return <>{drops}</>;
}

function Umbrella({ tone = "main" }: { tone?: Tone }) {
  return (
    <>
      {pa("M-64 0A64 64 0 0 1 64 0Q32 -12 0 0Q-32 -12 -64 0z", tone)}
      {li("M0 0V58a9 9 0 0 1 -18 0", "ink", 6)}
      {ci(0, -66, 4, "ink")}
      {li("M-32 -34Q-14 -50 0 -56", "soft", 4, 0.7)}
    </>
  );
}

function Wind() {
  return (
    <>
      {li("M-90 -30H20a16 16 0 1 0 -16 -16", "soft", 5)}
      {li("M-70 6H60a16 16 0 1 1 -16 16", "soft", 5)}
      {li("M-100 42H-20", "soft", 5)}
    </>
  );
}

function Flashlight() {
  return (
    <>
      {pa("M46 -18L136 -58V58L46 18z", "soft", 0.5)}
      {re(-54, -14, 74, 28, "ink", 6)}
      {pa("M20 -22H46L46 22H20z", "main")}
      {ci(-24, 0, 4.5, "pop")}
    </>
  );
}

// ---- house, street, things --------------------------------------------------------------------

function House() {
  return (
    <>
      {re(-52, 0, 104, 66, "main", 4)}
      {pa("M-66 6L0 -50L66 6z", "alt")}
      {re(-12, 28, 24, 38, "ink", 4)}
      {re(-42, 16, 22, 22, "soft", 3)}
      {re(20, 16, 22, 22, "soft", 3)}
    </>
  );
}

function Door() {
  return (
    <>
      {re(-42, -84, 84, 168, "main", 8)}
      {re(-30, -70, 60, 62, "alt", 5, 0.7)}
      {re(-30, 6, 60, 62, "alt", 5, 0.7)}
      {ci(26, 4, 5.5, "soft")}
    </>
  );
}

function Window() {
  return (
    <>
      {re(-58, -76, 116, 152, "soft", 8, 0.7)}
      <rect
        x="-58"
        y="-76"
        width="116"
        height="152"
        rx="8"
        fill="none"
        strokeWidth="8"
        style={stroke("main")}
      />
      {li("M0 -76V76M-58 0H58", "main", 6)}
      {ci(-30, -40, 5, "main", 0.6)}
      {ci(22, -22, 5, "main", 0.6)}
      {ci(-20, 30, 5, "main", 0.6)}
      {ci(34, 46, 5, "main", 0.6)}
    </>
  );
}

function Lamp() {
  return (
    <>
      {ci(0, -16, 62, "soft", 0.22)}
      {pa("M-26 -44L26 -44L40 -2H-40z", "soft")}
      {re(-3, -2, 6, 64, "ink")}
      {el(0, 64, 24, 7, "ink")}
    </>
  );
}

function Busstop() {
  return (
    <>
      {re(-5, -70, 10, 140, "ink", 3)}
      {ci(0, -82, 28, "main")}
      {re(-14, -92, 28, 16, "soft", 4)}
      {ci(-8, -72, 3, "ink")}
      {ci(8, -72, 3, "ink")}
      {re(24, 28, 64, 9, "alt", 3)}
      {re(32, 37, 7, 33, "ink")}
      {re(76, 37, 7, 33, "ink")}
    </>
  );
}

function Bus() {
  return (
    <>
      {re(-84, -42, 168, 84, "main", 16)}
      {re(-70, -28, 32, 30, "soft", 5)}
      {re(-30, -28, 32, 30, "soft", 5)}
      {re(10, -28, 32, 30, "soft", 5)}
      {re(52, -28, 20, 52, "soft", 5)}
      {re(-84, 14, 168, 9, "alt")}
      {ci(-48, 44, 16, "ink")}
      {ci(48, 44, 16, "ink")}
      {ci(-48, 44, 6, "soft")}
      {ci(48, 44, 6, "soft")}
    </>
  );
}

function Bike() {
  return (
    <>
      {ring(-50, 22, 30, "ink", 6)}
      {ring(50, 22, 30, "ink", 6)}
      {li("M-50 22L-14 -20H26L50 22M-14 -20L4 22H-50M4 22L26 -20", "main", 6)}
      {li("M-26 -30H-2", "ink", 8)}
      {li("M26 -20L22 -40h18", "ink", 6)}
      {ci(4, 22, 7, "alt")}
    </>
  );
}

function Shoe() {
  return (
    <>
      {pa("M-54 22V-22L-32 -26Q-22 -4 8 -2Q42 -2 54 14Q60 22 54 30H-50Q-54 30 -54 22z", "main")}
      {re(-56, 26, 114, 12, "soft", 6)}
      {li("M-26 -12l10 -10M-10 -6l10 -10M6 -2l10 -10", "soft", 4)}
    </>
  );
}

function Boots() {
  return (
    <>
      <g transform="translate(-34 0)">
        {pa("M-20 -52H10V8H40Q52 8 52 26V40H-20z", "main")}
        {re(-20, 36, 72, 10, "ink", 4)}
      </g>
      <g transform="translate(44 6)">
        {pa("M-20 -52H10V8H40Q52 8 52 26V40H-20z", "alt")}
        {re(-20, 36, 72, 10, "ink", 4)}
      </g>
    </>
  );
}

function Sock() {
  return (
    <>
      {pa("M-18 -56H24V10L52 30Q64 52 44 62Q26 70 6 52L-18 30z", "main")}
      {re(-20, -64, 46, 18, "alt", 5)}
      {pa("M6 52Q26 70 44 62Q52 56 52 46Q30 56 6 40z", "pop")}
    </>
  );
}

function Key() {
  return (
    <>
      {ci(-36, 0, 24, "alt")}
      {ci(-36, 0, 9, "bg")}
      {re(-14, -7, 76, 14, "alt", 4)}
      {re(36, 6, 11, 22, "alt", 2)}
      {re(52, 6, 11, 15, "alt", 2)}
    </>
  );
}

function Phone() {
  return (
    <>
      {re(-32, -58, 64, 116, "ink", 13)}
      {re(-26, -50, 52, 100, "soft", 8)}
      {re(-18, -32, 30, 15, "main", 6)}
      {re(-12, -10, 30, 15, "alt", 6)}
      {re(-18, 12, 24, 15, "main", 6, 0.6)}
    </>
  );
}

function Mailbox() {
  return (
    <>
      {re(-6, 10, 12, 72, "ink")}
      {pa("M-52 12V-28Q-52 -58 -10 -58H10Q52 -58 52 -28V12z", "main")}
      {el(-16, -22, 11, 20, "ink")}
      {re(48, -52, 6, 36, "alt")}
      {re(54, -52, 24, 15, "pop", 3)}
    </>
  );
}

function Envelope() {
  return (
    <>
      {re(-54, -36, 108, 72, "soft", 8)}
      {li("M-52 -30L0 8L52 -30", "main", 6)}
      {pa("M0 28c-18-12-22-22-14-28 6-4 12 0 14 6 2-6 8-10 14-6 8 6 4 16-14 28z", "pop")}
    </>
  );
}

function Book() {
  return (
    <>
      {re(-52, -44, 104, 88, "main", 6)}
      {re(-52, -44, 15, 88, "alt", 4)}
      {re(-30, -32, 74, 64, "soft", 3)}
      {li("M-18 -14H30M-18 0H30M-18 14H14", "ink", 4, 0.5)}
    </>
  );
}

function Books() {
  return (
    <>
      {re(-64, 24, 128, 28, "main", 5)}
      {re(-54, -4, 108, 28, "alt", 5)}
      {re(-60, -32, 116, 28, "pop", 5)}
      {re(-44, 32, 70, 5, "soft", 2, 0.7)}
      {re(-34, 4, 60, 5, "soft", 2, 0.7)}
    </>
  );
}

function OpenBook() {
  return (
    <>
      {pa("M0 -44Q-34 -58 -68 -44V46Q-34 32 0 46z", "soft")}
      {pa("M0 -44Q34 -58 68 -44V46Q34 32 0 46z", "soft")}
      {pa(
        "M-72 -42V52Q-34 38 0 52Q34 38 72 52V-42L80 -46V60Q38 46 0 60Q-38 46 -80 60V-46z",
        "main",
      )}
      {li(
        "M-52 -24Q-34 -30 -14 -24M-52 -6Q-34 -12 -14 -6M-52 12Q-34 6 -14 12M14 -24Q34 -30 52 -24M14 -6Q34 -12 52 -6",
        "ink",
        3.5,
        0.45,
      )}
    </>
  );
}

function Clock({ alarm = false }: { alarm?: boolean }) {
  return (
    <>
      {alarm && (
        <>
          {ci(-38, -44, 15, "main")}
          {ci(38, -44, 15, "main")}
          {li("M-30 54l-12 16M30 54l12 16", "ink", 7)}
        </>
      )}
      {ci(0, 6, 52, "soft")}
      {ring(0, 6, 52, "main", 8)}
      {li("M0 6V-26M0 6L22 18", "ink", 6)}
      {ci(0, 6, 5, "pop")}
      {li("M0 -36v6M0 42v6M-42 6h6M36 6h6", "ink", 3.5, 0.5)}
    </>
  );
}

function Star({ tone = "soft" }: { tone?: Tone }) {
  return <polygon points={STAR} style={fill(tone)} transform="scale(1.4)" />;
}

function Sparkle() {
  return pa("M0 -26Q5 -5 26 0Q5 5 0 26Q-5 5 -26 0Q-5 -5 0 -26z", "soft");
}

function Heart({ tone = "pop" }: { tone?: Tone }) {
  return pa("M0 44C-56 8 -52 -36 -24 -36Q-6 -36 0 -16Q6 -36 24 -36C52 -36 56 8 0 44z", tone);
}

function Note() {
  return (
    <>
      {ci(-12, 26, 13, "ink")}
      {re(-2, -34, 6, 60, "ink")}
      {pa("M4 -34Q28 -28 26 -4Q20 -20 4 -16z", "ink")}
    </>
  );
}

function Mic() {
  return (
    <>
      {ci(0, -34, 26, "ink")}
      {li("M-14 -44Q0 -34 14 -44M-18 -32Q0 -20 18 -32", "soft", 3, 0.5)}
      {pa("M-12 -10L12 -10L8 64H-8z", "main")}
      {ring(0, 8, 26, "alt", 5, 0.0)}
    </>
  );
}

function Cake({ lean = false, candles = 1 }: { lean?: boolean; candles?: number }) {
  const xs = candles === 1 ? [0] : [-36, -18, 0, 18, 36];
  return (
    <g transform={lean ? "rotate(-10 0 54)" : undefined}>
      {el(0, 54, 78, 10, "soft")}
      {re(-62, 8, 124, 46, "main", 10)}
      {re(-42, -26, 84, 38, "soft", 9)}
      {li("M-62 22q16 14 31 0t31 0t31 0t31 0", "soft", 7)}
      {xs.map((x) => (
        <g key={x}>
          {re(x - 3, -50, 6, 26, "pop", 2)}
          {pa(`M${x} -66q9 12 0 20q-9 -8 0 -20z`, "alt")}
        </g>
      ))}
    </g>
  );
}

function Cupcake() {
  return (
    <>
      {pa("M-36 2H36L26 56H-26z", "alt")}
      {li("M-18 12L-12 50M0 12V50M18 12L12 50", "soft", 3, 0.6)}
      {ci(0, -10, 36, "soft")}
      {ci(0, -36, 25, "main")}
      {ci(0, -60, 9, "pop")}
    </>
  );
}

function Cookie() {
  return (
    <>
      {ci(0, 0, 52, "alt")}
      {ci(-18, -16, 6.5, "ink")}
      {ci(14, -20, 6, "ink")}
      {ci(-6, 14, 6.5, "ink")}
      {ci(24, 10, 6, "ink")}
      {ci(-30, 18, 5, "ink")}
      {ci(46, -36, 22, "bg")}
    </>
  );
}

function Icecream() {
  return (
    <>
      {pa("M-30 6H30L0 88z", "alt")}
      {li("M-16 24H16M-8 44H8", "soft", 2.5, 0.7)}
      {ci(0, -4, 36, "soft")}
      {ci(0, -42, 30, "main")}
      {ci(0, -74, 8, "pop")}
      {pa("M-34 6q4 22 10 8q4 -14 12 0q4 8 12 -6", "soft")}
    </>
  );
}

function Glass() {
  return (
    <>
      {pa("M-28 -56H28L22 56H-22z", "soft", 0.55)}
      {pa("M-25 -22H25L22 56H-22z", "main", 0.85)}
      {ci(-6, 6, 4.5, "soft")}
      {ci(8, -8, 3.5, "soft")}
      {ci(-2, 30, 4, "soft")}
      {li("M10 -60L24 -84", "pop", 5)}
    </>
  );
}

function Cup() {
  return (
    <>
      {li("M-12 -36q-8 -12 0 -24M12 -36q-8 -12 0 -24", "soft", 4)}
      {pa("M-38 -22H38V20Q38 54 0 54Q-38 54 -38 20z", "soft")}
      {li("M38 -8Q66 -8 60 18Q54 32 36 28", "soft", 8)}
      {el(0, 60, 54, 9, "main")}
      {el(0, -22, 38, 7, "alt")}
    </>
  );
}

function CupEmpty() {
  return (
    <>
      {pa("M-42 -42H42L34 52Q32 62 22 62H-22Q-32 62 -34 52z", "soft")}
      {el(0, -42, 42, 9, "main")}
      {el(0, -42, 36, 6, "bg")}
      {li("M-28 -10L-24 40", "main", 4, 0.35)}
    </>
  );
}

function Plate() {
  return (
    <>
      {el(0, 18, 70, 20, "soft")}
      {el(0, 16, 48, 12, "tint")}
      {li("M-86 -10V40M-92 -10V4M-80 -10V4", "ink", 4)}
      {li("M86 -10V40M92 -10Q92 4 86 8", "ink", 4)}
    </>
  );
}

// ---- objects with a story ---------------------------------------------------------------------

function Box() {
  return (
    <>
      {re(-52, -30, 104, 84, "main", 8)}
      {re(-58, -50, 116, 26, "alt", 6)}
      {re(-9, -50, 18, 104, "soft")}
      {li("M0 -50Q-30 -84 -30 -60Q-28 -46 0 -50Q28 -46 30 -60Q30 -84 0 -50", "soft", 6)}
    </>
  );
}

function Question({ tone = "ink" }: { tone?: Tone }) {
  return (
    <>
      {li("M-16 -22a18 18 0 1 1 25 16q-9 7 -9 22", tone, 9)}
      {ci(0, 40, 6, tone)}
    </>
  );
}

function Trophy() {
  return (
    <>
      {li("M-36 -42Q-62 -42 -56 -22Q-50 -6 -30 -2M36 -42Q62 -42 56 -22Q50 -6 30 -2", "main", 8)}
      {pa("M-36 -54H36V-22Q36 12 0 16Q-36 12 -36 -22z", "main")}
      {re(-6, 14, 12, 28, "main")}
      {re(-30, 40, 60, 14, "alt", 4)}
      <g transform="translate(0 -22) scale(.5)">
        {pa("M0,-32L9,-11L32,-10L14,5L20,28L0,15L-20,28L-14,5L-32,-10L-9,-11z", "soft")}
      </g>
    </>
  );
}

function Medal() {
  return (
    <>
      {pa("M-26 -70H-6L10 -20H-8z", "alt")}
      {pa("M26 -70H6L-10 -20H8z", "main")}
      {ci(0, 10, 34, "main")}
      {ci(0, 10, 25, "soft")}
      {li("M-9 2q10 -14 20 0q2 10 -20 24H12", "ink", 5)}
    </>
  );
}

function Sofa() {
  return (
    <>
      {re(-84, -50, 168, 56, "alt", 16)}
      {re(-92, -12, 28, 62, "alt", 12)}
      {re(64, -12, 28, 62, "alt", 12)}
      {re(-66, -6, 132, 50, "main", 12)}
      {re(-60, 44, 10, 14, "ink")}
      {re(50, 44, 10, 14, "ink")}
    </>
  );
}

function Zzz() {
  return (
    <>
      {li("M-30 -30H-8L-30 -8H-8", "ink", 5)}
      {li("M4 -52H22L4 -34H22", "ink", 4.5)}
      {li("M28 -70H40L28 -58H40", "ink", 4)}
    </>
  );
}

function Sleeper() {
  return (
    <>
      {el(0, 30, 80, 12, "soft", 0.55)}
      {ci(-54, 0, 19, "soft")}
      {pa("M-72 -4A19 19 0 0 1 -38 -10Q-54 -20 -72 -4z", "ink")}
      {re(-40, -12, 108, 38, "pop", 18)}
      {re(-10, -16, 78, 42, "main", 16)}
    </>
  );
}

function Kite() {
  return (
    <>
      {li("M0 70Q-24 92 0 108T0 146", "ink", 3)}
      {pa("M0 -64L42 0L0 72L-42 0z", "main")}
      {pa("M0 -64L42 0L0 72z", "alt")}
      {li("M0 -64V72M-42 0H42", "ink", 2.5, 0.6)}
      {pa("M-8 96l-14 -8v16z", "pop")}
      {pa("M8 124l14 -8v16z", "alt")}
    </>
  );
}

function Balloon({ tone = "main" }: { tone?: Tone }) {
  return (
    <>
      {li("M0 36Q-14 62 2 92", "ink", 3)}
      {el(0, -12, 32, 40, tone)}
      {pa("M-6 28L6 28L0 38z", tone)}
      {li("M-18 -24Q-14 -36 -4 -40", "soft", 5, 0.7)}
    </>
  );
}

function Bubble() {
  return (
    <>
      {ci(0, 0, 48, "soft", 0.3)}
      {ring(0, 0, 48, "soft", 4)}
      {li("M-28 -16Q-22 -32 -6 -36", "soft", 6)}
      {li("M24 24Q30 14 32 4", "main", 3, 0.7)}
    </>
  );
}

function Candle() {
  return (
    <>
      {ci(0, -50, 30, "pop", 0.22)}
      {re(-9, -24, 18, 66, "soft", 4)}
      {pa("M0 -62q12 16 0 28q-12 -12 0 -28z", "pop")}
      {el(0, 44, 28, 7, "ink")}
    </>
  );
}

function Jar() {
  return (
    <>
      {pa("M-36 -42H36V50Q36 72 14 72H-14Q-36 72 -36 50z", "soft", 0.42)}
      {re(-40, -58, 80, 18, "ink", 5)}
      {ci(-14, -6, 7, "pop")}
      {ci(14, 18, 7, "alt")}
      {ci(-6, 44, 6, "pop")}
      {ci(16, -22, 6, "alt")}
      {ci(-16, 24, 5, "soft")}
      {ci(-14, -6, 15, "pop", 0.25)}
      {ci(14, 18, 15, "alt", 0.25)}
    </>
  );
}

function Puzzle() {
  return (
    <>
      {re(-60, -52, 56, 56, "main", 6)}
      {re(2, -52, 56, 56, "alt", 6)}
      {re(-60, 10, 56, 56, "pop", 6)}
      {ci(-4, -24, 9, "main")}
      {ci(30, 6, 9, "alt")}
      {ci(-32, 8, 9, "pop")}
      <g transform="translate(84 40) rotate(18)">
        {re(-26, -26, 52, 52, "soft", 6)}
        {ci(0, -30, 9, "soft")}
        {ci(-30, 0, 9, "soft")}
      </g>
    </>
  );
}

function Splash() {
  return (
    <>
      {pa("M-64 0Q-42 -54 0 -42Q52 -64 64 -12Q84 42 22 46Q-20 74 -54 42Q-84 32 -64 0z", "main")}
      {ci(86, -44, 8, "main")}
      {ci(-90, 34, 6, "main")}
      {ci(70, 56, 5, "main")}
      {li("M70 -74L112 -116", "ink", 8)}
      {pa("M58 -66L78 -86L88 -76L68 -56z", "alt")}
    </>
  );
}

function Swing() {
  return (
    <>
      {li("M-74 74L-42 -64H42L74 74", "ink", 7)}
      {li("M-18 -64V32M18 -64V32", "ink", 3.5)}
      {re(-28, 30, 56, 10, "main", 4)}
    </>
  );
}

function Stand() {
  return (
    <>
      {re(-78, -46, 156, 30, "soft", 4)}
      {re(-78, -46, 26, 30, "main")}
      {re(-26, -46, 26, 30, "main")}
      {re(26, -46, 26, 30, "main")}
      {li("M-70 -16V60M70 -16V60", "ink", 6)}
      {re(-74, 12, 148, 10, "alt", 3)}
      {re(-66, 22, 132, 46, "main", 4)}
      {pa("M-14 -6H14V12H-14z", "soft")}
      {ci(0, 40, 14, "soft")}
    </>
  );
}

function Mirror() {
  return (
    <>
      {re(-7, 56, 14, 34, "main", 3)}
      {el(0, -6, 46, 62, "soft", 0.8)}
      <ellipse cx="0" cy="-6" rx="46" ry="62" fill="none" strokeWidth="9" style={stroke("main")} />
      {li("M-8 -58L4 -14L-16 18L6 56", "ink", 3.5)}
      {li("M4 -14L28 -22", "ink", 3)}
    </>
  );
}

function Whistle() {
  return (
    <>
      {li("M-46 -4Q-78 -34 -64 -66", "ink", 4)}
      {pa("M-46 -12H20Q54 -12 54 14Q54 42 20 42Q-6 42 -14 22H-46z", "main")}
      {ci(26, 16, 11, "soft")}
    </>
  );
}

function Waterball() {
  return (
    <>
      {el(0, 0, 36, 42, "main")}
      {pa("M-6 38L6 38L0 48z", "main")}
      {li("M-20 -14Q-16 -28 -4 -32", "soft", 5, 0.7)}
      {ci(54, -34, 6, "main")}
      {ci(-58, -22, 5, "main")}
      {ci(52, 36, 5, "main")}
      {li("M44 -4l14 -6M-44 8l-14 4M30 -40l6 -12", "main", 4)}
    </>
  );
}

function Piece() {
  return <Puzzle />;
}

function Chair() {
  return (
    <>
      {li("M-32 -66V6", "main", 10)}
      {li("M-34 6H34", "main", 12)}
      {li("M-26 12V64M28 12V64", "ink", 6)}
    </>
  );
}

function Desk() {
  return (
    <>
      {re(-92, 16, 184, 12, "alt", 3)}
      {re(-82, 28, 10, 46, "ink")}
      {re(72, 28, 10, 46, "ink")}
    </>
  );
}

function Tv() {
  return (
    <>
      {re(-74, -50, 148, 98, "ink", 11)}
      {re(-66, -42, 132, 82, "soft", 6)}
      {re(-66, -42, 44, 82, "main", 6, 0.8)}
      {re(-22, -42, 44, 82, "alt", 0, 0.8)}
      {re(-34, 48, 68, 9, "ink", 3)}
    </>
  );
}

function Remote() {
  return (
    <>
      {re(-16, -50, 32, 100, "main", 9)}
      {ci(0, -28, 8, "pop")}
      {ci(-6, -4, 5, "soft")}
      {ci(8, -4, 5, "soft")}
      {ci(-6, 14, 5, "soft")}
      {ci(8, 14, 5, "soft")}
      {ci(0, 34, 5, "alt")}
    </>
  );
}

function Curtains() {
  return (
    <>
      {pa("M0 -80L66 100H-66z", "soft", 0.28)}
      {pa("M-104 -92H-34Q-54 0 -38 92H-104z", "main")}
      {pa("M104 -92H34Q54 0 38 92H104z", "main")}
      {li(
        "M-80 -86Q-70 0 -78 88M-58 -86Q-52 0 -56 88M80 -86Q70 0 78 88M58 -86Q52 0 56 88",
        "alt",
        4,
        0.5,
      )}
      {re(-108, -104, 216, 22, "alt", 4)}
      {re(-108, 84, 216, 14, "ink", 3)}
    </>
  );
}

function Tag() {
  return (
    <>
      {li("M-30 -8Q-52 -54 -18 -64", "ink", 3)}
      {pa("M-50 -34H12L50 2L12 38H-50z", "main")}
      {ci(-32, -8, 6.5, "bg")}
      {li("M-14 -10H10M-14 6H0", "soft", 4, 0.8)}
    </>
  );
}

function Vase({ broken = false }: { broken?: boolean }) {
  if (broken) {
    return (
      <>
        {pa("M-70 56L-34 14L-18 56z", "main")}
        {pa("M-10 56L12 -6L34 56z", "main")}
        {pa("M44 56L58 30L76 56z", "alt")}
        {pa("M-48 56L-20 38L4 56z", "alt")}
        {li("M-24 56l-6 -14M12 20l8 14", "soft", 3, 0.6)}
      </>
    );
  }
  return (
    <>
      {pa("M-24 -64H24Q20 -30 42 0Q60 42 24 66H-24Q-60 42 -42 0Q-20 -30 -24 -64z", "main")}
      {re(-26, -72, 52, 12, "alt", 4)}
      {li("M-36 14Q0 28 36 14", "soft", 5, 0.7)}
    </>
  );
}

function Shop() {
  return (
    <>
      {re(-74, -40, 148, 104, "main", 6)}
      {re(-84, -54, 168, 28, "alt", 5)}
      {re(-84, -54, 28, 28, "soft", 0, 0.6)}
      {re(-28, -54, 28, 28, "soft", 0, 0.6)}
      {re(28, -54, 28, 28, "soft", 0, 0.6)}
      {re(-62, -12, 52, 44, "soft", 4)}
      {re(16, -12, 44, 76, "ink", 4)}
      {ci(52, 30, 3, "soft")}
    </>
  );
}

function Speech({ inner = "dots", tone = "soft" }: { inner?: string; tone?: Tone }) {
  return (
    <>
      {re(-66, -46, 132, 80, tone, 24)}
      {pa("M-28 30L-44 62L2 32z", tone)}
      {inner === "dots" && (
        <>
          {ci(-28, -6, 7, "ink")}
          {ci(0, -6, 7, "ink")}
          {ci(28, -6, 7, "ink")}
        </>
      )}
      {inner === "lines" && li("M-40 -18H40M-40 0H20M-40 18H8", "ink", 6, 0.55)}
      {inner === "heart" && (
        <g transform="translate(0 -4) scale(.45)">
          {pa("M0 44C-56 8 -52 -36 -24 -36Q-6 -36 0 -16Q6 -36 24 -36C52 -36 56 8 0 44z", "pop")}
        </g>
      )}
      {inner === "x" && li("M-18 -22L18 14M18 -22L-18 14", "pop", 9)}
      {inner === "check" && li("M-24 -4l16 16 32 -34", "main", 9)}
      {inner === "question" && (
        <g transform="translate(0 -6) scale(.45)">
          {li("M-16 -22a18 18 0 1 1 25 16q-9 7 -9 22", "ink", 11)}
          {ci(0, 40, 7, "ink")}
        </g>
      )}
      {inner === "blank" && li("M-40 -6H40", "ink", 4, 0.25)}
    </>
  );
}

function Controller() {
  return (
    <>
      {pa(
        "M-62 12Q-72 -30 -34 -36H34Q72 -30 62 12L52 40Q44 48 32 34L22 22H-22L-32 34Q-44 48 -52 40z",
        "ink",
      )}
      {re(-46, -14, 24, 8, "soft", 2)}
      {re(-38, -22, 8, 24, "soft", 2)}
      {ci(34, -12, 7.5, "main")}
      {ci(48, 0, 7.5, "alt")}
      {ci(22, 0, 7.5, "pop")}
      {ci(34, 12, 7.5, "soft")}
    </>
  );
}

function Skyline() {
  const windows: ReactNode[] = [];
  for (const [bx, by, bw, bh] of [
    [-104, -20, 40, 84],
    [-58, -66, 46, 130],
    [-6, -40, 38, 104],
    [38, -84, 42, 148],
    [86, -34, 36, 98],
  ] as const) {
    for (let y = by + 14; y < by + bh - 12; y += 22) {
      for (let x = bx + 8; x < bx + bw - 8; x += 16) {
        windows.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="8"
            height="10"
            rx="2"
            style={fill("soft")}
            opacity=".7"
          />,
        );
      }
    }
  }
  return (
    <>
      {re(-104, -20, 40, 84, "main", 3)}
      {re(-58, -66, 46, 130, "alt", 3)}
      {re(-6, -40, 38, 104, "main", 3)}
      {re(38, -84, 42, 148, "ink", 3, 0.85)}
      {re(86, -34, 36, 98, "alt", 3)}
      {windows}
    </>
  );
}

function Suitcase() {
  return (
    <>
      {li("M-18 -38V-56H18V-38", "ink", 7)}
      {re(-54, -38, 108, 84, "main", 11)}
      {re(-32, -38, 9, 84, "alt")}
      {re(23, -38, 9, 84, "alt")}
      {ci(-4, 4, 9, "pop")}
      {re(-40, 46, 10, 10, "ink", 3)}
      {re(30, 46, 10, 10, "ink", 3)}
    </>
  );
}

function Plane() {
  return (
    <>
      {li("M-130 26Q-110 18 -88 8", "soft", 4, 0.7, "2 10")}
      {pa("M-12 0L-44 -58H-24L24 0z", "main")}
      {pa("M-12 0L-44 58H-24L24 0z", "main")}
      {pa("M-64 0L-82 -26H-68L-46 0z", "alt")}
      {pa("M-64 0L-82 26H-68L-46 0z", "alt")}
      {el(0, 0, 76, 13, "soft")}
      {ci(60, -2, 4, "ink")}
    </>
  );
}

function Globe() {
  return (
    <>
      {ci(0, 0, 54, "main")}
      {pa("M-30 -22Q-10 -40 6 -24Q14 -6 -4 -2Q-14 14 -32 6Q-42 -8 -30 -22z", "alt")}
      {pa("M18 10Q36 6 40 26Q30 44 18 38Q8 26 18 10z", "alt")}
      {li("M0 -54Q-34 0 0 54M-54 0H54", "soft", 2.5, 0.6)}
      {re(-4, 54, 8, 16, "ink")}
      {re(-26, 68, 52, 8, "ink", 3)}
    </>
  );
}

function Flag() {
  const cells: ReactNode[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={-70 + c * 14}
          y={-62 + r * 14}
          width="14"
          height="14"
          style={fill((r + c) % 2 === 0 ? "ink" : "soft")}
        />,
      );
    }
  }
  return (
    <>
      {li("M-74 76V-66M74 76V-66", "ink", 7)}
      {cells}
    </>
  );
}

function Tooth() {
  return (
    <>
      <path
        d="M-42 -32Q-42 -56 -18 -56Q0 -46 18 -56Q42 -56 42 -32Q42 -4 30 8Q28 60 14 60Q4 60 2 22H-2Q-4 60 -14 60Q-28 60 -30 8Q-42 -4 -42 -32z"
        style={fill("soft")}
        strokeWidth="4"
      />
      {li("M-22 -34Q-14 -42 -4 -38", "main", 5, 0.6)}
    </>
  );
}

function Magnifier() {
  return (
    <>
      {ci(-8, -8, 42, "soft", 0.45)}
      {ring(-8, -8, 42, "main", 10)}
      {li("M24 24L62 62", "ink", 13)}
      {li("M-30 -26Q-22 -38 -8 -40", "soft", 5, 0.8)}
    </>
  );
}

function TrailSign() {
  return (
    <>
      {re(-5, -40, 10, 110, "ink", 3)}
      {re(-40, -54, 76, 26, "alt", 4)}
      {li("M-26 -41H20M20 -41l-9 -8M20 -41l-9 8", "soft", 4)}
      {re(-2, -18, 52, 22, "main", 4)}
    </>
  );
}

function Megaphone() {
  return (
    <>
      {pa("M-48 -22H-12L52 -58V58L-12 22H-48z", "main")}
      {re(-36, 22, 20, 36, "ink", 5)}
      {li("M70 -26q16 26 0 52M86 -40q26 40 0 80", "soft", 5)}
    </>
  );
}

function Laptop() {
  return (
    <>
      {re(-58, -54, 116, 90, "ink", 8)}
      {re(-50, -46, 100, 74, "soft", 4)}
      {li("M-34 -28H20M-34 -14H34M-34 0H6", "main", 5, 0.7)}
      {re(-78, 36, 156, 11, "main", 5)}
    </>
  );
}

function Notebook() {
  return (
    <>
      {re(-42, -56, 84, 112, "main", 7)}
      {re(-22, -36, 52, 30, "soft", 4)}
      {li("M-42 -34h-8M-42 -14h-8M-42 6h-8M-42 26h-8", "ink", 4)}
      {li("M-12 -24H22", "ink", 3.5, 0.5)}
    </>
  );
}

function Wheel() {
  return (
    <>
      {ci(0, 4, 58, "soft")}
      {pa("M0 4L0 -54A58 58 0 0 1 56 14z", "main", 0.9)}
      {pa("M0 4L56 14A58 58 0 0 1 -22 56z", "alt", 0.9)}
      {pa("M0 4L-22 56A58 58 0 0 1 -58 -6z", "pop", 0.9)}
      {ring(0, 4, 58, "ink", 5)}
      {ci(0, 4, 9, "ink")}
      {pa("M0 -62L-10 -84H10z", "ink")}
    </>
  );
}

function Drawer() {
  return (
    <>
      {re(-62, -52, 124, 114, "main", 8)}
      {re(-52, -42, 104, 48, "alt", 5)}
      {re(-52, 12, 104, 42, "alt", 5)}
      {ci(0, -18, 5.5, "soft")}
      {ci(0, 33, 5.5, "soft")}
    </>
  );
}

function Bulb() {
  return (
    <>
      {li("M0 -78V-94M-52 -52l-12 -10M52 -52l12 -10M-70 -8H-88M70 -8H88", "main", 5)}
      {ci(0, -12, 40, "soft")}
      {re(-16, 22, 32, 24, "ink", 5)}
      {li("M-12 -10l12 16 12 -16", "pop", 5)}
    </>
  );
}

function Bricks() {
  const rows: ReactNode[] = [];
  for (let r = 0; r < 6; r += 1) {
    for (let c = -3; c < 4; c += 1) {
      const x = c * 48 + (r % 2 === 0 ? 0 : 24) - 24;
      if (x < -120 || x > 90) continue;
      rows.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={-60 + r * 22}
          width="44"
          height="18"
          rx="2"
          style={fill((r + c) % 3 === 0 ? "alt" : "main")}
        />,
      );
    }
  }
  return <>{rows}</>;
}

function Calendar({ mark = false }: { mark?: boolean }) {
  const cells: ReactNode[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      cells.push(
        <rect
          key={`${r}${c}`}
          x={-36 + c * 20}
          y={-22 + r * 22}
          width="14"
          height="14"
          rx="3"
          style={fill("main")}
          opacity=".35"
        />,
      );
    }
  }
  return (
    <>
      {re(-54, -58, 108, 116, "soft", 8)}
      {re(-54, -58, 108, 28, "main", 8)}
      {li("M-28 -66V-50M28 -66V-50", "ink", 6)}
      {cells}
      {mark && li("M-20 6L-4 22M-4 6L-20 22", "pop", 5)}
      {mark && ring(28, 28, 13, "pop", 4)}
    </>
  );
}

function Briefcase() {
  return (
    <>
      {li("M-20 -32V-48H20V-32", "ink", 7)}
      {re(-58, -32, 116, 78, "main", 11)}
      {re(-58, 6, 116, 6, "ink", 0, 0.35)}
      {re(-9, -2, 18, 16, "soft", 3)}
    </>
  );
}

function Stairs() {
  return (
    <>
      {re(-96, 38, 64, 28, "main", 3)}
      {re(-32, 10, 64, 56, "alt", 3)}
      {re(32, -18, 64, 84, "main", 3)}
    </>
  );
}

function Chats() {
  return (
    <>
      {re(-78, -62, 100, 34, "soft", 17)}
      {li("M-58 -45h50", "ink", 5, 0.4)}
      {re(-24, -14, 100, 34, "main", 17)}
      {li("M-4 3h50", "soft", 5, 0.8)}
      {re(-78, 34, 88, 34, "alt", 17)}
      {li("M-58 51h44", "soft", 5, 0.8)}
      {ci(-96, -45, 9, "pop")}
      {ci(94, 3, 9, "ink")}
    </>
  );
}

function Pottery() {
  return (
    <>
      {el(0, 56, 64, 12, "alt")}
      {re(-10, 60, 20, 26, "ink")}
      {pa("M-30 -42H30Q22 -12 40 8Q50 36 24 56H-24Q-50 36 -40 8Q-22 -12 -30 -42z", "main")}
      {li("M-36 4Q0 18 36 4", "soft", 5, 0.7)}
    </>
  );
}

function Paper() {
  return (
    <>
      {re(-48, -62, 96, 124, "soft", 6)}
      {li("M-30 -40H30M-30 -22H30M-30 -4H12M-30 14H30M-30 32H4", "ink", 4, 0.4)}
      {li("M-30 -20q10 -14 20 0t20 0", "pop", 4)}
      {ring(26, 26, 14, "pop", 4)}
    </>
  );
}

function Ticks() {
  return (
    <>
      {li("M-30 6l14 14 24 -26", "main", 10)}
      {li("M-6 6l14 14 24 -26", "alt", 10)}
    </>
  );
}

function Ballot() {
  return (
    <>
      {re(-50, 0, 100, 62, "main", 6)}
      {re(-30, 8, 60, 9, "ink", 3)}
      {re(-24, -48, 48, 62, "soft", 4)}
      {li("M-12 -24l8 8 16 -18", "pop", 6)}
    </>
  );
}

function Dinner() {
  return (
    <>
      {el(0, 22, 110, 34, "alt")}
      {el(-56, 20, 24, 8, "soft")}
      {el(56, 20, 24, 8, "soft")}
      {el(0, 30, 28, 9, "soft")}
      {pa("M-22 10H22L16 22Q0 28 -16 22z", "main")}
      {li("M-8 2q-6 -10 0 -18M8 2q-6 -10 0 -18", "soft", 3.5)}
    </>
  );
}

function Guitar() {
  return (
    <g transform="rotate(-24)">
      {re(-8, -92, 16, 70, "ink", 6)}
      {re(-14, -108, 28, 22, "main", 6)}
      {ci(0, -4, 30, "alt")}
      {ci(0, 36, 42, "alt")}
      {ci(0, 36, 13, "ink")}
      {li("M-3 -80V30M3 -80V30", "soft", 1.8, 0.8)}
      {re(-18, 62, 36, 6, "ink", 3)}
    </g>
  );
}

function GradCap() {
  return (
    <>
      {pa("M-26 4V26Q0 40 26 26V4L0 16z", "ink")}
      {pa("M-52 -6L0 -30L52 -6L0 18z", "ink")}
      {li("M44 -4V24", "pop", 4)}
      {ci(44, 28, 5, "pop")}
    </>
  );
}

function Rings() {
  return (
    <>
      {ring(-18, 0, 34, "main", 10)}
      {ring(18, 0, 34, "alt", 10)}
      <g transform="translate(46 -44) scale(.6)">
        {pa("M0 -26Q5 -5 26 0Q5 5 0 26Q-5 5 -26 0Q-5 -5 0 -26z", "soft")}
      </g>
    </>
  );
}

function Sticky() {
  return (
    <g transform="rotate(8)">
      {re(-34, -34, 68, 68, "pop", 4)}
      {li("M-20 -14H20M-20 2H20M-20 18H0", "soft", 5, 0.9)}
    </g>
  );
}

function FoilCube() {
  return (
    <>
      {re(-38, -44, 76, 76, "soft", 8)}
      {li("M-28 24L-6 -34M-4 28L22 -36M18 30L32 -4", "main", 7, 0.5)}
      {re(-38, 32, 76, 6, "ink", 2, 0.3)}
    </>
  );
}

function Cart() {
  return (
    <>
      {li("M-84 -52H-64L-46 38H58L76 -28", "ink", 7)}
      {pa("M-58 -26H70L56 28H-44z", "main")}
      {ci(-14, -42, 14, "pop")}
      {ci(22, -44, 12, "alt")}
      {re(40, -58, 20, 30, "soft", 3)}
      {ci(-28, 62, 9, "ink")}
      {ci(46, 62, 9, "ink")}
    </>
  );
}

function Shelves() {
  const items: ReactNode[] = [];
  const tones: Tone[] = ["main", "alt", "pop", "soft"];
  [-58, -2, 54].forEach((y, row) => {
    for (let c = 0; c < 8; c += 1) {
      const h = 30 + ((c * 7 + row * 5) % 14);
      items.push(
        <rect
          key={`${row}-${c}`}
          x={-108 + c * 27}
          y={y - h}
          width="21"
          height={h}
          rx="3"
          style={fill(tones[(c + row) % 4]!)}
        />,
      );
    }
  });
  return (
    <>
      {items}
      {re(-116, -58, 232, 8, "ink", 3)}
      {re(-116, -2, 232, 8, "ink", 3)}
      {re(-116, 54, 232, 8, "ink", 3)}
    </>
  );
}

function Bag() {
  return (
    <>
      {li("M-18 -22V-42a18 18 0 0 1 36 0V-22", "ink", 6)}
      {pa("M-42 -22H42L50 60Q50 72 38 72H-38Q-50 72 -50 60z", "main")}
      {li("M-26 6Q0 26 26 6", "soft", 5, 0.6)}
    </>
  );
}

function Receipt() {
  return (
    <>
      {pa("M-36 -72H36V72L26 64L16 72L6 64L-4 72L-14 64L-24 72L-36 64z", "soft")}
      {li("M-22 -52H22M-22 -34H22M-22 -16H8M-22 2H22M-22 20H4", "ink", 4, 0.45)}
    </>
  );
}

function Photos() {
  return (
    <>
      <g transform="translate(-30 0) rotate(-9)">
        {re(-54, -42, 108, 84, "soft", 4)}
        {re(-45, -33, 90, 62, "main", 2)}
        {pa("M-45 29L-12 -8L10 14L26 -2L45 29z", "alt")}
        {ci(24, -16, 8, "soft")}
      </g>
      <g transform="translate(46 12) rotate(8)">
        {re(-46, -36, 92, 72, "soft", 4)}
        {re(-38, -28, 76, 50, "alt", 2)}
        {ci(0, -8, 12, "soft")}
        {pa("M-20 22Q0 -4 20 22z", "soft")}
      </g>
    </>
  );
}

function Yoga() {
  return (
    <>
      {el(0, 62, 100, 12, "alt")}
      {el(0, 44, 50, 14, "main")}
      {pa("M-24 40Q-34 -8 0 -16Q34 -8 24 40z", "main")}
      {ci(0, -36, 18, "soft")}
      {pa("M-16 -42A18 18 0 0 1 16 -42Q0 -56 -16 -42z", "ink")}
      {li("M-26 -4Q-52 14 -34 36M26 -4Q52 14 34 36", "soft", 8)}
    </>
  );
}

function Checklist() {
  return (
    <>
      {re(-44, -64, 88, 128, "soft", 8)}
      {re(-16, -72, 32, 16, "main", 5)}
      {li("M-30 -30l6 6 12 -12M-30 0l6 6 12 -12M-30 30l6 6 12 -12", "pop", 4.5)}
      {re(-6, -30, 36, 6, "ink", 3, 0.45)}
      {re(-6, 0, 36, 6, "ink", 3, 0.45)}
      {re(-6, 30, 28, 6, "ink", 3, 0.45)}
    </>
  );
}

function Loop() {
  return (
    <>
      {li("M-44 0A44 44 0 0 1 32 -30", "main", 11)}
      {pa("M22 -52L56 -26L18 -14z", "main")}
      {li("M44 0A44 44 0 0 1 -32 30", "alt", 11)}
      {pa("M-22 52L-56 26L-18 14z", "alt")}
    </>
  );
}

function Coins() {
  return (
    <>
      {el(0, 40, 44, 12, "alt")}
      {re(-44, 22, 88, 18, "alt")}
      {el(0, 22, 44, 12, "soft")}
      {el(0, 4, 44, 12, "alt")}
      {re(-44, -14, 88, 18, "alt")}
      {el(0, -14, 44, 12, "soft")}
      {ci(64, 34, 20, "soft")}
      {ring(64, 34, 20, "alt", 4)}
    </>
  );
}

function Bench() {
  return (
    <>
      {re(-76, -26, 152, 12, "alt", 4)}
      {re(-76, 2, 152, 12, "alt", 4)}
      {re(-66, -26, 10, 78, "ink")}
      {re(56, -26, 10, 78, "ink")}
    </>
  );
}

function Hill() {
  return pa("M-120 40Q-40 -50 40 10Q80 30 120 4V70H-120z", "alt", 0.6);
}

function Banner() {
  const flags: ReactNode[] = [];
  const tones: Tone[] = ["main", "alt", "pop", "soft"];
  let i = 0;
  for (let x = -88; x <= 88; x += 22) {
    const y = -22 - 18 * (x / 100) ** 2;
    flags.push(
      <path
        key={x}
        d={`M${x - 10} ${y}L${x + 10} ${y}L${x} ${y + 28}z`}
        style={fill(tones[i % 4]!)}
      />,
    );
    i += 1;
  }
  return (
    <>
      {li("M-100 -40Q0 -4 100 -40", "ink", 3)}
      {flags}
    </>
  );
}

function Sandcastle() {
  return (
    <>
      {re(-62, -2, 124, 64, "alt", 5)}
      {re(-62, -42, 32, 44, "alt", 3)}
      {re(30, -42, 32, 44, "alt", 3)}
      {re(-18, -22, 36, 26, "alt", 3)}
      {li("M0 -22V-62", "ink", 4)}
      {pa("M0 -62h26l-9 9l9 9H0z", "pop")}
      {pa("M-13 62V38a13 13 0 0 1 26 0v24z", "ink", 0.6)}
    </>
  );
}

function Wave() {
  return pa("M-130 30q32 -34 65 0t65 0t65 0t65 0V90H-130z", "main", 0.75);
}

function Pond() {
  return (
    <>
      {el(0, 0, 118, 24, "main", 0.45)}
      {li("M-60 -2q10 -8 20 0M30 8q10 -8 20 0", "soft", 3, 0.6)}
    </>
  );
}

function Dock() {
  return (
    <>
      {re(-116, 0, 130, 10, "alt", 2)}
      {re(-106, 10, 8, 40, "ink")}
      {re(-40, 10, 8, 40, "ink")}
    </>
  );
}

function Rod() {
  return (
    <>
      {li("M-40 56L60 -64", "ink", 5)}
      {li("M60 -64V18", "soft", 2.5)}
      {ci(60, 24, 7, "pop")}
    </>
  );
}

function Puddle() {
  return (
    <>
      {el(0, 0, 72, 13, "alt", 0.5)}
      {li("M-30 0a30 6 0 0 1 60 0", "soft", 3, 0.7)}
    </>
  );
}

function Snowman() {
  return (
    <>
      {ci(0, 36, 36, "soft")}
      {ci(0, -16, 26, "soft")}
      {re(-20, -72, 40, 28, "ink", 4)}
      {re(-32, -48, 64, 9, "ink", 4)}
      {ci(-8, -22, 3.2, "ink")}
      {ci(8, -22, 3.2, "ink")}
      {pa("M0 -14l28 4l-28 6z", "alt")}
      {li("M-24 6Q0 16 24 6", "main", 9)}
      {ci(0, 30, 3.5, "ink")}
      {ci(0, 46, 3.5, "ink")}
    </>
  );
}

function Gate() {
  const posts: ReactNode[] = [];
  for (let x = -84; x <= 70; x += 28) {
    posts.push(
      <path key={x} d={`M${x} 66V-26L${x + 7} -40L${x + 14} -26V66z`} style={fill("soft")} />,
    );
  }
  return (
    <>
      {posts}
      {re(-92, -8, 190, 9, "alt", 3)}
      {re(-92, 34, 190, 9, "alt", 3)}
    </>
  );
}

function Nametag() {
  return (
    <>
      {re(-62, -38, 124, 76, "soft", 10)}
      {re(-62, -38, 124, 24, "main", 10)}
      {re(-62, -26, 124, 12, "main")}
      {re(-40, 0, 80, 8, "ink", 3, 0.7)}
      {re(-28, 16, 56, 6, "alt", 3)}
    </>
  );
}

function Runner() {
  return (
    <>
      {ci(10, -52, 15, "soft")}
      {pa("M-6 -34L26 -30L18 12L-8 8z", "main")}
      {li("M20 -26L48 -4L62 -16", "soft", 9)}
      {li("M-4 -30L-34 -12L-50 -26", "soft", 9)}
      {li("M-2 10L-22 44L-48 40", "ink", 10)}
      {li("M14 10L40 30L36 58", "ink", 10)}
    </>
  );
}

function Track() {
  return (
    <>
      {li("M-130 30H130M-130 56H130", "soft", 4, 0.7)}
      {li("M-110 66H110", "soft", 3, 0.5, "10 14")}
    </>
  );
}

// ---- the registry -----------------------------------------------------------------------------

export const PROPS: Record<string, () => ReactNode> = {
  person: () => <Person />,
  personAlt: () => <Person body="alt" />,
  personPop: () => <Person body="pop" />,
  dog: () => <Dog />,
  bird: () => <Bird />,
  turtle: () => <Turtle />,
  fish: () => <Fish />,
  spider: () => <Spider />,
  sun: () => <Sun />,
  moon: () => <Moon />,
  cloud: () => <Cloud />,
  darkCloud: () => <Cloud tone="main" />,
  tree: () => <Tree />,
  treeAlt: () => <Tree crown="alt" />,
  leaf: () => <Leaf />,
  sprout: () => <Sprout />,
  mountain: () => <Mountain />,
  rain: () => <Rain />,
  umbrella: () => <Umbrella />,
  umbrellaAlt: () => <Umbrella tone="alt" />,
  wind: () => <Wind />,
  flashlight: () => <Flashlight />,
  house: () => <House />,
  door: () => <Door />,
  window: () => <Window />,
  lamp: () => <Lamp />,
  busstop: () => <Busstop />,
  bus: () => <Bus />,
  bike: () => <Bike />,
  shoe: () => <Shoe />,
  boots: () => <Boots />,
  sock: () => <Sock />,
  key: () => <Key />,
  phone: () => <Phone />,
  mailbox: () => <Mailbox />,
  envelope: () => <Envelope />,
  book: () => <Book />,
  books: () => <Books />,
  openBook: () => <OpenBook />,
  clock: () => <Clock />,
  alarm: () => <Clock alarm />,
  star: () => <Star />,
  starPop: () => <Star tone="pop" />,
  sparkle: () => <Sparkle />,
  heart: () => <Heart />,
  heartAlt: () => <Heart tone="alt" />,
  note: () => <Note />,
  mic: () => <Mic />,
  cake: () => <Cake />,
  cakeLean: () => <Cake lean />,
  cakeCandles: () => <Cake candles={5} />,
  cupcake: () => <Cupcake />,
  cookie: () => <Cookie />,
  icecream: () => <Icecream />,
  glass: () => <Glass />,
  cup: () => <Cup />,
  cupEmpty: () => <CupEmpty />,
  plate: () => <Plate />,
  box: () => <Box />,
  question: () => <Question />,
  questionPop: () => <Question tone="pop" />,
  trophy: () => <Trophy />,
  medal: () => <Medal />,
  sofa: () => <Sofa />,
  zzz: () => <Zzz />,
  sleeper: () => <Sleeper />,
  kite: () => <Kite />,
  balloon: () => <Balloon />,
  balloonAlt: () => <Balloon tone="alt" />,
  balloonPop: () => <Balloon tone="pop" />,
  bubble: () => <Bubble />,
  candle: () => <Candle />,
  jar: () => <Jar />,
  puzzle: () => <Puzzle />,
  splash: () => <Splash />,
  swing: () => <Swing />,
  stand: () => <Stand />,
  mirror: () => <Mirror />,
  whistle: () => <Whistle />,
  waterball: () => <Waterball />,
  piece: () => <Piece />,
  chair: () => <Chair />,
  desk: () => <Desk />,
  tv: () => <Tv />,
  remote: () => <Remote />,
  curtains: () => <Curtains />,
  tag: () => <Tag />,
  vase: () => <Vase />,
  vaseBroken: () => <Vase broken />,
  shop: () => <Shop />,
  speech: () => <Speech inner="lines" />,
  speechDots: () => <Speech inner="dots" />,
  speechHeart: () => <Speech inner="heart" />,
  speechX: () => <Speech inner="x" />,
  speechCheck: () => <Speech inner="check" />,
  speechQuestion: () => <Speech inner="question" />,
  speechBlank: () => <Speech inner="blank" />,
  speechMain: () => <Speech inner="lines" tone="main" />,
  controller: () => <Controller />,
  skyline: () => <Skyline />,
  suitcase: () => <Suitcase />,
  plane: () => <Plane />,
  globe: () => <Globe />,
  flag: () => <Flag />,
  tooth: () => <Tooth />,
  magnifier: () => <Magnifier />,
  trailsign: () => <TrailSign />,
  megaphone: () => <Megaphone />,
  laptop: () => <Laptop />,
  notebook: () => <Notebook />,
  wheel: () => <Wheel />,
  drawer: () => <Drawer />,
  bulb: () => <Bulb />,
  bricks: () => <Bricks />,
  calendar: () => <Calendar />,
  calendarX: () => <Calendar mark />,
  briefcase: () => <Briefcase />,
  stairs: () => <Stairs />,
  chats: () => <Chats />,
  pottery: () => <Pottery />,
  paper: () => <Paper />,
  ticks: () => <Ticks />,
  ballot: () => <Ballot />,
  dinner: () => <Dinner />,
  guitar: () => <Guitar />,
  rings: () => <Rings />,
  gradCap: () => <GradCap />,
  sticky: () => <Sticky />,
  foilcube: () => <FoilCube />,
  cart: () => <Cart />,
  shelves: () => <Shelves />,
  bag: () => <Bag />,
  receipt: () => <Receipt />,
  photos: () => <Photos />,
  yoga: () => <Yoga />,
  checklist: () => <Checklist />,
  loop: () => <Loop />,
  coins: () => <Coins />,
  bench: () => <Bench />,
  hill: () => <Hill />,
  banner: () => <Banner />,
  sandcastle: () => <Sandcastle />,
  wave: () => <Wave />,
  pond: () => <Pond />,
  dock: () => <Dock />,
  rod: () => <Rod />,
  puddle: () => <Puddle />,
  snowman: () => <Snowman />,
  gate: () => <Gate />,
  nametag: () => <Nametag />,
  runner: () => <Runner />,
  track: () => <Track />,
};
