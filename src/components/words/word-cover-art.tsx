import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { fill, palette, stroke, type Palette } from "@/components/words/word-cover-kit";
import { MORE_PALETTES, MORE_SCENES } from "@/components/words/word-cover-scenes";
import { NEW_PALETTES, NEW_SCENES } from "@/components/words/word-cover-scenes-new";
import { cn } from "@/lib/utils";

/**
 * The drawing on a Word List's cover (the covers of the Word Lists library and of the Words page's
 * topics), one flat vector scene per topic in calm full colour on a soft ground. Each scene draws
 * itself from seven tones set as CSS variables on the cover, so a scene and its palette are
 * separate things:
 *
 *   bg    the ground          tint   a sun, a halo or a ground band, a step from the ground
 *   ink   the darkest detail  main   the main object          alt    the second object
 *   soft  light shapes (faces, paper, clouds)                 pop    one accent
 *
 * The scenes are drawn in code (the first nine here, the rest in word-cover-scenes.tsx), so they belong to the site and cost no image download. A
 * topic without a scene (a list added later) gets a soft level-coloured ground with the topic's
 * own icon until a drawing or an admin's picture is added: it is never an empty box.
 */

/** Topic title (the group's English title, as in TOPIC_ICON) -> palette: bg, tint, ink, main, alt, soft, pop. */
const PALETTES: Record<string, Palette> = {
  Family: palette(["#f2dccf", "#ebc6b3", "#2f3354", "#4b5a8f", "#e07a5f", "#fbefe6", "#7fb59a"]),
  Friendship: palette([
    "#d8e7f4",
    "#c4daed",
    "#2b3f66",
    "#e5707e",
    "#3f6fb0",
    "#fbeee8",
    "#ee8a5a",
  ]),
  Politics: palette(["#e2def2", "#d1cbe8", "#3a2f78", "#5b4fa6", "#8478c6", "#f5f2ff", "#e8694d"]),
  Colors: palette(["#e3def3", "#d3cbe9", "#3b3466", "#e76f51", "#3a86c8", "#fbf9ff", "#35a98d"]),
  Travel: palette(["#cfe5f6", "#bad7ee", "#26466e", "#ef6a4c", "#3d78b8", "#ffffff", "#4f86c8"]),
  Health: palette(["#f7dcdd", "#f0c8cb", "#6b2a37", "#e0465a", "#3a9890", "#fff6f6", "#3a9890"]),
  Finance: palette(["#d5eadf", "#c1ddcf", "#1f5a45", "#2e8f6c", "#7cc2a3", "#f2f9f5", "#e25d45"]),
  Animals: palette(["#d9ebdf", "#c3dccb", "#3a2f2c", "#e0733f", "#8fb89c", "#fcf3e8", "#3b6e57"]),
  Technology: palette([
    "#d6e1f6",
    "#c2d2ef",
    "#22305f",
    "#4a6fd1",
    "#8aa6e6",
    "#eef3fd",
    "#e5588a",
  ]),
  ...MORE_PALETTES,
  ...NEW_PALETTES,
};

/** The ground of a topic with no scene, by level (1 beginner, 2 intermediate, 3 advanced). */
const FALLBACK: Record<number, Palette> = {
  1: palette(["#d9ebdf", "#c3dccb", "#1f5a45", "#2e8f6c", "#7cc2a3", "#f2f9f5", "#3b6e57"]),
  2: palette(["#d8e7f4", "#c4daed", "#2b3f66", "#3f6fb0", "#7aa9d6", "#f4f9fd", "#3d78b8"]),
  3: palette(["#e2def2", "#d1cbe8", "#3a2f78", "#5b4fa6", "#8478c6", "#f5f2ff", "#5b4fa6"]),
};

