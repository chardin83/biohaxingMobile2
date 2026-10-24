import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { type MetricId } from '@/locales/metrics';
import { buildGlycemicIndexCoverage } from '@/utils/glycemicIndexMetrics';
import type { GlycemicIndexCoveragePoint } from '@/utils/glycemicIndex';
import { buildHRVDailyTrend } from '@/utils/hrvHistory';
import { buildTrendData } from '@/utils/metrics';
import { RECOVERY_THRESHOLDS } from '@/utils/recoveryStatus';

import type { MetricTrendPoint } from './MetricTrendChart';

type ThemeColors = ReturnType<typeof useTheme>['colors'];

export type MetricChartConfig = {
  metricName: string;
  unit?: string;
  yAxisBounds?: { min: number; max: number };
  data: MetricTrendPoint[];
  accentColor: string;
  showPeriodAverage?: boolean;
  glycemicIndexCoverage?: GlycemicIndexCoveragePoint[];
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
  yAxisBounds?: { min: number; max: number };
  accentColor: (colors: ThemeColors) => string;
  showPeriodAverage?: boolean;
  glycemicIndexCoverage?: GlycemicIndexCoveragePoint[];
  daysToShow?: number;
  xAxisLabelFormatter?: (date: string) => string;
  valueFormatter?: (value: number) => string;
  buildData?: (getMetricHistory: ReturnType<typeof useStorage>['getMetricHistory'], metricId: MetricId) => MetricTrendPoint[];
  referenceLines?: Array<{
    value: number;
    label?: string;
    labelKey?: string;
    color: (colors: ThemeColors) => string;
  }>;
};

export const cardioTrendMetrics = ['vo2_max', 'resting_hr', 'diastolic_bp', 'systolic_bp'] as const satisfies readonly MetricId[];

export type CardioTrendMetricKey = (typeof cardioTrendMetrics)[number];

export const nervousTrendMetrics = ['hrv_rmssd', 'hrv_sdnn', 'resting_hr'] as const satisfies readonly MetricId[];

export type NervousMetricKey = (typeof nervousTrendMetrics)[number];

export const digestiveTrendMetrics = ['hrv_rmssd', 'hrv_sdnn', 'sleep_duration', 'active_minutes'] as const satisfies readonly MetricId[];

export type DigestiveTrendMetricKey = (typeof digestiveTrendMetrics)[number];

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

const ALL_METRIC_CHART_META: Partial<Record<MetricId, MetricMeta>> = {
  glycemic_index: {
    metricNameKey: 'metrics:glycemic_index.name',
    unit: 'GI',
    showPeriodAverage: true,
    accentColor: colors => colors.primary,
  },
  recovery_status: {
    metricNameKey: 'metrics:recoveryStatus.title',
    unit: '/100',
    yAxisBounds: { min: 0, max: 100 },
    accentColor: colors => colors.primary,
    buildData: getMetricHistory => buildHRVDailyTrend(getMetricHistory('recovery_status')),
    referenceLines: RECOVERY_THRESHOLDS.map(({ level, minScore }) => ({
      value: minScore,
      labelKey: `metrics:recoveryStatus.${level}`,
      color: colors => colors.textMuted,
    })),
  },
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

  hrv_rmssd: {
    metricNameKey: 'metrics:hrv_rmssd.name',
    buildData: getMetricHistory => buildHRVDailyTrend(getMetricHistory('hrv_rmssd')),
    unit: 'ms',
    accentColor: colors => colors.chart.hrv,
  },

  hrv_sdnn: {
    metricNameKey: 'metrics:hrv_sdnn.name',
    buildData: getMetricHistory => buildHRVDailyTrend(getMetricHistory('hrv_sdnn')),
    unit: 'ms',
    accentColor: colors => colors.chart.hrv,
  },

  sleep_duration: {
    metricNameKey: 'metrics:sleep_duration.name',
    accentColor: colors => colors.chart.sleepDuration,
    valueFormatter: formatSleepDuration,

    buildData: getMetricHistory =>
      buildTrendData(getMetricHistory('sleep_duration'), (value, unit) => (unit === 'hours' ? Math.round(value * 60) : Math.round(value))),
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

export function useMetricConfig({ metricId, data: dataOverride }: UseMetricConfigInput): MetricChartConfig | null {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory, dailyNutritionTracking } = useStorage();

  return React.useMemo(() => {
    if (!metricId) {
      return null;
    }

    const meta = ALL_METRIC_CHART_META[metricId];

    const data = dataOverride ?? meta?.buildData?.(getMetricHistory, metricId) ?? buildTrendData(getMetricHistory(metricId));

    const nameKey = meta?.metricNameKey ?? `metrics:${metricId}.name`;
    return {
      metricName: t(nameKey),
      unit: meta?.unit,
      yAxisBounds: meta?.yAxisBounds,
      data,
      accentColor: meta?.accentColor(colors) ?? colors.primary,
      daysToShow: meta?.daysToShow,
      showPeriodAverage: meta?.showPeriodAverage,
      glycemicIndexCoverage: metricId === 'glycemic_index' ? buildGlycemicIndexCoverage(dailyNutritionTracking ?? {}) : undefined,
      xAxisLabelFormatter: meta?.xAxisLabelFormatter,
      valueFormatter: meta?.valueFormatter,
      referenceLines: meta?.referenceLines?.map(line => ({
        value: line.value,
        label: line.labelKey ? t(line.labelKey) : line.label,
        color: line.color(colors),
      })),
    };
  }, [colors, dailyNutritionTracking, dataOverride, getMetricHistory, metricId, t]);
}
