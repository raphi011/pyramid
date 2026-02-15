import { describe, it, expect } from "vitest";
import { abbreviateName, fullName } from "./utils";

describe("abbreviateName", () => {
  it.each([
    ["Anna", "Müller", "Anna M."],
    ["Raphael", "Gruber", "Raphael G."],
    ["John", "Smith", "John S."],
    ["Anna", "", "Anna"],
    ["", "Müller", "M."],
    ["", "", ""],
  ])('abbreviates "%s %s" to "%s"', (first, last, expected) => {
    expect(abbreviateName(first, last)).toBe(expected);
  });
});

describe("fullName", () => {
  it.each([
    ["Anna", "Müller", "Anna Müller"],
    ["Anna", "", "Anna"],
    ["", "Müller", "Müller"],
    ["", "", ""],
  ])('fullName("%s", "%s") → "%s"', (first, last, expected) => {
    expect(fullName(first, last)).toBe(expected);
  });
});
