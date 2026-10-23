import type { ReactNode } from "react";

/** A template with `{name}` placeholders filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

/**
 * A line with `{xp} XP` in it ("Finish all three and earn {xp} XP", "+{xp} XP"), the amount kept in
 * one left-to-right piece — its "+" included — so "+35 XP" reads the right way round inside Arabic text.
 */
export function withXp(template: string, xp: number): ReactNode {
  const match = /(\+?)\{xp\}(\s*XP)?/.exec(template);
  if (!match) return template;
  return (
    <>
      {template.slice(0, match.index)}
      <bdi dir="ltr">
        {match[1]}
        {xp} XP
      </bdi>
      {template.slice(match.index + match[0].length)}
    </>
  );
}
