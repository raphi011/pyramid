import preview from "#.storybook/preview";
import { within, userEvent, expect, fn } from "storybook/test";
import { Toast } from "@/components/ui/toast";

const meta = preview.meta({
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClose: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "info"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Success = meta.story({
  args: {
    variant: "success",
    title: "Forderung gesendet",
    description: "Max Mustermann wurde herausgefordert.",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify toast content renders
    await expect(canvas.getByText("Forderung gesendet")).toBeInTheDocument();
    await expect(
      canvas.getByText("Max Mustermann wurde herausgefordert."),
    ).toBeInTheDocument();

    // Click close button
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClose).toHaveBeenCalled();
  },
});

export const Error = meta.story({
  args: {
    variant: "error",
    title: "Fehler",
    description: "Die Aktion konnte nicht ausgeführt werden.",
  },
});

export const Info = meta.story({
  args: {
    variant: "info",
    title: "Neue Saison",
    description: "Saison 2026 wurde gestartet.",
  },
});

export const WithAction = meta.story({
  args: {
    variant: "success",
    title: "Ergebnis eingetragen",
    action: { label: "Rückgängig", onClick: fn() },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify action button is visible
    const actionBtn = canvas.getByRole("button", { name: /rückgängig/i });
    await expect(actionBtn).toBeInTheDocument();
    await userEvent.click(actionBtn);
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="space-y-3">
      <Toast
        variant="success"
        title="Erfolg"
        description="Alles hat geklappt."
        onClose={fn()}
      />
      <Toast
        variant="error"
        title="Fehler"
        description="Etwas ist schiefgelaufen."
        onClose={fn()}
      />
      <Toast
        variant="info"
        title="Info"
        description="Neue Aktualisierung verfügbar."
        onClose={fn()}
      />
    </div>
  ),
});
