import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Colors } from '@/app/theme/Colors';
import { buildNutritionPlanTipProgress } from '@/components/nutritionTargets.logic';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import { type MetricId, metrics } from '@/locales/metrics';
import { tips } from '@/locales/tips';
import {
  extractWeeklyTrackingSignals,
  mergeWeeklyTrackingSignal,
  parseNumberValue,
  type WeeklyTrackingSignals,
} from '@/utils/analyzeNutrition';
import { toDateKey } from '@/utils/dateUtils';

import { MetricValuesBottomSheet } from '../sections/metrics/MetricValuesBottomSheet';
import { useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';

type TimeWindowOption = 7 | 30 | 90;

const sumTypedTotals = (
  meals: Array<any>,
  key:
    | 'fiberByType'
    | 'polyphenolByType'
    | 'mineralsByType'
    | 'vitaminsByType'
    | 'aminoAcidsByType',
) =>
  meals.reduce((acc, meal) => {
    const rawValue = meal?.[key];

    const source =
      typeof rawValue === 'object' && rawValue !== null
        ? rawValue
        : {};

    for (const [tag, value] of Object.entries(source)) {
      const parsed = parseNumberValue(value);

      if (parsed === null) continue;

      acc[tag] = (acc[tag] ?? 0) + parsed;
    }

    return acc;
  }, {} as Record<string, number>);

const getWeekStartKeyForDate = (date: Date): string => {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  const day = normalized.getDay();
  const diffToMonday = (day + 6) % 7;

  normalized.setDate(normalized.getDate() - diffToMonday);

  return toDateKey(normalized);
};

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

  const {
    plans,
    dailyNutritionSummaries,
    weeklyTracking,
    takenDates,
  } = useStorage();

  /*
   * Viktigt:
   * Den här routen öppnas från:
   *
   * /(stack)/plan/[tipId]/metric/[metricId]
   *
   * så både tipId och metricId finns i params.
   */
  const params = useLocalSearchParams<{
    tipId?: string | string[];
    metricId?: string | string[];
  }>();

  const [selectedDays, setSelectedDays] =
    React.useState<TimeWindowOption>(30);

  const resolvedTipId = React.useMemo(() => {
    const value = Array.isArray(params.tipId)
      ? params.tipId[0]
      : params.tipId;

    return value || null;
  }, [params.tipId]);

  const resolvedMetricId = React.useMemo<MetricId | null>(() => {
    const value = Array.isArray(params.metricId)
      ? params.metricId[0]
      : params.metricId;

    if (!value || !Object.hasOwn(metrics, value)) {
      return null;
    }

    return value as MetricId;
  }, [params.metricId]);

  /*
   * Hämta tipset som grafen öppnades från.
   */
  const tip = React.useMemo(() => {
    if (!resolvedTipId) return undefined;

    return tips.find(candidate => candidate.id === resolvedTipId);
  }, [resolvedTipId]);

  /*
   * Exempel vid 30 dagar:
   *
   * [
   *   '2026-07-30',
   *   '2026-07-31',
   *   ...
   *   '2026-08-28'
   * ]
   */
  const datesInRange = React.useMemo(
    () => getDatesInRange(selectedDays),
    [selectedDays],
  );

  /*
   * Räknar ut target-progress för EN specifik dag.
   *
   * Det här är i princip samma uträkning som du redan gör i
   * PlanDetailsScreen, men selectedDateKey byts ut beroende
   * på vilken dag vi undersöker.
   */
  const buildTipProgressForDate = React.useCallback(
    (selectedDateKey: string) => {
      if (!tip?.id) return [];

      const selectedDate = new Date(`${selectedDateKey}T12:00:00`);

      const weekStartKey =
        getWeekStartKeyForDate(selectedDate);

      const summary =
        dailyNutritionSummaries[selectedDateKey];

      const meals = Array.isArray(summary?.meals)
        ? summary.meals
        : [];

      /*
       * Tracking för just denna dag.
       */
      const dailyTracking: WeeklyTrackingSignals = {};

      meals.forEach(meal => {
        const mealSignals =
          extractWeeklyTrackingSignals(
            meal,
            undefined,
          );

        Object.entries(mealSignals).forEach(
          ([key, value]) => {
            mergeWeeklyTrackingSignal(
              dailyTracking,
              key,
              value,
            );
          },
        );
      });

      /*
       * Veckans slut.
       */
      const weekEndDate =
        new Date(`${weekStartKey}T12:00:00`);

      weekEndDate.setDate(
        weekEndDate.getDate() + 6,
      );

      const weekEndKey =
        toDateKey(weekEndDate);

      /*
       * Alla nutrition summaries för veckan som
       * selectedDateKey ligger i.
       */
      const weeklySummaries =
        Object.entries(dailyNutritionSummaries)
          .filter(
            ([dateKey]) =>
              dateKey >= weekStartKey &&
              dateKey <= weekEndKey,
          )
          .map(([, daySummary]) => daySummary);

      const weeklyMeals =
        weeklySummaries.flatMap(daySummary =>
          Array.isArray(daySummary?.meals)
            ? daySummary.meals
            : [],
        );

      const weeklyFiberTotal =
        weeklySummaries.reduce(
          (sum, daySummary) => {
            const dayFiber =
              parseNumberValue(
                daySummary?.totals?.fiber,
              ) ?? 0;

            return sum + dayFiber;
          },
          0,
        );

      return buildNutritionPlanTipProgress({
        plans: {
          ...plans,

          /*
           * Vi räknar bara på det tips som den här
           * MetricDetailScreen hör till.
           */
          nutrition: (plans.nutrition ?? []).filter(
            planEntry =>
              planEntry.tipId === tip.id,
          ),
        },

        summary,

        t,

        selectedDateKey,

        weekStartKey,

        dailyTracking,

        weeklyTracking,

        takenDates,

        dailyFiberByType:
          sumTypedTotals(
            meals,
            'fiberByType',
          ),

        dailyPolyphenolByType:
          sumTypedTotals(
            meals,
            'polyphenolByType',
          ),

        dailyMineralsByType:
          sumTypedTotals(
            meals,
            'mineralsByType',
          ),

        dailyVitaminsByType:
          sumTypedTotals(
            meals,
            'vitaminsByType',
          ),

        dailyAminoAcidsByType:
          sumTypedTotals(
            meals,
            'aminoAcidsByType',
          ),

        weeklyFiberByType:
          sumTypedTotals(
            weeklyMeals,
            'fiberByType',
          ),

        weeklyPolyphenolByType:
          sumTypedTotals(
            weeklyMeals,
            'polyphenolByType',
          ),

        weeklyMineralsByType:
          sumTypedTotals(
            weeklyMeals,
            'mineralsByType',
          ),

        weeklyVitaminsByType:
          sumTypedTotals(
            weeklyMeals,
            'vitaminsByType',
          ),

        weeklyAminoAcidsByType:
          sumTypedTotals(
            weeklyMeals,
            'aminoAcidsByType',
          ),

        weeklyFiberTotal,
      });
    },
    [
      dailyNutritionSummaries,
      plans,
      t,
      takenDates,
      tip,
      weeklyTracking,
    ],
  );

  /*
   * HÄR är själva logiken för prickarna.
   *
   * För varje datum:
   *
   *   tip
   *    └─ targets[0]
   *         └─ isMet === true
   *
   * Då skickas datumet till grafen.
   *
   * Vi bryr oss alltså INTE om:
   *
   * supplement.name === 'Magnesium'
   *
   * Magnesium kan lika gärna ha kommit från mat.
   */
  const targetEventSeries = React.useMemo(() => {
    if (!tip?.id || datesInRange.length === 0) {
      return [];
    }

    /*
     * Samla alla targets som finns för tipset.
     *
     * Vi letar bakifrån eftersom senaste dagen sannolikt
     * har den aktuella target-definitionen.
     */
    let targetDefinitions:
      | Array<{
        tag: string;
        unit: string;
        period: string;
      }>
      | undefined;

    for (
      let index = datesInRange.length - 1;
      index >= 0;
      index -= 1
    ) {
      const progress =
        buildTipProgressForDate(
          datesInRange[index],
        );

      const tipProgress =
        progress.find(
          item => item.tipId === tip.id,
        );

      if (tipProgress?.targets?.length) {
        targetDefinitions =
          tipProgress.targets.map(target => ({
            tag: target.tag,
            unit: target.unit,
            period: target.period,
          }));

        break;
      }
    }

    if (!targetDefinitions?.length) {
      return [];
    }

    /*
     * Bygg en serie per target.
     */
    return targetDefinitions.map(
      (targetDefinition, targetIndex) => {
        const dates = datesInRange.filter(dateKey => {
          const progress =
            buildTipProgressForDate(dateKey);

          const tipProgress =
            progress.find(
              item => item.tipId === tip.id,
            );

          const target =
            tipProgress?.targets?.find(
              candidate =>
                candidate.tag ===
                targetDefinition.tag &&
                candidate.unit ===
                targetDefinition.unit &&
                candidate.period ===
                targetDefinition.period,
            );

          return target?.isMet === true;
        });

        const translatedTarget = t(
          `common:nutrition.${targetDefinition.tag}`,
          {
            defaultValue:
              targetDefinition.tag,
          },
        );

        return {
          label: t(
            'common:general.targetReachedWithName',
            {
              name: translatedTarget,
              defaultValue:
                `${translatedTarget}`,
            },
          ),

          dates,

          /*
           * Tillfälliga färger.
           * Kan senare flyttas till en riktig palette.
           */
          color:
            targetIndex === 0
              ? colors.warmColor
              : targetIndex === 1
                ? colors.primary
                : colors.accentStrong,
        };
      },
    );
  }, [
    buildTipProgressForDate,
    colors.accentStrong,
    colors.primary,
    colors.warmColor,
    datesInRange,
    t,
    tip?.id,
  ]);

  const selectedConfig = useMetricConfig({
    metricId: resolvedMetricId,
  });

  const metricValuesBottomSheetRef =
    React.useRef<BottomSheet>(null);

  const openMetricValuesTable =
    React.useCallback(() => {
      metricValuesBottomSheetRef.current?.snapToIndex(1);
    }, []);

  if (!resolvedMetricId || !selectedConfig) {
    return (
      <Container
        background="gradient"
        showBackButton
        onBackPress={() => router.back()}
      >
        <View style={styles.content}>
          <ThemedText type="title">
            {t('common:general.error')}
          </ThemedText>
        </View>
      </Container>
    );
  }

  const themeGradients = dark
    ? Colors.dark.gradients
    : Colors.light.gradients;

  const description = t(
    `metrics:${resolvedMetricId}.description`,
    {
      defaultValue: '',
    },
  );

  return (
    <Container
      background="default"
      gradientLocations={
        themeGradients.sunrise.locations2 as any
      }
      showBackButton
      onBackPress={() => router.back()}
    >
      <View style={styles.content}>
        <ThemedText
          type="title"
          style={{
            color: colors.area.cardio,
          }}
        >
          {selectedConfig.metricName}
        </ThemedText>

        <ThemedText
          type="subtitle"
          style={styles.subtitle}
        >
          {description}
        </ThemedText>

        <View style={styles.timeWindowRow}>
          {([7, 30] as const).map(days => {
            const isActive =
              selectedDays === days;

            return (
              <TouchableOpacity
                key={days}
                onPress={() =>
                  setSelectedDays(days)
                }
                activeOpacity={0.85}
                style={[
                  styles.timeWindowButton,
                  {
                    borderColor: isActive
                      ? colors.primary
                      : colors.borderLight,

                    backgroundColor: isActive
                      ? colors.primary
                      : colors.cardBackground,
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: isActive
                      ? colors.background
                      : colors.text,
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
          metricName={
            selectedConfig.metricName
          }
          unit={
            selectedConfig.unit ||
            undefined
          }
          daysToShow={selectedDays}
          accentColor={
            selectedConfig.accentColor
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
          eventSeries={
            targetEventSeries.length > 0
    ? targetEventSeries
    : undefined
          }
        />
      </View>

      <MetricValuesBottomSheet
        bottomSheetRef={
          metricValuesBottomSheetRef
        }
        metricId={resolvedMetricId}
        metricName={
          selectedConfig.metricName
        }
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