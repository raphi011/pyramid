"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  UserPlusIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  enrollInSeasonAction,
  type EnrollResult,
} from "@/app/lib/actions/enroll";

type EnrollmentBannerProps = {
  seasonId: number;
  clubId: number;
  canEnroll: boolean;
};

export function EnrollmentBanner({
  seasonId,
  clubId,
  canEnroll,
}: EnrollmentBannerProps) {
  const t = useTranslations("enrollment");

  if (canEnroll) {
    return <EnrollableCard seasonId={seasonId} clubId={clubId} />;
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <InformationCircleIcon className="size-6 shrink-0 text-slate-500 dark:text-slate-400" />
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("contactAdmin")}
      </p>
    </div>
  );
}

function EnrollableCard({
  seasonId,
  clubId,
}: {
  seasonId: number;
  clubId: number;
}) {
  const t = useTranslations("enrollment");
  const [state, formAction, isPending] = useActionState(
    async (_prev: EnrollResult | null, formData: FormData) => {
      return enrollInSeasonAction(formData);
    },
    null,
  );

  const error = state && "error" in state ? t(state.error) : null;

  return (
    <div className="mb-4 rounded-2xl bg-court-50 p-4 ring-1 ring-court-200 dark:bg-court-950 dark:ring-court-800">
      <div className="flex items-center gap-3">
        <UserPlusIcon className="size-6 shrink-0 text-court-600 dark:text-court-400" />
        <p className="flex-1 text-sm text-court-800 dark:text-court-200">
          {t("notEnrolled")}
        </p>
        <form action={formAction}>
          <input type="hidden" name="seasonId" value={seasonId} />
          <input type="hidden" name="clubId" value={clubId} />
          <Button type="submit" size="sm" disabled={isPending}>
            {t("joinSeason")}
          </Button>
        </form>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
