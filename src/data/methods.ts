export type TrainingMethod = { id: string; nameKey: string; descriptionKey: string };

export const TRAINING_METHODS: TrainingMethod[] = [
  { id: 'dup', nameKey: 'methods.dup', descriptionKey: 'methodDescriptions.dup' },
  { id: 'conjugate', nameKey: 'methods.conjugate', descriptionKey: 'methodDescriptions.conjugate' },
  { id: 'clusterSets', nameKey: 'methods.clusterSets', descriptionKey: 'methodDescriptions.clusterSets' },
  { id: 'myoReps', nameKey: 'methods.myoReps', descriptionKey: 'methodDescriptions.myoReps' },
  { id: 'restPause', nameKey: 'methods.restPause', descriptionKey: 'methodDescriptions.restPause' },
  { id: 'fst7', nameKey: 'methods.fst7', descriptionKey: 'methodDescriptions.fst7' },
  { id: 'hit', nameKey: 'methods.hit', descriptionKey: 'methodDescriptions.hit' },
  { id: 'gvt', nameKey: 'methods.gvt', descriptionKey: 'methodDescriptions.gvt' },
];
