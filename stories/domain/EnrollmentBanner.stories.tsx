import preview from "#.storybook/preview";
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
    canEnroll: true,
  },
});

export const EnrollmentClosed = meta.story({
  args: {
    seasonId: 1,
    clubId: 1,
    canEnroll: false,
  },
});
