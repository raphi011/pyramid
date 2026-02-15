import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/card";

export const metadata: Metadata = { title: "E-Mail pr\u00fcfen" };

export default async function CheckEmailPage() {
  const t = await getTranslations("checkEmail");

  return (
    <Card className="p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-court-100 dark:bg-court-900/30">
        <EnvelopeIcon className="h-6 w-6 text-court-600 dark:text-court-400" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        {t("title")}
      </h2>

      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        {t("description")}
      </p>

      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("expiry")}
        </p>

        <Button href="/login" variant="outline" className="w-full">
          {t("backToLogin")}
        </Button>
      </div>
    </Card>
  );
}
