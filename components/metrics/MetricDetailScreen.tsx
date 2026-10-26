import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import { Colors } from '@/app/theme/Colors';
import ProgressDateNavigator from '@/components/journal/progress/ProgressDateNavigator';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import OptionSelector from '@/components/ui/OptionSelector';
import { useNutritionPlanProgressHistory } from '@/hooks/nutrition/useNutritionPlanProgressHistory';
import { type MetricId, metrics } from '@/locales/metrics';
import { tips } from '@/locales/tips';
import { buildMetricAnalysisContext } from '@/services/metricAnalysis';
import { toDateKey } from '@/utils/dateUtils';

import { MetricValuesBottomSheet } from '../sections/metrics/MetricValuesBottomSheet';
import MetricAnalysis from './MetricAnalysis';
import { useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';
import TipGoalConfirmation from './TipGoalConfirmation';

type TimeWindowOption = 7 | 30 | 90;

const getDatesInRange = (days: number, endDate: string): string[] => {
  const dates: string[] = [];
  const today = new Date(`${endDate}T12:00:00`);

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

  const [comparisonMetricId, setComparisonMetricId] = React.useState<MetricId | ''>('');
  const [comparisonDropdownOpen, setComparisonDropdownOpen] = React.useState(false);
  const [selectedDays, setSelectedDays] = React.useState<TimeWindowOption>(30);

  const [periodEnd, setPeriodEnd] = React.useState(() => new Date().toISOString().slice(0, 10));
  const movePeriod = (direction: number) => {
    setPeriodEnd(current => {
      const shifted = new Date(`${current}T00:00:00Z`);
      shifted.setUTCDate(shifted.getUTCDate() + direction * selectedDays);
      return [shifted.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)].sort()[0];
    });
  };

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

  const datesInRange = React.useMemo(() => getDatesInRange(selectedDays, periodEnd), [selectedDays, periodEnd]);

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

    // Logging and opening the GI page are completion tasks, not chart observations.
    const chartTargets = targetDefinitions.filter(target => target.tag !== 'glycemic_index_meals' && target.tag !== 'glycemic_index_review');

    return chartTargets.map((targetDefinition, targetIndex) => {
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
      let color = colors.accentStrong;
      if (targetIndex === 0) {
        color = colors.warmColor;
      } else if (targetIndex === 1) {
        color = colors.primary;
      }

      return {
        label: t('common:general.targetReachedWithName', {
          name: translatedTarget,
          defaultValue: translatedTarget,
        }),

        dates: fulfilledDates,

        color,
      };
    });
  }, [nutritionProgressHistory, datesInRange, tip?.id, t, colors.warmColor, colors.primary, colors.accentStrong]);

  const selectedConfig = useMetricConfig({
    metricId: resolvedMetricId,
  });

  const comparisonConfig = useMetricConfig({ metricId: comparisonMetricId || null });

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

  const analysisMetric = buildMetricAnalysisContext(selectedConfig, selectedDays, new Date(`${periodEnd}T00:00:00Z`));
  analysisMetric.description = description;
  const analysisContext = JSON.stringify({
    metric: analysisMetric,
    comparison:
      comparisonMetricId && comparisonConfig ? buildMetricAnalysisContext(comparisonConfig, selectedDays, new Date(`${periodEnd}T00:00:00Z`)) : undefined,
    visibleTargets: targetEventSeries.map(({ label, dates }) => ({ label, dates })),
  });

  return (
    <Container background="default" gradientLocations={themeGradients.sunrise.locations2 as any} showBackButton onBackPress={() => router.back()}>
      <View style={styles.content}>
        <View style={styles.metricHeading}>
          <IconSymbol name={metrics[resolvedMetricId].iconName} size={38} color={colors.icon} />
          <ThemedText type="title" style={styles.metricTitle}>
            {selectedConfig.metricName}
          </ThemedText>
        </View>
        {tip?.goalConfirmation && <TipGoalConfirmation key={tip.id} tip={tip} />}

        <ThemedText style={styles.subtitle}>{description}</ThemedText>

        <View style={styles.periodRow}>
          <OptionSelector<'7' | '30' | '90'>
            compact
            value={String(selectedDays) as '7' | '30' | '90'}
            onChange={value => setSelectedDays(Number(value) as TimeWindowOption)}
            options={(['7', '30', '90'] as const).map(value => ({ value, label: value }))}
          />
          <ProgressDateNavigator
            compact
            label={[analysisMetric.period.from, periodEnd]
              .map(date => {
                const dayMonth = date.slice(5).split('-').reverse().join('/');
                return date.slice(0, 4) === String(new Date().getFullYear()) ? dayMonth : `${dayMonth} ${date.slice(0, 4)}`;
              })
              .join(' – ')}
            canGoForward={periodEnd < new Date().toISOString().slice(0, 10)}
            onBack={() => movePeriod(-1)}
            onForward={() => movePeriod(1)}
          />
        </View>

        <Card title={t('metrics:trendChart.compareMetrics')}>
          <DropDownPicker<MetricId | ''>
            open={comparisonDropdownOpen}
            setOpen={setComparisonDropdownOpen}
            value={comparisonMetricId}
            setValue={setComparisonMetricId}
            items={[
              { label: t('metrics:trendChart.noComparison'), value: '' },
              ...(Object.keys(metrics) as MetricId[]).map(id => ({ label: t(`metrics:${metrics[id].nameKey}`, { defaultValue: id }), value: id })),
            ]}
            listMode="MODAL"
            searchable
            searchPlaceholder={t('metrics:trendChart.compareMetrics')}
            style={{ backgroundColor: colors.cardBackground, borderColor: colors.borderLight }}
            textStyle={{ color: colors.text }}
            modalContentContainerStyle={{ backgroundColor: colors.background }}
            searchContainerStyle={{ borderBottomColor: colors.borderLight }}
            searchTextInputStyle={{ color: colors.text, borderColor: colors.borderLight }}
          />
        </Card>

        <MetricTrendChart
          comparison={
            comparisonConfig && comparisonMetricId
              ? {
                  data: comparisonConfig.data,
                  metricName: comparisonConfig.metricName,
                  unit: comparisonConfig.unit ?? metrics[comparisonMetricId].canonicalUnit,
                  color: colors.warmColor,
                  valueFormatter: comparisonConfig.valueFormatter,
                  yAxisBounds: comparisonConfig.yAxisBounds,
                }
              : undefined
          }
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit || undefined}
          daysToShow={selectedDays}
          endDate={periodEnd}
          accentColor={selectedConfig.accentColor}
          xAxisLabelFormatter={selectedConfig.xAxisLabelFormatter}
          referenceLines={selectedConfig.referenceLines}
          showPeriodAverage={selectedConfig.showPeriodAverage}
          glycemicIndexCoverage={selectedConfig.glycemicIndexCoverage}
          yAxisBounds={selectedConfig.yAxisBounds}
          onViewRegisteredValues={openMetricValuesTable}
          eventSeries={targetEventSeries.length > 0 ? targetEventSeries : undefined}
        />
        <MetricAnalysis
          key={analysisContext}
          context={analysisContext}
          hasData={analysisMetric.values.length > 0}
          days={selectedDays}
          metricNames={[selectedConfig.metricName, ...(comparisonMetricId && comparisonConfig ? [comparisonConfig.metricName] : [])]}
        />
      </View>

      <MetricValuesBottomSheet bottomSheetRef={metricValuesBottomSheetRef} metricId={resolvedMetricId} metricName={selectedConfig.metricName} />
    </Container>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metricHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricTitle: { flex: 1 },
  content: {
    gap: 12,
    paddingBottom: 100,
  },

  subtitle: {
    marginBottom: 8,
  },
});
