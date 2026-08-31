import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-base font-semibold tracking-tight",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-6.5 items-center justify-center rounded-md text-sm font-bold">
        S
      </span>
      <span>SentenceStep</span>
    </span>
  );
}
