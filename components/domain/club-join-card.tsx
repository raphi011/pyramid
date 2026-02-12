"use client";

import { useTranslations } from "next-intl";
import { ClipboardDocumentIcon } from "@heroicons/react/20/solid";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ClubJoinCardProps =
  | {
      mode: "admin";
      clubCode: string;
      onCopy?: () => void;
      onShare?: () => void;
      qrSlot?: React.ReactNode;
      className?: string;
    }
  | {
      mode: "player";
      code: string;
      onCodeChange: (value: string) => void;
      onJoin: () => void;
      loading?: boolean;
      error?: string;
      className?: string;
    };

function ClubJoinCard(props: ClubJoinCardProps) {
  const t = useTranslations("club");
  const tCommon = useTranslations("common");

  if (props.mode === "admin") {
    return (
      <Card className={props.className}>
        <CardHeader>
          <CardTitle>{t("inviteCode")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Code display */}
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-lg font-bold tracking-widest text-slate-900 dark:bg-slate-800 dark:text-white">
                {props.clubCode}
              </code>
              {props.onCopy && (
                <Button variant="outline" size="sm" onClick={props.onCopy} aria-label={tCommon("copy")}>
                  <ClipboardDocumentIcon className="size-4" />
                </Button>
              )}
            </div>

            {/* QR slot */}
            {props.qrSlot && (
              <div className="flex justify-center">{props.qrSlot}</div>
            )}

            {/* Share button */}
            {props.onShare && (
              <Button
                variant="outline"
                className="w-full"
                onClick={props.onShare}
              >
                {tCommon("share")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={props.className}>
      <CardHeader>
        <CardTitle>{t("joinTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("joinDesc")}
          </p>
          <Input
            value={props.code}
            onChange={(e) => props.onCodeChange(e.target.value)}
            placeholder={t("codePlaceholder")}
            error={!!props.error}
            className="text-center text-lg font-bold tracking-widest"
          />
          {props.error && (
            <p className="text-sm text-red-600">{props.error}</p>
          )}
          <Button
            className="w-full"
            onClick={props.onJoin}
            loading={props.loading}
            disabled={!props.code.trim()}
          >
            {t("join")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ClubJoinCard };
export type { ClubJoinCardProps };
