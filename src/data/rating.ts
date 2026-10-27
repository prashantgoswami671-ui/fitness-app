export const RATING_FACTORS = ['stimulus', 'stability', 'ease', 'joints', 'access'] as const;

export type RatingFactor = (typeof RATING_FACTORS)[number];

export type ExerciseRatings = Partial<Record<RatingFactor, number>>;

export type RatingTier = 'S' | 'A' | 'B';

export const RATING_WEIGHTS: Record<RatingFactor, number> = {
  stimulus: 0.4,
  stability: 0.15,
  ease: 0.15,
  joints: 0.15,
  access: 0.15,
};

export function overallScore(ratings: ExerciseRatings): number | null {
  if (!RATING_FACTORS.every((factor) => typeof ratings[factor] === 'number')) return null;
  const total = RATING_FACTORS.reduce(
    (sum, factor) => sum + RATING_WEIGHTS[factor] * (ratings[factor] as number),
    0,
  );
  return Math.round(total * 10000) / 10000;
}

export function starRating(overall: number): number {
  return Math.round(overall * 2) / 2;
}

export function tierFromOverall(overall: number): RatingTier {
  if (overall >= 4.3) return 'S';
  if (overall >= 3.6) return 'A';
  return 'B';
}

export function effectiveTier(exercise: { ratings: ExerciseRatings; tier: RatingTier }): RatingTier {
  const overall = overallScore(exercise.ratings);
  return overall === null ? exercise.tier : tierFromOverall(overall);
}

export function compareByOverall(
  a: { ratings: ExerciseRatings },
  b: { ratings: ExerciseRatings },
): number {
  return (overallScore(b.ratings) ?? -1) - (overallScore(a.ratings) ?? -1);
}
