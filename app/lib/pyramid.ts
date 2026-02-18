/**
 * Returns the 1-based row number for a given rank.
 * Row 1: [1], Row 2: [2,3], Row 3: [4,5,6], Row 4: [7,8,9,10], ...
 */
function pyramidRow(rank: number): number {
  return Math.ceil((Math.sqrt(8 * rank + 1) - 1) / 2);
}

/**
 * Determines whether a player at `challengerRank` can challenge
 * a player at `challengeeRank` based on pyramid geometry.
 *
 * Each player can challenge:
 * - Left neighbors in same row (up to position count)
 * - Up to 2 diagonally adjacent positions in the row above
 * - Special case: rank 3 can challenge ranks 1 and 2
 */
export function canChallenge(
  challengerRank: number,
  challengeeRank: number,
): boolean {
  if (challengeeRank >= challengerRank) return false;
  if (challengerRank <= 1) return false;

  // Special case: rank 3 can challenge both 1 and 2
  if (challengerRank === 3) return challengeeRank >= 1;

  const row = pyramidRow(challengerRank);
  const firstOfRow = (row * (row - 1)) / 2 + 1;
  const position = challengerRank - firstOfRow; // 0-indexed
  const rowAboveRemaining = row - 1 - position;
  const numTargets = position + Math.min(2, rowAboveRemaining);
  const maxRank = challengerRank - numTargets;

  return challengeeRank >= maxRank;
}

export class PyramidValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PyramidValidationError";
  }
}

/**
 * Validates that a challenge between two teams is legal per pyramid rules,
 * given the current standings. Throws PyramidValidationError if illegal.
 *
 * @param standings - Ordered array of team IDs (index 0 = rank 1)
 * @param challengerTeamId - Team initiating the challenge (lower-ranked)
 * @param challengeeTeamId - Team being challenged (higher-ranked)
 */
export function assertLegalChallenge(
  standings: number[],
  challengerTeamId: number,
  challengeeTeamId: number,
): void {
  const challengerIdx = standings.indexOf(challengerTeamId);
  const challengeeIdx = standings.indexOf(challengeeTeamId);

  if (challengerIdx === -1) {
    throw new PyramidValidationError(
      `Challenger team ${challengerTeamId} not found in standings`,
    );
  }
  if (challengeeIdx === -1) {
    throw new PyramidValidationError(
      `Challengee team ${challengeeTeamId} not found in standings`,
    );
  }

  const challengerRank = challengerIdx + 1;
  const challengeeRank = challengeeIdx + 1;

  if (!canChallenge(challengerRank, challengeeRank)) {
    throw new PyramidValidationError(
      `Illegal challenge: rank ${challengerRank} cannot challenge rank ${challengeeRank}`,
    );
  }
}

export function computeMovement(
  teamId: number,
  currentResults: number[],
  previousResults: number[] | null,
): "up" | "down" | "none" {
  if (!previousResults) return "none";

  const currentIdx = currentResults.indexOf(teamId);
  if (currentIdx === -1) return "none";

  const previousIdx = previousResults.indexOf(teamId);

  // New player (wasn't in previous standings)
  if (previousIdx === -1) return "none";

  // Lower index = better rank → moved up if previousIdx > currentIdx
  if (previousIdx > currentIdx) return "up";
  if (previousIdx < currentIdx) return "down";
  return "none";
}
