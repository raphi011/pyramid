"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Avatar } from "@/components/ui/avatar";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { isActionError } from "@/app/lib/action-result";
import type { ActionResult } from "@/app/lib/action-result";
import type { Club } from "@/app/lib/db/club";

type ClubSettingsViewProps = {
  club: Club;
  avatarSrc: string | null;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  regenerateAction: (formData: FormData) => Promise<ActionResult>;
};

export function ClubSettingsView({
  club,
  avatarSrc,
  updateAction,
  regenerateAction,
}: ClubSettingsViewProps) {
  const t = useTranslations("clubSettings");
  const tError = useTranslations();
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Form state ──────────────────────────────
  const [name, setName] = useState(club.name);
  const [url, setUrl] = useState(club.url);
  const [phoneNumber, setPhoneNumber] = useState(club.phoneNumber);
  const [address, setAddress] = useState(club.address);
  const [city, setCity] = useState(club.city);
  const [zip, setZip] = useState(club.zip);
  const [country, setCountry] = useState(club.country);
  const [imageId, setImageId] = useState<string | null>(club.imageId);
  const [previewSrc, setPreviewSrc] = useState<string | null>(avatarSrc);

  // ── Image upload ────────────────────────────
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
      const data = await res.json();
      if (!data.id) {
        setError(t("error.serverError"));
        return;
      }
      setImageId(data.id);
      setPreviewSrc(`/api/images/${data.id}`);
    } catch (err) {
      console.error("Club image upload failed:", err);
      setError(t("error.serverError"));
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveLogo() {
    setImageId(null);
    setPreviewSrc(null);
  }

  // ── Save ────────────────────────────────────
  function handleSave() {
    const fd = new FormData();
    fd.set("clubId", club.id.toString());
    fd.set("name", name);
    fd.set("url", url);
    fd.set("phoneNumber", phoneNumber);
    fd.set("address", address);
    fd.set("city", city);
    fd.set("zip", zip);
    fd.set("country", country);
    fd.set("imageId", imageId ?? "");

    startTransition(async () => {
      setError(null);
      setSuccess(false);
      const result = await updateAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  // ── Regenerate invite code ──────────────────
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPending, startRegenTransition] = useTransition();

  function handleRegenerate() {
    const fd = new FormData();
    fd.set("clubId", club.id.toString());

    startRegenTransition(async () => {
      setError(null);
      const result = await regenerateAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      } else {
        router.refresh();
      }
      setRegenOpen(false);
    });
  }

  return (
    <PageLayout
      title={club.name}
      subtitle={t("subtitle")}
      action={
        <Link href={`/admin/club/${club.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="size-4" />
            {t("back")}
          </Button>
        </Link>
      }
    >
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>{t("general")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("nameLabel")}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("logoSection")}
              </p>
              <div className="flex items-center gap-3">
                <Avatar name={club.name} src={previewSrc} size="xl" />
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400">
                    {isUploading ? t("uploading") : t("changeLogo")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading || pending}
                    />
                  </label>
                  {previewSrc && (
                    <button
                      type="button"
                      className="text-left text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      onClick={handleRemoveLogo}
                      disabled={isUploading || pending}
                    >
                      {t("removeLogo")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contact")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("urlLabel")}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputProps={{ placeholder: t("urlPlaceholder") }}
            />
            <FormField
              label={t("phoneLabel")}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>{t("addressSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("addressLabel")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("zipLabel")}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
              <FormField
                label={t("cityLabel")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <FormField
              label={t("countryLabel")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button onClick={handleSave} disabled={pending} loading={pending}>
        {t("saveChanges")}
      </Button>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t("inviteCode")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {t("inviteCodeDesc")}
          </p>
          <div className="mb-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
            <p className="font-mono text-lg tracking-widest text-slate-700 dark:text-slate-300">
              {club.inviteCode}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setRegenOpen(true)}
            disabled={regenPending}
          >
            {t("regenerate")}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        onConfirm={handleRegenerate}
        title={t("regenerateTitle")}
        description={t("regenerateDesc")}
        loading={regenPending}
      />

      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Toast variant="error" title={error} onClose={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Toast
            variant="success"
            title={t("saved")}
            onClose={() => setSuccess(false)}
          />
        </div>
      )}
    </PageLayout>
  );
}
