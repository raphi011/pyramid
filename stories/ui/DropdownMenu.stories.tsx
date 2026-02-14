import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import {
  PencilIcon,
  TrashIcon,
  ArrowRightStartOnRectangleIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const meta = preview.meta({
  title: "UI/Dropdown Menu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Simple = meta.story({
  render: () => (
    <DropdownMenu
      trigger={
        <Button variant="outline" size="sm" aria-label="Menü öffnen">
          <EllipsisVerticalIcon className="size-4" />
        </Button>
      }
    >
      <DropdownMenuItem icon={<PencilIcon />}>Bearbeiten</DropdownMenuItem>
      <DropdownMenuItem icon={<ArrowRightStartOnRectangleIcon />}>
        Abmelden
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<TrashIcon />} destructive>
        Löschen
      </DropdownMenuItem>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Click the trigger button
    await userEvent.click(canvas.getByRole("button"));

    // Menu items should appear (portaled to body)
    await expect(await body.findByText("Bearbeiten")).toBeInTheDocument();
    await expect(body.getByText("Abmelden")).toBeInTheDocument();
    await expect(body.getByText("Löschen")).toBeInTheDocument();
  },
});

export const WithoutIcons = meta.story({
  render: () => (
    <DropdownMenu trigger={<Button variant="outline">Menü</Button>}>
      <DropdownMenuItem>Profil anzeigen</DropdownMenuItem>
      <DropdownMenuItem>Einstellungen</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>Abmelden</DropdownMenuItem>
    </DropdownMenu>
  ),
});
