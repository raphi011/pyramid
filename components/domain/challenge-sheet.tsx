"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { cn } from "@/lib/utils";

type ChallengeSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  player: {
    name: string;
    rank: number;
    avatarSrc?: string | null;
  };
  message: string;
  onMessageChange: (value: string) => void;
  loading?: boolean;
  className?: string;
};

function ChallengeSheet({
  open,
  onClose,
  onSubmit,
  player,
  message,
  onMessageChange,
  loading,
  className,
}: ChallengeSheetProps) {
  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="Herausfordern"
      className={className}
    >
      <div className="space-y-4">
        {/* Player info */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <Avatar name={player.name} src={player.avatarSrc} size="md" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {player.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rang {player.rank}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nachricht (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="z.B. Hast du am Samstag Zeit?"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            className="flex-1"
            onClick={() => onSubmit(message)}
            loading={loading}
          >
            Herausfordern
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

export { ChallengeSheet };
export type { ChallengeSheetProps };
