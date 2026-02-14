"use client";

import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

type AdminBannerVariant = "info" | "warning";

type AdminMessage = {
  id: string;
  variant?: AdminBannerVariant;
  title: string;
  description?: string;
};

type AdminBannerProps = AdminMessage & {
  onClose?: (id: string) => void;
};

const variantStyles: Record<
  AdminBannerVariant,
  { container: string; icon: React.ReactNode }
> = {
  info: {
    container: "bg-sky-50 ring-sky-200 dark:bg-sky-950/40 dark:ring-sky-800",
    icon: <InformationCircleIcon className="size-5 text-sky-500" />,
  },
  warning: {
    container:
      "bg-trophy-50 ring-trophy-200 dark:bg-trophy-600/10 dark:ring-trophy-600/30",
    icon: <ExclamationTriangleIcon className="size-5 text-trophy-500" />,
  },
};

function AdminBanner({
  id,
  variant = "info",
  title,
  description,
  onClose,
}: AdminBannerProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl p-3 ring-1",
        styles.container,
      )}
    >
      <span className="shrink-0 pt-0.5">{styles.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="shrink-0 rounded-lg p-0.5 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XMarkIcon className="size-4" />
          <span className="sr-only">Schließen</span>
        </button>
      )}
    </div>
  );
}

export { AdminBanner };
export type { AdminBannerProps, AdminMessage, AdminBannerVariant };
