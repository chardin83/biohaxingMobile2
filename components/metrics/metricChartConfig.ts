import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { type MetricId } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';

import type { MetricTrendPoint } from './MetricTrendChart';

type ThemeColors = ReturnType<typeof useTheme>['colors'];

export type MetricChartConfig = {
  metricName: string;
  unit?: string;
  data: MetricTrendPoint[];
  accentColor: string;
  daysToShow?: number;
  xAxisLabelFormatter?: (date: string) => string;
  valueFormatter?: (value: number) => string;
  referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
  }>;
};

type MetricMeta = {
  metricNameKey?: string;
  unit?: string;
  accentColor: (colors: ThemeColors) => string;
  daysToShow?: number;
  xAxisLabelFormatter?: (date: string) => string;
  valueFormatter?: (value: number) => string;
  buildData?: (
    getMetricHistory: ReturnType<typeof useStorage>['getMetricHistory'],
    metricId: MetricId,
  ) => MetricTrendPoint[];
  referenceLines?: Array<{
    value: number;
    label?: string;
    color: (colors: ThemeColors) => string;
  }>;
};

const cardioTrendMetrics = [
  'vo2_max',
  'resting_hr',
  'diastolic_bp',
  'systolic_bp',
] as const satisfies readonly MetricId[];

export type CardioTrendMetricKey =
  (typeof cardioTrendMetrics)[number];

export type NervousMetricKey =
  | 'hrv'
  | 'stress_score'
  | 'body_battery'
  | 'resting_hr';

export type DigestiveTrendMetricKey =
  | 'hrv'
  | 'sleep_duration'
  | 'active_minutes';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(
    0,
    Math.round(valueInMinutes),
  );

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

const ALL_METRIC_CHART_META: Partial<
  Record<MetricId, MetricMeta>
> = {
  vo2_max: {
    metricNameKey: 'metrics:vo2_max.shortName',
    unit: '',
    accentColor: colors => colors.chart.vo2Max,
  },

  resting_hr: {
    metricNameKey: 'metrics:resting_hr.shortName',
    unit: 'bpm',
    accentColor: colors => colors.chart.restingHr,
  },

  /*training_load: {
    metricNameKey: 'metrics:trainingLoad.name',
    unit: '',
    accentColor: colors => colors.area.cardio,
    daysToShow: 35,
    xAxisLabelFormatter: formatWeekLabel,

    buildData: getMetricHistory =>
      buildWeeklyTrainingLoadTrendData(
        getMetricHistory('active_minutes').map(entry => ({
          recordedAt: entry.recordedAt,
          value: entry.value,
          unit: entry.unit,
        })),
        getMetricHistory('intensity_minutes').map(entry => ({
          recordedAt: entry.recordedAt,
          value: entry.value,
          unit: entry.unit,
        })),
      ),

    referenceLines: [
      {
        value: 150,
        label: '150',
        color: colors => colors.infoColor,
      },
      {
        value: 300,
        label: '300',
        color: colors => colors.successColor,
      },
    ],
  },*/

  hrv: {
    metricNameKey: 'metrics:hrv.name',
    unit: 'ms',
    accentColor: colors => colors.chart.hrv,
  },

  stress_score: {
    metricNameKey: 'metrics:stressScore.title',
    accentColor: colors => colors.warmDefault,
  },

  body_battery: {
    metricNameKey: 'metrics:bodyBattery.name',
    unit: '%',
    accentColor: colors => colors.chart.mindBodyBattery,
  },

  sleep_duration: {
    metricNameKey: 'metrics:sleep_duration.name',
    accentColor: colors => colors.chart.sleepDuration,
    valueFormatter: formatSleepDuration,

    buildData: getMetricHistory =>
      buildTrendData(
        getMetricHistory('sleep_duration'),
        (value, unit) =>
          unit === 'hours'
            ? Math.round(value * 60)
            : Math.round(value),
      ),
  },

  active_minutes: {
    metricNameKey: 'metrics:activeMinutes.name',
    unit: 'min',
    accentColor: colors => colors.chart.activeMinutes,
  },
};

type UseMetricConfigInput = {
  metricId: MetricId | null;
  data?: MetricTrendPoint[];
};

export function useMetricConfig({
  metricId,
  data: dataOverride,
}: UseMetricConfigInput): MetricChartConfig | null {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  return React.useMemo(() => {
    if (!metricId) {
      return null;
    }

    const meta = ALL_METRIC_CHART_META[metricId];

    const data =
      dataOverride ??
      meta?.buildData?.(getMetricHistory, metricId) ??
      buildTrendData(getMetricHistory(metricId));

    return {
      metricName: t(
        meta?.metricNameKey ??
          `metrics:${metricId}.name`,
      ),
      unit: meta?.unit,
      data,
      accentColor:
        meta?.accentColor(colors) ?? colors.primary,
      daysToShow: meta?.daysToShow,
      xAxisLabelFormatter:
        meta?.xAxisLabelFormatter,
      valueFormatter: meta?.valueFormatter,
      referenceLines: meta?.referenceLines?.map(
        line => ({
          value: line.value,
          label: line.label,
          color: line.color(colors),
        }),
      ),
    };
  }, [
    colors,
    dataOverride,
    getMetricHistory,
    metricId,
    t,
  ]);
}
