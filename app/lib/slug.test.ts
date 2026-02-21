import { describe, expect, test } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  test("lowercases and replaces spaces", () => {
    expect(slugify("My Club Name")).toBe("my-club-name");
  });

  test("transliterates German characters", () => {
    expect(slugify("Münchner Tennisklüb")).toBe("muenchner-tennisklueb");
    expect(slugify("Straße")).toBe("strasse");
    expect(slugify("Ärger Übung Öffnung")).toBe("aerger-uebung-oeffnung");
  });

  test("strips accented characters via NFKD", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
    expect(slugify("naïve")).toBe("naive");
  });

  test("collapses multiple hyphens", () => {
    expect(slugify("hello   ---   world")).toBe("hello-world");
  });

  test("trims leading/trailing hyphens", () => {
    expect(slugify("--trimmed--")).toBe("trimmed");
    expect(slugify("  spaces  ")).toBe("spaces");
  });

  test("handles special characters", () => {
    expect(slugify("Club #1 (2024)")).toBe("club-1-2024");
    expect(slugify("A & B / C")).toBe("a-b-c");
  });

  test("truncates to 80 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(80);
  });

  test("returns 'unnamed' for empty/whitespace-only input", () => {
    expect(slugify("")).toBe("unnamed");
    expect(slugify("   ")).toBe("unnamed");
    expect(slugify("---")).toBe("unnamed");
  });

  test("handles uppercase German characters", () => {
    expect(slugify("ÄÖÜ")).toBe("aeoeue");
  });

  test("handles mixed alphanumeric", () => {
    expect(slugify("Season 2024/25")).toBe("season-2024-25");
  });
});
