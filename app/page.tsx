import { redirect } from "next/navigation";
import { getCurrentPlayer } from "./lib/auth";

export default async function Home() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect("/login");
  }

  // TODO: Replace with real dashboard once data layer is connected
  redirect("/login");
}
