export function renderEvent(event, index) {
  if (event.type == "result") {
    return (
      <Text key={index}>
        <a href="#"> {event.winnerName} </a> hat gegen {event.loserName} gewonnen (
        {event.score})
      </Text>
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
