"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? t(`error.${errorParam}`) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t("error.generic"));
        return;
      }

      router.push("/check-email");
    } catch {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("title")}
      </h2>

      {(errorMessage || error) && (
        <div
          className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
          role="alert"
        >
          {errorMessage || error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormField
          label={t("emailLabel")}
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="mb-4"
          inputProps={{
            required: true,
            autoComplete: "email",
            name: "email",
          }}
        />

        <Button type="submit" className="w-full" loading={isLoading}>
          {isLoading ? t("submitting") : t("submit")}
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
