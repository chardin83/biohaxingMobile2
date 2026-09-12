import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { useNutritionPlanProgressHistory } from '@/hooks/useNutritionPlanProgressHistory';
import { type MetricId, metrics } from '@/locales/metrics';
import { tips } from '@/locales/tips';
import { toDateKey } from '@/utils/dateUtils';

import { MetricValuesBottomSheet } from '../sections/metrics/MetricValuesBottomSheet';
import { useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';

type TimeWindowOption = 7 | 30 | 90;

const getDatesInRange = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    dates.push(toDateKey(date));
  }

  return dates;
};

export default function MetricDetailScreen() {
  const router = useRouter();

  const { colors, dark } = useTheme();

  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    tipId?: string | string[];
    metricId?: string | string[];
  }>();

  const [selectedDays, setSelectedDays] = React.useState<TimeWindowOption>(30);

  const resolvedTipId = React.useMemo(() => {
    const value = Array.isArray(params.tipId) ? params.tipId[0] : params.tipId;

    return value || null;
  }, [params.tipId]);

  const resolvedMetricId = React.useMemo<MetricId | null>(() => {
    const value = Array.isArray(params.metricId) ? params.metricId[0] : params.metricId;

    if (!value || !Object.hasOwn(metrics, value)) {
      return null;
    }

    return value as MetricId;
  }, [params.metricId]);

  const tip = React.useMemo(() => {
    if (!resolvedTipId) {
      return undefined;
    }

    return tips.find(candidate => candidate.id === resolvedTipId);
  }, [resolvedTipId]);

  const datesInRange = React.useMemo(() => getDatesInRange(selectedDays), [selectedDays]);

  const nutritionProgressHistory = useNutritionPlanProgressHistory(datesInRange);

  const targetEventSeries = React.useMemo(() => {
    if (!tip?.id || datesInRange.length === 0) {
      return [];
    }

    const targetDefinitions = datesInRange
      .map(dateKey => nutritionProgressHistory[dateKey]?.find(item => item.tipId === tip.id))
      .find(progress => progress?.targets.length)?.targets;

    if (!targetDefinitions?.length) {
      return [];
    }

    return targetDefinitions.map((targetDefinition, targetIndex) => {
      const fulfilledDates = datesInRange.filter(dateKey => {
        const tipProgress = nutritionProgressHistory[dateKey]?.find(item => item.tipId === tip.id);

        const target = tipProgress?.targets.find(
          candidate => candidate.tag === targetDefinition.tag && candidate.unit === targetDefinition.unit && candidate.period === targetDefinition.period
        );

        return target?.isMet === true;
      });

      const translatedTarget = t(`common:nutrition.${targetDefinition.tag}`, {
        defaultValue: targetDefinition.tag,
      });

      return {
        label: t('common:general.targetReachedWithName', {
          name: translatedTarget,
          defaultValue: translatedTarget,
        }),

        dates: fulfilledDates,

        color: targetIndex === 0 ? colors.warmColor : targetIndex === 1 ? colors.primary : colors.accentStrong,
      };
    });
  }, [nutritionProgressHistory, datesInRange, tip?.id, t, colors.warmColor, colors.primary, colors.accentStrong]);

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

  const description = t(`metrics:${resolvedMetricId}.description`, {
    defaultValue: '',
  });

  return (
    <Container background="default" gradientLocations={themeGradients.sunrise.locations2 as any} showBackButton onBackPress={() => router.back()}>
      <View style={styles.content}>
        <ThemedText
          type="title"
          style={{
            color: colors.area.cardio,
          }}
        >
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
                  style={{
                    color: isActive ? colors.background : colors.text,
                  }}
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
          eventSeries={targetEventSeries.length > 0 ? targetEventSeries : undefined}
        />
      </View>

      <MetricValuesBottomSheet bottomSheetRef={metricValuesBottomSheetRef} metricId={resolvedMetricId} metricName={selectedConfig.metricName} />
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
});
