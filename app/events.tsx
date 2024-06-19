export default function Events({ events }) {
  return <div>{events.map((row, i) => renderEvent(row, i))}</div>;
}

function renderEvent(event, index) {
  if (event.type == "result") {
    return (
      <p key={index}>
        <a href="#"> {event.winnerName} </a> hat gegen {event.loserName} gewonnen (
        {event.score})
      </p>
    );
  } else if (event.type == "challenge") {
    return (
      <p key={index}>
        <a href="#"> {event.challengerName} </a> has {event.challengeeName}{" "}
        herausgefordert.
      </p>
    );
  }
}
