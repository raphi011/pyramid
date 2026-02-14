import { describe, it, expect } from "vitest";
import { validateScores } from "./validate-scores";

describe("validateScores", () => {
  // ── Valid scores ────────────────────────────────

  it("accepts 2-0 in best-of-3", () => {
    expect(validateScores([6, 7], [3, 4], 3)).toBe(true);
  });

  it("accepts 2-1 in best-of-3", () => {
    expect(validateScores([6, 3, 6], [3, 6, 4], 3)).toBe(true);
  });

  it("accepts 0-2 in best-of-3 (team2 wins)", () => {
    expect(validateScores([3, 4], [6, 7], 3)).toBe(true);
  });

  it("accepts best-of-1", () => {
    expect(validateScores([6], [3], 1)).toBe(true);
  });

  it("accepts 3-0 in best-of-5", () => {
    expect(validateScores([6, 7, 6], [3, 4, 2], 5)).toBe(true);
  });

  it("accepts 3-2 in best-of-5", () => {
    expect(validateScores([6, 3, 6, 4, 7], [3, 6, 4, 6, 5], 5)).toBe(true);
  });

  // ── Invalid: ties ──────────────────────────────

  it("rejects tied individual game", () => {
    expect(validateScores([6, 6], [6, 4], 3)).toBe(false);
  });

  it("rejects all-zero tie", () => {
    expect(validateScores([0, 0], [0, 0], 3)).toBe(false);
  });

  // ── Invalid: negative scores ───────────────────

  it("rejects negative score for team1", () => {
    expect(validateScores([-1, 6], [3, 4], 3)).toBe(false);
  });

  it("rejects negative score for team2", () => {
    expect(validateScores([6, 6], [3, -2], 3)).toBe(false);
  });

  // ── Invalid: empty or mismatched arrays ────────

  it("rejects empty arrays", () => {
    expect(validateScores([], [], 3)).toBe(false);
  });

  it("rejects mismatched array lengths", () => {
    expect(validateScores([6, 6], [3], 3)).toBe(false);
  });

  // ── Invalid: no majority winner ────────────────

  it("rejects 1-1 in best-of-3 (incomplete)", () => {
    expect(validateScores([6, 3], [3, 6], 3)).toBe(false);
  });

  // ── Invalid: extra games after clinch ──────────

  it("rejects extra game after team1 already won best-of-3", () => {
    expect(validateScores([6, 6, 7], [3, 4, 5], 3)).toBe(false);
  });

  it("rejects extra game after team2 already won best-of-3", () => {
    expect(validateScores([3, 4, 5], [6, 6, 7], 3)).toBe(false);
  });

  // ── Invalid: exceeds bestOf ────────────────────

  it("rejects more games than bestOf allows", () => {
    expect(validateScores([6, 3, 6, 7], [3, 6, 4, 5], 3)).toBe(false);
  });
});
