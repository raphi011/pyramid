// Mock for updateThemeAction in Storybook — server actions can't run in the browser
export type ThemeResult = { success: true } | { error: string };

export async function updateThemeAction(): Promise<ThemeResult> {
  return { success: true };
}
