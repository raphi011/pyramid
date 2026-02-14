"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { DataList } from "@/components/data-list";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DateTimePicker } from "@/components/date-time-picker";
import { FormField } from "@/components/form-field";
import {
  MatchScoreInput,
  type SetScore,
} from "@/components/domain/match-score-input";
import {
  proposeDateAction,
  acceptDateAction,
  declineDateAction,
  enterResultAction,
  confirmResultAction,
  postCommentAction,
  uploadMatchImageAction,
} from "@/app/lib/actions/match";
import { imageUrl } from "@/app/lib/image-storage";
import type { MatchStatus } from "@/app/lib/db/match";

// ── Serialized types (dates as ISO strings) ───────────

type SerializedMatch = {
  id: number;
  seasonId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  team1Score: number[] | null;
  team2Score: number[] | null;
  winnerTeamId: number | null;
  status: MatchStatus;
  created: string;
  gameAt: string | null;
  resultEnteredBy: number | null;
  confirmedBy: number | null;
  team1PlayerId: number;
  team2PlayerId: number;
  seasonBestOf: number;
  clubId: number;
  imageId: string | null;
};

type SerializedProposal = {
  id: number;
  matchId: number;
  proposedBy: number;
  proposedByName: string;
  proposedDatetime: string;
  status: string;
  created: string;
};

type SerializedComment = {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  comment: string;
  created: string;
  editedAt: string | null;
};

type MatchDetailViewProps = {
  match: SerializedMatch;
  proposals: SerializedProposal[];
  comments: SerializedComment[];
  userRole: "team1" | "team2" | "spectator";
  currentPlayerId: number;
  team1Rank: number | null;
  team2Rank: number | null;
};

// ── Status config (shared with match-card) ────────────

function getStatusBadge(status: MatchStatus) {
  const map = {
    challenged: { variant: "pending" as const, key: "statusChallenged" },
    date_set: { variant: "info" as const, key: "statusDateSet" },
    pending_confirmation: {
      variant: "pending" as const,
      key: "statusPendingConfirmation",
    },
    completed: { variant: "win" as const, key: "statusCompleted" },
    withdrawn: { variant: "subtle" as const, key: "statusWithdrawn" },
    forfeited: { variant: "loss" as const, key: "statusForfeited" },
    disputed: { variant: "loss" as const, key: "statusDisputed" },
  };
  return map[status];
}

// ── Date formatting ───────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const time = d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

// ── Proposal status config ────────────────────────────

function getProposalBadge(status: string) {
  const map: Record<
    string,
    { variant: "win" | "loss" | "subtle" | "pending"; key: string }
  > = {
    accepted: { variant: "win", key: "statusAccepted" },
    declined: { variant: "loss", key: "statusDeclined" },
    dismissed: { variant: "subtle", key: "statusDismissed" },
    pending: { variant: "pending", key: "statusPending" },
  };
  return map[status] ?? { variant: "subtle" as const, key: "statusPending" };
}

// ── Component ─────────────────────────────────────────

