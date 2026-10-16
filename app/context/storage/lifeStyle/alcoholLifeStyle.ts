import type { ClockTime } from '@/types/ClockTime';

import type { DailyDrinkTracking, DrinkEntry } from '../drinks/drinkTypes';
import { syncDrinkLifeStyle } from './drinkLifeStyle';
import type { LifeStyleLog } from './lifeStyleTypes';

const ALCOHOL_TYPES = new Set<DrinkEntry['type']>(['red_wine', 'white_wine', 'beer', 'spirits', 'oak_aged_spirits']);

export function syncAlcoholLifeStyle(log: LifeStyleLog, drinks: DailyDrinkTracking, bedtime?: ClockTime): LifeStyleLog {
  return syncDrinkLifeStyle(log, drinks, {
    matches: entry => entry.alcoholPercent === undefined ? ALCOHOL_TYPES.has(entry.type) : entry.alcoholPercent > 0, tag: 'alcohol', bedtimeTag: 'alcoholBeforeSleep', thresholdHours: 4,
  }, bedtime);
}
