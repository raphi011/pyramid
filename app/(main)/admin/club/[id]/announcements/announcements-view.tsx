"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MegaphoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { DataList } from "@/components/data-list";
import type { PastAnnouncement } from "@/app/lib/db/admin";

type AnnouncementsViewProps = {
  pastAnnouncements: PastAnnouncement[];
};

export function AnnouncementsView({
  pastAnnouncements,
}: AnnouncementsViewProps) {
  const t = useTranslations("announcements");

  const [message, setMessage] = useState("");
  const [sendAsEmail, setSendAsEmail] = useState(false);

  return (
    <PageLayout title={t("title")}>
      {/* New announcement */}
      <Card>
        <CardHeader>
          <CardTitle>{t("newAnnouncement")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("messageLabel")}
              type="textarea"
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Checkbox
              label={t("sendAsEmail")}
              checked={sendAsEmail}
              onChange={setSendAsEmail}
            />
            <Button disabled={!message.trim()}>{t("send")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Past announcements */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pastAnnouncements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={pastAnnouncements}
            keyExtractor={(a) => a.id}
            empty={{
              icon: <MegaphoneIcon />,
              title: t("noPastAnnouncements"),
              description: t("noPastAnnouncementsDesc"),
            }}
            renderItem={(announcement) => (
              <div className="py-3">
                <p className="text-sm text-slate-900 dark:text-white">
                  {announcement.message}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t("sentBy", { name: announcement.sentBy })}</span>
                  <span>&middot;</span>
                  <span>{announcement.sentAt}</span>
                  {announcement.emailed && (
                    <>
                      <span>&middot;</span>
                      <span className="inline-flex items-center gap-1">
                        <EnvelopeIcon className="size-3" />
                        {t("emailed")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
