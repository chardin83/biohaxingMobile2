import type { ClockTime } from '@/types/ClockTime';
import { hasCaffeine } from '@/utils/drinkCaffeine';

import type { DailyDrinkTracking } from '../drinks/drinkTypes';
import { syncDrinkLifeStyle } from './drinkLifeStyle';
import type { LifeStyleLog } from './lifeStyleTypes';

export function syncCaffeineLifeStyle(log: LifeStyleLog, drinks: DailyDrinkTracking, bedtime?: ClockTime): LifeStyleLog {
  return syncDrinkLifeStyle(log, drinks, {
    matches: hasCaffeine, tag: 'caffeine', bedtimeTag: 'caffeineBeforeSleep', thresholdHours: 8,
  }, bedtime);
}
