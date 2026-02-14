import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Abbreviates to first name + last initial.
 * abbreviateName("Anna", "Müller") → "Anna M."
 */
export function abbreviateName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName[0]}.`;
}

/**
 * Returns the full display name.
 */
export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
