// measurements.ts

export type MetricSystem = 'EU' | 'US' | 'all';

export type MetricUnit =
  | 'mIU/L'
  | 'µIU/mL'
  | 'pmol/L'
  | 'nmol/L'
  | 'mmol/L'
  | 'mmol/mol'
  | '%'
  | 'g/L'
  | 'mg/dL'
  | 'ng/mL'
  | 'pg/mL'
  | 'ng/dL'
  | 'mmHg'
  | 'bpm'
  | 'ms'
  | 'kg'
  | 'lb'
  | 'cm'
  | 'in'
  | 'score_0_10'
  | 'count'
  | 'min'
  | 'min_from_midnight'
  | 'hours'
  | 'bss'
  | 'ml/kg/min'; // Bristol Stool Scale

export type MetricSource = 'lab' | 'home' | 'wearable' | 'questionnaire';

export type MetricDefinition = {
  id: string;
  emoji: string; // ✅ NYTT
  nameKey: string;
  descriptionKey?: string;

  canonicalUnit: MetricUnit;

  units: Array<{
    unit: MetricUnit;
    system: MetricSystem;
    toCanonical: { mul: number; add?: number };
    fromCanonical: { mul: number; add?: number };
    precision?: number;
  }>;

  source: MetricSource;
  suggestedFrequency?: 'daily' | 'weekly' | 'monthly' | 'perTest';
};
export const metrics = {
  // ---------------- LIPIDS ----------------

  ldl: {
    id: 'ldl',
    emoji: '🫀',
    nameKey: 'ldl.name',
    descriptionKey: 'ldl.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0259 }, fromCanonical: { mul: 38.67 }, precision: 0 }
    ]
  },

  apob: {
    id: 'apob',
    emoji: '🧬',
    nameKey: 'apob.name',
    descriptionKey: 'apob.description',
    canonicalUnit: 'g/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'g/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.01 }, fromCanonical: { mul: 100 }, precision: 0 }
    ]
  },

  triglycerides: {
    id: 'triglycerides',
    emoji: '🩸',
    nameKey: 'triglycerides.name',
    descriptionKey: 'triglycerides.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0113 }, fromCanonical: { mul: 88.57 }, precision: 0 }
    ]
  },

  hdl: {
    id: 'hdl',
    emoji: '💙',
    nameKey: 'hdl.name',
    descriptionKey: 'hdl.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0259 }, fromCanonical: { mul: 38.67 }, precision: 0 }
    ]
  },

  // ---------------- BLOOD PRESSURE ----------------

  systolic_bp: {
    id: 'systolic_bp',
    emoji: '📈',
    nameKey: 'systolic_bp.name',
    descriptionKey: 'systolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'mmHg', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  diastolic_bp: {
    id: 'diastolic_bp',
    emoji: '📉',
    nameKey: 'diastolic_bp.name',
    descriptionKey: 'diastolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'mmHg', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  // ---------------- GLUCOSE ----------------

  fasting_glucose: {
    id: 'fasting_glucose',
    emoji: '🍬',
    nameKey: 'fasting_glucose.name',
    descriptionKey: 'fasting_glucose.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0555 }, fromCanonical: { mul: 18.02 }, precision: 0 }
    ]
  },

  hba1c: {
    id: 'hba1c',
    emoji: '📊',
    nameKey: 'hba1c.name',
    descriptionKey: 'hba1c.description',
    canonicalUnit: 'mmol/mol',
    source: 'lab',
    suggestedFrequency: 'perTest',
    units: [
      { unit: 'mmol/mol', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: '%', system: 'US', toCanonical: { mul: 10.93, add: -23.5 }, fromCanonical: { mul: 0.0915, add: 2.15 }, precision: 1 }
    ]
  },

  fasting_insulin: {
    id: 'fasting_insulin',
    emoji: '🧪',
    nameKey: 'fasting_insulin.name',
    descriptionKey: 'fasting_insulin.description',
    canonicalUnit: 'mIU/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mIU/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'µIU/mL', system: 'US', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 }
    ]
  },

  // ---------------- VITAMINS ----------------

  vitd_25oh: {
    id: 'vitd_25oh',
    emoji: '☀️',
    nameKey: 'vitd_25oh.name',
    descriptionKey: 'vitd_25oh.description',
    canonicalUnit: 'nmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'nmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: 'ng/mL', system: 'US', toCanonical: { mul: 2.5 }, fromCanonical: { mul: 0.4 }, precision: 1 }
    ]
  },

  calcium: {
    id: 'calcium',
    emoji: '🦴',
    nameKey: 'calcium.name',
    descriptionKey: 'calcium.description',
    canonicalUnit: 'mmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.2495 }, fromCanonical: { mul: 4.01 }, precision: 1 }
    ]
  },

  pth: {
    id: 'pth',
    emoji: '🧠',
    nameKey: 'pth.name',
    descriptionKey: 'pth.description',
    canonicalUnit: 'pmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'pmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'pg/mL', system: 'US', toCanonical: { mul: 0.106 }, fromCanonical: { mul: 9.43 }, precision: 0 }
    ]
  },

  // ---------------- THYROID ----------------

  tsh: {
    id: 'tsh',
    emoji: '🦋',
    nameKey: 'tsh.name',
    descriptionKey: 'tsh.description',
    canonicalUnit: 'mIU/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mIU/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'µIU/mL', system: 'US', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 }
    ]
  },

  free_t4: {
    id: 'free_t4',
    emoji: '⚡',
    nameKey: 'free_t4.name',
    descriptionKey: 'free_t4.description',
    canonicalUnit: 'pmol/L',
    source: 'lab',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'pmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'ng/dL', system: 'US', toCanonical: { mul: 12.87 }, fromCanonical: { mul: 0.078 }, precision: 1 }
    ]
  },

  // ---------------- RECOVERY ----------------

  resting_hr: {
    id: 'resting_hr',
    emoji: '❤️',
    nameKey: 'resting_hr.name',
    descriptionKey: 'resting_hr.description',
    canonicalUnit: 'bpm',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'bpm', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  hrv: {
    id: 'hrv',
    emoji: '📈',
    nameKey: 'hrv.name',
    descriptionKey: 'hrv.description',
    canonicalUnit: 'ms',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'ms', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  // ---------------- SLEEP ----------------

  sleep_duration: {
    id: 'sleep_duration',
    emoji: '😴',
    nameKey: 'sleep_duration.name',
    descriptionKey: 'sleep_duration.description',
    canonicalUnit: 'min',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  sleep_bedtime: {
    id: 'sleep_bedtime',
    emoji: '🛏️',
    nameKey: 'sleep_bedtime.name',
    descriptionKey: 'sleep_bedtime.description',
    canonicalUnit: 'min_from_midnight',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min_from_midnight', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  deep_sleep: {
    id: 'deep_sleep',
    emoji: '💤',
    nameKey: 'deep_sleep.name',
    descriptionKey: 'deep_sleep.description',
    canonicalUnit: 'min',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  rem_sleep: {
    id: 'rem_sleep',
    emoji: '💭',
    nameKey: 'rem_sleep.name',
    descriptionKey: 'rem_sleep.description',
    canonicalUnit: 'min',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  sleep_wake: {
    id: 'sleep_wake',
    emoji: '⏰',
    nameKey: 'sleep_wake.name',
    descriptionKey: 'sleep_wake.description',
    canonicalUnit: 'min_from_midnight',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min_from_midnight', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },


  sleep_quality: {
    id: 'sleep_quality',
    emoji: '🌙',
    nameKey: 'sleep_quality.name',
    descriptionKey: 'sleep_quality.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  sleep_latency: {
    id: 'sleep_latency',
    emoji: '⏳',
    nameKey: 'sleep_latency.name',
    descriptionKey: 'sleep_latency.description',
    canonicalUnit: 'min',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  // ---------------- BODY ----------------

  weight: {
    id: 'weight',
    emoji: '⚖️',
    nameKey: 'weight.name',
    descriptionKey: 'weight.description',
    canonicalUnit: 'kg',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'kg', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'lb', system: 'US', toCanonical: { mul: 0.4536 }, fromCanonical: { mul: 2.2046 }, precision: 1 }
    ]
  },

  waist: {
    id: 'waist',
    emoji: '📏',
    nameKey: 'waist.name',
    descriptionKey: 'waist.description',
    canonicalUnit: 'cm',
    source: 'home',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'cm', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: 'in', system: 'US', toCanonical: { mul: 2.54 }, fromCanonical: { mul: 0.3937 }, precision: 0 }
    ]
  },

  // ---------------- GUT ----------------

  bss: {
    id: 'bss',
    emoji: '💩',
    nameKey: 'bss.name',
    descriptionKey: 'bss.description',
    canonicalUnit: 'bss',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'bss', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  bloating: {
    id: 'bloating',
    emoji: '🎈',
    nameKey: 'bloating.name',
    descriptionKey: 'bloating.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },
  active_minutes: {
    id: 'active_minutes',
    emoji: '🏃‍♂️',
    nameKey: 'activeMinutes.name',
    descriptionKey: 'activeMinutes.description',
    canonicalUnit: 'min',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },
  steps: {
    id: 'steps',
    emoji: '👣',
    nameKey: 'steps.name',
    descriptionKey: 'steps.description',
    canonicalUnit: 'count',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'count', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },
  intensity_minutes: {
    id: 'intensity_minutes',
    emoji: '🔥',
    nameKey: 'intensityMinutes.name',
    descriptionKey: 'intensityMinutes.description',
    canonicalUnit: 'min',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  // ---------------- SUBJECTIVE ----------------

  energy: {
    id: 'energy',
    emoji: '⚡',
    nameKey: 'energy.name',
    descriptionKey: 'energy.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  body_battery: {
    id: 'body_battery',
    emoji: '🔋',
    nameKey: 'body_battery.name',
    descriptionKey: 'body_battery.description',
    canonicalUnit: '%',
    source: 'wearable',
    suggestedFrequency: 'daily',
    units: [
      { unit: '%', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  stress: {
    id: 'stress',
    emoji: '😰',
    nameKey: 'stress.name',
    descriptionKey: 'stress.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },

  focus: {
    id: 'focus',
    emoji: '🎯',
    nameKey: 'focus.name',
    descriptionKey: 'focus.description',
    canonicalUnit: 'score_0_10',
    source: 'questionnaire',
    suggestedFrequency: 'daily',
    units: [
      { unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }
    ]
  },
    vo2_max: {
    id: 'vo2_max',
    emoji: '🫁',
    nameKey: 'vo2_max.name',
    descriptionKey: 'vo2_max.description',
    canonicalUnit: 'ml/kg/min',
    source: 'wearable',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'ml/kg/min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 }
    ]
  },
} satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof metrics;


export type TipMetricLink = {
  metricId: MetricId;
  kind: 'primary' | 'secondary' | 'subjective' | 'safety';
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
    sleep_optimization_recovery: [
        { metricId: 'sleep_quality', kind: 'primary' },
        { metricId: 'hrv', kind: 'secondary' },
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
    eat_pomegranate: [
      { metricId: 'bloating', kind: 'secondary' },
      { metricId: 'energy', kind: 'subjective' },
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

    // --- Training Tips ---
    neuromuscular_training: [
        { metricId: 'hrv', kind: 'secondary' },
        { metricId: 'resting_hr', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],
    lactate_threshold_training: [
        { metricId: 'vo2_max', kind: 'primary' },
        { metricId: 'systolic_bp', kind: 'secondary' },
        { metricId: 'diastolic_bp', kind: 'secondary' },
        { metricId: 'focus', kind: 'subjective' },
    ],
    fasted_aerobic_training: [
        { metricId: 'fasting_glucose', kind: 'secondary' },
        { metricId: 'vo2_max', kind: 'primary' },
        { metricId: 'resting_hr', kind: 'secondary' },
        { metricId: 'hrv', kind: 'secondary' },
        { metricId: 'weight', kind: 'secondary' },
        { metricId: 'energy', kind: 'subjective' },
    ],
};