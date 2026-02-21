import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { EnrollmentBanner } from "@/components/domain/enrollment-banner";

const meta = preview.meta({
  title: "Domain/EnrollmentBanner",
  component: EnrollmentBanner,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const CanEnroll = meta.story({
  args: {
    seasonId: 1,
    clubId: 1,
    clubSlug: "tc-musterstadt",
    seasonSlug: "sommer-2026",
    canEnroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Enrollment prompt is shown
    await expect(
      canvas.getByText(/not enrolled|noch nicht.*angemeldet/i),
    ).toBeInTheDocument();

    // Join button is present and enabled
    const joinBtn = canvas.getByRole("button", {
      name: /join|teilnehmen/i,
    });
    await expect(joinBtn).toBeEnabled();

    // Hidden form fields contain correct IDs
    const form = joinBtn.closest("form")!;
    const seasonInput = form.querySelector(
      'input[name="seasonId"]',
    ) as HTMLInputElement;
    const clubInput = form.querySelector(
      'input[name="clubId"]',
    ) as HTMLInputElement;
    await expect(seasonInput.value).toBe("1");
    await expect(clubInput.value).toBe("1");
  },
});

export const EnrollmentClosed = meta.story({
  args: {
    seasonId: 1,
    clubId: 1,
    clubSlug: "tc-musterstadt",
    seasonSlug: "sommer-2026",
    canEnroll: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Informational message is shown
    await expect(
      canvas.getByText(/contact.*admin|wende dich an/i),
    ).toBeInTheDocument();

    // No join button
    const joinBtn = canvas.queryByRole("button", {
      name: /join|teilnehmen/i,
    });
    await expect(joinBtn).toBeNull();
  },
});
