"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  validateSeasonCode,
  joinSeasonAction,
  requestSeasonJoinAction,
  type SeasonJoinState,
} from "./actions";

type SeasonJoinFlowProps = {
  initialCode?: string;
};

const initialState: SeasonJoinState = { step: "loading" };

export function SeasonJoinFlow({ initialCode }: SeasonJoinFlowProps) {
  const t = useTranslations("seasonJoin");
  const [validateState, validateAction, isValidating] = useActionState(
    validateSeasonCode,
    initialState,
  );
  const [joinState, joinAction, isJoining] = useActionState(
    joinSeasonAction,
    initialState,
  );
  const [requestState, requestAction, isRequesting] = useActionState(
    requestSeasonJoinAction,
    initialState,
  );
  const autoSubmitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const code = initialCode ?? "";

  // State priority: latest user action wins.
  // requestState (guest magic link) > joinState (auth user join) > validateState (code validation)
  const currentState = (() => {
    if (requestState.step !== "loading") return requestState;
    if (joinState.step !== "loading") return joinState;
    return validateState;
  })();

  // Auto-submit code validation when initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.length === 6 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialCode]);

  // ── Check Email ─────────────────────────────────────
  if (currentState.step === "check-email") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("checkEmail")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("checkEmailDesc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Already Enrolled ────────────────────────────────
  if (currentState.step === "already-enrolled") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("alreadyEnrolled")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("alreadyEnrolledDesc", {
              season: currentState.seasonName ?? "",
            })}
          </p>
          <Link
            href="/rankings"
            className="inline-block text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400"
          >
            {t("goToRankings")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Error ───────────────────────────────────────────
  if (currentState.step === "error") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("errorTitle")}
          </h2>
          <p className="text-sm text-red-600">
            {currentState.error ? t(currentState.error) : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Authenticated: Confirm Join ─────────────────────
  if (currentState.step === "season-info") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("joinTitle", { season: currentState.seasonName ?? "" })}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentState.clubName}
            </p>
          </div>

          {currentState.error && (
            <p className="text-center text-sm text-red-600" role="alert">
              {t(currentState.error)}
            </p>
          )}

          <form action={joinAction}>
            <input
              type="hidden"
              name="inviteCode"
              value={currentState.inviteCode}
            />
            <Button type="submit" className="w-full" loading={isJoining}>
              {t("join")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ── Guest: Name + Email Form ────────────────────────
  if (currentState.step === "guest-form") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("joinTitle", { season: currentState.seasonName ?? "" })}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentState.clubName}
            </p>
          </div>

          <form action={requestAction} className="space-y-4">
            <input
              type="hidden"
              name="inviteCode"
              value={currentState.inviteCode}
            />
            <input
              type="hidden"
              name="seasonName"
              value={currentState.seasonName}
            />
            <input
              type="hidden"
              name="clubName"
              value={currentState.clubName}
            />
            <FormField
              label={t("firstNameLabel")}
              inputProps={{
                name: "firstName",
                required: true,
                autoComplete: "given-name",
              }}
            />
            <FormField
              label={t("lastNameLabel")}
              inputProps={{
                name: "lastName",
                required: true,
                autoComplete: "family-name",
              }}
            />
            <FormField
              label={t("emailLabel")}
              type="email"
              error={currentState.error ? t(currentState.error) : undefined}
              inputProps={{
                name: "email",
                required: true,
                autoComplete: "email",
              }}
            />

            <Button type="submit" className="w-full" loading={isRequesting}>
              {t("submitEmail")}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {t("emailHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Loading / Initial: hidden form for auto-submit ──
  return (
    <form ref={formRef} action={validateAction}>
      <input type="hidden" name="code" value={code} />
    </form>
  );
}
