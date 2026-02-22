import { describe, it, expect } from "bun:test";
import { isReservedClubSlug, isReservedSeasonSlug } from "./reserved-slugs";

describe("isReservedClubSlug", () => {
  it("returns true for reserved root-level slugs", () => {
    expect(isReservedClubSlug("feed")).toBe(true);
    expect(isReservedClubSlug("admin")).toBe(true);
    expect(isReservedClubSlug("settings")).toBe(true);
    expect(isReservedClubSlug("profile")).toBe(true);
    expect(isReservedClubSlug("login")).toBe(true);
    expect(isReservedClubSlug("api")).toBe(true);
  });

  it("returns false for non-reserved slugs", () => {
    expect(isReservedClubSlug("utv-obersdorf")).toBe(false);
    expect(isReservedClubSlug("tc-musterstadt")).toBe(false);
  });
});

describe("isReservedSeasonSlug", () => {
  it("returns true for reserved club-level slugs", () => {
    expect(isReservedSeasonSlug("admin")).toBe(true);
  });

  it("returns false for non-reserved slugs", () => {
    expect(isReservedSeasonSlug("sommer-2025")).toBe(false);
  });
});
