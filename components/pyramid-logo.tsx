import { cn } from "@/lib/utils";

type PyramidLogoProps = {
  size?: "sm" | "md";
  className?: string;
};

function PyramidLogo({ size = "md", className }: PyramidLogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-court-500 text-white",
        size === "sm" ? "size-8 rounded-xl" : "size-12",
        className,
      )}
    >
      <svg
        className={size === "sm" ? "size-4" : "size-6"}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m-.53-.53L21 21M3 21l8.735-8.735m0 0a.374.374 0 11-.53-.53m.53.53l-.53-.53"
        />
      </svg>
    </div>
  );
}

export { PyramidLogo };
