import type { ReactNode } from "react";

import { fill, palette, stroke, type Palette } from "@/components/words/word-cover-kit";

/**
 * The drawings of the third expansion's sixteen topics (src/data/word-lists/expansion-3.ts):
 * Kitchen, Bathroom, School Supplies, Garden, Beach, Restaurant, Library, Airport, Music, Gaming,
 * Space, Chemistry, Architecture, Psychology, Cybersecurity and Art Gallery. Same rules as the
 * other drawings (word-cover-art.tsx, word-cover-scenes.tsx): flat shapes in a 400 x 300 box,
 * painted only with the seven tones of the cover, nothing yellow. Space is the one dark cover:
 * a night sky is the one place a deep ground is the honest colour.
 */

export const NEW_PALETTES: Record<string, Palette> = {
  Kitchen: palette(["#f5e2d4", "#edcdb9", "#3d2a2a", "#2f8f8a", "#e0735a", "#fff6ee", "#6fa37a"]),
  Bathroom: palette(["#dbe8f4", "#c7daee", "#27406a", "#4f86c8", "#e2757f", "#ffffff", "#5fb8a8"]),
  "School Supplies": palette([
    "#dcefe4",
    "#c8e3d3",
    "#2a3b4a",
    "#e5644f",
    "#3f78c4",
    "#fff9f0",
    "#2fa38a",
  ]),
  Garden: palette(["#e0eed8", "#c9e0bf", "#2a4a2d", "#e4607a", "#3f9a5a", "#fbf6ee", "#8a6fd0"]),
  Beach: palette(["#d8ecf6", "#f2e2cd", "#1f4a66", "#e8654f", "#2f9ab5", "#fff6ec", "#f4936b"]),
  Restaurant: palette([
    "#f1ddd0",
    "#e6c8b6",
    "#3a2a30",
    "#b84a4a",
    "#6f8fa8",
    "#fbf4ee",
    "#e08a5c",
  ]),
  Library: palette(["#efe0d0", "#e4ccb5", "#3a2a24", "#8b5a3c", "#4a8a6f", "#fbf3ea", "#c0575a"]),
  Airport: palette(["#d6e6f4", "#c0d7ec", "#1f3550", "#3d78b8", "#ef6a4c", "#ffffff", "#ef6a4c"]),
  Music: palette(["#f6e0cf", "#eec9b0", "#3b2a38", "#7a5cc7", "#e8743b", "#fff7f1", "#2f9a8f"]),
  Gaming: palette(["#f3dce8", "#ebc7da", "#2a1f45", "#4b3fb0", "#e5588a", "#fff4fa", "#2fb8a0"]),
  Space: palette(["#2e3a78", "#3a4790", "#161c47", "#e8694d", "#8aa0f0", "#f3f4ff", "#f29b6b"]),
  Chemistry: palette(["#d5ebe8", "#bfdfdb", "#1f4a4f", "#2fa39a", "#8a6fd0", "#f2fbfa", "#e5588a"]),
  Architecture: palette([
    "#e8e0d6",
    "#dacfc0",
    "#2c3146",
    "#4f6fb5",
    "#c76f5a",
    "#fbf8f2",
    "#e8694d",
  ]),
  Psychology: palette([
    "#ead9ee",
    "#dfc8e6",
    "#3a2750",
    "#8a5fc0",
    "#e0708a",
    "#fbf3fd",
    "#3aa8a0",
  ]),
  Cybersecurity: palette([
    "#d3e9e2",
    "#bfdfd5",
    "#173d3a",
    "#2f9a78",
    "#e5594f",
    "#f2fbf8",
    "#3d78b8",
  ]),
  "Art Gallery": palette([
    "#f1e4dc",
    "#e6d3c6",
    "#33262e",
    "#d9694f",
    "#4a7fb5",
    "#fcf7f1",
    "#3f9a7a",
  ]),
};

/** A grid of small windows: `cols` x `rows` rectangles starting at (x, y). */
function windows(
  x: number,
  y: number,
  cols: number,
  rows: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number,
  opacity = 0.9,
): ReactNode {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * (w + gapX)}
          y={y + r * (h + gapY)}
          width={w}
          height={h}
          rx="2"
          opacity={opacity}
          style={fill("soft")}
        />,
      );
    }
  }
  return out;
}

/** A flower seen from the front: six round petals round a centre. */
function bloom(cx: number, cy: number, r: number, petal: "main" | "soft" | "pop") {
  return (
    <g key={`${cx}-${cy}`}>
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={cx + Math.cos((angle * Math.PI) / 180) * r * 1.25}
          cy={cy + Math.sin((angle * Math.PI) / 180) * r * 1.25}
          r={r * 0.78}
          style={fill(petal)}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.62} style={fill(petal === "soft" ? "main" : "soft")} />
    </g>
  );
}

