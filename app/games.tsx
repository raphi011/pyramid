import RadioButton from "./components/radiobutton";
import SectionHeader from "./components/section-header";
import GamesList from "./games-list";

export default function Games({ games }) {
  return (
    <>
      <SectionHeader
        title="Meine Spiele"
        side={<RadioButton options={[{ text: "Meine" }, { text: "Alle" }]} />}
      />
      <GamesList games={games} />
    </>
  );
}
