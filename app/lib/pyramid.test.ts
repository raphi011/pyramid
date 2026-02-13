import { describe, it, expect } from "vitest";
import { canChallenge, computeMovement } from "./pyramid";

describe("canChallenge", () => {
  it.each([
    // [challenger, challengee, expected, reason]
    [2, 1, true, "rank 2 can challenge rank 1"],
    [4, 1, false, "too far up"],
    [4, 3, true, "left in same row"],
    [4, 2, true, "right in row above"],
    [3, 1, true, "rank 3 special case"],
    [3, 2, true, "rank 3 special case"],
    [1, 2, false, "can't challenge down"],
    [7, 5, true, "right in row above"],
    [7, 4, false, "too far up"],
    [8, 5, true, "mid-row can reach row above"],
    [8, 4, false, "mid-row can't reach too far up"],
    [9, 6, true, "mid-row position 2 reaches row above"],
    [9, 5, false, "mid-row position 2 limit"],
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

describe("computeMovement", () => {
  it("detects upward movement", () => {
    expect(computeMovement(10, [10, 20], [20, 10])).toBe("up");
  });

  it("detects downward movement", () => {
    expect(computeMovement(20, [10, 20], [20, 10])).toBe("down");
  });

  it("detects no movement", () => {
    expect(computeMovement(10, [10, 20], [10, 20])).toBe("none");
  });

  it("returns none when no previous standings", () => {
    expect(computeMovement(10, [10, 20], null)).toBe("none");
  });

  it("returns none for new player", () => {
    expect(computeMovement(30, [10, 20, 30], [10, 20])).toBe("none");
  });

  it("returns none when team not in current standings", () => {
    expect(computeMovement(99, [10, 20], [99, 10, 20])).toBe("none");
  });
});