function Family() {
  return (
    <>
      <circle cx="292" cy="92" r="60" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path d="M104 262V172a36 36 0 0 1 72 0v90z" style={fill("main")} />
      <circle cx="140" cy="120" r="22" style={fill("soft")} />
      <path d="M119.5 112A22 22 0 0 1 160.5 112Q140 100 119.5 112z" style={fill("ink")} />
      <path d="M222 262V168a40 40 0 0 1 80 0v94z" style={fill("alt")} />
      <circle cx="262" cy="116" r="23" style={fill("soft")} />
      <path d="M240.6 107.7A23 23 0 0 1 283.4 107.7Q262 95.7 240.6 107.7z" style={fill("ink")} />
      <path d="M172 262v-48a28 28 0 0 1 56 0v48z" style={fill("pop")} />
      <circle cx="200" cy="176" r="17" style={fill("soft")} />
      <path d="M184.2 169.9A17 17 0 0 1 215.8 169.9Q200 159.5 184.2 169.9z" style={fill("ink")} />
      <path
        d="M200 138c-12-9-19-15-19-24a10.5 10.5 0 0 1 19-5 10.5 10.5 0 0 1 19 5c0 9-7 15-19 24z"
        style={fill("alt")}
      />
    </>
  );
}

function Friendship() {
  return (
    <>
      <circle cx="200" cy="140" r="112" style={fill("tint")} />
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path d="M104 262V196a40 40 0 0 1 80 0v66z" style={fill("main")} />
      <circle cx="144" cy="168" r="23" style={fill("soft")} />
      <path d="M122.6 159.7A23 23 0 0 1 165.4 159.7Q144 147.7 122.6 159.7z" style={fill("ink")} />
      <path d="M216 262V196a40 40 0 0 1 80 0v66z" style={fill("alt")} />
      <circle cx="256" cy="168" r="23" style={fill("soft")} />
      <path d="M234.6 159.7A23 23 0 0 1 277.4 159.7Q256 147.7 234.6 159.7z" style={fill("ink")} />
      <path
        d="M170 202L198 122"
        fill="none"
        strokeWidth="16"
        strokeLinecap="round"
        style={stroke("main")}
      />
      <path
        d="M230 202L202 122"
        fill="none"
        strokeWidth="16"
        strokeLinecap="round"
        style={stroke("alt")}
      />
      <circle cx="200" cy="112" r="13" style={fill("soft")} />
      <path
        d="M200 80V62M168 90l-11-13M232 90l11-13"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={stroke("pop")}
      />
    </>
  );
}

function Politics() {
  return (
    <>
      <circle cx="200" cy="150" r="118" style={fill("tint")} />
      <rect y="262" width="400" height="38" style={fill("tint")} />
      <rect x="64" y="250" width="272" height="14" rx="2" style={fill("alt")} />
      <rect x="80" y="236" width="240" height="14" rx="2" style={fill("main")} />
      {[100, 145, 190, 235, 280].map((x) => (
        <rect key={x} x={x} y="136" width="20" height="100" style={fill("soft")} />
      ))}
      <rect x="80" y="120" width="240" height="16" rx="2" style={fill("main")} />
      <polygon points="70,120 200,56 330,120" style={fill("alt")} />
      <polygon points="112,114 200,70 288,114" style={fill("soft")} />
      <circle cx="200" cy="100" r="9" style={fill("pop")} />
      <rect x="199" y="22" width="3" height="36" style={fill("ink")} />
      <polygon points="202,24 238,33 202,44" style={fill("pop")} />
    </>
  );
}

function Colors() {
  return (
    <>
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <path
        d="M196 56C288 52 352 108 342 172C334 220 282 234 246 222C220 213 232 188 206 186C180 184 176 236 128 236C66 236 46 152 82 108C106 80 148 58 196 56z"
        style={fill("soft")}
      />
      <circle cx="112" cy="140" r="20" style={fill("main")} />
      <circle cx="158" cy="98" r="20" style={fill("pop")} />
      <circle cx="220" cy="88" r="20" style={fill("alt")} />
      <circle cx="270" cy="106" r="20" style={fill("ink")} />
      <circle cx="104" cy="192" r="16" style={fill("main")} />
      <g transform="translate(306 120) rotate(32)">
        <rect x="-6" y="-120" width="12" height="104" rx="6" style={fill("alt")} />
        <rect x="-9" y="-18" width="18" height="30" rx="3" style={fill("ink")} />
        <path d="M-8 12Q-11 40 0 54Q11 40 8 12z" style={fill("pop")} />
      </g>
    </>
  );
}