function Kitchen() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="92" y="40" width="216" height="6" rx="3" style={fill("ink")} />
      {[130, 170, 230, 270].map((x) => (
        <circle key={x} cx={x} cy="46" r="4" style={fill("ink")} />
      ))}
      <rect x="128" y="48" width="4" height="52" rx="2" style={fill("ink")} />
      <circle cx="130" cy="110" r="14" style={fill("alt")} />
      <circle cx="130" cy="110" r="7" opacity=".6" style={fill("soft")} />
      <rect x="168" y="48" width="4" height="34" rx="2" style={fill("ink")} />
      <rect x="159" y="80" width="22" height="30" rx="5" style={fill("pop")} />
      <rect x="228" y="48" width="4" height="30" rx="2" style={fill("ink")} />
      <ellipse cx="230" cy="98" rx="13" ry="22" fill="none" strokeWidth="3" style={stroke("ink")} />
      <ellipse cx="230" cy="98" rx="5" ry="22" fill="none" strokeWidth="3" style={stroke("ink")} />
      <rect x="268" y="48" width="4" height="44" rx="2" style={fill("ink")} />
      <ellipse cx="270" cy="106" rx="10" ry="15" style={fill("alt")} />
      <rect x="86" y="190" width="22" height="12" rx="6" style={fill("ink")} />
      <rect x="292" y="190" width="22" height="12" rx="6" style={fill("ink")} />
      <path
        d="M106 176H294V226A24 24 0 0 1 270 250H130A24 24 0 0 1 106 226Z"
        style={fill("main")}
      />
      <rect x="124" y="196" width="8" height="40" rx="4" opacity=".35" style={fill("soft")} />
      <path d="M114 176Q200 100 286 176Z" style={fill("alt")} />
      <rect x="108" y="172" width="184" height="9" rx="4.5" style={fill("ink")} />
      <circle cx="200" cy="120" r="9" style={fill("soft")} />
      <rect x="196" y="126" width="8" height="8" style={fill("ink")} />
      <rect x="44" y="212" width="38" height="38" rx="7" style={fill("soft")} />
      <path d="M82 222h8a8 8 0 0 1 0 16h-8" fill="none" strokeWidth="5" style={stroke("soft")} />
      <path
        d="M54 200c-6-8 6-12 0-20M70 200c-6-8 6-12 0-20"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".35"
        style={stroke("ink")}
      />
      <rect x="318" y="208" width="36" height="42" rx="8" style={fill("soft")} />
      <rect x="314" y="198" width="44" height="14" rx="5" style={fill("pop")} />
      <rect x="326" y="224" width="20" height="14" rx="3" opacity=".85" style={fill("alt")} />
    </>
  );
}

function Bathroom() {
  return (
    <>
      <circle cx="200" cy="140" r="116" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="288" y="80" width="76" height="6" rx="3" style={fill("ink")} />
      <rect x="304" y="86" width="48" height="70" rx="5" style={fill("alt")} />
      <path
        d="M304 108H352M304 124H352"
        fill="none"
        strokeWidth="4"
        opacity=".6"
        style={stroke("soft")}
      />
      <path
        d="M36 100H92Q104 100 104 112V126"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <rect x="92" y="124" width="24" height="10" rx="3" style={fill("ink")} />
      <path d="M64 100V88" fill="none" strokeWidth="5" style={stroke("ink")} />
      <circle cx="64" cy="82" r="9" style={fill("pop")} />
      <path d="M104 142q-6 9 0 14q6-5 0-14z" style={fill("main")} />
      <path d="M80 172H320V200A44 44 0 0 1 276 244H124A44 44 0 0 1 80 200Z" style={fill("main")} />
      <rect x="100" y="198" width="200" height="6" rx="3" opacity=".35" style={fill("soft")} />
      <path d="M128 246l-6 12h24l-4-12z" style={fill("ink")} />
      <path d="M272 246l-4 12h24l-6-12z" style={fill("ink")} />
      {[
        [126, 152, 20],
        [162, 138, 26],
        [204, 126, 30],
        [246, 136, 26],
        [282, 150, 20],
        [150, 160, 16],
        [238, 158, 16],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={fill("soft")} />
      ))}
      <rect x="72" y="164" width="256" height="14" rx="7" style={fill("soft")} />
      {[
        [176, 86, 10],
        [240, 84, 13],
        [214, 58, 7],
        [270, 56, 8],
      ].map(([cx, cy, r]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth="3"
          opacity=".9"
          style={{ ...fill("soft"), ...stroke("main") }}
        />
      ))}
    </>
  );
}

