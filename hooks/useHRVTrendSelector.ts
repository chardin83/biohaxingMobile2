import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import type { MetricTrendSelector } from '@/components/metrics/MetricTrendChart';
import { buildHRVDailyTrend, getHRVHistory, type HRVMetricId } from '@/utils/hrvHistory';

export function useHRVTrendSelector() {
  const { getMetricHistory } = useStorage();
  const { t } = useTranslation();
  const [selection, setSelection] = useState<HRVMetricId | null>(null);
  const metricId = selection ?? getHRVHistory(getMetricHistory).metricId;
  const metricName = t(`metrics:${metricId}.name`);
  const seriesSelector: MetricTrendSelector = {
    value: metricId,
    options: (['hrv_rmssd', 'hrv_sdnn'] as const).map(id => ({
      value: id,
      label: id === 'hrv_rmssd' ? 'RMSSD' : 'SDNN',
      metricName: t('metrics:hrv.dailyMeanName', { format: id === 'hrv_rmssd' ? 'RMSSD' : 'SDNN' }),
      data: buildHRVDailyTrend(getMetricHistory(id)),
    })),
    onChange: value => {
      if (value === 'hrv_rmssd' || value === 'hrv_sdnn') setSelection(value);
    },
  };
  return { metricId, metricName, seriesSelector };
}
