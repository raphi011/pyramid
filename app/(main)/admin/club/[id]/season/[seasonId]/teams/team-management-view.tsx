"use client";

import { useState } from "react";
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
import type { Team, TeamMember } from "@/app/lib/db/admin";

type TeamManagementViewProps = {
  seasonName: string;
  maxTeamSize: number;
  teams: Team[];
  unassignedPlayers: TeamMember[];
};

export function TeamManagementView({
  seasonName,
  teams,
  unassignedPlayers,
}: TeamManagementViewProps) {
  const t = useTranslations("teamManagement");

  const [teamName, setTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  return (
    <PageLayout
      title={t("title")}
      subtitle={t("subtitle", { season: seasonName })}
      action={
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeftIcon className="size-4" />
          {t("back")}
        </Button>
      }
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
                <Button disabled>{t("create")}</Button>
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
                <Button variant="ghost" size="sm" disabled>
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
    </PageLayout>
  );
}
