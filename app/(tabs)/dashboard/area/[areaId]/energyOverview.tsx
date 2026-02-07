import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function EnergyScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, hrv, activity, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getHRV(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setHrvData(hrv);
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
  
  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return <Error error={error} />;
  }

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
    bodyBatteryStatus: (latestEnergy?.bodyBatteryLevel ?? 72) > 60 ? 'Good' : 'Low',
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

  return (
    <>
      <ThemedText type="title" style={{ color: colors.gold }}>{t('energyOverview.title')}</ThemedText>
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
          <VO2MaxMetric vo2max={energy.vo2max} status={energy.vo2maxStatus} showDivider />
          <RestingHRMetric hrvData={hrvData} showDivider />
          <HRVMetric hrvData={hrvData} />
        </View>
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
