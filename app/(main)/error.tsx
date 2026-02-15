"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/empty-state";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error.message, error.digest ?? "");
  }, [error]);

  const t = useTranslations("error");

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <EmptyState
        icon={<ExclamationTriangleIcon />}
        title={t("title")}
        description={t("description")}
        action={{ label: t("retry"), onClick: reset }}
      />
    </div>
  );
}