export function MatchDetailView({
  match,
  proposals,
  comments,
  userRole,
  currentPlayerId,
  team1Rank,
  team2Rank,
}: MatchDetailViewProps) {
  const t = useTranslations("matchDetail");
  const tMatch = useTranslations("match");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Dialog state
  const [showProposeDateDialog, setShowProposeDateDialog] = useState(false);
  const [showEnterResultDialog, setShowEnterResultDialog] = useState(false);
  const [proposedDate, setProposedDate] = useState<Date | undefined>();
  const [sets, setSets] = useState<SetScore[]>(
    Array.from({ length: match.seasonBestOf }, () => ({
      player1: "",
      player2: "",
    })),
  );

  const isParticipant = userRole !== "spectator";
  const isOpen = match.status === "challenged" || match.status === "date_set";
  const isPendingConfirmation = match.status === "pending_confirmation";
  const isCompleted = match.status === "completed";
  const canEnterResult = isParticipant && isOpen;
  const canConfirm =
    isPendingConfirmation &&
    isParticipant &&
    match.resultEnteredBy !== currentPlayerId;
  const isResultEnterer =
    isPendingConfirmation && match.resultEnteredBy === currentPlayerId;

  // Status line
  const { variant: statusVariant, key: statusKey } = getStatusBadge(
    match.status,
  );
  let dateLine: string;
  if (match.gameAt) {
    dateLine = isCompleted
      ? t("completedOn", { date: formatDate(match.gameAt) })
      : t("scheduledFor", { date: formatDateTime(match.gameAt) });
  } else if (isCompleted) {
    dateLine = t("completedOn", { date: formatDate(match.created) });
  } else {
    dateLine = t("openSince", { date: formatDate(match.created) });
  }

  // ── Action handlers ───────────────────────────────

  function handleAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      // Determine which action based on form intent
      const intent = formData.get("intent") as string;
      let result;
      switch (intent) {
        case "proposeDate":
          result = await proposeDateAction(formData);
          if ("success" in result) setShowProposeDateDialog(false);
          break;
        case "acceptDate":
          result = await acceptDateAction(formData);
          break;
        case "declineDate":
          result = await declineDateAction(formData);
          break;
        case "enterResult":
          result = await enterResultAction(formData);
          if ("success" in result) setShowEnterResultDialog(false);
          break;
        case "confirmResult":
          result = await confirmResultAction(formData);
          break;
        case "postComment":
          result = await postCommentAction(formData);
          if (result && "success" in result) setCommentText("");
          break;
        default:
          result = { error: "matchDetail.error.serverError" };
          break;
      }
      if (result && "error" in result) {
        setError(t(`error.${result.error.split(".").pop()}`));
      }
    });
  }

  const handleMatchImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/images", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            let errorMessage = t("error.serverError");
            try {
              const data = await res.json();
              if (data.error) errorMessage = data.error;
            } catch {
              // Response was not JSON (e.g. proxy error page)
            }
            setError(errorMessage);
            return;
          }
          const { id } = await res.json();
          const result = await uploadMatchImageAction(match.id, id);
          if ("error" in result) {
            setError(t(`error.${result.error.split(".").pop()}`));
          }
        } catch (e) {
          console.error("Match image upload failed:", e);
          setError(t("error.serverError"));
        }
      });
    },
    [match.id, t],
  );

  // ── Render ────────────────────────────────────────

  return (
    <PageLayout title={t("title")}>
      {/* Error banner */}
      {error && (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Match Header */}
      <Card>
        <CardContent className="mt-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={match.team1Name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {match.team1Name}
                </p>
                {team1Rank && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("rank", { rank: team1Rank })}
                  </p>
                )}
              </div>
            </div>

            <span className="text-lg font-bold text-slate-300 dark:text-slate-600">
              vs
            </span>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {match.team2Name}
                </p>
                {team2Rank && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("rank", { rank: team2Rank })}
                  </p>
                )}
              </div>
              <Avatar name={match.team2Name} size="lg" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dateLine}
            </p>
            <Badge variant={statusVariant}>{tMatch(statusKey)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Score Section (pending_confirmation or completed) */}
      {(isPendingConfirmation || isCompleted) &&
        match.team1Score &&
        match.team2Score && (
          <Card>
            <CardHeader>
              <CardTitle>{t("result")}</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchScoreInput
                sets={match.team1Score.map((s, i) => ({
                  player1: String(s),
                  player2: String(match.team2Score![i]),
                }))}
                onChange={() => {}}
                readOnly
                player1Name={match.team1Name}
                player2Name={match.team2Name}
              />
              {match.winnerTeamId && (
                <div className="mt-3 text-center">
                  <Badge variant="win">
                    {t("winnerLine", {
                      name:
                        match.winnerTeamId === match.team1Id
                          ? match.team1Name
                          : match.team2Name,
                    })}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Result Confirmation */}
      {canConfirm && (
        <div className="flex gap-2">
          <form action={handleAction} className="flex-1">
            <input type="hidden" name="intent" value="confirmResult" />
            <input type="hidden" name="matchId" value={match.id} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t("confirmResult")}
            </Button>
          </form>
          <Tooltip content={t("comingSoon")}>
            <Button variant="outline" className="flex-1" disabled>
              {t("disputeResult")}
            </Button>
          </Tooltip>
        </div>
      )}

      {/* Waiting for confirmation (as the enterer) */}
      {isResultEnterer && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("waitingForConfirmation")}
        </p>
      )}

      {/* Date Proposals Section (open matches) */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dateProposals")}</CardTitle>
            {isParticipant && (
              <Button size="sm" onClick={() => setShowProposeDateDialog(true)}>
                {t("proposeDate")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <DataList
              items={proposals}
              empty={{
                title: t("noProposals"),
                description: t("noProposalsDesc"),
              }}
              renderItem={(proposal) => {
                const { variant, key } = getProposalBadge(proposal.status);
                const canRespond =
                  isParticipant &&
                  proposal.proposedBy !== currentPlayerId &&
                  proposal.status === "pending";

                return (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {formatDateTime(proposal.proposedDatetime)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("proposedBy", { name: proposal.proposedByName })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {canRespond ? (
                        <>
                          <form action={handleAction}>
                            <input
                              type="hidden"
                              name="intent"
                              value="acceptDate"
                            />
                            <input
                              type="hidden"
                              name="proposalId"
                              value={proposal.id}
                            />
                            <input
                              type="hidden"
                              name="matchId"
                              value={match.id}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isPending}
                            >
                              {t("accept")}
                            </Button>
                          </form>
                          <form action={handleAction}>
                            <input
                              type="hidden"
                              name="intent"
                              value="declineDate"
                            />
                            <input
                              type="hidden"
                              name="proposalId"
                              value={proposal.id}
                            />
                            <input
                              type="hidden"
                              name="matchId"
                              value={match.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                            >
                              {t("decline")}
                            </Button>
                          </form>
                        </>
                      ) : (
                        <Badge variant={variant} size="sm">
                          {t(key)}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              }}
              keyExtractor={(p) => p.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Enter Result + Actions (open matches, participant) */}
      {canEnterResult && (
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => setShowEnterResultDialog(true)}
          >
            {t("enterResult")}
          </Button>
          <Tooltip content={t("comingSoon")}>
            <Button variant="outline" className="flex-1" disabled>
              {userRole === "team1" ? t("withdraw") : t("forfeit")}
            </Button>
          </Tooltip>
        </div>
      )}

      {/* Match Photo */}
      {(match.imageId || isParticipant) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("matchPhoto")}</CardTitle>
          </CardHeader>
          <CardContent>
            {match.imageId && (
              // eslint-disable-next-line @next/next/no-img-element -- served from our own API route; next/image would need dynamic loader config
              <img
                src={imageUrl(match.imageId)!}
                alt={t("matchPhoto")}
                className="w-full rounded-xl object-cover"
              />
            )}
            {isParticipant && (
              <label
                className={`${match.imageId ? "mt-2 " : ""}flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-court-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-court-400 dark:hover:bg-slate-700`}
              >
                {t("uploadPhoto")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleMatchImageUpload}
                  disabled={isPending}
                />
              </label>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("comments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={comments}
            empty={{
              title: t("noComments"),
              description: t("noCommentsDesc"),
            }}
            renderItem={(c) => (
              <div className="flex gap-2 py-2">
                <Avatar name={c.playerName} size="sm" />
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {c.comment}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(c.created)}
                  </p>
                </div>
              </div>
            )}
            keyExtractor={(c) => c.id}
          />

          {isParticipant && (
            <>
              <Separator className="my-3" />

              <form action={handleAction} className="flex gap-2">
                <input type="hidden" name="intent" value="postComment" />
                <input type="hidden" name="matchId" value={match.id} />
                <FormField
                  label=""
                  placeholder={t("commentPlaceholder")}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                  inputProps={{ name: "comment" }}
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={isPending || !commentText.trim()}
                >
                  {t("send")}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Propose Date Dialog */}
      <ResponsiveDialog
        open={showProposeDateDialog}
        onClose={() => setShowProposeDateDialog(false)}
        title={t("proposeDateTitle")}
      >
        <form action={handleAction} className="space-y-4">
          <input type="hidden" name="intent" value="proposeDate" />
          <input type="hidden" name="matchId" value={match.id} />
          <input
            type="hidden"
            name="proposedDatetime"
            value={proposedDate?.toISOString() ?? ""}
          />
          <DateTimePicker
            value={proposedDate}
            onChange={setProposedDate}
            showTime
            className="w-full"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={!proposedDate || isPending}
          >
            {t("submitProposal")}
          </Button>
        </form>
      </ResponsiveDialog>

      {/* Enter Result Dialog */}
      <ResponsiveDialog
        open={showEnterResultDialog}
        onClose={() => setShowEnterResultDialog(false)}
        title={t("enterResultTitle")}
      >
        <form action={handleAction} className="space-y-4">
          <input type="hidden" name="intent" value="enterResult" />
          <input type="hidden" name="matchId" value={match.id} />
          <input
            type="hidden"
            name="team1Score"
            value={JSON.stringify(sets.map((s) => Number(s.player1) || 0))}
          />
          <input
            type="hidden"
            name="team2Score"
            value={JSON.stringify(sets.map((s) => Number(s.player2) || 0))}
          />
          <MatchScoreInput
            sets={sets}
            onChange={setSets}
            maxSets={match.seasonBestOf}
            player1Name={match.team1Name}
            player2Name={match.team2Name}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {t("submitResult")}
          </Button>
        </form>
      </ResponsiveDialog>
    </PageLayout>
  );
}
