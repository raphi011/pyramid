"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { createChallengeAction } from "@/app/lib/actions/challenge";

type Opponent = {
  teamId: number;
  name: string;
  rank: number;
  avatarSrc?: string | null;
};

type ChallengeSheetProps = {
  open: boolean;
  onClose: () => void;
  target?: Opponent | null;
  opponents: Opponent[];
  seasonId: number;
  seasons?: { id: number; name: string }[];
};

type Step = "season" | "pick" | "confirm";

function getInitialStep(
  target: Opponent | null | undefined,
  seasons: { id: number; name: string }[] | undefined,
): Step {
  if (target) return "confirm";
  if (seasons && seasons.length >= 2) return "season";
  return "pick";
}

/**
 * Wrapper that increments a key on every false-to-true open transition,
 * causing ChallengeSheetInner to remount with fresh state.
 * Uses the "storing previous render value in state" pattern from React docs
 * to avoid refs during render.
 */
function ChallengeSheet(props: ChallengeSheetProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  if (props.open && !prevOpen) {
    setOpenCount((c) => c + 1);
  }
  if (props.open !== prevOpen) {
    setPrevOpen(props.open);
  }

  return <ChallengeSheetInner key={openCount} {...props} />;
}

function ChallengeSheetInner({
  open,
  onClose,
  target,
  opponents,
  seasonId,
  seasons,
}: ChallengeSheetProps) {
  const t = useTranslations("challenge");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<Step>(() => getInitialStep(target, seasons));
  const [selectedTarget, setSelectedTarget] = useState<Opponent | null>(
    target ?? null,
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasonId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSeasonSelect = useCallback((id: number) => {
    setSelectedSeasonId(id);
    setStep("pick");
  }, []);

  const handleOpponentSelect = useCallback((opponent: Opponent) => {
    setSelectedTarget(opponent);
    setStep("confirm");
  }, []);

  const handleBack = useCallback(() => {
    setError(null);
    if (!target) {
      // FAB flow — go back to opponent picker
      setStep("pick");
    } else {
      // Direct target (from pyramid tap) — back means close
      handleClose();
    }
  }, [target, handleClose]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        const result = await createChallengeAction(formData);
        if ("error" in result) {
          const errorKey = result.error.startsWith("challenge.")
            ? result.error.slice("challenge.".length)
            : result.error;
          setError(t(errorKey));
        } else {
          handleClose();
        }
      });
    },
    [t, handleClose],
  );

  // Determine dialog title based on step
  const title =
    step === "season"
      ? t("selectSeason")
      : step === "pick"
        ? t("selectOpponent")
        : selectedTarget
          ? t("confirmTitle", { name: selectedTarget.name })
          : t("title");

  return (
    <ResponsiveDialog open={open} onClose={handleClose} title={title}>
      {/* Step: Season selection */}
      {step === "season" && seasons && (
        <div className="space-y-2">
          {seasons.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSeasonSelect(s.id)}
              className="flex w-full items-center rounded-xl bg-white p-4 text-left ring-1 ring-slate-200 transition-shadow hover:shadow-sm dark:bg-slate-900 dark:ring-slate-800"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step: Opponent picker */}
      {step === "pick" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("challengeableHeading")}
          </h3>
          <DataList
            items={opponents}
            keyExtractor={(o) => o.teamId}
            empty={{
              title: t("noOpponents"),
              description: t("noOpponentsDesc"),
            }}
            renderItem={(opponent) => (
              <button
                type="button"
                onClick={() => handleOpponentSelect(opponent)}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-slate-200 transition-shadow hover:shadow-sm dark:bg-slate-900 dark:ring-slate-800"
              >
                <Avatar
                  name={opponent.name}
                  src={opponent.avatarSrc}
                  size="md"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                  {opponent.name}
                </span>
                <Badge variant="rank" size="sm">
                  {opponent.rank}
                </Badge>
              </button>
            )}
          />
        </div>
      )}

      {/* Step: Confirm challenge */}
      {step === "confirm" && selectedTarget && (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          {/* Opponent info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <Avatar
              name={selectedTarget.name}
              src={selectedTarget.avatarSrc}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedTarget.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("rank", { rank: selectedTarget.rank })}
              </p>
            </div>
          </div>

          {/* Message textarea */}
          <FormField
            type="textarea"
            label={t("messageLabel")}
            placeholder={t("messagePlaceholder")}
            inputProps={{ name: "challengeText", rows: 3 }}
          />

          {/* Hidden inputs */}
          <input type="hidden" name="seasonId" value={selectedSeasonId} />
          <input
            type="hidden"
            name="challengeeTeamId"
            value={selectedTarget.teamId}
          />

          {/* Error display */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={handleBack}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-court-500 text-white hover:bg-court-600"
              loading={isPending}
            >
              {t("submit")}
            </Button>
          </div>
        </form>
      )}
    </ResponsiveDialog>
  );
}

export { ChallengeSheet };
export type { ChallengeSheetProps, Opponent };
