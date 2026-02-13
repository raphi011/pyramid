"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { CharacterInput } from "@/components/ui/character-input";
import {
  validateCode,
  joinClubAction,
  requestJoinAction,
  type JoinState,
} from "./actions";

type JoinFlowProps = {
  initialCode?: string;
};

const initialState: JoinState = { step: "code-input" };

export function JoinFlow({ initialCode }: JoinFlowProps) {
  const [state, validateAction, isValidating] = useActionState(
    validateCode,
    initialState,
  );
  const [joinState, joinAction, isJoining] = useActionState(
    joinClubAction,
    initialState,
  );
  const [requestState, requestAction, isRequesting] = useActionState(
    requestJoinAction,
    initialState,
  );
  const [code, setCode] = useState(initialCode ?? "");
  const autoSubmitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Actions return complete state, so a non-initial result takes priority
  const currentState = (() => {
    if (requestState.step !== "code-input" || requestState.error)
      return requestState;
    if (joinState.step !== "code-input" || joinState.error) return joinState;
    return state;
  })();

  // Auto-submit when initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.length === 6 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialCode]);

  if (currentState.step === "check-email") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Prüfe deine E-Mails
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen
            Login-Link geschickt.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (currentState.step === "already-member") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Du bist bereits Mitglied von {currentState.clubName}
          </h2>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400"
          >
            Zur Startseite
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (currentState.step === "confirm-join") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentState.clubName} beitreten?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Du kannst dich danach für aktive Saisons anmelden.
            </p>
          </div>

          {currentState.error && (
            <p className="text-center text-sm text-red-600" role="alert">
              {currentState.error}
            </p>
          )}

          <form action={joinAction}>
            <input
              type="hidden"
              name="inviteCode"
              value={currentState.inviteCode}
            />
            <Button type="submit" className="w-full" loading={isJoining}>
              Beitreten
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (currentState.step === "guest-email") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentState.clubName} beitreten
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Melde dich an, um dem Verein beizutreten.
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
              name="clubName"
              value={currentState.clubName}
            />
            <FormField
              label="E-Mail-Adresse"
              type="email"
              placeholder="name@beispiel.de"
              error={currentState.error}
              inputProps={{
                name: "email",
                required: true,
                autoComplete: "email",
              }}
            />

            <Button type="submit" className="w-full" loading={isRequesting}>
              Weiter
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Gib die E-Mail-Adresse ein, mit der du registriert bist.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Default: code-input step
  return (
    <Card>
      <CardContent className="mt-0 space-y-6 p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Verein beitreten
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gib den Einladungscode ein, den du von deinem Verein erhalten hast.
          </p>
        </div>

        <form ref={formRef} action={validateAction} className="space-y-6">
          <input type="hidden" name="code" value={code} />
          <CharacterInput
            value={code}
            onChange={setCode}
            error={!!currentState.error}
          />

          {currentState.error && (
            <p className="text-center text-sm text-red-600" role="alert">
              {currentState.error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6}
            loading={isValidating}
          >
            Weiter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
