import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/card";

export default function CheckEmailPage() {
  return (
    <Card className="p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-court-100 dark:bg-court-900/30">
        <EnvelopeIcon className="h-6 w-6 text-court-600 dark:text-court-400" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        Prüfe deine E-Mails
      </h2>

      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Wir haben dir einen Login-Link geschickt. Klicke auf den Link in der
        E-Mail, um dich anzumelden.
      </p>

      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Der Link ist 15 Minuten gültig.
        </p>

        <Button href="/login" variant="outline" className="w-full">
          Zurück zur Anmeldung
        </Button>
      </div>
    </Card>
  );
}
