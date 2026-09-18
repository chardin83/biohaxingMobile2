import { ClockTime } from '@/types/ClockTime';

export interface UserProfile {
  maxHeartRate?: number;
  birthDate?: string;
  bedtime?: ClockTime;
}
