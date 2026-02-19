// measurements.ts

export type MetricSystem = 'EU' | 'US';


export type MetricUnit =
    | 'mIU/L'
    | 'µIU/mL'
    | 'pmol/L'
    | 'nmol/L'
    | 'mmol/L'
    | 'g/L'
    | 'mg/dL'
    | 'ng/mL'
    | 'mmHg'
    | 'bpm'
    | 'ms'
    | 'kg'
    | 'cm'
    | 'score_0_10'
    | 'count'
    | 'min'
    | 'hours'
    | 'bss'; // Bristol Stool Scale

export type MetricSource = 'lab' | 'home' | 'wearable' | 'questionnaire';

export type MetricDefinition = {
  id: string;
  emoji: string;
  nameKey: string;
  descriptionKey?: string;

  // 1) Intern standard (det du sparar i DB)
  canonicalUnit: string;

  // 2) Vilka units du accepterar i input och kan visa i UI
  units: Array<{
    unit: string;
    system: MetricSystem;
    // konvertering TO canonical
    toCanonical: { mul: number; add?: number };
    // konvertering FROM canonical
    fromCanonical: { mul: number; add?: number };
    precision?: number; // hur många decimaler vid visning
  }>;

  source: 'lab' | 'home' | 'wearable' | 'questionnaire';
  suggestedFrequency?: 'daily' | 'weekly' | 'monthly' | 'perTest';
};

export type TipMetricLink = {
    metricId: string;
    kind: 'primary' | 'secondary' | 'subjective' | 'safety';
};

