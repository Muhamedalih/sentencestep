"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ban, CircleHelp, Flag, Lightbulb, Star } from "lucide-react";

import { cn } from "@/lib/utils";

const STAR_PATH =
  "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

/** How long the star takes to reach the bulb. */
const STAR_FLIGHT_MS = 560;

interface DictationHelpProps {
  /** "Stuck on this letter?" — names the group for screen readers too. */
  prompt: string;
  /** The sentence's stars right now (0 once they are all spent). */
  stars: number;
  /** How many stars the sentence started with — three, plus any gift stars. Defaults to 3. */
  maxStars?: number;
  /** False in a practice try, where nothing is at stake: no stars, no price. */
  showStakes: boolean;
  starsLabel: string;
  /** Show the word. Absent where the word cannot be shown (blanks off), which leaves Give up alone. Returning false (with `actOnPress`) means there was nothing to give: no star flies. */
  onShowWord?: () => void | boolean;
  showWordLabel: string;
  showWordTitle: string;
  /** A word is on screen right now: showing it again would only cost another star. */
  showingWord: boolean;
  /** What the price tag says: it costs a star, or (at one star) it is only recorded. */
  costLabel: string;
  costRecorded: string;
  /** The pointer or keyboard focus is on Show the word, which would cost something: lets the streak chip warn. */
  onRiskChange?: (risk: boolean) => void;
  onGiveUp?: () => void;
  giveUpLabel: string;
  giveUpTitle: string;
  dir: "ltr" | "rtl";
  /** Draws the bar without its card fill and shadow: for a calm screen where it sits on screen all the time (Word Lists), rather than one where it appears once the learner is stuck (Dictation). */
  quiet?: boolean;
  /** False for no entrance animation — a bar that is mounted again for every word must not pop in each time. Defaults to true. */
  animateIn?: boolean;
  /** False hides the visible "need help?" label and the divider after it; the prompt stays as the group's accessible name. Defaults to true. */
  showPrompt?: boolean;
  /** Calls onShowWord the moment the button is pressed instead of when the star lands, for a screen whose own animation runs alongside the star's flight (Word Lists' repair). The star still flies. Defaults to false. */
  actOnPress?: boolean;
  /** Stops the buttons taking focus from the pointer, so the answer field keeps it and typing carries on at once. Defaults to false. */
  keepFocus?: boolean;
  /** Give up stays on screen but cannot be pressed (the word is already settled): nothing around it moves. */
  giveUpDisabled?: boolean;
  /** Keeps the price tag as wide for "−★" as for "Recorded", so the bar never changes size (and shifts) when the stars run out. */
  stablePrice?: boolean;
  /**
   * The hint taken at the last star spends it, instead of only being "recorded": the star flies like any other, then the stars of this word are wiped away (an animation, and `noStarsLabel` takes their place) and — unless `hintStaysOpen` — the hint is closed. `stars` is then 0. Without it the last star is never taken.
   */
  lastStarCosts?: boolean;
  /** Keeps Show the word pressable once the stars are gone (it is then only "recorded"): for a screen where the learner has no other way past a blank. Defaults to false, where the closed hint hands the word back to the learner. */
  hintStaysOpen?: boolean;
  /** Said in place of the stars once they are all gone (needs `lastStarCosts`). */
  noStarsLabel?: string;
  /** Why the hint is closed: what the learner can do instead (needs `lastStarCosts`). */
  noStarsTitle?: string;
}

