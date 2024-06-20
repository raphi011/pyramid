"use client";

import ChallengeDialog from "./challenge-dialog";
import { useState } from "react";

export default function Pyramid({ standings, currentPlayer }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const pyramid = standingsToPyramid(standings.ranks);

  const onCloseDialog = () => setSelectedPlayer(null);

  return (
    <div>
      <ChallengeDialog player={selectedPlayer} onClose={onCloseDialog} />
      <div className="overflow-x-auto mx-1 gap-2 items-center justify-items-center p-4 text-xs grid">
        {pyramid.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((p, i) =>
              renderPlayer(standings, setSelectedPlayer, currentPlayer, p, i),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPlayer(standings, onClick, currentPlayer, player, index) {
  if (!player.id) {
    return (
      <div
        key={index}
        className="rounded w-36 truncate text-center p-1 border border-black"
      >
        -
      </div>
    );
  }

  const challangeable =
    standings.latest && canChallenge(standings.ranks, currentPlayer.id, player.id);

  return (
    <a
      href={`/player/${player.id}`}
      onClick={(e) => {
        if (challangeable) {
          e.preventDefault();
          onClick(player);
        }
      }}
      key={index}
      className={playerClassName(challangeable, currentPlayer, player)}
    >
      {player.name} ({player.won}:{player.lost})
    </a>
  );
}

function standingsToPyramid(input) {
  if (input.length == 0) {
    return [];
  }

  const rows = [];
  let currentIndex = 0;

  for (let i = 1; currentIndex < input.length; i++) {
    let row = input.slice(currentIndex, Math.min(currentIndex + i, input.length));
    rows.push(row);

    currentIndex += i;
  }

  const lastRowWidth = rows[rows.length - 1].length;

  if (lastRowWidth != rows.length) {
    for (let i = 0; i < rows.length - lastRowWidth; i++) {
      rows[rows.length - 1].push({});
    }
  }

  return rows;
}

function rank(standings, playerId) {
  for (let i = 0; i < standings.length; i++) {
    if (standings[i].id == playerId) {
      return i + 1;
    }
  }

  return -1;
}

function canChallenge(standings, challengerId, challengeeId) {
  const challengerRank = rank(standings, challengerId);

  if (challengerRank == 3 && [1, 2].includes(challengeeId)) {
    return true;
  }

  const maxRank =
    challengerRank + 1 - Math.floor((1 + Math.sqrt(8 * challengerRank - 7)) / 2);

  const challengeeRank = rank(standings, challengeeId);

  return challengeeRank >= maxRank && challengeeRank < challengerRank;
}

function playerClassName(challangeable, currentPlayer, player) {
  if (player.id == currentPlayer.id) {
    return "bg-cyan-400 rounded w-36 truncate text-center p-1 border border-black";
  } else if (challangeable) {
    return "bg-emerald-400 rounded w-36 truncate text-center p-1 border border-black";
  }

  return "rounded w-36 truncate text-center p-1 border border-black";
}
