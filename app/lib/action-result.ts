/** Discriminated union for server action outcomes. */
export type ActionResult = { success: true } | { error: string };

/** Extended variant when the success case carries extra data. */
export type ActionResultWith<T> = ({ success: true } & T) | { error: string };

export function isActionError(
  result: ActionResult | ActionResultWith<unknown>,
): result is { error: string } {
  return "error" in result;
}
