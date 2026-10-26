import type { MuscleGroup } from './exercises';

export const CUSTOM_SPLITS_STORAGE_KEY = 'fitness-custom-splits';

export type CustomSplitDay = {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  exerciseIds: string[];
};

export type CustomSplit = {
  id: string;
  name: string;
  days: CustomSplitDay[];
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'rearDelts', 'triceps', 'biceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs',
];

export function createStableId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
