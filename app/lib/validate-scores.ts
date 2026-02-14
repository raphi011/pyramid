export function validateScores(
  team1Score: number[],
  team2Score: number[],
  bestOf: number,
): boolean {
  if (team1Score.length !== team2Score.length) return false;
  if (team1Score.length === 0) return false;

  // Each game must have a clear winner (no ties)
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] === team2Score[i]) return false;
    if (team1Score[i] < 0 || team2Score[i] < 0) return false;
  }

  // Count games won by each team
  let team1Wins = 0;
  let team2Wins = 0;
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] > team2Score[i]) team1Wins++;
    else team2Wins++;
  }

  // One team must have won the majority
  const majority = Math.ceil(bestOf / 2);
  if (team1Wins !== majority && team2Wins !== majority) return false;

  // The match should have ended when one team reached majority
  // (no extra games played after someone already won)
  const totalGames = team1Score.length;
  if (totalGames > bestOf) return false;

  // Verify the winning game is the last one
  let runningT1 = 0;
  let runningT2 = 0;
  for (let i = 0; i < totalGames; i++) {
    if (team1Score[i] > team2Score[i]) runningT1++;
    else runningT2++;

    // If someone reached majority before the last game, invalid
    if (
      i < totalGames - 1 &&
      (runningT1 >= majority || runningT2 >= majority)
    ) {
      return false;
    }
  }

  return true;
}
