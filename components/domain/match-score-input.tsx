"use client";

import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SetScore = { player1: string; player2: string };

type MatchScoreInputProps = {
  sets: SetScore[];
  onChange: (sets: SetScore[]) => void;
  maxSets?: number;
  readOnly?: boolean;
  error?: string;
  player1Name?: string;
  player2Name?: string;
  className?: string;
};

function MatchScoreInput({
  sets,
  onChange,
  maxSets = 5,
  readOnly = false,
  error,
  player1Name = "Spieler 1",
  player2Name = "Spieler 2",
  className,
}: MatchScoreInputProps) {
  function addSet() {
    if (sets.length < maxSets) {
      onChange([...sets, { player1: "", player2: "" }]);
    }
  }

  function removeSet(index: number) {
    onChange(sets.filter((_, i) => i !== index));
  }

  function updateScore(
    index: number,
    player: "player1" | "player2",
    value: string,
  ) {
    const next = sets.map((s, i) =>
      i === index ? { ...s, [player]: value } : s,
    );
    onChange(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="text-center">{player1Name}</span>
        <span />
        <span className="text-center">{player2Name}</span>
        <span className="w-8" />
      </div>

      {/* Set rows */}
      {sets.map((set, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
        >
          <Input
            type="number"
            min="0"
            max="99"
            value={set.player1}
            onChange={(e) => updateScore(idx, "player1", e.target.value)}
            readOnly={readOnly}
            className="text-center tabular-nums"
            aria-label={`Satz ${idx + 1} ${player1Name}`}
          />
          <span className="text-sm font-bold text-slate-400">:</span>
          <Input
            type="number"
            min="0"
            max="99"
            value={set.player2}
            onChange={(e) => updateScore(idx, "player2", e.target.value)}
            readOnly={readOnly}
            className="text-center tabular-nums"
            aria-label={`Satz ${idx + 1} ${player2Name}`}
          />
          {!readOnly && sets.length > 1 ? (
            <button
              onClick={() => removeSet(idx)}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label={`Satz ${idx + 1} entfernen`}
            >
              <XMarkIcon className="size-4" />
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>
      ))}

      {/* Add set button */}
      {!readOnly && sets.length < maxSets && (
        <Button variant="ghost" size="sm" onClick={addSet} className="w-full">
          <PlusIcon className="size-4" />
          Satz hinzufügen
        </Button>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { MatchScoreInput };
export type { MatchScoreInputProps, SetScore };
