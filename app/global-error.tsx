"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-white font-sans text-slate-900">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-lg font-semibold">Etwas ist schiefgelaufen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ein unerwarteter Fehler ist aufgetreten.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-xl bg-court-600 px-4 py-2 text-sm font-medium text-white hover:bg-court-700"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