function Animals() {
  return (
    <>
      <circle cx="200" cy="158" r="120" style={fill("tint")} />
      <polygon points="112,40 180,100 118,142" style={fill("main")} />
      <polygon points="130,76 164,102 132,122" style={fill("ink")} />
      <polygon points="288,40 220,100 282,142" style={fill("main")} />
      <polygon points="270,76 236,102 268,122" style={fill("ink")} />
      <polygon points="116,118 200,96 284,118 310,176 200,268 90,176" style={fill("main")} />
      <polygon points="90,176 138,168 200,200 262,168 310,176 200,268" style={fill("soft")} />
      <ellipse cx="158" cy="164" rx="8" ry="10" style={fill("ink")} />
      <ellipse cx="242" cy="164" rx="8" ry="10" style={fill("ink")} />
      <ellipse cx="200" cy="254" rx="13" ry="9" style={fill("ink")} />
    </>
  );
}

function Travel() {
  return (
    <>
      <circle cx="86" cy="86" r="44" style={fill("tint")} />
      <g style={fill("soft")}>
        <circle cx="96" cy="232" r="26" />
        <circle cx="134" cy="218" r="36" />
        <circle cx="176" cy="234" r="26" />
        <rect x="70" y="236" width="132" height="24" rx="12" />
      </g>
      <g style={fill("soft")} opacity=".7">
        <circle cx="300" cy="236" r="20" />
        <circle cx="328" cy="228" r="26" />
        <rect x="280" y="238" width="76" height="20" rx="10" />
      </g>
      <path
        d="M60 200C130 150 190 180 250 128"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="2 14"
        style={stroke("pop")}
      />
      <g transform="translate(290 112) rotate(42)">
        <path d="M-14-4-88 34v14l74-26zM14-4 88 34v14L14 22z" style={fill("main")} />
        <path d="M-14 40-42 62v8l28-12zM14 40 42 62v8L14 58z" style={fill("alt")} />
        <path
          d="M0-74C11-74 15-52 15-30V40L0 64-15 40V-30C-15-52-11-74 0-74z"
          style={fill("soft")}
        />
      </g>
    </>
  );
}

function Health() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <path
        d="M200 244C86 172 90 70 152 70C180 70 200 92 200 92C200 92 220 70 248 70C310 70 314 172 200 244z"
        style={fill("main")}
      />
      <path
        d="M112 160H138L158 114L186 204L212 134L228 160H288"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={stroke("soft")}
      />
      <g fill="none" strokeWidth="6" strokeLinecap="round" style={stroke("pop")}>
        <path d="M62 70v22M51 81h22" />
        <path d="M340 58v22M329 69h22" />
        <path d="M336 226v22M325 237h22" />
      </g>
    </>
  );
}

function Finance() {
  return (
    <>
      <rect y="250" width="400" height="50" style={fill("tint")} />
      <circle cx="190" cy="150" r="112" style={fill("tint")} />
      <rect x="52" y="198" width="42" height="52" rx="4" style={fill("alt")} />
      <rect x="108" y="170" width="42" height="80" rx="4" style={fill("alt")} />
      <rect x="164" y="142" width="42" height="108" rx="4" style={fill("alt")} />
      <rect x="220" y="108" width="42" height="142" rx="4" style={fill("main")} />
      <path
        d="M52 150L118 118L170 130L246 62"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={stroke("pop")}
      />
      <path d="M0-15L28 0 0 15z" transform="translate(252 56) rotate(-42)" style={fill("pop")} />
      <circle cx="324" cy="204" r="46" style={fill("soft")} />
      <circle cx="324" cy="204" r="34" fill="none" strokeWidth="5" style={stroke("tint")} />
      <text
        x="324"
        y="219"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="42"
        style={fill("main")}
      >
        $
      </text>
    </>
  );
}