/**
 * What letter-by-letter Dictation offers a learner who is stuck: Show the word
 * and Give up, in one tidy bar under the sentence, and what the first of them
 * costs, made visible in three beats.
 *
 *  - Before: the sentence's stars sit beside the button and the button wears a
 *    price tag (−★). With the pointer on it, the star it would take turns into
 *    a dashed ghost, so the loss is seen before it happens.
 *  - During: the star is taken. It lifts off, arcs into the bulb and dies there
 *    in a burst of sparks; the bulb flares, and by its light the word rises
 *    (the parent starts the peek when `onShowWord` fires, as the star lands).
 *  - After: the empty slot pops, and a "−1" floats up and away.
 *
 * Without `lastStarCosts`, at one star there is nothing left to take, so the tag
 * reads "Recorded" and no star flies: the help is still counted (the recap shows
 * a bulb mark for it). With it (Word Lists, Dictation) the help at the last star
 * takes that one too and the stars are wiped away. In a practice try there are
 * no stars and no tag at all.
 */
export function DictationHelp({
  prompt,
  stars,
  maxStars = 3,
  showStakes,
  starsLabel,
  onShowWord,
  showWordLabel,
  showWordTitle,
  showingWord,
  costLabel,
  costRecorded,
  onRiskChange,
  onGiveUp,
  giveUpLabel,
  giveUpTitle,
  dir,
  quiet = false,
  animateIn = true,
  showPrompt = true,
  actOnPress = false,
  keepFocus = false,
  giveUpDisabled = false,
  stablePrice = false,
  lastStarCosts = false,
  hintStaysOpen = false,
  noStarsLabel,
  noStarsTitle,
}: DictationHelpProps) {
  const reduced = useReducedMotion() ?? false;
  const starsRef = useRef<HTMLSpanElement>(null);
  const bulbRef = useRef<HTMLSpanElement>(null);
  const [ghost, setGhost] = useState(false);
  const [flying, setFlying] = useState(false);
  // Which pip is in the air: the star count may change while it flies (a screen that acts on press), so the pip is not read off it.
  const [flyingIndex, setFlyingIndex] = useState(-1);
  const [litKey, setLitKey] = useState(0);
  const [glow, setGlow] = useState(false);
  const [lostKey, setLostKey] = useState(0);
  const previousStars = useRef(stars);
  const riskRef = useRef(onRiskChange);
  riskRef.current = onRiskChange;
  const flight = useRef<{
    animations: Animation[];
    elements: HTMLElement[];
    glowTimer?: ReturnType<typeof setTimeout>;
  }>({ animations: [], elements: [] });

  // A star lost (to Show the word or to wrong letters): "−1" floats off.
  useEffect(() => {
    if (stars < previousStars.current) setLostKey((key) => key + 1);
    previousStars.current = stars;
  }, [stars]);

  // Leaving mid-flight (the learner typed the letter they were stuck on)
  // cancels it: no help was taken, so nothing is counted.
  useEffect(() => {
    const state = flight.current;
    return () => {
      state.animations.forEach((animation) => animation.cancel());
      state.elements.forEach((element) => element.remove());
      clearTimeout(state.glowTimer);
      riskRef.current?.(false);
    };
  }, []);

  // The star the hint can still take: the last one too when it costs, else it stays at one.
  const floor = lastStarCosts ? 0 : 1;
  /** Every star is gone and the hint is closed. */
  const outOfStars = lastStarCosts && showStakes && stars <= 0;
  /** The hint cannot be pressed any more (the stars are gone and the screen closes it). */
  const hintClosed = outOfStars && !hintStaysOpen;

  function setRisk(on: boolean) {
    setGhost(on && showStakes && stars > floor);
    riskRef.current?.(on && showStakes);
  }

  function track(element: HTMLElement, animation: Animation) {
    flight.current.elements.push(element);
    flight.current.animations.push(animation);
    animation.onfinish = () => element.remove();
  }

  /** A few sparks thrown off where the star died. */
  function burst() {
    const bulb = bulbRef.current;
    if (!bulb) return;
    const box = bulb.getBoundingClientRect();
    const color = getComputedStyle(bulb).getPropertyValue("--color-accent") || "currentColor";
    for (let index = 0; index < 7; index++) {
      const spark = document.createElement("div");
      const size = 5;
      Object.assign(spark.style, {
        position: "fixed",
        left: `${box.left + box.width / 2 - size / 2}px`,
        top: `${box.top + box.height / 2 - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: color,
        zIndex: "70",
        pointerEvents: "none",
      });
      document.body.appendChild(spark);
      const angle = (index / 7) * Math.PI * 2 + 0.4;
      const distance = 20 + (index % 3) * 7;
      track(
        spark,
        spark.animate(
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(0.2)`,
              opacity: 0,
            },
          ],
          { duration: 650, easing: "ease-out", fill: "forwards" },
        ),
      );
    }
  }

  /** The bulb flares: a ring ripples out of the button and the icon glows. */
  function light(withSparks: boolean) {
    setLitKey((key) => key + 1);
    setGlow(true);
    clearTimeout(flight.current.glowTimer);
    flight.current.glowTimer = setTimeout(() => setGlow(false), 1100);
    if (withSparks && !reduced) burst();
  }

  /** The last lit star lifts off, arcs over and into the bulb; `arrived` runs as it lands. */
  function flyStar(arrived: () => void) {
    const pip = starsRef.current?.querySelectorAll<HTMLElement>("[data-pip]")[stars - 1];
    const bulb = bulbRef.current;
    if (!pip || !bulb) {
      arrived();
      return;
    }
    const from = pip.getBoundingClientRect();
    const to = bulb.getBoundingClientRect();
    const color = getComputedStyle(pip).color;
    const star = document.createElement("div");
    Object.assign(star.style, {
      position: "fixed",
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      zIndex: "70",
      pointerEvents: "none",
      color,
      filter: `drop-shadow(0 0 7px ${color})`,
    });
    star.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="${STAR_PATH}"/></svg>`;
    document.body.appendChild(star);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const animation = star.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx * 0.45}px,${dy * 0.45 - 46}px) scale(1.35) rotate(120deg)`,
          opacity: 1,
          offset: 0.5,
        },
        { transform: `translate(${dx}px,${dy}px) scale(0.25) rotate(260deg)`, opacity: 0.35 },
      ],
      { duration: STAR_FLIGHT_MS, easing: "cubic-bezier(.5,0,.25,1)", fill: "forwards" },
    );
    track(star, animation);
    animation.addEventListener("finish", arrived);
  }

  function showWord() {
    if (flying || showingWord || !onShowWord) return;
    setRisk(false);
    if (!showStakes || stars <= floor || reduced) {
      if (onShowWord() === false) return;
      light(showStakes);
      return;
    }
    if (actOnPress && onShowWord() === false) return;
    setFlyingIndex(stars - 1);
    setFlying(true);
    flyStar(() => {
      setFlying(false);
      light(true);
      if (!actOnPress) onShowWord();
    });
  }

  const costStar = (
    <>
      <span aria-hidden="true">−</span>
      <Star className="size-3 fill-current" aria-hidden="true" />
    </>
  );
  const costs = stars > floor;
  // Once the hint is closed the tag stays (invisible) so the bar keeps its width.
  const price = showStakes && (
    <span
      aria-hidden={hintClosed || undefined}
      aria-label={costs ? costLabel : costRecorded}
      dir={costs ? "ltr" : dir}
      className={cn(
        hintClosed && "invisible",
        "bg-accent/20 text-accent group-hover/help:bg-accent group-hover/help:text-accent-foreground group-focus-visible/help:bg-accent group-focus-visible/help:text-accent-foreground ms-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-px text-xs font-bold transition-colors",
      )}
    >
      {stablePrice ? (
        // Both labels share one cell, so the tag is always as wide as the wider one.
        <span className="inline-grid">
          <span
            aria-hidden={!costs}
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center justify-center gap-0.5",
              !costs && "invisible",
            )}
          >
            {costStar}
          </span>
          <span
            aria-hidden={costs}
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center justify-center",
              costs && "invisible",
            )}
          >
            {costRecorded}
          </span>
        </span>
      ) : costs ? (
        costStar
      ) : (
        costRecorded
      )}
    </span>
  );

  return (
    <motion.div
      role="group"
      aria-label={prompt}
      dir={dir}
      initial={reduced || !animateIn ? false : { opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
      className={cn(
        "inline-flex w-full max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 sm:w-auto sm:flex-nowrap [html[data-keyboard]_&]:min-[360px]:flex-nowrap",
        quiet
          ? "border-border/50 bg-transparent"
          : "border-border/70 bg-card/90 shadow-lg shadow-black/10 backdrop-blur-sm",
      )}
    >
      {(showPrompt || showStakes) && (
        <div className="flex w-full items-center justify-center gap-3 px-2 py-1 sm:w-auto sm:justify-start sm:py-0 [html[data-keyboard]_&]:w-auto [html[data-keyboard]_&]:shrink-0 [html[data-keyboard]_&]:py-0 max-[359px]:[html[data-keyboard]_&]:hidden">
          {showPrompt && (
            <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <CircleHelp
                className="size-4 shrink-0 text-[var(--lesson-icon)]"
                aria-hidden="true"
              />
              {prompt}
            </span>
          )}
          {showStakes && (
            <>
              {showPrompt && (
                <span aria-hidden="true" className="bg-border hidden h-6 w-px sm:block" />
              )}
              <span
                ref={starsRef}
                role="img"
                aria-label={starsLabel
                  .replace("{n}", String(stars))
                  .replace("{max}", String(maxStars))}
                className="relative inline-grid items-center"
              >
                {/* The stars and, once they are all spent, the note that replaces them
                    share one cell, so the bar is as wide for either and never shifts. */}
                <span className="col-start-1 row-start-1 flex items-center gap-1">
                  {Array.from({ length: maxStars }, (_unused, index) => (
                    <StarPip
                      key={index}
                      index={index}
                      on={index < stars}
                      ghost={ghost && index === stars - 1}
                      hidden={flying && index === flyingIndex}
                      wiped={outOfStars}
                      reduced={reduced}
                    />
                  ))}
                </span>
                {lastStarCosts && noStarsLabel && (
                  <motion.span
                    aria-hidden="true"
                    title={noStarsTitle}
                    initial={false}
                    animate={
                      outOfStars
                        ? reduced
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 1, scale: [1.5, 1], x: [0, -4, 4, -3, 3, 0] }
                        : { opacity: 0, scale: 0.8 }
                    }
                    transition={{
                      duration: outOfStars && !reduced ? 0.5 : 0.2,
                      delay: outOfStars ? 0.3 : 0,
                    }}
                    className="bg-danger/10 text-danger pointer-events-none col-start-1 row-start-1 inline-flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
                  >
                    <Ban className="size-3" aria-hidden="true" />
                    {noStarsLabel}
                  </motion.span>
                )}
                {lostKey > 0 && (
                  <motion.span
                    key={lostKey}
                    aria-hidden="true"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -22 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="text-accent pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold"
                  >
                    −1
                  </motion.span>
                )}
              </span>
            </>
          )}
        </div>
      )}
      {onShowWord && (
        <HelpAction
          onClick={showWord}
          title={
            showStakes ? (hintClosed && noStarsTitle ? noStarsTitle : showWordTitle) : undefined
          }
          disabled={flying || showingWord || hintClosed}
          keepFocus={keepFocus}
          tone="helpful"
          onRisk={setRisk}
          icon={
            <span ref={bulbRef} className="relative inline-flex">
              <Lightbulb
                className={cn(
                  "size-4 transition-[color,filter] duration-300",
                  glow && "text-accent drop-shadow-[0_0_6px_var(--color-accent)]",
                )}
                aria-hidden="true"
              />
            </span>
          }
          ripple={litKey}
        >
          {showWordLabel}
          {price}
        </HelpAction>
      )}
      {onGiveUp && (
        <HelpAction
          onClick={onGiveUp}
          title={giveUpTitle}
          disabled={giveUpDisabled}
          keepFocus={keepFocus}
          tone="quiet"
          icon={<Flag className="size-4" aria-hidden="true" />}
        >
          {giveUpLabel}
        </HelpAction>
      )}
    </motion.div>
  );
}