export const metrics: Record<string, MetricDefinition> = {

  // 🫀 Lipids / cardio
  ldl: {
    id: 'ldl',
    emoji: '🫀',
    nameKey: 'ldl.name',
    descriptionKey: 'ldl.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [/* unchanged */],
  },

  apob: {
    id: 'apob',
    emoji: '🧬',
    nameKey: 'apob.name',
    descriptionKey: 'apob.description',
    canonicalUnit: 'g/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [/* unchanged */],
  },

  triglycerides: {
    id: 'triglycerides',
    emoji: '🩸',
    nameKey: 'triglycerides.name',
    descriptionKey: 'triglycerides.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  hdl: {
    id: 'hdl',
    emoji: '💙',
    nameKey: 'hdl.name',
    descriptionKey: 'hdl.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  // 💓 Blood pressure
  systolic_bp: {
    id: 'systolic_bp',
    emoji: '📈',
    nameKey: 'systolic_bp.name',
    descriptionKey: 'systolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [],
  },

  diastolic_bp: {
    id: 'diastolic_bp',
    emoji: '📉',
    nameKey: 'diastolic_bp.name',
    descriptionKey: 'diastolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [],
  },

  // 🍬 Glucose / metabolism
  fasting_glucose: {
    id: 'fasting_glucose',
    emoji: '🍬',
    nameKey: 'fasting_glucose.name',
    descriptionKey: 'fasting_glucose.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  hba1c: {
    id: 'hba1c',
    emoji: '📊',
    nameKey: 'hba1c.name',
    descriptionKey: 'hba1c.description',
    canonicalUnit: 'mmol/mol',
    source: 'lab',
    suggestedFrequency: 'perTest',
    units: [],
  },

  fasting_insulin: {
    id: 'fasting_insulin',
    emoji: '🧪',
    nameKey: 'fasting_insulin.name',
    descriptionKey: 'fasting_insulin.description',
    canonicalUnit: 'mIU/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  // ☀️ Vitamins / minerals
  vitd_25oh: {
    id: 'vitd_25oh',
    emoji: '☀️',
    nameKey: 'vitd_25oh.name',
    descriptionKey: 'vitd_25oh.description',
    canonicalUnit: 'nmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  calcium: {
    id: 'calcium',
    emoji: '🦴',
    nameKey: 'calcium.name',
    descriptionKey: 'calcium.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  pth: {
    id: 'pth',
    emoji: '🧠',
    nameKey: 'pth.name',
    descriptionKey: 'pth.description',
    canonicalUnit: 'pmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  // 🦋 Thyroid
  tsh: {
    id: 'tsh',
    emoji: '🦋',
    nameKey: 'tsh.name',
    descriptionKey: 'tsh.description',
    canonicalUnit: 'mIU/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  free_t4: {
    id: 'free_t4',
    emoji: '⚡',
    nameKey: 'free_t4.name',
    descriptionKey: 'free_t4.description',
    canonicalUnit: 'pmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [],
  },

  // ❤️‍🔥 Recovery
  resting_hr: {
    id: 'resting_hr',
    emoji: '❤️',
    nameKey: 'resting_hr.name',
    descriptionKey: 'resting_hr.description',
    canonicalUnit: 'bpm',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [],
  },

  hrv: {
    id: 'hrv',
    emoji: '📈',
    nameKey: 'hrv.name',
    descriptionKey: 'hrv.description',
    canonicalUnit: 'ms',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [],
  },

  // 😴 Sleep
  sleep_duration: {
    id: 'sleep_duration',
    emoji: '😴',
    nameKey: 'sleep_duration.name',
    descriptionKey: 'sleep_duration.description',
    canonicalUnit: 'hours',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [],
  },

  sleep_quality: {
    id: 'sleep_quality',
    emoji: '🌙',
    nameKey: 'sleep_quality.name',
    descriptionKey: 'sleep_quality.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  sleep_latency: {
    id: 'sleep_latency',
    emoji: '⏳',
    nameKey: 'sleep_latency.name',
    descriptionKey: 'sleep_latency.description',
    canonicalUnit: 'min',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  // ⚖️ Body
  weight: {
    id: 'weight',
    emoji: '⚖️',
    nameKey: 'weight.name',
    descriptionKey: 'weight.description',
    canonicalUnit: 'kg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [],
  },

  waist: {
    id: 'waist',
    emoji: '📏',
    nameKey: 'waist.name',
    descriptionKey: 'waist.description',
    canonicalUnit: 'cm',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [],
  },

  // 💩 Gut
  bss: {
    id: 'bss',
    emoji: '💩',
    nameKey: 'bss.name',
    descriptionKey: 'bss.description',
    canonicalUnit: 'bss',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  bloating: {
    id: 'bloating',
    emoji: '🎈',
    nameKey: 'bloating.name',
    descriptionKey: 'bloating.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  // 🧘 Subjective
  energy: {
    id: 'energy',
    emoji: '⚡',
    nameKey: 'energy.name',
    descriptionKey: 'energy.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  stress: {
    id: 'stress',
    emoji: '😰',
    nameKey: 'stress.name',
    descriptionKey: 'stress.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },

  focus: {
    id: 'focus',
    emoji: '🎯',
    nameKey: 'focus.name',
    descriptionKey: 'focus.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [],
  },
};


export const tipMetricLinks: Record<string, TipMetricLink[]> = {
    // --- Intermittent fasting ---
    intermittent_fasting_12h: [
        { metricId: 'fasting_glucose', kind: 'primary' },
        { metricId: 'hba1c', kind: 'primary' },
        { metricId: 'fasting_insulin', kind: 'secondary' },
        { metricId: 'weight', kind: 'secondary' },
        { metricId: 'waist', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],
    intermittent_fasting_16_8: [
        { metricId: 'fasting_glucose', kind: 'primary' },
        { metricId: 'hba1c', kind: 'primary' },
        { metricId: 'fasting_insulin', kind: 'secondary' },
        { metricId: 'weight', kind: 'secondary' },
        { metricId: 'waist', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Multivitamin ---
    multivitamin_general: [
        { metricId: 'energy', kind: 'subjective' },
        // lägg ev labb du vill spåra här (B12, folat, ferritin) när/om du skapar metric-defs för dem
    ],

    // --- Vitamin D ---
    vitamin_d: [
        { metricId: 'vitd_25oh', kind: 'primary' },
        { metricId: 'calcium', kind: 'safety' },
        { metricId: 'pth', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Magnesium ---
    magnesium: [
        { metricId: 'sleep_quality', kind: 'primary' },
        { metricId: 'sleep_latency', kind: 'secondary' },
        { metricId: 'hrv', kind: 'secondary' },
        { metricId: 'resting_hr', kind: 'secondary' },
        { metricId: 'stress', kind: 'subjective' },
    ],

    // --- Zinc ---
    zinc_comprehensive_support: [
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Selenium / Iodine (thyroid proxies) ---
    selenium_thyroid_antioxidant: [
        { metricId: 'tsh', kind: 'primary' },
        { metricId: 'free_t4', kind: 'primary' },
        { metricId: 'energy', kind: 'subjective' },
    ],
    iodine_thyroid_balance: [
        { metricId: 'tsh', kind: 'primary' },
        { metricId: 'free_t4', kind: 'primary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Breathwork / sleep / circadian ---
    box_breathing: [
        { metricId: 'hrv', kind: 'primary' },
        { metricId: 'resting_hr', kind: 'secondary' },
        { metricId: 'stress', kind: 'subjective' },
    ],
    '4_7_8_breathing': [
        { metricId: 'sleep_quality', kind: 'primary' },
        { metricId: 'sleep_latency', kind: 'secondary' },
        { metricId: 'stress', kind: 'subjective' },
    ],
    sleep_duration_consistency: [
        { metricId: 'sleep_duration', kind: 'primary' },
        { metricId: 'sleep_quality', kind: 'primary' },
        { metricId: 'hrv', kind: 'secondary' },
    ],
    sunlight_circadian: [
        { metricId: 'sleep_latency', kind: 'primary' },
        { metricId: 'sleep_quality', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Hydration ---
    maintain_hydration: [
        { metricId: 'systolic_bp', kind: 'secondary' },
        { metricId: 'diastolic_bp', kind: 'secondary' },
        { metricId: 'resting_hr', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- Gut tips ---
    probiotics_microbiota: [
        { metricId: 'bss', kind: 'primary' },
        { metricId: 'bloating', kind: 'secondary' },
    ],
    fiber_microbiome: [
        { metricId: 'bss', kind: 'primary' },
        { metricId: 'bloating', kind: 'secondary' },
    ],
    eat_colorful_veggies: [
        { metricId: 'bloating', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],

    // --- HRV monitoring ---
    hrv_recovery_monitoring: [
        { metricId: 'hrv', kind: 'primary' },
        { metricId: 'resting_hr', kind: 'primary' },
        { metricId: 'sleep_quality', kind: 'secondary' },
    ],

    // --- Caffeine / nitrate (BP + performance proxies) ---
    caffeine: [
        { metricId: 'sleep_quality', kind: 'safety' },
        { metricId: 'systolic_bp', kind: 'secondary' },
        { metricId: 'diastolic_bp', kind: 'secondary' },
        { metricId: 'focus', kind: 'subjective' },
    ],
    nitrate_no_efficiency: [
        { metricId: 'systolic_bp', kind: 'secondary' },
        { metricId: 'diastolic_bp', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],
};
