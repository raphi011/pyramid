import { type ZodType, type ZodTypeDef, ZodError } from "zod";

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = {
  success: false;
  error: string;
  fieldErrors: Record<string, string>;
};

export function parseFormData<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  formData: FormData,
): ParseSuccess<T> | ParseFailure {
  // Object.fromEntries keeps only the last value for duplicate keys.
  // All current schemas use single-value fields.
  const raw = Object.fromEntries(formData.entries());
  try {
    const data = schema.parse(raw);
    return { success: true, data };
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.issues) {
        const field = issue.path.join(".");
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return {
        success: false,
        error: e.issues[0]?.message ?? "Invalid input",
        fieldErrors,
      };
    }
    throw e;
  }
}
