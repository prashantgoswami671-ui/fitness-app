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
  | 'calves'
  | 'abs';

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
  { id: 'flat_db_press', name: 'Flat Dumbbell Press', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'incline_bb_press', name: 'Incline Barbell Bench Press', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'cable_fly', name: 'Cable Fly', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders'], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'pec_deck', name: 'Pec Deck', primaryMuscleGroup: 'chest', secondaryMuscles: ['shoulders'], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'dips', name: 'Dips', primaryMuscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'bodyweight', ratings: {}, tier: 'A' },
  { id: 'pullups', name: 'Pull-ups', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight', ratings: {}, tier: 'A' },
  { id: 'barbell_row', name: 'Barbell Row', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps', 'rearDelts'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'one_arm_db_row', name: 'One-Arm Dumbbell Row', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps'], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'straight_arm_pulldown', name: 'Straight-Arm Pulldown', primaryMuscleGroup: 'back', secondaryMuscles: ['triceps'], equipment: 'cable', ratings: {}, tier: 'B' },
  { id: 't_bar_row', name: 'T-Bar Row', primaryMuscleGroup: 'back', secondaryMuscles: ['biceps', 'rearDelts'], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'overhead_press', name: 'Overhead Press', primaryMuscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell', ratings: {}, tier: 'S' },
  { id: 'seated_db_press', name: 'Seated Dumbbell Shoulder Press', primaryMuscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raise', primaryMuscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'machine_lateral_raise', name: 'Machine Lateral Raise', primaryMuscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'front_raise', name: 'Front Raise', primaryMuscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'arnold_press', name: 'Arnold Press', primaryMuscleGroup: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'upright_row', name: 'Upright Row', primaryMuscleGroup: 'shoulders', secondaryMuscles: ['rearDelts', 'biceps'], equipment: 'barbell', ratings: {}, tier: 'B' },
  { id: 'hammer_curl', name: 'Hammer Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'preacher_curl', name: 'Preacher Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'cable_curl', name: 'Cable Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'B' },
  { id: 'concentration_curl', name: 'Concentration Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'ez_bar_curl', name: 'EZ-Bar Curl', primaryMuscleGroup: 'biceps', secondaryMuscles: [], equipment: 'barbell', ratings: {}, tier: 'B' },
  { id: 'triceps_pushdown', name: 'Triceps Pushdown', primaryMuscleGroup: 'triceps', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'skull_crusher', name: 'Skull Crusher', primaryMuscleGroup: 'triceps', secondaryMuscles: [], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'close_grip_bench', name: 'Close-Grip Bench Press', primaryMuscleGroup: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'bench_dips', name: 'Bench Dips', primaryMuscleGroup: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'db_kickback', name: 'Dumbbell Kickback', primaryMuscleGroup: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'machine_triceps_dip', name: 'Machine Triceps Dip', primaryMuscleGroup: 'triceps', secondaryMuscles: ['chest'], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'cable_overhead_triceps_ext', name: 'Cable Overhead Triceps Extension', primaryMuscleGroup: 'triceps', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'front_squat', name: 'Front Squat', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'hack_squat', name: 'Hack Squat', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'leg_extension', name: 'Leg Extension', primaryMuscleGroup: 'quads', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', ratings: {}, tier: 'A' },
  { id: 'walking_lunge', name: 'Walking Lunge', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'goblet_squat', name: 'Goblet Squat', primaryMuscleGroup: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'stiff_leg_deadlift', name: 'Stiff-Leg Deadlift', primaryMuscleGroup: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl', primaryMuscleGroup: 'hamstrings', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'good_morning', name: 'Good Morning', primaryMuscleGroup: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', ratings: {}, tier: 'B' },
  { id: 'nordic_curl', name: 'Nordic Curl', primaryMuscleGroup: 'hamstrings', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'cable_pull_through', name: 'Cable Pull-Through', primaryMuscleGroup: 'hamstrings', secondaryMuscles: ['glutes'], equipment: 'cable', ratings: {}, tier: 'B' },
  { id: 'hip_thrust', name: 'Barbell Hip Thrust', primaryMuscleGroup: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell', ratings: {}, tier: 'S' },
  { id: 'glute_bridge', name: 'Glute Bridge', primaryMuscleGroup: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'cable_kickback', name: 'Cable Glute Kickback', primaryMuscleGroup: 'glutes', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'B' },
  { id: 'hip_abduction', name: 'Hip Abduction Machine', primaryMuscleGroup: 'glutes', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'sumo_deadlift', name: 'Sumo Deadlift', primaryMuscleGroup: 'glutes', secondaryMuscles: ['hamstrings', 'quads', 'back'], equipment: 'barbell', ratings: {}, tier: 'A' },
  { id: 'db_step_up', name: 'Dumbbell Step-Up', primaryMuscleGroup: 'glutes', secondaryMuscles: ['quads', 'hamstrings'], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'glute_ham_raise', name: 'Glute-Ham Raise', primaryMuscleGroup: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'bodyweight', ratings: {}, tier: 'A' },
  { id: 'reverse_hyperextension', name: 'Reverse Hyperextension', primaryMuscleGroup: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'seated_calf_raise', name: 'Seated Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'A' },
  { id: 'leg_press_calf_raise', name: 'Leg Press Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'smith_calf_raise', name: 'Smith Machine Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'db_calf_raise', name: 'Dumbbell Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'single_leg_calf_raise', name: 'Single-Leg Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', primaryMuscleGroup: 'calves', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'A' },
  { id: 'cable_crunch', name: 'Cable Crunch', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'cable', ratings: {}, tier: 'A' },
  { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'A' },
  { id: 'plank', name: 'Plank', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'decline_situp', name: 'Decline Sit-Up', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
  { id: 'machine_crunch', name: 'Machine Crunch', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'machine', ratings: {}, tier: 'B' },
  { id: 'russian_twist', name: 'Russian Twist', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'dumbbell', ratings: {}, tier: 'B' },
  { id: 'dead_bug', name: 'Dead Bug', primaryMuscleGroup: 'abs', secondaryMuscles: [], equipment: 'bodyweight', ratings: {}, tier: 'B' },
];