function SchoolSupplies() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <g transform="rotate(-30 190 210)">
        <rect x="176" y="52" width="26" height="160" rx="3" style={fill("soft")} />
        <path
          d="M176 70h10M176 84h6M176 98h10M176 112h6M176 126h10M176 140h6M176 154h10"
          fill="none"
          strokeWidth="2.5"
          style={stroke("ink")}
        />
      </g>
      <g transform="rotate(-12 205 200)">
        <rect x="196" y="62" width="18" height="140" style={fill("main")} />
        <polygon points="196,62 205,34 214,62" style={fill("soft")} />
        <polygon points="201,46 205,34 209,46" style={fill("ink")} />
        <rect x="196" y="176" width="18" height="8" style={fill("alt")} />
      </g>
      <g transform="rotate(10 225 200)">
        <rect x="216" y="72" width="18" height="130" style={fill("alt")} />
        <polygon points="216,72 225,44 234,72" style={fill("soft")} />
        <polygon points="221,56 225,44 229,56" style={fill("ink")} />
        <rect x="216" y="86" width="18" height="8" style={fill("main")} />
      </g>
      <g transform="rotate(30 232 205)">
        <rect x="229" y="86" width="6" height="110" rx="3" style={fill("ink")} />
        <path d="M222 86Q232 38 242 86Z" style={fill("main")} />
        <rect x="224" y="80" width="16" height="10" rx="2" style={fill("soft")} />
      </g>
      <rect x="146" y="164" width="108" height="88" rx="16" style={fill("pop")} />
      <rect x="146" y="196" width="108" height="18" opacity=".5" style={fill("soft")} />
      <circle cx="200" cy="232" r="9" style={fill("alt")} />
      <g transform="rotate(-8 300 236)">
        <rect x="276" y="222" width="48" height="26" rx="5" style={fill("soft")} />
        <path d="M276 236H324V243Q324 248 319 248H281Q276 248 276 243Z" style={fill("alt")} />
      </g>
      <rect x="76" y="226" width="38" height="24" rx="6" style={fill("main")} />
      <circle cx="94" cy="238" r="5" style={fill("ink")} />
    </>
  );
}

function Garden() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <path d="M60 268Q200 230 340 268V300H60Z" opacity=".82" style={fill("ink")} />
      <path
        d="M120 250l4-14 5 14M160 244l4-14 5 14M232 244l4-14 5 14M276 250l4-14 5 14"
        style={fill("alt")}
      />
      <path
        d="M112 262V198M186 258V146M264 262V190"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("alt")}
      />
      <path d="M112 238q-26-4-28-26q22-2 28 26z" style={fill("alt")} />
      <path d="M186 216q30-2 36-30q-28 2-36 30z" style={fill("alt")} />
      <path d="M186 238q-30-2-36-26q26 2 36 26z" style={fill("alt")} />
      <path d="M264 236q24-2 28-24q-22 2-28 24z" style={fill("alt")} />
      {bloom(112, 186, 11, "main")}
      {bloom(186, 126, 15, "soft")}
      {bloom(264, 176, 12, "main")}
      <path
        d="M44 78Q14 82 22 108Q26 116 44 112"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <rect x="44" y="56" width="72" height="60" rx="10" style={fill("pop")} />
      <rect x="50" y="50" width="60" height="10" rx="5" opacity=".35" style={fill("ink")} />
      <path
        d="M116 96L158 62"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <polygon points="146,50 176,72 168,84 138,62" style={fill("ink")} />
      <path
        d="M172 88l6 12M184 82l10 18M164 94l4 14"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        style={stroke("soft")}
      />
      <g transform="translate(310 92)">
        <ellipse
          cx="-13"
          cy="-9"
          rx="13"
          ry="18"
          transform="rotate(-24 -13 -9)"
          style={fill("pop")}
        />
        <ellipse
          cx="13"
          cy="-9"
          rx="13"
          ry="18"
          transform="rotate(24 13 -9)"
          style={fill("main")}
        />
        <ellipse cx="-9" cy="13" rx="8" ry="11" transform="rotate(18 -9 13)" style={fill("main")} />
        <ellipse cx="9" cy="13" rx="8" ry="11" transform="rotate(-18 9 13)" style={fill("pop")} />
        <rect x="-2" y="-16" width="4" height="34" rx="2" style={fill("ink")} />
        <path
          d="M-1 -16Q-8 -30 -14 -28M1 -16Q8 -30 14 -28"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          style={stroke("ink")}
        />
      </g>
    </>
  );
}

