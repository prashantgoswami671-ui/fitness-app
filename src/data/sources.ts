export type EvidenceSourceId =
  | 'larsen2025'
  | 'schanke2012'
  | 'sbs_incline_flat'
  | 'albarello2022'
  | 'chaves2020'
  | 'vigotsky2022'
  | 'lat_review'
  | 'signorile2002'
  | 'lat_pulldown_types2009';

export type EvidenceSource = {
  id: EvidenceSourceId;
  title: string;
  year: number;
  url: string;
};

export const SOURCES: Record<EvidenceSourceId, EvidenceSource> = {
  larsen2025: {
    id: 'larsen2025',
    title: 'Dumbbell versus cable lateral raises for lateral deltoid hypertrophy: an experimental study',
    year: 2025,
    url: 'https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1611468',
  },
  schanke2012: {
    id: 'schanke2012',
    title: 'Electromyographical analysis of the pectoralis major muscle during various chest exercises',
    year: 2012,
    url: 'https://minds.wisconsin.edu/handle/1793/62857',
  },
  sbs_incline_flat: {
    id: 'sbs_incline_flat',
    title: 'Is Regional Hypertrophy Predictable?',
    year: 2023,
    url: 'https://www.strongerbyscience.com/?p=57858',
  },
  albarello2022: {
    id: 'albarello2022',
    title:
      'Non-uniform excitation of pectoralis major induced by changes in bench press inclination leads to uneven variations in the cross-sectional area measured by panoramic ultrasonography',
    year: 2022,
    url: 'https://pubmed.ncbi.nlm.nih.gov/36334406/',
  },
  chaves2020: {
    id: 'chaves2020',
    title: 'Effects of Horizontal and Incline Bench Press on Neuromuscular Adaptations in Untrained Young Men',
    year: 2020,
    url: 'https://pubmed.ncbi.nlm.nih.gov/32922646/',
  },
  vigotsky2022: {
    id: 'vigotsky2022',
    title:
      'Longing for a Longitudinal Proxy: Acutely Measured Surface EMG Amplitude is not a Validated Predictor of Muscle Hypertrophy',
    year: 2022,
    url: 'https://pubmed.ncbi.nlm.nih.gov/35006527/',
  },
  lat_review: {
    id: 'lat_review',
    title:
      'Electromyographic Analysis of Latissimus Dorsi Activation During Common Resistance Training Exercises: A Narrative Review',
    year: 2026,
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC13510307/',
  },
  signorile2002: {
    id: 'signorile2002',
    title:
      'A comparative electromyographical investigation of muscle utilization patterns using various hand positions during the lat pull-down',
    year: 2002,
    url: 'https://pubmed.ncbi.nlm.nih.gov/12423182/',
  },
  lat_pulldown_types2009: {
    id: 'lat_pulldown_types2009',
    title: 'Electromyographic analysis of three different types of lat pull-down',
    year: 2009,
    url: 'https://pubmed.ncbi.nlm.nih.gov/19855327/',
  },
};
