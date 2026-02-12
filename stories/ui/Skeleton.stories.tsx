import preview from "#.storybook/preview";
import { Skeleton } from "@/components/ui/skeleton";

const meta = preview.meta({
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const TextLine = meta.story({
  args: { className: "h-4 w-48" },
});

export const Circle = meta.story({
  args: { className: "size-10 rounded-full" },
});

export const Card = meta.story({
  render: () => (
    <div className="w-72 space-y-3 rounded-2xl p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
});

export const ListItems = meta.story({
  render: () => (
    <div className="w-72 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  ),
});
