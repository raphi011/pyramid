"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/stat-block";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import { Toast } from "@/components/ui/toast";
import { isActionError } from "@/app/lib/action-result";
import type { ActionResult } from "@/app/lib/action-result";
import type { AppStats, AdminClub, AppAdmin } from "@/app/lib/db/admin";

type AppAdminViewProps = {
  stats: AppStats;
  clubs: AdminClub[];
  appAdmins: AppAdmin[];
  toggleClubAction?: (formData: FormData) => Promise<ActionResult>;
  createClubAction?: (formData: FormData) => Promise<ActionResult>;
  addAdminAction?: (formData: FormData) => Promise<ActionResult>;
  removeAdminAction?: (formData: FormData) => Promise<ActionResult>;
};

export function AppAdminView({
  stats,
  clubs,
  appAdmins,
  toggleClubAction,
  createClubAction,
  addAdminAction,
  removeAdminAction,
}: AppAdminViewProps) {
  const t = useTranslations("appAdmin");

  const [showCreateClub, setShowCreateClub] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubAdminEmail, setClubAdminEmail] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tError = useTranslations();

  function handleToggleClub(clubId: number) {
    if (!toggleClubAction) return;
    const fd = new FormData();
    fd.append("clubId", String(clubId));

    startTransition(async () => {
      const result = await toggleClubAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      }
    });
  }

  function handleCreateClub() {
    if (!createClubAction) return;
    const fd = new FormData();
    fd.append("name", clubName);
    fd.append("adminEmail", clubAdminEmail);

    startTransition(async () => {
      const result = await createClubAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      } else {
        setClubName("");
        setClubAdminEmail("");
        setShowCreateClub(false);
      }
    });
  }

  function handleRemoveAdmin(adminId: number) {
    if (!removeAdminAction) return;
    const fd = new FormData();
    fd.append("adminId", String(adminId));

    startTransition(async () => {
      const result = await removeAdminAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      }
    });
  }

  function handleAddAdmin() {
    if (!addAdminAction) return;
    const fd = new FormData();
    fd.append("email", addAdminEmail);

    startTransition(async () => {
      const result = await addAdminAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      } else {
        setAddAdminEmail("");
        setShowAddAdmin(false);
      }
    });
  }

  return (
    <PageLayout title={t("title")}>
      {/* Overview stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t("overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label={t("clubs")} value={stats.totalClubs} />
            <StatBlock label={t("players")} value={stats.totalPlayers} />
            <StatBlock label={t("seasons")} value={stats.totalSeasons} />
          </div>
        </CardContent>
      </Card>

      {/* Clubs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clubsList")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={clubs}
            keyExtractor={(c) => c.id}
            empty={{
              icon: <BuildingOffice2Icon />,
              title: t("noClubs"),
              description: t("noClubsDesc"),
            }}
            renderItem={(club) => (
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {club.name}
                    </p>
                    <Badge variant={club.isDisabled ? "loss" : "win"} size="sm">
                      {club.isDisabled
                        ? t("statusDisabled")
                        : t("statusActive")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t("memberCount", { count: club.memberCount })}</span>
                    <span>&middot;</span>
                    <span>
                      {t("adminLabel", { email: club.adminEmail ?? "–" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/club/${club.id}`}>
                    <Button variant="outline" size="sm">
                      {t("view")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || !toggleClubAction}
                    onClick={() => handleToggleClub(club.id)}
                  >
                    {club.isDisabled ? t("enable") : t("disable")}
                  </Button>
                </div>
              </div>
            )}
          />
          {/* Create Club form */}
          {showCreateClub ? (
            <div className="mt-4 space-y-3">
              <FormField
                label={t("clubNameLabel")}
                required
                placeholder={t("clubNamePlaceholder")}
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
              />
              <FormField
                label={t("clubAdminEmailLabel")}
                type="email"
                required
                placeholder={t("clubAdminEmailPlaceholder")}
                value={clubAdminEmail}
                onChange={(e) => setClubAdminEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  disabled={
                    isPending ||
                    !clubName.trim() ||
                    !clubAdminEmail ||
                    !createClubAction
                  }
                  onClick={handleCreateClub}
                >
                  {t("confirmCreateClub")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateClub(false);
                    setClubName("");
                    setClubAdminEmail("");
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                disabled={!createClubAction}
                onClick={() => setShowCreateClub(true)}
              >
                {t("createClub")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Admins */}
      <Card>
        <CardHeader>
          <CardTitle>{t("appAdmins")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={appAdmins}
            keyExtractor={(a) => a.id}
            empty={{
              icon: <ShieldCheckIcon />,
              title: t("noAdmins"),
              description: t("noAdminsDesc"),
            }}
            renderItem={(admin) => (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-court-500" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {admin.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending || !removeAdminAction}
                  onClick={() => handleRemoveAdmin(admin.id)}
                >
                  {t("revokeAdmin")}
                </Button>
              </div>
            )}
          />

          {/* Add Admin form */}
          {showAddAdmin ? (
            <div className="mt-4 space-y-3">
              <FormField
                label={t("adminEmailLabel")}
                type="email"
                required
                placeholder={t("adminEmailPlaceholder")}
                value={addAdminEmail}
                onChange={(e) => setAddAdminEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  disabled={isPending || !addAdminEmail || !addAdminAction}
                  onClick={handleAddAdmin}
                >
                  {t("confirmAddAdmin")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddAdmin(false);
                    setAddAdminEmail("");
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                disabled={!addAdminAction}
                onClick={() => setShowAddAdmin(true)}
              >
                {t("addAdmin")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Toast variant="error" title={error} onClose={() => setError(null)} />
        </div>
      )}
    </PageLayout>
  );
}
