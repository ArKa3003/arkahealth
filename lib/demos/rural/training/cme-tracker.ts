export function sumCredits(completedCreditHours: number[]): number {
  return completedCreditHours.reduce((a, b) => a + b, 0);
}

export function progressTowardGoal(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}
