import { Text, TextLink } from "./components/text";
import Divider from "./components/divider";
import { formatDateTime } from "./date";

export default function Events({ events }) {
  return (
    <div>
      {events.map((event, i) => (
        <>
          <div className="flex justify-between">
            {renderEvent(event, i)}
            <p>{formatDateTime(new Date(event.date))}</p>
          </div>
          <Divider />
        </>
      ))}
    </div>
  );
}

function renderEvent(event, index) {
  if (event.type == "result") {
    return (
      <Text key={index}>
        <TextLink href="#"> {event.winnerName} </TextLink> hat gegen{" "}
        <TextLink href="#">{event.loserName}</TextLink> gewonnen ({event.score})
      </Text>
    );
  } else if (event.type == "challenge") {
    return (
      <Text key={index}>
        <TextLink href="#"> {event.challengerName} </TextLink> has {event.challengeeName}{" "}
        herausgefordert.
      </Text>
    );
  }
}
