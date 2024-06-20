import Events from "./events";
import Games from "./games";
import Navigation from "./navigation";
import Footer from "./components/footer";
import PageHeader from "./components/page-header";
import Dropdown from "./components/dropdown";
import PyramidSection from "./pyramid-section";
import SectionHeader from "./components/section-header";

const standings = [
  {
    id: 1,
    date: "2024-06-17T08:20:28.438Z",
    latest: true,
    ranks: [
      {
        id: 1,
        name: "Preston Hilton",
        challangable: true,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 2,
        name: "Peregrine Jewell",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 3,
        name: "Waldo Symons",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 4,
        name: "Seymour Nicholson",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 5,
        name: "Sheard Tyler",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 6,
        name: "Thomas Post",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 7,
        name: "Landen Dean",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 8,
        name: "Koda Abbott",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 9,
        name: "Quentin Berry",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 10,
        name: "Anson Dickinson",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
      {
        id: 11,
        name: "Oscar Kelsey",
        challangable: false,
        available: true,
        won: 4,
        lost: 0,
      },
    ],
  },
  {
    id: 2,
    date: "2024-06-13T08:20:28.438Z",
    latest: false,
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

const currentPlayer = {
  id: 5,
  name: "Sheard Tyler",
};

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
    created: "2024-06-17T08:20:28.438Z",
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
    created: "2024-06-13T08:20:28.438Z",
    gameAt: "2024-06-15T08:20:28.438Z",
    player1Score: [6, 3, 6],
    player2Score: [4, 6, 1],
  },
];

const events = [
  {
    type: "challenge",
    date: "2024-06-17T08:20:28.438Z",
    challengerId: 1,
    challengerName: "Preston Hilton",
    challengeeId: 2,
    challengeeName: "Peregrine Jewell",
  },
  {
    type: "result",
    date: "2024-06-17T05:20:28.438Z",
    winnerId: 3,
    winnerName: "Waldo Symons",
    loserId: 4,
    loserName: "Seymour Nicholson",
    score: "4:6 6:4 6:3",
  },
];

export default async function Home() {
  return (
    <Navigation>
      <PageHeader />
      <PyramidSection standings={standings} currentPlayer={currentPlayer} />
      <Games games={matches} />
      <SectionHeader title="Neuigkeiten" />
      <Events events={events} />
      <Footer />
    </Navigation>
  );
}
