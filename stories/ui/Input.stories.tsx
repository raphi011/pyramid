import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
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
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "E-Mail-Adresse" },
};

export const WithValue: Story = {
  args: { defaultValue: "spieler@example.com" },
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: "ungültig",
    "aria-invalid": true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Nicht bearbeitbar",
  },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Passwort" },
};

export const Number: Story = {
  args: { type: "number", placeholder: "0", className: "w-20" },
};
