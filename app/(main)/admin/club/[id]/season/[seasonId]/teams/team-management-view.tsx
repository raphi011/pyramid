"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeftIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Team, TeamMember } from "@/app/lib/db/admin";

type ActionResult = { success: true } | { error: string };

type TeamManagementViewProps = {
  seasonName: string;
  maxTeamSize: number;
  teams: Team[];
  unassignedPlayers: TeamMember[];
  clubId?: number;
  seasonId?: number;
  createAction?: (formData: FormData) => Promise<ActionResult>;
  deleteAction?: (formData: FormData) => Promise<ActionResult>;
};

export function TeamManagementView({
  seasonName,
  teams,
  unassignedPlayers,
  clubId,
  seasonId,
  createAction,
  deleteAction,
}: TeamManagementViewProps) {
  const t = useTranslations("teamManagement");
  const [pending, startTransition] = useTransition();

  const [teamName, setTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

  function handleCreate() {
    if (!createAction || !seasonId || !clubId) return;
    const fd = new FormData();
    fd.set("seasonId", seasonId.toString());
    fd.set("clubId", clubId.toString());
    fd.set("name", teamName);
    fd.set("memberIds", "");
    startTransition(async () => {
      const result = await createAction(fd);
      if ("success" in result) {
        setTeamName("");
        setShowCreateForm(false);
      }
    });
  }

  function handleDelete() {
    if (!deleteAction || !seasonId || !clubId || deleteTeamId === null) return;
    const fd = new FormData();
    fd.set("teamId", deleteTeamId.toString());
    fd.set("seasonId", seasonId.toString());
    fd.set("clubId", clubId.toString());
    startTransition(async () => {
      await deleteAction(fd);
      setDeleteTeamId(null);
    });
  }

  const backButton =
    clubId && seasonId ? (
      <Link href={`/admin/club/${clubId}/season/${seasonId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="size-4" />
          {t("back")}
        </Button>
      </Link>
    ) : (
      <Button variant="ghost" size="sm" disabled>
        <ArrowLeftIcon className="size-4" />
        {t("back")}
      </Button>
    );

  return (
    <PageLayout
      title={t("title")}
      subtitle={t("subtitle", { season: seasonName })}
      action={backButton}
    >
      {/* Create team button */}
      <Button onClick={() => setShowCreateForm(!showCreateForm)}>
        {t("createTeam")}
      </Button>

      {/* Create team form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("createTeam")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                label={t("teamNameLabel")}
                placeholder={t("teamNamePlaceholder")}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Button variant="outline" size="sm" disabled>
                {t("addMember")}
              </Button>
              <div>
                <Button
                  onClick={handleCreate}
                  disabled={
                    pending || !createAction || teamName.trim().length === 0
                  }
                  loading={pending}
                >
                  {t("create")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams list */}
      <DataList
        items={teams}
        keyExtractor={(team) => team.id}
        separator={false}
        empty={{
          icon: <UserGroupIcon />,
          title: t("noTeams"),
          description: t("noTeamsDesc"),
        }}
        className="space-y-3"
        renderItem={(team) => (
          <Card>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
              <CardAction>
                <Badge variant="info">
                  {t("memberCount", { count: team.members.length })}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataList
                items={team.members}
                keyExtractor={(m) => m.id}
                separator={false}
                className="space-y-1"
                empty={{
                  icon: <UsersIcon />,
                  title: t("noMembers"),
                }}
                renderItem={(member) => (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <UsersIcon className="size-4 shrink-0" />
                    {member.name}
                  </div>
                )}
              />
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  {t("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!deleteAction}
                  onClick={() => setDeleteTeamId(team.id)}
                >
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      />

      {/* Unassigned players */}
      {unassignedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("unassignedPlayers")}</CardTitle>
            <CardAction>
              <Badge variant="pending">{unassignedPlayers.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DataList
              items={unassignedPlayers}
              keyExtractor={(p) => p.id}
              separator={false}
              className="flex flex-wrap gap-2"
              empty={{
                title: t("noUnassigned"),
              }}
              renderItem={(player) => (
                <Badge variant="subtle">{player.name}</Badge>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTeamId !== null}
        onClose={() => setDeleteTeamId(null)}
        onConfirm={handleDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        loading={pending}
      />
    </PageLayout>
  );
}
