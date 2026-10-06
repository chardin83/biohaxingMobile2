import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { MetricSourcesBottomSheet } from '@/components/sections/metrics/MetricSourcesBottomSheet';
import { getHRVHistory } from '@/utils/hrvHistory';
import { buildRecoveryTrend, RECOVERY_THRESHOLDS } from '@/utils/recoveryStatus';

import { MetricTrendChart } from './MetricTrendChart';

export function RecoveryTrendChart() {
  const sourcesRef = React.useRef<BottomSheet>(null);
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const data = React.useMemo(
    () => buildRecoveryTrend(getMetricHistory('resting_hr'), getMetricHistory('sleep_duration'), getHRVHistory(getMetricHistory).entries),
    [getMetricHistory]
  );
  const hrvMetricId = getHRVHistory(getMetricHistory).metricId;
  return (
    <>
      <MetricTrendChart
        onViewRegisteredValues={() => sourcesRef.current?.snapToIndex(0)}
        data={data}
        metricName={t('recoveryStatus.title')}
        unit="/100"
        showYAxisUnit={false}
        accentColor={colors.primary}
        yAxisBounds={{ min: 0, max: 100 }}
        referenceLines={RECOVERY_THRESHOLDS.map(({ level, minScore }) => ({
          value: minScore,
          label: t(`recoveryStatus.${level}`),
          color: colors.textMuted,
        }))}
      />
      <MetricSourcesBottomSheet
        bottomSheetRef={sourcesRef}
        title={t('trendChart.viewRegisteredValues')}
        sources={[
          { metricId: 'resting_hr', label: t('resting_hr.name') },
          { metricId: 'sleep_duration', label: t('sleep_duration.name') },
          { metricId: hrvMetricId, label: t(`${hrvMetricId}.name`) },
        ]}
      />
    </>
  );
}
