import { MetricId } from '@/locales/metrics';

import {
  getTargetDateRange,
  getWeekStartKey,
  isDateWithinRange,
} from './dateRange';
import {
  getHabitValue,
  WeeklyTracking,
} from './habitTrackingService';
import {
  TargetDefinition,
  TargetProgressStorage,
} from './targetProgressTypes';

type ResolverParams = {
  target: TargetDefinition;
  selectedDate: string;
  storage: TargetProgressStorage;
};

export type TargetResolver = (
  params: ResolverParams
) => number;

type HabitResolverParams = {
  target: TargetDefinition;
  selectedDate: string;
  storage: {
    weeklyTracking: WeeklyTracking;
  };
};

const addDays = (
  dateKey: string,
  days: number
): string => {
  const date = new Date(
    `${dateKey}T12:00:00`
  );

  date.setDate(
    date.getDate() + days
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

export const resolveHabitTarget = ({
  target,
  selectedDate,
  storage,
}: HabitResolverParams): number => {
  if (
    target.period === 'daily'
  ) {
    return getHabitValue({
      trackingKey:
        target.trackingKey,
      selectedDate,
      weeklyTracking:
        storage.weeklyTracking,
    });
  }

  const weekStart =
    getWeekStartKey(
      selectedDate
    );

  return Array.from(
    { length: 7 },
    (_, index) =>
      addDays(
        weekStart,
        index
      )
  ).reduce(
    (
      total,
      dateKey
    ) =>
      total +
      getHabitValue({
        trackingKey:
          target.trackingKey,
        selectedDate:
          dateKey,
        weeklyTracking:
          storage.weeklyTracking,
      }),
    0
  );
};

const toLocalDateKey = (value: string): string => {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const convertUnit = (
  value: number,
  sourceUnit: string,
  targetUnit: string
): number => {
  if (sourceUnit === targetUnit) {
    return value;
  }

  if (
    sourceUnit === 'minutes' &&
    targetUnit === 'hours'
  ) {
    return value / 60;
  }

  if (
    sourceUnit === 'hours' &&
    targetUnit === 'minutes'
  ) {
    return value * 60;
  }

  return value;
};

const resolveMetric = (
  metricId: MetricId
): TargetResolver =>
  ({
    target,
    selectedDate,
    storage,
  }) => {
    const range = getTargetDateRange(
      selectedDate,
      target.period
    );

    const entries = storage.metricEntries.filter(
      entry =>
        entry.metricId === metricId &&
        isDateWithinRange(
          toLocalDateKey(entry.recordedAt),
          range
        )
    );

    if (entries.length === 0) {
      return 0;
    }

    /*
     * För sleep_duration vill du normalt summera
     * en dags sömn per datum, inte alla mätpunkter.
     */
    const latestByDate = new Map<
      string,
      typeof entries[number]
    >();

    entries.forEach(entry => {
      const dateKey = toLocalDateKey(
        entry.recordedAt
      );

      const current =
        latestByDate.get(dateKey);

      if (
        !current ||
        entry.recordedAt >
        current.recordedAt
      ) {
        latestByDate.set(
          dateKey,
          entry
        );
      }
    });

    return Array
      .from(latestByDate.values())
      .reduce(
        (sum, entry) =>
          sum +
          convertUnit(
            entry.value,
            entry.unit,
            target.unit
          ),
        0
      );
  };

const resolveTrainingMinutes = (
  activityType?: string
): TargetResolver =>
  ({
    selectedDate,
    target,
    storage,
  }) => {
    const range = getTargetDateRange(
      selectedDate,
      target.period
    );

    return Object.entries(
      storage.trainingEntries
    )
      .filter(([date]) =>
        isDateWithinRange(
          date,
          range
        )
      )
      .flatMap(([, entries]) =>
        entries
      )
      .filter(entry =>
        activityType
          ? entry.activityType === activityType
          : true
      )
      .reduce(
        (sum, entry) =>
          sum +
          entry.durationMinutes,
        0
      );
  };

const resolveRunningDistance: TargetResolver = ({
  selectedDate,
  target,
  storage,
}) => {
  const range = getTargetDateRange(
    selectedDate,
    target.period
  );

  return Object.entries(
    storage.trainingEntries
  )
    .filter(([date]) =>
      isDateWithinRange(
        date,
        range
      )
    )
    .flatMap(([, entries]) =>
      entries
    )
    .filter(
      entry =>
        entry.activityType ===
        'running'
    )
    .reduce(
      (sum, entry) =>
        sum +
        (entry.distanceKm ?? 0),
      0
    );
};

const resolveFiberTotal: TargetResolver = ({
  selectedDate,
  target,
  storage,
}) => {
  const range = getTargetDateRange(
    selectedDate,
    target.period
  );

  return Object.entries(
    storage.dailyNutritionSummaries
  )
    .filter(([date]) =>
      isDateWithinRange(
        date,
        range
      )
    )
    .reduce(
      (sum, [, summary]) =>
        sum +
        (summary.totals?.fiber ?? 0),
      0
    );
};

const resolvePolyphenolsTotal: TargetResolver = ({
  selectedDate,
  target,
  storage,
}) => {
  const range = getTargetDateRange(
    selectedDate,
    target.period
  );

  return Object.entries(
    storage.dailyNutritionSummaries
  )
    .filter(([date]) =>
      isDateWithinRange(
        date,
        range
      )
    )
    .flatMap(
      ([, summary]) =>
        summary.meals ?? []
    )
    .reduce(
      (sum, meal) =>
        sum +
        (
          meal.polyphenolByType
            ?.polyphenols_total ??
          0
        ),
      0
    );
};

export const TARGET_RESOLVERS: Record<
  string,
  TargetResolver
> = {
  sleep_duration:
    resolveMetric(
      'sleep_duration'
    ),

  tooth_brushing:
    resolveHabitTarget,

  social_connection:
    resolveHabitTarget,

  fiber_total:
    resolveFiberTotal,

  polyphenols_total:
    resolvePolyphenolsTotal,

  running_minutes:
    resolveTrainingMinutes(
      'running'
    ),

  running_distance:
    resolveRunningDistance,
};