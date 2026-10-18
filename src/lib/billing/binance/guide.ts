/** One piece of a guide step: plain text, or a button name or a value shown as a chip. */
export interface GuideSegment {
  text: string;
  chip: boolean;
}

/** What the guide says about this particular order: where to send, how much, and the code for the note. */
export interface GuideValues {
  id: string;
  amount: string;
  code: string;
}

/**
 * A step of the "how to send it" guide is written once per language, with what
 * a learner taps or types in [square brackets] and this order's own numbers as
 * {id}, {amount} and {code}. This puts the numbers in and cuts the step into
 * plain text and chips (whatever was in brackets), so a translator never
 * touches markup and a step can't forget the learner's own figures.
 */
export function guideSegments(step: string, values: GuideValues): GuideSegment[] {
  const filled = step
    .replaceAll("{id}", values.id)
    .replaceAll("{amount}", values.amount)
    .replaceAll("{code}", values.code);

  return filled
    .split(/(\[[^\]]+\])/g)
    .filter((part) => part !== "")
    .map((part) =>
      part.startsWith("[") && part.endsWith("]")
        ? { text: part.slice(1, -1), chip: true }
        : { text: part, chip: false },
    );
}
