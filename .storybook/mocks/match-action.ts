// Mock for match actions in Storybook — server actions can't run in the browser
export type MatchActionResult = { success: true } | { error: string };

export async function proposeDateAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function acceptDateAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function declineDateAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function enterResultAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function confirmResultAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function withdrawAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function forfeitAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function disputeAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function postCommentAction(): Promise<MatchActionResult> {
  return { success: true };
}

export async function uploadMatchImageAction(): Promise<MatchActionResult> {
  return { success: true };
}
