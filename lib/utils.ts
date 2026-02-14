import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Abbreviates a full name to first name + last initial.
 * "Raphael Gruber" → "Raphael G."
 * "Raphael" → "Raphael"
 */
export function abbreviateName(name: string): string {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
