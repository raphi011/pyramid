export default function Games({ games }) {
  return (
    <div>
      {games.map((g) => (
        <Game game={g} />
      ))}
    </div>
  );
}

function Game({ game }) {
  return (
    <div>
      {game.player1.name} {game.status} {game.player2.name}
    </div>
  );
}
