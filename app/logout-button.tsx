"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("nav");

  return (
    <form action="/api/auth/logout" method="POST">
      <Button type="submit" variant="outline">
        {t("logout")}
      </Button>
    </form>
  );
}
