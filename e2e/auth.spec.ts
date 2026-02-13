import { test, expect } from "@playwright/test";
import {
  createTestPlayer,
  createTestMagicLink,
  cleanupTestPlayer,
  closeDb,
} from "./helpers/db";

test.afterAll(async () => {
  await closeDb();
});

test.describe("auth flow", () => {
  test("login form shows and submits to /check-email", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByRole("textbox");
    await expect(emailInput).toBeVisible();

    await emailInput.fill("test@example.com");
    await page.getByRole("button", { name: /login-link anfordern/i }).click();

    await expect(page).toHaveURL(/\/check-email/);
  });

  test("valid magic link with named player redirects to /", async ({
    page,
  }) => {
    const player = await createTestPlayer({ name: "Named Player" });

    try {
      const token = await createTestMagicLink(player.id);
      await page.goto(`/api/auth/verify?token=${token}`);

      await expect(page).toHaveURL("/");
      await expect(page.getByText("Named Player")).toBeVisible();
    } finally {
      await cleanupTestPlayer(player.id);
    }
  });

  test("valid magic link with unnamed player redirects to /onboarding", async ({
    page,
  }) => {
    const player = await createTestPlayer({ name: "" });

    try {
      const token = await createTestMagicLink(player.id);
      await page.goto(`/api/auth/verify?token=${token}`);

      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page.getByText("Willkommen!")).toBeVisible();
    } finally {
      await cleanupTestPlayer(player.id);
    }
  });

  test("expired token redirects to /login with error", async ({ page }) => {
    const player = await createTestPlayer({ name: "Expired" });

    try {
      const token = await createTestMagicLink(player.id, { expired: true });
      await page.goto(`/api/auth/verify?token=${token}`);

      await expect(page).toHaveURL(/\/login\?error=invalid_token/);
    } finally {
      await cleanupTestPlayer(player.id);
    }
  });

  test("invalid token redirects to /login with error", async ({ page }) => {
    await page.goto("/api/auth/verify?token=bogus-token-does-not-exist");
    await expect(page).toHaveURL(/\/login\?error=invalid_token/);
  });

  test("complete onboarding sets name and redirects to /", async ({
    page,
  }) => {
    const player = await createTestPlayer({ name: "" });

    try {
      // Log in via magic link → should land on onboarding
      const token = await createTestMagicLink(player.id);
      await page.goto(`/api/auth/verify?token=${token}`);
      await expect(page).toHaveURL(/\/onboarding/);

      // Fill in name and submit
      await page.getByPlaceholder("Max Mustermann").fill("E2E Tester");
      await page.getByPlaceholder("+49 170 1234567").fill("+49 170 0000000");
      await page.getByRole("button", { name: /weiter/i }).click();

      // Should redirect to home with the new name
      await expect(page).toHaveURL("/");
      await expect(page.getByText("E2E Tester")).toBeVisible();
    } finally {
      await cleanupTestPlayer(player.id);
    }
  });

  test("logout clears session and redirects to /login", async ({ page }) => {
    const player = await createTestPlayer({ name: "Logout Tester" });

    try {
      const token = await createTestMagicLink(player.id);
      await page.goto(`/api/auth/verify?token=${token}`);
      await expect(page).toHaveURL("/");

      // Click logout
      await page.getByRole("button", { name: /abmelden/i }).click();
      await expect(page).toHaveURL(/\/login/);

      // Should not be able to access home anymore
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await cleanupTestPlayer(player.id);
    }
  });
});
