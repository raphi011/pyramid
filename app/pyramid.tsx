"use client";

import Dropdown from "./dropdown";
import { useState } from "react";

export default function Pyramid({ standings, currentPlayerId }) {
  const [selected, setSelected] = useState(standings[0]);

  const pyramid = standingsToPyramid(selected.ranks);

  return (
    <div>
      <Dropdown standings={standings} selected={selected} onChange={setSelected} />
      <div className="overflow-x-auto mx-1 gap-2 items-center justify-items-center p-4 text-xs grid">
        {pyramid.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((p, i) => renderPlayer(selected.ranks, currentPlayerId, p, i))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPlayer(standings, currentPlayerId, player, index) {
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

  return (
    <p key={index} className={playerClassName(standings, currentPlayerId, player.id)}>
      {player.name} ({player.won}:{player.lost})
    </p>
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

function playerClassName(standings, currentPlayerId, playerId) {
  if (playerId == currentPlayerId) {
    return "bg-cyan-400 rounded w-36 truncate text-center p-1 border border-black";
  } else if (canChallenge(standings, currentPlayerId, playerId)) {
    return "bg-emerald-400 rounded w-36 truncate text-center p-1 border border-black";
  }

  return "rounded w-36 truncate text-center p-1 border border-black";
}
