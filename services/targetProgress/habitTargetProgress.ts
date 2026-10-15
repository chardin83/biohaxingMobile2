import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';
import type { LifeStyleLog } from '@/app/context/storage/lifeStyle/lifeStyleTypes';

import { getTargetDates } from './dateRange';
import type { HabitTargetDefinition } from './targetProgressTypes';

export const resolveHabitTarget = ({
  target,
  selectedDate,
  dailyHabitTracking,
  lifeStyleLog = {},
}: {
  target: HabitTargetDefinition;
  selectedDate: string;
  dailyHabitTracking: DailyHabitTracking;
  lifeStyleLog?: LifeStyleLog;
}): number => {
  const dates = getTargetDates(selectedDate, target.period);

  return dates.reduce((total, date) => {
    if (target.lifeStyleKeys) {
      const storedResult = dailyHabitTracking[date]?.[target.trackingKey];
      if (storedResult?.source === 'lifeStyle') return total + storedResult.value;
      return total + target.lifeStyleKeys.filter(key => typeof lifeStyleLog[date]?.[key]?.value === 'boolean').length;
    }
    if (target.trackingKey === 'sleep_schedule_consistency' && !dailyHabitTracking[date]?.[target.trackingKey]?.sleepSchedule) return total;
    const value = dailyHabitTracking[date]?.[target.trackingKey]?.value ?? 0;

    return total + value;
  }, 0);
};
