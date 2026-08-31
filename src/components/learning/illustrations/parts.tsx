import type { ReactNode, SVGProps } from "react";

/**
 * Shared visual language for every lesson illustration: a single-color
 * rounded-stroke line figure (the same technique used by Stripe, Notion,
 * and Basecamp's editorial illustrations) with a second warm accent color
 * reserved for whatever the figure is holding or interacting with. Keeping
 * every scene to exactly these two colors — plus the ambient gradient
 * already used by LessonIllustration's background — is what makes 12+
 * independently-authored scenes read as one consistent illustration family
 * instead of clip-art assembled from different sources. Deliberately
 * faceless-beyond-two-dot-eyes: a stroke-only figure this simple has no
 * plausible way to render a detailed face without looking uncanny, and a
 * fully abstract figure sidesteps needing to depict any specific skin tone,
 * age, or identity for a cast of strangers.
 */
// Fallbacks matter here, not just belt-and-suspenders: --lesson-illustration-*
// is deliberately scoped to .lesson-shell only (see globals.css's own doc
// comment — a custom admin-picked lesson color must never leak into the
// dashboard/marketing pages), but LessonIllustration itself is also rendered
// OUTSIDE .lesson-shell (HomeHero's "continue learning" card, StoryCard) —
// see that component's own doc comment. Without a fallback, every stroke/fill
// here resolves to the undefined custom property's initial value (`none` for
// SVG stroke/fill), rendering the entire hand-drawn figure invisible: this is
// what actually caused the empty-looking illustration card on Home. The
// fallback values are exactly .lesson-shell's own defaults (--lesson-primary
// -> --brand, --lesson-accent -> --accent), so this changes nothing for any
// lesson rendered inside .lesson-shell (the scoped variable is always set
// there, default or admin-overridden, so the fallback never triggers) and
// simply reproduces that same default look wherever the variable isn't
// defined at all.
export const FIGURE_STROKE = "var(--lesson-illustration-stroke, var(--brand))";
export const PROP_ACCENT = "var(--lesson-illustration-accent, var(--accent))";
export const PROP_ACCENT_SOFT = "var(--accent-foreground)";

const SW = 5.5;

export const SCENE_VIEWBOX = "0 0 200 200";

interface SceneProps {
  children: ReactNode;
}

/** Wraps every scene with the shared stroke defaults so individual scenes never repeat them. */
export function Scene({ children }: SceneProps) {
  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full"
      fill="none"
      stroke={FIGURE_STROKE}
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

interface HeadProps {
  cx?: number;
  cy?: number;
  r?: number;
  /** Rotates the two eye-dots slightly so a figure can appear to glance toward a prop. */
  lookOffsetX?: number;
}

/**
 * The one facial feature every figure gets: two small dots, nothing else.
 * Filled with the same muted surface tone as the illustration's own
 * background so a `Hair` shape drawn behind it (see below) never shows
 * through the face — without this, hair color would fill the whole head
 * circle instead of framing it.
 */
export function Head({ cx = 100, cy = 52, r = 22, lookOffsetX = 0 }: HeadProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface-muted)" />
      <circle cx={cx - 9 + lookOffsetX} cy={cy - 2} r={2.6} fill={FIGURE_STROKE} stroke="none" />
      <circle cx={cx + 9 + lookOffsetX} cy={cy - 2} r={2.6} fill={FIGURE_STROKE} stroke="none" />
    </g>
  );
}

/**
 * The shoulders-to-waist silhouette every standing/seated figure shares,
 * cropped by the viewBox's own bottom edge — an intentional "portrait
 * vignette" framing rather than an attempt at full-body proportions, which
 * is both easier to keep consistent across many scenes and reads as more
 * editorial than a full cartoon body would.
 */
export function Torso({ shift = 0 }: { shift?: number }) {
  const x = shift;
  return (
    <path
      d={`M${55 + x} 200 Q${55 + x} 118 ${79 + x} 96 Q${90 + x} 85 ${100 + x} 85 Q${110 + x} 85 ${121 + x} 96 Q${145 + x} 118 ${145 + x} 200`}
      fill={FIGURE_STROKE}
      fillOpacity={0.1}
    />
  );
}

/**
 * A filled hair silhouette drawn behind the head. Filled (not just an
 * outline stroke) so it reads as a distinct solid shape against the head's
 * plain circle outline instead of nearly disappearing into it — an
 * unfilled hairline in the same stroke weight as the head was barely
 * visible at this scale.
 */
export function Hair({
  variant,
  cx = 100,
  cy = 52,
}: {
  variant: "short" | "side" | "bun";
  cx?: number;
  cy?: number;
}) {
  const style = { fill: FIGURE_STROKE, stroke: "none" } as const;
  if (variant === "short") {
    return (
      <path
        d={`M${cx - 23} ${cy + 2} Q${cx - 25} ${cy - 30} ${cx} ${cy - 30} Q${cx + 25} ${cy - 30} ${cx + 23} ${cy + 2} Q${cx + 23} ${cy - 10} ${cx} ${cy - 10} Q${cx - 23} ${cy - 10} ${cx - 23} ${cy + 2} Z`}
        {...style}
      />
    );
  }
  if (variant === "side") {
    return (
      <path
        d={`M${cx - 23} ${cy + 4} Q${cx - 26} ${cy - 28} ${cx - 2} ${cy - 30} Q${cx + 22} ${cy - 31} ${cx + 21} ${cy - 6} Q${cx + 21} ${cy - 14} ${cx + 6} ${cy - 14} Q${cx - 12} ${cy - 14} ${cx - 15} ${cy - 2} Q${cx - 16} ${cy + 6} ${cx - 23} ${cy + 4} Z`}
        {...style}
      />
    );
  }
  return (
    <g {...style}>
      <path
        d={`M${cx - 23} ${cy + 2} Q${cx - 25} ${cy - 28} ${cx} ${cy - 28} Q${cx + 25} ${cy - 28} ${cx + 23} ${cy + 2} Q${cx + 23} ${cy - 9} ${cx} ${cy - 9} Q${cx - 23} ${cy - 9} ${cx - 23} ${cy + 2} Z`}
      />
      <circle cx={cx} cy={cy - 30} r={8} />
    </g>
  );
}

