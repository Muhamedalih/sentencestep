import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xl font-semibold tracking-tight",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-base font-bold">
        L
      </span>
      <span>Looma</span>
    </span>
  );
}
