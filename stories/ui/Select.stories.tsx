import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "@/components/ui/select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">Saison wählen...</option>
        <option value="2026">Saison 2026</option>
        <option value="2025">Saison 2025</option>
        <option value="2024">Saison 2024</option>
      </>
    ),
  },
};

export const WithSelection: Story = {
  args: {
    defaultValue: "2026",
    children: (
      <>
        <option value="2026">Saison 2026</option>
        <option value="2025">Saison 2025</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: <option>Nicht verfügbar</option>,
  },
};

export const Error: Story = {
  args: {
    error: true,
    children: (
      <>
        <option value="">Bitte wählen...</option>
        <option value="1">Option 1</option>
      </>
    ),
  },
};