/** A generic limb: one smooth curve from the shoulder/hip to wherever the hand needs to land. */
export function Limb({ d, ...rest }: { d: string } & SVGProps<SVGPathElement>) {
  return <path d={d} {...rest} />;
}

/** Small ground/desk/counter line every scene can sit an object on, for a sense of place without a full background illustration. */
export function Surface({ y = 178 }: { y?: number }) {
  return <path d={`M20 ${y} L180 ${y}`} strokeWidth={4} opacity={0.35} />;
}

interface PropProps extends SVGProps<SVGGElement> {
  x: number;
  y: number;
  scale?: number;
}

function propTransform({ x, y, scale = 1 }: PropProps) {
  return `translate(${x} ${y}) scale(${scale})`;
}

/** Every prop icon is filled in the warm accent color, at a smaller stroke weight than the figure, so it reads as "object" vs. "person" at a glance. */
function Prop({ x, y, scale, children, ...rest }: PropProps & { children: ReactNode }) {
  return (
    <g
      transform={propTransform({ x, y, scale })}
      stroke={PROP_ACCENT}
      strokeWidth={3.5}
      fill={PROP_ACCENT}
      fillOpacity={0.16}
      {...rest}
    >
      {children}
    </g>
  );
}

export function BookProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-16 -10 Q-16 -16 -8 -16 L0 -14 L8 -16 Q16 -16 16 -10 L16 10 Q16 14 8 14 L0 12 L-8 14 Q-16 14 -16 10 Z" />
      <path d="M0 -14 L0 12" fill="none" />
    </Prop>
  );
}

export function LaptopProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-18 6 L-14 -12 L14 -12 L18 6 Z" />
      <path d="M-22 6 L22 6 L19 12 L-19 12 Z" />
    </Prop>
  );
}

export function CupProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-10 -12 L-8 10 Q-8 14 -2 14 L2 14 Q8 14 8 10 L10 -12 Z" />
      <path d="M10 -6 Q18 -6 18 0 Q18 6 10 6" fill="none" />
      <path d="M-10 -12 L10 -12" />
    </Prop>
  );
}

export function BagProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-14 -4 L-14 16 Q-14 20 -10 20 L10 20 Q14 20 14 16 L14 -4 Z" />
      <path d="M-8 -4 L-8 -10 Q-8 -18 0 -18 Q8 -18 8 -10 L8 -4" fill="none" />
    </Prop>
  );
}

export function BackpackProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-13 -14 Q-13 -20 0 -20 Q13 -20 13 -14 L13 16 Q13 20 8 20 L-8 20 Q-13 20 -13 16 Z" />
      <path d="M-7 -10 L7 -10 L7 -1 L-7 -1 Z" fill="none" />
      <path d="M-5 6 L5 6" fill="none" />
    </Prop>
  );
}

export function SuitcaseProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-16 -4 L16 -4 L16 14 Q16 18 12 18 L-12 18 Q-16 18 -16 14 Z" />
      <path d="M-6 -4 L-6 -10 Q-6 -14 0 -14 Q6 -14 6 -10 L6 -4" fill="none" />
    </Prop>
  );
}

export function CalendarProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-14 -10 L14 -10 L14 14 Q14 16 12 16 L-12 16 Q-14 16 -14 14 Z" />
      <path d="M-14 -3 L14 -3" fill="none" />
      <path d="M-8 -14 L-8 -8" fill="none" />
      <path d="M8 -14 L8 -8" fill="none" />
    </Prop>
  );
}

export function PlateProp(props: PropProps) {
  return (
    <Prop {...props}>
      <circle cx={0} cy={0} r={16} />
      <circle cx={0} cy={0} r={9} fill="none" />
    </Prop>
  );
}

export function StethoscopeProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-12 -16 L-12 -2 Q-12 8 -2 8 Q8 8 8 -2 L8 -16" fill="none" />
      <circle cx={-2} cy={14} r={6} />
    </Prop>
  );
}

export function HouseProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-16 4 L0 -14 L16 4 L16 18 L-16 18 Z" />
      <path d="M-5 18 L-5 6 L5 6 L5 18" fill="none" />
    </Prop>
  );
}

export function PhoneProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-9 -16 L9 -16 Q12 -16 12 -13 L12 13 Q12 16 9 16 L-9 16 Q-12 16 -12 13 L-12 -13 Q-12 -16 -9 -16 Z" />
      <path d="M-3 12 L3 12" fill="none" />
    </Prop>
  );
}

export function PaperPlaneProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-16 6 L16 -16 L4 16 L-2 2 Z" />
      <path d="M-2 2 L16 -16" fill="none" />
    </Prop>
  );
}

export function SpeechBubbleProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M-16 -10 Q-16 -16 -10 -16 L10 -16 Q16 -16 16 -10 L16 2 Q16 8 10 8 L-2 8 L-10 16 L-8 8 Q-16 8 -16 2 Z" />
    </Prop>
  );
}

export function HeartProp(props: PropProps) {
  return (
    <Prop {...props}>
      <path d="M0 14 Q-16 2 -16 -6 Q-16 -14 -8 -14 Q-2 -14 0 -8 Q2 -14 8 -14 Q16 -14 16 -6 Q16 2 0 14 Z" />
    </Prop>
  );
}
