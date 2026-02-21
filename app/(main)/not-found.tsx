import { getTranslations } from "next-intl/server";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default async function MainNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <EmptyState
          icon={<MagnifyingGlassIcon />}
          title={t("title")}
          description={t("description")}
        />
        <Link
          href="/feed"
          className="mt-4 text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400 dark:hover:text-court-300"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
