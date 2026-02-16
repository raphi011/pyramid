"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DataList } from "@/components/data-list";
import type { SeasonMember, PreviousSeason } from "@/app/lib/db/admin";

type CreateSeasonViewProps = {
  clubId: number;
  members: SeasonMember[];
  previousSeasons: PreviousSeason[];
};

export function CreateSeasonView({
  members,
  previousSeasons,
}: CreateSeasonViewProps) {
  const t = useTranslations("createSeason");

  const [name, setName] = useState("");
  const [type, setType] = useState<"individual" | "team">("individual");
  const [teamSize, setTeamSize] = useState("2");
  const [bestOf, setBestOf] = useState("3");
  const [matchDeadlineDays, setMatchDeadlineDays] = useState("14");
  const [reminderDays, setReminderDays] = useState("7");
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [openEnrollment, setOpenEnrollment] = useState(true);
  const [startingRanks, setStartingRanks] = useState<"empty" | "from_season">(
    "empty",
  );
  const [fromSeasonId, setFromSeasonId] = useState(
    previousSeasons[0]?.id.toString() ?? "",
  );
  const [excludedMembers, setExcludedMembers] = useState<Set<number>>(
    new Set(),
  );

  function toggleMember(id: number) {
    setExcludedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <PageLayout
      title={t("title")}
      action={
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeftIcon className="size-4" />
          {t("back")}
        </Button>
      }
    >
      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("basics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("nameLabel")}
              required
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FormField
              label={t("typeLabel")}
              type="select"
              value={type}
              onChange={(e) => setType(e.target.value as "individual" | "team")}
            >
              <option value="individual">{t("typeIndividual")}</option>
              <option value="team">{t("typeTeam")}</option>
            </FormField>
            {type === "team" && (
              <FormField
                label={t("teamSizeLabel")}
                type="select"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </FormField>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>{t("scoring")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label={t("bestOfLabel")}
            type="select"
            value={bestOf}
            onChange={(e) => setBestOf(e.target.value)}
          >
            <option value="1">Best of 1</option>
            <option value="3">Best of 3</option>
            <option value="5">Best of 5</option>
            <option value="7">Best of 7</option>
          </FormField>
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>{t("deadlines")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("matchDeadlineLabel")}
              type="number"
              value={matchDeadlineDays}
              onChange={(e) => setMatchDeadlineDays(e.target.value)}
              inputProps={{ min: 1, max: 90 }}
            />
            <FormField
              label={t("reminderLabel")}
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              inputProps={{ min: 1, max: 90 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>{t("options")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Switch
              label={t("requiresConfirmation")}
              checked={requiresConfirmation}
              onChange={setRequiresConfirmation}
            />
            <Switch
              label={t("openEnrollment")}
              checked={openEnrollment}
              onChange={setOpenEnrollment}
            />
          </div>
        </CardContent>
      </Card>

      {/* Starting Ranks */}
      <Card>
        <CardHeader>
          <CardTitle>{t("startingRanks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="startingRanks"
                checked={startingRanks === "empty"}
                onChange={() => setStartingRanks("empty")}
                className="text-court-500 focus:ring-court-500"
              />
              {t("ranksEmpty")}
            </label>
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="startingRanks"
                checked={startingRanks === "from_season"}
                onChange={() => setStartingRanks("from_season")}
                disabled={previousSeasons.length === 0}
                className="text-court-500 focus:ring-court-500"
              />
              {t("ranksFromSeason")}
            </label>
            {startingRanks === "from_season" && previousSeasons.length > 0 && (
              <div className="ml-6">
                <FormField
                  label={t("selectSeason")}
                  type="select"
                  value={fromSeasonId}
                  onChange={(e) => setFromSeasonId(e.target.value)}
                >
                  {previousSeasons.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.name}
                    </option>
                  ))}
                </FormField>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("players")} ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {t("playersDesc")}
          </p>
          <DataList
            items={members}
            keyExtractor={(m) => m.id}
            separator={false}
            className="space-y-2"
            empty={{
              title: t("noMembers"),
            }}
            renderItem={(member) => (
              <Checkbox
                label={member.name}
                checked={!excludedMembers.has(member.id)}
                onChange={() => toggleMember(member.id)}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button className="w-full" disabled>
        {t("submit")}
        <ArrowRightIcon className="size-4" />
      </Button>
    </PageLayout>
  );
}
