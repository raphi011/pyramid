import { doSomething } from "./actions";
import Pyramid from "./pyramid";

const standings = [
  {
    id: 1,
    date: "2024-06-17T08:20:28.438Z",
    ranks: [
      { id: 1, name: "Preston Hilton", won: 4, lost: 0 },
      { id: 2, name: "Peregrine Jewell", won: 4, lost: 0 },
      { id: 3, name: "Waldo Symons", won: 4, lost: 0 },
      { id: 4, name: "Seymour Nicholson", won: 4, lost: 0 },
      { id: 5, name: "Sheard Tyler", won: 4, lost: 0 },
      { id: 6, name: "Thomas Post", won: 4, lost: 0 },
      { id: 7, name: "Landen Dean", won: 4, lost: 0 },
      { id: 8, name: "Koda Abbott", won: 4, lost: 0 },
      { id: 9, name: "Quentin Berry", won: 4, lost: 0 },
      { id: 10, name: "Anson Dickinson", won: 4, lost: 0 },
      { id: 11, name: "Oscar Kelsey", won: 4, lost: 0 },
    ],
  },
  {
    id: 2,
    date: "2024-06-13T08:20:28.438Z",
    ranks: [
      { id: 2, name: "Peregrine Jewell", won: 4, lost: 0 },
      { id: 1, name: "Preston Hilton", won: 4, lost: 0 },
      { id: 3, name: "Waldo Symons", won: 4, lost: 0 },
      { id: 4, name: "Seymour Nicholson", won: 4, lost: 0 },
      { id: 6, name: "Thomas Post", won: 4, lost: 0 },
      { id: 7, name: "Landen Dean", won: 4, lost: 0 },
      { id: 5, name: "Sheard Tyler", won: 4, lost: 0 },
      { id: 8, name: "Koda Abbott", won: 4, lost: 0 },
      { id: 9, name: "Quentin Berry", won: 4, lost: 0 },
      { id: 10, name: "Anson Dickinson", won: 4, lost: 0 },
      { id: 11, name: "Oscar Kelsey", won: 4, lost: 0 },
    ],
  },
];

const matches = [
  {
    player1: {
      id: 5,
      name: "Sheard Tyler",
    },
    player2: {
      id: 6,
      name: "Thomas Post",
    },
    status: "challenged",
    challengedAt: "2024-06-17T08:20:28.438Z",
  },
  {
    player1: {
      id: 5,
      name: "Sheard Tyler",
    },
    player2: {
      id: 6,
      name: "Thomas Post",
    },
    winner_id: 5,
    status: "done",
    challengedAt: "2024-06-13T08:20:28.438Z",
    gameAt: "2024-06-15T08:20:28.438Z",
    player1Score: [6, 3, 6],
    player2Score: [4, 6, 1],
  },
];

const events = [
  {
    type: "challenge",
    date: "",
    challengerId: 1,
    challengerName: "Preston Hilton",
    challengeeId: 2,
    challengeeName: "Peregrine Jewell",
  },
  {
    type: "result",
    date: "",
    winnerId: 3,
    winnerName: "Waldo Symons",
    loserId: 4,
    loserName: "Seymour Nicholson",
    score: "4:6 6:4 6:3",
  },
];

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

export default async function Home() {
  const currentPlayerId = 5;

  return (
    <main className="p-4">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Rangliste</h3>
      </div>
      <div>
        <Pyramid standings={standings} currentPlayerId={currentPlayerId} />
      </div>
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Meine Spiele</h3>
      </div>

      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Events</h3>
      </div>
      <div>{events.map((row, i) => renderEvent(row, i))}</div>
      {/* <div>
        <form action={doSomething}>
          <button type="submit">Do something!</button>
        </form>
      </div> */}
    </main>
  );
}
