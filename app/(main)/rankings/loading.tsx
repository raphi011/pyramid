import { Skeleton } from "@/components/ui/skeleton";

export default function RankingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header with title + season selector */}
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      {/* Tabs (Pyramid / List / Matches) */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Pyramid grid placeholder */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <Skeleton className="h-14 w-20 rounded-xl" />
        </div>
        <div className="flex justify-center gap-2">
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
        </div>
        <div className="flex justify-center gap-2">
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
        </div>
        <div className="flex justify-center gap-2">
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
          <Skeleton className="h-14 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
