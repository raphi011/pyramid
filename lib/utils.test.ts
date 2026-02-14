import { describe, it, expect } from "vitest";
import { abbreviateName } from "./utils";

describe("abbreviateName", () => {
  it.each([
    ["Raphael Gruber", "Raphael G."],
    ["Anna Schmidt", "Anna S."],
    ["John Michael Smith", "John S."],
  ])('abbreviates "%s" to "%s"', (input, expected) => {
    expect(abbreviateName(input)).toBe(expected);
  });

  it("returns single name as-is", () => {
    expect(abbreviateName("Raphael")).toBe("Raphael");
  });

  it("returns empty string for empty input", () => {
    expect(abbreviateName("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(abbreviateName("   ")).toBe("");
  });

  it("handles extra whitespace between parts", () => {
    expect(abbreviateName("Raphael   Gruber")).toBe("Raphael G.");
  });
});