function Beach() {
  return (
    <>
      <g transform="translate(322 66)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect
            key={angle}
            x="-2"
            y="-54"
            width="4"
            height="10"
            rx="2"
            transform={`rotate(${angle})`}
            style={fill("pop")}
          />
        ))}
        <circle r="30" style={fill("pop")} />
      </g>
      <path
        d="M48 86h70a16 16 0 0 0 0-32 24 24 0 0 0-46-6 20 20 0 0 0-24 38z"
        opacity=".9"
        style={fill("soft")}
      />
      <path
        d="M60 40q8-8 16 0q8-8 16 0"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <path d="M0 190Q50 176 100 190T200 190T300 190T400 190V300H0Z" style={fill("alt")} />
      <path
        d="M0 214Q50 200 100 214T200 214T300 214T400 214"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".8"
        style={stroke("soft")}
      />
      <path d="M240 178H300L292 188H248Z" style={fill("ink")} />
      <rect x="270" y="138" width="3" height="40" style={fill("ink")} />
      <polygon points="268,142 268,176 246,176" style={fill("soft")} />
      <polygon points="275,150 275,176 296,176" style={fill("main")} />
      <path d="M0 244Q120 222 240 238T400 232V300H0Z" style={fill("tint")} />
      <path
        d="M204 96L218 266"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <path
        d="M104 132Q112 66 200 60Q288 66 296 132Q273 118 250 132Q225 118 200 132Q175 118 150 132Q127 118 104 132Z"
        style={fill("main")}
      />
      <path d="M200 60Q172 76 150 132Q175 118 200 132Z" style={fill("soft")} />
      <path d="M200 60Q228 76 250 132Q225 118 200 132Z" style={fill("soft")} />
      <circle cx="200" cy="58" r="5" style={fill("ink")} />
      <g transform="rotate(-4 215 260)">
        <rect x="150" y="252" width="130" height="16" rx="3" style={fill("soft")} />
        <rect x="172" y="252" width="12" height="16" style={fill("pop")} />
        <rect x="196" y="252" width="12" height="16" style={fill("pop")} />
        <rect x="220" y="252" width="12" height="16" style={fill("pop")} />
      </g>
      <circle cx="92" cy="250" r="22" style={fill("soft")} />
      <path d="M92 228A22 22 0 0 1 114 250L92 250Z" style={fill("main")} />
      <path d="M92 272A22 22 0 0 1 70 250L92 250Z" style={fill("alt")} />
      <circle cx="92" cy="250" r="4" style={fill("ink")} />
      <polygon
        points="320,238 324.1,248.3 335.2,249.1 326.7,256.2 329.4,266.9 320,261 310.6,266.9 313.3,256.2 304.8,249.1 315.9,248.3"
        style={fill("pop")}
      />
    </>
  );
}

function Restaurant() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect x="198" width="4" height="34" style={fill("ink")} />
      <path d="M164 62Q164 36 200 34Q236 36 236 62Z" style={fill("pop")} />
      <rect x="160" y="60" width="80" height="6" rx="3" style={fill("ink")} />
      <rect y="238" width="400" height="62" style={fill("main")} />
      <rect y="262" width="400" height="8" opacity=".3" style={fill("soft")} />
      <ellipse cx="200" cy="238" rx="106" ry="14" style={fill("soft")} />
      <ellipse cx="200" cy="238" rx="84" ry="8" opacity=".5" style={fill("tint")} />
      <path d="M122 234Q122 120 200 118Q278 120 278 234Z" style={fill("alt")} />
      <path
        d="M140 220Q140 150 186 136"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".55"
        style={stroke("soft")}
      />
      <circle cx="200" cy="108" r="10" style={fill("soft")} />
      <rect x="196" y="114" width="8" height="8" style={fill("ink")} />
      <rect x="44" y="148" width="4" height="34" rx="2" style={fill("soft")} />
      <rect x="54" y="148" width="4" height="34" rx="2" style={fill("soft")} />
      <rect x="64" y="148" width="4" height="34" rx="2" style={fill("soft")} />
      <path d="M42 180Q42 198 56 198Q70 198 70 180Z" style={fill("soft")} />
      <rect x="52" y="196" width="8" height="56" rx="4" style={fill("soft")} />
      <path d="M338 148Q356 152 356 192H338Z" style={fill("soft")} />
      <rect x="338" y="190" width="14" height="62" rx="5" style={fill("soft")} />
    </>
  );
}

function Library() {
  const row = (
    base: number,
    books: ReadonlyArray<readonly [number, number, number, "soft" | "pop" | "alt" | "tint"]>,
  ) =>
    books.map(([x, w, h, tone]) => (
      <rect
        key={`${base}-${x}`}
        x={x}
        y={base - h}
        width={w}
        height={h}
        rx="2"
        style={fill(tone)}
      />
    ));
  return (
    <>
      <circle cx="200" cy="150" r="120" style={fill("tint")} />
      <rect y="252" width="400" height="48" style={fill("tint")} />
      <rect x="82" y="46" width="236" height="210" rx="8" style={fill("main")} />
      <rect x="96" y="60" width="208" height="182" rx="3" opacity=".88" style={fill("ink")} />
      <rect x="96" y="122" width="208" height="8" style={fill("main")} />
      <rect x="96" y="184" width="208" height="8" style={fill("main")} />
      {row(122, [
        [102, 16, 46, "pop"],
        [118, 12, 38, "alt"],
        [130, 18, 52, "soft"],
        [148, 14, 42, "tint"],
        [162, 20, 56, "alt"],
        [182, 12, 44, "pop"],
        [194, 18, 50, "soft"],
        [212, 14, 40, "pop"],
        [226, 20, 54, "tint"],
        [246, 14, 44, "alt"],
        [260, 18, 50, "pop"],
        [278, 14, 36, "soft"],
      ])}
      <g transform="rotate(14 292 122)">
        <rect x="280" y="76" width="14" height="46" rx="2" style={fill("alt")} />
      </g>
      <rect x="104" y="162" width="28" height="22" rx="4" style={fill("pop")} />
      <path
        d="M118 162q-14-14-4-28q10 8 4 28zM118 162q14-12 8-30q-12 10-8 30z"
        style={fill("alt")}
      />
      {row(184, [
        [142, 14, 44, "soft"],
        [156, 18, 50, "pop"],
        [174, 12, 40, "alt"],
        [186, 20, 46, "tint"],
        [206, 14, 52, "alt"],
        [220, 16, 38, "soft"],
      ])}
      <rect x="240" y="176" width="58" height="8" rx="1.5" style={fill("pop")} />
      <rect x="244" y="168" width="50" height="8" rx="1.5" style={fill("alt")} />
      <rect x="238" y="160" width="56" height="8" rx="1.5" style={fill("soft")} />
      {row(242, [
        [102, 18, 48, "alt"],
        [120, 14, 42, "soft"],
        [134, 20, 52, "pop"],
        [154, 12, 40, "tint"],
        [166, 16, 46, "alt"],
        [182, 14, 50, "soft"],
        [196, 18, 38, "pop"],
      ])}
      <circle cx="254" cy="222" r="18" style={fill("soft")} />
      <path
        d="M236 222Q254 212 272 222M236 222Q254 232 272 222"
        fill="none"
        strokeWidth="2"
        opacity=".5"
        style={stroke("ink")}
      />
      <rect x="250" y="238" width="8" height="4" style={fill("tint")} />
      <rect x="282" y="206" width="14" height="36" rx="2" style={fill("alt")} />
    </>
  );
}

