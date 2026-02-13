import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /anmelden/i }),
    ).toBeVisible();
  });
});
