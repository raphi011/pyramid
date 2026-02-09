"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/button";

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
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
        Anmelden
      </h2>

      {(errorMessage || error) && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage || error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            E-Mail-Adresse
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          color="cyan"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Wird gesendet..." : "Login-Link anfordern"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Wir senden dir einen Link zum Anmelden per E-Mail.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mb-4 h-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
