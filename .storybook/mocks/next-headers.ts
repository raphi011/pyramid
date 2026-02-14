// Mock for next/headers in Storybook — server-only APIs are no-ops in the browser
export function cookies() {
  return {
    get: () => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
    has: () => false,
  };
}

export function headers() {
  return new Headers();
}
