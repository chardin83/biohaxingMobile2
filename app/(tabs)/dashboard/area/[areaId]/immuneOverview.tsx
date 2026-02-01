import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function ImmuneScreen({ mainGoalId }: { mainGoalId: string }) {
  const { colors } = useTheme();
  const { adapter, status } = useWearable();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, hrv, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getHRV(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setHrvData(hrv);
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
    return (
        <Loading />
    );
  }

  if (error) {
    return <Error error={error} />;
  }

  // Transform wearable data to immune metrics
  const latestEnergy = energyData[0];

  const immune = {
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 78) > 70 ? 'Low' : 'Moderate',
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 78,
  };

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>Immune Support</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        Key metrics that influence immune system function and resilience
      </ThemedText>

      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title="Your immune health indicators">
        <View style={globalStyles.row}>
          {/* Sleep */}
          <SleepMetric sleepData={sleepData} showDivider />

          {/* Stress/Body Battery */}
          <View
            style={[
              globalStyles.col,
              globalStyles.colWithDivider,
              { borderRightColor: colors.borderLight ?? colors.border },
            ]}
          >
            <ThemedText type="label">Stress level</ThemedText>
            <ThemedText type="title3">{immune.stressLevel}</ThemedText>
            <ThemedText type="caption">Battery: {immune.bodyBattery}%</ThemedText>
            {latestEnergy && <ThemedText type="caption">{latestEnergy.source}</ThemedText>}
          </View>

          {/* HRV */}
          <HRVMetric hrvData={hrvData} />
        </View>

        {/* Second row */}
        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          {/* Resting Heart Rate */}
          <RestingHRMetric hrvData={hrvData} showDivider />

          {/* Recovery Status */}
          <View style={globalStyles.col}>
            <ThemedText type="label">Recovery status</ThemedText>
            <ThemedText type="title3">{immune.bodyBattery > 70 ? 'Good' : 'Moderate'}</ThemedText>
            <ThemedText type="caption">{immune.bodyBattery > 70 ? 'Ready for activity' : 'Need recovery'}</ThemedText>
          </View>
        </View>
      </Card>

      {/* Information card */}
      <Card title="Why these metrics matter">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💤 Sleep</ThemedText>
          <ThemedText type="default">
            Adequate sleep is crucial for immune function. During sleep, the body produces cytokines that help fight
            infection and inflammation.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😌 Stress & Body Battery</ThemedText>
          <ThemedText type="default">
            Chronic stress suppresses immune function. Body Battery reflects your energy reserves and recovery status.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ HRV (Heart Rate Variability)</ThemedText>
          <ThemedText type="default">
            Higher HRV indicates better recovery and resilience. Low HRV may signal stress, fatigue, or illness.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 Resting Heart Rate</ThemedText>
          <ThemedText type="default">
            An elevated resting heart rate can be an early sign of illness, inflammation, or inadequate recovery.
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Immunförsvar Genetics */}
      <GenesListCard areaId="immune"/>

      {/* Tips card */}
      <TipsList areaId={mainGoalId} title="tips:immune.levels.optimization.title" />
    </>
  );
}
