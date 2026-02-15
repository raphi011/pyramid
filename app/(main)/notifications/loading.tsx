import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header + mark all read */}
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>

      {/* Notification items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
