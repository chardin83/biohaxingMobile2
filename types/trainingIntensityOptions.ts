import type { TrainingIntensity } from './training';

export const TRAINING_INTENSITY_LABEL_KEYS: Record<TrainingIntensity, string> = {
  low: 'training:trainingIntensityLow',
  moderate: 'training:trainingIntensityModerate',
  intense: 'training:trainingIntensityIntense',
  high: 'training:trainingIntensityHigh',
};

export const TRAINING_INTENSITY_OPTIONS = (['low', 'moderate', 'intense', 'high'] as const).map(key => ({ key, labelKey: TRAINING_INTENSITY_LABEL_KEYS[key] }));
