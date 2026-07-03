import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { EnergyProductionCharts } from '@/components/metrics/EnergyProductionCharts';
import { TodaysActivityCharts } from '@/components/metrics/TodaysActivityCharts';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { EnergySignal, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function EnergyScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
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
  const latestEnergy = energyData[0];

  const energy = {
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? null,
    bodyBatteryChange: null,
    stressScore: null,
    stressLevel:
      latestEnergy?.bodyBatteryLevel == null
        ? '—'
        : latestEnergy.bodyBatteryLevel > 70
          ? t('metrics.low')
          : t('metrics.moderate'),
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : null,
    sleepQuality: latestSleep?.efficiencyPct ?? null,
    deepSleepMinutes: latestSleep?.stages?.deepMinutes ?? null,
  };

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

            {/* Energy Production Factors */}
      <EnergyProductionCharts />

            {/* Activity Tracking */}
      <TodaysActivityCharts />

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

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🍬 {t('energyOverview.mitochondrialHealth.insulinResistance.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.insulinResistance.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚠️ {t('energyOverview.mitochondrialHealth.chronicStress.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.chronicStress.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔄 {t('energyOverview.mitochondrialHealth.metabolicFlexibility.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.metabolicFlexibility.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌾 {t('energyOverview.mitochondrialHealth.resistantStarch.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.resistantStarch.description')}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃 {t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.title')}</ThemedText>
          <ThemedText type="default">
            {t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.description')}
          </ThemedText>
        </View>
      </Card>

      {/* Body Battery - Main Energy Indicator */}
       {/* B<Card title={t('energyOverview.cellularEnergyReserves.title')}>
        <View style={styles.centerMetric}>
          <ThemedText type="title2">{energy.bodyBattery ?? '—'}</ThemedText>
          <ThemedText type="label">{t('energyOverview.cellularEnergyReserves.bodyBattery')}</ThemedText>
          <ThemedText type="caption">
            {energy.bodyBatteryChange == null ? '—' : `${energy.bodyBatteryChange} ${t('energyOverview.cellularEnergyReserves.sinceWaking')}`}
          </ThemedText>
        </View>
        <View style={[styles.batteryBar, { backgroundColor: colors.overlayLight }]}>
          <View
            style={[
              styles.batteryFill,
              {
                width: `${Math.max(0, energy.bodyBattery ?? 0)}%`,
                backgroundColor: colors.goldSoft,
              }
            ]}
          />
        </View>
        <ThemedText type="explainer" >
          {t('energyOverview.cellularEnergyReserves.explainer')}
        </ThemedText>
      </Card>*/}

      {/* DNA & Mitochondria Genetics */}
      <GenesListCard areaId="energy" />

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
              <ThemedText type="value">{energy.stressScore ?? '—'}</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.stressScore')}</ThemedText>
              <ThemedText type="caption">{energy.stressLevel}</ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8,  {
                  borderColor: colors.surfaceRedBorder,
                  backgroundColor: colors.surfaceRed,
                },]}>
              <ThemedText type="value">{energy.intensityMinutes ?? '—'}</ThemedText>
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
              <ThemedText type="value">{energy.sleepHours == null ? '—' : `${energy.sleepHours.toFixed(1)}h`}</ThemedText>
              <ThemedText type="label">{t('energyOverview.energyBalance.sleepDuration')}</ThemedText>
              <ThemedText type="caption">
                {energy.sleepQuality == null ? '—' : `${energy.sleepQuality}% ${t('energyOverview.energyBalance.sleepQuality')}`}
              </ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8, {
                  borderColor: colors.surfaceGreenBorder,
                  backgroundColor: colors.surfaceGreen,
                },]}>
              <ThemedText type="value">{energy.deepSleepMinutes == null ? '—' : `${energy.deepSleepMinutes}min`}</ThemedText>
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

      

      <MicrobiomeListCard areaId="energy" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} />
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
