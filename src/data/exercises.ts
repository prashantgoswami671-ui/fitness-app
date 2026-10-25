export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'rearDelts'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';

export type Exercise = {
  id: string;
  name: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  ratings: Record<string, never>;
  tier: 'S' | 'A' | 'B';
};

export const EXERCISES: Exercise[] = [
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell', ratings: {}, tier: 'S' },
  { id: 'flat_bb_bench', name: 'Flat Barbell Bench Press', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell', ratings: {}, tier: 'S' },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise', primaryMuscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'overhead_triceps_ext', name: 'Overhead Triceps Extension', primaryMuscleGroup: 'triceps', secondaryMuscles: ['shoulders'], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'pushups', name: 'Push-ups', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'machine', ratings: {}, tier: 'S' },
  { id: 'chest_supported_row', name: 'Chest-Supported Row', primaryMuscleGroup: 'back', secondaryMuscles: ['rearDelts', 'biceps'], equipment: 'machine', ratings: {}, tier: 'S' },
  { id: 'incline_db_curl', name: 'Incline Dumbbell Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'face_pull', name: 'Face Pull', primaryMuscleGroup: 'rearDelts', secondaryMuscles: ['back'], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'barbell_curl', name: 'Barbell Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'barbell', ratings: {}, tier: 'B' },
  { id: 'squat', name: 'Squat', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'barbell', ratings: {}, tier: 'S' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', primaryMuscleGroup: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', ratings: {}, tier: 'S' },
  { id: 'leg_press', name: 'Leg Press', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'seated_leg_curl', name: 'Seated Leg Curl', primaryMuscleGroup: 'hamstrings', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'seated_cable_row', name: 'Seated Cable Row', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps', 'rearDelts'], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'leg_curl', name: 'Leg Curl', primaryMuscleGroup: 'hamstrings', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'calf_raise', name: 'Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
];
