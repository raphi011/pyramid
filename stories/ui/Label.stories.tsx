import preview from "#.storybook/preview";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const meta = preview.meta({
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({
  args: { children: "E-Mail" },
});

export const Required = meta.story({
  args: { children: "E-Mail", required: true },
});

export const WithInput = meta.story({
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="email" required>
        E-Mail
      </Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
});