function Airport() {
  return (
    <>
      <circle cx="262" cy="104" r="86" style={fill("tint")} />
      <path
        d="M30 62h54a14 14 0 0 0 0-28 20 20 0 0 0-38-4 16 16 0 0 0-16 32z"
        opacity=".95"
        style={fill("soft")}
      />
      <rect y="252" width="400" height="48" style={fill("ink")} />
      <path
        d="M20 276H70M110 276H160M200 276H250M290 276H340"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        style={stroke("soft")}
      />
      <path d="M76 252L84 112H104L112 252Z" style={fill("main")} />
      <path d="M62 112H126L118 86H70Z" style={fill("soft")} />
      <rect x="70" y="92" width="48" height="8" opacity=".8" style={fill("main")} />
      <rect x="66" y="82" width="56" height="8" rx="3" style={fill("ink")} />
      <rect x="92" y="52" width="4" height="30" style={fill("ink")} />
      <circle cx="94" cy="50" r="5" style={fill("pop")} />
      <path d="M44 252V222H140V252Z" style={fill("alt")} />
      <rect x="54" y="232" width="14" height="10" rx="2" style={fill("soft")} />
      <rect x="76" y="232" width="14" height="10" rx="2" style={fill("soft")} />
      <rect x="112" y="232" width="14" height="20" rx="2" style={fill("ink")} />
      <g transform="translate(258 150) rotate(-16)">
        <path
          d="M-130 8H-102"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="1 12"
          style={stroke("main")}
        />
        <polygon points="-70,-4 -88,-48 -62,-48 -42,-8" style={fill("pop")} />
        <polygon points="-2,-14 -20,-44 4,-44 26,-14" opacity=".75" style={fill("main")} />
        <path
          d="M-84 0Q-84 -18 -52 -18H62Q96 -12 100 0Q96 12 62 16H-52Q-84 16 -84 0Z"
          style={fill("soft")}
        />
        <path d="M-82 6H96Q92 14 62 16H-52Q-80 14 -82 6Z" opacity=".9" style={fill("tint")} />
        <path d="M70 -14Q92 -10 98 0H74Z" style={fill("main")} />
        {[-40, -22, -4, 14, 32, 50].map((x) => (
          <circle key={x} cx={x} cy="-4" r="4" style={fill("main")} />
        ))}
        <polygon points="-14,6 -42,52 -16,52 32,8" style={fill("main")} />
        <ellipse cx="2" cy="26" rx="14" ry="7" style={fill("ink")} />
      </g>
    </>
  );
}

function Music() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <circle cx="200" cy="196" r="74" style={fill("ink")} />
      {[62, 52, 42].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="196"
          r={r}
          fill="none"
          strokeWidth="2"
          opacity=".18"
          style={stroke("soft")}
        />
      ))}
      <path
        d="M148 150A74 74 0 0 1 200 122"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".28"
        style={stroke("soft")}
      />
      <circle cx="200" cy="196" r="24" style={fill("alt")} />
      <circle cx="200" cy="196" r="5" style={fill("soft")} />
      <path
        d="M92 174V150A108 108 0 0 1 308 150V174"
        fill="none"
        strokeWidth="14"
        strokeLinecap="round"
        style={stroke("main")}
      />
      <rect x="70" y="150" width="44" height="92" rx="20" style={fill("main")} />
      <rect x="106" y="160" width="16" height="72" rx="8" style={fill("alt")} />
      <rect x="286" y="150" width="44" height="92" rx="20" style={fill("main")} />
      <rect x="278" y="160" width="16" height="72" rx="8" style={fill("alt")} />
      <ellipse
        cx="160"
        cy="106"
        rx="9"
        ry="7"
        transform="rotate(-20 160 106)"
        style={fill("pop")}
      />
      <rect x="167" y="70" width="4" height="36" style={fill("pop")} />
      <path d="M171 70q14 4 14 18q-6-8-14-8z" style={fill("pop")} />
      <ellipse
        cx="222"
        cy="104"
        rx="9"
        ry="7"
        transform="rotate(-20 222 104)"
        style={fill("pop")}
      />
      <ellipse cx="250" cy="98" rx="9" ry="7" transform="rotate(-20 250 98)" style={fill("pop")} />
      <rect x="229" y="64" width="4" height="40" style={fill("pop")} />
      <rect x="257" y="58" width="4" height="40" style={fill("pop")} />
      <path d="M229 64L261 58V68L229 74Z" style={fill("pop")} />
    </>
  );
}

