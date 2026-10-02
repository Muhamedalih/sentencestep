"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LEARNING_SECTION_LABELS } from "@/lib/admin/learning-sections";
import { BADGE_DEFS, QUEST_TYPES } from "@/lib/features/catalog";
import type { BadgeId, QuestType } from "@/lib/features/catalog";
import {
  DAILY_SESSION_SIZE_RANGE,
  FEATURE_IDS,
  FEATURE_SECTIONS,
  MONTHLY_FREEZES_RANGE,
} from "@/lib/features/config";
import type { FeatureConfig, FeatureId, FeatureState } from "@/lib/features/config";
import { saveFeatureConfig } from "@/lib/features/actions";
import { cn } from "@/lib/utils";

const FEATURE_COPY: Record<FeatureId, { title: string; description: string }> = {
  dictation: {
    title: "Dictation",
    description:
      "A toggle in the lesson header that hides the sentence: the learner listens, types the whole sentence, presses Enter, and sees a colored diff. Works for guests too.",
  },
  fromMemory: {
    title: "From memory (Arabic → English)",
    description:
      "An optional button on the lesson-completion screen: the learner sees the support-language sentence and types the English from memory. Works for guests too.",
  },
  personalCards: {
    title: "Personal word cards",
    description:
      "A save star on the current-word card, a My Cards page with spaced review (1/3/7/16 days) and an Anki TSV export. Signed-in learners only. The section switches control where the save star appears.",
  },
  dailySession: {
    title: "Daily session",
    description:
      "A card at the top of Home that gathers everything due for review into one short session. Signed-in learners only.",
  },
  quests: {
    title: "Daily quests",
    description:
      "Three random quests per learner per day from the pool below, each granting bonus XP. Signed-in learners only.",
  },
  badges: {
    title: "Badges & achievements",
    description:
      "Permanent badges with a celebration on the lesson-completion screen and an Achievements page. Past progress is awarded retroactively. Signed-in learners only.",
  },
  streakCalendar: {
    title: "Streak calendar & freeze",
    description:
      "A 7-day strip on Home (tap for the month) and a monthly balance of streak freezes that automatically protect extra missed days. The existing one-day grace stays. Signed-in learners only.",
  },
  smartWords: {
    title: "Smart word practice (Word Lists)",
    description:
      "The upgraded Word Lists practice: every word gets a strength from 0 to 5 and comes back on a 1/3/7/16/30-day schedule (a miss sends it back), a word you missed is never wiped from the weak list, Continue starts at the first words that aren't locked in, a due-today card, keystrokes typed while a word settles are kept, Enter skips the answer screen, a first-letter hint and “I don't know” that cost stars, British spellings and synonyms accepted, the word is spoken after the attempt, and a separate listen-and-type mode. Everything else works for guests too; the schedule needs a signed-in account. Admin preview shows all of it to admins only; turn it On to roll it out to everyone.",
  },
};

const STATE_OPTIONS: { value: FeatureState; label: string; hint: string }[] = [
  { value: "off", label: "Off", hint: "Nobody sees it" },
  { value: "admin", label: "Admin preview", hint: "Only admins see it on the live site" },
  { value: "on", label: "On", hint: "Everyone (subject to the switches below)" },
];

const QUEST_LABELS: Record<QuestType, string> = {
  sentences: "Type N sentences",
  lessons: "Complete N lessons",
  accuracy: "Finish a lesson with 95%+ accuracy",
  masterWords: "Master N words (clean reviews)",
  dictation: "Complete N dictation sentences",
  dailySession: "Finish today's session",
};

