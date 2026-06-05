import { type IconSymbolName } from '@/components/ui/icon-symbol-map';
import { type TrainingActivityType } from '@/types/training';

export type TrainingActivityOption = {
  key: TrainingActivityType;
  labelKey: string;
  icon: IconSymbolName;
};

export const DEFAULT_TRAINING_ACTIVITY: TrainingActivityType = 'running';

export const TRAINING_ACTIVITY_OPTIONS: TrainingActivityOption[] = [
  { key: 'running', labelKey: 'training:trainingTypeRunning', icon: 'trainingRunning' },
  { key: 'gym', labelKey: 'training:trainingTypeGym', icon: 'trainingGym' },
  { key: 'cycling', labelKey: 'training:trainingTypeCycling', icon: 'trainingCycling' },
  { key: 'walking', labelKey: 'training:trainingTypeWalking', icon: 'trainingWalking' },
];

export const TRAINING_ACTIVITY_LABEL_KEYS: Record<TrainingActivityType, string> = {
  running: 'training:trainingTypeRunning',
  gym: 'training:trainingTypeGym',
  cycling: 'training:trainingTypeCycling',
  walking: 'training:trainingTypeWalking',
};