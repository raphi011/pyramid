import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubById } from "@/app/lib/db/club";
import { getClubMembers } from "@/app/lib/db/admin";
import { MemberManagementView } from "./member-management-view";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberManagementPage({ params }: PageProps) {
  const { id } = await params;
  const clubId = Number(id);

  if (Number.isNaN(clubId)) {
    redirect("/rankings");
  }

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") {
    redirect("/rankings");
  }

  const club = await getClubById(sql, clubId);
  if (!club) {
    redirect("/rankings");
  }

  const members = await getClubMembers(sql, clubId);

  return (
    <MemberManagementView
      clubId={clubId}
      members={members}
      inviteAction={inviteMemberAction}
      updateRoleAction={updateMemberRoleAction}
      removeMemberAction={removeMemberAction}
    />
  );
}
