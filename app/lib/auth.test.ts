import { describe, it, expect } from "vitest";
import { generateInviteCode } from "./auth";

describe("generateInviteCode", () => {
  it("returns a 6-character uppercase alphanumeric string", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code).toHaveLength(6);
  });

  it("produces distinct codes on repeated calls", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateInviteCode()),
    );
    expect(codes.size).toBeGreaterThan(90);
  });
});
