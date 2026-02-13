import { describe, it, expect } from "vitest";
import { canChallenge } from "./pyramid";

describe("canChallenge", () => {
  it.each([
    // [challenger, challengee, expected, reason]
    [4, 1, false, "too far up"],
    [4, 3, true, "left in same row"],
    [4, 2, true, "right in row above"],
    [3, 1, true, "rank 3 special case"],
    [3, 2, true, "rank 3 special case"],
    [1, 2, false, "can't challenge down"],
    [7, 5, true, "right in row above"],
    [7, 4, false, "too far up"],
    [10, 7, true, "right in row above"],
    [10, 6, false, "too far up"],
  ] as const)(
    "rank %i → rank %i = %s (%s)",
    (challenger, challengee, expected) => {
      expect(canChallenge(challenger, challengee)).toBe(expected);
    },
  );

  it("rank 1 cannot challenge anyone", () => {
    expect(canChallenge(1, 2)).toBe(false);
    expect(canChallenge(1, 1)).toBe(false);
  });

  it("cannot challenge same rank", () => {
    expect(canChallenge(5, 5)).toBe(false);
  });
});
