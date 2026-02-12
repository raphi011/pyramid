import type { Season } from "@/components/domain/season-selector";
import type { Club } from "@/components/club-switcher";

export const clubs: Club[] = [
  { id: "c1", name: "TC Musterstadt" },
  { id: "c2", name: "SC Grünwald" },
];

export const seasons: Season[] = [
  { id: "s1", name: "Sommer 2026" },
  { id: "s2", name: "Winter 2025/26", archived: true },
  { id: "s3", name: "Sommer 2025", archived: true },
];
