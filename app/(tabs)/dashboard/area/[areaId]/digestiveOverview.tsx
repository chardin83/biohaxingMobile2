import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function DigestiveScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
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

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  // Transform wearable data to digestive metrics
  const latestSleep = sleepData[0];
  const latestActivity = activityData[0];
  const latestEnergy = energyData[0];

  const getSleepQuality = (): string => {
    if (!latestSleep || latestSleep.efficiencyPct === undefined) {
      return 'Good';
    }
    return latestSleep.efficiencyPct > 80 ? 'Good' : 'Fair';
  };

  const digestive = {
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 82) > 70 ? 'Low' : 'Moderate',
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 82,
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 7.8,
    sleepQuality: getSleepQuality(),
    activityMinutes: latestActivity?.activeMinutes ?? 145,
    stepCount: latestActivity?.steps ?? 9500,
    hydration: 2.1, // Would need manual logging
    lastMealLogged: '3h ago', // Would need manual logging
    symptomsToday: 0, // Would need manual logging
  };

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>{t('digestiveOverview.title')}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t('digestiveOverview.description')}
      </ThemedText>

      <WearableStatus status={status} />

      {/* Overview card - Indirect metrics */}
      <Card title={t('digestiveOverview.gutHealthInfluencers.title')}>
        <View style={globalStyles.row}>
          {/* Stress */}
          <View style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}>
            <ThemedText type="label">{t('digestiveOverview.gutHealthInfluencers.stressLevel')}</ThemedText>
            <ThemedText type="title3">{digestive.stressLevel}</ThemedText>
            <ThemedText type="caption">Battery: {digestive.bodyBattery}%</ThemedText>
            {latestEnergy && <ThemedText type="caption">{latestEnergy.source}</ThemedText>}
          </View>

          {/* Sleep */}
          <View style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}>
            <ThemedText type="label">{t('digestiveOverview.gutHealthInfluencers.sleep')}</ThemedText>
            <ThemedText type="title3">{digestive.sleepHours.toFixed(1)}h</ThemedText>
            <ThemedText type="caption">{digestive.sleepQuality}</ThemedText>
            {latestSleep && <ThemedText type="caption">{latestSleep.source}</ThemedText>}
          </View>

          {/* Activity */}
          <View style={globalStyles.col}>
            <ThemedText type="label">{t('digestiveOverview.gutHealthInfluencers.activity')}</ThemedText>
            <ThemedText type="title3">{digestive.activityMinutes}min</ThemedText>
            <ThemedText type="caption">{digestive.stepCount.toLocaleString()} {t('digestiveOverview.gutHealthInfluencers.steps')}</ThemedText>
            {latestActivity && <ThemedText type="caption">{latestActivity.source}</ThemedText>}
          </View>
        </View>
      </Card>

      {/* DNA & Digestive Genetics */}
      <GenesListCard areaId="digestiveHealth"  />

      {/* Tips card */}
      <TipsList areaId={mainGoalId} title="tips:digestive.levels.optimization.title" />
    </>
  );
}
