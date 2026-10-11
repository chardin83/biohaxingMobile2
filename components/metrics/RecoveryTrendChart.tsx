import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricSourcesBottomSheet } from '@/components/sections/metrics/MetricSourcesBottomSheet';
import AppButton from '@/components/ui/AppButton';
import Notice from '@/components/ui/Notice';
import { buildHRVDailyTrend, getHRVHistory } from '@/utils/hrvHistory';
import { RECOVERY_THRESHOLDS } from '@/utils/recoveryStatus';

import { MetricTrendChart } from './MetricTrendChart';

export function RecoveryTrendChart() {
  const router = useRouter();
  const sourcesRef = React.useRef<BottomSheet>(null);
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const data = React.useMemo(
    () => buildHRVDailyTrend(getMetricHistory('recovery_status')),
    [getMetricHistory]
  );
  const hrvMetricId = getHRVHistory(getMetricHistory).metricId;
  return (
    <>
      <Notice message={t('recoveryStatus.changeInfo')} />
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
      <AppButton
        title={t('recoveryStatus.detailedAnalysis')}
        variant="primary"
        style={styles.analysisButton}
        icon="chart"
        rightIcon="chevron.right"
        onPress={() => router.push({
          pathname: '/(stack)/metrics/[metricId]',
          params: { metricId: 'recovery_status' },
        })}
      />
      <MetricSourcesBottomSheet
        bottomSheetRef={sourcesRef}
        title={t('trendChart.viewRegisteredValues')}
        sources={[
          { metricId: 'recovery_status', label: t('recovery_status.name') },
          { metricId: 'resting_hr', label: t('resting_hr.name') },
          { metricId: 'sleep_duration', label: t('sleep_duration.name') },
          { metricId: hrvMetricId, label: t(`${hrvMetricId}.name`) },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  analysisButton: { marginTop: 12 },
});
