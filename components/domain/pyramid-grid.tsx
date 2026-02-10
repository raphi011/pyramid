"use client";

import { PlayerCard, type PlayerCardVariant } from "@/components/domain/player-card";
import { cn } from "@/lib/utils";

type PyramidPlayer = {
  id: string | number;
  name: string;
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

function PyramidGrid({
  players,
  onPlayerClick,
  className,
}: PyramidGridProps) {
  const rows = buildRows(players);

  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex justify-center gap-2"
        >
          {row.map((player) => (
            <PlayerCard
              key={player.id}
              name={player.name}
              rank={player.rank}
              avatarSrc={player.avatarSrc}
              wins={player.wins}
              losses={player.losses}
              variant={player.variant}
              compact
              onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
              className="w-40"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { PyramidGrid };
export type { PyramidGridProps, PyramidPlayer };
