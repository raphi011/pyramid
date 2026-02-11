import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "@/components/ui/toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    variant: "success",
    title: "Forderung gesendet",
    description: "Max Mustermann wurde herausgefordert.",
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Fehler",
    description: "Die Aktion konnte nicht ausgeführt werden.",
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    title: "Neue Saison",
    description: "Saison 2026 wurde gestartet.",
    onClose: () => {},
  },
};

export const WithAction: Story = {
  args: {
    variant: "success",
    title: "Ergebnis eingetragen",
    onClose: () => {},
    action: { label: "Rückgängig", onClick: () => {} },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-3">
      <Toast variant="success" title="Erfolg" description="Alles hat geklappt." onClose={() => {}} />
      <Toast variant="error" title="Fehler" description="Etwas ist schiefgelaufen." onClose={() => {}} />
      <Toast variant="info" title="Info" description="Neue Aktualisierung verfügbar." onClose={() => {}} />
    </div>
  ),
};
