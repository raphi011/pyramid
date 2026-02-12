import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@/components/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
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
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Nachricht eingeben..." },
};

export const WithValue: Story = {
  args: { defaultValue: "Ich fordere dich heraus! Hast du am Wochenende Zeit?" },
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: "Zu kurz",
    "aria-invalid": true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Nicht bearbeitbar",
  },
};
