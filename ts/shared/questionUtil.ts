const MAX_TIME = 30;
const SCORE_PER_QUESTION = 100;

export function getQuestionPoints(start: Date, at: Date): number {
  const seconds = (at.getTime() - start.getTime()) / 1000;
  const secondsLeft = MAX_TIME - seconds;
  if (secondsLeft <= 0) return 0;
  const fractionLeft = secondsLeft / MAX_TIME;
  return Math.round(SCORE_PER_QUESTION * fractionLeft * fractionLeft);
}
