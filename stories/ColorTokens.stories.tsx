import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";

function ColorSwatch({
  name,
  token,
  hex,
}: {
  name: string;
  token: string;
  hex: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-lg ring-1 ring-slate-200"
        style={{ backgroundColor: hex }}
      />
      <div>
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {name}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {token} · {hex}
        </div>
      </div>
    </div>
  );
}

function ColorTokens() {
  return (
    <div className="space-y-8 p-6 font-sans">
      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Court Green — Primary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ColorSwatch name="court-50" token="bg-court-50" hex="#F0FDF4" />
          <ColorSwatch name="court-100" token="bg-court-100" hex="#DCFCE7" />
          <ColorSwatch name="court-200" token="bg-court-200" hex="#BBF7D0" />
          <ColorSwatch name="court-300" token="bg-court-300" hex="#86EFAC" />
          <ColorSwatch name="court-400" token="bg-court-400" hex="#4ADE80" />
          <ColorSwatch name="court-500" token="bg-court-500" hex="#22C55E" />
          <ColorSwatch name="court-600" token="bg-court-600" hex="#16A34A" />
          <ColorSwatch name="court-700" token="bg-court-700" hex="#15803D" />
          <ColorSwatch name="court-800" token="bg-court-800" hex="#166534" />
          <ColorSwatch name="court-900" token="bg-court-900" hex="#14532D" />
          <ColorSwatch name="court-950" token="bg-court-950" hex="#052E16" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Trophy Gold — Accent
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ColorSwatch name="trophy-50" token="bg-trophy-50" hex="#FFFBEB" />
          <ColorSwatch name="trophy-100" token="bg-trophy-100" hex="#FEF3C7" />
          <ColorSwatch name="trophy-200" token="bg-trophy-200" hex="#FDE68A" />
          <ColorSwatch name="trophy-400" token="bg-trophy-400" hex="#FBBF24" />
          <ColorSwatch name="trophy-500" token="bg-trophy-500" hex="#F59E0B" />
          <ColorSwatch name="trophy-600" token="bg-trophy-600" hex="#D97706" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Sample Buttons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-xl bg-court-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-court-600 active:bg-court-700 active:shadow-none">
            Primary Button
          </button>
          <button className="rounded-xl bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800">
            Outline Button
          </button>
          <button className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 active:bg-red-700">
            Destructive
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Sample Badges
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="win">Win</Badge>
          <Badge variant="loss">Loss</Badge>
          <Badge variant="pending">Pending</Badge>
          <Badge variant="rank">#1</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof ColorTokens> = {
  title: "Design System/Color Tokens",
  component: ColorTokens,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ColorTokens>;

export const Default: Story = {};
