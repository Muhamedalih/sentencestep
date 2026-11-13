import { iconForGroup } from "@/components/app/word-group-card";
import { WordCoverArt } from "@/components/words/word-cover-art";
import { cn } from "@/lib/utils";
import type { MapTopic } from "@/lib/words-map/load";

/**
 * A topic's picture, the same drawing (or the picture an admin chose) the Words page's covers use,
 * filling its parent: the parent sets the shape (a circle on the board, a rounded box on the band)
 * and must be `relative` with `overflow-hidden`.
 */
export function TopicPicture({
  topic,
  dimmed = false,
  className,
}: {
  topic: Pick<MapTopic, "title" | "level" | "coverUrl">;
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 block",
        dimmed && "brightness-[.6] saturate-[.35]",
        className,
      )}
    >
      {topic.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- the admin's own picture, already cropped and compressed by the server (see word-covers-image.ts).
        <img
          src={topic.coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <WordCoverArt title={topic.title} level={topic.level} Icon={iconForGroup(topic.title)} />
      )}
    </span>
  );
}

/** A progress ring around a circle: `ratio` of it drawn, green when the topic is all met. */
export function ProgressRing({
  ratio,
  size,
  stroke,
  className,
}: {
  ratio: number;
  size: number;
  stroke: number;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const done = ratio >= 1;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("absolute inset-0 size-full", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />
      {ratio > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(length * Math.min(1, ratio)).toFixed(1)} ${length.toFixed(1)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={done ? "stroke-success" : "stroke-primary"}
        />
      )}
    </svg>
  );
}
