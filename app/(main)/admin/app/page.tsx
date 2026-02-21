import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getAppStats, getAdminClubs, getAppAdmins } from "@/app/lib/db/admin";
import { AppAdminView } from "./app-admin-view";
import {
  toggleClubDisabledAction,
  createClubAction,
  addAppAdminAction,
  removeAppAdminAction,
} from "./actions";

export default async function AppAdminPage() {
  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  if (!player.isAppAdmin) {
    redirect("/feed");
  }

  const [stats, clubs, appAdmins] = await Promise.all([
    getAppStats(sql),
    getAdminClubs(sql),
    getAppAdmins(sql),
  ]);

  return (
    <AppAdminView
      stats={stats}
      clubs={clubs}
      appAdmins={appAdmins}
      toggleClubAction={toggleClubDisabledAction}
      createClubAction={createClubAction}
      addAdminAction={addAppAdminAction}
      removeAdminAction={removeAppAdminAction}
    />
  );
}
