/** Narrows an array to a non-empty tuple, throwing if empty. */
export function assertNonEmpty<T>(arr: T[], message?: string): [T, ...T[]] {
  if (arr.length === 0) {
    throw new Error(message ?? "Expected non-empty array");
  }
  return arr as [T, ...T[]];
}
