import type { ReactNode } from "react";

import { fill, palette, stroke, type Palette } from "@/components/words/word-cover-kit";

/**
 * The drawings of the rest of the topics (the first nine are in word-cover-art.tsx): Food, House,
 * Clothes, Body, Transportation, Shopping, Weather, Work, Sports, Emotions, Environment,
 * Education, Media, Law and Science. Same rules: flat shapes in a 400 x 300 box, painted only with
 * the seven tones of the cover, nothing yellow.
 */

export const MORE_PALETTES: Record<string, Palette> = {
  Food: palette(["#f8dcd5", "#f0c6bb", "#4a2f2b", "#d9694a", "#6fa37a", "#fff7ee", "#3f6f8f"]),
  House: palette(["#d4e6e3", "#bfd9d5", "#1f4a52", "#e0735a", "#3c7f86", "#fbf6ee", "#8bb8c2"]),
  Clothes: palette(["#efdcec", "#e4c7dd", "#4a2a4f", "#2f9aa0", "#1f6f77", "#fbf2f8", "#e86d8f"]),
  Body: palette(["#d9e8ee", "#c4dce5", "#23455a", "#4a7fb5", "#2f5e8c", "#f6fbfd", "#e5588a"]),
  Transportation: palette([
    "#d6e3f0",
    "#c1d4e6",
    "#1f3550",
    "#e8743b",
    "#2d5f8b",
    "#ffffff",
    "#e8743b",
  ]),
  Shopping: palette(["#f6e0e4", "#efcdd3", "#4a2a3a", "#3a8f9a", "#e2706f", "#fff6f6", "#8a6fd0"]),
  Weather: palette(["#d3e6f6", "#bed7ee", "#26466e", "#ef7b4d", "#3d78b8", "#ffffff", "#ef7b4d"]),
  Work: palette(["#d9e1ee", "#c6d2e5", "#25335a", "#a0643c", "#6d4429", "#fbf4ec", "#4a6fd1"]),
  Sports: palette(["#d4ebe6", "#bfded7", "#2c2a2a", "#e8743b", "#1f6f6a", "#fbf7ee", "#2f9aa0"]),
  Emotions: palette(["#f6dbe0", "#efc7cf", "#3b2a3a", "#ee8a67", "#6a8fd0", "#fff4ee", "#e05577"]),
  Environment: palette([
    "#d6e9d2",
    "#c3dfbd",
    "#2a4a2d",
    "#3f9a5a",
    "#2a6b3f",
    "#f6fbf3",
    "#3aa0a8",
  ]),
  Education: palette(["#dde0f3", "#cdd2ec", "#2b2f6b", "#4b5fc0", "#8a93e0", "#fbfbff", "#e8694d"]),
  Media: palette(["#f2dce6", "#e8c8d8", "#2e2340", "#c64f7a", "#7a5fa8", "#fff5fa", "#ef6a4c"]),
  Law: palette(["#e1e3ef", "#d0d4e6", "#2a2f5a", "#4f5fa8", "#e8694d", "#f6f6fd", "#e8694d"]),
  Science: palette(["#d2e9ec", "#bddde2", "#1f4f58", "#2fa39a", "#3d78b8", "#f2fbfc", "#e5588a"]),
};

function Food() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path
        d="M168 92c-12-14 12-22 0-36M200 86c-12-14 12-22 0-36M232 92c-12-14 12-22 0-36"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("soft")}
      />
      <path d="M104 160C116 108 284 108 296 160z" style={fill("soft")} />
      <circle cx="150" cy="140" r="11" style={fill("alt")} />
      <circle cx="204" cy="128" r="12" style={fill("pop")} />
      <circle cx="252" cy="140" r="11" style={fill("alt")} />
      <path d="M92 156H308a108 112 0 0 1-108 112 108 112 0 0 1-108-112z" style={fill("main")} />
      <rect x="156" y="264" width="88" height="14" rx="6" style={fill("ink")} />
      <rect x="84" y="150" width="232" height="14" rx="7" style={fill("soft")} />
      <path
        d="M120 204H280"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".55"
        style={stroke("soft")}
      />
      <path
        d="M246 138L338 54M262 148L350 66"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("ink")}
      />
    </>
  );
}

