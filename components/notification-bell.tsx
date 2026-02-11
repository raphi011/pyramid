"use client";

import { useTranslations } from "next-intl";
import { BellIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  count?: number;
  pulsing?: boolean;
  onClick?: () => void;
  className?: string;
};

function NotificationBell({
  count = 0,
  pulsing,
  onClick,
  className,
}: NotificationBellProps) {
  const t = useTranslations("notifications");

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xl",
        "text-slate-600 transition-colors duration-150",
        "hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
        className,
      )}
      aria-label={
        count > 0 ? t("ariaLabelWithCount", { count }) : t("ariaLabel")
      }
    >
      <BellIcon className="size-5" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center",
            "rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
            pulsing && "animate-pulse",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export { NotificationBell };
export type { NotificationBellProps };
