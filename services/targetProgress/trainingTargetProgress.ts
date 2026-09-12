import type {
  DailyTrainingTracking,
} from '@/app/context/storage/training/trainingTypes';

import {
  getTargetDates,
} from './dateRange';
import type {
  TrainingTargetDefinition,
} from './targetProgressTypes';

export const resolveTrainingTarget = ({
  target,
  selectedDate,
  dailyTrainingTracking,
}: {
  target:
    TrainingTargetDefinition;
  selectedDate: string;
  dailyTrainingTracking:
    DailyTrainingTracking;
}): number => {
  const dates =
    getTargetDates(
      selectedDate,
      target.period
    );

  const entries =
    dates.flatMap(
      date =>
        dailyTrainingTracking[
          date
        ] ?? []
    );

  const matchingEntries =
    entries.filter(entry =>
      target.activityTypes.includes(
        entry.activityType
      )
    );

  switch (target.unit) {
    case 'sessions':
      return matchingEntries.length;

    case 'minutes':
      return matchingEntries.reduce(
        (total, entry) =>
          total +
          entry.durationMinutes,
        0
      );

    case 'km':
      return matchingEntries.reduce(
        (total, entry) =>
          total +
          (entry.distanceKm ?? 0),
        0
      );

    default:
      return 0;
  }
};