export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

export class SlugConflictError extends Error {
  constructor() {
    super("Slug conflict");
    this.name = "SlugConflictError";
  }
}

export class ReservedSlugError extends Error {
  constructor() {
    super("Slug conflicts with reserved route");
    this.name = "ReservedSlugError";
  }
}
