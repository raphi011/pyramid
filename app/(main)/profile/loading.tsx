import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Scope tabs */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <Skeleton className="mb-1 h-3 w-12" />
            <Skeleton className="h-7 w-8" />
          </div>
        ))}
      </div>

      {/* Rank chart */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* Match history */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
