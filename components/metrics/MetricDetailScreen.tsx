import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Colors } from '@/app/theme/Colors';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { type MetricId,metrics } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';
import { buildWeeklyTrainingLoadTrendData, getIsoWeekInfo } from '@/utils/trainingLoad';

import { MetricValuesBottomSheet } from '../sections/MetricValuesBottomSheet';
import { MetricTrendChart } from './MetricTrendChart';

type MetricDetailKey = 'vo2_max' | 'resting_hr' | 'training_load';
type TimeWindowOption = 7 | 30 | 90;

function formatWeekLabel(date: string) {
  const { isoYear, isoWeek } = getIsoWeekInfo(date);
  const shortYear = String(isoYear).slice(-2);
  return `v${isoWeek} '${shortYear}`;
}

export default function MetricDetailScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { metricId } = useLocalSearchParams<{ metricId?: string | string[] }>();
  const [selectedDays, setSelectedDays] = React.useState<TimeWindowOption>(30);

  const resolvedMetricId = React.useMemo(() => {
    if (Array.isArray(metricId)) return metricId[0];
    return metricId;
  }, [metricId]);

  const selectedMetric = React.useMemo<MetricDetailKey | null>(() => {
    if (resolvedMetricId === 'vo2_max' || resolvedMetricId === 'resting_hr' || resolvedMetricId === 'training_load') {
      return resolvedMetricId;
    }
    return null;
  }, [resolvedMetricId]);

  const isKnownMetric = React.useMemo(() => {
    if (!resolvedMetricId) return false;
    return Object.hasOwn(metrics, resolvedMetricId);
  }, [resolvedMetricId]);

  const selectedConfig = React.useMemo(() => {
    if (!resolvedMetricId) return null;

    const vo2TrendData = buildTrendData(getMetricHistory('vo2_max'));
    const restingHrTrendData = buildTrendData(getMetricHistory('resting_hr'));
    const trainingLoadTrendData = buildWeeklyTrainingLoadTrendData(
      getMetricHistory('active_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit })),
      getMetricHistory('intensity_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit }))
    );

    switch (selectedMetric) {
      case 'resting_hr':
        return {
          metricName: t('metrics:resting_hr.shortName'),
          unit: 'bpm',
          data: restingHrTrendData,
          accentColor: colors.chart.restingHr,
        };
      case 'training_load':
        return {
          metricName: t('metrics:trainingLoad.name'),
          unit: '',
          daysToShow: 35,
          data: trainingLoadTrendData,
          xAxisLabelFormatter: formatWeekLabel,
          accentColor: colors.area.cardio,
          referenceLines: [
            { value: 150, label: '150', color: colors.infoColor },
            { value: 300, label: '300', color: colors.successColor },
          ],
        };
      case 'vo2_max':
        return {
          metricName: t('metrics:vo2_max.shortName'),
          unit: '',
          data: vo2TrendData,
          accentColor: colors.chart.vo2Max,
        };
      default:
        if (!isKnownMetric) return null;

        return {
          metricName: t(`metrics:${resolvedMetricId}.name`),
          unit: '',
          data: buildTrendData(getMetricHistory(resolvedMetricId as MetricId)),
          accentColor: colors.primary,
        };
    }
  }, [colors.area.cardio, colors.chart.restingHr, colors.chart.vo2Max, colors.infoColor, colors.primary, colors.successColor, getMetricHistory, isKnownMetric, resolvedMetricId, selectedMetric, t]);
 
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);
  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  if (!resolvedMetricId || !selectedConfig) {
    return (
      <Container background="gradient" showBackButton onBackPress={() => router.back()}>
        <View style={styles.content}>
          <ThemedText type="title">{t('common:general.error')}</ThemedText>
        </View>
      </Container>
    );
  }

  const themeGradients = dark ? Colors.dark.gradients : Colors.light.gradients;

  return (
    <Container
      background="default"
      gradientLocations={themeGradients.sunrise.locations2 as any}
      showBackButton
      onBackPress={() => router.back()}
    >
      <View style={styles.content}>
        <ThemedText type="title" style={{ color: colors.area.cardio }}>
          {selectedConfig.metricName}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          {selectedMetric
            ? t(`cardioTrendsChart.explainers.${selectedMetric}`)
            : t(`metrics:${resolvedMetricId}.description`)}
        </ThemedText>

        <View style={styles.timeWindowRow}>
          {([7, 30, 90] as const).map(days => {
            const isActive = selectedDays === days;
            return (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedDays(days)}
                activeOpacity={0.85}
                style={[
                  styles.timeWindowButton,
                  {
                    borderColor: isActive ? colors.primary : colors.borderLight,
                    backgroundColor: isActive ? colors.primary : colors.cardBackground,
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{ color: isActive ? colors.background : colors.text }}
                >
                  {days} dagar
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        <MetricTrendChart
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit || undefined}
          daysToShow={selectedDays}
          accentColor={selectedConfig.accentColor}
          xAxisLabelFormatter={selectedConfig.xAxisLabelFormatter}
          referenceLines={selectedConfig.referenceLines}
          onViewRegisteredValues={openMetricValuesTable}
        />
      </View>

      <MetricValuesBottomSheet
              bottomSheetRef={metricValuesBottomSheetRef}
              metricId={resolvedMetricId as MetricId}
              metricName={selectedConfig?.metricName}
            />
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 100,
  },
  subtitle: {
    marginBottom: 8,
  },
  timeWindowRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeWindowButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  valuesSection: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  valuesTitle: {
    marginBottom: 12,
  },
  metricGroup: {
    marginBottom: 12,
    gap: 4,
  },
  metricGroupTitle: {
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
