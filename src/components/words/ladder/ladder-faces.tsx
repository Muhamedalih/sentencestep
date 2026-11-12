import { useId } from "react";

/**
 * The five faces of the rating card, drawn here so they look the same on every phone and laptop:
 * level 5 loves it (star eyes, open smile), 4 likes it, 3 is neutral, 2 dislikes it, 1 hates it
 * (red, angry brows). A flat radial gradient and one soft highlight each, nothing more.
 */
export type FaceLevel = 1 | 2 | 3 | 4 | 5;

const INK = "#4a2412";

function Eye({ cx, down = false, small = false }: { cx: number; down?: boolean; small?: boolean }) {
  const ry = small ? 6 : 7.4;
  const pupilY = down ? 30.5 : 28;
  return (
    <g>
      <ellipse cx={cx} cy={27} rx={6.2} ry={ry} fill="#fff" />
      <circle cx={cx + 0.5} cy={pupilY} r={3.6} fill="#3a2a22" />
      <circle cx={cx + 1.8} cy={pupilY - 1.6} r={1.15} fill="#fff" />
    </g>
  );
}

function Star({ cx, cy, id }: { cx: number; cy: number; id: string }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? 9 : 4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
  return <polygon points={points} fill={`url(#${id})`} />;
}

export function RatingFace({ level, className }: { level: FaceLevel; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const skin = `skin-${uid}`;
  const star = `star-${uid}`;
  const angry = level === 1;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={skin} cx="38%" cy="28%" r="78%">
          {angry ? (
            <>
              <stop offset="0" stopColor="#ff9a80" />
              <stop offset="0.65" stopColor="#f2583f" />
              <stop offset="1" stopColor="#d23a2a" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#ffe27a" />
              <stop offset="0.62" stopColor="#ffb340" />
              <stop offset="1" stopColor="#f48a2f" />
            </>
          )}
        </radialGradient>
        <linearGradient id={star} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a4ff0" />
          <stop offset="1" stopColor="#e0509e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${skin})`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      <ellipse
        cx="23"
        cy="14"
        rx="12"
        ry="5.5"
        fill="#fff"
        opacity="0.22"
        transform="rotate(-18 23 14)"
      />

      {level === 5 && (
        <>
          <Star cx={22} cy={26} id={star} />
          <Star cx={42} cy={26} id={star} />
          <path d="M16 38 Q32 58 48 38 Z" fill="#6b1d1d" />
          <path d="M18 38 Q32 44 46 38 L46 41 Q32 47 18 41 Z" fill="#fff" />
          <ellipse cx="32" cy="49" rx="7" ry="3.4" fill="#ff7aa2" />
        </>
      )}
      {level === 4 && (
        <>
          <Eye cx={22} />
          <Eye cx={42} />
          <ellipse cx="14.5" cy="38" rx="4" ry="2.6" fill="#ff6f8a" opacity="0.35" />
          <ellipse cx="49.5" cy="38" rx="4" ry="2.6" fill="#ff6f8a" opacity="0.35" />
          <path
            d="M21 41 Q32 50 43 41"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {level === 3 && (
        <>
          <Eye cx={22} />
          <Eye cx={42} />
          <path d="M23 44 H41" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {level === 2 && (
        <>
          <Eye cx={22} down />
          <Eye cx={42} down />
          <path
            d="M22 46 Q32 39 42 46"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {level === 1 && (
        <>
          <Eye cx={22} small down />
          <Eye cx={42} small down />
          <path d="M12 17 L28 24" stroke="#3a1a12" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M52 17 L36 24" stroke="#3a1a12" strokeWidth="3.6" strokeLinecap="round" />
          <path
            d="M22 48 Q32 38 42 48"
            fill="none"
            stroke="#3a1a12"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
