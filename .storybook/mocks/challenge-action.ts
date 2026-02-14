// Mock for createChallengeAction in Storybook — server actions can't run in the browser
export type ChallengeResult =
  | { success: true; matchId: number }
  | { error: string };

export async function createChallengeAction(): Promise<ChallengeResult> {
  return { success: true, matchId: 1 };
}
