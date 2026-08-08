import { cn } from "@/lib/utils";

export function LessonProgress({
  total,
  currentIndex,
  isComplete,
}: {
  total: number;
  currentIndex: number;
  isComplete: boolean;
}) {
  return (
    <div
      className="mb-6 flex gap-1.5"
      role="progressbar"
      aria-label="Lesson progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={isComplete ? total : currentIndex + 1}
    >
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            index < currentIndex || isComplete
              ? "bg-success"
              : index === currentIndex
                ? "bg-primary"
                : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
