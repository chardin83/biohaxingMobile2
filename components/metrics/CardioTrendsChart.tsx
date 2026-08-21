import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { BloodPressureMetric } from './BloodPressureMetric';
import {
  type CardioTrendMetricKey,
  useMetricConfig,
} from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';
import { RestingHRMetric } from './RestingHRMetric';
import { VO2MaxMetric } from './VO2MaxMetric';

export function CardioTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedMetric, setSelectedMetric] =
    React.useState<CardioTrendMetricKey | null>(null);

  const metricValuesBottomSheetRef =
    React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback(
    (metric: CardioTrendMetricKey) => {
      setSelectedMetric(current =>
        current === metric ? null : metric,
      );
    },
    [],
  );

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const selectedConfig = useMetricConfig({
    metricId: selectedMetric,
  });

  return (
    <Card title={t('cardioOverview.yourCardioPerformance')}>
      <View style={globalStyles.row}>
        <VO2MaxMetric
          showDivider
          onPress={() => toggleMetric('vo2_max')}
          isSelected={selectedMetric === 'vo2_max'}
        />

        <RestingHRMetric
          showDivider
          onPress={() => toggleMetric('resting_hr')}
          isSelected={selectedMetric === 'resting_hr'}
        />

        <BloodPressureMetric
        showDivider
        onPress={() => toggleMetric('systolic_bp')}
        isSelected={selectedMetric === 'systolic_bp'}
      />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit || undefined}
          daysToShow={selectedConfig.daysToShow}
          accentColor={selectedConfig.accentColor}
          valueFormatter={selectedConfig.valueFormatter}
          xAxisLabelFormatter={
            selectedConfig.xAxisLabelFormatter
          }
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
        {selectedMetric
          ? t(
              `cardioTrendsChart.explainers.${selectedMetric}`,
            )
          : t('cardioTrendsChart.explainer')}
      </ThemedText>

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </Card>
  );
}