function House() {
  return (
    <>
      <circle cx="302" cy="84" r="52" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="318" y="186" width="14" height="66" rx="4" style={fill("ink")} />
      <circle cx="325" cy="162" r="38" style={fill("alt")} />
      <circle cx="346" cy="190" r="24" style={fill("alt")} />
      <rect x="244" y="86" width="26" height="52" style={fill("alt")} />
      <rect x="94" y="146" width="196" height="106" rx="4" style={fill("soft")} />
      <polygon points="76,152 192,66 308,152" style={fill("main")} />
      <circle cx="192" cy="118" r="12" style={fill("soft")} />
      <rect x="172" y="190" width="44" height="62" rx="5" style={fill("alt")} />
      <circle cx="205" cy="222" r="3.5" style={fill("soft")} />
      <rect x="112" y="172" width="44" height="40" rx="4" style={fill("pop")} />
      <rect x="232" y="172" width="44" height="40" rx="4" style={fill("pop")} />
      <path
        d="M134 172V212M112 192H156M254 172V212M232 192H276"
        fill="none"
        strokeWidth="3"
        style={stroke("ink")}
      />
    </>
  );
}

function Clothes() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <path
        d="M150 70L110 92L66 128L92 164L120 148V250H280V148L308 164L334 128L290 92L250 70Q200 106 150 70Z"
        style={fill("main")}
      />
      <rect x="120" y="180" width="160" height="22" opacity=".9" style={fill("soft")} />
      <path
        d="M150 70Q200 106 250 70"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        style={stroke("alt")}
      />
      <rect x="232" y="126" width="34" height="38" rx="5" style={fill("alt")} />
      <path d="M249 136l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" style={fill("pop")} />
    </>
  );
}

function Body() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <path
        d="M172 136L124 200M228 136L276 200"
        fill="none"
        strokeWidth="22"
        strokeLinecap="round"
        style={stroke("soft")}
      />
      <rect x="170" y="196" width="28" height="62" rx="13" style={fill("alt")} />
      <rect x="202" y="196" width="28" height="62" rx="13" style={fill("alt")} />
      <rect x="160" y="112" width="80" height="102" rx="34" style={fill("main")} />
      <circle cx="200" cy="76" r="30" style={fill("soft")} />
      <path d="M170.6 70A30 30 0 0 1 229.4 70Q200 56 170.6 70z" style={fill("ink")} />
      <path
        d="M200 178c-11-8-17-13-17-21a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 8-6 13-17 21z"
        style={fill("pop")}
      />
      <path
        d="M232 70H300M232 236H300M168 236H100"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <rect x="304" y="65" width="52" height="10" rx="5" style={fill("pop")} />
      <rect x="304" y="231" width="52" height="10" rx="5" style={fill("pop")} />
      <rect x="44" y="231" width="52" height="10" rx="5" style={fill("pop")} />
    </>
  );
}

function Transportation() {
  return (
    <>
      <circle cx="300" cy="84" r="50" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path
        d="M30 274H370"
        fill="none"
        strokeWidth="4"
        strokeDasharray="18 14"
        style={stroke("soft")}
      />
      <rect x="62" y="104" width="276" height="116" rx="24" style={fill("main")} />
      <rect x="62" y="182" width="276" height="14" style={fill("alt")} />
      <rect x="82" y="124" width="50" height="46" rx="8" style={fill("soft")} />
      <rect x="142" y="124" width="50" height="46" rx="8" style={fill("soft")} />
      <rect x="202" y="124" width="50" height="46" rx="8" style={fill("soft")} />
      <rect x="268" y="124" width="46" height="80" rx="8" style={fill("soft")} />
      <path d="M291 124V204" fill="none" strokeWidth="3" style={stroke("ink")} />
      <circle cx="326" cy="196" r="7" style={fill("pop")} />
      <rect x="58" y="190" width="8" height="14" rx="3" style={fill("pop")} />
      <circle cx="126" cy="226" r="26" style={fill("ink")} />
      <circle cx="126" cy="226" r="11" style={fill("soft")} />
      <circle cx="280" cy="226" r="26" style={fill("ink")} />
      <circle cx="280" cy="226" r="11" style={fill("soft")} />
    </>
  );
}

function Shopping() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path
        d="M104 122V108a26 26 0 0 1 52 0V122"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <rect x="78" y="122" width="104" height="130" rx="10" style={fill("alt")} />
      <rect x="78" y="168" width="104" height="14" opacity=".6" style={fill("soft")} />
      <rect x="162" y="104" width="160" height="148" rx="12" style={fill("main")} />
      <path
        d="M200 106V84a42 42 0 0 1 84 0V106"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <rect x="206" y="150" width="72" height="56" rx="10" style={fill("soft")} />
      <path
        d="M242 192c-10-7-15-12-15-18a8 8 0 0 1 15-3 8 8 0 0 1 15 3c0 6-5 11-15 18z"
        style={fill("pop")}
      />
      <path
        d="M336 70v20M326 80h20M70 70v14M63 77h14"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("pop")}
      />
    </>
  );
}

