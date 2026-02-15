"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { fullName } from "@/lib/utils";
import { completeOnboarding, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState,
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <Card>
      <CardContent className="mt-0 space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("welcome")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex justify-center">
          <Avatar
            name={firstName ? fullName(firstName, lastName) : "?"}
            size="xl"
          />
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          )}
          <FormField
            label={t("firstNameLabel")}
            placeholder={t("firstNamePlaceholder")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            inputProps={{ name: "firstName" }}
          />
          <FormField
            label={t("lastNameLabel")}
            placeholder={t("lastNamePlaceholder")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            inputProps={{ name: "lastName" }}
          />
          <FormField
            label={t("phoneLabel")}
            type="tel"
            placeholder={t("phonePlaceholder")}
            inputProps={{ name: "phone" }}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!firstName.trim() || !lastName.trim()}
            loading={isPending}
          >
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
