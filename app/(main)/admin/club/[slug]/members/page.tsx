import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubBySlug } from "@/app/lib/db/club";
import { getClubMembers } from "@/app/lib/db/admin";
import { MemberManagementView } from "./member-management-view";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MemberManagementPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const club = await getClubBySlug(sql, slug);
  if (!club) {
    redirect("/feed");
  }

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") {
    redirect("/feed");
  }

  const members = await getClubMembers(sql, club.id);

  return (
    <MemberManagementView
      clubId={club.id}
      members={members}
      inviteAction={inviteMemberAction}
      updateRoleAction={updateMemberRoleAction}
      removeMemberAction={removeMemberAction}
    />
  );
}
