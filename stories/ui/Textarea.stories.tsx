import preview from "#.storybook/preview";
import { Textarea } from "@/components/ui/textarea";

const meta = preview.meta({
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { "aria-label": "Texteingabe" },
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  args: { placeholder: "Nachricht eingeben..." },
});

export const WithValue = meta.story({
  args: { defaultValue: "Ich fordere dich heraus! Hast du am Wochenende Zeit?" },
});

export const Error = meta.story({
  args: {
    error: true,
    defaultValue: "Zu kurz",
    "aria-invalid": true,
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
    defaultValue: "Nicht bearbeitbar",
  },
});
