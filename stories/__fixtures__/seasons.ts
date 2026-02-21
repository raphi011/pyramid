import type { Season } from "@/components/domain/season-selector";

type Club = { id: string; name: string };

export const clubs: Club[] = [
  { id: "c1", name: "TC Musterstadt" },
  { id: "c2", name: "SC Grünwald" },
];

export const seasons: Season[] = [
  { id: "s1", name: "Sommer 2026", status: "active" },
  { id: "s2", name: "Winter 2025/26", status: "ended" },
  { id: "s3", name: "Sommer 2025", status: "ended" },
];

export const seasonsWithDraft: Season[] = [
  { id: "s0", name: "Herbst 2026", status: "draft" },
  { id: "s1", name: "Sommer 2026", status: "active" },
  { id: "s2", name: "Winter 2025/26", status: "ended" },
];
