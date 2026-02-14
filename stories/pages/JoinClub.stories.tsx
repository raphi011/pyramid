"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import { ClubJoinCard } from "@/components/domain/club-join-card";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const meta = preview.meta({
  title: "Pages/JoinClub",
  parameters: { layout: "centered" },
});

export default meta;

function JoinClubCodeEntry() {
  const [code, setCode] = useState("");

  return (
    <div className="w-full max-w-sm space-y-4">
      <ClubJoinCard
        mode="player"
        code={code}
        onCodeChange={setCode}
        onJoin={() => {}}
      />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          oder
        </span>
        <Separator className="flex-1" />
      </div>

      <Button variant="outline" className="w-full">
        <QrCodeIcon className="size-5" />
        QR-Code scannen
      </Button>
    </div>
  );
}

function JoinClubConfirmation() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-court-100 text-court-600 dark:bg-court-950 dark:text-court-400">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              TC Musterstadt
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              24 Mitglieder
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Abbrechen
            </Button>
            <Button className="flex-1">Beitreten</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const CodeEntry = meta.story({
  render: () => <JoinClubCodeEntry />,
});

export const Confirmation = meta.story({
  render: () => <JoinClubConfirmation />,
});
