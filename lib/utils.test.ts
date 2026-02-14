import { describe, it, expect } from "vitest";
import { abbreviateName, fullName } from "./utils";

describe("abbreviateName", () => {
  it.each([
    ["Anna", "Müller", "Anna M."],
    ["Raphael", "Gruber", "Raphael G."],
    ["John", "Smith", "John S."],
  ])('abbreviates "%s %s" to "%s"', (first, last, expected) => {
    expect(abbreviateName(first, last)).toBe(expected);
  });
});

describe("fullName", () => {
  it("joins first and last name", () => {
    expect(fullName("Anna", "Müller")).toBe("Anna Müller");
  });
});
