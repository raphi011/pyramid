import type { Meta, StoryObj } from "@storybook/react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/card";

const meta: Meta<typeof PageLayout> = {
  title: "Composites/PageLayout",
  component: PageLayout,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageLayout>;

export const WithAction: Story = {
  render: () => (
    <PageLayout
      title="Rangliste"
      subtitle="Saison 2026 — TC Musterstadt"
      action={<Button size="sm">Herausfordern</Button>}
    >
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Pyramide wird hier angezeigt...</p>
        </CardContent>
      </Card>
    </PageLayout>
  ),
};

export const WithoutAction: Story = {
  render: () => (
    <PageLayout title="Neuigkeiten">
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Feed wird hier angezeigt...</p>
        </CardContent>
      </Card>
    </PageLayout>
  ),
};

export const WithSubtitle: Story = {
  render: () => (
    <PageLayout
      title="Mein Profil"
      subtitle="Rang 3 · 12 Siege · 5 Niederlagen"
    >
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Profil-Inhalt...</p>
        </CardContent>
      </Card>
    </PageLayout>
  ),
};
