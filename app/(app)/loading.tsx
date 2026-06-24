import { TopLoader } from "@/components/shared/TopLoader";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown instantly on every office-app navigation while the server component
 * streams in — the page frame stays put and content fills with skeletons, so
 * navigation feels immediate rather than frozen.
 */
export default function AppLoading() {
  return (
    <div className="animate-slide-up-fade">
      <TopLoader />

      {/* Header */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat / filter row */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20 rounded-pill" />
        <Skeleton className="h-8 w-24 rounded-pill" />
        <Skeleton className="h-8 w-20 rounded-pill" />
      </div>

      {/* List rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 shadow-card"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-pill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
