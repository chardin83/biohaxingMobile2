import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { buildTrendData } from '@/utils/metrics';

import { BodyBatteryMetric } from './BodyBatteryMetric';
import { HRVMetric } from './HRVMetric';
import {
  type NervousMetricKey,
  useMetricConfig,
} from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';
import { RecoveryStatusMetric } from './RecoveryStatusMetric';
import { RestingHRMetric } from './RestingHRMetric';
import { StressScoreMetric } from './StressScoreMetric';

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function NervousSystemStatusChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const hrvData = useStoredHRVData();

  const [selectedMetric, setSelectedMetric] =
    React.useState<NervousMetricKey | null>(null);

  const metricValuesBottomSheetRef =
    React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback(
    (metric: NervousMetricKey) => {
      setSelectedMetric(current =>
        current === metric ? null : metric,
      );
    },
    [],
  );

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  /*
   * Stress score finns inte som separat lagrad metric.
   * Den beräknas därför från HRV och skickas som data-override.
   */
  const stressScoreTrendData = React.useMemo(
    () =>
      buildTrendData(
        getMetricHistory('hrv'),
        value =>
          clampScore(100 - Math.round(value)),
      ),
    [getMetricHistory],
  );

  const selectedConfig = useMetricConfig({
    metricId: selectedMetric,
    data:
      selectedMetric === 'stress_score'
        ? stressScoreTrendData
        : undefined,
  });

  /*
   * Bottom sheet ska visa de registrerade HRV-värdena
   * när den beräknade stresspoängen är vald.
   */
  const selectedMetricId =
    selectedMetric === 'stress_score'
      ? 'hrv'
      : selectedMetric;

  return (
    <>
      <Card
        title={t(
          'nervousSystemOverview.autonomicNervousSystem.title',
        )}
      >
        <View style={globalStyles.row}>
          <HRVMetric
            showDivider
            onPress={() => toggleMetric('hrv')}
            isSelected={selectedMetric === 'hrv'}
          />

          <StressScoreMetric
            hrvData={hrvData}
            showDivider
            onPress={() =>
              toggleMetric('stress_score')
            }
            isSelected={
              selectedMetric === 'stress_score'
            }
          />

          <BodyBatteryMetric
            onPress={() =>
              toggleMetric('body_battery')
            }
            isSelected={
              selectedMetric === 'body_battery'
            }
          />
        </View>

        <View
          style={[
            globalStyles.row,
            globalStyles.marginTop16,
          ]}
        >
          <RestingHRMetric
            showDivider
            onPress={() =>
              toggleMetric('resting_hr')
            }
            isSelected={
              selectedMetric === 'resting_hr'
            }
          />

          <RecoveryStatusMetric />
        </View>

        {selectedConfig && (
          <MetricTrendChart
            data={selectedConfig.data}
            metricName={selectedConfig.metricName}
            unit={selectedConfig.unit}
            accentColor={
              selectedConfig.accentColor
            }
            daysToShow={selectedConfig.daysToShow}
            valueFormatter={
              selectedConfig.valueFormatter
            }
            xAxisLabelFormatter={
              selectedConfig.xAxisLabelFormatter
            }
            referenceLines={
              selectedConfig.referenceLines
            }
            onViewRegisteredValues={
              openMetricValuesTable
            }
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
                `nervousTrendsChart.explainers.${selectedMetric}`,
              )
            : t('nervousTrendsChart.explainer')}
        </ThemedText>
      </Card>

      <MetricValuesBottomSheet
        bottomSheetRef={
          metricValuesBottomSheetRef
        }
        metricId={selectedMetricId}
        metricName={selectedConfig?.metricName}
      />
    </>
  );
}