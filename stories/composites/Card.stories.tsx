import preview from "#.storybook/preview";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const meta = preview.meta({
  title: "Composites/Card",
  component: Card,
  tags: ["autodocs"],
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
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Rangliste</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Die aktuelle Pyramiden-Rangliste deines Vereins.
        </p>
      </CardContent>
    </Card>
  ),
});

export const Interactive = meta.story({
  render: () => (
    <Card interactive>
      <CardHeader>
        <CardTitle>Max Mustermann</CardTitle>
        <CardAction>
          <Badge variant="win">Rang 3</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          5 Siege · 2 Niederlagen
        </p>
      </CardContent>
    </Card>
  ),
});

export const Highlighted = meta.story({
  render: () => (
    <Card highlighted>
      <CardHeader>
        <CardTitle>Aktuelle Position</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Du bist aktuell auf Rang 5 der Pyramide.
        </p>
      </CardContent>
    </Card>
  ),
});

export const WithAllSubcomponents = meta.story({
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Herausforderung</CardTitle>
        <CardAction>
          <Badge variant="pending">Offen</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Max Mustermann hat dich herausgefordert. Du hast 7 Tage Zeit zu
          antworten.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Ablehnen
        </Button>
        <Button size="sm">Annehmen</Button>
      </CardFooter>
    </Card>
  ),
});
