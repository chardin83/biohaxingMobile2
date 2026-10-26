import type { TrainingActivityType } from '@/types/training';

/** Names returned by react-native-health's workout query. */
export function healthKitWorkoutType(name?: string): TrainingActivityType {
  switch (name?.replace(/[^a-z]/gi, '').toLowerCase()) {
    case 'running': return 'running';
    case 'cycling': return 'cycling';
    case 'walking': return 'walking';
    case 'traditionalstrengthtraining':
    case 'functionalstrengthtraining': return 'gym';
    default: return 'other';
  }
}

/** ExerciseType values in react-native-health-connect/src/constants.ts. */
export function healthConnectWorkoutType(type: number): TrainingActivityType {
  switch (type) {
    case 56: case 57: return 'running';
    case 8: case 9: return 'cycling';
    case 79: return 'walking';
    case 70: case 81: return 'gym';
    default: return 'other';
  }
}
