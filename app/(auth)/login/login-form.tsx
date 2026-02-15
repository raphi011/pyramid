"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function LoginFormInner() {
  const searchParams = useSearchParams();
  const t = useTranslations("login");
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? t(`error.${errorParam}`) : null;
  const actionError = state.error ? t(state.error) : null;

  return (
    <Card className="p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("title")}
      </h2>

      {(errorMessage || actionError) && (
        <div
          className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
          role="alert"
        >
          {errorMessage || actionError}
        </div>
      )}

      <form action={formAction}>
        <FormField
          label={t("emailLabel")}
          type="email"
          placeholder={t("emailPlaceholder")}
          disabled={isPending}
          className="mb-4"
          inputProps={{
            required: true,
            autoComplete: "email",
            name: "email",
          }}
        />

        <Button type="submit" className="w-full" loading={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        {t("hint")}
      </p>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <Card className="p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-24" />
          <Skeleton className="mb-4 h-16" />
          <Skeleton className="h-10" />
        </Card>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
