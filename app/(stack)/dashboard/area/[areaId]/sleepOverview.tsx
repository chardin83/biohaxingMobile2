import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { metrics } from '@/locales/metrics';
import { SleepSummary } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

type SleepTrendMetricKey = 'sleep_duration' | 'deep_sleep' | 'rem_sleep';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default function SleepScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { addMetricEntry, getMetricHistory } = useStorage();
  const registerBottomSheetRef = React.useRef<BottomSheet>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(true);
  const [selectedTrendMetric, setSelectedTrendMetric] = React.useState<SleepTrendMetricKey>('sleep_duration');
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = React.useState(false);
  const [metricValue, setMetricValue] = React.useState('');
  const [metricUnit, setMetricUnit] = React.useState('');
  const [metricNotes, setMetricNotes] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(() => new Date());
  const [sleepData, setSleepData] = React.useState<SleepSummary[]>([]);
  const [consistencyLabel, setConsistencyLabel] = React.useState<string>('-');
  const [deepSleepMinutes, setDeepSleepMinutes] = React.useState<number | null>(null);
  const [remSleepMinutes, setRemSleepMinutes] = React.useState<number | null>(null);
  const dynamicStyles = React.useMemo(
    () =>
      StyleSheet.create({
        trendMetricCardPressed: {
          backgroundColor: colors.overlayLight,
        },
        sleepDurationCardSelected: {
          backgroundColor: colors.overlayLight,
          borderColor: colors.chart.sleepDuration,
        },
        deepSleepCardSelected: {
          backgroundColor: colors.overlayLight,
          borderColor: colors.chart.deepSleep,
        },
        remSleepCardSelected: {
          backgroundColor: colors.overlayLight,
          borderColor: colors.chart.remSleep,
        },
        trendMetricLabel: {
          color: colors.textMuted,
        },
        trendMetricSubtle: {
          color: colors.textMuted,
        },
        explainerBorder: {
          borderColor: colors.borderLight,
        },
      }),
    [colors.borderLight, colors.chart.deepSleep, colors.chart.remSleep, colors.chart.sleepDuration, colors.overlayLight, colors.textMuted]
  );

  const selectedTrendMetricDefinition = metrics[selectedTrendMetric];

  const buildTrendData = React.useCallback((wearablePoints: MetricTrendPoint[], metricId: SleepTrendMetricKey) => {
    const byDate = new Map<string, MetricTrendPoint>();

    wearablePoints.forEach(point => {
      byDate.set(point.date, point);
    });

    getMetricHistory(metricId)
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .forEach(entry => {
        byDate.set(entry.recordedAt.slice(0, 10), {
          date: entry.recordedAt.slice(0, 10),
          value: entry.value,
        });
      });

    return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date));
  }, [getMetricHistory]);

  const sleepDurationTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    const wearablePoints = sleepData
      .filter(entry => typeof entry.durationMinutes === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.durationMinutes,
      }));

    return buildTrendData(wearablePoints, 'sleep_duration');
  }, [buildTrendData, sleepData]);

  const deepSleepTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    const wearablePoints = sleepData
      .filter(entry => typeof entry.stages?.deepMinutes === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.stages?.deepMinutes as number,
      }));

    return buildTrendData(wearablePoints, 'deep_sleep');
  }, [buildTrendData, sleepData]);

  const remSleepTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    const wearablePoints = sleepData
      .filter(entry => typeof entry.stages?.remMinutes === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.stages?.remMinutes as number,
      }));

    return buildTrendData(wearablePoints, 'rem_sleep');
  }, [buildTrendData, sleepData]);

  const selectedTrendConfig = React.useMemo(() => {
    switch (selectedTrendMetric) {
      case 'deep_sleep':
        return {
          metricName: t('metrics:deep_sleep.name'),
          unit: 'min',
          data: deepSleepTrendData,
          accentColor: colors.chart.deepSleep,
        };
      case 'rem_sleep':
        return {
          metricName: t('metrics:rem_sleep.name'),
          unit: 'min',
          data: remSleepTrendData,
          accentColor: colors.chart.remSleep,
        };
      case 'sleep_duration':
      default:
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: sleepDurationTrendData,
          accentColor: colors.chart.sleepDuration,
        };
    }
  }, [colors.chart.deepSleep, colors.chart.remSleep, colors.chart.sleepDuration, deepSleepTrendData, remSleepTrendData, selectedTrendMetric, sleepDurationTrendData, t]);

  const latestSleepDuration = sleepDurationTrendData.at(-1)?.value;
  const latestDeepSleep = deepSleepTrendData.at(-1)?.value;
  const latestRemSleep = remSleepTrendData.at(-1)?.value;

  const openManualMetricSheet = React.useCallback(() => {
    const defaultUnit = selectedTrendMetricDefinition?.units?.[0]?.unit ?? '';
    setMetricUnit(defaultUnit);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setIsRegisterSheetVisible(true);
  }, [selectedTrendMetricDefinition]);

  const closeManualMetricSheet = React.useCallback(() => {
    setIsRegisterSheetVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
  }, []);

  const saveManualMetric = React.useCallback(() => {
    if (!metricValue) {
      return;
    }

    const parsedValue = Number.parseFloat(metricValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    addMetricEntry({
      metricId: selectedTrendMetric,
      value: parsedValue,
      unit: metricUnit || selectedTrendMetricDefinition?.canonicalUnit || '',
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
    });

    closeManualMetricSheet();
  }, [addMetricEntry, closeManualMetricSheet, metricNotes, metricUnit, metricValue, recordedAt, selectedTrendMetric, selectedTrendMetricDefinition?.canonicalUnit]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const range = { start: daysAgo(7), end: new Date().toISOString() };

      const sleeps = await adapter.getSleep(range);
      setSleepData(sleeps);

      // V1: visa senaste nattens duration
      const latest = sleeps[sleeps.length - 1];
      setDeepSleepMinutes(latest?.stages?.deepMinutes ?? null);
      setRemSleepMinutes(latest?.stages?.remMinutes ?? null);

      // "consistency" i V1 kan vara väldigt enkel:
      setConsistencyLabel(sleeps.length >= 6 ? t('metrics.moderate') : t('metrics.low'));

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [adapter, t]);

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.sleep }}>{t('sleepOverview.title')}</ThemedText>
      <ThemedText type="subtitle">{t('sleepOverview.description')}</ThemedText>
      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title={t('sleepOverview.overview.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <View style={globalStyles.row}>
            <SleepMetric sleepData={sleepData} showDivider />

            <View
              style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}
            >
              <ThemedText type="label">{t('sleepOverview.overview.consistency.title')}</ThemedText>
              <ThemedText type="title3">{consistencyLabel}</ThemedText>
              <ThemedText type="caption">{t('sleepOverview.overview.consistency.pattern')}</ThemedText>
            </View>

            <View style={globalStyles.col}>
              <SleepConsistencyMetric sleepData={{ ...sleepData[0], targetBedtime: '22:30' }} />
            </View>
          </View>
        )}
      </Card>

      <Card title={t('sleepOverview.sleepTrends.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={styles.trendMetricRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTrendMetric('sleep_duration')}
                style={({ pressed }) => [
                  styles.trendMetricCard,
                  pressed && dynamicStyles.trendMetricCardPressed,
                  selectedTrendMetric === 'sleep_duration' && dynamicStyles.sleepDurationCardSelected,
                ]}
              >
                <ThemedText type="label">{t('metrics:sleep_duration.name')}</ThemedText>
                <ThemedText type="title3">{latestSleepDuration == null ? '—' : formatSleepDuration(latestSleepDuration)}</ThemedText>
                <ThemedText type="caption" style={dynamicStyles.trendMetricSubtle}>hh:mm</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTrendMetric('deep_sleep')}
                style={({ pressed }) => [
                  styles.trendMetricCard,
                  pressed && dynamicStyles.trendMetricCardPressed,
                  selectedTrendMetric === 'deep_sleep' && dynamicStyles.deepSleepCardSelected,
                ]}
              >
                <ThemedText type="label">{t('sleepOverview.sleepStages.deepSleep.title')}</ThemedText>
                <ThemedText type="title3">{latestDeepSleep ?? '—'}</ThemedText>
                <ThemedText type="caption" style={dynamicStyles.trendMetricSubtle}>{t('sleepOverview.sleepStages.deepSleep.minutes')}</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTrendMetric('rem_sleep')}
                style={({ pressed }) => [
                  styles.trendMetricCard,
                  pressed && dynamicStyles.trendMetricCardPressed,
                  selectedTrendMetric === 'rem_sleep' && dynamicStyles.remSleepCardSelected,
                ]}
              >
                <ThemedText type="label">{t('sleepOverview.sleepStages.remSleep.title')}</ThemedText>
                <ThemedText type="title3">{latestRemSleep ?? '—'}</ThemedText>
                <ThemedText type="caption" style={dynamicStyles.trendMetricSubtle}>{t('sleepOverview.sleepStages.remSleep.minutes')}</ThemedText>
              </Pressable>
            </View>

            <MetricTrendChart
              data={selectedTrendConfig.data}
              metricName={selectedTrendConfig.metricName}
              unit={selectedTrendConfig.unit}
              valueFormatter={selectedTrendConfig.valueFormatter}
              accentColor={selectedTrendConfig.accentColor}
              onAddManualValue={openManualMetricSheet}
            />

            <ThemedText type="explainer" style={[globalStyles.explainer, dynamicStyles.explainerBorder]}>
              {t(`sleepOverview.sleepTrends.explainers.${selectedTrendMetric}`, {
                defaultValue: t('sleepOverview.sleepStages.explainer'),
              })}
            </ThemedText>
          </>
        )}
      </Card>

      {/* Sleep stages card */}
      <Card title={t('sleepOverview.sleepStages.title')}>
        {loading ? (
          <ThemedText type="caption">Loading…</ThemedText>
        ) : (
          <>
            <View style={globalStyles.row}>
              <View
                style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight }]}
              >
                <ThemedText type="default">{t('sleepOverview.sleepStages.deepSleep.title')}</ThemedText>
                <ThemedText type="title2">{deepSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">{t('sleepOverview.sleepStages.deepSleep.minutes')}</ThemedText>
              </View>

              <View style={globalStyles.col}>
                <ThemedText type="default">{t('sleepOverview.sleepStages.remSleep.title')}</ThemedText>
                <ThemedText type="title2">{remSleepMinutes ?? '—'}</ThemedText>
                <ThemedText type="caption">{t('sleepOverview.sleepStages.remSleep.minutes')}</ThemedText>
              </View>
            </View>

            <ThemedText type="explainer" style={[globalStyles.topBorder, { borderTopColor: colors.borderLight }]}>
              💤{t("sleepOverview.sleepStages.explainer")} 
            </ThemedText>
          </>
        )}
      </Card>

      {/* Information card */}
      <Card title={t('sleepOverview.understandingSleep.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌙 {t('sleepOverview.understandingSleep.stages.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.stages.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧠 {t('sleepOverview.understandingSleep.deepSleep.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.deepSleep.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💭 {t('sleepOverview.understandingSleep.remSleep.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.remSleep.description')} 
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ {t('sleepOverview.understandingSleep.circadianRhythm.title')}</ThemedText>
          <ThemedText type="default">
            {t('sleepOverview.understandingSleep.circadianRhythm.description')}
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Gener som påverkar sömn */}
      <GenesListCard areaId="sleepQuality" />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} />

      <Portal>
        <RegisterMetricBottomSheet
          bottomSheetRef={registerBottomSheetRef}
          isVisible={isRegisterSheetVisible}
          metricId={selectedTrendMetric}
          onClose={closeManualMetricSheet}
          onSave={saveManualMetric}
          metricName={t(`metrics:${selectedTrendMetric}.name`)}
          metricValue={metricValue}
          setMetricValue={setMetricValue}
          metricUnit={metricUnit}
          setMetricUnit={setMetricUnit}
          metricNotes={metricNotes}
          setMetricNotes={setMetricNotes}
          recordedAt={recordedAt}
          setRecordedAt={setRecordedAt}
          colors={colors}
          units={selectedTrendMetricDefinition?.units ?? []}
        />
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  trendMetricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  trendMetricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
