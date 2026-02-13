"use client";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <Button type="submit" variant="outline">
        Abmelden
      </Button>
    </form>
  );
}
