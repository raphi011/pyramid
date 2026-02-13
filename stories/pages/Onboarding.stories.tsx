"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const meta = preview.meta({
  title: "Pages/Onboarding",
  parameters: { layout: "centered" },
});

export default meta;

function OnboardingPage({ nameError }: { nameError?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardContent className="mt-0 space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Willkommen!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vervollständige dein Profil
            </p>
          </div>

          <div className="flex justify-center">
            <button className="group relative">
              <Avatar name={name || "?"} size="xl" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Foto
              </span>
            </button>
          </div>

          <div className="space-y-4">
            <FormField
              label="Name"
              placeholder="Max Mustermann"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              required
            />
            <FormField
              label="Telefon"
              type="tel"
              placeholder="+49 170 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={!name.trim()}>
            Weiter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const Default = meta.story({
  render: () => <OnboardingPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Button should be disabled when name is empty
    const button = canvas.getByRole("button", { name: /weiter/i });
    await expect(button).toBeDisabled();

    // Type name
    const nameInput = canvas.getByPlaceholderText("Max Mustermann");
    await userEvent.type(nameInput, "Max Mustermann");
    await expect(nameInput).toHaveValue("Max Mustermann");

    // Button should now be enabled
    await expect(button).toBeEnabled();

    // Type phone (optional)
    const phoneInput = canvas.getByPlaceholderText("+49 170 1234567");
    await userEvent.type(phoneInput, "+49 170 9999999");
    await expect(phoneInput).toHaveValue("+49 170 9999999");
  },
});

export const WithValidation = meta.story({
  render: () => <OnboardingPage nameError="Name ist erforderlich" />,
});
