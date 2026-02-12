import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { FormField } from "@/components/form-field";

const meta: Meta<typeof FormField> = {
  title: "Composites/FormField",
  component: FormField,
  tags: ["autodocs"],
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
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: "E-Mail-Adresse",
    placeholder: "name@beispiel.de",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find input by label
    const input = canvas.getByLabelText("E-Mail-Adresse");
    await expect(input).toBeInTheDocument();

    // Type a value
    await userEvent.type(input, "test@example.com");
    await expect(input).toHaveValue("test@example.com");
  },
};

export const Required: Story = {
  args: {
    label: "Name",
    required: true,
    placeholder: "Dein vollständiger Name",
  },
};

export const WithError: Story = {
  args: {
    label: "E-Mail-Adresse",
    required: true,
    placeholder: "name@beispiel.de",
    error: "Bitte gib eine gültige E-Mail-Adresse ein.",
  },
};

export const WithTextarea: Story = {
  args: {
    label: "Nachricht",
    type: "textarea" as const,
    placeholder: "Schreibe eine Nachricht...",
  },
};

export const WithSelect: Story = {
  render: () => (
    <FormField label="Saison" type="select">
      <option value="">Saison wählen...</option>
      <option value="2026">Saison 2026</option>
      <option value="2025">Saison 2025</option>
    </FormField>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Vereinsname",
    value: "TC Musterstadt",
    disabled: true,
  },
};
