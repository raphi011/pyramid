import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";

export const metadata: Metadata = { title: "Einstellungen" };
import { getPlayerProfile } from "@/app/lib/db/auth";
import { getPlayerClubs } from "@/app/lib/db/club";
import { sql } from "@/app/lib/db";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [profile, clubs] = await Promise.all([
    getPlayerProfile(sql, player.id),
    getPlayerClubs(sql, player.id),
  ]);

  if (!profile) redirect("/login");

  return (
    <SettingsView
      email={profile.email}
      phone={profile.phoneNumber}
      clubs={clubs.map((c) => ({ id: c.clubId, name: c.clubName }))}
    />
  );
}