function Gaming() {
  const heart = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  return (
    <>
      <circle cx="200" cy="160" r="116" style={fill("tint")} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${127 + i * 52} 46)`}>
          {heart.flatMap((line, r) =>
            [...line].map((cell, c) =>
              cell === "1" ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * 6}
                  y={r * 6}
                  width="6.2"
                  height="6.2"
                  style={fill(i === 2 ? "soft" : "alt")}
                />
              ) : null,
            ),
          )}
        </g>
      ))}
      <rect x="96" y="108" width="56" height="16" rx="8" style={fill("ink")} />
      <rect x="248" y="108" width="56" height="16" rx="8" style={fill("ink")} />
      <path
        d="M112 124H288Q326 124 338 176Q352 238 322 252Q296 262 278 234L258 204H142L122 234Q104 262 78 252Q48 238 62 176Q74 124 112 124Z"
        style={fill("main")}
      />
      <path
        d="M112 130H288Q312 130 326 168"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".3"
        style={stroke("soft")}
      />
      <rect x="121" y="167" width="30" height="10" rx="3" style={fill("soft")} />
      <rect x="131" y="157" width="10" height="30" rx="3" style={fill("soft")} />
      <circle cx="264" cy="154" r="9" style={fill("pop")} />
      <circle cx="280" cy="170" r="9" style={fill("alt")} />
      <circle cx="264" cy="186" r="9" style={fill("soft")} />
      <circle cx="248" cy="170" r="9" opacity=".45" style={fill("ink")} />
      <circle cx="200" cy="160" r="11" style={fill("soft")} />
      <circle cx="200" cy="160" r="5" style={fill("main")} />
      <rect x="168" y="186" width="16" height="6" rx="3" opacity=".5" style={fill("ink")} />
      <rect x="216" y="186" width="16" height="6" rx="3" opacity=".5" style={fill("ink")} />
      <rect x="52" y="98" width="9" height="9" style={fill("pop")} />
      <rect x="338" y="92" width="9" height="9" style={fill("alt")} />
      <rect x="62" y="132" width="6" height="6" style={fill("alt")} />
      <rect x="346" y="130" width="6" height="6" style={fill("pop")} />
    </>
  );
}

function Space() {
  const sparkle = (x: number, y: number, s: number) => (
    <path
      key={`${x}-${y}`}
      d={`M${x} ${y - s}l${s * 0.28} ${s * 0.72} ${s * 0.72} ${s * 0.28} -${s * 0.72} ${s * 0.28} -${s * 0.28} ${s * 0.72} -${s * 0.28} -${s * 0.72} -${s * 0.72} -${s * 0.28} ${s * 0.72} -${s * 0.28}z`}
      style={fill("soft")}
    />
  );
  return (
    <>
      <circle cx="200" cy="150" r="124" opacity=".7" style={fill("tint")} />
      {[
        [40, 44, 2.5],
        [100, 120, 2],
        [362, 54, 3],
        [336, 238, 2],
        [58, 258, 2.5],
        [248, 36, 2],
        [152, 28, 2],
        [378, 162, 2],
        [20, 160, 2],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={fill("soft")} />
      ))}
      {sparkle(122, 60, 12)}
      {sparkle(330, 30, 9)}
      {sparkle(352, 214, 8)}
      <circle cx="62" cy="76" r="20" style={fill("soft")} />
      <circle cx="54" cy="70" r="4" opacity=".8" style={fill("tint")} />
      <circle cx="70" cy="84" r="3" opacity=".8" style={fill("tint")} />
      <g transform="translate(118 200) rotate(-20)">
        <path
          d="M-98 0A98 22 0 0 1 98 0"
          fill="none"
          strokeWidth="7"
          opacity=".45"
          style={stroke("soft")}
        />
        <circle r="58" style={fill("alt")} />
        <path
          d="M-54 -22Q0 -38 54 -22M-58 6Q0 -10 58 6M-48 32Q0 18 48 32"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          opacity=".3"
          style={stroke("soft")}
        />
        <path d="M-98 0A98 22 0 0 0 98 0" fill="none" strokeWidth="7" style={stroke("soft")} />
      </g>
      <g transform="translate(286 124) rotate(38)">
        <path d="M-14 50Q0 112 14 50Z" style={fill("pop")} />
        <path d="M-7 50Q0 88 7 50Z" style={fill("soft")} />
        <path d="M-28 14L-54 56L-28 46Z" style={fill("main")} />
        <path d="M28 14L54 56L28 46Z" style={fill("main")} />
        <path d="M0 -72Q28 -38 28 14V46H-28V14Q-28 -38 0 -72Z" style={fill("soft")} />
        <path d="M0 -72Q16 -52 22 -38H-22Q-16 -52 0 -72Z" style={fill("main")} />
        <rect x="-28" y="38" width="56" height="8" style={fill("main")} />
        <circle cy="-8" r="12" style={fill("ink")} />
        <circle cy="-8" r="8" style={fill("alt")} />
      </g>
    </>
  );
}

function Chemistry() {
  const tubes: ReadonlyArray<readonly [number, number, "main" | "alt" | "pop"]> = [
    [150, 150, "main"],
    [200, 118, "alt"],
    [250, 170, "pop"],
  ];
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      {tubes.map(([cx, top, tone]) => (
        <g key={cx}>
          <path d={`M${cx - 17} 70V214a17 17 0 0 0 34 0V70Z`} opacity=".92" style={fill("soft")} />
          <path d={`M${cx - 17} ${top}H${cx + 17}V214a17 17 0 0 1 -34 0Z`} style={fill(tone)} />
          <rect x={cx - 21} y="64" width="42" height="9" rx="4.5" style={fill("soft")} />
          <circle cx={cx - 5} cy={top + 30} r="4" opacity=".7" style={fill("soft")} />
          <circle cx={cx + 6} cy={top + 52} r="3" opacity=".7" style={fill("soft")} />
        </g>
      ))}
      <rect x="116" y="148" width="168" height="12" rx="3" style={fill("ink")} />
      <rect x="116" y="148" width="10" height="100" rx="3" style={fill("ink")} />
      <rect x="274" y="148" width="10" height="100" rx="3" style={fill("ink")} />
      <rect x="108" y="236" width="184" height="14" rx="4" style={fill("ink")} />
      <circle cx="150" cy="46" r="7" style={fill("pop")} />
      <circle cx="160" cy="28" r="4" style={fill("pop")} />
      <circle cx="248" cy="48" r="6" style={fill("alt")} />
      <circle cx="238" cy="30" r="3.5" style={fill("alt")} />
      <path
        d="M66 100L98 122M98 122L66 146"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <circle cx="66" cy="100" r="9" style={fill("alt")} />
      <circle cx="98" cy="122" r="13" style={fill("main")} />
      <circle cx="66" cy="146" r="9" style={fill("alt")} />
      <path
        d="M354 112L340 136.2H312L298 112L312 87.8H340Z"
        fill="none"
        strokeWidth="5"
        strokeLinejoin="round"
        style={stroke("main")}
      />
      <circle cx="326" cy="112" r="13" fill="none" strokeWidth="3" style={stroke("alt")} />
    </>
  );
}

function Architecture() {
  return (
    <>
      <circle cx="300" cy="84" r="46" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="60" y="144" width="72" height="8" rx="2" style={fill("ink")} />
      <rect x="64" y="150" width="64" height="102" style={fill("soft")} />
      {[0, 1, 2, 3].flatMap((r) =>
        [0, 1].map((c) => (
          <rect
            key={`a-${r}-${c}`}
            x={76 + c * 28}
            y={162 + r * 22}
            width="14"
            height="14"
            rx="2"
            opacity=".75"
            style={fill("main")}
          />
        )),
      )}
      <rect x="140" y="70" width="70" height="182" style={fill("main")} />
      <rect x="172" y="38" width="6" height="32" style={fill("ink")} />
      <circle cx="175" cy="36" r="4" style={fill("pop")} />
      {windows(152, 84, 3, 8, 12, 12, 8, 9)}
      <rect x="218" y="112" width="64" height="140" style={fill("alt")} />
      <rect x="230" y="100" width="40" height="14" style={fill("alt")} />
      {windows(228, 124, 3, 5, 12, 12, 6, 12, 0.85)}
      <rect x="340" y="46" width="10" height="206" style={fill("pop")} />
      <rect x="262" y="44" width="130" height="8" style={fill("pop")} />
      <rect x="372" y="36" width="22" height="24" rx="3" style={fill("ink")} />
      <path d="M345 44L300 30M345 44L370 30" fill="none" strokeWidth="3" style={stroke("ink")} />
      <path d="M300 52V98" fill="none" strokeWidth="2.5" style={stroke("ink")} />
      <rect x="292" y="98" width="16" height="10" rx="2" style={fill("ink")} />
      <rect x="282" y="108" width="40" height="7" rx="2" style={fill("main")} />
      <path
        d="M340 60L350 80L340 100L350 120L340 140L350 160L340 180L350 200L340 220L350 240"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity=".4"
        style={stroke("ink")}
      />
    </>
  );
}

function Psychology() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <rect y="252" width="400" height="48" style={fill("tint")} />
      <path
        d="M168 254V214Q118 198 118 142Q118 62 200 56Q284 54 294 130L310 164Q314 172 302 172H294V190Q294 204 278 208L254 212V254Z"
        style={fill("soft")}
      />
      {[
        [176, 118, 20],
        [204, 100, 22],
        [234, 114, 22],
        [250, 140, 18],
        [216, 142, 24],
        [186, 148, 18],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={fill("main")} />
      ))}
      <path
        d="M204 80V124M176 102Q190 122 188 142M234 96Q224 120 232 146M218 124Q234 134 248 128"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".4"
        style={stroke("ink")}
      />
      <path
        d="M200 36V12M172 42l-12-16M228 42l12-16"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <circle cx="140" cy="48" r="5" style={fill("alt")} />
      <circle cx="258" cy="30" r="6" style={fill("alt")} />
      <path
        d="M64 168L96 194L72 224"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        style={stroke("alt")}
      />
      <circle cx="64" cy="168" r="8" style={fill("alt")} />
      <circle cx="96" cy="194" r="6" style={fill("pop")} />
      <circle cx="72" cy="224" r="7" style={fill("alt")} />
    </>
  );
}

function Cybersecurity() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <path
        d="M100 170H62V130H30M300 110H338V152H372"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={stroke("pop")}
      />
      <circle cx="30" cy="130" r="6" style={fill("pop")} />
      <circle cx="372" cy="152" r="6" style={fill("pop")} />
      <circle cx="338" cy="110" r="5" style={fill("pop")} />
      <path d="M200 40L300 74V150Q300 214 200 262Q100 214 100 150V74Z" style={fill("main")} />
      <path d="M200 40L100 74V150Q100 214 200 262Z" opacity=".14" style={fill("ink")} />
      <path
        d="M200 62L282 88V150Q282 200 200 240Q118 200 118 150V88Z"
        fill="none"
        strokeWidth="3"
        opacity=".5"
        style={stroke("soft")}
      />
      <path
        d="M182 152V136a18 18 0 0 1 36 0V152"
        fill="none"
        strokeWidth="9"
        style={stroke("soft")}
      />
      <rect x="170" y="150" width="60" height="48" rx="9" style={fill("soft")} />
      <circle cx="200" cy="170" r="7" style={fill("ink")} />
      <rect x="197" y="172" width="6" height="14" rx="3" style={fill("ink")} />
      <g transform="translate(60 62)">
        <path
          d="M-16 -4L-30 -14M-16 8L-32 10M-14 20L-28 32M16 -4L30 -14M16 8L32 10M14 20L28 32"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          style={stroke("alt")}
        />
        <ellipse cy="8" rx="14" ry="19" style={fill("alt")} />
        <circle cy="-14" r="8" style={fill("alt")} />
        <path d="M-5 8H5M-5 16H5" strokeWidth="2.5" opacity=".6" style={stroke("soft")} />
      </g>
      <path
        d="M84 92L98 104"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 7"
        style={stroke("alt")}
      />
    </>
  );
}

function ArtGallery() {
  return (
    <>
      <path d="M176 0H224L296 196H104Z" opacity=".22" style={fill("soft")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path d="M148 54L200 18L252 54" fill="none" strokeWidth="2" style={stroke("ink")} />
      <rect x="106" y="54" width="188" height="138" rx="4" style={fill("ink")} />
      <rect x="116" y="64" width="168" height="118" style={fill("soft")} />
      <rect x="126" y="74" width="148" height="98" style={fill("alt")} />
      <circle cx="238" cy="104" r="13" style={fill("main")} />
      <path
        d="M146 98h26a8 8 0 0 0 0-16 12 12 0 0 0-22-2 9 9 0 0 0-4 18z"
        opacity=".9"
        style={fill("soft")}
      />
      <path d="M126 172V138Q160 112 196 138Q226 120 274 146V172Z" style={fill("pop")} />
      <path d="M126 172V152Q170 136 210 156T274 150V172Z" opacity=".6" style={fill("pop")} />
      <rect x="44" y="92" width="44" height="62" rx="3" style={fill("ink")} />
      <rect x="50" y="98" width="32" height="50" style={fill("soft")} />
      <circle cx="66" cy="118" r="11" style={fill("main")} />
      <rect x="56" y="134" width="20" height="8" rx="2" style={fill("alt")} />
      <rect x="312" y="82" width="48" height="72" rx="3" style={fill("ink")} />
      <rect x="318" y="88" width="36" height="60" style={fill("soft")} />
      <path d="M318 148V118Q336 100 354 118V148Z" style={fill("pop")} />
      <circle cx="336" cy="104" r="8" style={fill("alt")} />
      <rect x="130" y="222" width="140" height="12" rx="4" style={fill("ink")} />
      <rect x="146" y="234" width="8" height="20" rx="2" style={fill("ink")} />
      <rect x="246" y="234" width="8" height="20" rx="2" style={fill("ink")} />
    </>
  );
}

export const NEW_SCENES: Record<string, () => ReactNode> = {
  Kitchen,
  Bathroom,
  "School Supplies": SchoolSupplies,
  Garden,
  Beach,
  Restaurant,
  Library,
  Airport,
  Music,
  Gaming,
  Space,
  Chemistry,
  Architecture,
  Psychology,
  Cybersecurity,
  "Art Gallery": ArtGallery,
};
