import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
        setError(err instanceof Error ? err.message : 'Failed to load data');
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
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Digestion</Text>
        <Text style={styles.subtitle}>Factors influencing digestive health and gut function</Text>

        <WearableStatus status={status} />

        {/* Overview card - Indirect metrics */}
        <Card title="Gut health influencers">
          <View style={styles.row}>
            {/* Stress */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Stress level</Text>
              <Text style={styles.valueSmall}>{digestive.stressLevel}</Text>
              <Text style={styles.muted}>Battery: {digestive.bodyBattery}%</Text>
              {latestEnergy && <Text style={styles.source}>{latestEnergy.source}</Text>}
            </View>

            {/* Sleep */}
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep</Text>
              <Text style={styles.value}>{digestive.sleepHours.toFixed(1)}h</Text>
              <Text style={styles.accent}>{digestive.sleepQuality}</Text>
              {latestSleep && <Text style={styles.source}>{latestSleep.source}</Text>}
            </View>

            {/* Activity */}
            <View style={styles.col}>
              <Text style={styles.label}>Activity</Text>
              <Text style={styles.valueSmall}>{digestive.activityMinutes}m</Text>
              <Text style={styles.muted}>{digestive.stepCount.toLocaleString()} steps</Text>
              {latestActivity && <Text style={styles.source}>{latestActivity.source}</Text>}
            </View>
          </View>
        </Card>

        {/* Manual tracking card */}
        <GenesListCard areaId="digestiveHealth"  />

        {/* Tips card */}
        <TipsList areaId={mainGoalId} title="tips:digestive.levels.optimization.title" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: 'rgba(120,255,220,0.95)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colWithDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  value: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  valueSmall: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: 'rgba(120,255,220,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  source: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  actionButton: {
    color: 'rgba(120,255,220,0.95)',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(120,255,220,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,255,220,0.25)',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  tipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: 16,
  },
});