const BADGE_LABELS: Record<BadgeId, string> = {
  streak3: "3-day streak",
  streak7: "7-day streak",
  streak30: "30-day streak",
  streak100: "100-day streak",
  sentences100: "100 sentences",
  sentences500: "500 sentences",
  sentences1000: "1,000 sentences",
  lessons1: "First lesson",
  lessons10: "10 lessons",
  lessons50: "50 lessons",
  perfectLesson: "A perfect (100%) lesson",
  wpm30: "30 WPM",
  wpm50: "50 WPM",
  wpm70: "70 WPM",
  levelExplorer: "Level: Explorer",
  levelBuilder: "Level: Builder",
  levelFluent: "Level: Fluent",
  levelAdvanced: "Level: Advanced",
  words25: "25 words fixed",
  words100: "100 words fixed",
  firstDictation: "First dictation",
  firstFromMemory: "First from-memory round",
  firstCard: "First saved word card",
  firstDailySession: "First daily session",
  questDay: "All daily quests in one day",
};

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className="w-28"
      />
    </label>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Switch right beside its label (for a row of several short options) instead of pushed to the far edge — otherwise each switch reads as belonging to its neighbour's label. */
  compact?: boolean;
}) {
  const control = (
    <Switch
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
  );
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {control}
        <p className="text-sm font-medium">{label}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      {control}
    </div>
  );
}

