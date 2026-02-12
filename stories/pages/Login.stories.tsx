"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const meta: Meta = {
  title: "Pages/Login",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

function LoginPage({ error }: { error?: string }) {
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardContent className="mt-0 space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-court-500 text-white">
              <svg
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m-.53-.53L21 21M3 21l8.735-8.735m0 0a.374.374 0 11-.53-.53m.53.53l-.53-.53"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Pyramid
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Melde dich mit deiner E-Mail an
            </p>
          </div>

          <FormField
            label="E-Mail"
            type="email"
            placeholder="name@verein.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
          />

          <Button className="w-full" disabled={!email.trim()}>
            Anmelden
          </Button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Kein Konto? Frag deinen Club-Admin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const Default: Story = {
  render: () => <LoginPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Button should be disabled when empty
    const button = canvas.getByRole("button", { name: /anmelden/i });
    await expect(button).toBeDisabled();

    // Type email into the only text input
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "max@verein.de");
    await expect(input).toHaveValue("max@verein.de");

    // Button should now be enabled
    await expect(button).toBeEnabled();
  },
};

export const WithError: Story = {
  render: () => <LoginPage error="Diese E-Mail ist nicht registriert" />,
};
