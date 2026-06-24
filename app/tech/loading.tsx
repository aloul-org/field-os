import { TopLoader } from "@/components/shared/TopLoader";
import { Skeleton } from "@/components/ui/skeleton";

/** Instant skeleton for the technician PWA (dark) during navigation. */
export default function TechLoading() {
  return (
    <div className="animate-slide-up-fade p-4">
      <TopLoader />
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <Skeleton className="mb-3 h-5 w-2/3" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
