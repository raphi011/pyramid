const standings = [
  { id: 1, name: "Christoph Traxler", won: 4, lost: 0 },
  { id: 2, name: "Gerhard Brueckl", won: 4, lost: 0 },
  { id: 3, name: "Martin Neid", won: 4, lost: 0 },
  { id: 4, name: "Raphael Gruber", won: 4, lost: 0 },
  { id: 5, name: "Martin Unger", won: 4, lost: 0 },
  { id: 6, name: "Stefan Schreier", won: 4, lost: 0 },
  { id: 7, name: "Martin Pisecky", won: 4, lost: 0 },
  { id: 8, name: "Georg Maier", won: 4, lost: 0 },
  { id: 9, name: "Gernot", won: 4, lost: 0 },
  { id: 10, name: "Roman Vicena", won: 4, lost: 0 },
  { id: 11, name: "Wolfgang Ager", won: 4, lost: 0 },
];

const events = [
  {
    type: "challenge",
    date: "",
    challengerId: 1,
    challengerName: "Raphael Gruber",
    challengeeId: 2,
    challengeeName: "Christoph Traxler",
  },
  {
    type: "result",
    date: "",
    winnerId: 3,
    winnerName: "Christoph Traxler",
    loserId: 4,
    loserName: "Martin Neid",
    score: "4:6 6:4 6:3",
  },
];

const matches = [
  {
    player1Id: 4,
    player2Id: 3,
    status: "challenged",
  },
];

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

function rank(standings, playerId) {
  for (let i = 0; i < standings.length; i++) {
    if (standings[i].id == playerId) {
      return i + 1;
    }
  }

  return -1;
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
      rows[rows.length - 1].push({ name: "-" });
    }
  }

  return rows;
}

function renderEvent(event, index) {
  if (event.type == "result") {
    return (
      <p key={index}>
        <a href="#">{event.winnerName}</a> hat gegen {event.loserName} gewonnen (
        {event.score})
      </p>
    );
  } else if (event.type == "challenge") {
    return (
      <p key={index}>
        <a href="#">{event.challengerName}</a> has {event.challengeeName} herausgefordert.
      </p>
    );
  }
}

function playerClassName(standings, currentPlayerId, playerId) {
  if (playerId == currentPlayerId) {
    return "bg-cyan-400 rounded m-1 w-36 truncate text-center p-1 border border-black";
  } else if (canChallenge(standings, currentPlayerId, playerId)) {
    return "bg-emerald-400 rounded m-1 w-36 truncate text-center p-1 border border-black";
  }

  return "rounded m-1 w-36 truncate text-center p-1 border border-black";
}

export default async function Home() {
  const pyramid = standingsToPyramid(standings);

  const currentPlayerId = 11;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="overflow-x-auto py-4 w-full text-xs grid items-center justify-items-center">
        {pyramid.map((row, i) => (
          <div key={i} className="flex items-center justify-center content-around">
            {row.map((p, i) => (
              <div key={i} className={playerClassName(standings, currentPlayerId, p.id)}>
                {p.name} ({p.won}:{p.lost})
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>{events.map((row, i) => renderEvent(row, i))}</div>
    </main>
  );
}
