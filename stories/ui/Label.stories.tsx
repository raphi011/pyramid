import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: "E-Mail" },
};

export const Required: Story = {
  args: { children: "E-Mail", required: true },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="email" required>
        E-Mail
      </Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
};
