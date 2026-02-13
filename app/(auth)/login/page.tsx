"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Ungültiger Link. Bitte fordere einen neuen an.",
  invalid_token: "Der Link ist abgelaufen oder wurde bereits verwendet.",
  server_error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;

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
        setError(data.error || "Ein Fehler ist aufgetreten");
        return;
      }

      router.push("/check-email");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Anmelden
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
          label="E-Mail-Adresse"
          type="email"
          placeholder="name@beispiel.de"
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

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          {isLoading ? "Wird gesendet..." : "Login-Link anfordern"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Wir senden dir einen Link zum Anmelden per E-Mail.
      </p>
    </Card>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
