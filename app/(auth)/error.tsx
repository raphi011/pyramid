"use client";

import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/empty-state";

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <EmptyState
      icon={<ExclamationTriangleIcon />}
      title={t("title")}
      description={t("description")}
      action={{ label: t("retry"), onClick: reset }}
    />
  );
}
