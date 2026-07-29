import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { type MetricId,metrics } from '@/locales/metrics';

import { MetricValuesBottomSheet } from '../sections/MetricValuesBottomSheet';
import { useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';


type TimeWindowOption = 7 | 30 | 90;


export default function MetricDetailScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const { metricId } = useLocalSearchParams<{ metricId?: string | string[] }>();
  const [selectedDays, setSelectedDays] = React.useState<TimeWindowOption>(30);

const resolvedMetricId = React.useMemo<MetricId | null>(() => {
  const value = Array.isArray(metricId)
    ? metricId[0]
    : metricId;

  if (!value || !Object.hasOwn(metrics, value)) {
    return null;
  }

  return value as MetricId;
}, [metricId]);

const selectedConfig = useMetricConfig({
  metricId: resolvedMetricId,
});
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

  const description = t(
  `metrics:${resolvedMetricId}.description`,
  {
    defaultValue: '',
  },
);

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
          {description}
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
