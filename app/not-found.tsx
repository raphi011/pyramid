import { getTranslations } from "next-intl/server";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function RootNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 text-slate-300 dark:text-slate-600">
          <MagnifyingGlassIcon className="size-10" />
        </div>
        <h1 className="text-base font-semibold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {t("description")}
        </p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400 dark:hover:text-court-300"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
