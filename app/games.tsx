import { Button } from "./components/button";
import SectionHeader from "./components/section-header";
import GamesList from "./games-list";

export default function Games({ games }) {
  return (
    <>
      <SectionHeader title="Meine Spiele" side={<Button color="blue">Fordern</Button>} />
      <GamesList games={games} />
    </>
  );
}