export function FeaturesForm({ initial }: { initial: FeatureConfig }) {
  const [config, setConfig] = useState<FeatureConfig>(initial);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function update(mutate: (draft: FeatureConfig) => void) {
    setConfig((current) => {
      const draft = structuredClone(current);
      mutate(draft);
      return draft;
    });
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveFeatureConfig(config);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {FEATURE_IDS.map((id) => {
        const entry = config.features[id];
        const sections = FEATURE_SECTIONS[id];
        return (
          <Card key={id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-lg">{FEATURE_COPY[id].title}</CardTitle>
                <Badge variant={entry.state === "on" ? "default" : "muted"}>
                  {STATE_OPTIONS.find((option) => option.value === entry.state)?.label}
                </Badge>
              </div>
              <CardDescription>{FEATURE_COPY[id].description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div
                role="radiogroup"
                aria-label={`${FEATURE_COPY[id].title} availability`}
                className="flex flex-wrap gap-2"
              >
                {STATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={entry.state === option.value}
                    title={option.hint}
                    onClick={() =>
                      update((draft) => {
                        draft.features[id].state = option.value;
                      })
                    }
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                      entry.state === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <SwitchRow
                label="Premium only"
                hint="Only Premium learners (and admins) see it. Automatically open to everyone while Free access is on."
                checked={entry.premiumOnly}
                onChange={(checked) =>
                  update((draft) => {
                    draft.features[id].premiumOnly = checked;
                  })
                }
              />

              {sections.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Where it appears</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {sections.map((section) => (
                      <SwitchRow
                        key={section}
                        compact
                        label={LEARNING_SECTION_LABELS[section]}
                        checked={entry.sections[section] !== false}
                        onChange={(checked) =>
                          update((draft) => {
                            draft.features[id].sections[section] = checked;
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {id === "dictation" && (
                <div className="flex flex-col gap-3">
                  <SwitchRow
                    label="Check letter by letter"
                    hint="Every letter is checked the moment it is typed: a wrong letter is turned away (and counted), the word's audio plays again, and after two misses in a row the learner can peek at the word or give up and finish the sentence in the normal view. Off, the learner types the whole sentence and checks it with Enter, as an exam."
                    checked={config.options.dictation.letterByLetter}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dictation.letterByLetter = checked;
                      })
                    }
                  />
                  <SwitchRow
                    label="Show word-length blanks"
                    hint="Draws a blank under every hidden letter so the learner knows how many words and letters to expect, and lets them tap a word to hear it (and peek at it in letter-by-letter mode). Off, the learner only sees what they have typed."
                    checked={config.options.dictation.showWordBlanks}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dictation.showWordBlanks = checked;
                      })
                    }
                  />
                </div>
              )}

              {id === "fromMemory" && (
                <div className="flex flex-col gap-3">
                  <SwitchRow
                    label="Allow “reveal a word”"
                    checked={config.options.fromMemory.allowReveal}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.fromMemory.allowReveal = checked;
                      })
                    }
                  />
                  <SwitchRow
                    label="Show first letters as a hint"
                    checked={config.options.fromMemory.showFirstLetters}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.fromMemory.showFirstLetters = checked;
                      })
                    }
                  />
                </div>
              )}

              {id === "dailySession" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-6">
                    <NumberField
                      label="Items per session"
                      value={config.options.dailySession.size}
                      min={DAILY_SESSION_SIZE_RANGE.min}
                      max={DAILY_SESSION_SIZE_RANGE.max}
                      onChange={(value) =>
                        update((draft) => {
                          draft.options.dailySession.size = value;
                        })
                      }
                    />
                    <NumberField
                      label="XP for finishing"
                      value={config.options.dailySession.xpReward}
                      min={0}
                      max={100}
                      onChange={(value) =>
                        update((draft) => {
                          draft.options.dailySession.xpReward = value;
                        })
                      }
                    />
                  </div>
                  <p className="text-sm font-medium">Sources</p>
                  <SwitchRow
                    label="Typing mistakes + weak words"
                    checked={config.options.dailySession.sources.mistakesAndWeakWords}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dailySession.sources.mistakesAndWeakWords = checked;
                      })
                    }
                  />
                  <SwitchRow
                    label="Vocabulary Recall (words from lessons and stories)"
                    checked={config.options.dailySession.sources.vocabularyRecall}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dailySession.sources.vocabularyRecall = checked;
                      })
                    }
                  />
                  <SwitchRow
                    label="Word Lists still to lock in"
                    checked={config.options.dailySession.sources.wordLists}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dailySession.sources.wordLists = checked;
                      })
                    }
                  />
                  <SwitchRow
                    label="Personal word cards that are due"
                    checked={config.options.dailySession.sources.personalCards}
                    onChange={(checked) =>
                      update((draft) => {
                        draft.options.dailySession.sources.personalCards = checked;
                      })
                    }
                  />
                </div>
              )}

              {id === "quests" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Quest pool</p>
                  {QUEST_TYPES.map((type) => {
                    const quest = config.options.quests.types[type];
                    return (
                      <div
                        key={type}
                        className="border-border flex flex-wrap items-end justify-between gap-4 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Switch
                            checked={quest.enabled}
                            aria-label={QUEST_LABELS[type]}
                            onChange={(event) =>
                              update((draft) => {
                                draft.options.quests.types[type].enabled = event.target.checked;
                              })
                            }
                          />
                          <span className="text-sm font-medium">{QUEST_LABELS[type]}</span>
                        </div>
                        <div className="flex gap-4">
                          <NumberField
                            label="Target"
                            value={quest.target}
                            min={1}
                            max={200}
                            onChange={(value) =>
                              update((draft) => {
                                draft.options.quests.types[type].target = value;
                              })
                            }
                          />
                          <NumberField
                            label="XP"
                            value={quest.xp}
                            min={0}
                            max={100}
                            onChange={(value) =>
                              update((draft) => {
                                draft.options.quests.types[type].xp = value;
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {id === "badges" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Badge catalog</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {BADGE_DEFS.map((badge) => (
                      <SwitchRow
                        key={badge.id}
                        compact
                        label={BADGE_LABELS[badge.id]}
                        checked={!config.options.badges.disabled.includes(badge.id)}
                        onChange={(checked) =>
                          update((draft) => {
                            const disabled = new Set(draft.options.badges.disabled);
                            if (checked) disabled.delete(badge.id);
                            else disabled.add(badge.id);
                            draft.options.badges.disabled = [...disabled];
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {id === "streakCalendar" && (
                <NumberField
                  label="Free streak freezes per month"
                  value={config.options.streakCalendar.monthlyFreezes}
                  min={MONTHLY_FREEZES_RANGE.min}
                  max={MONTHLY_FREEZES_RANGE.max}
                  onChange={(value) =>
                    update((draft) => {
                      draft.options.streakCalendar.monthlyFreezes = value;
                    })
                  }
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="bg-background/90 sticky bottom-0 -mx-2 flex flex-wrap items-center gap-4 border-t px-2 py-4 backdrop-blur-md">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save feature settings"}
        </Button>
        {message && (
          <p
            role={message.kind === "error" ? "alert" : undefined}
            className={cn(
              "text-sm",
              message.kind === "error" ? "text-danger" : "text-muted-foreground",
            )}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
