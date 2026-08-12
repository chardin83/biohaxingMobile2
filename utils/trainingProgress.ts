import { type TrainingLogEntry } from '@/app/context/StorageContext';
import { type TrainingActivityFilter, type TrainingIntensity, type TrainingIntensityFilter } from '@/types/training';

const TRAINING_INTENSITY_RANK: Record<TrainingIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

type TrainingProgressTarget = {
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
  activityType?: TrainingActivityFilter;
  minimumIntensity?: TrainingIntensityFilter;
};

export type TrainingWeeklyProgress = {
  actual: number;
  target: number;
  progress: number;
  isFulfilled: boolean;
};

export const calculateTrainingWeeklyProgress = ({
  entries,
  target,
}: {
  entries: TrainingLogEntry[];
  target: TrainingProgressTarget;
}): TrainingWeeklyProgress => {
  const hasDurationThreshold = typeof target.sessionDurationMinutes === 'number' && Number.isFinite(target.sessionDurationMinutes);
  const hasActivityFilter = Boolean(target.activityType && target.activityType !== 'any');
  const hasIntensityFilter = Boolean(target.minimumIntensity && target.minimumIntensity !== 'any');

  const matchingEntries = entries.filter(entry => {
    const meetsDuration = !hasDurationThreshold || entry.durationMinutes >= (target.sessionDurationMinutes as number);

    const matchesActivity = !hasActivityFilter || entry.activityType === target.activityType;

    const matchesIntensity =
      !hasIntensityFilter ||
      TRAINING_INTENSITY_RANK[entry.intensity] >= TRAINING_INTENSITY_RANK[target.minimumIntensity as TrainingIntensity];

    return meetsDuration && matchesActivity && matchesIntensity;
  });

  const hasExplicitSessionTarget =
    typeof target.sessionsPerWeek === 'number' && Number.isFinite(target.sessionsPerWeek) && target.sessionsPerWeek > 0;

  if (!hasExplicitSessionTarget) {
    return {
      actual: matchingEntries.length,
      target: 0,
      progress: 0,
      isFulfilled: false,
    };
  }

  const targetSessions = target.sessionsPerWeek as number;
  const actual = matchingEntries.length;
  const progress = Math.min(actual / targetSessions, 1);

  return {
    actual,
    target: targetSessions,
    progress,
    isFulfilled: actual >= targetSessions,
  };
};
