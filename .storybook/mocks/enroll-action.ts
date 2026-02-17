// Mock for enrollInSeasonAction in Storybook — server actions can't run in the browser
import type { ActionResult } from "@/app/lib/action-result";

export async function enrollInSeasonAction(): Promise<ActionResult> {
  return { success: true };
}
