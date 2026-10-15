import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div>
        <Skeleton className="mb-2 h-9 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-border rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