/** One of the sentence's three stars: lit, off, or (with the pointer on Show the word) the dashed ghost of the one about to go. A star that goes out pops. When every star is spent the three are wiped away, one after the other. */
function StarPip({
  index,
  on,
  ghost,
  hidden,
  wiped,
  reduced,
}: {
  index: number;
  on: boolean;
  ghost: boolean;
  hidden: boolean;
  wiped: boolean;
  reduced: boolean;
}) {
  const was = useRef(on);
  const [pop, setPop] = useState(0);
  useEffect(() => {
    if (was.current && !on) setPop((count) => count + 1);
    was.current = on;
  }, [on]);

  return (
    <motion.span
      key={pop}
      data-pip=""
      initial={pop > 0 ? { scale: 1.5, rotate: -16 } : false}
      animate={
        wiped
          ? { scale: reduced ? 1 : 0, rotate: reduced ? 0 : 140, opacity: 0 }
          : { scale: 1, rotate: 0, opacity: 1 }
      }
      transition={
        wiped
          ? {
              duration: reduced ? 0 : 0.35,
              delay: reduced ? 0 : 0.12 + index * 0.1,
              ease: "easeIn",
            }
          : { type: "spring", stiffness: 360, damping: 13 }
      }
      className={cn("inline-flex", hidden && "opacity-0")}
    >
      <Star
        aria-hidden="true"
        strokeDasharray={ghost ? "2.4 2.4" : undefined}
        className={cn(
          "size-[17px] transition-[fill,color] duration-300",
          on ? "fill-accent text-accent" : "text-muted-foreground/50 fill-transparent",
          ghost && "fill-accent/20 animate-pulse",
        )}
      />
    </motion.span>
  );
}

