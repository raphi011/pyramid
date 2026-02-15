import { type ZodType, type ZodTypeDef, ZodError } from "zod";

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; error: string };

export function parseFormData<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  formData: FormData,
): ParseSuccess<T> | ParseFailure {
  const raw = Object.fromEntries(formData.entries());
  try {
    const data = schema.parse(raw);
    return { success: true, data };
  } catch (e) {
    if (e instanceof ZodError) {
      return { success: false, error: e.issues[0]?.message ?? "Invalid input" };
    }
    throw e;
  }
}
