import preview from "#.storybook/preview";
import { Select } from "@/components/ui/select";

const meta = preview.meta({
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  args: { "aria-label": "Auswahl" },
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
});

export const WithSelection = meta.story({
  args: {
    defaultValue: "2026",
    children: (
      <>
        <option value="2026">Saison 2026</option>
        <option value="2025">Saison 2025</option>
      </>
    ),
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
    children: <option>Nicht verfügbar</option>,
  },
});

export const Error = meta.story({
  args: {
    error: true,
    children: (
      <>
        <option value="">Bitte wählen...</option>
        <option value="1">Option 1</option>
      </>
    ),
  },
});
