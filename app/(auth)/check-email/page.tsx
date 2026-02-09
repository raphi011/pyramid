import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/button";

export default function CheckEmailPage() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
        <EnvelopeIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
        Prüfe deine E-Mails
      </h2>

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Wir haben dir einen Login-Link geschickt. Klicke auf den Link in der
        E-Mail, um dich anzumelden.
      </p>

      <div className="space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Der Link ist 15 Minuten gültig.
        </p>

        <Button href="/login" outline className="w-full">
          Zurück zur Anmeldung
        </Button>
      </div>
    </div>
  );
}