function Weather() {
  return (
    <>
      <circle cx="140" cy="112" r="44" style={fill("main")} />
      <path
        d="M140 48v-14M140 176v14M76 112H62M204 112h14M95 67L85 57M185 67l10-10M95 157l-10 10"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        style={stroke("main")}
      />
      <g style={fill("soft")}>
        <circle cx="204" cy="176" r="34" />
        <circle cx="246" cy="152" r="44" />
        <circle cx="292" cy="180" r="32" />
        <rect x="190" y="178" width="134" height="38" rx="19" />
      </g>
      <path
        d="M0-12C8 0 9 8 0 8-9 8-8 0 0-12z"
        transform="translate(214 240)"
        style={fill("alt")}
      />
      <path
        d="M0-12C8 0 9 8 0 8-9 8-8 0 0-12z"
        transform="translate(256 252)"
        style={fill("alt")}
      />
      <path
        d="M0-12C8 0 9 8 0 8-9 8-8 0 0-12z"
        transform="translate(298 240)"
        style={fill("alt")}
      />
    </>
  );
}

function Work() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path
        d="M156 120V98a14 14 0 0 1 14-14h60a14 14 0 0 1 14 14v22"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <rect x="82" y="118" width="236" height="132" rx="18" style={fill("main")} />
      <rect x="82" y="170" width="236" height="14" style={fill("alt")} />
      <rect x="182" y="160" width="36" height="34" rx="7" style={fill("soft")} />
      <circle cx="200" cy="174" r="5" style={fill("ink")} />
      <path
        d="M330 76v20M320 86h20"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <circle cx="70" cy="84" r="8" style={fill("pop")} />
    </>
  );
}

function Sports() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <ellipse cx="200" cy="254" rx="84" ry="12" style={fill("tint")} />
      <circle cx="200" cy="150" r="88" style={fill("main")} />
      <path
        d="M200 62V238M112 150H288M146 84C176 118 176 182 146 216M254 84C224 118 224 182 254 216"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <path
        d="M34 110H80M24 150H70M40 190H84"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".5"
        style={stroke("alt")}
      />
      <path
        d="M330 76v20M320 86h20"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("pop")}
      />
    </>
  );
}

function Emotions() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <circle cx="150" cy="140" r="66" style={fill("main")} />
      <circle cx="130" cy="124" r="8" style={fill("ink")} />
      <circle cx="170" cy="124" r="8" style={fill("ink")} />
      <path
        d="M120 156Q150 190 180 156"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <circle cx="262" cy="182" r="50" style={fill("alt")} />
      <circle cx="246" cy="170" r="6" style={fill("ink")} />
      <circle cx="278" cy="170" r="6" style={fill("ink")} />
      <path
        d="M244 206Q262 188 280 206"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <path d="M0-9C6 0 7 6 0 6-7 6-6 0 0-9z" transform="translate(244 188)" style={fill("soft")} />
      <path
        d="M232 100c-10-7-15-12-15-18a8 8 0 0 1 15-3 8 8 0 0 1 15 3c0 6-5 11-15 18z"
        style={fill("pop")}
      />
    </>
  );
}

function Environment() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="318" y="118" width="7" height="134" style={fill("soft")} />
      <g transform="translate(321.5 116)">
        <rect x="-3" y="-52" width="6" height="46" rx="3" style={fill("soft")} />
        <rect
          x="-3"
          y="-52"
          width="6"
          height="46"
          rx="3"
          transform="rotate(120)"
          style={fill("soft")}
        />
        <rect
          x="-3"
          y="-52"
          width="6"
          height="46"
          rx="3"
          transform="rotate(240)"
          style={fill("soft")}
        />
        <circle r="9" style={fill("alt")} />
      </g>
      <rect x="186" y="172" width="28" height="82" rx="6" style={fill("ink")} />
      <circle cx="200" cy="112" r="60" style={fill("main")} />
      <circle cx="148" cy="152" r="42" style={fill("main")} />
      <circle cx="252" cy="152" r="42" style={fill("main")} />
      <circle cx="176" cy="98" r="16" opacity=".25" style={fill("soft")} />
      <path d="M82 86c24-6 40 10 36 34-24 4-40-10-36-34z" style={fill("pop")} />
      <path
        d="M86 116L112 92"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        style={stroke("soft")}
      />
    </>
  );
}

