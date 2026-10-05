import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useHRVTrendSelector } from '@/hooks/useHRVTrendSelector';

import { HRVMetric } from './HRVMetric';
import { type NervousMetricKey, useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';
import { RecoveryStatusMetric } from './old/RecoveryStatusMetric';
import { RestingHRMetric } from './RestingHRMetric';

export function NervousSystemStatusChart() {
  const hrvTrend = useHRVTrendSelector();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedMetric, setSelectedMetric] = React.useState<NervousMetricKey | null>(null);

  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: NervousMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const selectedConfig = useMetricConfig({ metricId: selectedMetric });

  return (
    <>
      <Card title={t('nervousSystemOverview.autonomicNervousSystem.title')}>
        <View style={globalStyles.row}>
          <HRVMetric onPress={() => toggleMetric('hrv')} isSelected={selectedMetric === 'hrv'} />
        </View>

        <View style={[globalStyles.row, globalStyles.marginTop16]}>
          <RestingHRMetric showDivider onPress={() => toggleMetric('resting_hr')} isSelected={selectedMetric === 'resting_hr'} />

          <RecoveryStatusMetric />
        </View>

        {selectedConfig && (
          <MetricTrendChart
            seriesSelector={selectedMetric === 'hrv' ? hrvTrend.seriesSelector : undefined}
            data={selectedConfig.data}
            metricName={selectedConfig.metricName}
            unit={selectedConfig.unit}
            accentColor={selectedConfig.accentColor}
            daysToShow={selectedConfig.daysToShow}
            valueFormatter={selectedConfig.valueFormatter}
            xAxisLabelFormatter={selectedConfig.xAxisLabelFormatter}
            referenceLines={selectedConfig.referenceLines}
            onViewRegisteredValues={openMetricValuesTable}
          />
        )}

        <ThemedText
          type="explainer"
          style={[
            globalStyles.explainer,
            {
              borderColor: colors.borderLight,
            },
          ]}
        >
          {selectedMetric ? t(`nervousTrendsChart.explainers.${selectedMetric}`) : t('nervousTrendsChart.explainer')}
        </ThemedText>
      </Card>

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric === 'hrv' ? hrvTrend.metricId : selectedMetric}
        metricName={selectedMetric === 'hrv' ? hrvTrend.metricName : selectedConfig?.metricName}
      />
    </>
  );
}
