import { segmentMixed, splitBrackets } from "@/lib/public-pages/mixed-text";
import { cn } from "@/lib/utils";

/** Arabic text with English words in it: each run of English is its own left-to-right piece (see segmentMixed). */
export function Mixed({ text }: { text: string }) {
  return (
    <>
      {segmentMixed(text).map((segment, index) =>
        segment.latin ? (
          <bdi key={index} dir="ltr">
            {segment.text}
          </bdi>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/** An English sentence with the part the rule is about in [brackets] coloured: "She [is] at home." */
export function BracketSentence({
  text,
  tone = "brand",
  className,
}: {
  text: string;
  tone?: "brand" | "good" | "bad";
  className?: string;
}) {
  const marked = {
    brand: "text-primary font-semibold",
    good: "text-success font-semibold",
    bad: "text-danger font-semibold line-through decoration-2",
  }[tone];
  return (
    <span dir="ltr" lang="en" className={cn("inline-block text-left", className)}>
      {splitBrackets(text).map((part, index) => (
        <span key={index} className={part.marked ? marked : undefined}>
          {part.text}
        </span>
      ))}
    </span>
  );
}
