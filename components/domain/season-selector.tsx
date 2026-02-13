"use client";

import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Season = {
  id: string | number;
  name: string;
  status?: "draft" | "active" | "ended";
  archived?: boolean;
};

type SeasonSelectorProps = {
  seasons: Season[];
  value?: string | number;
  onChange?: (seasonId: string) => void;
  className?: string;
};

function SeasonSelector({
  seasons,
  value,
  onChange,
  className,
}: SeasonSelectorProps) {
  const t = useTranslations("season");

  return (
    <Select
      aria-label={t("selectSeason")}
      value={value?.toString() ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn("w-48", className)}
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id.toString()}>
          {season.name}
          {season.status === "draft" ? ` ${t("draft")}` : ""}
          {season.archived ? ` ${t("archived")}` : ""}
        </option>
      ))}
    </Select>
  );
}

export { SeasonSelector };
export type { SeasonSelectorProps, Season };