function Technology() {
  return (
    <>
      <circle cx="200" cy="150" r="116" style={fill("tint")} />
      <rect x="84" y="70" width="232" height="146" rx="12" style={fill("alt")} />
      <rect x="96" y="82" width="208" height="122" rx="6" style={fill("ink")} />
      <rect x="118" y="102" width="62" height="8" rx="4" style={fill("pop")} />
      <rect x="118" y="120" width="112" height="8" rx="4" style={fill("main")} />
      <rect x="136" y="138" width="86" height="8" rx="4" style={fill("soft")} />
      <rect x="136" y="156" width="58" height="8" rx="4" style={fill("main")} />
      <rect x="118" y="174" width="100" height="8" rx="4" style={fill("soft")} />
      <path d="M56 224H344L328 246Q326 250 320 250H80Q74 250 72 246z" style={fill("main")} />
      <rect x="276" y="38" width="76" height="46" rx="12" style={fill("pop")} />
      <text
        x="314"
        y="70"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="22"
        style={fill("ink")}
      >
        {"</>"}
      </text>
      <circle cx="62" cy="76" r="9" style={fill("soft")} />
      <circle cx="44" cy="112" r="6" style={fill("main")} />
    </>
  );
}

const SCENES: Record<string, () => ReactNode> = {
  Family,
  Friendship,
  Politics,
  Colors,
  Animals,
  Travel,
  Health,
  Finance,
  Technology,
  ...MORE_SCENES,
  ...NEW_SCENES,
};

/** Whether a topic has a drawing of its own (otherwise its cover is the soft ground with its icon). */
export function hasCoverScene(title: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, title);
}

/** The tones a topic's cover is painted with (its own palette, or its level's soft ground when it has no drawing). */
export function coverTones(title: string, level: number): Palette {
  return (hasCoverScene(title) ? PALETTES[title] : undefined) ?? FALLBACK[level] ?? FALLBACK[1]!;
}

function varsOf(p: Palette): CSSProperties {
  return {
    "--wc-bg": p.bg,
    "--wc-tint": p.tint,
    "--wc-ink": p.ink,
    "--wc-main": p.main,
    "--wc-alt": p.alt,
    "--wc-soft": p.soft,
    "--wc-pop": p.pop,
    background: p.bg,
  } as CSSProperties;
}

/**
 * Fills its parent (which must be `relative` and clip its corners) with the topic's drawing. A
 * topic with no drawing gets the level's soft ground with `Icon` (the topic's own icon) large in
 * the middle.
 */
export function WordCoverArt({
  title,
  level,
  Icon,
  fit = "fill",
  className,
}: {
  title: string;
  level: number;
  Icon: LucideIcon;
  /**
   * "fill" (the cover's own 4:3 box) crops the drawing to whatever shape it is given. "bottom" is for a
   * tall panel (the picture beside a topic's words): the whole drawing at the panel's width, standing
   * on the bottom edge, with the ground colour above it, so nothing of it is cut off.
   */
  fit?: "fill" | "bottom";
  className?: string;
}) {
  const scene = hasCoverScene(title) ? SCENES[title] : null;
  const tones = coverTones(title, level);

  return (
    <span
      aria-hidden="true"
      className={cn("absolute inset-0 block", className)}
      style={varsOf(tones)}
    >
      {scene ? (
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio={fit === "bottom" ? "xMidYMax meet" : "xMidYMid slice"}
          className="absolute inset-0 size-full"
        >
          {scene()}
        </svg>
      ) : fit === "bottom" ? (
        <span className="absolute inset-x-0 bottom-0 flex justify-center pb-[12%]">
          <span
            className="flex aspect-square w-[64%] items-center justify-center rounded-full"
            style={{ background: "var(--wc-tint)" }}
          >
            <Icon className="size-1/2" strokeWidth={1.5} style={{ color: "var(--wc-main)" }} />
          </span>
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex aspect-square h-3/5 items-center justify-center rounded-full"
            style={{ background: "var(--wc-tint)" }}
          >
            <Icon className="size-1/2" strokeWidth={1.5} style={{ color: "var(--wc-main)" }} />
          </span>
        </span>
      )}
    </span>
  );
}
