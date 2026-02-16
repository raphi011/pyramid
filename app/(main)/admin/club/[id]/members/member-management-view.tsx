"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import type { ClubMember } from "@/app/lib/db/admin";

type MemberManagementViewProps = {
  clubId: number;
  members: ClubMember[];
};

export function MemberManagementView({ members }: MemberManagementViewProps) {
  const t = useTranslations("memberManagement");

  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const adminCount = members.filter((m) => m.role === "admin").length;
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageLayout
      title={t("title", { count: members.length })}
      action={
        <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
          <EnvelopeIcon className="size-4" />
          {t("invite")}
        </Button>
      }
    >
      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle>{t("inviteTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                label={t("emailLabel")}
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <FormField
                label={t("nameLabel")}
                placeholder={t("namePlaceholder")}
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <Button disabled>{t("sendInvite")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members list */}
      <Card>
        <CardContent>
          <DataList
            items={filteredMembers}
            keyExtractor={(m) => m.id}
            empty={{
              icon: <UserGroupIcon />,
              title: t("noMembers"),
              description: t("noMembersDesc"),
            }}
            renderItem={(member) => {
              const isOnlyAdmin = member.role === "admin" && adminCount <= 1;

              return (
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.avatarUrl}
                      name={member.name}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        <Badge
                          variant={
                            member.role === "admin" ? "pending" : "subtle"
                          }
                          size="sm"
                        >
                          {member.role === "admin"
                            ? t("roleAdmin")
                            : t("rolePlayer")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {member.role === "admin" ? (
                      <Button variant="ghost" size="sm" disabled={isOnlyAdmin}>
                        {t("demote")}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        {t("makeAdmin")}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" disabled={isOnlyAdmin}>
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