function HelpAction({
  onClick,
  title,
  disabled = false,
  keepFocus = false,
  tone,
  icon,
  ripple = 0,
  onRisk,
  children,
}: {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  /** Pressing it with the pointer does not move focus onto the button. */
  keepFocus?: boolean;
  tone: "helpful" | "quiet";
  icon: ReactNode;
  /** Changes each time the bulb is lit: a ring ripples out of the button. */
  ripple?: number;
  onRisk?: (risk: boolean) => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseDown={keepFocus ? (event) => event.preventDefault() : undefined}
      title={title}
      disabled={disabled}
      onPointerEnter={onRisk ? () => onRisk(true) : undefined}
      onPointerLeave={onRisk ? () => onRisk(false) : undefined}
      onFocus={onRisk ? () => onRisk(true) : undefined}
      onBlur={onRisk ? () => onRisk(false) : undefined}
      whileHover={reduced || disabled ? undefined : { scale: 1.04 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.95 }}
      className={cn(
        "group/help focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:flex-none pointer-coarse:h-12 [&_svg]:shrink-0 [html[data-keyboard]_&]:gap-1.5 [html[data-keyboard]_&]:px-2",
        // transition-colors only: the base `transition-all` would smooth (and
        // lag) framer-motion's per-frame scale on hover and press.
        "transition-colors duration-200",
        tone === "helpful"
          ? "bg-[var(--lesson-secondary)] text-[var(--lesson-icon)] ring-1 ring-[var(--lesson-primary)]/25 hover:bg-[var(--lesson-primary)] hover:text-white hover:ring-[var(--lesson-primary)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {children}
      <AnimatePresence>
        {ripple > 0 && !reduced && (
          <motion.span
            key={ripple}
            aria-hidden="true"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="border-accent pointer-events-none absolute inset-0 rounded-xl border-2"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
