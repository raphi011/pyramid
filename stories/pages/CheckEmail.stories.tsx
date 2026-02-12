import type { Meta, StoryObj } from "@storybook/react-vite";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";

const meta: Meta = {
  title: "Pages/CheckEmail",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

function CheckEmailPage() {
  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardContent className="mt-0 space-y-6 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-court-100 dark:bg-court-950">
            <EnvelopeIcon className="size-6 text-court-600 dark:text-court-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Prüfe dein Postfach
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Wir haben einen Anmeldelink an{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                max.braun@example.com
              </span>{" "}
              gesendet.
            </p>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Der Link ist 15 Minuten gültig. Prüfe auch deinen Spam-Ordner.
          </p>

          <Button variant="outline" className="w-full">
            Zurück zum Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const Default: Story = {
  render: () => <CheckEmailPage />,
};
