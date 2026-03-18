import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { metrics } from '@/locales/metrics';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { DailyActivity, EnergySignal, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

type EnergyProductionMetricKey = 'vo2_max' | 'resting_hr' | 'hrv';

export default function EnergyScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { addMetricEntry, getMetricHistory } = useStorage();
  const registerBottomSheetRef = useRef<BottomSheet>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<EnergyProductionMetricKey>('hrv');
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = useState(false);
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => new Date());
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);
  const hrvData = useStoredHRVData();

  const hrvTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return hrvData
      .filter(entry => typeof entry.rmssdMs === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.rmssdMs as number,
      }));
  }, [hrvData]);

  const restingHRTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return hrvData
      .filter(entry => typeof entry.avgRestingHrBpm === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.avgRestingHrBpm as number,
      }));
  }, [hrvData]);

  const vo2MaxTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return getMetricHistory('vo2_max')
      .map(entry => ({
        date: entry.recordedAt.slice(0, 10),
        value: entry.value,
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [getMetricHistory]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, activity, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setActivityData(activity);
        setEnergyData(energy);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adapter]);

  // Transform wearable data to energy metrics
  const latestSleep = sleepData[0];
  const latestActivity = activityData[0];
  const latestEnergy = energyData[0];

  // Calculate metrics only for display in energy object
  const { hrv } = calculateHRVMetrics(hrvData);
  const { restingHR } = calculateRestingHRMetrics(hrvData);

  const energy = {
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 0,
    bodyBatteryChange: '+18',
    //bodyBatteryStatus: (latestEnergy?.bodyBatteryLevel ?? 72) > 60 ? 'Good' : 'Low',
    stressScore: 32,
    stressLevel: 'Moderate',
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 7.5,
    sleepQuality: latestSleep?.efficiencyPct ?? 82,
    deepSleepMinutes: latestSleep?.stages?.deepMinutes ?? 0,
    vo2max: 46,
    vo2maxStatus: 'Good',
    restingHR: restingHR ?? 56,
    hrv: hrv ?? 64,
    activityMinutes: latestActivity?.activeMinutes ?? 0,
    intensityMinutes: latestActivity?.intensityMinutes ?? 0,
  };

  const selectedMetricConfig = React.useMemo(() => {
    switch (selectedMetric) {
      case 'vo2_max':
        return {
          metricName: t('metrics:vo2_max.name'),
          unit: '',
          data: vo2MaxTrendData,
          accentColor: colors.area.energy,
        };
      case 'resting_hr':
        return {
          metricName: t('metrics:resting_hr.name'),
          unit: 'bpm',
          data: restingHRTrendData,
          accentColor: colors.surfaceRedBorder,
        };
      case 'hrv':
      default:
        return {
          metricName: t('metrics:hrv.name'),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.accentStrong,
        };
    }
  }, [colors.accentStrong, colors.area.energy, colors.surfaceRedBorder, hrvTrendData, restingHRTrendData, selectedMetric, t, vo2MaxTrendData]);

  const selectedMetricDefinition = metrics[selectedMetric];

  const openManualMetricSheet = React.useCallback(() => {
    const defaultUnit = selectedMetricDefinition?.units?.[0]?.unit ?? '';
    setMetricUnit(defaultUnit);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setIsRegisterSheetVisible(true);
  }, [selectedMetricDefinition]);

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
      metricId: selectedMetric,
      value: parsedValue,
      unit: metricUnit || selectedMetricDefinition?.canonicalUnit || '',
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
    });

    closeManualMetricSheet();
  }, [addMetricEntry, closeManualMetricSheet, metricNotes, metricUnit, metricValue, recordedAt, selectedMetric, selectedMetricDefinition?.canonicalUnit]);

  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return <Error error={error} />;
  }

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.energy }}>{t('energyOverview.title')}</ThemedText>
      <ThemedText type="subtitle">{t('energyOverview.description')}</ThemedText>
      <WearableStatus status={status} />

      {/* Body Battery - Main Energy Indicator */}
      <Card title={t('energyOverview.cellularEnergyReserves.title')}>
        <View style={styles.centerMetric}>
          <ThemedText type="title2">{energy.bodyBattery}</ThemedText>
          <ThemedText type="label">{t('energyOverview.cellularEnergyReserves.bodyBattery')}</ThemedText>
          <ThemedText type="caption">{energy.bodyBatteryChange} {t('energyOverview.cellularEnergyReserves.sinceWaking')}</ThemedText>
        </View>
        <View style={[styles.batteryBar, { backgroundColor: colors.overlayLight }]}>
          <View
            style={[
              styles.batteryFill,
              {
                width: `${energy.bodyBattery}%`,
                backgroundColor: colors.goldSoft,
              }
            ]}
          />
        </View>
        <ThemedText type="explainer" >
          {t('energyOverview.cellularEnergyReserves.explainer')}
        </ThemedText>
      </Card>

      {/* DNA & Mitochondria Genetics */}
      <GenesListCard areaId="energy" />

      {/* Energy Production Factors */}
      <Card title={t('energyOverview.energyProductionMetrics.title')}>
        <View style={globalStyles.row}>
          <VO2MaxMetric
            vo2max={energy.vo2max}
            status={energy.vo2maxStatus}
            showDivider
            onPress={() => setSelectedMetric('vo2_max')}
            isSelected={selectedMetric === 'vo2_max'}
          />
          <RestingHRMetric
            hrvData={hrvData}
            showDivider
            onPress={() => setSelectedMetric('resting_hr')}
            isSelected={selectedMetric === 'resting_hr'}
          />
          <HRVMetric
            hrvData={hrvData}
            sourceLabel={hrvData.length > 0 ? t('metrics:hrv.manualSource') : undefined}
            onPress={() => setSelectedMetric('hrv')}
            isSelected={selectedMetric === 'hrv'}
          />
        </View>
        <MetricTrendChart
          data={selectedMetricConfig.data}
          metricName={selectedMetricConfig.metricName}
          unit={selectedMetricConfig.unit || undefined}
          accentColor={selectedMetricConfig.accentColor}
          onAddManualValue={openManualMetricSheet}
        />
        <ThemedText type="explainer" style ={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
          {t('energyOverview.energyProductionMetrics.explainer')}
        </ThemedText>
      </Card>

      {/* Energy Drain vs Recharge */}
      <Card title={t('energyOverview.energyBalance.title')}>
        <View style={styles.balanceSection}>
          <View style={globalStyles.flex1}>
            <ThemedText type="title3">⚡{t('energyOverview.energyBalance.energyDrain')}</ThemedText>
            <View
              style={[
                globalStyles.card,
                {
                  borderColor: colors.surfaceRedBorder,
                  backgroundColor: colors.surfaceRed,
                },
              ]}
            >
              <ThemedText type="value">{energy.stressScore}</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.stressScore')}</ThemedText>
              <ThemedText type="caption">{energy.stressLevel}</ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8,  {
                  borderColor: colors.surfaceRedBorder,
                  backgroundColor: colors.surfaceRed,
                },]}>
              <ThemedText type="value">{energy.intensityMinutes}</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.intensityMinutes')}</ThemedText>
            </View>
          </View>

          <View style={globalStyles.flex1}>
            <ThemedText type="title3">🔋 {t('energyOverview.energyBalance.energyRecharge')}</ThemedText>
            <View
              style={[
                globalStyles.card,
                {
                  borderColor: colors.surfaceGreenBorder,
                  backgroundColor: colors.surfaceGreen,
                },
              ]}
            >
              <ThemedText type="value">{energy.sleepHours}h</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.sleepDuration')}</ThemedText>
              <ThemedText type="caption">{energy.sleepQuality}% {t('energyOverview.energyBalance.sleepQuality')}</ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8, {
                  borderColor: colors.surfaceGreenBorder,
                  backgroundColor: colors.surfaceGreen,
                },]}>
              <ThemedText type="value">{energy.deepSleepMinutes}min</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.deepSleep')}</ThemedText>
            </View>
          </View>
        </View>

        <ThemedText
          type="explainer"
          style={[
            globalStyles.explainer,
            {  borderTopColor: colors.borderLight }
          ]}
        >
          {t('energyOverview.energyBalance.explainer')}
        </ThemedText>
      </Card>

      {/* Mitochondrial Health Information */}
      <Card title={t('energyOverview.mitochondrialHealth.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔬 {t('energyOverview.mitochondrialHealth.powerhouses.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.powerhouses.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚡ {t('energyOverview.mitochondrialHealth.atpProduction.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.atpProduction.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 {t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛡️ {t('energyOverview.mitochondrialHealth.oxidativeStress.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.oxidativeStress.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ {t('energyOverview.mitochondrialHealth.nadDecline.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.nadDecline.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔄 {t('energyOverview.mitochondrialHealth.mitophagy.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.mitophagy.description')}
          </ThemedText>
        </View>
      </Card>

      <MicrobiomeListCard areaId="energy" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} />

      {/* Activity Tracking */}
      <Card title={t("energyOverview.todaysActivity.title")}>
        <View style={globalStyles.row}>
          <View style={[globalStyles.col, globalStyles.colWithDivider]}>
            <ThemedText type="label">{t("energyOverview.todaysActivity.activeMinutes")}</ThemedText>
            <ThemedText type="value">{energy.activityMinutes}</ThemedText>
          </View>

          <StepsMetric activityData={activityData} showDivider />

          <IntensityMinutesMetric activityData={activityData} />
        </View>

        <ThemedText
          type="explainer"
          style={[
            globalStyles.explainer,
            { borderTopColor: colors.borderLight }
          ]}
        >
          {t("energyOverview.todaysActivity.explainer")}
        </ThemedText>
      </Card>

      <Portal>
        <RegisterMetricBottomSheet
          bottomSheetRef={registerBottomSheetRef}
          isVisible={isRegisterSheetVisible}
          onClose={closeManualMetricSheet}
          onSave={saveManualMetric}
          metricName={t(`metrics:${selectedMetric}.name`)}
          metricValue={metricValue}
          setMetricValue={setMetricValue}
          metricUnit={metricUnit}
          setMetricUnit={setMetricUnit}
          metricNotes={metricNotes}
          setMetricNotes={setMetricNotes}
          recordedAt={recordedAt}
          setRecordedAt={setRecordedAt}
          colors={colors}
          units={selectedMetricDefinition?.units ?? []}
        />
      </Portal>
   </>
  );
}

const styles = StyleSheet.create({
  centerMetric: {
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryBar: {
    height: 16,
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
  },
  balanceSection: {
    flexDirection: 'row',
    gap: 12,
  },
});
