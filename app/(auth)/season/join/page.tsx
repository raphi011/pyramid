import type { Metadata } from "next";
import { sql } from "@/app/lib/db";
import { getSeasonByInviteCode } from "@/app/lib/db/season";
import { SeasonJoinFlow } from "./season-join-flow";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { code } = await searchParams;
  if (!code) {
    return { title: "Saison beitreten" };
  }

  const season = await getSeasonByInviteCode(sql, code);
  if (!season) {
    return { title: "Saison beitreten" };
  }

  const imageUrl = season.clubImageId
    ? `/api/images/${season.clubImageId}`
    : undefined;

  return {
    title: `${season.name} beitreten`,
    description: `${season.clubName} \u2014 Tritt der Saison bei`,
    openGraph: {
      title: `${season.name} beitreten`,
      description: `${season.clubName} \u2014 Tritt der Saison bei`,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  };
}

export default async function SeasonJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return <SeasonJoinFlow initialCode={code} />;
}
