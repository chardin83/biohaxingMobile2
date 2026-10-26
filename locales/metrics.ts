import type { IconSymbolName } from '@/components/ui/icon-symbol-map';

// measurements.ts

export type MetricSystem = 'EU' | 'US' | 'all';

export type MetricUnit =
  | 'kcal'
  | 'index'
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
  | 'score_0_100'
  | 'score_0_10'
  | 'count'
  | 'min'
  | 'min_from_midnight'
  | 'hours'
  | 'bss' // Bristol Stool Scale
  | 'ml/kg/min';

// Data provider for this metric, not the origin of an individual measurement.
export type MetricSource = 'metrics' | 'nutrition' | 'training';

export const METRIC_GROUPS = ['cardio', 'bloodSugar', 'nutrients', 'hormones', 'recovery', 'sleep', 'body', 'digestion', 'activity', 'energy', 'mind'] as const;
export type MetricGroup = (typeof METRIC_GROUPS)[number];

export type MetricDefinition = {
  id: string;
  group: MetricGroup;
  iconName: IconSymbolName;
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
  calories: {
    id: 'calories', group: 'energy', iconName: 'flame', emoji: '🔥',
    nameKey: 'calories.name', descriptionKey: 'calories.description',
    canonicalUnit: 'kcal', source: 'nutrition', suggestedFrequency: 'daily',
    units: [{ unit: 'kcal', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 }],
  },
  glycemic_index: {
    id: 'glycemic_index', group: 'bloodSugar', iconName: 'chart', emoji: '🍽️',
    nameKey: 'glycemic_index.name', descriptionKey: 'glycemic_index.description',
    canonicalUnit: 'index', source: 'nutrition', suggestedFrequency: 'daily',
    units: [{ unit: 'index', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 }],
  },
  // ---------------- LIPIDS ----------------

  ldl: {
    id: 'ldl',
    group: 'cardio',
    iconName: 'heart',
    emoji: '🫀',
    nameKey: 'ldl.name',
    descriptionKey: 'ldl.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0259 }, fromCanonical: { mul: 38.67 }, precision: 0 },
    ],
  },

  apob: {
    id: 'apob',
    group: 'cardio',
    iconName: 'heart',
    emoji: '🧬',
    nameKey: 'apob.name',
    descriptionKey: 'apob.description',
    canonicalUnit: 'g/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'g/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.01 }, fromCanonical: { mul: 100 }, precision: 0 },
    ],
  },

  triglycerides: {
    id: 'triglycerides',
    group: 'cardio',
    iconName: 'heart',
    emoji: '🩸',
    nameKey: 'triglycerides.name',
    descriptionKey: 'triglycerides.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0113 }, fromCanonical: { mul: 88.57 }, precision: 0 },
    ],
  },

  hdl: {
    id: 'hdl',
    group: 'cardio',
    iconName: 'heart',
    emoji: '💙',
    nameKey: 'hdl.name',
    descriptionKey: 'hdl.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0259 }, fromCanonical: { mul: 38.67 }, precision: 0 },
    ],
  },

  blood_lactate: {
    id: 'blood_lactate',
    group: 'activity',
    iconName: 'bloodDrop',
    emoji: '🩸',
    nameKey: 'blood_lactate.name',
    descriptionKey: 'blood_lactate.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'perTest',
    units: [
      {
        unit: 'mmol/L',
        system: 'all',
        toCanonical: { mul: 1 },
        fromCanonical: { mul: 1 },
        precision: 1,
      },
    ],
  },

  // ---------------- BLOOD PRESSURE ----------------

  systolic_bp: {
    id: 'systolic_bp',
    group: 'cardio',
    iconName: 'bloodPressure',
    emoji: '📈',
    nameKey: 'systolic_bp.name',
    descriptionKey: 'systolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'metrics',
    suggestedFrequency: 'weekly',
    units: [{ unit: 'mmHg', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  diastolic_bp: {
    id: 'diastolic_bp',
    group: 'cardio',
    iconName: 'bloodPressure',
    emoji: '📉',
    nameKey: 'diastolic_bp.name',
    descriptionKey: 'diastolic_bp.description',
    canonicalUnit: 'mmHg',
    source: 'metrics',
    suggestedFrequency: 'weekly',
    units: [{ unit: 'mmHg', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  // ---------------- GLUCOSE ----------------

  fasting_glucose: {
    id: 'fasting_glucose',
    group: 'bloodSugar',
    iconName: 'bloodDrop',
    emoji: '🍬',
    nameKey: 'fasting_glucose.name',
    descriptionKey: 'fasting_glucose.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.0555 }, fromCanonical: { mul: 18.02 }, precision: 0 },
    ],
  },

  hba1c: {
    id: 'hba1c',
    group: 'bloodSugar',
    iconName: 'bloodDrop',
    emoji: '📊',
    nameKey: 'hba1c.name',
    descriptionKey: 'hba1c.description',
    canonicalUnit: 'mmol/mol',
    source: 'metrics',
    suggestedFrequency: 'perTest',
    units: [
      { unit: 'mmol/mol', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: '%', system: 'US', toCanonical: { mul: 10.93, add: -23.5 }, fromCanonical: { mul: 0.0915, add: 2.15 }, precision: 1 },
    ],
  },

  fasting_insulin: {
    id: 'fasting_insulin',
    group: 'bloodSugar',
    iconName: 'bloodDrop',
    emoji: '🧪',
    nameKey: 'fasting_insulin.name',
    descriptionKey: 'fasting_insulin.description',
    canonicalUnit: 'mIU/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mIU/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'µIU/mL', system: 'US', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
    ],
  },

  // ---------------- VITAMINS ----------------

  vitd_25oh: {
    id: 'vitd_25oh',
    group: 'nutrients',
    iconName: 'vitamin',
    emoji: '☀️',
    nameKey: 'vitd_25oh.name',
    descriptionKey: 'vitd_25oh.description',
    canonicalUnit: 'nmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'nmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: 'ng/mL', system: 'US', toCanonical: { mul: 2.5 }, fromCanonical: { mul: 0.4 }, precision: 1 },
    ],
  },

  calcium: {
    id: 'calcium',
    group: 'nutrients',
    iconName: 'mineral',
    emoji: '🦴',
    nameKey: 'calcium.name',
    descriptionKey: 'calcium.description',
    canonicalUnit: 'mmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'mg/dL', system: 'US', toCanonical: { mul: 0.2495 }, fromCanonical: { mul: 4.01 }, precision: 1 },
    ],
  },

  pth: {
    id: 'pth',
    group: 'hormones',
    iconName: 'hormones',
    emoji: '🧠',
    nameKey: 'pth.name',
    descriptionKey: 'pth.description',
    canonicalUnit: 'pmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'pmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'pg/mL', system: 'US', toCanonical: { mul: 0.106 }, fromCanonical: { mul: 9.43 }, precision: 0 },
    ],
  },

  // ---------------- THYROID ----------------

  tsh: {
    id: 'tsh',
    group: 'hormones',
    iconName: 'hormones',
    emoji: '🦋',
    nameKey: 'tsh.name',
    descriptionKey: 'tsh.description',
    canonicalUnit: 'mIU/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'mIU/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
      { unit: 'µIU/mL', system: 'US', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 2 },
    ],
  },

  free_t4: {
    id: 'free_t4',
    group: 'hormones',
    iconName: 'hormones',
    emoji: '⚡',
    nameKey: 'free_t4.name',
    descriptionKey: 'free_t4.description',
    canonicalUnit: 'pmol/L',
    source: 'metrics',
    suggestedFrequency: 'monthly',
    units: [
      { unit: 'pmol/L', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'ng/dL', system: 'US', toCanonical: { mul: 12.87 }, fromCanonical: { mul: 0.078 }, precision: 1 },
    ],
  },

  // ---------------- RECOVERY ----------------

  recovery_status: {
    id: 'recovery_status',
    group: 'recovery',
    iconName: 'lotus',
    emoji: '💚',
    nameKey: 'recovery_status.name',
    descriptionKey: 'recovery_status.description',
    canonicalUnit: 'score_0_100',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_100', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  resting_hr: {
    id: 'resting_hr',
    group: 'cardio',
    iconName: 'heartPulse',
    emoji: '❤️',
    nameKey: 'resting_hr.name',
    descriptionKey: 'resting_hr.description',
    canonicalUnit: 'bpm',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'bpm', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  hrv_rmssd: {
    id: 'hrv_rmssd',
    group: 'recovery',
    iconName: 'heartPulse',
    emoji: '📈',
    nameKey: 'hrv_rmssd.name',
    descriptionKey: 'hrv_rmssd.description',
    canonicalUnit: 'ms',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'ms', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  hrv_sdnn: {
    id: 'hrv_sdnn',
    group: 'recovery',
    iconName: 'heartPulse',
    emoji: '📈',
    nameKey: 'hrv_sdnn.name',
    descriptionKey: 'hrv_sdnn.description',
    canonicalUnit: 'ms',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'ms', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  intense_exercise_before_sleep: {
    id: 'intense_exercise_before_sleep',
    group: 'sleep',
    iconName: 'moon',
    emoji: '🏋️‍♂️',
    nameKey: 'intense_exercise_before_sleep.name',
    descriptionKey: 'intense_exercise_before_sleep.description',
    canonicalUnit: 'min',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  // ---------------- SLEEP ----------------

  sleep_duration: {
    id: 'sleep_duration',
    group: 'sleep',
    iconName: 'moon',
    emoji: '😴',
    nameKey: 'sleep_duration.name',
    descriptionKey: 'sleep_duration.description',
    canonicalUnit: 'min',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  sleep_bedtime: {
    id: 'sleep_bedtime',
    group: 'sleep',
    iconName: 'clock',
    emoji: '🛏️',
    nameKey: 'sleep_bedtime.name',
    descriptionKey: 'sleep_bedtime.description',
    canonicalUnit: 'min_from_midnight',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min_from_midnight', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  deep_sleep: {
    id: 'deep_sleep',
    group: 'sleep',
    iconName: 'moon',
    emoji: '💤',
    nameKey: 'deep_sleep.name',
    descriptionKey: 'deep_sleep.description',
    canonicalUnit: 'min',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  rem_sleep: {
    id: 'rem_sleep',
    group: 'sleep',
    iconName: 'moon',
    emoji: '💭',
    nameKey: 'rem_sleep.name',
    descriptionKey: 'rem_sleep.description',
    canonicalUnit: 'min',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  sleep_wake: {
    id: 'sleep_wake',
    group: 'sleep',
    iconName: 'sunny',
    emoji: '⏰',
    nameKey: 'sleep_wake.name',
    descriptionKey: 'sleep_wake.description',
    canonicalUnit: 'min_from_midnight',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min_from_midnight', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  sleep_quality: {
    id: 'sleep_quality',
    group: 'sleep',
    iconName: 'moon',
    emoji: '🌙',
    nameKey: 'sleep_quality.name',
    descriptionKey: 'sleep_quality.description',
    canonicalUnit: 'score_0_10',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  sleep_latency: {
    id: 'sleep_latency',
    group: 'sleep',
    iconName: 'moon',
    emoji: '⏳',
    nameKey: 'sleep_latency.name',
    descriptionKey: 'sleep_latency.description',
    canonicalUnit: 'min',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  // ---------------- BODY ----------------

  weight: {
    id: 'weight',
    group: 'body',
    iconName: 'weight',
    emoji: '⚖️',
    nameKey: 'weight.name',
    descriptionKey: 'weight.description',
    canonicalUnit: 'kg',
    source: 'metrics',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'kg', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 },
      { unit: 'lb', system: 'US', toCanonical: { mul: 0.4536 }, fromCanonical: { mul: 2.2046 }, precision: 1 },
    ],
  },

  waist: {
    id: 'waist',
    group: 'body',
    iconName: 'height',
    emoji: '📏',
    nameKey: 'waist.name',
    descriptionKey: 'waist.description',
    canonicalUnit: 'cm',
    source: 'metrics',
    suggestedFrequency: 'weekly',
    units: [
      { unit: 'cm', system: 'EU', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 0 },
      { unit: 'in', system: 'US', toCanonical: { mul: 2.54 }, fromCanonical: { mul: 0.3937 }, precision: 0 },
    ],
  },

  // ---------------- GUT ----------------

  bss: {
    id: 'bss',
    group: 'digestion',
    iconName: 'digestion',
    emoji: '💩',
    nameKey: 'bss.name',
    descriptionKey: 'bss.description',
    canonicalUnit: 'bss',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'bss', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  bloating: {
    id: 'bloating',
    group: 'digestion',
    iconName: 'digestion',
    emoji: '🎈',
    nameKey: 'bloating.name',
    descriptionKey: 'bloating.description',
    canonicalUnit: 'score_0_10',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  active_minutes: {
    id: 'active_minutes',
    group: 'activity',
    iconName: 'trainingRunning',
    emoji: '🏃‍♂️',
    nameKey: 'activeMinutes.name',
    descriptionKey: 'activeMinutes.description',
    canonicalUnit: 'min',
    source: 'training',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  steps: {
    id: 'steps',
    group: 'activity',
    iconName: 'trainingWalking',
    emoji: '👣',
    nameKey: 'steps.name',
    descriptionKey: 'steps.description',
    canonicalUnit: 'count',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'count', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  intensity_minutes: {
    id: 'intensity_minutes',
    group: 'activity',
    iconName: 'trainingRunning',
    emoji: '🔥',
    nameKey: 'intensityMinutes.name',
    descriptionKey: 'intensityMinutes.description',
    canonicalUnit: 'min',
    source: 'training',
    suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  moderate_minutes: {
    id: 'moderate_minutes', group: 'activity', iconName: 'trainingWalking', emoji: '🚶',
    nameKey: 'moderateMinutes.name', descriptionKey: 'moderateMinutes.description',
    canonicalUnit: 'min', source: 'training', suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  high_intensity_minutes: {
    id: 'high_intensity_minutes', group: 'activity', iconName: 'trainingRunning', emoji: '🔥',
    nameKey: 'highIntensityMinutes.name', descriptionKey: 'highIntensityMinutes.description',
    canonicalUnit: 'min', source: 'training', suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  weighted_training_minutes: {
    id: 'weighted_training_minutes', group: 'activity', iconName: 'trainingRunning', emoji: '⚖️',
    nameKey: 'weightedTrainingMinutes.name', descriptionKey: 'weightedTrainingMinutes.description',
    canonicalUnit: 'min', source: 'training', suggestedFrequency: 'daily',
    units: [{ unit: 'min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  // ---------------- SUBJECTIVE ----------------

  energy: {
    id: 'energy',
    group: 'energy',
    iconName: 'mitochondrialHealth',
    emoji: '⚡',
    nameKey: 'energy.name',
    descriptionKey: 'energy.description',
    canonicalUnit: 'score_0_10',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  stress: {
    id: 'stress',
    group: 'mind',
    iconName: 'brain',
    emoji: '😰',
    nameKey: 'stress.name',
    descriptionKey: 'stress.description',
    canonicalUnit: 'score_0_10',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },

  focus: {
    id: 'focus',
    group: 'mind',
    iconName: 'brain',
    emoji: '🎯',
    nameKey: 'focus.name',
    descriptionKey: 'focus.description',
    canonicalUnit: 'score_0_10',
    source: 'metrics',
    suggestedFrequency: 'daily',
    units: [{ unit: 'score_0_10', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 } }],
  },
  vo2_max: {
    id: 'vo2_max',
    group: 'cardio',
    iconName: 'heart',
    emoji: '🫁',
    nameKey: 'vo2_max.name',
    descriptionKey: 'vo2_max.description',
    canonicalUnit: 'ml/kg/min',
    source: 'metrics',
    suggestedFrequency: 'weekly',
    units: [{ unit: 'ml/kg/min', system: 'all', toCanonical: { mul: 1 }, fromCanonical: { mul: 1 }, precision: 1 }],
  },
} satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof metrics;

export type TipMetricLink = {
  metricId: MetricId;
  kind: 'primary' | 'secondary' | 'subjective' | 'safety';
};

export const tipMetricLinks: Record<string, TipMetricLink[]> = {
  glycemic_index: [{ metricId: 'glycemic_index', kind: 'primary' }],
  // --- Intermittent fasting ---
  'intermittent_fasting_12h': [
    { metricId: 'fasting_glucose', kind: 'primary' },
    { metricId: 'hba1c', kind: 'primary' },
    { metricId: 'fasting_insulin', kind: 'secondary' },
    { metricId: 'weight', kind: 'secondary' },
    { metricId: 'waist', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
  'intermittent_fasting_16_8': [
    { metricId: 'fasting_glucose', kind: 'primary' },
    { metricId: 'hba1c', kind: 'primary' },
    { metricId: 'fasting_insulin', kind: 'secondary' },
    { metricId: 'weight', kind: 'secondary' },
    { metricId: 'waist', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Vitamin D ---
  'vitamin_d': [
    { metricId: 'vitd_25oh', kind: 'primary' },
    { metricId: 'calcium', kind: 'safety' },
    { metricId: 'pth', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Magnesium ---
  'magnesium': [
    { metricId: 'sleep_quality', kind: 'primary' },
    { metricId: 'sleep_latency', kind: 'secondary' },
    { metricId: 'hrv_rmssd', kind: 'secondary' },
    { metricId: 'hrv_sdnn', kind: 'secondary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'stress', kind: 'subjective' },
  ],

  // --- Zinc ---
  'zinc_comprehensive_support': [{ metricId: 'energy', kind: 'subjective' }],

  // --- Selenium / Iodine (thyroid proxies) ---
  'selenium_thyroid_antioxidant': [
    { metricId: 'tsh', kind: 'primary' },
    { metricId: 'free_t4', kind: 'primary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
  'iodine_thyroid_balance': [
    { metricId: 'tsh', kind: 'primary' },
    { metricId: 'free_t4', kind: 'primary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Breathwork / sleep / circadian ---
  'box_breathing': [
    { metricId: 'hrv_rmssd', kind: 'primary' },
    { metricId: 'hrv_sdnn', kind: 'primary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'stress', kind: 'subjective' },
  ],
  '4_7_8_breathing': [
    { metricId: 'sleep_quality', kind: 'primary' },
    { metricId: 'sleep_latency', kind: 'secondary' },
    { metricId: 'stress', kind: 'subjective' },
  ],
  'sleep_duration_consistency': [
    { metricId: 'sleep_duration', kind: 'primary' },
    { metricId: 'sleep_quality', kind: 'primary' },
    { metricId: 'hrv_rmssd', kind: 'secondary' },
    { metricId: 'hrv_sdnn', kind: 'secondary' },
  ],
  'sunlight_circadian': [
    { metricId: 'sleep_latency', kind: 'primary' },
    { metricId: 'sleep_quality', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Hydration ---
  'maintain_hydration': [
    { metricId: 'systolic_bp', kind: 'secondary' },
    { metricId: 'diastolic_bp', kind: 'secondary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Gut tips ---
  'eat_pomegranate': [
    { metricId: 'bloating', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
  'eat_colorful_veggies': [
    { metricId: 'bloating', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- HRV monitoring ---
  'hrv_recovery_monitoring': [
    { metricId: 'hrv_rmssd', kind: 'primary' },
    { metricId: 'hrv_sdnn', kind: 'primary' },
    { metricId: 'resting_hr', kind: 'primary' },
    { metricId: 'sleep_quality', kind: 'secondary' },
  ],

  // --- Caffeine / nitrate (BP + performance proxies) ---
  'coffee_polyphenols_longevity': [
    { metricId: 'fasting_glucose', kind: 'secondary' },
    { metricId: 'hba1c', kind: 'secondary' },
    { metricId: 'systolic_bp', kind: 'safety' },
    { metricId: 'diastolic_bp', kind: 'safety' },
    { metricId: 'sleep_quality', kind: 'safety' },
    { metricId: 'sleep_latency', kind: 'safety' },
  ],
  'nitrate_no_efficiency': [
    { metricId: 'systolic_bp', kind: 'primary' },
    { metricId: 'diastolic_bp', kind: 'primary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],

  // --- Training Tips ---
  'neuromuscular_training': [
    { metricId: 'hrv_rmssd', kind: 'secondary' },
    { metricId: 'hrv_sdnn', kind: 'secondary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
  'vigorous_exercise_lactate': [
    { metricId: 'blood_lactate', kind: 'primary' },
    { metricId: 'vo2_max', kind: 'primary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'systolic_bp', kind: 'secondary' },
    { metricId: 'diastolic_bp', kind: 'secondary' },
    { metricId: 'hrv_rmssd', kind: 'safety' },
    { metricId: 'hrv_sdnn', kind: 'safety' },
  ],
  'fasted_aerobic_training': [
    { metricId: 'fasting_glucose', kind: 'secondary' },
    { metricId: 'vo2_max', kind: 'primary' },
    { metricId: 'resting_hr', kind: 'secondary' },
    { metricId: 'hrv_rmssd', kind: 'secondary' },
    { metricId: 'hrv_sdnn', kind: 'secondary' },
    { metricId: 'weight', kind: 'secondary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
  'fish_omega3_weekly': [
    { metricId: 'triglycerides', kind: 'primary' },
    { metricId: 'hdl', kind: 'secondary' },
    { metricId: 'ldl', kind: 'safety' },
    { metricId: 'systolic_bp', kind: 'secondary' },
    { metricId: 'diastolic_bp', kind: 'secondary' },
  ],
  'polyphenol_microbiome': [
    { metricId: 'bss', kind: 'primary' },
    { metricId: 'bloating', kind: 'primary' },
    { metricId: 'energy', kind: 'subjective' },
  ],
};
