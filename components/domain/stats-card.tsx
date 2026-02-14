"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/card";

function StatsCard({ wins, losses }: { wins: number; losses: number }) {
  const t = useTranslations("profile");
  const total = wins + losses;
  const rate = total === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`;

  return (
    <Card>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {wins}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("winsLabel")}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {losses}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("lossesLabel")}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {rate}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("winRateLabel")}
          </p>
        </div>
      </div>
    </Card>
  );
}

export { StatsCard };
