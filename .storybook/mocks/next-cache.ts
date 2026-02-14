// Mock for next/cache in Storybook — server-only APIs are no-ops in the browser
export function revalidatePath() {}
export function revalidateTag() {}
export function unstable_cache<T>(fn: () => T) {
  return fn;
}
export function unstable_noStore() {}
