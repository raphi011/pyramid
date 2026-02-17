"use client";

import { useRef, useEffect } from "react";
import {
  PlayerCard,
  type PlayerCardVariant,
} from "@/components/domain/player-card";
import { cn, abbreviateName, fullName } from "@/lib/utils";

type PyramidPlayer = {
  id: string | number;
  playerId?: number;
  firstName: string;
  lastName: string;
  rank: number;
  avatarSrc?: string | null;
  wins?: number;
  losses?: number;
  variant?: PlayerCardVariant;
};

type PyramidGridProps = {
  players: PyramidPlayer[];
  onPlayerClick?: (player: PyramidPlayer) => void;
  className?: string;
};

/**
 * Distributes ranked players into pyramid rows: 1, 2, 3, 4, ...
 */
function buildRows(players: PyramidPlayer[]): PyramidPlayer[][] {
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  const rows: PyramidPlayer[][] = [];
  let idx = 0;
  let rowSize = 1;

  while (idx < sorted.length) {
    rows.push(sorted.slice(idx, idx + rowSize));
    idx += rowSize;
    rowSize++;
  }

  return rows;
}

function PyramidGrid({ players, onPlayerClick, className }: PyramidGridProps) {
  const rows = buildRows(players);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [players]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-x-auto",
        "-mx-[calc((100cqw-100%)/2)]",
        className,
      )}
    >
      <div className="mx-auto w-fit space-y-2 px-4 py-1">
        {rows.map((row, rowIdx) => {
          const expectedCols = rowIdx + 1;
          const isLastRow = rowIdx === rows.length - 1;
          const spacers = isLastRow ? expectedCols - row.length : 0;

          return (
            <div key={rowIdx} className="flex justify-center gap-2">
              {row.map((player) => (
                <PlayerCard
                  key={player.id}
                  name={abbreviateName(player.firstName, player.lastName)}
                  rank={player.rank}
                  avatarSrc={player.avatarSrc}
                  wins={player.wins}
                  losses={player.losses}
                  variant={player.variant}
                  compact
                  onClick={
                    onPlayerClick ? () => onPlayerClick(player) : undefined
                  }
                  className="w-40"
                />
              ))}
              {Array.from({ length: spacers }, (_, i) => (
                <div key={`spacer-${i}`} className="w-40" aria-hidden="true" />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PyramidGrid };
export type { PyramidGridProps, PyramidPlayer };
