import preview from "#.storybook/preview";
import { Input } from "@/components/ui/input";

const meta = preview.meta({
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { "aria-label": "Eingabe" },
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  args: { placeholder: "E-Mail-Adresse" },
});

export const WithValue = meta.story({
  args: { defaultValue: "spieler@example.com" },
});

export const Error = meta.story({
  args: {
    error: true,
    defaultValue: "ungültig",
    "aria-invalid": true,
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
    defaultValue: "Nicht bearbeitbar",
  },
});

export const Password = meta.story({
  args: { type: "password", placeholder: "Passwort" },
});

export const Number = meta.story({
  args: { type: "number", placeholder: "0", className: "w-20" },
});
