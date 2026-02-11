import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  win: "bg-court-100 text-court-700 dark:bg-court-950 dark:text-court-400",
  loss: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  pending: "bg-trophy-100 text-trophy-600 dark:bg-trophy-500/10 dark:text-trophy-400",
  rank: "bg-trophy-500 text-white",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  default: "px-2 py-0.5 text-xs",
} as const;

export type BadgeVariant = keyof typeof variants;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
  size?: keyof typeof sizes;
};

function Badge({
  className,
  variant = "info",
  size = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
