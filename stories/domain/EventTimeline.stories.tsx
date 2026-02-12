import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { EventTimeline } from "@/components/domain/event-timeline";
import { sampleTimelineEvents, seasonStartEvent, seasonEndEvent } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/EventTimeline",
  component: EventTimeline,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  args: { events: sampleTimelineEvents },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Date separators render for groups
    const separators = canvas.getAllByRole("separator");
    await expect(separators.length).toBeGreaterThan(0);

    // Event content is visible (player names from fixtures)
    await expect(canvas.getAllByText(/Max Mustermann/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/Tom Weber/).length).toBeGreaterThan(0);
  },
});

export const Loading = meta.story({
  args: { events: [], loading: true },
});

export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Empty state heading renders
    await expect(canvas.getByText(/keine neuigkeiten/i)).toBeInTheDocument();
  },
});

export const WithSeasonEvents = meta.story({
  args: {
    events: [
      ...sampleTimelineEvents,
      seasonStartEvent,
      seasonEndEvent,
    ],
  },
});