function Education() {
  return (
    <>
      <circle cx="200" cy="140" r="116" style={fill("tint")} />
      <path d="M70 232Q135 214 200 234V272Q135 252 70 270Z" style={fill("soft")} />
      <path d="M330 232Q265 214 200 234V272Q265 252 330 270Z" opacity=".92" style={fill("soft")} />
      <path
        d="M92 244Q135 234 178 246M92 256Q135 246 178 258M308 244Q265 234 222 246M308 256Q265 246 222 258"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".3"
        style={stroke("ink")}
      />
      <rect x="198" y="234" width="4" height="38" style={fill("ink")} />
      <path d="M136 132V184Q200 222 264 184V132L200 160Z" style={fill("main")} />
      <polygon points="200,60 328,112 200,164 72,112" style={fill("ink")} />
      <circle cx="200" cy="112" r="7" style={fill("pop")} />
      <path
        d="M312 118V172"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        style={stroke("pop")}
      />
      <circle cx="312" cy="180" r="8" style={fill("pop")} />
    </>
  );
}

function Media() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <path
        d="M168 100L136 56M232 100L264 56M140 244L128 262M260 244L272 262"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <circle cx="136" cy="54" r="6" style={fill("pop")} />
      <circle cx="264" cy="54" r="6" style={fill("pop")} />
      <rect x="76" y="94" width="248" height="152" rx="20" style={fill("main")} />
      <rect x="94" y="112" width="176" height="116" rx="12" style={fill("ink")} />
      <path d="M164 150L214 170L164 190Z" style={fill("soft")} />
      <rect x="106" y="122" width="38" height="14" rx="7" style={fill("pop")} />
      <circle cx="116" cy="129" r="3" style={fill("soft")} />
      <circle cx="298" cy="136" r="9" style={fill("alt")} />
      <circle cx="298" cy="166" r="9" style={fill("alt")} />
      <rect x="286" y="196" width="24" height="6" rx="3" style={fill("soft")} />
      <rect x="286" y="210" width="24" height="6" rx="3" style={fill("soft")} />
    </>
  );
}

function Law() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <rect x="196" y="70" width="8" height="170" rx="3" style={fill("main")} />
      <rect x="146" y="236" width="108" height="16" rx="6" style={fill("main")} />
      <rect x="168" y="226" width="64" height="14" rx="4" style={fill("alt")} />
      <rect x="92" y="86" width="216" height="9" rx="4.5" style={fill("main")} />
      <path
        d="M108 95L76 168M108 95L140 168M292 95L260 168M292 95L324 168"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        style={stroke("ink")}
      />
      <path d="M62 168H154Q108 206 62 168Z" style={fill("main")} />
      <path d="M246 168H338Q292 206 246 168Z" style={fill("alt")} />
      <circle cx="292" cy="160" r="8" style={fill("pop")} />
      <circle cx="200" cy="74" r="12" style={fill("alt")} />
      <circle cx="200" cy="74" r="5" style={fill("soft")} />
    </>
  );
}

function Science() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <path
        d="M172 70H228V120L284 226Q292 250 268 250H132Q108 250 116 226L172 120Z"
        style={fill("soft")}
      />
      <path d="M135 190H265L284 226Q292 250 268 250H132Q108 250 116 226Z" style={fill("main")} />
      <rect x="160" y="62" width="80" height="12" rx="6" style={fill("alt")} />
      <circle cx="188" cy="214" r="8" opacity=".8" style={fill("soft")} />
      <circle cx="218" cy="226" r="6" opacity=".8" style={fill("soft")} />
      <circle cx="204" cy="200" r="5" opacity=".8" style={fill("soft")} />
      <circle cx="196" cy="168" r="7" style={fill("pop")} />
      <circle cx="214" cy="146" r="5" style={fill("pop")} />
      <circle cx="250" cy="52" r="8" style={fill("alt")} />
      <circle cx="268" cy="34" r="5" style={fill("alt")} />
      <g transform="translate(78 104)" fill="none" strokeWidth="4" style={stroke("main")}>
        <ellipse rx="30" ry="11" />
        <ellipse rx="30" ry="11" transform="rotate(60)" />
        <ellipse rx="30" ry="11" transform="rotate(120)" />
      </g>
      <circle cx="78" cy="104" r="6" style={fill("pop")} />
    </>
  );
}

export const MORE_SCENES: Record<string, () => ReactNode> = {
  Food,
  House,
  Clothes,
  Body,
  Transportation,
  Shopping,
  Weather,
  Work,
  Sports,
  Emotions,
  Environment,
  Education,
  Media,
  Law,
  Science,
};
