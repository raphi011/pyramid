"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/data-list";
import { PageLayout } from "@/components/page-layout";
import { fullName } from "@/lib/utils";
import { enrollInSeasonAction } from "@/app/lib/actions/enroll";
import { routes } from "@/app/lib/routes";
import type { ActionResult } from "@/app/lib/action-result";
import type { ClubRole } from "@/app/lib/db/club";

type SeasonItem = {
  id: number;
  slug: string;
  name: string;
  status: "active" | "ended";
  playerCount: number;
  isIndividual: boolean;
  canEnroll: boolean;
  isEnrolled: boolean;
  clubId: number;
};

type MemberItem = {
  playerId: number;
  firstName: string;
  lastName: string;
  imageId: string | null;
  role: ClubRole;
};

type ClubDetailViewProps = {
  clubSlug: string;
  club: {
    name: string;
    url: string;
    phoneNumber: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    imageId: string | null;
  };
  memberCount: number;
  seasons: SeasonItem[];
  members: MemberItem[];
};

export function ClubDetailView({
  clubSlug,
  club,
  memberCount,
  seasons,
  members,
}: ClubDetailViewProps) {
  const t = useTranslations("clubDetail");
  const router = useRouter();

  const hasAddress = club.address || club.city;
  const addressLine = [
    club.address,
    [club.zip, club.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PageLayout title={club.name}>
      <div className="space-y-6">
        {/* Club Header Card */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center gap-4">
            <Avatar name={club.name} src={club.imageId} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {club.name}
              </h2>
              <Badge variant="subtle" className="mt-1">
                {t("memberCount", { count: memberCount })}
              </Badge>
            </div>
          </div>

          {(hasAddress || club.url || club.phoneNumber) && (
            <div className="mt-4 space-y-2">
              {hasAddress && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPinIcon className="size-4 shrink-0" />
                  <span>{addressLine}</span>
                </div>
              )}
              {club.url && (
                <div className="flex items-center gap-2 text-sm">
                  <GlobeAltIcon className="size-4 shrink-0 text-slate-600 dark:text-slate-400" />
                  <a
                    href={
                      club.url.startsWith("http")
                        ? club.url
                        : `https://${club.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-court-600 hover:underline dark:text-court-400"
                  >
                    {t("website")}
                  </a>
                </div>
              )}
              {club.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <PhoneIcon className="size-4 shrink-0" />
                  <a
                    href={`tel:${club.phoneNumber}`}
                    className="hover:underline"
                  >
                    {club.phoneNumber}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seasons Section */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            {t("seasons")}
          </h3>
          <DataList
            items={seasons}
            keyExtractor={(s) => s.id}
            className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-800"
            empty={{
              icon: <CalendarIcon className="size-10" />,
              title: t("noSeasons"),
              description: t("noSeasonsDescription"),
            }}
            renderItem={(season) => (
              <SeasonRow
                season={season}
                onNavigate={() =>
                  router.push(routes.rankings(clubSlug, season.slug))
                }
              />
            )}
          />
        </section>

        {/* Members Section */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            {t("members")}
          </h3>
          <DataList
            items={members}
            keyExtractor={(m) => m.playerId}
            className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-800"
            empty={{
              title: t("noMembers"),
              description: t("noMembersDescription"),
            }}
            renderItem={(member) => (
              <button
                onClick={() => router.push(routes.player(member.playerId))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Avatar
                  name={fullName(member.firstName, member.lastName)}
                  src={member.imageId}
                  size="sm"
                />
                <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                  {fullName(member.firstName, member.lastName)}
                </span>
                {member.role === "admin" && (
                  <Badge variant="subtle">{t("admin")}</Badge>
                )}
              </button>
            )}
          />
        </section>
      </div>
    </PageLayout>
  );
}

// ── Season row with inline enrollment ─────────────────

function SeasonRow({
  season,
  onNavigate,
}: {
  season: SeasonItem;
  onNavigate: () => void;
}) {
  const t = useTranslations("clubDetail");

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-900 dark:text-white">
            {season.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("playerCount", { count: season.playerCount })}
          </span>
        </div>
        <Badge variant={season.status === "active" ? "info" : "subtle"}>
          {season.status === "active" ? t("activeSeason") : t("endedSeason")}
        </Badge>
      </button>
      <SeasonAction season={season} />
    </div>
  );
}

function SeasonAction({ season }: { season: SeasonItem }) {
  const t = useTranslations("clubDetail");

  if (season.isEnrolled) {
    return (
      <Badge
        variant="info"
        className="bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-300"
      >
        {t("enrolled")}
      </Badge>
    );
  }

  if (season.canEnroll) {
    return <EnrollButton seasonId={season.id} clubId={season.clubId} />;
  }

  return null;
}

function EnrollButton({
  seasonId,
  clubId,
}: {
  seasonId: number;
  clubId: number;
}) {
  const t = useTranslations("clubDetail");
  const tEnroll = useTranslations("enrollment");
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      return enrollInSeasonAction(formData);
    },
    null,
  );

  if (state && "success" in state) {
    return (
      <Badge
        variant="info"
        className="bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-300"
      >
        {t("enrolled")}
      </Badge>
    );
  }

  const error = state && "error" in state ? tEnroll(state.error) : null;

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <form action={formAction}>
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="clubId" value={clubId} />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("joining") : t("join")}
        </Button>
      </form>
    </div>
  );
}
