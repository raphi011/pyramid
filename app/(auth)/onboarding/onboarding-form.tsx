"use client";

import { useActionState, useState } from "react";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { completeOnboarding, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState,
  );
  const [name, setName] = useState("");

  return (
    <Card>
      <CardContent className="mt-0 space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Willkommen!
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vervollständige dein Profil
          </p>
        </div>

        <div className="flex justify-center">
          <Avatar name={name || "?"} size="xl" />
        </div>

        <form action={formAction} className="space-y-4">
          <FormField
            label="Name"
            placeholder="Max Mustermann"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={state.error}
            required
            inputProps={{ name: "name" }}
          />
          <FormField
            label="Telefon"
            type="tel"
            placeholder="+49 170 1234567"
            inputProps={{ name: "phone" }}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim()}
            loading={isPending}
          >
            Weiter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
